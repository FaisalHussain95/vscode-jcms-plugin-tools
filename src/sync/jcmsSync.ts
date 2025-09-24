import * as fs from 'fs-extra';
import * as path from 'path';

export interface SyncConfig {
    pluginDir: string;
    webappDir: string;
    exclusions: string[];
}

export interface PluginInfo {
    name: string;
    version: string;
    path: string;
}

export class JCMSSync {
    private config: SyncConfig | undefined;

    /**
     * Discovers plugin.xml files in the given directory
     */
    public async discoverPluginXmlFiles(rootDir: string): Promise<string[]> {
        const pluginXmlFiles: string[] = [];
        
        if (!fs.existsSync(rootDir)) {
            return pluginXmlFiles;
        }

        const searchForPluginXml = async (dir: string): Promise<void> => {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    await searchForPluginXml(fullPath);
                } else if (entry.isFile() && entry.name === 'plugin.xml') {
                    pluginXmlFiles.push(fullPath);
                }
            }
        };

        await searchForPluginXml(rootDir);
        return pluginXmlFiles;
    }

    /**
     * Loads sync configuration from sync.conf file
     */
    public async loadSyncConfig(configPath: string): Promise<SyncConfig | undefined> {
        try {
            if (!fs.existsSync(configPath)) {
                return undefined;
            }

            const configContent = await fs.readFile(configPath, 'utf-8');
            const config: Partial<SyncConfig> = {};
            
            const lines = configContent.split('\n');
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('#') || !trimmedLine) {
                    continue;
                }
                
                const [key, value] = trimmedLine.split('=');
                if (key && value) {
                    const cleanKey = key.trim();
                    const cleanValue = value.trim();
                    
                    if (cleanKey === 'plugin.dir') {
                        config.pluginDir = cleanValue;
                    } else if (cleanKey === 'webapp.dir') {
                        config.webappDir = cleanValue;
                    } else if (cleanKey === 'exclusions') {
                        config.exclusions = cleanValue.split(',').map((e: string) => e.trim());
                    }
                }
            }

            this.config = config as SyncConfig;
            return this.config;
        } catch (error) {
            console.error('Failed to load sync config:', error);
            return undefined;
        }
    }

    /**
     * Parses plugin.xml file to extract plugin information
     */
    public async parsePluginXml(pluginXmlPath: string): Promise<PluginInfo | undefined> {
        try {
            const content = await fs.readFile(pluginXmlPath, 'utf-8');
            
            // Simple XML parsing for plugin name and version
            const nameMatch = content.match(/<plugin[^>]*name\s*=\s*["']([^"']+)["']/);
            const versionMatch = content.match(/<plugin[^>]*version\s*=\s*["']([^"']+)["']/);
            
            if (nameMatch) {
                return {
                    name: nameMatch[1],
                    version: versionMatch ? versionMatch[1] : '1.0.0',
                    path: pluginXmlPath
                };
            }
            
            return undefined;
        } catch (error) {
            console.error('Failed to parse plugin.xml:', error);
            return undefined;
        }
    }

    /**
     * Compares two files to check if they are different
     */
    public async compareFiles(file1: string, file2: string): Promise<boolean> {
        try {
            if (!fs.existsSync(file1) || !fs.existsSync(file2)) {
                return true; // Different if one doesn't exist
            }

            const stat1 = await fs.stat(file1);
            const stat2 = await fs.stat(file2);
            
            // Quick check: different sizes means different content
            if (stat1.size !== stat2.size) {
                return true;
            }
            
            // Check modification times
            if (stat1.mtime.getTime() !== stat2.mtime.getTime()) {
                return true;
            }
            
            // For small files, compare content directly
            if (stat1.size < 1024 * 1024) { // 1MB threshold
                const content1 = await fs.readFile(file1);
                const content2 = await fs.readFile(file2);
                return !content1.equals(content2);
            }
            
            return false; // Assume same if size and mtime match for large files
        } catch (error) {
            console.error('Failed to compare files:', error);
            return true; // Assume different on error
        }
    }

    /**
     * Checks if a file should be excluded based on exclusion patterns
     */
    public isExcluded(filePath: string, exclusions: string[]): boolean {
        const fileName = path.basename(filePath);
        const relativePath = path.relative(process.cwd(), filePath);
        
        return exclusions.some(pattern => {
            // Simple pattern matching - supports wildcards
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
            return regex.test(fileName) || regex.test(relativePath);
        });
    }

    /**
     * Copies/syncs files from source to destination
     */
    public async syncFiles(sourceDir: string, destDir: string, exclusions: string[] = []): Promise<{ copied: number; skipped: number; errors: string[] }> {
        const result = { copied: 0, skipped: 0, errors: [] as string[] };
        
        try {
            if (!fs.existsSync(sourceDir)) {
                result.errors.push(`Source directory does not exist: ${sourceDir}`);
                return result;
            }

            await fs.ensureDir(destDir);

            const syncRecursive = async (srcDir: string, dstDir: string): Promise<void> => {
                const entries = await fs.readdir(srcDir, { withFileTypes: true });
                
                for (const entry of entries) {
                    const srcPath = path.join(srcDir, entry.name);
                    const dstPath = path.join(dstDir, entry.name);
                    
                    if (this.isExcluded(srcPath, exclusions)) {
                        result.skipped++;
                        continue;
                    }
                    
                    if (entry.isDirectory()) {
                        await fs.ensureDir(dstPath);
                        await syncRecursive(srcPath, dstPath);
                    } else if (entry.isFile()) {
                        try {
                            const needsSync = await this.compareFiles(srcPath, dstPath);
                            if (needsSync) {
                                await fs.copy(srcPath, dstPath, { overwrite: true });
                                result.copied++;
                            } else {
                                result.skipped++;
                            }
                        } catch (error) {
                            result.errors.push(`Failed to sync ${srcPath}: ${error}`);
                        }
                    }
                }
            };

            await syncRecursive(sourceDir, destDir);
        } catch (error) {
            result.errors.push(`Sync operation failed: ${error}`);
        }

        return result;
    }
}
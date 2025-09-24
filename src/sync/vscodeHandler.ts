import * as vscode from 'vscode';
import * as path from 'path';
import { JCMSSync } from './jcmsSync';

export class VSCodeSyncHandler {
    private sync: JCMSSync;

    constructor() {
        this.sync = new JCMSSync();
    }

    /**
     * Main method to sync plugin files with VS Code integration
     */
    public async syncPluginFiles(): Promise<void> {
        try {
            // Load config
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) {
                vscode.window.showErrorMessage('No workspace folder found');
                return;
            }

            const configPath = path.join(workspaceRoot, 'sync.conf');
            const config = await this.sync.loadSyncConfig(configPath);
            
            if (!config) {
                vscode.window.showErrorMessage('sync.conf not found or invalid');
                return;
            }

            // Discover plugins
            const pluginXmlFiles = await this.sync.discoverPluginXmlFiles(config.pluginDir);
            
            if (pluginXmlFiles.length === 0) {
                vscode.window.showWarningMessage('No plugin.xml files found');
                return;
            }

            let totalCopied = 0;
            let totalSkipped = 0;
            const allErrors: string[] = [];

            // Sync each plugin
            for (const pluginXmlPath of pluginXmlFiles) {
                const pluginDir = path.dirname(pluginXmlPath);
                const pluginInfo = await this.sync.parsePluginXml(pluginXmlPath);
                
                if (pluginInfo) {
                    const destDir = path.join(config.webappDir, 'plugins', pluginInfo.name);
                    const result = await this.sync.syncFiles(pluginDir, destDir, config.exclusions);
                    
                    totalCopied += result.copied;
                    totalSkipped += result.skipped;
                    allErrors.push(...result.errors);
                }
            }

            // Show results
            if (allErrors.length > 0) {
                vscode.window.showErrorMessage(`Sync completed with errors. Copied: ${totalCopied}, Skipped: ${totalSkipped}, Errors: ${allErrors.length}`);
                console.error('Sync errors:', allErrors);
            } else {
                vscode.window.showInformationMessage(`Sync completed successfully. Copied: ${totalCopied}, Skipped: ${totalSkipped}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Sync failed: ${error}`);
        }
    }
}
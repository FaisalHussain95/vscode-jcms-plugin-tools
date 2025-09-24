"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const jcmsSync_1 = require("../src/sync/jcmsSync");
describe('JCMS Plugin Sync', () => {
    let jcmsSync;
    let testDataDir;
    let pluginDir;
    let webappDir;
    let configFile;
    beforeEach(async () => {
        jcmsSync = new jcmsSync_1.JCMSSync();
        // Create temporary test directories
        testDataDir = path.join(__dirname, '..', 'test-data');
        pluginDir = path.join(testDataDir, 'plugins');
        webappDir = path.join(testDataDir, 'webapp');
        configFile = path.join(testDataDir, 'sync.conf');
        // Ensure clean test environment
        await fs.remove(testDataDir);
        await fs.ensureDir(pluginDir);
        await fs.ensureDir(webappDir);
    });
    afterEach(async () => {
        // Clean up test directories
        if (fs.existsSync(testDataDir)) {
            await fs.remove(testDataDir);
        }
    });
    describe('Plugin XML Discovery', () => {
        it('should discover plugin.xml files in plugin directory', async () => {
            // Create test plugin structure
            const plugin1Dir = path.join(pluginDir, 'plugin1');
            const plugin2Dir = path.join(pluginDir, 'plugin2', 'subdir');
            await fs.ensureDir(plugin1Dir);
            await fs.ensureDir(plugin2Dir);
            // Create plugin.xml files
            await fs.writeFile(path.join(plugin1Dir, 'plugin.xml'), '<plugin name="TestPlugin1"/>');
            await fs.writeFile(path.join(plugin2Dir, 'plugin.xml'), '<plugin name="TestPlugin2"/>');
            // Create non-plugin files to ensure they're ignored
            await fs.writeFile(path.join(plugin1Dir, 'other.xml'), '<other/>');
            const pluginXmlFiles = await jcmsSync.discoverPluginXmlFiles(pluginDir);
            (0, chai_1.expect)(pluginXmlFiles).to.have.lengthOf(2);
            (0, chai_1.expect)(pluginXmlFiles).to.include(path.join(plugin1Dir, 'plugin.xml'));
            (0, chai_1.expect)(pluginXmlFiles).to.include(path.join(plugin2Dir, 'plugin.xml'));
        });
        it('should return empty array for non-existent directory', async () => {
            const pluginXmlFiles = await jcmsSync.discoverPluginXmlFiles('/non/existent/dir');
            (0, chai_1.expect)(pluginXmlFiles).to.be.an('array').that.is.empty;
        });
        it('should handle directory with no plugin.xml files', async () => {
            const emptyPluginDir = path.join(pluginDir, 'empty');
            await fs.ensureDir(emptyPluginDir);
            await fs.writeFile(path.join(emptyPluginDir, 'readme.txt'), 'No plugins here');
            const pluginXmlFiles = await jcmsSync.discoverPluginXmlFiles(pluginDir);
            (0, chai_1.expect)(pluginXmlFiles).to.be.an('array').that.is.empty;
        });
    });
    describe('Sync Configuration', () => {
        it('should load valid sync.conf file', async () => {
            const configContent = [
                '# JCMS Plugin Sync Configuration',
                'plugin.dir=/path/to/plugins',
                'webapp.dir=/path/to/webapp',
                'exclusions=*.tmp,*.log,node_modules'
            ].join('\n');
            await fs.writeFile(configFile, configContent);
            const config = await jcmsSync.loadSyncConfig(configFile);
            (0, chai_1.expect)(config).to.not.be.undefined;
            (0, chai_1.expect)(config.pluginDir).to.equal('/path/to/plugins');
            (0, chai_1.expect)(config.webappDir).to.equal('/path/to/webapp');
            (0, chai_1.expect)(config.exclusions).to.deep.equal(['*.tmp', '*.log', 'node_modules']);
        });
        it('should handle missing sync.conf file', async () => {
            const config = await jcmsSync.loadSyncConfig('/non/existent/sync.conf');
            (0, chai_1.expect)(config).to.be.undefined;
        });
        it('should ignore comments and empty lines in sync.conf', async () => {
            const configContent = [
                '# This is a comment',
                '',
                'plugin.dir=/plugins',
                '# Another comment',
                '',
                'webapp.dir=/webapp',
                'exclusions=*.bak'
            ].join('\n');
            await fs.writeFile(configFile, configContent);
            const config = await jcmsSync.loadSyncConfig(configFile);
            (0, chai_1.expect)(config).to.not.be.undefined;
            (0, chai_1.expect)(config.pluginDir).to.equal('/plugins');
            (0, chai_1.expect)(config.webappDir).to.equal('/webapp');
            (0, chai_1.expect)(config.exclusions).to.deep.equal(['*.bak']);
        });
        it('should handle malformed config lines gracefully', async () => {
            const configContent = [
                'plugin.dir=/plugins',
                'invalid_line_without_equals',
                'webapp.dir=/webapp',
                '=invalid_equals_at_start',
                'exclusions=*.tmp'
            ].join('\n');
            await fs.writeFile(configFile, configContent);
            const config = await jcmsSync.loadSyncConfig(configFile);
            (0, chai_1.expect)(config).to.not.be.undefined;
            (0, chai_1.expect)(config.pluginDir).to.equal('/plugins');
            (0, chai_1.expect)(config.webappDir).to.equal('/webapp');
            (0, chai_1.expect)(config.exclusions).to.deep.equal(['*.tmp']);
        });
    });
    describe('Plugin XML Parsing', () => {
        it('should parse valid plugin.xml file', async () => {
            const pluginXmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<plugin name="TestPlugin" version="1.2.3">
    <description>Test plugin for JCMS</description>
</plugin>`;
            const pluginXmlPath = path.join(pluginDir, 'plugin.xml');
            await fs.writeFile(pluginXmlPath, pluginXmlContent);
            const pluginInfo = await jcmsSync.parsePluginXml(pluginXmlPath);
            (0, chai_1.expect)(pluginInfo).to.not.be.undefined;
            (0, chai_1.expect)(pluginInfo.name).to.equal('TestPlugin');
            (0, chai_1.expect)(pluginInfo.version).to.equal('1.2.3');
            (0, chai_1.expect)(pluginInfo.path).to.equal(pluginXmlPath);
        });
        it('should handle plugin.xml without version', async () => {
            const pluginXmlContent = `<plugin name="NoVersionPlugin">
    <description>Plugin without version</description>
</plugin>`;
            const pluginXmlPath = path.join(pluginDir, 'plugin.xml');
            await fs.writeFile(pluginXmlPath, pluginXmlContent);
            const pluginInfo = await jcmsSync.parsePluginXml(pluginXmlPath);
            (0, chai_1.expect)(pluginInfo).to.not.be.undefined;
            (0, chai_1.expect)(pluginInfo.name).to.equal('NoVersionPlugin');
            (0, chai_1.expect)(pluginInfo.version).to.equal('1.0.0'); // Default version
        });
        it('should handle malformed plugin.xml', async () => {
            const pluginXmlContent = `<invalid>
    <not-a-plugin/>
</invalid>`;
            const pluginXmlPath = path.join(pluginDir, 'plugin.xml');
            await fs.writeFile(pluginXmlPath, pluginXmlContent);
            const pluginInfo = await jcmsSync.parsePluginXml(pluginXmlPath);
            (0, chai_1.expect)(pluginInfo).to.be.undefined;
        });
        it('should handle non-existent plugin.xml file', async () => {
            const pluginInfo = await jcmsSync.parsePluginXml('/non/existent/plugin.xml');
            (0, chai_1.expect)(pluginInfo).to.be.undefined;
        });
    });
    describe('File Comparison', () => {
        let file1;
        let file2;
        beforeEach(() => {
            file1 = path.join(testDataDir, 'file1.txt');
            file2 = path.join(testDataDir, 'file2.txt');
        });
        it('should detect identical files as same', async () => {
            const content = 'This is identical content';
            await fs.writeFile(file1, content);
            await fs.writeFile(file2, content);
            // Ensure same modification time
            const stat = await fs.stat(file1);
            await fs.utimes(file2, stat.atime, stat.mtime);
            const isDifferent = await jcmsSync.compareFiles(file1, file2);
            (0, chai_1.expect)(isDifferent).to.be.false;
        });
        it('should detect different file sizes', async () => {
            await fs.writeFile(file1, 'Short content');
            await fs.writeFile(file2, 'This is much longer content');
            const isDifferent = await jcmsSync.compareFiles(file1, file2);
            (0, chai_1.expect)(isDifferent).to.be.true;
        });
        it('should detect different content with same size', async () => {
            await fs.writeFile(file1, 'AAAA');
            await fs.writeFile(file2, 'BBBB');
            const isDifferent = await jcmsSync.compareFiles(file1, file2);
            (0, chai_1.expect)(isDifferent).to.be.true;
        });
        it('should handle missing files', async () => {
            await fs.writeFile(file1, 'Content');
            // file2 doesn't exist
            const isDifferent = await jcmsSync.compareFiles(file1, file2);
            (0, chai_1.expect)(isDifferent).to.be.true;
        });
        it('should detect different modification times', async () => {
            const content = 'Same content';
            await fs.writeFile(file1, content);
            await fs.writeFile(file2, content);
            // Give different modification times
            await fs.utimes(file1, new Date(), new Date(Date.now() - 10000));
            await fs.utimes(file2, new Date(), new Date());
            const isDifferent = await jcmsSync.compareFiles(file1, file2);
            (0, chai_1.expect)(isDifferent).to.be.true;
        });
    });
    describe('Exclusion Patterns', () => {
        it('should match simple filename exclusions', () => {
            const exclusions = ['*.tmp', '*.log', 'node_modules'];
            (0, chai_1.expect)(jcmsSync.isExcluded('/path/to/temp.tmp', exclusions)).to.be.true;
            (0, chai_1.expect)(jcmsSync.isExcluded('/path/to/debug.log', exclusions)).to.be.true;
            (0, chai_1.expect)(jcmsSync.isExcluded('/path/to/node_modules', exclusions)).to.be.true;
            (0, chai_1.expect)(jcmsSync.isExcluded('/path/to/source.js', exclusions)).to.be.false;
        });
        it('should match wildcard patterns', () => {
            const exclusions = ['test_*', '*.backup'];
            (0, chai_1.expect)(jcmsSync.isExcluded('/path/test_file.js', exclusions)).to.be.true;
            (0, chai_1.expect)(jcmsSync.isExcluded('/path/data.backup', exclusions)).to.be.true;
            (0, chai_1.expect)(jcmsSync.isExcluded('/path/prod_file.js', exclusions)).to.be.false;
        });
        it('should handle question mark wildcards', () => {
            const exclusions = ['temp?.txt'];
            (0, chai_1.expect)(jcmsSync.isExcluded('/path/temp1.txt', exclusions)).to.be.true;
            (0, chai_1.expect)(jcmsSync.isExcluded('/path/tempA.txt', exclusions)).to.be.true;
            (0, chai_1.expect)(jcmsSync.isExcluded('/path/temp12.txt', exclusions)).to.be.false;
        });
        it('should handle empty exclusion list', () => {
            (0, chai_1.expect)(jcmsSync.isExcluded('/any/file.txt', [])).to.be.false;
        });
    });
    describe('File Synchronization', () => {
        let sourceDir;
        let destDir;
        beforeEach(async () => {
            sourceDir = path.join(testDataDir, 'source');
            destDir = path.join(testDataDir, 'dest');
            await fs.ensureDir(sourceDir);
        });
        it('should copy new files from source to destination', async () => {
            // Create source files
            await fs.writeFile(path.join(sourceDir, 'file1.txt'), 'Content 1');
            await fs.writeFile(path.join(sourceDir, 'file2.js'), 'console.log("test");');
            const result = await jcmsSync.syncFiles(sourceDir, destDir);
            (0, chai_1.expect)(result.copied).to.equal(2);
            (0, chai_1.expect)(result.skipped).to.equal(0);
            (0, chai_1.expect)(result.errors).to.be.empty;
            // Verify files were copied
            (0, chai_1.expect)(await fs.pathExists(path.join(destDir, 'file1.txt'))).to.be.true;
            (0, chai_1.expect)(await fs.pathExists(path.join(destDir, 'file2.js'))).to.be.true;
            const copiedContent = await fs.readFile(path.join(destDir, 'file1.txt'), 'utf-8');
            (0, chai_1.expect)(copiedContent).to.equal('Content 1');
        });
        it('should skip identical files', async () => {
            // Create identical files in both source and dest
            await fs.writeFile(path.join(sourceDir, 'identical.txt'), 'Same content');
            await fs.ensureDir(destDir);
            await fs.writeFile(path.join(destDir, 'identical.txt'), 'Same content');
            // Ensure same modification time
            const stat = await fs.stat(path.join(sourceDir, 'identical.txt'));
            await fs.utimes(path.join(destDir, 'identical.txt'), stat.atime, stat.mtime);
            const result = await jcmsSync.syncFiles(sourceDir, destDir);
            (0, chai_1.expect)(result.copied).to.equal(0);
            (0, chai_1.expect)(result.skipped).to.equal(1);
            (0, chai_1.expect)(result.errors).to.be.empty;
        });
        it('should overwrite different files', async () => {
            // Create different files
            await fs.writeFile(path.join(sourceDir, 'updated.txt'), 'New content');
            await fs.ensureDir(destDir);
            await fs.writeFile(path.join(destDir, 'updated.txt'), 'Old content');
            const result = await jcmsSync.syncFiles(sourceDir, destDir);
            (0, chai_1.expect)(result.copied).to.equal(1);
            (0, chai_1.expect)(result.skipped).to.equal(0);
            (0, chai_1.expect)(result.errors).to.be.empty;
            const updatedContent = await fs.readFile(path.join(destDir, 'updated.txt'), 'utf-8');
            (0, chai_1.expect)(updatedContent).to.equal('New content');
        });
        it('should handle subdirectories recursively', async () => {
            // Create nested source structure
            const subDir = path.join(sourceDir, 'subdir');
            await fs.ensureDir(subDir);
            await fs.writeFile(path.join(sourceDir, 'root.txt'), 'Root file');
            await fs.writeFile(path.join(subDir, 'nested.txt'), 'Nested file');
            const result = await jcmsSync.syncFiles(sourceDir, destDir);
            (0, chai_1.expect)(result.copied).to.equal(2);
            (0, chai_1.expect)(result.skipped).to.equal(0);
            // Verify directory structure was preserved
            (0, chai_1.expect)(await fs.pathExists(path.join(destDir, 'root.txt'))).to.be.true;
            (0, chai_1.expect)(await fs.pathExists(path.join(destDir, 'subdir', 'nested.txt'))).to.be.true;
        });
        it('should respect exclusion patterns', async () => {
            // Create files with some that should be excluded
            await fs.writeFile(path.join(sourceDir, 'include.js'), 'Include this');
            await fs.writeFile(path.join(sourceDir, 'exclude.tmp'), 'Exclude this');
            await fs.writeFile(path.join(sourceDir, 'debug.log'), 'Log file');
            const exclusions = ['*.tmp', '*.log'];
            const result = await jcmsSync.syncFiles(sourceDir, destDir, exclusions);
            (0, chai_1.expect)(result.copied).to.equal(1);
            (0, chai_1.expect)(result.skipped).to.equal(2);
            (0, chai_1.expect)(result.errors).to.be.empty;
            // Verify only non-excluded file was copied
            (0, chai_1.expect)(await fs.pathExists(path.join(destDir, 'include.js'))).to.be.true;
            (0, chai_1.expect)(await fs.pathExists(path.join(destDir, 'exclude.tmp'))).to.be.false;
            (0, chai_1.expect)(await fs.pathExists(path.join(destDir, 'debug.log'))).to.be.false;
        });
        it('should handle non-existent source directory', async () => {
            const result = await jcmsSync.syncFiles('/non/existent/source', destDir);
            (0, chai_1.expect)(result.copied).to.equal(0);
            (0, chai_1.expect)(result.skipped).to.equal(0);
            (0, chai_1.expect)(result.errors).to.have.lengthOf(1);
            (0, chai_1.expect)(result.errors[0]).to.include('Source directory does not exist');
        });
        it('should create destination directory if it does not exist', async () => {
            await fs.writeFile(path.join(sourceDir, 'test.txt'), 'Test content');
            const result = await jcmsSync.syncFiles(sourceDir, destDir);
            (0, chai_1.expect)(result.copied).to.equal(1);
            (0, chai_1.expect)(await fs.pathExists(destDir)).to.be.true;
            (0, chai_1.expect)(await fs.pathExists(path.join(destDir, 'test.txt'))).to.be.true;
        });
    });
    describe('Integration Tests', () => {
        it('should perform end-to-end plugin sync workflow', async () => {
            // Setup complete test scenario
            const plugin1Dir = path.join(pluginDir, 'TestPlugin1');
            const plugin2Dir = path.join(pluginDir, 'TestPlugin2');
            await fs.ensureDir(plugin1Dir);
            await fs.ensureDir(plugin2Dir);
            // Create plugin.xml files
            await fs.writeFile(path.join(plugin1Dir, 'plugin.xml'), '<plugin name="TestPlugin1" version="1.0.0"/>');
            await fs.writeFile(path.join(plugin2Dir, 'plugin.xml'), '<plugin name="TestPlugin2" version="2.0.0"/>');
            // Create plugin source files
            await fs.writeFile(path.join(plugin1Dir, 'main.js'), 'plugin1 code');
            await fs.writeFile(path.join(plugin1Dir, 'temp.tmp'), 'temporary file');
            await fs.writeFile(path.join(plugin2Dir, 'main.js'), 'plugin2 code');
            // Create sync configuration
            const configContent = [
                `plugin.dir=${pluginDir}`,
                `webapp.dir=${webappDir}`,
                'exclusions=*.tmp,*.log'
            ].join('\n');
            await fs.writeFile(configFile, configContent);
            // Load config and perform sync operations
            const config = await jcmsSync.loadSyncConfig(configFile);
            (0, chai_1.expect)(config).to.not.be.undefined;
            const pluginXmlFiles = await jcmsSync.discoverPluginXmlFiles(pluginDir);
            (0, chai_1.expect)(pluginXmlFiles).to.have.lengthOf(2);
            // Sync each plugin
            for (const pluginXmlPath of pluginXmlFiles) {
                const pluginInfo = await jcmsSync.parsePluginXml(pluginXmlPath);
                (0, chai_1.expect)(pluginInfo).to.not.be.undefined;
                const sourceDir = path.dirname(pluginXmlPath);
                const destDir = path.join(webappDir, 'plugins', pluginInfo.name);
                const result = await jcmsSync.syncFiles(sourceDir, destDir, config.exclusions);
                (0, chai_1.expect)(result.errors).to.be.empty;
            }
            // Verify final state
            (0, chai_1.expect)(await fs.pathExists(path.join(webappDir, 'plugins', 'TestPlugin1', 'main.js'))).to.be.true;
            (0, chai_1.expect)(await fs.pathExists(path.join(webappDir, 'plugins', 'TestPlugin1', 'plugin.xml'))).to.be.true;
            (0, chai_1.expect)(await fs.pathExists(path.join(webappDir, 'plugins', 'TestPlugin1', 'temp.tmp'))).to.be.false; // Excluded
            (0, chai_1.expect)(await fs.pathExists(path.join(webappDir, 'plugins', 'TestPlugin2', 'main.js'))).to.be.true;
            (0, chai_1.expect)(await fs.pathExists(path.join(webappDir, 'plugins', 'TestPlugin2', 'plugin.xml'))).to.be.true;
        });
    });
});
//# sourceMappingURL=sync.test.js.map
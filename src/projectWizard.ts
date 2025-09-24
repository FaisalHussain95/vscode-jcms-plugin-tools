import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Interface for plugin project configuration
 */
export interface PluginProjectConfig {
    name: string;
    displayName: string;
    description: string;
    version: string;
    location: string;
}

/**
 * JCMS Plugin Project Creation Wizard
 * Provides an interactive wizard to create new JCMS plugin projects
 */
export class ProjectWizard {
    
    /**
     * Main entry point for the project creation wizard
     */
    public async createProject(): Promise<void> {
        try {
            const config = await this.collectProjectInfo();
            if (!config) {
                return; // User cancelled
            }

            await this.createProjectStructure(config);
            await this.openProject(config);
            
            vscode.window.showInformationMessage(
                `Successfully created JCMS plugin project: ${config.name}`,
                'Open Project'
            ).then(selection => {
                if (selection === 'Open Project') {
                    vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(config.location));
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create project: ${error}`);
        }
    }

    /**
     * Collects project information from user through input dialogs
     */
    private async collectProjectInfo(): Promise<PluginProjectConfig | undefined> {
        // Get project name
        const name = await vscode.window.showInputBox({
            title: 'JCMS Plugin Project - Name',
            prompt: 'Enter the plugin name (used for plugin.xml name attribute)',
            placeHolder: 'MyPlugin',
            validateInput: (value) => {
                if (!value) return 'Plugin name is required';
                if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(value)) {
                    return 'Plugin name must start with a letter and contain only letters, numbers, and underscores';
                }
                return null;
            }
        });

        if (!name) return undefined;

        // Get display name
        const displayName = await vscode.window.showInputBox({
            title: 'JCMS Plugin Project - Display Name',
            prompt: 'Enter the human-readable display name',
            value: name,
            placeHolder: 'My Plugin'
        });

        if (displayName === undefined) return undefined;

        // Get description
        const description = await vscode.window.showInputBox({
            title: 'JCMS Plugin Project - Description',
            prompt: 'Enter a brief description of the plugin',
            placeHolder: 'A custom JCMS plugin'
        });

        if (description === undefined) return undefined;

        // Get version
        const version = await vscode.window.showInputBox({
            title: 'JCMS Plugin Project - Version',
            prompt: 'Enter the initial version',
            value: '1.0.0',
            placeHolder: '1.0.0',
            validateInput: (value) => {
                if (!value) return 'Version is required';
                if (!/^\d+\.\d+\.\d+$/.test(value)) {
                    return 'Version must be in semantic versioning format (e.g., 1.0.0)';
                }
                return null;
            }
        });

        if (!version) return undefined;

        // Get project location
        const folderOptions: vscode.OpenDialogOptions = {
            canSelectMany: false,
            canSelectFiles: false,
            canSelectFolders: true,
            openLabel: 'Select Project Location',
            title: 'Select where to create the plugin project'
        };

        const folderUri = await vscode.window.showOpenDialog(folderOptions);
        if (!folderUri || folderUri.length === 0) return undefined;

        const projectLocation = path.join(folderUri[0].fsPath, name);

        // Check if directory already exists
        if (await fs.pathExists(projectLocation)) {
            const overwrite = await vscode.window.showWarningMessage(
                `Directory "${name}" already exists. Overwrite?`,
                'Yes', 'No'
            );
            if (overwrite !== 'Yes') return undefined;
        }

        return {
            name,
            displayName: displayName || name,
            description: description || '',
            version,
            location: projectLocation
        };
    }

    /**
     * Creates the project directory structure and files
     */
    private async createProjectStructure(config: PluginProjectConfig): Promise<void> {
        const { location } = config;

        // Ensure project directory exists
        await fs.ensureDir(location);

        // Create standard JCMS plugin directory structure
        await fs.ensureDir(path.join(location, 'types'));
        await fs.ensureDir(path.join(location, 'types', 'generated'));
        await fs.ensureDir(path.join(location, 'jsp'));
        await fs.ensureDir(path.join(location, 'jsp', 'admin'));
        await fs.ensureDir(path.join(location, 'jsp', 'portal'));
        await fs.ensureDir(path.join(location, 'plugins'));
        await fs.ensureDir(path.join(location, 'WEB-INF'));
        await fs.ensureDir(path.join(location, 'WEB-INF', 'classes'));

        // Create plugin.xml
        await this.createPluginXml(config);

        // Create .jcmsPluginNature file for project detection
        await fs.writeFile(path.join(location, '.jcmsPluginNature'), '');

        // Create basic README
        await this.createReadme(config);
    }

    /**
     * Creates the plugin.xml file with basic structure
     */
    private async createPluginXml(config: PluginProjectConfig): Promise<void> {
        const pluginXmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<plugin name="${config.name}" version="${config.version}">
    <label xml:lang="en">${config.displayName}</label>
    <description xml:lang="en">${config.description}</description>
    
    <!-- Plugin dependencies -->
    <dependencies>
        <!-- Add plugin dependencies here -->
    </dependencies>
    
    <!-- Type definitions -->
    <types>
        <!-- Add custom types here -->
    </types>
    
    <!-- Custom workflows -->
    <workflows>
        <!-- Add custom workflows here -->
    </workflows>
    
    <!-- Web application resources -->
    <webapp-files>
        <!-- Add webapp files here -->
    </webapp-files>
    
</plugin>`;

        await fs.writeFile(path.join(config.location, 'plugin.xml'), pluginXmlContent);
    }

    /**
     * Creates a basic README file
     */
    private async createReadme(config: PluginProjectConfig): Promise<void> {
        const readmeContent = `# ${config.displayName}

${config.description}

## Plugin Information
- **Name**: ${config.name}
- **Version**: ${config.version}
- **Created**: ${new Date().toISOString().split('T')[0]}

## Directory Structure
- \`types/\` - Custom JCMS types
- \`jsp/\` - JSP templates and components
- \`plugins/\` - Plugin-specific resources  
- \`WEB-INF/\` - Web application configuration
- \`plugin.xml\` - Plugin configuration and metadata

## Development
This plugin was created using the JCMS Plugin Tools for VS Code.

For more information about JCMS plugin development, refer to the JCMS documentation.
`;

        await fs.writeFile(path.join(config.location, 'README.md'), readmeContent);
    }

    /**
     * Opens the newly created project
     */
    private async openProject(config: PluginProjectConfig): Promise<void> {
        // This is handled in the main createProject method through user choice
    }
}
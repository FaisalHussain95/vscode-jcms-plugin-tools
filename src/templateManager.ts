import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Available template types for JCMS plugin components
 */
export enum TemplateType {
    TYPE = 'type',
    CONTROLLER = 'controller', 
    WORKFLOW = 'workflow'
}

/**
 * Template configuration interface
 */
export interface TemplateConfig {
    name: string;
    type: TemplateType;
    targetPath: string;
}

/**
 * JCMS Template Manager
 * Provides functionality to create starter templates for JCMS plugin components
 */
export class TemplateManager {

    /**
     * Main entry point for template creation
     */
    public async createTemplate(): Promise<void> {
        try {
            // First, ensure we're in a JCMS plugin project
            const workspaceFolder = await this.getWorkspaceFolder();
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('No workspace folder found. Open a JCMS plugin project first.');
                return;
            }

            if (!await this.isJcmsPluginProject(workspaceFolder)) {
                vscode.window.showErrorMessage('Current workspace is not a JCMS plugin project.');
                return;
            }

            const templateConfig = await this.selectTemplate(workspaceFolder);
            if (!templateConfig) {
                return; // User cancelled
            }

            await this.generateTemplate(templateConfig);
            await this.openGeneratedTemplate(templateConfig);

            vscode.window.showInformationMessage(
                `Successfully created ${templateConfig.type} template: ${templateConfig.name}`,
                'Open File'
            ).then(selection => {
                if (selection === 'Open File') {
                    vscode.workspace.openTextDocument(templateConfig.targetPath)
                        .then(doc => vscode.window.showTextDocument(doc));
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create template: ${error}`);
        }
    }

    /**
     * Gets the current workspace folder
     */
    private async getWorkspaceFolder(): Promise<string | undefined> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return undefined;
        }

        // For now, use the first workspace folder
        // In future, could prompt user to select if multiple folders
        return workspaceFolders[0].uri.fsPath;
    }

    /**
     * Checks if the current workspace is a JCMS plugin project
     */
    private async isJcmsPluginProject(workspaceFolder: string): Promise<boolean> {
        const jcmsPluginNaturePath = path.join(workspaceFolder, '.jcmsPluginNature');
        const pluginXmlPath = path.join(workspaceFolder, 'plugin.xml');
        
        return await fs.pathExists(jcmsPluginNaturePath) || await fs.pathExists(pluginXmlPath);
    }

    /**
     * Prompts user to select template type and configure it
     */
    private async selectTemplate(workspaceFolder: string): Promise<TemplateConfig | undefined> {
        // Select template type
        const templateTypeItems: vscode.QuickPickItem[] = [
            { 
                label: 'JCMS Type', 
                description: 'Custom content type definition',
                detail: 'Creates a new JCMS type with fields and basic structure'
            },
            { 
                label: 'Controller', 
                description: 'Java controller for handling requests',
                detail: 'Creates a Java controller class for custom functionality'
            },
            { 
                label: 'Workflow', 
                description: 'Custom workflow definition',
                detail: 'Creates a workflow XML configuration'
            }
        ];

        const selectedType = await vscode.window.showQuickPick(templateTypeItems, {
            title: 'Select Template Type',
            placeHolder: 'Choose the type of template to create'
        });

        if (!selectedType) return undefined;

        // Map selection to template type
        let templateType: TemplateType;
        switch (selectedType.label) {
            case 'JCMS Type':
                templateType = TemplateType.TYPE;
                break;
            case 'Controller':
                templateType = TemplateType.CONTROLLER;
                break;
            case 'Workflow':
                templateType = TemplateType.WORKFLOW;
                break;
            default:
                return undefined;
        }

        // Get template name
        const templateName = await vscode.window.showInputBox({
            title: `${selectedType.label} Template - Name`,
            prompt: `Enter the name for the ${templateType}`,
            placeHolder: templateType === TemplateType.TYPE ? 'MyType' : 
                        templateType === TemplateType.CONTROLLER ? 'MyController' :
                        'MyWorkflow',
            validateInput: (value) => {
                if (!value) return `${templateType} name is required`;
                if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(value)) {
                    return `${templateType} name must start with a letter and contain only letters, numbers, and underscores`;
                }
                return null;
            }
        });

        if (!templateName) return undefined;

        // Determine target path based on template type
        let targetPath: string;
        let fileName: string;

        switch (templateType) {
            case TemplateType.TYPE:
                fileName = `${templateName}.xml`;
                targetPath = path.join(workspaceFolder, 'types', fileName);
                break;
            case TemplateType.CONTROLLER:
                fileName = `${templateName}.java`;
                targetPath = path.join(workspaceFolder, 'WEB-INF', 'classes', fileName);
                break;
            case TemplateType.WORKFLOW:
                fileName = `${templateName}.xml`;
                targetPath = path.join(workspaceFolder, 'workflows', fileName);
                // Ensure workflows directory exists
                await fs.ensureDir(path.join(workspaceFolder, 'workflows'));
                break;
        }

        // Check if file already exists
        if (await fs.pathExists(targetPath)) {
            const overwrite = await vscode.window.showWarningMessage(
                `File "${fileName}" already exists. Overwrite?`,
                'Yes', 'No'
            );
            if (overwrite !== 'Yes') return undefined;
        }

        return {
            name: templateName,
            type: templateType,
            targetPath
        };
    }

    /**
     * Generates the template file based on configuration
     */
    private async generateTemplate(config: TemplateConfig): Promise<void> {
        let templateContent: string;

        switch (config.type) {
            case TemplateType.TYPE:
                templateContent = this.generateTypeTemplate(config.name);
                break;
            case TemplateType.CONTROLLER:
                templateContent = this.generateControllerTemplate(config.name);
                break;
            case TemplateType.WORKFLOW:
                templateContent = this.generateWorkflowTemplate(config.name);
                break;
        }

        // Ensure target directory exists
        await fs.ensureDir(path.dirname(config.targetPath));
        
        // Write template file
        await fs.writeFile(config.targetPath, templateContent);
    }

    /**
     * Generates JCMS type template content
     */
    private generateTypeTemplate(typeName: string): string {
        return `<?xml version="1.0" encoding="UTF-8"?>
<types>
    <type name="${typeName}" super-type="Content">
        <label xml:lang="en">${typeName}</label>
        <description xml:lang="en">Custom ${typeName} content type</description>
        
        <!-- Define fields for this type -->
        <fields>
            <!-- Example text field -->
            <field name="title" type="String">
                <label xml:lang="en">Title</label>
                <description xml:lang="en">The title of the ${typeName}</description>
                <html-input>
                    <size>80</size>
                </html-input>
            </field>
            
            <!-- Example text area field -->
            <field name="description" type="String">
                <label xml:lang="en">Description</label>
                <description xml:lang="en">Description of the ${typeName}</description>
                <html-input>
                    <rows>5</rows>
                    <cols>80</cols>
                </html-input>
            </field>
            
            <!-- Add more fields as needed -->
        </fields>
        
        <!-- Define tabs for content editing -->
        <tabs>
            <tab name="content">
                <label xml:lang="en">Content</label>
                <fields>title description</fields>
            </tab>
        </tabs>
        
    </type>
</types>`;
    }

    /**
     * Generates Java controller template content
     */
    private generateControllerTemplate(controllerName: string): string {
        return `package generated;

import com.jalios.jcms.*;
import com.jalios.jcms.handler.*;
import com.jalios.util.*;

import java.io.IOException;
import javax.servlet.ServletException;

/**
 * ${controllerName} - Custom JCMS Controller
 * 
 * Handles custom functionality for the JCMS plugin.
 * Created: ${new Date().toISOString().split('T')[0]}
 */
public class ${controllerName} extends JcmsJspContext {
    
    /**
     * Process the controller logic
     */
    public void processAction() throws IOException, ServletException {
        // Get current logged member
        Member loggedMember = getLoggedMember();
        
        if (loggedMember == null) {
            // Handle unauthorized access
            sendError(SC_UNAUTHORIZED, "Access denied");
            return;
        }
        
        // Example: Get parameter from request
        String action = getStringParameter("action", "");
        
        switch (action) {
            case "example":
                handleExampleAction();
                break;
            default:
                handleDefaultAction();
        }
    }
    
    /**
     * Handle example action
     */
    private void handleExampleAction() throws IOException, ServletException {
        // Example implementation
        setInfoMsg("Example action executed successfully");
        
        // Redirect or forward as needed
        sendRedirect("path/to/success/page.jsp");
    }
    
    /**
     * Handle default action
     */
    private void handleDefaultAction() throws IOException, ServletException {
        // Default behavior
        setInfoMsg("Default action executed");
    }
    
    /**
     * Validate user permissions
     */
    private boolean checkUserPermissions() {
        Member member = getLoggedMember();
        if (member == null) {
            return false;
        }
        
        // Add permission checks as needed
        return member.canWorkOn(channel.getDefaultWorkspace());
    }
}`;
    }

    /**
     * Generates workflow template content
     */
    private generateWorkflowTemplate(workflowName: string): string {
        return `<?xml version="1.0" encoding="UTF-8"?>
<workflows>
    <workflow name="${workflowName}">
        <label xml:lang="en">${workflowName} Workflow</label>
        <description xml:lang="en">Custom workflow for ${workflowName} processing</description>
        
        <!-- Define workflow states -->
        <states>
            <state name="draft">
                <label xml:lang="en">Draft</label>
                <description xml:lang="en">Content is in draft state</description>
            </state>
            
            <state name="review">
                <label xml:lang="en">Review</label>
                <description xml:lang="en">Content is under review</description>
            </state>
            
            <state name="published">
                <label xml:lang="en">Published</label>
                <description xml:lang="en">Content is published</description>
            </state>
        </states>
        
        <!-- Define workflow transitions -->
        <transitions>
            <transition name="submit-for-review" from="draft" to="review">
                <label xml:lang="en">Submit for Review</label>
                <description xml:lang="en">Submit content for review</description>
                <rights>
                    <right name="review-content" />
                </rights>
            </transition>
            
            <transition name="publish" from="review" to="published">
                <label xml:lang="en">Publish</label>
                <description xml:lang="en">Publish the content</description>
                <rights>
                    <right name="publish-content" />
                </rights>
            </transition>
            
            <transition name="reject" from="review" to="draft">
                <label xml:lang="en">Reject</label>
                <description xml:lang="en">Reject and send back to draft</description>
                <rights>
                    <right name="review-content" />
                </rights>
            </transition>
        </transitions>
        
        <!-- Define initial state -->
        <initial-state>draft</initial-state>
        
    </workflow>
</workflows>`;
    }

    /**
     * Opens the generated template file
     */
    private async openGeneratedTemplate(config: TemplateConfig): Promise<void> {
        // This is handled in the main createTemplate method through user choice
    }
}
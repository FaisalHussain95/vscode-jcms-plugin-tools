import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { VSCodeSyncHandler } from './sync/vscodeHandler';

export function activate(context: vscode.ExtensionContext) {
    console.log('JCMS Plugin Tools extension is now active!');

    const syncHandler = new VSCodeSyncHandler();

    const listProjectsDisposable = vscode.commands.registerCommand('jcmsPluginTools.listProjects', () => {
        listJCMSPluginProjects();
    });

    const syncPluginDisposable = vscode.commands.registerCommand('jcms.syncPlugin', () => {
        syncHandler.syncPluginFiles();
    });

    context.subscriptions.push(listProjectsDisposable, syncPluginDisposable);
}

export function deactivate() {}

async function listJCMSPluginProjects() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    
    if (!workspaceFolders) {
        vscode.window.showInformationMessage('No workspace folders found.');
        return;
    }

    const jcmsProjects: string[] = [];

    for (const workspaceFolder of workspaceFolders) {
        const projectsInFolder = await findJCMSProjectsInFolder(workspaceFolder.uri.fsPath);
        jcmsProjects.push(...projectsInFolder);
    }

    if (jcmsProjects.length === 0) {
        vscode.window.showInformationMessage('No JCMS Plugin projects found in workspace.');
    } else {
        const projectList = jcmsProjects.join('\n• ');
        const message = `Found ${jcmsProjects.length} JCMS Plugin project(s):\n\n• ${projectList}`;
        vscode.window.showInformationMessage(message, { modal: true });
    }
}

async function findJCMSProjectsInFolder(folderPath: string): Promise<string[]> {
    const projects: string[] = [];
    
    try {
        const items = await fs.promises.readdir(folderPath, { withFileTypes: true });
        
        for (const item of items) {
            const itemPath = path.join(folderPath, item.name);
            
            if (item.isDirectory()) {
                // Check if this directory contains a .jcmsPluginNature file
                const jcmsPluginNaturePath = path.join(itemPath, '.jcmsPluginNature');
                
                try {
                    await fs.promises.access(jcmsPluginNaturePath, fs.constants.F_OK);
                    // If we reach here, the .jcmsPluginNature file exists
                    const relativePath = path.relative(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', itemPath);
                    projects.push(relativePath || item.name);
                } catch {
                    // .jcmsPluginNature file doesn't exist, continue searching recursively
                    const subProjects = await findJCMSProjectsInFolder(itemPath);
                    projects.push(...subProjects);
                }
            }
        }
    } catch (error) {
        console.error(`Error reading folder ${folderPath}:`, error);
    }
    
    return projects;
}

import * as vscode from 'vscode';
import { VSCodeSyncHandler } from './sync/vscodeHandler';

export function activate(context: vscode.ExtensionContext) {
    const syncHandler = new VSCodeSyncHandler();
    const disposable = vscode.commands.registerCommand('jcms.syncPlugin', () => {
        syncHandler.syncPluginFiles();
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
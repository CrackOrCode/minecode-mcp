const vscode = require('vscode');
const path = require('path');
const cp = require('child_process');

let serverProcess = null;
let outputChannel = null;

function getWorkspaceRoot() {
    const ws = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
    return ws ? ws.uri.fsPath : null;
}

function getPythonCommand(repoRoot, config) {
    // prefer venv\Scripts\python.exe on Windows
    if (config.get('minecode.server.useVenv', true)) {
        const venvPy = path.join(repoRoot, 'venv', 'Scripts', 'python.exe');
        if (require('fs').existsSync(venvPy)) { return { cmd: venvPy, args: config.get('minecode.server.args', ['-m', 'minecode.server']) }; }
    }
    // fallback to configured command
    return { cmd: config.get('minecode.server.command', 'py'), args: config.get('minecode.server.args', ['-m', 'minecode.server']) };
}

function startServer() {
    if (serverProcess) { vscode.window.showInformationMessage('MineCode MCP server is already running'); return; }

    const repoRoot = getWorkspaceRoot();
    if (!repoRoot) { vscode.window.showErrorMessage('Open a workspace folder first'); return; }

    const config = vscode.workspace.getConfiguration();
    const py = getPythonCommand(repoRoot, config);
    const options = { cwd: repoRoot, env: process.env };

    outputChannel = outputChannel || vscode.window.createOutputChannel('MineCode MCP');
    outputChannel.show(true);
    outputChannel.appendLine(`Starting MineCode MCP server: ${py.cmd} ${py.args.join(' ')}`);

    try {
        serverProcess = cp.spawn(py.cmd, py.args, options);
    } catch (e) {
        vscode.window.showErrorMessage('Failed to spawn MCP server: ' + e.message);
        outputChannel.appendLine('Spawn error: ' + e.message);
        serverProcess = null;
        return;
    }

    serverProcess.stdout.on('data', (data) => outputChannel.append(data.toString()));
    serverProcess.stderr.on('data', (data) => outputChannel.append(data.toString()));
    serverProcess.on('exit', (code, signal) => {
        outputChannel.appendLine(`MineCode MCP server exited with code ${code} signal ${signal}`);
        serverProcess = null;
    });

    vscode.window.showInformationMessage('MineCode MCP server started');
}

function stopServer() {
    if (!serverProcess) { vscode.window.showInformationMessage('MineCode MCP server is not running'); return; }
    try {
        serverProcess.kill();
        vscode.window.showInformationMessage('Stopping MineCode MCP server');
    } catch (e) {
        vscode.window.showErrorMessage('Failed to stop server: ' + e.message);
    }
}

function activate(context) {
    // Release commands (existing)
    function runRelease(publish = false, bump = false) {
        const repoRoot = getWorkspaceRoot();
        if (!repoRoot) { vscode.window.showErrorMessage('Open a workspace folder first'); return; }
        const script = path.join(repoRoot, 'scripts', 'release.ps1');
        const terminal = vscode.window.createTerminal({ name: 'MineCode Release' });
        const bumpArg = bump ? ' -Bump' : '';
        const publishArg = publish ? ' -Publish' : '';
        const cmd = `powershell -ExecutionPolicy Bypass -NoProfile -File "${script}"${bumpArg}${publishArg}`;
        terminal.show();
        terminal.sendText(cmd);
    }

    const startCmd = vscode.commands.registerCommand('minecode.startServer', () => startServer());
    const stopCmd = vscode.commands.registerCommand('minecode.stopServer', () => stopServer());

    const releaseCmd = vscode.commands.registerCommand('minecode.release', async () => {
        const choice = await vscode.window.showQuickPick([
            'Bump + Publish',
            'Build + Publish (no bump)',
            'Build only'
        ], { placeHolder: 'Choose release action' });
        if (!choice) { return; }
        if (choice === 'Bump + Publish') { runRelease(true, true); }
        else if (choice === 'Build + Publish (no bump)') { runRelease(true, false); }
        else if (choice === 'Build only') { runRelease(false, false); }
    });

    const releasePublishCmd = vscode.commands.registerCommand('minecode.releasePublish', () => { runRelease(true, true); });

    context.subscriptions.push(startCmd, stopCmd, releaseCmd, releasePublishCmd);
}

function deactivate() {
    if (serverProcess) {
        serverProcess.kill();
        serverProcess = null;
    }
}

module.exports = {
    activate,
    deactivate
};

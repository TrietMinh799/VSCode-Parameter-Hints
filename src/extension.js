// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { runner } = require('./language/general/runner');
const { runner: javascriptRunner } = require('./language/javascript/runner');
const { time } = require('console');

const hintDecorationType = vscode.window.createTextEditorDecorationType({});
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */

function activate(context) {
	let activeEditor = vscode.window.activeTextEditor;
	let currentRunner = null;

	const messageHeader = 'Parameter Hints: ';
	const hideMessageAfterMs = 3000;
	const isEnabled = () => vscode.workspace.getConfiguration("parameterHints").get(
		"enabled",
	);
	let timeout = null;
	let trigger = (editor, force) => {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(() => {
			currentRunner && !currentRunner.state.done && currentRunner.reject();

			if (editor && (isEnabled() || force) && editor.document.languageId === 'javascript') {
				currentRunner = runner(javascriptRunner, editor, hints => {
					if (hints !== false && isEnabled()) {
						editor.setDecorations(hintDecorationType, hints);
					}
				})
			}
		}, 100);
	}
	let clear = (editor) => {
		if (timeout) {
			clearTimeout(timeout);
		}
		currentRunner && !currentRunner.state.done && currentRunner.reject();
		editor && editor.setDecorations(hintDecorationType, [new vscode.Range(0, 0, 0, 0)]);

	}
	trigger(activeEditor);
	vscode.commands.registerCommand('parameterHints.toggle', () => {
		const currentState = vscode.workspace.getConfiguration('parameterHints').get('enabled');
		let message = `${messageHeader} Hints ${currentState ? 'disabled' : 'enabled'}`;

		vscode.workspace.getConfiguration('parameterHints').update('enabled', !currentState, true);
		if (currentState) {
			clear(activeEditor)
		} else {
			trigger(activeEditor, true)
		}
		vscode.window.setStatusBarMessage(message, hideMessageAfterMs);
	})
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		trigger(activeEditor);
	}));


	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
		if (event.contentChanges.length) {
			trigger(activeEditor);
		}
	}))
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}

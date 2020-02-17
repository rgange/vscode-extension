// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as request from 'request';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-extension" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	//let disposable = vscode.commands.registerCommand('extension.magnoliaIntellisense', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		//vscode.window.showInformationMessage('Magnolia Intellisense!');
	//});

	//context.subscriptions.push(disposable);

	// create a new word counter
	let problemCounter = new ProblemCounter();
	let controller = new ProblemCounterController(problemCounter);
  
	// Add to a list of disposables which are disposed when this extension is deactivated.
	context.subscriptions.push(controller);
	context.subscriptions.push(problemCounter);
  }
  
  class ProblemCounter {
	private _statusBarItem: vscode.StatusBarItem = vscode.window.createStatusBarItem(
	  vscode.StatusBarAlignment.Left
	);
  
	public updateWordCount() {
	  // Get the current text editor
	  let editor = vscode.window.activeTextEditor;
	  if (!editor) {
		this._statusBarItem.hide();
		return;
	  }
  
	  let doc = editor.document;
  
	  // Only update status if a Markdown file
	  if (doc.languageId === "yaml") {
		this._getProblemCount(doc).then(problemCount => {
		  this._statusBarItem.text =
			problemCount !== 1 ? `$(alert) ${problemCount} Problems` : "$(alert) 1 Problem";
		  
		  
		  if (problemCount > 0) {
			  this._getProblemTitles().then(titles => {
				  this._statusBarItem.tooltip = titles;
			  });
		  } else {
			  this._statusBarItem.tooltip = undefined;
		  }
		  
		  this._statusBarItem.show();
		});
	  } else {
		this._statusBarItem.hide();
	  }
	}
  
	public _getProblemTitles(): Promise<string> {
	  return new Promise(resolve => {
		  request(
			"http://localhost:8080/pro-5.7-webapp/.rest/registry/v1/problems?mgnlUserId=superuser&mgnlUserPSWD=superuser",
			(error, response, body) => {
			  resolve(JSON.parse(body).map((l: String) => '· ' + l).join('\n'));
			}
		  );
		});
	}
  
	public _getProblemCount(doc: vscode.TextDocument): Promise<number> {
	  return new Promise(resolve => {
		request(
		  "http://localhost:8080/pro-5.7-webapp/.rest/registry/v1/problems?mgnlUserId=superuser&mgnlUserPSWD=superuser",
		  (error, response, body) => {
			resolve(JSON.parse(body).length);
		  }
		);
	  });
	}
  
	dispose() {
	  this._statusBarItem.dispose();
	}
  }
  
  class ProblemCounterController {
	private _problemCounter: ProblemCounter;
	private _disposable: vscode.Disposable;
  
	constructor(problemCounter: ProblemCounter) {
	  this._problemCounter = problemCounter;
  
	  // subscribe to selection change and editor activation events
	  let subscriptions: vscode.Disposable[] = [];
	  vscode.window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
	  vscode.window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);
	  setInterval(() => {
		  this._problemCounter.updateWordCount();
	  }, 5000);
  
	  // update the counter for the current file
	  this._problemCounter.updateWordCount();
  
	  // create a combined disposable from both event subscriptions
	  this._disposable = vscode.Disposable.from(...subscriptions);
	}
  
	dispose() {
	  this._disposable.dispose();
	}
  
	private _onEvent() {
	  this._problemCounter.updateWordCount();
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}

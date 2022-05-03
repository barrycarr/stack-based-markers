// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

type MarkerInfo = {
  document: vscode.TextDocument;
  position: vscode.Position;
  offset: Number;
};

type MarkerStack = MarkerInfo[];

const MARKER_STACK = "marker_stack";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "stack-based-markers" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let pushMarkerDisposable = vscode.commands.registerTextEditorCommand(
    "stack-based-markers.pushMarker",
    (
      textEditor: vscode.TextEditor,
      edit: vscode.TextEditorEdit,
      args: any[],
      thisArg?: any
    ) => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      const pos = textEditor.selection.active;

      const newMarker: MarkerInfo = {
        document: textEditor.document,
        position: pos,
        offset: textEditor.document.offsetAt(pos),
      };
      const markerStack = [
        newMarker,
        ...context.globalState.get<MarkerStack>(MARKER_STACK, []),
      ];
      context.globalState.update(MARKER_STACK, markerStack);

      console.debug(markerStack);
      vscode.window.showInformationMessage("Push Marker");
    }
  );

  let popMarkerDisposable = vscode.commands.registerTextEditorCommand(
    "stack-based-markers.popMarker",
    async (
      textEditor: vscode.TextEditor,
      edit: vscode.TextEditorEdit,
      args: any[],
      thisArg?: any
    ) => {
      const markerStack = context.globalState.get<MarkerStack>(
        MARKER_STACK,
        []
      );
      if (markerStack === []) {
        return;
      }

      const [top, ...rest] = markerStack;
      context.globalState.update(MARKER_STACK, rest);

      if (!top.document.isClosed) {
        await vscode.window.showTextDocument(top.document);
      }

      vscode.window.showInformationMessage("Pop Marker");
    }
  );

  context.subscriptions.push(pushMarkerDisposable);
  context.subscriptions.push(popMarkerDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

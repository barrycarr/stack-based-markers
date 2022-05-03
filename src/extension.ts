// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

type MarkerInfo = {
  editor: vscode.TextEditor;
  document: vscode.TextDocument;
  position: vscode.Position;
  offset: Number;
};

type MarkerStack = MarkerInfo[];

const MARKER_STACK = "marker_stack";
const blue = "#157EFB";
const green = "#2FCE7C";
const purple = "#C679E0";
const red = "#F44336";

const _getBookmark = (color: string) => {
  return vscode.Uri.parse(
    "data:image/svg+xml," +
      encodeURIComponent(
        `<svg version="1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" enable-background="new 0 0 48 48"><path fill="${color}" d="M37,43l-13-6l-13,6V9c0-2.2,1.8-4,4-4h18c2.2,0,4,1.8,4,4V43z"/></svg>`
      )
  );
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "stack-based-markers" is now active!'
  );

  let activeEditor = vscode.window.activeTextEditor;

  const bookmarkDecoratorType = vscode.window.createTextEditorDecorationType({
    gutterIconPath: _getBookmark(blue),
  });

  const updateDecorations = () => {
    if (!activeEditor) {
      return;
    }

    const decorations: vscode.DecorationOptions[] = [];
    const document = activeEditor.document;
    const markers = context.globalState.get<MarkerStack>(MARKER_STACK, []);
    const filteredMarkers = markers.filter(
      (m) => m.document.fileName === document.fileName
    );
    filteredMarkers.map((m) => {
      decorations.push({ range: new vscode.Range(m.position, m.position) });
    });
    activeEditor.setDecorations(bookmarkDecoratorType, decorations);
  };

  const triggerUpdateDecorations = (throttle: boolean) => {
    if (throttle) {
      setTimeout(updateDecorations, 500);
    } else {
      updateDecorations();
    }
  };
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
        editor: textEditor,
        document: textEditor.document,
        position: pos,
        offset: textEditor.document.offsetAt(pos),
      };
      const markerStack = [
        newMarker,
        ...context.globalState.get<MarkerStack>(MARKER_STACK, []),
      ];
      context.globalState.update(MARKER_STACK, markerStack);
      triggerUpdateDecorations(false);
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
        textEditor.selection = new vscode.Selection(top.position, top.position);
        triggerUpdateDecorations(false);
      }
    }
  );

  vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      activeEditor = editor;
      if (editor) {
        triggerUpdateDecorations(false);
      }
    },
    null,
    context.subscriptions
  );

  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (activeEditor && event.document === activeEditor.document) {
        triggerUpdateDecorations(true);
      }
    },
    null,
    context.subscriptions
  );

  context.subscriptions.push(pushMarkerDisposable);
  context.subscriptions.push(popMarkerDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

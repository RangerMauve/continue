import { streamDiffLines } from "core/commands/slash/verticalEdit";
import { getMarkdownLanguageTagForFile } from "core/util";
import * as vscode from "vscode";
import { llmFromTitle } from "../../loadConfig";
import { VerticalPerLineDiffHandler } from "./handler";

class VerticalPerLineDiffManager {
  private filepathToEditorMap: Map<string, VerticalPerLineDiffHandler> =
    new Map();

  createVerticalPerLineDiffHandler(
    filepath: string,
    startLine: number,
    endLine: number,
    input: string
  ) {
    if (this.filepathToEditorMap.has(filepath)) {
      this.filepathToEditorMap.get(filepath)?.clear(false);
      this.filepathToEditorMap.delete(filepath);
    }
    const editor = vscode.window.activeTextEditor; // TODO
    if (editor && editor.document.uri.fsPath === filepath) {
      const handler = new VerticalPerLineDiffHandler(
        startLine,
        endLine,
        editor,
        input
      );
      this.filepathToEditorMap.set(filepath, handler);
      return handler;
    } else {
      return undefined;
    }
  }

  getOrCreateVerticalPerLineDiffHandler(
    filepath: string,
    startLine: number,
    endLine: number
  ) {
    if (this.filepathToEditorMap.has(filepath)) {
      return this.filepathToEditorMap.get(filepath)!;
    } else {
      const editor = vscode.window.activeTextEditor; // TODO
      if (editor && editor.document.uri.fsPath === filepath) {
        const handler = new VerticalPerLineDiffHandler(
          startLine,
          endLine,
          editor
        );
        this.filepathToEditorMap.set(filepath, handler);
        return handler;
      } else {
        return undefined;
      }
    }
  }

  getHandlerForFile(filepath: string) {
    return this.filepathToEditorMap.get(filepath);
  }

  clearForFilepath(filepath: string | undefined, accept: boolean) {
    if (!filepath) {
      const activeEditor = vscode.window.activeTextEditor;
      if (!activeEditor) {
        return;
      }
      filepath = activeEditor.document.uri.fsPath;
    }

    const handler = this.filepathToEditorMap.get(filepath);
    if (handler) {
      handler.clear(accept);
      this.filepathToEditorMap.delete(filepath);
    }
  }
}

export const verticalPerLineDiffManager = new VerticalPerLineDiffManager();

export async function streamEdit(input: string) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const filepath = editor.document.uri.fsPath;
  const startLine = editor.selection.start.line;
  const endLine = editor.selection.end.line;

  const existingHandler =
    verticalPerLineDiffManager.getHandlerForFile(filepath);
  existingHandler?.clear(false);
  await new Promise((resolve) => {
    setTimeout(resolve, 200);
  });
  const diffHandler =
    verticalPerLineDiffManager.createVerticalPerLineDiffHandler(
      filepath,
      existingHandler?.range.start.line ?? startLine,
      existingHandler?.range.end.line ?? endLine,
      input
    );
  if (!diffHandler) {
    return;
  }

  const selectedRange =
    existingHandler?.range ??
    new vscode.Range(
      editor.selection.start.with(undefined, 0),
      editor.selection.end.with(undefined, Number.MAX_SAFE_INTEGER)
    );
  const rangeContent = editor.document.getText(selectedRange);
  const llm = await llmFromTitle();

  // Unselect the range
  editor.selection = new vscode.Selection(
    editor.selection.active,
    editor.selection.active
  );

  vscode.commands.executeCommand("setContext", "continue.streamingDiff", true);

  if (existingHandler?.input) {
    if (existingHandler.input.startsWith("Original request: ")) {
      existingHandler.input = existingHandler.input.substring(
        "Original request: ".length
      );
    }
    input = `Original request: ${existingHandler.input}\nUpdated request: ${input}`;
  }

  await diffHandler.run(
    streamDiffLines(
      rangeContent,
      llm,
      input,
      getMarkdownLanguageTagForFile(filepath)
    )
  );
}

export interface VerticalDiffCodeLens {
  start: number;
  numRed: number;
  numGreen: number;
}

export const editorToVerticalDiffCodeLens: Map<string, VerticalDiffCodeLens[]> =
  new Map();

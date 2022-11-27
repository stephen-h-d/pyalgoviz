/* @refresh reload */
import { minimalSetup, basicSetup, EditorView } from "codemirror";
import { python } from '@codemirror/lang-python';
import { RangeSetBuilder, Extension, StateField, Transaction, StateEffect, EditorState } from '@codemirror/state';
import { Decoration, ViewPlugin, DecorationSet, ViewUpdate } from '@codemirror/view';

const normalTheme = EditorView.baseTheme({
  '&light .cm-highlight': { backgroundColor: '#d4fafa' },
  '&dark .cm-highlight': { backgroundColor: '#1a2727' },
});

const errorTheme = EditorView.baseTheme({
  '&light .cm-errorHighlight': { backgroundColor: '#ed1717' },
  '&dark .cm-errorHighlight': { backgroundColor: '#ed1717' },
});

const errorLine = Decoration.line({ attributes: { class: 'cm-errorHighlight' } });

export class Editor {
  editorView: EditorView;

  lineToHighlightNormalEffect = StateEffect.define<number>();
  lineToHighlightErrorEffect = StateEffect.define<number>();
  lineToHighlightNormalState = StateField.define<number>({
    create: this.createLineToHighlight.bind(this),
    update: this.updateLineToHighlight.bind(this),
  });
  lineToHighlightErrorState = StateField.define<number>({
    create: this.createLineToHighlight.bind(this),
    update: this.updateLineToHighlight.bind(this),
  });

  createLineToHighlight (state: EditorState): number {
    return -1;
  }

  updateLineToHighlight (val: number, tr: Transaction): number {
    for (const effect of tr.effects) {
      if (effect.is(this.lineToHighlightErrorEffect)) {
        return effect.value
      }
    }
    return val;
  }

  highlightLine: any; // ViewPlugin<?>

  stripeDeco (view: EditorView) {
    const mystep = view.state.field(this.lineToHighlightErrorState);
    const builder = new RangeSetBuilder<Decoration>()
    for (const { from, to } of view.visibleRanges) {
      for (let pos = from; pos <= to;) {
        const line = view.state.doc.lineAt(pos)
        if (line.number == mystep) {
          // NOTE: the from is not the line number but is the raw range index
          builder.add(line.from, line.from, errorLine);
        }
        pos = line.to + 1;
      }
    }
    return builder.finish();
  }

  public constructor(parentDiv: HTMLDivElement, initialContents: string){
    const boundStripeDeco = this.stripeDeco.bind(this);

    this.highlightLine = ViewPlugin.fromClass(class {
      decorations: DecorationSet;

      constructor (view: EditorView) {
        this.decorations = boundStripeDeco(view);
      }

      update (update: ViewUpdate) {
        this.decorations = boundStripeDeco(update.view);
      }
    }, {
      decorations: v => v.decorations
    });

    this.editorView = new EditorView({
      doc: initialContents,
      extensions: [basicSetup, python(), [errorTheme, this.highlightLine], this.lineToHighlightErrorState.extension],
      parent: parentDiv,
    });
  }

  setErrorLine(line: number) {
    this.editorView.dispatch({ effects: [this.lineToHighlightErrorEffect.of(line)] });
  }
}

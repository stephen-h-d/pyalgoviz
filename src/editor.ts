import { EditorView } from "codemirror";
import { RangeSetBuilder, StateField, Transaction, StateEffect, EditorState, Extension } from '@codemirror/state';
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

const normalLine = Decoration.line({ attributes: { class: 'cm-highlight' } });

class LinesToHighlight {
  public constructor(public normalLine: number, public errorLine: number) {

  }
}

export class Editor {
  editorView: EditorView;

  linesToHighlightEffect = StateEffect.define<LinesToHighlight>();
  linesToHighlightState = StateField.define<LinesToHighlight>({
    create: this.createLinesToHighlight.bind(this),
    update: this.updateLinesToHighlight.bind(this),
  });

  createLinesToHighlight (_state: EditorState): LinesToHighlight {
    return new LinesToHighlight(-1, -1);
  }

  updateLinesToHighlight (val: LinesToHighlight, tr: Transaction): LinesToHighlight {
    for (const effect of tr.effects) {
      if (effect.is(this.linesToHighlightEffect)) {
        return effect.value
      }
    }
    return val;
  }

  highlightLinePlugin: Extension; // ViewPlugin<?>

  stripeDeco (view: EditorView) {
    const toHighlight = view.state.field(this.linesToHighlightState);
    const builder = new RangeSetBuilder<Decoration>()
    for (const { from, to } of view.visibleRanges) {
      for (let pos = from; pos <= to;) {
        const line = view.state.doc.lineAt(pos)
        if (line.number == toHighlight.errorLine) {
          // NOTE: the from is not the line number but is the raw range index
          builder.add(line.from, line.from, errorLine);
        } else if (line.number === toHighlight.normalLine) {
          builder.add(line.from, line.from, normalLine);
        }
        pos = line.to + 1;
      }
    }
    return builder.finish();
  }

  private linesToHighlight: LinesToHighlight = new LinesToHighlight(-1, -1);

  public constructor(parentDiv: HTMLDivElement, initialContents: string, extensions: Array<Extension>){
    const boundStripeDeco = this.stripeDeco.bind(this);

    this.highlightLinePlugin = ViewPlugin.fromClass(class {
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

    extensions = extensions.concat([normalTheme, errorTheme, this.highlightLinePlugin, this.linesToHighlightState.extension]);
    this.editorView = new EditorView({
      doc: initialContents,
      extensions: extensions,
      parent: parentDiv,
    });
  }

  setErrorLine(errorLine: number) {
    this.linesToHighlight = new LinesToHighlight(this.linesToHighlight.normalLine, errorLine);
    this.editorView.dispatch({ effects: [this.linesToHighlightEffect.of(this.linesToHighlight)] });
  }

  setHighlightLine(normalLine: number) {
    this.linesToHighlight = new LinesToHighlight(normalLine, this.linesToHighlight.errorLine);
    this.editorView.dispatch({ effects: [this.linesToHighlightEffect.of(this.linesToHighlight)] });
  }

  public currentValue(): string {
    return this.editorView.state.doc.toString();
  }

  public setText(text: string) {
    // TODO figure out a way to reduce the duplication here... perhaps
    // some functions that operate on `EditorView`s.
    const transaction = this.editorView.state.update({
        changes: {
          from: 0,
          to: this.editorView.state.doc.length,
          insert: text,
        },
      });
      const update = this.editorView.state.update(transaction);
      this.editorView.update([update]);
  }
}

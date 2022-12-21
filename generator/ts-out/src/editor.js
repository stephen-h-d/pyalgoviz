import { EditorView } from "codemirror";
import { RangeSetBuilder, StateField, StateEffect, EditorState, Compartment } from '@codemirror/state';
import { Decoration, ViewPlugin } from '@codemirror/view';
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
    normalLine;
    errorLine;
    constructor(normalLine, errorLine) {
        this.normalLine = normalLine;
        this.errorLine = errorLine;
    }
}
export class Editor {
    editorView;
    docChangedSubscribers;
    readOnly;
    linesToHighlightEffect = StateEffect.define();
    linesToHighlightState = StateField.define({
        create: this.createLinesToHighlight.bind(this),
        update: this.updateLinesToHighlight.bind(this),
    });
    createLinesToHighlight(_state) {
        return new LinesToHighlight(-1, -1);
    }
    updateLinesToHighlight(val, tr) {
        for (const effect of tr.effects) {
            if (effect.is(this.linesToHighlightEffect)) {
                return effect.value;
            }
        }
        return val;
    }
    highlightLinePlugin; // ViewPlugin<?>
    stripeDeco(view) {
        const toHighlight = view.state.field(this.linesToHighlightState);
        const builder = new RangeSetBuilder();
        for (const { from, to } of view.visibleRanges) {
            for (let pos = from; pos <= to;) {
                const line = view.state.doc.lineAt(pos);
                if (line.number == toHighlight.errorLine) {
                    // NOTE: the from is not the line number but is the raw range index
                    builder.add(line.from, line.from, errorLine);
                }
                else if (line.number === toHighlight.normalLine) {
                    builder.add(line.from, line.from, normalLine);
                }
                pos = line.to + 1;
            }
        }
        return builder.finish();
    }
    linesToHighlight = new LinesToHighlight(-1, -1);
    constructor(parentDiv, initialContents, extensions) {
        this.readOnly = new Compartment();
        this.docChangedSubscribers = [];
        const boundStripeDeco = this.stripeDeco.bind(this);
        this.highlightLinePlugin = ViewPlugin.fromClass(class {
            decorations;
            constructor(view) {
                this.decorations = boundStripeDeco(view);
            }
            update(update) {
                this.decorations = boundStripeDeco(update.view);
            }
        }, {
            decorations: v => v.decorations
        });
        extensions = extensions.concat([normalTheme, errorTheme, this.highlightLinePlugin, this.linesToHighlightState.extension]);
        extensions.push(EditorView.updateListener.of((v) => {
            if (v.docChanged) {
                for (const subscriber of this.docChangedSubscribers) {
                    subscriber();
                }
            }
        }));
        extensions.push(this.readOnly.of(EditorState.readOnly.of(false)));
        this.editorView = new EditorView({
            doc: initialContents,
            extensions: extensions,
            parent: parentDiv,
        });
    }
    setReadOnly(value) {
        this.editorView.dispatch({
            effects: this.readOnly.reconfigure(EditorState.readOnly.of(value)),
        });
    }
    addDocChangedSubscriber(subscriber) {
        this.docChangedSubscribers.push(subscriber);
    }
    setErrorLine(errorLine) {
        this.linesToHighlight = new LinesToHighlight(this.linesToHighlight.normalLine, errorLine);
        this.editorView.dispatch({ effects: [this.linesToHighlightEffect.of(this.linesToHighlight)] });
    }
    setHighlightLine(normalLine) {
        this.linesToHighlight = new LinesToHighlight(normalLine, this.linesToHighlight.errorLine);
        this.editorView.dispatch({ effects: [this.linesToHighlightEffect.of(this.linesToHighlight)] });
    }
    currentValue() {
        return this.editorView.state.doc.toString();
    }
    setText(text) {
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

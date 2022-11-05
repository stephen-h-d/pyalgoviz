import {minimalSetup, EditorView} from "codemirror";

function setup() {
    const editorDiv = document.getElementById("editor");

    if (editorDiv === null) {
        return;
    }

    const view = new EditorView({
        doc: "testing...",
        extensions: minimalSetup,
        parent: editorDiv
        });    
}

setup();

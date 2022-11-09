import {minimalSetup, EditorView} from "codemirror";

function save(event: MouseEvent, algoView: EditorView, vizView: EditorView) {
    fetch("api/save", {
        method: "POST",
        body: JSON.stringify({
            algo_script: algoView.state.doc.toString(),
            viz_script: vizView.state.doc.toString(),
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
    .then((result) => {

    }).catch((error) => {

    });
}

function setup() {
    const scriptEditorDiv: HTMLElement | null = document.getElementById("algo_editor");
    const vizEditorDiv: HTMLElement | null = document.getElementById("viz_editor");
    const button: HTMLElement | null = document.getElementById("save");

    if (scriptEditorDiv === null || button === null || vizEditorDiv === null) {
        console.error("Unable to load elements.");
        return;
    }

    const algoView = new EditorView({
        doc: "",
        extensions: minimalSetup,
        parent: scriptEditorDiv
        });

    const vizView = new EditorView({
        doc: "",
        extensions: minimalSetup,
        parent: scriptEditorDiv
        });

    button.addEventListener("click", (event) => save(event, algoView, vizView));
}

setup();

import {minimalSetup, EditorView} from "codemirror";

function save(event: MouseEvent, view: EditorView) {
    fetch("api/save", {
     
    // Adding method type
    method: "POST",
     
    // Adding body or contents to send
    body: JSON.stringify({
        script: view.state.doc.toString()
    }),
     
    // Adding headers to the request
    headers: {
        "Content-type": "application/json; charset=UTF-8"
    }
})
    .then((result) => {

    }).catch((error) => {
    });
}

function setup() {
    const editorDiv: HTMLElement | null = document.getElementById("editor");
    const button: HTMLElement | null = document.getElementById("save");

    if (editorDiv === null || button == null) {
        console.error("Unable to get load elements.");
        return;
    }

    const view = new EditorView({
        doc: "testing...",
        extensions: minimalSetup,
        parent: editorDiv
        });    

    button.addEventListener("click", (event) => save(event, view));
}

setup();

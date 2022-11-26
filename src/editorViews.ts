import { minimalSetup, basicSetup, EditorView } from "codemirror";
import { python } from '@codemirror/lang-python';
import {EditorState} from "@codemirror/state";


export function setupEditorViews(scriptEditorDiv: HTMLDivElement, vizEditorDiv: HTMLDivElement, outputAreaDiv: HTMLDivElement) {
  const algoView = new EditorView({
    doc: `
for x in range(50, 500, 50):
    for y in range(50, 500, 50):
        n = y / 50
    `,
    extensions: [basicSetup, python()],
    parent: scriptEditorDiv,
  });

  const vizView = new EditorView({
    doc: `
from math import pi

text(x, y, "x=%s y=%s n=%d" % (x, y, n), size=10 + n*3, font="Arial", color='red')
rect(450, 50, 50 + n*10, 50 + n*10, fill="brown", border="lightyellow")
line(50, 50, x, y, color="purple", width=6)
circle(300, 200, n * 25, fill="transparent", border="green")
arc(100,
    325,
    innerRadius=50,
    outerRadius=100,
    startAngle=(n - 1) * 2 * pi/7,
    endAngle=n * 2 * pi/7,
    color="orange")
    `,
    extensions: [basicSetup, python()],
    parent: vizEditorDiv,
  });

  const outputArea = new EditorView({
    doc: "",
    extensions: [minimalSetup, EditorState.readOnly.of(true)],
    parent: outputAreaDiv,
  });
  return { algoView, outputArea, vizView };
}

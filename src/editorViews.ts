import { minimalSetup, basicSetup } from "codemirror";
import { EditorState} from '@codemirror/state';
import { python } from '@codemirror/lang-python';
import { Editor } from "./editor";

export function setupEditorViews(scriptEditorDiv: HTMLDivElement, vizEditorDiv: HTMLDivElement, outputAreaDiv: HTMLDivElement) {
  const algoEditor = new Editor(scriptEditorDiv, `
for x in range(50, 500, 50):
    for y in range(50, 500, 50):
        n = y / 50
      `, [basicSetup, python()]);

  const vizEditor = new Editor(vizEditorDiv, `
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
      `, [basicSetup, python()]);

  const outputArea = new Editor(outputAreaDiv, "", [minimalSetup, EditorState.readOnly.of(true)]);
  const scriptOutputArea = new Editor(outputAreaDiv, "", [minimalSetup, EditorState.readOnly.of(true)]);

  return { algoEditor, outputArea, vizEditor, scriptOutputArea };
}

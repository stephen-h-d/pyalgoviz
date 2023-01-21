import { asyncRun } from "./py-worker";
import { executorScript } from "./executor";


// Begin HMR Setup
// I am not 100% sure if this section is necessary to make HMR work,
// but it seems to ensure that it does.  The setup() function essentially
// recreates the entire page every time this module is reloaded.
// The only thing it doesn't do is reload
// pyodide.  That is what is handy about it for us, since we don't often
// need to reload pyodide, and it takes a while.
function reloadModule(newModule: any) {
    console.log("newModule: ", newModule, "reloading entire page");
}

if (import.meta.hot) {
  import.meta.hot.accept(reloadModule)
}
// End HMR Setup.

const context = {
    script: `
for x in range(50, 500, 50):
    for y in range(50, 500, 50):
        n = y / 50
        `,
    viz: `
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
    showVizErrors: true,
};

//@ts-ignore
const script = `
from __future__ import annotations
import sys
import traceback
import time
from io import StringIO


from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from _typeshed import SupportsWrite

orig_print = print
buffer = StringIO()

vizOutput = ''
ERROR = ''

def log(
    *values: object, sep: str | None = None, end: str | None = None, file: SupportsWrite[str] | None = None, flush: bool = False
) -> None:
    print(*values,sep=sep,end=end,file=buffer,flush=flush)
    print(*values,sep=sep,end=end,flush=flush)

log("this is a test of your worthiness")
buffer.getvalue()
{"what": buffer.getvalue()}
`;

console.log("running");
const result = await asyncRun(executorScript,context);
console.log(result);

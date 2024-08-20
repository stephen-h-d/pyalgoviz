# type: ignore
from __future__ import annotations

import sys
import time
import traceback
from io import StringIO
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from types import FrameType, TracebackType
    from typing import Any, Optional, Callable

algo_log = StringIO()
viz_log = StringIO()
current_log = algo_log


def reset_logs() -> None:
    global algo_log, viz_log, current_log
    algo_log = StringIO()
    viz_log = StringIO()
    current_log = algo_log


viz_output = ""

ERROR = ""


def log(
    *values: object, sep: str | None = None, end: str | None = None, flush: bool = False
) -> None:
    print(*values, sep=sep, end=end, file=current_log, flush=flush)


def number(x: float, y: float, label: str, value: str, scale=4, color="black") -> None:
    text(x, y + 10, label)
    rect(x + 20, y, value * scale, 10, color)
    text(x + 22 + value * scale, y + 10, value)


def barchart(
    x: float,
    y: float,
    w: float,
    h: float,
    items: list,
    highlight: int = -1,
    scale: float = 1,
    fill: str = "black",
    border: str = "black",
) -> None:
    rect(x, y, w, h, "#FDFDF0", border)
    if items:
        d = min(15, int(w / len(items)))
        offset = (w - len(items) * d) / 2
        for n, item in enumerate(items):
            hitem = item * scale
            rect(
                offset + x + n * d,
                y + h - hitem,
                d - 2,
                hitem,
                "red" if n == highlight else fill,
            )


NUMBER = ("number", (int, float))
STRING = ("string", str)


def check(primitive: str, param: str, value: Any, expected: tuple) -> None:
    kind, typ = expected
    assert isinstance(value, typ), "expected a %s for %s.%s, instead got %s" % (
        kind,
        primitive,
        param,
        repr(value),
    )


# TODO figure out what is going on with the beep --
# not sure where B() javascript function is even defined
# def beep(frequency, duration):
#     check('beep', 'frequency', frequency, NUMBER)
#     check('beep', 'duration', duration, NUMBER)
#     global viz_output
#     viz_output += 'B(canvas, %s,%s);' % (frequency, duration)


def text(
    x: float,
    y: float,
    txt: str,
    size: int = 13,
    font: str = "Arial",
    color: str = "black",
) -> None:
    check("text", "x", x, NUMBER)
    check("text", "y", x, NUMBER)
    check("text", "size", size, NUMBER)
    check("text", "font", font, STRING)
    check("text", "color", color, STRING)
    global viz_output
    viz_output += "drawText(canvas, %d,%d,%r,%d,%r,%r);" % (
        x,
        y,
        str(txt),
        size,
        font,
        color,
    )


def line(
    x1: float, y1: float, x2: float, y2: float, color: str = "black", width: int = 1
) -> None:
    global viz_output
    viz_output += "drawLine(canvas, %s,%s,%s,%s,%r,%s);" % (
        x1,
        y1,
        x2,
        y2,
        color,
        width,
    )


def rect(
    x: float, y: float, w: float, h: float, fill: str = "white", border: str = "black"
) -> None:
    check("rect", "x", x, NUMBER)
    check("rect", "y", x, NUMBER)
    check("rect", "w", w, NUMBER)
    check("rect", "h", h, NUMBER)
    check("rect", "fill", fill, STRING)
    check("rect", "border", border, STRING)
    global viz_output
    viz_output += "drawRect(canvas, %s,%s,%s,%s,%r,%r);" % (
        x,
        y,
        w,
        h,
        fill,
        border,
    )


def circle(
    x: float, y: float, radius: float, fill: str = "white", border: str = "black"
) -> None:
    check("circle", "x", x, NUMBER)
    check("circle", "y", x, NUMBER)
    check("circle", "radius", radius, NUMBER)
    check("circle", "fill", fill, STRING)
    check("circle", "border", border, STRING)
    global viz_output
    viz_output += "drawCircle(canvas, %s,%s,%s,%r,%r);" % (
        x,
        y,
        radius,
        fill,
        border,
    )


def arc(
    cx: float,
    cy: float,
    innerRadius: float,
    outerRadius: float,
    startAngle: float,
    endAngle: float,
    color: str = "black",
) -> None:
    check("circle", "cx", cx, NUMBER)
    check("circle", "cy", cx, NUMBER)
    check("circle", "innerRadius", innerRadius, NUMBER)
    check("circle", "outerRadius", outerRadius, NUMBER)
    check("circle", "startAngle", startAngle, NUMBER)
    check("circle", "endAngle", endAngle, NUMBER)
    check("circle", "color", color, STRING)
    global viz_output
    viz_output += "drawArc(canvas, %s,%s,%s,%s,%s,%s,%r);" % (
        cx,
        cy,
        innerRadius,
        outerRadius,
        startAngle,
        endAngle,
        color,
    )


SCRIPT_FILENAMES = ["<inline>", "<string>"]


def make_error_dict(
    tb: TracebackType, e: Exception, vars_array: list[Any]
) -> dict[str, Any]:
    stack = traceback.extract_tb(tb)
    lines = [0] + [
        lineno for filename, lineno, fn, txt in stack if filename == "<string>"
    ]
    msg = "=" * 70
    msg += "Error at line %d: %s" % (lines[-1], ERROR or e)
    msg += "-" * 70
    msg += "%s" % "".join(["%s = %r" % v for v in vars_array])
    msg += "=" * 70
    error = dict(error_msg=msg, lineno=lines[-1])
    return error


def make_syntax_error_dict(tb: TracebackType, e: SyntaxError) -> dict[str, Any]:
    traceback.extract_tb(tb)
    msg = "=" * 70
    msg += "Syntax Error at line %d: %s" % (e.lineno, e.msg)
    msg += "-" * 70
    msg += "=" * 70
    error = dict(error_msg=msg, lineno=e.lineno)
    return error


class Executor(object):
    def __init__(
        self, script: str | bytes, viz: str | bytes, exec_fn: Callable | None = None
    ) -> None:
        self.exec_fn = exec_fn
        self.error = None
        self.events = []
        self.state = []
        self.last_line = -1
        self.vars = {"log": log}
        self.vizPrims = {
            "text": text,
            "number": number,
            "barchart": barchart,
            "line": line,
            "rect": rect,
            # 'beep': beep,
            "circle": circle,
            "arc": arc,
            "viz_output": viz_output,
        }
        try:
            compiled_code = compile(script, "<string>", "exec")
        except SyntaxError as e:
            self.error = make_syntax_error_dict(e.__traceback__, e)
            return

        try:
            self._compiled_viz = compile(viz, "<string>", "exec")
        except SyntaxError as e:
            self.error = make_syntax_error_dict(e.__traceback__, e)
            return

        try:
            with self:
                if self.exec_fn is None:
                    self.exec_fn = exec
                self.exec_fn(compiled_code, self.vars)

            # Add an extra "event" indicating the end of the program, with the output
            # being the output from the last line
            event = {
                "lineno": self.last_line,
                "viz_output": self.events[-1]["viz_output"],
                "viz_error_line": None,
                "viz_log": "",
                "algo_log": "Program finished.",
            }
            self.events.append(event)
        except Exception as e:
            self.error = make_error_dict(sys.exc_info()[2], e, self.state)

    def __enter__(self) -> None:
        self.start = time.time()
        reset_logs()
        sys.settrace(self.trace)

    def getVars(self, frame: FrameType) -> list[Any]:
        return [(k, v) for k, v in sorted(frame.f_locals.items()) if "__" not in k]

    def trace(
        self: Any, frame: FrameType, event: str, args: Optional[TracebackType]
    ) -> Optional[str]:
        now = time.time()
        if now - self.start > 10:
            self.events = self.events[-100:]
            raise TimeoutError(
                "Script ran for more than 10 seconds and has been canceled."
                + "Showing just the last 100 events."
            )
        if (
            frame.f_code.co_filename in SCRIPT_FILENAMES
            and self.last_line != frame.f_lineno
        ):
            state = self.getVars(frame)
            if event != "exception":
                self.state = state
            global viz_output, algo_log, viz_log, current_log
            viz_output = ""
            for k, v in state:
                self.vizPrims[k] = v
            self.vizPrims["__lineno__"] = frame.f_lineno

            try:
                current_log = viz_log
                self.exec_fn(self._compiled_viz, self.vizPrims)
            except Exception as e:
                tb = traceback.extract_tb(sys.exc_info()[2])
                lines = [0] + [
                    lineno
                    for filename, lineno, fn, txt in tb
                    if filename in SCRIPT_FILENAMES
                ]
                lines[-1]
                error_msg = (
                    f"Error running visualization script at line {lines[-1]}.{e}\n"
                )
                viz_log.write(error_msg)
            finally:
                current_log = algo_log

            self.createEvent(frame.f_lineno)
            self.last_line = frame.f_lineno
            return self.trace

    def createEvent(self, lineno: int, viz_error_line: Optional[int]) -> None:
        event = {
            "lineno": lineno,  # the line number of the algo script.
            "viz_output": viz_output,
            "viz_error_line": viz_error_line,
            "viz_log": viz_log.getvalue(),
            "algo_log": algo_log.getvalue(),
        }
        viz_log.truncate(0)
        viz_log.seek(0)
        algo_log.truncate(0)
        algo_log.seek(0)
        self.events.append(event)

    def __exit__(self, *args) -> None:
        sys.settrace(None)


def run_client_side() -> str:
    import json
    from js import algo_script, viz_script

    result = Executor(algo_script, viz_script, None)

    result = {
        "py_error": result.error,
        "events": result.events,
    }

    return json.dumps(result)

export const executorScript = `
from __future__ import annotations

import sys
import traceback
import time
import json
from io import StringIO


from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from _typeshed import SupportsWrite

algo_log = StringIO()
viz_log = StringIO()
current_log = algo_log

def reset_logs():
    global algo_log, viz_log, current_log
    algo_log = StringIO()
    viz_log = StringIO()
    current_log = algo_log

viz_output = ''

ERROR = ''

def log(
    *values: object, sep: str | None = None, end: str | None = None, flush: bool = False
) -> None:
    print(*values,sep=sep,end=end,file=current_log,flush=flush)


def number(x, y, label, value, scale=4, color='black'):
    text(x, y + 10, label)
    rect(x + 20, y, value * scale, 10, color)
    text(x + 22 + value * scale, y + 10, value)


def barchart(x, y, w, h, items, highlight=-1, scale=1, fill='black', border='black'):
    rect(x, y, w, h, '#FDFDF0', border)
    if items:
        d = min(15, int(w / len(items)))
        offset = (w - len(items) * d) / 2
        for n, item in enumerate(items):
            hitem = item * scale
            rect(offset + x + n * d, y + h - hitem, d - 2, hitem,
                 'red' if n == highlight else fill)


NUMBER = ('number', (int, float))
STRING = ('string', str)


def check(primitive, param, value, expected):
    kind, typ = expected
    assert isinstance(value, typ), 'expected a %s for %s.%s, instead got %s' % (
        kind, primitive, param, repr(value)
    )


# TODO figure out what is going on with the beep --
# not sure where B() javascript function is even defined
# def beep(frequency, duration):
#     check('beep', 'frequency', frequency, NUMBER)
#     check('beep', 'duration', duration, NUMBER)
#     global viz_output
#     viz_output += 'B(canvas, %s,%s);' % (frequency, duration)


def text(x, y, txt, size=13, font='Arial', color='black'):
    check('text', 'x', x, NUMBER)
    check('text', 'y', x, NUMBER)
    check('text', 'size', size, NUMBER)
    check('text', 'font', font, STRING)
    check('text', 'color', color, STRING)
    global viz_output
    viz_output += 'T(canvas, %d,%d,%r,%d,%r,%r);' % (x, y, str(txt), size, font, color)


def line(x1, y1, x2, y2, color='black', width=1):
    global viz_output
    viz_output += 'L(canvas, %s,%s,%s,%s,%r,%s);' % (x1, y1, x2, y2, color, width)


def rect(x, y, w, h, fill='white', border='black'):
    check('rect', 'x', x, NUMBER)
    check('rect', 'y', x, NUMBER)
    check('rect', 'w', w, NUMBER)
    check('rect', 'h', h, NUMBER)
    check('rect', 'fill', fill, STRING)
    check('rect', 'border', border, STRING)
    global viz_output
    viz_output += 'R(canvas, %s,%s,%s,%s,%r,%r);' % (x, y, w, h, fill, border)


def circle(x, y, radius, fill='white', border='black'):
    check('circle', 'x', x, NUMBER)
    check('circle', 'y', x, NUMBER)
    check('circle', 'radius', radius, NUMBER)
    check('circle', 'fill', fill, STRING)
    check('circle', 'border', border, STRING)
    global viz_output
    viz_output += 'C(canvas, %s,%s,%s,%r,%r);' % (x, y, radius, fill, border)


def arc(cx, cy, innerRadius, outerRadius, startAngle, endAngle, color='black'):
    check('circle', 'cx', cx, NUMBER)
    check('circle', 'cy', cx, NUMBER)
    check('circle', 'innerRadius', innerRadius, NUMBER)
    check('circle', 'outerRadius', outerRadius, NUMBER)
    check('circle', 'startAngle', startAngle, NUMBER)
    check('circle', 'endAngle', endAngle, NUMBER)
    check('circle', 'color', color, STRING)
    global viz_output
    viz_output += 'A(canvas, %s,%s,%s,%s,%s,%s,%r);' % (
        cx, cy, innerRadius, outerRadius, startAngle, endAngle, color
    )


class Executor(object):
    def __init__(self, script, viz, showVizErrors):
        self.error = None
        self.events = []
        self.state = []
        self.last_line = -1
        self.viz = viz
        self.viz_error = None
        self.showVizErrors = showVizErrors
        self.vars = {"log": log}
        self.vizPrims = {
            'text': text,
            'number': number,
            'barchart': barchart,
            'line': line,
            'rect': rect,
            # 'beep': beep,
            'circle': circle,
            'arc': arc,
            'viz_output': viz_output,
        }
        try:
            with self:
                exec(script, self.vars)

            # Add an extra "event" indicating the end of the program, with the output
            # being the output from the last line
            event = {
                "lineno": self.last_line,
                "viz_output": self.events[-1]["viz_output"],
                "viz_error": self.viz_error,
                "viz_log": None,
                "algo_log": '\\n\\nProgram finished.\\n\\nHit F9 or Ctrl-Enter to run the script again.',
            }
            self.events.append(event)
        except Exception as e:
            tb = sys.exc_info()[2]
            stack = traceback.extract_tb(tb)
            lines = [0] + [lineno for filename, lineno, fn, txt in stack if
                           filename == '<string>']
            msg = '=' * 70
            msg += '\\n\\nError at line %d: %s\\n\\n' % (lines[-1], ERROR or e)
            msg += '-' * 70
            msg += '\\n\\n%s\\n\\n' % '\\n\\n'.join(['%s = %r' % v for v in self.state])
            msg += '=' * 70
            self.error = dict(error_msg=msg, lineno=lines[-1])

    def __enter__(self):
        self.start = time.time()
        reset_logs()
        sys.settrace(self.trace)

    def getVars(self, frame):
        return [(k, v) for k, v in sorted(frame.f_locals.items()) if '__' not in k]

    def trace(self, frame, event, args):
        now = time.time()
        if now - self.start > 10:
            self.events = self.events[-100:]
            # TODO figure out how to use newlines instead of \\n\\n
            # (probably by putting this in an actual py file)
            raise TimeoutError(
                '\\n\\nScript ran for more than 10 seconds and has been canceled.' +
                '\\n\\nShowing just the last 100 events.')
        if frame.f_code.co_filename == '<string>' and self.last_line != frame.f_lineno:
            state = self.getVars(frame)
            if event != 'exception':
                self.state = state
            global viz_output, algo_log, viz_log, current_log
            viz_output = ''
            for k, v in state:
                self.vizPrims[k] = v
            self.vizPrims['__lineno__'] = frame.f_lineno

            try:
                current_log = viz_log
                exec(self.viz, self.vizPrims)
            except Exception as e:
                if self.showVizErrors:
                    tb = traceback.extract_tb(sys.exc_info()[2])
                    lines = [0] + [lineno for filename, lineno, fn, txt in tb if
                                   filename == '<string>']
                    self.viz_error = {"lineno": lines[-1], "error_msg": str(e)}
            finally:
                current_log = algo_log

            self.createEvent(frame.f_lineno)
            self.last_line = frame.f_lineno
            return self.trace

    def createEvent(self, lineno):
        # print("viz",viz_output)
        event = {
            "lineno": lineno,
            "viz_output": viz_output,
            "viz_error": self.viz_error,
            "viz_log": viz_log.getvalue(),
            "algo_log": algo_log.getvalue(),
        }
        self.events.append(event)
        self.viz_error = None

    def __exit__(self, *args):
        sys.settrace(None)

from js import script, viz, showVizErrors
result = Executor(
    script, viz, showVizErrors
)
author = "Unknown Author"

# TODO figure out how to log -- there is likely a way to do
# 'console.log' in pyodide, though originally this was putting
# a log entry in the database
# info('Ran %s "%s":\\n\\n%s' % (author, name, script))

print("num_events", len(result.events))

result = {
   'py_error': result.error,
   'events': result.events,
}

json.dumps(result)

`;

export const executorScript = `

import sys
import traceback
import time
from io import StringIO

vizOutput = ''
ERROR = ''


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
#     global vizOutput
#     vizOutput += 'B(this.canvas, %s,%s);' % (frequency, duration)


def text(x, y, txt, size=13, font='Arial', color='black'):
    check('text', 'x', x, NUMBER)
    check('text', 'y', x, NUMBER)
    check('text', 'size', size, NUMBER)
    check('text', 'font', font, STRING)
    check('text', 'color', color, STRING)
    global vizOutput
    vizOutput += 'T(this.canvas, %d,%d,%r,%d,%r,%r);' % (x, y, str(txt), size, font, color)


def line(x1, y1, x2, y2, color='black', width=1):
    global vizOutput
    vizOutput += 'L(this.canvas, %s,%s,%s,%s,%r,%s);' % (x1, y1, x2, y2, color, width)


def rect(x, y, w, h, fill='white', border='black'):
    check('rect', 'x', x, NUMBER)
    check('rect', 'y', x, NUMBER)
    check('rect', 'w', w, NUMBER)
    check('rect', 'h', h, NUMBER)
    check('rect', 'fill', fill, STRING)
    check('rect', 'border', border, STRING)
    global vizOutput
    vizOutput += 'R(this.canvas, %s,%s,%s,%s,%r,%r);' % (x, y, w, h, fill, border)


def circle(x, y, radius, fill='white', border='black'):
    check('circle', 'x', x, NUMBER)
    check('circle', 'y', x, NUMBER)
    check('circle', 'radius', radius, NUMBER)
    check('circle', 'fill', fill, STRING)
    check('circle', 'border', border, STRING)
    global vizOutput
    vizOutput += 'C(this.canvas, %s,%s,%s,%r,%r);' % (x, y, radius, fill, border)


def arc(cx, cy, innerRadius, outerRadius, startAngle, endAngle, color='black'):
    check('circle', 'cx', cx, NUMBER)
    check('circle', 'cy', cx, NUMBER)
    check('circle', 'innerRadius', innerRadius, NUMBER)
    check('circle', 'outerRadius', outerRadius, NUMBER)
    check('circle', 'startAngle', startAngle, NUMBER)
    check('circle', 'endAngle', endAngle, NUMBER)
    check('circle', 'color', color, STRING)
    global vizOutput
    vizOutput += 'A(this.canvas, %s,%s,%s,%s,%s,%s,%r);' % (
        cx, cy, innerRadius, outerRadius, startAngle, endAngle, color
    )


class Executor(object):
    def __init__(self, script, viz, showVizErrors):
        self.error = dict(msg='', lineno=0)
        self.events = []
        self.state = []
        self.lastLine = -1
        self.viz = viz
        self.showVizErrors = showVizErrors
        self.vars = {}
        self.vizPrims = {
            'text': text,
            'number': number,
            'barchart': barchart,
            'line': line,
            'rect': rect,
            # 'beep': beep,
            'circle': circle,
            'arc': arc,
            'vizOutput': vizOutput,
        }
        try:
            with self:
                exec(script, self.vars)
                self.createEvent(self.lastLine)
            lastViz = self.events[-1][1]
            msg = '\\n\\nProgram finished.\\n\\nHit F9 or Ctrl-Enter to run the script again.'
            self.events.append((self.lastLine, lastViz, msg))
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
            self.error = dict(msg=msg, lineno=lines[-1])
        if '__builtins__' in self.vars:
            del self.vars['__builtins__']

    def __enter__(self):
        self.start = time.time()
        # TODO remove this part.  It just doesn't work, I don't think, in Python 3, even though
        # it did okay in Python 2.
        # self.stdout, self.stderr = sys.stdout, sys.stderr
        # sys.stdout = StringIO()
        # sys.stderr = StringIO()
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
        if frame.f_code.co_filename == '<string>' and self.lastLine != frame.f_lineno:
            state = self.getVars(frame)
            if event != 'exception':
                self.state = state
            global vizOutput
            vizOutput = ''
            for k, v in state:
                self.vizPrims[k] = v
            self.vizPrims['__lineno__'] = frame.f_lineno
            try:
                exec(self.viz, self.vizPrims)
            except Exception as e:
                if self.showVizErrors:
                    tb = traceback.extract_tb(sys.exc_info()[2])
                    lines = [0] + [lineno for filename, lineno, fn, txt in tb if
                                   filename == '<string>']
                    self.vizError = f"line {lines[-1]}: {e}\\n"
            self.createEvent(frame.f_lineno)
            self.lastLine = frame.f_lineno
            return self.trace

    def createEvent(self, lineno):
        # TODO use more than just vizError in output
        # allow the user to do log or something
        self.events.append((lineno, vizOutput, self.vizError))
        self.vizError = ""

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

{
   'py_error': result.error,
   'events': result.events,
}

`;

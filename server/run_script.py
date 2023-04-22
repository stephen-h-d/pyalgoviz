from RestrictedPython import compile_restricted
from RestrictedPython import safe_builtins
from RestrictedPython import safe_globals
from RestrictedPython.Eval import default_guarded_getiter


safe_globals = dict(__builtins__=safe_builtins)
safe_globals["range"] = range
safe_globals["_getiter_"] = default_guarded_getiter


algo = """
for x in range(50, 500, 50):
    for y in range(50, 500, 50):
        n = y / 50
"""

viz = """
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
"""


def run(algo_script: str, viz_script: str) -> dict:
    # TODO use the exec with safe globals and the log var thing in `Executor`
    algo_byte_code = compile_restricted(algo_script, '<inline>', 'exec')
    compile_restricted(viz_script, '<inline>', 'exec')
    exec(algo_byte_code, safe_globals, {})
    # result = Executor(algo_byte_code, viz_byte_code)
    # return {
    #     'py_error': result.error,
    #     'events': result.events,
    # }

hmm = run(algo,viz)
print(hmm)
...

# type: ignore
from types import CodeType
from typing import Any
from typing import Mapping

from RestrictedPython import compile_restricted
from RestrictedPython import safe_builtins
from RestrictedPython import safe_globals
from RestrictedPython.Eval import default_guarded_getiter

from shared.executor import Executor


def allowed_import(name, globals=None, locals=None, fromlist=(), level=0):
    safe_modules = ["math"]
    if name in safe_modules:
        return __import__(name, globals, locals, fromlist, level)
    else:
        raise Exception("Don't you even think about it {0}".format(name))


custom_builtins = dict(safe_builtins)
custom_builtins["__import__"] = allowed_import

safe_globals = dict(__builtins__=custom_builtins)  # noqa
safe_globals["range"] = range
safe_globals["_getiter_"] = default_guarded_getiter


def run_script(algo_script: str, viz_script: str) -> dict:
    algo_byte_code = compile_restricted(algo_script, "<inline>", "exec")
    viz_byte_code = compile_restricted(viz_script, "<inline>", "exec")

    def exec_fn(
        source: str | bytes | CodeType,
        __globals: dict[str, Any] | None = None,
        __locals: Mapping[str, Any] | None = None,
    ) -> Any:
        combined_globals = safe_globals.copy()
        if __globals:
            combined_globals.update(__globals)
        return exec(source, combined_globals, __locals)

    result = Executor(algo_byte_code, viz_byte_code, exec_fn)
    return {
        "py_error": result.error,
        "events": result.events,
    }

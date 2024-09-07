# type: ignore
from types import CodeType
from typing import Any
from typing import Mapping

from RestrictedPython import safe_builtins
from RestrictedPython import safe_globals
from RestrictedPython.Eval import default_guarded_getiter

from server.shared.executor import Executor


def allowed_import(name, globals=None, locals=None, fromlist=(), level=0):
    safe_modules = ["math"]
    if name in safe_modules:
        return __import__(name, globals, locals, fromlist, level)
    else:
        raise Exception("Module not allowed: {0}".format(name))


def guarded_getitem(obj, index):
    try:
        return obj[index]
    except (IndexError, KeyError, TypeError):
        raise Exception("Invalid access attempt")


def guarded_write(obj):
    # Simply return the object, but raise an exception if it's a file-like object
    if hasattr(obj, "write"):
        raise Exception("Write access not allowed")
    return obj


def guarded_iter_unpack_sequence(obj, count, context=None):
    # Convert to a list if it's an iterator without __len__
    if hasattr(obj, "__len__"):
        actual_len = len(obj)
    else:
        obj = list(obj)  # Convert iterator to list
        actual_len = len(obj)

    if actual_len != count:
        raise ValueError(f"Cannot unpack, expected {count} elements but got {actual_len}")

    return obj


custom_builtins = dict(safe_builtins)
custom_builtins["__import__"] = allowed_import

safe_globals = dict(__builtins__=custom_builtins)  # noqa
safe_globals["range"] = range
safe_globals["_getiter_"] = default_guarded_getiter
safe_globals["_getitem_"] = guarded_getitem
safe_globals["_write_"] = guarded_write
safe_globals["_iter_unpack_sequence_"] = guarded_iter_unpack_sequence


def run_script(algo_script: str, viz_script: str) -> dict:
    # try:
    #     algo_byte_code = compile_restricted(algo_script, "<inline>", "exec")
    #     viz_byte_code = compile_restricted(viz_script, "<inline>", "exec")
    # except Exception as e:
    #     error = make_error_dict(sys.exc_info()[2], e, [])
    #     return {"py_error": error, "events": []}

    def exec_fn(
        source: str | bytes | CodeType,
        __globals: dict[str, Any] | None = None,
        __locals: Mapping[str, Any] | None = None,
    ) -> Any:
        combined_globals = safe_globals.copy()
        if __globals:
            combined_globals.update(__globals)
        return exec(source, combined_globals, __locals)

    # result = Executor(algo_script, viz_script, exec_fn)
    result = Executor(algo_script, viz_script)
    return {
        "py_error": result.error,
        "events": result.events,
    }

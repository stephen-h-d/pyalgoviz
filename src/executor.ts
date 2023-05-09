import executorCode from '../shared/executor.py'; // Import the Python module as a string

export const executorScript = `
${executorCode}

print('whyyyyyyy')

import json

from js import algo_script, viz_script

bob = Bob("sdf","dasd",None)

print('whyyyyyyy1',algo_script, viz_script)
result = Executor(algo_script, viz_script, None)

print('whyyyyyyy2')
author = "Unknown Author"

# TODO figure out how to log -- there is likely a way to do
# 'console.log' in pyodide, though originally this was putting
# a log entry in the database
# info('Ran %s "%s":\\n\\n%s' % (author, name, script))

print("num_events", len(result.events))
print("fuzzywuzzy", result.events)

result = {
   'py_error': result.error,
   'events': result.events,
}

print("ugh",len(json.dumps(result)))
json.dumps(result)

`;

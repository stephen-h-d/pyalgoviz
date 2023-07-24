import executorCode from '../server/shared/executor.py'; // Import the Python module as a string

export const executorScript = `
${executorCode}

run_client_side()

`;

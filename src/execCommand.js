const { exec } = require('child_process');

function extractShellCommands(text) {
  const match = text.match(/```(?:bash|sh)?\n([\s\S]+?)```/i);
  if (!match) return null;

  const raw = match[1];
  const cleaned = raw
    .split('\n')
    .map(line => line.trim())
    .filter(line =>
      line &&
      !line.startsWith('#') &&
      !line.startsWith('echo $?') &&
      !line.includes('2>&1') &&
      !line.startsWith('exit') &&
      !line.startsWith('grep')
    );
  return cleaned;
}

function runShellCommandsSequentially(commands, callback) {
  if (!commands || !commands.length) return callback(null, "No commands to run.");

  let index = 0;
  let output = "";

  const runNext = () => {
    if (index >= commands.length) return callback(null, output.trim());

    const cmd = commands[index++];
    exec(cmd, (error, stdout, stderr) => {
      if (error) return callback(`❌ Error: ${error.message}`, null);
      if (stderr) return callback(`⚠️ Stderr: ${stderr}`, null);
      output += `> ${cmd}\n${stdout}\n`;
      runNext();
    });
  };

  runNext();
}

module.exports = {
  extractAndRunShellCommand: (text, callback) => {
    const commands = extractShellCommands(text);
    if (!commands) return callback(null, null);
    runShellCommandsSequentially(commands, callback);
  }
};

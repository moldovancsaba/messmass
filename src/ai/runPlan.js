const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

function runPlan(planPath, cwd = process.cwd()) {
  const plan = JSON.parse(fs.readFileSync(planPath, "utf-8"));
  const logPath = path.join(cwd, "executionLog.json");
  const log = [];

  return new Promise((resolve) => {
    const steps = [...plan];
    let index = 0;

    function runNext() {
      if (index >= steps.length) {
        fs.mkdirSync(path.dirname(logPath), { recursive: true });
        fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
        return resolve();
      }

      const step = steps[index++];
      exec(step.command, { cwd, shell: "/bin/zsh" }, (error, stdout, stderr) => {
        const entry = {
          command: step.command,
          success: !error,
          output: stdout.trim(),
          error: stderr.trim()
        };
        log.push(entry);

        if (error && step.critical) {
          fs.mkdirSync(path.dirname(logPath), { recursive: true });
          fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
          return resolve(); // Stop on critical error
        }

        runNext();
      });
    }

    runNext();
  });
}

module.exports = { runPlan };
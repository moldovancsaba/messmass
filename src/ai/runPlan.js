import fs from 'fs';
import { exec } from 'child_process';

export async function runPlan(planFile = './.ai-plan.json') {
  return new Promise((resolve, reject) => {
    let plan;
    try {
      const raw = fs.readFileSync(planFile, 'utf8');
      plan = JSON.parse(raw);
    } catch (err) {
      return reject(new Error(`❌ Failed to load plan file: ${err.message}`));
    }

    const commands = plan?.filter(c => typeof c.command === 'string');
    if (!commands || commands.length === 0) {
      return reject(new Error('No valid commands in plan'));
    }

    const log = [];
    const executeNext = (index) => {
      if (index >= commands.length) {
        fs.writeFileSync('executionLog.json', JSON.stringify(log, null, 2));
        return resolve(true);
      }

      const cmd = commands[index].command;
      exec(cmd, (err, stdout, stderr) => {
        log.push({ cmd, stdout, stderr, error: err?.message || null });
        executeNext(index + 1);
      });
    };

    executeNext(0);
  });
}
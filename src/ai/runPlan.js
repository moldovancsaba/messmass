import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';

export async function runPlan(dir = '.') {
  const planPath = path.join(dir, 'plan.json');
  if (!fs.existsSync(planPath)) throw new Error('plan.json not found');

  const plan = JSON.parse(fs.readFileSync(planPath, 'utf-8'));
  if (!Array.isArray(plan)) throw new Error('plan.json must contain an array');

  const results = [];

  for (const step of plan) {
    if (!step.command || typeof step.command !== 'string') {
      results.push(`❌ Invalid step: ${JSON.stringify(step)}`);
      continue;
    }

    const output = await new Promise((resolve) => {
      exec(step.command, { shell: '/bin/zsh' }, (err, stdout, stderr) => {
        if (err) resolve(`❌ ${stderr || err.message}`);
        else resolve(stdout.trim());
      });
    });

    results.push(`💬 ${step.command}\n${output}`);
  }

  return results;
}
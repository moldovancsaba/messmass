import { generatePlan } from '../src/ai/generatePlan.js';
import { runPlan } from '../src/ai/runPlan.js';
import fs from 'fs';
import path from 'path';
import assert from 'assert';

describe('AI Behaviour', function () {
  this.timeout(5000);

  const testDir = process.cwd();
  const planPath = path.join(testDir, 'plan.json');

  it('should generate a valid plan from bash block', async () => {
    const prompt = 'Create a folder and a file inside it with "hello world" content';
    await generatePlan(prompt);
    assert.ok(fs.existsSync(planPath), 'plan.json should exist');
  });

  it('should execute the generated plan', async () => {
    if (!fs.existsSync(planPath)) throw new Error('plan.json not found');
    const result = await runPlan();
    assert.ok(result.length > 0, 'execution result should not be empty');
  });
});
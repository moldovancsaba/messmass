import assert from 'assert';
import fs from 'fs';
import { generatePlan } from '../src/ai/generatePlan.js';
import { runPlan } from '../src/ai/runPlan.js';

describe('AI Behaviour', function () {
  this.timeout(5000);

  it('should generate a valid plan from bash block', async () => {
    const input = `
      \`\`\`bash
      mkdir -p ai_test_dir
      touch ai_test_dir/test.txt
      echo "hello world" > ai_test_dir/test.txt
      \`\`\`
    `;
    const plan = await generatePlan(input);
    assert.ok(Array.isArray(plan), 'Plan should be an array');
    assert.ok(plan.length > 0, 'Plan should contain steps');
    fs.writeFileSync('.ai-plan.json', JSON.stringify(plan, null, 2));
  });

  it('should execute the generated plan', async () => {
    const result = await runPlan('.ai-plan.json');
    assert.strictEqual(result, true, 'Plan should execute successfully');
  });
});
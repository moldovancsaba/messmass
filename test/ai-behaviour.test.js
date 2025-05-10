const fs = require("fs");
const path = require("path");
const { expect } = require("chai");
const { generatePlan } = require("../src/ai/generatePlan");
const { runPlan } = require("../src/ai/runPlan");

describe("AI Behaviour", () => {
  const testDir = path.join(__dirname, "../ai_test_dir");
  const planPath = path.join(testDir, ".ai-plan.json");

  before(() => {
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
    fs.mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
  });

  after(() => {
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
  });

  it("should generate a valid plan from bash block", () => {
    const input = [
      '```bash',
      'mkdir test-ai',
      'echo Hello > test-ai/README.md',
      '```'
    ].join('\n');
    const plan = generatePlan(input);
    expect(plan).to.be.an("array").that.has.lengthOf(2);
    expect(plan[0].command).to.include("mkdir");
  });

  it("should execute the generated plan", async () => {
    const plan = [
      { command: "mkdir executed-ai", critical: true },
      { command: "echo OK > executed-ai/status.txt", critical: true }
    ];
    fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
    await runPlan(planPath, testDir);
    const statusPath = path.join(testDir, "executed-ai/status.txt");
    expect(fs.existsSync(statusPath)).to.be.true;
    const status = fs.readFileSync(statusPath, "utf-8").trim();
    expect(status).to.equal("OK");
  });
});
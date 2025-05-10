const fs = require("fs");
const path = require("path");

function generatePlan(input) {
  const bashBlockMatch = input.match(/```bash\s+([\s\S]*?)```/);
  if (!bashBlockMatch) return [];

  const commands = bashBlockMatch[1]
    .split("\n")
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#"))
    .map(cmd => ({ command: cmd, critical: true }));

  const planPath = path.join(process.cwd(), ".ai-plan.json");
  fs.writeFileSync(planPath, JSON.stringify(commands, null, 2));

  return commands;
}

module.exports = { generatePlan };
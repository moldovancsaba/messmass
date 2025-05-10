const fs = require("fs");
const path = require("path");

function generatePlan(input) {
  let commands = [];

  // 1. Először: bash blokkot keresünk
  const bashBlockMatch = input.match(/```bash\s+([\s\S]*?)```/);
  if (bashBlockMatch) {
    commands = bashBlockMatch[1]
      .split("\n")
      .map(line => line.trim())
      .filter(line => line && !line.startsWith("#"))
      .map(cmd => ({ command: cmd, critical: true }));
  } else {
    // 2. Egyszerű természetes nyelvi értelmezés szóközökkel is
    const createMatch = input.match(/create (a )?(folder|directory)( called)? ['"]?(.+?)['"]?$/i);
    const removeMatch = input.match(/(remove|delete) (the )?(folder|directory)( called)? ['"]?(.+?)['"]?$/i);

    if (createMatch) {
      const folderName = createMatch[4].trim().replace(/['"]$/, "");
      commands.push({ command: `mkdir "${folderName}"`, critical: true });
    } else if (removeMatch) {
      const folderName = removeMatch[5].trim().replace(/['"]$/, "");
      commands.push({ command: `rm -rf "${folderName}"`, critical: true });
    }
  }

  const planPath = path.join(process.cwd(), ".ai-plan.json");
  fs.writeFileSync(planPath, JSON.stringify(commands, null, 2));

  return commands;
}

module.exports = { generatePlan };
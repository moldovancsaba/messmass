const fs = require("fs");
const path = require("path");

function generatePlan(input) {
  let commands = [];

  // Elsőként: ha bash blokk van, azt használjuk
  const bashBlockMatch = input.match(/```bash\s+([\s\S]*?)```/);
  if (bashBlockMatch) {
    commands = bashBlockMatch[1]
      .split("\n")
      .map(line => line.trim())
      .filter(line => line && !line.startsWith("#"))
      .map(cmd => ({ command: cmd, critical: true }));
  } else {
    // Egyszerű szabályalapú természetes nyelvi értelmezés
    const folderCreate = input.match(/create (a )?(folder|directory)( called)? ['"]?([\w\-\/]+)['"]?/i);
    const folderRemove = input.match(/(remove|delete) (the )?(folder|directory)( called)? ['"]?([\w\-\/]+)['"]?/i);

    if (folderCreate) {
      const name = folderCreate[4];
      commands.push({ command: `mkdir ${name}`, critical: true });
    } else if (folderRemove) {
      const name = folderRemove[5];
      commands.push({ command: `rm -rf ${name}`, critical: true });
    }
  }

  const planPath = path.join(process.cwd(), ".ai-plan.json");
  fs.writeFileSync(planPath, JSON.stringify(commands, null, 2));

  return commands;
}

module.exports = { generatePlan };
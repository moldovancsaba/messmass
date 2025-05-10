const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { generatePlan } = require("./ai/generatePlan");
const { runPlan } = require("./ai/runPlan");
const { saveSession, loadSession } = require("./session/sessionManager");

let currentDirectory = process.cwd();
let aiMode = false;
let autoAI = false;
let sessionIndex = 0;
let sessionLog = [];

const outputEl = document.getElementById("output");
const inputEl = document.getElementById("cmd");
const promptEl = document.getElementById("prompt");
const runButton = document.getElementById("runButton");
const modeToggle = document.getElementById("modeToggle");
const autoToggle = document.getElementById("autoToggle");
const newSession = document.getElementById("newSession");

function appendLine(line) {
  const div = document.createElement("div");
  div.textContent = line;
  outputEl.appendChild(div);
  outputEl.scrollTop = outputEl.scrollHeight;
  sessionLog.push(line);
}

function refreshPrompt() {
  promptEl.textContent = `${aiMode ? "# AI > " : ""}${process.env.USER}@${require("os").hostname()} ${path.basename(currentDirectory)} % `;
}

inputEl.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    const cmd = inputEl.value.trim();
    if (!cmd) return;
    appendLine(promptEl.textContent + cmd);
    inputEl.value = "";

    if (aiMode) {
      appendLine(`# AI detected: "${cmd}"`);
      const plan = generatePlan(cmd);
      if (plan.length === 0) {
        appendLine("❌ Could not generate plan.");
        return;
      }

      fs.writeFileSync(".ai-plan.json", JSON.stringify(plan, null, 2));
      if (autoAI) {
        appendLine("# ✅ Auto-executing plan...");
        await runPlan(".ai-plan.json", currentDirectory);
      } else {
        appendLine("# ✅ Plan generated. Use 'Run' to execute.");
      }
    } else {
      if (cmd.startsWith("cd ")) {
        const target = cmd.slice(3).trim();
        const newPath = path.resolve(currentDirectory, target);
        if (fs.existsSync(newPath) && fs.statSync(newPath).isDirectory()) {
          currentDirectory = newPath;
          appendLine(`Changed directory to ${currentDirectory}`);
        } else {
          appendLine(`❌ No such directory: ${newPath}`);
        }
      } else {
        exec(cmd, { cwd: currentDirectory, shell: "/bin/zsh" }, (err, stdout, stderr) => {
          if (err) appendLine(`❌ ${err.message}`);
          if (stdout) appendLine(stdout.trim());
          if (stderr) appendLine(stderr.trim());
        });
      }
    }

    refreshPrompt();
  }
});

runButton.addEventListener("click", async () => {
  appendLine("# ▶ Running queued plan...");
  await runPlan(".ai-plan.json", currentDirectory);
});

modeToggle.addEventListener("click", () => {
  aiMode = !aiMode;
  modeToggle.textContent = aiMode ? "AI" : "HUMAN";
  appendLine(`# Switched to ${aiMode ? "AI" : "HUMAN"} mode`);
  runButton.style.display = aiMode && !autoAI ? "inline-block" : "none";
  refreshPrompt();
});

autoToggle.addEventListener("click", () => {
  autoAI = !autoAI;
  autoToggle.textContent = `AUTO AI: ${autoAI ? "ON" : "OFF"}`;
  appendLine(`# Auto AI turned ${autoAI ? "ON" : "OFF"}`);
  runButton.style.display = aiMode && !autoAI ? "inline-block" : "none";
});

newSession.addEventListener("click", () => {
  const name = `session-${++sessionIndex}`;
  saveSession(name, sessionLog);
  sessionLog = [];
  outputEl.innerHTML = "";
  appendLine(`# ✅ New session "${name}" started`);
  refreshPrompt();
});

window.onload = () => {
  refreshPrompt();
  inputEl.focus();
};
const { execCommand } = require("./execCommand");
const { generatePlan } = require("./AutoAIPlanner");
const { AutoAIController } = require("./AutoAIController");

let autoAI = false; // Auto AI kapcsoló

window.onload = () => {
  const terminal = document.getElementById("terminal");
  const input = document.getElementById("cmdInput");

  const appendLine = (text = "") => {
    terminal.innerHTML += text + "\n";
    terminal.scrollTop = terminal.scrollHeight;
  };

  const showPrompt = () => appendLine("moldovan@MacBookPro messmass % ");

  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      const cmd = input.value.trim();
      appendLine("moldovan@MacBookPro messmass % " + cmd);
      input.value = "";
      if (cmd === "") return;

      if (cmd === "toggle-auto") {
        autoAI = !autoAI;
        appendLine(`🔁 Auto AI is now ${autoAI ? "ON" : "OFF"}`);
        return;
      }

      if (cmd.startsWith("ai:")) {
        const aiResponse = cmd.slice(3).trim();
        appendLine("# AI: " + aiResponse);
        generatePlan(aiResponse);
        appendLine("✅ Plan generated from AI input.");
        if (autoAI) {
          appendLine("▶️ Executing AI plan...");
          const runner = new AutoAIController();
          await runner.run();
          appendLine("✅ Done.");
        }
        return;
      }

      try {
        const output = await execCommand(cmd);
        appendLine(output.trim());
      } catch (err) {
        appendLine("❌ " + err.message);
      }
    }
  });

  appendLine("Welcome to messmass — Local AI Shell");
  appendLine("Use `toggle-auto` to enable/disable Auto AI");
  showPrompt();
};

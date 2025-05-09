const { execCommand } = require("./execCommand");
const { generatePlan } = require("./AutoAIPlanner");

window.onload = () => {
  const terminal = document.getElementById("terminal");
  const input = document.getElementById("cmdInput");

  const appendLine = (text = "") => {
    terminal.innerHTML += text + "\n";
    terminal.scrollTop = terminal.scrollHeight;
  };

  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      const cmd = input.value.trim();
      appendLine("moldovan@MacBookPro messmass % " + cmd);
      input.value = "";
      if (cmd === "") return;

      // Parancs prefixelve: ai:
      if (cmd.startsWith("ai:")) {
        const aiResponse = cmd.slice(3).trim();
        appendLine("# AI: " + aiResponse);
        generatePlan(aiResponse);
        appendLine("✅ Plan generated from AI input.");
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

  appendLine("Welcome to messmass — Local AI Shell\n");
};

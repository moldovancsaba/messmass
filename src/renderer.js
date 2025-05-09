const { ipcRenderer } = require('electron');

function detectShellCommand(text) {
  const match = text.match(/```(?:bash|sh)?\n([^`]+)```/i);
  return match ? match[1].trim() : null;
}

document.getElementById('send').addEventListener('click', async () => {
  const prompt = document.getElementById('prompt').value;
  const responseBox = document.getElementById('response');
  const humanAI = document.getElementById('humanAI').checked;
  const autoAI = document.getElementById('autoAI').checked;

  responseBox.innerText = "⏳ Thinking...";

  const data = await ipcRenderer.invoke('ask-ollama', {
    prompt,
    humanAI,
    autoAI
  });

  const command = detectShellCommand(data);

  if (humanAI && autoAI && command) {
    const result = await ipcRenderer.invoke('run-command', command);
    responseBox.innerText = data + "\n\n🤖 Auto-executed:\n" + result;
  } else if (humanAI && !autoAI && command) {
    const runBtn = document.createElement('button');
    runBtn.innerText = "RUN";
    runBtn.onclick = async () => {
      const result = await ipcRenderer.invoke('run-command', command);
      responseBox.innerText = data + "\n\n💻 Command output:\n" + result;
      runBtn.remove();
    };
    responseBox.innerText = data;
    responseBox.appendChild(document.createElement('br'));
    responseBox.appendChild(runBtn);
  } else {
    responseBox.innerText = data;
  }
});

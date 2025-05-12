const inputField = document.getElementById('input');
const outputDiv = document.getElementById('output');
const runBtn = document.getElementById('runBtn');
const modeToggle = document.getElementById('toggleMode');
const autoToggle = document.getElementById('toggleAuto');
const newSessionBtn = document.getElementById('newSessionBtn');

let mode = 'HUMAN';
let autoAI = false;

function appendOutput(line) {
  const pre = document.createElement('div');
  pre.textContent = line;
  outputDiv.appendChild(pre);
  outputDiv.scrollTop = outputDiv.scrollHeight;
}

function updateButtonStates() {
  modeToggle.textContent = mode;
  autoToggle.textContent = `AUTO AI: ${autoAI ? 'ON' : 'OFF'}`;
}

modeToggle.addEventListener('click', () => {
  mode = mode === 'HUMAN' ? 'AI' : 'HUMAN';
  appendOutput(`Mode changed to ${mode}`);
  updateButtonStates();
});

autoToggle.addEventListener('click', () => {
  autoAI = !autoAI;
  appendOutput(`Auto AI is now ${autoAI ? 'ON' : 'OFF'}`);
  updateButtonStates();
});

newSessionBtn.addEventListener('click', () => {
  appendOutput('🆕 New session started');
});

runBtn.addEventListener('click', () => {
  const command = inputField.value.trim();
  if (command) handleCommand(command);
});

inputField.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    const command = inputField.value.trim();
    if (command) {
      handleCommand(command);
      inputField.value = '';
    }
  }
});

async function handleCommand(command) {
  appendOutput(`moldovan@MacBookPro messmass % ${command}`);

  if (mode === 'HUMAN') {
    const result = await window.electron.invoke('run-command', command);
    appendOutput(result);
  } else {
    if (!autoAI) {
      appendOutput('🤖 AI mode is on, but AUTO is off.');
      return;
    }

    appendOutput('🤖 AI generating...');
    try {
      const plan = await window.electron.invoke('generate-plan', command);
      if (!Array.isArray(plan)) {
        appendOutput(`🤖 AI error:\n${plan}`);
        return;
      }

      appendOutput('🤖 AI generated:');
      for (const step of plan) {
        appendOutput(`> ${step.command}`);
      }

      for (const step of plan) {
        const result = await window.electron.invoke('run-command', step.command);
        appendOutput(`💬 ${step.command}`);
        appendOutput(result);
      }
    } catch (err) {
      appendOutput(`🤖 AI error:\n❌ ${err.message}`);
    }
  }
}
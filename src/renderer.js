const output = document.getElementById('output');
const input = document.getElementById('input');
const prompt = document.getElementById('prompt');
const toggleModeBtn = document.getElementById('toggleMode');
const toggleAutoBtn = document.getElementById('toggleAuto');
const newSessionBtn = document.getElementById('newSessionBtn');
const runBtn = document.getElementById('runBtn');

let mode = 'HUMAN';
let auto = false;

function appendOutput(text) {
  const div = document.createElement('div');
  div.textContent = text;
  output.appendChild(div);
  output.scrollTop = output.scrollHeight;
}

toggleModeBtn.addEventListener('click', () => {
  mode = mode === 'HUMAN' ? 'AI' : 'HUMAN';
  toggleModeBtn.textContent = mode;
  console.log('Mode toggled:', mode);
});

toggleAutoBtn.addEventListener('click', () => {
  auto = !auto;
  toggleAutoBtn.textContent = `AUTO AI: ${auto ? 'ON' : 'OFF'}`;
  console.log('Auto mode toggled:', auto);
});

newSessionBtn.addEventListener('click', () => {
  output.innerHTML = '';
  console.log('New session started');
});

runBtn.addEventListener('click', () => {
  executeCommand(input.value);
});

input.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    executeCommand(input.value);
  }
});

async function executeCommand(command) {
  if (!command.trim()) return;

  appendOutput(`${prompt.textContent}${command}`);
  input.value = '';

  if (mode === 'HUMAN') {
    const result = await window.api.runCommand(command);
    appendOutput(result);
  } else {
    if (!auto) {
      appendOutput('🤖 AI generated:\n❌ Auto mode is OFF');
      return;
    }

    appendOutput('🤖 AI generating...');
    try {
      const plan = await window.api.generatePlan(command);
      console.log('Received plan from AI:', plan);

      if (!Array.isArray(plan) || plan.length === 0) {
        appendOutput('🤖 AI generated:\n❌ Invalid or empty plan');
        return;
      }

      appendOutput('🤖 AI generated:\n' + plan.map(p => `> ${p.command}`).join('\n'));

      const result = await window.api.runPlan();
      appendOutput(result);
    } catch (err) {
      console.error('AI error:', err);
      appendOutput(`🤖 AI error:\n❌ ${err.message}`);
    }
  }
}
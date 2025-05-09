
const { ipcRenderer } = require('electron');

let currentSession = '';
const sessionStorage = new Map();

const input = document.getElementById('input');
const messages = document.getElementById('messages');
const sessionList = document.getElementById('session-list');
const newSessionButton = document.getElementById('new-session');

function appendMessage(sender, text, isError = false) {
  const msg = document.createElement('div');
  msg.className = 'message-card';
  msg.innerHTML = `<strong>${sender}:</strong><br>${text}`;
  if (isError) msg.style.color = 'red';
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
  if (currentSession) {
    const list = sessionStorage.get(currentSession) || [];
    list.push({ sender, text, isError });
    sessionStorage.set(currentSession, list);
  }
}

function clearMessages() {
  messages.innerHTML = '';
}

function loadSession(name) {
  currentSession = name;
  clearMessages();
  const history = sessionStorage.get(name) || [];
  history.forEach(msg => appendMessage(msg.sender, msg.text, msg.isError));
}

function addSession(name) {
  if (!sessionStorage.has(name)) {
    sessionStorage.set(name, []);
    const li = document.createElement('li');
    li.textContent = name;
    li.style.cursor = 'pointer';
    li.onclick = () => loadSession(name);
    sessionList.appendChild(li);
  }
}

newSessionButton.onclick = () => {
  const name = `Session #${sessionStorage.size + 1}`;
  addSession(name);
  loadSession(name);
};

function sendInput(value) {
  if (value.startsWith('/shell ')) {
    const cmd = value.slice(7).trim();
    appendMessage('You', value);
    ipcRenderer.send('run-shell-command', cmd);
  } else {
    askLocalAI(value);
  }
}

document.getElementById('send').onclick = () => {
  const value = input.value.trim();
  if (value !== '') {
    input.value = '';
    sendInput(value);
  }
};

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const value = input.value.trim();
    if (value !== '') {
      input.value = '';
      sendInput(value);
    }
  }
});

ipcRenderer.on('shell-response', (_, result) => {
  if (result.error) {
    appendMessage('Shell', `<pre>${result.error}</pre>`, true);
  } else {
    appendMessage('Shell', `<pre>${result.output}</pre>`);
  }
});

async function askLocalAI(prompt) {
  appendMessage('You', prompt);
  appendMessage('AI', '⏳ Thinking...');
  try {
    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'codellama', prompt, stream: false })
    });
    const data = await res.json();
    messages.lastChild.innerHTML = `<strong>AI:</strong><br>${data.response}`;
  } catch (err) {
    messages.lastChild.innerHTML = `<strong>AI:</strong><br>❌ Error: ${err.message}`;
  }
}

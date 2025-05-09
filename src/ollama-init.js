const { execSync, spawn } = require('child_process');
const http = require('http');

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureOllamaRunningAndModelReady(model = 'deepseek-coder:latest') {
  let isOllamaRunning = false;

  try {
    const res = await new Promise((resolve, reject) => {
      http.get('http://localhost:11434', res => resolve(res)).on('error', reject);
    });
    isOllamaRunning = res.statusCode === 200;
  } catch (_) {}

  if (!isOllamaRunning) {
    console.log('⏳ Starting Ollama...');
    spawn('ollama', ['serve'], { detached: true, stdio: 'ignore' }).unref();
    await wait(3000);
  }

  const list = execSync('ollama list').toString();
  if (!list.includes(model)) {
    console.log('⬇️ Pulling model: ' + model + '...');
    execSync('ollama pull ' + model, { stdio: 'inherit' });
  } else {
    console.log('✅ Model "' + model + '" is ready.');
  }
}

module.exports = { ensureOllamaRunningAndModelReady };

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');
const { ensureOllamaRunningAndModelReady } = require('./ollama-init');
const { extractAndRunShellCommand } = require('./execCommand');
const { exec } = require('child_process');

let win;

app.whenReady().then(async () => {
  await ensureOllamaRunningAndModelReady();

  win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile(path.join(__dirname, 'index.html'));
});

ipcMain.handle('ask-ollama', async (event, data) => {
  const { prompt, humanAI, autoAI } = data;

  try {
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: "deepseek-coder:latest",
      prompt,
      stream: false,
    });

    const aiText = response.data.response;

    if (!humanAI) return aiText;

    if (autoAI) {
      return new Promise((resolve) => {
        extractAndRunShellCommand(aiText, (err, output) => {
          if (err) return resolve(aiText + "\n\n⚠️ Command error:\n" + err);
          if (output) return resolve(aiText + "\n\n💻 Command output:\n" + output);
          return resolve(aiText);
        });
      });
    } else {
      return aiText; // csak akkor fut, ha manuálisan elindítod
    }

  } catch (err) {
    return '❌ Error: ' + err.message;
  }
});

ipcMain.handle('run-command', async (event, command) => {
  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      if (error) return resolve("⚠️ Error: " + error.message);
      if (stderr) return resolve("⚠️ Stderr: " + stderr);
      return resolve(stdout.trim());
    });
  });
});

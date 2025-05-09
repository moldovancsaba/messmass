const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');

let ollamaProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  win.loadFile('index.html');
  win.webContents.openDevTools();

  // Ollama indítása, ha még nem fut
  ollamaProcess = spawn('/opt/homebrew/bin/ollama', ['serve']);

  ollamaProcess.stdout.on('data', (data) => {
    console.log(`[ollama] ${data}`);
  });

  ollamaProcess.stderr.on('data', (data) => {
    console.error(`[ollama error] ${data}`);
  });

  win.on('closed', () => {
    if (ollamaProcess) ollamaProcess.kill();
  });
}

// Shell parancs kezelése a renderertől
ipcMain.on('run-shell-command', (event, command) => {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      event.reply('shell-response', { error: stderr || error.message });
    } else {
      event.reply('shell-response', { output: stdout });
    }
  });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

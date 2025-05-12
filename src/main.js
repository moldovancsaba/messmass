import { app, BrowserWindow, ipcMain } from 'electron';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { generatePlan } from './ai/generatePlan.js';
import { runPlan } from './ai/runPlan.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('run-command', async (_, command) => {
  return new Promise((resolve) => {
    exec(command, { shell: '/bin/zsh' }, (error, stdout, stderr) => {
      if (error) {
        resolve(`❌ ${stderr || error.message}`);
      } else {
        resolve(stdout.trim());
      }
    });
  });
});

ipcMain.handle('generate-plan', async (_, prompt) => {
  try {
    const plan = await generatePlan(prompt);
    return plan;
  } catch (err) {
    return `❌ ${err.message}`;
  }
});

ipcMain.handle('run-plan', async () => {
  try {
    const result = await runPlan();
    return result;
  } catch (err) {
    return `❌ ${err.message}`;
  }
});
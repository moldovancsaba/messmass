const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  runCommand: (command) => ipcRenderer.invoke('run-command', command),
  generatePlan: (prompt) => ipcRenderer.invoke('generate-plan', prompt),
  runPlan: () => ipcRenderer.invoke('run-plan'),
  getSessions: () => ipcRenderer.invoke('get-sessions'),
  loadSession: (name) => ipcRenderer.invoke('load-session', name),
});
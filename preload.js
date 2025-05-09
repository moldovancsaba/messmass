const { contextBridge, ipcRenderer } = require('electron');

// Expose the API for running terminal commands
contextBridge.exposeInMainWorld('electronAPI', {
  runCommand: (command) => ipcRenderer.invoke('run-command', command)
});

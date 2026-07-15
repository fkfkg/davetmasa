const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  savePrintPdf: (options) => ipcRenderer.invoke('save-print-pdf', options),
});

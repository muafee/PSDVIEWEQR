const { contextBridge, ipcRenderer } = require('electron');

// Exposer des fonctions d'API sécurisées au renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Gestionnaires de fichiers
  openFile: async (filePath) => {
    return await ipcRenderer.invoke('read-file', filePath);
  },
  getFileMetadata: async (filePath) => {
    return await ipcRenderer.invoke('get-file-metadata', filePath);
  },
  generateThumbnail: async (filePath, width, height) => {
    return await ipcRenderer.invoke('generate-thumbnail', filePath, width, height);
  },
  saveFile: async (options) => {
    return await ipcRenderer.invoke('save-file', options);
  },
  showSaveDialog: async (options) => {
    return await ipcRenderer.invoke('show-save-dialog', options);
  },
  
  // Gestionnaires d'événements - voici la partie importante
  onFileOpened: (callback) => {
    ipcRenderer.on('file-opened', (event, filePath) => callback(filePath));
    return () => ipcRenderer.removeListener('file-opened', callback);
  },
  onDirectoryOpened: (callback) => {
    ipcRenderer.on('directory-opened', (event, data) => callback(data));
    return () => ipcRenderer.removeListener('directory-opened', callback);
  },
  
  // Fonctions déclenchées par les menus
  onMenuAction: (action, callback) => {
    ipcRenderer.on(action, callback);
    return () => ipcRenderer.removeListener(action, callback);
  },

  openFileDialog: () => ipcRenderer.send('open-file-dialog'),
  openDirectoryDialog: () => ipcRenderer.send('open-directory-dialog'),
});

console.log('Preload script loaded successfully');
const { contextBridge, ipcRenderer } = require('electron');

// Exposer des fonctions d'API sécurisées au renderer
contextBridge.exposeInMainWorld('electronAPI', {

  getPsdImage: async (filePath) => {
    return await ipcRenderer.invoke('get-psd-image', filePath);
  },
  
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
  
  // Gestionnaires d'événements
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

  // Fonctions utilitaires pour les fichiers
  // Au lieu d'utiliser path directement, nous demandons au processus principal de faire ces opérations
  getBasename: (filePath) => {
    return ipcRenderer.sendSync('get-basename', filePath);
  },
  getExtension: (filePath) => {
    return ipcRenderer.sendSync('get-extension', filePath);
  },

  openFileDialog: () => ipcRenderer.send('open-file-dialog'),
  openDirectoryDialog: () => ipcRenderer.send('open-directory-dialog'),
});

console.log('Preload script loaded successfully');

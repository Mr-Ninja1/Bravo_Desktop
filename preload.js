const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (p) => ipcRenderer.invoke('read-file', p),
  saveFile: (p, content) => ipcRenderer.invoke('save-file', p, content),
  generateFormHtml: (payload) => ipcRenderer.invoke('generate-form-html', payload),
    // Export helpers: export via server-side generator or send a captured PNG to main to save as PDF
    exportFormPdf: (payloadWrapper, opts) => ipcRenderer.invoke('export-form-pdf', payloadWrapper, opts),
  drive: {
    signIn: () => ipcRenderer.invoke('drive-signin'),
    signOut: () => ipcRenderer.invoke('drive-signout'),
    listFiles: (folder) => ipcRenderer.invoke('drive-list', folder),
      listFilesRecursive: (folder) => ipcRenderer.invoke('drive-list-recursive', folder),
    getTemporaryLink: (pathLower) => ipcRenderer.invoke('drive-get-temp-link', pathLower),
    downloadToTemp: (pathLower, hint) => ipcRenderer.invoke('drive-download-temp', pathLower, hint),
      getDebug: () => ipcRenderer.invoke('drive-debug'),
      getAccount: () => ipcRenderer.invoke('drive-account'),
      restoreYear: (year, month) => ipcRenderer.invoke('drive-restore-year', year, month),
      getLocalHistory: () => ipcRenderer.invoke('drive-local-history'),
      deleteLocalForm: (filePath) => ipcRenderer.invoke('delete-local-form', filePath),
  }
  ,
  window: {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window-toggle-maximize'),
    close: () => ipcRenderer.invoke('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
    onMaximized: (cb) => { ipcRenderer.on('window-maximized', cb); },
    onUnmaximized: (cb) => { ipcRenderer.on('window-unmaximized', cb); }
  }
  ,
  updates: {
    onUpdateAvailable: (cb) => { ipcRenderer.on('update-available', (ev, info) => cb(info)); },
    onUpdateDownloaded: (cb) => { ipcRenderer.on('update-downloaded', (ev, info) => cb(info)); },
    applyUpdate: () => ipcRenderer.invoke('apply-update')
  }
});

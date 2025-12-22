const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const shell = require('electron').shell;
// Attempt to load electron-updater if available (safe, non-fatal if missing)
let _autoUpdater = null;
try {
  const updaterPkg = require('electron-updater');
  _autoUpdater = updaterPkg && updaterPkg.autoUpdater ? updaterPkg.autoUpdater : null;
  if (_autoUpdater) {
    _autoUpdater.autoDownload = true;
    _autoUpdater.on('update-available', (info) => {
      try { BrowserWindow.getAllWindows().forEach(w => w.webContents.send('update-available', info)); } catch (e) {}
    });
    _autoUpdater.on('update-downloaded', (info) => {
      try { BrowserWindow.getAllWindows().forEach(w => w.webContents.send('update-downloaded', info)); } catch (e) {}
    });
    _autoUpdater.on('error', (err) => { try { console.warn('auto-updater error', err && err.message ? err.message : err); } catch (e) {} });
  }
} catch (e) {
  try { console.warn('electron-updater not available:', e && e.message ? e.message : e); } catch (ee) {}
}

// Desktop drive bridge
const drive = require('./drive-desktop');

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    // Platform-aware app icon (falls back silently if file missing)
    icon: path.join(__dirname, 'renderer', 'src', 'assets', 'bravo.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  try { attachWindowEvents(win); } catch (e) {}

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  // If electron-updater is available, check for updates when ready
  try {
    if (_autoUpdater && typeof _autoUpdater.checkForUpdatesAndNotify === 'function') {
      _autoUpdater.checkForUpdatesAndNotify().catch(() => {});
    }
  } catch (e) {}

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handler to apply a downloaded update (called from renderer via preload)
ipcMain.handle('apply-update', async () => {
  try {
    if (!_autoUpdater) return { ok: false, error: 'updater-not-available' };
    // quitAndInstall(sync, isSilent) — try to install immediately
    try { _autoUpdater.quitAndInstall(true, true); return { ok: true }; } catch (e) { return { ok: false, error: String(e) }; }
  } catch (e) { return { ok: false, error: String(e) }; }
});

// Window control IPC handlers for custom titlebar
ipcMain.handle('window-minimize', (event) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.minimize();
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
});

ipcMain.handle('window-toggle-maximize', (event) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return { ok: false, error: 'no window' };
    if (win.isMaximized()) win.unmaximize(); else win.maximize();
    return { ok: true, maximized: win.isMaximized() };
  } catch (e) { return { ok: false, error: String(e) }; }
});

ipcMain.handle('window-close', (event) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.close();
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
});

ipcMain.handle('window-is-maximized', (event) => {
  try { const win = BrowserWindow.fromWebContents(event.sender); return { ok: true, maximized: Boolean(win && win.isMaximized && win.isMaximized()) }; } catch (e) { return { ok: false, error: String(e) }; }
});

// Broadcast maximize/unmaximize events from each BrowserWindow
const attachWindowEvents = (win) => {
  try {
    win.on('maximize', () => { try { win.webContents.send('window-maximized'); } catch (e) {} });
    win.on('unmaximize', () => { try { win.webContents.send('window-unmaximized'); } catch (e) {} });
  } catch (e) {}
};

// Simple IPC helpers for future Dropbox / file operations
ipcMain.handle('read-file', async (event, relPath) => {
  const fs = require('fs').promises;
  try {
    const abs = path.isAbsolute(relPath) ? relPath : path.join(__dirname, relPath);
    const data = await fs.readFile(abs, 'utf8');
    return { ok: true, data };
  } catch (e) { return { ok: false, error: String(e) }; }
});

ipcMain.handle('save-file', async (event, relPath, content) => {
  const fs = require('fs').promises;
  try {
    const abs = path.join(__dirname, relPath);
    await fs.writeFile(abs, content, 'utf8');
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
});

// Drive IPC
ipcMain.handle('drive-signin', async () => {
  try {
    const res = await drive.signIn();
    return { ok: true, res };
  } catch (e) { return { ok: false, error: String(e) }; }
});
ipcMain.handle('drive-signout', async () => {
  try { await drive.signOut(); return { ok: true }; } catch (e) { return { ok: false, error: String(e) }; }
});
ipcMain.handle('drive-list', async (event, folder) => {
  try { const r = await drive.listFiles(folder || ''); return { ok: true, entries: r.entries }; } catch (e) { return { ok: false, error: String(e) }; }
});
ipcMain.handle('drive-list-recursive', async (event, folder) => {
  try { const r = await drive.listFilesRecursive(folder || ''); return { ok: true, entries: r.entries }; } catch (e) { return { ok: false, error: String(e) }; }
});
ipcMain.handle('drive-get-temp-link', async (event, pathLower) => {
  try { const link = await drive.getTemporaryLink(pathLower); return { ok: true, link }; } catch (e) { return { ok: false, error: String(e) }; }
});
ipcMain.handle('drive-account', async () => {
  try { const info = await drive.getCurrentAccount(); return { ok: true, info }; } catch (e) { return { ok: false, error: String(e) }; }
});
ipcMain.handle('drive-restore-year', async (event, year, month) => {
  try { const saved = await drive.restoreYear(year, month); return { ok: true, saved }; } catch (e) { return { ok: false, error: String(e) }; }
});
ipcMain.handle('drive-download-temp', async (event, pathLower, hint) => {
  try { const fp = await drive.downloadToTemp(pathLower, hint); return { ok: true, path: fp }; } catch (e) { return { ok: false, error: String(e) }; }
});
ipcMain.handle('drive-debug', async () => {
  try { const info = await drive.getDebugInfo(); return { ok: true, info }; } catch (e) { return { ok: false, error: String(e) }; }
});
ipcMain.handle('drive-local-history', async () => {
  try { const list = await drive.getLocalHistory(); return { ok: true, list }; } catch (e) { return { ok: false, error: String(e) }; }
});

// Generate HTML preview for known form types (run in main so we can require server-side generators)
ipcMain.handle('generate-form-html', async (event, payloadWrapper) => {
  try {
    const p = payloadWrapper && payloadWrapper.payload ? payloadWrapper.payload : payloadWrapper || {};
    const type = (p.formType || p.title || p.name || '').toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    // Try to find a matching exporter under src/exporters/html by filename
    try {
      const fs = require('fs');
      const exportersDir = path.join(__dirname, '..', 'src', 'exporters', 'html');
      const files = fs.readdirSync(exportersDir).filter(f => f && f.toLowerCase().endsWith('.js'));
      for (const f of files) {
        try {
          const base = f.replace(/^generate/i, '').replace(/html\.js$/i, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          if (!base) continue;
          if (type.indexOf(base) !== -1 || base.indexOf(type) !== -1) {
            const modPath = path.join(exportersDir, f);
            const gen = require(modPath);
            // module may export default or module.exports
            const fn = gen && (gen.default || gen) ;
            if (typeof fn === 'function') {
              const html = fn(payloadWrapper);
              return { ok: true, html };
            }
          }
        } catch (e) {
          // continue trying other exporters
          console.warn('generate-form-html: exporter require failed', f, e.message);
        }
      }
    } catch (e) {
      console.warn('generate-form-html: failed to scan exporters', e.message);
    }
    return { ok: false, error: 'No generator for form type' };
  } catch (e) { return { ok: false, error: String(e) }; }
});

// Export a form to PDF (Desktop): generate HTML (using exporters) then render to PDF
ipcMain.handle('export-form-pdf', async (event, payloadWrapper, opts = {}) => {
  try {
    const fs = require('fs');
    const os = require('os');
    const exportersDir = path.join(__dirname, '..', 'src', 'exporters', 'html');
    const p = payloadWrapper && payloadWrapper.payload ? payloadWrapper.payload : payloadWrapper || {};
    const type = (p.formType || p.title || p.name || '').toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    // find exporter
    let html = null;
    try {
      const files = fs.readdirSync(exportersDir).filter(f => f && f.toLowerCase().endsWith('.js'));
      for (const f of files) {
        try {
          const base = f.replace(/^generate/i, '').replace(/html\.js$/i, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          if (!base) continue;
          if (type.indexOf(base) !== -1 || base.indexOf(type) !== -1) {
            const modPath = path.join(exportersDir, f);
            const gen = require(modPath);
            const fn = gen && (gen.default || gen);
            if (typeof fn === 'function') {
              html = fn(payloadWrapper);
              break;
            }
          }
        } catch (e) {
          console.warn('export-form-pdf: exporter require failed', f, e && e.message ? e.message : e);
        }
      }
    } catch (e) {
      console.warn('export-form-pdf: failed to scan exporters', e && e.message ? e.message : e);
    }

    if (!html) return { ok: false, error: 'No generator for form type' };

    // Choose output directory: default under userData/forms, or optionally save to user's Documents
    const userBase = opts && opts.saveToDocuments
      ? path.join(app.getPath('documents') || process.cwd(), 'Bravo_FormsApp  ')
      : path.join(app.getPath('userData') || process.cwd(), 'forms');
    try { fs.mkdirSync(userBase, { recursive: true }); } catch (e) {}
    const baseName = (p.title || p.formType || `form-${Date.now()}`).toString().replace(/[^a-z0-9\-\_\.]/ig, '_');
    const outPath = path.join(userBase, `${baseName}-${Date.now()}.pdf`);

    // Create hidden BrowserWindow to render HTML
    const win = new BrowserWindow({ show: false, webPreferences: { sandbox: false } });
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    // Increase the zoom factor so Chromium rasterizes at higher resolution
    // before printing. A value of 2 improves image/text sharpness in the
    // produced PDF without changing the logical page size.
    try { await win.webContents.setZoomFactor(2); } catch (e) {}

    // Use printToPDF; options: A4, orientation
    const landscape = Boolean(opts.landscape || opts.orientation === 'landscape');
    const pdfOptions = { printBackground: true, landscape, pageSize: 'A4' };
    const data = await win.webContents.printToPDF(pdfOptions);
    await fs.promises.writeFile(outPath, data);
    try { win.destroy(); } catch (e) { /* ignore */ }
    return { ok: true, pdfPath: outPath };
  } catch (e) { return { ok: false, error: String(e) }; }
});

// Accept a captured PNG dataURL from renderer, embed it in a minimal HTML, and print to A4 PDF
ipcMain.handle('save-capture-png-as-pdf', async (event, payload) => {
  try {
    const fs = require('fs');
    const dataUrl = payload && payload.dataUrl;
    if (!dataUrl || !dataUrl.startsWith('data:')) return { ok: false, error: 'Invalid dataUrl' };
    const baseName = (payload && payload.name) ? payload.name.toString().replace(/[^a-z0-9\-\_\.]/ig, '_') : `capture-${Date.now()}`;
    const userDocs = path.join(app.getPath('documents') || process.cwd());
    const outDir = path.join(userDocs, 'Bravo_FormsApp  ');
    try { fs.mkdirSync(outDir, { recursive: true }); } catch (e) {}
    const outPath = path.join(outDir, `${baseName}-${Date.now()}.pdf`);

    // Force the embedded image to fill A4 width so exported forms don't appear tiny
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:0;background:#fff}img{display:block;width:210mm;height:auto}</style></head><body><img src="${dataUrl}"/></body></html>`;

    const win = new BrowserWindow({ show: false, webPreferences: { sandbox: false } });
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    // Increase raster resolution before printing embedded capture
    try { await win.webContents.setZoomFactor(2); } catch (e) {}
    // Decide orientation: prefer explicit flag, else infer from image dimensions
    let landscape = Boolean(payload && payload.landscape);
    try {
      if (!landscape && payload && payload.width && payload.height) landscape = payload.width > payload.height;
    } catch (e) {}
    // Request higher raster scale and no margins so the embedded PNG is
    // rasterized at higher fidelity in the resulting PDF.
    const pdfOptions = { printBackground: true, landscape, pageSize: 'A4', marginsType: 0, scale: 2 };
    const pdf = await win.webContents.printToPDF(pdfOptions);
    await fs.promises.writeFile(outPath, pdf);
    try { win.destroy(); } catch (e) {}
    return { ok: true, pdfPath: outPath };
  } catch (e) { return { ok: false, error: String(e) }; }
});

// Accept multiple captured PNG dataURLs and create a multi-page A4 PDF
ipcMain.handle('save-capture-pages-as-pdf', async (event, payload) => {
  try {
    const fs = require('fs');
    const pages = payload && payload.pages && Array.isArray(payload.pages) ? payload.pages : [];
    if (!pages.length) return { ok: false, error: 'No pages provided' };
    const baseName = (payload && payload.name) ? payload.name.toString().replace(/[^a-z0-9\-\_\.]/ig, '_') : `capture-${Date.now()}`;
    const userDocs = path.join(app.getPath('documents') || process.cwd());
    const outDir = path.join(userDocs, 'Bravo_FormsApp  ');
    try { fs.mkdirSync(outDir, { recursive: true }); } catch (e) {}
    const outPath = path.join(outDir, `${baseName}-${Date.now()}.pdf`);

    // Build HTML with one A4-sized container per page. Each image is set to 210mm width
    // so it fills the page; page-breaks force new pages in printToPDF.
    let body = '';
    pages.forEach((d, idx) => {
      body += `<div style="width:210mm;height:297mm;box-sizing:border-box;overflow:hidden;page-break-after:always;background:#fff"><img src=\"${d}\" style=\"width:210mm;height:auto;display:block;\"/></div>`;
    });
    const html = `<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><style>body{margin:0;padding:0;background:#fff}</style></head><body>${body}</body></html>`;

    const win = new BrowserWindow({ show: false, webPreferences: { sandbox: false } });
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    try { await win.webContents.setZoomFactor(2); } catch (e) {}
    const pdfOptions = { printBackground: true, landscape: Boolean(payload && payload.landscape), pageSize: 'A4' };
    const pdf = await win.webContents.printToPDF(pdfOptions);
    await fs.promises.writeFile(outPath, pdf);
    try { win.destroy(); } catch (e) {}
    return { ok: true, pdfPath: outPath };
  } catch (e) { return { ok: false, error: String(e) }; }
});

// Delete a local imported/restored form entry and remove files
ipcMain.handle('delete-local-form', async (event, filePath) => {
  const fs = require('fs').promises;
  try {
    const abs = path.isAbsolute(filePath) ? filePath : path.join(__dirname, filePath);
    const dir = path.dirname(abs);
    // remove directory recursively
    await fs.rm(dir, { recursive: true, force: true });
    // update history file under userData/forms/history.json
    const userBase = path.join(app.getPath('userData') || process.cwd(), 'forms');
    const historyPath = path.join(userBase, 'history.json');
    try {
      const raw = await fs.readFile(historyPath, 'utf8').catch(() => '[]');
      let list = JSON.parse(raw || '[]');
      list = list.filter(entry => !(entry && entry.meta && entry.meta.filePath && (entry.meta.filePath === filePath || entry.meta.filePath.startsWith(dir))));
      await fs.writeFile(historyPath, JSON.stringify(list));
    } catch (e) {
      console.warn('delete-local-form: failed to update history', e.message);
    }
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
});

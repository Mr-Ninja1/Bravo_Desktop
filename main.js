const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const shell = require('electron').shell;
// Enable electron reload in development for faster iteration
if (process.env.NODE_ENV !== 'production') {
  try {
    require('electron-reload')(__dirname, { electron: require('electron') });
  } catch (e) {
    // ignore if electron-reload isn't installed
  }
}
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

// Centralized export directory names (avoid trailing spaces)
const EXPORT_DIR_NAME = 'Bravo_FormsApp';
const USER_FORMS_SUBDIR = 'forms';

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    // Platform-aware app icon (falls back silently if file missing)
    // Prefer root-level branded icon for packaged builds
    icon: path.join(__dirname, 'assets', 'bravo.ico'),
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

      // Build a set of candidate strings from multiple payload fields to improve matching
      const candidates = [];
      const pushNorm = (v) => {
        if (!v) return;
        try { const s = String(v).replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); if (s) candidates.push(s); } catch (e) {}
      };
      pushNorm(p.title);
      pushNorm(p.formType);
      pushNorm(p.formTypeName);
      pushNorm(p.name);
      pushNorm(p.metadata && p.metadata.subject);
      pushNorm(p.metadata && p.metadata.location);

      // Add heuristic candidates for common keywords
      const rawTitle = (p.title || p.formType || p.name || '').toString().toLowerCase();
      if (rawTitle.includes('kitchen') && (rawTitle.includes('sanitiz') || rawTitle.includes('clean'))) candidates.push('kitchendailycleaning');
      if (rawTitle.includes('food contact') || rawTitle.includes('foodcontact')) candidates.push('kitchendailycleaning');
      // Food Handlers / Handwashing heuristics
      if (rawTitle.includes('food handlers') || rawTitle.includes('foodhandlers') || rawTitle.includes('handwashing') || rawTitle.includes('hand wash')) {
        candidates.push('foodhandlers');
        candidates.push('foodhandlersdailyhandwashing');
      }
      // PPE / Personal Protective Equipment heuristics
      if (rawTitle.includes('ppe') || rawTitle.includes('personal') || rawTitle.includes('protect')) {
        candidates.push('ppe');
        candidates.push('person alprotectiveequipment'.replace(/\s+/g,''));
      }

      // Try to find a matching exporter under src/exporters/html by filename using any candidate
      try {
        const fs = require('fs');
        const exportersDir = path.join(__dirname, 'src', 'exporters', 'html');
        const files = fs.readdirSync(exportersDir).filter(f => f && f.toLowerCase().endsWith('.js'));
        // scoring function: prefer exact matches, then longer common substrings
        const longestCommonSubstring = (a, b) => {
          if (!a || !b) return 0;
          const m = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(0));
          let longest = 0;
          for (let i = 0; i < a.length; i++) {
            for (let j = 0; j < b.length; j++) {
              if (a[i] === b[j]) {
                m[i+1][j+1] = m[i][j] + 1;
                if (m[i+1][j+1] > longest) longest = m[i+1][j+1];
              }
            }
          }
          return longest;
        };

        let best = { score: 0, file: null };
        for (const f of files) {
          try {
            const base = f.replace(/^generate/i, '').replace(/html\.js$/i, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            if (!base) continue;
            let score = 0;
            for (const c of candidates) {
              if (!c) continue;
              if (c === base) {
                score += 10000; // exact match wins
              } else if (c.indexOf(base) !== -1 || base.indexOf(c) !== -1) {
                score += 100 + Math.max(base.length, c.length);
              } else {
                score += longestCommonSubstring(base, c);
              }
            }
            if (score > best.score) best = { score, file: f };
          } catch (e) {
            console.warn('generate-form-html: exporter scoring failed', f, e && e.message ? e.message : e);
          }
        }
        if (best.file) {
          try {
            const modPath = path.join(exportersDir, best.file);
            try { delete require.cache[require.resolve(modPath)]; } catch (e) {}
            const gen = require(modPath);
            const fn = gen && (gen.default || gen);
            if (typeof fn === 'function') {
              const html = fn(payloadWrapper);
              return { ok: true, html };
            }
          } catch (e) {
            console.warn('generate-form-html: exporter require failed', best.file, e && e.message ? e.message : e);
          }
        }
      } catch (e) {
        console.warn('generate-form-html: failed to scan exporters', e && e.message ? e.message : e);
      }
      return { ok: false, error: 'No generator for form type' };
  } catch (e) { return { ok: false, error: String(e) }; }
});

// Export a form to PDF (Desktop): generate HTML (using exporters) then render to PDF
ipcMain.handle('export-form-pdf', async (event, payloadWrapper, opts = {}) => {
  try {
    const fs = require('fs');
    const os = require('os');
    const exportersDir = path.join(__dirname, 'src', 'exporters', 'html');
    const p = payloadWrapper && payloadWrapper.payload ? payloadWrapper.payload : payloadWrapper || {};
    const type = (p.formType || p.title || p.name || '').toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    // find exporter using multiple payload fields and heuristics
    let html = null;
    try {
      const candidates = [];
      const pushNorm = (v) => { if (!v) return; try { const s = String(v).replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); if (s) candidates.push(s); } catch (e) {} };
      pushNorm(p.title); pushNorm(p.formType); pushNorm(p.formTypeName); pushNorm(p.name); pushNorm(p.metadata && p.metadata.subject); pushNorm(p.metadata && p.metadata.location);
      const rawTitle = (p.title || p.formType || p.name || '').toString().toLowerCase();
      if (rawTitle.includes('kitchen') && (rawTitle.includes('sanitiz') || rawTitle.includes('clean'))) candidates.push('kitchendailycleaning');
      if (rawTitle.includes('food contact') || rawTitle.includes('foodcontact')) candidates.push('kitchendailycleaning');
      // Food Handlers / Handwashing heuristics
      if (rawTitle.includes('food handlers') || rawTitle.includes('foodhandlers') || rawTitle.includes('handwashing') || rawTitle.includes('hand wash')) {
        candidates.push('foodhandlers');
        candidates.push('foodhandlersdailyhandwashing');
      }
      // PPE / Personal Protective Equipment heuristics
      if (rawTitle.includes('ppe') || rawTitle.includes('personal') || rawTitle.includes('protect')) {
        candidates.push('ppe');
        candidates.push('personalprotectiveequipment');
      }

      const files = fs.readdirSync(exportersDir).filter(f => f && f.toLowerCase().endsWith('.js'));
      // scoring-based selection (prefer exact match, then stronger overlaps)
      const longestCommonSubstring = (a, b) => {
        if (!a || !b) return 0;
        const m = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(0));
        let longest = 0;
        for (let i = 0; i < a.length; i++) {
          for (let j = 0; j < b.length; j++) {
            if (a[i] === b[j]) {
              m[i+1][j+1] = m[i][j] + 1;
              if (m[i+1][j+1] > longest) longest = m[i+1][j+1];
            }
          }
        }
        return longest;
      };

      let best = { score: 0, file: null };
      for (const f of files) {
        try {
          const base = f.replace(/^generate/i, '').replace(/html\.js$/i, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          if (!base) continue;
          let score = 0;
          for (const c of candidates) {
            if (!c) continue;
            if (c === base) {
              score += 10000;
            } else if (c.indexOf(base) !== -1 || base.indexOf(c) !== -1) {
              score += 100 + Math.max(base.length, c.length);
            } else {
              score += longestCommonSubstring(base, c);
            }
          }
          if (score > best.score) best = { score, file: f };
        } catch (e) {
          console.warn('export-form-pdf: exporter scoring failed', f, e && e.message ? e.message : e);
        }
      }
      if (best.file) {
        try {
          const modPath = path.join(exportersDir, best.file);
          try { delete require.cache[require.resolve(modPath)]; } catch (e) {}
          const gen = require(modPath);
          const fn = gen && (gen.default || gen);
          if (typeof fn === 'function') html = fn(payloadWrapper);
        } catch (e) {
          console.warn('export-form-pdf: exporter require failed', best.file, e && e.message ? e.message : e);
        }
      }
    } catch (e) {
      console.warn('export-form-pdf: failed to scan exporters', e && e.message ? e.message : e);
    }

    if (!html) return { ok: false, error: 'No generator for form type' };

    // Choose output directory: default under userData/forms, or optionally save to user's Documents
    const exportBase = opts && opts.saveToDocuments
      ? path.join(app.getPath('documents') || process.cwd(), EXPORT_DIR_NAME)
      : path.join(app.getPath('userData') || process.cwd(), USER_FORMS_SUBDIR);
    try { fs.mkdirSync(exportBase, { recursive: true }); } catch (e) {}
    const baseName = (p.title || p.formType || `form-${Date.now()}`).toString().replace(/[^a-z0-9\-\_\.]/ig, '_');
    const outPath = path.join(exportBase, `${baseName}-${Date.now()}.pdf`);
    const win = new BrowserWindow({ show: false, webPreferences: { sandbox: false } });
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    // Increase the zoom factor so Chromium rasterizes at higher resolution
    // before printing. A value of 2 improves image/text sharpness in the
    // produced PDF without changing the logical page size.
    try { await win.webContents.setZoomFactor(2); } catch (e) {}

    // Use printToPDF; default to landscape for all exports unless caller overrides
    const landscape = (opts && typeof opts.landscape === 'boolean') ? opts.landscape : true;
    const pdfOptions = { printBackground: true, landscape, pageSize: 'A4' };
    const data = await win.webContents.printToPDF(pdfOptions);
    await fs.promises.writeFile(outPath, data);
    try { win.destroy(); } catch (e) { /* ignore */ }
    return { ok: true, pdfPath: outPath };
  } catch (e) { return { ok: false, error: String(e) }; }
});

// Accept a captured PNG dataURL from renderer, embed it in a minimal HTML, and print to A4 PDF
// Legacy capture-to-pdf handlers removed to enforce server-side printToPDF exporter only.

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

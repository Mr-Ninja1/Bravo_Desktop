const { app, shell } = require('electron');
const http = require('http');
const url = require('url');
const crypto = require('crypto');
const keytar = require('keytar');
const fs = require('fs').promises;
const path = require('path');

const TOKEN_ENDPOINT = 'https://api.dropboxapi.com/oauth2/token';
const API_BASE = 'https://api.dropboxapi.com/2';
const TEMP_LINK_ENDPOINT = `${API_BASE}/files/get_temporary_link`;

// Read Dropbox app key: prefer a local Desktop/app.json, then fall back to
// the parent (mobile) app.json. Environment variable `DROPBOX_APP_KEY`
// still takes highest precedence.
let DROPBOX_APP_KEY = process.env.DROPBOX_APP_KEY || null;
try {
  // prefer local Desktop/app.json so the desktop app can be independent
  const local = path.join(__dirname, 'app.json');
  let raw = null;
  try { raw = require(local); } catch (e) { raw = null; }
  if (raw) {
    const localKey = raw && raw.expo && raw.expo.extra && raw.expo.extra.dropboxAppKey;
    // ignore obvious placeholder values so desktop can fall back to parent config
    const isPlaceholder = (k) => !k || (typeof k === 'string' && (/REPLACE|<SET|YOUR_/i.test(k) || k.trim() === ''));
    if (!isPlaceholder(localKey)) {
      DROPBOX_APP_KEY = DROPBOX_APP_KEY || localKey;
    } else {
      // fallback: try parent app.json (mobile)
      try {
        const root = path.join(__dirname, '..', 'app.json');
        const parentRaw = require(root);
        const parentKey = parentRaw && parentRaw.expo && parentRaw.expo.extra && parentRaw.expo.extra.dropboxAppKey;
          if (!isPlaceholder(parentKey)) {
            DROPBOX_APP_KEY = DROPBOX_APP_KEY || parentKey;
            // Persist a minimal Desktop/app.json so Desktop has a stable copy
            try {
              const localPath = path.join(__dirname, 'app.json');
              const payload = { expo: { name: 'ChecklistApp Desktop', extra: { dropboxAppKey: parentKey } } };
              // write asynchronously; ignore errors
              fs.writeFile(localPath, JSON.stringify(payload, null, 2)).catch(() => {});
            } catch (e) { /* ignore write failures */ }
          }
      } catch (e) {
        // ignore
      }
    }
  } else {
    // If no local file was found, try parent app.json
    try {
      const root = path.join(__dirname, '..', 'app.json');
      const parentRaw = require(root);
      const parentKey = parentRaw && parentRaw.expo && parentRaw.expo.extra && parentRaw.expo.extra.dropboxAppKey;
      if (parentKey && typeof parentKey === 'string' && parentKey.trim()) DROPBOX_APP_KEY = DROPBOX_APP_KEY || parentKey;
    } catch (e) {}
  }
} catch (e) {
  // ignore overall lookup errors
}

const SERVICE = 'checklistapp-desktop';
const ACC_TOKEN = 'dropbox_access_token';
const REFRESH_TOKEN = 'dropbox_refresh_token';
const EXPIRES_AT = 'dropbox_expires_at';

function base64UrlEncodeFromBuffer(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function sha256Base64Url(input) {
  const hash = crypto.createHash('sha256').update(input).digest();
  return base64UrlEncodeFromBuffer(hash);
}

async function setToken(k, v) { await keytar.setPassword(SERVICE, k, String(v)); }
async function getToken(k) { return keytar.getPassword(SERVICE, k); }
async function deleteToken(k) { try { await keytar.deletePassword(SERVICE, k); } catch (e) {} }

async function getAccessToken() {
  const token = await getToken(ACC_TOKEN);
  const exp = await getToken(EXPIRES_AT);
  if (!token) return null;
  if (exp && Number(exp) < Date.now()) {
    const refreshed = await refreshAccessToken().catch(() => null);
    return refreshed;
  }
  return token;
}

async function refreshAccessToken() {
  const refresh = await getToken(REFRESH_TOKEN);
  if (!refresh) return null;
  const client_id = DROPBOX_APP_KEY;
  if (!client_id) throw new Error('DROPBOX_APP_KEY not configured');
  const body = new URLSearchParams();
  body.append('grant_type', 'refresh_token');
  body.append('refresh_token', refresh);
  body.append('client_id', client_id);
  const res = await fetch(TOKEN_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`refresh failed: ${res.status} ${txt}`);
  }
  const data = await res.json();
  const { access_token, expires_in, refresh_token } = data;
  if (!access_token) throw new Error('no access_token in refresh response');
  const expiresAt = expires_in ? Date.now() + Number(expires_in) * 1000 : Date.now() + 3600 * 1000;
  await setToken(ACC_TOKEN, access_token);
  await setToken(EXPIRES_AT, String(expiresAt));
  if (refresh_token) await setToken(REFRESH_TOKEN, refresh_token);
  return access_token;
}

// PKCE sign-in: returns { access_token, refresh_token, expiresAt }
async function signIn() {
  const client_id = DROPBOX_APP_KEY;
  if (!client_id) throw new Error('DROPBOX_APP_KEY not configured in app.json or environment');

  // code verifier
  const codeVerifier = base64UrlEncodeFromBuffer(crypto.randomBytes(64));
  const codeChallenge = sha256Base64Url(codeVerifier);

  // create local HTTP server on fixed port 3000 (must match Dropbox registered redirect URI)
  const PORT = 3000;
  const server = http.createServer();
  const listenPromise = new Promise((resolve, reject) => {
    // Listen on all interfaces so redirects to localhost or 127.0.0.1 both work
    server.listen(PORT, () => {
      resolve();
    });
    server.on('error', (err) => {
      console.error('OAuth server error', err);
      reject(err);
    });
  });
  await listenPromise;
  const redirectUri = `http://127.0.0.1:${PORT}/auth`;

  const authUrl = `https://www.dropbox.com/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(client_id)}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256&token_access_type=offline&scope=${encodeURIComponent('files.content.read files.content.write account_info.read')}`;

  // open system browser
  await shell.openExternal(authUrl);

  const codePromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error('Auth timeout'));
    }, 120000);

    server.on('request', async (req, res) => {
          try { /* oauth request received */ } catch (e) {}
      try {
        const u = url.parse(req.url, true);
        if (u.pathname === '/auth' && u.query && u.query.code) {
          const code = u.query.code;
          // respond to browser
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body><h2>Authentication successful. You may close this window.</h2></body></html>');
          clearTimeout(timeout);
          try { server.close(); } catch (e) {}
          resolve(code);
        } else {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Missing code');
        }
      } catch (e) {
        try { res.writeHead(500); res.end('Error'); } catch (e2) {}
        clearTimeout(timeout);
        try { server.close(); } catch (e2) {}
        reject(e);
      }
    });
  });

  const code = await codePromise;

  // exchange code
  const body = new URLSearchParams();
  body.append('grant_type', 'authorization_code');
  body.append('code', code);
  body.append('client_id', client_id);
  body.append('redirect_uri', redirectUri);
  body.append('code_verifier', codeVerifier);

  const tokenRes = await fetch(TOKEN_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
  if (!tokenRes.ok) {
    const txt = await tokenRes.text().catch(() => '');
    throw new Error(`Token exchange failed: ${tokenRes.status} ${txt}`);
  }
  const tokens = await tokenRes.json();
  const { access_token, refresh_token, expires_in } = tokens;
  const expiresAt = expires_in ? Date.now() + Number(expires_in) * 1000 : Date.now() + 3600 * 1000;
  await setToken(ACC_TOKEN, access_token);
  if (refresh_token) await setToken(REFRESH_TOKEN, refresh_token);
  await setToken(EXPIRES_AT, String(expiresAt));
  return { access_token, refresh_token, expiresAt };
}

async function signOut() {
  await deleteToken(ACC_TOKEN);
  await deleteToken(REFRESH_TOKEN);
  await deleteToken(EXPIRES_AT);
  return true;
}

async function listFiles(folder = '') {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in');
  const res = await fetch(`${API_BASE}/files/list_folder`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ path: folder || '', recursive: false, limit: 500 }) });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`list failed: ${res.status} ${txt}`);
  }
  const data = await res.json();
  // normalize entries
  const entries = (data.entries || []).map(e => ({ id: e.id, name: e.name, path_lower: e.path_lower, server_modified: e.server_modified || e.client_modified || null, size: e.size || 0, raw: e }));
  return { entries };
}

// List files recursively under a folder (handles pagination)
async function listFilesRecursive(folder = '') {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in');
  const entries = [];
  const callList = async (body) => {
    const res = await fetch(`${API_BASE}/files/list_folder`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`list failed: ${res.status} ${txt}`);
    }
    return res.json();
  };
  let data = await callList({ path: folder || '', recursive: true, limit: 1000 });
  (data.entries || []).forEach(e => entries.push(e));
  while (data.has_more) {
    const cont = await fetch(`${API_BASE}/files/list_folder/continue`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ cursor: data.cursor }) });
    if (!cont.ok) { const txt = await cont.text().catch(() => ''); throw new Error(`list continue failed: ${cont.status} ${txt}`); }
    data = await cont.json();
    (data.entries || []).forEach(e => entries.push(e));
  }
  // normalize
  const norm = entries.map(e => ({ id: e.id, name: e.name, path_lower: e.path_lower, server_modified: e.server_modified || e.client_modified || null, size: e.size || 0, raw: e }));
  return { entries: norm };
}

async function getTemporaryLink(pathLower) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in');
  const res = await fetch(TEMP_LINK_ENDPOINT, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ path: pathLower }) });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`temp link failed: ${res.status} ${txt}`);
  }
  const data = await res.json();
  return data.link || null;
}

async function downloadToTemp(pathLower, filenameHint) {
  const link = await getTemporaryLink(pathLower);
  if (!link) throw new Error('No temporary link');
  const res = await fetch(link);
  if (!res.ok) throw new Error('Download failed');
  const buffer = await res.arrayBuffer();
  const tmpDir = app.getPath('temp') || os.tmpdir();
  const fn = filenameHint || `download-${Date.now()}`;
  const outPath = path.join(tmpDir, fn);
  await fs.writeFile(outPath, Buffer.from(buffer));
  return outPath;
}

async function getDebugInfo() {
  const rt = await getToken(REFRESH_TOKEN);
  return { clientId: DROPBOX_APP_KEY || null, hasRefreshToken: Boolean(rt) };
}

async function getCurrentAccount() {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in');
  const res = await fetch('https://api.dropboxapi.com/2/users/get_current_account', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`account fetch failed: ${res.status} ${txt}`);
  }
  const data = await res.json();
  return data;
}

// Restore all files found under a year folder (e.g. '/2025') into userData/restored/<year>/<MM>/<DD>
async function restoreYear(year, month) {
  if (!year) throw new Error('year required');
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in');

  // List all files under the app/master root and filter by year/month.
  const listed = await listFilesRecursive('').catch(e => { throw e; });
  const targetYear = String(year);
  const targetMonth = month ? String(month).padStart(2, '0') : null;

  const candidates = (listed.entries || []).filter(e => e.raw && e.raw['.tag'] === 'file').filter(e => {
    try {
      // Prefer server_modified when available
      if (e.server_modified) {
        const d = new Date(e.server_modified);
        if (!isNaN(d.getTime())) {
          if (String(d.getFullYear()) !== targetYear) return false;
          if (targetMonth && String(d.getMonth() + 1).padStart(2, '0') !== targetMonth) return false;
          return true;
        }
      }
      // Fallback: try to parse a YYYY-MM-DD segment from the path
      const p = e.path_lower || e.path_display || '';
      const segs = (p || '').split('/').filter(Boolean);
      for (const seg of segs) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(seg)) {
          if (!seg.startsWith(targetYear)) return false;
          if (targetMonth && seg.indexOf(`-${targetMonth}-`) === -1) return false;
          return true;
        }
      }
      return false;
    } catch (err) { return false; }
  });

  const saved = [];
  for (const f of candidates) {
    try {
      // Download remote file content via Dropbox content/download endpoint
      const contentRes = await fetch('https://content.dropboxapi.com/2/files/download', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Dropbox-API-Arg': JSON.stringify({ path: f.path_lower || f.path_display }) },
      });
      if (!contentRes.ok) {
        const txt = await contentRes.text().catch(() => '');
        console.warn('restoreYear: download failed for', f.path_lower, txt);
        continue;
      }
      const text = await contentRes.text();
      let payload = null;
      try { payload = JSON.parse(text); } catch (e) { payload = text; }

      // Normalize wrapped payload like mobile: { payload, savedAt }
      const wrapped = (payload && payload.payload) ? payload : { payload, savedAt: f.server_modified ? new Date(f.server_modified).getTime() : Date.now() };

      // Choose a stable formId
      const candidateId = f.id ? `dbx_${String(f.id).replace(/:/g, '_')}` : `dbx_${Date.now()}`;
      // Import into desktop userData forms dir and register history
      try {
        const imp = await importFormToUserData(candidateId, wrapped).catch(err => { throw err; });
        saved.push({ name: f.name, path: imp.filePath, formId: imp.formId });
      } catch (err) {
        console.warn('restoreYear: import failed for', f.path_lower, String(err));
      }
    } catch (e) {
      console.warn('restoreYear: failed for', f.path_lower, String(e));
    }
  }
  return saved;
}

// Import a wrapped payload into desktop userData forms directory and add history entry
async function importFormToUserData(formId, wrappedPayload) {
  const userBase = path.join(app.getPath('userData') || process.cwd(), 'forms');
  const id = formId || `import_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const dir = path.join(userBase, String(id));
  const filePath = path.join(dir, 'payload.json');
  try {
    await fs.mkdir(dir, { recursive: true });
    const wrapped = wrappedPayload || { payload: null, savedAt: Date.now() };
    await fs.writeFile(filePath, JSON.stringify(wrapped));

    // Build history entry and persist
    const historyEntry = {
      title: (wrapped.payload && (wrapped.payload.title || wrapped.payload.formType)) ? String((wrapped.payload.title || wrapped.payload.formType)) : 'Imported Form',
      date: wrapped.payload && wrapped.payload.date ? wrapped.payload.date : null,
      shift: wrapped.payload && wrapped.payload.shift ? wrapped.payload.shift : null,
      savedAt: wrapped.savedAt || Date.now(),
      _preserveSavedAt: true,
      meta: { formId: id, filePath, payload: wrapped.payload },
    };
    try { await addFormHistoryDesktop(historyEntry); } catch (e) { console.warn('addFormHistoryDesktop failed', e); }
    return { filePath, formId: id };
  } catch (err) {
    console.error('importFormToUserData error', err);
    throw err;
  }
}

// Append/update history file in userData/forms/history.json (preserve similar semantics to mobile)
async function addFormHistoryDesktop(entry) {
  if (!entry || typeof entry !== 'object') return;
  const userBase = path.join(app.getPath('userData') || process.cwd(), 'forms');
  const historyPath = path.join(userBase, 'history.json');
  try {
    await fs.mkdir(userBase, { recursive: true });
    let list = [];
    try {
      const raw = await fs.readFile(historyPath, 'utf8').catch(() => '[]');
      list = JSON.parse(raw || '[]');
    } catch (e) { list = []; }
    const normalized = Object.assign({}, entry);
    // dedupe by meta.filePath or savedAt
    const idx = list.findIndex(f => (f.meta && f.meta.filePath && normalized.meta && normalized.meta.filePath && f.meta.filePath === normalized.meta.filePath) || (f.savedAt && normalized.savedAt && f.savedAt === normalized.savedAt));
    if (idx >= 0) list.splice(idx, 1, normalized); else list.push(normalized);
    const MAX_HISTORY = 200;
    while (list.length > MAX_HISTORY) list.shift();
    await fs.writeFile(historyPath, JSON.stringify(list));
    return list;
  } catch (e) {
    console.warn('addFormHistoryDesktop failed', e);
    throw e;
  }
}

// (keep only the month-aware restoreYear implementation above)

module.exports = {
  signIn,
  signOut,
  getAccessToken,
  refreshAccessToken,
  listFiles,
  listFilesRecursive,
  getTemporaryLink,
  downloadToTemp,
  getDebugInfo,
  getCurrentAccount,
  restoreYear,
  getLocalHistory,
};

// Read local history written under userData/forms/history.json
async function getLocalHistory() {
  const userBase = path.join(app.getPath('userData') || process.cwd(), 'forms');
  const historyPath = path.join(userBase, 'history.json');
  try {
    const raw = await fs.readFile(historyPath, 'utf8').catch(() => '[]');
    const list = JSON.parse(raw || '[]');
    return list;
  } catch (e) {
    console.warn('getLocalHistory failed', e);
    return [];
  }
}

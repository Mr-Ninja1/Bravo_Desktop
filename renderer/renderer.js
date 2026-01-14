// Simplified renderer: show only year cards in sidebar

const splash = document.getElementById('splash');
const main = document.getElementById('main');
const loadingMsg = document.getElementById('loadingMsg');
let connectBtn = null;
const refreshBtn = document.getElementById('refreshList');
const yearSidebar = document.getElementById('yearSidebar');
// iframe removed from the layout; keep null so guarded checks are inert
const previewFrame = null;
let downloadBtn = null;
const searchInput = document.getElementById('searchInput');
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const sidebarEdge = document.getElementById && document.getElementById('sidebarEdge');
const winMinBtn = document.getElementById && document.getElementById('winMin');
const winMaxBtn = document.getElementById && document.getElementById('winMax');
const winCloseBtn = document.getElementById && document.getElementById('winClose');
let dropboxIcon = null;
let dropboxStatusEls = [];
let disconnectBtn = null;

// --- Simple local trial / product-key gating
const LICENSE_KEY = 'bravo_license_v1';
const TRIAL_DAYS = 5; // configurable trial length (days)
// URL to a public JSON file listing issued keys. Set to your repo raw URL.
const KEYS_JSON_URL = 'https://raw.githubusercontent.com/Mr-Ninja1/Bravo_Desktop/main/keys.json';
// Default purchase landing page (GitHub Pages) — override with window.__PURCHASE_URL if needed
try { if (typeof window !== 'undefined' && !window.__PURCHASE_URL) window.__PURCHASE_URL = 'https://Mr-Ninja1.github.io/Bravo_Desktop/'; } catch (e) {}

// Helper to open the purchase landing page with optional query params (adds from=app by default)
function openPurchasePage(params) {
  try {
    const base = (typeof window !== 'undefined' && window.__PURCHASE_URL) ? window.__PURCHASE_URL : (PURCHASE_URL || 'https://example.com/buy');
    let url;
    try { url = new URL(base); } catch (e) { url = new URL(base, window.location.origin); }
    const p = Object.assign({ from: 'app' }, (params || {}));
    Object.keys(p).forEach(k => { try { if (typeof p[k] !== 'undefined' && p[k] !== null) url.searchParams.set(k, String(p[k])); } catch (e) {} });
    const s = url.toString();
    if (window.electronAPI && typeof window.electronAPI.openExternal === 'function') return window.electronAPI.openExternal(s);
    try { window.open(s, '_blank'); } catch (e) {}
  } catch (e) { console.warn('openPurchasePage failed', e); }
}

// Helper: create a small premium badge element
function createPremiumBadge() {
  try {
    const b = document.createElement('span');
    b.className = 'premiumBadge';
    b.innerText = 'Premium';
    b.style.display = 'inline-block';
    b.style.marginLeft = '8px';
    b.style.padding = '4px 8px';
    b.style.fontSize = '12px';
    b.style.fontWeight = '700';
    b.style.color = '#06283D';
    b.style.background = 'linear-gradient(90deg,#ffd166,#ff7b7b)';
    b.style.borderRadius = '999px';
    b.style.boxShadow = '0 6px 18px rgba(255,160,120,0.12)';
    return b;
  } catch (e) { return null; }
}

// Validate a provided key against a hosted keys.json file.
async function validateKeyOnline(key, url) {
  try {
    if (!url || !key) return { found: false };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res || !res.ok) return { found: false };
    const data = await res.json().catch(() => null);
    if (!data) return { found: false };
    const list = Array.isArray(data) ? data : (data.keys || data.list || []);
    const rec = (list || []).find(k => (k && (k.key === key || k.code === key)));
    if (!rec) return { found: false };
    return { found: true, used: !!rec.used, record: rec };
  } catch (e) { return { found: false }; }
}
function _loadLicense() {
  try {
    const raw = localStorage.getItem(LICENSE_KEY);
    if (!raw) return { trialStart: null, unlockedFeatures: {}, productKey: null };
    return JSON.parse(raw || '{}');
  } catch (e) { return { trialStart: null, unlockedFeatures: {}, productKey: null }; }
}
function _saveLicense(obj) { try { localStorage.setItem(LICENSE_KEY, JSON.stringify(obj || {})); } catch (e) {} }
function licenseInit() {
  try {
    const s = _loadLicense();
    if (!s.trialStart) { s.trialStart = (new Date()).toISOString(); _saveLicense(s); }
    return s;
  } catch (e) { return _loadLicense(); }
}
const _licenseState = licenseInit();
function isTrialExpired() {
  try {
    if (_licenseState.productKey) return false;
    const start = _licenseState.trialStart ? new Date(_licenseState.trialStart) : null;
    if (!start) return false;
    const expiry = new Date(start.getTime() + (TRIAL_DAYS * 24 * 60 * 60 * 1000));
    return new Date() > expiry;
  } catch (e) { return true; }
}
function isFeatureEnabled(feature) {
  try {
    if (_licenseState.productKey) return true;
    if (_licenseState.unlockedFeatures && _licenseState.unlockedFeatures[feature]) return true;
    return !isTrialExpired();
  } catch (e) { return false; }
}
function unlockAllWithKey(key) {
  try {
    if (!key) return false;
    _licenseState.productKey = String(key);
    _licenseState.unlockedFeatures = _licenseState.unlockedFeatures || {};
    _licenseState.unlockedFeatures['batchExport'] = true;
    _licenseState.unlockedFeatures['openToday'] = true;
    _licenseState.unlockedFeatures['storageCard'] = true;
    _licenseState.unlockedFeatures['userCard'] = true;
    _licenseState.unlockedFeatures['totalCard'] = true;
    _licenseState.unlockedFeatures['securityCard'] = true;
    _saveLicense(_licenseState);
    return true;
  } catch (e) { return false; }
}
function showTrialExpiredModal(featureReadable) {
  try {
    const PURCHASE_URL = (typeof window !== 'undefined' && window.__PURCHASE_URL) ? window.__PURCHASE_URL : 'https://example.com/buy';
    const overlay = document.createElement('div'); overlay.className = 'modalOverlay';
    overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(0,0,0,0.6)'; overlay.style.setProperty('z-index', '2000000', 'important');
    const box = document.createElement('div'); box.className = 'modalBox'; box.style.minWidth = '380px'; box.style.maxWidth = '92%'; box.style.padding = '18px'; box.style.position = 'relative'; box.style.background = '#0b1220'; box.style.color = '#fff'; box.style.borderRadius = '10px'; box.style.setProperty('z-index', '2000001', 'important');
    const h = document.createElement('div'); h.style.fontWeight = '800'; h.style.marginBottom = '8px'; h.style.fontSize = '16px'; h.style.color = '#fff'; h.innerText = `${featureReadable} — Expired`;
    const p = document.createElement('div'); p.style.color = '#e6eefc'; p.style.marginBottom = '12px'; p.style.lineHeight = '1.4';
    p.innerText = "Buy the key from the developer's website or contact the developer directly. Press the 'Buy' button to purchase the key. To activate: click 'Enter key', paste your key, then press 'ACTIVATE'.";

    // Reminder about premium features and author's ideas
    const reminder = document.createElement('div');
    reminder.style.marginTop = '12px';
    reminder.style.padding = '10px';
    reminder.style.background = 'rgba(255,255,255,0.02)';
    reminder.style.border = '1px solid rgba(255,255,255,0.03)';
    reminder.style.borderRadius = '8px';
    reminder.style.color = '#cfeeff';
    reminder.innerHTML = '<strong>About premium features</strong><div style="margin-top:6px;font-size:13px;color:#dff6ff">Many of the premium features are ideas and productivity improvements added by the developer. They are available during the trial so you can evaluate them. After the 7-day trial these features will stop working unless activated. You can choose to keep or discard them after trying.</div>';
    const viewAgreementBtn = document.createElement('button'); viewAgreementBtn.innerText = 'View Agreement'; viewAgreementBtn.className = 'glowBtn'; viewAgreementBtn.style.marginTop = '8px';
    viewAgreementBtn.addEventListener('click', () => { try { if (typeof showAgreementModal === 'function') showAgreementModal(true); } catch (e) {} });
    reminder.appendChild(viewAgreementBtn);

    // inline entry area (hidden until requested)
    const entryWrap = document.createElement('div'); entryWrap.style.display = 'none'; entryWrap.style.marginTop = '8px';
    const keyInput = document.createElement('input'); keyInput.type = 'text'; keyInput.placeholder = 'Enter product key here'; keyInput.style.width = '100%'; keyInput.style.padding = '8px'; keyInput.style.borderRadius = '6px'; keyInput.style.border = '1px solid rgba(255,255,255,0.12)'; keyInput.style.background = 'transparent'; keyInput.style.color = '#fff'; keyInput.style.boxSizing = 'border-box';
    keyInput.style.marginBottom = '8px';
    const keyActions = document.createElement('div'); keyActions.style.display = 'flex'; keyActions.style.justifyContent = 'flex-end'; keyActions.style.gap = '8px';
    const validateBtn = document.createElement('button'); validateBtn.className = 'glowBtn'; validateBtn.innerText = 'ACTIVATE';
    const cancelEntry = document.createElement('button'); cancelEntry.innerText = 'Cancel'; cancelEntry.style.border = '1px solid rgba(255,255,255,0.12)'; cancelEntry.style.background = 'transparent'; cancelEntry.style.color = '#fff';
    keyActions.appendChild(cancelEntry); keyActions.appendChild(validateBtn);
    entryWrap.appendChild(keyInput); entryWrap.appendChild(keyActions);

    const actions = document.createElement('div'); actions.style.display = 'flex'; actions.style.justifyContent = 'space-between'; actions.style.gap = '8px'; actions.style.marginTop = '12px';
    const leftActions = document.createElement('div'); leftActions.style.display = 'flex'; leftActions.style.gap = '8px';
    const buy = document.createElement('button'); buy.id = 'trialBuyBtn'; buy.innerText = 'Buy features'; buy.style.background = '#ef4444'; buy.style.color = '#fff'; buy.style.border = 'none'; buy.style.padding = '8px 12px'; buy.style.borderRadius = '8px';
    const enter = document.createElement('button'); enter.className = 'glowBtn'; enter.id = 'trialEnterBtn'; enter.innerText = 'Enter key';
    leftActions.appendChild(buy); leftActions.appendChild(enter);
    const rightActions = document.createElement('div'); rightActions.style.display = 'flex'; rightActions.style.gap = '8px';
    const close = document.createElement('button'); close.innerText = 'Close'; close.style.border = '1px solid rgba(255,255,255,0.12)'; close.style.background = 'transparent'; close.style.color = '#fff';
    rightActions.appendChild(close);
    actions.appendChild(leftActions); actions.appendChild(rightActions);

    box.appendChild(h); box.appendChild(p); box.appendChild(reminder); box.appendChild(entryWrap); box.appendChild(actions); overlay.appendChild(box); document.body.appendChild(overlay);

    function teardown() { try { document.body.removeChild(overlay); } catch (e) {} }

    close.addEventListener('click', () => { try { teardown(); } catch (e) {} });
    buy.addEventListener('click', () => { try { openPurchasePage({ reason: 'trial' }); } catch (e) { console.warn('buy click failed', e); } });

    enter.addEventListener('click', () => {
      try { entryWrap.style.display = entryWrap.style.display === 'none' ? 'block' : 'none'; if (entryWrap.style.display === 'block') keyInput.focus(); } catch (e) { console.warn('enter key show failed', e); }
    });

    cancelEntry.addEventListener('click', () => { try { entryWrap.style.display = 'none'; keyInput.value = ''; } catch (e) {} });

    validateBtn.addEventListener('click', async () => {
      try {
        const key = (keyInput && keyInput.value || '').trim();
        if (!key) return showNotification('Activation', 'Please enter a product key', 'error');
        validateBtn.disabled = true; cancelEntry.disabled = true; keyInput.disabled = true;
        try { showSpinner('Validating key...'); } catch (e) {}
        // Online-only validation: require the hosted keys.json to validate
        if (!KEYS_JSON_URL) { showNotification('Activation failed', 'No validation URL configured', 'error'); return; }
        try {
          const v = await validateKeyOnline(key, KEYS_JSON_URL);
          if (!v || !v.found) { showNotification('Activation failed', 'Key not found', 'error'); return; }
          if (v.used) { showNotification('Activation failed', 'Key already used', 'error'); return; }
          const ok = unlockAllWithKey(key);
          if (ok) {
            showNotification('Activated', 'Product key accepted — features unlocked.', 'success');
            try { teardown(); } catch (e) {}
            try { setTimeout(() => { try { window.location.reload(); } catch (e) {} }, 450); } catch (e) {}
          } else {
            showNotification('Activation failed', 'Unable to save key locally', 'error');
          }
        } catch (e) { console.warn('online key validation failed', e); showNotification('Activation failed', 'Validation error', 'error'); }
      } catch (e) { console.warn('validateBtn failed', e); showNotification('Activation failed', String(e), 'error'); }
      finally { try { validateBtn.disabled = false; cancelEntry.disabled = false; keyInput.disabled = false; hideSpinner(); } catch (e) {} }
    });

  } catch (e) { console.warn('showTrialExpiredModal failed', e); }
}

// --- App lock helpers (simple hashed password stored in localStorage)
async function hashStringSHA256(text) {
  try {
    if (!text) return '';
    const enc = new TextEncoder();
    const data = enc.encode(String(text));
    const hash = await (crypto.subtle ? crypto.subtle.digest('SHA-256', data) : Promise.reject('no-subtle'));
    const arr = Array.from(new Uint8Array(hash));
    return arr.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) { console.warn('hash failed', e); return '';} 
}

async function setAppLockPassword(pw) {
  try {
    if (!pw) return false;
    const h = await hashStringSHA256(pw);
    if (!h) return false;
    localStorage.setItem('bravo_lock_v1', h);
    return true;
  } catch (e) { return false; }
}

async function verifyAppLockPassword(pw) {
  try {
    const stored = localStorage.getItem('bravo_lock_v1');
    if (!stored) return false;
    const h = await hashStringSHA256(pw);
    return h === stored;
  } catch (e) { return false; }
}

function removeAppLockPassword() {
  try { localStorage.removeItem('bravo_lock_v1'); return true; } catch (e) { return false; }
}

function showSecurityModal() {
  try {
    const overlay = document.createElement('div'); overlay.className = 'modalOverlay';
    overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(0,0,0,0.6)'; overlay.style.setProperty('z-index', '2000000', 'important');
    const box = document.createElement('div'); box.className = 'modalBox'; box.style.minWidth = '360px'; box.style.padding = '14px'; box.style.background = '#fff'; box.style.color = '#000'; box.style.borderRadius = '8px'; box.style.setProperty('z-index', '2000001', 'important');
    const h = document.createElement('div'); h.style.fontWeight = '800'; h.style.marginBottom = '8px'; h.innerText = 'App lock — Password';
    const p = document.createElement('div'); p.style.marginBottom = '8px'; p.style.color = '#fff'; p.innerText = 'Set or change an app-lock password. You can also remove it.';

    const has = Boolean(localStorage.getItem('bravo_lock_v1'));
    const currentWrap = document.createElement('div'); currentWrap.style.marginBottom = '8px';
    if (has) {
      const curLabel = document.createElement('div'); curLabel.innerText = 'To change or remove the password, enter current password first.'; curLabel.style.marginBottom = '6px'; curLabel.style.fontSize = '13px'; curLabel.style.color = '#fff';
      const curInput = document.createElement('input'); curInput.type = 'password'; curInput.placeholder = 'Current password'; curInput.style.width = '100%'; curInput.style.padding = '8px'; curInput.style.marginBottom = '8px';
      currentWrap.appendChild(curLabel); currentWrap.appendChild(curInput);
    }

    const newLabel = document.createElement('div'); newLabel.innerText = has ? 'New password' : 'Set a new password'; newLabel.style.marginBottom = '6px'; newLabel.style.fontSize = '13px'; newLabel.style.color = '#fff';
    const newInput = document.createElement('input'); newInput.type = 'password'; newInput.placeholder = has ? 'New password (leave blank to keep)' : 'New password'; newInput.style.width = '100%'; newInput.style.padding = '8px'; newInput.style.marginBottom = '8px';
    const confirmInput = document.createElement('input'); confirmInput.type = 'password'; confirmInput.placeholder = 'Confirm new password'; confirmInput.style.width = '100%'; confirmInput.style.padding = '8px'; confirmInput.style.marginBottom = '8px';

    const actions = document.createElement('div'); actions.style.display = 'flex'; actions.style.justifyContent = 'flex-end'; actions.style.gap = '8px';
    const removeBtn = document.createElement('button'); removeBtn.innerText = 'Remove'; removeBtn.style.background = '#ef4444'; removeBtn.style.color='#fff'; removeBtn.style.border='none'; removeBtn.style.padding='8px 12px'; removeBtn.style.borderRadius='6px';
    const saveBtn = document.createElement('button'); saveBtn.className = 'glowBtn'; saveBtn.innerText = has ? 'Change' : 'Set';
    const closeBtn = document.createElement('button'); closeBtn.innerText = 'Close'; closeBtn.style.border='1px solid #e5e7eb'; closeBtn.style.background='#fff'; closeBtn.style.padding='8px 12px'; closeBtn.style.borderRadius='6px';
    actions.appendChild(closeBtn); actions.appendChild(removeBtn); actions.appendChild(saveBtn);

    box.appendChild(h); box.appendChild(p); if (has) box.appendChild(currentWrap); box.appendChild(newLabel); box.appendChild(newInput); box.appendChild(confirmInput); box.appendChild(actions); overlay.appendChild(box); document.body.appendChild(overlay);

    function teardown() { try { document.body.removeChild(overlay); } catch (e) {} }
    closeBtn.addEventListener('click', teardown);

    removeBtn.addEventListener('click', async () => {
      try {
        if (!has) return showNotification('Remove', 'No password set', 'error');
        const cur = currentWrap.querySelector('input[type=password]') && currentWrap.querySelector('input[type=password]').value || '';
        if (!cur) return showNotification('Remove', 'Enter current password to remove', 'error');
        const ok = await verifyAppLockPassword(cur);
        if (!ok) return showNotification('Remove', 'Current password incorrect', 'error');
        removeAppLockPassword();
        showNotification('Removed', 'App lock removed', 'success');
        try { teardown(); } catch (e) {}
        try { if (typeof updateExtraCards === 'function') updateExtraCards(); } catch (e) {}
      } catch (e) { console.warn('remove lock failed', e); showNotification('Error', 'Unable to remove password', 'error'); }
    });

    saveBtn.addEventListener('click', async () => {
      try {
        const newPw = newInput.value || '';
        const confirm = confirmInput.value || '';
        if (!newPw) return showNotification('Save', 'Enter a new password', 'error');
        if (newPw !== confirm) return showNotification('Save', 'New password and confirm do not match', 'error');
        if (has) {
          const cur = currentWrap.querySelector('input[type=password]') && currentWrap.querySelector('input[type=password]').value || '';
          if (!cur) return showNotification('Change', 'Enter current password', 'error');
          const ok = await verifyAppLockPassword(cur);
          if (!ok) return showNotification('Change', 'Current password incorrect', 'error');
        }
        const setOk = await setAppLockPassword(newPw);
        if (setOk) { showNotification('Saved', 'Password saved', 'success'); try { teardown(); } catch (e) {} try { if (typeof updateExtraCards === 'function') updateExtraCards(); } catch (e) {} } else { showNotification('Save failed', 'Could not save password', 'error'); }
      } catch (e) { console.warn('save lock failed', e); showNotification('Error', 'Unable to save password', 'error'); }
    });

  } catch (e) { console.warn('showSecurityModal failed', e); showNotification('Error', 'Unable to open security modal', 'error'); }
}

// Informational modal that explains app-lock and links to Manage (adds password)
function showSecurityInfoModal() {
  try {
    const overlay = document.createElement('div'); overlay.className = 'modalOverlay';
    overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(0,0,0,0.6)'; overlay.style.setProperty('z-index', '2000000', 'important');
    const box = document.createElement('div'); box.className = 'modalBox'; box.style.minWidth = '380px'; box.style.padding = '14px'; box.style.background = '#fff'; box.style.color = '#000'; box.style.borderRadius = '8px'; box.style.setProperty('z-index', '2000001', 'important');
    const h = document.createElement('div'); h.style.fontWeight = '800'; h.style.marginBottom = '8px'; h.innerText = 'Protect your app';
    const p = document.createElement('div'); p.style.marginBottom = '12px'; p.style.color = '#333'; p.style.lineHeight = '1.4';
    p.innerText = "Add a password to lock the app and protect your data. This prevents others from opening the app without the password.";
    const hint = document.createElement('div'); hint.style.marginBottom = '12px'; hint.style.color = '#555'; hint.innerText = "To add a password, press 'Manage App Lock' below. You'll be asked to create and confirm a password. Don't forget it!";
    const actions = document.createElement('div'); actions.style.display = 'flex'; actions.style.justifyContent = 'flex-end'; actions.style.gap = '8px';
    const manage = document.createElement('button'); manage.className = 'glowBtn'; manage.innerText = 'Manage App Lock';
    const close = document.createElement('button'); close.innerText = 'Close'; close.style.border = '1px solid #e5e7eb'; close.style.background = '#fff'; close.style.padding = '8px 12px'; close.style.borderRadius = '6px';
    actions.appendChild(close); actions.appendChild(manage);
    box.appendChild(h); box.appendChild(p); box.appendChild(hint); box.appendChild(actions); overlay.appendChild(box); document.body.appendChild(overlay);
    function teardown() { try { document.body.removeChild(overlay); } catch (e) {} }
    close.addEventListener('click', teardown);
    manage.addEventListener('click', () => { try { teardown(); showSecurityModal(); } catch (e) { console.warn('manage from info failed', e); } });
  } catch (e) { console.warn('showSecurityInfoModal failed', e); }
}

// Unlock modal shown immediately after splash when an app-lock password is set.
function showUnlockModal() {
  try {
    // Create an overlay that fully blocks and obscures the background
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(2,6,23,0.92)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.backdropFilter = 'blur(6px)';
    overlay.style.webkitBackdropFilter = 'blur(6px)';
    overlay.style.setProperty('z-index', '2000000', 'important');

    // Do not blur the entire document (this would also blur the modal)
    // rely on overlay.backdropFilter to obscure background instead
    const prevFilter = null;

    const box = document.createElement('div');
    box.style.minWidth = '380px';
    box.style.maxWidth = '92%';
    box.style.padding = '18px';
    box.style.borderRadius = '12px';
    box.style.boxSizing = 'border-box';
    box.style.background = 'linear-gradient(180deg, rgba(6,10,20,0.95), rgba(12,18,36,0.98))';
    box.style.color = '#aaf6ff';
    box.style.position = 'relative';
    box.style.setProperty('z-index', '2000001', 'important');
    box.style.border = '1px solid rgba(80,220,255,0.08)';
    box.style.boxShadow = '0 20px 60px rgba(0,0,0,0.6), 0 0 24px rgba(0,160,255,0.04)';
    box.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace";

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '8px';

    const h = document.createElement('div'); h.style.fontWeight = '800'; h.style.fontSize = '16px'; h.innerText = 'APP LOCKED — AUTH REQUIRED';
    const accent = document.createElement('div'); accent.style.height = '6px'; accent.style.width = '84px'; accent.style.borderRadius = '4px'; accent.style.background = 'linear-gradient(90deg,#00f0ff,#6f5cff)'; accent.style.boxShadow = '0 0 18px rgba(80,200,255,0.22)';
    header.appendChild(h); header.appendChild(accent);

    const p = document.createElement('div'); p.style.marginBottom = '12px'; p.style.color = '#9ef3ff'; p.style.opacity = '0.95'; p.style.lineHeight = '1.4'; p.innerText = 'Enter your password to unlock the app.';

    const pwInput = document.createElement('input'); pwInput.type = 'password'; pwInput.placeholder = 'Password';
    pwInput.style.width = '100%'; pwInput.style.padding = '12px'; pwInput.style.marginBottom = '10px'; pwInput.style.borderRadius = '8px'; pwInput.style.border = '1px solid rgba(80,220,255,0.08)'; pwInput.style.background = 'rgba(12,14,20,0.6)'; pwInput.style.color = '#dffcff'; pwInput.style.outline = 'none';

    const forgotWrap = document.createElement('div'); forgotWrap.style.marginBottom = '8px'; forgotWrap.style.display = 'flex'; forgotWrap.style.justifyContent = 'flex-end';
    const forgotBtn = document.createElement('button'); forgotBtn.innerText = 'Forgot password'; forgotBtn.style.background = 'transparent'; forgotBtn.style.border = 'none'; forgotBtn.style.color = '#48c6ff'; forgotBtn.style.cursor = 'pointer'; forgotBtn.style.textDecoration = 'underline'; forgotBtn.style.fontSize = '13px';
    forgotWrap.appendChild(forgotBtn);

    const keyEntryWrap = document.createElement('div'); keyEntryWrap.style.display = 'none'; keyEntryWrap.style.marginTop = '8px';
    const keyInput = document.createElement('input'); keyInput.type = 'text'; keyInput.placeholder = 'Enter product key to remove password'; keyInput.style.width = '100%'; keyInput.style.padding = '10px'; keyInput.style.marginBottom = '8px'; keyInput.style.borderRadius = '8px'; keyInput.style.border = '1px solid rgba(80,220,255,0.06)'; keyInput.style.background = 'rgba(8,12,18,0.6)'; keyInput.style.color = '#cffbff';
    const keyActions = document.createElement('div'); keyActions.style.display = 'flex'; keyActions.style.justifyContent = 'flex-end'; keyActions.style.gap = '8px';
    const keyCancel = document.createElement('button'); keyCancel.innerText = 'Cancel'; keyCancel.style.border = '1px solid rgba(255,255,255,0.06)'; keyCancel.style.background = 'transparent'; keyCancel.style.padding = '8px 12px'; keyCancel.style.borderRadius = '6px'; keyCancel.style.color = '#9ef3ff';
    const keySubmit = document.createElement('button'); keySubmit.className = 'glowBtn'; keySubmit.innerText = 'Remove'; keySubmit.style.background = 'linear-gradient(90deg,#ff6b6b,#ef4444)'; keySubmit.style.border = 'none'; keySubmit.style.color = '#fff'; keySubmit.style.padding = '8px 12px'; keySubmit.style.borderRadius = '8px';
    keyActions.appendChild(keyCancel); keyActions.appendChild(keySubmit);
    keyEntryWrap.appendChild(keyInput); keyEntryWrap.appendChild(keyActions);

    const actions = document.createElement('div'); actions.style.display = 'flex'; actions.style.justifyContent = 'flex-end'; actions.style.gap = '8px';
    const unlockBtn = document.createElement('button'); unlockBtn.className = 'glowBtn'; unlockBtn.innerText = 'Unlock'; unlockBtn.style.background = 'linear-gradient(90deg,#00f0ff,#6f5cff)'; unlockBtn.style.border = 'none'; unlockBtn.style.color = '#00121a'; unlockBtn.style.padding = '10px 14px'; unlockBtn.style.borderRadius = '8px';
    actions.appendChild(unlockBtn);

    box.appendChild(header); box.appendChild(p); box.appendChild(pwInput); box.appendChild(forgotWrap); box.appendChild(keyEntryWrap); box.appendChild(actions); overlay.appendChild(box); document.body.appendChild(overlay);
    try { pwInput.focus(); } catch (e) {}

    // Teardown removes overlay and restores listeners
    function restore() {
      try { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); } catch (e) {}
      try { window.removeEventListener('keydown', onKeyDown); } catch (e) {}
    }

    // Prevent Escape or other keys from closing the modal; trap Enter for unlock
    function onKeyDown(ev) {
      try {
        if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); }
        if (ev.key === 'Enter') { ev.preventDefault(); unlockBtn.click(); }
      } catch (e) {}
    }
    window.addEventListener('keydown', onKeyDown, true);

    // Unlock action: verify password and restore UI only on success
    unlockBtn.addEventListener('click', async () => {
      try {
        const val = (pwInput.value || '').trim();
        if (!val) return showNotification('Unlock', 'Enter password', 'error');
        const ok = await verifyAppLockPassword(val);
        if (!ok) return showNotification('Unlock failed', 'Incorrect password', 'error');
        restore();
        showNotification('Unlocked', 'App unlocked', 'success');
      } catch (e) { console.warn('unlock failed', e); showNotification('Error', 'Unable to unlock', 'error'); }
    });

    // Forgot password toggles product-key removal UI
    forgotBtn.addEventListener('click', () => {
      try { keyEntryWrap.style.display = keyEntryWrap.style.display === 'none' ? 'block' : 'none'; if (keyEntryWrap.style.display === 'block') keyInput.focus(); } catch (e) {}
    });

    keyCancel.addEventListener('click', () => { try { keyEntryWrap.style.display = 'none'; keyInput.value = ''; } catch (e) {} });

    keySubmit.addEventListener('click', async () => {
      try {
        const key = (keyInput.value || '').trim();
        if (!key) return showNotification('Remove', 'Enter product key', 'error');
        if (!KEYS_JSON_URL) return showNotification('Remove', 'No validation URL configured', 'error');
        try { showSpinner('Validating product key...'); } catch (e) {}
        const v = await validateKeyOnline(key, KEYS_JSON_URL);
        try { hideSpinner(); } catch (e) {}
        if (!v || !v.found) return showNotification('Invalid key', 'Product key not recognized', 'error');
        const lic = _loadLicense();
        // If key record shows it was already used, be strict: only allow removal if it matches the local saved productKey
        if (v.used) {
          if (lic && lic.productKey && String(lic.productKey) === key) {
            removeAppLockPassword(); restore(); showNotification('Removed', 'App lock removed via product key', 'success');
            try { if (typeof updateExtraCards === 'function') updateExtraCards(); } catch (e) {}
            return;
          }
          return showNotification('Invalid key', 'Key is marked used and does not match local license', 'error');
        }
        // If key is valid and not marked used, accept it: persist license and remove lock
        const setOk = unlockAllWithKey(key);
        if (setOk) {
          removeAppLockPassword(); restore(); showNotification('Removed', 'App lock removed via product key', 'success');
          try { if (typeof updateExtraCards === 'function') updateExtraCards(); } catch (e) {}
          try { setTimeout(() => { try { window.location.reload(); } catch (e) {} }, 450); } catch (e) {}
        } else {
          showNotification('Error', 'Unable to save license locally', 'error');
        }
      } catch (e) { console.warn('remove via key failed', e); showNotification('Error', 'Unable to remove password', 'error'); }
    });

    // Keyboard shortcuts for inputs
    pwInput.addEventListener('keydown', (ev) => { try { if (ev.key === 'Enter') unlockBtn.click(); } catch (e) {} });
    keyInput.addEventListener('keydown', (ev) => { try { if (ev.key === 'Enter') keySubmit.click(); } catch (e) {} });

  } catch (e) { console.warn('showUnlockModal failed', e); }
}

function initFooter() {
  try {
    const footers = Array.from(document.querySelectorAll('.app-footer'));
    let keeper = null;
    if (footers.length) {
      // prefer a visible footer when present
      for (const f of footers) {
        try {
          const s = window.getComputedStyle(f);
          if (s && s.display !== 'none' && f.offsetParent !== null) { keeper = f; break; }
        } catch (e) {}
      }
      if (!keeper) keeper = footers[0];
      // remove duplicates
      footers.forEach(f => { if (f !== keeper) { try { f.parentNode.removeChild(f); } catch (e) {} } });
    } else {
      // create a minimal footer if none present
      keeper = document.createElement('footer');
      keeper.className = 'app-footer';
      keeper.innerHTML = '<div class="devInfo">Developed by RAJAB CULTURE DIGITAL SOLUTIONS  · <span class="muted">(RC DIGITAl)</span></div>\n      <div class="footerActions" style="display:none"></div>';
      document.body.appendChild(keeper);
    }

    // re-query footer-related elements scoped to the chosen footer so we
    // do not pick up duplicate controls that may exist elsewhere on the page
    try {
      const root = keeper;
      dropboxIcon = root.querySelector('#dropboxIcon') || document.getElementById('dropboxIcon');
      // collect status elements only within footers
      dropboxStatusEls = Array.from(document.querySelectorAll('.app-footer #dropboxStatus'));
      connectBtn = root.querySelector('#connectDropbox') || document.getElementById('connectDropbox');
      downloadBtn = root.querySelector('#downloadFormsBtn') || document.getElementById('downloadFormsBtn');
      // Ensure a download button exists and is visible regardless of connection state
      if (!downloadBtn) {
        try {
          const b = document.createElement('button');
          b.id = 'downloadFormsBtn';
          b.innerText = 'Download Forms';
          b.style.display = 'inline-block';
          b.disabled = false;
          root.querySelector('.footerActions') && root.querySelector('.footerActions').appendChild(b);
          downloadBtn = b;
        } catch (e) {}
      } else {
        try { downloadBtn.style.display = 'inline-block'; downloadBtn.disabled = false; } catch (e) {}
      }
      disconnectBtn = root.querySelector('#disconnectDropbox') || document.getElementById('disconnectDropbox');
    } catch (e) {
      dropboxIcon = document.getElementById('dropboxIcon');
      dropboxStatusEls = Array.from(document.querySelectorAll('#dropboxStatus'));
      connectBtn = document.getElementById('connectDropbox');
      downloadBtn = document.getElementById('downloadFormsBtn');
      disconnectBtn = document.getElementById('disconnectDropbox');
    }
  } catch (e) { console.warn('initFooter failed', e); }
}

// Populate any static extra cards already present in the DOM (userCard, storageCard)
async function updateExtraCards() {
  try {
    const host = document.getElementById('extraCardsArea') || document.querySelector('.extra-cards-area') || document.getElementById('displayContainer') || document.body;
    if (!host) return;
    const userCard = host.querySelector('.userCard') || document.querySelector('.userCard');
    const storageCard = host.querySelector('.storageCard') || document.querySelector('.storageCard');
    

      // Async populate user & storage info (respect trial gating)
      (async () => {
        try {
          // account info
          try {
            const acc = await (window.electronAPI && window.electronAPI.drive && typeof window.electronAPI.drive.getAccount === 'function' ? window.electronAPI.drive.getAccount() : Promise.resolve(null));
            const avatarImg = userCard.querySelector('img.statAvatar');
            const nameEl = userCard.querySelector('.smallName');
            const labelEl = userCard.querySelector('.statLabel');
            if (!isFeatureEnabled('userCard')) {
              try { if (nameEl) nameEl.innerText = 'Expired'; } catch (e) {}
              try { if (labelEl) labelEl.innerText = ''; } catch (e) {}
              try { if (avatarImg) avatarImg.style.display = 'none'; } catch (e) {}
            } else {
              if (acc && acc.ok && acc.info) {
                const info = acc.info;
                const name = (info.name && info.name.display_name) ? info.name.display_name : (info.email || 'User');
                const email = info.email || '';
                try { if (avatarImg && info.profile_photo_url) avatarImg.src = info.profile_photo_url; else if (avatarImg) avatarImg.style.display = 'none'; } catch (e) {}
                try { if (nameEl) nameEl.innerText = name; } catch (e) {}
                try { if (labelEl) labelEl.innerText = email; } catch (e) {}
              }
            }
          } catch (e) { /* ignore account fetch failures */ }

          // storage info (debug/quota)
          try {
            const numbers = storageCard.querySelector('.storageNumbers');
            const fill = storageCard.querySelector('.storageFill');
            if (!isFeatureEnabled('storageCard')) {
              try { if (numbers) numbers.innerText = 'Expired'; } catch (e) {}
              try { if (fill) fill.style.width = '0%'; } catch (e) {}
            } else {
              const dbg = await (window.electronAPI && window.electronAPI.drive && typeof window.electronAPI.drive.getDebug === 'function' ? window.electronAPI.drive.getDebug() : Promise.resolve(null));
              let used = 0, total = 0;
              if (dbg && dbg.ok && dbg.info) {
                const info = dbg.info;
                if (info.quota) {
                  used = info.quota.used_bytes || info.quota.used || 0;
                  total = (info.quota.allocation && (info.quota.allocation.allocated_bytes || info.quota.allocation)) || info.quota.allocated_bytes || 0;
                } else if (info.usage) {
                  used = info.usage.used || info.usage.used_bytes || 0;
                  total = info.usage.total || 0;
                } else if (typeof info.space_used !== 'undefined') {
                  used = info.space_used || 0; total = info.space_total || 0;
                }
              }
              if (total > 0) {
                const pct = Math.max(0, Math.min(100, Math.round((used / total) * 100)));
                const formatStorage = (bytes) => {
                  try {
                    const gb = bytes / 1024 / 1024 / 1024;
                    if (gb >= 1) return gb.toFixed(1) + ' GB';
                    const mb = bytes / 1024 / 1024;
                    return mb.toFixed(1) + ' MB';
                  } catch (e) { return '0.0 GB'; }
                };
                try { if (numbers) numbers.innerText = `${formatStorage(used)} / ${formatStorage(total)}`; } catch (e) {}
                try { if (fill) fill.style.width = pct + '%'; } catch (e) {}

                // If storage is nearly full, surface a strong notification and action.
                try {
                  const ALERT_KEY = 'bravo_storage_alert_v1';
                  const alertThreshold = 0.95; // 95% used
                  const minInterval = 24 * 60 * 60 * 1000; // throttle: once per 24h
                  const nowTs = Date.now();
                  const usedRatio = total > 0 ? (used / total) : 0;
                  if (usedRatio >= alertThreshold) {
                    try { storageCard.classList.add('attention'); storageCard.style.border = '1px solid rgba(255,94,58,0.6)'; } catch (e) {}

                    // add a prominent Buy button if not present
                    try {
                      let buyBtn = storageCard.querySelector('#buyStorageBtn');
                      if (!buyBtn) {
                        buyBtn = document.createElement('button');
                        buyBtn.id = 'buyStorageBtn';
                        buyBtn.className = 'glowBtn';
                        buyBtn.innerText = 'Buy more storage';
                        buyBtn.style.marginTop = '8px';
                        buyBtn.style.background = '#ff6b6b';
                        buyBtn.style.border = 'none';
                        const container = storageCard.querySelector('div') || storageCard;
                        container.appendChild(buyBtn);
                        buyBtn.addEventListener('click', () => { try { openPurchasePage({ reason: 'storage' }); } catch (e) {} });
                      }
                    } catch (e) {}

                    // Throttle notifications to avoid spamming the user
                    try {
                      const lastNotified = parseInt(localStorage.getItem(ALERT_KEY) || '0', 10) || 0;
                      if (!lastNotified || (nowTs - lastNotified) > minInterval) {
                        try { localStorage.setItem(ALERT_KEY, String(nowTs)); } catch (e) {}
                        try { showNotification('Dropbox storage nearly full', `Your Dropbox storage is ${formatStorage(used)} of ${formatStorage(total)}. Please buy more storage.`, 'error'); } catch (e) {}
                      }
                    } catch (e) {}
                  } else {
                    try { storageCard.classList.remove('attention'); storageCard.style.border = ''; } catch (e) {}
                    try { const b = storageCard.querySelector('#buyStorageBtn'); if (b && b.parentNode) b.parentNode.removeChild(b); } catch (e) {}
                  }
                } catch (e) {}
              } else {
                try { if (numbers) numbers.innerText = 'Unknown'; } catch (e) {}
              }
            }
          } catch (e) { /* ignore storage fetch failures */ }

          // Manage button opens existing manage modal if available
          try {
            const mbtn = document.getElementById('manageStorageBtn');
            if (mbtn) mbtn.addEventListener('click', () => { try { if (typeof showManageConnectionModal === 'function') return showManageConnectionModal(); if (window.electronAPI && typeof window.electronAPI.revealInFolder === 'function') window.electronAPI.revealInFolder(''); } catch (e) {} });
          } catch (e) { }
        } catch (e) { /* overall extraRow population error */ }
      })();

    // If account fetch failed but we have a refresh token, try polling for account info
    try {
      const dbgForPoll = (window.electronAPI && window.electronAPI.drive && typeof window.electronAPI.drive.getDebug === 'function')
        ? await window.electronAPI.drive.getDebug().catch(() => null)
        : null;
      if ((!(window._lastAccountSuccess)) && dbgForPoll && dbgForPoll.ok && dbgForPoll.info && dbgForPoll.info.hasRefreshToken) {
        // quick UI hint
        try {
          const uc = document.querySelector('.userCard .smallName'); if (uc && uc.innerText && (uc.innerText === 'Not signed in' || uc.innerText === '')) uc.innerText = 'Signed in — fetching...';
        } catch (e) {}
        // start a short polling loop to re-attempt getAccount (useful if OAuth just completed)
        (async function pollForAccount(attempts = 6, interval = 2000) {
          for (let i = 0; i < attempts; i++) {
            try {
              const a = (window.electronAPI && window.electronAPI.drive && typeof window.electronAPI.drive.getAccount === 'function')
                ? await window.electronAPI.drive.getAccount().catch(() => null)
                : null;
              if (a && a.ok && a.info) {
                try { updateExtraCards(); } catch (e) {}
                window._lastAccountSuccess = true;
                return;
              }
            } catch (e) { }
            await new Promise(r => setTimeout(r, interval));
          }
        })();
      }
    } catch (e) { /* ignore polling setup failures */ }

    // Wire manage button if present
    try {
      const mbtn = document.getElementById('manageStorageBtn') || (host && host.querySelector && host.querySelector('#manageStorageBtn'));
      if (mbtn) {
        mbtn.removeEventListener && mbtn.removeEventListener('click', mbtn._manageHandler || (() => {}));
        const handler = () => { try { if (typeof showManageConnectionModal === 'function') return showManageConnectionModal(); if (window.electronAPI && typeof window.electronAPI.revealInFolder === 'function') window.electronAPI.revealInFolder(''); } catch (e) {} };
        try { mbtn.addEventListener('click', handler); mbtn._manageHandler = handler; } catch (e) {}
      }
    } catch (e) { /* ignore */ }
  } catch (e) { console.warn('updateExtraCards overall failed', e); }
}
const messages = [
  'Starting app',
  'Loading forms',
  'Connecting to Dropbox',
  'Ready!',
];

// Global wrapper: auto-add `.loading` to buttons whose click handlers return a Promise.
try {
  (function(){
    const origAdd = EventTarget.prototype.addEventListener;
    const origRemove = EventTarget.prototype.removeEventListener;
    const wrappedMap = new WeakMap();
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      try {
        if (type === 'click' && this && this.tagName === 'BUTTON' && typeof listener === 'function') {
          if (wrappedMap.has(listener)) {
            return origAdd.call(this, type, wrappedMap.get(listener), options);
          }
          const self = this;
          const wrapped = function(ev) {
            let result;
            try { result = listener.call(this, ev); } catch (err) { throw err; }
            try {
              if (result && typeof result.then === 'function') {
                try { self.classList.add('loading'); } catch (e) {}
                result.finally(() => { try { self.classList.remove('loading'); } catch (e) {} });
              }
            } catch (e) {}
            return result;
          };
          wrappedMap.set(listener, wrapped);
          return origAdd.call(this, type, wrapped, options);
        }
      } catch (e) {}
      return origAdd.call(this, type, listener, options);
    };
    EventTarget.prototype.removeEventListener = function(type, listener, options) {
      try {
        if (type === 'click' && typeof listener === 'function' && wrappedMap.has(listener)) {
          const w = wrappedMap.get(listener);
          wrappedMap.delete(listener);
          return origRemove.call(this, type, w, options);
        }
      } catch (e) {}
      return origRemove.call(this, type, listener, options);
    };
  })();
} catch (e) { console.warn('button spinner wrapper failed', e); }

let currentMsgIndex = 0;
let splashAnimationTimer = null;
// startup spinner timeout handle (used when splash is disabled)
let _startupSpinnerTimeout = null;

// Global spinner reference & refcount for overlapping async tasks
let __spinnerCount = 0;
function ensureGlobalSpinner() {
  try {
    if (document.getElementById('globalSpinnerOverlay')) return;
    const ov = document.createElement('div');
    ov.id = 'globalSpinnerOverlay';
    ov.className = 'global-spinner-overlay';
    ov.innerHTML = `<div style="text-align:center"><div class="global-spinner" role="status" aria-live="polite"><div class="ring"></div><div class="center"></div></div><div id="globalSpinnerMessage" class="global-spinner-message" style="opacity:0.95"></div></div>`;
    document.body.appendChild(ov);
  } catch (e) { /* ignore */ }
}
function showSpinner(msg) {
  try {
    ensureGlobalSpinner();
    __spinnerCount = Math.max(0, (__spinnerCount || 0) + 1);
    const ov = document.getElementById('globalSpinnerOverlay');
    const m = document.getElementById('globalSpinnerMessage');
    if (m && msg) m.innerText = msg;
    if (ov) ov.classList.add('show');
  } catch (e) {}
}
function hideSpinner(force) {
  try {
    if (force) __spinnerCount = 0; else __spinnerCount = Math.max(0, (__spinnerCount || 0) - 1);
    if ((__spinnerCount || 0) > 0) return;
    const ov = document.getElementById('globalSpinnerOverlay');
    if (ov) ov.classList.remove('show');
    const m = document.getElementById('globalSpinnerMessage'); if (m) m.innerText = '';
  } catch (e) {}
}

// Simple notification modal (replaces alert)
function showNotification(title, message, type) {
  try {
    const overlay = document.createElement('div'); overlay.className = 'modalOverlay';
    // ensure notifications appear above decorative layers (SVG traces, etc.)
    overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center';
    // use setProperty with important so stylesheet rules can't push this behind decorative layers
    overlay.style.setProperty('z-index', '2000000', 'important');
    const box = document.createElement('div'); box.className = 'modalBox';
    try { box.style.setProperty('z-index', '2000001', 'important'); box.style.position = 'relative'; } catch (e) {}
    const h = document.createElement('div'); h.style.fontWeight = '800'; h.style.marginBottom = '8px'; h.innerText = title || '';
    const p = document.createElement('div'); p.innerText = message || '';
    const actions = document.createElement('div'); actions.className = 'modalActions';
    const ok = document.createElement('button'); ok.innerText = 'OK'; ok.addEventListener('click', () => { try { document.body.removeChild(overlay); } catch (e) {} });
    if (type === 'error') ok.style.background = '#e74c3c';
    actions.appendChild(ok);
    box.appendChild(h); box.appendChild(p); box.appendChild(actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  } catch (e) { try { alert((title? title+" - ":"") + (message||'')); } catch (ex) {} }
}

// (render debug button removed)

// Sidebar toggle removed: sidebar always visible in desktop layout

// Wire custom window controls (frameless window)
try {
  if (winMinBtn) winMinBtn.addEventListener('click', async () => { try { await window.electronAPI.window.minimize(); } catch (e) { console.warn(e); } });
  if (winMaxBtn) winMaxBtn.addEventListener('click', async () => { try { await window.electronAPI.window.toggleMaximize(); } catch (e) { console.warn(e); } });
  if (winCloseBtn) winCloseBtn.addEventListener('click', async () => { try { await window.electronAPI.window.close(); } catch (e) { console.warn(e); } });

  // Update maximize state by toggling the .maximized class
  const updateMaxIcon = (isMax) => { if (!winMaxBtn) return; try { if (isMax) winMaxBtn.classList.add('maximized'); else winMaxBtn.classList.remove('maximized'); } catch (e) {} };
  // query initial state
  try { window.electronAPI.window.isMaximized().then(r => { if (r && r.ok) updateMaxIcon(Boolean(r.maximized)); }); } catch (e) {}
  // listen for events
  try { window.electronAPI.window.onMaximized(() => updateMaxIcon(true)); } catch (e) {}
  try { window.electronAPI.window.onUnmaximized(() => updateMaxIcon(false)); } catch (e) {}
} catch (e) { console.warn('window controls wiring failed', e); }

function animateSplashMessage() {
  // show animated loader text and subtle progress
  try { loadingMsg.style.opacity = '1'; } catch (e) {}
  setTimeout(() => {
    try { loadingMsg.innerText = messages[currentMsgIndex] + ' ' + (".   ").slice(0, (currentMsgIndex % 3) + 1).replace(/ /g, '.'); } catch (e) {}
    currentMsgIndex = (currentMsgIndex + 1) % messages.length;
    if (currentMsgIndex === 0) {
      // All messages shown; hide splash after next cycle
      splashAnimationTimer = setTimeout(() => {
        splash.style.opacity = '0';
        splash.style.transition = 'opacity 0.6s ease-out';
        setTimeout(() => {
          splash.style.display = 'none';
          main.style.display = 'block';
          try { document.body.classList.add('app-loaded'); } catch (e) {}
        }, 600);
      }, 2000);
      return;
    } else {
      splashAnimationTimer = setTimeout(animateSplashMessage, 2000);
    }
  }, 300);
}

// Start splash animation on load. When running in the Desktop (test)
// environment, disable the splash to speed up loading. The flag is
// persisted in localStorage so tests remain fast across restarts.
try { if (window && window.electronAPI) { try { localStorage.setItem('disableSplash', '1'); } catch (e) {} } } catch (e) {}
const disableSplash = (() => { try { return localStorage.getItem('disableSplash') === '1'; } catch (e) { return false; } })();
if (disableSplash) {
  try {
    splash.style.display = 'none';
    main.style.display = 'block';
    document.body.classList.add('app-loaded');
    // Show a lightweight global spinner when desktop splash is disabled so the
    // UI never appears completely dead while async initialization runs.
    try { showSpinner('Starting app...'); } catch (e) {}
    // Safety: ensure the spinner is removed after a reasonable timeout
    try { _startupSpinnerTimeout = setTimeout(() => { try { hideSpinner(true); } catch (e) {} }, 15000); } catch (e) {}
  } catch (e) {}
} else {
  setTimeout(() => animateSplashMessage(), 1000);
}

// Connect using Desktop OAuth via main process
initFooter();
// If the app is locked, prompt for the password shortly after startup
try {
  setTimeout(() => {
    try {
      if (localStorage.getItem('bravo_lock_v1')) {
        showUnlockModal();
      }
    } catch (e) {}
  }, 700);
} catch (e) {}

// Add subtle futuristic PCB traces as a responsive SVG background
function injectCyberTraces() {
  try {
    if (document.getElementById('bravoCyberTraces')) return;
    const style = document.createElement('style');
    style.id = 'bravoCyberTracesStyles';
    style.innerHTML = `
      /* Ensure key UI elements sit above the traces */
      .statsRow, .statsRowExtra, .yearCardsSidebar, #yearSidebar, .statCard, .sidebarHeading { position: relative; z-index: 2; }
      /* Make sure overlaying modals still appear above everything */
      .modalOverlay, .modalBox { z-index: 99999 !important; }
      /* Small tweak so traces don't capture pointer events */
      #bravoCyberTraces { pointer-events: none; position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0; }
    `;
    document.head.appendChild(style);

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('id', 'bravoCyberTraces');
    svg.setAttribute('viewBox', '0 0 1920 1080');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');

    // defs: stronger glow filter for neon effect
    const defs = document.createElementNS(svgNS, 'defs');
    const filter = document.createElementNS(svgNS, 'filter'); filter.setAttribute('id', 'neon');
    const feGaussian = document.createElementNS(svgNS, 'feGaussianBlur'); feGaussian.setAttribute('stdDeviation', '10'); feGaussian.setAttribute('result', 'coloredBlur');
    const feColor = document.createElementNS(svgNS, 'feColorMatrix'); feColor.setAttribute('type', 'matrix'); feColor.setAttribute('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0');
    const feMerge = document.createElementNS(svgNS, 'feMerge');
    const feMergeNode1 = document.createElementNS(svgNS, 'feMergeNode');
    const feMergeNode2 = document.createElementNS(svgNS, 'feMergeNode');
    feMergeNode1.setAttribute('in', 'coloredBlur');
    feMergeNode2.setAttribute('in', 'SourceGraphic');
    feMerge.appendChild(feMergeNode1); feMerge.appendChild(feMergeNode2);
    filter.appendChild(feGaussian); filter.appendChild(feColor); filter.appendChild(feMerge); defs.appendChild(filter);

    svg.appendChild(defs);

    // Helper to create a neon path
    function makePath(d, color, width, opacity) {
      const p = document.createElementNS(svgNS, 'path');
      p.setAttribute('d', d);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', color || '#18e6ff');
      p.setAttribute('stroke-width', String(width || 2));
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-linejoin', 'round');
      p.setAttribute('opacity', String(typeof opacity === 'undefined' ? 0.95 : opacity));
      p.style.filter = 'url(#neon)';
      return p;
    }

    // Top area traces (behind header/cards). Coordinates are for 1920x1080 and scale with viewport.
    const top1 = makePath('M160 130 C 320 80, 700 100, 900 120 S1400 140, 1700 120', '#00f0ff', 5, 1);
    const top2 = makePath('M120 200 C 280 170, 520 170, 760 180 S1180 200, 1680 180', '#2ee6b6', 4, 0.95);

    // Sidebar traces (left column behind year cards)
    const side1 = makePath('M80 260 L80 520 C80 560, 120 600, 160 620', '#2de0ff', 5, 1);
    const side2 = makePath('M40 420 C 80 400, 140 420, 160 460', '#7af0ff', 4, 0.9);

    // Small decorative segments near cards
    const seg1 = makePath('M520 360 L580 360 L610 400', '#6fb7ff', 4, 1);
    const seg2 = makePath('M300 140 L340 120 L380 140', '#9ef3ff', 3.5, 0.95);

    // Add slight dash animation on one path
    top1.setAttribute('stroke-dasharray', '8 6');
    try { top1.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -48 }], { duration: 4000, iterations: Infinity }); } catch (e) {}

    // Create soft glow clones behind main paths for stronger neon
    function addGlow(p, extraWidth, glowOpacity) {
      try {
        const g = p.cloneNode();
        const w = Number(p.getAttribute('stroke-width') || 3) + (extraWidth || 8);
        g.setAttribute('stroke-width', String(w));
        g.setAttribute('opacity', String(typeof glowOpacity === 'undefined' ? 0.14 : glowOpacity));
        g.style.filter = 'url(#neon)';
        // insert glow before the main path
        svg.appendChild(g);
      } catch (e) {}
    }

    svg.appendChild(top2);
    addGlow(top2, 12, 0.14);
    svg.appendChild(top1);
    addGlow(top1, 14, 0.18);
    svg.appendChild(side2);
    addGlow(side2, 12, 0.12);
    svg.appendChild(side1);
    addGlow(side1, 14, 0.16);
    svg.appendChild(seg1);
    addGlow(seg1, 10, 0.15);
    svg.appendChild(seg2);
    addGlow(seg2, 8, 0.12);

    // Make the SVG blend nicely with dark backgrounds
    try { svg.style.mixBlendMode = 'screen'; svg.style.opacity = '1'; } catch (e) {}

    // Insert as first child so it sits under main app layers (style ensures z-index ordering)
    document.body.insertBefore(svg, document.body.firstChild);
  } catch (e) { console.warn('injectCyberTraces failed', e); }
}

try { injectCyberTraces(); } catch (e) {}

// Welcome/tour tutorial: overlays and step tooltips
function showWelcomeTour(force) {
  try {
    if (!force && localStorage.getItem('bravo_seen_tour_v1')) return;

    const steps = [
      { selector: '.statsRowExtra .userCard', title: 'Signed-in user', text: 'Shows the Dropbox account currently signed in. Use Manage to change connection.' },
      { selector: '.statsRowExtra .storageCard', title: 'Dropbox storage', text: 'Shows your storage usage and shows if Dropbox storage space is full ' },
      { selector: '#dropboxConnectCard', title: 'Dropbox connection', text: 'Connect or manage your Dropbox connection here. Required to sync forms.' },
      { selector: '.statsRow .statCard:nth-child(1)', title: 'Total forms', text: 'Displays the number of forms stored in your Dropbox.' },
      { selector: '.statsRow .statCard:nth-child(2)', title: 'Forms saved today', text: 'Quickly access forms saved today and export them as a batch.' },
      { selector: '#yearSidebar', title: 'Your Dropbox forms', text: 'Browse years and months of forms in the left sidebar.' },
      { selector: '.statsRowExtra .batchExportCard, .statCard.batchExport', title: 'Batch export', text: 'Export multiple forms at once (premium feature).' },
      { selector: '.statsRowExtra .securityCard, .statCard.securityCard', title: 'App lock', text: 'Add or manage an app-lock password to protect the app.' }
    ];

    let idx = 0;

    // Create tour overlay elements
    // overlay no longer paints the whole surface; use four cover panels so we can
    // leave a transparent hole directly over the focused element (so it remains clear)
    const overlay = document.createElement('div'); overlay.id = 'bravoTourOverlay';
    overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.pointerEvents = 'auto'; overlay.style.setProperty('z-index', '2000000', 'important');

    const coverTop = document.createElement('div'); coverTop.id = 'bravoTourCoverTop';
    const coverLeft = document.createElement('div'); coverLeft.id = 'bravoTourCoverLeft';
    const coverRight = document.createElement('div'); coverRight.id = 'bravoTourCoverRight';
    const coverBottom = document.createElement('div'); coverBottom.id = 'bravoTourCoverBottom';
    [coverTop, coverLeft, coverRight, coverBottom].forEach(c => {
      c.style.position = 'absolute';
      c.style.background = 'rgba(3,6,12,0.55)';
      c.style.pointerEvents = 'auto';
      c.style.setProperty('z-index', '2000000', 'important');
      overlay.appendChild(c);
    });

    const highlight = document.createElement('div'); highlight.id = 'bravoTourHighlight';
    highlight.style.position = 'absolute'; highlight.style.border = '2px solid rgba(0,240,255,0.95)'; highlight.style.boxShadow = '0 8px 32px rgba(0,240,255,0.12), 0 0 36px rgba(0,200,255,0.1)'; highlight.style.borderRadius = '10px'; highlight.style.transition = 'all 260ms ease'; highlight.style.pointerEvents = 'none'; highlight.style.setProperty('z-index', '2000001', 'important');

    const tooltip = document.createElement('div'); tooltip.id = 'bravoTourTooltip';
    tooltip.style.position = 'absolute'; tooltip.style.minWidth = '260px'; tooltip.style.maxWidth = '420px'; tooltip.style.background = 'linear-gradient(180deg, rgba(8,12,20,0.98), rgba(6,10,16,0.96))'; tooltip.style.color = '#c8fbff'; tooltip.style.padding = '12px'; tooltip.style.borderRadius = '8px'; tooltip.style.boxShadow = '0 12px 36px rgba(0,0,0,0.4)'; tooltip.style.fontFamily = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial"; tooltip.style.setProperty('z-index', '2000001', 'important');

    const tTitle = document.createElement('div'); tTitle.style.fontWeight = '800'; tTitle.style.marginBottom = '6px'; tTitle.style.fontSize = '14px';
    const tText = document.createElement('div'); tText.style.fontSize = '13px'; tText.style.opacity = '0.95'; tText.style.marginBottom = '10px';

    const btnRow = document.createElement('div'); btnRow.style.display = 'flex'; btnRow.style.justifyContent = 'flex-end'; btnRow.style.gap = '8px';
    const skipBtn = document.createElement('button'); skipBtn.innerText = 'Skip'; skipBtn.style.background = 'transparent'; skipBtn.style.border = '1px solid rgba(255,255,255,0.06)'; skipBtn.style.color = '#9ef3ff'; skipBtn.style.padding = '8px 10px'; skipBtn.style.borderRadius = '6px';
    const prevBtn = document.createElement('button'); prevBtn.innerText = 'Prev'; prevBtn.style.background = 'transparent'; prevBtn.style.border = '1px solid rgba(255,255,255,0.06)'; prevBtn.style.color = '#9ef3ff'; prevBtn.style.padding = '8px 10px'; prevBtn.style.borderRadius = '6px'; prevBtn.disabled = true;
    const nextBtn = document.createElement('button'); nextBtn.innerText = 'Next'; nextBtn.className = 'glowBtn'; nextBtn.style.padding = '8px 12px'; nextBtn.style.borderRadius = '6px';
    btnRow.appendChild(skipBtn); btnRow.appendChild(prevBtn); btnRow.appendChild(nextBtn);

    tooltip.appendChild(tTitle); tooltip.appendChild(tText); tooltip.appendChild(btnRow);

    overlay.appendChild(highlight); overlay.appendChild(tooltip);
    document.body.appendChild(overlay);

    function teardown() {
      try { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); } catch (e) {}
      try { window.removeEventListener('resize', onResize); window.removeEventListener('keydown', onKey); } catch (e) {}
      try { localStorage.setItem('bravo_seen_tour_v1', '1'); } catch (e) {}
    }

    function getTargetRect(step) {
      try {
        const node = document.querySelector(step.selector);
        if (!node) return null;
        const r = node.getBoundingClientRect();
        return r;
      } catch (e) { return null; }
    }

    function showStep(i) {
      try {
        idx = i = Math.max(0, Math.min(steps.length - 1, i));
        const step = steps[i];
        tTitle.innerText = step.title || '';
        tText.innerText = step.text || '';
        prevBtn.disabled = (i === 0);
        nextBtn.innerText = (i === steps.length - 1) ? 'Finish' : 'Next';

        const rect = getTargetRect(step);
        const pad = 10;
        if (!rect) {
          // if target missing, make covers full-screen and center tooltip
          try { coverTop.style.left = '0'; coverTop.style.top = '0'; coverTop.style.width = '100%'; coverTop.style.height = '100%'; } catch (e) {}
          highlight.style.width = '0px'; highlight.style.height = '0px'; highlight.style.left = '-9999px'; highlight.style.top = '-9999px';
          const cx = window.innerWidth / 2 - 200; const cy = window.innerHeight / 2 - 60;
          tooltip.style.left = Math.max(12, cx) + 'px'; tooltip.style.top = Math.max(12, cy) + 'px';
          return;
        }

        // calculate hole coordinates (with padding)
        const left = Math.max(6, rect.left - pad);
        const top = Math.max(6, rect.top - pad);
        const holeW = rect.width + pad * 2;
        const holeH = rect.height + pad * 2;

        // position highlight over the hole
        highlight.style.left = left + 'px'; highlight.style.top = top + 'px';
        highlight.style.width = holeW + 'px'; highlight.style.height = holeH + 'px';

        // position the four cover panels around the hole
        // top cover: full width, from top to hole top
        coverTop.style.left = '0px'; coverTop.style.top = '0px'; coverTop.style.width = '100%'; coverTop.style.height = (top) + 'px';
        // bottom cover: full width, from hole bottom to end
        coverBottom.style.left = '0px'; coverBottom.style.top = (top + holeH) + 'px'; coverBottom.style.width = '100%'; coverBottom.style.height = Math.max(0, window.innerHeight - (top + holeH)) + 'px';
        // left cover: to the left of hole
        coverLeft.style.left = '0px'; coverLeft.style.top = (top) + 'px'; coverLeft.style.width = left + 'px'; coverLeft.style.height = holeH + 'px';
        // right cover: to the right of hole
        coverRight.style.left = (left + holeW) + 'px'; coverRight.style.top = (top) + 'px'; coverRight.style.width = Math.max(0, window.innerWidth - (left + holeW)) + 'px'; coverRight.style.height = holeH + 'px';

        // position tooltip above or below depending on space
        const tooltipWidth = Math.min(420, Math.max(260, rect.width));
        let tx = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        tx = Math.max(12, Math.min(window.innerWidth - tooltipWidth - 12, tx));
        let ty = rect.top - 12 - tooltip.offsetHeight;
        if (ty < 12) ty = rect.bottom + 12;
        tooltip.style.width = tooltipWidth + 'px';
        tooltip.style.left = tx + 'px';
        tooltip.style.top = ty + 'px';
      } catch (e) { console.warn('showStep failed', e); }
    }

    function onResize() { showStep(idx); }
    function onKey(ev) {
      try {
        if (ev.key === 'Escape') { teardown(); }
        if (ev.key === 'ArrowRight') { nextBtn.click(); }
        if (ev.key === 'ArrowLeft') { prevBtn.click(); }
      } catch (e) {}
    }

    nextBtn.addEventListener('click', () => {
      try { if (idx >= steps.length - 1) { teardown(); } else showStep(idx + 1); } catch (e) {}
    });
    prevBtn.addEventListener('click', () => { try { if (idx > 0) showStep(idx - 1); } catch (e) {} });
    skipBtn.addEventListener('click', teardown);

    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKey);

    // start at step 0
    setTimeout(() => showStep(0), 220);
  } catch (e) { console.warn('showWelcomeTour failed', e); }
}

// Show tour once on first-run (if not yet seen)
try { if (!localStorage.getItem('bravo_seen_tour_v1')) setTimeout(showWelcomeTour, 1500); } catch (e) {}

// Batch export tutorial persistence
const BATCH_TOUR_KEY = 'bravo_batch_tour_v1';
function _loadBatchTour() { try { const raw = localStorage.getItem(BATCH_TOUR_KEY); return raw ? JSON.parse(raw) : { acknowledged: false }; } catch (e) { return { acknowledged: false }; } }
function _saveBatchTour(obj) { try { localStorage.setItem(BATCH_TOUR_KEY, JSON.stringify(obj || {})); } catch (e) {} }

function showBatchExportTour(exportBtnEl, listWrapperEl, force) {
  try {
    if (!exportBtnEl || !listWrapperEl) return;
    const state = _loadBatchTour();
    if (!force && state && state.acknowledged) return;

    // Create overlay with hole punch highlight around export button and a sample checkbox
    const overlay = document.createElement('div'); overlay.id = 'bravoBatchTour'; overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.pointerEvents = 'auto'; overlay.style.setProperty('z-index', '2000000', 'important');
    const coverTop = document.createElement('div'); const coverLeft = document.createElement('div'); const coverRight = document.createElement('div'); const coverBottom = document.createElement('div');
    [coverTop, coverLeft, coverRight, coverBottom].forEach(c => { c.style.position = 'absolute'; c.style.background = 'rgba(3,6,12,0.6)'; c.style.setProperty('z-index', '2000000', 'important'); overlay.appendChild(c); });

    const highlight = document.createElement('div'); highlight.style.position = 'absolute'; highlight.style.border = '2px solid rgba(0,240,255,0.95)'; highlight.style.boxShadow = '0 12px 48px rgba(0,240,255,0.08)'; highlight.style.borderRadius = '8px'; highlight.style.setProperty('z-index', '2000001', 'important'); highlight.style.pointerEvents = 'none'; overlay.appendChild(highlight);

    const tooltip = document.createElement('div'); tooltip.style.position = 'absolute'; tooltip.style.setProperty('z-index', '2000002', 'important'); tooltip.style.minWidth = '280px'; tooltip.style.maxWidth = '420px'; tooltip.style.background = 'linear-gradient(180deg, rgba(8,12,20,0.98), rgba(6,10,16,0.96))'; tooltip.style.color = '#c8fbff'; tooltip.style.padding = '12px'; tooltip.style.borderRadius = '8px'; tooltip.style.boxShadow = '0 12px 36px rgba(0,0,0,0.4)';
    const tTitle = document.createElement('div'); tTitle.style.fontWeight = '800'; tTitle.style.marginBottom = '6px'; tTitle.innerText = 'Fast export — select multiple forms';
    const tText = document.createElement('div'); tText.style.fontSize = '13px'; tText.style.marginBottom = '10px'; tText.innerText = 'You can select many forms and press "Export Selected" to export or share them all at once. It’s fast and powerful — try it!';
    const cbWrap = document.createElement('div'); cbWrap.style.display = 'flex'; cbWrap.style.alignItems = 'center'; cbWrap.style.gap = '8px'; cbWrap.style.marginBottom = '8px';
    const dont = document.createElement('input'); dont.type = 'checkbox'; dont.id = 'batchTourDontShow'; const lbl = document.createElement('label'); lbl.htmlFor = 'batchTourDontShow'; lbl.style.color = '#bfeeff'; lbl.innerText = "Don't show again";
    cbWrap.appendChild(dont); cbWrap.appendChild(lbl);
    const btnRow = document.createElement('div'); btnRow.style.display = 'flex'; btnRow.style.justifyContent = 'flex-end'; btnRow.style.gap = '8px';
    const ok = document.createElement('button'); ok.className = 'glowBtn'; ok.innerText = 'OK'; ok.addEventListener('click', () => {
      try { if (dont.checked) { _saveBatchTour({ acknowledged: true }); } try { document.body.removeChild(overlay); } catch (e) {} } catch (e) {}
    });
    btnRow.appendChild(ok);
    tooltip.appendChild(tTitle); tooltip.appendChild(tText); tooltip.appendChild(cbWrap); tooltip.appendChild(btnRow);
    overlay.appendChild(tooltip);
    document.body.appendChild(overlay);

    function position() {
      try {
        const pad = 8;
        const eb = exportBtnEl.getBoundingClientRect();
        // try to find a checkbox to point at
        const chk = listWrapperEl.querySelector('input.batchExportCheckbox');
        const cbRect = chk ? chk.getBoundingClientRect() : null;

        // highlight export button by default
        const targetRect = eb;
        const left = Math.max(6, targetRect.left - pad);
        const top = Math.max(6, targetRect.top - pad);
        const holeW = targetRect.width + pad * 2;
        const holeH = targetRect.height + pad * 2;
        highlight.style.left = left + 'px'; highlight.style.top = top + 'px'; highlight.style.width = holeW + 'px'; highlight.style.height = holeH + 'px';

        // covers
        coverTop.style.left = '0px'; coverTop.style.top = '0px'; coverTop.style.width = '100%'; coverTop.style.height = top + 'px';
        coverBottom.style.left = '0px'; coverBottom.style.top = (top + holeH) + 'px'; coverBottom.style.width = '100%'; coverBottom.style.height = Math.max(0, window.innerHeight - (top + holeH)) + 'px';
        coverLeft.style.left = '0px'; coverLeft.style.top = top + 'px'; coverLeft.style.width = left + 'px'; coverLeft.style.height = holeH + 'px';
        coverRight.style.left = (left + holeW) + 'px'; coverRight.style.top = top + 'px'; coverRight.style.width = Math.max(0, window.innerWidth - (left + holeW)) + 'px'; coverRight.style.height = holeH + 'px';

        // position tooltip below export button if space, otherwise above
        const tooltipW = Math.min(420, Math.max(280, targetRect.width));
        let tx = targetRect.left + (targetRect.width / 2) - (tooltipW / 2);
        tx = Math.max(12, Math.min(window.innerWidth - tooltipW - 12, tx));
        let ty = targetRect.bottom + 12;
        if (ty + 120 > window.innerHeight) ty = targetRect.top - 12 - tooltip.offsetHeight; if (ty < 12) ty = 12;
        tooltip.style.width = tooltipW + 'px'; tooltip.style.left = tx + 'px'; tooltip.style.top = ty + 'px';
      } catch (e) { console.warn('batch tour position failed', e); }
    }

    window.addEventListener('resize', position); setTimeout(position, 120);
  } catch (e) { console.warn('showBatchExportTour failed', e); }
}

// Agreement storage key: records whether the user has acknowledged the premium-features message
const AGREEMENT_KEY = 'bravo_agreement_v1';

function _loadAgreement() {
  try { const raw = localStorage.getItem(AGREEMENT_KEY); return raw ? JSON.parse(raw) : { accepted: false, lastReminded: null }; } catch (e) { return { accepted: false, lastReminded: null }; }
}
function _saveAgreement(obj) { try { localStorage.setItem(AGREEMENT_KEY, JSON.stringify(obj || {})); } catch (e) {} }

function showAgreementModal(force) {
  try {
    const a = _loadAgreement();
    // allow showing while trial is active; do not silently skip because of a.accepted
    // Avoid duplicate overlays
    if (document.getElementById('bravoAgreementOverlay')) return;
    const overlay = document.createElement('div'); overlay.id = 'bravoAgreementOverlay'; overlay.className = 'modalOverlay';
    overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(0,0,0,0.7)'; overlay.style.setProperty('z-index', '2000000', 'important');
    const box = document.createElement('div'); box.className = 'modalBox'; box.style.minWidth = '480px'; box.style.maxWidth = '92%'; box.style.padding = '20px'; box.style.background = '#02101a'; box.style.color = '#e6fbff'; box.style.borderRadius = '12px'; box.style.setProperty('z-index', '2000001', 'important');
    const h = document.createElement('div'); h.style.fontWeight = '900'; h.style.marginBottom = '12px'; h.style.fontSize = '20px'; h.innerText = 'Optional Premium features — 7-day trial active';
    // Insert a prominent days-left counter (big, bold) when trial is running
    try {
      const lic = _loadLicense();
      const start = lic && lic.trialStart ? new Date(lic.trialStart) : null;
      if (start) {
        const now = new Date();
        const expiry = new Date(start.getTime() + (TRIAL_DAYS * 24 * 60 * 60 * 1000));
        const msLeft = Math.max(0, expiry.getTime() - now.getTime());
        const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
        const daysEl = document.createElement('div');
        daysEl.style.fontSize = '34px'; daysEl.style.fontWeight = '900'; daysEl.style.color = '#ffffff'; daysEl.style.marginBottom = '10px';
        daysEl.innerText = (daysLeft <= 0) ? 'Trial ended' : (daysLeft + (daysLeft === 1 ? ' day left' : ' days left'));
        box.appendChild(daysEl);
      }
    } catch (e) {}
    const p = document.createElement('div'); p.style.marginBottom = '12px'; p.style.lineHeight = '1.45'; p.style.color = '#dffbff'; p.style.fontSize = '15px';
    p.innerText = 'We have improved this app with new powerful features thats go beyond your requirements you did not request these features they are all our ideas to make your work easy if you like them you will let us know , these features will stop working afer some time and you need to buy them to continue enjoying ,Your trial lasts 7 days — after that premium features will stop working unless you activate the app with a product key, but dont worry you will still be able to see forms and export/share them .';
    const hint = document.createElement('div'); hint.style.marginBottom = '12px'; hint.style.color = '#bfeeff'; hint.style.fontSize = '14px'; hint.innerText = 'You will be reminded daily while your trial is active.';
    const actions = document.createElement('div'); actions.style.display = 'flex'; actions.style.justifyContent = 'flex-end'; actions.style.gap = '8px';
    const buy = document.createElement('button'); buy.className = 'glowBtn'; buy.innerText = 'Buy features'; buy.style.background = '#ef4444'; buy.style.color = '#fff';
    const accept = document.createElement('button'); accept.className = 'glowBtn'; accept.disabled = true; accept.innerText = 'Close (10s)';

    const featList = document.createElement('div'); featList.style.display = 'flex'; featList.style.flexDirection = 'column'; featList.style.gap = '6px'; featList.style.marginBottom = '8px';
    const premiumFeatures = ['Fast export-> Exporting and sharing many forms at once', 'Directly Opening and seeing all forms saved Today (new forms) ', 'See your Dropbox storage space & get notified when space is full', 'see the connected or Signed-in user account', 'See The Total forms in dropbox ', 'App Lock — protect the app +your forms with a password'];
    premiumFeatures.forEach(f => {
      try {
        const row = document.createElement('div'); row.style.display = 'flex'; row.style.alignItems = 'center'; row.style.gap = '10px';
        const t = document.createElement('div'); t.innerText = f; t.style.fontWeight = '700'; t.style.fontSize = '14px'; t.style.color = '#e6fbff';
        row.appendChild(t);
        const b = createPremiumBadge(); if (b) row.appendChild(b);
        featList.appendChild(row);
      } catch (e) {}
    });

    actions.appendChild(buy); actions.appendChild(accept);
    box.appendChild(h); box.appendChild(p); box.appendChild(featList); box.appendChild(hint); box.appendChild(actions); overlay.appendChild(box); document.body.appendChild(overlay);

    function teardown() { try { const el = document.getElementById('bravoAgreementOverlay'); if (el && el.parentNode) el.parentNode.removeChild(el); try { if (accept && accept._countdownTimer) { clearInterval(accept._countdownTimer); accept._countdownTimer = null; } } catch (e) {} } catch (e) {} }

    // Wire buy button to open the hosted purchase page
    try {
      const buyUrl = (typeof window !== 'undefined' && window.__PURCHASE_URL) ? window.__PURCHASE_URL : (PURCHASE_URL || 'https://example.com/buy');
      buy.addEventListener('click', () => { try { openPurchasePage({ reason: 'agreement' }); } catch (e) {} });
    } catch (e) {}

    // Start a 10s countdown that forces the user to read the modal
    try {
      let countdown = 15;
      accept._countdownTimer = setInterval(() => {
        try {
          countdown -= 1;
          if (countdown > 0) {
            accept.innerText = `Close (${countdown}s)`;
          } else {
            clearInterval(accept._countdownTimer);
            accept._countdownTimer = null;
            accept.disabled = false;
            accept.innerText = 'Close';
          }
        } catch (e) {}
      }, 1000);
    } catch (e) {}

    accept.addEventListener('click', () => { try { a.lastReminded = (new Date()).toISOString(); _saveAgreement(a); teardown(); } catch (e) {} });
  } catch (e) { console.warn('showAgreementModal failed', e); }
}

function checkAgreementOnStartup() {
  try {
    const a = _loadAgreement();
    // always run reminders while trial is active (do not skip based on accepted flag)
    // show on first-run quickly so users see it
    try {
      const lic = _loadLicense();
      if (!lic || lic.productKey) return; // already activated
      const start = lic && lic.trialStart ? new Date(lic.trialStart) : null;
      if (!start) return;
      const now = new Date();
      const expiry = new Date(start.getTime() + (TRIAL_DAYS * 24 * 60 * 60 * 1000));
      const daysLeft = Math.ceil((expiry - now) / (24 * 60 * 60 * 1000));
      // Show immediately if never reminded, otherwise show if within trial period
      if (!a.lastReminded) {
        setTimeout(() => showAgreementModal(false), 1800);
      } else if (now < expiry) {
        // schedule daily reminders while trial is active
        // show now only if last reminded > 24h ago
        try {
          const last = a.lastReminded ? new Date(a.lastReminded) : null;
          if (!last || (now.getTime() - last.getTime()) > 24 * 60 * 60 * 1000) setTimeout(() => showAgreementModal(false), 900);
        } catch (e) {}
        // ensure an interval exists to remind daily until accepted or trial expires
        try {
          if (!window._agreementReminderTimer) {
            window._agreementReminderTimer = setInterval(() => {
              try {
                const st = _loadLicense();
                if (!st || st.productKey) { clearInterval(window._agreementReminderTimer); window._agreementReminderTimer = null; return; }
                const s = st && st.trialStart ? new Date(st.trialStart) : null;
                if (!s) { clearInterval(window._agreementReminderTimer); window._agreementReminderTimer = null; return; }
                const now2 = new Date();
                const expiry2 = new Date(s.getTime() + (TRIAL_DAYS * 24 * 60 * 60 * 1000));
                if (now2 >= expiry2) { clearInterval(window._agreementReminderTimer); window._agreementReminderTimer = null; return; }
                try { showAgreementModal(true); } catch (e) {}
              } catch (e) {}
            }, 24 * 60 * 60 * 1000);
          }
        } catch (e) {}
      }
    } catch (e) {}
  } catch (e) { console.warn('checkAgreementOnStartup failed', e); }
}

// run agreement check after startup
try { setTimeout(checkAgreementOnStartup, 2000); } catch (e) {}

// Auto-update: listen for update events from main and apply automatically
try {
  if (window && window.electronAPI && window.electronAPI.updates) {
    window.electronAPI.updates.onUpdateAvailable((info) => {
      try { showNotification('Update', 'Update available — downloading in background', ''); } catch (e) {}
    });
    window.electronAPI.updates.onUpdateDownloaded((info) => {
      try { showNotification('Update ready', 'Installing update now — app will restart', 'success'); } catch (e) {}
      try { setTimeout(() => { try { window.electronAPI.updates.applyUpdate(); } catch (e) {} }, 1200); } catch (e) {}
    });
  }
} catch (e) {}

// Release notes modal for new release
function showReleaseModal(version) {
  try {
    if (document.getElementById('bravoReleaseOverlay')) return;
    // Remove any active tutorial overlays so the release modal appears in front
    try {
      const tourIds = ['bravoTourOverlay', 'bravoBatchTour', 'bravoAgreementOverlay'];
      tourIds.forEach(id => { try { const el = document.getElementById(id); if (el && el.parentNode) el.parentNode.removeChild(el); } catch (e) {} });
    } catch (e) {}

    const overlay = document.createElement('div'); overlay.id = 'bravoReleaseOverlay'; overlay.className = 'modalOverlay';
    overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(0,0,0,0.85)'; overlay.style.setProperty('z-index', '3000000', 'important');
    const box = document.createElement('div'); box.className = 'modalBox'; box.style.minWidth = '420px'; box.style.maxWidth = '92%'; box.style.padding = '20px'; box.style.background = '#02101a'; box.style.color = '#e6fbff'; box.style.borderRadius = '12px'; box.style.setProperty('z-index', '3000001', 'important');
    const h = document.createElement('div'); h.style.fontWeight = '900'; h.style.marginBottom = '12px'; h.style.fontSize = '20px'; h.innerText = `Bravo — Release ${version}`;
    const p = document.createElement('div'); p.style.marginBottom = '12px'; p.style.lineHeight = '1.45'; p.style.color = '#dffbff'; p.style.fontSize = '14px';
    p.innerText = 'Welcome to the new release. This update includes UI polish, improved exports, storage alerts, and security enhancements.';
    const list = document.createElement('ul'); list.style.margin = '8px 0 12px 18px'; list.style.color = '#bfeeff';
    const items = ['Futuristic splash and UI polish', 'In-app purchase landing + contact flow', 'Storage-threshold alerts & Buy CTA', 'App-lock and product-key unlock improvements', 'Batch export improvements and tutorials'];
    items.forEach(t => { try { const li = document.createElement('li'); li.innerText = t; list.appendChild(li); } catch (e) {} });
    const actions = document.createElement('div'); actions.style.display = 'flex'; actions.style.justifyContent = 'flex-end'; actions.style.gap = '8px';
    const details = document.createElement('button'); details.className = 'glowBtn'; details.innerText = 'View details';
    const close = document.createElement('button'); close.innerText = 'Continue'; close.className = 'glowBtn';
    actions.appendChild(details); actions.appendChild(close);
    box.appendChild(h); box.appendChild(p); box.appendChild(list); box.appendChild(actions); overlay.appendChild(box); document.body.appendChild(overlay);

    details.addEventListener('click', () => { try { if (typeof showAgreementModal === 'function') showAgreementModal(true); } catch (e) {} });
    close.addEventListener('click', () => { try { const el = document.getElementById('bravoReleaseOverlay'); if (el && el.parentNode) el.parentNode.removeChild(el); } catch (e) {} });
  } catch (e) { console.warn('showReleaseModal failed', e); }
}

// Show release modal once after startup if version changed
try {
  const prev = localStorage.getItem('bravo_last_release');
  const cur = (function(){ try { return require('../package.json').version || '0.0.4'; } catch (e) { try { return '0.0.4'; } catch (ee) { return '0.0.4'; } } })();
  if (!prev || prev !== cur) {
    try { setTimeout(() => showReleaseModal(cur), 800); localStorage.setItem('bravo_last_release', cur); } catch (e) {}
  }
} catch (e) {}

// --- Internet connectivity helpers
async function isOnline(checkUrl) {
  try {
    // quick navigator hint first
    if (typeof navigator !== 'undefined' && typeof navigator.onLine !== 'undefined' && !navigator.onLine) return false;
    // attempt a fast lightweight fetch to detect captive portals / real connectivity
    const url = checkUrl || (KEYS_JSON_URL || 'https://clients3.google.com/generate_204');
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store', signal: controller.signal }).catch(() => null);
    clearTimeout(t);
    if (!res) return false;
    // status 0 is possible in some environments; treat 200-399 as online
    return (res.status >= 200 && res.status < 400) || res.type === 'opaque' || res.status === 0;
  } catch (e) { return false; }
}

function showInternetRequiredModal() {
  try {
    if (document.getElementById('bravoNoInternetOverlay')) return;
    const overlay = document.createElement('div'); overlay.id = 'bravoNoInternetOverlay'; overlay.className = 'modalOverlay';
    overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(2,6,23,0.94)'; overlay.style.setProperty('z-index', '2000000', 'important');
    const box = document.createElement('div'); box.className = 'modalBox'; box.style.minWidth = '360px'; box.style.maxWidth = '92%'; box.style.padding = '18px'; box.style.borderRadius = '12px'; box.style.background = 'linear-gradient(180deg, rgba(8,12,16,0.98), rgba(6,10,12,0.98))'; box.style.color = '#dffbff'; box.style.setProperty('z-index', '2000001', 'important');
    const h = document.createElement('div'); h.style.fontWeight = '800'; h.style.fontSize = '16px'; h.style.marginBottom = '8px'; h.innerText = 'No internet connection';
    const p = document.createElement('div'); p.style.marginBottom = '12px'; p.style.lineHeight = '1.4'; p.style.color = '#bfeeff'; p.innerText = "This app requires an active internet connection to validate product keys and enable online features. Please connect to the internet and retry.";
    const actions = document.createElement('div'); actions.style.display = 'flex'; actions.style.justifyContent = 'flex-end'; actions.style.gap = '8px';
    const retry = document.createElement('button'); retry.className = 'glowBtn'; retry.innerText = 'Retry'; retry.style.padding = '8px 12px';
    const close = document.createElement('button'); close.innerText = 'Close'; close.style.border = '1px solid rgba(255,255,255,0.06)'; close.style.background = 'transparent'; close.style.color = '#bfeeff'; close.style.padding = '8px 12px'; close.style.borderRadius = '6px';
    actions.appendChild(close); actions.appendChild(retry);
    box.appendChild(h); box.appendChild(p); box.appendChild(actions); overlay.appendChild(box); document.body.appendChild(overlay);

    // Retry will attempt a quick online check and remove the modal if successful
    retry.addEventListener('click', async () => {
      try {
        try { showSpinner('Checking internet...'); } catch (e) {}
        const ok = await isOnline();
        try { hideSpinner(); } catch (e) {}
        if (ok) {
          try { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); } catch (e) {}
          showNotification('Connected', 'Internet connection detected', 'success');
        } else {
          showNotification('Still offline', 'No internet connection detected', 'error');
        }
      } catch (e) { try { hideSpinner(); } catch (ex) {} }
    });

    // Close simply leaves the modal visible but non-destructive; keep it removable
    close.addEventListener('click', () => { try { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); } catch (e) {} });
  } catch (e) { console.warn('showInternetRequiredModal failed', e); }
}

function hideInternetRequiredModal() {
  try { const el = document.getElementById('bravoNoInternetOverlay'); if (el && el.parentNode) el.parentNode.removeChild(el); } catch (e) {}
}

// Listen for network changes to show/hide the offline modal
try {
  window.addEventListener && window.addEventListener('offline', () => { try { showInternetRequiredModal(); } catch (e) {} });
  window.addEventListener && window.addEventListener('online', () => { try { hideInternetRequiredModal(); showNotification('Connected', 'Internet connection restored', 'success'); } catch (e) {} });
  // initial check shortly after startup
  setTimeout(async () => { try { const ok = await isOnline(); if (!ok) showInternetRequiredModal(); } catch (e) {} }, 1200);
} catch (e) { console.warn('network listeners failed', e); }

// Add a small Help button next to the Refresh control to start the tour on demand
try {
  const mountHelpBtn = () => {
    try {
      const ref = document.getElementById('refreshList') || refreshBtn;
      if (!ref || ref._helpBtnInstalled) return;
      const btn = document.createElement('button');
      btn.id = 'helpTourBtn';
      btn.className = 'glowBtn';
      btn.innerText = 'Help';
      btn.title = 'Show quick tour';
      btn.style.marginLeft = '8px';
      btn.addEventListener('click', () => { try { showWelcomeTour(true); } catch (e) {} });
      if (ref.parentNode) ref.parentNode.insertBefore(btn, ref.nextSibling);
      ref._helpBtnInstalled = true;
    } catch (e) { /* ignore mount failures */ }
  };
  setTimeout(mountHelpBtn, 600);
  // try again later if the toolbar is created after load
  setTimeout(mountHelpBtn, 3000);
} catch (e) {}
// Sidebar should remain visible to show year cards

// Connect logic is now handled by the stat card connect button in renderStatsCards

if (refreshBtn) refreshBtn.addEventListener('click', loadDropboxFiles);

function isDropboxActive() {
  try { return document.body.classList && document.body.classList.contains('dropbox-active'); } catch (e) { return false; }
}

// Small inline loading helpers for connect card and sidebar actions
function createInlineSpinner(text) {
  const s = document.createElement('span');
  s.className = 'inlineSpinner';
  s.style.display = 'inline-flex';
  s.style.alignItems = 'center';
  s.style.gap = '8px';
  s.style.fontSize = '13px';
  s.style.color = '#94a3b8';
  s.innerHTML = `<svg width="14" height="14" viewBox="0 0 50 50" style="animation:spin 1s linear infinite"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="31.4 31.4"></circle></svg><span>${text||'Loading'}</span>`;
  return s;
}

function setConnectLoading(on, msg) {
  try {
    const card = document.getElementById('dropboxConnectCard');
    if (!card) return;
    if (on) {
      card.classList.add('loading');
      // add spinner if not present
      if (!card.querySelector('.inlineSpinner')) {
        const spinner = createInlineSpinner(msg || 'Checking');
        const hint = card.querySelector('.hint');
        if (hint && hint.parentNode) hint.parentNode.insertBefore(spinner, hint.nextSibling);
      }
      const btn = card.querySelector('button'); if (btn) btn.disabled = true;
    } else {
      card.classList.remove('loading');
      const sp = card.querySelector('.inlineSpinner'); if (sp && sp.parentNode) sp.parentNode.removeChild(sp);
      const btn = card.querySelector('button'); if (btn) btn.disabled = false;
    }
  } catch (e) { console.warn('setConnectLoading failed', e); }
}

// simple CSS for spinner animation injected once
try {
    if (!document.getElementById('inlineSpinnerStyles')) {
    const st = document.createElement('style'); st.id = 'inlineSpinnerStyles';
    st.innerHTML = '@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} .inlineSpinner svg{color:rgba(148,163,184,0.9)}\n' +
      '.pulseExportBtn { animation: pulse 1200ms infinite; transform-origin: center; }\n' +
      '@keyframes pulse { 0% { transform: scale(1); box-shadow: 0 0 0 rgba(0,240,255,0);} 50% { transform: scale(1.06); box-shadow: 0 8px 30px rgba(0,200,255,0.35);} 100% { transform: scale(1); box-shadow: 0 0 0 rgba(0,240,255,0);} }';
    document.head && document.head.appendChild(st);
  }
} catch (e) {}

async function loadDropboxFiles() {
  // keep a central loading state while we fetch the remote index
  const center = document.getElementById('displayContainer') || document.getElementById('center');
  // show connect card loading state while we probe
  try { setConnectLoading(true, 'Loading list...'); } catch (e) {}
  // Ensure we are connected before attempting to list Dropbox files. If not connected,
  // show a subtle placeholder prompting the user to connect and do not render remote data.
  try {
    if (window.electronAPI && window.electronAPI.drive && typeof window.electronAPI.drive.getDebug === 'function') {
      const dbg = await window.electronAPI.drive.getDebug().catch(() => null);
      if (!dbg || !dbg.ok || !dbg.info || !dbg.info.hasRefreshToken) {
        if (center) center.innerHTML = '<div class="placeholder">Not connected to Dropbox. Click "Connect" to sync forms.</div>';
        return;
      }
    }
  } catch (e) { /* ignore and continue */ }
  if (center) {
    center.style.display = 'flex';
    // Do not show a loading placeholder here — keep the watermark visible until results arrive
  }
  // ensure sidebar remains visible; year cards will be rendered once connected
  try {
    const res = await window.electronAPI.drive.listFilesRecursive('');
    if (!res || !res.ok) {
      if (center) center.innerHTML = '<div class="placeholder">Failed to load: ' + (res && res.error || '') + '</div>';
      return;
    }
    const entries = res.entries || [];
    // cache current remote entries for filtering by year on-demand
    currentEntries = entries;
    if (!entries.length) {
      if (center) center.innerHTML = '<div class="placeholder">No files found in Dropbox.</div>';
      try { setConnectLoading(false); } catch (e) {}
      return;
    }
    // Render modern stat cards in preview space
    renderStatsCards(entries);
    // Render year cards as before
    renderYearCards(entries);
    // Align stats row vertically with the first year card
    try { setTimeout(alignStatsRow, 40); } catch (e) {}
    try { setConnectLoading(false); } catch (e) {}
  } catch (err) {
    console.error(err);
    if (center) center.innerHTML = '<div class="placeholder">Error loading files.</div>';
    try { setConnectLoading(false); } catch (e) {}
  }
}

function alignStatsRow() {
  try {
    const stats = document.querySelector('.statsRow');
    const firstYear = document.querySelector('#localList .yearCardsSidebar .yearCard.center');
    const rn = document.getElementById('displayContainer') || document.getElementById('center');
    if (!stats || !firstYear || !rn) return;
    const yrRect = firstYear.getBoundingClientRect();
    const rnRect = rn.getBoundingClientRect();
    let top = yrRect.top - rnRect.top;
    if (top < 0) top = 0;
    // Add small offset to avoid overlap with container border
    top = Math.max(2, Math.round(top));
    stats.style.top = top + 'px';
  } catch (e) { console.warn('alignStatsRow failed', e); }
}

// Keep alignment on window resize
try { window.addEventListener('resize', () => { try { alignStatsRow(); } catch (e) {} }); } catch (e) {}

// Hide restore controls after a successful restore so users don't keep seeing restore buttons
function hideRestoreControls() {
  try {
    localStorage.setItem('restoreCompleted', '1');
    document.body.classList.add('restoresHidden');
  } catch (e) { console.warn('hideRestoreControls error', e); }
}

// Initialize restoresHidden state on load
try { if (localStorage.getItem('restoreCompleted')) document.body.classList.add('restoresHidden'); } catch (e) {}

// Render year cards
function renderYearCards(entries) {
  try {
    if (!isDropboxActive()) {
      const localList = document.getElementById('localList');
      if (!localList) return;
      localList.innerHTML = '';
      const wrapper = document.createElement('div'); wrapper.className = 'yearCardsSidebar';
      const card = document.createElement('div'); card.className = 'yearCard center';
      const badge = document.createElement('div'); badge.className = 'statusBadge'; badge.innerText = 'NOT CONNECTED'; card.appendChild(badge);
      const title = document.createElement('div'); title.className = 'yearTitle'; title.innerText = 'Dropbox disconnected'; card.appendChild(title);
      const metaRow = document.createElement('div'); metaRow.className = 'yearMetaRow'; metaRow.innerHTML = '<div class="metaItem">Connect to sync and view years</div>'; card.appendChild(metaRow);
      const actions = document.createElement('div'); actions.style.marginTop = '12px';
      const btn = document.createElement('button'); btn.className = 'glowBtn'; btn.innerText = 'Connect';
      btn.addEventListener('click', async () => { try { if (connectBtn && typeof connectBtn.click === 'function') return connectBtn.click(); if (window.electronAPI && window.electronAPI.drive && typeof window.electronAPI.drive.signIn === 'function') { await window.electronAPI.drive.signIn(); } } catch (e) { console.warn('connect from placeholder failed', e); } });
      actions.appendChild(btn); card.appendChild(actions); wrapper.appendChild(card); localList.appendChild(wrapper); return;
    }
  } catch (e) { console.warn('renderYearCards early exit failed', e); }
  const yearMap = {};
  entries.forEach(e => {
    try {
      if (!e || !e.server_modified) return;
      const d = new Date(e.server_modified);
      if (isNaN(d.getTime())) return;
      const y = String(d.getFullYear());
      if (!yearMap[y]) yearMap[y] = { count: 0, months: new Set() };
      yearMap[y].count++;
      const m = String(d.getMonth() + 1).padStart(2, '0');
      yearMap[y].months.add(m);
    } catch (err) {}
  });

  const years = Object.keys(yearMap).sort((a, b) => Number(b) - Number(a));
  const localList = document.getElementById('localList');
  if (!localList) return;
  // Remove all year cards and placeholders
  localList.innerHTML = '';
  // Ensure only one persistent sidebar heading exists (avoid duplicates)
  try {
    Array.from(document.querySelectorAll('.sidebarHeadingFixed, .sidebarHeading')).forEach(n => { try { n.parentNode && n.parentNode.removeChild(n); } catch (e) {} });
  } catch (e) {}
  // Create a sticky header that does not scroll with year cards
  try {
    const sidebar = document.getElementById('yearSidebar') || localList.parentNode;
    const heading = document.createElement('div');
    heading.className = 'sidebarHeading sidebarHeadingFixed';
    heading.id = 'sidebarHeadingFixed';
    heading.innerText = 'Your Dropbox forms';
    if (sidebar && sidebar.insertBefore) sidebar.insertBefore(heading, localList);
    else localList.insertBefore(heading, localList.firstChild);
  } catch (e) { /* ignore header creation failures */ }
  if (!years.length) {
    // no year cards yet — keep the heading visible but don't show the old error text
    return;
  }

  // Create a vertical column wrapper for year cards
  let wrapper = document.createElement('div');
  wrapper.className = 'yearCardsSidebar';
  localList.appendChild(wrapper);

  years.forEach(year => {
    const info = yearMap[year];
    const monthList = Array.from(info.months).sort((a, b) => Number(b) - Number(a));

    const card = document.createElement('div');
    card.className = 'yearCard center';
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => { try { showYearFormsModal(year); } catch (e) { console.warn('year card click failed', e); } });

    const badge = document.createElement('div');
    badge.className = 'statusBadge';
    badge.innerText = info.count > 0 ? 'DATA READY' : 'NO DATA';
    card.appendChild(badge);

    const title = document.createElement('div');
    title.className = 'yearTitle';
    title.innerText = year;

    const metaRow = document.createElement('div');
    metaRow.className = 'yearMetaRow';
    const forms = document.createElement('div'); forms.className = 'metaItem'; forms.innerHTML = '📊<span>' + info.count + '</span> forms';
    const months = document.createElement('div'); months.className = 'metaItem'; months.innerHTML = '📅<span>' + monthList.length + '</span> months';
    metaRow.appendChild(forms); metaRow.appendChild(months);

    const actions = document.createElement('div');
    actions.style.marginTop = '16px';
    const viewBtn = document.createElement('button');
    viewBtn.className = 'glowBtn';
    viewBtn.innerText = 'Open';
    viewBtn.addEventListener('click', () => showYearFormsModal(year));
    actions.appendChild(viewBtn);

    card.appendChild(title);
    card.appendChild(metaRow);
    card.appendChild(actions);
    wrapper.appendChild(card);
  });
  // Ensure sidebar has bottom padding so the last card can be scrolled fully into view
  try {
    const sidebar = document.getElementById('yearSidebar');
    if (sidebar) {
      try { sidebar.style.paddingBottom = sidebar.style.paddingBottom || '96px'; } catch (e) {}
      try { sidebar.style.scrollPaddingBottom = sidebar.style.scrollPaddingBottom || '28px'; } catch (e) {}
    }
    if (wrapper) {
      try { wrapper.style.paddingBottom = wrapper.style.paddingBottom || '96px'; } catch (e) {}
    }
  } catch (e) {}
}

// Render top-level stats: total forms and forms today
function renderStatsCards(entries) {
  try {
    const center = document.getElementById('displayContainer') || document.getElementById('center');
    if (!center) return;
    // remove existing stats row if present
    const existing = center.querySelector('.statsRow');
    if (existing) existing.remove();

    const statsRow = document.createElement('div');
    statsRow.className = 'statsRow';

    // Only count actual file entries (exclude folders)
    const fileEntries = (entries || []).filter(e => e && (e.raw && (e.raw['.tag'] === 'file') || e['.tag'] === 'file' || (e.raw && e.raw['.tag'] === 'file')));
    const total = document.createElement('div');
    total.className = 'statCard';
    // Header indicating these are the user's Dropbox forms
    const totalHeader = document.createElement('div'); totalHeader.className = 'statHeader'; totalHeader.innerText = 'Your forms in Dropbox';
    const totalVal = document.createElement('div'); totalVal.className = 'statValue';
    try {
      if (!isFeatureEnabled('totalCard')) {
        totalVal.innerText = 'Trial expired';
      } else {
        totalVal.innerText = (fileEntries && fileEntries.length) ? String(fileEntries.length) : '0';
      }
    } catch (e) { totalVal.innerText = (fileEntries && fileEntries.length) ? String(fileEntries.length) : '0'; }
    const totalLabel = document.createElement('div'); totalLabel.className = 'statLabel'; totalLabel.innerText = 'Total forms';
    total.appendChild(totalHeader); total.appendChild(totalVal); total.appendChild(totalLabel);

    const today = document.createElement('div');
    today.className = 'statCard';
    // give the Today card a bit more room so action buttons can lay out horizontally
    try { today.style.minWidth = '260px'; today.style.minHeight = '110px'; today.style.paddingBottom = '12px'; } catch (e) {}
    // Header for clarity: "Forms saved today"
    const todayHeader = document.createElement('div');
    todayHeader.className = 'statHeader';
    todayHeader.style.fontSize = '12px';
    todayHeader.style.color = 'var(--text-muted)';
    todayHeader.style.fontWeight = '700';
    todayHeader.style.marginBottom = '8px';
    todayHeader.innerText = 'Forms saved today';
    const todayVal = document.createElement('div'); todayVal.className = 'statValue';
    const todayCount = (fileEntries || []).reduce((acc, e) => {
      try {
        if (!e || !e.server_modified) return acc;
        const d = new Date(e.server_modified);
        const now = new Date();
        if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()) return acc + 1;
      } catch (e) {}
      return acc;
    }, 0);
    try {
      if (!isFeatureEnabled('openToday')) {
        todayVal.innerText = 'Trial expired';
      } else {
        todayVal.innerText = String(todayCount);
      }
    } catch (e) { todayVal.innerText = String(todayCount); }
    // Action button container — use flex with gap and wrap to avoid overlap
    const todayActions = document.createElement('div');
    todayActions.style.marginTop = '12px';
    todayActions.style.display = 'flex';
    todayActions.style.gap = '8px';
    todayActions.style.flexWrap = 'wrap';
    todayActions.style.alignItems = 'center';
    const openTodayBtn = document.createElement('button'); openTodayBtn.className = 'glowBtn'; openTodayBtn.innerText = 'Open';
    openTodayBtn.addEventListener('click', (ev) => {
      try {
        ev && ev.stopPropagation && ev.stopPropagation();
        if (!isFeatureEnabled('openToday')) { showTrialExpiredModal('Open Today'); return; }
        showTodayFormsModal();
      } catch (e) { console.warn('openTodayBtn failed', e); }
    });
    todayActions.appendChild(openTodayBtn);
    const exportTodayBtn = document.createElement('button'); exportTodayBtn.className = 'glowBtn'; exportTodayBtn.style.marginLeft = '8px'; exportTodayBtn.innerText = "Export All Today's Forms (PDF)";
    exportTodayBtn.addEventListener('click', async (ev) => {
      try {
        ev && ev.stopPropagation && ev.stopPropagation();
        if (!isFeatureEnabled('batchExport')) { showTrialExpiredModal('Batch export'); return; }
        const now = new Date();
        const todays = (fileEntries || []).filter(e => { try { if (!e || !e.server_modified) return false; const d = new Date(e.server_modified); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate(); } catch (e) { return false; } }).sort((a,b) => new Date(b.server_modified) - new Date(a.server_modified));
        if (!todays || !todays.length) return showNotification('No forms', 'No forms saved today to export', 'error');
        // Export all forms saved today
        const toExport = todays.slice();
        try { showSpinner('Preparing export...'); } catch (e) {}
        const wrappers = [];
        const tempPaths = [];
        const failed = [];
        for (const entry of toExport) {
          try {
            const hints = [entry.path_lower, entry.path_display, entry.path || entry.name, entry.name];
            let dl = null;
            for (const h of hints) {
              if (!h) continue;
              try { dl = await window.electronAPI.drive.downloadToTemp(h, entry.name).catch(() => null); } catch (e) { dl = null; }
              if (dl && dl.ok && dl.path) break;
            }
            if (!dl || !dl.ok || !dl.path) { failed.push({ name: entry.name, reason: 'download_failed' }); continue; }
            tempPaths.push(dl.path);
            const rf = await window.electronAPI.readFile(dl.path).catch(() => null);
            if (!rf || !rf.ok) { failed.push({ name: entry.name, reason: 'read_failed' }); continue; }
            let obj = null; try { obj = JSON.parse(rf.data); } catch (e) { obj = { payload: rf.data }; }
            const wrapper = obj.payload ? obj : { payload: obj };
            wrapper.meta = wrapper.meta || {};
            wrapper.meta.filePath = dl.path;
            try { if (entry.server_modified) wrapper.meta.server_modified = entry.server_modified; } catch (e) {}
            try { if (entry.path_lower) wrapper.meta.path_lower = entry.path_lower; } catch (e) {}
            try { if (entry.name) wrapper.meta.name = entry.name; } catch (e) {}
            wrappers.push(wrapper);
          } catch (e) { console.warn('prepare wrapper failed', e); }
        }
        if (!wrappers.length) { try { for (const p of tempPaths) await window.electronAPI.drive.deleteLocalForm(p).catch(() => null); } catch (e) {} return showNotification('No valid forms', 'No forms prepared for export', 'error'); }
        try { hideSpinner(); } catch (e) {}
        const res = await window.electronAPI.exportFormsPdf(wrappers, { year: String(now.getFullYear()), baseName: 'forms_today', saveToDocuments: true });
        if (res && res.ok) {
          // auto-open the saved PDF in folder if possible
          try { if (window.electronAPI && typeof window.electronAPI.revealInFolder === 'function') await window.electronAPI.revealInFolder(res.pdfPath); } catch (e) { console.warn('revealInFolder failed', e); }
          showNotification('Export saved', 'Saved to Documents', 'success');
          try { for (const p of tempPaths) await window.electronAPI.drive.deleteLocalForm(p).catch(() => null); } catch (e) {}
        } else {
          showNotification('Export failed', (res && res.error) ? res.error : 'Unknown error', 'error');
          try { for (const p of tempPaths) await window.electronAPI.drive.deleteLocalForm(p).catch(() => null); } catch (e) {}
        }
      } catch (e) { console.warn('exportTodayBtn failed', e); showNotification('Export failed', String(e), 'error'); }
      finally { try { hideSpinner(); } catch (e) {} }
    });
    todayActions.appendChild(exportTodayBtn);
    // Compose today card
    today.appendChild(todayHeader);
    today.appendChild(todayVal);
    today.appendChild(todayActions);
    // Make the whole card clickable as well
    try { today.style.cursor = 'pointer'; } catch (e) {}
    try { today.addEventListener('click', () => { try { if (!isFeatureEnabled('openToday')) { showTrialExpiredModal('Open Today'); return; } showTodayFormsModal(); } catch (e) { console.warn('showTodayFormsModal failed', e); } }); } catch (e) {}

    const connect = document.createElement('div');
    connect.className = 'statCard connectCard';
    connect.id = 'dropboxConnectCard';
    const connTitle = document.createElement('div'); connTitle.className = 'statValue'; connTitle.style.fontSize = '18px'; connTitle.innerText = document.body.classList.contains('dropbox-active') ? 'Dropbox — Connected' : 'Connect Dropbox';
    const connHint = document.createElement('div'); connHint.className = 'hint'; connHint.innerText = document.body.classList.contains('dropbox-active') ? 'Account connected' : 'Connect to sync and download forms';
    const connBtn = document.createElement('button'); connBtn.className = 'glowBtn'; connBtn.style.alignSelf = 'stretch'; connBtn.innerText = document.body.classList.contains('dropbox-active') ? 'Manage Connection' : 'Connect';
    try { if (document.body.classList.contains('dropbox-active')) connect.classList.add('connected'); else connect.classList.remove('connected'); } catch (e) {}
    connBtn.addEventListener('click', async (ev) => {
      try {
        ev && ev.stopPropagation && ev.stopPropagation();
        // If already connected, surface manage options; otherwise initiate sign-in
        if (document.body.classList.contains('dropbox-active')) {
          try { showManageConnectionModal(); } catch (e) { console.warn('showManageConnectionModal failed', e); }
          return;
        }
        if (connectBtn && typeof connectBtn.click === 'function') return connectBtn.click();
        if (window.electronAPI && window.electronAPI.drive && typeof window.electronAPI.drive.signIn === 'function') {
          try { await window.electronAPI.drive.signIn(); } catch (e) {}
        }
      } catch (e) { console.warn('connect action failed', e); }
    });
    connect.appendChild(connTitle); connect.appendChild(connHint); connect.appendChild(connBtn);

    statsRow.appendChild(total); statsRow.appendChild(today); statsRow.appendChild(connect);
    
    // insert statsRow at the top of center
    center.insertBefore(statsRow, center.firstChild);

      

    // Extra row: smaller Dropbox-powered cards (Signed-in user, Storage)
    try {
      // remove any previously inserted extra rows to avoid duplicates
      try {
        const prev = center.querySelectorAll && center.querySelectorAll('.statsRowExtra');
        if (prev && prev.length) Array.from(prev).forEach(n => { try { n.parentNode && n.parentNode.removeChild(n); } catch (e) {} });
      } catch (e) {}
      const extraRow = document.createElement('div');
      extraRow.className = 'statsRowExtra';
      extraRow.style.display = 'flex';
      extraRow.style.gap = '16px';
      extraRow.style.justifyContent = 'center';
      extraRow.style.marginTop = '12px';

      const userCard = document.createElement('div');
      userCard.className = 'statCard small userCard';
      userCard.style.minWidth = '220px';
      userCard.style.maxWidth = '260px';
      userCard.innerHTML = `
        <div style="display:flex;gap:12px;align-items:center;width:100%">
          <img class="cardBadge" src="../assets/image.png" />
          <img class="statAvatar" src="" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.06)"/>
          <div style="flex:1;min-width:0">
            <div class="statHeader">Signed in as</div>
            <div class="statValue smallName">Not signed in</div>
            <div class="statLabel smallMuted">—</div>
          </div>
        </div>
      `;

      const storageCard = document.createElement('div');
      storageCard.className = 'statCard small storageCard';
      storageCard.style.minWidth = '220px';
      storageCard.style.maxWidth = '260px';
      storageCard.innerHTML = `
        <div style="width:100%">
          <img class="cardBadge" src="../assets/image.png" />
          <div class="statHeader">Dropbox storage</div>
          <div class="statValue storageNumbers">—</div>
          <div class="storageProgress" style="width:100%;max-width:200px;height:12px;background:rgba(255,255,255,0.06);border-radius:8px;overflow:hidden;margin-top:8px">
            <div class="storageFill" style="width:0%;height:100%;background:linear-gradient(90deg,#1ea7ff,#6f5cff)"></div>
          </div>
          <div style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end">
            <button class="glowBtn" id="manageStorageBtn" style="padding:8px 12px;font-size:13px">Manage</button>
          </div>
        </div>
      `;

      extraRow.appendChild(userCard);
      extraRow.appendChild(storageCard);
      // Batch Export card: reuse year selection to open year forms modal for batch actions
      try {
        const batchCard = document.createElement('div');
        batchCard.className = 'statCard small batchExportCard';
        batchCard.style.minWidth = '220px';
        batchCard.style.maxWidth = '260px';
        batchCard.innerHTML = `
          <div style="width:100%">
            <img class="cardBadge" src="../assets/image.png" />
            <div class="statHeader">Batch export</div>
            <div class="statValue">Export multiple forms</div>
            <div style="margin-top:8px;font-size:12px;color:var(--text-muted)">Select a year to open and choose forms</div>
            <div style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end">
              <button class="glowBtn" id="batchExportBtn" style="padding:8px 12px;font-size:13px">Batch Export</button>
            </div>
          </div>
        `;
        extraRow.appendChild(batchCard);
        // compact Security card: App lock (shows Add password when available)
        try {
          const secSmall = document.createElement('div');
          secSmall.className = 'statCard small securityCard';
          secSmall.style.minWidth = '160px';
          secSmall.style.maxWidth = '200px';
          secSmall.innerHTML = `
            <div style="display:flex;gap:12px;align-items:center;width:100%">
              <div style="font-size:20px">🔒</div>
              <div style="flex:1;min-width:0">
                <div class="statHeader">App lock</div>
                <div class="statValue smallLockState">—</div>
              </div>
            </div>
            <div style="margin-top:8px;display:flex;gap:8px;justify-content:flex-end">
              <button class="glowBtn" id="manageSecurityBtn" style="padding:6px 10px;font-size:12px">Manage</button>
            </div>
          `;
          extraRow.appendChild(secSmall);
          // set initial state
          try {
            const stateEl = secSmall.querySelector('.smallLockState');
            if (!isFeatureEnabled('securityCard')) { if (stateEl) stateEl.innerText = 'Expired'; }
            else {
              const has = Boolean(localStorage.getItem('bravo_lock_v1'));
              if (stateEl) stateEl.innerText = has ? 'Locked' : 'Add password';
            }
          } catch (e) {}
          // wire manage button
          try {
            const m = secSmall.querySelector('#manageSecurityBtn');
            if (m) m.addEventListener('click', (ev) => { try { ev && ev.stopPropagation && ev.stopPropagation(); if (!isFeatureEnabled('securityCard')) { showTrialExpiredModal('App lock'); return; } showSecurityModal(); } catch (e) { console.warn('manageSecurityBtn failed', e); } });
          } catch (e) {}
          // make the whole small card clickable (open add/change/remove modal)
          try {
            secSmall.style.cursor = 'pointer';
            secSmall.style.pointerEvents = 'auto';
            secSmall.addEventListener('click', (ev) => {
              try {
                ev && ev.stopPropagation && ev.stopPropagation();
                if (!isFeatureEnabled('securityCard')) { showTrialExpiredModal('App lock'); return; }
                showSecurityModal();
              } catch (e) { console.warn('securityCard click failed', e); }
            });
          } catch (e) {}
        } catch (e) { console.warn('compact security card failed', e); }
        // make entire card surface clickable and wire the internal button
        try {
          batchCard.style.cursor = 'pointer';
          batchCard.style.pointerEvents = 'auto';
          batchCard.addEventListener('click', (ev) => {
            try {
              ev && ev.stopPropagation && ev.stopPropagation();
              if (!isFeatureEnabled('batchExport')) { showTrialExpiredModal('Batch export'); return; }
              // if user clicked a control inside the card (like a button), let that event run normally
              // but if they clicked the card surface, open the year picker
              showBatchYearPicker(currentEntries || []);
            } catch (e) { console.warn('batchCard click failed', e); }
          });
          const b = batchCard.querySelector('#batchExportBtn');
          if (b) {
            b.addEventListener('click', (ev) => {
              try { ev.stopPropagation(); if (!isFeatureEnabled('batchExport')) { showTrialExpiredModal('Batch export'); return; } showBatchYearPicker(currentEntries || []); } catch (e) { console.warn('batchExport button failed', e); }
            });
          }
        } catch (e) { console.warn('batchExport wiring failed', e); }
      } catch (e) { console.warn('creating batch export card failed', e); }
      // Prefer inserting the extraRow into the explicit extra-cards area
      // (replaces legacy filters). If that area isn't present, fall back
      // to the previous insert-before-display absolute overlay behavior.
      try {
        const extraHost = document.getElementById('extraCardsArea');
        if (extraHost) {
          // remove duplicates inside the host
          try { const prev = extraHost.querySelectorAll && extraHost.querySelectorAll('.statsRowExtra'); if (prev && prev.length) Array.from(prev).forEach(n => { try { n.parentNode && n.parentNode.removeChild(n); } catch (e) {} }); } catch (e) {}
          extraRow.style.position = 'relative';
          extraRow.style.marginTop = '';
          extraRow.style.left = '';
          extraRow.style.transform = '';
          extraRow.style.zIndex = '';
          extraRow.style.pointerEvents = 'auto';
          extraHost.appendChild(extraRow);
        } else {
          const displayEl = document.getElementById('displayContainer') || center;
          const host = (displayEl && displayEl.parentNode) ? displayEl.parentNode : center;
          // ensure host is positioned so absolute child can align to it
          try { const cs = window.getComputedStyle(host); if (cs && cs.position === 'static') host.style.position = 'relative'; } catch (e) {}
          host.insertBefore(extraRow, displayEl);
          // After insertion, measure and position absolutely centered above the display
          requestAnimationFrame(() => {
            try {
              // Use relative positioning so the row flows with layout and will reflow
              // correctly when the display or data changes (prevents stuck cards).
              extraRow.style.position = 'relative';
              extraRow.style.left = '50%';
              extraRow.style.transform = 'translateX(-50%)';
              extraRow.style.zIndex = '12000';
              extraRow.style.pointerEvents = 'auto';
              // place it slightly overlapping the top of displayEl using margin
              const hostRect = host.getBoundingClientRect();
              const dispRect = displayEl.getBoundingClientRect();
              const extraH = extraRow.offsetHeight || 72;
              const top = Math.max(8, (dispRect.top - hostRect.top) - (extraH / 2));
              extraRow.style.marginTop = top + 'px';
            } catch (e) { /* ignore positioning errors */ }
          });
        }
      } catch (e) { try { center.appendChild(extraRow); } catch (ex) {} }

      // Async populate user & storage info
      (async () => {
        try {
          // account info (respect trial gating)
          try {
            const acc = await (window.electronAPI && window.electronAPI.drive && typeof window.electronAPI.drive.getAccount === 'function' ? window.electronAPI.drive.getAccount() : Promise.resolve(null));
            const avatarImg = userCard.querySelector('img.statAvatar');
            const nameEl = userCard.querySelector('.smallName');
            const labelEl = userCard.querySelector('.statLabel');
            if (!isFeatureEnabled('userCard')) {
              try { if (nameEl) nameEl.innerText = 'Expired'; } catch (e) {}
              try { if (labelEl) labelEl.innerText = ''; } catch (e) {}
              try { if (avatarImg) avatarImg.style.display = 'none'; } catch (e) {}
            } else {
              if (acc && acc.ok && acc.info) {
                const info = acc.info;
                const name = (info.name && info.name.display_name) ? info.name.display_name : (info.email || 'User');
                const email = info.email || '';
                try { if (avatarImg && info.profile_photo_url) avatarImg.src = info.profile_photo_url; else if (avatarImg) avatarImg.style.display = 'none'; } catch (e) {}
                try { if (nameEl) nameEl.innerText = name; } catch (e) {}
                try { if (labelEl) labelEl.innerText = email; } catch (e) {}
              }
            }
          } catch (e) { /* ignore account fetch failures */ }

          // storage info (debug/quota) (respect trial gating)
          try {
            const numbers = storageCard.querySelector('.storageNumbers');
            const fill = storageCard.querySelector('.storageFill');
            if (!isFeatureEnabled('storageCard')) {
              try { if (numbers) numbers.innerText = 'Expired'; } catch (e) {}
              try { if (fill) fill.style.width = '0%'; } catch (e) {}
            } else {
              const dbg = await (window.electronAPI && window.electronAPI.drive && typeof window.electronAPI.drive.getDebug === 'function' ? window.electronAPI.drive.getDebug() : Promise.resolve(null));
              let used = 0, total = 0;
              if (dbg && dbg.ok && dbg.info) {
                const info = dbg.info;
                if (info.quota) {
                  used = info.quota.used_bytes || info.quota.used || 0;
                  total = (info.quota.allocation && (info.quota.allocation.allocated_bytes || info.quota.allocation)) || info.quota.allocated_bytes || 0;
                } else if (info.usage) {
                  used = info.usage.used || info.usage.used_bytes || 0;
                  total = info.usage.total || 0;
                } else if (typeof info.space_used !== 'undefined') {
                  used = info.space_used || 0; total = info.space_total || 0;
                }
              }
              if (total > 0) {
                const pct = Math.max(0, Math.min(100, Math.round((used / total) * 100)));
                const formatStorage = (bytes) => {
                  try {
                    const gb = bytes / 1024 / 1024 / 1024;
                    if (gb >= 1) return gb.toFixed(1) + ' GB';
                    const mb = bytes / 1024 / 1024;
                    return mb.toFixed(1) + ' MB';
                  } catch (e) { return '0.0 GB'; }
                };
                try { if (numbers) numbers.innerText = `${formatStorage(used)} / ${formatStorage(total)}`; } catch (e) {}
                try { if (fill) fill.style.width = pct + '%'; } catch (e) {}
              } else {
                try { if (numbers) numbers.innerText = 'Unknown'; } catch (e) {}
              }
            }
          } catch (e) { /* ignore storage fetch failures */ }

          // Manage button opens existing manage modal if available (respect gating)
          try {
            const mbtn = document.getElementById('manageStorageBtn');
            if (mbtn) mbtn.addEventListener('click', (ev) => { try { ev && ev.stopPropagation && ev.stopPropagation(); if (!isFeatureEnabled('storageCard')) { showTrialExpiredModal('Storage'); return; } if (typeof showManageConnectionModal === 'function') return showManageConnectionModal(); if (window.electronAPI && typeof window.electronAPI.revealInFolder === 'function') window.electronAPI.revealInFolder(''); } catch (e) {} });
          } catch (e) { }
          // make clicking the cards themselves show trial expired modal when gated
          try { if (userCard) userCard.addEventListener('click', (ev) => { try { ev && ev.stopPropagation && ev.stopPropagation(); if (!isFeatureEnabled('userCard')) { showTrialExpiredModal('User info'); return; } } catch (e) {} }); } catch (e) {}
          try { if (storageCard) storageCard.addEventListener('click', (ev) => { try { ev && ev.stopPropagation && ev.stopPropagation(); if (!isFeatureEnabled('storageCard')) { showTrialExpiredModal('Storage'); return; } const mbtn = document.getElementById('manageStorageBtn'); if (mbtn) mbtn.click(); } catch (e) {} }); } catch (e) {}
        } catch (e) { /* overall extraRow population error */ }
      })();
    } catch (e) { console.warn('extra stats row creation failed', e); }
  } catch (e) { console.warn('renderStatsCards failed', e); }
}

// Update the connect card when Dropbox status changes
function updateConnectCard() {
  try {
    const card = document.getElementById('dropboxConnectCard');
    if (!card) return;
    const isActive = document.body.classList.contains('dropbox-active');
    console.debug && console.debug('updateConnectCard: isActive=', isActive);
    const title = card.querySelector('.statValue');
    const hint = card.querySelector('.hint');
    const btn = card.querySelector('button');
    if (title) title.innerText = isActive ? 'Dropbox — Connected' : 'Connect Dropbox';
    if (hint) hint.innerText = isActive ? 'Account connected' : 'Connect to sync and download forms';
    if (btn) btn.innerText = isActive ? 'Manage Connection' : 'Connect';
    try {
      if (isActive) { card.classList.add('connected'); if (btn) btn.classList.add('connected'); }
      else { card.classList.remove('connected'); if (btn) btn.classList.remove('connected'); }
    } catch (e) {}
  } catch (e) { console.warn('updateConnectCard failed', e); }
}

// Show year details modal
function showYearDetails(year, months) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(0,0,0,0.3)';
  overlay.style.zIndex = '20000';
  
  const box = document.createElement('div');
  box.style.position = 'fixed';
  box.style.left = '50%';
  box.style.top = '50%';
  box.style.transform = 'translate(-50%,-50%)';
  box.style.background = '#fff';
  box.style.padding = '16px';
  box.style.borderRadius = '10px';
  box.style.minWidth = '280px';
  box.style.maxHeight = '70vh';
  box.style.overflow = 'auto';
  box.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
  
  const title = document.createElement('div');
  title.style.fontWeight = '800';
  title.style.fontSize = '18px';
  title.style.marginBottom = '12px';
  title.innerText = `Months in ${year}`;
  
  const monthList = document.createElement('div');
  monthList.style.display = 'flex';
  monthList.style.flexWrap = 'wrap';
  monthList.style.gap = '8px';
  
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  months.forEach(m => {
    const mBtn = document.createElement('button');
    mBtn.innerText = monthNames[Number(m) - 1] || m;
    mBtn.style.padding = '8px 12px';
    mBtn.style.background = '#f0f4f8';
    mBtn.style.border = '1px solid #e2e8f0';
    mBtn.style.borderRadius = '6px';
    mBtn.style.cursor = 'default';
    monthList.appendChild(mBtn);
  });
  
  const closeBtn = document.createElement('button');
  closeBtn.innerText = 'Close';
  closeBtn.style.marginTop = '12px';
  closeBtn.style.width = '100%';
  closeBtn.style.padding = '8px';
  closeBtn.style.background = '#0b5bd7';
  closeBtn.style.color = '#fff';
  closeBtn.style.border = 'none';
  closeBtn.style.borderRadius = '6px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.addEventListener('click', () => close());
  
  box.appendChild(title);
  box.appendChild(monthList);
  box.appendChild(closeBtn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  
  function close() {
    try { document.body.removeChild(overlay); } catch (e) {}
  }
}

// If a token already exists, load automatically
// UI state
async function checkExistingSignIn() {
  try {
    try { setConnectLoading(true, 'Checking sign-in...'); } catch (e) {}
    const dbg = await window.electronAPI.drive.getDebug();
    if (dbg && dbg.ok && dbg.info && dbg.info.hasRefreshToken) {
      console.debug && console.debug('renderer: checkExistingSignIn - refresh token present');
      // mark connected and load files
      try { connectBtn.innerText = 'Connected'; } catch (e) {}
      // fetch account and show user info
      try {
        const acc = await window.electronAPI.drive.getAccount();
        if (acc && acc.ok && acc.info) showAccount(acc.info);
        try { updateExtraCards(); } catch (e) {}
      } catch (e) { console.warn('failed to get account', e); }
      await loadDropboxFiles();
      try { updateDropboxStatus(true); } catch (e) {}
      try { updateExtraCards(); } catch (e) {}
      try { setConnectLoading(false); } catch (e) {}
    }
    else {
      // Not signed in: ensure the connect card is visible so user can initiate sign-in
      try { updateDropboxStatus(false); } catch (e) {}
      try { renderStatsCards([]); } catch (e) {}
      try { renderYearCards([]); } catch (e) {}
      try { setConnectLoading(false); } catch (e) {}
    }
  } catch (e) {
    console.warn('renderer: failed to check existing sign-in', e);
    try { setConnectLoading(false); } catch (er) {}
  } finally {
    // Ensure any startup spinner set when splash was disabled is cleared
    try {
      if (_startupSpinnerTimeout) { clearTimeout(_startupSpinnerTimeout); _startupSpinnerTimeout = null; }
    } catch (e) {}
    try { hideSpinner(true); } catch (e) {}
  }
}

// run initial check
setTimeout(() => { checkExistingSignIn(); }, 600);
// show disconnected sidebar quickly on app load so Connect is visible immediately
try { renderYearCards([]); } catch (e) {}
// load local history immediately as well
setTimeout(() => { try { loadLocalHistory(); } catch (e) { console.warn('initial local history load failed', e); } }, 900);

// Re-check Dropbox sign-in when the app regains focus or becomes visible (useful for OAuth redirect flows)
try {
  document.addEventListener('visibilitychange', () => {
    try { if (document.visibilityState === 'visible') checkExistingSignIn(); } catch (e) {}
  });
  window.addEventListener('focus', () => { try { checkExistingSignIn(); } catch (e) {} });
} catch (e) { console.warn('focus/visibility handlers failed', e); }

// Listen for main process notification that OAuth sign-in completed in external browser
try {
  if (window.electronAPI && window.electronAPI.drive && typeof window.electronAPI.drive.onSignedIn === 'function') {
    window.electronAPI.drive.onSignedIn((info) => {
      try {
        console.debug && console.debug('renderer: onSignedIn received', info);
        // Ensure the connect card is present immediately so UI updates are visible
        try { renderStatsCards([]); } catch (e) { console.warn('renderStatsCards onSignedIn failed', e); }
        // Mark connected and update visuals
        try { updateDropboxStatus(true, info && info.res && info.res.info ? info.res.info : null); } catch (e) { console.warn('updateDropboxStatus onSignedIn failed', e); }
        // Fetch account info and reload lists
        try { if (typeof loadAccountAfterSignIn === 'function') loadAccountAfterSignIn(); } catch (e) { console.warn('loadAccountAfterSignIn onSignedIn failed', e); }
        try { loadDropboxFiles(); } catch (e) { console.warn('loadDropboxFiles onSignedIn failed', e); }
      } catch (e) { console.warn('onSignedIn handler failed', e); }
    });
  }
} catch (e) { console.warn('drive onSignedIn wiring failed', e); }

// Shared preview close routine
function closePreview() {
  try { document.body.classList.remove('previewFull'); } catch (e) {}
  const rnMount = document.getElementById('displayContainer');
  if (rnMount) { rnMount.style.display = 'none'; try { rnMount.innerHTML = ''; } catch (e) {} }
  // iframe removed: nothing to restore
}

// Close preview on Escape key for discoverable keyboard-based exit
document.addEventListener('keydown', (ev) => {
  try {
    if (ev.key === 'Escape' && document.body.classList.contains('previewFull')) {
      closePreview();
    }
  } catch (e) {}
});
let currentEntries = [];
let currentLocalHistory = [];
let searchDebounce = null;
const monthFilter = document.getElementById && document.getElementById('monthFilter');
const dateFrom = document.getElementById && document.getElementById('dateFrom');
const dateTo = document.getElementById && document.getElementById('dateTo');
const quickFilters = document.getElementById && document.getElementById('quickFilters');
let siteFilter = null;

// Load local history (restored/imported forms) and render in the UI
async function loadLocalHistory() {
  try {
    const localList = document.getElementById('localList');
    // show a lightweight placeholder immediately so UI doesn't block
    try { if (localList) localList.innerHTML = '<div class="placeholder">Loading local history...</div>'; } catch (e) {}
    // Defer heavy parsing to the next tick so the DOM update can render
    await new Promise(r => setTimeout(r, 10));
    const res = await window.electronAPI.drive.getLocalHistory();
    if (!res || !res.ok) {
      // don't render error text in the sidebar; leave it empty to avoid clutter
      if (localList) localList.innerHTML = '';
      return;
    }
    const list = res.list || [];
    currentLocalHistory = list;
    populateMonthFilter(list);
    try { populateQuickFilters(list); } catch (e) {}
    renderLocalHistory(list);
  } catch (e) {
    console.error('loadLocalHistory failed', e);
    const localList = document.getElementById('localList'); if (localList) localList.innerHTML = '';
  }
}

// Open an entry in the existing modal preview (extracted so search results can reuse it)
async function openEntryModal(entry) {
  try {
    const fp = entry.meta && entry.meta.filePath;
    if (!fp) return showNotification('Open failed', 'No file path for this entry.', 'error');

    try { showSpinner('Opening...'); } catch (e) {}
    const r = await window.electronAPI.readFile(fp);
    try { hideSpinner(); } catch (e) {}
    if (!r || !r.ok) return showNotification('Open failed', 'Unable to read file for preview.', 'error');

    let obj = null;
    try { obj = JSON.parse(r.data); } catch (e) { obj = { payload: r.data }; }
    const wrapped = obj.payload ? obj : { payload: obj };

    // Build modal overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.45)';
    // ensure overlay appears above decorative layers and above any requested base overlay
    try {
      const base = entry && entry._overlayZ ? Number(entry._overlayZ) || 0 : 0;
      const ovZ = Math.max(2000000, base + 1);
      overlay.style.setProperty('z-index', String(ovZ), 'important');
    } catch (e) { overlay.style.setProperty('z-index', '2000000', 'important'); }
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    const modal = document.createElement('div');
    modal.style.background = '#fff';
    modal.style.position = 'relative';
    modal.style.borderRadius = '10px';
    modal.style.width = '1400px';
    modal.style.maxWidth = 'calc(100% - 32px)';
    modal.style.maxHeight = '90vh';
    modal.style.overflow = 'hidden';
    modal.style.display = 'flex';
    try { modal.style.setProperty('z-index', String((overlay.style && overlay.style.zIndex) ? (Number(overlay.style.zIndex) + 1) : 2000001), 'important'); } catch (e) { modal.style.setProperty('z-index', '2000001', 'important'); }
    modal.style.flexDirection = 'column';
    modal.style.boxShadow = '0 12px 40px rgba(0,0,0,0.25)';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.padding = '8px 12px';
    header.style.borderBottom = '1px solid #eee';

    // Left: title + export button
    const leftGroup = document.createElement('div');
    leftGroup.style.display = 'flex';
    leftGroup.style.alignItems = 'center';
    leftGroup.style.gap = '12px';

    const title = document.createElement('div');
    title.style.fontWeight = '800';
    title.innerText = entry.title || (wrapped && wrapped.payload && (wrapped.payload.title || wrapped.payload.name)) || 'Form';

    const exportBtn = document.createElement('button');
    exportBtn.innerText = 'Export PDF';
    exportBtn.style.display = 'inline-flex';
    exportBtn.style.alignItems = 'center';
    exportBtn.style.justifyContent = 'center';
    exportBtn.style.padding = '10px 16px';
    exportBtn.style.minWidth = '96px';
    exportBtn.style.background = '#0b5bd7';
    exportBtn.style.color = '#fff';
    exportBtn.style.border = 'none';
    exportBtn.style.borderRadius = '8px';
    exportBtn.style.cursor = 'pointer';

    leftGroup.appendChild(title);
    leftGroup.appendChild(exportBtn);

    // Right: close button
    const rightGroup = document.createElement('div');
    rightGroup.style.display = 'flex';
    rightGroup.style.alignItems = 'center';

    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'Close';
    closeBtn.style.display = 'inline-flex';
    closeBtn.style.alignItems = 'center';
    closeBtn.style.justifyContent = 'center';
    closeBtn.style.padding = '10px 16px';
    closeBtn.style.minWidth = '80px';
    closeBtn.style.background = '#e5e7eb';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '8px';
    closeBtn.style.cursor = 'pointer';

    rightGroup.appendChild(closeBtn);

    header.appendChild(leftGroup);
    header.appendChild(rightGroup);

    const content = document.createElement('div');
    content.style.flex = '1';
    content.style.overflow = 'auto';
    content.style.display = 'flex';
    content.style.justifyContent = 'center';
    content.style.alignItems = 'flex-start';
    content.style.padding = '12px';

    const mount = document.createElement('div');
    mount.style.width = '100%';
    mount.style.boxSizing = 'border-box';
    mount.style.display = 'block';
    mount.style.minWidth = '100%';
    mount.style.overflowX = 'auto';
    content.appendChild(mount);

    modal.appendChild(header);
    modal.appendChild(content);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Render using RN presentational renderer when available
    let renderedByRn = false;
    try { showSpinner('Opening form...'); } catch (e) {}
    try {
      if (window.rnRenderer && typeof window.rnRenderer.renderFormInto === 'function') {
        try {
          window.rnRenderer.renderFormInto(mount, wrapped);
          renderedByRn = true;
        } catch (e) { console.warn('renderFormInto failed', e); }
      }
    } catch (e) { /* ignore */ }

    // If RN renderer not available or failed, fall back to server HTML or raw HTML
    if (!renderedByRn) {
      try {
        const gen = await window.electronAPI.generateFormHtml(wrapped);
        if (gen && gen.ok && gen.html) {
          const frame = document.createElement('iframe');
          frame.style.width = '100%';
          frame.style.height = '100%';
          frame.style.border = '0';
          frame.srcdoc = gen.html;
          content.innerHTML = '';
          content.appendChild(frame);
        } else {
          const html = payloadToHtml(wrapped.payload, entry.title || 'Imported Form');
          const frame = document.createElement('iframe');
          frame.style.width = '100%';
          frame.style.height = '100%';
          frame.style.border = '0';
          frame.srcdoc = html;
          content.innerHTML = '';
          content.appendChild(frame);
        }
      } catch (e) {
        console.warn('fallback html render failed', e);
      }
    }

    // hide spinner after render / fallback content appended
    try { hideSpinner(); } catch (e) {}

    // Export logic (kept inline to preserve behavior)
    exportBtn.addEventListener('click', async () => {
      try {
        exportBtn.disabled = true; exportBtn.innerText = 'Preparing...';
        try { showSpinner('Preparing export...'); } catch (e) {}

        if (window.electronAPI && typeof window.electronAPI.exportFormPdf === 'function') {
          try {
            // If exporter hint not present, attempt to set one from RN renderer debug info
            try {
              if (wrapped && wrapped.payload) {
                wrapped.payload.metadata = wrapped.payload.metadata || {};
                if (!wrapped.payload.metadata.exporter && window.__rnLastDebug && window.__rnLastDebug.payloadSummary) {
                  const key = (window.__rnLastDebug.payloadSummary.typeKey || window.__rnLastDebug.resolvedKey || '').toString();
                  if (key) {
                    wrapped.payload.metadata.exporter = key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                  }
                }
              }
            } catch (e) { /* ignore debug extraction failures */ }
          } catch (e) {}
          const res = await window.electronAPI.exportFormPdf(wrapped, { saveToDocuments: true });
          if (res && res.ok) {
            try {
              const overlay = document.createElement('div'); overlay.className = 'modalOverlay';
              // ensure overlay is full-screen and above everything (use important)
              overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.background = 'rgba(0,0,0,0.35)';
              overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center';
              overlay.style.setProperty('z-index', '2000000', 'important');

              const box = document.createElement('div'); box.className = 'modalBox';
              box.style.position = 'relative'; box.style.minWidth = '320px'; box.style.maxWidth = '80%'; box.style.background = '#fff';
              box.style.padding = '14px'; box.style.borderRadius = '10px'; box.style.boxShadow = '0 12px 40px rgba(0,0,0,0.25)';
              box.style.setProperty('z-index', '2000001', 'important');

              const h = document.createElement('div'); h.style.fontWeight = '800'; h.style.marginBottom = '8px'; h.innerText = 'Export saved';
              const p = document.createElement('div'); p.innerText = 'Saved to Documents'; p.title = res.pdfPath || '';
              const actions = document.createElement('div'); actions.className = 'modalActions'; actions.style.display = 'flex'; actions.style.gap = '8px'; actions.style.marginTop = '12px';
              const go = document.createElement('button'); go.innerText = 'Go'; go.addEventListener('click', async () => {
                try { if (window.electronAPI && typeof window.electronAPI.revealInFolder === 'function') { await window.electronAPI.revealInFolder(res.pdfPath); } else { console.warn('revealInFolder not available'); } } catch (e) { console.warn('revealInFolder failed', e); }
              });
              const ok = document.createElement('button'); ok.innerText = 'OK'; ok.addEventListener('click', () => { try { document.body.removeChild(overlay); } catch (e) {} });
              actions.appendChild(go); actions.appendChild(ok);
              box.appendChild(h); box.appendChild(p); box.appendChild(actions); overlay.appendChild(box); document.body.appendChild(overlay);
            } catch (e) {
              showNotification('Export saved', 'Saved PDF to: ' + res.pdfPath, 'success');
            }
            return;
          }
          throw new Error(res && res.error ? res.error : 'exportFormPdf failed');
        }

        throw new Error('No exporter available (exportFormPdf not found)');
      } catch (e) {
        console.error('export failed', e);
        showNotification('Export failed', String(e), 'error');
      } finally {
        try { exportBtn.disabled = false; exportBtn.innerText = 'Export PDF'; } catch (e) {}
        try { hideSpinner(); } catch (e) {}
      }
    });

    // Close helpers (resolve when modal closed)
    return new Promise((resolve) => {
      function closeModal() { try { document.body.removeChild(overlay); } catch (e) {} try { document.removeEventListener('keydown', escHandler); } catch (e) {} resolve(); }
      closeBtn.addEventListener('click', closeModal);
      overlay.addEventListener('click', (ev) => { if (ev.target === overlay) closeModal(); });
      const escHandler = (ev) => { if (ev.key === 'Escape') { closeModal(); } };
      document.addEventListener('keydown', escHandler);
    });

  } catch (e) { console.warn('openEntryModal failed', e); showNotification('Open failed', String(e), 'error'); }
}

function populateMonthFilter(list) {
  try {
    if (!monthFilter) return;
    const setMonths = new Set();
    list.forEach(item => {
      const saved = item.savedAt || (item.meta && item.meta.savedAt) || Date.now();
      const d = new Date(saved);
      if (!isNaN(d.getTime())) setMonths.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
    });
    const arr = Array.from(setMonths).sort().reverse();
    monthFilter.innerHTML = '<option value="all">All months</option>' + arr.map(m => `<option value="${m}">${m}</option>`).join('');
  } catch (e) { console.warn('populateMonthFilter failed', e); }
}

function populateQuickFilters(list) {
  try {
    if (!quickFilters) return;
    quickFilters.innerHTML = '';
    // Today chip
    const todayChip = document.createElement('button'); todayChip.className = 'chip small'; todayChip.innerText = 'Today';
    todayChip.addEventListener('click', () => {
      const now = new Date(); const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      if (dateFrom) dateFrom.value = new Date(startOfDay).toISOString().slice(0,10);
      if (dateTo) dateTo.value = new Date(startOfDay).toISOString().slice(0,10);
      performLocalSearch();
    });
    quickFilters.appendChild(todayChip);

    // All months chip
    const allChip = document.createElement('button'); allChip.className = 'chip small'; allChip.innerText = 'All months';
    allChip.addEventListener('click', () => {
      if (monthFilter) monthFilter.value = 'all'; if (dateFrom) dateFrom.value = ''; if (dateTo) dateTo.value = '';
      siteFilter = null; performLocalSearch();
      // clear active classes on site chips
      Array.from(quickFilters.querySelectorAll('[data-role="site"]')).forEach(c => c.classList.remove('active'));
    });
    quickFilters.appendChild(allChip);

    // Last N days chip (prompt)
    const lastN = document.createElement('button'); lastN.className = 'chip small'; lastN.innerText = 'Last N days';
    lastN.addEventListener('click', () => {
      const n = prompt('Enter number of days (e.g. 7):');
      const nn = Number(n);
      if (!nn || nn <= 0) return;
      const now = Date.now(); const from = now - (nn * 24 * 60 * 60 * 1000);
      if (dateFrom) dateFrom.value = new Date(from).toISOString().slice(0,10);
      if (dateTo) dateTo.value = new Date(now).toISOString().slice(0,10);
      performLocalSearch();
    });
    quickFilters.appendChild(lastN);

    // dynamic site chips only (type filter removed)
    const sites = new Set();
    (list || []).forEach(item => {
      const p = item.meta && item.meta.payload || {};
      if (p.site) sites.add(p.site);
      if (item.location) sites.add(item.location);
    });
    if (sites.size) {
      const slabel = document.createElement('div'); slabel.style.marginLeft='8px'; slabel.style.fontSize='13px'; slabel.style.color='#475569'; slabel.innerText='Site:'; quickFilters.appendChild(slabel);
      Array.from(sites).slice(0,8).forEach(s => {
        const b = document.createElement('button'); b.className = 'chip small'; b.setAttribute('data-role','site'); b.innerText = s; b.addEventListener('click', (ev) => {
          // toggle selected site
          siteFilter = siteFilter === s ? null : s;
          // update classes: mark only site chips, leave base chips untouched
          Array.from(quickFilters.querySelectorAll('[data-role="site"]')).forEach(c => { if (c.innerText === s) c.classList.toggle('active'); else c.classList.remove('active'); });
          performLocalSearch();
        }); quickFilters.appendChild(b);
      });
    }
  } catch (e) { console.warn('populateQuickFilters failed', e); }
}

function performLocalSearch() {
  try {
    const q = (searchInput && searchInput.value || '').trim().toLowerCase();
    const mf = (monthFilter && monthFilter.value) || 'all';
    const from = (dateFrom && dateFrom.value) ? new Date(dateFrom.value) : null;
    const to = (dateTo && dateTo.value) ? new Date(dateTo.value) : null;
    const list = (currentLocalHistory || []).filter(item => {
      try {
        const saved = item.savedAt || (item.meta && item.meta.savedAt) || null;
        if (mf && mf !== 'all' && saved) {
          const monthKey = `${new Date(saved).getFullYear()}-${String(new Date(saved).getMonth()+1).padStart(2,'0')}`;
          if (monthKey !== mf) return false;
        }
        if (from && saved) {
          if (new Date(saved) < from) return false;
        }
        if (to && saved) {
          const dayEnd = new Date(to); dayEnd.setHours(23,59,59,999);
          if (new Date(saved) > dayEnd) return false;
        }
        const payload = (item.meta && item.meta.payload) || {};
        // type filter removed; searching by type remains available via the search input
        if (siteFilter) {
          const s = payload.site || item.location || '';
          if (!s || s.toString().toLowerCase() !== siteFilter.toString().toLowerCase()) return false;
        }
        if (!q) return true;
        // search title, site, location, formType, filename
        const title = (item.title || (payload && (payload.title || payload.formType)) || '').toString().toLowerCase();
        if (title.indexOf(q) !== -1) return true;
        const fields = ['site','location','formType','companyName','shift'];
        for (const f of fields) {
          const v = payload[f]; if (v && v.toString && v.toString().toLowerCase().indexOf(q) !== -1) return true;
        }
        // search file path
        const fp = item.meta && item.meta.filePath || '';
        if (fp.toLowerCase().indexOf(q) !== -1) return true;
        return false;
      } catch (e) { return false; }
    });
    // sort by savedAt desc
    const results = list.sort((a,b) => (b.savedAt||0) - (a.savedAt||0));
    renderLocalHistory(results);
    try { showSearchResultsInCenter(results); } catch (e) {}
  } catch (e) { console.warn('performLocalSearch failed', e); }
}

// wire search input and filters
try {
  if (searchInput) searchInput.addEventListener('input', () => { if (searchDebounce) clearTimeout(searchDebounce); searchDebounce = setTimeout(performLocalSearch, 260); });
  if (monthFilter) monthFilter.addEventListener('change', performLocalSearch);
  if (dateFrom) dateFrom.addEventListener('change', performLocalSearch);
  if (dateTo) dateTo.addEventListener('change', performLocalSearch);
} catch (e) {}

// Make clicking the dateField wrapper open the date picker (where supported)
try {
  const dateWrappers = document.querySelectorAll('.dateField');
  dateWrappers.forEach(w => {
    const input = w.querySelector('input[type="date"]');
    if (!input) return;
    w.addEventListener('click', (ev) => {
      try {
        // Prefer showPicker() when available (modern browsers/Chromium)
        if (typeof input.showPicker === 'function') {
          input.showPicker();
          return;
        }
        // fallback: focus + dispatch click to input
        input.focus();
        const ev2 = new MouseEvent('click', { bubbles: true, cancelable: true });
        input.dispatchEvent(ev2);
      } catch (e) {}
    });
    // ensure input change triggers search as before
    input.addEventListener('change', performLocalSearch);
  });
} catch (e) {}

// Wire Download Forms button: show Dropbox year list and load files
if (downloadBtn) {
  downloadBtn.addEventListener('click', async () => {
    try {
      downloadBtn.disabled = true;
      const prev = downloadBtn.innerText;
      downloadBtn.innerText = 'Loading...';
      try { downloadBtn.classList.add('loading'); } catch (e) {}
      try { showSpinner('Loading list...'); } catch (e) {}
      // show the central year view and load remote list (sidebar removed)
        try {
          // When user explicitly requests Download Forms, ensure restore buttons are visible
          // even if previously hidden after a restore. This only affects the UI temporarily;
          // a successful restore will persist the hidden state via localStorage.
          document.body.classList.remove('restoresHidden');
          document.body.classList.add('showRestores');
        } catch (e) {}
      await loadDropboxFiles();
    } catch (e) { console.warn('downloadFormsBtn error', e); }
    finally { try { downloadBtn.classList.remove('loading'); } catch (e) {} downloadBtn.disabled = false; downloadBtn.innerText = 'Download Forms'; try { hideSpinner(); } catch (e) {} }
  });
}

// Removed renderLocalHistory: local/restored forms are no longer displayed. Year cards are now rendered in #localList.

  // Render search results in the center preview (`#rnPreview`) as clickable cards
  function showSearchResultsInCenter(results) {
    try {
      const rn = document.getElementById('displayContainer') || document.getElementById('center');
      if (!rn) return;
      // prepare container
      rn.innerHTML = '';
      rn.style.display = 'flex';
      rn.style.justifyContent = 'center';
      rn.style.alignItems = 'flex-start';
      const wrapper = document.createElement('div');
      wrapper.className = 'searchResultsCenter';
      if (!results || !results.length) {
        const p = document.createElement('div'); p.className = 'placeholder'; p.innerText = 'No results'; wrapper.appendChild(p);
        rn.appendChild(wrapper);
        document.body.classList.add('previewFull');
        return;
      }
      results.forEach(entry => {
        const hit = document.createElement('div'); hit.className = 'search-hit';
        const left = document.createElement('div'); left.style.display = 'flex'; left.style.alignItems = 'center';
        const txt = document.createElement('div'); txt.style.display = 'flex'; txt.style.flexDirection = 'column';
        const title = document.createElement('div'); title.className = 'title'; title.innerText = getFriendlyTitle(entry, entry && entry.meta && entry.meta.payload ? { payload: entry.meta.payload } : null) || 'Untitled';
        const meta = document.createElement('div'); meta.className = 'search-meta'; meta.innerText = `Saved: ${new Date(entry.savedAt || (entry.meta && entry.meta.savedAt) || Date.now()).toLocaleDateString()}`;
        txt.appendChild(title); txt.appendChild(meta);
        left.appendChild(txt);
        const actions = document.createElement('div'); actions.className = 'search-actions';
        const openBtnC = document.createElement('button'); openBtnC.innerText = 'Open';
        openBtnC.addEventListener('click', () => { try { openEntryModal(entry); } catch (e) { console.warn('openEntryModal failed', e); } });
        actions.appendChild(openBtnC);
        hit.appendChild(left); hit.appendChild(actions);
        wrapper.appendChild(hit);
      });
      rn.appendChild(wrapper);
      document.body.classList.add('previewFull');
    } catch (e) { console.warn('showSearchResultsInCenter failed', e); }
  }

  // Preview a single entry inside the center `#rnPreview` using RN renderer or iframe fallback
  async function previewEntry(entry) {
    try {
      const rn = document.getElementById('displayContainer') || document.getElementById('center');
      if (!rn) return;
      // clear results area and prepare mount
      rn.innerHTML = '';
      const mount = document.createElement('div');
      mount.style.width = '100%';
      mount.style.boxSizing = 'border-box';
      mount.style.padding = '12px';
      rn.appendChild(mount);
      // fetch file if necessary
      let wrapped = null;
      try {
        if (entry && entry.meta && entry.meta.filePath) {
          const r = await window.electronAPI.readFile(entry.meta.filePath);
          if (r && r.ok) {
            try { const obj = JSON.parse(r.data); wrapped = obj.payload ? obj : { payload: obj }; } catch (e) { wrapped = { payload: r.data }; }
          }
        }
      } catch (e) { console.warn('previewEntry: readFile failed', e); }
      // if we don't have wrapped yet try to use entry.meta.payload
      if (!wrapped) wrapped = (entry && entry.meta && entry.meta.payload) ? { payload: entry.meta.payload } : { payload: {} };
      // render
      let rendered = false;
      try { showSpinner('Rendering preview...'); } catch (e) {}
      try {
        if (window.rnRenderer && typeof window.rnRenderer.renderFormInto === 'function') {
          try { window.rnRenderer.renderFormInto(mount, wrapped); rendered = true; } catch (e) { console.warn('rn render failed', e); }
        }
      } catch (e) {}
      if (!rendered) {
        try {
          const gen = await window.electronAPI.generateFormHtml(wrapped).catch(() => null);
          const html = (gen && gen.ok && gen.html) ? gen.html : payloadToHtml(wrapped.payload, entry.title || 'Form');
          const frame = document.createElement('iframe'); frame.style.width = '100%'; frame.style.height = '100%'; frame.style.border = '0'; frame.srcdoc = html;
          rn.innerHTML = '';
          rn.appendChild(frame);
        } catch (e) { console.warn('iframe fallback failed', e); }
      }
      try { hideSpinner(); } catch (e) {}
      document.body.classList.add('previewFull');
    } catch (e) { console.warn('previewEntry failed', e); }
  }

// Very small HTML presenter for payloads — renders header fields and key/value pairs and arrays/tables
function payloadToHtml(payload, title) {
  const escape = (s) => String(s === null || s === undefined ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const makeRow = (k, v) => `<div style="margin-bottom:6px"><strong>${escape(k)}:</strong> ${escape(v)}</div>`;

  let html = `<!doctype html><html><head><meta charset="utf-8"><title>${escape(title)}</title><style>
    body{font-family:Inter, Arial, sans-serif;padding:16px;color:#072a63;background:#fff}
    .card{max-width:900px;margin:0 auto;background:#fbfdff;padding:18px;border-radius:10px;box-shadow:0 8px 24px rgba(2,6,23,0.06)}
    h1{font-size:20px;margin:0 0 12px}
    .meta{color:#475569;margin-bottom:12px}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    th,td{border:1px solid #e6eefc;padding:8px;text-align:left}
  </style></head><body><div class="card"><h1>${escape(title)}</h1>`;

  if (!payload || typeof payload !== 'object') {
    html += `<div class="meta">No structured payload</div><pre>${escape(String(payload))}</pre></div></body></html>`;
    return html;
  }

  // common header fields
  const headerKeys = ['companyName','site','location','title','date','shift'];
  const headerParts = [];
  for (const k of headerKeys) if (payload[k]) headerParts.push(`<div style="margin-right:12px"><strong>${escape(k)}:</strong> ${escape(payload[k])}</div>`);
  if (headerParts.length) html += `<div class="meta">${headerParts.join('')}</div>`;

  // Render simple payload properties (non-object) first
  const simple = [];
  for (const k of Object.keys(payload)) {
    const v = payload[k];
    if (v === null) continue;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') simple.push(makeRow(k, v));
  }
  if (simple.length) html += `<div>${simple.join('')}</div>`;

  // Render arrays of rows as tables if possible (detect array of objects)
  for (const k of Object.keys(payload)) {
    const v = payload[k];
    if (Array.isArray(v) && v.length && typeof v[0] === 'object') {
      const cols = Array.from(new Set(v.flatMap(r => Object.keys(r))));
      html += `<h3 style="margin-top:14px">${escape(k)}</h3><table><thead><tr>${cols.map(c=>`<th>${escape(c)}</th>`).join('')}</tr></thead><tbody>`;
      for (const row of v) {
        html += '<tr>' + cols.map(c => `<td>${escape(row[c] !== undefined ? row[c] : '')}</td>`).join('') + '</tr>';
      }
      html += '</tbody></table>';
    }
  }

  // Fallback: dump remaining nested objects
  const nested = Object.keys(payload).filter(k => !Array.isArray(payload[k]) && payload[k] && typeof payload[k] === 'object');
  if (nested.length) {
    html += '<h3 style="margin-top:14px">Details</h3>';
    for (const k of nested) {
      html += `<h4>${escape(k)}</h4><pre>${escape(JSON.stringify(payload[k], null, 2))}</pre>`;
    }
  }

  html += '</div></body></html>';
  return html;
}

// Derive a friendly display name for an entry or payload
function getFriendlyTitle(entry, wrapped) {
  try {
    // Minimal approach: prefer explicit title fields, otherwise
    // take the filename/path and remove the first 25 characters.
    if (entry && entry.title) return String(entry.title);
    if (wrapped && wrapped.payload) {
      const p = wrapped.payload;
      if (p.title) return String(p.title);
      if (p.name) return String(p.name);
    }
    // Derive from filename/path and perform only the simple slice
    const src = (entry && (entry.name || entry.path_lower)) || '';
    let raw = String(src || '').replace(/\.json$/i, '');
    try {
      if (raw.length > 25) raw = raw.slice(25);
    } catch (e) {}
    // Trim common leading separators and whitespace
    raw = raw.replace(/^[_\-\.\s]+/, '').trim();
    // If there's an underscore, cut everything starting at the first underscore
    try {
      const u = raw.indexOf('_');
      if (u >= 0) raw = raw.slice(0, u).trim();
    } catch (e) {}
    return raw || 'Form';
  } catch (e) { return 'Form'; }
}

function prepareFilters(entries) {
  // populate year and month selects
  const years = new Set();
  const months = new Set();
  entries.forEach(e => {
    const s = e.server_modified;
    if (s) {
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        years.add(String(d.getFullYear()));
        months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    }
  });
  // reset selects
  yearSelect.innerHTML = '<option value="all">All years</option>';
  monthSelect.innerHTML = '<option value="all">All months</option>';
  Array.from(years).sort((a,b) => Number(b)-Number(a)).forEach(y => {
    const opt = document.createElement('option'); opt.value = y; opt.text = y; yearSelect.appendChild(opt);
  });
  Array.from(months).sort((a,b) => b.localeCompare(a)).forEach(m => {
    const label = `${m.split('-')[0]}-${m.split('-')[1]}`;
    const opt = document.createElement('option'); opt.value = m; opt.text = label; monthSelect.appendChild(opt);
  });
}

function renderList(entries) {
  const term = (searchInput.value || '').toLowerCase().trim();
  const year = yearSelect.value;
  const month = monthSelect.value;
  const filtered = entries.filter(e => {
    if (year !== 'all') {
      const d = e.server_modified ? new Date(e.server_modified) : null;
      if (!d || String(d.getFullYear()) !== String(year)) return false;
    }
    if (month !== 'all') {
      const d = e.server_modified ? new Date(e.server_modified) : null;
      if (!d) return false;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (key !== month) return false;
    }
    if (!term) return true;
    return (e.name || '').toLowerCase().indexOf(term) !== -1 || (e.path_lower || '').toLowerCase().indexOf(term) !== -1;
  });

  // Group by day (localized) similar to mobile groupedByDate
  const groups = filtered.reduce((acc, e) => {
    const d = e.server_modified ? new Date(e.server_modified) : null;
    const key = d ? d.toLocaleDateString() : 'Unknown Date';
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  fileList.innerHTML = '';
  if (!Object.keys(groups).length) {
    fileList.innerText = 'No files match the criteria.';
    return;
  }

  Object.keys(groups).forEach(dateKey => {
    const header = document.createElement('div');
    header.className = 'dateHeading';
    header.innerText = dateKey === 'Unknown Date' ? 'Unknown saved date' : dateKey;
    fileList.appendChild(header);

    groups[dateKey].forEach(f => {
      const el = document.createElement('div');
      el.className = 'fileItem';
      const left = document.createElement('div'); left.className = 'left';
      const name = document.createElement('div'); name.className = 'fileName'; name.innerText = getFriendlyTitle(f);
      const meta = document.createElement('div'); meta.className = 'meta'; meta.innerText = f.server_modified ? new Date(f.server_modified).toLocaleString() : 'Unknown';
      left.appendChild(name); left.appendChild(meta);
      const actions = document.createElement('div'); actions.className = 'actions';
      // only show preview/download for files
      const isFile = f.raw && f.raw['.tag'] === 'file';
      if (isFile) {
        const openB = document.createElement('button'); openB.innerText = 'Open';
        actions.appendChild(openB);
        openB.addEventListener('click', async () => {
          try {
            const r = await window.electronAPI.drive.downloadToTemp(f.path_lower, f.name);
            if (!r || !r.ok || !r.path) return showNotification('Open failed', (r && r.error) || 'Download failed', 'error');
            const localEntry = { title: getFriendlyTitle(f), meta: { filePath: r.path } };
            await openEntryModal(localEntry);
            try { await window.electronAPI.drive.deleteLocalForm(r.path); } catch (e) {}
          } catch (e) { console.warn('Open failed', e); showNotification('Open failed', String(e), 'error'); }
        });
      } else {
        const info = document.createElement('span'); info.className = 'placeholder'; info.innerText = '(folder)'; actions.appendChild(info);
      }
      el.appendChild(left); el.appendChild(actions);
      fileList.appendChild(el);
    });
  });
}

// Render available years as selectable chips
function renderYearRow(entries) {
  try {
    const container = document.getElementById('yearRow');
    if (!container) return;
    container.innerHTML = '';
    const yearMap = (entries || []).reduce((acc, e) => {
      try {
        if (!e || !e.server_modified) return acc;
        const d = new Date(e.server_modified);
        if (isNaN(d.getTime())) return acc;
        const y = String(d.getFullYear());
        const m = String(d.getMonth() + 1).padStart(2, '0');
        if (!acc[y]) acc[y] = new Set();
        acc[y].add(m);
      } catch (err) {}
      return acc;
    }, {});
    const years = Object.keys(yearMap).sort((a,b) => Number(b) - Number(a));
    years.forEach(y => {
      const btn = document.createElement('button'); btn.className = 'filterBtn'; btn.style.marginRight = '6px'; btn.innerText = y;
      btn.addEventListener('click', (ev) => openYearMenu(y, Array.from(yearMap[y] || [])));
      container.appendChild(btn);
    });
  } catch (e) { console.warn('renderYearRow error', e); }
}

// Show a lightweight year picker and forward selection to showYearFormsModal
function showBatchYearPicker(entries) {
  try {
    const yearMap = {};
    (entries || currentEntries || []).forEach(e => {
      try {
        if (!e || !e.server_modified) return;
        const d = new Date(e.server_modified);
        if (isNaN(d.getTime())) return;
        const y = String(d.getFullYear());
        if (!yearMap[y]) yearMap[y] = 0;
        yearMap[y]++;
      } catch (e) {}
    });
    const years = Object.keys(yearMap).sort((a,b) => Number(b) - Number(a));
    const overlay = document.createElement('div'); overlay.className = 'modalOverlay'; overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center'; overlay.style.background = 'rgba(0,0,0,0.35)'; overlay.style.setProperty('z-index', '2000000', 'important');
    const box = document.createElement('div'); box.className = 'modalBox'; box.style.minWidth = '360px'; box.style.maxWidth = '80%'; box.style.padding = '12px';
    const h = document.createElement('div'); h.style.fontWeight = '800'; h.style.marginBottom = '8px'; h.innerText = 'Batch export — choose a year';
    const list = document.createElement('div'); list.style.display = 'flex'; list.style.flexWrap = 'wrap'; list.style.gap = '8px';
    if (!years.length) {
      const p = document.createElement('div'); p.className = 'placeholder'; p.innerText = 'No years available'; list.appendChild(p);
    } else {
      years.forEach(y => {
        const btn = document.createElement('button'); btn.className = 'glowBtn'; btn.style.padding = '8px 12px'; btn.innerText = `${y} (${yearMap[y]} forms)`;
        btn.addEventListener('click', (ev) => {
          try {
            // close picker then open year modal which allows selection of forms
            try { document.body.removeChild(overlay); } catch (e) {}
            showYearFormsModal(y);
          } catch (e) { console.warn('year pick failed', e); }
        });
        list.appendChild(btn);
      });
    }
    const close = document.createElement('button'); close.innerText = 'Close'; close.style.marginTop = '12px'; close.addEventListener('click', () => { try { document.body.removeChild(overlay); } catch (e) {} });
    box.appendChild(h); box.appendChild(list); box.appendChild(close); overlay.appendChild(box); document.body.appendChild(overlay);
    overlay.addEventListener('click', (ev) => { if (ev.target === overlay) try { document.body.removeChild(overlay); } catch (e) {} });
  } catch (e) { console.warn('showBatchYearPicker failed', e); }
}

// Show a modal listing files for a year (on-demand). Uses temporary links for preview (no download/persist).
function showYearFormsModal(year) {
  try {
    const entries = (currentEntries || []).filter(e => {
      try { const d = e.server_modified ? new Date(e.server_modified) : null; return d && String(d.getFullYear()) === String(year); } catch (e) { return false; }
    }).sort((a,b) => new Date(b.server_modified) - new Date(a.server_modified));

    const overlay = document.createElement('div'); overlay.className = 'modalOverlay'; overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.display = 'flex'; overlay.style.alignItems = 'flex-start'; overlay.style.justifyContent = 'center'; overlay.style.background = 'rgba(0,0,0,0.3)'; overlay.style.setProperty('z-index', '2000000', 'important');
    const box = document.createElement('div'); box.className = 'modalBox'; box.style.maxHeight = '80vh'; box.style.overflow = 'auto'; box.style.width = '920px'; box.style.position = 'relative'; box.style.setProperty('z-index', '2000001', 'important');
    const h = document.createElement('div'); h.style.fontWeight = '800'; h.style.marginBottom = '8px'; h.innerText = `Dropbox forms — ${year}`;

    // Filter controls (top of modal): Today, Last N days, date range, clear
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '8px';
    controls.style.alignItems = 'center';
    controls.style.marginBottom = '12px';

    const todayBtn = document.createElement('button'); todayBtn.innerText = 'Today';
    const lastNBtn = document.createElement('button'); lastNBtn.innerText = 'Last N days';

    // Create wrapped date pickers with larger clickable surface
    const fromWrap = document.createElement('div');
    fromWrap.style.display = 'inline-flex';
    fromWrap.style.alignItems = 'center';
    fromWrap.style.border = '1px solid #e2e8f0';
    fromWrap.style.borderRadius = '8px';
    fromWrap.style.padding = '8px 12px';
    fromWrap.style.cursor = 'pointer';
    fromWrap.style.minWidth = '140px';
    fromWrap.style.minHeight = '40px';
    const fromInput = document.createElement('input'); fromInput.type = 'date'; fromInput.title = 'From';
    fromInput.style.border = 'none'; fromInput.style.background = 'transparent'; fromInput.style.padding = '6px 0'; fromInput.style.width = '100%'; fromInput.style.boxSizing = 'border-box'; fromInput.style.cursor = 'pointer';
    fromWrap.appendChild(fromInput);

    const toWrap = document.createElement('div');
    toWrap.style.display = 'inline-flex';
    toWrap.style.alignItems = 'center';
    toWrap.style.border = '1px solid #e2e8f0';
    toWrap.style.borderRadius = '8px';
    toWrap.style.padding = '8px 12px';
    toWrap.style.cursor = 'pointer';
    toWrap.style.minWidth = '140px';
    toWrap.style.minHeight = '40px';
    const toInput = document.createElement('input'); toInput.type = 'date'; toInput.title = 'To';
    toInput.style.border = 'none'; toInput.style.background = 'transparent'; toInput.style.padding = '6px 0'; toInput.style.width = '100%'; toInput.style.boxSizing = 'border-box'; toInput.style.cursor = 'pointer';
    toWrap.appendChild(toInput);

    const clearBtn = document.createElement('button'); clearBtn.innerText = 'Clear';
    const infoDiv = document.createElement('div'); infoDiv.style.marginLeft = '8px'; infoDiv.style.color = '#475569'; infoDiv.style.fontSize = '12px';

    controls.appendChild(todayBtn);
    controls.appendChild(lastNBtn);
    controls.appendChild(fromWrap);
    controls.appendChild(toWrap);
    controls.appendChild(clearBtn);
    controls.appendChild(infoDiv);

    const listWrapper = document.createElement('div'); listWrapper.style.display = 'flex'; listWrapper.style.flexDirection = 'column'; listWrapper.style.gap = '8px';

      // Batch export selection state
      const selectedSet = new Set();
      const MAX_BATCH = 5;
      const exportBtn = document.createElement('button');
      exportBtn.className = 'glowBtn'; exportBtn.innerText = 'Export Selected (0)'; exportBtn.disabled = true;
      exportBtn.style.marginLeft = '8px';
      // append export button into controls area (on the right)
      try { controls.appendChild(exportBtn); } catch (e) {}

      // Helper: group entries by localized day and render
    function renderGrouped(filtered) {
      listWrapper.innerHTML = '';
      if (!filtered || !filtered.length) {
        const p = document.createElement('div'); p.className = 'placeholder'; p.innerText = 'No forms match the filters.'; listWrapper.appendChild(p); return;
      }
      // Group by localized date string
      const groups = filtered.reduce((acc, item) => {
        try {
          const d = item.server_modified ? new Date(item.server_modified) : new Date();
          const key = d.toLocaleDateString();
          if (!acc[key]) acc[key] = [];
          acc[key].push(item);
        } catch (e) {}
        return acc;
      }, {});

      // Sort date groups descending by date
      const groupKeys = Object.keys(groups).sort((a,b) => new Date(b) - new Date(a));
      groupKeys.forEach(dateKey => {
        const heading = document.createElement('div'); heading.className = 'dateHeading'; heading.innerText = dateKey; listWrapper.appendChild(heading);
        groups[dateKey].sort((a,b) => new Date(b.server_modified) - new Date(a.server_modified)).forEach(ent => {
            const row = document.createElement('div'); row.className = 'fileItem';
            const left = document.createElement('div'); left.style.display = 'flex'; left.style.flexDirection = 'column';
            // determine if this entry is a file (allow selection) or a folder (no selection)
            const isFile = (ent && ((ent.raw && ent.raw['.tag'] === 'file') || (ent['.tag'] === 'file') || (/\.json$/i.test(ent.name || ''))));
            let chk = null;
            if (isFile) {
              // checkbox for batch selection
              chk = document.createElement('input'); chk.type = 'checkbox'; chk.className = 'batchExportCheckbox'; chk.style.marginBottom = '8px'; chk.style.alignSelf = 'flex-start'; chk._entry = ent;
              chk.addEventListener('change', (ev) => {
                try {
                  if (chk.checked) {
                    if (selectedSet.size >= MAX_BATCH) {
                      chk.checked = false;
                      showNotification('Selection limit', `You can select up to ${MAX_BATCH} forms`, 'error');
                      return;
                    }
                    selectedSet.add(ent.path_lower || ent.id || ent.name || JSON.stringify(ent));
                  } else {
                    selectedSet.delete(ent.path_lower || ent.id || ent.name || JSON.stringify(ent));
                  }
                  exportBtn.innerText = `Export Selected (${selectedSet.size})`;
                  exportBtn.disabled = selectedSet.size === 0;
                } catch (e) { console.warn('batch checkbox change failed', e); }
              });
              left.appendChild(chk);
            } else {
              // placeholder to indicate non-selectable item
              const note = document.createElement('div'); note.style.fontSize = '12px'; note.style.color = 'var(--text-muted)'; note.innerText = '(not selectable)';
              left.appendChild(note);
            }
          const name = document.createElement('div'); name.className = 'fileName'; name.innerText = getFriendlyTitle(ent);
          const meta = document.createElement('div'); meta.className = 'meta'; meta.innerText = ent.server_modified ? new Date(ent.server_modified).toLocaleTimeString() : '';
          left.appendChild(name); left.appendChild(meta);
          const actions = document.createElement('div'); actions.style.display = 'flex'; actions.style.gap = '8px';

          const open = document.createElement('button'); open.innerText = 'Open';
            open.addEventListener('click', async () => {
              try {
                if (!isFeatureEnabled('openToday')) { showTrialExpiredModal('Open Today'); return; }
                const r = await window.electronAPI.drive.downloadToTemp(ent.path_lower, ent.name);
                if (!r || !r.ok || !r.path) return showNotification('Open failed', (r && r.error) || 'Download failed', 'error');
                const localEntry = { title: getFriendlyTitle(ent), meta: { filePath: r.path }, _overlayZ: 31000 };
                // Keep the year modal overlay in the DOM; open the entry modal above it
                try { await openEntryModal(localEntry); } catch (e) { console.warn('openEntryModal failed', e); }
                // Best-effort cleanup of the temp file after the entry modal closes
                try { await window.electronAPI.drive.deleteLocalForm(r.path); } catch (e) {}
              } catch (e) { console.warn('Open action failed', e); showNotification('Open failed', String(e), 'error'); }
            });

          actions.appendChild(open);
          const infoBtn = document.createElement('button'); infoBtn.innerText = 'Info'; infoBtn.title = 'Preview or select this file for batch export'; infoBtn.addEventListener('click', () => { try { showNotification('File', ent.name || getFriendlyTitle(ent), ''); } catch (e) {} });
          actions.appendChild(infoBtn);
          row.appendChild(left); row.appendChild(actions);
          // clicking the row body (not buttons/inputs) toggles selection for files
          try {
            row.addEventListener('click', (ev) => {
              try {
                const t = ev.target || ev.srcElement;
                // ignore clicks on interactive controls
                if (!t) return;
                if (t.tagName === 'BUTTON' || t.tagName === 'INPUT' || (t.closest && t.closest('button')) || (t.closest && t.closest('input'))) return;
                if (isFile && chk) {
                  chk.checked = !chk.checked;
                  chk.dispatchEvent(new Event('change', { bubbles: true }));
                  // animate export button when selections exist
                  try {
                    const any = Array.from(listWrapper.querySelectorAll('input.batchExportCheckbox')).some(i => i.checked);
                    if (any) exportBtn.classList.add('pulseExportBtn'); else exportBtn.classList.remove('pulseExportBtn');
                  } catch (e) {}
                }
              } catch (e) {}
            });
          } catch (e) {}
          listWrapper.appendChild(row);
        });
      });
    }

    // Filter logic
    function applyFilters() {
      try {
        const f = fromInput.value ? new Date(fromInput.value + 'T00:00:00') : null;
        const t = toInput.value ? new Date(toInput.value + 'T23:59:59') : null;
        const filtered = entries.filter(ent => {
          try {
            if (!ent.server_modified) return false;
            const d = new Date(ent.server_modified);
            if (f && d < f) return false;
            if (t && d > t) return false;
            return true;
          } catch (e) { return false; }
        });
        infoDiv.innerText = `${filtered.length} form${filtered.length!==1?'s':''}`;
        renderGrouped(filtered);
      } catch (e) { console.warn('applyFilters failed', e); }
    }

    // Control handlers
    todayBtn.addEventListener('click', () => {
      const now = new Date();
      const iso = now.toISOString().slice(0,10);
      fromInput.value = iso; toInput.value = iso; applyFilters();
    });
    lastNBtn.addEventListener('click', () => {
      // Inline numeric modal (avoids ugly browser prompt)
      try {
        const promptOverlay = document.createElement('div');
        promptOverlay.style.position = 'fixed';
        promptOverlay.style.inset = '0';
        promptOverlay.style.background = 'rgba(0,0,0,0.35)';
        promptOverlay.style.display = 'flex';
        promptOverlay.style.alignItems = 'center';
        promptOverlay.style.justifyContent = 'center';
        promptOverlay.style.zIndex = '30600';

        const promptBox = document.createElement('div');
        promptBox.style.background = '#fff';
        promptBox.style.padding = '14px';
        promptBox.style.borderRadius = '8px';
        promptBox.style.minWidth = '260px';
        promptBox.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';

        const lbl = document.createElement('div'); lbl.innerText = 'Enter number of days'; lbl.style.fontWeight = '700'; lbl.style.marginBottom = '8px';
        const num = document.createElement('input'); num.type = 'number'; num.min = '1'; num.value = '7'; num.style.width = '100%'; num.style.padding = '8px'; num.style.marginBottom = '10px'; num.style.boxSizing = 'border-box';
        const actions = document.createElement('div'); actions.style.display = 'flex'; actions.style.justifyContent = 'flex-end'; actions.style.gap = '8px';
        const cancel = document.createElement('button'); cancel.innerText = 'Cancel'; cancel.style.padding = '8px 10px'; cancel.style.border = '1px solid #ddd'; cancel.style.borderRadius = '6px';
        const ok = document.createElement('button'); ok.innerText = 'OK'; ok.style.padding = '8px 10px'; ok.style.background = '#0b5bd7'; ok.style.color = '#fff'; ok.style.border = 'none'; ok.style.borderRadius = '6px';
        actions.appendChild(cancel); actions.appendChild(ok);
        promptBox.appendChild(lbl); promptBox.appendChild(num); promptBox.appendChild(actions);
        promptOverlay.appendChild(promptBox);
        document.body.appendChild(promptOverlay);

        cancel.addEventListener('click', () => { try { document.body.removeChild(promptOverlay); } catch (e) {} });
        ok.addEventListener('click', () => {
          try {
            const nn = Number(num.value);
            if (!nn || nn <= 0) return;
            const now = new Date();
            const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (nn - 1));
            fromInput.value = from.toISOString().slice(0,10);
            toInput.value = now.toISOString().slice(0,10);
            applyFilters();
          } catch (e) { console.warn('LastN apply failed', e); }
          try { document.body.removeChild(promptOverlay); } catch (e) {}
        });
        promptOverlay.addEventListener('click', (ev) => { if (ev.target === promptOverlay) try { document.body.removeChild(promptOverlay); } catch (e) {} });
      } catch (e) { console.warn('lastN click failed', e); }
    });
    fromInput.addEventListener('change', applyFilters);
    toInput.addEventListener('change', applyFilters);
    // Make wrapper clickable to open date picker / focus
    fromWrap.addEventListener('click', () => {
      try {
        if (typeof fromInput.showPicker === 'function') return fromInput.showPicker();
        fromInput.focus();
        fromInput.click();
      } catch (e) {}
    });
    toWrap.addEventListener('click', () => {
      try {
        if (typeof toInput.showPicker === 'function') return toInput.showPicker();
        toInput.focus();
        toInput.click();
      } catch (e) {}
    });
    clearBtn.addEventListener('click', () => { fromInput.value = ''; toInput.value = ''; infoDiv.innerText = ''; renderGrouped(entries); });

    // Batch export button handler
    exportBtn.addEventListener('click', async () => {
      try {
        if (!isFeatureEnabled('batchExport')) { showTrialExpiredModal('Batch export'); return; }
        if (!selectedSet.size) return;
        exportBtn.disabled = true; exportBtn.innerText = 'Preparing...';
        try { showSpinner('Preparing batch export...'); } catch (e) {}
        const checkedInputs = Array.from(listWrapper.querySelectorAll('input.batchExportCheckbox')).filter(i => i.checked);
        const wrappers = [];
        const tempPaths = [];
        const failed = [];
        for (const inp of checkedInputs) {
          try {
            const entry = inp._entry;
            if (!entry) continue;
            // attempt to download file to temp (try multiple path hints)
            const hints = [entry.path_lower, entry.path_display, entry.path || entry.name, entry.name];
            let dl = null;
            for (const h of hints) {
              if (!h) continue;
              try { dl = await window.electronAPI.drive.downloadToTemp(h, entry.name).catch(() => null); } catch (e) { dl = null; }
              if (dl && dl.ok && dl.path) break;
            }
            if (!dl || !dl.ok || !dl.path) { failed.push({ name: entry.name, reason: 'download_failed' }); continue; }
            tempPaths.push(dl.path);
            const rf = await window.electronAPI.readFile(dl.path).catch(() => null);
            if (!rf || !rf.ok) { failed.push({ name: entry.name, reason: 'read_failed' }); continue; }
            let obj = null;
            try { obj = JSON.parse(rf.data); } catch (e) { obj = { payload: rf.data }; }
            const wrapper = obj.payload ? obj : { payload: obj };
            wrapper.meta = wrapper.meta || {};
            wrapper.meta.filePath = dl.path;
            // include original server_modified and path hints so main can detect year
            try { if (entry.server_modified) wrapper.meta.server_modified = entry.server_modified; } catch (e) {}
            try { if (entry.path_lower) wrapper.meta.path_lower = entry.path_lower; } catch (e) {}
            try { if (entry.name) wrapper.meta.name = entry.name; } catch (e) {}
            wrappers.push(wrapper);
          } catch (e) { console.warn('prepare wrapper failed', e); }
        }
        if (!wrappers.length) {
          const names = failed.map(f => f.name).join(', ');
          showNotification('No valid forms', `No forms prepared for export. Failed: ${names || 'none'}`, 'error');
          // cleanup any temp files we did create
          try { for (const p of tempPaths) await window.electronAPI.drive.deleteLocalForm(p).catch(() => null); } catch (e) {}
          return;
        }
        try {
          try { hideSpinner(); } catch (e) {}
          // Proceed immediately with batch export (no debug summary)
          const res = await window.electronAPI.exportFormsPdf(wrappers, { year: year, baseName: 'forms', saveToDocuments: true, max: MAX_BATCH });
          if (res && res.ok) {
            try {
              const overlay = document.createElement('div'); overlay.className = 'modalOverlay'; overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.background = 'rgba(0,0,0,0.35)'; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center'; overlay.style.setProperty('z-index', '61000', 'important');
              const box = document.createElement('div'); box.className = 'modalBox'; box.style.position = 'relative'; box.style.minWidth = '320px'; box.style.maxWidth = '80%'; box.style.background = '#fff'; box.style.padding = '14px'; box.style.borderRadius = '10px'; box.style.boxShadow = '0 12px 40px rgba(0,0,0,0.25)'; box.style.setProperty('z-index', '2000001', 'important');
              const h = document.createElement('div'); h.style.fontWeight = '800'; h.style.marginBottom = '8px'; h.innerText = 'Export saved';
              const p = document.createElement('div'); p.innerText = 'Saved to Documents'; p.title = res.pdfPath || '';
              const actions2 = document.createElement('div'); actions2.className = 'modalActions'; actions2.style.display = 'flex'; actions2.style.gap = '8px'; actions2.style.marginTop = '12px';
              const go = document.createElement('button'); go.innerText = 'Go'; go.addEventListener('click', async () => { try { if (window.electronAPI && typeof window.electronAPI.revealInFolder === 'function') { await window.electronAPI.revealInFolder(res.pdfPath); } } catch (e) { console.warn('revealInFolder failed', e); } });
              const ok = document.createElement('button'); ok.innerText = 'OK'; ok.addEventListener('click', () => { try { document.body.removeChild(overlay); } catch (e) {} });
              actions2.appendChild(go); actions2.appendChild(ok); box.appendChild(h); box.appendChild(p); box.appendChild(actions2); overlay.appendChild(box); document.body.appendChild(overlay);
            } catch (e) { showNotification('Export saved', `Saved PDF to: ${res.pdfPath}`, 'success'); }
            // cleanup temp files
            try { for (const p of tempPaths) await window.electronAPI.drive.deleteLocalForm(p).catch(() => null); } catch (e) {}
          } else {
            showNotification('Export failed', (res && res.error) ? res.error : 'Unknown error', 'error');
            try { for (const p of tempPaths) await window.electronAPI.drive.deleteLocalForm(p).catch(() => null); } catch (e) {}
          }
        } catch (e) { showNotification('Export failed', String(e), 'error'); }
        try { hideSpinner(); } catch (e) {}
      } catch (e) { console.warn('batch export failed', e); showNotification('Export failed', String(e), 'error'); }
      finally { exportBtn.disabled = false; exportBtn.innerText = `Export Selected (0)`; selectedSet.clear(); Array.from(listWrapper.querySelectorAll('input.batchExportCheckbox')).forEach(i => i.checked = false); try { exportBtn.classList.remove('pulseExportBtn'); } catch (e) {} }
    });
    // initial render
    box.appendChild(h); box.appendChild(controls); box.appendChild(listWrapper);
    renderGrouped(entries);
    // show batch export tutorial each time the year modal is opened unless acknowledged
    try { setTimeout(() => { try { showBatchExportTour(exportBtn, listWrapper, false); } catch (e) {} }, 300); } catch (e) {}

    const close = document.createElement('button'); close.innerText = 'Close';
    try {
      close.style.position = 'absolute';
      close.style.top = '10px';
      close.style.right = '12px';
      close.style.zIndex = '30100';
      close.style.background = '#ffecec';
      close.style.color = '#b91c1c';
      close.style.border = '1px solid #f5c6c6';
      close.style.padding = '8px 10px';
      close.style.borderRadius = '8px';
      close.style.cursor = 'pointer';
    } catch (e) {}
    close.addEventListener('click', (ev) => { ev.stopPropagation(); try { document.body.removeChild(overlay); } catch (e) {} });
    box.appendChild(close);
    overlay.appendChild(box); document.body.appendChild(overlay);
    overlay.addEventListener('click', (ev) => { if (ev.target === overlay) try { document.body.removeChild(overlay); } catch (e) {} });
  } catch (e) { console.warn('showYearFormsModal failed', e); showNotification('Error', String(e), 'error'); }

  // Shared helper: prepare selected checkboxes in a listWrapper and export them as a combined PDF
  async function exportSelectedFromList(listWrapper, exportBtn, selectedSet, year, baseName, max) {
    try {
      if (!isFeatureEnabled('batchExport')) { showTrialExpiredModal('Batch export'); return; }
      if (!listWrapper) return;
      const checkedInputs = Array.from(listWrapper.querySelectorAll('input.batchExportCheckbox')).filter(i => i.checked);
      if (!checkedInputs.length) return;
      exportBtn.disabled = true; exportBtn.innerText = 'Preparing...';
      try { showSpinner('Preparing batch export...'); } catch (e) {}
      const wrappers = [];
      const tempPaths = [];
      const failed = [];
      for (const inp of checkedInputs) {
        try {
          const entry = inp._entry;
          if (!entry) continue;
          const hints = [entry.path_lower, entry.path_display, entry.path || entry.name, entry.name];
          let dl = null;
          for (const h of hints) {
            if (!h) continue;
            try { dl = await window.electronAPI.drive.downloadToTemp(h, entry.name).catch(() => null); } catch (e) { dl = null; }
            if (dl && dl.ok && dl.path) break;
          }
          if (!dl || !dl.ok || !dl.path) { failed.push({ name: entry.name, reason: 'download_failed' }); continue; }
          tempPaths.push(dl.path);
          const rf = await window.electronAPI.readFile(dl.path).catch(() => null);
          if (!rf || !rf.ok) { failed.push({ name: entry.name, reason: 'read_failed' }); continue; }
          let obj = null; try { obj = JSON.parse(rf.data); } catch (e) { obj = { payload: rf.data }; }
          const wrapper = obj.payload ? obj : { payload: obj };
          wrapper.meta = wrapper.meta || {};
          wrapper.meta.filePath = dl.path;
          try { if (entry.server_modified) wrapper.meta.server_modified = entry.server_modified; } catch (e) {}
          try { if (entry.path_lower) wrapper.meta.path_lower = entry.path_lower; } catch (e) {}
          try { if (entry.name) wrapper.meta.name = entry.name; } catch (e) {}
          wrappers.push(wrapper);
        } catch (e) { console.warn('prepare wrapper failed', e); }
      }
      if (!wrappers.length) {
        const names = failed.map(f => f.name).join(', ');
        showNotification('No valid forms', `No forms prepared for export. Failed: ${names || 'none'}`, 'error');
        try { for (const p of tempPaths) await window.electronAPI.drive.deleteLocalForm(p).catch(() => null); } catch (e) {}
        return;
      }
      try { hideSpinner(); } catch (e) {}
      // Proceed immediately with batch export (removed debug summary modal)
      const res = await window.electronAPI.exportFormsPdf(wrappers, { year: year, baseName: baseName || 'forms', saveToDocuments: true, max: max || 5 });
      if (res && res.ok) {
        try {
          const overlay = document.createElement('div'); overlay.className = 'modalOverlay'; overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.background = 'rgba(0,0,0,0.35)'; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center'; overlay.style.setProperty('z-index', '61000', 'important');
          const box = document.createElement('div'); box.className = 'modalBox'; box.style.position = 'relative'; box.style.minWidth = '320px'; box.style.maxWidth = '80%'; box.style.background = '#fff'; box.style.padding = '14px'; box.style.borderRadius = '10px'; box.style.boxShadow = '0 12px 40px rgba(0,0,0,0.25)'; box.style.setProperty('z-index', '2000001', 'important');
          const h = document.createElement('div'); h.style.fontWeight = '800'; h.style.marginBottom = '8px'; h.innerText = 'Export saved';
          const p = document.createElement('div'); p.innerText = 'Saved to Documents'; p.title = res.pdfPath || '';
          const actions2 = document.createElement('div'); actions2.className = 'modalActions'; actions2.style.display = 'flex'; actions2.style.gap = '8px'; actions2.style.marginTop = '12px';
          const go = document.createElement('button'); go.innerText = 'Go'; go.addEventListener('click', async () => { try { if (window.electronAPI && typeof window.electronAPI.revealInFolder === 'function') { await window.electronAPI.revealInFolder(res.pdfPath); } } catch (e) { console.warn('revealInFolder failed', e); } });
          const ok = document.createElement('button'); ok.innerText = 'OK'; ok.addEventListener('click', () => { try { document.body.removeChild(overlay); } catch (e) {} });
          actions2.appendChild(go); actions2.appendChild(ok); box.appendChild(h); box.appendChild(p); box.appendChild(actions2); overlay.appendChild(box); document.body.appendChild(overlay);
        } catch (e) { showNotification('Export saved', `Saved PDF to: ${res.pdfPath}`, 'success'); }
        try { for (const p of tempPaths) await window.electronAPI.drive.deleteLocalForm(p).catch(() => null); } catch (e) {}
      } else {
        showNotification('Export failed', (res && res.error) ? res.error : 'Unknown error', 'error');
        try { for (const p of tempPaths) await window.electronAPI.drive.deleteLocalForm(p).catch(() => null); } catch (e) {}
      }
      try { hideSpinner(); } catch (e) {}
    } catch (e) { console.warn('exportSelectedFromList failed', e); showNotification('Export failed', String(e), 'error'); }
    finally { try { exportBtn.disabled = false; exportBtn.innerText = `Export Selected (0)`; selectedSet.clear(); Array.from(listWrapper.querySelectorAll('input.batchExportCheckbox')).forEach(i => i.checked = false); try { exportBtn.classList.remove('pulseExportBtn'); } catch (e) {} } catch (e) {} }
  }
}

// Show modal listing Dropbox forms saved today
function showTodayFormsModal() {
  try {
    const now = new Date();
    const entries = (currentEntries || []).filter(ent => {
      try {
        if (!ent || !ent.server_modified) return false;
        const d = new Date(ent.server_modified);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
      } catch (e) { return false; }
    }).sort((a,b) => new Date(b.server_modified) - new Date(a.server_modified));

    const overlay = document.createElement('div'); overlay.className = 'modalOverlay'; overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center'; overlay.style.background = 'rgba(0,0,0,0.35)'; overlay.style.setProperty('z-index', '2000000', 'important');
    const box = document.createElement('div'); box.className = 'modalBox'; box.style.maxHeight = '80vh'; box.style.overflow = 'auto'; box.style.width = '920px'; box.style.position = 'relative'; box.style.setProperty('z-index', '2000001', 'important');
    const h = document.createElement('div'); h.style.fontWeight = '800'; h.style.marginBottom = '8px'; h.innerText = `Dropbox forms — Today`;

    const listWrapper = document.createElement('div'); listWrapper.style.display = 'flex'; listWrapper.style.flexDirection = 'column'; listWrapper.style.gap = '8px';

    // Batch export controls for today's modal (reuse shared helper)
    const selectedSet = new Set();
    const MAX_BATCH = 5;
    const controls = document.createElement('div'); controls.style.display = 'flex'; controls.style.justifyContent = 'flex-end'; controls.style.marginBottom = '8px';
    const exportBtn = document.createElement('button'); exportBtn.className = 'glowBtn'; exportBtn.innerText = 'Export Selected (0)'; exportBtn.disabled = true; exportBtn.style.marginLeft = '8px';
    try { controls.appendChild(exportBtn); } catch (e) {}
    // wire exportBtn to shared helper
    exportBtn.addEventListener('click', async () => { try { await exportSelectedFromList(listWrapper, exportBtn, selectedSet, String(now.getFullYear()), 'forms_today', MAX_BATCH); } catch (e) { console.warn('today export failed', e); } });

    function renderGrouped(filtered) {
      try {
        listWrapper.innerHTML = '';
        if (!filtered || !filtered.length) {
          const p = document.createElement('div'); p.className = 'placeholder'; p.innerText = 'No forms saved today.'; listWrapper.appendChild(p); return;
        }
        const groups = filtered.reduce((acc, item) => {
          try {
            const d = item.server_modified ? new Date(item.server_modified) : new Date();
            const key = d.toLocaleTimeString(); // group by time for today
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
          } catch (e) {}
          return acc;
        }, {});
        const groupKeys = Object.keys(groups).sort((a,b) => new Date(b) - new Date(a));
        groupKeys.forEach(timeKey => {
          groups[timeKey].forEach(ent => {
            const row = document.createElement('div'); row.className = 'fileItem';
            const left = document.createElement('div'); left.style.display = 'flex'; left.style.flexDirection = 'column';
            const isFile = (ent && ((ent.raw && ent.raw['.tag'] === 'file') || (ent['.tag'] === 'file') || (/\.json$/i.test(ent.name || ''))));
            let chk = null;
            if (isFile) {
              chk = document.createElement('input'); chk.type = 'checkbox'; chk.className = 'batchExportCheckbox'; chk.style.marginBottom = '8px'; chk.style.alignSelf = 'flex-start'; chk._entry = ent;
              chk.addEventListener('change', (ev) => {
                try {
                  if (chk.checked) {
                    if (selectedSet.size >= MAX_BATCH) { chk.checked = false; showNotification('Selection limit', `You can select up to ${MAX_BATCH} forms`, 'error'); return; }
                    selectedSet.add(ent.path_lower || ent.id || ent.name || JSON.stringify(ent));
                  } else { selectedSet.delete(ent.path_lower || ent.id || ent.name || JSON.stringify(ent)); }
                  exportBtn.innerText = `Export Selected (${selectedSet.size})`;
                  exportBtn.disabled = selectedSet.size === 0;
                  try { if (selectedSet.size) exportBtn.classList.add('pulseExportBtn'); else exportBtn.classList.remove('pulseExportBtn'); } catch (e) {}
                } catch (e) { console.warn('batch checkbox change failed (today)', e); }
              });
              left.appendChild(chk);
            }
            const name = document.createElement('div'); name.className = 'fileName'; name.innerText = getFriendlyTitle(ent);
            const meta = document.createElement('div'); meta.className = 'meta'; meta.innerText = ent.server_modified ? new Date(ent.server_modified).toLocaleTimeString() : '';
            left.appendChild(name); left.appendChild(meta);
            const actions = document.createElement('div'); actions.style.display = 'flex'; actions.style.gap = '8px';
            const open = document.createElement('button'); open.innerText = 'Open';
            open.addEventListener('click', async () => {
              try {
                const r = await window.electronAPI.drive.downloadToTemp(ent.path_lower, ent.name);
                if (!r || !r.ok || !r.path) return showNotification('Open failed', (r && r.error) || 'Download failed', 'error');
                const localEntry = { title: getFriendlyTitle(ent), meta: { filePath: r.path }, _overlayZ: 31000 };
                try { await openEntryModal(localEntry); } catch (e) { console.warn('openEntryModal failed', e); }
                try { await window.electronAPI.drive.deleteLocalForm(r.path); } catch (e) {}
              } catch (e) { console.warn('Open action failed', e); showNotification('Open failed', String(e), 'error'); }
            });
            actions.appendChild(open);
            row.appendChild(left); row.appendChild(actions);
            try {
              row.addEventListener('click', (ev) => {
                try {
                  const t = ev.target || ev.srcElement;
                  if (!t) return;
                  if (t.tagName === 'BUTTON' || t.tagName === 'INPUT' || (t.closest && t.closest('button')) || (t.closest && t.closest('input'))) return;
                  if (isFile && chk) { chk.checked = !chk.checked; chk.dispatchEvent(new Event('change', { bubbles: true })); }
                } catch (e) {}
              });
            } catch (e) {}
            listWrapper.appendChild(row);
          });
        });
      } catch (e) { console.warn('renderGrouped (today) failed', e); }
    }

    // append header, controls and list to modal and render
    box.appendChild(h); box.appendChild(controls); box.appendChild(listWrapper); renderGrouped(entries);
    const close = document.createElement('button'); close.innerText = 'Close';
    try { close.style.position = 'absolute'; close.style.top = '10px'; close.style.right = '12px'; close.style.zIndex = '30100'; close.style.background = '#ffecec'; close.style.color = '#b91c1c'; close.style.border = '1px solid #f5c6c6'; close.style.padding = '8px 10px'; close.style.borderRadius = '8px'; close.style.cursor = 'pointer'; } catch (e) {}
    close.addEventListener('click', (ev) => { ev.stopPropagation(); try { document.body.removeChild(overlay); } catch (e) {} });
    box.appendChild(close);
    overlay.appendChild(box); document.body.appendChild(overlay);
    overlay.addEventListener('click', (ev) => { if (ev.target === overlay) try { document.body.removeChild(overlay); } catch (e) {} });
  } catch (e) { console.warn('showTodayFormsModal failed', e); showNotification('Error', String(e), 'error'); }
}

// Show a small Manage Connection modal with actions: Refresh and Disconnect
function showManageConnectionModal() {
  try {
    const overlay = document.createElement('div'); overlay.className = 'modalOverlay'; overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center'; overlay.style.background = 'rgba(0,0,0,0.35)'; overlay.style.setProperty('z-index', '2000000', 'important');
    const box = document.createElement('div'); box.className = 'modalBox'; box.style.width = '360px'; box.style.padding = '14px'; box.style.position = 'relative'; box.style.setProperty('z-index', '2000001', 'important');
    const h = document.createElement('div'); h.style.fontWeight = '800'; h.style.marginBottom = '12px'; h.innerText = 'Manage Dropbox connection';

    const info = document.createElement('div'); info.style.marginBottom = '12px'; info.style.color = '#475569'; info.innerText = 'Choose an action for your Dropbox connection.';

    const actions = document.createElement('div'); actions.style.display = 'flex'; actions.style.flexDirection = 'column'; actions.style.gap = '8px';

    const refreshBtn = document.createElement('button'); refreshBtn.className = 'glowBtn'; refreshBtn.innerText = 'Refresh connection';
    refreshBtn.addEventListener('click', async () => {
      try {
        refreshBtn.disabled = true;
        try { showSpinner('Refreshing...'); } catch (e) {}
        try { await loadAccountAfterSignIn(); } catch (e) { console.warn('refresh: loadAccount failed', e); }
        try { await loadDropboxFiles(); } catch (e) { console.warn('refresh: loadDropboxFiles failed', e); }
        try { updateConnectCard(); } catch (e) {}
      } catch (e) { console.warn('refreshBtn failed', e); }
      finally { try { hideSpinner(); } catch (e) {} refreshBtn.disabled = false; }
    });

    const disconnectBtnModal = document.createElement('button'); disconnectBtnModal.className = 'glowBtn'; disconnectBtnModal.style.background = '#ffecec'; disconnectBtnModal.style.color = '#b91c1c'; disconnectBtnModal.innerText = 'Disconnect';
    disconnectBtnModal.addEventListener('click', async () => {
      try {
        disconnectBtnModal.disabled = true;
        if (window.electronAPI && window.electronAPI.drive && typeof window.electronAPI.drive.signOut === 'function') {
          try { await window.electronAPI.drive.signOut(); } catch (e) { console.warn('signOut failed', e); }
        }
        try { updateDropboxStatus(false); } catch (e) {}
      } catch (e) { console.warn('disconnectBtnModal failed', e); }
      finally { try { document.body.removeChild(overlay); } catch (e) {} }
    });

    const close = document.createElement('button'); close.innerText = 'Close'; close.style.position = 'absolute'; close.style.top = '8px'; close.style.right = '10px'; close.style.background = 'transparent'; close.style.border = 'none'; close.style.cursor = 'pointer';
    close.addEventListener('click', () => { try { document.body.removeChild(overlay); } catch (e) {} });

    actions.appendChild(refreshBtn); actions.appendChild(disconnectBtnModal);
    box.appendChild(h); box.appendChild(info); box.appendChild(actions); box.appendChild(close);
    overlay.appendChild(box); document.body.appendChild(overlay);
    overlay.addEventListener('click', (ev) => { if (ev.target === overlay) try { document.body.removeChild(overlay); } catch (e) {} });
  } catch (e) { console.warn('showManageConnectionModal failed', e); }
}

// Open a remote preview via Dropbox temporary link (no persistent download)
async function openRemotePreview(entry) {
  try {
    showSpinner('Fetching preview link...');
    const res = await window.electronAPI.drive.getTemporaryLink(entry.path_lower);
    hideSpinner();
    if (!res || !res.ok || !res.link) return showNotification('Preview failed', (res && res.error) || 'No temporary link', 'error');
    const overlay = document.createElement('div'); overlay.className = 'modalOverlay'; overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center'; overlay.style.background = 'rgba(0,0,0,0.35)'; overlay.style.setProperty('z-index', '2000000', 'important');
    const box = document.createElement('div'); box.className = 'modalBox'; box.style.width = '1000px'; box.style.maxHeight = '90vh'; box.style.padding = '8px'; box.style.position = 'relative'; box.style.setProperty('z-index', '2000001', 'important');
    const title = document.createElement('div'); title.style.fontWeight = '800'; title.style.marginBottom = '8px'; title.innerText = getFriendlyTitle(entry || {});
    const frame = document.createElement('iframe'); frame.style.width = '100%'; frame.style.height = '70vh'; frame.style.border = '0'; frame.src = res.link;
    const close = document.createElement('button'); close.innerText = 'Close';
    try { close.style.position = 'absolute'; close.style.top = '10px'; close.style.right = '12px'; close.style.zIndex = '32100'; } catch (e) {}
    close.addEventListener('click', () => { try { document.body.removeChild(overlay); } catch (e) {} });
    box.appendChild(title); box.appendChild(frame); box.appendChild(close); overlay.appendChild(box); document.body.appendChild(overlay);
    overlay.addEventListener('click', (ev) => { if (ev.target === overlay) try { document.body.removeChild(overlay); } catch (e) {} });
  } catch (e) { hideSpinner(); console.warn('openRemotePreview failed', e); showNotification('Preview failed', String(e), 'error'); }
}

// open a small modal/menu for the year with restore/download options
function openYearMenu(year, months) {
  // Legacy per-year menu replaced by the on-demand year modal
  try { showYearFormsModal(year); } catch (e) { console.warn('openYearMenu fallback failed', e); }
}

// helper to display account info
function showAccount(info) {
  try {
    const ui = document.getElementById('userInfo');
    const name = document.getElementById('userName');
    const email = document.getElementById('userEmail');
    const avatar = document.getElementById('userAvatar');
    // Populate the top-right userInfo only for legacy layouts if needed,
    // but prefer to show account details in the Signed in as card.
    try {
      const userCard = document.querySelector('.userCard');
      if (userCard) {
        const avatarImg = userCard.querySelector('img.statAvatar');
        const nameEl = userCard.querySelector('.smallName');
        const labelEl = userCard.querySelector('.statLabel');
        const displayName = info.name && info.name.display_name ? info.name.display_name : (info.email || 'Dropbox User');
        try { if (avatarImg && info.profile_photo_url) avatarImg.src = info.profile_photo_url; else if (avatarImg) avatarImg.style.display = 'none'; } catch (e) {}
        try { if (nameEl) nameEl.innerText = displayName; } catch (e) {}
        try { if (labelEl) labelEl.innerText = info.email || ''; } catch (e) {}
      }
    } catch (e) {}
    // Keep legacy top-right UI hidden to avoid duplicate name display
    try { if (ui) ui.style.display = 'none'; } catch (e) {}
    try { if (name) name.innerText = info.name && info.name.display_name ? info.name.display_name : (info.email || 'Dropbox User'); } catch (e) {}
    try { if (email) email.innerText = info.email || ''; } catch (e) {}
    try { if (avatar && info.profile_photo_url) avatar.src = info.profile_photo_url; else if (avatar) avatar.style.display = 'none'; } catch (e) {}
    try { connectBtn.innerText = 'Connected'; } catch (e) {}
    const disc = document.getElementById('disconnectDropbox'); if (disc) disc.style.display = 'inline-block';
    updateDropboxStatus(true, info);
  } catch (e) { console.warn('showAccount error', e); }
}

// disconnect handler
disconnectBtn = document.getElementById('disconnectDropbox');
if (disconnectBtn) {
  disconnectBtn.addEventListener('click', async () => {
    try {
      disconnectBtn.disabled = true;
      console.debug && console.debug('disconnect: initiating signOut');
      // Fire-and-forget signOut so UI updates immediately and won't hang if main IPC is slow
      try {
        const p = window.electronAPI.drive.signOut();
        if (p && typeof p.then === 'function') {
          p.then(res => { if (!res || !res.ok) console.warn('signOut result:', res); }).catch(err => console.warn('signOut error', err));
        }
      } catch (e) { console.warn('disconnect: signOut invocation failed', e); }

      // Immediately update UI to disconnected state to avoid perceived freeze
      try {
        if (connectBtn) connectBtn.innerText = 'Connect Dropbox';
      } catch (e) {}
      try { const ui = document.getElementById('userInfo'); if (ui) ui.style.display = 'none'; } catch (e) {}
      try { disconnectBtn.style.display = 'none'; } catch (e) {}
      try { const center = document.getElementById('displayContainer') || document.getElementById('center'); if (center) center.innerHTML = ''; } catch (e) {}
      try { updateDropboxStatus(false); } catch (e) {}
    } catch (e) { console.error(e); showNotification('Error disconnecting', String(e), 'error'); }
    finally { disconnectBtn.disabled = false; }
  });
}

// hamburger/side menu removed — functionality replaced by visible sidebar controls

// load account when sign-in completes
async function loadAccountAfterSignIn() {
  try {
    const acc = await window.electronAPI.drive.getAccount();
    if (acc && acc.ok && acc.info) {
      showAccount(acc.info);
      try { updateExtraCards(); } catch (e) {}
    } else {
      updateDropboxStatus(false);
    }
  } catch (e) { console.warn('loadAccountAfterSignIn failed', e); }
}

// intercept sign-in flow: after connect successful, show account
const originalConnectHandler = connectBtn.onclick;

function updateDropboxStatus(connected, info) {
  try {
    // Ensure the runtime footer exists and query status elements scoped
    try { if (typeof initFooter === 'function') initFooter(); } catch (e) {}
    const footers = Array.from(document.querySelectorAll('.app-footer'));
    const icon = document.getElementById('dropboxIcon');

    // Prefer querying status elements inside the chosen footer(s)
    let statusEls = [];
    try {
      footers.forEach(f => {
        try {
          const s = f.querySelector('#dropboxStatus');
          if (s) statusEls.push(s);
        } catch (e) {}
      });
    } catch (e) {}

    // Fallback to global selector for legacy layouts
    if (!statusEls.length) {
      try { statusEls = Array.from(document.querySelectorAll('#dropboxStatus')); } catch (e) { statusEls = []; }
    }

    // If still missing, try to initialize footer again (defensive) and re-query
    if (!statusEls.length) {
      try { if (typeof initFooter === 'function') initFooter(); } catch (e) {}
      try { statusEls = Array.from(document.querySelectorAll('#dropboxStatus')); } catch (e) { statusEls = []; }
    }

    // If no status elements are present at all, continue without returning
    // so the connect button and other UI can still update; log for diagnostics.
    if (!statusEls.length) console.warn('updateDropboxStatus: no #dropboxStatus elements found');
    console.log('updateDropboxStatus called:', connected, info);

    // Use querySelectorAll to catch any duplicate/footer clones and update
    // every matching control in the document. This prevents a scenario
    // where one footer instance is updated while a visible clone remains
    // unchanged (observed in some packaging/runtime setups).
    const connectEls = Array.from(document.querySelectorAll('#connectDropbox'));
    const disconnectEls = Array.from(document.querySelectorAll('#disconnectDropbox'));
    const downloadEls = Array.from(document.querySelectorAll('#downloadFormsBtn'));
    if (connectEls.length > 1 || disconnectEls.length > 1 || downloadEls.length > 1) {
      console.warn('Multiple footer controls found; updating all instances', { connect: connectEls.length, disconnect: disconnectEls.length, download: downloadEls.length });
    }

    if (connected) {
      // clear any placeholders and ensure we render remote lists if needed
      try {
        const center = document.getElementById('displayContainer') || document.getElementById('center');
        if (center && center.querySelector('.placeholder')) center.innerHTML = '';
      } catch (e) {}
      // remove any legacy status text elements — we don't render a status string anymore
      try { Array.from(document.querySelectorAll('#dropboxStatus')).forEach(n => { try { n.remove(); } catch (e) {} }); } catch (e) {}
      if (footers && footers.length) {
        footers.forEach(footer => {
          try {
            footer.classList.remove('attention');
            footer.classList.remove('dropbox-connected');
            footer.classList.add('dropbox-connected');
            try { footer.style.animation = 'none'; footer.style.boxShadow = '0 12px 36px rgba(11,91,215,0.08)'; footer.style.borderTopColor = 'rgba(11,91,215,0.06)'; } catch (e) {}
          } catch (e) {}
        });
      }
      if (icon) icon.style.opacity = '1';
      try { document.body.classList.add('dropbox-active'); } catch (e) {}

      // Toggle buttons across all discovered instances
      try {
        connectEls.forEach(el => { try { el.style.display = 'none'; el.innerText = 'Connected'; el.disabled = true; } catch (e) {} });
      } catch (e) {}
      try {
        disconnectEls.forEach(el => { try { el.style.display = 'inline-block'; el.disabled = false; } catch (e) {} });
      } catch (e) {}
      try {
        downloadEls.forEach(downloadBtnEl => {
          try {
            downloadBtnEl.removeAttribute('disabled');
            downloadBtnEl.disabled = false;
            downloadBtnEl.classList.remove('secondary');
            downloadBtnEl.style.opacity = '';
            downloadBtnEl.style.pointerEvents = 'auto';
            downloadBtnEl.style.display = 'inline-block';
            // observe each button to re-apply enabled state if something else toggles it
            if (typeof MutationObserver !== 'undefined') {
              const obs = new MutationObserver(() => {
                try { downloadBtnEl.removeAttribute('disabled'); downloadBtnEl.disabled = false; downloadBtnEl.classList.remove('secondary'); downloadBtnEl.style.pointerEvents = 'auto'; } catch (e) {}
              });
              obs.observe(downloadBtnEl, { attributes: true, attributeFilter: ['disabled', 'class', 'style'] });
              setTimeout(() => { try { obs.disconnect(); } catch (e) {} }, 10000);
            }
          } catch (e) {}
        });
        // Additional defensive updates & logging for stubborn cases
        try {
          const nodes = Array.from(document.querySelectorAll('#downloadFormsBtn'));
          if (!nodes.length) console.warn('No #downloadFormsBtn nodes found after enabling.');
          nodes.forEach(n => {
            try {
              n.style.display = 'inline-block';
              n.style.opacity = '';
              n.style.pointerEvents = 'auto';
              n.removeAttribute('hidden');
              n.removeAttribute('aria-hidden');
              n.disabled = false;
              n.classList.remove('secondary');
              console.log('downloadFormsBtn forced visible:', { node: n, disabled: n.disabled, computed: getComputedStyle(n).display });
            } catch (e) {}
          });
          // also update module-scoped `downloadBtn` reference if present
          try { if (!downloadBtn) downloadBtn = document.getElementById('downloadFormsBtn'); } catch (e) {}
        } catch (e) { console.warn('defensive download button update failed', e); }
      } catch (e) {}
      try { updateConnectCard(); } catch (e) {}
      // Ensure sidebar placeholder is removed and year cards are rendered when connected
      try {
        // remove static placeholder if present
        try { const ph = document.getElementById('sidebarConnectPlaceholder'); if (ph && ph.parentNode) ph.parentNode.removeChild(ph); } catch (e) {}
        // render stats and year cards immediately (allow UI to paint)
        try { renderStatsCards(currentEntries || []); } catch (e) {}
        try { updateExtraCards(); } catch (e) {}
        try { if (typeof renderYearCards === 'function') renderYearCards(currentEntries || []); else { const localList = document.getElementById('localList'); if (localList) localList.innerHTML = ''; } } catch (e) { const localList = document.getElementById('localList'); if (localList) localList.innerHTML = ''; }
        // schedule alignment on next frame
        try { requestAnimationFrame(() => { try { alignStatsRow(); } catch (e) {} }); } catch (e) { try { setTimeout(alignStatsRow, 40); } catch (er) {} }
      } catch (e) {}
    } else {
      try {
          // clear remote entries cache and render disconnected placeholder in year sidebar
          currentEntries = [];
          const center = document.getElementById('displayContainer') || document.getElementById('center');
          if (center) center.innerHTML = '<div class="placeholder">Not connected to Dropbox.</div>';
          try { if (typeof renderYearCards === 'function') renderYearCards([]); } catch (e) {}
          // also clear stats row immediately so UI reflects disconnected state without reload
          try { renderStatsCards([]); } catch (e) {}
          // Ensure sidebar reflows and allow scrolling to show last card fully
          try {
            const sidebar = document.getElementById('yearSidebar');
            const localListEl = document.getElementById('localList');
            if (sidebar) {
              // ensure there's bottom padding so the last card can be scrolled fully into view
              try { sidebar.style.paddingBottom = sidebar.style.paddingBottom || '96px'; } catch (e) {}
              // reset scroll to top on disconnect so UI looks refreshed
              try { sidebar.scrollTop = 0; } catch (e) {}
            }
            if (localListEl) {
              // force a tiny reflow to ensure the DOM updates are painted
              try { localListEl.style.display = 'none'; } catch (e) {}
              try { void localListEl.offsetHeight; } catch (e) {}
              try { localListEl.style.display = ''; } catch (e) {}
            }
          } catch (e) {}
            // Ensure a persistent Connect card exists in the sidebar when disconnected.
            try {
              const localList = document.getElementById('localList');
              const sidebar = document.getElementById('yearSidebar') || (localList && localList.parentNode) || document.body;
              // Avoid duplicating the card
              if (!document.getElementById('sidebarConnectCard')) {
                const wrapper = document.createElement('div'); wrapper.className = 'yearCardsSidebar';
                const card = document.createElement('div'); card.className = 'yearCard center'; card.id = 'sidebarConnectCard';
                card.style.cursor = 'default';
                const badge = document.createElement('div'); badge.className = 'statusBadge'; badge.innerText = 'NOT CONNECTED';
                const title = document.createElement('div'); title.className = 'yearTitle'; title.innerText = 'Dropbox disconnected';
                const metaRow = document.createElement('div'); metaRow.className = 'yearMetaRow'; metaRow.innerHTML = '<div class="metaItem">Connect to sync and view years</div>';
                const actions = document.createElement('div'); actions.style.marginTop = '12px';
                const btn = document.createElement('button'); btn.className = 'glowBtn'; btn.innerText = 'Connect'; btn.addEventListener('click', async (ev) => {
                  try { ev && ev.stopPropagation && ev.stopPropagation(); if (connectBtn && typeof connectBtn.click === 'function') return connectBtn.click(); const alt = document.querySelector('#connectDropbox'); if (alt && typeof alt.click === 'function') return alt.click(); if (window.electronAPI && window.electronAPI.drive && typeof window.electronAPI.drive.signIn === 'function') { await window.electronAPI.drive.signIn(); } else showNotification('Connect', 'Unable to initiate connection from here', 'error'); } catch (e) { console.warn('sidebar connect click failed', e); }
                });
                actions.appendChild(btn);
                card.appendChild(badge); card.appendChild(title); card.appendChild(metaRow); card.appendChild(actions);
                wrapper.appendChild(card);
                try {
                  if (localList) {
                    // clear existing and insert placeholder wrapper
                    localList.innerHTML = '';
                    localList.appendChild(wrapper);
                  } else if (sidebar) {
                    // insert at top of sidebar
                    try { sidebar.insertBefore(wrapper, sidebar.firstChild); } catch (e) { sidebar.appendChild(wrapper); }
                  }
                } catch (e) { try { document.body.appendChild(wrapper); } catch (ex) {} }
              }
            } catch (e) { console.warn('sidebar connect card failed', e); }
      } catch (e) {}
      // remove any legacy status text elements
      try { Array.from(document.querySelectorAll('#dropboxStatus')).forEach(n => { try { n.remove(); } catch (e) {} }); } catch (e) {}
      if (footers && footers.length) {
        footers.forEach(footer => {
          try {
            footer.classList.remove('dropbox-connected');
            footer.classList.remove('attention');
            footer.classList.add('attention');
            try { footer.style.animation = ''; footer.style.boxShadow = '0 12px 36px rgba(255,94,58,0.10)'; footer.style.borderTopColor = 'rgba(255,94,58,0.18)'; } catch (e) {}
          } catch (e) {}
        });
      }
      if (icon) icon.style.opacity = '0.5';
      try { document.body.classList.remove('dropbox-active'); } catch (e) {}
      // Toggle buttons across all discovered instances
      try { connectEls.forEach(el => { try { el.style.display = 'inline-block'; el.innerText = 'Connect Dropbox'; el.disabled = false; } catch (e) {} }); } catch (e) {}
      try { disconnectEls.forEach(el => { try { el.style.display = 'none'; } catch (e) {} }); } catch (e) {}
      try {
        downloadEls.forEach(downloadBtnEl => {
            try {
              // Keep the Download button visible at all times per request,
              // but mark it secondary/disabled if disconnected to avoid accidental use.
              try { downloadBtnEl.classList.add('secondary'); } catch (e) {}
              try { downloadBtnEl.style.pointerEvents = 'auto'; } catch (e) {}
              try { downloadBtnEl.style.display = 'inline-block'; } catch (e) {}
              try { downloadBtnEl.removeAttribute('hidden'); downloadBtnEl.removeAttribute('aria-hidden'); } catch (e) {}
              // If you want it disabled when not connected, set to true; here we leave enabled
              try { downloadBtnEl.disabled = false; } catch (e) {}
            } catch (e) {}
          });
          try { updateConnectCard(); } catch (e) {}
      } catch (e) {}
    }
  } catch (e) { console.warn('updateDropboxStatus failed', e); }
}

// initial status check
try { if (window && window.electronAPI && typeof window.electronAPI.drive.getAccount === 'function') { window.electronAPI.drive.getAccount().then(r => { if (r && r.ok && r.info) showAccount(r.info); else updateDropboxStatus(false); }).catch(() => updateDropboxStatus(false)); } } catch (e) { updateDropboxStatus(false); }

// Static sidebar quick-connect removed; sidebar connect is handled by the main connect UI.

// Updates: show a small banner when an update is downloaded
function showUpdateBanner(info) {
  try {
    if (document.getElementById('updateBanner')) return;
    const b = document.createElement('div');
    b.id = 'updateBanner';
    b.style.position = 'fixed';
    b.style.right = '16px';
    b.style.bottom = '16px';
    b.style.zIndex = '60000';
    b.style.background = '#0b5bd7';
    b.style.color = '#fff';
    b.style.padding = '12px 14px';
    b.style.borderRadius = '8px';
    b.style.boxShadow = '0 8px 24px rgba(2,6,23,0.12)';
    b.style.display = 'flex';
    b.style.alignItems = 'center';
    b.style.gap = '10px';

    const txt = document.createElement('div'); txt.innerText = 'Update ready — restart to apply.';
    const btn = document.createElement('button'); btn.innerText = 'Restart now'; btn.style.background = '#fff'; btn.style.color = '#0b5bd7'; btn.style.border = 'none'; btn.style.padding = '6px 10px'; btn.style.borderRadius = '6px'; btn.style.cursor = 'pointer';
    btn.addEventListener('click', async () => {
      try { await window.electronAPI.updates.applyUpdate(); } catch (e) { console.error('applyUpdate failed', e); }
    });

    const close = document.createElement('button'); close.innerText = '×'; close.style.background = 'transparent'; close.style.color = '#fff'; close.style.border = 'none'; close.style.fontSize = '18px'; close.style.cursor = 'pointer';
    close.addEventListener('click', () => { try { document.body.removeChild(b); } catch (e) {} });

    b.appendChild(txt); b.appendChild(btn); b.appendChild(close);
    document.body.appendChild(b);
  } catch (e) { console.warn('showUpdateBanner failed', e); }
}

try {
  if (window && window.electronAPI && window.electronAPI.updates) {
    try { window.electronAPI.updates.onUpdateAvailable(info => { try { console.log('update available', info); showNotification('Update available', 'Downloading update...', 'info'); } catch (e) {} }); } catch (e) {}
    try { window.electronAPI.updates.onUpdateDownloaded(info => { try { console.log('update downloaded', info); showUpdateBanner(info); } catch (e) {} }); } catch (e) {}
  }
} catch (e) { console.warn('update listeners failed', e); }

// Diagnostic: observe changes to the footer status and download button to detect external overwrites
try {
  const statusEl = document.getElementById('dropboxStatus');
  const downloadEl = document.getElementById('downloadFormsBtn');
  if (statusEl && typeof MutationObserver !== 'undefined') {
    const obs = new MutationObserver((records) => {
      records.forEach(r => {
        try {
          console.warn('Mutation observed on footer:', r, 'newValue/text=', statusEl.textContent, downloadEl && downloadEl.disabled);
          console.warn(new Error('stack').stack);
        } catch (e) {}
      });
    });
    obs.observe(statusEl, { characterData: true, childList: true, subtree: true, attributes: true });
    if (downloadEl) obs.observe(downloadEl, { attributes: true, attributeFilter: ['disabled','class','style'] });
    // stop observing after 20s
    setTimeout(() => { try { obs.disconnect(); console.log('Footer diagnostic observer disconnected'); } catch (e) {} }, 20000);
  }
} catch (e) { console.warn('footer diag observer failed', e); }


// Simplified renderer: show only year cards in sidebar

const splash = document.getElementById('splash');
const main = document.getElementById('main');
const loadingMsg = document.getElementById('loadingMsg');
let connectBtn = null;
const refreshBtn = document.getElementById('refreshList');
const yearSidebar = document.getElementById('yearSidebar');
const previewFrame = document.getElementById('previewFrame');
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
      keeper.innerHTML = '<div class="devInfo">Developed by RAJAB CULTURE DIGITAL SOLUTIONS  · <span class="muted">(RC DIGITAl)</span></div>\n      <div class="footerActions">\n        <img id="dropboxIcon" src="src/assets/dropbox.png" alt="Dropbox" width="20" height="20" />\n        <span id="dropboxStatus" class="dropbox-status">Checking…</span>\n        <div style="width:8px"></div>\n        <button id="downloadFormsBtn" disabled>Download Forms</button>\n        <button id="connectDropbox">Connect Dropbox</button>\n        <button id="disconnectDropbox" style="display:none">Disconnect</button>\n      </div>';
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
    const overlay = document.createElement('div'); overlay.className = 'modalOverlay'; overlay.style.zIndex = 40001;
    const box = document.createElement('div'); box.className = 'modalBox';
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

// Wire sidebar toggle button placed inside the sidebar and the small left-edge hover area
try {
  if (sidebarToggleBtn) {
    const updateIcon = () => {
      try {
        const hidden = document.body.classList.contains('sidebarHidden');
        sidebarToggleBtn.innerText = hidden ? '›' : '✕';
        sidebarToggleBtn.title = hidden ? 'Show sidebar' : 'Hide sidebar';
      } catch (e) {}
    };
    updateIcon();
    sidebarToggleBtn.addEventListener('click', () => {
      try {
        const hidden = document.body.classList.toggle('sidebarHidden');
        updateIcon();
      } catch (e) { console.warn('sidebarToggleBtn click failed', e); }
    });
  }
  if (sidebarEdge) {
    let leaveTimeout = null;
    sidebarEdge.addEventListener('mouseenter', () => {
      try { document.body.classList.remove('sidebarHidden'); if (sidebarToggleBtn) sidebarToggleBtn.innerText = '✕'; } catch (e) {}
      if (leaveTimeout) { clearTimeout(leaveTimeout); leaveTimeout = null; }
    });
    sidebarEdge.addEventListener('mouseleave', () => {
      try { leaveTimeout = setTimeout(() => { document.body.classList.add('sidebarHidden'); if (sidebarToggleBtn) sidebarToggleBtn.innerText = '›'; }, 800); } catch (e) {}
    });
  }
} catch (e) {}

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
  loadingMsg.style.opacity = '0';
  setTimeout(() => {
    loadingMsg.innerText = messages[currentMsgIndex];
    loadingMsg.style.opacity = '1';
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
  try { splash.style.display = 'none'; main.style.display = 'block'; document.body.classList.add('app-loaded'); } catch (e) {}
} else {
  setTimeout(() => animateSplashMessage(), 1000);
}

// Connect using Desktop OAuth via main process
initFooter();

connectBtn.addEventListener('click', async () => {
  connectBtn.disabled = true;
  const prev = connectBtn.innerText;
  connectBtn.innerText = 'Connecting...';
  try { connectBtn.classList.add('loading'); } catch (e) {}
  try { showSpinner('Connecting...'); } catch (e) {}
  try {
    const res = await window.electronAPI.drive.signIn();
    if (!res || !res.ok) {
      showNotification('Sign-in failed', (res && res.error) || 'unknown', 'error');
    } else {
      // Immediately mark the connect button as connected (visual) and
      // attempt to load account info right away. This helps when some
      // environments update the button label before the account is
      // available via the usual polling mechanism.
      try { connectBtn.innerText = 'Connected'; } catch (e) {}
      try {
        await loadAccountAfterSignIn();
      } catch (e) { console.warn('immediate loadAccountAfterSignIn failed', e); }
      try {
        const acc = await window.electronAPI.drive.getAccount().catch(() => null);
        if (acc && acc.ok && acc.info) {
          try { updateDropboxStatus(true, acc.info); } catch (e) {}
        }
      } catch (e) { console.warn('post-signin account check failed', e); }

      // After initiating sign-in, poll for the OAuth completion (token persistence)
      const waitForSignIn = async (timeoutMs = 20000, interval = 1000) => {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
          try {
            const dbg = await window.electronAPI.drive.getDebug();
            if (dbg && dbg.ok && dbg.info && dbg.info.hasRefreshToken) return dbg.info;
            // also try getAccount as a fallback
            const acc = await window.electronAPI.drive.getAccount().catch(() => null);
            if (acc && acc.ok && acc.info) return acc.info;
          } catch (e) {}
          await new Promise(r => setTimeout(r, interval));
        }
        return null;
      };

      const info = await waitForSignIn(30000, 1000);
      if (!info) {
        // final attempt to fetch debug/account
        try { await loadAccountAfterSignIn(); } catch (e) { console.warn('final account load failed', e); }
        showNotification('Sign-in pending', 'Sign-in may not have completed. If you finished OAuth in the browser, bring the app to the foreground or try connecting again.', 'error');
      } else {
        // mark connected UI, load files and account
        try { showNotification('Sign-in successful', 'Dropbox is connected.', 'success'); } catch (e) {}
        try { await loadAccountAfterSignIn(); } catch (e) { console.warn(e); }
        try { await loadDropboxFiles(); } catch (e) { console.warn('loadDropboxFiles after sign-in failed', e); }
      }
    }
  } catch (e) {
    console.error(e);
    showNotification('Sign-in failed', String(e), 'error');
  } finally {
    try { connectBtn.classList.remove('loading'); } catch (e) {}
    connectBtn.disabled = false;
    connectBtn.innerText = prev;
    try { hideSpinner(); } catch (e) {}
  }
});

refreshBtn.addEventListener('click', loadDropboxFiles);

async function loadDropboxFiles() {
  yearSidebar.innerHTML = '<div class="placeholder">Loading...</div>';
  try {
    const res = await window.electronAPI.drive.listFilesRecursive('');
    if (!res || !res.ok) {
      yearSidebar.innerHTML = '<div class="placeholder">Failed to load: ' + (res && res.error || '') + '</div>';
      return;
    }
    const entries = res.entries || [];
    if (!entries.length) {
      yearSidebar.innerHTML = '<div class="placeholder">No files found in Dropbox.</div>';
      return;
    }
    renderYearCards(entries);
  } catch (err) {
    console.error(err);
    yearSidebar.innerHTML = '<div class="placeholder">Error loading files.</div>';
  }
}

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
  if (!years.length) {
    yearSidebar.innerHTML = '<div id="noYearsPlaceholder" class="placeholder">No years found in Dropbox.</div>';
    return;
  }

  yearSidebar.innerHTML = '';
  years.forEach(year => {
    const info = yearMap[year];
    const monthList = Array.from(info.months).sort((a, b) => Number(b) - Number(a));
    
    const card = document.createElement('div');
    card.className = 'yearCard';
    
    const left = document.createElement('div');
    left.className = 'left';
    
    const title = document.createElement('div');
    title.className = 'yearTitle';
    title.innerText = year;
    
    const meta = document.createElement('div');
    meta.className = 'yearMeta';
    meta.innerText = `${info.count} form${info.count !== 1 ? 's' : ''} • ${monthList.length} month${monthList.length !== 1 ? 's' : ''}`;
    
    left.appendChild(title);
    left.appendChild(meta);
    
    const actions = document.createElement('div');
    actions.className = 'actions';
    
    const restoreBtn = document.createElement('button');
    restoreBtn.innerText = 'Restore';
    restoreBtn.className = 'restore-btn';
    restoreBtn.addEventListener('click', async () => {
      try {
        restoreBtn.disabled = true;
        restoreBtn.innerText = 'Restoring...';
        try { restoreBtn.classList.add('loading'); } catch (e) {}
        try { showSpinner('Restoring...'); } catch (e) {}
        const res = await window.electronAPI.drive.restoreYear(year);
        if (!res || !res.ok) showNotification('Restore failed', (res && res.error) || 'unknown', 'error');
        else {
          showNotification('Restore complete', `✓ Restored ${res.saved.length} files to app data (restored/${year})`, 'success');
          try { await loadLocalHistory(); } catch (e) { console.warn('failed to reload local history', e); }
          // after a successful restore, hide further restore controls
          try { hideRestoreControls(); } catch (e) {}
        }
      } catch (e) { showNotification('Restore failed', String(e), 'error'); } 
      finally { try { restoreBtn.classList.remove('loading'); } catch (e) {} restoreBtn.disabled = false; restoreBtn.innerText = 'Restore'; try { hideSpinner(); } catch (e) {} }
    });
    
    const detailsBtn = document.createElement('button');
    detailsBtn.className = 'secondary';
    detailsBtn.innerText = 'Months';
    detailsBtn.addEventListener('click', () => showYearDetails(year, monthList));
    
    actions.appendChild(restoreBtn);
    actions.appendChild(detailsBtn);
    
    card.appendChild(left);
    card.appendChild(actions);
    yearSidebar.appendChild(card);
  });
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
    const dbg = await window.electronAPI.drive.getDebug();
    if (dbg && dbg.ok && dbg.info && dbg.info.hasRefreshToken) {
      // mark connected and load files
      try { connectBtn.innerText = 'Connected'; } catch (e) {}
      // fetch account and show user info
      try {
        const acc = await window.electronAPI.drive.getAccount();
        if (acc && acc.ok && acc.info) showAccount(acc.info);
      } catch (e) { console.warn('failed to get account', e); }
      await loadDropboxFiles();
    }
  } catch (e) {
    console.warn('renderer: failed to check existing sign-in', e);
  }
}

// run initial check
setTimeout(() => { checkExistingSignIn(); }, 600);
// load local history immediately as well
setTimeout(() => { try { loadLocalHistory(); } catch (e) { console.warn('initial local history load failed', e); } }, 900);

// Re-check Dropbox sign-in when the app regains focus or becomes visible (useful for OAuth redirect flows)
try {
  document.addEventListener('visibilitychange', () => {
    try { if (document.visibilityState === 'visible') checkExistingSignIn(); } catch (e) {}
  });
  window.addEventListener('focus', () => { try { checkExistingSignIn(); } catch (e) {} });
} catch (e) { console.warn('focus/visibility handlers failed', e); }

// Shared preview close routine
function closePreview() {
  try { document.body.classList.remove('previewFull'); } catch (e) {}
  const rnMount = document.getElementById('rnPreview');
  if (rnMount) { rnMount.style.display = 'none'; try { rnMount.innerHTML = ''; } catch (e) {} }
  if (previewFrame) { try { previewFrame.style.display = 'block'; previewFrame.srcdoc = ''; } catch (e) {} }
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
    const res = await window.electronAPI.drive.getLocalHistory();
    if (!res || !res.ok) {
      document.getElementById('localList').innerHTML = '<div class="placeholder">Failed to read local history.</div>';
      return;
    }
    const list = res.list || [];
    currentLocalHistory = list;
    populateMonthFilter(list);
    try { populateQuickFilters(list); } catch (e) {}
    renderLocalHistory(list);
  } catch (e) {
    console.error('loadLocalHistory failed', e);
    document.getElementById('localList').innerHTML = '<div class="placeholder">Error loading local history.</div>';
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
    overlay.style.zIndex = '22000';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    const modal = document.createElement('div');
    modal.style.background = '#fff';
    modal.style.borderRadius = '10px';
    modal.style.width = '1400px';
    modal.style.maxWidth = 'calc(100% - 32px)';
    modal.style.maxHeight = '90vh';
    modal.style.overflow = 'hidden';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.boxShadow = '0 12px 40px rgba(0,0,0,0.25)';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.padding = '8px 12px';
    header.style.borderBottom = '1px solid #eee';

    const title = document.createElement('div');
    title.style.fontWeight = '800';
    title.innerText = entry.title || (wrapped && wrapped.payload && (wrapped.payload.title || wrapped.payload.name)) || 'Form';

    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '8px';

    const exportBtn = document.createElement('button');
    exportBtn.innerText = 'Export PDF';
    exportBtn.style.display = 'inline-flex';
    exportBtn.style.alignItems = 'center';
    exportBtn.style.justifyContent = 'center';
    exportBtn.style.marginRight = '8px';
    exportBtn.style.padding = '10px 16px';
    exportBtn.style.minWidth = '96px';
    exportBtn.style.background = '#0b5bd7';
    exportBtn.style.color = '#fff';
    exportBtn.style.border = 'none';
    exportBtn.style.borderRadius = '8px';
    exportBtn.style.cursor = 'pointer';

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

    controls.appendChild(exportBtn);
    controls.appendChild(closeBtn);
    header.appendChild(title);
    header.appendChild(controls);

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

    // Close helpers
    function closeModal() { try { document.body.removeChild(overlay); } catch (e) {} }
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (ev) => { if (ev.target === overlay) closeModal(); });
    const escHandler = (ev) => { if (ev.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escHandler); } };
    document.addEventListener('keydown', escHandler);

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
          const res = await window.electronAPI.exportFormPdf(wrapped, { saveToDocuments: true });
          if (res && res.ok) {
            showNotification('Export saved', 'Saved PDF to: ' + res.pdfPath, 'success');
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
      // show the year sidebar and load remote list
        try { yearSidebar.style.display = 'flex'; } catch (e) {}
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

function renderLocalHistory(list) {
  const container = document.getElementById('localList');
  if (!container) return;
  container.innerHTML = '';
  if (!list || !list.length) {
    container.innerHTML = '<div class="placeholder">No local/restored forms yet.</div>';
    return;
  }
  // Group by savedAt date (localized)
  const groups = list.reduce((acc, item) => {
    const savedAt = item.savedAt || (item.meta && item.meta.savedAt) || Date.now();
    const key = new Date(savedAt).toLocaleDateString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  Object.keys(groups).sort((a,b) => new Date(b) - new Date(a)).forEach(dateKey => {
    const heading = document.createElement('div'); heading.className = 'dateHeading'; heading.innerText = dateKey; container.appendChild(heading);
    const grid = document.createElement('div'); grid.className = 'yearGrid';
    (groups[dateKey] || []).forEach(entry => {
      const card = document.createElement('div'); card.className = 'formCard';
      const title = document.createElement('div'); title.className = 'formTitle'; title.innerText = entry.title || (entry.meta && entry.meta.payload && entry.meta.payload.title) || 'Imported Form';
      const meta = document.createElement('div'); meta.className = 'formMeta'; meta.innerText = `Saved: ${new Date(entry.savedAt || Date.now()).toLocaleString()}`;
      const actions = document.createElement('div'); actions.className = 'formActions';
      const openBtn = document.createElement('button'); openBtn.innerText = 'Open';
      const delBtn = document.createElement('button'); delBtn.innerText = 'Delete'; delBtn.style.marginLeft = '8px'; delBtn.style.background = '#e74c3c';
      delBtn.addEventListener('click', async () => {
        try {
          if (!confirm('Delete this restored form? This cannot be undone.')) return;
          const fp = entry.meta && entry.meta.filePath;
          if (!fp) return showNotification('Delete failed', 'No file path to delete', 'error');
          const res = await window.electronAPI.drive.deleteLocalForm(fp);
          if (res && res.ok) {
            await loadLocalHistory();
            return;
          }
          showNotification('Delete failed', (res && res.error) || 'unknown', 'error');
        } catch (e) { showNotification('Delete failed', String(e), 'error'); }
      });
      openBtn.addEventListener('click', async () => {
        // Open the saved form inside a centered modal overlay. This modal
        // is independent of the preview pane/sidebar and houses its own
        // export button. It avoids changing page layout or pushing other
        // UI elements out of view.
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
          overlay.style.zIndex = '22000';
          overlay.style.display = 'flex';
          overlay.style.alignItems = 'center';
          overlay.style.justifyContent = 'center';

          const modal = document.createElement('div');
          modal.style.background = '#fff';
          modal.style.borderRadius = '10px';
          // Wider default modal to better accommodate wide tables/forms
          modal.style.width = '1400px';
          // leave a small margin on very narrow windows
          modal.style.maxWidth = 'calc(100% - 32px)';
          modal.style.maxHeight = '90vh';
          modal.style.overflow = 'hidden';
          modal.style.display = 'flex';
          modal.style.flexDirection = 'column';
          modal.style.boxShadow = '0 12px 40px rgba(0,0,0,0.25)';

          const header = document.createElement('div');
          header.style.display = 'flex';
          header.style.justifyContent = 'space-between';
          header.style.alignItems = 'center';
          header.style.padding = '8px 12px';
          header.style.borderBottom = '1px solid #eee';

          const title = document.createElement('div');
          title.style.fontWeight = '800';
          title.innerText = entry.title || (wrapped && wrapped.payload && (wrapped.payload.title || wrapped.payload.name)) || 'Form';

          const controls = document.createElement('div');
          controls.style.display = 'flex';
          controls.style.gap = '8px';

          const exportBtn = document.createElement('button');
          exportBtn.innerText = 'Export PDF';
          exportBtn.style.display = 'inline-flex';
          exportBtn.style.alignItems = 'center';
          exportBtn.style.justifyContent = 'center';
          exportBtn.style.marginRight = '8px';
          exportBtn.style.padding = '10px 16px';
          exportBtn.style.minWidth = '96px';
          exportBtn.style.background = '#0b5bd7';
          exportBtn.style.color = '#fff';
          exportBtn.style.border = 'none';
          exportBtn.style.borderRadius = '8px';
          exportBtn.style.cursor = 'pointer';

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

          controls.appendChild(exportBtn);
          controls.appendChild(closeBtn);
          header.appendChild(title);
          header.appendChild(controls);

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

          // Close helpers
          function closeModal() { try { document.body.removeChild(overlay); } catch (e) {} }
          closeBtn.addEventListener('click', closeModal);
          overlay.addEventListener('click', (ev) => { if (ev.target === overlay) closeModal(); });
          const escHandler = (ev) => { if (ev.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escHandler); } };
          document.addEventListener('keydown', escHandler);

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

          // Export logic scoped to this modal (captures `mount`)
          exportBtn.addEventListener('click', async () => {
            try {
              exportBtn.disabled = true; exportBtn.innerText = 'Preparing...';
              try { showSpinner('Preparing export...'); } catch (e) {}

              if (window.electronAPI && typeof window.electronAPI.exportFormPdf === 'function') {
                const res = await window.electronAPI.exportFormPdf(wrapped, { saveToDocuments: true });
                if (res && res.ok) {
                  showNotification('Export saved', 'Saved PDF to: ' + res.pdfPath, 'success');
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
        } catch (e) { console.error(e); showNotification('Open failed', String(e), 'error'); }
      });
      actions.appendChild(openBtn);
      actions.appendChild(delBtn);
      card.appendChild(title); card.appendChild(meta); card.appendChild(actions);
      grid.appendChild(card);
    });
    container.appendChild(grid);
  });
}

  // Render search results in the center preview (`#rnPreview`) as clickable cards
  function showSearchResultsInCenter(results) {
    try {
      const rn = document.getElementById('rnPreview');
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
        // hide iframe
        try { if (previewFrame) previewFrame.style.display = 'none'; } catch (e) {}
        document.body.classList.add('previewFull');
        return;
      }
      results.forEach(entry => {
        const hit = document.createElement('div'); hit.className = 'search-hit';
        const left = document.createElement('div'); left.style.display = 'flex'; left.style.alignItems = 'center';
        const txt = document.createElement('div'); txt.style.display = 'flex'; txt.style.flexDirection = 'column';
        const title = document.createElement('div'); title.className = 'title'; title.innerText = entry.title || (entry.meta && entry.meta.payload && entry.meta.payload.title) || entry.name || 'Untitled';
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
      try { if (previewFrame) previewFrame.style.display = 'none'; } catch (e) {}
      document.body.classList.add('previewFull');
    } catch (e) { console.warn('showSearchResultsInCenter failed', e); }
  }

  // Preview a single entry inside the center `#rnPreview` using RN renderer or iframe fallback
  async function previewEntry(entry) {
    try {
      const rn = document.getElementById('rnPreview');
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
      const name = document.createElement('div'); name.className = 'fileName'; name.innerText = f.name;
      const meta = document.createElement('div'); meta.className = 'meta'; meta.innerText = f.server_modified ? new Date(f.server_modified).toLocaleString() : 'Unknown';
      left.appendChild(name); left.appendChild(meta);
      const actions = document.createElement('div'); actions.className = 'actions';
      // only show preview/download for files
      const isFile = f.raw && f.raw['.tag'] === 'file';
      if (isFile) {
        const pv = document.createElement('button'); pv.innerText = 'Preview'; pv.setAttribute('data-path', f.path_lower);
        const dl = document.createElement('button'); dl.innerText = 'Download'; dl.setAttribute('data-download', f.path_lower); dl.setAttribute('data-name', f.name);
        actions.appendChild(pv); actions.appendChild(dl);
        pv.addEventListener('click', () => previewFile(null, f.path_lower));
        dl.addEventListener('click', () => downloadFile(null, f.path_lower, f.name));
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

// open a small modal/menu for the year with restore/download options
function openYearMenu(year, months) {
  // create overlay
  const overlay = document.createElement('div'); overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.background = 'rgba(0,0,0,0.3)'; overlay.style.zIndex = 20000;
  const box = document.createElement('div'); box.style.position = 'fixed'; box.style.left = '50%'; box.style.top = '50%'; box.style.transform = 'translate(-50%,-50%)'; box.style.background = '#fff'; box.style.padding = '16px'; box.style.borderRadius = '10px'; box.style.minWidth = '320px'; box.style.maxHeight = '70%'; box.style.overflow = 'auto';
  const title = document.createElement('div'); title.style.fontWeight = '800'; title.style.marginBottom = '8px'; title.innerText = `Year ${year}`;
  const restoreBtn = document.createElement('button'); restoreBtn.innerText = 'Restore Year'; restoreBtn.style.marginRight = '8px';
  restoreBtn.addEventListener('click', async () => {
    restoreBtn.disabled = true; restoreBtn.innerText = 'Restoring...';
    try {
      const res = await window.electronAPI.drive.restoreYear(year);
      if (!res || !res.ok) showNotification('Restore failed', (res && res.error) || 'unknown', 'error');
      else showNotification('Restore complete', `Restored ${res.saved.length} files to user data/restored/${year}`, 'success');
      // mark restores complete and hide UI
      try { hideRestoreControls(); } catch (e) {}
      try { await loadLocalHistory(); } catch (e) {}
      close();
    } catch (e) { showNotification('Restore failed', String(e), 'error'); }
    finally { restoreBtn.disabled = false; }
  });
  const closeBtn = document.createElement('button'); closeBtn.innerText = 'Close'; closeBtn.addEventListener('click', close);
  const monthsDiv = document.createElement('div'); monthsDiv.style.marginTop = '12px';
  // months are for filtering/viewing only (no per-month restore)
  months.sort((a,b) => Number(b) - Number(a)).forEach(m => {
    const mBtn = document.createElement('button');
    mBtn.innerText = `${m}/${year}`;
    mBtn.style.margin = '6px';
    mBtn.addEventListener('click', () => {
      try {
        yearSelect.value = year;
        monthSelect.value = `${year}-${m}`;
        renderList(currentEntries);
        close();
      } catch (e) { console.warn(e); }
    });
    monthsDiv.appendChild(mBtn);
  });
  box.appendChild(title); box.appendChild(restoreBtn); box.appendChild(closeBtn); box.appendChild(monthsDiv);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  function close() { try { document.body.removeChild(overlay); } catch (e) {} }
}

// helper to display account info
function showAccount(info) {
  try {
    const ui = document.getElementById('userInfo');
    const name = document.getElementById('userName');
    const email = document.getElementById('userEmail');
    const avatar = document.getElementById('userAvatar');
    if (!ui || !name || !email) return;
    name.innerText = info.name && info.name.display_name ? info.name.display_name : (info.email || 'Dropbox User');
    email.innerText = info.email || '';
    if (info.profile_photo_url) avatar.src = info.profile_photo_url; else avatar.style.display = 'none';
    ui.style.display = 'flex';
    connectBtn.innerText = 'Connected';
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
      const res = await window.electronAPI.drive.signOut();
      if (!res || !res.ok) showNotification('Disconnect failed', (res && res.error) || 'unknown', 'error');
      else {
        // clear UI
        connectBtn.innerText = 'Connect Dropbox';
        document.getElementById('userInfo').style.display = 'none';
        disconnectBtn.style.display = 'none';
        yearSidebar.innerHTML = '<div id="noYearsPlaceholder" class="placeholder">No years found in Dropbox.</div>';
        updateDropboxStatus(false);
      }
    } catch (e) { console.error(e); showNotification('Error disconnecting', String(e), 'error'); }
    finally { disconnectBtn.disabled = false; }
  });
}

// hamburger/side menu removed — functionality replaced by visible sidebar controls

// load account when sign-in completes
async function loadAccountAfterSignIn() {
  try {
    const acc = await window.electronAPI.drive.getAccount();
    if (acc && acc.ok && acc.info) showAccount(acc.info);
    else updateDropboxStatus(false);
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
    } else {
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
      } catch (e) {}
    }
  } catch (e) { console.warn('updateDropboxStatus failed', e); }
}

// initial status check
try { if (window && window.electronAPI && typeof window.electronAPI.drive.getAccount === 'function') { window.electronAPI.drive.getAccount().then(r => { if (r && r.ok && r.info) showAccount(r.info); else updateDropboxStatus(false); }).catch(() => updateDropboxStatus(false)); } } catch (e) { updateDropboxStatus(false); }

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


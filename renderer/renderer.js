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
// Sidebar should remain visible to show year cards

// Connect logic is now handled by the stat card connect button in renderStatsCards

refreshBtn.addEventListener('click', loadDropboxFiles);

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
    st.innerHTML = '@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} .inlineSpinner svg{color:rgba(148,163,184,0.9)}';
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
  // Remove all year cards and placeholders and add a persistent sidebar heading
  localList.innerHTML = '';
  const heading = document.createElement('div');
  heading.className = 'sidebarHeading';
  heading.innerText = 'Your Dropbox forms';
  localList.appendChild(heading);
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
    viewBtn.innerText = 'View';
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
      try { sidebar.style.paddingBottom = sidebar.style.paddingBottom || '28px'; } catch (e) {}
      try { sidebar.style.scrollPaddingBottom = sidebar.style.scrollPaddingBottom || '28px'; } catch (e) {}
    }
    if (wrapper) {
      try { wrapper.style.paddingBottom = wrapper.style.paddingBottom || '32px'; } catch (e) {}
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
    const totalVal = document.createElement('div'); totalVal.className = 'statValue';
    totalVal.innerText = (fileEntries && fileEntries.length) ? String(fileEntries.length) : '0';
    const totalLabel = document.createElement('div'); totalLabel.className = 'statLabel'; totalLabel.innerText = 'Total forms in Dropbox';
    total.appendChild(totalVal); total.appendChild(totalLabel);

    const today = document.createElement('div');
    today.className = 'statCard';
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
    todayVal.innerText = String(todayCount);
    // Action button to make interactivity discoverable
    const todayActions = document.createElement('div'); todayActions.style.marginTop = '12px';
    const openTodayBtn = document.createElement('button'); openTodayBtn.className = 'glowBtn'; openTodayBtn.innerText = 'Open';
    openTodayBtn.addEventListener('click', (ev) => { try { ev.stopPropagation(); showTodayFormsModal(); } catch (e) { console.warn('openTodayBtn failed', e); } });
    todayActions.appendChild(openTodayBtn);
    // Compose today card
    today.appendChild(todayHeader);
    today.appendChild(todayVal);
    today.appendChild(todayActions);
    // Make the whole card clickable as well
    try { today.style.cursor = 'pointer'; } catch (e) {}
    try { today.addEventListener('click', () => { try { showTodayFormsModal(); } catch (e) { console.warn('showTodayFormsModal failed', e); } }); } catch (e) {}

    const connect = document.createElement('div');
    connect.className = 'statCard connectCard';
    connect.id = 'dropboxConnectCard';
    const connTitle = document.createElement('div'); connTitle.className = 'statValue'; connTitle.style.fontSize = '18px'; connTitle.innerText = document.body.classList.contains('dropbox-active') ? 'Dropbox — Connected' : 'Connect Dropbox';
    const connHint = document.createElement('div'); connHint.className = 'hint'; connHint.innerText = document.body.classList.contains('dropbox-active') ? 'Account connected' : 'Connect to sync and download forms';
    const connBtn = document.createElement('button'); connBtn.className = 'glowBtn'; connBtn.style.alignSelf = 'stretch'; connBtn.innerText = document.body.classList.contains('dropbox-active') ? 'Manage Connection' : 'Connect';
    try { if (document.body.classList.contains('dropbox-active')) connect.classList.add('connected'); else connect.classList.remove('connected'); } catch (e) {}
    connBtn.addEventListener('click', async () => {
      try {
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
      } catch (e) { console.warn('failed to get account', e); }
      await loadDropboxFiles();
      try { updateDropboxStatus(true); } catch (e) {}
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
    overlay.style.zIndex = (entry && entry._overlayZ) ? String(entry._overlayZ) : '22000';
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

// Dev/test helper: small subtle disconnect-all button to clear Dropbox tokens and refresh UI
try {
  const testBtnId = 'forceDisconnectDropboxBtn';
  if (!document.getElementById(testBtnId)) {
    const tb = document.createElement('button');
    tb.id = testBtnId;
    tb.innerText = 'Disconnect Dropbox';
    tb.style.position = 'fixed';
    tb.style.left = '8px';
    tb.style.bottom = '12px';
    tb.style.zIndex = '65000';
    tb.style.background = 'transparent';
    tb.style.border = '1px solid rgba(255,255,255,0.06)';
    tb.style.color = '#fff';
    tb.style.padding = '6px 8px';
    tb.style.borderRadius = '8px';
    tb.style.fontSize = '12px';
    tb.style.cursor = 'pointer';
    tb.title = 'Test: clear Dropbox tokens and refresh UI';
    tb.addEventListener('click', async () => {
      try {
        if (window.electronAPI && window.electronAPI.drive && typeof window.electronAPI.drive.signOut === 'function') {
          await window.electronAPI.drive.signOut();
        }
      } catch (e) { console.warn('test disconnect failed', e); }
      try { updateDropboxStatus(false); } catch (e) {}
    });
    document.body.appendChild(tb);
  }
} catch (e) { console.warn('failed to add test disconnect button', e); }

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
    // Prefer explicit title fields
    if (entry && entry.title) return String(entry.title);
    if (wrapped && wrapped.payload) {
      const p = wrapped.payload;
      if (p.title) return String(p.title);
      if (p.name) return String(p.name);
      if (p.metadata && p.metadata.subject) return String(p.metadata.subject);
    }
    // Try entry.meta.payload if present
    if (entry && entry.meta && entry.meta.payload) {
      const p = entry.meta.payload;
      if (p.title) return String(p.title);
      if (p.name) return String(p.name);
    }
    // Fallback: derive from filename/path. Aim to return Dropbox-style title
    const src = (entry && (entry.name || entry.path_lower)) || '';
    // strip first 25 characters as a heuristic to remove repeated app tokens
    let rawName = String(src || '').replace(/\.json$/i, '');
    try { if (rawName.length > 25) rawName = rawName.slice(25); } catch (e) {}
    let name = rawName;
    // split on whitespace, underscores, dashes, dots (Dropbox filenames may use spaces)
    const parts = name.split(/[\s_\-\.]+/g).map(p => p.trim()).filter(Boolean);
    const blacklist = [/^checklistapp$/i, /^app$/i, /^id$/i, /^f$/i];
    const isNoise = (t) => {
      if (!t) return true;
      if (/^\d{4,}$/.test(t)) return true; // long numbers/timestamps
      if (/^[a-z0-9]{6,}$/i.test(t)) return true; // short hash-like
      if (/^id[_\-]?[a-z0-9]+$/i.test(t)) return true;
      for (const re of blacklist) if (re.test(t)) return true;
      return false;
    };
    // collect name parts until we hit a noise token (which usually follows the real name)
    const collected = [];
    for (const p of parts) {
      if (isNoise(p)) break;
      collected.push(p);
    }
    let s = (collected.length ? collected.join(' ') : name.replace(/[_\-\.]+/g, ' ')).trim();
    // If result still contains trailing noise like numeric ids, strip them
    s = s.replace(/[_\- ]?(id[_\-]?[a-z0-9]+)$/i, '');
    s = s.replace(/[_\- ]?\d{6,}$/g, '');
    s = s.replace(/\s+/g, ' ').trim();
    if (!s) return 'Form';
    // Preserve original capitalization if it looks human; otherwise Title Case
    if (/[A-Z]/.test(s) && s === s.trim()) return s;
    return s.split(' ').map(w => w.length ? (w[0].toUpperCase() + w.slice(1).toLowerCase()) : '').join(' ');
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

// Show a modal listing files for a year (on-demand). Uses temporary links for preview (no download/persist).
function showYearFormsModal(year) {
  try {
    const entries = (currentEntries || []).filter(e => {
      try { const d = e.server_modified ? new Date(e.server_modified) : null; return d && String(d.getFullYear()) === String(year); } catch (e) { return false; }
    }).sort((a,b) => new Date(b.server_modified) - new Date(a.server_modified));

    const overlay = document.createElement('div'); overlay.className = 'modalOverlay'; overlay.style.zIndex = 30000;
    const box = document.createElement('div'); box.className = 'modalBox'; box.style.maxHeight = '80vh'; box.style.overflow = 'auto'; box.style.width = '920px'; box.style.position = 'relative';
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
          const name = document.createElement('div'); name.className = 'fileName'; name.innerText = (ent && ent.name) ? ent.name : getFriendlyTitle(ent);
          const meta = document.createElement('div'); meta.className = 'meta'; meta.innerText = ent.server_modified ? new Date(ent.server_modified).toLocaleTimeString() : '';
          left.appendChild(name); left.appendChild(meta);
          const actions = document.createElement('div'); actions.style.display = 'flex'; actions.style.gap = '8px';

          const open = document.createElement('button'); open.innerText = 'Open';
          open.addEventListener('click', async () => {
            try {
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
          row.appendChild(left); row.appendChild(actions);
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

    // initial render
    box.appendChild(h); box.appendChild(controls); box.appendChild(listWrapper);
    renderGrouped(entries);

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

    const overlay = document.createElement('div'); overlay.className = 'modalOverlay'; overlay.style.zIndex = 30500;
    const box = document.createElement('div'); box.className = 'modalBox'; box.style.maxHeight = '80vh'; box.style.overflow = 'auto'; box.style.width = '920px'; box.style.position = 'relative';
    const h = document.createElement('div'); h.style.fontWeight = '800'; h.style.marginBottom = '8px'; h.innerText = `Dropbox forms — Today`;

    const listWrapper = document.createElement('div'); listWrapper.style.display = 'flex'; listWrapper.style.flexDirection = 'column'; listWrapper.style.gap = '8px';

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
            const name = document.createElement('div'); name.className = 'fileName'; name.innerText = (ent && ent.name) ? ent.name : getFriendlyTitle(ent);
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
            row.appendChild(left); row.appendChild(actions); listWrapper.appendChild(row);
          });
        });
      } catch (e) { console.warn('renderGrouped (today) failed', e); }
    }

    box.appendChild(h); box.appendChild(listWrapper); renderGrouped(entries);
    const close = document.createElement('button'); close.innerText = 'Close';
    try { close.style.position = 'absolute'; close.style.top = '10px'; close.style.right = '12px'; close.style.zIndex = '30100'; close.style.background = '#ffecec'; close.style.color = '#b91c1c'; close.style.border = '1px solid #f5c6c6'; close.style.padding = '8px 10px'; close.style.borderRadius = '8px'; close.style.cursor = 'pointer'; } catch (e) {}
    close.addEventListener('click', (ev) => { ev.stopPropagation(); try { document.body.removeChild(overlay); } catch (e) {} });
    box.appendChild(close);
    overlay.appendChild(box); document.body.appendChild(overlay);
    overlay.addEventListener('click', (ev) => { if (ev.target === overlay) try { document.body.removeChild(overlay); } catch (e) {} });
  } catch (e) { console.warn('showTodayFormsModal failed', e); showNotification('Error', String(e), 'error'); }
}

// Open a remote preview via Dropbox temporary link (no persistent download)
async function openRemotePreview(entry) {
  try {
    showSpinner('Fetching preview link...');
    const res = await window.electronAPI.drive.getTemporaryLink(entry.path_lower);
    hideSpinner();
    if (!res || !res.ok || !res.link) return showNotification('Preview failed', (res && res.error) || 'No temporary link', 'error');
    const overlay = document.createElement('div'); overlay.className = 'modalOverlay'; overlay.style.zIndex = 32000;
    const box = document.createElement('div'); box.className = 'modalBox'; box.style.width = '1000px'; box.style.maxHeight = '90vh'; box.style.padding = '8px'; box.style.position = 'relative';
    const title = document.createElement('div'); title.style.fontWeight = '800'; title.style.marginBottom = '8px'; title.innerText = entry.name || entry.path_lower;
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
              try { sidebar.style.paddingBottom = sidebar.style.paddingBottom || '28px'; } catch (e) {}
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


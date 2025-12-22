import FileSystem from './fsShim';

const HISTORY_PATH = (FileSystem.documentDirectory || '') + 'forms/history.json';

async function readNativeHistory() {
  try {
    const info = await FileSystem.getInfoAsync(HISTORY_PATH);
    if (!info.exists) return [];
    const txt = await FileSystem.readAsStringAsync(HISTORY_PATH);
    try {
      return JSON.parse(txt || '[]');
    } catch (parseErr) {
      console.warn('readNativeHistory: failed to parse history JSON, raw:', txt, parseErr);
      return [];
    }
  } catch (e) {
    console.warn('readNativeHistory failed', e);
    return [];
  }
}

async function writeNativeHistory(list) {
  try {
    await FileSystem.makeDirectoryAsync((FileSystem.documentDirectory || '') + 'forms/', { intermediates: true }).catch(() => {});
    await FileSystem.writeAsStringAsync(HISTORY_PATH, JSON.stringify(list));
  } catch (e) {
    console.warn('writeNativeHistory failed', e && e.message ? e.message : e);
  }
}

export async function getFormHistory() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return JSON.parse(window.localStorage.getItem('formHistory') || '[]');
    } catch (e) {
      return [];
    }
  }
  return await readNativeHistory();
}

export async function addFormHistory(entry) {
  if (!entry || typeof entry !== 'object') return;

  const deriveCategory = (title = '', payload = {}) => {
    const t = (title || '').toString();
    const p = JSON.stringify(payload || {}).toLowerCase();
    if (/kitchen|food contact|thaw|cook|hot holding|underbar|prep|sanitiz/i.test(t) || /kitchen|thaw|cooking|hotholding|underbar/.test(p)) return 'kitchen';
    if (/front of house|foh|display chiller|front/i.test(t) || /foh|frontofhouse|displaychiller/.test(p)) return 'foh';
    if (/bakery|baking|baker/i.test(t) || /bakery|baking/.test(p)) return 'bakery';
    if (/receiv|receiving|certificate|packag|veg|fruit|egg|beverage|dry goods|chemicals/i.test(t) || /receiv|vegetables|fruits|eggs|beverage|certificateofanalysis/.test(p)) return 'production';
    if (/boh|cold room|freezer|walk-in|scullery|storage|welfare/i.test(t) || /coldroom|freezer|scullery|walkin/.test(p)) return 'boh';
    if (/health|hygiene|handwash|handwashing|shower|training|attendance/i.test(t) || /health|hygiene|handwash/.test(p)) return 'personnel';
    return 'uncategorized';
  };

  const normalized = {
    title: entry.title || entry.pdfPath?.split('/')?.pop() || 'Saved Form',
    date: entry.date || null,
    shift: entry.shift || null,
    location: entry.location || entry.loc || null,
    handlers: entry.handlers || null,
    pdfPath: entry.pdfPath || null,
    savedAt: entry._preserveSavedAt ? (entry.savedAt || Date.now()) : Date.now(),
    meta: entry.meta || (entry.payload ? { payload: entry.payload } : null),
    category: entry.category || deriveCategory(entry.title || (entry.payload && entry.payload.title) || '', entry.payload || (entry.meta && entry.meta.payload) || {}),
  };

  const MAX_HISTORY = 200;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const list = JSON.parse(window.localStorage.getItem('formHistory') || '[]');
      const idx = list.findIndex(f => (f.pdfPath && f.pdfPath === normalized.pdfPath) || (f.savedAt && f.savedAt === normalized.savedAt));
      if (idx >= 0) list.splice(idx, 1, normalized);
      else list.push(normalized);
      while (list.length > MAX_HISTORY) list.shift();
      window.localStorage.setItem('formHistory', JSON.stringify(list));
      return list;
    } catch (e) {
      console.warn('addFormHistory web failed', e);
      return;
    }
  }

  try {
    const list = await readNativeHistory();
    const idx = list.findIndex(f => (f.pdfPath && f.pdfPath === normalized.pdfPath) || (f.savedAt && f.savedAt === normalized.savedAt));
    if (idx >= 0) list.splice(idx, 1, normalized);
    else list.push(normalized);
    while (list.length > MAX_HISTORY) list.shift();
    await writeNativeHistory(list);
    return list;
  } catch (e) {
    console.warn('addFormHistory native failed', e);
  }
}

export async function removeFormHistory(matchFn) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const list = JSON.parse(window.localStorage.getItem('formHistory') || '[]');
      const filtered = list.filter(f => !matchFn(f));
      window.localStorage.setItem('formHistory', JSON.stringify(filtered));
      return filtered;
    } catch (e) {
      console.warn('removeFormHistory web failed', e);
      return [];
    }
  }
  try {
    const list = await readNativeHistory();
    const filtered = list.filter(f => !matchFn(f));
    await writeNativeHistory(filtered);
    return filtered;
  } catch (e) {
    console.warn('removeFormHistory native failed', e);
    return [];
  }
}

export async function updateFormHistory(matchFn, updater) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const list = JSON.parse(window.localStorage.getItem('formHistory') || '[]');
      const newList = list.map(item => (matchFn(item) ? updater(item) : item));
      window.localStorage.setItem('formHistory', JSON.stringify(newList));
      return newList;
    } catch (e) {
      console.warn('updateFormHistory web failed', e);
      return [];
    }
  }
  try {
    const list = await readNativeHistory();
    const newList = list.map(item => (matchFn(item) ? updater(item) : item));
    await writeNativeHistory(newList);
    return newList;
  } catch (e) {
    console.warn('updateFormHistory native failed', e);
    return [];
  }
}

export async function clearFormHistory() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try { window.localStorage.removeItem('formHistory'); return []; } catch (e) { console.warn('clearFormHistory web failed', e); return []; }
  }
  try { await writeNativeHistory([]); return []; } catch (e) { console.warn('clearFormHistory native failed', e); return []; }
}

export async function normalizeSavedAtUsingFiles() {
  try {
    const list = await getFormHistory();
    if (!Array.isArray(list) || list.length === 0) return 0;
    let updated = 0;
    const newList = await Promise.all(list.map(async (entry) => {
      try {
        const filePath = entry.pdfPath || (entry.meta && entry.meta.filePath) || null;
        if (!filePath) return entry;
        const info = await FileSystem.getInfoAsync(filePath);
        if (!info || !info.exists) return entry;
        const m = info.modificationTime;
        if (!m) return entry;
        let fileMs = Number(m) || 0;
        if (fileMs > 0 && fileMs < 1e12) fileMs = fileMs * 1000;
        if (!entry.savedAt || fileMs > (entry.savedAt || 0) + 1000) {
          entry.savedAt = fileMs || Date.now();
          updated++;
        }
        return entry;
      } catch (e) { return entry; }
    }));
    await writeNativeHistory(newList);
    return updated;
  } catch (e) { console.warn('normalizeSavedAtUsingFiles failed', e); return 0; }
}

export default {
  getFormHistory,
  addFormHistory,
  removeFormHistory,
};

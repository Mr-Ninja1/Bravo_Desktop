import FileSystem from './fsShim';
import { addFormHistory } from './formHistory';

const BASE_DIR = (FileSystem.documentDirectory || '') + 'forms/';

async function saveForm(formId, payload) {
  const dir = BASE_DIR + `${formId}/`;
  const filePath = dir + 'payload.json';
  try {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    try { if (payload && !payload.formUUID) { payload.formUUID = `f_${Date.now()}_${Math.random().toString(36).slice(2,9)}`; } } catch (e) {}
    const wrapped = { payload, savedAt: Date.now() };
    let storedFilePath = filePath;
    try {
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(wrapped));
    } catch (e) {
      try {
        if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
          const key = `forms:${formId}`;
          globalThis.localStorage.setItem(key, JSON.stringify(wrapped));
          storedFilePath = `localStorage:${key}`;
        } else {
          throw e;
        }
      } catch (err) { throw e; }
    }

    let historyEntry = null;
    try {
      historyEntry = { title: payload.title || payload.formType || 'Saved Form', date: payload.date || null, shift: payload.shift || null, savedAt: Date.now(), meta: { formId, filePath: storedFilePath, payload } };
      try { await addFormHistory(historyEntry); } catch (e) { console.warn('formStorage: addFormHistory failed', e); }
    } catch (e) { console.warn('formStorage: failed to schedule addFormHistory', e); }

    (async () => {
      try {
        const uploadQueue = await import('./uploadQueue');
        const entry = { title: payload && (payload.title || payload.formType) ? String((payload.title || payload.formType)) : 'form', payload, savedAt: historyEntry.savedAt || Date.now() };
        try { await uploadQueue.enqueue(entry); } catch (e) { /* ignore enqueue errors */ }
      } catch (e) { console.warn('formStorage: enqueue failed', e); }
    })();

    return { filePath };
  } catch (err) { console.error('formStorage.saveForm error', err); throw err; }
}

async function saveDraft(formId, payload) {
  const dir = BASE_DIR + `${formId}/`;
  const filePath = dir + 'payload.json';
  try {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    try { if (payload && !payload.formUUID) { payload.formUUID = `f_${Date.now()}_${Math.random().toString(36).slice(2,9)}`; } } catch (e) {}
    const wrapped = { payload, savedAt: Date.now() };
    try { await FileSystem.writeAsStringAsync(filePath, JSON.stringify(wrapped)); } catch (e) {
      try { if (typeof globalThis !== 'undefined' && globalThis.localStorage) { const key = `forms:${formId}`; globalThis.localStorage.setItem(key, JSON.stringify(wrapped)); return { filePath: `localStorage:${key}` }; } } catch (err) { throw e; }
    }
    return { filePath };
  } catch (err) { console.error('formStorage.saveDraft error', err); throw err; }
}

async function loadForm(formId) {
  const filePath = BASE_DIR + `${formId}/payload.json`;
  try {
    try {
      const info = await FileSystem.getInfoAsync(filePath);
      if (!info.exists) return null;
      const raw = await FileSystem.readAsStringAsync(filePath);
      return JSON.parse(raw);
    } catch (e) {
      try {
        if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
          const key = `forms:${formId}`;
          const raw = globalThis.localStorage.getItem(key);
          if (!raw) return null;
          return JSON.parse(raw);
        }
      } catch (err) { throw e; }
    }
  } catch (err) { console.error('formStorage.loadForm error', err); throw err; }
}

async function listForms() {
  try { const { getFormHistory } = await import('./formHistory'); const list = await getFormHistory(); return list.map(item => ({ id: item.meta?.formId || null, value: item })); } catch (err) { console.error('formStorage.listForms error', err); throw err; }
}

async function deleteForm(formId) {
  const dir = BASE_DIR + `${formId}/`;
  try {
    const info = await FileSystem.getInfoAsync(dir);
    if (info.exists) await FileSystem.deleteAsync(dir, { idempotent: true });
    const { removeFormHistory } = await import('./formHistory');
    await removeFormHistory(f => f.meta && f.meta.formId === formId);
    return true;
  } catch (err) { console.error('formStorage.deleteForm error', err); throw err; }
}

async function importForm(formId, wrappedPayload = null) {
  try {
    const id = formId || `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const dir = BASE_DIR + `${id}/`;
    const filePath = dir + 'payload.json';
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const wrapped = wrappedPayload || { payload: null, savedAt: Date.now() };
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(wrapped));
    try {
      const historyEntry = {
        title: (wrapped.payload && (wrapped.payload.title || wrapped.payload.formType)) ? String((wrapped.payload.title || wrapped.payload.formType)) : 'Imported Form',
        date: wrapped.payload && wrapped.payload.date ? wrapped.payload.date : null,
        shift: wrapped.payload && wrapped.payload.shift ? wrapped.payload.shift : null,
        savedAt: wrapped.savedAt || Date.now(),
        _preserveSavedAt: true,
        meta: { formId: id, filePath, payload: wrapped.payload },
      };
      const { addFormHistory } = await import('./formHistory');
      await addFormHistory(historyEntry);
    } catch (e) { console.warn('formStorage.importForm: addFormHistory failed', e); }
    return { filePath, formId: id };
  } catch (err) { console.error('formStorage.importForm error', err); throw err; }
}

export default {
  saveForm,
  saveDraft,
  loadForm,
  listForms,
  deleteForm,
  importForm,
};

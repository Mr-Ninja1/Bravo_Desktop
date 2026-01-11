import React from 'react';
import { createRoot } from 'react-dom/client';
import { View } from 'react-native';
import components from './src/forms/components/componentsMap';
import SavedFormRenderer from './src/components/SavedFormRenderer';
import { mountUpdateNotifier } from './src/components/UpdateNotifier';

// Lightweight ErrorBoundary to catch render errors from presentational components
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(err) { return { error: err }; }
  componentDidCatch(err, info) { console.warn('Presentational render error', err, info); }
  render() {
    if (this.state.error) {
      return React.createElement(View, { style: { padding: 16 } }, React.createElement('div', { style: { color: '#b00', fontWeight: '700' } }, 'Form render error: ' + String(this.state.error)));
    }
    return this.props.children;
  }
}

function RenderWrapper({ payload }) {
  // `payload` may be a wrapped history entry ({ payload, savedAt }), a
  // stringified JSON file, or the canonical payload object. Normalize by
  // parsing string payloads so downstream detection works the same as
  // the mobile renderer.
  const parseMaybeJson = (v) => {
    if (typeof v === 'string') {
      try { return JSON.parse(v); } catch (e) { return v; }
    }
    return v;
  };

  const raw = parseMaybeJson(payload);
  const wrapped = raw && raw.payload ? parseMaybeJson(raw.payload) : (parseMaybeJson(raw) || {});
  const typeKey = components.normalize(wrapped.formType || wrapped.title || wrapped.name || '');
  let Cmp = components.map[typeKey];
  // Fuzzy fallback: try to find a matching component when exact normalized
  // key isn't present (handles titles with suffixes like " - Grab and Go",
  // "Display Chiller Temperature Log Sheet - Grab and Go", etc.).
  if (!Cmp) {
    try {
      const keys = Object.keys(components.map || {});
      // Prefer keys that are contained in typeKey, then those that contain typeKey
      const contained = keys.find(k => typeKey.indexOf(k) !== -1);
      const contains = keys.find(k => k.indexOf(typeKey) !== -1);
      const pick = contained || contains || null;
      if (pick) Cmp = components.map[pick];
      // store which resolved key we matched for debugging
      if (typeof window !== 'undefined' && window.__rnLastDebug) window.__rnLastDebug.resolvedKey = pick || null;
    } catch (e) { /* ignore */ }
  }
  // Debug: help trace why some payloads render blank — log payload summary and chosen component
  try {
    // Serialize safely (avoid huge dumps)
    const debugPreview = { typeKey, title: wrapped.title || wrapped.formType || wrapped.name || '', keys: Object.keys(wrapped || {}).slice(0,20) };
    // eslint-disable-next-line no-console
    console.debug('rnRenderer: RenderWrapper payload summary ->', debugPreview, 'componentFound:', Boolean(Cmp));
    try {
      // store lightweight debug info on window for quick UI inspection
      if (typeof window !== 'undefined') {
        window.__rnLastDebug = { payloadSummary: debugPreview, componentFound: Boolean(Cmp), timestamp: Date.now() };
      }
    } catch (e) {}
  } catch (e) { /* ignore logging errors */ }
  const exportFlag = Boolean(wrapped && wrapped.__exportingWide);
  if (Cmp) return React.createElement(ErrorBoundary, null, React.createElement(View, { style: { flex: 1 } }, React.createElement(Cmp, { payload: wrapped, exportingWide: exportFlag })));

  // If direct lookup failed, fall back to the richer SavedFormRenderer which
  // uses regex and shape-based detection (matches mobile behaviour).
  // Pass the parsed raw payload so SavedFormRenderer can inspect canonical
  // fields instead of receiving a JSON string.
  return React.createElement(ErrorBoundary, null, React.createElement(View, { style: { flex: 1 } }, React.createElement(SavedFormRenderer, { savedPayload: raw, exportingWide: Boolean(raw && raw.__exportingWide) })));
}

// expose a global render function the renderer can call
const roots = new WeakMap();

function renderInto(mount, payload) {
  if (!mount) return;
  try {
    // clear previous children (important for consistent sizing)
    mount.innerHTML = '';
  } catch (e) {}
  // Ensure any previous root is unmounted to avoid stale/broken renderer state
  try { unmountFrom(mount); } catch (e) { /* ignore */ }
  let root = createRoot(mount);
  roots.set(mount, root);
  try {
    root.render(React.createElement(RenderWrapper, { payload }));
  } catch (err) {
    // If rendering fails synchronously, unmount to keep mount usable.
    try { unmountFrom(mount); } catch (e) {}
    throw err;
  }
}

function unmountFrom(mount) {
  const root = roots.get(mount);
  if (root && typeof root.unmount === 'function') {
    try { root.unmount(); } catch (e) {}
    roots.delete(mount);
  } else {
    try { mount.innerHTML = ''; } catch (e) {}
  }
}

window.rnRenderer = {
  renderForm: (payload) => {
    const mount = document.getElementById('displayContainer');
    if (!mount) {
      console.warn('displayContainer mount element not found');
      return;
    }
    renderInto(mount, payload);
  },
  renderFormInto: (mountElement, payload) => {
    if (!mountElement) return;
    renderInto(mountElement, payload);
  },
  unmountFrom
};

// Initialize global UI helpers
try { mountUpdateNotifier(); } catch (e) { /* ignore */ }

// Minimal FileSystem shim for renderer builds.
// Attempts to use Node `fs` when available, otherwise falls back to localStorage-based no-op implementations.
const hasNodeFs = typeof process !== 'undefined' && process.versions && process.versions.node;
let nodeFs = null;
let nodePath = null;
if (hasNodeFs) {
  try {
    nodeFs = require('fs');
    nodePath = require('path');
  } catch (e) {
    nodeFs = null;
    nodePath = null;
  }
}

const FileSystem = {
  documentDirectory: (typeof process !== 'undefined' && process.cwd) ? (process.cwd() + '/') : '',
  EncodingType: { Base64: 'base64' },
  async getInfoAsync(p) {
    if (nodeFs) {
      try {
        const exists = nodeFs.existsSync(p);
        if (!exists) return { exists: false };
        const stat = nodeFs.statSync(p);
        return { exists: true, modificationTime: stat.mtimeMs };
      } catch (e) { return { exists: false }; }
    }
    // web fallback: treat localStorage keys as not existing files
    return { exists: false };
  },
  async readAsStringAsync(p, options) {
    if (nodeFs) {
      return nodeFs.readFileSync(p, options && options.encoding ? options.encoding : 'utf8');
    }
    // web fallback: attempt localStorage read by key
    try { return globalThis.localStorage?.getItem(p) || ''; } catch (e) { return ''; }
  },
  async writeAsStringAsync(p, data, options) {
    if (nodeFs) {
      const dir = nodePath.dirname(p);
      try { nodeFs.mkdirSync(dir, { recursive: true }); } catch (e) {}
      nodeFs.writeFileSync(p, data, { encoding: options && options.encoding ? options.encoding : 'utf8' });
      return;
    }
    try { globalThis.localStorage?.setItem(p, String(data)); } catch (e) {}
  },
  async makeDirectoryAsync() { return; },
  async deleteAsync() { return; },
};

export default FileSystem;

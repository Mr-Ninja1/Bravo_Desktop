const fs = require('fs');
const path = require('path');

const escapeHtml = (s) => String(s === null || s === undefined ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const normalizeIncoming = (incoming) => {
  if (!incoming) return {};
  let v = incoming;
  if (v.payload) v = v.payload;
  if (v.meta && v.meta.payload) v = v.meta.payload;
  if (v.payload) v = v.payload;
  return v || {};
};

const normalizeSignature = (v) => {
  if (!v) return null;
  if (typeof v === 'string') {
    if (v.startsWith('data:')) return v;
    const compact = v.replace(/\s+/g, '');
    if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
    return null;
  }
  if (typeof v === 'object') {
    if (v.uri && typeof v.uri === 'string') return v.uri;
    if (v.data && typeof v.data === 'string') return v.data.startsWith('data:') ? v.data : `data:image/png;base64,${v.data}`;
    if (v.signature && typeof v.signature === 'string') return v.signature.startsWith('data:') ? v.signature : `data:image/png;base64,${v.signature}`;
    if (v.base64 && typeof v.base64 === 'string') return `data:image/png;base64,${v.base64}`;
  }
  return null;
};

const renderSignature = (val, w = 180, h = 40) => {
  const uri = normalizeSignature(val);
  if (uri) return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block"/>`;
  return '';
};

const getLogoDataUri = (p) => {
  if (!p) return null;
  if (p.assets && p.assets.logoDataUri) return p.assets.logoDataUri;
  const candidates = [path.join(process.cwd(), 'renderer', 'assets', 'logo.jpeg'), path.join(process.cwd(), 'assets', 'logo.jpeg')];
  for (const c of candidates) { try { if (fs.existsSync(c)) { const b=fs.readFileSync(c); const ext=path.extname(c).toLowerCase(); const mime=ext==='.png'?'image/png':'image/jpeg'; return `data:${mime};base64,${b.toString('base64')}`; } } catch(e){} }
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const metadata = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : (Array.isArray(p.data) ? p.data : []);
  const layoutHints = p.layoutHints || {};

  const COLS = layoutHints.WIDTHS || [120,120,120,80,80,80,120];
  const tableWidth = COLS.reduce((s,x)=>s+Number(x||0), 0);
  const logo = getLogoDataUri(p);

  const rowsHtml = (rows.length?rows:[]).map(r=>{
    return `<div style="display:flex; border-bottom:1px solid #cbd5e1; min-height:36px; align-items:center">
      <div style="width:${COLS[0]}px; padding:6px">${escapeHtml(r.sample || r.item || '')}</div>
      <div style="width:${COLS[1]}px; padding:6px; text-align:center">${escapeHtml(r.from || '')}</div>
      <div style="width:${COLS[2]}px; padding:6px; text-align:center">${escapeHtml(r.to || '')}</div>
      <div style="width:${COLS[3]}px; padding:6px; text-align:center">${escapeHtml(r.time || '')}</div>
      <div style="width:${COLS[4]}px; padding:6px; text-align:center">${escapeHtml(r.temp || '')}</div>
      <div style="width:${COLS[5]}px; padding:6px; text-align:center">${escapeHtml(r.result || '')}</div>
      <div style="width:${COLS[6]}px; padding:6px; text-align:center">${renderSignature(r.signature)}</div>
    </div>`;
  }).join('\n') || `<div style="padding:12px;color:#666">No entries</div>`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:8mm}
    body{font-family:Inter, Arial, sans-serif; margin:0; padding:12px}
    .card{background:#fff; border:1px solid #1F2937; padding:12px}
    .header{display:flex; justify-content:space-between; align-items:center}
    .brandLogo{width:56px; height:56px}
    .title{font-weight:800; font-size:18px; text-align:center; margin:12px 0}
    .tableWrap{overflow:auto; border:1px solid #1F2937}
  </style></head><body>

  <div class="card" style="max-width:1123px;margin:0 auto">
    <div class="header">
      <div style="display:flex; align-items:center; gap:12px">
        ${logo?`<img src="${logo}" class="brandLogo"/>`:'<div style="width:56px;height:56px;background:#eee"></div>'}
        <div><div style="font-weight:700">${escapeHtml(metadata.company || 'Bravo')}</div><div style="font-size:12px">Thawing Temperature Log</div></div>
      </div>
      <div style="text-align:right"><div>Date: ${escapeHtml(metadata.date || '')}</div><div>Location: ${escapeHtml(metadata.location || '')}</div></div>
    </div>

    <div class="title">THAWING TEMPERATURE LOG</div>

    <div style="background:#E5E7EB; padding:6px; display:flex;">
      <div style="width:${COLS[0]}px; font-weight:700; text-align:left">Product</div>
      <div style="width:${COLS[1]}px; font-weight:700; text-align:center">From</div>
      <div style="width:${COLS[2]}px; font-weight:700; text-align:center">To</div>
      <div style="width:${COLS[3]}px; font-weight:700; text-align:center">Time</div>
      <div style="width:${COLS[4]}px; font-weight:700; text-align:center">Temp</div>
      <div style="width:${COLS[5]}px; font-weight:700; text-align:center">Result</div>
      <div style="width:${COLS[6]}px; font-weight:700; text-align:center">Signature</div>
    </div>

    <div class="tableWrap" style="width:${tableWidth}px; margin-top:6px">${rowsHtml}</div>

    <div style="margin-top:12px; display:flex; gap:12px">
      <div style="flex:1"><div style="font-weight:700">Verified By</div>${renderSignature(metadata.verifiedBy || metadata.verifier || '')}</div>
      <div style="flex:1"><div style="font-weight:700">Checked By</div>${renderSignature(metadata.checkedBy || '')}</div>
    </div>
  </div>

</body></html>`;
};

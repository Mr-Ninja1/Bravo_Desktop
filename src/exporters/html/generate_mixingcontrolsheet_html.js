const escapeHtml = (s) => String(s === null || s === undefined ? '' : s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

const normalizeIncoming = (incoming) => {
  if (!incoming) return {};
  let v = incoming;
  if (v.payload) v = v.payload;
  if (v.meta && v.meta.payload) v = v.meta.payload;
  if (v.payload) v = v.payload;
  return v || {};
};

const resolveSignatureUri = (val) => {
  if (!val) return null;
  if (typeof val === 'object') {
    if (val.uri) return val.uri;
    if (val.data) return `data:image/png;base64,${String(val.data).replace(/\s+/g,'')}`;
    return null;
  }
  if (typeof val !== 'string') return null;
  const s = val.trim(); if (!s) return null;
  if (s.startsWith('data:') || s.startsWith('http')) return s;
  const compact = s.replace(/\s+/g,'');
  if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const metadata = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : [];

  const DEFAULT_COLS = {
    PROD_DATE: 120, PROD_NAME: 180, BATCH_NO: 100, INGREDIENTS: 220, INGREDIENTS_WEIGHT: 160, MIXING_TIME: 120, MIXING_TEMP: 120, DOUGH_DIVIDING: 160, PRODUCT_QUANTITY: 120, MIXER_MAN_SIGN: 140, SUP_SIGN: 140
  };
  const WIDTHS = (p.layoutHints && p.layoutHints.WIDTHS) || DEFAULT_COLS;
  const total = Object.values(WIDTHS).reduce((s,v)=>s+(Number(v)||0),0) || 1;
  const colPercent = (w) => ((w / total) * 100).toFixed(4) + '%';

  // logo
  let logo = (p.assets && (p.assets.logoDataUri || p.assets.logo)) ? (p.assets.logoDataUri || p.assets.logo) : (p.logo || p.logoDataUri || metadata.logoUrl || metadata.companyLogo || metadata.logo || null);
  if (!logo) { try { const fs=require('fs'); const path=require('path'); const explicit='C:\\Users\\sikal\\Desktop\\Bravo_Desktop\\assets\\logo.jpeg'; if (fs.existsSync(explicit)){ const data=fs.readFileSync(explicit); logo=`data:image/jpeg;base64,${data.toString('base64')}` } else { const alt = path.resolve(__dirname,'..','..','assets','logo.jpeg'); if (fs.existsSync(alt)){ const data=fs.readFileSync(alt); logo=`data:image/jpeg;base64,${data.toString('base64')}` } } } catch(e){} }

  const sigHtml = (v,w=120,h=60) => { const uri = resolveSignatureUri(v); if (uri) return `<img src="${uri}" style="max-width:${w}px;max-height:${h}px;display:block;object-fit:contain"/>`; return `<div style="min-height:${h}px;display:flex;align-items:center;justify-content:center;color:#6b7280">${escapeHtml(v||'')}</div>` };

  const rowsHtml = rows.map(r=>`<div class="row">${Object.keys(WIDTHS).map(k=>{
    const key = k.toLowerCase();
    if (k.toUpperCase().includes('SIGN')) return `<div class="cell" style="width:${colPercent(WIDTHS[k])}">${sigHtml(r[key]||r[k]||'')}</div>`;
    return `<div class="cell" style="width:${colPercent(WIDTHS[k])}">${escapeHtml(r[key]||r[k]||'')}</div>`;
  }).join('')}</div>`).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body{font-family:Inter,Arial,sans-serif;padding:12px;margin:0;color:#111827;background:#fff}
    .card{max-width:1100px;margin:0 auto}
    .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
    .logo{width:48px;height:48px;object-fit:contain}
    .subject{text-align:center;font-weight:800;margin-bottom:8px}
    .table{border:1px solid #333;border-radius:4px;overflow:hidden}
    .tableHeader{display:flex;background:#f3f5f7;border-bottom:1px solid #333}
    .headerCell{padding:8px;border-right:1px solid #333;font-weight:700;text-align:center}
    .row{display:flex;border-bottom:1px solid #333}
    .cell{padding:6px;border-right:1px solid #333;display:flex;align-items:center;justify-content:center}
    .cell img{max-height:60px;object-fit:contain}
  </style>
</head><body>
  <div class="card">
    <div class="header">${logo?`<img class="logo" src="${logo}" alt="Company logo"/>`:''}<div style="flex:1;text-align:right">${escapeHtml(metadata.issueDate||'')}</div></div>
    <div class="subject">SUBJECT: MIXING CONTROL SHEET</div>
    <div class="table">
      <div class="tableHeader">
        ${Object.keys(WIDTHS).map(k=>`<div class="headerCell" style="width:${colPercent(WIDTHS[k])}">${escapeHtml(k.replace(/_/g,' '))}</div>`).join('')}
      </div>
      ${rowsHtml}
    </div>
    <div style="margin-top:12px;display:flex;justify-content:space-between">
      <div style="width:48%"><strong>VERIFIED BY:</strong><br/>${sigHtml(p?.verification?.mixerManSign||p?.verification?.mixerMan||'')}</div>
      <div style="width:48%;text-align:right"><strong>COMPLEX MANAGER:</strong><br/>${sigHtml(p?.verification?.complexManagerSign||'')}</div>
    </div>
  </div>
</body></html>`;
};

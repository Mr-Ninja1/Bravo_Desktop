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
    if (val.uri && typeof val.uri === 'string') return val.uri.trim();
    if (val.data && typeof val.data === 'string') return `data:image/png;base64,${val.data.replace(/\s+/g,'')}`;
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
  const formData = Array.isArray(p.formData) ? p.formData : [];
  const layoutHints = p.layoutHints || {};

  const cols = (layoutHints.cols && Array.isArray(layoutHints.cols)) ? layoutHints.cols : [
    { key: 'name', label: 'NAME OF PRODUCT', flex: (layoutHints.name || 3) },
    { key: 'date', label: 'DATE', flex: (layoutHints.date || 1) },
    { key: 'expectedWeight', label: 'EXPECTED WEIGHT (g)', flex: (layoutHints.expectedWeight || 2) },
    { key: 'weight1', label: 'W1', flex: (layoutHints.weight1 || 1) },
    { key: 'weight2', label: 'W2', flex: (layoutHints.weight2 || 1) },
    { key: 'weight3', label: 'W3', flex: (layoutHints.weight3 || 1) },
    { key: 'weight4', label: 'W4', flex: (layoutHints.weight4 || 1) },
    { key: 'weight5', label: 'W5', flex: (layoutHints.weight5 || 1) }
  ];

  // compute widths from layoutHints.WIDTHS if provided, otherwise use flex to estimate
  const WIDTHS = p.layoutHints && p.layoutHints.WIDTHS ? p.layoutHints.WIDTHS : cols.reduce((acc,c)=>{ acc[c.key]=Math.max(60, Math.round((c.flex||1)*80)); return acc; }, {});
  const total = Object.values(WIDTHS).reduce((s,v)=>s+(Number(v)||0),0)||1;
  const colStyle = (key) => `width:${((Number(WIDTHS[key]||60)/total)*100).toFixed(4)}%`;

  // logo fallback
  let logo = (p.assets && (p.assets.logoDataUri || p.assets.logo)) ? (p.assets.logoDataUri || p.assets.logo) : (p.logo || p.logoDataUri || metadata.logoUrl || metadata.companyLogo || metadata.logo || null);
  if (!logo) {
    try { const fs=require('fs'); const path=require('path'); const explicit='C:\\Users\\sikal\\Desktop\\Bravo_Desktop\\assets\\logo.jpeg'; if (fs.existsSync(explicit)){ const data=fs.readFileSync(explicit); logo=`data:image/jpeg;base64,${data.toString('base64')}` } else { const alt=path.resolve(__dirname,'..','..','assets','logo.jpeg'); if (fs.existsSync(alt)){ const data=fs.readFileSync(alt); logo=`data:image/jpeg;base64,${data.toString('base64')}` } } } catch(e){}
  }

  const sigHtml = (v,w=160,h=44) => { const uri=resolveSignatureUri(v); if(uri) return `<img src="${uri}" style="max-width:${w}px;max-height:${h}px;display:block;object-fit:contain"/>`; return `<div style="height:${h}px;display:flex;align-items:center;justify-content:center;color:#6b7280">${escapeHtml(v||'')}</div>` };

  const rowsHtml = formData.length ? formData.map((item,idx)=>{
    return `<div class="row">${cols.map(col=>`<div class="cell" style="${colStyle(col.key)}">${escapeHtml(String(item[col.key] ?? ''))}</div>`).join('')}</div>`;
  }).join('\n') : `<div class="emptyRow">No entries</div>`;

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body{font-family:Inter,Arial,sans-serif;padding:12px;margin:0;color:#111827;background:#fff}
    .container{max-width:1100px;margin:0 auto}
    .topHeader{display:flex;justify-content:space-between;align-items:center;border:1px solid #000;padding:6px;margin-bottom:8px}
    .topLeft{display:flex;align-items:center}
    .logo{width:44px;height:44px;margin-right:10px}
    .brand{font-weight:800;color:#185a9d}
    .headerBox{margin-bottom:12px}
    .table{border:1px solid #333;border-radius:4px;overflow:hidden}
    .tableHeader{display:flex;background:#f3f5f7;border-bottom:1px solid #333}
    .headerCell{padding:8px;border-right:1px solid #ddd;display:flex;align-items:center;justify-content:center}
    .row{display:flex;border-bottom:1px solid #eee;min-height:44px}
    .cell{padding:8px;border-right:1px solid #eee;display:flex;align-items:center;justify-content:center}
    .emptyRow{padding:12px;text-align:center;color:#666}
    .verify{display:flex;justify-content:flex-end;margin-top:12px}
  </style>
</head><body>
  <div class="container">
    <div class="topHeader">
      <div class="topLeft">${logo?`<img class="logo" src="${logo}" alt="logo"/>`:''}<div><div class="brand">BRAVO BRANDS LIMITED</div><div>Food Safety Management System</div></div></div>
      <div class="topRight"><div>Issue Date: ${escapeHtml(metadata.issueDate|| (p.savedAt? new Date(p.savedAt).toLocaleDateString():''))}</div><div>Page 1 of 1</div></div>
    </div>

    <div class="headerBox"><div style="font-weight:800;font-size:16px">SUBJECT: PRODUCTS NET CONTENT CHECKLIST</div><div style="color:#666">Saved: ${escapeHtml(p.savedAt? new Date(p.savedAt).toLocaleString() : '')}</div></div>

    <div class="table">
      <div class="tableHeader">${cols.map(col=>`<div class="headerCell" style="${colStyle(col.key)}">${escapeHtml(col.label)}</div>`).join('')}</div>
      ${rowsHtml}
    </div>

    <div class="verify">
      <div style="width:260px;text-align:center">${sigHtml(p.verification?.supervisorSign||p.verification?.supervisor||'')}</div>
      <div style="width:260px;text-align:center">${sigHtml(p.verification?.hseqManagerSign||p.verification?.hseqManager||'')}</div>
      <div style="width:260px;text-align:center">${sigHtml(p.verification?.complexManagerSign||p.verification?.complexManager||'')}</div>
    </div>
  </div>
</body></html>`;
};

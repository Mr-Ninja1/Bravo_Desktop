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
  const formData = Array.isArray(p.formData) ? p.formData : (p.rows || []);
  const DAYS_OF_WEEK = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  let logo = (p.assets && (p.assets.logoDataUri || p.assets.logo)) ? (p.assets.logoDataUri || p.assets.logo) : (p.logo || p.logoDataUri || metadata.logoUrl || metadata.companyLogo || metadata.logo || null);
  if (!logo) {
    try {
      const fs = require('fs');
      const path = require('path');
      const possible = ['logo.png','logo.jpg','logo.jpeg','logo.webp'];
      for (const name of possible) {
        const pth = path.join(process.cwd(), 'assets', name);
        if (fs.existsSync(pth)) {
          const buf = fs.readFileSync(pth);
          const ext = path.extname(name).toLowerCase().replace('.', '');
          const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : (ext === 'png' ? 'image/png' : (ext === 'webp' ? 'image/webp' : 'application/octet-stream'));
          logo = `data:${mime};base64,${buf.toString('base64')}`;
          break;
        }
      }
    } catch (e) {}
  }

  const sigHtml = (v, h = 40) => { const uri = resolveSignatureUri(v); if (uri) return `<img src="${uri}" style="max-height:${h}px; width:auto; object-fit:contain; display:block;"/>`; return `<div style="font-size:9px;color:#94a3b8">${escapeHtml(v||'')}</div>`; };

  // default column widths (pixels)
  const COL = { AREA: 300, FREQ: 150, DAY: 120 };
  const TABLE_WIDTH = (p._tableWidth || (COL.AREA + COL.FREQ + (DAYS_OF_WEEK.length * COL.DAY)));
  const exportingWide = !!p.exportingWide;
  const A4_WIDTH = 794;
  let scale = 1; if (exportingWide && TABLE_WIDTH > A4_WIDTH) scale = A4_WIDTH / TABLE_WIDTH;
  const adj = { AREA: Math.round(COL.AREA * scale), FREQ: Math.round(COL.FREQ * scale), DAY: Math.round(COL.DAY * scale), TABLE: Math.round(TABLE_WIDTH * scale) };

  const rowsHtml = (formData.length ? formData : Array.from({length:10}).map(()=>({})) ).map((item,i)=>{
    const dayCells = DAYS_OF_WEEK.map(d=>{
      const obj = item.days && item.days[d] ? item.days[d] : {};
      return `<div class="day" style="width:${adj.DAY}px; display:flex; flex-direction:column; align-items:center; padding:6px; border-right:1px solid #333"><div style="height:20px">${obj.checked? '✓' : ''}</div><div style="font-size:10px; margin-top:6px">${escapeHtml(obj.cleanedBy||'')}</div></div>`;
    }).join('');
    return `<div class="row" style="display:flex; border-bottom:1px solid #ccc; min-height:44px">`+
      `<div class="cell" style="width:${adj.AREA}px; padding:6px; text-align:left; font-weight:600">${escapeHtml(item.name||'')}</div>`+
      `<div class="cell" style="width:${adj.FREQ}px; padding:6px">${escapeHtml(item.frequency||'')}</div>`+
      `${dayCells}`+
    `</div>`;
  }).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:6mm}
    body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:8px;color:#111;font-size:10px}
    .header{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #185a9d;padding-bottom:6px;margin-bottom:8px}
    .logo{height:40px}
    .company{font-weight:800;color:#185a9d}
    .title{text-align:center;font-weight:800;margin:10px 0}
    .table{border:1px solid #333}
    .thead{display:flex;background:#f3f4f6;border-bottom:2px solid #333}
    .hcell{padding:8px;border-right:1px solid #333;display:flex;align-items:center;justify-content:center;font-weight:800}
    .row{display:flex}
    .cell{padding:6px;border-right:1px solid #ddd;display:flex;align-items:center;justify-content:center}
  </style></head><body>
    <div class="header"><div style="display:flex;align-items:center;gap:10px">${logo?`<img class="logo" src="${logo}"/>`:''}<div class="company">${escapeHtml(metadata.companyName||'Bravo')}</div></div><div style="font-weight:700">Week: ${escapeHtml(metadata.week||'')}</div></div>
    <div class="title">BAKERY AREA CLEANING CHECKLIST</div>
    <div class="table" style="width:${adj.TABLE}px">
      <div class="thead">
        <div class="hcell" style="width:${adj.AREA}px">Area to be cleaned</div>
        <div class="hcell" style="width:${adj.FREQ}px">Frequency</div>
        ${DAYS_OF_WEEK.map(d=>`<div class="hcell" style="width:${adj.DAY}px">${d.toUpperCase()}</div>`).join('')}
      </div>
      ${rowsHtml}
    </div>
    <div style="margin-top:12px; display:flex; gap:12px">
      <div style="flex:1; border:1px solid #cbd5e1; padding:8px"><div style="font-weight:800;color:#185a9d">Verified By:</div>${sigHtml(p.verification?.hseqManagerSign || p.verification?.hseqManager || '')}</div>
      <div style="flex:1; border:1px solid #cbd5e1; padding:8px"><div style="font-weight:800;color:#185a9d">Complex Manager:</div>${sigHtml(p.verification?.complexManagerSign || p.verification?.complexManager || '')}</div>
    </div>
  </body></html>`;
};

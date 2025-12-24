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
  if (!val && val !== '') return null;
  if (typeof val === 'object') {
    const maybe = val.uri || val.data || val.base64 || val.signature || val.dataUri;
    if (!maybe || typeof maybe !== 'string') return null;
    const s = maybe.trim(); if (!s) return null;
    if (s.indexOf('data:') >= 0) return s;
    const compact = s.replace(/\s+/g,'');
    if (/^[A-Za-z0-9+/=]+$/.test(compact) && compact.length > 100) return `data:image/png;base64,${compact}`;
    return null;
  }
  if (typeof val !== 'string') return null;
  const s = val.trim(); if (!s) return null;
  if (s.indexOf('data:') >= 0) return s;
  const compact = s.replace(/\s+/g,'');
  if (/^[A-Za-z0-9+/=]+$/.test(compact) && compact.length > 100) return `data:image/png;base64,${compact}`;
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const metadata = p.metadata || {};
  const WEEK_DAYS = ['Sun','Mon','Tue','Wed','Thurs','Fri','Sat'];
  const items = Array.isArray(p.formData) ? p.formData : (p.formData && p.formData.items) || [];

  // group by area
  const grouped = items.reduce((acc, it) => { const area = it.area || 'General'; if (!acc[area]) acc[area]=[]; acc[area].push(it); return acc; }, {});

  // sizing (supports exportingWide scaling)
  const exportingWide = Boolean(p.__exportingWide || p.exportingWide || p.exporting || p.__exporting);
  const baseTableWidth = 260 + 150 + WEEK_DAYS.length * (48 + 110);
  const A4_WIDTH = 794;
  const tableWidth = exportingWide ? A4_WIDTH : baseTableWidth;
  const areaColW = exportingWide ? Math.round(260 * (A4_WIDTH / baseTableWidth)) : 260;
  const freqColW = exportingWide ? Math.round(150 * (A4_WIDTH / baseTableWidth)) : 150;
  const checkColW = exportingWide ? Math.round(48 * (A4_WIDTH / baseTableWidth)) : 48;
  const cleanedByColW = exportingWide ? Math.round(110 * (A4_WIDTH / baseTableWidth)) : 110;

  // logo resolution
  let logo = (p.assets && (p.assets.logoDataUri || p.assets.logo)) ? (p.assets.logoDataUri || p.assets.logo) : (p.logo || p.logoDataUri || metadata.logoUrl || metadata.companyLogo || metadata.logo || null);
  if (!logo) {
    try { const fs=require('fs'); const path=require('path'); const explicit='C:\\Users\\sikal\\Desktop\\Bravo_Desktop\\assets\\logo.jpeg'; if (fs.existsSync(explicit)){ const data=fs.readFileSync(explicit); logo=`data:image/jpeg;base64,${data.toString('base64')}` } else { const alt=path.resolve(__dirname,'..','..','assets','logo.jpeg'); if (fs.existsSync(alt)){ const data=fs.readFileSync(alt); logo=`data:image/jpeg;base64,${data.toString('base64')}` } } } catch(e){}
  }

  const sigHtml = (val,w=140,h=44) => { const uri = resolveSignatureUri(val); if (uri) return `<img src="${uri}" style="max-width:${w}px;max-height:${h}px;display:block;object-fit:contain"/>`; return `<div style="height:${h}px;display:flex;align-items:center;justify-content:center;color:#6b7280">${escapeHtml(val||'')}</div>` };

  const rowsHtml = Object.keys(grouped).map(area => {
    const rows = grouped[area].map(item => {
      const checks = WEEK_DAYS.map(d=>{
        const ch = item.checks && item.checks[d] ? item.checks[d] : {};
        return `<div style="display:flex"><div style="width:${checkColW}px;text-align:center;padding:6px">${ch.checked? '✓' : ''}</div><div style="width:${cleanedByColW}px;padding:6px">${escapeHtml(ch.cleanedBy||'')}</div></div>`;
      }).join('');
      return `<div style="display:flex;border-bottom:1px solid #e5e7eb;min-height:40px;align-items:center"><div style="width:${areaColW}px;padding:6px">${escapeHtml(item.name||'')}</div><div style="width:${freqColW}px;padding:6px">${escapeHtml(item.frequency||'')}</div>${checks}</div>`;
    }).join('\n');
    return `<div><div style="background:#f3f4f6;padding:8px;border-bottom:1px solid #e5e7eb;font-weight:700">${escapeHtml(area)}</div>${rows}</div>`;
  }).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body{font-family:Inter,Arial,sans-serif;padding:12px;margin:0;color:#111827;background:#fff}
    .card{max-width:1100px;margin:0 auto}
    .brandRow{display:flex;align-items:center;margin-bottom:8px}
    .brandLogo{width:56px;height:56px;margin-right:12px}
    .brandName{font-size:16px;font-weight:700;color:#185a9d}
    .mainTitle{text-align:center;font-weight:800;font-size:18px;margin-bottom:10px}
    .metaRow{display:flex;justify-content:space-between;margin-bottom:8px}
    .table{border:1px solid #1F2937;border-radius:4px;overflow:hidden}
    .tableHeader{display:flex;background:#f3f4f6;padding:6px;align-items:center}
    .headerText{font-weight:700;text-align:center}
  </style>
</head><body>
  <div class="card">
    <div class="brandRow">
      ${logo?`<img class="brandLogo" src="${logo}" alt="Company logo"/>`:''}
      <div style="flex:1"><div class="brandName">${escapeHtml(metadata.companyName||'Bravo')}</div></div>
    </div>
    <div class="mainTitle">WELFARE FACILITIES CLEANING CHECKLIST</div>
    <div style="margin-bottom:8px;display:flex;justify-content:space-between"><div><strong>Location:</strong> ${escapeHtml(metadata.location||'')}</div><div><strong>Week:</strong> ${escapeHtml(metadata.week||'')}</div><div><strong>Month:</strong> ${escapeHtml(metadata.month||'')}</div><div><strong>Year:</strong> ${escapeHtml(metadata.year||'')}</div></div>

    <div class="table">
      <div class="tableHeader">
        <div style="width:${areaColW}px;padding:6px" class="headerText">Area to be cleaned</div>
        <div style="width:${freqColW}px;padding:6px" class="headerText">Frequency (Per Week)</div>
        ${WEEK_DAYS.map(d=>`<div style="display:flex"><div style="width:${checkColW}px;padding:6px;text-align:center" class="headerText">${d}</div><div style="width:${cleanedByColW}px;padding:6px;text-align:center" class="headerText">Cleaned BY</div></div>`).join('')}
      </div>
      ${rowsHtml}
    </div>

    <div style="margin-top:12px">Verified By: ${sigHtml(metadata.hseqManagerSign||metadata.hseqManager||'')}</div>
  </div>
</body></html>`;
};

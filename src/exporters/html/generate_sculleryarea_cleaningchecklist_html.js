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

const renderSignature = (val, w = 180, h = 44) => {
  const uri = normalizeSignature(val);
  if (uri) return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block; mix-blend-mode: multiply; margin-top: 5px;"/>`;
  return `<div style="border-bottom: 1px solid #ccc; width: 100px; height: 20px; margin-top: 10px;"></div>`;
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
  const formData = Array.isArray(p.formData) ? p.formData : (Array.isArray(p.data) ? p.data : []);
  const WEEK_DAYS = ['Sun','Mon','Tue','Wed','Thurs','Fri','Sat'];

  // Recalibrated for A4 Landscape (approx 1060px usable width)
  const COL = {
    AREA: 180,
    FREQ: 110,
    DAY_BOX: 110, // Total for one day group
    CHECK: 30,    // The checkmark tick box
    SIGN: 80      // The "Cleaned By" box
  };

  const logo = getLogoDataUri(p);

  const rowsHtml = (formData.length ? formData : Array.from({length:10}).map(()=>({}))).map(row => {
    const dayCols = WEEK_DAYS.map(d => `
      <div style="display:flex; width:${COL.DAY_BOX}px; border-right:1px solid #000; align-items:stretch">
        <div style="width:${COL.CHECK}px; padding:4px; text-align:center; border-right:1px solid #000; font-weight:bold; display:flex; align-items:center; justify-content:center">${row.checks && row.checks[d] && row.checks[d].checked ? '✓' : ''}</div>
        <div style="flex:1; padding:4px; text-align:center; font-size:10px; display:flex; align-items:center; justify-content:center">${escapeHtml(row.checks && row.checks[d] && row.checks[d].cleanedBy || '')}</div>
      </div>`).join('');
    
    return `
      <div style="display:flex; border-bottom:1px solid #000; background:#fff; min-height:38px; align-items:stretch">
        <div style="width:${COL.AREA}px; padding:6px; border-right:1px solid #000; font-size:11px; display:flex; align-items:center">${escapeHtml(row.name || '')}</div>
        <div style="width:${COL.FREQ}px; padding:6px; border-right:1px solid #000; text-align:center; font-size:11px; display:flex; align-items:center; justify-content:center">${escapeHtml(row.frequency || '')}</div>
        ${dayCols}
      </div>`;
  }).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:8mm}
    *{box-sizing: border-box;}
    body{font-family:'Inter', Arial, sans-serif; margin:0; padding:0; color:#111}
    .container{width:1060px; margin:0 auto; padding:10px}
    .brandLogo{width:56px; height:56px; object-fit:contain; margin-right:12px}
    .mainTitle{font-weight:900; font-size:20px; text-align:center; margin:10px 0; text-transform:uppercase}
    .tableContainer{border:1.5px solid #000; border-bottom:none; width:100%}
    .tableHeader{display:flex; background:#e5e7eb; border-bottom:1.5px solid #000; align-items:stretch}
    .hCell{font-weight:800; font-size:10px; text-align:center; border-right:1px solid #000; text-transform:uppercase; display:flex; align-items:center; justify-content:center}
  </style></head><body>

  <div class="container">
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #000; padding-bottom:8px">
      <div style="display:flex; align-items:center">
        ${logo ? `<img src="${logo}" class="brandLogo"/>` : ''}
        <div>
          <div style="font-weight:900; font-size:18px; color:#007A33">BRAVO! BRANDS</div>
          <div style="font-size:11px; font-weight:700">Food Safety Management System</div>
        </div>
      </div>
      <div style="text-align:right; font-size:11px; font-weight:700">
        <div>Issue Date: ${escapeHtml(metadata.issueDate || '')}</div>
        <div>Page 1 of 1</div>
      </div>
    </div>

    <div class="mainTitle">Scullery Area Cleaning Checklist</div>

    <div style="border:1.5px solid #000; padding:8px; margin-bottom:10px; display:flex; gap:25px; background:#f9fafb; font-size:12px">
      <div><strong>LOCATION:</strong> ${escapeHtml(metadata.location || 'SCULLERY')}</div>
      <div><strong>WEEK:</strong> ${escapeHtml(metadata.week || '')}</div>
      <div><strong>MONTH:</strong> ${escapeHtml(metadata.month || '')}</div>
      <div><strong>YEAR:</strong> ${escapeHtml(metadata.year || '')}</div>
    </div>

    <div class="tableContainer">
      <div class="tableHeader">
        <div class="hCell" style="width:${COL.AREA}px">Area to be cleaned</div>
        <div class="hCell" style="width:${COL.FREQ}px">Frequency</div>
        ${WEEK_DAYS.map(d=>`
          <div style="width:${COL.DAY_BOX}px; display:flex; flex-direction:column; border-right:1px solid #000">
            <div style="padding:4px; border-bottom:1px solid #000; font-weight:900; background:#d1d5db">${d}</div>
            <div style="display:flex; flex:1">
              <div style="width:${COL.CHECK}px; border-right:1px solid #000; font-size:8px; display:flex; align-items:center; justify-content:center">✓</div>
              <div style="flex:1; font-size:8px; display:flex; align-items:center; justify-content:center">Cleaned By</div>
            </div>
          </div>`).join('')}
      </div>
      ${rowsHtml}
    </div>

    <div style="margin-top:15px; display:flex; gap:15px">
      <div style="flex:1; border:1px solid #000; padding:8px">
        <div style="font-size:10px; font-weight:800; color:#555">VERIFIED BY: HSEQ MANAGER</div>
        <div style="min-height:50px">${renderSignature(metadata.hseqSign || metadata.hseqManagerSign || metadata.hseqManager)}</div>
        <div style="font-size:11px; font-weight:700; border-top:1px solid #eee; margin-top:5px">${escapeHtml(metadata.hseqManagerName || '')}</div>
      </div>
      <div style="flex:1; border:1px solid #000; padding:8px">
        <div style="font-size:10px; font-weight:800; color:#555">APPROVED BY: COMPLEX MANAGER</div>
        <div style="min-height:50px">${renderSignature(metadata.approvedBySignature || metadata.approvedBySign)}</div>
        <div style="font-size:11px; font-weight:700; border-top:1px solid #eee; margin-top:5px">${escapeHtml(metadata.approvedByName || '')}</div>
      </div>
    </div>
  </div>

</body></html>`;
};
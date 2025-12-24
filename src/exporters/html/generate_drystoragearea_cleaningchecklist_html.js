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

const renderSignatureThumb = (v, w = 180, h = 45) => {
  const uri = normalizeSignature(v);
  if (!uri) return '';
  return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block; object-fit:contain; mix-blend-mode: multiply;"/>`;
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
  const WEEK_DAYS = ['Sun','Mon','Tue','Wed','Thurs','Fri','Sat'];

  // A4 Landscape Calibration (~1060px printable width)
  const AREA_W = 180;
  const FREQ_W = 100;
  const DAY_GROUP_W = 110; // Total for one day (7 * 110 = 770)
  const CHECK_W = 30;      // Tick box
  const SIG_W = 80;        // "Cleaned By" box
  
  const TOTAL_W = AREA_W + FREQ_W + (WEEK_DAYS.length * DAY_GROUP_W);

  const rows = Array.isArray(p.formData) ? p.formData : (Array.isArray(p.data) ? p.data : []);
  const logo = getLogoDataUri(p);

  const rowsHtml = (rows.length ? rows : Array.from({length: 10}).map(()=>({}))).map((r, idx) => {
    const dayCols = WEEK_DAYS.map(d => {
      const c = (r.checks && r.checks[d]) ? r.checks[d] : { checked: false, cleanedBy: '' };
      return `
        <div style="display:flex; width:${DAY_GROUP_W}px; border-right:1px solid #000; align-items:stretch">
          <div style="width:${CHECK_W}px; padding:4px; text-align:center; border-right:1px solid #000; font-weight:bold; display:flex; align-items:center; justify-content:center">${c.checked ? '✓' : ''}</div>
          <div style="flex:1; padding:4px; text-align:center; font-size:10px; display:flex; align-items:center; justify-content:center; overflow:hidden; white-space:nowrap">${escapeHtml(c.cleanedBy || '')}</div>
        </div>`;
    }).join('');

    return `
      <div style="display:flex; border-bottom:1px solid #000; background:#fff; min-height:38px; align-items:stretch">
        <div style="width:${AREA_W}px; padding:6px; border-right:1px solid #000; font-size:11px; display:flex; align-items:center">${escapeHtml(r.name || '')}</div>
        <div style="width:${FREQ_W}px; padding:6px; border-right:1px solid #000; text-align:center; font-size:11px; display:flex; align-items:center; justify-content:center">${escapeHtml(r.frequencyText || r.frequencyValue || '')}</div>
        ${dayCols}
      </div>`;
  }).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:8mm}
    *{box-sizing: border-box;}
    body{font-family:Inter, Arial, sans-serif; margin:0; padding:0; color:#111}
    .container{width:1060px; margin:0 auto; padding:10px}
    .docHeader{display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:10px}
    .brandLogo{width:56px; height:56px; object-fit:contain; margin-right:12px}
    .mainTitle{font-size:20px; font-weight:900; text-align:center; text-transform:uppercase; margin:10px 0}
    .tableContainer{border:1.5px solid #000; border-bottom:none; width:100%}
    .hRow{display:flex; background:#e5e7eb; border-bottom:1.5px solid #000; align-items:stretch}
    .hCell{font-weight:800; font-size:10px; text-align:center; border-right:1px solid #000; text-transform:uppercase; display:flex; align-items:center; justify-content:center}
    .metaBox{border:1.5px solid #000; padding:8px; margin-bottom:10px; display:flex; gap:25px; background:#f9fafb; font-size:12px}
  </style></head><body>

    <div class="container">
      <div class="docHeader">
        <div style="display:flex; align-items:center">
          ${logo ? `<img src="${logo}" class="brandLogo"/>` : ''}
          <div>
            <div style="font-weight:900; font-size:18px; color:#185a9d">BRAVO! BRANDS</div>
            <div style="font-size:11px; font-weight:700; color:#43cea2">Food Safety Management System</div>
          </div>
        </div>
        <div style="text-align:right; font-size:11px; font-weight:700">
          <div>Issue Date: ${escapeHtml(p.date || '')}</div>
          <div>Page 1 of 1</div>
        </div>
      </div>

      <div class="mainTitle">${escapeHtml(p.title || 'DRY STORAGE AREA CLEANING CHECKLIST')}</div>

      <div class="metaBox">
        <div><strong>LOCATION:</strong> ${escapeHtml(metadata.location || '')}</div>
        <div><strong>WEEK:</strong> ${escapeHtml(metadata.week || '')}</div>
        <div><strong>MONTH:</strong> ${escapeHtml(metadata.month || '')}</div>
        <div><strong>YEAR:</strong> ${escapeHtml(metadata.year || '')}</div>
      </div>

      <div style="font-weight:900; font-size:14px; margin-bottom:8px; border-left:4px solid #185a9d; padding-left:8px">WAREHOUSE AREA</div>

      <div class="tableContainer">
        <div class="hRow">
          <div class="hCell" style="width:${AREA_W}px">Area to be cleaned</div>
          <div class="hCell" style="width:${FREQ_W}px">Frequency</div>
          ${WEEK_DAYS.map(d=>`
            <div style="width:${DAY_GROUP_W}px; display:flex; flex-direction:column; border-right:1px solid #000">
              <div style="padding:4px; border-bottom:1px solid #000; font-weight:900; background:#d1d5db; text-align:center; font-size:11px">${d}</div>
              <div style="display:flex; flex:1">
                <div style="width:${CHECK_W}px; border-right:1px solid #000; font-size:8px; display:flex; align-items:center; justify-content:center">✓</div>
                <div style="flex:1; font-size:8px; display:flex; align-items:center; justify-content:center">Cleaned By</div>
              </div>
            </div>`).join('')}
        </div>
        ${rowsHtml}
      </div>

      <div style="margin-top:20px; display:flex; justify-content:flex-end">
        <div style="width:350px; border:1.5px solid #000; padding:10px; background:#f3f4f6">
          <div style="font-weight:800; font-size:10px; color:#555; text-transform:uppercase">Verified By: HSEQ Manager</div>
          <div style="min-height:50px; display:flex; align-items:center; justify-content:center">
            ${renderSignatureThumb(metadata.hseqSign || metadata.hseqManagerSign || metadata.hseqManager)}
          </div>
          <div style="border-top:1px solid #000; padding-top:4px; font-size:11px; font-weight:700; text-align:center">
            ${escapeHtml(metadata.hseqManager || '')}
          </div>
        </div>
      </div>
    </div>

</body></html>`;
};
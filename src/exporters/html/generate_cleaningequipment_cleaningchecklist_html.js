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
  if (!v && v !== '') return null;
  if (v && typeof v === 'object') {
    const maybe = v.uri || v.data || v.base64 || v.signature || v.dataUri;
    if (!maybe || typeof maybe !== 'string') return null;
    const s = maybe.trim();
    if (!s) return null;
    if (s.indexOf('data:') === 0) return s;
    const compact = s.replace(/\s+/g, '');
    if (/^[A-Za-z0-9+/=]+$/.test(compact) && compact.length > 100) return `data:image/png;base64,${compact}`;
    return null;
  }
  const str = String(v || '').trim();
  if (!str) return null;
  if (str.indexOf('data:') === 0) return str;
  const compact = str.replace(/\s+/g, '');
  if (/^[A-Za-z0-9+/=]+$/.test(compact) && compact.length > 100) return `data:image/png;base64,${compact}`;
  return null;
};

const renderSignatureOnly = (v, w = 200, h = 45) => {
  const uri = normalizeSignature(v);
  if (uri) return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block; object-fit:contain; mix-blend-mode: multiply;"/>`;
  return `<div style="border-bottom: 1px solid #999; width: 120px; height: 20px; margin-top: 10px;"></div>`;
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
  const meta = p.metadata || {};
  const items = Array.isArray(p.formData) ? p.formData : (p.formData && Array.isArray(p.formData.items) ? p.formData.items : []);

  // Professional A4 Landscape Grid Calibration (~1060px usable)
  const COL = {
    AREA: 180,
    FREQ: 100,
    DAY_BOX: 110, // Total width for one day (7 * 110 = 770)
    CHECK: 30,    // Tick box
    SIGN: 80      // Cleaned By
  };

  const WEEK_DAYS = ['Sun','Mon','Tue','Wed','Thurs','Fri','Sat'];
  const logo = getLogoDataUri(p);

  const rowsHtml = (items.length ? items : Array.from({length: 8}).map(()=>({}))).map(item => {
    const dayHtml = WEEK_DAYS.map(d => `
      <div style="display:flex; width:${COL.DAY_BOX}px; border-right:1px solid #000; align-items:stretch">
        <div style="width:${COL.CHECK}px; padding:4px; text-align:center; border-right:1px solid #000; font-weight:900; display:flex; align-items:center; justify-content:center">${item.checks?.[d]?.checked ? '✓' : ''}</div>
        <div style="flex:1; padding:4px; text-align:center; font-size:10px; display:flex; align-items:center; justify-content:center; overflow:hidden">${escapeHtml(item.checks?.[d]?.cleanedBy || '')}</div>
      </div>`).join('');

    return `
      <div style="display:flex; align-items:stretch; border-bottom:1px solid #000; min-height:36px; background:#fff">
        <div style="width:${COL.AREA}px; padding:6px; border-right:1px solid #000; font-size:11px; display:flex; align-items:center">${escapeHtml(item.name || '')}</div>
        <div style="width:${COL.FREQ}px; padding:6px; border-right:1px solid #000; text-align:center; font-size:11px; display:flex; align-items:center; justify-content:center">${escapeHtml(item.frequency || '')}</div>
        ${dayHtml}
      </div>`;
  }).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:8mm}
    *{box-sizing: border-box;}
    body{font-family:'Inter', Arial, sans-serif; margin:0; padding:0; color:#111}
    .container{width:1060px; margin:0 auto; padding:10px}
    .brandLogo{width:56px; height:56px; object-fit:contain; margin-right:12px}
    .mainTitle{font-size:18px; font-weight:900; text-align:center; margin:10px 0; text-transform:uppercase}
    .metaBox{border:1.5px solid #000; padding:8px; display:flex; gap:20px; background:#f9fafb; font-size:12px; margin-bottom:10px}
    .tableWrap{border:1.5px solid #000; border-bottom:none; width:100%}
    .hRow{display:flex; background:#e5e7eb; border-bottom:1.5px solid #000; align-items:stretch}
    .hCell{font-weight:800; font-size:10px; text-align:center; border-right:1px solid #000; text-transform:uppercase; display:flex; align-items:center; justify-content:center}
    .sig-area{display:flex; gap:12px; margin-top:10px}
    .sig-box{flex:1; border:1px solid #000; padding:8px; background:#fff}
  </style></head><body>

  <div class="container">
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #000; padding-bottom:8px">
      <div style="display:flex; align-items:center">
        ${logo ? `<img src="${logo}" class="brandLogo"/>` : ''}
        <div>
          <div style="font-weight:900; font-size:16px; color:#111">BRAVO! FOOD SAFETY INSPECTIONS</div>
          <div style="font-size:11px; font-weight:700; color:#007A33">Bravo Brands Central</div>
        </div>
      </div>
      <div style="text-align:right; font-size:11px; font-weight:700">
        <div>Issue Date: ${escapeHtml(meta.issueDate || '')}</div>
        <div>Page 1 of 1</div>
      </div>
    </div>

    <div class="mainTitle">Cleaning Equipment Checklist</div>

    <div class="metaBox">
      <div style="flex:2"><strong>LOCATION:</strong> ${escapeHtml(meta.location || '')}</div>
      <div><strong>WEEK:</strong> ${escapeHtml(meta.week || '')}</div>
      <div><strong>MONTH:</strong> ${escapeHtml(meta.month || '')}</div>
      <div><strong>YEAR:</strong> ${escapeHtml(meta.year || '')}</div>
    </div>

    <div class="tableWrap">
      <div class="hRow">
        <div class="hCell" style="width:${COL.AREA}px">Equipment</div>
        <div class="hCell" style="width:${COL.FREQ}px">Frequency</div>
        ${WEEK_DAYS.map(d => `
          <div style="width:${COL.DAY_BOX}px; display:flex; flex-direction:column; border-right:1px solid #000">
            <div style="padding:4px; border-bottom:1px solid #000; font-weight:900; background:#d1d5db; font-size:11px; text-align:center">${d}</div>
            <div style="display:flex; flex:1">
              <div style="width:${COL.CHECK}px; border-right:1px solid #000; font-size:8px; display:flex; align-items:center; justify-content:center">✓</div>
              <div style="flex:1; font-size:8px; display:flex; align-items:center; justify-content:center">Cleaned By</div>
            </div>
          </div>`).join('')}
      </div>
      ${rowsHtml}
    </div>

    <div class="sig-area">
      <div class="sig-box">
        <div style="font-size:10px; font-weight:800; color:#555">VERIFIED BY: HSEQ MANAGER</div>
        <div style="min-height:50px; display:flex; align-items:center">${renderSignatureOnly(meta.hseqSign || meta.hseqManager)}</div>
      </div>
      <div class="sig-box">
        <div style="font-size:10px; font-weight:800; color:#555">APPROVED BY</div>
        <div style="min-height:50px; display:flex; align-items:center">${renderSignatureOnly(meta.approvedBySign || meta.approvedBy)}</div>
      </div>
    </div>
  </div>

</body></html>`;
};
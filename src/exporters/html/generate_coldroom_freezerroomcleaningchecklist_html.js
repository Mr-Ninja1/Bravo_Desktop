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
    if (compact.length > 150) return `data:image/png;base64,${compact}`;
    return null;
  }
  if (typeof v === 'object') {
    const maybe = v.uri || v.data || v.base64 || v.signature || v.dataUri;
    if (maybe && typeof maybe === 'string') {
      if (maybe.indexOf('data:') === 0) return maybe;
      const compact = maybe.replace(/\s+/g, '');
      if (compact.length > 100) return `data:image/png;base64,${compact}`;
    }
  }
  return null;
};

const renderSignatureThumb = (v, w = 180, h = 45) => {
  const uri = normalizeSignature(v);
  if (!uri) return `<div style="border-bottom: 1px solid #ccc; width: 140px; height: 15px; margin-top: 10px;"></div>`;
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
  const meta = p.metadata || {};
  const WEEK_DAYS = ['Sun','Mon','Tue','Wed','Thurs','Fri','Sat'];
  
  // Professional A4 Landscape Calibration
  const COL = {
    AREA: 180,
    FREQ: 100,
    DAY_GROUP: 110, // (7 * 110 = 770)
    CHECK: 30,
    SIG: 80
  };

  const rows = Array.isArray(p.formData) ? p.formData : (Array.isArray(p.data) ? p.data : []);
  const logo = getLogoDataUri(p);

  const rowsHtml = (rows.length ? rows : Array.from({length: 8}).map(()=>({}))).map((r,idx)=>{
    const dayCols = WEEK_DAYS.map(d => {
      const c = (r.checks && r.checks[d]) ? r.checks[d] : { checked:false, cleanedBy: '' };
      return `
        <div style="display:flex; width:${COL.DAY_GROUP}px; border-right:1px solid #000; align-items:stretch">
          <div style="width:${COL.CHECK}px; padding:4px; text-align:center; border-right:1px solid #000; font-weight:bold; display:flex; align-items:center; justify-content:center">${c.checked ? '✓' : ''}</div>
          <div style="flex:1; padding:4px; text-align:center; font-size:10px; display:flex; align-items:center; justify-content:center; overflow:hidden">${escapeHtml(c.cleanedBy || '')}</div>
        </div>`;
    }).join('');

    return `
      <div style="display:flex; border-bottom:1px solid #000; background:#fff; min-height:38px; align-items:stretch">
        <div style="width:${COL.AREA}px; padding:6px; border-right:1px solid #000; font-size:11px; display:flex; align-items:center">${escapeHtml(r.name || '')}</div>
        <div style="width:${COL.FREQ}px; padding:6px; border-right:1px solid #000; text-align:center; font-size:11px; display:flex; align-items:center; justify-content:center">${escapeHtml(r.frequency || '')}</div>
        ${dayCols}
      </div>`;
  }).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:6mm}
    *{box-sizing: border-box;}
    body{font-family:'Inter', Arial, sans-serif; margin:0; padding:0; color:#111}
    .container{width:1060px; margin:0 auto; padding:10px}
    .docHeader{display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:10px}
    .mainTitle{font-size:18px; font-weight:900; text-align:center; margin:10px 0; text-transform:uppercase}
    .metaBox{border:1.5px solid #000; padding:8px; display:flex; gap:20px; background:#f9fafb; font-size:12px; margin-bottom:10px}
    .tableWrap{border:1.5px solid #000; border-bottom:none; width:100%}
    .hRow{display:flex; background:#e5e7eb; border-bottom:1.5px solid #000; align-items:stretch}
    .hCell{font-weight:800; font-size:10px; text-align:center; border-right:1px solid #000; text-transform:uppercase; display:flex; align-items:center; justify-content:center}
    .sigSection{display:flex; gap:12px; margin-top:15px}
    .sigBox{flex:1; border:1px solid #000; padding:10px; background:#fff}
  </style></head><body>

    <div class="container">
      <div class="docHeader">
        <div style="display:flex; align-items:center; gap:12px">
          ${logo ? `<img src="${logo}" style="width:56px; height:56px; object-fit:contain"/>` : ''}
          <div>
            <div style="font-weight:900; font-size:16px; color:#185a9d">BRAVO! FOOD SAFETY INSPECTIONS</div>
            <div style="font-size:11px; font-weight:700; color:#43cea2">Bravo Brands Central</div>
          </div>
        </div>
        <div style="text-align:right; font-size:10px; font-weight:700">
          <div>Doc No: ${escapeHtml(meta.docNo || 'BBN-SHEQ-P-XX')}</div>
          <div>Issue Date: ${escapeHtml(p.date || '')}</div>
          <div>Page 1 of 1</div>
        </div>
      </div>

      <div class="mainTitle">${escapeHtml(p.title || 'COLD ROOM & FREEZER ROOM CLEANING CHECKLIST')}</div>

      <div class="metaBox">
        <div style="flex:2"><strong>LOCATION:</strong> ${escapeHtml(meta.location || '')}</div>
        <div><strong>WEEK:</strong> ${escapeHtml(meta.week || '')}</div>
        <div><strong>MONTH:</strong> ${escapeHtml(meta.month || '')}</div>
        <div><strong>YEAR:</strong> ${escapeHtml(meta.year || '')}</div>
      </div>

      <div class="tableWrap">
        <div class="hRow">
          <div class="hCell" style="width:${COL.AREA}px">Area to be cleaned</div>
          <div class="hCell" style="width:${COL.FREQ}px">Frequency</div>
          ${WEEK_DAYS.map(d => `
            <div style="width:${COL.DAY_GROUP}px; display:flex; flex-direction:column; border-right:1px solid #000">
              <div style="padding:4px; border-bottom:1px solid #000; font-weight:900; background:#d1d5db; text-align:center; font-size:11px">${d}</div>
              <div style="display:flex; flex:1">
                <div style="width:${COL.CHECK}px; border-right:1px solid #000; font-size:8px; display:flex; align-items:center; justify-content:center">✓</div>
                <div style="flex:1; font-size:8px; display:flex; align-items:center; justify-content:center">Cleaned By</div>
              </div>
            </div>`).join('')}
        </div>
        ${rowsHtml}
      </div>

      <div class="sigSection">
        <div class="sigBox">
          <div style="font-size:10px; font-weight:800; color:#555">VERIFIED BY: HSEQ MANAGER</div>
          <div style="min-height:45px; display:flex; align-items:center">
            ${renderSignatureThumb(meta.hseqSign || meta.hseqManager)}
          </div>
        </div>
        <div class="sigBox">
          <div style="font-size:10px; font-weight:800; color:#555">APPROVED BY:</div>
          <div style="min-height:45px; display:flex; align-items:center">
            ${renderSignatureThumb(meta.approvedBySign || meta.approvedBy)}
          </div>
        </div>
      </div>
    </div>

</body></html>`;
};
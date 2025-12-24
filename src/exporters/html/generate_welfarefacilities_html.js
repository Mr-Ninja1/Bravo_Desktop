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

const getLogoDataUri = (p) => {
  if (p.assets && p.assets.logoDataUri) return p.assets.logoDataUri;
  const candidates = [
    path.join(process.cwd(), 'renderer', 'assets', 'logo.jpeg'),
    path.join(process.cwd(), 'assets', 'logo.jpeg'),
    'C:\\Users\\sikal\\Desktop\\Bravo_Desktop\\assets\\logo.jpeg'
  ];
  for (const c of candidates) {
    try { if (fs.existsSync(c)) { 
      const b = fs.readFileSync(c); 
      return `data:image/jpeg;base64,${b.toString('base64')}`; 
    } } catch (e) {}
  }
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const metadata = p.metadata || {};
  const WEEK_DAYS = ['Sun','Mon','Tue','Wed','Thurs','Fri','Sat'];
  const items = Array.isArray(p.formData) ? p.formData : (p.formData && p.formData.items) || [];

  // Professional A4 Landscape Calibration (~1060px)
  const COL = {
    NAME: 180,
    FREQ: 100,
    DAY_BOX: 110, // Total per day (7 * 110 = 770)
    CHECK: 30,
    SIGN: 80
  };

  const grouped = items.reduce((acc, it) => { 
    const area = it.area || 'General Facilities'; 
    if (!acc[area]) acc[area]=[]; 
    acc[area].push(it); 
    return acc; 
  }, {});

  const logo = getLogoDataUri(p);

  const sigHtml = (val, w=200, h=45) => { 
    const uri = resolveSignatureUri(val); 
    if (uri) return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; display:block; object-fit:contain; mix-blend-mode: multiply;"/>`; 
    return `<div style="border-bottom: 1px solid #ccc; width: 140px; height: 15px; margin-top: 10px;"></div>`;
  };

  const sectionsHtml = Object.keys(grouped).map(area => {
    const rows = grouped[area].map(item => {
      const checks = WEEK_DAYS.map(d => {
        const ch = item.checks && item.checks[d] ? item.checks[d] : {};
        return `
          <div style="display:flex; width:${COL.DAY_BOX}px; border-right:1px solid #000; align-items:stretch">
            <div style="width:${COL.CHECK}px; border-right:1px solid #000; text-align:center; padding:4px; font-weight:900; display:flex; align-items:center; justify-content:center">${ch.checked ? '✓' : ''}</div>
            <div style="flex:1; padding:4px; font-size:9px; text-align:center; display:flex; align-items:center; justify-content:center; overflow:hidden">${escapeHtml(ch.cleanedBy || '')}</div>
          </div>`;
      }).join('');

      return `
        <div style="display:flex; border-bottom:1px solid #000; min-height:36px; align-items:stretch; background:#fff">
          <div style="width:${COL.NAME}px; padding:6px; border-right:1px solid #000; font-size:11px; display:flex; align-items:center">${escapeHtml(item.name || '')}</div>
          <div style="width:${COL.FREQ}px; padding:6px; border-right:1px solid #000; text-align:center; font-size:11px; display:flex; align-items:center; justify-content:center">${escapeHtml(item.frequency || '')}</div>
          ${checks}
        </div>`;
    }).join('\n');

    return `
      <div style="background:#f3f4f6; border-bottom:1px solid #000; padding:6px 10px; font-weight:800; font-size:12px; color:#185a9d; text-transform:uppercase">${escapeHtml(area)}</div>
      ${rows}`;
  }).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8">
  <style>
    @page{size:A4 landscape; margin:6mm}
    *{box-sizing: border-box;}
    body{font-family:'Inter', Arial, sans-serif; margin:0; padding:0; color:#111}
    .container{width:1060px; margin:0 auto; padding:10px}
    .brandHeader{display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:10px}
    .mainTitle{text-align:center; font-weight:900; font-size:18px; margin:10px 0; text-transform:uppercase}
    .metaBox{border:1.5px solid #000; padding:8px; display:flex; gap:20px; background:#f9fafb; font-size:12px; margin-bottom:10px}
    .tableGrid{border:1.5px solid #000; border-bottom:none; width:100%}
    .hRow{display:flex; background:#e5e7eb; border-bottom:1.5px solid #000; align-items:stretch}
    .hCell{font-weight:800; font-size:10px; text-align:center; border-right:1px solid #000; text-transform:uppercase; display:flex; align-items:center; justify-content:center}
    .footerSection{margin-top:15px; display:flex; gap:15px}
    .sigCard{flex:1; border:1px solid #000; padding:10px; background:#fff}
  </style>
</head><body>
  <div class="container">
    <div class="brandHeader">
      <div style="display:flex; align-items:center; gap:12px">
        ${logo ? `<img style="width:56px; height:56px; object-fit:contain" src="${logo}"/>` : ''}
        <div>
          <div style="font-weight:900; font-size:16px; color:#185a9d">BRAVO! FOOD SAFETY</div>
          <div style="font-size:11px; font-weight:700; color:#43cea2">Welfare Facilities Management</div>
        </div>
      </div>
      <div style="text-align:right; font-size:10px; font-weight:700">
        <div>Doc Ref: ${escapeHtml(metadata.docRef || 'BBN-SHEQ-W-01')}</div>
        <div>Issue Date: ${escapeHtml(metadata.issueDate || '')}</div>
        <div>Page 1 of 1</div>
      </div>
    </div>

    <div class="mainTitle">Welfare Facilities Cleaning Checklist</div>

    <div class="metaBox">
      <div style="flex:2"><strong>LOCATION:</strong> ${escapeHtml(metadata.location || '')}</div>
      <div><strong>WEEK:</strong> ${escapeHtml(metadata.week || '')}</div>
      <div><strong>MONTH:</strong> ${escapeHtml(metadata.month || '')}</div>
      <div><strong>YEAR:</strong> ${escapeHtml(metadata.year || '')}</div>
    </div>

    <div class="tableGrid">
      <div class="hRow">
        <div class="hCell" style="width:${COL.NAME}px">Area / Item</div>
        <div class="hCell" style="width:${COL.FREQ}px">Frequency</div>
        ${WEEK_DAYS.map(d => `
          <div style="width:${COL.DAY_BOX}px; display:flex; flex-direction:column; border-right:1px solid #000">
            <div style="padding:4px; border-bottom:1px solid #000; font-weight:900; background:#d1d5db; text-align:center; font-size:10px">${d}</div>
            <div style="display:flex; flex:1">
              <div style="width:${COL.CHECK}px; border-right:1px solid #000; font-size:8px; display:flex; align-items:center; justify-content:center">✓</div>
              <div style="flex:1; font-size:8px; display:flex; align-items:center; justify-content:center">Cleaned By</div>
            </div>
          </div>`).join('')}
      </div>
      ${sectionsHtml}
    </div>

    <div class="footerSection">
      <div class="sigCard">
        <div style="font-size:10px; font-weight:800; color:#555">VERIFIED BY: HSEQ MANAGER</div>
        ${sigHtml(metadata.hseqManagerSign || metadata.hseqManager)}
      </div>
      <div class="sigCard" style="flex:0.5; background:#f9fafb; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; text-align:center; color:#666">
        Verified records must be filed for 3 years.
      </div>
    </div>
  </div>
</body></html>`;
};
const fs = require('fs');
const path = require('path');

const escapeHtml = (s) => String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
  const s = String(val || '').trim();
  if (!s) return null;
  if (s.startsWith('data:')) return s;
  const compact = s.replace(/\s+/g, '');
  if (compact.length > 100) return `data:image/png;base64,${compact}`;
  return null;
};

const renderSignatureCell = (val, w = 90, h = 45) => {
  const uri = resolveSignatureUri(val);
  if (!uri) return `<div style="border-bottom: 1px dotted #ccc; width: 80%; height: 15px; margin: 10px auto;"></div>`;
  return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block; margin: 0 auto; object-fit:contain; mix-blend-mode: multiply;"/>`;
};

const getLogoDataUri = (p) => {
  if (!p) return null;
  if (p.assets && p.assets.logoDataUri) return p.assets.logoDataUri;
  const candidates = [
    path.join(process.cwd(), 'renderer', 'assets', 'logo.jpeg'),
    path.join(process.cwd(), 'assets', 'logo.jpeg'),
    path.join(process.cwd(), 'assets', 'logo.jpeg')
  ];
  for (const c of candidates) {
    try { if (fs.existsSync(c)) { const b = fs.readFileSync(c); const mime = path.extname(c).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg'; return `data:${mime};base64,${b.toString('base64')}`; } } catch (e) {}
  }
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const metadata = p.metadata || {};
  const formData = Array.isArray(p.formData) ? p.formData : (Array.isArray(p) ? p : []);

  const WIDTHS = {
    INDEX: 40,
    FOOD_ITEM: 240,
    TIME: 65,
    TEMP: 65,
    SIGN: 85,
    STAFF_NAME: 140
  };

  const logoData = getLogoDataUri(p);
  const rows = formData.length ? formData : Array.from({ length: 15 }).map((_, i) => ({ index: i + 1 }));

  const rowsHtml = rows.map((r, ri) => {
    const idx = r.index || ri + 1;
    return `
      <tr>
        <td style="text-align:center; background:#f9fafb;">${idx}</td>
        <td style="text-align:left; font-weight:600;">${escapeHtml(r.foodItem || '')}</td>
        <td style="text-align:center;">${escapeHtml(r.time1 || '')}</td>
        <td style="text-align:center;">${r.temp1 ? escapeHtml(r.temp1 + ' °C') : ''}</td>
        <td style="text-align:center;">${renderSignatureCell(r.sign1)}</td>
        <td style="text-align:center;">${escapeHtml(r.time2 || '')}</td>
        <td style="text-align:center;">${r.temp2 ? escapeHtml(r.temp2 + ' °C') : ''}</td>
        <td style="text-align:center;">${renderSignatureCell(r.sign2)}</td>
        <td style="text-align:center;">${escapeHtml(r.time3 || '')}</td>
        <td style="text-align:center;">${r.temp3 ? escapeHtml(r.temp3 + ' °C') : ''}</td>
        <td style="text-align:center;">${renderSignatureCell(r.sign3)}</td>
        <td style="text-align:left;">${escapeHtml(r.staffName || '')}</td>
      </tr>`;
  }).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:8mm}
    *{box-sizing:border-box}
    body{font-family:'Inter', Arial, sans-serif; margin:0; color:#111}
    .wrap{width:1060px; margin:0 auto; padding:10px}
    .header{display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #185a9d; padding-bottom:10px; margin-bottom:10px}
    .logo{height:55px; width:auto; object-fit:contain}
    .mainTitle{font-size:18px; font-weight:900; text-align:center; color:#185a9d; margin:10px 0; text-transform:uppercase}
    .subjectBand{display:flex; border:1px solid #000; background:#f3f4f6; margin-bottom:10px}
    .subjectBand > div{flex:1; padding:8px; border-right:1px solid #000; font-size:11px}
    .subjectBand > div:last-child{border-right:none}
    
    table{width:100%; border-collapse:collapse; border:2px solid #000; table-layout:fixed}
    
    /* Header rows styling - moved to standard td to prevent repeating */
    .table-header-row td {
        background:#e5e7eb; 
        padding:6px; 
        border:1px solid #000; 
        font-weight:800; 
        font-size:10px; 
        text-align:center;
        text-transform:uppercase;
    }

    td{padding:4px; border:1px solid #000; font-size:11px; vertical-align:middle; height:45px; page-break-inside: avoid;}
    tr { page-break-inside: avoid; }

    .footerSection{margin-top:15px; display:flex; gap:15px; page-break-inside: avoid;}
    .sigCard{flex:1; border:1px solid #000; padding:10px; background:#fff}
    .actionBox{width:100%; border:1px solid #000; margin-top:15px; padding:10px; background:#fff; page-break-inside: avoid;}
  </style></head><body>

  <div class="wrap">
    <div class="header">
      <div style="display:flex; align-items:center; gap:15px">
        ${logoData ? `<img src="${logoData}" class="logo"/>` : `<div style="width:50px;height:50px;background:#eee"></div>`}
        <div>
          <div style="font-weight:900; font-size:16px; color:#185a9d">BRAVO BRANDS LIMITED</div>
          <div style="font-size:10px; font-weight:700; color:#43cea2">Food Safety Management System</div>
        </div>
      </div>
      <div style="text-align:right; font-size:11px; font-weight:800">
        <div>Doc ID: BBN-THW-TMP-01</div>
        <div>Issue Date: ${escapeHtml(metadata.issueDate || metadata.date || '')}</div>
      </div>
    </div>

    <div class="mainTitle">Thawing Temperature Log</div>

    <div class="subjectBand">
      <div><strong>COMPILED BY:</strong> ${escapeHtml(metadata.compiledBy || '')}</div>
      <div><strong>APPROVED BY:</strong> ${escapeHtml(metadata.approvedBy || '')}</div>
      <div><strong>SITE/UNIT:</strong> ${escapeHtml(metadata.site || '')}</div>
    </div>

    <table>
      <tbody>
        <tr class="table-header-row">
          <td style="width:${WIDTHS.INDEX}px" rowspan="2">#</td>
          <td style="width:${WIDTHS.FOOD_ITEM}px" rowspan="2">FOOD ITEM</td>
          <td colspan="3">1ST RECORD</td>
          <td colspan="3">2ND RECORD</td>
          <td colspan="3">3RD RECORD</td>
          <td style="width:${WIDTHS.STAFF_NAME}px" rowspan="2">STAFF NAME</td>
        </tr>
        <tr class="table-header-row">
          <td style="width:${WIDTHS.TIME}px">TIME</td>
          <td style="width:${WIDTHS.TEMP}px">TEMP</td>
          <td style="width:${WIDTHS.SIGN}px">SIGN</td>
          <td style="width:${WIDTHS.TIME}px">TIME</td>
          <td style="width:${WIDTHS.TEMP}px">TEMP</td>
          <td style="width:${WIDTHS.SIGN}px">SIGN</td>
          <td style="width:${WIDTHS.TIME}px">TIME</td>
          <td style="width:${WIDTHS.TEMP}px">TEMP</td>
          <td style="width:${WIDTHS.SIGN}px">SIGN</td>
        </tr>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="actionBox">
      <strong style="font-size:10px; color:#185a9d; text-transform:uppercase">Corrective Actions Taken:</strong>
      <div style="margin-top:5px; font-size:11px; min-height:30px">${escapeHtml(metadata.correctiveAction || 'No corrective action recorded.')}</div>
    </div>

    <div class="footerSection">
      <div class="sigCard">
        <div style="font-weight:800; font-size:10px; color:#185a9d">CHEF SIGNATURE:</div>
        <div style="margin-top:5px">${renderSignatureCell(metadata.chefSign || metadata.chefSignature, 200, 45)}</div>
      </div>
      <div class="sigCard">
        <div style="font-weight:800; font-size:10px; color:#185a9d">HSEQ MANAGER:</div>
        <div style="margin-top:5px">${renderSignatureCell(metadata.hseqManagerSignature || metadata.hseqSign, 200, 45)}</div>
      </div>
      <div class="sigCard">
        <div style="font-weight:800; font-size:10px; color:#185a9d">COMPLEX MANAGER:</div>
        <div style="margin-top:5px">${renderSignatureCell(metadata.complexManagerSignature, 200, 45)}</div>
      </div>
    </div>
  </div>

</body></html>`;
};
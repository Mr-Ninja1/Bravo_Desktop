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
  const s = String(val || '');
  if (s.startsWith('data:')) return s;
  const compact = s.replace(/\s+/g, '');
  if (compact.length > 100) return `data:image/png;base64,${compact}`;
  return null;
};

const renderSig = (v, w = 150, h = 40) => {
  const uri = resolveSignatureUri(v);
  if (!uri) return `<div style="border-bottom: 1px dotted #ccc; width: 100px; height: 15px; margin: 10px auto;"></div>`;
  return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block; margin: 0 auto; object-fit:contain; mix-blend-mode: multiply;"/>`;
};

const getLogoDataUri = (p) => {
  if (!p) return null;
  if (p.assets && p.assets.logoDataUri) return p.assets.logoDataUri;
  const candidates = [
    path.join(process.cwd(), 'renderer', 'assets', 'logo.jpeg'),
    path.join(process.cwd(), 'assets', 'logo.jpeg'),
    path.join(process.cwd(), 'assets', 'logo.png')
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) {
        const b = fs.readFileSync(c);
        const mime = path.extname(c).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
        return `data:${mime};base64,${b.toString('base64')}`;
      }
    } catch (e) {}
  }
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const meta = p.metadata || {};

  const issueDate = meta.issueDate || p.issueDate || '';
  const compiledBy = p.compiledBy || meta.compiledBy || '';
  const approvedBy = p.approvedBy || meta.approvedBy || '';

  const site = meta.site || p.site || '';
  const weekStarting = meta.weekStarting || p.weekStarting || '';
  const month = meta.month || p.month || '';
  const year = meta.year || p.year || '';

  const rows = Array.isArray(p.formData) ? p.formData : [];
  const logoData = getLogoDataUri(p);

  // Calibration for A4 Landscape (Approx 1050px-1060px)
  const COL = {
    DATE: 90,
    NAME: 280,
    BATCH: 110,
    PROD: 110,
    EXP: 110,
    SIG_HEAD: 175,
    SIG_HSEQ: 175
  };

  const rowsHtml = (rows.length ? rows : Array.from({length: 12}).map(()=>({}))).map(r => `
    <tr style="min-height:45px">
      <td style="padding:6px; border:1px solid #000; width:${COL.DATE}px">${escapeHtml(r.date || '')}</td>
      <td style="padding:6px; border:1px solid #000; width:${COL.NAME}px; text-align:left; font-weight:600">${escapeHtml(r.productName || '')}</td>
      <td style="padding:6px; border:1px solid #000; width:${COL.BATCH}px">${escapeHtml(r.batchNumber || '')}</td>
      <td style="padding:6px; border:1px solid #000; width:${COL.PROD}px">${escapeHtml(r.productionDate || '')}</td>
      <td style="padding:6px; border:1px solid #000; width:${COL.EXP}px">${escapeHtml(r.expiryDate || '')}</td>
      <td style="padding:4px; border:1px solid #000; width:${COL.SIG_HEAD}px">${renderSig(r.signatureHead || r.headSign)}</td>
      <td style="padding:4px; border:1px solid #000; width:${COL.SIG_HSEQ}px">${renderSig(r.approvedHSEQ || r.hseqSign)}</td>
    </tr>
  `).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:8mm}
    *{box-sizing:border-box}
    body{font-family:'Inter', Arial, sans-serif; margin:0; padding:0; color:#111}
    .container{width:1050px; margin:0 auto; padding:10px}
    .headerRow{display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #185a9d; padding-bottom:8px; margin-bottom:10px}
    .logo{height:55px; width:auto; object-fit:contain}
    .logoText{font-weight:900; font-size:18px; color:#185a9d}
    .subject{border:1px solid #000; padding:8px; background:#f3f4f6; text-align:center; font-weight:900; font-size:16px; margin-bottom:12px; text-transform:uppercase}
    .metaBar{display:flex; border:1px solid #000; margin-bottom:12px; background:#f9fafb}
    .metaItem{flex:1; padding:8px; border-right:1px solid #000; font-size:11px}
    .metaItem:last-child{border-right:none}
    table{width:100%; border-collapse:collapse; border:2px solid #000; table-layout:fixed}
    th{background:#e5e7eb; padding:8px; border:1px solid #000; font-weight:800; font-size:11px; text-align:center; text-transform:uppercase}
    td{padding:6px; border:1px solid #000; font-size:11px; text-align:center; vertical-align:middle}
    .footer{display:flex; gap:15px; margin-top:15px}
    .sigCard{flex:1; border:1px solid #000; padding:10px; background:#fff}
  </style></head><body>

  <div class="container">
    <div class="headerRow">
      <div style="display:flex; align-items:center; gap:15px">
        ${logoData ? `<img src="${logoData}" class="logo"/>` : `<div style="width:50px;height:50px;background:#eee;display:flex;align-items:center;justify-content:center;color:#999">LOGO</div>`}
        <div>
          <div class="logoText">BRAVO BRANDS LIMITED</div>
          <div style="font-size:10px; font-weight:700; color:#43cea2">Food Safety Management System</div>
        </div>
      </div>
      <div style="text-align:right; font-size:11px; font-weight:800">
        <div>Doc ID: BBN-PROD-REL-01</div>
        <div>Issue Date: ${escapeHtml(issueDate)}</div>
      </div>
    </div>

    <div class="subject">PRODUCT RELEASE FORM</div>

    <div class="metaBar">
      <div class="metaItem"><strong>SITE NAME:</strong> ${escapeHtml(site)}</div>
      <div class="metaItem"><strong>WEEK STARTING:</strong> ${escapeHtml(weekStarting)}</div>
      <div class="metaItem"><strong>MONTH / YEAR:</strong> ${escapeHtml(month)} ${escapeHtml(year)}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:${COL.DATE}px">Date</th>
          <th style="width:${COL.NAME}px; text-align:left">Product Name</th>
          <th style="width:${COL.BATCH}px">Batch No</th>
          <th style="width:${COL.PROD}px">Production Date</th>
          <th style="width:${COL.EXP}px">Expiry Date</th>
          <th style="width:${COL.SIG_HEAD}px">Signature (Head of Section)</th>
          <th style="width:${COL.SIG_HSEQ}px">Approved (HSEQ Manager)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="footer">
      <div class="sigCard">
        <div style="font-size:10px; font-weight:800; color:#185a9d; margin-bottom:5px">COMPILED BY:</div>
        <div style="font-size:11px">${escapeHtml(compiledBy)}</div>
        ${renderSig(meta.compiledBySign || p.compiledBySign)}
      </div>
      <div class="sigCard">
        <div style="font-size:10px; font-weight:800; color:#185a9d; margin-bottom:5px">APPROVED BY:</div>
        <div style="font-size:11px">${escapeHtml(approvedBy)}</div>
        ${renderSig(meta.approvedBySign || p.approvedBySign)}
      </div>
      <div class="sigCard" style="background:none; border:none; flex:0.5; font-size:9px; font-style:italic; color:#666; display:flex; align-items:flex-end">
        * Release confirms HSEQ standards have been verified for the specified batch.
      </div>
    </div>
  </div>

</body></html>`;
};
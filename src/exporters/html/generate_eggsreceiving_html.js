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

const renderSig = (v, w = 180, h = 45) => {
  const uri = resolveSignatureUri(v);
  if (!uri) return `<div style="border-bottom: 1px dotted #ccc; width: 140px; height: 15px; margin-top: 10px;"></div>`;
  return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block; object-fit:contain; mix-blend-mode: multiply;"/>`;
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
  const logoData = getLogoDataUri(p);
  const rows = Array.isArray(p.formData) ? p.formData : [];

  // Width Calibration for Landscape (~1060px)
  const COL = {
    CAT: 300,
    SUPP: 180,
    CLEAN: 90,
    STATE: 140,
    EXP: 120,
    REM: 300
  };

  const rowsHtml = (rows.length ? rows : Array.from({length: 8}).map(()=>({}))).map(item => `
    <tr style="min-height:40px">
      <td style="padding:8px; border:1px solid #000; width:${COL.CAT}px; text-align:left; font-weight:600">${escapeHtml(item.categoryOfEggs || '')}</td>
      <td style="padding:8px; border:1px solid #000; width:${COL.SUPP}px; text-align:left">${escapeHtml(item.supplier || '')}</td>
      <td style="padding:8px; border:1px solid #000; width:${COL.CLEAN}px; text-align:center; font-size:16px">${item.clean ? '✓' : ''}</td>
      <td style="padding:8px; border:1px solid #000; width:${COL.STATE}px; text-align:left">${escapeHtml(item.stateOfProduct || '')}</td>
      <td style="padding:8px; border:1px solid #000; width:${COL.EXP}px; text-align:center">${escapeHtml(item.expiryDate || '')}</td>
      <td style="padding:8px; border:1px solid #000; width:${COL.REM}px; text-align:left; font-size:10px">${escapeHtml(item.remarks || '')}</td>
    </tr>
  `).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:8mm}
    *{box-sizing:border-box}
    body{font-family:'Segoe UI', Arial, sans-serif; margin:0; color:#111}
    .wrap{width:1060px; margin:0 auto; padding:10px}
    .header{display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #185a9d; padding-bottom:10px; margin-bottom:10px}
    .logo{height:55px; width:auto; object-fit:contain}
    .title{font-size:20px; font-weight:900; text-align:center; color:#185a9d; text-transform:uppercase; margin-bottom:15px; letter-spacing:1px}
    .meta{display:flex; gap:15px; margin-bottom:12px; border:1px solid #000; background:#f9fafb}
    .meta-item{flex:1; padding:10px; border-right:1px solid #000; font-size:12px}
    .meta-item:last-child{border-right:none}
    table{width:100%; border-collapse:collapse; border:2px solid #000; table-layout:fixed}
    th{background:#e5e7eb; padding:10px; border:1px solid #000; font-weight:800; font-size:11px; text-align:center; text-transform:uppercase}
    td{padding:8px; border:1px solid #000; font-size:11px; vertical-align:middle}
    .footer{margin-top:20px; display:flex; gap:15px}
    .sigBox{flex:1; border:1px solid #000; padding:12px; background:#fff}
    .sigLabel{font-weight:800; color:#185a9d; font-size:10px; text-transform:uppercase; margin-bottom:8px}
  </style></head><body>

  <div class="wrap">
    <div class="header">
      <div style="display:flex; align-items:center; gap:15px">
        ${logoData ? `<img src="${logoData}" class="logo"/>` : `<div style="width:80px;height:45px;background:#eee"></div>`}
        <div>
          <div style="font-weight:900; font-size:18px; color:#185a9d">BRAVO BRANDS LIMITED</div>
          <div style="font-size:11px; font-weight:700; color:#43cea2">Food Safety Management System</div>
        </div>
      </div>
      <div style="text-align:right; font-size:11px; font-weight:800">
        <div>Doc ID: BBN-EGG-REC-01</div>
        <div>Issue Date: ${escapeHtml(meta.issueDate || '')}</div>
      </div>
    </div>

    <div class="title">Eggs Receiving Checklist</div>

    <div style="border:1px solid #000; padding:8px; margin-bottom:8px; background:#fff">
      <div style="display:flex; gap:8px; margin-bottom:6px">
        <div style="flex:1; border-right:1px solid #000; padding-right:8px"><strong>Compiled By:</strong><div style="margin-top:6px">${renderSig(meta.compiledBySign || p.compiledBySign,200,60) || escapeHtml(meta.compiledBy || 'Michael')}</div></div>
        <div style="flex:1; padding-left:8px"><strong>Approved By:</strong><div style="margin-top:6px">${renderSig(meta.approvedBySign || p.approvedBySign,200,60) || escapeHtml(meta.approvedBy || 'Hassani Ali')}</div></div>
      </div>
      <div style="margin-top:6px"><strong>Specification:</strong>
        <div style="margin-top:6px; font-size:13px">Eggs must be fresh, clean, without bad smell, not broken and no signs of pests; the tray must be of plastic; 10 randomly selected eggs shall be able to sink when placed in fresh water and label shall be legible and correct.</div>
      </div>
    </div>

    <div class="meta">
      <div class="meta-item"><strong>Delivery Date:</strong> ${escapeHtml(meta.dateOfDelivery || meta.date || '')}</div>
      <div class="meta-item"><strong>Time of Delivery:</strong> ${escapeHtml(meta.timeOfDelivery || '')}</div>
      <div class="meta-item"><strong>Received By:</strong> ${escapeHtml(meta.receivedBy || '')}</div>
      <div class="meta-item"><strong>Invoice No:</strong> ${escapeHtml(meta.invoiceNo || '')}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th rowspan="2" style="width:${COL.CAT}px">Category of Eggs (Large, Medium, Small or mixed sizes)</th>
          <th rowspan="2" style="width:${COL.SUPP}px">Supplier</th>
          <th colspan="1">Delivery Vehicle</th>
          <th colspan="3">Product</th>
        </tr>
        <tr>
          <th style="width:${COL.CLEAN}px">Clean</th>
          <th style="width:${COL.STATE}px">State of Product</th>
          <th style="width:${COL.EXP}px">Expiry Date</th>
          <th style="width:${COL.REM}px">Remarks</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="footer">
      <div class="sigBox">
        <div class="sigLabel">Verified By:</div>
        <div style="font-size:11px; margin-bottom:5px">${escapeHtml(meta.verifiedBy || '')}</div>
        ${renderSig(meta.verifiedBySign || p.verifiedBySign)}
      </div>
      <div class="sigBox">
        <div class="sigLabel">HSEQ Manager:</div>
        <div style="font-size:11px; margin-bottom:5px">${escapeHtml(meta.hseqManager || '')}</div>
        ${renderSig(meta.hseqManagerSign || p.hseqManagerSign)}
      </div>
      <div class="sigBox">
        <div class="sigLabel">Delivery Signature (Supplier):</div>
        <div style="font-size:11px; margin-bottom:5px">${escapeHtml(meta.supplierName || '')}</div>
        ${renderSig(meta.signature || p.signature,240,80)}
      </div>
    </div>
  </div>

</body></html>`;
};
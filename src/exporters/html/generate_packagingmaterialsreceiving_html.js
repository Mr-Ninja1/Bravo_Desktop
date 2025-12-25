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

const renderSig = (v, w = 220, h = 80) => {
  const uri = resolveSignatureUri(v);
  if (!uri) return '';
  return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block; object-fit:contain; mix-blend-mode: multiply;"/>`;
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

  const logoData = getLogoDataUri(p);

  const rows = Array.isArray(p.formData) ? p.formData : [];

  const rowsHtml = (rows.length ? rows : Array.from({length:8}).map(()=>({}))).map(item => `
    <tr>
      <td style="padding:6px; border:1px solid #000; width:260px; text-align:left">${escapeHtml(item.nameOfProduct || '')}</td>
      <td style="padding:6px; border:1px solid #000; width:180px; text-align:left">${escapeHtml(item.supplier || '')}</td>
      <td style="padding:6px; border:1px solid #000; width:90px; text-align:center">${item.clean ? '✓' : ''}</td>
      <td style="padding:6px; border:1px solid #000; width:90px; text-align:left">${escapeHtml(item.temp || '')}</td>
      <td style="padding:6px; border:1px solid #000; width:140px; text-align:left">${escapeHtml(item.stateOfProduct || '')}</td>
      <td style="padding:6px; border:1px solid #000; width:120px; text-align:left">${escapeHtml(item.expiryDate || '')}</td>
      <td style="padding:6px; border:1px solid #000; width:300px; text-align:left">${escapeHtml(item.remarks || '')}</td>
    </tr>
  `).join('') || '<tr><td colspan="7" style="padding:8px; border:1px solid #000; text-align:center">No entries</td></tr>';

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4; margin:8mm}
    *{box-sizing:border-box}
    body{font-family:Arial, Helvetica, sans-serif; margin:0; color:#111}
    .wrap{width:1120px; margin:0 auto; padding:10px}
    .header{display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:8px}
    .logo{height:48px; width:auto; object-fit:contain}
    .title{font-size:18px; font-weight:900; text-align:center; color:#185a9d}
    .meta{display:flex; gap:12px; margin-bottom:8px; padding:8px; border:1px solid #000; background:#f9fafb; font-weight:700}
    table{width:100%; border-collapse:collapse; border:1px solid #000}
    th{background:#eee; padding:8px; border-right:1px solid #000; font-weight:700}
    td{padding:6px; border-right:1px solid #000}
    .footer{margin-top:12px; display:flex; gap:12px}
    .sigBox{flex:1; border:1px solid #000; padding:8px}
  </style></head><body>

  <div class="wrap">
    <div class="header">
      <div style="display:flex; align-items:center; gap:12px">
        ${logoData ? `<img src="${logoData}" class="logo"/>` : `<div style="width:80px;height:48px;background:#eee;display:flex;align-items:center;justify-content:center;color:#999">No Logo</div>`}
        <div style="font-weight:800;color:#185a9d">BRAVO BRANDS LIMITED</div>
      </div>
      <div style="text-align:right; font-size:12px">Issue Date: ${escapeHtml(meta.issueDate || '')}</div>
    </div>

    <div class="title">Packaging Materials Receiving Checklist</div>

    <div style="border:1px solid #000; padding:8px; margin-bottom:8px; background:#fff">
      <div style="display:flex; gap:8px; margin-bottom:6px">
        <div style="flex:1; border-right:1px solid #000; padding-right:8px"><strong>Compiled By:</strong><div style="margin-top:6px">${renderSig(meta.compiledBySign || p.compiledBySign,200,60) || escapeHtml(meta.compiledBy || 'QA Team')}</div></div>
        <div style="flex:1; padding-left:8px"><strong>Approved By:</strong><div style="margin-top:6px">${renderSig(meta.approvedBySign || p.approvedBySign,200,60) || escapeHtml(meta.approvedBy || 'Hassani Ali')}</div></div>
      </div>
      <div style="margin-top:6px"><strong>Specification:</strong>
        <div style="margin-top:6px; font-size:13px">${escapeHtml(p.specification || 'Packaging materials shall be clean, dry, intact with no tears or damage; labels/printing shall be correct and match the order; seals shall be intact and no contamination observed.')}</div>
      </div>
    </div>

    <div style="display:flex; gap:8px; margin-bottom:8px">
      <div style="flex:1; border:1px solid #000; padding:8px">Date of Delivery:<div style="font-weight:700">${escapeHtml(meta.dateOfDelivery || meta.date || '')}</div></div>
      <div style="flex:1; border:1px solid #000; padding:8px">Received By:<div style="font-weight:700">${escapeHtml(meta.receivedBy || '')}</div></div>
      <div style="flex:1; border:1px solid #000; padding:8px">Complex Manager:<div style="font-weight:700">${escapeHtml(meta.complexManager || '')}</div></div>
    </div>
    <div style="display:flex; gap:8px; margin-bottom:8px">
      <div style="flex:1; border:1px solid #000; padding:8px">Time of Delivery:<div style="font-weight:700">${escapeHtml(meta.timeOfDelivery || '')}</div></div>
      <div style="flex:1; border:1px solid #000; padding:8px">Invoice No:<div style="font-weight:700">${escapeHtml(meta.invoiceNo || '')}</div></div>
      <div style="flex:1; border:1px solid #000; padding:8px">Drivers Name:<div style="font-weight:700">${escapeHtml(meta.driversName || '')}</div></div>
    </div>
    <div style="display:flex; gap:8px; margin-bottom:8px">
      <div style="flex:1; border:1px solid #000; padding:8px">Vehicle Reg No:<div style="font-weight:700">${escapeHtml(meta.vehicleRegNo || '')}</div></div>
      <div style="flex:2; border:1px solid #000; padding:8px">Signature:<div style="margin-top:6px">${renderSig(meta.signature || p.signature,240,80) || escapeHtml(meta.signature || '')}</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th rowspan="2" style="width:260px">Name of Product</th>
          <th rowspan="2" style="width:180px">Supplier</th>
          <th colspan="2">Delivery Vehicle</th>
          <th colspan="3">Product</th>
        </tr>
        <tr>
          <th style="width:90px">Clean</th>
          <th style="width:90px">Temp</th>
          <th style="width:140px">State of Product</th>
          <th style="width:120px">Expiry Date</th>
          <th style="width:300px">Remarks</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="footer">
      <div class="sigBox"><strong>Compiled By</strong><div style="margin-top:6px">${renderSig(meta.compiledBySign || p.compiledBySign) || escapeHtml(meta.compiledBy || 'QA Team')}</div></div>
      <div class="sigBox"><strong>Approved By</strong><div style="margin-top:6px">${renderSig(meta.approvedBySign || p.approvedBySign) || escapeHtml(meta.approvedBy || 'Hassani Ali')}</div></div>
      <div class="sigBox"><strong>Verified By</strong><div style="margin-top:6px">${renderSig(meta.verifiedBySign || p.verifiedBySign) || escapeHtml(meta.verifiedBy || '')}</div></div>
    </div>
  </div>

</body></html>`;
};

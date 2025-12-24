const fs = require('fs');
const path = require('path');

const escapeHtml = (s) => String(s === null || s === undefined ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const normalize = (incoming) => {
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
  if (compact.length > 100 && !compact.includes(' ')) return `data:image/png;base64,${compact}`;
  return null;
};

const renderSig = (v, w = 180, h = 45) => {
  const uri = resolveSignatureUri(v);
  if (!uri) return `<div style="border-bottom: 1px solid #ccc; width: 140px; height: 15px; margin-top: 10px;"></div>`;
  return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block; object-fit:contain; mix-blend-mode: multiply;"/>`;
};

const getLogoDataUri = (p) => {
  if (!p) return null;
  if (p.assets && p.assets.logoDataUri) return p.assets.logoDataUri;
  const candidates = [path.join(process.cwd(), 'renderer', 'assets', 'logo.jpeg'), path.join(process.cwd(), 'assets', 'logo.jpeg')];
  for (const c of candidates) { try { if (fs.existsSync(c)) { const b = fs.readFileSync(c); const mime = path.extname(c).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg'; return `data:${mime};base64,${b.toString('base64')}`; } } catch (e) { } }
  return null;
};

module.exports = function generate(wrapper) {
  const p = normalize(wrapper);
  const metadata = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : (Array.isArray(p.data) ? p.data : []);
  const logo = getLogoDataUri(p);

  // Calibration for A4 Landscape (~1060px usable)
  const COL = {
    PRODUCT: 200,
    SUPPLIER: 160,
    CLEAN: 60,
    STATE: 150,
    EXPIRY: 110,
    REMARKS: 380
  };

  const rowsHtml = (rows.length ? rows : Array.from({ length: 8 }).map(() => ({}))).map(r => (
    `<div style="display:flex; border-bottom:1px solid #000; align-items:stretch; background:#fff; min-height:38px">
      <div style="width:${COL.PRODUCT}px; padding:6px; border-right:1px solid #000; font-size:11px; display:flex; align-items:center">${escapeHtml(r.nameOfProduct || '')}</div>
      <div style="width:${COL.SUPPLIER}px; padding:6px; border-right:1px solid #000; font-size:11px; display:flex; align-items:center">${escapeHtml(r.supplier || '')}</div>
      <div style="width:${COL.CLEAN}px; padding:6px; border-right:1px solid #000; text-align:center; font-weight:bold; display:flex; align-items:center; justify-content:center">${r.clean ? '✓' : ''}</div>
      <div style="width:${COL.STATE}px; padding:6px; border-right:1px solid #000; font-size:11px; display:flex; align-items:center">${escapeHtml(r.stateOfProduct || '')}</div>
      <div style="width:${COL.EXPIRY}px; padding:6px; border-right:1px solid #000; font-size:11px; display:flex; align-items:center; justify-content:center">${escapeHtml(r.expiryDate || '')}</div>
      <div style="width:${COL.REMARKS}px; padding:6px; font-size:11px; display:flex; align-items:center">${escapeHtml(r.remarks || '')}</div>
    </div>`)).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:8mm}
    *{box-sizing: border-box;}
    body{font-family:'Inter', Arial, sans-serif; margin:0; padding:0; color:#111}
    .container{width:1060px; margin:0 auto; padding:10px}
    .headerRow{display:flex; justify-content:space-between; align-items:center; border-bottom:2.5px solid #000; padding-bottom:8px; margin-bottom:10px}
    .logoWrap{display:flex; align-items:center; gap:12px}
    .logo{width:56px; height:56px; object-fit:contain}
    .title{font-size:18px; font-weight:900; text-align:center; margin:10px 0; text-transform:uppercase}
    .metaContainer{display:flex; gap:10px; margin-bottom:10px}
    .metaBox{flex:1; border:1px solid #000; padding:8px; background:#f9fafb; font-size:11px; line-height:1.6}
    .tableWrap{border:1.5px solid #000; border-bottom:none; width:100%}
    .hRow{display:flex; background:#e5e7eb; border-bottom:1.5px solid #000; align-items:stretch}
    .hCell{font-weight:800; font-size:10px; text-align:center; border-right:1px solid #000; text-transform:uppercase; display:flex; align-items:center; justify-content:center; padding:4px}
    .sigSection{display:flex; gap:12px; margin-top:15px}
    .sigCard{flex:1; border:1px solid #000; padding:10px; background:#fff}
  </style></head><body>

  <div class="container">
    <div class="headerRow">
      <div class="logoWrap">
        ${logo ? `<img src="${logo}" class="logo"/>` : ''}
        <div>
          <div style="font-weight:900; font-size:16px; color:#185a9d">BRAVO BRANDS LIMITED</div>
          <div style="font-size:11px; font-weight:700; color:#43cea2">Food Safety Management System</div>
        </div>
      </div>
      <div style="text-align:right; font-size:10px; font-weight:700">
        <div>Doc Ref: ${escapeHtml(metadata.docRef || 'BBN-SHEQ-C-01')}</div>
        <div>Issue Date: ${escapeHtml(metadata.issueDate || '')}</div>
        <div>Version: ${escapeHtml(metadata.versionNo || '1.0')}</div>
      </div>
    </div>

    <div class="title">${escapeHtml(p.title || 'Chemicals Receiving')}</div>

    <div style="border:1px solid #000; padding:8px; margin-bottom:10px; background:#fff; font-size:12px">
      <strong>Specification:</strong> ${escapeHtml(p.specification || metadata.specification || 'All chemicals must be intact, labeled, and within expiry dates.')}
    </div>

    <div class="metaContainer">
      <div class="metaBox">
        <div><strong>Date of Delivery:</strong> ${escapeHtml(metadata.dateOfDelivery || '')}</div>
        <div><strong>Time of Delivery:</strong> ${escapeHtml(metadata.timeOfDelivery || '')}</div>
        <div><strong>Received By:</strong> ${escapeHtml(metadata.receivedBy || '')}</div>
        <div><strong>Complex Manager:</strong> ${escapeHtml(metadata.complexManager || '')}</div>
      </div>
      <div class="metaBox">
        <div><strong>Invoice No:</strong> ${escapeHtml(metadata.invoiceNo || '')}</div>
        <div><strong>Driver's Name:</strong> ${escapeHtml(metadata.driversName || '')}</div>
        <div><strong>Vehicle Reg No:</strong> ${escapeHtml(metadata.vehicleRegNo || '')}</div>
        <div style="margin-top:4px; display:flex; align-items:center; gap:8px">
          <strong>Driver Signature:</strong> ${renderSig(metadata.signature, 140, 30)}
        </div>
      </div>
    </div>

    <div class="tableWrap">
      <div class="hRow">
        <div class="hCell" style="width:${COL.PRODUCT}px">Name of Product</div>
        <div class="hCell" style="width:${COL.SUPPLIER}px">Supplier</div>
        <div class="hCell" style="width:${COL.CLEAN}px">Vehicle</div>
        <div class="hCell" style="width:${COL.STATE + COL.EXPIRY + COL.REMARKS}px; border-right:none">Product Quality Checks</div>
      </div>
      <div class="hRow" style="background:#f3f4f6; font-size:9px">
        <div style="width:${COL.PRODUCT}px; border-right:1px solid #000"></div>
        <div style="width:${COL.SUPPLIER}px; border-right:1px solid #000"></div>
        <div class="hCell" style="width:${COL.CLEAN}px; font-size:9px">Clean</div>
        <div class="hCell" style="width:${COL.STATE}px; font-size:9px">State of Product</div>
        <div class="hCell" style="width:${COL.EXPIRY}px; font-size:9px">Expiry Date</div>
        <div class="hCell" style="width:${COL.REMARKS}px; border-right:none; font-size:9px">Remarks / Observations</div>
      </div>
      ${rowsHtml}
    </div>

    <div class="sigSection">
      <div class="sigCard">
        <div style="font-size:10px; font-weight:800; color:#555">VERIFIED BY (STORE/DEPT)</div>
        ${renderSig(metadata.verifiedBySign || metadata.verifiedBy)}
      </div>
      <div class="sigCard">
        <div style="font-size:10px; font-weight:800; color:#555">HSEQ MANAGER VERIFICATION</div>
        ${renderSig(metadata.hseqManagerSign || metadata.hseqManager)}
      </div>
    </div>
  </div>

</body></html>`;
};
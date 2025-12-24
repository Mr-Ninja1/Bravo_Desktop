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

const compactSig = (v) => {
  if (!v) return null;
  const s = String(v);
  if (s.startsWith('data:')) return s;
  const compact = s.replace(/\s+/g, '');
  if (compact.length > 100) return `data:image/png;base64,${compact}`;
  return null;
};

const renderSig = (v, w = 180, h = 45) => {
  const uri = compactSig(v);
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
  const meta = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : (Array.isArray(p.data) ? p.data : []);
  const logo = getLogoDataUri(p);

  // Calibration for A4 Landscape (~1060px usable)
  const COL = {
    NAME: 160,
    SUPPLIER: 140,
    CLEAN: 60,
    TEMP_V: 60,
    TEMP_P: 100,
    STATE: 110,
    EXPIRY: 90,
    REMARKS: 340
  };

  const rowsHtml = (rows.length ? rows : Array.from({ length: 8 }).map(() => ({}))).map(r => `
    <div style="display:flex; border-bottom:1px solid #000; min-height:40px; align-items:stretch; background:#fff">
      <div style="width:${COL.NAME}px; padding:6px; border-right:1px solid #000; font-size:10px; display:flex; align-items:center">${escapeHtml(r.nameOfProduct || '')}</div>
      <div style="width:${COL.SUPPLIER}px; padding:6px; border-right:1px solid #000; font-size:10px; display:flex; align-items:center">${escapeHtml(r.supplier || '')}</div>
      <div style="width:${COL.CLEAN}px; padding:6px; border-right:1px solid #000; text-align:center; font-weight:bold; display:flex; align-items:center; justify-content:center">${r.clean ? '✓' : ''}</div>
      <div style="width:${COL.TEMP_V}px; padding:6px; border-right:1px solid #000; text-align:center; font-size:10px; display:flex; align-items:center; justify-content:center">${escapeHtml(r.temp || '')}</div>
      <div style="width:${COL.TEMP_P}px; padding:6px; border-right:1px solid #000; text-align:center; font-size:10px; display:flex; align-items:center; justify-content:center">${escapeHtml(r.tempOfChldFrznProduct || '')}</div>
      <div style="width:${COL.STATE}px; padding:6px; border-right:1px solid #000; text-align:center; font-size:10px; display:flex; align-items:center; justify-content:center">${escapeHtml(r.stateOfProduct || '')}</div>
      <div style="width:${COL.EXPIRY}px; padding:6px; border-right:1px solid #000; text-align:center; font-size:10px; display:flex; align-items:center; justify-content:center">${escapeHtml(r.expiryDate || '')}</div>
      <div style="width:${COL.REMARKS}px; padding:6px; font-size:10px; display:flex; align-items:center">${escapeHtml(r.remarks || '')}</div>
    </div>`).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:6mm}
    *{box-sizing: border-box;}
    body{font-family:'Inter', Arial, sans-serif; margin:0; padding:0; color:#111}
    .container{width:1060px; margin:0 auto; padding:10px}
    .headerRow{display:flex; justify-content:space-between; align-items:center; border-bottom:2.5px solid #000; padding-bottom:8px; margin-bottom:10px}
    .mainTitle{font-size:18px; font-weight:900; text-align:center; margin:10px 0; text-transform:uppercase}
    .metaContainer{display:flex; gap:10px; margin-bottom:10px}
    .metaBox{flex:1; border:1px solid #000; padding:8px; background:#f9fafb; font-size:11px; line-height:1.6}
    .tableWrap{border:1.5px solid #000; border-bottom:none; width:100%}
    .hRow{display:flex; background:#e5e7eb; border-bottom:1.5px solid #000; align-items:stretch}
    .hCell{font-weight:800; font-size:9px; text-align:center; border-right:1px solid #000; text-transform:uppercase; display:flex; align-items:center; justify-content:center; padding:4px}
    .sigSection{display:flex; gap:12px; margin-top:15px}
    .sigCard{flex:1; border:1px solid #000; padding:10px; background:#fff}
  </style></head><body>

  <div class="container">
    <div class="headerRow">
      <div style="display:flex; align-items:center; gap:12px">
        ${logo ? `<img src="${logo}" style="width:56px; height:56px; object-fit:contain"/>` : ''}
        <div>
          <div style="font-weight:900; font-size:16px; color:#185a9d">BRAVO BRANDS LIMITED</div>
          <div style="font-size:11px; font-weight:700; color:#43cea2">Food Safety Management System</div>
        </div>
      </div>
      <div style="text-align:right; font-size:10px; font-weight:700">
        <div>Issue Date: ${escapeHtml(meta.issueDate || '')}</div>
        <div>Version No: ${escapeHtml(meta.versionNo || '1.0')}</div>
        <div>Page 1 of 1</div>
      </div>
    </div>

    <div class="mainTitle">Chilled & Frozen Receiving Checklist</div>

    <div class="metaContainer" style="border:1px solid #000; background:#f3f4f6; padding:8px; margin-bottom:10px; font-size:12px">
      <div style="flex:1"><strong>Compiled By:</strong> ${renderSig(meta.compiledBySign || meta.compiledBy, 160, 30)}</div>
      <div style="flex:1"><strong>Approved By:</strong> ${renderSig(meta.approvedBySign || meta.approvedBy, 160, 30)}</div>
    </div>

    <div style="border:1px solid #000; padding:8px; margin-bottom:10px; background:#fff; font-size:11px">
      <strong>Specification:</strong> ${escapeHtml(p.spec || p.specification || 'Products must be delivered in clean vehicles at correct temperatures.')}
    </div>

    <div class="metaContainer">
      <div class="metaBox">
        <div><strong>Date of Delivery:</strong> ${escapeHtml(meta.dateOfDelivery || '')}</div>
        <div><strong>Time of Delivery:</strong> ${escapeHtml(meta.timeOfDelivery || '')}</div>
        <div><strong>Received By:</strong> ${escapeHtml(meta.receivedBy || '')}</div>
        <div><strong>Complex Manager:</strong> ${escapeHtml(meta.complexManager || '')}</div>
      </div>
      <div class="metaBox">
        <div><strong>Invoice No:</strong> ${escapeHtml(meta.invoiceNo || '')}</div>
        <div><strong>Driver's Name:</strong> ${escapeHtml(meta.driversName || '')}</div>
        <div><strong>Vehicle Reg No:</strong> ${escapeHtml(meta.vehicleRegNo || '')}</div>
        <div style="margin-top:4px; display:flex; align-items:center; gap:8px">
          <strong>Driver Signature:</strong> ${renderSig(meta.signature, 140, 25)}
        </div>
      </div>
    </div>

    <div class="tableWrap">
      <div class="hRow">
        <div class="hCell" style="width:${COL.NAME}px">Name of Product</div>
        <div class="hCell" style="width:${COL.SUPPLIER}px">Supplier</div>
        <div class="hCell" style="width:${COL.CLEAN + COL.TEMP_V}px">Delivery Vehicle</div>
        <div class="hCell" style="width:${COL.TEMP_P + COL.STATE + COL.EXPIRY + COL.REMARKS}px; border-right:none">Product Quality & Temp Checks</div>
      </div>
      <div class="hRow" style="background:#f3f4f6">
        <div style="width:${COL.NAME}px; border-right:1px solid #000"></div>
        <div style="width:${COL.SUPPLIER}px; border-right:1px solid #000"></div>
        <div class="hCell" style="width:${COL.CLEAN}px">Clean</div>
        <div class="hCell" style="width:${COL.TEMP_V}px">Temp</div>
        <div class="hCell" style="width:${COL.TEMP_P}px">Prod Temp</div>
        <div class="hCell" style="width:${COL.STATE}px">State</div>
        <div class="hCell" style="width:${COL.EXPIRY}px">Expiry</div>
        <div class="hCell" style="width:${COL.REMARKS}px; border-right:none">Remarks</div>
      </div>
      ${rowsHtml}
    </div>

    <div class="sigSection">
      <div class="sigCard">
        <div style="font-size:10px; font-weight:800; color:#555">VERIFIED BY (STORE/DEPT)</div>
        ${renderSig(meta.verifiedBySign || meta.verifiedBy)}
      </div>
      <div class="sigCard">
        <div style="font-size:10px; font-weight:800; color:#555">HSEQ MANAGER VERIFICATION</div>
        ${renderSig(meta.hseqManagerSign || meta.hseqManager)}
      </div>
    </div>
  </div>

</body></html>`;
};
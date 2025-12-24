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
  if (!val) return null;
  if (typeof val === 'object') {
    if (val.uri && typeof val.uri === 'string') return val.uri.trim();
    if (val.data && typeof val.data === 'string') return val.data.startsWith('data:') ? val.data : `data:image/png;base64,${val.data.replace(/\s+/g, '')}`;
    if (val.signature && typeof val.signature === 'string') return val.signature.startsWith('data:') ? val.signature : `data:image/png;base64,${val.signature.replace(/\s+/g, '')}`;
    return null;
  }
  if (typeof val !== 'string') return null;
  const s = val.trim(); if (!s) return null;
  if (s.startsWith('data:') || /^https?:\/\//i.test(s) || s.startsWith('/')) return s;
  const compact = s.replace(/\s+/g, '');
  if (compact.length > 150 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
};

const renderSignature = (val, w = 220, h = 80) => {
  const uri = resolveSignatureUri(val);
  if (uri) return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block"/>`;
  if (!val) return `<div style="color:#999">-</div>`;
  return `<div>${escapeHtml(val)}</div>`;
};

const getLogoDataUri = (p) => {
  if (!p) return null;
  if (p.assets && p.assets.logoDataUri) return p.assets.logoDataUri;
  const candidates = [
    path.join(process.cwd(), 'renderer', 'assets', 'logo.jpeg'),
    path.join(process.cwd(), 'renderer', 'src', 'assets', 'logo.jpeg'),
    path.join(process.cwd(), 'assets', 'logo.jpeg'),
    path.join(process.cwd(), 'assets', 'logo.jpg')
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) {
        const b = fs.readFileSync(c);
        const ext = path.extname(c).toLowerCase();
        const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
        return `data:${mime};base64,${b.toString('base64')}`;
      }
    } catch (e) { }
  }
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const meta = p.metadata || {};
  const data = Array.isArray(p.formData) ? p.formData : (Array.isArray(p.data) ? p.data : (p.formData || []));
  const hints = p.layoutHints || {};
  const DEFAULT_COLS = { NAME: 260, SUPPLIER: 180, CLEAN: 90, TEMP: 90, STATE: 140, EXPIRY: 120, REMARKS: 400 };
  const COL = (hints && hints.WIDTHS) || DEFAULT_COLS;

  const logoUri = getLogoDataUri(p);

  const rowsHtml = (data.length ? data : []).map((row, idx) => `
    <div style="display:flex; border-bottom:1px solid #000; min-height:48px; align-items:stretch">
      <div style="width:40px; padding:8px; text-align:center; border-right:1px solid #000">${idx+1}.</div>
      <div style="width:${COL.NAME}px; padding:8px; text-align:center; border-right:1px solid #000">${escapeHtml(row.nameOfProduct || row.name || '')}</div>
      <div style="width:${COL.SUPPLIER}px; padding:8px; text-align:center; border-right:1px solid #000">${escapeHtml(row.supplier || '')}</div>
      <div style="width:${COL.CLEAN}px; padding:8px; text-align:center; border-right:1px solid #000">${row.clean ? '✓' : ''}</div>
      <div style="width:${COL.TEMP}px; padding:8px; text-align:center; border-right:1px solid #000">${escapeHtml(row.temp || '')}</div>
      <div style="width:${COL.STATE}px; padding:8px; text-align:center; border-right:1px solid #000">${escapeHtml(row.stateOfProduct || row.state || '')}</div>
      <div style="width:${COL.EXPIRY}px; padding:8px; text-align:center; border-right:1px solid #000">${escapeHtml(row.expiryDate || row.expiry || '')}</div>
      <div style="width:${COL.REMARKS}px; padding:8px; text-align:left">${escapeHtml(row.remarks || '')}</div>
    </div>
  `).join('\n') || `<div style="padding:12px;color:#666">No entries</div>`;

  const compiledByVal = meta.compiledBy || '';
  const compiledBySig = meta.compiledBySign || meta.compiledBySignature || '';
  const approvedByVal = meta.approvedBy || '';
  const approvedBySig = meta.approvedBySign || meta.approvedBySignature || '';

  const verifiedByVal = meta.verifiedBy || '';
  const verifiedBySig = meta.verifiedBySign || '';
  const hseqManagerVal = meta.hseqManager || '';
  const hseqManagerSig = meta.hseqManagerSign || '';

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:10mm}
    body{font-family:Inter, Arial, sans-serif; margin:0; padding:12px; color:#111}
    .container{background:#fff; min-width:1123px; padding:12px}
    .headerRow{display:flex; align-items:center; border:1px solid #000; margin-bottom:8px; padding:6px}
    .logoImage{width:48px; height:48px; margin-right:10px}
    .headerText{flex:1; margin-right:10px}
    .logoText{font-weight:700; font-size:28px; color:#007A33}
    .systemText{font-size:12px; font-weight:700}
    .docDetails{min-width:120px}
    .subjectRow{display:flex; border:1px solid #000; padding:6px; align-items:center}
    .subjectLabel{font-weight:700; font-size:14px}
    .subjectValue{font-size:16px; margin-left:8px}
    .versionText{font-size:10px; margin-left:12px}
    .subDetailRow{display:flex; border:1px solid #000; margin:8px 0; padding:6px}
    .subDetailLabel{font-weight:700; font-size:11px}
    .subDetailValue{font-size:11px; margin-left:6px; border-bottom:1px solid #000}
    .specSection{border:1px solid #000; padding:8px; margin-bottom:8px}
    .specLabel{font-weight:700}
    .tableContainer{border:1px solid #000; min-width:1123px}
    .groupHeader{font-weight:700; font-size:13px; padding:6px; text-align:center; background:#eee; border-right:1px solid #000}
    .tableHeaderRow{display:flex; background:#eee; align-items:stretch}
    .headerCell{font-weight:700; font-size:12px; padding:8px; text-align:center; border-right:1px solid #000; min-height:60px}
    .dataCell{font-size:12px; padding:8px; border-right:1px solid #000; text-align:center}
    .verificationFooter{margin-top:10px}
    .verificationText{font-weight:700; margin-bottom:8px}
  </style></head><body>

    <div class="container">
      <div class="headerRow">
        ${logoUri ? `<img src="${logoUri}" class="logoImage"/>` : `<img src="renderer/assets/logo.jpeg" class="logoImage"/>`}
        <div class="headerText">
          <div class="logoText">Bravo</div>
          <div class="systemText">BRAVO BRANDS LIMITED</div>
          <div class="systemText">Food Safety Management System</div>
        </div>
        <div class="docDetails">
          <div>Issue Date: ${escapeHtml(meta.issueDate || '')}</div>
          <div>Page: 1 of 1</div>
        </div>
      </div>

      <div class="subjectRow">
        <div class="subjectLabel">Subject:</div>
        <div class="subjectValue">Dry Goods Receiving Checklist</div>
        <div class="versionText">Version No: ${escapeHtml(meta.versionNo || '')}</div>
      </div>

      <div class="subDetailRow">
        <div style="flex:1">
          <div class="subDetailLabel">Compiled By:</div>
          <div class="subDetailValue">${compiledBySig ? renderSignature(compiledBySig,220,60) : escapeHtml(compiledByVal || 'Michael Zulu C.')}</div>
        </div>
        <div style="flex:1">
          <div class="subDetailLabel">Approved By:</div>
          <div class="subDetailValue">${approvedBySig ? renderSignature(approvedBySig,220,60) : escapeHtml(approvedByVal || 'Hassani Ali')}</div>
        </div>
      </div>

      <div class="specSection">
        <div class="specLabel">Specification:</div>
        <div>Packaging shall be intact, no signs of pests; seals shall be intact and labels shall be legible and correct.</div>
      </div>

      <div class="deliveryDetails">
        <div class="deliveryGrid">
          <div class="deliveryCol">
            <div class="deliveryLabel">Date of Delivery: <span class="deliveryValue">${escapeHtml(meta.dateOfDelivery || '')}</span></div>
            <div class="deliveryLabel">Received By: <span class="deliveryValue">${escapeHtml(meta.receivedBy || '')}</span></div>
            <div class="deliveryLabel">Complex Manager: <span class="deliveryValue">${escapeHtml(meta.complexManager || '')}</span></div>
            <div class="deliveryLabel">Time of Delivery: <span class="deliveryValue">${escapeHtml(meta.timeOfDelivery || '')}</span></div>
          </div>
          <div class="deliveryCol">
            <div class="deliveryLabel">Invoice No.: <span class="deliveryValue">${escapeHtml(meta.invoiceNo || '')}</span></div>
            <div class="deliveryLabel">Drivers Name: <span class="deliveryValue">${escapeHtml(meta.driversName || '')}</span></div>
            <div class="deliveryLabel">Vehicle Reg No.: <span class="deliveryValue">${escapeHtml(meta.vehicleRegNo || '')}</span></div>
            <div style="margin-top:6px">
              <div class="deliveryLabel">Signature:</div>
              <div>${meta.signature ? renderSignature(meta.signature,240,80) : ''}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="tableContainer">
        <div style="display:flex;">
          <div style="width:260px"></div>
          <div style="width:180px"></div>
          <div style="display:flex; width:${COL.CLEAN + COL.TEMP}px">
            <div style="width:${COL.CLEAN}px" class="groupHeader">Delivery Vehicle</div>
            <div style="width:${COL.TEMP}px; border-right:1px solid #000"></div>
          </div>
          <div style="display:flex; width:${COL.STATE + COL.EXPIRY}px">
            <div style="width:${COL.STATE}px" class="groupHeader">Product</div>
            <div style="width:${COL.EXPIRY}px; border-right:1px solid #000"></div>
          </div>
          <div style="width:${COL.REMARKS}px"></div>
        </div>
        <div style="height:2px; background:#bbb; margin-bottom:-2px"></div>
        <div class="tableHeaderRow">
          <div class="headerCell" style="width:40px">S/N</div>
          <div class="headerCell" style="width:${COL.NAME}px">Name of Product</div>
          <div class="headerCell" style="width:${COL.SUPPLIER}px">Supplier</div>
          <div class="headerCell" style="width:${COL.CLEAN}px">Clean</div>
          <div class="headerCell" style="width:${COL.TEMP}px">Temp</div>
          <div class="headerCell" style="width:${COL.STATE}px">State of Product</div>
          <div class="headerCell" style="width:${COL.EXPIRY}px">Expiry Date</div>
          <div class="headerCell" style="width:${COL.REMARKS}px; border-right:0; text-align:left; padding-left:12px">Remarks</div>
        </div>
        ${rowsHtml}
      </div>

      <div class="verificationFooter">
        <div class="verificationText">VERIFIED BY</div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start">
          <div style="flex:1; margin-right:8px">
            <div style="font-weight:700">Verified By</div>
            <div>${verifiedBySig ? renderSignature(verifiedBySig,220,80) : escapeHtml(verifiedByVal)}</div>
          </div>
          <div style="flex:1; margin-left:8px">
            <div style="font-weight:700">HSEQ Manager</div>
            <div>${hseqManagerSig ? renderSignature(hseqManagerSig,220,80) : escapeHtml(hseqManagerVal)}</div>
          </div>
        </div>
      </div>

    </div>

  </body></html>`;
};

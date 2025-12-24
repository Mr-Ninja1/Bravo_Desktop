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
  if (s.startsWith('data:') || /^https?:\/\//i.test(s)) return s;
  const compact = s.replace(/\s+/g, '');
  if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
};

const renderSignature = (val, w = 160, h = 50) => {
  const uri = resolveSignatureUri(val);
  if (uri) return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block; mix-blend-mode: multiply; margin: 0 auto;"/>`;
  if (!val) return `<div style="color:#999; border-bottom: 1px solid #ccc; width: 80%; height: 20px; margin: 0 auto;"></div>`;
  return `<div style="font-size:11px; font-weight:600; text-align:center;">${escapeHtml(val)}</div>`;
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
    try { if (fs.existsSync(c)) { 
      const b = fs.readFileSync(c); 
      const ext = path.extname(c).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
      return `data:${mime};base64,${b.toString('base64')}`; 
    } } catch (e) {}
  }
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const meta = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : (p.data || []);
  
  // Strict Width Definition for A4 Landscape (~1050px total)
  const COL = {
    NAME: 240,
    SUPPLIER: 160,
    CLEAN: 70,
    TEMP: 70,
    STATE: 140,
    EXPIRY: 120,
    REMARKS: 250 // Fixed width instead of flex:1 to prevent border collapse
  };

  const logoUri = getLogoDataUri(p);

  const rowsHtml = (rows.length ? rows : Array.from({length: 10}).map(()=>({}))).map((r, idx) => `
    <div style="display:flex; border-bottom:1px solid #000; min-height:40px; align-items:stretch; width:fit-content;">
      <div style="width:${COL.NAME}px; padding:6px; border-right:1px solid #000; display:flex; align-items:center; box-sizing:border-box;">${escapeHtml(r.typeOfVegFruit || r.type || '')}</div>
      <div style="width:${COL.SUPPLIER}px; padding:6px; border-right:1px solid #000; display:flex; align-items:center; justify-content:center; box-sizing:border-box;">${escapeHtml(r.supplier || '')}</div>
      <div style="width:${COL.CLEAN}px; padding:6px; border-right:1px solid #000; display:flex; align-items:center; justify-content:center; box-sizing:border-box;">${r.clean ? '<b style="font-size:18px">✓</b>' : ''}</div>
      <div style="width:${COL.TEMP}px; padding:6px; border-right:1px solid #000; display:flex; align-items:center; justify-content:center; box-sizing:border-box;">${escapeHtml(r.temp || '')}</div>
      <div style="width:${COL.STATE}px; padding:6px; border-right:1px solid #000; display:flex; align-items:center; justify-content:center; box-sizing:border-box;">${escapeHtml(r.stateOfProduct || r.state || '')}</div>
      <div style="width:${COL.EXPIRY}px; padding:6px; border-right:1px solid #000; display:flex; align-items:center; justify-content:center; box-sizing:border-box;">${escapeHtml(r.expiryDate || r.expiry || '')}</div>
      <div style="width:${COL.REMARKS}px; padding:6px; display:flex; align-items:center; box-sizing:border-box;">${escapeHtml(r.remarks || '')}</div>
    </div>
  `).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:8mm}
    *{box-sizing: border-box;}
    body{font-family:'Inter', Arial, sans-serif; margin:0; padding:0; color:#111; line-height:1.2}
    .container{width:100%}
    .headerTable{width:100%; border:1.5px solid #000; border-bottom:none; border-collapse:collapse}
    .headerTable td{border:1px solid #000; padding:8px}
    .logoSection{display:flex; align-items:center}
    .logoImage{width:60px; height:60px; object-fit:contain; margin-right:12px}
    .brandTitle{font-weight:900; font-size:24px; color:#007A33; text-transform:uppercase}
    .brandSub{font-size:12px; font-weight:800; text-transform:uppercase}
    
    .subjectRow{background:#f3f4f6; border:1.5px solid #000; padding:10px; text-align:center; font-weight:900; font-size:18px; text-transform:uppercase}
    
    .infoGrid{display:grid; grid-template-columns: repeat(3, 1fr); border:1.5px solid #000; border-top:none; border-bottom:none}
    .infoBox{padding:8px; border-right:1px solid #000}
    .infoBox:last-child{border-right:none}
    .label{font-size:10px; font-weight:800; text-transform:uppercase; color:#555; margin-bottom:2px}
    .value{font-size:13px; font-weight:700}

    .specBox{border:1.5px solid #000; padding:10px; margin: 10px 0; background:#fff}
    .specLabel{color:#ef4444; font-weight:900; text-transform:uppercase; font-size:11px; margin-bottom:4px}
    
    .tableContainer{border:1.5px solid #000; width:fit-content; border-collapse: collapse;}
    .tableHeader{display:flex; background:#e5e7eb; border-bottom:1px solid #000; align-items:stretch; width:fit-content;}
    .hCell{font-weight:800; font-size:11px; padding:8px; text-align:center; border-right:1px solid #000; text-transform:uppercase; display:flex; align-items:center; justify-content:center; box-sizing:border-box;}
  </style></head><body>

    <div class="container">
      <table class="headerTable">
        <tr>
          <td width="60%">
            <div class="logoSection">
              ${logoUri ? `<img src="${logoUri}" class="logoImage"/>` : ''}
              <div>
                <div class="brandTitle">Bravo</div>
                <div class="brandSub">Bravo Brands Limited | Food Safety Management</div>
              </div>
            </div>
          </td>
          <td width="40%" style="text-align:right">
            <div class="label">Issue Date</div>
            <div class="value">${escapeHtml(meta.issueDate || 'N/A')}</div>
            <div style="font-size:11px; margin-top:5px; font-weight:700">Page: 1 of 1</div>
          </td>
        </tr>
      </table>

      <div class="subjectRow">Vegetables and Fruits Receiving Checklist</div>

      <div class="infoGrid">
        <div class="infoBox"><div class="label">Date of Delivery</div><div class="value">${escapeHtml(meta.dateOfDelivery || '')}</div></div>
        <div class="infoBox"><div class="label">Time of Delivery</div><div class="value">${escapeHtml(meta.timeOfDelivery || '')}</div></div>
        <div class="infoBox"><div class="label">Invoice No</div><div class="value">${escapeHtml(meta.invoiceNo || '')}</div></div>
      </div>
      <div class="infoGrid" style="border-top:1px solid #000; border-bottom:1.5px solid #000">
        <div class="infoBox"><div class="label">Received By</div><div class="value">${escapeHtml(meta.receivedBy || '')}</div></div>
        <div class="infoBox"><div class="label">Driver's Name</div><div class="value">${escapeHtml(meta.driversName || '')}</div></div>
        <div class="infoBox"><div class="label">Vehicle Reg No</div><div class="value">${escapeHtml(meta.vehicleRegNo || '')}</div></div>
      </div>

      <div class="specBox">
        <div class="specLabel">Safety Specification:</div>
        <div style="font-size:12px; font-weight:500">
          Vegetables and fruits must be delivered clean, practically free of any visible foreign matter (soils); practically free from pests, pest damage, and bruising.
        </div>
      </div>

      <div class="tableContainer">
        <div class="tableHeader">
          <div class="hCell" style="width:${COL.NAME}px">Type of Veg / Fruit</div>
          <div class="hCell" style="width:${COL.SUPPLIER}px">Supplier</div>
          <div class="hCell" style="width:${COL.CLEAN}px">Clean</div>
          <div class="hCell" style="width:${COL.TEMP}px">Temp</div>
          <div class="hCell" style="width:${COL.STATE}px">State of Product</div>
          <div class="hCell" style="width:${COL.EXPIRY}px">Expiry Date</div>
          <div class="hCell" style="width:${COL.REMARKS}px; border-right:0">Remarks</div>
        </div>
        ${rowsHtml}
      </div>

      <div style="margin-top:15px; display:flex; gap:15px">
        <div style="flex:1; border:1.5px solid #000; padding:10px">
          <div class="label">Verified By (Sign)</div>
          <div style="min-height:45px; display:flex; align-items:center">${renderSignature(meta.verifiedBy)}</div>
          <div class="value" style="border-top:1px solid #eee; padding-top:4px; text-align:center;">${escapeHtml(meta.verifiedBy || '')}</div>
        </div>
        <div style="flex:1; border:1.5px solid #000; padding:10px">
          <div class="label">Complex Manager / Signature</div>
          <div style="min-height:45px; display:flex; align-items:center">${renderSignature(meta.signature || meta.complexManagerSign)}</div>
          <div class="value" style="border-top:1px solid #eee; padding-top:4px; text-align:center;">${escapeHtml(meta.complexManager || '')}</div>
        </div>
        <div style="flex:1; border:1.5px solid #000; padding:10px">
          <div class="label">HSEQ Manager</div>
          <div style="min-height:45px; display:flex; align-items:center">${renderSignature(meta.hseqManagerSign)}</div>
          <div class="value" style="border-top:1px solid #eee; padding-top:4px; text-align:center;">${escapeHtml(meta.hseqManager || '')}</div>
        </div>
      </div>
    </div>
  </body></html>`;
};
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

const renderSignature = (val, w = 140, h = 50) => {
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
    } catch (e) { /* ignore */ }
  }
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const data = p.payload || p.formData || p.data || p || {};
  const meta = p.metadata || {};
  const entries = Array.isArray(data.rejectionEntries) ? data.rejectionEntries : (data.rejectionEntries || []);

  const logoUri = getLogoDataUri(p);

  const rejectionCriteria = [
    { product: 'Chilled products', criteria: 'Products above 4°C; damaged packaging; broken seals; incorrect/missing label; missing expiry.' },
    { product: 'Frozen products', criteria: 'Product above -18°C; damaged packaging; broken seals; incorrect/missing label; missing expiry.' },
    { product: 'Dry Goods', criteria: 'Damaged packaging; broken seals; incorrect/missing label; missing expiry.' },
    { product: 'Cleaning Chemicals', criteria: 'Not in original containers; damaged packaging; missing MSDS; broken seals; missing expiry.' },
    { product: 'Eggs', criteria: 'Dirty, bad smell, broken, pests; 10/10 float test; missing/incorrect label.' },
    { product: 'Vegetables', criteria: 'Dirty, visible foreign matter, pest damage.' },
  ];

  // Updated widths for Landscape
  const rowsHtml = (entries.length ? entries : []).map((entry, idx) => `
    <div style="display:flex; min-height:36px; align-items:stretch; border-bottom:1px solid #000">
      <div style="width:40px; padding:6px; text-align:center; border-right:1px solid #000">${idx+1}.</div>
      <div style="width:220px; padding:6px; text-align:center; border-right:1px solid #000">${escapeHtml(entry.name || entry.product || '')}</div>
      <div style="width:160px; padding:6px; text-align:center; border-right:1px solid #000">${escapeHtml(entry.supplier || '')}</div>
      <div style="width:160px; padding:6px; text-align:center; border-right:1px solid #000">${escapeHtml(entry.invoice || '')}</div>
      <div style="width:160px; padding:6px; text-align:center; border-right:1px solid #000">${escapeHtml(entry.batch || '')}</div>
      <div style="width:120px; padding:6px; text-align:center; border-right:1px solid #000">${escapeHtml(entry.expiry || '')}</div>
      <div style="flex:1; padding:6px; text-align:left">${escapeHtml(entry.reason || '')}</div>
    </div>
  `).join('\n') || `<div style="padding:12px; color:#666">No rejection entries recorded</div>`;

  const compiledByVal = data.compiledBy || (meta && meta.compiledBy) || '';
  const compiledBySig = data.compiledBySign || (meta && meta.compiledBySign) || data.compiledBySignature || '';
  const approvedByVal = data.approvedBy || (meta && meta.approvedBy) || '';
  const approvedBySig = data.approvedBySign || (meta && meta.approvedBySign) || data.approvedBySignature || '';

  const storeOfficer = data.storeOfficer || '';
  const complexManager = data.complexManager || '';
  const financeStockController = data.financeStockController || '';
  const rejectedProductCollector = data.rejectedProductCollector || '';

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:8mm}
    body{font-family:Inter, Arial, sans-serif; margin:0; padding:12px; color:#111}
    .safe{padding:12px}
    .headerBlock{display:flex; align-items:flex-start; margin-bottom:10px; padding-bottom:4px; border-bottom:1px solid #000}
    .headerLeft{width:220px; padding-right:12px; border-right:1px solid #000}
    .logoImage{width:72px; height:36px; margin-bottom:2px; object-fit: contain}
    .bravoBrand{font-size:28px; font-weight:900; color:#185a9d; margin-top:-8px; margin-bottom:-2px; letter-spacing:1.5px}
    .companyName{font-size:10px; font-weight:700}
    .headerRight{flex:1; padding-left:12px}
    .subject{font-size:18px; font-weight:800; color:#111; margin-bottom:4px}
    .docRow{display:flex; align-items:center; margin-bottom:2px}
    .docLabel{font-size:10px; font-weight:700; margin-right:6px}
    .docValue{font-size:10px}
    .compiledRow{display:flex; justify-content:space-between; margin:8px 0}
    .compiledItem{display:flex; align-items:center}
    .compiledLabel{font-weight:700; font-size:12px; margin-right:6px}
    .compiledValue{font-size:12px}
    .criteriaBox{border:1px solid #000; padding:10px; margin-bottom:10px}
    .criteriaTitle{font-weight:700; margin-bottom:6px}
    .criteriaRow{display:flex; margin-bottom:4px}
    .criteriaProduct{font-weight:700; width:140px}
    .criteriaText{flex:1}
    .tableOuter{border:1px solid #000; width:100%}
    .tableHeaderRow{display:flex; background:#eee; padding:6px; align-items:center; border-bottom:1px solid #000; min-height:40px}
    .colHeader{font-weight:700; text-align:center; font-size:10px; border-right:1px solid #000; padding:2px}
    .tableRow{display:flex; min-height:36px; align-items:stretch; border-bottom:1px solid #000}
    .cellInput{font-size:12px; text-align:center; border-right:1px solid #000; padding:2px}
    .signatures{margin-top:16px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;}
    .sigRow{display:flex; align-items:center; margin-bottom:8px}
    .sigLabel{font-weight:700; font-size:11px; width:220px}
    .sigInput{border-bottom:1px solid #000; flex:1; font-size:12px; min-height:20px; margin-left:8px}
  </style></head><body>

    <div class="safe">
      <div class="headerBlock">
        <div class="headerLeft">
          ${logoUri ? `<img src="${logoUri}" class="logoImage"/>` : `<img src="../renderer/assets/logo.jpeg" class="logoImage"/>`}
          <div class="bravoBrand">Bravo</div>
          <div class="companyName">BRAVO BRANDS LIMITED</div>
        </div>
        <div class="headerRight">
          <div class="subject">PRODUCT REJECTION FORM</div>
          <div class="docRow"><div class="docLabel">Version No:</div><div class="docValue">01</div></div>
          <div class="docRow"><div class="docLabel">Rev No:</div><div class="docValue">00</div></div>
        </div>
      </div>

      <div class="compiledRow">
        <div class="compiledItem">
          <div class="compiledLabel">Compiled By:</div>
          <div class="compiledValue">${compiledBySig ? renderSignature(compiledBySig,220,60) : escapeHtml(compiledByVal || 'Michael Zulu C.')}</div>
        </div>
        <div class="compiledItem">
          <div class="compiledLabel">Approved By:</div>
          <div class="compiledValue">${approvedBySig ? renderSignature(approvedBySig,220,60) : escapeHtml(approvedByVal || 'Hassani Ali')}</div>
        </div>
      </div>

      <div class="criteriaBox">
        <div class="criteriaTitle">Criteria for Rejecting the product</div>
        ${rejectionCriteria.map(c => `<div class="criteriaRow"><div class="criteriaProduct">${escapeHtml(c.product)}</div><div class="criteriaText">${escapeHtml(c.criteria)}</div></div>`).join('')}
      </div>

      <div style="width:100%">
        <div class="tableOuter">
          <div class="tableHeaderRow">
            <div style="width:40px" class="colHeader">S/N</div>
            <div style="width:220px" class="colHeader">Name of product Rejected</div>
            <div style="width:160px" class="colHeader">Suppliers Name</div>
            <div style="width:160px" class="colHeader">Invoice/Delivery No.</div>
            <div style="width:160px" class="colHeader">Product Batch No.</div>
            <div style="width:120px" class="colHeader">Expiry Date</div>
            <div style="flex:1; border-right:0" class="colHeader">Reason for rejecting the product</div>
          </div>
          ${rowsHtml}
        </div>
      </div>

      <div class="signatures">
        <div class="sigRow">
          <div class="sigLabel">Name & signature of stores Officer:</div>
          <div style="flex:1">${data.storeOfficerSign ? renderSignature(data.storeOfficerSign,240,80) : escapeHtml(storeOfficer)}</div>
        </div>

        <div class="sigRow">
          <div class="sigLabel">Verified by complex manager (Name & signature):</div>
          <div style="flex:1">${data.complexManagerSign ? renderSignature(data.complexManagerSign,240,80) : escapeHtml(complexManager)}</div>
        </div>

        <div class="sigRow">
          <div class="sigLabel">Approved by (Finance and stock controller):</div>
          <div style="flex:1">${data.financeStockControllerSign ? renderSignature(data.financeStockControllerSign,240,80) : escapeHtml(financeStockController)}</div>
        </div>

        <div class="sigRow">
          <div class="sigLabel">Rejected product collected by (Name & signature):</div>
          <div style="flex:1">${data.rejectedProductCollectorSign ? renderSignature(data.rejectedProductCollectorSign,240,80) : escapeHtml(rejectedProductCollector)}</div>
        </div>
      </div>

    </div>

  </body></html>`;
};
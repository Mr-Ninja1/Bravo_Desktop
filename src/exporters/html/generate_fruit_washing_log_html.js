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
    if (val.data && typeof val.data === 'string') return `data:image/png;base64,${val.data.replace(/\s+/g, '')}`;
    return null;
  }
  if (typeof val !== 'string') return null;
  const s = val.trim();
  if (!s) return null;
  if (s.startsWith('data:') || s.startsWith('http')) return s;
  const compact = s.replace(/\s+/g, '');
  if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const metadata = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : (p.rows || []);

  // Column Weights for Landscape Layout
  const COL = {
    DATE: 65,
    PRODUCT: 160,
    SAN_NAME: 120,
    CONC: 100,
    TIME: 75, // Applied to both start and end
    RINSE: 60,
    PERSON: 110,
    SIGN: 80
  };

  const totalWeight = COL.DATE + COL.PRODUCT + COL.SAN_NAME + COL.CONC + (COL.TIME * 2) + COL.RINSE + COL.PERSON + COL.SIGN;
  const colPct = (w) => ((w / totalWeight) * 100).toFixed(4) + '%';

  // Branding & Logo Logic
  let logo = (p.assets && (p.assets.logoDataUri || p.assets.logo)) ? (p.assets.logoDataUri || p.assets.logo) : (p.logo || p.logoDataUri || metadata.logoUrl || metadata.companyLogo || metadata.logo || null);
  if (!logo) {
    try {
      const fs = require('fs');
      const explicit = 'C:\\Users\\sikal\\Desktop\\Bravo_Desktop\\assets\\logo.jpeg';
      if (fs.existsSync(explicit)) {
        const data = fs.readFileSync(explicit);
        logo = `data:image/jpeg;base64,${data.toString('base64')}`;
      }
    } catch (e) {}
  }

  const sigHtml = (v, h = 32) => {
    const uri = resolveSignatureUri(v);
    if (uri) return `<img src="${uri}" style="max-height:${h}px; width:auto; object-fit:contain; display:block; mix-blend-mode:multiply;"/>`;
    return `<div style="font-size:8px; color:#94a3b8; font-style:italic;">${escapeHtml(v || '')}</div>`;
  };

  const rowData = rows.length ? rows : Array.from({ length: 12 }).map(() => ({}));

  const rowsHtml = rowData.map(r => `
    <div class="tr">
      <div class="td" style="width:${colPct(COL.DATE)}">${escapeHtml(r.date || '')}</div>
      <div class="td product-cell" style="width:${colPct(COL.PRODUCT)}">${escapeHtml(r.productWashed || r.product || '')}</div>
      <div class="td" style="width:${colPct(COL.SAN_NAME)}">${escapeHtml(r.sanitizerName || r.sanitizer || '')}</div>
      <div class="td" style="width:${colPct(COL.CONC)}">${escapeHtml(r.sanitizerConcentration || r.concentration || '')}</div>
      <div class="td" style="width:${colPct(COL.TIME)}">${escapeHtml(r.disinfectionStartTime || r.start || '')}</div>
      <div class="td" style="width:${colPct(COL.TIME)}">${escapeHtml(r.disinfectionEndTime || r.end || '')}</div>
      <div class="td" style="width:${colPct(COL.RINSE)}">${escapeHtml(r.rinsingDone || r.rinsing || '')}</div>
      <div class="td" style="width:${colPct(COL.PERSON)}">${escapeHtml(r.personWashing || r.person || '')}</div>
      <div class="td" style="width:${colPct(COL.SIGN)}">${sigHtml(r.supSign)}</div>
    </div>`).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8">
  <style>
    @page { size: A4 landscape; margin: 7mm; }
    body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; color: #1e293b; font-size: 9px; line-height: 1.2; }
    
    .headerSection { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #185a9d; padding-bottom: 8px; margin-bottom: 10px; }
    .branding { display: flex; align-items: center; gap: 12px; }
    .logo { height: 48px; width: auto; object-fit: contain; }
    .companyName { font-weight: 800; font-size: 16px; color: #185a9d; text-transform: uppercase; }
    
    .titleBlock { text-align: center; margin-bottom: 10px; }
    .title { font-weight: 900; font-size: 13px; text-transform: uppercase; color: #0f172a; }
    .meta { font-size: 8px; color: #64748b; margin-top: 2px; }

    .table { border: 1.5px solid #334155; display: flex; flex-direction: column; width: 100%; border-bottom: none; }
    .thead { display: flex; background: #f1f5f9; border-bottom: 1.5px solid #334155; align-items: stretch; }
    
    /* Fattened Rows */
    .tr { display: flex; border-bottom: 1px solid #cbd5e1; min-height: 42px; align-items: stretch; page-break-inside: avoid; }
    .tr:last-child { border-bottom: 1.5px solid #334155; }

    .th, .td {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      border-right: 1px solid #334155;
      padding: 6px;
      text-align: center;
    }
    .td:last-child, .th:last-child { border-right: none; }
    .th { font-weight: 800; font-size: 8px; color: #0f172a; text-transform: uppercase; }
    .product-cell { justify-content: flex-start; text-align: left; padding-left: 10px; font-weight: 600; }

    .footerSignatures { display: flex; gap: 20px; margin-top: 20px; }
    .sigBox { flex: 1; border-left: 3px solid #185a9d; padding-left: 10px; }
    .sigLabel { font-weight: 800; font-size: 9px; color: #185a9d; text-transform: uppercase; margin-bottom: 4px; }
  </style>
</head><body>
  <div class="headerSection">
    <div class="branding">
      ${logo ? `<img class="logo" src="${logo}"/>` : ''}
      <div>
        <div class="companyName">${escapeHtml(metadata.companyName || 'Bravo!')}</div>
        <div style="font-size:9px; color:#43cea2; font-weight:600;">Food Safety Inspections</div>
      </div>
    </div>
    <div style="text-align: right; font-weight: 700;">SITE: ${escapeHtml(metadata.site || p.site || '')}</div>
  </div>

  <div class="titleBlock">
    <div class="title">Fruit, Vegetable & Egg Washing + Sanitizing Log</div>
    <div class="meta">Doc No: ${escapeHtml(metadata.docNo || 'B-FS-003')} | Issue Date: ${escapeHtml(metadata.issueDate || '2025')}</div>
  </div>

  <div class="table">
    <div class="thead">
      <div class="th" style="width:${colPct(COL.DATE)}">Date</div>
      <div class="th" style="width:${colPct(COL.PRODUCT)}">Product</div>
      <div class="th" style="width:${colPct(COL.SAN_NAME)}">Sanitizer</div>
      <div class="th" style="width:${colPct(COL.CONC)}">Concentration</div>
      <div class="th" style="width:${colPct(COL.TIME)}">Start</div>
      <div class="th" style="width:${colPct(COL.TIME)}">End</div>
      <div class="th" style="width:${colPct(COL.RINSE)}">Rinsed?</div>
      <div class="th" style="width:${colPct(COL.PERSON)}">Operator</div>
      <div class="th" style="width:${colPct(COL.SIGN)}">Sup Sign</div>
    </div>
    ${rowsHtml}
  </div>

  <div class="footerSignatures">
    <div class="sigBox">
      <div class="sigLabel">Verified By</div>
      ${sigHtml(metadata.verifiedBySign || metadata.verification?.verifiedBySign, 40)}
    </div>
    <div class="sigBox">
      <div class="sigLabel">HSEQ Manager</div>
      ${sigHtml(metadata.hseqManagerSign || metadata.verification?.hseqManagerSign, 40)}
    </div>
    <div class="sigBox">
      <div class="sigLabel">Complex Manager</div>
      ${sigHtml(metadata.complexManagerSign || metadata.verification?.complexManagerSign, 40)}
    </div>
  </div>
</body></html>`;
};
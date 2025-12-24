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

const renderSignature = (val, w = 120, h = 40) => {
  const uri = resolveSignatureUri(val);
  if (uri) return `<img src="${uri}" style="max-height:${h}px; width:auto; display:block; mix-blend-mode: multiply;"/>`;
  return `<div style="font-size:9px; color:#64748b; font-style:italic;">${escapeHtml(val || '')}</div>`;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const metadata = p.metadata || {};
  const title = p.title || 'BOH PRODUCTS SHELF-LIFE INSPECTION CHECKLIST';
  const frequency = p.frequency || metadata.frequency || 'DAILY';
  const formData = Array.isArray(p.formData) ? p.formData : (p.rows || []);

  // Strict Weights for alignment
  const base = { name: 300, dateIn: 85, timeIn: 85, timeOut: 85, usedBy: 100, bakerChefName: 160, quantity: 70, sign: 80 };
  const totalWeight = Object.values(base).reduce((a, b) => a + b, 0);
  const colPct = (w) => ((w / totalWeight) * 100).toFixed(4) + '%';

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

  const rowsHtml = (formData.length ? formData : Array.from({ length: 12 }).map(() => ({}))).map((r) => `
    <div class="trow">
      <div class="td" style="width:${colPct(base.name)}; text-align:left; padding-left:10px; font-weight:600;">${escapeHtml(r.name || '')}</div>
      <div class="td" style="width:${colPct(base.dateIn)}">${escapeHtml(r.dateIn || '')}</div>
      <div class="td" style="width:${colPct(base.timeIn)}">${escapeHtml(r.timeIn || '')}</div>
      <div class="td" style="width:${colPct(base.timeOut)}">${escapeHtml(r.timeOut || '')}</div>
      <div class="td" style="width:${colPct(base.usedBy)}">${escapeHtml(r.usedBy || '')}</div>
      <div class="td" style="width:${colPct(base.bakerChefName)}">${escapeHtml(r.bakerChefName || '')}</div>
      <div class="td" style="width:${colPct(base.quantity)}">${escapeHtml(r.quantity || '')}</div>
      <div class="td" style="width:${colPct(base.sign)}; display:flex; justify-content:center; align-items:center;">${renderSignature(r.sign, 70, 36)}</div>
    </div>`).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8">
  <style>
    @page { size: A4 landscape; margin: 7mm; }
    body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; color: #1e293b; font-size: 9px; }
    
    .headerSection { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #185a9d; padding-bottom: 8px; margin-bottom: 10px; }
    .branding { display: flex; align-items: center; gap: 12px; }
    .logo { height: 48px; width: auto; object-fit: contain; }
    .companyName { font-size: 18px; font-weight: 800; color: #185a9d; text-transform: uppercase; }
    
    .titleBlock { text-align: center; margin-bottom: 12px; }
    .title { font-weight: 900; font-size: 13px; text-transform: uppercase; color: #0f172a; margin-bottom: 2px; }
    .frequency { font-size: 10px; font-weight: 700; color: #43cea2; text-transform: uppercase; }

    .tableContainer { border: 1.5px solid #334155; display: flex; flex-direction: column; width: 100%; border-bottom: none; }
    .thead { display: flex; background: #f1f5f9; border-bottom: 1.5px solid #334155; }
    
    /* Fix: Forced Alignment */
    .th, .td { 
      box-sizing: border-box; 
      border-right: 1px solid #334155; 
      flex-shrink: 0; 
      flex-grow: 0; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      overflow: hidden;
    }
    .th:last-child, .td:last-child { border-right: none; }

    .th { padding: 8px 4px; text-align: center; font-weight: 800; font-size: 8px; text-transform: uppercase; min-height: 35px; }
    .trow { display: flex; border-bottom: 1px solid #cbd5e1; min-height: 48px; align-items: stretch; page-break-inside: avoid; }
    .trow:last-child { border-bottom: 1.5px solid #334155; }
    .td { padding: 4px; text-align: center; }

    .verificationArea { display: flex; gap: 15px; margin-top: 20px; flex-wrap: wrap; }
    .sigBox { flex: 1; min-width: 160px; border-left: 3px solid #185a9d; padding-left: 10px; padding-bottom: 4px; }
    .sigLabel { font-weight: 800; font-size: 8px; color: #185a9d; text-transform: uppercase; margin-bottom: 4px; }
  </style>
</head><body>

  <div class="headerSection">
    <div class="branding">
      ${logo ? `<img class="logo" src="${logo}"/>` : ''}
      <div class="companyName">${escapeHtml(metadata.companyName || 'Bravo')}</div>
    </div>
    <div style="font-size: 8px; font-weight: 700; color: #64748b;">ISSUE DATE: ${escapeHtml(metadata.dateOfIssue || metadata.date || '2025')}</div>
  </div>

  <div class="titleBlock">
    <div class="title">${escapeHtml(title)}</div>
    <div class="frequency">FREQUENCY: ${escapeHtml(frequency)}</div>
  </div>

  <div class="tableContainer">
    <div class="thead">
      <div class="th" style="width:${colPct(base.name)}">ITEMS</div>
      <div class="th" style="width:${colPct(base.dateIn)}">DATE IN</div>
      <div class="th" style="width:${colPct(base.timeIn)}">TIME IN</div>
      <div class="th" style="width:${colPct(base.timeOut)}">TIME OUT</div>
      <div class="th" style="width:${colPct(base.usedBy)}">USED BY</div>
      <div class="th" style="width:${colPct(base.bakerChefName)}">BAKER/CHEFS NAME</div>
      <div class="th" style="width:${colPct(base.quantity)}">QUANTITY</div>
      <div class="th" style="width:${colPct(base.sign)}">SIGN</div>
    </div>
    ${rowsHtml}
  </div>

  <div class="verificationArea">
    <div class="sigBox">
      <div class="sigLabel">Date</div>
      <div style="font-weight:700; font-size:11px;">${escapeHtml(metadata.date || '—')}</div>
    </div>
    <div class="sigBox">
      <div class="sigLabel">HSEQ Manager</div>
      ${renderSignature(p.verification?.hseqManagerSign || p.verification?.hseqManager || metadata.hseqManager, 150, 45)}
    </div>
    <div class="sigBox">
      <div class="sigLabel">Complex Manager</div>
      ${renderSignature(p.verification?.complexManagerSign || p.verification?.complexManager || metadata.complexManager, 150, 45)}
    </div>
    <div class="sigBox">
      <div class="sigLabel">Baker / Chef Sign</div>
      ${renderSignature(p.verification?.bakerSign || p.verification?.baker || metadata.baker, 150, 45)}
    </div>
    <div class="sigBox">
      <div class="sigLabel">Verified By</div>
      ${renderSignature(p.verification?.verifiedBySign || p.verification?.verifiedBy || metadata.verifiedBy, 150, 45)}
    </div>
  </div>

</body></html>`;
};
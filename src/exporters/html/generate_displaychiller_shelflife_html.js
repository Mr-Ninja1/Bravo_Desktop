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
  const formData = Array.isArray(p.formData) ? p.formData : (p.rows || []);
  
  const title = p.title || 'DISPLAY CHILLER & FOH PRODUCTS SHELF-LIFE INSPECTION CHECKLIST';
  const frequency = p.frequency || 'DAILY';

  // Standardize on 12 rows to give the form professional weight
  const rowData = formData.length ? formData : Array.from({ length: 12 }).map(() => ({}));

  // Column Weight Definitions
  const COL_WEIGHTS = {
    ITEMS: 240,
    DATE_IN: 85,
    TIME_IN: 80,
    TIME_OUT: 80,
    USED_BY: 100,
    STAFF: 140,
    QTY: 70,
    SIGN: 95
  };

  const totalWeight = Object.values(COL_WEIGHTS).reduce((s, v) => s + v, 0);
  const colPct = (w) => ((w / totalWeight) * 100).toFixed(4) + '%';

  // Logo logic with top-left priority and local fallback
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

  const rowsHtml = rowData.map((r) => {
    return `
      <div class="tr">
        <div class="td area" style="width:${colPct(COL_WEIGHTS.ITEMS)}">${escapeHtml(r.item || '')}</div>
        <div class="td" style="width:${colPct(COL_WEIGHTS.DATE_IN)}">${escapeHtml(r.dateIn || '')}</div>
        <div class="td" style="width:${colPct(COL_WEIGHTS.TIME_IN)}">${escapeHtml(r.timeIn || '')}</div>
        <div class="td" style="width:${colPct(COL_WEIGHTS.TIME_OUT)}">${escapeHtml(r.timeOut || '')}</div>
        <div class="td" style="width:${colPct(COL_WEIGHTS.USED_BY)}">${escapeHtml(r.usedBy || '')}</div>
        <div class="td" style="width:${colPct(COL_WEIGHTS.STAFF)}">${escapeHtml(r.staffName || r.bakerName || '')}</div>
        <div class="td" style="width:${colPct(COL_WEIGHTS.QTY)}">${escapeHtml(r.quantity || '')}</div>
        <div class="td" style="width:${colPct(COL_WEIGHTS.SIGN)}">${sigHtml(r.sign)}</div>
      </div>`;
  }).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8">
  <style>
    @page { size: A4 landscape; margin: 7mm; }
    body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; color: #1e293b; background: #fff; font-size: 9px; line-height: 1.2; }
    
    .headerSection { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #185a9d; padding-bottom: 6px; margin-bottom: 8px; }
    .branding { display: flex; align-items: center; gap: 12px; }
    .logo { height: 42px; width: auto; object-fit: contain; }
    .companyName { font-weight: 800; font-size: 14px; color: #185a9d; text-transform: uppercase; }
    
    .titleBlock { text-align: center; margin: 10px 0; }
    .title { font-weight: 900; font-size: 12px; text-transform: uppercase; color: #0f172a; margin-bottom: 2px; }
    .frequency { font-weight: 700; color: #64748b; font-size: 9px; }

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
    .area { justify-content: flex-start; text-align: left; padding-left: 10px; font-weight: 600; }

    .footer { margin-top: 15px; display: flex; gap: 30px; }
    .sigColumn { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .sigField { border-left: 3px solid #185a9d; padding-left: 10px; }
    .sigLabel { font-weight: 800; font-size: 9px; color: #185a9d; text-transform: uppercase; margin-bottom: 4px; }
  </style>
</head><body>
  <div class="card">
    <div class="headerSection">
      <div class="branding">
        ${logo ? `<img class="logo" src="${logo}" alt="logo"/>` : ''}
        <div class="companyName">${escapeHtml(metadata.companyName || 'Bravo')}</div>
      </div>
      <div style="font-weight:700; color: #475569;">Date: ${escapeHtml(p.date || '________________')}</div>
    </div>

    <div class="titleBlock">
      <div class="title">${escapeHtml(title)}</div>
      <div class="frequency">FREQUENCY: ${escapeHtml(frequency)}</div>
    </div>

    <div class="table">
      <div class="thead">
        <div class="th" style="width:${colPct(COL_WEIGHTS.ITEMS)}">Items</div>
        <div class="th" style="width:${colPct(COL_WEIGHTS.DATE_IN)}">Date In</div>
        <div class="th" style="width:${colPct(COL_WEIGHTS.TIME_IN)}">Time In</div>
        <div class="th" style="width:${colPct(COL_WEIGHTS.TIME_OUT)}">Time Out</div>
        <div class="th" style="width:${colPct(COL_WEIGHTS.USED_BY)}">Used By</div>
        <div class="th" style="width:${colPct(COL_WEIGHTS.STAFF)}">Baker/Chef/Barista Name</div>
        <div class="th" style="width:${colPct(COL_WEIGHTS.QTY)}">Qty</div>
        <div class="th" style="width:${colPct(COL_WEIGHTS.SIGN)}">Sign</div>
      </div>
      ${rowsHtml}
    </div>

    <div class="footer">
      <div class="sigColumn">
        <div class="sigField">
          <div class="sigLabel">Verified By:</div>
          ${sigHtml(p.verifiedBySign || p.verifiedBy, 40)}
        </div>
      </div>
      <div class="sigColumn">
        <div class="sigField">
          <div class="sigLabel">Barista Signature:</div>
          ${sigHtml(p.baristaSign, 40)}
        </div>
      </div>
    </div>
  </div>
</body></html>`;
};
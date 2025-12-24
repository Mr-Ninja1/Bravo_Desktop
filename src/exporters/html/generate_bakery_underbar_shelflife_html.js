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
  const data = Array.isArray(p.formData) ? p.formData : (p.rows || []);

  // Standardize on 15 rows to give the form weight if data is sparse
  const rowData = data.length ? data : Array.from({ length: 15 }).map(() => ({}));

  // Column Weight Definitions for proportional scaling
  const COL_WEIGHTS = {
    name: 180,
    dateIn: 90,
    timeIn: 80,
    timeOut: 80,
    usedBy: 110,
    chefName: 150,
    quantity: 80,
    chefSign: 100
  };

  const totalWeight = Object.values(COL_WEIGHTS).reduce((s, v) => s + v, 0);
  const colPct = (w) => ((w / totalWeight) * 100).toFixed(4) + '%';

  let logo = (p.assets && (p.assets.logoDataUri || p.assets.logo)) ? (p.assets.logoDataUri || p.assets.logo) : (p.logo || p.logoDataUri || metadata.logoUrl || metadata.companyLogo || metadata.logo || null);

  const sigHtml = (v, h = 28) => {
    const uri = resolveSignatureUri(v);
    if (uri) return `<img src="${uri}" style="max-height:${h}px; width:auto; object-fit:contain; display:block; mix-blend-mode:multiply;"/>`;
    return `<div style="font-size:8px; color:#94a3b8;">${escapeHtml(v || '')}</div>`;
  };

  const rowsHtml = rowData.map((row) => {
    return `
      <div class="tr">
        <div class="td area" style="width:${colPct(COL_WEIGHTS.name)}">${escapeHtml(row.name || '')}</div>
        <div class="td" style="width:${colPct(COL_WEIGHTS.dateIn)}">${escapeHtml(row.dateIn || '')}</div>
        <div class="td" style="width:${colPct(COL_WEIGHTS.timeIn)}">${escapeHtml(row.timeIn || '')}</div>
        <div class="td" style="width:${colPct(COL_WEIGHTS.timeOut)}">${escapeHtml(row.timeOut || '')}</div>
        <div class="td" style="width:${colPct(COL_WEIGHTS.usedBy)}">${escapeHtml(row.usedBy || '')}</div>
        <div class="td" style="width:${colPct(COL_WEIGHTS.chefName)}">${escapeHtml(row.chefName || '')}</div>
        <div class="td" style="width:${colPct(COL_WEIGHTS.quantity)}">${escapeHtml(row.quantity || '')}</div>
        <div class="td" style="width:${colPct(COL_WEIGHTS.chefSign)}">${sigHtml(row.chefSign)}</div>
      </div>`;
  }).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8">
  <style>
    @page { size: A4 landscape; margin: 8mm; }
    body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; color: #111; background: #fff; font-size: 9px; line-height: 1.2; }
    
    /* Professional Header */
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #185a9d; padding-bottom: 6px; margin-bottom: 10px; }
    .logo { height: 38px; width: auto; }
    .company { font-weight: 800; font-size: 13px; color: #185a9d; }
    .title { text-align: center; font-weight: 900; font-size: 12px; text-transform: uppercase; margin: 12px 0; color: #1e293b; }

    /* Table System */
    .table { border: 1.5px solid #334155; display: flex; flex-direction: column; width: 100%; border-bottom: none; }
    .thead { display: flex; background: #f1f5f9; border-bottom: 1.5px solid #334155; align-items: stretch; }
    .tr { display: flex; border-bottom: 1px solid #94a3b8; min-height: 36px; align-items: stretch; page-break-inside: avoid; }
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
    .th:last-child, .td:last-child { border-right: none; }

    .th { font-weight: 800; font-size: 8.5px; color: #0f172a; text-transform: uppercase; }
    .area { justify-content: flex-start; text-align: left; padding-left: 10px; font-weight: 600; }

    .footer-note { margin-top: 10px; font-size: 8px; color: #64748b; font-style: italic; text-align: right; }
  </style>
</head><body>
  <div class="header">
    <div style="display:flex; align-items:center; gap:12px;">
      ${logo ? `<img class="logo" src="${logo}"/>` : ''}
      <div class="company">${escapeHtml(metadata.companyName || 'Bravo')}</div>
    </div>
    <div style="font-weight:700;">Location: ${escapeHtml(metadata.location || '—')}</div>
  </div>

  <div class="title">Underbar Chiller Shelf-Life Inspection Checklist</div>

  <div class="table">
    <div class="thead">
      <div class="th" style="width:${colPct(COL_WEIGHTS.name)}">Items</div>
      <div class="th" style="width:${colPct(COL_WEIGHTS.dateIn)}">Date In</div>
      <div class="th" style="width:${colPct(COL_WEIGHTS.timeIn)}">Time In</div>
      <div class="th" style="width:${colPct(COL_WEIGHTS.timeOut)}">Time Out</div>
      <div class="th" style="width:${colPct(COL_WEIGHTS.usedBy)}">Used By</div>
      <div class="th" style="width:${colPct(COL_WEIGHTS.chefName)}">Chef's Name</div>
      <div class="th" style="width:${colPct(COL_WEIGHTS.quantity)}">Quantity</div>
      <div class="th" style="width:${colPct(COL_WEIGHTS.chefSign)}">Chef Sign</div>
    </div>
    ${rowsHtml}
  </div>

  <div class="footer-note">
    Checked By: __________________________ &nbsp;&nbsp;&nbsp; Date: __________________________
  </div>
</body></html>`;
};
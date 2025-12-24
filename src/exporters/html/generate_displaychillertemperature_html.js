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

const ordinal = (n) => {
  const num = Number(n) || 0;
  if (num === 0) return '';
  const rem100 = num % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${num}th`;
  switch (num % 10) {
    case 1: return `${num}st`;
    case 2: return `${num}nd`;
    case 3: return `${num}rd`;
    default: return `${num}th`;
  }
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const metadata = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : (p.rows || []);

  // Proportional Column Weights for A4 Landscape
  const COL = {
    DATE: 45,
    TEMP: 50,
    SIGN: 85,
    ACTION: 200,
    MANAGER: 105
  };

  const dayGroupWidth = COL.TEMP + COL.SIGN;
  const totalWeight = COL.DATE + (dayGroupWidth * 3) + COL.ACTION + (COL.MANAGER * 4);
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

  const sigHtml = (v, h = 28) => {
    const uri = resolveSignatureUri(v);
    if (uri) return `<img src="${uri}" style="max-height:${h}px; width:auto; object-fit:contain; display:block; mix-blend-mode:multiply;"/>`;
    return `<div style="font-size:7px; color:#94a3b8; font-style:italic;">${escapeHtml(v || '')}</div>`;
  };

  const rowsToRender = rows.length ? rows : Array.from({ length: 31 }).map((_, i) => ({ day: i + 1 }));

  const rowsHtml = rowsToRender.map((r, i) => {
    const dayVal = r.day || r.date || (i + 1);
    return `
      <div class="tr">
        <div class="td date-cell" style="width:${colPct(COL.DATE)}">${escapeHtml(ordinal(dayVal))}</div>
        <div class="td" style="width:${colPct(COL.TEMP)}">${escapeHtml(r.tempMorning || '')}</div>
        <div class="td" style="width:${colPct(COL.SIGN)}">${sigHtml(r.staffSignMorning)}</div>
        <div class="td" style="width:${colPct(COL.TEMP)}">${escapeHtml(r.tempAfternoon || '')}</div>
        <div class="td" style="width:${colPct(COL.SIGN)}">${sigHtml(r.staffSignAfternoon)}</div>
        <div class="td" style="width:${colPct(COL.TEMP)}">${escapeHtml(r.tempEvening || '')}</div>
        <div class="td" style="width:${colPct(COL.SIGN)}">${sigHtml(r.staffSignEvening)}</div>
        <div class="td action-cell" style="width:${colPct(COL.ACTION)}">${escapeHtml(r.outOfSpecAction || '')}</div>
        <div class="td" style="width:${colPct(COL.MANAGER)}">${sigHtml(r.supNameSign || r.supName)}</div>
        <div class="td" style="width:${colPct(COL.MANAGER)}">${sigHtml(r.complexManagerSign)}</div>
        <div class="td" style="width:${colPct(COL.MANAGER)}">${sigHtml(r.fscSign)}</div>
        <div class="td" style="width:${colPct(COL.MANAGER)}">${sigHtml(r.hseqManagerSign)}</div>
      </div>`;
  }).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8">
  <style>
    @page { size: A4 landscape; margin: 6mm; }
    body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; color: #1e293b; background: #fff; font-size: 8px; line-height: 1.1; }
    
    .headerSection { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #185a9d; padding-bottom: 6px; margin-bottom: 8px; }
    .branding { display: flex; align-items: center; gap: 12px; }
    .logo { height: 48px; width: auto; object-fit: contain; }
    .companyName { font-weight: 800; font-size: 15px; color: #185a9d; text-transform: uppercase; }
    
    .title { text-align: center; font-weight: 900; font-size: 11px; text-transform: uppercase; margin: 8px 0; color: #0f172a; letter-spacing: 0.5px; }

    .table { border: 1.5px solid #334155; display: flex; flex-direction: column; width: 100%; border-bottom: none; }
    .thead-group { display: flex; background: #f1f5f9; border-bottom: 1.5px solid #334155; align-items: stretch; }
    .thead-detail { display: flex; background: #f8fafc; border-bottom: 1px solid #334155; align-items: stretch; }
    
    /* Fattened Rows */
    .tr { display: flex; border-bottom: 1px solid #cbd5e1; min-height: 36px; align-items: stretch; page-break-inside: avoid; }
    .tr:last-child { border-bottom: 1.5px solid #334155; }

    .th, .td {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      border-right: 1px solid #334155;
      padding: 4px;
      text-align: center;
    }
    .td:last-child, .th:last-child { border-right: none; }

    .th { font-weight: 800; font-size: 7.5px; color: #0f172a; text-transform: uppercase; }
    .date-cell { background: #f8fafc; font-weight: 700; color: #185a9d; border-right: 1.5px solid #334155; }
    .action-cell { justify-content: flex-start; text-align: left; font-size: 7px; padding-left: 8px; line-height: 1.2; }

    .footer { margin-top: 10px; font-size: 8px; color: #64748b; font-style: italic; display: flex; justify-content: space-between; }
  </style>
</head><body>
  <div class="card">
    <div class="headerSection">
      <div class="branding">
        ${logo ? `<img class="logo" src="${logo}" alt="logo"/>` : ''}
        <div class="companyName">${escapeHtml(metadata.companyName || 'Bravo')}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-weight:700; color: #475569; font-size: 10px;">${escapeHtml(metadata.monthYear || 'Monthly Temperature Log')}</div>
        <div style="margin-top:6px; font-size:10px; color:#0f172a;">
          <div style="font-size:10px; color:#64748b; font-weight:700;">COMPILED BY:</div>
          <div style="font-weight:700;">${escapeHtml(metadata.compiledBy || metadata.compiled_by || '')}</div>
          <div style="height:6px;"></div>
          <div style="font-size:10px; color:#64748b; font-weight:700;">APPROVED BY:</div>
          <div style="font-weight:700;">${escapeHtml(metadata.approvedBy || metadata.approved_by || '')}</div>
        </div>
      </div>
    </div>

    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
      <div style="flex:1; text-align:left; font-weight:700; color:#374151">Name of display chiller: ${escapeHtml(metadata.displayChillerName || metadata.chillerName || metadata.displayChiller || '')}</div>
      <div style="display:flex; gap:16px; align-items:center; font-size:12px; color:#475569;">
        <div><div style="font-size:9px; color:#64748b; font-weight:700;">Month:</div><div style="font-weight:700">${escapeHtml(metadata.month || metadata.monthName || '')}</div></div>
        <div><div style="font-size:9px; color:#64748b; font-weight:700;">Year:</div><div style="font-weight:700">${escapeHtml(metadata.year || metadata.yearApproved || '')}</div></div>
        <div><div style="font-size:9px; color:#64748b; font-weight:700;">Location:</div><div style="font-weight:700">${escapeHtml(metadata.location || metadata.site || '')}</div></div>
      </div>
    </div>

    <div class="table">
      <div class="thead-group">
        <div class="th" style="width:${colPct(COL.DATE)}">DATE</div>
        <div class="th" style="width:${colPct(dayGroupWidth)}">MORNING</div>
        <div class="th" style="width:${colPct(dayGroupWidth)}">AFTERNOON</div>
        <div class="th" style="width:${colPct(dayGroupWidth)}">EVENING</div>
        <div class="th" style="width:${colPct(COL.ACTION)}">CORRECTIVE ACTION (If out of spec)</div>
        <div class="th" style="width:${colPct(COL.MANAGER)}">SUP SIGN</div>
        <div class="th" style="width:${colPct(COL.MANAGER)}">COMPLEX MGR</div>
        <div class="th" style="width:${colPct(COL.MANAGER)}">FSC SIGN</div>
        <div class="th" style="width:${colPct(COL.MANAGER)}">HSEQ MGR</div>
      </div>
      
      <div class="thead-detail">
        <div class="th" style="width:${colPct(COL.DATE)}">#</div>
        <div class="th" style="width:${colPct(COL.TEMP)}">TEMP</div>
        <div class="th" style="width:${colPct(COL.SIGN)}">SIGN</div>
        <div class="th" style="width:${colPct(COL.TEMP)}">TEMP</div>
        <div class="th" style="width:${colPct(COL.SIGN)}">SIGN</div>
        <div class="th" style="width:${colPct(COL.TEMP)}">TEMP</div>
        <div class="th" style="width:${colPct(COL.SIGN)}">SIGN</div>
        <div class="th" style="width:${colPct(COL.ACTION)}"></div>
        <div class="th" style="width:${colPct(COL.MANAGER)}"></div>
        <div class="th" style="width:${colPct(COL.MANAGER)}"></div>
        <div class="th" style="width:${colPct(COL.MANAGER)}"></div>
        <div class="th" style="width:${colPct(COL.MANAGER)}"></div>
      </div>

      ${rowsHtml}
    </div>

    <div class="footer">
      <div>Target Temperature: 1°C — 5°C</div>
      <div>Clean and sanitize temperature probes before and after each use.</div>
    </div>
  </div>
</body></html>`;
};
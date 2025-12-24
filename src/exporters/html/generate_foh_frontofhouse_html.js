const escapeHtml = (s) => String(s === null || s === undefined ? '' : s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

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
    if (val.data && typeof val.data === 'string') return `data:image/png;base64,${val.data.replace(/\s+/g,'')}`;
    return null;
  }
  if (typeof val !== 'string') return null;
  const s = val.trim(); if (!s) return null;
  if (s.startsWith('data:') || s.startsWith('http')) return s;
  const compact = s.replace(/\s+/g,'');
  if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const metadata = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : [];

  const DEFAULT_DAYS = p.weekDays || p.timeSlots || ['Sun','Mon','Tue','Wed','Thurs','Fri','Sat'];
  const days = Array.isArray(DEFAULT_DAYS) && DEFAULT_DAYS.length ? DEFAULT_DAYS : ['Sun','Mon','Tue','Wed','Thurs','Fri','Sat'];

  // Adjusted for Landscape: Total width is now ~100% of the horizontal spread
  const widths = { AREA: '25%', FREQUENCY: '10%', DAY_GROUP: '9%' };

  let logo = (p.assets && (p.assets.logoDataUri || p.assets.logo)) ? (p.assets.logoDataUri || p.assets.logo) : (p.logo || p.logoDataUri || metadata.logoUrl || metadata.companyLogo || metadata.logo || null);
  if (!logo) {
    try {
      const fs = require('fs'); const path = require('path');
      const candidates = [
        path.join(process.cwd(),'assets','logo.jpeg'),
        path.join(process.cwd(),'assets','logo.png'),
        'C:\\Users\\sikal\\Desktop\\Bravo_Desktop\\assets\\logo.jpeg'
      ];
      for (const pth of candidates) if (fs.existsSync(pth)) { const buf = fs.readFileSync(pth); const ext = path.extname(pth).replace('.',''); const mime = ext==='png' ? 'image/png' : 'image/jpeg'; logo = `data:${mime};base64,${buf.toString('base64')}`; break; }
    } catch (e) {}
  }

  const rowData = rows.length ? rows : Array.from({ length: 12 }).map(() => ({}));

  const rowsHtml = rowData.map((row, idx) => {
    const checks = row.checks || {};
    const cells = days.map(d => {
      const cell = checks[d] || {};
      const tick = cell.checked ? '✓' : '';
      const cleanedBy = escapeHtml(cell.cleanedBy || '');
      return `<td style="width:${widths.DAY_GROUP}"><div class="cellInner"><div class="tick">${tick}</div><div class="cleanedBy">${cleanedBy}</div></div></td>`;
    }).join('\n');
    return `
      <tr>
        <td class="areaCell" style="width:${widths.AREA}">${escapeHtml(row.name || '')}</td>
        <td class="freqCell" style="width:${widths.FREQUENCY}">${escapeHtml(row.frequency || '')}</td>
        ${cells}
      </tr>`;
  }).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:6mm}
    body{font-family: Inter, Arial, Helvetica, sans-serif; font-size:11px; color:#111; margin:0; padding:8px}
    .header{display:flex; align-items:center; gap:12px}
    .logo{width:50px; height:50px; object-fit:contain}
    .companyName{font-size:20px; font-weight:900; color:#185a9d}
    .title{font-size:16px; font-weight:900; text-align:center; margin-top:4px; text-transform: uppercase;}
    .metaInline{display:flex; gap:12px; margin-top:8px; padding:8px; border:1px solid #e6e6e6; background:#fafafa; border-radius:4px}
    .metaCol{padding:4px; border-right: 1px solid #ddd; flex: 1;}
    .metaCol:last-child{border-right:none; flex: 2;}
    table{width:100%; border-collapse:collapse; margin-top:12px; table-layout: fixed;}
    thead th{background:#f3f4f6; border:1px solid #333; padding:8px 4px; font-weight:700; text-align:center; font-size: 10px;}
    tbody td{border:1px solid #333; vertical-align:middle; padding:6px 4px; height: 38px;}
    .dayGroupHeader{display:flex; flex-direction:column; align-items:center}
    .cellInner{display:flex; flex-direction:column; align-items:center; justify-content:center}
    .cellInner .tick{font-size:16px; font-weight: bold; color: #059669;}
    .cellInner .cleanedBy{font-size:9px; margin-top:2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;}
    .areaCell{padding-left:8px; text-align:left; font-weight: 600;}
    .freqCell{text-align:center; background: #fcfcfc;}
  </style></head><body>

    <div class="header">
      ${logo?`<img src="${logo}" class="logo"/>`:`<div style="width:50px;height:50px"></div>`}
      <div style="flex:1; text-align:left"><div class="companyName">Bravo</div></div>
    </div>

    <div class="title">FRONT OF HOUSE CLEANING CHECKLIST</div>

    <div class="metaInline">
      <div class="metaCol"><div style="font-weight:700; font-size: 9px; color: #666;">LOCATION:</div><div>${escapeHtml(metadata.location || p.location || '')}</div></div>
      <div class="metaCol"><div style="font-weight:700; font-size: 9px; color: #666;">WEEK:</div><div>${escapeHtml(metadata.week || p.week || '')}</div></div>
      <div class="metaCol"><div style="font-weight:700; font-size: 9px; color: #666;">MONTH:</div><div>${escapeHtml(metadata.month || p.month || '')}</div></div>
      <div class="metaCol"><div style="font-weight:700; font-size: 9px; color: #666;">YEAR:</div><div>${escapeHtml(metadata.year || p.year || '')}</div></div>
      <div class="metaCol"><div style="font-weight:700; font-size: 9px; color: #666;">VERIFIED BY HSEQ:</div>
        <div style="margin-top:2px">${ resolveSignatureUri(metadata.hseqManagerSign || metadata.hseqManager || '') ? `<img src="${escapeHtml(resolveSignatureUri(metadata.hseqManagerSign || metadata.hseqManager || ''))}" style="max-height:45px; object-fit:contain; mix-blend-mode: multiply;"/>` : escapeHtml(metadata.hseqManager || '') }</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:${widths.AREA}">Area to be cleaned</th>
          <th style="width:${widths.FREQUENCY}">Freq.</th>
          ${days.map(d=>`<th style="width:${widths.DAY_GROUP}"><div class="dayGroupHeader"><div>${escapeHtml(d)}</div><div style="font-size:8px; font-weight:normal;">Cleaned BY</div></div></th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

  </body></html>`;
};
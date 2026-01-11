const fs = require('fs');
const path = require('path');

const escapeHtml = (s) => String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
  const s = String(val || '');
  if (s.startsWith('data:')) return s;
  const compact = s.replace(/\s+/g, '');
  if (compact.length > 100) return `data:image/png;base64,${compact}`;
  return null;
};

const renderSig = (v, w = 200, h = 64) => {
  const uri = resolveSignatureUri(v);
  if (!uri) return '';
  return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block; object-fit:contain;"/>`;
};

const getLogoDataUri = (p) => {
  if (!p) return null;
  if (p.assets && p.assets.logoDataUri) return p.assets.logoDataUri;
  const candidates = [
    path.join(process.cwd(), 'renderer', 'assets', 'logo.jpeg'),
    path.join(process.cwd(), 'assets', 'logo.jpeg'),
    path.join(process.cwd(), 'assets', 'logo.jpeg')
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) {
        const b = fs.readFileSync(c);
        const mime = path.extname(c).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
        return `data:${mime};base64,${b.toString('base64')}`;
      }
    } catch (e) {}
  }
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const meta = p.metadata || {};

  const site = p.site || (p.formData && p.formData.site) || '';
  const location = p.location || (p.formData && p.formData.location) || '';
  const supervisorName = p.supervisorName || p.supervisor || (p.formData && (p.formData.supervisorName || p.formData.supervisor)) || '';
  const supervisorSign = p.supervisorSign || (p.formData && p.formData.supervisorSign) || (meta && meta.supervisorSign) || '';
  const logEntries = (p.formData && p.formData.logEntries) || p.logEntries || [];
  const specification = p.specification || (p.formData && p.formData.specification) || '';
  const logoData = getLogoDataUri(p);

  const hints = p.layoutHints || (p.formData && p.formData.layoutHints) || { NAME: 220, PREP: 240, DATE: 120, TIME: 100, DISPOSE: 120 };
  const wName = hints.NAME || 220;
  const wPrep = hints.PREP || 240;
  const wDate = hints.DATE || 120;
  const wTime = hints.TIME || 100;
  const wDispose = hints.DISPOSE || 120;

  const rows = logEntries.length ? logEntries : Array.from({ length: 8 }).map(() => ({}));

  const rowsHtml = rows.map(row => `
    <tr style="min-height:36px">
      <td style="padding:6px; border:1px solid #000; width:${wName}px; text-align:left">${escapeHtml(row.name || '')}</td>
      <td style="padding:6px; border:1px solid #000; width:${wPrep}px; text-align:left">${escapeHtml(row.preparationMethod || '')}</td>
      <td style="padding:6px; border:1px solid #000; width:${wDate}px; text-align:center">${escapeHtml(row.dateCollected || '')}</td>
      <td style="padding:6px; border:1px solid #000; width:${wTime}px; text-align:center">${escapeHtml(row.timeCollected || '')}</td>
      <td style="padding:6px; border:1px solid #000; width:${wDispose}px; text-align:center">${escapeHtml(row.dateDisposal || '')}</td>
    </tr>
  `).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:8mm}
    *{box-sizing:border-box}
    body{font-family:Arial, Helvetica, sans-serif; margin:0; color:#111}
    .wrap{width:1100px; margin:0 auto; padding:12px}
    .header{display:flex; align-items:flex-start; justify-content:space-between; border-bottom:1px solid #000; padding-bottom:8px; margin-bottom:8px}
    .logo{width:84px; height:44px; object-fit:contain}
    .company{font-weight:700}
    .title{font-weight:800; font-size:16px; text-align:center}
    .metaRow{display:flex; justify-content:space-between; margin-bottom:8px}
    .specBox{border:1px solid #000; padding:8px; margin-bottom:8px}
    table{width:100%; border-collapse:collapse; border:1px solid #000}
    .thead{background:#eee}
    th{padding:8px; border-right:1px solid #000; text-align:center; font-weight:700}
    td{padding:6px; border-right:1px solid #000; font-size:12px}
    .empty{color:#666; font-style:italic; padding:12px}
  </style></head><body>

  <div class="wrap">
    <div class="header">
      <div style="display:flex; align-items:center; gap:10px">
        ${logoData ? `<img src="${logoData}" class="logo"/>` : `<div style="width:84px;height:44px;background:#eee"></div>`}
        <div style="display:flex; flex-direction:column">
          <div class="company">${escapeHtml(p.companyName || 'BRAVO BRANDS LIMITED')}</div>
        </div>
      </div>
      <div style="text-align:center" class="title">FOOD SAMPLES COLLECTION LOG</div>
      <div style="text-align:right">Doc No: ${escapeHtml(p.docNo || 'BBN-SHEQ-F-B.1')}<br/>Issue Date: ${escapeHtml(p.issueDate || '')}</div>
    </div>

    <div class="metaRow">
      <div>Site: <strong>${escapeHtml(site)}</strong></div>
      <div>Location: <strong>${escapeHtml(location)}</strong></div>
      <div style="text-align:right">Supervisor: <strong>${escapeHtml(supervisorName)}</strong><div style="margin-top:6px">${renderSig(supervisorSign)}</div></div>
    </div>

    ${specification ? `<div class="specBox">${escapeHtml(specification)}</div>` : ''}

    <table>
      <thead class="thead">
        <tr>
          <th style="width:${wName}px">Name of Food Sample</th>
          <th style="width:${wPrep}px">Preparation Method</th>
          <th style="width:${wDate}px">Date Collected</th>
          <th style="width:${wTime}px">Time Collected</th>
          <th style="width:${wDispose}px">Date of Disposal</th>
        </tr>
      </thead>
      <tbody>
        ${rows.length === 0 ? `<tr><td colspan="5" class="empty">No samples recorded.</td></tr>` : rowsHtml}
      </tbody>
    </table>

  </div>

</body></html>`;
};

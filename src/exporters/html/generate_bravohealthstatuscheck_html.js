const fs = require('fs');
const path = require('path');

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
    if (val.data && typeof val.data === 'string') return val.data.startsWith('data:') ? val.data : `data:image/png;base64,${val.data.replace(/\s+/g,'')}`;
    if (val.signature && typeof val.signature === 'string') return val.signature.startsWith('data:') ? val.signature : `data:image/png;base64,${val.signature.replace(/\s+/g,'')}`;
    return null;
  }
  if (typeof val !== 'string') return null;
  const s = val.trim(); if (!s) return null;
  if (s.startsWith('data:') || /^https?:\/\//i.test(s) || s.startsWith('/')) return s;
  const compact = s.replace(/\s+/g,'');
  if (compact.length > 200 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
};

const renderMaybeSignature = (v, w = 220, h = 60) => {
  const uri = resolveSignatureUri(v);
  if (uri) return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block;"/>`;
  return `<div style="min-width:${w}px; min-height:${h}px; display:flex; align-items:center; justify-content:center; color:#333">${escapeHtml(v || '')}</div>`;
};

const getLogoDataUri = (p) => {
  if (!p) return null;
  if (p.assets && p.assets.logoDataUri) return p.assets.logoDataUri;
  const candidates = [
    path.join(process.cwd(), 'renderer', 'assets', 'logo.jpeg'),
    path.join(process.cwd(), 'renderer', 'src', 'assets', 'logo.jpeg'),
    path.join(process.cwd(), 'assets', 'logo.jpeg'),
    path.join(process.cwd(), 'assets', 'logo.jpg'),
    path.join(process.cwd(), 'renderer', 'assets', 'logo.jpg')
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) {
        const b = fs.readFileSync(c);
        const ext = path.extname(c).toLowerCase();
        const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
        return `data:${mime};base64,${b.toString('base64')}`;
      }
    } catch (e) {
      /* ignore */
    }
  }
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const metadata = p.metadata || {};
  const layout = p.layoutHints || {};
  const nameW = Number(layout.name || 140);
  const positionW = Number(layout.position || 100);
  const dayCol = Number(layout.dayCol || 140);
  const fitWidth = Number(layout.fitWidth || 40);
  const commentWidth = Number(layout.commentWidth || (dayCol - fitWidth));
  const daysOfWeek = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const rows = Array.isArray(p.formData) ? p.formData : (p.rows || []);
  const tableWidth = p._tableWidth || (nameW + positionW + (7 * dayCol));

  const rowsHtml = (rows.length ? rows : []).map(r => {
    const weekly = r.weeklyChecks || {};
    const name = escapeHtml(r.name || '');
    const position = escapeHtml(r.position || '');
    const daysHtml = daysOfWeek.map(d => {
      const cell = weekly[d] || { fit: null, comment: '' };
      const fit = cell.fit === true ? '✓' : (cell.fit === false ? 'X' : '');
      return `<div style="display:flex">` +
        `<div style="width:${fitWidth}px; padding:6px; text-align:center">${escapeHtml(fit)}</div>` +
        `<div style="width:${commentWidth}px; padding:6px; text-align:left">${escapeHtml(cell.comment || '')}</div>` +
      `</div>`;
    }).join('');
    return `<div class="row" style="display:flex; min-width:${tableWidth}px; border-bottom:1px solid #000;">` +
      `<div class="cell" style="width:${nameW}px; padding:6px; border-right:1px solid #000;">${name}</div>` +
      `<div class="cell" style="width:${positionW}px; padding:6px; border-right:1px solid #000;">${position}</div>` +
      `${daysHtml}` +
      `</div>`;
  }).join('\n');

  const logo = getLogoDataUri(p);

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:6mm}
    body{font-family:Inter, Arial, sans-serif; margin:0; padding:12px; color:#111}
    .docHeader{display:flex; justify-content:space-between; border:1px solid #000; padding:6px; margin-bottom:8px}
    .logo{width:48px; height:36px}
    .formTitle{font-weight:800; text-align:center; font-size:14px; margin:8px 0}
    .metaBox{border:1px solid #ccc; padding:6px}
    .note{font-size:10px; margin-top:8px}
    .table{border:1px solid #000; overflow:auto}
    .headerRow{display:flex; background:#eee; border-bottom:1px solid #000}
    .headerCell{font-weight:700; padding:6px; border-right:1px solid #000; text-align:center}
    .dayCol{border-right:1px solid #000}
  </style></head><body>

    <div class="docHeader">
      <div style="display:flex; align-items:center; gap:12px">${logo ? `<img class="logo" src="${logo}"/>` : ''}<div><div style="font-weight:900; color:#A00;">Bravo</div><div style="font-weight:700">FOOD PRODUCTION AND SERVICE PERSONNEL</div></div></div>
      <div style="text-align:right">Doc Ref: ${escapeHtml(metadata.docRef || 'BBN-SHEQ-P-R-72')}<br/>Issue Date: ${escapeHtml(metadata.issueDate || metadata.date || '')}</div>
    </div>

    <div class="formTitle">BRAVO BRANDS HEALTH STATUS CHECK</div>

    <div style="display:flex; gap:8px; margin-bottom:8px">
      <div class="metaBox" style="flex:1"><div style="font-weight:700">SITE</div><div style="padding-top:6px; border-bottom:1px solid #000">${escapeHtml(metadata.site || '')}</div></div>
      <div class="metaBox" style="flex:1"><div style="font-weight:700">WEEK</div><div style="padding-top:6px; border-bottom:1px solid #000">${escapeHtml(metadata.week || '')}</div></div>
      <div class="metaBox" style="flex:1"><div style="font-weight:700">MONTH</div><div style="padding-top:6px; border-bottom:1px solid #000">${escapeHtml(metadata.month || '')}</div></div>
    </div>

    <div style="display:flex; gap:12px; margin-bottom:8px">
      <div style="flex:1"><div style="font-weight:700">Supervisor Sign</div>${renderMaybeSignature(metadata.supervisorSign || metadata.supervisorSignature || metadata.supervisorName || '')}</div>
      <div style="flex:1"><div style="font-weight:700">Complex Manager</div>${renderMaybeSignature(metadata.complexManagerSign || metadata.complexManager || '')}</div>
      <div style="flex:1"><div style="font-weight:700">HSEQ Manager</div>${renderMaybeSignature(metadata.hseqManagerSign || metadata.hseqManager || '')}</div>
    </div>

    <div class="note">Note - The supervisor and the manager will be liable for the health of employees and subordinates once they sign the above</div>

    <div style="overflow:auto; margin-top:6px;">
      <div class="table" style="min-width:${tableWidth}px">
        <div class="headerRow" style="min-width:${tableWidth}px">
          <div class="headerCell" style="width:${nameW}px">NAMES</div>
          <div class="headerCell" style="width:${positionW}px">POSITION</div>
          ${daysOfWeek.map(d => `<div style="width:${dayCol}px; display:inline-block; vertical-align:top;" class="dayCol"><div style="text-align:center; font-weight:700; padding:4px; border-bottom:1px solid #000">${d}</div><div style="display:flex"><div style="width:${fitWidth}px; text-align:center; border-right:1px solid #000;">Fit for<br/>work</div><div style="width:${commentWidth}px; text-align:left; padding:4px">Managers comment</div></div></div>`).join('')}
        </div>
        ${rowsHtml}
      </div>
    </div>

  </body></html>`;
};

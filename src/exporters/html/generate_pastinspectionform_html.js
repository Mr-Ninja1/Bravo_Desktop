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

const renderSignature = (val, w = 128, h = 60) => {
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
  const meta = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : (Array.isArray(p.payload && p.payload.formData) ? p.payload.formData : []);
  const hints = p.layoutHints || {};

  const widths = [
    Number(hints.DATE) || 48,
    Number(hints.AREA) || 140,
    Number(hints.TYPE) || 80,
    Number(hints.QTY) || 48,
    Number(hints.COMMENT) || 215,
    Number(hints.INSPECTOR) || 100,
    Number(hints.SIGN) || 128,
  ];

  const logoUri = getLogoDataUri(p);

  const headerCols = ['Date','Area Inspected','Type','Qty','Comment/Corrective Action Taken','Name of Inspector','Complex Manager\'s Sign'];

  const rowsHtml = (rows.length ? rows : []).map(r => `
    <div style="display:flex; border-bottom:1px solid #000; align-items:center; min-height:36px">
      <div style="width:${widths[0]}px; padding:6px; border-right:1px solid #000">${escapeHtml(r.dateLabel || r.date || '')}</div>
      <div style="width:${widths[1]}px; padding:6px; border-right:1px solid #000">${escapeHtml(r.area || '')}</div>
      <div style="width:${widths[2]}px; padding:6px; border-right:1px solid #000">${escapeHtml(r.type || '')}</div>
      <div style="width:${widths[3]}px; padding:6px; border-right:1px solid #000; text-align:center">${escapeHtml(r.qty || '')}</div>
      <div style="width:${widths[4]}px; padding:6px; border-right:1px solid #000">${escapeHtml(r.comment || '')}</div>
      <div style="width:${widths[5]}px; padding:6px; border-right:1px solid #000">${escapeHtml(r.inspector || '')}</div>
      <div style="width:${widths[6]}px; padding:6px; border-right:0">${r.sign ? renderSignature(r.sign, Math.max(72, widths[6]-12), 60) : escapeHtml(r.sign || '')}</div>
    </div>
  `).join('\n') || `<div style="padding:12px;color:#666">No inspection records</div>`;

  const approvedByVal = meta.approvedBy || '';
  const approvedBySig = meta.approvedBySign || '';
  const hseqManagerVal = meta.hseqManager || '';
  const hseqManagerSig = meta.hseqManagerSign || '';

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:10mm}
    body{font-family:Inter, Arial, sans-serif; margin:0; padding:12px; color:#111}
    .container{padding:12px; background:#fff}
    .header{display:flex; align-items:center; margin-bottom:8px}
    .logo{width:56px; height:56px; margin-right:12px}
    .title{font-weight:700; font-size:16px}
    .subtitle{font-size:12px}
    .headerMetaRow{display:flex; justify-content:flex-start; margin-bottom:8px}
    .metaLabel{font-size:12px}
    .table{border:1px solid #000; overflow:hidden}
    .tableHeader{display:flex; background:#eee; border-bottom:1px solid #000}
    .headerCell{justify-content:center; align-items:flex-start; padding:8px; border-right:1px solid #000}
    .colHeader{font-weight:700; font-size:12px}
    .row{display:flex; border-bottom:1px solid #000; align-items:center; min-height:36px}
    .dataCell{padding:6px; border-right:1px solid #000}
    .cellText{font-size:12px}
    .verificationFooter{margin-top:12px}
    .verificationText{font-weight:700; font-size:12px; margin-bottom:6px}
  </style></head><body>

  <div class="container">
    <div class="header">
      ${logoUri ? `<img src="${logoUri}" class="logo"/>` : `<img src="renderer/assets/logo.jpeg" class="logo"/>`}
      <div>
        <div class="title">Pest Inspection Form</div>
        <div class="subtitle">${escapeHtml(meta.companySubtitle || '')}</div>
      </div>
    </div>

    <div class="headerMetaRow">
      <div style="flex:1">
        <div style="font-weight:700">Approved By:</div>
        <div style="margin-top:6px">${approvedBySig ? renderSignature(approvedBySig,200,60) : escapeHtml(approvedByVal)}</div>
      </div>
    </div>

    <div class="table">
      <div class="tableHeader">
        ${headerCols.map((h,i)=>`<div class="headerCell" style="width:${widths[i]}px"><div class="colHeader">${escapeHtml(h)}</div></div>`).join('')}
      </div>
      ${rowsHtml}
    </div>

    <div class="verificationFooter">
      <div class="verificationText">VERIFIED BY</div>
      <div style="display:flex; margin-top:6px">
        <div style="flex:1; margin-right:8px">
          <div style="font-weight:700">HSEQ Manager</div>
          <div style="margin-top:6px">${hseqManagerSig ? renderSignature(hseqManagerSig,220,80) : escapeHtml(hseqManagerVal)}</div>
        </div>
      </div>
    </div>
  </div>

</body></html>`;
};

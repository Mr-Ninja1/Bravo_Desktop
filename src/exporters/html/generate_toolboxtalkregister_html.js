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

const renderSignature = (val, w = 140, h = 44) => {
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
    try { if (fs.existsSync(c)) { const b = fs.readFileSync(c); const ext = path.extname(c).toLowerCase(); const mime = ext === '.png' ? 'image/png' : 'image/jpeg'; return `data:${mime};base64,${b.toString('base64')}`; } } catch (e) { }
  }
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const meta = p.metadata || {};
  const formData = p.formData || {};
  const issues = Array.isArray(formData.issues) ? formData.issues : (formData.issues || []);
  const cells = formData.cells || { left: {}, right: {} };
  const rows = Array.from({ length: 10 }, (_, i) => i + 1);

  const logoUri = getLogoDataUri(p);

  const renderRow = (n, side) => {
    const key = side === 'left' ? n : (n + 10);
    const c = side === 'left' ? (cells.left || {})[n] || {} : (cells.right || {})[n + 10] || {};
    const sign = c.sign || '';
    const sigUri = resolveSignatureUri(sign);
    return `
      <div style="display:flex; min-height:36px; align-items:stretch; border-bottom:1px solid #000">
        <div style="width:48px; padding:6px; text-align:center; border-right:1px solid #000">${side==='left'?n:(n+10)}.</div>
        <div style="width:156px; padding:6px; text-align:left; border-right:1px solid #000">${escapeHtml(c.name || '')}</div>
        <div style="width:132px; padding:6px; text-align:left; border-right:1px solid #000">${escapeHtml(c.job || '')}</div>
        <div style="width:140px; padding:6px; text-align:center; border-right:1px solid #000">${sigUri ? `<img src=\"${sigUri}\" style=\"max-width:140px; max-height:44px; width:auto; display:block\"/>` : escapeHtml(sign || '')}</div>
      </div>
    `;
  };

  const rowsHtml = rows.map(n => renderRow(n, 'left') + renderRow(n, 'right')).join('\n') || `<div style="padding:12px;color:#666">No attendees</div>`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:8mm}
    body{font-family:Inter, Arial, sans-serif; margin:0; padding:12px; color:#111}
    .mainScrollContent{padding:16px; padding-bottom:120px}
    .topHeader{display:flex; align-items:flex-start; margin-bottom:10px; padding-bottom:4px; border-bottom:1px solid #000; padding-right:10px}
    .headerLeft{width:240px; padding-right:12px; border-right:1px solid #000}
    .headerRight{flex:1; padding-left:12px}
    .logoImage{width:96px; height:36px; margin-bottom:6px}
    .companyName{font-size:10px; font-weight:700; line-height:12px; margin-top:-8px}
    .systemName{font-size:9px; line-height:10px; margin-bottom:8px}
    .docRow{display:flex; align-items:center; margin-bottom:2px}
    .docLabel{font-size:10px; font-weight:700; margin-right:4px}
    .docValue{font-size:10px; color:#111; margin-right:12px}
    .title{font-size:18px; font-weight:900; text-align:center; margin:10px 0; border-bottom:1px solid #000; padding-bottom:6px}
    .metaRow{display:flex; align-items:center; justify-content:center; margin:8px 0}
    .metaLabel{font-weight:800; margin-right:6px}
    .metaValue{font-weight:700}
    .infoBlock{border:1px solid #000; padding:10px; margin-bottom:10px}
    .infoRow{display:flex; align-items:flex-end; margin-bottom:12px}
    .infoLabel{font-weight:800; margin-right:6px}
    .inputUnderline{border-bottom:1px solid #000; padding-left:6px}
    .topicsBlock{margin-top:6px}
    .topicsTitle{font-weight:800; margin-bottom:6px}
    .topicLine{display:flex; align-items:flex-end; margin-bottom:8px}
    .dot{width:20px; font-size:13px; font-weight:600}
    .topicInput{flex:1}
    .tableOuter{border:1px solid #000; width:100%; align-self:stretch; padding:0}
    .tableHeaderRow{display:flex; background:#eee; padding:6px; align-items:center; border-bottom:1px solid #000}
    .colHeader{font-weight:800; text-align:center; font-size:11px}
    .tableRow{display:flex; min-height:36px; align-items:stretch; border-bottom:1px solid #000}
  </style></head><body>

    <div class="mainScrollContent">
      <div class="topHeader">
        <div class="headerLeft">
          ${logoUri ? `<img src="${logoUri}" class="logoImage"/>` : `<img src="renderer/assets/logo.jpeg" class="logoImage"/>`}
          <div class="companyName">BRAVO BRANDS LIMITED</div>
          <div class="systemName">Safety Management System</div>
        </div>
        <div class="headerRight">
          <div class="docRow"><div class="docLabel">Doc No:</div><div class="docValue">BBN-SHEQ-TBT-R-01</div><div class="docLabel" style="margin-left:12px">Page 1 of 1</div></div>
          <div class="docRow"><div class="docLabel">Issue Date:</div><div class="docValue">${escapeHtml(meta.date || '')}</div><div class="docLabel" style="margin-left:12px">Review Date:</div><div class="docValue">N/A</div></div>
          <div class="docRow" style="margin-top:8px;border-top:1px solid #000;padding-top:4px"><div class="docLabel">Compiled By:</div><div class="docValue">Michael C. Zulu</div><div class="docLabel" style="margin-left:12px">Approved By:</div><div class="docValue">Hasani Al</div></div>
        </div>
      </div>

      <div class="title">TOOL BOX TALK REGISTER</div>

     

      <div class="infoBlock">
        <div class="infoRow"><div class="infoLabel">AGENDA/TOPIC:</div><div class="infoFill inputUnderline">${escapeHtml(meta.agenda || '')}</div></div>
        <div class="infoRow"><div class="infoLabel">PRESENTER:</div><div class="infoFill inputUnderline">${escapeHtml(meta.presenter || '')}</div><div class="infoLabel" style="margin-left:16px">DATE:</div><div class="infoFill inputUnderline">${escapeHtml(meta.date || '')}</div></div>
        <div class="topicsBlock"><div class="topicsTitle">KEY POINTS DISCUSSED:</div>${issues.map((it,idx)=>`<div class="topicLine"><div class="dot">${idx+1}.</div><div class="topicInput inputUnderline">${escapeHtml(it||'')}</div></div>`).join('')}</div>
      </div>

      <div style="width:100%"><div class="tableOuter">
        <div class="tableHeaderRow">
          <div class="colHeader" style="width:48px">S/N</div>
          <div class="colHeader" style="width:156px">FULL NAME (Print)</div>
          <div class="colHeader" style="width:132px">JOB TITLE/DEPT</div>
          <div class="colHeader" style="width:140px;border-right:0">SIGNATURE</div>

          <div class="colHeader" style="width:48px">S/N</div>
          <div class="colHeader" style="width:156px">FULL NAME (Print)</div>
          <div class="colHeader" style="width:132px">JOB TITLE/DEPT</div>
          <div class="colHeader" style="width:140px;border-right:0">SIGNATURE</div>
        </div>
        ${rowsHtml}
      </div></div>

    </div>

  </body></html>`;
};

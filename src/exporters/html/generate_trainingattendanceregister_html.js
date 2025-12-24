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

// signature normalization matches presentational: require larger compact length
const normalizeSignature = (v) => {
  if (!v) return null;
  if (typeof v === 'string') {
    if (v.startsWith('data:')) return v;
    const compact = v.replace(/\s+/g, '');
    if (compact.length > 200) return `data:image/png;base64,${compact}`;
    return null;
  }
  if (typeof v === 'object') {
    if (v.uri && typeof v.uri === 'string') return v.uri;
    if (v.data && typeof v.data === 'string') return v.data.startsWith('data:') ? v.data : `data:image/png;base64,${v.data}`;
    if (v.signature && typeof v.signature === 'string') return v.signature.startsWith('data:') ? v.signature : `data:image/png;base64,${v.signature}`;
    if (v.base64 && typeof v.base64 === 'string') return `data:image/png;base64,${v.base64}`;
  }
  return null;
};

const renderMaybeSignature = (val, opts = {}) => {
  const uri = normalizeSignature(val);
  const width = opts.width || 110;
  const height = opts.height || 40;
  // reserve the width so layout doesn't shift
  if (uri) return `<div style="width:${width}px; padding:0 6px; display:flex; align-items:center; justify-content:center; border-right:0"><img src="${uri}" style="max-width:${width}px; max-height:${height}px; width:auto; display:block; object-fit:contain"/></div>`;
  return `<div style="width:${width}px; padding:6px; border-right:0; text-align:center; overflow:hidden; white-space:nowrap; text-overflow:ellipsis">${escapeHtml(val || '')}</div>`;
};

const getLogoDataUri = (p) => {
  if (!p) return null;
  if (p.assets && p.assets.logoDataUri) return p.assets.logoDataUri;
  const candidates = [path.join(process.cwd(), 'renderer', 'assets', 'logo.jpeg'), path.join(process.cwd(), 'assets', 'logo.jpeg')];
  for (const c of candidates) { try { if (fs.existsSync(c)) { const b=fs.readFileSync(c); const ext=path.extname(c).toLowerCase(); const mime=ext==='.png'?'image/png':'image/jpeg'; return `data:${mime};base64,${b.toString('base64')}`; } } catch(e){} }
  return null;
};

module.exports = function generate(payloadWrapper){
  const raw = normalizeIncoming(payloadWrapper);
  // normalize payload shapes to match presentational's normalizePayload
  const normalized = (() => {
    const normalized = {};
    normalized.metadata = raw.metadata || raw.meta || {};
    normalized.title = raw.title || raw.formType || 'Training Attendance Register';
    normalized.date = raw.date || normalized.metadata.date || normalized.metadata.issueDate || '';
    normalized.assets = raw.assets || (raw.meta && raw.meta.assets) || undefined;

    const r = raw.formData || raw.data || raw.fields || {};
    const formData = { topics: [], cells: { left: {}, right: {} } };
    if (r.topics && Array.isArray(r.topics)) formData.topics = r.topics;
    else if (typeof r.topics === 'string') formData.topics = r.topics.split('\n').map(t=>t.trim()).filter(Boolean);
    else if (normalized.metadata.topics) formData.topics = Array.isArray(normalized.metadata.topics) ? normalized.metadata.topics : String(normalized.metadata.topics).split('\n').map(t=>t.trim()).filter(Boolean);

    if (r.cells && (r.cells.left || r.cells.right)) {
      formData.cells.left = r.cells.left || {};
      formData.cells.right = r.cells.right || {};
    } else if (Array.isArray(r.rows) && r.rows.length>0) {
      r.rows.forEach((row, idx)=>{
        const n = idx+1;
        const entry = {
          name: row.fullName || row.name || (row[1]||''),
          nrc: row.nrc || row.nrcNumber || (row[2]||''),
          job: row.jobTitle || (row[3]||''),
          sign: row.signature || (row[4]||'')
        };
        if (n<=9) formData.cells.left[n] = entry; else formData.cells.right[n] = entry;
      });
    } else if (r.left || r.right) {
      formData.cells.left = r.left || {};
      formData.cells.right = r.right || {};
    }
    normalized.formData = formData;
    return normalized;
  })();

  const logo = (normalized.assets && normalized.assets.logoDataUri) ? normalized.assets.logoDataUri : getLogoDataUri(raw);

  // exact column widths from presentational
  const W = { sn:48, name:156, nrc:132, job:160, sign:110 };
  const tableWidth = (W.sn+W.name+W.nrc+W.job+W.sign) * 2;

  // topics HTML
  const topicsHtml = (normalized.formData.topics || []).map((t,i)=>`<div style="margin-left:8px;margin-top:4px;font-size:13px">${i+1}. ${escapeHtml(t)}</div>`).join('') || '';

  // rows: 1..9 left, right 10..18
  const leftRows = Array.from({length:9},(_,i)=>i+1);
  const cells = normalized.formData.cells || { left:{}, right:{} };

  const rowsHtml = leftRows.map(n=>{
    const left = cells.left[n] || {};
    const right = cells.right[n+9] || {};
    return `<div style="display:flex; min-height:36px; align-items:stretch; border-bottom:1px solid #000">
      <div style="width:${W.sn}px; padding:6px; text-align:center">${n}.</div>
      <div style="width:${W.name}px; padding:6px;">${escapeHtml(left.name||'')}</div>
      <div style="width:${W.nrc}px; padding:6px; text-align:center">${escapeHtml(left.nrc||'')}</div>
      <div style="width:${W.job}px; padding:6px; text-align:center">${escapeHtml(left.job||'')}</div>
      ${renderMaybeSignature(left.sign||'', { width: W.sign, height: 40 })}

      <div style="width:${W.sn}px; padding:6px; text-align:center">${n+9}.</div>
      <div style="width:${W.name}px; padding:6px;">${escapeHtml(right.name||'')}</div>
      <div style="width:${W.nrc}px; padding:6px; text-align:center">${escapeHtml(right.nrc||'')}</div>
      <div style="width:${W.job}px; padding:6px; text-align:center">${escapeHtml(right.job||'')}</div>
      ${renderMaybeSignature(right.sign||'', { width: W.sign, height: 40 })}
    </div>`;
  }).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:8mm}
    body{font-family:Inter, Arial, sans-serif; margin:0; padding:12px}
    .container{padding:16px 16px 80px}
    .topHeader{display:flex; align-items:flex-start; margin-bottom:10px; padding-bottom:4px; border-bottom:1px solid #000}
    .headerLeft{width:240; padding-right:12px; border-right:1px solid #000}
    .headerRight{flex:1; padding-left:12px}
    .logo{width:96px; height:36px; margin-bottom:6px}
    .companyName{font-size:12px; font-weight:800; margin-top:-6px}
    .systemName{font-size:10px}
    .title{font-size:18px; font-weight:900; text-align:center; margin:10px 0; border-bottom:1px solid #000; padding-bottom:6px}
    .metaRow{display:flex; align-items:center; justify-content:center; margin-bottom:12px; flex-wrap:wrap}
    .metaLabel{font-weight:800; margin-right:6px; font-size:13px}
    .metaValue{font-size:13px; font-weight:700; margin-right:12px}
    .sectionTitle{font-weight:800; margin-bottom:6px}
    .tableOuter{border:1px solid #000; width:100%}
    .tableHeaderRow{display:flex; background:#eee; padding:6px; align-items:center; border-bottom:1px solid #000}
  </style></head><body>

  <div style="max-width:1123px;margin:0 auto" class="container">
    <div class="topHeader">
      <div class="headerLeft">
        ${logo?`<img src="${logo}" class="logo"/>`:`<img src="renderer/assets/logo.jpeg" class="logo"/>`}
        <div style="margin-top:4px"><div class="companyName">BRAVO BRANDS LIMITED</div><div class="systemName">Food Safety Management System</div></div>
      </div>
      <div class="headerRight">
        <div style="display:flex; flex-direction:row; gap:8px; align-items:center">
          <div style="font-weight:700">Issue Date:</div><div style="margin-right:12px">${escapeHtml(normalized.metadata.date || normalized.date || '')}</div>
        </div>
        <div style="margin-top:8px; border-top:1px solid #000; padding-top:4px; display:flex; gap:12px">
          <div style="font-weight:700">COMPILED BY:</div><div>Michael C. Zulu</div>
          <div style="font-weight:700; margin-left:12px">APPROVED BY:</div><div>Hasani Al</div>
        </div>
        <div style="display:flex; gap:12px; margin-top:6px">
          <div style="font-weight:700">Version No:</div><div>01</div>
          <div style="font-weight:700; margin-left:12px">Rev No:</div><div>00</div>
        </div>
      </div>
    </div>

    <div class="title">${escapeHtml(normalized.title || 'TRAINING ATTENDANCE REGISTER')}</div>

    <div class="metaRow">
      <div class="metaLabel">Subject:</div><div class="metaValue">${escapeHtml(normalized.metadata.subject || '')}</div>
      <div class="metaLabel" style="margin-left:16px">Presenter:</div><div class="metaValue">${escapeHtml(normalized.metadata.presenter || '')}</div>
      <div class="metaLabel" style="margin-left:16px">Date:</div><div class="metaValue">${escapeHtml(normalized.metadata.date || normalized.date || '')}</div>
    </div>

    <div style="margin-bottom:12px">
      <div style="font-weight:800; margin-bottom:6px">Topics Discussed</div>
      ${topicsHtml}
    </div>

    <div style="overflow:auto"><div class="tableOuter">
      <div class="tableHeaderRow">
        <div style="width:${W.sn}px; text-align:center; font-weight:800">S/N</div>
        <div style="width:${W.name}px; text-align:center; font-weight:800">FULL NAME</div>
        <div style="width:${W.nrc}px; text-align:center; font-weight:800">NRC NUMBER</div>
        <div style="width:${W.job}px; text-align:center; font-weight:800">JOB TITLE</div>
        <div style="width:${W.sign}px; text-align:center; font-weight:800; border-right:0">SIGNATURE</div>

        <div style="width:${W.sn}px; text-align:center; font-weight:800">S/N</div>
        <div style="width:${W.name}px; text-align:center; font-weight:800">FULL NAME</div>
        <div style="width:${W.nrc}px; text-align:center; font-weight:800">NRC NUMBER</div>
        <div style="width:${W.job}px; text-align:center; font-weight:800">JOB TITLE</div>
        <div style="width:${W.sign}px; text-align:center; font-weight:800; border-right:0">SIGNATURE</div>
      </div>

      ${rowsHtml}
    </div></div>

    <div style="margin-top:12px; display:flex; gap:12px">
      <div style="flex:1"><div style="font-weight:700">Trainer Signature</div>${renderMaybeSignature(normalized.metadata.trainerSignature || normalized.metadata.trainerSign || normalized.metadata.trainerSig || '')}</div>
      <div style="flex:1"><div style="font-weight:700">Approved By</div>${renderMaybeSignature(normalized.metadata.approvedBySignature || normalized.metadata.approvedBy || '')}</div>
    </div>
  </div>

</body></html>`;
};

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

const formatIssueDate = (payloadOrMetadata) => {
  if (!payloadOrMetadata) return '';
  // allow either the full payload or a metadata object; merge so top-level fields are considered
  const merged = Object.assign({}, (payloadOrMetadata.metadata || {}), payloadOrMetadata);
  const candidates = [merged.issueDate, merged.issue_date, merged.issue_date_formatted, merged.date, merged.issuedDate, merged.issued_date, merged.issue];
  for (const raw of candidates) {
    if (!raw && raw !== 0) continue;
    const s = String(raw).trim(); if (!s) continue;
    const iso = /^(\d{4})[-\/](\d{2})[-\/](\d{2})$/;
    const dmy = /^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/;
    const mIso = s.match(iso);
    if (mIso) return `${mIso[3]}/${mIso[2]}/${mIso[1]}`;
    if (dmy.test(s)) return s.replace(/-/g,'/');
    const dt = new Date(s);
    if (!isNaN(dt.getTime())) {
      const dd = String(dt.getDate()).padStart(2,'0');
      const mm = String(dt.getMonth() + 1).padStart(2,'0');
      const yyyy = dt.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
  }
  return '';
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const metadata = p.metadata || {};
  const formData = Array.isArray(p.formData) ? p.formData : (p.rows || []);

  const DEFAULT_TITLE = 'Hot Holding Temperature Log';
  const title = (p.title || p.title === 0) ? String(p.title) : DEFAULT_TITLE;
  const companyDisplay = metadata.companyName ? String(metadata.companyName).toUpperCase() : '';
  const tagline = metadata.companyTagline || metadata.subtitle || '';

  const rowData = formData.length ? formData : Array.from({ length: 12 }).map(() => ({}));

  // Mirror presentational sizing logic so exported table matches renderer
  const TABLE_WIDTH = 1400;
  const COL_FLEX = { INDEX: 0.6, FOOD_ITEM: 0.9, TIME_INTO_HOLD: 1.5, TIME_TEMP_SIGN: 1.0, STAFF_NAME: 3.0 };
  const totalFlex = COL_FLEX.INDEX + COL_FLEX.FOOD_ITEM + COL_FLEX.TIME_INTO_HOLD + (COL_FLEX.TIME_TEMP_SIGN * 9) + COL_FLEX.STAFF_NAME;
  const baseUnit = TABLE_WIDTH / totalFlex;
  const fixedWidths = {
    INDEX: Math.round(baseUnit * COL_FLEX.INDEX),
    FOOD_ITEM: Math.round(baseUnit * COL_FLEX.FOOD_ITEM),
    TIME_INTO_HOLD: Math.round(baseUnit * COL_FLEX.TIME_INTO_HOLD),
    TIME1: Math.round(baseUnit * COL_FLEX.TIME_TEMP_SIGN), TEMP1: Math.round(baseUnit * COL_FLEX.TIME_TEMP_SIGN), SIGN1: Math.round(baseUnit * COL_FLEX.TIME_TEMP_SIGN),
    TIME2: Math.round(baseUnit * COL_FLEX.TIME_TEMP_SIGN), TEMP2: Math.round(baseUnit * COL_FLEX.TIME_TEMP_SIGN), SIGN2: Math.round(baseUnit * COL_FLEX.TIME_TEMP_SIGN),
    TIME3: Math.round(baseUnit * COL_FLEX.TIME_TEMP_SIGN), TEMP3: Math.round(baseUnit * COL_FLEX.TIME_TEMP_SIGN), SIGN3: Math.round(baseUnit * COL_FLEX.TIME_TEMP_SIGN),
    STAFF_NAME: Math.round(baseUnit * COL_FLEX.STAFF_NAME)
  };
  const allocatedFixed = Object.values(fixedWidths).reduce((s, v) => s + v, 0);
  const deltaFixed = TABLE_WIDTH - allocatedFixed;
  if (deltaFixed > 0) fixedWidths.STAFF_NAME += deltaFixed;

  // Start with fixedWidths, allow payload.layoutHints.WIDTHS to override
  const widths = Object.assign({}, fixedWidths, p.layoutHints && p.layoutHints.WIDTHS ? p.layoutHints.WIDTHS : {});

  // enforce sensible minimums similar to presentational
  const MIN_TIME = 64; const MIN_TEMP = 48; const MIN_SIGN = 110; const MIN_STAFF = 120;
  for (const k of ['TIME1','TIME2','TIME3']) if ((widths[k]||0) < MIN_TIME) widths[k] = MIN_TIME;
  for (const k of ['TEMP1','TEMP2','TEMP3']) if ((widths[k]||0) < MIN_TEMP) widths[k] = MIN_TEMP;
  for (const k of ['SIGN1','SIGN2','SIGN3']) if ((widths[k]||0) < MIN_SIGN) widths[k] = MIN_SIGN;

  const orderedCols = ['INDEX','FOOD_ITEM','TIME_INTO_HOLD','TIME1','TEMP1','SIGN1','TIME2','TEMP2','SIGN2','TIME3','TEMP3','SIGN3','STAFF_NAME'];
  const colWidths = orderedCols.map(k => Math.max(0, Math.round(widths[k] || 0)));
  // ensure sums to TABLE_WIDTH
  const sumNow = colWidths.reduce((s,v)=>s+v,0); if (sumNow !== TABLE_WIDTH) { const delta = TABLE_WIDTH - sumNow; colWidths[colWidths.length-1] = Math.max(0, colWidths[colWidths.length-1] + delta); }
  const colPct = (w) => ((w / TABLE_WIDTH) * 100).toFixed(4) + '%';

  let logo = (p.assets && (p.assets.logoDataUri || p.assets.logo)) ? (p.assets.logoDataUri || p.assets.logo) : (p.logo || p.logoDataUri || metadata.logoUrl || metadata.companyLogo || metadata.logo || null);
  if (!logo) {
    try {
      const fs = require('fs');
      const path = require('path');
      const possible = ['logo.jpeg','logo.jpg','logo.jpeg','logo.webp'];
      for (const name of possible) {
        const pth = path.join(process.cwd(), 'assets', name);
        if (fs.existsSync(pth)) {
          const buf = fs.readFileSync(pth);
          const ext = path.extname(name).toLowerCase().replace('.', '');
          const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : (ext === 'png' ? 'image/png' : (ext === 'webp' ? 'image/webp' : 'application/octet-stream'));
          logo = `data:${mime};base64,${buf.toString('base64')}`;
          break;
        }
      }
    } catch (e) {}
  }

  const sigHtml = (v, h = 30) => {
    const uri = resolveSignatureUri(v);
    if (uri) return `<img src="${uri}" style="max-height:${h}px; width:auto; object-fit:contain; display:block;"/>`;
    return `<div style="font-size:9px;color:#94a3b8;">${escapeHtml(v || '')}</div>`;
  };

  const rowsHtml = rowData.map((r, i) => {
    const s1 = resolveSignatureUri(r.sign1 || r.signature1);
    const s2 = resolveSignatureUri(r.sign2 || r.signature2);
    const s3 = resolveSignatureUri(r.sign3 || r.signature3 || r.sign);
    return `
      <div class="row">
        <div class="cell" style="width:${colPct(colWidths[0])}">${i+1}</div>
        <div class="cell area" style="width:${colPct(colWidths[1])}">${escapeHtml(r.foodItem || r.item || r.name || '')}</div>
        <div class="cell" style="width:${colPct(colWidths[2])}">${escapeHtml(r.timeIntoHold || r.timeIntoHotHold || r.timeInto || '')}</div>

        <div class="cell" style="width:${colPct(colWidths[3])}">${escapeHtml(r.time1 || '')}</div>
        <div class="cell" style="width:${colPct(colWidths[4])}">${escapeHtml(r.temp1 || '')}</div>
        <div class="cell" style="width:${colPct(colWidths[5])}">${s1?`<img src="${escapeHtml(s1)}" style="max-width:${Math.max(120,colWidths[5]-8)}px; max-height:56px; object-fit:contain"/>`:escapeHtml(r.sign1||'')}</div>

        <div class="cell" style="width:${colPct(colWidths[6])}">${escapeHtml(r.time2 || '')}</div>
        <div class="cell" style="width:${colPct(colWidths[7])}">${escapeHtml(r.temp2 || '')}</div>
        <div class="cell" style="width:${colPct(colWidths[8])}">${s2?`<img src="${escapeHtml(s2)}" style="max-width:${Math.max(120,colWidths[8]-8)}px; max-height:56px; object-fit:contain"/>`:escapeHtml(r.sign2||'')}</div>

        <div class="cell" style="width:${colPct(colWidths[9])}">${escapeHtml(r.time3 || '')}</div>
        <div class="cell" style="width:${colPct(colWidths[10])}">${escapeHtml(r.temp3 || '')}</div>
        <div class="cell" style="width:${colPct(colWidths[11])}">${s3?`<img src="${escapeHtml(s3)}" style="max-width:${Math.max(120,colWidths[11]-8)}px; max-height:56px; object-fit:contain"/>`:escapeHtml(r.sign3||'')}</div>

        <div class="cell" style="width:${colPct(colWidths[12])}">${escapeHtml(r.staffName || r.staff || '')}</div>
      </div>`;
  }).join('\n');

  // title already computed above from payload or default

  return `<!doctype html><html><head><meta charset="utf-8">
  <style>
    @page { size: A4 landscape; margin: 6mm; }
    body { font-family: 'Inter', Arial, sans-serif; margin:0; padding:12px; color:#111; font-size:10px }
    .header { display:flex; align-items:flex-start; justify-content:space-between; border-bottom:1px solid #111; padding-bottom:8px }
    .logo{height:48px}
    .company{font-weight:900; font-size:16px}
    .subtitle{font-size:11px; color:#334155; margin-top:2px}
    .issue-box{border:1px solid #111; padding:6px 8px; min-width:92px; text-align:center}
    .issue-label{font-size:10px; color:#334155}
    .issue-value{font-weight:700; margin-top:4px}
    .meta-row{display:flex; gap:12px; margin-top:10px; padding-top:8px}
    .meta-col{flex:1}
    .meta-label{font-size:10px; color:#334155; margin-bottom:6px}
    .meta-value{border-bottom:1px solid #111; padding:6px 2px; font-weight:700}
    .table{display:flex; flex-direction:column; border:1px solid #e2e8f0; margin-top:10px}
    .row{display:flex; border-bottom:1px solid #e6eef8; min-height:36px; align-items:center}
    .cell{box-sizing:border-box; padding:6px; border-right:1px solid #e6eef8; display:flex; align-items:center; justify-content:center}
    .cell:last-child{border-right:none}
    .hCell{font-weight:800; background:#f1f5f9}
    .area{justify-content:flex-start; text-align:left; padding-left:8px; font-weight:600}
  </style>
  </head><body>
    <div class="header">
      <div style="display:flex;gap:12px;align-items:flex-start">
        ${logo?`<img src="${logo}" class="logo"/>`:''}
        <div>
                <div class="company">${escapeHtml(companyDisplay)}</div>
                <div class="subtitle">${escapeHtml(tagline)}</div>
        </div>
      </div>
      <div style="text-align:right">
        <div class="issue-box"><div class="issue-label">Issue Date</div><div class="issue-value">${escapeHtml(formatIssueDate(p) || '')}</div></div>
      </div>
    </div>

    <div class="meta-row">
      <div class="meta-col"><div class="meta-label">SUBJECT:</div><div class="meta-value">${escapeHtml((p.subject || metadata.subject || title) || '')}</div></div>
      <div class="meta-col"><div class="meta-label">COMPILED BY:</div><div class="meta-value">${escapeHtml((p.compiledBy || p.compiled_by || metadata.compiledBy || metadata.compiled_by || metadata.author) || '')}</div></div>
      <div class="meta-col"><div class="meta-label">APPROVED BY:</div><div class="meta-value">${escapeHtml((p.approvedBy || p.approved_by || metadata.approvedBy || metadata.approved_by) || '')}</div></div>
    </div>
    <div class="table">
      <div class="row hCell">
        <div class="cell" style="width:${colPct(colWidths[0])}"></div>
        <div class="cell" style="width:${colPct(colWidths[1])}"><strong>HOT-HOLDING (above 63°C)</strong></div>
        <div class="cell" style="width:${colPct(colWidths[2])}"><strong>TIME INTO HOT HOLD</strong></div>
        <div class="cell" style="width:${colPct(colWidths[3]+colWidths[4]+colWidths[5])}"><strong>1ST RECORD</strong></div>
        <div class="cell" style="width:${colPct(colWidths[6]+colWidths[7]+colWidths[8])}"><strong>2ND RECORD</strong></div>
        <div class="cell" style="width:${colPct(colWidths[9]+colWidths[10]+colWidths[11])}"><strong>3RD RECORD</strong></div>
        <div class="cell" style="width:${colPct(colWidths[12])}"><strong>STAFF'S NAME</strong></div>
      </div>

      <div class="row hCell">
        <div class="cell" style="width:${colPct(colWidths[0])}"><strong>#</strong></div>
        <div class="cell" style="width:${colPct(colWidths[1])}"><strong>FOOD ITEM</strong></div>
        <div class="cell" style="width:${colPct(colWidths[2])}"></div>
        <div class="cell" style="width:${colPct(colWidths[3])}"><strong>TIME</strong></div>
        <div class="cell" style="width:${colPct(colWidths[4])}"><strong>TEMP</strong></div>
        <div class="cell" style="width:${colPct(colWidths[5])}"><strong>SIGN</strong></div>
        <div class="cell" style="width:${colPct(colWidths[6])}"><strong>TIME</strong></div>
        <div class="cell" style="width:${colPct(colWidths[7])}"><strong>TEMP</strong></div>
        <div class="cell" style="width:${colPct(colWidths[8])}"><strong>SIGN</strong></div>
        <div class="cell" style="width:${colPct(colWidths[9])}"><strong>TIME</strong></div>
        <div class="cell" style="width:${colPct(colWidths[10])}"><strong>TEMP</strong></div>
        <div class="cell" style="width:${colPct(colWidths[11])}"><strong>SIGN</strong></div>
        <div class="cell" style="width:${colPct(colWidths[12])}"></div>
      </div>

      ${rowsHtml}
    </div>

    <div style="margin-top:12px">
      <div><strong>CHEF Signature:</strong> ${ (()=>{ const v = p.metadata && (p.metadata.chefSignature || p.metadata.chefSign); const u = resolveSignatureUri(v); return u?`<img src="${escapeHtml(u)}" style="max-width:260px; max-height:80px; object-fit:contain"/>`:escapeHtml(v||''); })() }</div>
      <div style="margin-top:8px"><strong>Corrective Action:</strong> ${escapeHtml(p.metadata && p.metadata.correctiveAction || '')}</div>
      <div style="display:flex; gap:12px; margin-top:8px">
        <div style="flex:1"><strong>Verified by (HSEQ):</strong> ${ (()=>{ const v=p.metadata && (p.metadata.hseqManagerSignature||p.metadata.hseqManagerSign||p.metadata.hseqSign); const u=resolveSignatureUri(v); return u?`<img src="${escapeHtml(u)}" style="max-width:220px; max-height:64px; object-fit:contain"/>`:escapeHtml(v||''); })() }</div>
        <div style="flex:1"><strong>Complex Manager Signature:</strong> ${ (()=>{ const v=p.metadata && (p.metadata.complexManagerSignature||p.metadata.complexManagerSign||p.metadata.complexManager); const u=resolveSignatureUri(v); return u?`<img src="${escapeHtml(u)}" style="max-width:220px; max-height:64px; object-fit:contain"/>`:escapeHtml(v||''); })() }</div>
      </div>
    </div>
  </body></html>`;
};

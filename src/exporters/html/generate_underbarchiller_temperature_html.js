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
  const rows = Array.isArray(p.formData) ? p.formData : (p.rows || []);

  const data = p.formData || p.data || {};
  const pick = (obj, keys) => { for (const k of keys) { if (!obj) continue; const v = obj[k]; if (v) return v; } return null; };
  const subjectCandidates = [
    // formData common
    () => pick(data, ['subject','title','formTitle','name','formName']),
    // top-level payload
    () => pick(p, ['subject','title','formTitle','formName','_formName','_formTitle']),
    // metadata
    () => pick(metadata, ['subject','title','formTitle','formName','displayName','formName']),
    // legacy
    () => (p && p.form && (p.form.title || p.form.name)) || null
  ];
  let subject = null;
  for (const fn of subjectCandidates) {
    try { const v = fn(); if (v) { subject = v; break; } } catch (e) {}
  }
  if (!subject) subject = 'Underbar Chiller Temperature Log Sheet';

  // Standardize on 31 rows for a full monthly view
  const rowData = rows.length ? rows : Array.from({ length: 31 }).map((_, i) => ({ day: i + 1 }));

  // Column Weights for A4 Landscape
  const COL = {
    DATE: 35,
    TEMP: 45,
    SIGN: 75,
    ACTION: 160,
    SUPER: 100 
  };

  const groupWidth = COL.TEMP + COL.SIGN;
  const totalWeight = COL.DATE + (groupWidth * 3) + COL.ACTION + (COL.SUPER * 4);
  const colPct = (w) => ((w / totalWeight) * 100).toFixed(4) + '%';

  // LOGO LOGIC: Priority order with explicit Local Desktop fallback
  let logo = (p.assets && (p.assets.logoDataUri || p.assets.logo)) ? (p.assets.logoDataUri || p.assets.logo) : (p.logo || p.logoDataUri || metadata.logoUrl || metadata.companyLogo || metadata.logo || null);
  
  if (!logo) {
    try {
      const fs = require('fs');
      const path = require('path');
      // Try several relative/resource-based locations instead of hardcoded absolute path
      const candidates = [
        path.join(process.cwd(), 'assets', 'logo.jpeg'),
        path.join(process.cwd(), 'assets', 'logo.jpg'),
        path.join(process.cwd(), 'assets', 'logo.png'),
        path.join(__dirname, '..', '..', 'assets', 'logo.jpeg'),
        path.join(__dirname, '..', '..', 'assets', 'logo.jpg'),
        path.join(__dirname, '..', '..', 'assets', 'logo.png')
      ];
      for (const pth of candidates) {
        try {
          if (fs.existsSync(pth)) {
            const data = fs.readFileSync(pth);
            const ext = path.extname(pth).toLowerCase().replace('.', '');
            const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : (ext === 'png' ? 'image/png' : 'application/octet-stream');
            logo = `data:${mime};base64,${data.toString('base64')}`;
            break;
          }
        } catch (inner) { /* ignore */ }
      }
    } catch (e) { /* ignore fallback error */ }
  }

  const sigHtml = (v, h = 26) => {
    const uri = resolveSignatureUri(v);
    if (uri) return `<img src="${uri}" style="max-height:${h}px; width:auto; object-fit:contain; display:block; mix-blend-mode:multiply;"/>`;
    return `<div style="font-size:7px; color:#94a3b8;">${escapeHtml(v || '')}</div>`;
  };

  const rowsHtml = rowData.map((r, i) => {
    return `
      <div class="tr">
        <div class="td date-cell" style="width:${colPct(COL.DATE)}">${escapeHtml(r.day || r.date || i + 1)}</div>
        <div class="td" style="width:${colPct(COL.TEMP)}">${escapeHtml(r.tempMorning || '')}</div>
        <div class="td" style="width:${colPct(COL.SIGN)}">${sigHtml(r.staffSignMorning)}</div>
        <div class="td" style="width:${colPct(COL.TEMP)}">${escapeHtml(r.tempAfternoon || '')}</div>
        <div class="td" style="width:${colPct(COL.SIGN)}">${sigHtml(r.staffSignAfternoon)}</div>
        <div class="td" style="width:${colPct(COL.TEMP)}">${escapeHtml(r.tempEvening || '')}</div>
        <div class="td" style="width:${colPct(COL.SIGN)}">${sigHtml(r.staffSignEvening)}</div>
        <div class="td action-cell" style="width:${colPct(COL.ACTION)}">${escapeHtml(r.outOfSpecAction || '')}</div>
        <div class="td" style="width:${colPct(COL.SUPER)}">${sigHtml(r.supNameSign || r.supName)}</div>
        <div class="td" style="width:${colPct(COL.SUPER)}">${sigHtml(r.complexManagerSign)}</div>
        <div class="td" style="width:${colPct(COL.SUPER)}">${sigHtml(r.fscSign)}</div>
        <div class="td" style="width:${colPct(COL.SUPER)}">${sigHtml(r.hseqManagerSign)}</div>
      </div>`;
  }).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8">
  <style>
    @page { size: A4 landscape; margin: 6mm; }
    body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; color: #111; background: #fff; font-size: 8px; line-height: 1.1; }
    
    /* Logo fixed at top left */
    .headerSection { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #185a9d; padding-bottom: 6px; margin-bottom: 8px; }
    .branding { display: flex; align-items: center; gap: 10px; }
    .logo { height: 45px; width: auto; object-fit: contain; }
    .companyName { font-weight: 800; font-size: 14px; color: #185a9d; }
    
    .title { text-align: center; font-weight: 900; font-size: 11px; text-transform: uppercase; margin: 6px 0; color: #1e293b; }

    .table { border: 1.5px solid #334155; display: flex; flex-direction: column; width: 100%; border-bottom: none; }
    .thead-group { display: flex; background: #f1f5f9; border-bottom: 1.5px solid #334155; align-items: stretch; }
    .thead-detail { display: flex; background: #f8fafc; border-bottom: 1px solid #334155; align-items: stretch; }
    
    /* Fattened Rows */
    .tr { display: flex; border-bottom: 1px solid #cbd5e1; min-height: 34px; align-items: stretch; page-break-inside: avoid; }
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

    .th { font-weight: 800; font-size: 8px; color: #0f172a; }
    .date-cell { background: #f8fafc; font-weight: 700; color: #185a9d; border-right: 1.5px solid #334155; }
    .action-cell { justify-content: flex-start; text-align: left; font-size: 7px; padding-left: 6px; }

    .footer { margin-top: 10px; font-size: 8px; color: #64748b; font-style: italic; display: flex; justify-content: space-between; }
  </style>
</head><body>
  <div class="card">
    <div class="headerSection">
      <div class="branding">
        ${logo ? `<img class="logo" src="${logo}" alt="logo"/>` : ''}
        <div class="companyName">${escapeHtml(metadata.companyName || 'Bravo')}</div>
      </div>
      <div style="font-weight:700; font-size: 10px; color: #475569;">: ${escapeHtml(metadata.date || '—')}</div>
    </div>

    <div class="title">${escapeHtml(subject)}</div>

    <div class="table">
      <div class="thead-group">
        <div class="th" style="width:${colPct(COL.DATE)}">DATE</div>
        <div class="th" style="width:${colPct(groupWidth)}">MORNING</div>
        <div class="th" style="width:${colPct(groupWidth)}">AFTERNOON</div>
        <div class="th" style="width:${colPct(groupWidth)}">EVENING</div>
        <div class="th" style="width:${colPct(COL.ACTION)}">CORRECTIVE ACTION</div>
        <div class="th" style="width:${colPct(COL.SUPER)}">SUP SIGN</div>
        <div class="th" style="width:${colPct(COL.SUPER)}">COMPLEX MGR</div>
        <div class="th" style="width:${colPct(COL.SUPER)}">FSC SIGN</div>
        <div class="th" style="width:${colPct(COL.SUPER)}">HSEQ MGR</div>
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
        <div class="th" style="width:${colPct(COL.SUPER)}"></div>
        <div class="th" style="width:${colPct(COL.SUPER)}"></div>
        <div class="th" style="width:${colPct(COL.SUPER)}"></div>
        <div class="th" style="width:${colPct(COL.SUPER)}"></div>
      </div>

      ${rowsHtml}
    </div>

    <div class="footer">
      <div>Standard: 1°C to 5°C</div>
      <div>Instruction: Temperatures must be recorded three times daily. Clean and sanitize probes between uses.</div>
    </div>
  </div>
</body></html>`;
};
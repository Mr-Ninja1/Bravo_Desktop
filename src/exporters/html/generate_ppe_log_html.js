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
    if (val.data && typeof val.data === 'string') return `data:image/png;base64,${val.data.replace(/\s+/g,'')}`;
    return null;
  }
  if (typeof val !== 'string') return null;
  const s = val.trim(); if (!s) return null;
  if (s.startsWith('data:') || s.startsWith('http')) return s;
  const compact = s.replace(/\s+/g, '');
  if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
};

const formatIssueDate = (payloadOrMetadata) => {
  if (!payloadOrMetadata) return '';
  const merged = Object.assign({}, (payloadOrMetadata.metadata || {}), payloadOrMetadata);
  const candidates = [merged.issueDate, merged.issue_date, merged.date, merged.issuedDate, merged.issued_date];
  for (const raw of candidates) {
    if (!raw && raw !== 0) continue;
    const s = String(raw).trim(); if (!s) continue;
    const iso = /^(\d{4})[-\/](\d{2})[-\/](\d{2})$/;
    const dmy = /^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/;
    const mIso = s.match(iso);
    if (mIso) return `${mIso[3]}/${mIso[2]}/${mIso[1]}`;
    if (dmy.test(s)) return s.replace(/-/g, '/');
    const dt = new Date(s);
    if (!isNaN(dt.getTime())) {
      const dd = String(dt.getDate()).padStart(2, '0');
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const yyyy = dt.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
  }
  return '';
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const metadata = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : (p.rows || []);

  const rowData = rows.length ? rows : Array.from({ length: 20 }).map((_, i) => ({ id: i + 1 }));

  // Presentational column widths (based on renderer columnWidths / totalWidth)
  const total = 1260; // mirror presentational totalWidth
  const colDefs = [
    { key: 'no', w: 40 },
    { key: 'name', w: 180 },
    { key: 'job', w: 140 },
    // nine PPE columns, each 60
    { key: 'apron', w: 60 }, { key: 'cap', w: 60 }, { key: 'chefHat', w: 60 }, { key: 'trousers', w: 60 }, { key: 'safetyBoots', w: 60 }, { key: 'shirt', w: 60 }, { key: 'golfTShirt', w: 60 }, { key: 'workSuit', w: 60 }, { key: 'chefCoat', w: 60 },
    { key: 'staffNrc', w: 120 }, { key: 'staffSign', w: 120 }, { key: 'supSign', w: 120 }
  ];

  const colPercents = colDefs.map(c => Math.round((c.w / total) * 1000) / 10); // one decimal

  let logo = (p.assets && (p.assets.logoDataUri || p.assets.logo)) ? (p.assets.logoDataUri || p.assets.logo) : (p.logo || p.logoDataUri || metadata.logoUrl || metadata.companyLogo || metadata.logo || null);
  if (!logo) {
    try {
      const fs = require('fs'); const path = require('path');
      const candidates = [
        path.join(process.cwd(), 'assets', 'logo.jpeg'),
        path.join(process.cwd(), 'assets', 'logo.jpg'),
        path.join(process.cwd(), 'assets', 'logo.jpeg'),
        path.join(__dirname, '..', '..', 'assets', 'logo.jpeg'),
        path.join(__dirname, '..', '..', 'assets', 'logo.jpeg')
      ];
      for (const pth of candidates) if (fs.existsSync(pth)) { const buf = fs.readFileSync(pth); const ext = path.extname(pth).replace('.', ''); const mime = ext === 'png' ? 'image/png' : 'image/jpeg'; logo = `data:${mime};base64,${buf.toString('base64')}`; break; }
    } catch (e) {}
  }

  const renderPPECell = (r, key) => {
    const v = r[key];
    if (v === 'tick') return '✔️';
    if (v === 'cross') return '✖️';
    return escapeHtml(v || '');
  };

  const rowsHtml = rowData.map((r, i) => `
    <tr>
      <td style="width:${colPercents[0]}%" class="c-center">${escapeHtml(String(r.id || r.no || r.index || (i + 1)))}</td>
      <td style="width:${colPercents[1]}%" class="c-left">${escapeHtml(r.name || '')}</td>
      <td style="width:${colPercents[2]}%" class="c-left">${escapeHtml(r.jobTitle || r.job || '')}</td>
      <td style="width:${colPercents[3]}%" class="c-center">${renderPPECell(r, 'apron')}</td>
      <td style="width:${colPercents[4]}%" class="c-center">${renderPPECell(r, 'cap')}</td>
      <td style="width:${colPercents[5]}%" class="c-center">${renderPPECell(r, 'chefHat')}</td>
      <td style="width:${colPercents[6]}%" class="c-center">${renderPPECell(r, 'trousers')}</td>
      <td style="width:${colPercents[7]}%" class="c-center">${renderPPECell(r, 'safetyBoots')}</td>
      <td style="width:${colPercents[8]}%" class="c-center">${renderPPECell(r, 'shirt')}</td>
      <td style="width:${colPercents[9]}%" class="c-center">${renderPPECell(r, 'golfTShirt')}</td>
      <td style="width:${colPercents[10]}%" class="c-center">${renderPPECell(r, 'workSuit')}</td>
      <td style="width:${colPercents[11]}%" class="c-center">${renderPPECell(r, 'chefCoat')}</td>
      <td style="width:${colPercents[12]}%" class="c-center">${ resolveSignatureUri(r.staffNrc) ? `<img src="${escapeHtml(resolveSignatureUri(r.staffNrc))}" style="max-height:36px;object-fit:contain"/>` : escapeHtml(r.staffNrc || '') }</td>
      <td style="width:${colPercents[13]}%" class="c-center">${ resolveSignatureUri(r.staffSign) ? `<img src="${escapeHtml(resolveSignatureUri(r.staffSign))}" style="max-height:36px;object-fit:contain"/>` : escapeHtml(r.staffSign || '') }</td>
      <td style="width:${colPercents[14]}%" class="c-center">${ resolveSignatureUri(r.supSign) ? `<img src="${escapeHtml(resolveSignatureUri(r.supSign))}" style="max-height:36px;object-fit:contain"/>` : escapeHtml(r.supSign || '') }</td>
    </tr>`).join('\n');

  const headerCols = [
    'NO.', 'NAME', 'JOB TITLE', 'APRON', 'CAP', 'CHEF HAT', 'TROUSERS', 'SAFETY BOOTS', 'SHIRT', 'GOLF T-SHIRT', 'WORK SUIT', 'CHEF COAT', 'STAFF NRC', 'STAFF SIGN', 'SUP SIGN'
  ];

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4; margin:8mm}
    body{font-family: Inter, Arial, Helvetica, sans-serif; font-size:11px; color:#111; margin:0; padding:12px}
    .header{display:flex; align-items:center; justify-content:space-between; gap:12px}
    .logo{width:36px; height:36px; object-fit:contain}
    .companyBlock{display:flex; align-items:center; gap:10px}
    .companyName{font-weight:800}
    .title{font-weight:900; text-align:center; font-size:18px; margin-top:8px}
    table{width:100%; border-collapse:collapse; margin-top:10px}
    th,td{border:1px solid #000; padding:6px; font-size:10px}
    th{background:#eee; font-weight:700; text-align:center}
    td.c-center{ text-align:center }
    td.c-left{ text-align:left }
    .footerSigs{display:flex; gap:12px; margin-top:12px}
    .footerSigs > div{flex:1; min-height:48px; display:flex; align-items:center; justify-content:center}
  </style></head><body>

    <div class="header" style="align-items:flex-start">
      <div style="display:flex; align-items:center; gap:8px">
        ${logo ? `<img src="${logo}" class="logo"/>` : `<div style="width:36px;height:36px"></div>`}
        <div style="display:flex; align-items:center; gap:10px">
          <div style="font-size:24px; font-weight:700; color:#A00; margin-right:8px">Bravo</div>
          <div style="border-left:1px solid #000; padding-left:10px">
            <div class="companyName">${escapeHtml((metadata.companyName || p.companyName || 'BRAVO BRANDS LIMITED').toString())}</div>
            <div style="font-size:11px">${escapeHtml(metadata.companyTagline || p.companyTagline || '')}</div>
          </div>
        </div>
      </div>
      <div style="text-align:right"><div style="font-weight:700">Issue Date</div><div>${escapeHtml(metadata.issueDate || formatIssueDate(p) || '')}</div></div>
    </div>

    <div class="title">${escapeHtml(p.title || metadata.title || 'Personal Protective Equipment Log')}</div>
    <div style="text-align:center; margin-top:6px">Subject: ${escapeHtml(p.subject || metadata.subject || 'Personal Protective Equipment')}</div>

    <table>
      <thead><tr>${headerCols.map((c,i)=>`<th style="width:${colPercents[i]}%">${escapeHtml(c)}</th>`).join('')}</tr></thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="footerSigs">
      <div>${ resolveSignatureUri(metadata.hseqManagerSignature || metadata.hseqManagerSign || metadata.hseqManager || '') ? `<img src="${escapeHtml(resolveSignatureUri(metadata.hseqManagerSignature || metadata.hseqManagerSign || metadata.hseqManager || ''))}" style="max-width:160px; max-height:48px; object-fit:contain"/>` : escapeHtml(metadata.hseqManagerSignature || metadata.hseqManagerSign || metadata.hseqManager || '') }</div>
      <div>${ resolveSignatureUri(metadata.complexManagerSignature || metadata.complexManagerSign || metadata.complexManager || '') ? `<img src="${escapeHtml(resolveSignatureUri(metadata.complexManagerSignature || metadata.complexManagerSign || metadata.complexManager || ''))}" style="max-width:160px; max-height:48px; object-fit:contain"/>` : escapeHtml(metadata.complexManagerSignature || metadata.complexManagerSign || metadata.complexManager || '') }</div>
      <div>${ resolveSignatureUri(metadata.financialControllerSignature || metadata.financialController || '') ? `<img src="${escapeHtml(resolveSignatureUri(metadata.financialControllerSignature || metadata.financialController || ''))}" style="max-width:160px; max-height:48px; object-fit:contain"/>` : escapeHtml(metadata.financialControllerSignature || metadata.financialController || '') }</div>
    </div>

  </body></html>`;
};

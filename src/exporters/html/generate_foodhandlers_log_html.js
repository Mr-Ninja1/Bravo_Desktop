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

const renderSig = (v, w = 40, h = 25) => {
  const uri = resolveSignatureUri(v);
  if (!uri) return '';
  return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block; margin:0 auto; object-fit:contain; mix-blend-mode: multiply;"/>`;
};

const getLogoDataUri = (p) => {
  if (!p) return null;
  if (p.assets && p.assets.logoDataUri) return p.assets.logoDataUri;
  // Look for logo in local assets
  const candidates = [
    path.join(process.cwd(), 'renderer', 'assets', 'logo.jpeg'),
    path.join(process.cwd(), 'assets', 'logo.jpeg'),
    path.join(process.cwd(), 'assets', 'logo.png')
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
  const metadata = p.metadata || {};

  const week = p.week || metadata.week || '';
  const month = p.month || metadata.month || '';
  const year = p.year || metadata.year || '';
  const compiledBy = p.compiledBy || metadata.compiledBy || '';
  const approvedBy = p.approvedBy || metadata.approvedBy || '';
  const verifiedBy = p.verifiedBy || metadata.verifiedBy || '';
  
  // Resolve Logo
  const logoData = getLogoDataUri(p);

  const COL = { NAME: 140, JOB: 110, TIME: 44, SIGN: 42, SUP: 70 };
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const buildHeaderTop = () => {
    return dayNames.map(dn => 
      `<th colspan="2" style="border:1px solid #000; background:#d1d5db; font-size:10px; padding:4px">${dn.toUpperCase()}</th>`
    ).join('');
  };

  const buildHeaderSub = () => {
    return dayNames.map(() => 
      `<th style="width:${COL.TIME}px; font-size:8px; background:#f3f4f6">TIME</th><th style="width:${COL.SIGN}px; font-size:8px; background:#f3f4f6">SIGN</th>`
    ).join('');
  };

  const entries = Array.isArray(p.logEntries) ? p.logEntries : (Array.isArray(p.formData) ? p.formData : []);
  const rows = entries.length ? entries : Array.from({ length: 12 }).map(() => ({}));

  const rowsHtml = rows.map((row) => {
    const name = row.fullName || row.name || (Array.isArray(row) ? row[0] : '');
    const job = row.jobTitle || row.job || (Array.isArray(row) ? row[1] : '');
    const supVal = row.supervisorSign || (Array.isArray(row) ? row[16] : '');

    let dailyCells = '';
    for (let d = 0; d < 7; d++) {
      let timeVal = '';
      let signVal = '';
      if (Array.isArray(row)) {
        timeVal = row[2 + (d * 2)];
        signVal = row[2 + (d * 2) + 1];
      } else if (row.days && row.days[dayNames[d]]) {
        timeVal = row.days[dayNames[d]].time;
        signVal = row.days[dayNames[d]].sign;
      }
      dailyCells += `
        <td style="text-align:center; font-size:9px; border:1px solid #000">${escapeHtml(timeVal || '')}</td>
        <td style="text-align:center; border:1px solid #000">${renderSig(signVal, 38, 22)}</td>
      `;
    }

    return `
      <tr style="height:32px">
        <td style="padding-left:5px; font-size:10px; font-weight:600; border:1px solid #000">${escapeHtml(name)}</td>
        <td style="padding-left:5px; font-size:9px; border:1px solid #000">${escapeHtml(job)}</td>
        ${dailyCells}
        <td style="text-align:center; border:1px solid #000">${renderSig(supVal, 65, 22)}</td>
      </tr>`;
  }).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:8mm}
    *{box-sizing: border-box;}
    body{font-family:'Inter', Arial, sans-serif; margin:0; padding:0; color:#111}
    .container{width:1060px; margin:0 auto; padding:10px}
    .headerRow{display:flex; justify-content:space-between; align-items:center; border-bottom:2.5px solid #000; padding-bottom:8px; margin-bottom:10px}
    .logo{height:55px; width:auto; object-fit:contain}
    .mainTitle{font-size:18px; font-weight:900; text-align:center; margin:10px 0; text-transform:uppercase; color:#185a9d}
    .metaBar{display:flex; gap:20px; border:1px solid #000; background:#f9fafb; padding:8px; margin-bottom:10px; font-size:12px; font-weight:700}
    table{width:100%; border-collapse:collapse; border:2px solid #000; table-layout:fixed}
    th{border:1px solid #000; vertical-align:middle}
    .footer{margin-top:15px; display:flex; gap:15px}
    .sigBox{flex:1; border:1px solid #000; padding:8px; background:#fff; font-size:11px}
  </style></head><body>

  <div class="container">
    <div class="headerRow">
      <div style="display:flex; align-items:center; gap:15px">
        ${logoData ? `<img src="${logoData}" class="logo"/>` : `<div style="width:100px; height:50px; background:#eee; display:flex; align-items:center; justify-content:center; font-size:9px; color:#999">No Logo Found</div>`}
        <div>
          <div style="font-weight:900; font-size:16px; color:#185a9d">BRAVO BRANDS LIMITED</div>
          <div style="font-size:10px; font-weight:700; color:#43cea2">Food Safety Management System</div>
        </div>
      </div>
      <div style="text-align:right; font-size:10px; font-weight:800">
        <div>Doc ID: BBN-SHW-LOG-01</div>
        <div>Page: 1 of 1</div>
      </div>
    </div>

    <div class="mainTitle">Food Handlers Daily Showering Log</div>

    <div class="metaBar">
      <div>Week No: <span style="font-weight:400">${escapeHtml(week)}</span></div>
      <div>Month: <span style="font-weight:400">${escapeHtml(month)}</span></div>
      <div>Year: <span style="font-weight:400">${escapeHtml(year)}</span></div>
    </div>

    <table>
      <thead>
        <tr>
          <th rowspan="2" style="width:${COL.NAME}px; background:#e5e7eb">Full Name</th>
          <th rowspan="2" style="width:${COL.JOB}px; background:#e5e7eb">Job Title</th>
          ${buildHeaderTop()}
          <th rowspan="2" style="width:${COL.SUP}px; background:#e5e7eb; font-size:9px">Supervisor Sign</th>
        </tr>
        <tr>${buildHeaderSub()}</tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>

    <div class="footer">
      <div class="sigBox">
        <strong>Compiled By:</strong> ${escapeHtml(compiledBy)}
        <div style="margin-top:5px">${renderSig(metadata.compiledBySign || p.compiledBySign, 180, 30)}</div>
      </div>
      <div class="sigBox">
        <strong>Approved By:</strong> ${escapeHtml(approvedBy)}
        <div style="margin-top:5px">${renderSig(metadata.approvedBySign || p.approvedBySign, 180, 30)}</div>
      </div>
      <div class="sigBox">
        <strong>Verified By (HSEQ):</strong> ${escapeHtml(verifiedBy)}
        <div style="margin-top:5px">${renderSig(metadata.verifiedBySign || p.verifiedBySign, 180, 30)}</div>
      </div>
    </div>
  </div>

</body></html>`;
};
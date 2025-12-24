const fs = require('fs');
const path = require('path');

const escapeHtml = (s) => String(s === null || s === undefined ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const normalize = (incoming) => {
  if (!incoming) return {};
  let v = incoming;
  if (v.payload) v = v.payload;
  if (v.meta && v.meta.payload) v = v.meta.payload;
  if (v.payload) v = v.payload;
  return v || {};
};

const signatureUri = (v) => {
  if (!v) return null;
  const s = String(v || '');
  if (s.startsWith('data:')) return s;
  const compact = s.replace(/\s+/g, '');
  if (compact.length > 100) return `data:image/png;base64,${compact}`;
  return null;
};

const renderSig = (v, w = 150, h = 45) => {
  const uri = signatureUri(v);
  if (!uri) return `<div style="border-bottom: 1px dotted #ccc; width: 100px; height: 15px; margin: 5px auto;"></div>`;
  return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block; margin:0 auto; object-fit:contain; mix-blend-mode: multiply;"/>`;
};

module.exports = function generate(wrapper) {
  const p = normalize(wrapper);
  const metadata = p.metadata || {};
  const agenda = p.agenda || p.topics || '';
  const presenter = p.presenter || '';
  const dateVal = p.dateVal || metadata.date || p.date || '';
  const issues = Array.isArray(p.issues) ? p.issues : (Array.isArray(p.topics) ? p.topics : []);
  const table = p.table || {};
  const left = table.left || {};
  const right = table.right || {};

  const logo = (p.assets && p.assets.logoDataUri) || '';

  // Calibration for A4 Portrait (~730px usable)
  const COL = { sn: 35, name: 130, job: 110, sig: 90 };

  const rowsHtml = Array.from({ length: 15 }, (_, i) => {
    const n = i + 1;
    const leftCell = left[n] || {};
    const rightCell = right[n + 15] || {};

    return `
      <tr style="border-bottom: 1px solid #000;">
        <td style="width:${COL.sn}px; text-align:center; background:#f9fafb;">${n}</td>
        <td style="width:${COL.name}px; font-size:10px;">${escapeHtml(leftCell.name || '')}</td>
        <td style="width:${COL.job}px; font-size:10px;">${escapeHtml(leftCell.job || '')}</td>
        <td style="width:${COL.sig}px; text-align:center;">${renderSig(leftCell.sign, 80, 25)}</td>
        <td style="width:${COL.sn}px; text-align:center; background:#f9fafb; border-left: 2px solid #000;">${n + 15}</td>
        <td style="width:${COL.name}px; font-size:10px;">${escapeHtml(rightCell.name || '')}</td>
        <td style="width:${COL.job}px; font-size:10px;">${escapeHtml(rightCell.job || '')}</td>
        <td style="width:${COL.sig}px; text-align:center;">${renderSig(rightCell.sign, 80, 25)}</td>
      </tr>`;
  }).join('');

  const issuesHtml = issues.length > 0 
    ? `<div style="margin-top:8px; border-top: 1px dashed #ccc; padding-top:8px;">
        <div style="font-weight:700; text-decoration:underline; margin-bottom:4px;">Key Issues Discussed:</div>
        ${issues.map((it, idx) => `<div style="font-size:10px; margin-bottom:2px;"><strong>${idx + 1}.</strong> ${escapeHtml(it)}</div>`).join('')}
       </div>`
    : '';

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 portrait; margin:10mm}
    *{box-sizing: border-box;}
    body{font-family:'Inter', Arial, sans-serif; margin:0; padding:0; color:#111}
    .container{width:100%; max-width:750px; margin:0 auto;}
    .headerTable{width:100%; border:1px solid #000; border-collapse:collapse; margin-bottom:10px}
    .headerTable td{border:1px solid #000; padding:8px; vertical-align:top}
    .logo{height:45px; object-fit:contain; display:block; margin-bottom:4px}
    .mainTitle{font-size:14px; font-weight:900; text-align:center; margin:10px 0; text-transform:uppercase; border:1px solid #000; padding:6px; background:#f3f4f6}
    .infoGrid{width:100%; border:1px solid #000; border-collapse:collapse; margin-bottom:10px}
    .infoGrid td{border:1px solid #000; padding:6px; font-size:11px}
    .attendanceTable{width:100%; border:2px solid #000; border-collapse:collapse;}
    .attendanceTable th{background:#e5e7eb; border:1px solid #000; padding:6px; font-size:9px; font-weight:800; text-transform:uppercase}
    .attendanceTable td{border:1px solid #000; padding:4px; height:35px}
  </style></head><body>

  <div class="container">
    <table class="headerTable">
      <tr>
        <td style="width:220px">
          ${logo ? `<img src="${logo}" class="logo"/>` : ''}
          <div style="font-weight:900; font-size:14px; color:#185a9d">BRAVO BRANDS LIMITED</div>
          <div style="font-size:10px; font-weight:700; color:#43cea2">Safety Management System</div>
        </td>
        <td>
          <div style="font-size:10px"><strong>Doc No:</strong> BBN-SHEQ-PSM-R-01</div>
          <div style="font-size:10px"><strong>Issue Date:</strong> ${escapeHtml(dateVal)}</div>
          <div style="font-size:10px"><strong>Page:</strong> 1 of 1</div>
          <div style="margin-top:8px; border-top:1px solid #000; padding-top:4px">
            <div style="display:flex; justify-content:space-between; align-items:center">
                <div style="font-size:9px"><strong>Compiled:</strong> ${renderSig(metadata.compiledBySign || metadata.compiledBy, 120, 25)}</div>
                <div style="font-size:9px"><strong>Approved:</strong> ${renderSig(metadata.approvedBySign || metadata.approvedBy, 120, 25)}</div>
            </div>
          </div>
        </td>
      </tr>
    </table>

    <div class="mainTitle">Pre-Shift Meeting Attendance Register</div>

    <table class="infoGrid">
      <tr>
        <td colspan="2"><strong>AGENDA:</strong> ${escapeHtml(agenda)}</td>
      </tr>
      <tr>
        <td style="width:60%"><strong>PRESENTER:</strong> ${escapeHtml(presenter)}</td>
        <td style="width:40%"><strong>DATE:</strong> ${escapeHtml(dateVal)}</td>
      </tr>
      ${issuesHtml ? `<tr><td colspan="2">${issuesHtml}</td></tr>` : ''}
    </table>

    <table class="attendanceTable">
      <thead>
        <tr>
          <th>S/N</th><th>Full Name</th><th>Job Title</th><th>Signature</th>
          <th style="border-left: 2px solid #000;">S/N</th><th>Full Name</th><th>Job Title</th><th>Signature</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div style="margin-top:12px; display:flex; align-items:center; gap:10px; border:1px solid #000; padding:8px; background:#f9fafb">
      <div style="font-size:11px; font-weight:700">FACILITATOR:</div>
      <div style="font-size:11px; flex:1">${escapeHtml(metadata.facilitator || p.facilitator || '')}</div>
      <div style="width:150px">${renderSig(metadata.facilitatorSignature, 140, 35)}</div>
    </div>
  </div>

</body></html>`;
};
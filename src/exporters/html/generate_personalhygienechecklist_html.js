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

const renderSig = (v, w = 260, h = 80) => {
  const uri = resolveSignatureUri(v);
  if (!uri) return `<div style="border-bottom:1px dotted #ccc; width:260px; height:20px; margin-top:8px"></div>`;
  return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block; object-fit:contain;"/>`;
};

const getLogoDataUri = (p) => {
  if (!p) return null;
  if (p.assets && p.assets.logoDataUri) return p.assets.logoDataUri;
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
  const meta = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : [];

  const columnWidths = {
    date: 70,
    name: 180,
    check: 75,
    comment: 140,
    checkedBy: 110,
  };
  const totalWidth = columnWidths.date + columnWidths.name + (columnWidths.check * 10) + columnWidths.comment + columnWidths.checkedBy;

  const checks = ['hairCover','shortNails','workSuit','jewellery','lipstick','persistentDiarrhoea','persistentCough','runningNose','skinInfection','openWound'];

  const rowsHtml = rows.length ? rows.map(r => {
    const checksHtml = checks.map(k => {
      const v = r[k];
      const disp = v === 'tick' ? '✔️' : (v === 'cross' ? '✖️' : '');
      return `<td style="width:${columnWidths.check}px; padding:6px; border:1px solid #000; text-align:center">${escapeHtml(disp)}</td>`;
    }).join('');
    return `
      <tr>
        <td style="width:${columnWidths.date}px; padding:6px; border:1px solid #000">${escapeHtml(r.date || '')}</td>
        <td style="width:${columnWidths.name}px; padding:6px; border:1px solid #000; text-align:left">${escapeHtml(r.name || '')}</td>
        ${checksHtml}
        <td style="width:${columnWidths.comment}px; padding:6px; border:1px solid #000; text-align:left">${escapeHtml(r.comment || '')}</td>
        <td style="width:${columnWidths.checkedBy}px; padding:6px; border:1px solid #000; text-align:left">${escapeHtml(r.checkedBy || '')}</td>
      </tr>
    `;
  }).join('') : Array.from({length:8}).map(()=>{
    return `<tr>${'<td style="width:'+columnWidths.date+'px; padding:6px; border:1px solid #000">&nbsp;</td>'}<td style="width:${columnWidths.name}px; padding:6px; border:1px solid #000">&nbsp;</td>${'<td style="width:'+columnWidths.check+'px; padding:6px; border:1px solid #000">&nbsp;</td>'.repeat(10)}<td style="width:${columnWidths.comment}px; padding:6px; border:1px solid #000">&nbsp;</td><td style="width:${columnWidths.checkedBy}px; padding:6px; border:1px solid #000">&nbsp;</td></tr>`;
  }).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4; margin:8mm}
    *{box-sizing:border-box}
    body{font-family:Arial, Helvetica, sans-serif; margin:0; color:#111}
    .wrap{padding:12px}
    .headerRowTop{display:flex; align-items:center; justify-content:space-between; margin-bottom:6px}
    .logo{width:64px; height:48px; object-fit:contain}
    .formTitle{font-size:20px; font-weight:900; text-align:center}
    .subject{font-size:12px; margin-bottom:6px}
    .infoRowTop{display:flex; justify-content:space-between; margin-bottom:8px}
    .tableWrap{overflow:auto}
    table{border-collapse:collapse; width:${totalWidth + 20}px}
    th{padding:8px; border:1px solid #000; background:#eee; text-align:center; font-weight:700}
    td{padding:6px; border:1px solid #000; text-align:center}
    .footerSignaturesRow{display:flex; gap:24px; margin-top:12px}
    .signatureBlock{display:flex; flex-direction:column; align-items:flex-start}
    .footerLabel{font-weight:700; margin-bottom:6px}
  </style></head><body>

  <div class="wrap">
    <div class="headerRowTop">
      <div style="display:flex; align-items:center; gap:8px">
        <img src="${getLogoDataUri(p) || ''}" class="logo"/>
        <div style="display:flex; flex-direction:column"><div style="font-weight:900; font-size:14px">BRAVO BRANDS LIMITED</div><div style="font-size:11px">Food Safety Management System</div></div>
      </div>
      <div style="text-align:center" class="formTitle">${escapeHtml(p.title || 'Personal Hygiene Checklist')}</div>
      <div style="width:140px; text-align:right"><div style="font-size:12px"><strong>Issue Date:</strong> ${escapeHtml(meta.issueDate || p.savedAt || '')}</div></div>
    </div>

    <div class="subject"><strong>Subject:</strong> Personnel Hygiene Checklist</div>
    <div class="infoRowTop"><div><strong>Compiled By:</strong> ${escapeHtml(meta.compiledBy || '')}</div><div><strong>Approved By:</strong> ${escapeHtml(meta.approvedBy || 'Hassani Ali')}</div></div>

    <div class="tableWrap"><table>
      <thead>
        <tr>
          <th style="width:${columnWidths.date}px; min-height:70px">DATE</th>
          <th style="width:${columnWidths.name}px">NAME</th>
          ${'<th style="width:'+columnWidths.check+'px; min-height:70px">CHECK</th>'.repeat(10)}
          <th style="width:${columnWidths.comment}px">COMMENT</th>
          <th style="width:${columnWidths.checkedBy}px">CHECKED BY?</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table></div>

    <div class="footerSignaturesRow">
      <div class="signatureBlock">
        <div class="footerLabel">HSEQ MANAGER SIGN</div>
        ${renderSig(meta.hseqSign || meta.hseqManagerSign || p.hseqSign || p.hseqManagerSign)}
      </div>
      <div class="signatureBlock">
        <div class="footerLabel">SUPERVISOR SIGN</div>
        ${renderSig(meta.supervisorSign || p.supervisorSign)}
      </div>
    </div>
  </div>

</body></html>`;
};

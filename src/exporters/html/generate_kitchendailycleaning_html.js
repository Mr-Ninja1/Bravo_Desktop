const fs = require('fs');
const path = require('path');

function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolveSignatureUri(val) {
  if (!val) return null;
  if (typeof val === 'object') {
    if (val.uri && typeof val.uri === 'string') return val.uri;
    if (val.data && typeof val.data === 'string') return `data:image/png;base64,${val.data.replace(/\s+/g,'')}`;
    return null;
  }
  if (typeof val !== 'string') return null;
  const s = val.trim();
  if (!s) return null;
  if (s.startsWith('data:') || s.startsWith('http:') || s.startsWith('https:') || s.startsWith('file:') || s.startsWith('blob:')) return s;
  // treat long base64-ish strings as png
  const compact = s.replace(/\s+/g,'');
  const base64ish = /^[A-Za-z0-9+/=]+$/;
  if (compact.length > 100 && base64ish.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
}

function inlineFallbackLogo() {
  const candidates = ['assets/logo.png','assets/logo.jpeg','assets/logo.jpg','assets/logo.webp'];
  for (const rel of candidates) {
    try {
      const p = path.join(process.cwd(), rel);
      if (fs.existsSync(p)) {
        const b = fs.readFileSync(p);
        const ext = path.extname(p).slice(1) || 'png';
        return `data:image/${ext};base64,${b.toString('base64')}`;
      }
    } catch (e) { /* ignore */ }
  }
  return null;
}

module.exports = function generate(wrapper = {}) {
  const payload = wrapper && wrapper.payload ? wrapper.payload : (wrapper || {});
  const p = payload || {};
  const metadata = p.metadata || {};
  const title = p.title || 'Food Contact Surface Cleaning and Sanitizing Log Sheet (Kitchen)';
  const timeSlots = Array.isArray(p.timeSlots) && p.timeSlots.length ? p.timeSlots : (p.formData && p.formData[0] && p.formData[0].times ? Object.keys(p.formData[0].times) : ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00']);
  const formData = Array.isArray(p.formData) ? p.formData : [];
  const layout = p.layoutHints || {};
  const COL = Object.assign({}, layout);
  const tableWidth = p._tableWidth || COL._tableWidth || Math.max(900, (COL.EQUIPMENT || 200) + (COL.PPM || 80) + (timeSlots.length * (COL.TIME_SLOT || 56)) + (COL.STAFF_NAME || 120) + (COL.SIGNATURE || 120) + (COL.SLIP_NAME || 140) + (COL.SUP_SIGN || 140));

  let logoData = (p.assets && p.assets.logoDataUri) || p.logoDataUri || metadata.logoDataUri || null;
  if (!logoData && (p.assets && p.assets.logo)) logoData = p.assets.logo;
  if (!logoData) logoData = inlineFallbackLogo();

  const perTime = COL.TIME_SLOT || 56;

  // Build HTML
  const css = `
    body{font-family: Inter, Arial, Helvetica, sans-serif; color:#111; margin:0; padding:16px; background:#fff}
    .card{max-width:1200px; margin:0 auto}
    .header{display:flex; align-items:center; justify-content:space-between; padding:8px 0}
    .left{display:flex; align-items:center}
    .logo{width:72px; height:72px; object-fit:contain}
    .company{font-weight:800; margin-left:12px}
    .title{font-weight:800; text-align:center; flex:1}
    .meta{font-size:13px; color:#444}
    .table{border-collapse:collapse; width:100%; margin-top:12px}
    th,td{border:1px solid #e6e6e6; padding:8px; font-size:12px}
    th{background:#f3f4f6; font-weight:700}
    .timeHeader{display:flex}
    .timeCell{display:inline-block; text-align:center}
  `;

  let html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${css}</style></head><body><div class="card">`;
  html += `<div class="header">`;
  html += `<div class="left">`;
  if (logoData) html += `<img class="logo" src="${escapeHtml(logoData)}" alt="logo"/>`;
  html += `<div class="company">${escapeHtml(metadata.companyName || 'Bravo')}</div>`;
  html += `</div>`;
  html += `<div class="title">${escapeHtml(title)}</div>`;
  html += `<div style="min-width:160px;text-align:right"><div class="meta">${escapeHtml(metadata.location||'')}</div><div class="meta">${escapeHtml(metadata.date||'')}</div></div>`;
  html += `</div>`;

  // Table header
  html += `<table class="table" style="width:${tableWidth}px"><thead><tr>`;
  html += `<th style="width:${COL.EQUIPMENT||200}px">EQUIPMENT</th>`;
  html += `<th style="width:${COL.PPM||80}px">SANITIZER - PPM</th>`;
  // time interval composite header
  const timeBlockWidth = perTime * timeSlots.length;
  html += `<th style="width:${timeBlockWidth}px">`;
  html += `<div style="font-weight:700; text-align:center">TIME INTERVAL</div>`;
  html += `<div class="timeHeader">`;
  for (const t of timeSlots) {
    html += `<div class="timeCell" style="width:${perTime}px">${escapeHtml(t)}</div>`;
  }
  html += `</div>`;
  html += `</th>`;
  html += `<th style="width:${COL.STAFF_NAME||120}px">STAFF NAME</th>`;
  html += `<th style="width:${COL.SIGNATURE||120}px">STAFF SIGN</th>`;
  html += `<th style="width:${COL.SLIP_NAME||140}px">SUP NAME</th>`;
  html += `<th style="width:${COL.SUP_SIGN||140}px">SUP SIGN</th>`;
  html += `</tr></thead><tbody>`;

  for (const row of formData) {
    html += `<tr>`;
    html += `<td>${escapeHtml(row.name||row.area||'')}</td>`;
    html += `<td>${escapeHtml(row.ppm||'')}</td>`;
    // times
    html += `<td style="padding:0">`;
    html += `<table style="border-collapse:collapse;width:100%"><tr>`;
    for (const t of timeSlots) {
      const mark = (row.times && row.times[t]) ? '✓' : (row[t] ? '✓' : '');
      html += `<td style="border:1px solid #e6e6e6; text-align:center; width:${perTime}px; padding:6px">${escapeHtml(mark)}</td>`;
    }
    html += `</tr></table>`;
    html += `</td>`;
    html += `<td>${escapeHtml(row.staffName||'')}</td>`;
    // staff sign cell
    html += `<td style="text-align:center">`;
    const sUri = resolveSignatureUri(row.staffSign || row.staffSignature || row.sign);
    if (sUri) html += `<img src="${escapeHtml(sUri)}" style="max-width:${(COL.SIGNATURE||120)-20}px; max-height:48px; object-fit:contain"/>`; else html += '';
    html += `</td>`;
    html += `<td>${escapeHtml(row.slipName||row.supName||'')}</td>`;
    html += `<td style="text-align:center">`;
    const supUri = resolveSignatureUri(row.supSign || row.supSignature);
    if (supUri) html += `<img src="${escapeHtml(supUri)}" style="max-width:${(COL.SUP_SIGN||140)-20}px; max-height:48px; object-fit:contain"/>`;
    html += `</td>`;
    html += `</tr>`;
  }

  html += `</tbody></table>`;

  // Verified by
  const verifiedRaw = p.verifiedSign || metadata.verifiedSign || metadata.verified_by || metadata.verifiedBy || metadata.verified || null;
  const verUri = resolveSignatureUri(verifiedRaw);
  html += `<div style="margin-top:12px"><strong>Verified By:</strong> `;
  if (verUri) html += `<img src="${escapeHtml(verUri)}" style="max-width:260px; max-height:80px; vertical-align:middle; margin-left:12px"/>`; else html += `<span style="margin-left:8px">${escapeHtml(metadata.verifiedBy||'')}</span>`;
  html += `</div>`;

  html += `</div></body></html>`;
  return html;
};

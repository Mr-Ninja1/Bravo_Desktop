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
  const compact = s.replace(/\s+/g,'');
  if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
}

function inlineFallbackLogo() {
  const candidates = ['assets/logo.jpeg','assets/logo.jpeg','assets/logo.jpg','assets/logo.webp'];
  for (const rel of candidates) {
    try {
      const p = path.join(process.cwd(), rel);
      if (fs.existsSync(p)) {
        const b = fs.readFileSync(p);
        const ext = path.extname(p).slice(1) || 'png';
        return `data:image/${ext==='jpg'?'jpeg':ext};base64,${b.toString('base64')}`;
      }
    } catch (e) {}
  }
  return null;
}

module.exports = function generate(wrapper = {}) {
  const p = wrapper.payload || wrapper || {};
  const metadata = p.metadata || {};
  const title = p.title || 'FOOD CONTACT SURFACE CLEANING & SANITIZING LOG (KITCHEN)';
  
  // Dynamic Extraction of Metadata Fields
  const location = metadata.location || p.location || metadata.site || '—';
  const date = metadata.date || p.date || metadata.Date || '—';
  const shift = metadata.shift || p.shift || metadata.Shift || '—';
  
  const timeSlots = Array.isArray(p.timeSlots) && p.timeSlots.length 
    ? p.timeSlots 
    : (p.formData && p.formData[0] && p.formData[0].times ? Object.keys(p.formData[0].times) : ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00']);
  
  const formData = Array.isArray(p.formData) ? p.formData : Array.from({length: 10}).map(() => ({}));
  const COL = p.layoutHints || {};
  const perTime = COL.TIME_SLOT || 52;

  let logoData = p.assets?.logoDataUri || p.logoDataUri || metadata.logoDataUri || p.assets?.logo || inlineFallbackLogo();

  const css = `
    @page { size: A4 landscape; margin: 8mm; }
    body { font-family: 'Inter', system-ui, sans-serif; color: #1f2937; margin: 0; padding: 0; line-height: 1.2; }
    .container { width: 100%; }
    
    .header-top { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #185a9d; padding-bottom: 10px; margin-bottom: 12px; }
    .brand { display: flex; align-items: center; gap: 15px; }
    .logo { height: 55px; width: auto; object-fit: contain; }
    .company-name { font-size: 22px; font-weight: 800; color: #185a9d; text-transform: uppercase; }
    .doc-type { text-align: right; font-size: 10px; font-weight: 600; color: #6b7280; }

    .title { font-size: 16px; font-weight: 800; text-align: center; margin: 10px 0; color: #111; }

    /* Enhanced Metadata Bar */
    .meta-bar { display: flex; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 15px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .meta-item { flex: 1; padding: 10px 15px; border-right: 1px solid #e5e7eb; }
    .meta-item:last-child { border-right: none; }
    .meta-label { font-size: 9px; font-weight: 800; color: #4b5563; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.025em; }
    .meta-value { font-size: 13px; font-weight: 600; color: #111; }

    table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1.5px solid #111; }
    th { background: #1f2937; color: white; border: 1px solid #111; font-size: 10px; padding: 8px 2px; text-transform: uppercase; }
    td { border: 1px solid #d1d5db; height: 42px; padding: 4px; font-size: 11px; text-align: center; }
    
    .equipment-cell { text-align: left; padding-left: 10px; font-weight: 700; background: #f9fafb; color: #111; }
    .ppm-cell { font-weight: 800; color: #185a9d; background: #eff6ff; }
    
    .time-sub-header { display: flex; border-top: 1px solid rgba(255,255,255,0.2); margin-top: 6px; }
    .time-label { flex: 1; padding: 4px 0; font-size: 9px; border-right: 1px solid rgba(255,255,255,0.1); }
    .time-label:last-child { border-right: none; }

    .tick { color: #10b981; font-size: 18px; font-weight: bold; }
    .sig-img { max-height: 38px; max-width: 90%; mix-blend-mode: multiply; }
    
    .footer { margin-top: 20px; display: flex; align-items: center; justify-content: flex-end; }
    .verify-box { border: 1px solid #d1d5db; padding: 12px 24px; border-radius: 6px; background: #fff; display: flex; align-items: center; gap: 15px; }
  `;

  let html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="container">`;

  // Branding Header
  html += `
    <div class="header-top">
      <div class="brand">
        ${logoData ? `<img class="logo" src="${escapeHtml(logoData)}"/>` : ''}
        <div class="company-name">${escapeHtml(metadata.companyName || 'Bravo')}</div>
      </div>
      <div class="doc-type">
        <div>FOOD SAFETY MANAGEMENT SYSTEM</div>
        <div>FORM ID: KITCHEN-LOG-FOH</div>
      </div>
    </div>
    <div class="title">${escapeHtml(title)}</div>`;

  // Dynamically Patched Metadata Bar
  html += `
    <div class="meta-bar">
      <div class="meta-item"><div class="meta-label">Location</div><div class="meta-value">${escapeHtml(location)}</div></div>
      <div class="meta-item"><div class="meta-label">Date</div><div class="meta-value">${escapeHtml(date)}</div></div>
      <div class="meta-item"><div class="meta-label">Shift</div><div class="meta-value">${escapeHtml(shift)}</div></div>
    </div>`;

  // Table Structure
  html += `<table><thead><tr>`;
  html += `<th style="width: 190px;">EQUIPMENT</th>`;
  html += `<th style="width: 75px;">SANITIZER<br>(PPM)</th>`;
  
  html += `<th style="width: ${perTime * timeSlots.length}px;">
             TIME INTERVAL
             <div class="time-sub-header">
               ${timeSlots.map(t => `<div class="time-label">${escapeHtml(t)}</div>`).join('')}
             </div>
           </th>`;
  
  html += `<th style="width: 120px;">STAFF NAME</th>`;
  html += `<th style="width: 100px;">STAFF SIGN</th>`;
  html += `<th style="width: 120px;">SUP NAME</th>`;
  html += `<th style="width: 100px;">SUP SIGN</th>`;
  html += `</tr></thead><tbody>`;

  for (const row of formData) {
    const sUri = resolveSignatureUri(row.staffSign || row.staffSignature || row.sign);
    const supUri = resolveSignatureUri(row.supSign || row.supSignature);

    html += `<tr>`;
    html += `<td class="equipment-cell">${escapeHtml(row.name || row.area || '')}</td>`;
    html += `<td class="ppm-cell">${escapeHtml(row.ppm || '')}</td>`;
    
    html += `<td style="padding:0"><div style="display:flex; height:100%;">`;
    for (const t of timeSlots) {
      const mark = (row.times && row.times[t]) || row[t] ? '<span class="tick">✓</span>' : '';
      html += `<div style="flex:1; border-right:1px solid #d1d5db; display:flex; align-items:center; justify-content:center;">${mark}</div>`;
    }
    html += `</div></td>`;

    html += `<td>${escapeHtml(row.staffName || '')}</td>`;
    html += `<td>${sUri ? `<img src="${escapeHtml(sUri)}" class="sig-img"/>` : ''}</td>`;
    html += `<td>${escapeHtml(row.slipName || row.supName || '')}</td>`;
    html += `<td>${supUri ? `<img src="${escapeHtml(supUri)}" class="sig-img"/>` : ''}</td>`;
    html += `</tr>`;
  }

  html += `</tbody></table>`;



  html += `</div></body></html>`;
  return html;
};
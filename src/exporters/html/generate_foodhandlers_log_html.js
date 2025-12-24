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
  const s = val.trim(); if (!s) return null;
  if (s.startsWith('data:') || s.startsWith('http')) return s;
  const compact = s.replace(/\s+/g, '');
  if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const metadata = p.metadata || {};
  
  const title = p.title || metadata.title || 'Food Handlers Daily Handwashing Tracking Log Sheet';
  const date = p.date || metadata.date || '';
  const location = p.location || metadata.location || '';
  const shift = p.shift || metadata.shift || '';
  const verifiedBy = p.verifiedBy || metadata.verifiedBy || '';
  const timeSlots = Array.isArray(p.timeSlots) ? p.timeSlots : (metadata.timeSlots || []);
  const handlers = Array.isArray(p.handlers) ? p.handlers : (p.formData || []);

  // Branding & Logo Logic
  let logo = (p.assets && (p.assets.logoDataUri || p.assets.logo)) ? (p.assets.logoDataUri || p.assets.logo) : (p.logo || p.logoDataUri || metadata.logoUrl || metadata.companyLogo || metadata.logo || null);
  if (!logo) {
    try {
      const fs = require('fs');
      const explicit = 'C:\\Users\\sikal\\Desktop\\Bravo_Desktop\\assets\\logo.jpeg';
      if (fs.existsSync(explicit)) {
        const data = fs.readFileSync(explicit);
        logo = `data:image/jpeg;base64,${data.toString('base64')}`;
      }
    } catch (e) {}
  }

  const sigHtml = (v, h = 32) => {
    const uri = resolveSignatureUri(v);
    if (uri) return `<img src="${uri}" style="max-height:${h}px; width:auto; object-fit:contain; display:block; mix-blend-mode:multiply;"/>`;
    return `<div style="font-size:8px; color:#94a3b8; font-style:italic;">${escapeHtml(v || '')}</div>`;
  };

  const renderCheck = (row, time) => (row.checks && row.checks[time]) ? '☑' : '☐';

  const rowsToRender = handlers.length ? handlers : Array.from({ length: 12 }).map((_, i) => ({ id: i + 1 }));

  const rowsHtml = rowsToRender.map((row, idx) => `
    <tr class="tr">
      <td class="td sn-cell">${escapeHtml(String(row.id || idx + 1))}</td>
      <td class="td name-cell">${escapeHtml(row.fullName || row.name || '')}</td>
      <td class="td">${escapeHtml(row.jobTitle || row.job || '')}</td>
      ${timeSlots.map(t => `<td class="td check-cell">${renderCheck(row, t)}</td>`).join('')}
      <td class="td">${sigHtml(row.staffSign)}</td>
      <td class="td">${escapeHtml(row.supName || '')}</td>
      <td class="td">${sigHtml(row.supSign)}</td>
    </tr>`).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A4 landscape; margin: 8mm; }
    body { font-family: 'Inter', Arial, sans-serif; font-size: 10px; color: #1e293b; margin: 0; padding: 0; background: #fff; }
    
    .headerSection { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #185a9d; padding-bottom: 8px; margin-bottom: 12px; }
    .branding { display: flex; align-items: center; gap: 12px; }
    .logo { height: 48px; width: auto; object-fit: contain; }
    .companyName { font-size: 18px; font-weight: 800; color: #185a9d; text-transform: uppercase; }
    
    .titleBlock { text-align: center; margin-bottom: 15px; }
    .formTitle { font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .metaRow { display: flex; gap: 24px; background: #f8fafc; padding: 8px 12px; border-radius: 4px; border: 1px solid #e2e8f0; margin-bottom: 15px; }
    .metaItem { font-weight: 700; color: #475569; }
    .metaValue { font-weight: 400; color: #0f172a; margin-left: 4px; border-bottom: 1px solid #cbd5e1; min-width: 60px; display: inline-block; }

    table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1.5px solid #334155; }
    th, td { border: 1px solid #334155; padding: 6px; box-sizing: border-box; overflow: hidden; }
    th { background: #f1f5f9; font-weight: 800; text-transform: uppercase; font-size: 8.5px; }
    
    /* Fattened Rows */
    tr { min-height: 42px; }
    .td { height: 42px; vertical-align: middle; text-align: center; }
    
    .sn-cell { width: 35px; }
    .name-cell { text-align: left; padding-left: 8px; width: 140px; }
    .check-cell { font-size: 16px; width: 45px; }
    
    .verifiedSection { display: flex; align-items: flex-end; gap: 40px; margin-top: 20px; }
    .sigWrapper { border-left: 3px solid #185a9d; padding-left: 12px; }
    .sigLabel { font-weight: 800; color: #185a9d; font-size: 9px; text-transform: uppercase; margin-bottom: 4px; }
  </style></head><body>

    <div class="headerSection">
      <div class="branding">
        ${logo ? `<img src="${logo}" class="logo"/>` : ''}
        <div class="companyName">${escapeHtml(metadata.companyName || 'Bravo')}</div>
      </div>
      <div class="sigWrapper" style="border:none;">
         <span class="sigLabel">Form Status:</span> <span style="color:#059669; font-weight:700">Daily Log</span>
      </div>
    </div>

    <div class="titleBlock">
      <div class="formTitle">${escapeHtml(title)}</div>
    </div>

    <div class="metaRow">
      <div class="metaItem">DATE: <span class="metaValue">${escapeHtml(date)}</span></div>
      <div class="metaItem">LOCATION: <span class="metaValue">${escapeHtml(location)}</span></div>
      <div class="metaItem">SHIFT: <span class="metaValue">${escapeHtml(shift)}</span></div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:35px">S/N</th>
          <th style="width:140px">Full Name</th>
          <th style="width:100px">Job Title</th>
          ${timeSlots.map(t => `<th style="width:45px">${escapeHtml(t)}</th>`).join('')}
          <th style="width:100px">Staff Sign</th>
          <th style="width:100px">Sup Name</th>
          <th style="width:100px">Sup Sign</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="verifiedSection">
      <div class="sigWrapper">
        <div class="sigLabel">Verified By:</div>
        ${sigHtml(verifiedBy, 50)}
      </div>
      <div class="sigWrapper">
        <div class="sigLabel">Complex Manager:</div>
        ${sigHtml(p.complexManagerSign || metadata.complexManagerSign, 50)}
      </div>
    </div>

  </body></html>`;
};
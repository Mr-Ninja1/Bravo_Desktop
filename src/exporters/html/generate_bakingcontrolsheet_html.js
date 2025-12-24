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
  const formData = Array.isArray(p.formData) ? p.formData : (p.rows || []);

  const headers = [
    { key: 'prodDate', label: 'DATE', weight: 80 },
    { key: 'prodName', label: 'PRODUCT NAME', weight: 180 },
    { key: 'batchNo', label: 'BATCH NO.', weight: 90 },
    { key: 'proofingTemp', label: 'PROOF TEMP', weight: 100 },
    { key: 'proofingTime', label: 'PROOF TIME', weight: 100 },
    { key: 'ovenTemp', label: 'OVEN TEMP', weight: 100 },
    { key: 'bakingTime', label: 'BAKE TIME', weight: 100 },
    { key: 'bakerSign', label: 'BAKER SIGN', weight: 120 },
    { key: 'supervisorSign', label: 'SUP SIGN', weight: 120 }
  ];

  const totalWeight = headers.reduce((s, h) => s + h.weight, 0);
  const colPct = (w) => ((w / totalWeight) * 100).toFixed(4) + '%';

  // Branding & Logo Logic (Pinned Top-Left + Local Fallback)
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

  const sigHtml = (v, h = 38) => {
    const uri = resolveSignatureUri(v);
    if (uri) return `<img src="${uri}" style="max-height:${h}px; width:auto; object-fit:contain; display:block; mix-blend-mode:multiply;"/>`;
    return `<div style="font-size:8px; color:#94a3b8; font-style:italic;">${escapeHtml(v || '')}</div>`;
  };

  const rowsToRender = formData.length ? formData : Array.from({ length: 10 }).map(() => ({}));

  const rowsHtml = rowsToRender.map((row) => {
    return `
      <div class="tr">
        ${headers.map(col => {
          const val = row[col.key] || '';
          const isSign = col.key.toLowerCase().includes('sign');
          return `<div class="td" style="width:${colPct(col.weight)}">
            ${isSign ? sigHtml(val) : escapeHtml(val)}
          </div>`;
        }).join('')}
      </div>`;
  }).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8">
  <style>
    @page { size: A4 landscape; margin: 8mm; }
    body { font-family: 'Inter', Arial, sans-serif; font-size: 10px; color: #1e293b; margin: 0; padding: 0; background: #fff; }
    
    .headerSection { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #185a9d; padding-bottom: 8px; margin-bottom: 12px; }
    .branding { display: flex; align-items: center; gap: 12px; }
    .logo { height: 48px; width: auto; object-fit: contain; }
    .companyName { font-size: 18px; font-weight: 800; color: #185a9d; text-transform: uppercase; }
    
    .titleBlock { text-align: center; margin-bottom: 15px; }
    .formTitle { font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }

    .approvalHeader { display: flex; justify-content: space-between; margin-bottom: 15px; background: #f8fafc; padding: 8px 12px; border-radius: 4px; border: 1px solid #e2e8f0; }
    .authLabel { font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; }
    .authValue { font-size: 11px; font-weight: 600; color: #0f172a; }

    .table { border: 1.5px solid #334155; display: flex; flex-direction: column; width: 100%; border-bottom: none; }
    .thead { display: flex; background: #f1f5f9; border-bottom: 1.5px solid #334155; }
    .th { padding: 8px 4px; border-right: 1px solid #334155; text-align: center; font-weight: 800; font-size: 9px; text-transform: uppercase; }
    .th:last-child { border-right: none; }

    .tr { display: flex; border-bottom: 1px solid #cbd5e1; min-height: 48px; align-items: stretch; page-break-inside: avoid; }
    .tr:last-child { border-bottom: 1.5px solid #334155; }
    .td { border-right: 1px solid #334155; padding: 6px; display: flex; align-items: center; justify-content: center; text-align: center; box-sizing: border-box; }
    .td:last-child { border-right: none; }

    .footer { margin-top: 15px; display: flex; justify-content: space-between; font-size: 8px; color: #94a3b8; }
  </style>
</head><body>

  <div class="headerSection">
    <div class="branding">
      ${logo ? `<img class="logo" src="${logo}"/>` : ''}
      <div class="companyName">${escapeHtml(metadata.companyName || 'Bravo Brands')}</div>
    </div>
    <div style="text-align: right; font-weight: 700; color: #64748b;">Issue: ${escapeHtml(metadata.issueDate || '2025')}</div>
  </div>

  <div class="titleBlock">
    <div class="formTitle">Baking Control Sheet</div>
  </div>

  <div class="approvalHeader">
    <div>
      <div class="authLabel">Compiled By:</div>
      <div class="authValue">${escapeHtml(metadata.compiledBy || metadata.compiled_by || '—')}</div>
    </div>
    <div style="text-align: right;">
      <div class="authLabel">Approved By:</div>
      <div class="authValue">${escapeHtml(metadata.approvedBy || metadata.approved_by || '—')}</div>
    </div>
  </div>

  <div class="table">
    <div class="thead">
      ${headers.map(h => `<div class="th" style="width:${colPct(h.weight)}">${h.label}</div>`).join('')}
    </div>
    ${rowsHtml}
  </div>

  <div class="footer">
    <div>Bakery Production Quality Control</div>
    <div>Bravo Food Safety Management System</div>
  </div>

</body></html>`;
};
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
    if (val.uri) return val.uri;
    if (val.data) return `data:image/png;base64,${String(val.data).replace(/\s+/g,'')}`;
    return null;
  }
  if (typeof val !== 'string') return null;
  const s = val.trim(); if (!s) return null;
  if (s.startsWith('data:') || s.startsWith('http')) return s;
  const compact = s.replace(/\s+/g,'');
  if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const metadata = p.metadata || {};
  // Standardize rows to 31 if empty to represent a full month
  const rows = Array.isArray(p.formData) && p.formData.length ? p.formData : (p.rows || Array.from({ length: 31 }).map((_,i)=>({ day: i+1 })));

  // Tightened weights for better landscape fit
  const COL_WEIGHTS = (p.layoutHints && p.layoutHints.WIDTHS) || {
    DATE: 35, TEMP: 50, SIGN: 80, CORRECTIVE_ACTION: 220, SUP_NAME_SIGN: 90, COMPLEX_SIGN: 90, FSC_SIGN: 90, HSEQ_SIGN: 90
  };

  const total = Object.values(COL_WEIGHTS).reduce((s, v) => s + (Number(v) || 0), 0) || 1;
  const colPercent = (w) => ((w / total) * 100).toFixed(4) + '%';

  const getColStyleStr = (keys) => {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    const widthSum = keysArray.reduce((s, k) => s + (Number(COL_WEIGHTS[k] || 0)), 0) || 0;
    return `width:${colPercent(widthSum)};`;
  };

  let logo = (p.assets && (p.assets.logoDataUri || p.assets.logo)) ? (p.assets.logoDataUri || p.assets.logo) : (p.logo || p.logoDataUri || metadata.logoUrl || metadata.companyLogo || metadata.logo || null);
  if (!logo) {
    try {
      const fs = require('fs');
      const path = require('path');
      const explicit = 'C:\\Users\\sikal\\Desktop\\Bravo_Desktop\\assets\\logo.jpeg';
      if (fs.existsSync(explicit)) {
        const data = fs.readFileSync(explicit);
        logo = `data:image/jpeg;base64,${data.toString('base64')}`;
      } else {
        const alt = path.resolve(__dirname, '..', '..', 'assets', 'logo.jpeg');
        if (fs.existsSync(alt)) {
          const data = fs.readFileSync(alt);
          logo = `data:image/jpeg;base64,${data.toString('base64')}`;
        }
      }
    } catch (e) { }
  }

  // Reduced heights for signatures to keep rows slim
  const sigHtml = (v, h=22) => { 
    const uri = resolveSignatureUri(v); 
    if (uri) return `<img src="${uri}" style="max-height:${h}px; width: auto; object-fit:contain; display:block; mix-blend-mode: multiply;"/>`; 
    return `<div style="font-size:7px; color:#94a3b8;">${escapeHtml(v||'')}</div>` 
  };

  const rowsHtml = rows.map(r=>{
    const day = escapeHtml(r.day || r.date || '');
    const tm = (c) => escapeHtml(r[c] || '');
    return `<div class="row">
      <div class="cell" style="${getColStyleStr('DATE')}">${day}</div>
      <div class="cell" style="${getColStyleStr('TEMP')}">${tm('tempMorning')}</div>
      <div class="cell" style="${getColStyleStr('SIGN')}">${sigHtml(r.staffSignMorning)}</div>
      <div class="cell" style="${getColStyleStr('TEMP')}">${tm('tempAfternoon')}</div>
      <div class="cell" style="${getColStyleStr('SIGN')}">${sigHtml(r.staffSignAfternoon)}</div>
      <div class="cell" style="${getColStyleStr('TEMP')}">${tm('tempEvening')}</div>
      <div class="cell" style="${getColStyleStr('SIGN')}">${sigHtml(r.staffSignEvening)}</div>
      <div class="cell" style="${getColStyleStr('CORRECTIVE_ACTION')} text-align:left; justify-content:flex-start;">${escapeHtml(r.outOfSpecAction||'')}</div>
      <div class="cell" style="${getColStyleStr('SUP_NAME_SIGN')}">${sigHtml(r.supNameSign)}</div>
      <div class="cell" style="${getColStyleStr('COMPLEX_SIGN')}">${sigHtml(r.complexManagerSign)}</div>
      <div class="cell" style="${getColStyleStr('FSC_SIGN')}">${sigHtml(r.fscSign)}</div>
      <div class="cell" style="${getColStyleStr('HSEQ_SIGN')}">${sigHtml(r.hseqManagerSign)}</div>
    </div>`;
  }).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8">
  <style>
    @page { size: A4 landscape; margin: 6mm; }
    body{font-family:'Inter',Arial,sans-serif; margin:0; padding:0; background:#fff; color:#111; font-size: 8px;}
    .card{width: 100%;}
    
    /* Condensed Header */
    .branding{display:flex; align-items:center; margin-bottom:4px; border-bottom: 2px solid #185a9d; padding-bottom: 4px;}
    .logo{height:35px; width:auto; margin-right:10px;}
    .company{font-weight:900; font-size: 12px; color: #185a9d;}
    .title{font-weight:900; text-align:center; margin: 4px 0; text-transform:uppercase; font-size: 11px;}
    
    .subject{display:flex; justify-content:space-between; background: #f8fafc; border:1px solid #cbd5e1; padding:4px 8px; margin-bottom:6px;}

    /* Table System - Fixed Alignment */
    .table{border:1px solid #475569; display: flex; flex-direction: column; width: 100%;}
    
    .groupHeader, .detailHeader, .row {
        display: flex;
        width: 100%;
        box-sizing: border-box;
        align-items: stretch;
    }

    .groupHeader { background:#eef2ff; border-bottom: 1px solid #475569; }
    .detailHeader { background:#f1f5f9; border-bottom: 1px solid #475569; }
    .row { border-bottom: 1px solid #cbd5e1; min-height: 24px; page-break-inside: avoid; }
    .row:last-child { border-bottom: none; }

    /* Cell Logic */
    .hCell, .cell {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        border-right: 1px solid #475569;
        padding: 2px;
        text-align: center;
        overflow: hidden;
        word-break: break-all;
    }
    .cell:last-child, .hCell:last-child { border-right: none; }

    .hCell { font-weight: 700; font-size: 7.5px; }
    .cell { font-size: 8px; }

    /* Fix for nested header alignment */
    .groupHeader .hCell { padding: 4px 2px; }
  </style>
</head><body>
  <div class="card">
    <div class="branding">
        ${logo?`<img class="logo" src="${logo}"/>`:''}
        <div class="company">${escapeHtml(metadata.companyName||'Bravo')}</div>
        <div style="flex:1; text-align:right; font-size: 10px; font-weight: 800;">TEMPERATURE LOG</div>
    </div>
    
    <div class="title">DEEP FREEZER TEMPERATURE LOG SHEET</div>
    
    <div class="subject">
        <div><strong>Freezer:</strong> ${escapeHtml(metadata.freezerName||'—')}</div>
        <div><strong>Compiled By:</strong> ${escapeHtml(metadata.compiledBy||'—')}</div>
        <div><strong>Approved By:</strong> ${escapeHtml(metadata.approvedBy||'—')}</div>
    </div>

    <div class="table">
      <div class="groupHeader">
        <div class="hCell" style="${getColStyleStr('DATE')}">DATE</div>
        <div class="hCell" style="${getColStyleStr(['TEMP','SIGN'])}">MORNING</div>
        <div class="hCell" style="${getColStyleStr(['TEMP','SIGN'])}">AFTERNOON</div>
        <div class="hCell" style="${getColStyleStr(['TEMP','SIGN'])}">EVENING</div>
        <div class="hCell" style="${getColStyleStr('CORRECTIVE_ACTION')}">CORRECTIVE ACTION (IF OUT OF SPEC)</div>
        <div class="hCell" style="${getColStyleStr('SUP_NAME_SIGN')}">SUP</div>
        <div class="hCell" style="${getColStyleStr('COMPLEX_SIGN')}">COMPLEX</div>
        <div class="hCell" style="${getColStyleStr('FSC_SIGN')}">FSC</div>
        <div class="hCell" style="${getColStyleStr('HSEQ_SIGN')}">HSEQ</div>
      </div>

      <div class="detailHeader">
        <div class="hCell" style="${getColStyleStr('DATE')}">#</div>
        <div class="hCell" style="${getColStyleStr('TEMP')}">TEMP</div>
        <div class="hCell" style="${getColStyleStr('SIGN')}">SIGN</div>
        <div class="hCell" style="${getColStyleStr('TEMP')}">TEMP</div>
        <div class="hCell" style="${getColStyleStr('SIGN')}">SIGN</div>
        <div class="hCell" style="${getColStyleStr('TEMP')}">TEMP</div>
        <div class="hCell" style="${getColStyleStr('SIGN')}">SIGN</div>
        <div class="hCell" style="${getColStyleStr('CORRECTIVE_ACTION')}">DESCRIPTION</div>
        <div class="hCell" style="${getColStyleStr('SUP_NAME_SIGN')}">SIGN</div>
        <div class="hCell" style="${getColStyleStr('COMPLEX_SIGN')}">SIGN</div>
        <div class="hCell" style="${getColStyleStr('FSC_SIGN')}">SIGN</div>
        <div class="hCell" style="${getColStyleStr('HSEQ_SIGN')}">SIGN</div>
      </div>

      ${rowsHtml}
    </div>
  </div>
</body></html>`;
};
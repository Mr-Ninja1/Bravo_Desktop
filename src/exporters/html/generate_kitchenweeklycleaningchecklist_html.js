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
    if (val.uri && typeof val.uri === 'string') return val.uri.trim();
    if (val.data && typeof val.data === 'string') return `data:image/png;base64,${val.data.replace(/\s+/g,'')}`;
    return null;
  }
  if (typeof val !== 'string') return null;
  const s = val.trim(); if (!s) return null;
  if (s.startsWith('data:') || s.startsWith('http:') || s.startsWith('https:') || s.startsWith('file:')) return s;
  const compact = s.replace(/\s+/g,'');
  if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const metadata = p.metadata || p.meta || {};
  const formData = Array.isArray(p.formData) ? p.formData : (p.formData || []);
  const WEEK_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const hints = p.layoutHints || {};
  const defaultWidths = { AREA: 180, FREQ: 100, DAY_GROUP: 100 };
  const areaW = Number(hints.AREA || defaultWidths.AREA);
  const freqW = Number(hints.FREQ || defaultWidths.FREQ);
  const dayW = Number(hints.DAY_GROUP || defaultWidths.DAY_GROUP);
  const total = (areaW + freqW + (WEEK_DAYS.length * dayW)) || 1;

  const colPercent = (w) => ((w / total) * 100).toFixed(4) + '%';
  let logo = (p.assets && (p.assets.logoDataUri || p.assets.logo))
    ? (p.assets.logoDataUri || p.assets.logo)
    : (p.logo || p.logoDataUri || metadata.logoUrl || metadata.companyLogo || metadata.logo || null);

  // Fallback: inline explicit workspace logo file if present (developer-requested path)
  if (!logo) {
    try {
      const fs = require('fs');
      const path = require('path');
      const explicit = 'C:\\Users\\sikal\\Desktop\\Bravo_Desktop\\assets\\logo.jpeg';
      if (fs.existsSync(explicit)) {
        const data = fs.readFileSync(explicit);
        const mime = 'image/jpeg';
        logo = `data:${mime};base64,${data.toString('base64')}`;
      } else {
        // Also try relative workspace path if running elsewhere
        const alt = path.resolve(__dirname, '..', '..', '..', 'assets', 'logo.jpeg');
        if (fs.existsSync(alt)) {
          const data = fs.readFileSync(alt);
          const mime = 'image/jpeg';
          logo = `data:${mime};base64,${data.toString('base64')}`;
        }
      }
    } catch (e) {
      // ignore read errors
    }
  }

  const sigHtml = (val, w=160, h=64) => {
    const uri = resolveSignatureUri(val);
    if (uri) return `<img src="${uri}" style="max-width:${w}px;max-height:${h}px;display:block"/>`;
    return `<div style="font-size:12px;color:#374151; height:40px; display:flex; align-items:flex-end;">${escapeHtml(val || '')}</div>`;
  };

  const rowsHtml = formData.map(item => {
    const area = escapeHtml(item.name || item.area || '');
    const freq = escapeHtml(item.frequency || '');
    const dayCells = WEEK_DAYS.map(d => {
      const checks = item.checks && item.checks[d] ? item.checks[d] : {};
      const tick = checks.checked ? '✓' : '';
      const cleanedBy = escapeHtml(checks.cleanedBy || '');
      return `
        <div class="dayGroup">
          <div class="tick">${tick}</div>
          <div class="cleanedByText">${cleanedBy}</div>
        </div>`;
    }).join('');
    return `<div class="row"><div class="cell area">${area}</div><div class="cell freq">${freq}</div>${dayCells}</div>`;
  }).join('\n') || '';

  return `<!doctype html><html><head><meta charset="utf-8">
  <style>
    body{font-family:Inter,Arial,sans-serif;padding:12px;color:#072a63;background:#fff;margin:0}
    .card{max-width:1100px;margin:0 auto;background:#fff}
    
    /* Header */
    .headerRow{display:flex;align-items:center;margin-bottom:12px}
    .logo{width:60px;height:60px;object-fit:contain;margin-right:12px}
    .company{font-weight:800;font-size:16px;color:#374151}
    .title{font-weight:800;font-size:18px;margin:4px 0}
    .metaRow{display:flex;justify-content:space-between;width:100%;font-size:11px;margin-top:4px;color:#4b5563}

    /* Table */
    .table{border:1px solid #cbd5e1; display: flex; flex-direction: column; width: 100%; margin-bottom: 20px;}
    .tableHeader{display:flex;background:#f8fafc;border-bottom:1px solid #cbd5e1}
    .row{display:flex;border-bottom:1px solid #e2e8f0;min-height:50px}
    .row:last-child{border-bottom:none}

    /* Cells */
    .cell, .headerCell, .dayGroup {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        border-right: 1px solid #cbd5e1;
    }
    .dayGroup:last-child, .headerCell:last-child { border-right: none; }

    .area { width: ${colPercent(areaW)}; padding: 8px; font-size: 12px; font-weight: 600; color: #1e293b; }
    .freq { width: ${colPercent(freqW)}; padding: 8px; font-size: 11px; color: #64748b; justify-content: center; text-align: center; }
    
    .dayGroup, .headerDayContainer { 
        width: ${colPercent(dayW)}; 
        flex-direction: column; 
        justify-content: center;
        padding: 0;
    }

    .headerDayName {
        width: 100%;
        text-align: center;
        font-weight: 700;
        font-size: 12px;
        padding: 6px 0;
        border-bottom: 1px solid #cbd5e1;
    }

    .headerSubLabel {
        width: 100%;
        text-align: center;
        font-size: 10px;
        color: #64748b;
        padding: 4px 0;
        font-weight: 600;
    }

    .tick {
        font-size: 16px;
        font-weight: bold;
        color: #072a63;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .cleanedByText {
        font-size: 10px;
        color: #334155;
        text-align: center;
        width: 100%;
        overflow-wrap: break-word;
        padding: 2px 4px;
    }

    .headerCell { justify-content: center; font-weight: 700; font-size: 12px; color: #0f172a; }

    /* Footer Signature Section */
    .signRow{display:flex;justify-content:space-between;width:100%;font-size:12px; margin-top: 30px;}
    .signCol{width:240px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;}
    .signLabel { font-weight: 700; color: #374151; margin-bottom: 4px; }
  </style>
</head><body>
  <div class="card">
    <div class="headerRow">
      ${logo ? `<img class="logo" src="${logo}" alt="Company logo"/>` : ''}
      <div style="flex:1">
        <div class="company">${escapeHtml(metadata.companyName || 'Bravo')}</div>
        <div class="title">${escapeHtml(p.title || 'Kitchen Weekly Cleaning Checklist')}</div>
        <div class="metaRow">
            <div><strong>Location:</strong> ${escapeHtml(metadata.location || 'N/A')}</div>
            <div><strong>Date:</strong> ${escapeHtml(metadata.week || '')} ${escapeHtml(metadata.month || '')} ${escapeHtml(metadata.year || '2025')}</div>
        </div>
      </div>
    </div>

    <div class="table">
      <div class="tableHeader">
        <div class="headerCell area">Area to be cleaned</div>
        <div class="headerCell freq">Frequency</div>
        ${WEEK_DAYS.map(d => `
          <div class="headerDayContainer">
            <div class="headerDayName">${d}</div>
            <div class="headerSubLabel">Cleaned By</div>
          </div>`).join('')}
      </div>
      ${rowsHtml}
    </div>

    <div class="signRow">
      <div class="signCol">
        <div class="signLabel">Verified By: HSEQ Manager</div>
        ${sigHtml(p.hseqSign || metadata.hseqSign)}
      </div>
      <div class="signCol" style="text-align:right">
        <div class="signLabel">Complex Manager</div>
        ${sigHtml(p.complexManagerSign || metadata.complexManagerSign)}
      </div>
    </div>
  </div>
</body></html>`;
};
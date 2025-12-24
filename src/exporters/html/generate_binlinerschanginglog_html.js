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
    if (val.data && typeof val.data === 'string') return val.data.startsWith('data:') ? val.data : `data:image/png;base64,${val.data.replace(/\s+/g,'')}`;
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
  const entries = Array.isArray(p.logEntries) ? p.logEntries : (p.formData || p.rows || []);

  // fixed column widths matching presentational
  const COL = { DATE: 100, CHANGED_BY: 240, AREA: 200, STAFF_SIGN: 200, SUP_SIGN: 200 };
  const tableWidth = p._tableWidth || (COL.DATE + COL.CHANGED_BY + COL.AREA + COL.STAFF_SIGN + COL.SUP_SIGN);

  const sigHtml = (v, w = 150, h = 60) => {
    const uri = resolveSignatureUri(v);
    if (uri) return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block;"/>`;
    return `<div style="font-size:10px;color:#333">${escapeHtml(v || '')}</div>`;
  };

  const rowsHtml = (entries.length ? entries : Array.from({ length: 8 }).map(() => ({}))).map((e, i) => {
    return `<div class="row">` +
      `<div class="cell" style="width:${COL.DATE}px">${escapeHtml(e.date || '')}</div>` +
      `<div class="cell" style="width:${COL.CHANGED_BY}px">${escapeHtml(e.changedBy || '')}</div>` +
      `<div class="cell" style="width:${COL.AREA}px">${escapeHtml(e.area || '')}</div>` +
      `<div class="cell" style="width:${COL.STAFF_SIGN}px">${sigHtml(e.staffSign)}</div>` +
      `<div class="cell" style="width:${COL.SUP_SIGN}px">${sigHtml(e.supervisorSign)}</div>` +
      `</div>`;
  }).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A4 landscape; margin: 6mm; }
    body { font-family: 'Inter', Arial, sans-serif; margin:0; padding:12px; color:#111; background:#fff; font-size:10px }
    .topHeader{display:flex;align-items:flex-start;border:1px solid #000;padding:8px;margin-bottom:8px}
    .headerLeft{width:260;padding-right:12;border-right:1px solid #000}
    .logo{width:96px;height:36px;margin-bottom:6px}
    .company{font-weight:700;font-size:12px}
    .subject{font-weight:800;font-size:13px;margin-top:6px}
    .headerCenter{flex:1;padding:0 12px}
    .docRow{display:flex;gap:8px;margin-bottom:4px}
    .docLabel{font-weight:800;margin-right:6px;color:#374151}
    .pageInfo{width:120;text-align:right;font-weight:700}

    .tableOuter{border:1px solid #000;width:100%;overflow:hidden}
    .tableHeader{display:flex;background:#eee;border-bottom:1px solid #000;min-height:40px;align-items:center}
    .row{display:flex;min-height:40px;border-bottom:1px solid #000;align-items:center}
    .cell{box-sizing:border-box;padding:6px;border-right:1px solid #000;display:flex;align-items:center;justify-content:center}
    .cell:last-child{border-right:none}
    .colHeader{font-weight:800;text-align:center}

    .verify{margin-top:12}
    .verifyRow{display:flex;align-items:center;margin-bottom:8px}
    .verifyLabel{width:120;font-weight:800}
  </style></head><body>

    <div class="topHeader">
      <div class="headerLeft">
        ${p.assets && p.assets.logoDataUri ? `<img class="logo" src="${p.assets.logoDataUri}"/>` : ''}
        <div class="company">${escapeHtml(metadata.companyName || 'BRAVO BRANDS LIMITED')}</div>
        <div class="subject">Subject: BIN LINERS CHANGING LOG</div>
      </div>
      <div class="headerCenter">
        <div class="docRow"><div class="docLabel">Doc No:</div><div>${escapeHtml(metadata.docNo || 'BBN-SHEQ-F-BL-2')}</div></div>
        <div class="docRow"><div class="docLabel">Issue Date:</div><div>${escapeHtml(metadata.date || metadata.issueDate || '')}</div></div>
        <div class="docRow"><div class="docLabel">Revision Date:</div><div>${escapeHtml(metadata.revisionDate || 'N/A')}</div></div>
      </div>
      <div class="pageInfo">Page 1 of 1</div>
    </div>

    <div style="overflow:auto;">
      <div style="min-width:${tableWidth}px">
        <div class="tableOuter">
          <div class="tableHeader">
            <div class="cell" style="width:${COL.DATE}px"><div class="colHeader">DATE</div></div>
            <div class="cell" style="width:${COL.CHANGED_BY}px"><div class="colHeader">CHANGED BY</div></div>
            <div class="cell" style="width:${COL.AREA}px"><div class="colHeader">AREA</div></div>
            <div class="cell" style="width:${COL.STAFF_SIGN}px"><div class="colHeader">STAFF SIGN</div></div>
            <div class="cell" style="width:${COL.SUP_SIGN}px"><div class="colHeader">SUPERVISOR SIGN</div></div>
          </div>
          ${rowsHtml}
        </div>
      </div>
    </div>

    <div class="verify">
      <div class="verifyRow"><div class="verifyLabel">VERIFIED BY:</div><div>${sigHtml(metadata.verifiedBySign || metadata.verifiedBy || p.metadata?.verifiedBy || '')}</div></div>
      <div class="verifyRow"><div class="verifyLabel">HSEQ Manager:</div><div>${sigHtml(metadata.hseqManagerSign || metadata.hseqManager || '')}</div></div>
    </div>

  </body></html>`;
};

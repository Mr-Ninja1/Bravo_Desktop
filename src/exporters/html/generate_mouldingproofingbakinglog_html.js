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

const normalizeSignature = (v) => {
  if (!v) return null;
  if (typeof v !== 'string') {
    const maybe = v && (v.uri || v.data || v.base64 || v);
    if (typeof maybe === 'string') v = maybe;
    else return null;
  }
  if (v.startsWith('data:')) return v;
  const compact = v.replace(/\s+/g, '');
  if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const metadata = (p.metadata && p.metadata.metadata) || p.metadata || p.meta || {};
  const formData = Array.isArray(p.formData) ? p.formData : (p.formData || []);

  const COL_WEIGHTS = {
    num: (p.layoutHints && p.layoutHints.num) || 35,
    food: (p.layoutHints && p.layoutHints.food) || 180,
    mouldingTime: (p.layoutHints && p.layoutHints.mouldingTime) || 75,
    mouldingSign: (p.layoutHints && p.layoutHints.mouldingSign) || 85,
    proofTimeIn: (p.layoutHints && p.layoutHints.proofTimeIn) || 75,
    proofTimeOut: (p.layoutHints && p.layoutHints.proofTimeOut) || 75,
    proofSign: (p.layoutHints && p.layoutHints.proofSign) || 85,
    bakeTimeIn: (p.layoutHints && p.layoutHints.bakeTimeIn) || 75,
    bakeTemp: (p.layoutHints && p.layoutHints.bakeTemp) || 75,
    bakeTimeOut: (p.layoutHints && p.layoutHints.bakeTimeOut) || 75,
    staff: (p.layoutHints && p.layoutHints.staff) || 110,
  };
  const total = Object.values(COL_WEIGHTS).reduce((s, v) => s + (Number(v) || 0), 0) || 1;

  const colPercent = (k) => ((COL_WEIGHTS[k] || 0) / total * 100).toFixed(4) + '%';

  const logo = (p.assets && p.assets.logoDataUri) ? p.assets.logoDataUri : null;

  const correctiveText = metadata.correctiveAction ?? metadata.corrective ?? p.correctiveAction ?? '';

  const sigHtml = (val, w = 160, h = 40) => {
    const uri = normalizeSignature(val);
    if (uri) return `<img src="${uri}" style="max-width:${w}px;max-height:${h}px;display:block"/>`;
    return `<div style="font-size:10px;color:#222">${escapeHtml(val || '')}</div>`;
  };

  // build rows
  const rows = formData.map((r, idx) => {
    const bakeTempRaw = r.bakeTemp || '';
    let bakeTemp = (''+bakeTempRaw).trim();
    if (bakeTemp && !bakeTemp.includes('°') && !/c$/i.test(bakeTemp)) bakeTemp = bakeTemp + ' °C';
    return `<div class="row">
      <div class="c num">${escapeHtml(String(idx+1))}</div>
      <div class="c food">${escapeHtml(r.product || '')}</div>
      <div class="c mouldingTime">${escapeHtml(r.mouldingTime || '')}</div>
      <div class="c mouldingSign">${sigHtml(r.mouldingSign,80,40)}</div>
      <div class="c proofTimeIn">${escapeHtml(r.proofTimeIn || '')}</div>
      <div class="c proofTimeOut">${escapeHtml(r.proofTimeOut || '')}</div>
      <div class="c proofSign">${sigHtml(r.proofSign,80,40)}</div>
      <div class="c bakeTimeIn">${escapeHtml(r.bakeTimeIn || '')}</div>
      <div class="c bakeTemp">${escapeHtml(bakeTemp)}</div>
      <div class="c bakeTimeOut">${escapeHtml(r.bakeTimeOut || '')}</div>
      <div class="c staff">${escapeHtml(r.staffName || '')}</div>
    </div>`;
  }).join('\n');

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MOULDING PROOFING AND BAKING LOG SHEET</title>
  <style>
    body{font-family:Inter,Arial,sans-serif;padding:12px;color:#072a63;background:#fff}
    .doc{max-width:900px;margin:0 auto}
    .header{display:flex;align-items:center;border:1px solid #ddd;padding:8px;border-radius:4px;margin-bottom:12px}
    .logo{width:50px;height:50px;object-fit:contain;margin-right:8px}
    .docbox{width:160px;border-left:1px solid #eee;padding-left:8px;margin-left:auto}
    .docRow{display:flex;justify-content:space-between;font-size:9px;color:#374151}
    .company{font-weight:800;color:#185a9d;font-size:13px}
    .subject{font-weight:800;font-size:11px}
    .metaRow{display:flex;justify-content:space-between;margin-bottom:10px}

    .tableWrapper{border:1px solid #ccc;border-radius:4px;overflow:hidden}
    .headerRow{display:flex;background:#eef2ff;border-bottom:1px solid #ccc;min-height:40px}
    .subHeaderRow{display:flex;background:#f9fafb;border-bottom:1px solid #ccc}
    .row{display:flex;border-bottom:1px solid #eee;min-height:35px}
    .c{padding:6px 4px;box-sizing:border-box;border-left:1px solid #ccc;display:flex;align-items:center;justify-content:center;font-size:10px}
    /* per-column widths to align borders with header definitions */
    .c.num{width:${colPercent('num')};}
    .c.food{width:${colPercent('food')};}
    .c.mouldingTime{width:${colPercent('mouldingTime')};}
    .c.mouldingSign{width:${colPercent('mouldingSign')};}
    .c.proofTimeIn{width:${colPercent('proofTimeIn')};}
    .c.proofTimeOut{width:${colPercent('proofTimeOut')};}
    .c.proofSign{width:${colPercent('proofSign')};}
    .c.bakeTimeIn{width:${colPercent('bakeTimeIn')};}
    .c.bakeTemp{width:${colPercent('bakeTemp')};}
    .c.bakeTimeOut{width:${colPercent('bakeTimeOut')};}
    .c.staff{width:${colPercent('staff')};border-right:0}
    /* remove left border for the very first column so lines don't double up */
    .row .c.num, .headerRow .c.num, .subHeaderRow .c.num { border-left: 0; }
    .headerRow .c,.subHeaderRow .c{font-weight:700;text-align:center;font-size:9px}
    .footer{margin-top:12px}
    .footerLabel{font-weight:700;font-size:10px;margin-bottom:4px}
    .corrective{border:1px solid #eee;padding:6px;min-height:40px;background:#fafafa}
  </style>
</head><body>
  <div class="doc">
    <div class="header">
      ${logo ? `<img class="logo" src="${logo}"/>` : ''}
      <div style="flex:1">
        <div class="company">BRAVO BRANDS LIMITED</div>
        <div class="subject">MOULDING PROOFING AND BAKING LOG SHEET</div>
        <div style="font-size:9px;color:#666">Subject: MOULDING PROOFING AND BAKING LOG SHEET</div>
      </div>
      <div class="docbox">
        <div class="docRow"><div>Issue Date:</div><div>${escapeHtml(p.issueDate || metadata.issueDate || '')}</div></div>
        <div class="docRow"><div>Revision Date:</div><div>${escapeHtml(p.revisionDate || metadata.revisionDate || '')}</div></div>
        <div class="docRow"><div>Location:</div><div>${escapeHtml(metadata.location || p.location || '')}</div></div>
      </div>
    </div>

    <div class="metaRow">
      <div><div style="font-weight:700;font-size:10px;color:#374151">Compiled By:</div><div style="font-size:10px;color:#111827">${escapeHtml(metadata.compiledBy || 'Michael zulu')}</div></div>
      <div><div style="font-weight:700;font-size:10px;color:#374151">Approved By:</div><div style="font-size:10px;color:#111827">${escapeHtml(metadata.approvedBy || 'Hassani Ali')}</div></div>
    </div>

    <div class="tableWrapper">
      <div class="headerRow">
        <div class="c num" style="width:${colPercent('num')}">#</div>
        <div class="c food" style="width:${colPercent('food')}">FOOD ITEM</div>
        <div class="c moulding" style="width:${(Number(colPercent('mouldingTime').replace('%',''))+Number(colPercent('mouldingSign').replace('%',''))).toFixed(4)}%">MOULDING</div>
        <div class="c proof" style="width:${(Number(colPercent('proofTimeIn').replace('%',''))+Number(colPercent('proofTimeOut').replace('%',''))+Number(colPercent('proofSign').replace('%',''))).toFixed(4)}%">PROOFING</div>
        <div class="c bake" style="width:${(Number(colPercent('bakeTimeIn').replace('%',''))+Number(colPercent('bakeTemp').replace('%',''))+Number(colPercent('bakeTimeOut').replace('%',''))).toFixed(4)}%">BAKING TEMP (180°C - 300°C)</div>
        <div class="c staff" style="width:${colPercent('staff')};border-right:0">STAFF'S NAME</div>
      </div>

      <div class="subHeaderRow">
        <div class="c num" style="width:${colPercent('num')}">#</div>
        <div class="c food" style="width:${colPercent('food')}"></div>
        <div class="c mouldingTime" style="width:${colPercent('mouldingTime')}">TIME</div>
        <div class="c mouldingSign" style="width:${colPercent('mouldingSign')}">SIGN</div>
        <div class="c proofTimeIn" style="width:${colPercent('proofTimeIn')}">TIME IN</div>
        <div class="c proofTimeOut" style="width:${colPercent('proofTimeOut')}">TIME OUT</div>
        <div class="c proofSign" style="width:${colPercent('proofSign')}">SIGN</div>
        <div class="c bakeTimeIn" style="width:${colPercent('bakeTimeIn')}">TIME IN</div>
        <div class="c bakeTemp" style="width:${colPercent('bakeTemp')}">TEMP</div>
        <div class="c bakeTimeOut" style="width:${colPercent('bakeTimeOut')}">TIME OUT</div>
        <div class="c staff" style="width:${colPercent('staff')};border-right:0"></div>
      </div>

      ${rows}

    </div>

    <div class="footer">
      <div style="display:flex;justify-content:space-between;">
        <div style="flex:1">
          <div class="footerLabel">Head Chef/Baker Signature:</div>
          ${sigHtml(p.headChefSign,180,50)}
        </div>
      </div>

      <div style="margin-top:8px">
        <div class="footerLabel">Corrective Action:</div>
        <div class="corrective">${escapeHtml(correctiveText || 'N/A')}</div>
      </div>

      <div style="display:flex;justify-content:space-between;margin-top:12px">
        <div style="flex:1">
          <div class="footerLabel">Verified By:</div>
          ${sigHtml(p.verifiedBySign,160,40)}
        </div>
        <div style="flex:1;text-align:right">
          <div class="footerLabel">Complex Manager Signature</div>
          ${sigHtml(p.complexManagerSign,160,40)}
        </div>
      </div>
    </div>
  </div>
</body></html>`;

  return html;
};

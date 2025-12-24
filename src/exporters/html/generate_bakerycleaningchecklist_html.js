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
  if (s.startsWith('data:') || s.startsWith('http')) return s;
  const compact = s.replace(/\s+/g,'');
  if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const metadata = p.metadata || {};
  const formData = Array.isArray(p.formData) ? p.formData : (p.rows || []);
  const DAYS_OF_WEEK = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  let logo = (p.assets && (p.assets.logoDataUri || p.assets.logo)) ? (p.assets.logoDataUri || p.assets.logo) : (p.logo || p.logoDataUri || metadata.logoUrl || metadata.companyLogo || metadata.logo || null);

  const sigHtml = (v, h = 40) => { 
    const uri = resolveSignatureUri(v); 
    if (uri) return `<img src="${uri}" style="max-height:${h}px; width:auto; object-fit:contain; display:block;"/>`; 
    return `<div style="font-size:9px;color:#94a3b8;border-bottom:1px solid #eee;width:120px;height:20px;margin-top:5px"></div>`; 
  };

  // Professional A4 Landscape Calibration (approx 1060px total)
  const COL = {
    AREA: 220,
    FREQ: 100,
    DAY_TOTAL: 105, // 105 * 7 = 735
    SUB_CHECK: 30,
    SUB_CLEAN: 75 
  };
  const TOTAL_WIDTH = COL.AREA + COL.FREQ + (DAYS_OF_WEEK.length * COL.DAY_TOTAL);

  const rowsHtml = (formData.length ? formData : Array.from({length:12}).map(()=>({})) ).map((item)=>{
    const dayCells = DAYS_OF_WEEK.map(d=>{
      const obj = item.days && item.days[d] ? item.days[d] : {};
      return `
        <div style="width:${COL.DAY_TOTAL}px; display:flex; border-right:1px solid #000; align-items:stretch">
          <div style="width:${COL.SUB_CHECK}px; display:flex; align-items:center; justify-content:center; border-right:1px solid #ddd; font-weight:bold; font-size:12px">
            ${obj.checked ? '✓' : ''}
          </div>
          <div style="width:${COL.SUB_CLEAN}px; font-size:9px; padding:2px; display:flex; align-items:center; justify-content:center; text-align:center; overflow:hidden; line-height:1">
            ${escapeHtml(obj.cleanedBy || '')}
          </div>
        </div>`;
    }).join('');

    return `
      <div style="display:flex; border-bottom:1px solid #000; min-height:36px; align-items:stretch; background:#fff">
        <div style="width:${COL.AREA}px; padding:6px; border-right:1px solid #000; display:flex; align-items:center; font-weight:600; font-size:10px">${escapeHtml(item.name || '')}</div>
        <div style="width:${COL.FREQ}px; padding:6px; border-right:1px solid #000; display:flex; align-items:center; justify-content:center; text-align:center; font-size:9px">${escapeHtml(item.frequency || '')}</div>
        ${dayCells}
      </div>`;
  }).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:8mm}
    *{box-sizing: border-box;}
    body{font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin:0; padding:0; color:#111}
    .container{width:${TOTAL_WIDTH}px; margin:0 auto; padding:10px}
    .header{display:flex; align-items:center; justify-content:space-between; border-bottom:3px solid #185a9d; padding-bottom:10px; margin-bottom:10px}
    .logo{height:50px; object-fit:contain}
    .title{text-align:center; font-weight:900; font-size:18px; color:#185a9d; margin:15px 0; text-transform:uppercase; letter-spacing:1px}
    .table{border:2px solid #000; width:100%; background:#000}
    .thead{background:#f3f4f6; color:#000}
    .h-top{display:flex; align-items:stretch}
    .hcell{display:flex; align-items:center; justify-content:center; font-weight:800; text-align:center; text-transform:uppercase; font-size:10px}
    .footer{margin-top:20px; display:flex; gap:20px}
    .sig-box{flex:1; border:1px solid #333; padding:10px; background:#f9fafb}
  </style></head><body>
    <div class="container">
      <div class="header">
        <div style="display:flex; align-items:center; gap:15px">
          ${logo ? `<img class="logo" src="${logo}"/>` : ''}
          <div>
            <div style="font-weight:900; font-size:18px; color:#185a9d">${escapeHtml(metadata.companyName || 'BRAVO')}</div>
            <div style="font-size:11px; font-weight:600; color:#666">FOOD SAFETY MANAGEMENT SYSTEM</div>
          </div>
        </div>
        <div style="text-align:right; line-height:1.5">
          <div style="font-weight:800; font-size:12px">LOCATION: <span style="font-weight:400">${escapeHtml(metadata.location || 'N/A')}</span></div>
          <div style="font-weight:800; font-size:12px">WEEK NO: <span style="font-weight:400">${escapeHtml(metadata.week || '---')}</span></div>
        </div>
      </div>
      
      <div class="title">Bakery & Confectionery Area Cleaning Checklist</div>
      
      <div class="table">
        <div class="thead">
          <div class="h-top">
            <div class="hcell" style="width:${COL.AREA}px; border-right:1px solid #000; min-height:45px; background:#e5e7eb">Area to be cleaned</div>
            <div class="hcell" style="width:${COL.FREQ}px; border-right:1px solid #000; background:#e5e7eb">Frequency</div>
            ${DAYS_OF_WEEK.map(d => `
              <div style="width:${COL.DAY_TOTAL}px; border-right:1px solid #000; display:flex; flex-direction:column">
                <div class="hcell" style="flex:1; border-bottom:1px solid #000; background:#d1d5db; padding:4px">${d}</div>
                <div style="display:flex; font-size:8px; height:20px">
                  <div style="width:${COL.SUB_CHECK}px; border-right:1px solid #000; display:flex; align-items:center; justify-content:center">✓</div>
                  <div style="flex:1; display:flex; align-items:center; justify-content:center">CLEANED BY</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="background:#fff">
          ${rowsHtml}
        </div>
      </div>

      <div class="footer">
        <div class="sig-box">
          <div style="font-weight:800; color:#185a9d; margin-bottom:5px; font-size:11px">VERIFIED BY (HSEQ):</div>
          ${sigHtml(p.verification?.hseqManagerSign || p.verification?.hseqManager)}
        </div>
        <div class="sig-box">
          <div style="font-weight:800; color:#185a9d; margin-bottom:5px; font-size:11px">COMPLEX MANAGER:</div>
          ${sigHtml(p.verification?.complexManagerSign || p.verification?.complexManager)}
        </div>
        <div class="sig-box" style="flex:0.5; background:none; border:none; display:flex; align-items:flex-end; font-size:9px; font-style:italic; color:#666">
          Records must be kept for 3 years.
        </div>
      </div>
    </div>
  </body></html>`;
};
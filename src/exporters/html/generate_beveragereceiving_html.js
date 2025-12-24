const escapeHtml = (s) => String(s === null || s === undefined ? '' : s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const normalizeIncoming = (incoming) => { if (!incoming) return {}; let v = incoming; if (v.payload) v = v.payload; if (v.meta && v.meta.payload) v = v.meta.payload; if (v.payload) v = v.payload; return v || {}; };
const resolveSignatureUri = (val) => { if (!val) return null; if (typeof val === 'object') { if (val.uri && typeof val.uri === 'string') return val.uri.trim(); if (val.data && typeof val.data === 'string') return `data:image/png;base64,${val.data.replace(/\s+/g,'')}`; return null; } if (typeof val !== 'string') return null; const s = val.trim(); if (!s) return null; if (s.startsWith('data:') || s.startsWith('http')) return s; const compact = s.replace(/\s+/g,''); if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`; return null; };

module.exports = function generate(payloadWrapper){
  const p = normalizeIncoming(payloadWrapper);
  const metadata = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : (p.rows || []);
  const hints = p.layoutHints || {};

  const DEFAULT_COLS = { name: 260, supplier: 180, clean: 90, temp: 90, tempOfBeverage: 120, stateOfProduct: 140, expiryDate: 120, remarks: 300 };
  const colWidths = {
    name: Number(hints.NAME) || DEFAULT_COLS.name,
    supplier: Number(hints.SUPPLIER) || DEFAULT_COLS.supplier,
    clean: Number(hints.CLEAN) || DEFAULT_COLS.clean,
    temp: Number(hints.TEMP) || DEFAULT_COLS.temp,
    tempOfBeverage: Number(hints.TEMP_OF_BEVERAGE) || DEFAULT_COLS.tempOfBeverage,
    stateOfProduct: Number(hints.STATE_OF_PRODUCT) || DEFAULT_COLS.stateOfProduct,
    expiryDate: Number(hints.EXPIRY_DATE) || DEFAULT_COLS.expiryDate,
    remarks: Number(hints.REMARKS) || DEFAULT_COLS.remarks,
  };
  const totalWidth = Object.values(colWidths).reduce((s,v)=>s+(Number(v)||0),0);
  const exportingWide = !!p.exportingWide;
  const A4_WIDTH = 794;
  let scale = 1; if (exportingWide && totalWidth > A4_WIDTH) scale = A4_WIDTH / totalWidth;
  const adjusted = Object.fromEntries(Object.entries(colWidths).map(([k,v])=>[k, Math.round(v*scale)]));
  const adjTableWidth = exportingWide ? Math.round(totalWidth * scale) : totalWidth;

  let logo = (p.assets && (p.assets.logoDataUri || p.assets.logo)) ? (p.assets.logoDataUri || p.assets.logo) : (p.logo || p.logoDataUri || metadata.logoUrl || metadata.companyLogo || metadata.logo || null);
  if (!logo) { try { const fs = require('fs'); const path = require('path'); const possible = ['logo.png','logo.jpg','logo.jpeg','logo.webp']; for (const name of possible) { const pth = path.join(process.cwd(),'assets',name); if (fs.existsSync(pth)) { const buf = fs.readFileSync(pth); const ext = path.extname(name).toLowerCase().replace('.',''); const mime = ext==='jpg'||ext==='jpeg'?'image/jpeg':(ext==='png'?'image/png':(ext==='webp'?'image/webp':'application/octet-stream')); logo = `data:${mime};base64,${buf.toString('base64')}`; break; } } } catch(e){} }

  const sigHtml = (v,w=220,h=80)=>{ const uri = resolveSignatureUri(v); if (uri) return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block;"/>`; return `<div style="font-size:10px;color:#666">${escapeHtml(v||'')}</div>` };

  const rowsHtml = (rows.length ? rows : Array.from({length:8}).map(()=>({}))).map((row,i)=>{
    return `<div class="tr" style="display:flex;border-bottom:1px solid #000;min-height:48px">`+
      `<div class="td" style="width:${adjusted.name}px;padding:6px">${escapeHtml(row.nameOfProduct||'')}</div>`+
      `<div class="td" style="width:${adjusted.supplier}px;padding:6px">${escapeHtml(row.supplier||'')}</div>`+
      `<div class="td" style="width:${adjusted.clean}px;padding:6px;text-align:center">${row.clean? '✓' : ''}</div>`+
      `<div class="td" style="width:${adjusted.temp}px;padding:6px">${escapeHtml(row.temp||'')}</div>`+
      `<div class="td" style="width:${adjusted.tempOfBeverage}px;padding:6px">${escapeHtml(row.tempOfBeverage||'')}</div>`+
      `<div class="td" style="width:${adjusted.stateOfProduct}px;padding:6px">${escapeHtml(row.stateOfProduct||'')}</div>`+
      `<div class="td" style="width:${adjusted.expiryDate}px;padding:6px">${escapeHtml(row.expiryDate||'')}</div>`+
      `<div class="td" style="width:${adjusted.remarks}px;padding:6px">${escapeHtml(row.remarks||'')}</div>`+
    `</div>`;
  }).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4 landscape;margin:6mm}body{font-family:Arial,sans-serif;font-size:10px;color:#111} .header{display:flex;justify-content:space-between;border-bottom:2px solid #185a9d;padding-bottom:6px;margin-bottom:8px}.logo{height:40px}.table{border:1px solid #000}.thead{display:flex;background:#eee;font-weight:800}.th{padding:8px;border-right:1px solid #000;text-align:center}.td{border-right:1px solid #000}</style></head><body><div class="header">${logo?`<img class="logo" src="${logo}"/>`:''}<div style="font-weight:800">${escapeHtml(metadata.companyName||'Bravo')}</div><div style="text-align:right">Issue: ${escapeHtml(metadata.issueDate||'')}</div></div><div style="font-weight:800;text-align:center;margin-bottom:8px">Beverage and Water Receiving Checklist</div><div class="table" style="width:${adjTableWidth}px"><div class="thead">`+
    `<div class="th" style="width:${adjusted.name}px">Name of Product</div>`+
    `<div class="th" style="width:${adjusted.supplier}px">Supplier</div>`+
    `<div class="th" style="width:${adjusted.clean}px">Clean</div>`+
    `<div class="th" style="width:${adjusted.temp}px">Temp</div>`+
    `<div class="th" style="width:${adjusted.tempOfBeverage}px">Temp of Beverage</div>`+
    `<div class="th" style="width:${adjusted.stateOfProduct}px">State of Product</div>`+
    `<div class="th" style="width:${adjusted.expiryDate}px">Expiry Date</div>`+
    `<div class="th" style="width:${adjusted.remarks}px">Remarks</div>`+
  `</div>${rowsHtml}</div><div style="margin-top:12px;display:flex;gap:12px">`+
    `<div style="flex:1">Verified By:<div>${sigHtml(p.metadata?.verifiedBySign || p.metadata?.verifiedBy || '')}</div></div>`+
    `<div style="flex:1">HSEQ Manager:<div>${sigHtml(p.metadata?.hseqManagerSign || p.metadata?.hseqManager || '')}</div></div>`+
  `</div></body></html>`;
};

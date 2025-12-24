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
  
  // Set default empty rows to 12 if no data, to give the form "weight"
  const rowData = formData.length ? formData : Array.from({ length: 12 }).map(() => ({}));

  // Column Weight Definitions for Landscape Balance
  const COL = {
    IDX: 30,
    FOOD: 150,
    UNIT: 80,
    REC: 60, // Individual Time/Temp/Sign columns
    STAFF: 100
  };

  const recGroupWidth = COL.REC * 3;
  const totalWidth = COL.IDX + COL.FOOD + COL.UNIT + (recGroupWidth * 3) + COL.STAFF;
  const colPct = (w) => ((w / totalWidth) * 100).toFixed(4) + '%';

  let logo = (p.assets && (p.assets.logoDataUri || p.assets.logo)) ? (p.assets.logoDataUri || p.assets.logo) : (p.logo || p.logoDataUri || metadata.logoUrl || metadata.companyLogo || metadata.logo || null);

  // Fallback: inline workspace logo from assets folder if nothing provided
  if (!logo) {
    try {
      const fs = require('fs');
      const path = require('path');
      const possible = ['logo.png','logo.jpg','logo.jpeg','logo.webp'];
      for (const name of possible) {
        const pth = path.join(process.cwd(), 'assets', name);
        if (fs.existsSync(pth)) {
          const buf = fs.readFileSync(pth);
          const ext = path.extname(name).toLowerCase().replace('.', '');
          const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : (ext === 'png' ? 'image/png' : (ext === 'webp' ? 'image/webp' : 'application/octet-stream'));
          logo = `data:${mime};base64,${buf.toString('base64')}`;
          break;
        }
      }
    } catch (e) {
      // ignore file read errors and leave logo null
    }
  }

  const sigHtml = (v, h = 26) => { 
    const uri = resolveSignatureUri(v); 
    if (uri) return `<img src="${uri}" style="max-height:${h}px; width:auto; object-fit:contain; display:block; mix-blend-mode:multiply;"/>`; 
    return `<div style="font-size:8px; color:#94a3b8;">${escapeHtml(v || '')}</div>`; 
  };

  const rowsHtml = rowData.map((r, i) => {
    return `
      <div class="row">
        <div class="cell" style="width:${colPct(COL.IDX)}">${i + 1}</div>
        <div class="cell area" style="width:${colPct(COL.FOOD)}">${escapeHtml(r.foodItem || '')}</div>
        <div class="cell" style="width:${colPct(COL.UNIT)}">${escapeHtml(r.timeIntoUnit || '')}</div>
        <div class="cell" style="width:${colPct(COL.REC)}">${escapeHtml(r.time1 || '')}</div>
        <div class="cell" style="width:${colPct(COL.REC)}">${escapeHtml(r.temp1 || '')}</div>
        <div class="cell" style="width:${colPct(COL.REC)}">${sigHtml(r.sign1)}</div>
        <div class="cell" style="width:${colPct(COL.REC)}">${escapeHtml(r.time2 || '')}</div>
        <div class="cell" style="width:${colPct(COL.REC)}">${escapeHtml(r.temp2 || '')}</div>
        <div class="cell" style="width:${colPct(COL.REC)}">${sigHtml(r.sign2)}</div>
        <div class="cell" style="width:${colPct(COL.REC)}">${escapeHtml(r.time3 || '')}</div>
        <div class="cell" style="width:${colPct(COL.REC)}">${escapeHtml(r.temp3 || '')}</div>
        <div class="cell" style="width:${colPct(COL.REC)}">${sigHtml(r.sign3)}</div>
        <div class="cell" style="width:${colPct(COL.STAFF)}">${escapeHtml(r.staffName || '')}</div>
      </div>`;
  }).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8">
  <style>
    @page { size: A4 landscape; margin: 6mm; }
    body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; color: #111; background: #fff; font-size: 9px; line-height: 1.2; }
    
    .headerSection { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 2px solid #185a9d; padding-bottom: 5px; }
    .logo { height: 35px; width: auto; }
    .companyName { font-weight: 800; font-size: 12px; color: #185a9d; }
    .dateBox { font-size: 10px; font-weight: 700; color: #475569; }
    
    .title { text-align: center; font-weight: 900; font-size: 11px; text-transform: uppercase; margin-bottom: 10px; color: #1e293b; letter-spacing: 0.5px; }

    .table { border: 1.5px solid #334155; display: flex; flex-direction: column; width: 100%; border-bottom: none; }
    
    .groupHeader { display: flex; background: #f1f5f9; border-bottom: 1px solid #334155; align-items: stretch; }
    .detailHeader { display: flex; background: #f8fafc; border-bottom: 1px solid #334155; align-items: stretch; }
    .row { display: flex; border-bottom: 1px solid #94a3b8; min-height: 34px; align-items: stretch; page-break-inside: avoid; }
    .row:last-child { border-bottom: 1.5px solid #334155; }

    .hCell, .cell {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        border-right: 1px solid #334155;
        padding: 4px;
        text-align: center;
    }
    .cell:last-child, .hCell:last-child { border-right: none; }

    .hCell { font-weight: 800; font-size: 8.5px; color: #0f172a; }
    .area { justify-content: flex-start; text-align: left; padding-left: 8px; font-weight: 600; }

    .footer { margin-top: 15px; display: flex; justify-content: space-between; gap: 20px; }
    .sigBox { flex: 1; border: 1px solid #cbd5e1; padding: 8px; background: #f8fafc; }
    .sigLabel { font-weight: 800; font-size: 9px; margin-bottom: 5px; color: #185a9d; text-transform: uppercase; }
  </style>
</head><body>
  <div class="card">
    <div class="headerSection">
      <div style="display:flex; align-items:center; gap:10px;">
        ${logo ? `<img class="logo" src="${logo}"/>` : ''}
        <div class="companyName">${escapeHtml(metadata.companyName || 'Bravo')}</div>
      </div>
      <div class="dateBox">Date: ${escapeHtml(metadata.issueDate || metadata.date || '—')}</div>
    </div>

    <div class="title">Temperature Record for Cooling (Cooling Temperature Log)</div>

    <div class="table">
      <div class="groupHeader">
        <div class="hCell" style="width:${colPct(COL.IDX)}">#</div>
        <div class="hCell" style="width:${colPct(COL.FOOD)}">FOOD ITEM</div>
        <div class="hCell" style="width:${colPct(COL.UNIT)}">TIME INTO UNIT</div>
        <div class="hCell" style="width:${colPct(recGroupWidth)}">1ST RECORD</div>
        <div class="hCell" style="width:${colPct(recGroupWidth)}">2ND RECORD</div>
        <div class="hCell" style="width:${colPct(recGroupWidth)}">3RD RECORD</div>
        <div class="hCell" style="width:${colPct(COL.STAFF)}">STAFF NAME</div>
      </div>
      
      <div class="detailHeader">
        <div class="hCell" style="width:${colPct(COL.IDX)}"></div>
        <div class="hCell" style="width:${colPct(COL.FOOD)}"></div>
        <div class="hCell" style="width:${colPct(COL.UNIT)}"></div>
        <div class="hCell" style="width:${colPct(COL.REC)}">TIME</div>
        <div class="hCell" style="width:${colPct(COL.REC)}">TEMP</div>
        <div class="hCell" style="width:${colPct(COL.REC)}">SIGN</div>
        <div class="hCell" style="width:${colPct(COL.REC)}">TIME</div>
        <div class="hCell" style="width:${colPct(COL.REC)}">TEMP</div>
        <div class="hCell" style="width:${colPct(COL.REC)}">SIGN</div>
        <div class="hCell" style="width:${colPct(COL.REC)}">TIME</div>
        <div class="hCell" style="width:${colPct(COL.REC)}">TEMP</div>
        <div class="hCell" style="width:${colPct(COL.REC)}">SIGN</div>
        <div class="hCell" style="width:${colPct(COL.STAFF)}"></div>
      </div>

      ${rowsHtml}
    </div>

    <div class="footer" style="flex-direction:column; gap:12px;">
      <div style="border:1px solid #e2e8f0; background:#fff; padding:8px;">
        <div class="sigLabel" style="margin-bottom:6px;">Corrective Action:</div>
        <div style="min-height:56px; border:1px solid #e6eef8; background:#ffffff; padding:8px; font-size:10px; color:#0f172a;">${escapeHtml(p.verification?.correctiveAction || p.correctiveAction || '')}</div>
      </div>

      <div style="display:flex; gap:20px;">
        <div class="sigBox">
          <div class="sigLabel">CHEF Signature:</div>
          ${sigHtml(p.verification?.chefSignature || p.verification?.chefSign || p.chefSignature || p.chefSign || '', 40)}
        </div>

        <div class="sigBox">
          <div class="sigLabel">HSEQ Manager:</div>
          ${sigHtml(p.verification?.hseqManagerSign || p.verification?.hseqManager || p.hseqManagerSign || '', 40)}
        </div>

        <div class="sigBox">
          <div class="sigLabel">Complex Manager:</div>
          ${sigHtml(p.verification?.complexManagerSign || p.verification?.complexManager || p.complexManagerSign || '', 40)}
        </div>
      </div>
    </div>
  </div>
</body></html>`;
};
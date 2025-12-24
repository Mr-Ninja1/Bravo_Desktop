const fs = require('fs');
const path = require('path');

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
    if (val.data && typeof val.data === 'string') return val.data.startsWith('data:') ? val.data : `data:image/png;base64,${val.data.replace(/\s+/g, '')}`;
    if (val.signature && typeof val.signature === 'string') return val.signature.startsWith('data:') ? val.signature : `data:image/png;base64,${val.signature.replace(/\s+/g, '')}`;
    return null;
  }
  if (typeof val !== 'string') return null;
  const s = val.trim(); if (!s) return null;
  if (s.startsWith('data:') || /^https?:\/\//i.test(s)) return s;
  const compact = s.replace(/\s+/g, '');
  if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
};

const renderSignature = (val, w = 140, h = 44) => {
  const uri = resolveSignatureUri(val);
  if (uri) return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block; margin: 0 auto; mix-blend-mode: multiply;"/>`;
  if (!val) return `<div style="color:#999">-</div>`;
  return `<div style="font-size: 11px;">${escapeHtml(val)}</div>`;
};

const getLogoDataUri = (p) => {
  if (!p) return null;
  if (p.assets && p.assets.logoDataUri) return p.assets.logoDataUri;
  const candidates = [path.join(process.cwd(), 'renderer', 'assets', 'logo.jpeg'), path.join(process.cwd(), 'assets', 'logo.jpeg')];
  for (const c of candidates) { try { if (fs.existsSync(c)) { const b = fs.readFileSync(c); const ext = path.extname(c).toLowerCase(); const mime = ext === '.png' ? 'image/png' : 'image/jpeg'; return `data:${mime};base64,${b.toString('base64')}`; } } catch (e) {} }
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper) || {};
  const meta = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : [];
  const TIME_SLOTS = ['Morning','Afternoon','Evening'];

  // Recalibrated widths for A4 Landscape (Total ~1080px)
  const DATE_W = 60;
  const SLOT_W = 210; // 3 slots x 210 = 630
  const SUB_W = 70;   // Temp, Time, Sign are each 70px
  const ACTION_W = 230;
  const SIG_W = 150;

  const logoUri = getLogoDataUri(p);

  const headerRowHtml = `
    <div style="display:flex; background:#f3f4f6; border:1px solid #000; align-items: stretch; border-bottom: none;">
      <div style="width:${DATE_W}px; padding:8px 4px; text-align:center; font-weight:800; border-right:1px solid #000; display:flex; align-items:center; justify-content:center;">Date</div>
      ${TIME_SLOTS.map(slot => `
        <div style="width:${SLOT_W}px; border-right:1px solid #000; display:flex; flex-direction:column;">
          <div style="padding:4px; text-align:center; font-weight:800; border-bottom:1px solid #000; background:#e5e7eb">${escapeHtml(slot)}</div>
          <div style="display:flex; flex:1">
            <div style="width:${SUB_W}px; text-align:center; font-size:10px; font-weight:700; border-right:1px solid #000; padding:4px 0;">Temp</div>
            <div style="width:${SUB_W}px; text-align:center; font-size:10px; font-weight:700; border-right:1px solid #000; padding:4px 0;">Time</div>
            <div style="flex:1; text-align:center; font-size:10px; font-weight:700; padding:4px 0;">Sign</div>
          </div>
        </div>`).join('')}
      <div style="width:${ACTION_W}px; padding:4px; text-align:center; font-weight:800; border-right:1px solid #000; display:flex; align-items:center; justify-content:center; font-size:11px;">Corrective Action</div>
      <div style="flex:1; padding:4px; text-align:center; font-weight:800; display:flex; align-items:center; justify-content:center; font-size:11px;">Sup Name & Sign</div>
    </div>`;

  const rowsHtml = (rows.length ? rows : Array.from({length:12}).map(()=>({}))).map((item, idx) => `
    <div style="display:flex; border:1px solid #000; border-top: none; min-height:42px; align-items:stretch">
      <div style="width:${DATE_W}px; text-align:center; border-right:1px solid #000; display:flex; align-items:center; justify-content:center; font-weight:700;">${escapeHtml(item.day || idx + 1)}</div>
      ${TIME_SLOTS.map(slot => `
        <div style="width:${SLOT_W}px; border-right:1px solid #000; display:flex;">
          <div style="width:${SUB_W}px; border-right:1px solid #000; display:flex; align-items:center; justify-content:center; font-size:11px;">${escapeHtml((item[slot] && item[slot].temp) || '')}</div>
          <div style="width:${SUB_W}px; border-right:1px solid #000; display:flex; align-items:center; justify-content:center; font-size:11px;">${escapeHtml((item[slot] && item[slot].time) || '')}</div>
          <div style="flex:1; display:flex; align-items:center; justify-content:center;">${ item[slot] && item[slot].sign ? renderSignature(item[slot].sign,65,38) : '' }</div>
        </div>`).join('')}
      <div style="width:${ACTION_W}px; padding:4px; text-align:left; border-right:1px solid #000; display:flex; align-items:center; font-size:11px;">${escapeHtml(item.correctiveAction || '')}</div>
      <div style="flex:1; padding:4px; text-align:center; display:flex; align-items:center; justify-content:center;">
        ${ item.supNameSign ? renderSignature(item.supNameSign,120,38) : `<span style="font-size:11px">${escapeHtml(item.supName || '')}</span>` }
      </div>
    </div>
  `).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:8mm}
    body{font-family:Inter, Arial, sans-serif; margin:0; padding:0; color:#111}
    .container{width:100%; padding:10px}
    .brandHeader{display:flex; align-items:center; justify-content:space-between; border-bottom:2px solid #000; padding-bottom:8px}
    .brandLogo{width:60px; height:60px; object-fit:contain}
    .subject{font-size:22px; font-weight:900; text-align:center; margin-top:10px; text-transform:uppercase}
    .instruction{color:#b91c1c; font-weight:800; text-align:center; font-size:14px; margin-bottom:12px}
  </style></head><body>

  <div class="container">
    <div class="brandHeader">
      <div style="display:flex; align-items:center">
        ${logoUri ? `<img src="${logoUri}" class="brandLogo"/>` : ''}
        <div style="margin-left:12px">
          <div style="font-weight:900; font-size:20px; color:#007A33">Bravo! Brands</div>
          <div style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px">Food Safety Management System</div>
        </div>
      </div>
      <div style="text-align:right; font-weight:700; font-size:12px">
        <div>Issue Date: ${escapeHtml(meta.issueDate || '')}</div>
        <div>Page 1 of 1</div>
      </div>
    </div>

    <div class="subject">${escapeHtml(p.title || 'Walk-in Freezer Log')}</div>
    <div class="instruction">SPECIFICATION: Temperature must be maintained below -12°C</div>

    <div style="width:100%">
      ${headerRowHtml}
      ${rowsHtml}
    </div>

    <div style="margin-top:20px; display:flex; justify-content:space-between; gap:20px">
      <div style="flex:1; border:1px solid #000; padding:8px">
        <div style="font-weight:800; font-size:10px; text-transform:uppercase; color:#666">Verified by: HSEQ Manager</div>
        <div style="min-height:50px; display:flex; align-items:center; justify-content:center">
          ${ meta.hseqManagerSign ? renderSignature(meta.hseqManagerSign,200,50) : '' }
        </div>
        <div style="font-size:12px; font-weight:700; text-align:center; border-top:1px solid #eee; padding-top:4px">${escapeHtml(meta.hseqManager || '')}</div>
      </div>
      <div style="flex:1; border:1px solid #000; padding:8px">
        <div style="font-weight:800; font-size:10px; text-transform:uppercase; color:#666">Complex Manager</div>
        <div style="min-height:50px; display:flex; align-items:center; justify-content:center">
          ${ meta.complexManagerSign ? renderSignature(meta.complexManagerSign,200,50) : '' }
        </div>
        <div style="font-size:12px; font-weight:700; text-align:center; border-top:1px solid #eee; padding-top:4px">${escapeHtml(meta.complexManager || '')}</div>
      </div>
    </div>
  </div>

</body></html>`;
};
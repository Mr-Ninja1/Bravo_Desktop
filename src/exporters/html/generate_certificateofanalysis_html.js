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
  if (s.startsWith('data:') || /^https?:\/\//i.test(s) || s.startsWith('/')) return s;
  const compact = s.replace(/\s+/g, '');
  if (compact.length > 150 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
};

const renderSignature = (val, w = 130, h = 40) => {
  const uri = resolveSignatureUri(val);
  if (uri) return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block"/>`;
  if (!val) return `<div style="color:#999">-</div>`;
  return `<div>${escapeHtml(val)}</div>`;
};

const getLogoDataUri = (p) => {
  if (!p) return null;
  if (p.assets && p.assets.logoDataUri) return p.assets.logoDataUri;
  const candidates = [
    path.join(process.cwd(), 'renderer', 'assets', 'logo.jpeg'),
    path.join(process.cwd(), 'renderer', 'src', 'assets', 'logo.jpeg'),
    path.join(process.cwd(), 'assets', 'logo.jpeg'),
    path.join(process.cwd(), 'assets', 'logo.jpg'),
    path.join(process.cwd(), 'renderer', 'assets', 'logo.jpg')
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) {
        const b = fs.readFileSync(c);
        const ext = path.extname(c).toLowerCase();
        const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
        return `data:${mime};base64,${b.toString('base64')}`;
      }
    } catch (e) {
      /* ignore */
    }
  }
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const data = p.formData || {};
  const meta = p.metadata || {};
  const products = Array.isArray(data.products) ? data.products : (data.items || []);

  const DEFAULT_COLS = {
    PRODUCT: 140,
    BATCH_NO: 120,
    TIME: 90,
    DATE_REC: 110,
    APPEARANCE: 120,
    WEIGHT: 100,
    TEXTURE: 120,
    ORGANIC_TEST: 100,
    RESULT: 140,
    COMMENT: 180,
    SAMPLED_BY: 160,
    SFC_SIGN: 140,
  };
  const WIDTHS = (p.layoutHints && p.layoutHints.WIDTHS) || DEFAULT_COLS;
  const tableWidth = Object.values(WIDTHS).reduce((a, b) => a + (Number(b) || 0), 0) || 1000;
  const TOTAL = Object.values(WIDTHS).reduce((s, v) => s + (Number(v) || 0), 0) || 1;
  const colStyle = (w) => {
    const width = Number(w) || 80;
    const min = Math.max(28, Math.round(width * 0.28));
    return `min-width:${min}px; width:${width}px; display:inline-block; box-sizing:border-box;`;
  };

  const leftSum = (Number(WIDTHS.PRODUCT) || 0) + (Number(WIDTHS.BATCH_NO) || 0) + (Number(WIDTHS.TIME) || 0) + (Number(WIDTHS.DATE_REC) || 0);
  const testsSum = (Number(WIDTHS.APPEARANCE) || 0) + (Number(WIDTHS.WEIGHT) || 0) + (Number(WIDTHS.TEXTURE) || 0) + (Number(WIDTHS.ORGANIC_TEST) || 0);
  const rightSum = Math.max(0, tableWidth - leftSum - testsSum);

  const rowsHtml = (products.length ? products : []).map(item => {
    return `
      <div style="display:flex; align-items:center; border-bottom:1px solid #eee; min-width:${tableWidth}px">
        <div style="${colStyle(WIDTHS.PRODUCT)} padding:8px; border-right:1px solid #ccc; text-align:center">${escapeHtml(item.product || '')}</div>
        <div style="${colStyle(WIDTHS.BATCH_NO)} padding:8px; border-right:1px solid #ccc; text-align:center">${escapeHtml(item.batchNo || '')}</div>
        <div style="${colStyle(WIDTHS.TIME)} padding:8px; border-right:1px solid #ccc; text-align:center">${escapeHtml(item.time || '')}</div>
        <div style="${colStyle(WIDTHS.DATE_REC)} padding:8px; border-right:1px solid #ccc; text-align:center">${escapeHtml(item.dateReceived || item.dateRec || '')}</div>
        <div style="${colStyle(WIDTHS.APPEARANCE)} padding:8px; border-right:1px solid #ccc; text-align:center">${escapeHtml(item.appearance || '')}</div>
        <div style="${colStyle(WIDTHS.WEIGHT)} padding:8px; border-right:1px solid #ccc; text-align:center">${escapeHtml(item.weight || '')}</div>
        <div style="${colStyle(WIDTHS.TEXTURE)} padding:8px; border-right:1px solid #ccc; text-align:center">${escapeHtml(item.texture || '')}</div>
        <div style="${colStyle(WIDTHS.ORGANIC_TEST)} padding:8px; border-right:1px solid #ccc; text-align:center">${escapeHtml(item.organicTest || '')}</div>
        <div style="${colStyle(WIDTHS.RESULT)} padding:8px; border-right:1px solid #ccc; text-align:center; font-weight:700; color:${item.result ? '#065f46' : '#111'}">${escapeHtml(item.result || '')}</div>
        <div style="${colStyle(WIDTHS.COMMENT)} padding:8px; border-right:1px solid #ccc; text-align:left;">${escapeHtml(item.comment || '')}</div>
        <div style="${colStyle(WIDTHS.SAMPLED_BY)} padding:4px; text-align:center">${renderSignature(item.sampledBy)}</div>
        <div style="${colStyle(WIDTHS.SFC_SIGN)} padding:4px; text-align:center">${renderSignature(item.sfcSign)}</div>
      </div>`;
  }).join('\n') || `<div style="padding:12px;">No products recorded</div>`;

  const logoUri = getLogoDataUri(p);

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:8mm}
    body{font-family:Inter, Arial, sans-serif; margin:0; padding:12px; color:#111}
    .card{background:#fff; border-radius:6px; padding:12px; border:1px solid #1F2937}
    .headerRowTop{display:flex; align-items:center; margin-bottom:12px}
    .logo{width:55px; height:55px; margin-right:12px}
    .brandName{font-size:13px; font-weight:800; color:#185a9d}
    .title{font-size:15px; font-weight:900; color:#111827}
    .metaBoxRight{align-items:flex-end}
    .metaTextSmall{font-size:10px; color:#6b7280}
    .tableWrapper{margin-top:10px; border:1px solid #ccc}
    .spanningHeaderRowExact{display:flex; align-items:center; margin-top:6px}
    .testsHeaderGroupExact{width:340px; border-top:1px solid #ccc; border-left:1px solid #ccc; border-right:1px solid #ccc; background:#fafafa; align-items:center; padding:6px; text-align:center}
    .tableHeader{display:flex; background:#f2f2f2; border-bottom:1px solid #ccc}
    .columnHeader{font-size:9px; font-weight:700; padding:8px; text-align:center; border-right:1px solid #ccc}
    .tableRow{display:flex; border-bottom:1px solid #eee; align-items:center}
    .cellText{padding:8px; font-size:11px; border-right:1px solid #ccc; text-align:center; color:#333}
    .emptyValue{color:#999; font-size:11px}
    .sampledManagersRow{display:flex; align-items:center; margin-top:12px; padding-top:8px; border-top:1px solid #eee}
    .smallLabel{font-size:11px; color:#374151; font-weight:600}
  </style></head><body>

    <div class="card">
      <div class="headerRowTop">
        ${logoUri ? `<img src="${logoUri}" class="logo"/>` : ''}
        <div style="flex:1">
          <div class="brandName">BRAVO BRANDS LIMITED</div>
          <div class="title">CERTIFICATE OF ANALYSIS</div>
        </div>
        <div class="metaBoxRight" style="text-align:right">
          <div class="metaTextSmall">Issue date: ${escapeHtml(meta.issueDate || data.issueDate || '')}</div>
        </div>
      </div>

      <div class="tableWrapper">
        <div>
          <div class="spanningHeaderRowExact">
            <div style="width:${leftSum}px"></div>
            <div class="testsHeaderGroupExact">Organoleptic & Morphologistic Tests</div>
            <div style="width:${rightSum}px"></div>
          </div>

          <div class="tableHeader" style="min-width:${tableWidth}px">
            <div style="${colStyle(WIDTHS.PRODUCT)}" class="columnHeader">Product</div>
            <div style="${colStyle(WIDTHS.BATCH_NO)}" class="columnHeader">Batch No</div>
            <div style="${colStyle(WIDTHS.TIME)}" class="columnHeader">Time</div>
            <div style="${colStyle(WIDTHS.DATE_REC)}" class="columnHeader">Date Rec.</div>
            <div style="${colStyle(WIDTHS.APPEARANCE)}" class="columnHeader">Appearance</div>
            <div style="${colStyle(WIDTHS.WEIGHT)}" class="columnHeader">Weight</div>
            <div style="${colStyle(WIDTHS.TEXTURE)}" class="columnHeader">Texture</div>
            <div style="${colStyle(WIDTHS.ORGANIC_TEST)} background:#fdfdfd" class="columnHeader">Organic Test</div>
            <div style="${colStyle(WIDTHS.RESULT)}" class="columnHeader">Result</div>
            <div style="${colStyle(WIDTHS.COMMENT)}" class="columnHeader">Comment</div>
            <div style="${colStyle(WIDTHS.SAMPLED_BY)}" class="columnHeader">Sampled By</div>
            <div style="${colStyle(WIDTHS.SFC_SIGN)}" class="columnHeader">SFC sign</div>
          </div>

          ${rowsHtml}
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; margin-top:12px">
        <div style="align-items:center; text-align:center">
          <div class="smallLabel">HSEQ Manager:</div>
          <div style="padding-top:6px">${renderSignature(data.hseqManager || data.hseqManagerSignature, 160, 50)}</div>
        </div>
        <div style="align-items:center; text-align:center">
          <div class="smallLabel">COMPLEX MANAGER:</div>
          <div style="padding-top:6px">${renderSignature(data.complexManager || data.complexManagerSignature, 160, 50)}</div>
        </div>
      </div>

      ${data.footerDate ? `<div style="border-top:1px solid #eee; padding-top:8px; margin-top:6px">DATE: ${escapeHtml(data.footerDate)}</div>` : ''}

    </div>

  </body></html>`;
};

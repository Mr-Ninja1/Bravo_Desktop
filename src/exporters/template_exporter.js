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

module.exports = function generate(payloadWrapper, opts = {}) {
  const p = normalizeIncoming(payloadWrapper);
  const metadata = p.metadata || p.meta || {};

  // logo resolution (same logic used in other exporters)
  let logo = (p.assets && (p.assets.logoDataUri || p.assets.logo))
    ? (p.assets.logoDataUri || p.assets.logo)
    : (p.logo || p.logoDataUri || metadata.logoUrl || metadata.companyLogo || metadata.logo || null);
  try {
    if (!logo) {
      const fs = require('fs');
      const path = require('path');
      const explicit = path.resolve(process.cwd(), 'assets', 'logo.jpeg');
      if (fs.existsSync(explicit)) {
        const data = fs.readFileSync(explicit);
        logo = `data:image/jpeg;base64,${data.toString('base64')}`;
      }
    }
  } catch (e) {}

  const title = escapeHtml(p.title || opts.title || metadata.title || 'Form Export');

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body{font-family:Inter,Arial,sans-serif;padding:12px;color:#072a63;background:#fff;margin:0}
    .card{max-width:1100px;margin:0 auto;background:#fff}
    .headerRow{display:flex;align-items:center;margin-bottom:12px}
    .logo{width:60px;height:60px;object-fit:contain;margin-right:12px}
    .company{font-weight:800;font-size:16px;color:#374151}
    .title{font-weight:800;font-size:18px;margin:4px 0}
    /* EXPORTER_BODY_MARKER */
  </style>
</head><body>
  <div class="card">
    <div class="headerRow">
      ${logo ? `<img class="logo" src="${logo}" alt="Company logo"/>` : ''}
      <div style="flex:1">
        <div class="company">${escapeHtml(metadata.companyName || 'Bravo')}</div>
        <div class="title">${title}</div>
      </div>
    </div>

    <!-- Begin body - customize below -->
    <div>
      <p style="color:#6b7280">This is a generated exporter stub. Replace this block with a tailored HTML table that matches the original Presentational component.</p>
    </div>
    <!-- End body -->
  </div>
</body></html>`;
};

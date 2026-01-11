const fs = require('fs');
const path = require('path');

const escapeHtml = (s) => String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
  const s = String(val || '');
  if (s.startsWith('data:')) return s;
  const compact = s.replace(/\s+/g, '');
  if (compact.length > 100) return `data:image/png;base64,${compact}`;
  return null;
};

const renderSig = (v, w = 140, h = 44) => {
  const uri = resolveSignatureUri(v);
  if (!uri) return '';
  return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block; object-fit:contain; mix-blend-mode: multiply;"/>`;
};

const getLogoDataUri = (p) => {
  if (!p) return null;
  if (p.assets && p.assets.logoDataUri) return p.assets.logoDataUri;
  const candidates = [
    path.join(process.cwd(), 'renderer', 'assets', 'logo.jpeg'),
    path.join(process.cwd(), 'assets', 'logo.jpeg'),
    path.join(process.cwd(), 'assets', 'logo.jpeg')
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) {
        const b = fs.readFileSync(c);
        const mime = path.extname(c).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
        return `data:${mime};base64,${b.toString('base64')}`;
      }
    } catch (e) {}
  }
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const meta = p.metadata || {};

  const number = p.number || meta.number || '';
  const date = p.date || meta.date || '';

  const samples = (p.formData && Array.isArray(p.formData.samples) && p.formData.samples) || p.samples || [];

  const logoData = getLogoDataUri(p);

  const samplesHtml = (samples.length ? samples : []).map(s => `
    <tr>
      <td style="padding:6px; border:1px solid #000">${escapeHtml(s.sampleIdentification || '')}</td>
      <td style="padding:6px; border:1px solid #000; text-align:center">${escapeHtml(s.result || '')}</td>
      <td style="padding:6px; border:1px solid #000; text-align:center">${escapeHtml(s.specification || '')}</td>
      <td style="padding:6px; border:1px solid #000">${escapeHtml(s.resultAfterCorrective || '')}</td>
    </tr>
  `).join('') || '<tr><td colspan="4" style="padding:8px; border:1px solid #000; text-align:center">No samples</td></tr>';

  const get = (k) => {
    if (p.formData && Object.prototype.hasOwnProperty.call(p.formData, k)) return p.formData[k];
    if (p.metadata && Object.prototype.hasOwnProperty.call(p.metadata, k)) return p.metadata[k];
    if (Object.prototype.hasOwnProperty.call(p, k)) return p[k];
    return '';
  };

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:8mm}
    *{box-sizing:border-box}
    body{font-family:Arial, Helvetica, sans-serif; margin:0; color:#111}
    .container{width:1120px; margin:0 auto; padding:12px}
    .header{display:flex; justify-content:space-between; align-items:center; margin-bottom:8px}
    .logo{height:56px; width:auto; object-fit:contain}
    .title{font-size:14px; font-weight:800; text-align:center}
    .metaRow{display:flex; gap:10px; margin-bottom:8px}
    .contentWrap{display:flex; gap:12px}
    .left{min-width:700px; flex:2; border-right:1px solid #000; padding-right:10px}
    .right{min-width:420px; flex:1; padding-left:12px}
    .sectionHeader{background:#ddd; padding:6px; font-weight:700; text-align:center; border-bottom:1px solid #000}
    .gridRow{display:flex; border-bottom:1px solid #000}
    .cell{flex:1; padding:6px; border-right:1px solid #000}
    .cell:last-child{border-right:0}
    .label{font-weight:700; font-size:11px}
    table{width:100%; border-collapse:collapse; margin-top:8px}
    th, td{border:1px solid #000}
    th{background:#ccc; padding:6px; text-align:center}
    td{padding:6px}
    .sigContainer{padding:8px; border-top:1px solid #000; margin-top:8px}
    .sigRow{display:flex; align-items:flex-end; gap:6px; margin-bottom:6px}
    .sigTitle{width:140px; font-weight:700}
    .block{border-bottom:1px solid #000; padding:8px; min-height:36px}
  </style></head><body>

    <div class="container">
      <div class="header">
        <div style="display:flex; align-items:center; gap:12px">
          ${logoData ? `<img src="${logoData}" class="logo"/>` : `<div style="width:80px;height:56px;background:#eee;display:flex;align-items:center;justify-content:center;color:#999">No Logo</div>`}
          <div style="font-weight:800;color:#185a9d">${escapeHtml(p.companyName || meta.companyName || '')}</div>
        </div>
        <div style="text-align:center" class="title">${escapeHtml(p.title || meta.title || 'Process & Quality Out of Control Report')}</div>
      </div>

      <div class="metaRow">
        <div style="font-weight:700">Number: <span style="font-weight:400">${escapeHtml(number)}</span></div>
        <div style="font-weight:700">Date: <span style="font-weight:400">${escapeHtml(date)}</span></div>
      </div>

      <div class="contentWrap">
        <div class="left">
          <div class="sectionHeader">PROCESS AND QUALITY OUT OF CONTROL</div>

          <div class="gridRow">
            <div class="cell" style="flex:1.5"><div class="label">Number</div><div>${escapeHtml(number)}</div></div>
            <div class="cell"><div class="label">Reported by</div><div>${escapeHtml(get('reportedBy'))}</div></div>
            <div class="cell"><div class="label">Sign</div><div style="text-align:center">${renderSig(get('reportedBySign'))}</div></div>
            <div class="cell" style="border-right:0"><div class="label">Time</div><div>${escapeHtml(get('reportedByTime'))}</div></div>
          </div>

          <div class="gridRow">
            <div class="cell" style="flex:1.5"><div class="label">Date</div><div>${escapeHtml(date)}</div></div>
            <div class="cell"><div class="label">Notified</div><div>${escapeHtml(get('notified'))}</div></div>
            <div class="cell"><div class="label">Sign</div><div style="text-align:center">${renderSig(get('notifiedSign'))}</div></div>
            <div class="cell" style="border-right:0"><div class="label">Time</div><div>${escapeHtml(get('notifiedTime'))}</div></div>
          </div>

          <div class="gridRow">
            <div class="cell" style="flex:4; border-right:0"><div class="label">Out of control description</div><div>${escapeHtml(get('outOfControlDescription'))}</div></div>
          </div>

          <div style="margin-top:8px">
            <table>
              <thead>
                <tr>
                  <th style="width:40%">Sample identification</th>
                  <th style="width:20%">Result</th>
                  <th style="width:20%">Specification</th>
                  <th style="width:20%">Result after corrective</th>
                </tr>
              </thead>
              <tbody>
                ${samplesHtml}
              </tbody>
            </table>
          </div>

          <div class="gridRow" style="margin-top:8px">
            <div class="cell" style="flex:1"><div class="label">Out of Control Issued by</div><div>${escapeHtml(get('outOfControlIssuedBy'))}</div></div>
            <div class="cell" style="flex:1; border-right:0"><div class="label">Origin of Out of Control</div><div>${escapeHtml(get('originOfOutOfControl'))}</div></div>
          </div>

          <div style="margin-top:8px">
            <div class="block">${escapeHtml(get('spacer1') || '')}</div>
            <div class="block">${escapeHtml(get('spacer2') || '')}</div>
            <div class="block">${escapeHtml(get('spacer3') || '')}</div>
          </div>

          <div class="sigContainer">
            <div class="sigRow"><div class="sigTitle">Signed:</div><div style="flex:1">${renderSig(get('signed1'))}</div></div>
            <div class="sigRow"><div class="sigTitle">HSEQ MANAGER:</div><div style="flex:1">${renderSig(get('hseqManagerSign') || get('hseqManager') || get('hseqManagerSignature'))}</div></div>
            <div class="sigRow"><div class="sigTitle">Signed:</div><div style="flex:1">${renderSig(get('signed2'))}</div></div>
            <div class="sigRow"><div class="sigTitle">Head of Section:</div><div style="flex:1">${renderSig(get('headOfSectionSign'))}</div></div>
            <div class="sigRow"><div class="sigTitle">Signed:</div><div style="flex:1">${renderSig(get('signed3'))}</div></div>
            <div class="sigRow"><div class="sigTitle">Complex manager:</div><div style="flex:1">${renderSig(get('complexManagerSign') || get('complexManager') || get('complexManagerSignature'))}</div></div>
          </div>
        </div>

        <div class="right">
          <div class="block"><div style="font-weight:700">1. What happened to process or Quality parameter?</div><div>${escapeHtml(get('q1'))}</div></div>
          <div class="block"><div style="font-weight:700">2. What was the possible cause?</div><div>${escapeHtml(get('q2'))}</div></div>

          <div class="block"><div style="font-weight:700">Five ways to establish root cause. What was wrong?</div><div>${escapeHtml(get('fiveWays'))}</div></div>
          ${[1,2,3,4,5].map(i => `<div class="block"><div style="font-weight:700">${i}. Why?</div><div>${escapeHtml(get('why'+i))}</div></div>`).join('')}

          <div class="block"><div style="font-weight:700">Root cause of the problem</div><div>${escapeHtml(get('rootCause'))}</div></div>
          <div class="block"><div style="font-weight:700">Corrective Action:</div><div>${escapeHtml(get('correctiveAction'))}</div></div>
          <div class="block"><div style="font-weight:700">Follow up:</div><div>${escapeHtml(get('followUp'))}</div></div>
        </div>
      </div>
    </div>

</body></html>`;
};

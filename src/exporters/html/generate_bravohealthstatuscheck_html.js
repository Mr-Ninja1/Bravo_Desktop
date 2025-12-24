const fs = require('fs');
const path = require('path');

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
    if (val.signature && typeof val.signature === 'string') return val.signature.startsWith('data:') ? val.signature : `data:image/png;base64,${val.signature.replace(/\s+/g,'')}`;
    return null;
  }
  if (typeof val !== 'string') return null;
  const s = val.trim(); if (!s) return null;
  if (s.startsWith('data:') || /^https?:\/\//i.test(s) || s.startsWith('/')) return s;
  const compact = s.replace(/\s+/g,'');
  if (compact.length > 200 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
};

const renderMaybeSignature = (v, w = 220, h = 50) => {
  const uri = resolveSignatureUri(v);
  if (uri) return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block; mix-blend-mode: multiply; margin: 0 auto;"/>`;
  return `<div style="border-bottom: 1px solid #ccc; width: 140px; height: 20px; margin: 10px auto;"></div>`;
};

const getLogoDataUri = (p) => {
  if (!p) return null;
  if (p.assets && p.assets.logoDataUri) return p.assets.logoDataUri;
  const candidates = [
    path.join(process.cwd(), 'renderer', 'assets', 'logo.jpeg'),
    path.join(process.cwd(), 'assets', 'logo.jpeg'),
    path.join(process.cwd(), 'assets', 'logo.png')
  ];
  for (const c of candidates) {
    try { if (fs.existsSync(c)) { 
      const b = fs.readFileSync(c); 
      const ext = path.extname(c).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
      return `data:${mime};base64,${b.toString('base64')}`; 
    } } catch (e) {}
  }
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const metadata = p.metadata || {};
  const daysOfWeek = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const rows = Array.isArray(p.formData) ? p.formData : (p.rows || []);

  // Professional Grid Widths for A4 Landscape
  const COL = {
    NAME: 150,
    POS: 100,
    DAY_BOX: 115, // Total width for one day (7 * 115 = 805)
    FIT: 35,
    COMM: 80
  };

  const rowsHtml = (rows.length ? rows : Array.from({length: 6}).map(()=>({}))).map(r => {
    const weekly = r.weeklyChecks || {};
    const daysHtml = daysOfWeek.map(d => {
      const cell = weekly[d] || { fit: null, comment: '' };
      const fitChar = cell.fit === true ? '✓' : (cell.fit === false ? 'X' : '');
      return `
        <div style="display:flex; width:${COL.DAY_BOX}px; border-right:1px solid #000; align-items:stretch">
          <div style="width:${COL.FIT}px; padding:4px; text-align:center; border-right:1px solid #000; font-weight:900; display:flex; align-items:center; justify-content:center">${fitChar}</div>
          <div style="width:${COL.COMM}px; padding:4px; font-size:9px; display:flex; align-items:center">${escapeHtml(cell.comment || '')}</div>
        </div>`;
    }).join('');

    return `
      <div style="display:flex; border-bottom:1px solid #000; min-height:38px; align-items:stretch">
        <div style="width:${COL.NAME}px; padding:4px 8px; border-right:1px solid #000; font-size:11px; display:flex; align-items:center">${escapeHtml(r.name || '')}</div>
        <div style="width:${COL.POS}px; padding:4px 8px; border-right:1px solid #000; font-size:10px; display:flex; align-items:center">${escapeHtml(r.position || '')}</div>
        ${daysHtml}
      </div>`;
  }).join('\n');

  const logo = getLogoDataUri(p);

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:6mm}
    *{box-sizing: border-box;}
    body{font-family:'Inter', Arial, sans-serif; margin:0; padding:0; color:#111; line-height:1.2}
    .container{width:1060px; margin:0 auto; padding:10px}
    .docHeader{display:flex; justify-content:space-between; border:1px solid #000; padding:8px; margin-bottom:8px}
    .brandTitle{font-weight:900; font-size:16px; color:#A00; text-transform:uppercase}
    .formTitle{font-weight:900; text-align:center; font-size:16px; margin:10px 0; text-transform:uppercase}
    .metaContainer{display:flex; gap:10px; margin-bottom:10px}
    .metaBox{flex:1; border:1px solid #000; padding:6px}
    .label{font-size:10px; font-weight:800; color:#444}
    .instruction-block{font-size:11px; border:1px solid #000; padding:10px; background:#f9fafb; margin-bottom:10px}
    .instruction-item{margin-bottom:4px}
    .bullet-list{margin-left:15px; margin-bottom:8px}
    .table{border:1.5px solid #000; border-bottom:none; width:100%}
    .hRow{display:flex; background:#eee; border-bottom:1.5px solid #000; align-items:stretch}
    .hCell{font-weight:800; font-size:10px; text-align:center; border-right:1px solid #000; text-transform:uppercase; display:flex; align-items:center; justify-content:center}
    .sig-section{display:flex; gap:12px; margin-top:10px}
    .sig-box{flex:1; border:1px solid #000; padding:8px}
  </style></head><body>

    <div class="container">
      <div class="docHeader">
        <div style="display:flex; align-items:center; gap:12px">
          ${logo ? `<img style="width:50px; height:40px; object-fit:contain" src="${logo}"/>` : ''}
          <div>
            <div class="brandTitle">Bravo</div>
            <div style="font-weight:700; font-size:12px">FOOD PRODUCTION AND SERVICE PERSONNEL</div>
          </div>
        </div>
        <div style="text-align:right; font-size:11px">
          <div>Doc Ref: ${escapeHtml(metadata.docRef || 'BBN-SHEQ-P-R-72')}</div>
          <div>Issue Date: ${escapeHtml(metadata.issueDate || metadata.date || '')}</div>
        </div>
      </div>

      <div class="formTitle">BRAVO BRANDS HEALTH STATUS CHECK</div>

      <div class="metaContainer">
        <div class="metaBox"><div class="label">SITE</div><div style="font-weight:700; border-top:1px solid #eee; margin-top:4px">${escapeHtml(metadata.site || '')}</div></div>
        <div class="metaBox"><div class="label">WEEK</div><div style="font-weight:700; border-top:1px solid #eee; margin-top:4px">${escapeHtml(metadata.week || '')}</div></div>
        <div class="metaBox"><div class="label">MONTH</div><div style="font-weight:700; border-top:1px solid #eee; margin-top:4px">${escapeHtml(metadata.month || '')}</div></div>
      </div>

      <div class="instruction-block">
        <div class="instruction-item">Ask if employee is unwell or if the employee has been unwell on leave or at home?</div>
        <div class="instruction-item">Ask if employee is taking/has taken any medicine - Medicine refers to ALL medications e.g. Company doctor prescriptions, local medicines from herbalists, any self-treatment etc</div>
        <div class="instruction-item">Ask if employee has taken any banned substances e.g. marijuana, hashish etc.</div>
        <div style="font-weight:700; margin-top:6px">Ask if employee has any symptoms or suffering from?</div>
        <div class="bullet-list">
          <div>- Infection of the ears, nose, throat, eyes, teeth or chest</div>
          <div>- Flu-like infections</div>
          <div>- Skin Infections</div>
          <div>- Vomiting</div>
          <div>- Diarrhoea</div>
          <div>- Jaundice</div>
        </div>
        <div style="font-weight:700">Ask the employee if he has been in contact to their knowledge with any person with the following</div>
        <div class="bullet-list">
          <div>- Typhoid</div>
          <div>- Paraphoid</div>
          <div>- Dysentery</div>
          <div>- Hepatitis</div>
          <div>- Any other infectious disease</div>
        </div>
        <div style="font-weight:700">The supervisor must check the following for each employee</div>
        <div class="bullet-list">
          <div>- All cuts, pimples and boils are covered with a waterproof dressing</div>
          <div>- Jewellery is in line with company policy</div>
          <div>- Chefs have a hat or hair net</div>
          <div>- The employee is wearing their safety shoes</div>
          <div>- The employee is neatly dressed</div>
        </div>
        <div class="instruction-item">If any employee answers to A & B positively then they must be referred to the Complex manager</div>
        <div class="instruction-item">If any employee does not comply with company policy (section C), this must be rectified before they start work</div>
        <div style="font-size:10px; font-weight:700; margin-top:10px; color:#b91c1c">Note - The supervisor and the manager will be liable for the health of employees and subordinates once they sign the above</div>
      </div>

      <div class="table">
        <div class="hRow">
          <div class="hCell" style="width:${COL.NAME}px">NAMES</div>
          <div class="hCell" style="width:${COL.POS}px">POSITION</div>
          ${daysOfWeek.map(d => `
            <div style="width:${COL.DAY_BOX}px; display:flex; flex-direction:column; border-right:1px solid #000">
              <div style="padding:4px; border-bottom:1px solid #000; font-weight:900; background:#ddd; text-align:center">${d}</div>
              <div style="display:flex; flex:1">
                <div style="width:${COL.FIT}px; border-right:1px solid #000; font-size:8px; display:flex; align-items:center; justify-content:center; text-align:center">Fit for<br/>work</div>
                <div style="width:${COL.COMM}px; font-size:8px; display:flex; align-items:center; justify-content:center">Managers comment</div>
              </div>
            </div>`).join('')}
        </div>
        ${rowsHtml}
      </div>

      <div class="sig-section">
        <div class="sig-box"><div class="label">SUPERVISOR SIGN</div>${renderMaybeSignature(metadata.supervisorSign || metadata.supervisorSignature || metadata.supervisorName)}</div>
        <div class="sig-box"><div class="label">COMPLEX MANAGER</div>${renderMaybeSignature(metadata.complexManagerSign || metadata.complexManager)}</div>
        <div class="sig-box"><div class="label">HSEQ MANAGER</div>${renderMaybeSignature(metadata.hseqManagerSign || metadata.hseqManager)}</div>
      </div>
    </div>
  </body></html>`;
};
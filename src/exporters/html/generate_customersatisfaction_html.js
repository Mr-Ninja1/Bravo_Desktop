const fs = require('fs');
const path = require('path');

const escapeHtml = (s) => String(s === null || s === undefined ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

const normalizeIncoming = (incoming) => {
  if (!incoming) return {};
  let v = incoming;
  if (v.payload) v = v.payload;
  if (v.meta && v.meta.payload) v = v.meta.payload;
  if (v.payload) v = v.payload;
  return v || {};
};

const getLogoDataUri = (p) => {
  if (!p) return null;
  if (p.assets && p.assets.logoDataUri) return p.assets.logoDataUri;
  if (p.logoDataUri) return p.logoDataUri;
  const candidates = [
    path.join(process.cwd(), 'renderer', 'assets', 'logo.jpeg'),
    path.join(process.cwd(), 'assets', 'logo.jpeg'),
    path.join(process.cwd(), 'assets', 'logo.jpeg')
  ];
  for (const c of candidates) {
    try { if (fs.existsSync(c)) { const b = fs.readFileSync(c); const mime = path.extname(c).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg'; return `data:${mime};base64,${b.toString('base64')}`; } } catch (e) {}
  }
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const data = p.formData || p.data || {};
  const metadata = p.metadata || {};

  const logo = getLogoDataUri(p) || metadata.logo || null;

  const subject = data.subject || metadata.subject || 'Customer Satisfaction Questionnaire';
  const customerName = data.customerName || '';
  const contactInfo = data.contactInfo || '';
  const notes = data.notes || '';

  const companyName = metadata.companyName || 'Bravo';
  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d)) return escapeHtml(String(iso));
      const dd = String(d.getDate()).padStart(2,'0');
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2,'0');
      const min = String(d.getMinutes()).padStart(2,'0');
      return `${dd}/${mm}/${yyyy} · ${hh}:${min}`;
    } catch(e){ return escapeHtml(String(iso)); }
  };
  const dateLine = formatDate(metadata.date || metadata.issueDate || p.date || metadata.createdAt || metadata.timestamp || '');

  const sectionsToRender = (() => {
    if (Array.isArray(data.sections) && data.sections.length) return data.sections;
    if (Array.isArray(data.groups) && data.groups.length) return data.groups.map(g=>({ title: g.title || g.name || '', questions: g.questions || g.items || [] }));
    if (Array.isArray(data.questions) && data.questions.length) return [{ title: '', questions: data.questions }];
    return null;
  })();

  const renderSections = () => {
    if (!sectionsToRender) {
      return `
      <div class="section">
        <div class="label">Customer</div>
        <div>${escapeHtml(customerName)}</div>
      </div>

      <div class="section" style="margin-top:8px">
        <div class="label">Contact</div>
        <div>${escapeHtml(contactInfo)}</div>
      </div>

      <div class="section" style="margin-top:8px">
        <div class="label">Notes</div>
        <div>${escapeHtml(notes)}</div>
      </div>`;
    }
    return sectionsToRender.map(s=>{
      const title = s.title || '';
      const qs = Array.isArray(s.questions) ? s.questions : [];
      const rows = qs.map(q=>{
        const questionText = q.question || q.label || q.name || q.prompt || '';
        const answer = (q.answer !== undefined && q.answer !== null) ? q.answer : (q.value || '');
        return `<div class="question-row"><div class="q">${escapeHtml(questionText)}</div><div class="a">${escapeHtml(answer)}</div></div>`;
      }).join('\n');
      return `<div class="section" style="margin-top:8px"><div class="section-title">${escapeHtml(title)}</div>${rows}</div>`;
    }).join('\n');
  };

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4; margin:12mm}
    body{font-family:Arial, Helvetica, sans-serif; color:#111; margin:0; padding:12px}
    .header{display:flex; align-items:center; gap:12px; margin-bottom:8px}
    .logo{height:48px; width:auto}
    .company{font-weight:800; color:#0b62b3; font-size:20px}
    .title{font-weight:800; font-size:16px}
    .date{font-size:12px; color:#6b7280}
    .section{padding:8px; border-bottom:1px solid #e5e7eb; background:#fff}
    .section-title{font-weight:800; text-transform:uppercase; margin-bottom:8px; color:#111}
    .label{font-weight:700; color:#374151; margin-bottom:4px}
    .question-row{display:flex; align-items:center; padding:10px 8px; border:1px solid #eef2f7; margin-bottom:6px}
    .question-row .q{flex:1}
    .question-row .a{min-width:160px; text-align:right; font-weight:700}
  </style></head><body>
    <div class="header">
      ${logo ? `<img class="logo" src="${logo}"/>` : `<div style="width:48px;height:48px;background:#eee"></div>`}
      <div style="flex:1">
        <div class="company">${escapeHtml(companyName)}</div>
        <div class="title">${escapeHtml(subject)}</div>
        <div class="date">${escapeHtml(dateLine)}</div>
      </div>
    </div>

    ${renderSections()}
</body></html>`;
};

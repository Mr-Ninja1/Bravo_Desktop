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

const formatIssueDate = (payloadOrMetadata) => {
  if (!payloadOrMetadata) return '';
  const merged = Object.assign({}, (payloadOrMetadata.metadata || {}), payloadOrMetadata);
  const candidates = [merged.issueDate, merged.issue_date, merged.date, merged.issuedDate, merged.issued_date];
  for (const raw of candidates) {
    if (!raw && raw !== 0) continue;
    const s = String(raw).trim(); if (!s) continue;
    const iso = /^(\d{4})[-\/](\d{2})[-\/](\d{2})$/;
    const dmy = /^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/;
    const mIso = s.match(iso);
    if (mIso) return `${mIso[3]}/${mIso[2]}/${mIso[1]}`;
    if (dmy.test(s)) return s.replace(/-/g,'/');
    const dt = new Date(s);
    if (!isNaN(dt.getTime())) {
      const dd = String(dt.getDate()).padStart(2,'0');
      const mm = String(dt.getMonth() + 1).padStart(2,'0');
      const yyyy = dt.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
  }
  return '';
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const metadata = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : (p.rows || []);

  // default to 20 rows if no data
  const rowData = rows.length ? rows : Array.from({ length: 20 }).map((_, i) => ({ index: i + 1 }));

  // format current system date as dd.mm.yyyy (presentational uses current date)
  const formatIssueDateNow = () => {
    const d = new Date(); const dd = String(d.getDate()).padStart(2,'0'); const mm = String(d.getMonth()+1).padStart(2,'0'); const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };
  const issueDateValue = formatIssueDateNow();

  // column widths (approx % of full width) matching presentational flex ratios
  const cols = [ 'NAME', 'ADDRESS', 'CONTACT NO.', 'PURPOSE', 'TIME IN', 'TIME OUT', 'AUTHORISE BY' ];
  const colWidths = [20,25,12,18,8,8,9];

  let logo = (p.assets && (p.assets.logoDataUri || p.assets.logo)) ? (p.assets.logoDataUri || p.assets.logo) : (p.logo || p.logoDataUri || metadata.logoUrl || metadata.companyLogo || metadata.logo || null);
  if (!logo) {
    try {
      const fs = require('fs'); const path = require('path');
      const candidates = [
        path.join(process.cwd(),'assets','logo.png'),
        path.join(process.cwd(),'assets','logo.jpg'),
        path.join(process.cwd(),'assets','logo.jpeg'),
        path.join(__dirname,'..','..','assets','logo.png'),
        path.join(__dirname,'..','..','assets','logo.jpeg')
      ];
      for (const pth of candidates) if (fs.existsSync(pth)) { const buf = fs.readFileSync(pth); const ext=path.extname(pth).replace('.',''); const mime=ext==='png'? 'image/png' : 'image/jpeg'; logo=`data:${mime};base64,${buf.toString('base64')}`; break; }
    } catch (e){}
  }

  const rowsHtml = rowData.map((r, i) => `
    <tr>
      <td style="width:${colWidths[0]}%">${escapeHtml(r.date || metadata.date || '')}</td>
      <td style="width:${colWidths[1]}%">${escapeHtml(r.timeIn || r.time_in || '')}</td>
      <td style="width:${colWidths[2]}%">${escapeHtml(r.timeOut || r.time_out || '')}</td>
      <td style="width:${colWidths[3]}%">${escapeHtml(r.name || r.visitor || '')}</td>
      <td style="width:${colWidths[4]}%">${escapeHtml(r.company || '')}</td>
      <td style="width:${colWidths[5]}%">${escapeHtml(r.personVisited || r.person || '')}</td>
      <td style="width:${colWidths[6]}%">${escapeHtml(r.purpose || '')}</td>
      <td style="width:${colWidths[7]}%">${ resolveSignatureUri(r.signature) ? `<img src="${escapeHtml(resolveSignatureUri(r.signature))}" style="max-height:36px;object-fit:contain"/>` : escapeHtml(r.signature || '') }</td>
    </tr>`).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4; margin:8mm}
    body{font-family: Inter, Arial, Helvetica, sans-serif; font-size:11px; color:#111; margin:0; padding:12px}
    .headerRowTop{display:flex; align-items:center; justify-content:space-between; margin-bottom:6px}
    .logo{width:64px; height:48px; object-fit:contain}
    .title{font-weight:900; text-align:center; font-size:18px}
    .bold{font-weight:700}
    .siteRow{display:flex; gap:12px; margin-bottom:6px}
    .siteCol{flex:1; padding:6px; border:1px solid #000; background:#eee; min-height:28px}
    .smallCol{flex:0.5}
    .managerBlock{display:flex; gap:12px; margin-bottom:6px}
    .managerCol{flex:1; padding:6px; border:1px solid #000; min-height:40px; display:flex; align-items:center; justify-content:center}
    .healthSection{margin-top:6px; border-top:1px solid #ccc; padding-top:8px}
    .healthTable{border:1px solid #000; border-radius:2px; overflow:hidden; margin-bottom:6px}
    .healthTableRow{display:flex; border-bottom:1px solid #e6e6e6; padding:6px; align-items:center}
    .healthTableQ{flex:0.8; padding-right:8px}
    .healthTableA{flex:0.2; text-align:center; font-weight:700}
    .instructionBlock{margin-top:8px; padding:6px}
    .tableHeader{display:flex; background:#eee; border:1px solid #000; margin-top:8px}
    .tableRow{display:flex; border-bottom:1px solid #000}
    .cell{padding:6px; font-size:12px; text-align:center}
    .nameCol{flex:0.2; border-right:1px solid #000}
    .addressCol{flex:0.25; border-right:1px solid #000}
    .contactCol{flex:0.12; border-right:1px solid #000}
    .purposeCol{flex:0.18; border-right:1px solid #000}
    .timeCol{flex:0.08; border-right:1px solid #000}
    .authCol{flex:0.17}
    .footer{margin-top:12px}
  </style></head><body>

    <div class="headerRowTop">
      <div style="width:72px">
        ${logo?`<img src="${logo}" class="logo"/>`:''}
      </div>
      <div style="flex:1; text-align:center">
        <div class="title">BRAVO BRANDS VISITORS LOG BOOK</div>
        <div class="bold">FOOD PRODUCTION AND SERVICE VISITORS</div>
      </div>
      <div style="width:200px; text-align:right">
        <div><span class="bold">Doc. Ref:</span> ${escapeHtml(metadata.docRef || p.formType || '')}</div>
        <div><span class="bold">Issue Date:</span> ${escapeHtml(issueDateValue)}</div>
      </div>
    </div>

    <div class="siteRow">
      <div class="siteCol"><div class="bold">SITE</div><div>${escapeHtml(metadata.site || p.site || '')}</div></div>
      <div class="siteCol"><div class="bold">SECTION/DEPARTMENT</div><div>${escapeHtml(metadata.section || '')}</div></div>
    </div>
    <div class="siteRow">
      <div class="siteCol smallCol"><div class="bold">MONTH</div><div>${escapeHtml(metadata.month || p.month || '')}</div></div>
      <div class="siteCol smallCol"><div class="bold">YEAR</div><div>${escapeHtml(metadata.year || p.year || '')}</div></div>
    </div>

    <div class="managerBlock">
      <div class="managerCol">
        <div class="bold">SITE MANAGER NAME & SIGNATURE</div>
        ${ (resolveSignatureUri(metadata.siteManager || p.siteManager || '')) ? `<img src="${escapeHtml(resolveSignatureUri(metadata.siteManager || p.siteManager || ''))}" style="max-width:220px; max-height:60px; object-fit:contain"/>` : escapeHtml(metadata.siteManager || p.siteManager || '') }
      </div>
      <div class="managerCol">
        <div class="bold">VERIFIED BY HSEQ MANAGER</div>
        ${ (resolveSignatureUri(metadata.verifiedManager || p.verifiedManager || '')) ? `<img src="${escapeHtml(resolveSignatureUri(metadata.verifiedManager || p.verifiedManager || ''))}" style="max-width:220px; max-height:60px; object-fit:contain"/>` : escapeHtml(metadata.verifiedManager || p.verifiedManager || '') }
      </div>
    </div>

    <div class="healthSection">
      <div class="bold" style="margin-bottom:6px">HEALTH CHECK</div>
      <div class="healthTable">
        ${[{
          q: 'Ask if visitor is unwell or if the visitor has been unwell at home?', key: 'unwell'
        },{ q: 'Ask if visitor is taking/has taken any medicine - Medicine refers to ALL medications e.g. Company doctor prescriptions, local medicines from herbalists, any self-treatment etc.', key: 'medicine'
        },{ q: 'Ask if visitor has taken any banned substances e.g. marijuana, hashish etc', key: 'bannedSubstances'
        },{ q: 'Ask if visitor has any symptoms or suffering from? (A/B)', key: 'symptoms'
        }].map((row)=>`<div class="healthTableRow"><div class="healthTableQ">${escapeHtml(row.q)}</div><div class="healthTableA">${escapeHtml(p.healthAnswers?.[row.key]||'')}</div></div>`).join('\n')}

        ${[{
          q: 'Infection of the ears, nose, throat, eyes, teeth or chest', key: 'infectionEarsNoseThroat'
        },{ q: 'Flu - like infections', key: 'fluLike'
        },{ q: 'Skin infections', key: 'skinInfections'
        },{ q: 'Vomiting', key: 'vomiting'
        },{ q: 'Diarrhoea', key: 'diarrhoea'
        },{ q: 'Jaundice', key: 'jaundice'
        }].map((row)=>`<div class="healthTableRow"><div class="healthTableQ" style="padding-left:8px">${escapeHtml(row.q)}</div><div class="healthTableA">${escapeHtml(p.healthAnswers?.[row.key]||'')}</div></div>`).join('\n')}

        <div class="healthTableRow"><div class="healthTableQ">Ask the visitor if he has been in contact to their knowledge with any person with the following (A/B)</div><div class="healthTableA">${escapeHtml(p.healthAnswers?.contactWithDisease||'')}</div></div>

        ${[{ q:'Typhoid', key:'typhoid' },{ q:'Paratyphoid', key:'paratyphoid' },{ q:'Dysentery', key:'dysentery' },{ q:'Hepatitis', key:'hepatitis' },{ q:'Any other infectious disease', key:'otherInfectious' }].map((row)=>`<div class="healthTableRow"><div class="healthTableQ" style="padding-left:8px">${escapeHtml(row.q)}</div><div class="healthTableA">${escapeHtml(p.healthAnswers?.[row.key]||'')}</div></div>`).join('\n')}

        <div class="healthTableRow" style="background:#f5f5f5"><div style="flex:1" class="bold">The host must ensure to check the following for each visitor?</div><div style="width:80px"></div></div>

        ${[{ q:'All cuts, pimples and boils are covered with a waterproof dressing', key:'cutsCovered' },{ q:'Jewellery is in line with company policy', key:'jewellery' },{ q:'Chefs have a hat or hair net', key:'hairnet' },{ q:'The visitor is wearing their safety shoes', key:'safetyShoes' },{ q:'The visitor is newly dressed', key:'neatlyDressed' }].map((row)=>`<div class="healthTableRow"><div class="healthTableQ">${escapeHtml(row.q)}</div><div class="healthTableA">${escapeHtml(p.healthAnswers?.[row.key]||'')}</div></div>`).join('\n')}

      </div>
    </div>

    <div class="instructionBlock">
      <div style="font-size:12px; margin-bottom:6px">If any visitor answers to A & B positively then they must be referred to the <span class="bold">Complex Manager</span></div>
      <div style="font-size:12px; margin-bottom:6px">If any visitor does not comply with company policy (Section C), this must be rectified before they are allowed into the Food Production Area</div>
      <div style="font-size:12px"><span class="bold">Note -</span> The supervisor and the manager will be liable for the health of visitors and subordinates once they sign</div>
    </div>

    <div class="tableHeader">
      <div class="cell nameCol bold">NAME</div>
      <div class="cell addressCol bold">ADDRESS</div>
      <div class="cell contactCol bold">CONTACT NO.</div>
      <div class="cell purposeCol bold">PURPOSE</div>
      <div class="cell timeCol bold">TIME IN</div>
      <div class="cell timeCol bold">TIME OUT</div>
      <div class="cell authCol bold">AUTHORISE BY</div>
    </div>

    ${rowData.map((e,i)=>`<div class="tableRow"><div class="cell nameCol">${escapeHtml(e.name||'')}</div><div class="cell addressCol">${escapeHtml(e.address||'')}</div><div class="cell contactCol">${escapeHtml(e.contact||'')}</div><div class="cell purposeCol">${escapeHtml(e.purpose||'')}</div><div class="cell timeCol">${escapeHtml(e.timeIn||'')}</div><div class="cell timeCol">${escapeHtml(e.timeOut||'')}</div><div class="cell authCol">${ resolveSignatureUri(e.authority) ? `<img src="${escapeHtml(resolveSignatureUri(e.authority))}" style="max-width:200px; max-height:48px; object-fit:contain"/>` : escapeHtml(e.authority||'') }</div></div>`).join('\n')}

    <div class="footer">
      <div class="bold" style="margin-top:8px">AUTHORIZED BY</div>
      <div style="margin-top:6px">${ resolveSignatureUri(metadata.authorizedBySign || p.authorizedBySign || '') ? `<img src="${escapeHtml(resolveSignatureUri(metadata.authorizedBySign || p.authorizedBySign || ''))}" style="max-width:260px; max-height:80px; object-fit:contain"/>` : escapeHtml(metadata.authorizedBy || p.authorizedBy || '') }</div>
    </div>

  </body></html>`;
};

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
    if (s.startsWith('data:') || s.startsWith('http:') || s.startsWith('https:') || s.startsWith('file:')) return s;
    const compact = s.replace(/\s+/g,'');
    if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
    return null;
};

module.exports = function generate(payloadWrapper) {
    const p = normalizeIncoming(payloadWrapper);
    const metadata = p.metadata || {};
    const timeSlots = Array.isArray(p.timeSlots) ? p.timeSlots : (p.timeSlots || []);
    const formData = Array.isArray(p.formData) ? p.formData : (p.formData || []);

    const hints = p.layoutHints || {};
    const COL = {
        EQUIP: Number(hints.EQUIP || 160),
        PPM: Number(hints.PPM || 60),
        TIME: Number(hints.TIME || 35),
        STAFF: Number(hints.STAFF || 90),
        SIGN: Number(hints.SIGN || 90),
        SUP: Number(hints.SUP || 90),
    };

    const timeColsWidth = (timeSlots.length || 0) * COL.TIME;
    const total = COL.EQUIP + COL.PPM + timeColsWidth + (COL.STAFF * 1) + (COL.SIGN * 1) + (COL.SUP * 2);
    const colPercent = (w) => ((w / total) * 100).toFixed(4) + '%';

    const logo = (p.assets && p.assets.logoDataUri) ? p.assets.logoDataUri : null;

    // Increased default signature height to match fatter rows
    const sigHtml = (val, h=28) => {
        const uri = resolveSignatureUri(val);
        if (uri) return `<img src="${uri}" style="max-height:${h}px; width:auto; object-fit:contain; display:block; mix-blend-mode:multiply;"/>`;
        return `<div style="font-size:8px; color:#9CA3AF">${escapeHtml(val||'')}</div>`;
    };

    const rowsHtml = (formData.length ? formData : Array.from({ length: 15 }).map(()=>({}))).map(row => {
        const equip = escapeHtml(row.name || row.equipment || '');
        const ppm = escapeHtml(row.ppm || '');
        const timesHtml = timeSlots.map(ts => {
            const checks = row.times && row.times[ts] ? row.times[ts] : {};
            // Increased tick size slightly
            return `<div class="timeCell" style="font-size:12px">${checks.checked ? '✓' : ''}</div>`;
        }).join('');

        return `
            <div class="row">
                <div class="cell area" style="width:${colPercent(COL.EQUIP)}">${equip}</div>
                <div class="cell" style="width:${colPercent(COL.PPM)}">${ppm}</div>
                <div class="timeGroup" style="width:${colPercent(timeColsWidth)}">${timesHtml}</div>
                <div class="cell" style="width:${colPercent(COL.STAFF)}">${escapeHtml(row.staffName || '')}</div>
                <div class="cell" style="width:${colPercent(COL.SIGN)}">${sigHtml(row.staffSign || '')}</div>
                <div class="cell" style="width:${colPercent(COL.SUP)}">${escapeHtml(row.supName || '')}</div>
                <div class="cell" style="width:${colPercent(COL.SUP)}">${sigHtml(row.supSign || '')}</div>
            </div>`;
    }).join('\n');

    return `<!doctype html><html><head><meta charset="utf-8">
    <style>
        @page { size: A4 landscape; margin: 6mm; }
        /* Increased base font size from 8px to 9px */
        body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; color: #111; background: #fff; font-size: 9px; line-height: 1.2; }
        .card { width: 100%; }
        
        /* Header */
        .headerSection { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 6px; border-bottom: 2px solid #185a9d; padding-bottom: 4px; }
        .logo { height: 32px; width: auto; margin-right: 10px; }
        .branding { display: flex; align-items: center; }
        .companyName { font-weight: 800; font-size: 12px; color: #185a9d; }
        .formTitle { font-weight: 800; font-size: 11px; text-transform: uppercase; text-align: right; }

        .metaBar { display: flex; justify-content: space-between; align-items: center; font-size: 9px; margin-bottom: 8px; padding: 4px 8px; background: #f1f5f9; border: 1px solid #cbd5e1; }
        .tickBadge { background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 2px; font-weight: 700; border: 1px solid #bbf7d0; font-size: 8px; }

        /* Table Grid - Fatter Rows */
        .table { border: 1px solid #475569; display: flex; flex-direction: column; width: 100%; border-bottom: none; }
        .headerRowTable { display: flex; background: #f8fafc; border-bottom: 1px solid #475569; align-items: stretch; min-height: 30px; }
        /* Increased row min-height from 22px to 34px */
        .row { display: flex; border-bottom: 1px solid #475569; min-height: 34px; page-break-inside: avoid; align-items: stretch; }

        .hCell, .cell, .timeGroup {
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
            border-right: 1px solid #475569;
            /* Increased padding from 2px to 5px */
            padding: 5px;
            text-align: center;
        }
        .cell:last-child, .hCell:last-child { border-right: none; }

        .hCell { font-weight: 700; font-size: 8.5px; flex-direction: column; background: #f0f4f8; }
        .area { justify-content: flex-start; text-align: left; padding-left: 8px; font-weight: 600; }

        /* Time Interval Alignment */
        .timeGroup { padding: 0 !important; display: flex; flex-direction: row; align-self: stretch; border-right: 1px solid #475569; }
        .timeCell {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            border-right: 1px solid #cbd5e1;
            height: 100%;
            font-weight: bold;
        }
        .timeCell:last-child { border-right: none; }

        .timeHeaderContainer { width: 100%; display: flex; border-top: 1px solid #475569; margin-top: 2px; flex-grow: 1; }
        .timeHLabel { flex: 1; border-right: 1px solid #475569; font-size: 8px; padding: 2px 0; display: flex; align-items: center; justify-content: center; }
        .timeHLabel:last-child { border-right: none; }

        .footer { margin-top: 8px; font-size: 8px; color: #64748b; text-align: center; font-style: italic; }
    </style>
</head><body>
    <div class="card">
        <div class="headerSection">
            <div class="branding">
                ${logo ? `<img class="logo" src="${logo}"/>` : ''}
                <div class="companyName">${escapeHtml(metadata.companyName || 'Bravo')}</div>
            </div>
            <div class="formTitle">Cleaning and Sanitizing Log - Bakery</div>
        </div>
        
        <div class="metaBar">
            <div style="display:flex; gap:15px;">
                <div><strong>Date:</strong> ${escapeHtml(metadata.date || '—')}</div>
                <div><strong>Location:</strong> ${escapeHtml(metadata.location || '—')}</div>
                <div><strong>Shift:</strong> ${escapeHtml(metadata.shift || '—')}</div>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <span class="tickBadge">✓ TICK AFTER CLEANING</span>
                ${metadata.verifiedBySign ? `<div style="display:flex; align-items:center; gap:4px;"><strong>Verified:</strong> ${sigHtml(metadata.verifiedBySign, 24)}</div>` : ''}
            </div>
        </div>

        <div class="table">
            <div class="headerRowTable">
                <div class="hCell" style="width:${colPercent(COL.EQUIP)}">EQUIPMENT</div>
                <div class="hCell" style="width:${colPercent(COL.PPM)}">PPM</div>
                <div class="hCell" style="width:${colPercent(timeColsWidth)}; padding: 0;">
                    <div style="padding: 4px 0;">TIME INTERVAL</div>
                    <div class="timeHeaderContainer">
                        ${timeSlots.map(t => `<div class="timeHLabel">${escapeHtml(String(t))}</div>`).join('')}
                    </div>
                </div>
                <div class="hCell" style="width:${colPercent(COL.STAFF)}">STAFF NAME</div>
                <div class="hCell" style="width:${colPercent(COL.SIGN)}">STAFF SIGN</div>
                <div class="hCell" style="width:${colPercent(COL.SUP)}">SUP NAME</div>
                <div class="hCell" style="width:${colPercent(COL.SUP)}">SUP SIGN</div>
            </div>
            ${rowsHtml}
        </div>

        <div class="footer">Instruction: All food handlers are required to clean and sanitize the equipment after use.</div>
    </div>
</body></html>`;
};
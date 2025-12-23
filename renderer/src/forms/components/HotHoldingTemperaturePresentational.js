import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

export default function HotHoldingTemperaturePresentational({ payload }) {
  const rows = payload?.formData || [];
  const widths = payload?.layoutHints?.WIDTHS || {};
  const logoUri = payload?.assets?.logoDataUri || null;
  const date = payload?.date || '';


  const sumWidths = (...keys) => keys.reduce((s, k) => s + (widths[k] || 0), 0);
  // Use fixed TABLE_WIDTH and COL_FLEX from the editable form so presentational matches editor
  // Increase TABLE_WIDTH so drawn signatures fit into SIGN columns; horizontal scroll will allow viewing the full table
  const TABLE_WIDTH = 1400; // widened table to accommodate signature thumbnails
  // Reduce FOOD_ITEM flex and increase STAFF_NAME so food column doesn't push others
  const COL_FLEX = { INDEX: 0.6, FOOD_ITEM: 0.9, TIME_INTO_HOLD: 1.5, TIME_TEMP_SIGN: 1.0, STAFF_NAME: 3.0 };

  // Compute deterministic WIDTHS from COL_FLEX and TABLE_WIDTH (matching editor)
  const totalFlex = COL_FLEX.INDEX + COL_FLEX.FOOD_ITEM + COL_FLEX.TIME_INTO_HOLD + (COL_FLEX.TIME_TEMP_SIGN * 9) + COL_FLEX.STAFF_NAME;
  const baseUnit = TABLE_WIDTH / totalFlex;
  const fixedWidths = {
    INDEX: Math.round(baseUnit * COL_FLEX.INDEX),
    FOOD_ITEM: Math.round(baseUnit * COL_FLEX.FOOD_ITEM),
    TIME_INTO_HOLD: Math.round(baseUnit * COL_FLEX.TIME_INTO_HOLD),
    // per-sub columns
    TIME1: Math.round(baseUnit * COL_FLEX.TIME_TEMP_SIGN),
    TEMP1: Math.round(baseUnit * COL_FLEX.TIME_TEMP_SIGN),
    SIGN1: Math.round(baseUnit * COL_FLEX.TIME_TEMP_SIGN),
    TIME2: Math.round(baseUnit * COL_FLEX.TIME_TEMP_SIGN),
    TEMP2: Math.round(baseUnit * COL_FLEX.TIME_TEMP_SIGN),
    SIGN2: Math.round(baseUnit * COL_FLEX.TIME_TEMP_SIGN),
    TIME3: Math.round(baseUnit * COL_FLEX.TIME_TEMP_SIGN),
    TEMP3: Math.round(baseUnit * COL_FLEX.TIME_TEMP_SIGN),
    SIGN3: Math.round(baseUnit * COL_FLEX.TIME_TEMP_SIGN),
    STAFF_NAME: Math.round(baseUnit * COL_FLEX.STAFF_NAME),
  };

  // Fix rounding delta by adding leftover to STAFF_NAME
  const allocatedFixed = Object.values(fixedWidths).reduce((s, v) => s + v, 0);
  const deltaFixed = TABLE_WIDTH - allocatedFixed;
  if (deltaFixed > 0) fixedWidths.STAFF_NAME += deltaFixed;

  // Prefer fixedWidths (deterministic); if payload provides explicit WIDTHS, fallback to them
  for (const k of Object.keys(fixedWidths)) {
    widths[k] = widths[k] || fixedWidths[k];
  }

  // Adjust TIME/TEMP/SIGN to reasonable sizes and share width with STAFF_NAME so printed A4 landscape fits
  const timeKeys = ['TIME1','TEMP1','SIGN1','TIME2','TEMP2','SIGN2','TIME3','TEMP3','SIGN3'];
  const minStaff = 140; // keep staff name readable when printed

  // sensible defaults
  const idxWidth = Math.max(40, Math.round(widths.INDEX || colWidths[0] || 40));
  const foodWidth = Math.max(140, Math.round(widths.FOOD_ITEM || colWidths[1] || 220));
  const timeIntoWidth = Math.max(120, Math.round(widths.TIME_INTO_HOLD || colWidths[2] || 150));

  // Weighted split for subcolumns (TIME, TEMP, SIGN) per record: 50% / 35% / 15%
  const timeSub = Math.max(30, Math.round(timeIntoWidth * 0.5));
  const tempSub = Math.max(24, Math.round(timeIntoWidth * 0.35));
  const signSub = Math.max(12, timeIntoWidth - timeSub - tempSub);

  // Apply to each record
  widths.TIME1 = timeSub; widths.TEMP1 = tempSub; widths.SIGN1 = signSub;
  widths.TIME2 = timeSub; widths.TEMP2 = tempSub; widths.SIGN2 = signSub;
  widths.TIME3 = timeSub; widths.TEMP3 = tempSub; widths.SIGN3 = signSub;

  // Now compute remaining width and assign to STAFF_NAME
  const fixedSum = idxWidth + foodWidth + timeIntoWidth + (timeSub + tempSub + signSub) * 3;
  let staffCalc = TABLE_WIDTH - fixedSum;
  if (staffCalc < minStaff) {
    // reduce FOOD_ITEM if necessary to keep staff at min
    const deficit = minStaff - staffCalc;
    const reduceFromFood = Math.min(deficit, Math.max(0, foodWidth - 140));
    staffCalc += reduceFromFood;
    // adjust foodWidth locally so rendering aligns
    // (we do not mutate widths.FOOD_ITEM because colWidths is computed from widths later)
  }
  widths.STAFF_NAME = Math.max(minStaff, staffCalc);

  // Final check: if total allocated differs from TABLE_WIDTH, adjust STAFF_NAME to absorb tiny rounding diffs
  const allocatedAfter = Object.values(widths).reduce((s, v) => s + (v || 0), 0);
  const finalDelta = Math.round(TABLE_WIDTH - allocatedAfter);
  if (finalDelta > 0) widths.STAFF_NAME += finalDelta;

  // Build ordered column widths to use consistently in rendering
  const orderedCols = ['INDEX','FOOD_ITEM','TIME_INTO_HOLD','TIME1','TEMP1','SIGN1','TIME2','TEMP2','SIGN2','TIME3','TEMP3','SIGN3','STAFF_NAME'];
  const colWidths = orderedCols.map(k => Math.max(0, Math.round(widths[k] || 0)));
  // If everything zero, derive simple fallbacks to avoid zero-width columns
  const allocatedTotal = colWidths.reduce((s, v) => s + v, 0);
  if (allocatedTotal === 0) {
    // fallback: distribute TABLE_WIDTH proportionally: make index small, food item bigger, staff bigger, time cols small
    const idx = 40; const food = 160; const timeInto = 120; const timeEach = Math.floor((TABLE_WIDTH - idx - food - timeInto - 300) / 9) || 40; const staff = TABLE_WIDTH - (idx + food + timeInto + timeEach * 9);
    const fallback = [idx, food, timeInto, timeEach, timeEach, timeEach, timeEach, timeEach, timeEach, timeEach, timeEach, timeEach, staff];
    for (let i = 0; i < colWidths.length; i++) colWidths[i] = fallback[i];
  } else {
    // ensure sum equals TABLE_WIDTH by adjusting last (staff) column
    const sumNow = colWidths.reduce((s, v) => s + v, 0);
    const delta2 = TABLE_WIDTH - sumNow;
    if (delta2 !== 0) {
      colWidths[colWidths.length - 1] = Math.max(0, colWidths[colWidths.length - 1] + delta2);
    }
  }

  // Enforce sensible minimums for TIME/TEMP/SIGN so they can contain at least ~4 chars
  const MIN_TIME = 64; // space for HH:MM and a bit more
  const MIN_TEMP = 48; // space for temperature like 63°C and sign
  const MIN_SIGN = 110; // make signature column wide enough to display drawn signatures
  for (const k of ['TIME1','TIME2','TIME3']) {
    if (widths[k] < MIN_TIME) widths[k] = MIN_TIME;
  }
  for (const k of ['TEMP1','TEMP2','TEMP3']) {
    if (widths[k] < MIN_TEMP) widths[k] = MIN_TEMP;
  }
  for (const k of ['SIGN1','SIGN2','SIGN3']) {
    if (widths[k] < MIN_SIGN) widths[k] = MIN_SIGN;
  }

  // Rebuild colWidths after enforcing mins
  const colWidths2 = orderedCols.map(k => Math.max(0, Math.round(widths[k] || 0)));
  let total2 = colWidths2.reduce((s, v) => s + v, 0);

  // Cap staff name so it doesn't take most of the table; rebalance any excess to FOOD_ITEM
  const MAX_STAFF = 220; // allow staff column to be wider for long names
  const MIN_STAFF = 120;
  let staffIdx = orderedCols.indexOf('STAFF_NAME');
  if (colWidths2[staffIdx] > MAX_STAFF) {
    const excess = colWidths2[staffIdx] - MAX_STAFF;
    colWidths2[staffIdx] = MAX_STAFF;
    // give excess to FOOD_ITEM
    const foodIdx = orderedCols.indexOf('FOOD_ITEM');
    colWidths2[foodIdx] = Math.min(TABLE_WIDTH - 200, colWidths2[foodIdx] + excess);
    total2 = colWidths2.reduce((s, v) => s + v, 0);
  }

  // If we exceed TABLE_WIDTH, reduce STAFF_NAME down to MIN_STAFF, then reduce FOOD_ITEM if needed
  if (total2 > TABLE_WIDTH) {
    let over = total2 - TABLE_WIDTH;
    const reduceFromStaff = Math.min(over, Math.max(0, colWidths2[staffIdx] - MIN_STAFF));
    colWidths2[staffIdx] -= reduceFromStaff;
    over -= reduceFromStaff;
    if (over > 0) {
      const foodIdx = orderedCols.indexOf('FOOD_ITEM');
      const reducibleFood = Math.max(0, colWidths2[foodIdx] - 120);
      const reduceFromFood = Math.min(over, reducibleFood);
      colWidths2[foodIdx] -= reduceFromFood;
      over -= reduceFromFood;
    }
    // if still over, shrink time columns proportionally (but not below mins)
    if (over > 0) {
      const timeIdxs = [3,4,5,6,7,8,9,10,11];
      for (const idx of timeIdxs) {
        if (over <= 0) break;
        const canReduce = Math.max(0, colWidths2[idx] - MIN_TIME);
        const take = Math.min(canReduce, Math.ceil(over / timeIdxs.length));
        colWidths2[idx] -= take;
        over -= take;
      }
    }
  }

  // Reassign colWidths to colWidths2 for rendering
  for (let i = 0; i < colWidths.length; i++) colWidths[i] = colWidths2[i];

  // No export-specific sizing: always render responsive percent widths

  // cellStyle: when exporting use pixel widths; otherwise convert px->percent so table fits modal
  const cellStyle = (w) => {
    const pad = { padding: 6, borderRightWidth: 1, borderColor: '#333' };
    try {
      // Interpret numeric px as percent of TABLE_WIDTH so table fits modal
      let pct = null;
      if (typeof w === 'number') pct = (w / TABLE_WIDTH) * 100;
      else pct = ((widths[w] || 0) / TABLE_WIDTH) * 100;
      pct = Math.max(0, Math.round(pct * 100) / 100);
      return Object.assign({ width: pct ? `${pct}%` : undefined }, pad);
    } catch (e) { return Object.assign({ width: w || undefined }, pad); }
  };
  // Helper: normalize signature-ish values into data: URIs (safe fallback)
  const normalizeSignature = (v) => {
    if (!v) return null;
    const s = String(v).trim();
    if (!s) return null;
    if (s.startsWith('data:')) return s;
    const compact = s.replace(/\s+/g, '');
    if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
    return null;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        {logoUri ? (
          <Image source={{ uri: logoUri }} style={styles.logo} resizeMode="contain" />
        ) : (
          <Image source={require('../../assets/logo.jpeg')} style={styles.logo} resizeMode="contain" />
        )}
        <View style={styles.headerText}>
          <Text style={styles.company}>BRAVO BRANDS LIMITED</Text>
          <Text style={styles.sub}>Food Safety Management System</Text>
        </View>
        <View style={styles.issueBox}><Text style={styles.issueLabel}>Issue Date</Text><Text style={styles.issueValue}>{date}</Text></View>
      </View>

      <View style={styles.metaBottomRow}>
        <View style={styles.metaItem}><Text style={styles.metaLabel}>SUBJECT:</Text><Text style={styles.metaValue}>{payload?.title || payload?.metadata?.subject || ''}</Text></View>
        <View style={styles.metaItem}><Text style={styles.metaLabel}>COMPILED BY:</Text><Text style={styles.metaValue}>{payload?.metadata?.compiledBy || ''}</Text></View>
        <View style={styles.metaItem}><Text style={styles.metaLabel}>APPROVED BY:</Text><Text style={styles.metaValue}>{payload?.metadata?.approvedBy || ''}</Text></View>
      </View>

      <View style={styles.tableTitleWrap}><Text style={styles.tableTitle}>HOT HOLDING TEMPERATURE LOG</Text></View>

      {/* Table: use centered container when exporting, otherwise fit to available width */}
    <View style={{ width: '100%' }}>
      <View style={[styles.table, { width: '100%' } ]}>
        {/* Group header: spans for 1st/2nd/3rd record */}
        <View style={[styles.row, styles.groupHeader]}>
          <View style={cellStyle(colWidths[0])} />
          <View style={cellStyle(colWidths[1])}><Text style={styles.groupText}>HOT-HOLDING (above 63°C)</Text></View>
          <View style={cellStyle(colWidths[2])}><Text style={styles.groupText}>TIME INTO HOT HOLD</Text></View>

          <View style={cellStyle(colWidths[3] + colWidths[4] + colWidths[5])}><Text style={styles.groupText}>1ST RECORD</Text></View>
          <View style={cellStyle(colWidths[6] + colWidths[7] + colWidths[8])}><Text style={styles.groupText}>2ND RECORD</Text></View>
          <View style={cellStyle(colWidths[9] + colWidths[10] + colWidths[11])}><Text style={styles.groupText}>3RD RECORD</Text></View>

          <View style={[cellStyle(colWidths[12]), { borderRightWidth: 0 }]}><Text style={styles.groupText}>STAFF'S NAME</Text></View>
        </View>

        {/* Detail header: TIME / TEMP / SIGN per record */}
        <View style={[styles.row, styles.header] }>
          <View style={cellStyle(colWidths[0])}><Text style={styles.hText}>#</Text></View>
          <View style={cellStyle(colWidths[1])}><Text style={styles.hText}>FOOD ITEM</Text></View>
          <View style={cellStyle(colWidths[2])}><Text style={styles.hText}></Text></View>

          {/* 3 records: TIME/TEMP/SIGN each */}
          <View style={cellStyle(widths.TIME1)}><Text style={styles.hText}>TIME</Text></View>
          <View style={cellStyle(widths.TEMP1)}><Text style={styles.hText}>TEMP</Text></View>
          <View style={cellStyle(widths.SIGN1)}><Text style={styles.hText}>SIGN</Text></View>

          <View style={cellStyle(widths.TIME2)}><Text style={styles.hText}>TIME</Text></View>
          <View style={cellStyle(widths.TEMP2)}><Text style={styles.hText}>TEMP</Text></View>
          <View style={cellStyle(widths.SIGN2)}><Text style={styles.hText}>SIGN</Text></View>

          <View style={cellStyle(widths.TIME3)}><Text style={styles.hText}>TIME</Text></View>
          <View style={cellStyle(widths.TEMP3)}><Text style={styles.hText}>TEMP</Text></View>
          <View style={cellStyle(colWidths[11])}><Text style={styles.hText}>SIGN</Text></View>

          <View style={[cellStyle(colWidths[12]), { borderRightWidth: 0 }]}><Text style={styles.hText}>STAFF NAME</Text></View>
        </View>

        {rows.map((r, i) => (
          <View style={styles.row} key={i}>
            <View style={cellStyle(colWidths[0])}><Text style={styles.cellText}>{i + 1}</Text></View>
            <View style={cellStyle(colWidths[1])}><Text style={styles.cellText}>{r.foodItem || ''}</Text></View>
            <View style={cellStyle(colWidths[2])}><Text style={styles.cellText}>{r.timeIntoHold || ''}</Text></View>

            <View style={cellStyle(widths.TIME1)}><Text style={styles.cellText}>{r.time1 || ''}</Text></View>
            <View style={cellStyle(widths.TEMP1)}><Text style={styles.cellText}>{r.temp1 || ''}</Text></View>
            <View style={cellStyle(widths.SIGN1)}>
              {(() => {
                const uri = normalizeSignature(r.sign1);
                return uri ? (
                  <SignatureThumb uri={uri} width={Math.max(120, (colWidths[5] || widths.SIGN1 || 160) - 8)} height={56} layers={6} spread={0.9} />
                ) : (
                  <Text style={styles.cellText}>{r.sign1 || ''}</Text>
                );
              })()}
            </View>

            <View style={cellStyle(widths.TIME2)}><Text style={styles.cellText}>{r.time2 || ''}</Text></View>
            <View style={cellStyle(widths.TEMP2)}><Text style={styles.cellText}>{r.temp2 || ''}</Text></View>
            <View style={cellStyle(widths.SIGN2)}>
              {(() => {
                const uri = normalizeSignature(r.sign2);
                return uri ? (
                  <SignatureThumb uri={uri} width={Math.max(120, (colWidths[8] || widths.SIGN2 || 160) - 8)} height={56} layers={6} spread={0.9} />
                ) : (
                  <Text style={styles.cellText}>{r.sign2 || ''}</Text>
                );
              })()}
            </View>

            <View style={cellStyle(widths.TIME3)}><Text style={styles.cellText}>{r.time3 || ''}</Text></View>
            <View style={cellStyle(widths.TEMP3)}><Text style={styles.cellText}>{r.temp3 || ''}</Text></View>
            <View style={cellStyle(colWidths[11])}>
              {(() => {
                const uri = normalizeSignature(r.sign3);
                return uri ? (
                  <SignatureThumb uri={uri} width={Math.max(120, (colWidths[11] || widths.SIGN3 || 160) - 8)} height={56} layers={6} spread={0.9} />
                ) : (
                  <Text style={styles.cellText}>{r.sign3 || ''}</Text>
                );
              })()}
            </View>

            <View style={[cellStyle(colWidths[12]), { borderRightWidth: 0 }]}><Text style={styles.cellText}>{r.staffName || ''}</Text></View>
          </View>
        ))}
        </View>
      </View>

      {/* Footer area to match editable form */}
      <View style={styles.footerWrap}>
        <View style={styles.footerRow}>
          <Text style={styles.footerLabel}>CHEF Signature:</Text>
          {(() => {
            const v = payload?.metadata?.chefSignature || payload?.metadata?.chefSign;
            const uri = normalizeSignature(v);
            return uri ? <SignatureThumb uri={uri} width={260} height={80} layers={10} spread={1.2} /> : <Text style={styles.footerText}>{v || ''}</Text>;
          })()}
        </View>

        <View style={styles.footerRowSmall}>
          <Text style={styles.footerLabel}>Corrective Action:</Text>
          <View style={styles.correctiveBox}><Text style={styles.correctiveText}>{payload?.metadata?.correctiveAction || ''}</Text></View>
        </View>

        <View style={[styles.footerRowSmall, { flexDirection: 'row', alignItems: 'center' }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.footerLabel}>Verified by (HSEQ):</Text>
            {(() => {
              const v = payload?.metadata?.hseqManagerSignature || payload?.metadata?.hseqManagerSign || payload?.metadata?.hseqSign;
              const uri = normalizeSignature(v);
              return uri ? <SignatureThumb uri={uri} width={220} height={64} layers={8} spread={1.0} /> : <Text style={styles.footerText}>{v || ''}</Text>;
            })()}
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.footerLabel}>Complex Manager Signature:</Text>
            {(() => {
              const v = payload?.metadata?.complexManagerSignature || payload?.metadata?.complexManagerSign || payload?.metadata?.complexManager;
              const uri = normalizeSignature(v);
              return uri ? <SignatureThumb uri={uri} width={220} height={64} layers={8} spread={1.0} /> : <Text style={styles.footerText}>{v || ''}</Text>;
            })()}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logo: { width: 56, height: 56, marginRight: 8 },
  headerText: { flex: 1 },
  company: { fontSize: 12, fontWeight: '800' },
  sub: { fontSize: 10, color: '#555' },
  issueBox: { padding: 6, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  issueLabel: { fontSize: 9, fontWeight: '700' },
  issueValue: { fontSize: 10 },
  tableTitleWrap: { marginBottom: 8 },
  tableTitle: { fontSize: 14, fontWeight: '800', textAlign: 'center' },
  table: { borderWidth: 1, borderColor: '#333' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ddd', minHeight: 34 },
  header: { backgroundColor: '#f3f5f7' },
  hText: { fontSize: 9, fontWeight: '800', textAlign: 'center' },
  cellText: { fontSize: 10, textAlign: 'center' },
  metaBottomRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#333', padding: 6, marginBottom: 6 },
  metaItem: { flex: 1, paddingHorizontal: 6 },
  metaLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  metaValue: { fontSize: 10, marginTop: 2 },
  footerWrap: { marginTop: 12, paddingHorizontal: 6 },
  footerRow: { marginBottom: 12 },
  footerRowSmall: { marginBottom: 12 },
  footerLabel: { fontWeight: '700', marginBottom: 6 },
  correctiveBox: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, backgroundColor: '#fafafa' },
  correctiveText: { color: '#666' },
  signatureLine: { borderBottomWidth: 1, borderColor: '#333', height: 32, marginLeft: 8, flex: 1 },
});

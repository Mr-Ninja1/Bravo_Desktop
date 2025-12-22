import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

const A4_WIDTH = 794;
export default function CoolingTemperatureSavedPresentational({ payload, exportingWide = false }) {
  if (!payload) return null;
  const p = payload.payload || payload;
  const { metadata = {}, formData = [], layoutHints = {}, _tableWidth } = p;

  const rows = (formData && formData.length) ? formData : Array.from({ length: 12 }, (_, i) => ({ index: i + 1 }));

  // prefer explicit widths saved in the payload; otherwise fallback to sensible defaults
  const raw = (layoutHints && layoutHints.WIDTHS) || {};
  const WIDTHS = {
    INDEX: raw.INDEX || 48,
    FOOD_ITEM: raw.FOOD_ITEM || 300,
    TIME_INTO_UNIT: raw.TIME_INTO_UNIT || 140,
    TIME: raw.TIME || 72,
    TEMP: raw.TEMP || 64,
    SIGN: raw.SIGN || 140,
    STAFF_NAME: raw.STAFF_NAME || 200,
  };

  const tableWidth = Number(_tableWidth) || 1000;
  let scale = 1;
  let adjustedTableWidth = tableWidth;
  if (exportingWide && tableWidth > A4_WIDTH) {
    scale = A4_WIDTH / tableWidth;
    adjustedTableWidth = A4_WIDTH;
  }
  const adjustedWidths = exportingWide ? {
    INDEX: Math.round(WIDTHS.INDEX * scale),
    FOOD_ITEM: Math.round(WIDTHS.FOOD_ITEM * scale),
    TIME_INTO_UNIT: Math.round(WIDTHS.TIME_INTO_UNIT * scale),
    TIME: Math.round(WIDTHS.TIME * scale),
    TEMP: Math.round(WIDTHS.TEMP * scale),
    SIGN: Math.round(WIDTHS.SIGN * scale),
    STAFF_NAME: Math.round(WIDTHS.STAFF_NAME * scale),
  } : WIDTHS;
  // responsive helper for non-export branch
  const TOTAL = Object.values(WIDTHS).reduce((s, v) => s + (Number(v) || 0), 0) || 1;
  const colStyle = (w) => {
    const width = Number(w) || 0;
    const flex = width / TOTAL;
    const min = Math.max(28, Math.round(width * 0.28));
    return { flex, minWidth: min, flexShrink: 1 };
  };
  const exportA4Style = exportingWide ? { width: A4_WIDTH, maxWidth: A4_WIDTH, alignSelf: 'center' } : {};

  const resolveSignatureUri = (val) => {
    if (!val) return null;
    // Accept object shapes commonly produced by some image pickers: { uri: '...' }
    if (typeof val === 'object') {
      if (val.uri && typeof val.uri === 'string') {
        const u = val.uri.trim();
        if (u) return u;
      }
      // sometimes stored as { data: 'base64...' }
      if (val.data && typeof val.data === 'string') {
        const compact = val.data.replace(/\s+/g, '');
        if (compact.length) return `data:image/png;base64,${compact}`;
      }
      return null;
    }
    if (typeof val !== 'string') return null;
    const s = val.trim();
    if (!s) return null;
    // If it's already a data: URI or an http/file/blob URL, return directly so Image can render it
    if (s.startsWith('data:') || s.startsWith('http:') || s.startsWith('https:') || s.startsWith('file:') || s.startsWith('blob:')) return s;
    // heuristic: long base64-like strings -> image/png
    const base64ish = /^[A-Za-z0-9+/=\r\n]+$/;
    const compact = s.replace(/\s+/g, '');
    if (compact.length > 100 && base64ish.test(compact)) return `data:image/png;base64,${compact}`;
    return null;
  };

  const renderSignatureCell = (val, cellWidth) => {
    const uri = resolveSignatureUri(val);
    if (!uri) return <Text style={styles.cellText}>{''}</Text>;
    // Prefer a reasonably large thumb for saved forms. Use the provided cellWidth
    // but ensure a comfortable minimum so signatures are legible on narrow tables.
    const computedCell = Number(cellWidth) || 140;
    const w = Math.max(84, computedCell - 12);
    // Maintain an aspect for a signature rectangle that's wider than tall
    const h = Math.max(56, Math.round(w * 0.55));
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <SignatureThumb uri={uri} width={w} height={h} layers={12} spread={1.4} />
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={exportingWide ? { padding: 0, margin: 0, backgroundColor: '#fff' } : styles.container}>
      <View style={[styles.card, exportA4Style]}>
        <View style={styles.topRow}>
          <View style={styles.logoArea}>
            <Image source={p.assets?.logoDataUri ? { uri: p.assets.logoDataUri } : require('../../assets/logo.jpeg')} style={styles.logo} />
            <Text style={styles.companyText}>{metadata.companyName || 'BRAVO BRANDS LIMITED'}</Text>
          </View>
          <View style={styles.issueBox}>
            <Text style={styles.issueLabel}>Issue Date:</Text>
            <Text style={styles.issueValue}>{metadata.issueDate || metadata.date || ''}</Text>
          </View>
        </View>

        <View style={styles.subjectBandRow}>
          <View style={styles.subjectLeft}><Text style={styles.subjectSmall}>SUBJECT: TEMPERATURE RECORD FOR COOLING</Text></View>
          <View style={styles.compiledBoxThin}><Text style={styles.compiledLabelSmall}>COMPILED BY: {metadata.compiledBy || ''}</Text></View>
          <View style={styles.compiledBoxThin}><Text style={styles.compiledLabelSmall}>APPROVED BY: {metadata.approvedBy || ''}</Text></View>
        </View>

        {exportingWide ? (
          <View style={[styles.table, exportA4Style]}> 
            <Text style={styles.tableTitle}>COOLING TEMPERATURE LOG</Text>

            <View style={[styles.tableHeaderRow, styles.groupHeader]}>
              <View style={[styles.hCell, styles.borderRight, { width: adjustedWidths.INDEX }]}><Text style={styles.hText}>#</Text></View>

              <View style={[styles.hCell, styles.borderRight, { width: adjustedWidths.FOOD_ITEM + adjustedWidths.TIME_INTO_UNIT }]}>
                <View>
                  <Text style={[styles.hText, styles.instructionText]}>COOLING (10 °C within 2hours)</Text>
                </View>
                <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#333' }}>
                  <View style={[styles.hCell, styles.borderRight, { width: adjustedWidths.FOOD_ITEM }]}><Text style={styles.hText}>FOOD ITEM</Text></View>
                  <View style={[styles.hCell, styles.borderRight, { width: adjustedWidths.TIME_INTO_UNIT }]}>
                    <Text style={[styles.hText, { fontSize: 8 }]}>Time into{"\n"}Fridge/Display{"\n"}Chiller/Deep{"\n"}Freezer/Chiller{"\n"}Room/Freezer Room</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.hCell, styles.borderRight, { width: adjustedWidths.TIME + adjustedWidths.TEMP + adjustedWidths.SIGN }]}><Text style={styles.hText}>1ST RECORD</Text></View>
              <View style={[styles.hCell, styles.borderRight, { width: adjustedWidths.TIME + adjustedWidths.TEMP + adjustedWidths.SIGN }]}><Text style={styles.hText}>2ND RECORD</Text></View>
              <View style={[styles.hCell, styles.borderRight, { width: adjustedWidths.TIME + adjustedWidths.TEMP + adjustedWidths.SIGN }]}><Text style={styles.hText}>3RD RECORD</Text></View>

              <View style={[styles.hCell, { width: adjustedWidths.STAFF_NAME }]}><Text style={styles.hText}>STAFF'S NAME</Text></View>
            </View>

            <View style={[styles.tableHeaderRow, styles.detailHeader]}>
              <View style={[styles.hCell, styles.borderRight, { width: adjustedWidths.INDEX }]} /><View style={[styles.hCell, styles.borderRight, { width: adjustedWidths.FOOD_ITEM + adjustedWidths.TIME_INTO_UNIT }]} />
              {[...Array(3)].map((_, i) => (
                <React.Fragment key={i}>
                  <View style={[styles.hCell, styles.borderRight, { width: adjustedWidths.TIME }]}><Text style={styles.hText}>TIME</Text></View>
                  <View style={[styles.hCell, styles.borderRight, { width: adjustedWidths.TEMP }]}><Text style={styles.hText}>TEMP</Text></View>
                  <View style={[styles.hCell, styles.borderRight, { width: adjustedWidths.SIGN }]}><Text style={styles.hText}>SIGN</Text></View>
                </React.Fragment>
              ))}
              <View style={[styles.hCell, { width: adjustedWidths.STAFF_NAME }]} />
            </View>

            {rows.map((r, ri) => (
              <View key={ri} style={styles.row}>
                <View style={[styles.cell, styles.borderRight, { width: adjustedWidths.INDEX }]}><Text style={styles.cellText}>{r.index || ri + 1}</Text></View>

                <View style={[styles.cell, styles.borderRight, { width: adjustedWidths.FOOD_ITEM }]}><Text style={styles.cellText}>{r.foodItem || ''}</Text></View>
                <View style={[styles.cell, styles.borderRight, { width: adjustedWidths.TIME_INTO_UNIT }]}><Text style={styles.cellText}>{r.timeIntoUnit || r.timeIntoUnit || ''}</Text></View>

                <View style={[styles.cell, styles.borderRight, { width: adjustedWidths.TIME }]}><Text style={styles.cellText}>{r.time1 || ''}</Text></View>
                <View style={[styles.cell, styles.borderRight, { width: adjustedWidths.TEMP }]}><Text style={styles.cellText}>{r.temp1 ? `${r.temp1} °C` : ''}</Text></View>
                <View style={[styles.cell, styles.borderRight, { width: adjustedWidths.SIGN }]}>{renderSignatureCell(r.sign1, adjustedWidths.SIGN)}</View>

                <View style={[styles.cell, styles.borderRight, { width: adjustedWidths.TIME }]}><Text style={styles.cellText}>{r.time2 || ''}</Text></View>
                <View style={[styles.cell, styles.borderRight, { width: adjustedWidths.TEMP }]}><Text style={styles.cellText}>{r.temp2 ? `${r.temp2} °C` : ''}</Text></View>
                <View style={[styles.cell, styles.borderRight, { width: adjustedWidths.SIGN }]}>{renderSignatureCell(r.sign2, adjustedWidths.SIGN)}</View>

                <View style={[styles.cell, styles.borderRight, { width: adjustedWidths.TIME }]}><Text style={styles.cellText}>{r.time3 || ''}</Text></View>
                <View style={[styles.cell, styles.borderRight, { width: adjustedWidths.TEMP }]}><Text style={styles.cellText}>{r.temp3 ? `${r.temp3} °C` : ''}</Text></View>
                <View style={[styles.cell, styles.borderRight, { width: adjustedWidths.SIGN }]}>{renderSignatureCell(r.sign3, adjustedWidths.SIGN)}</View>

                <View style={[styles.cell, { width: adjustedWidths.STAFF_NAME }]}><Text style={styles.cellText}>{r.staffName || ''}</Text></View>
              </View>
            ))}

          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={[styles.table, { minWidth: tableWidth }]}> 
              <Text style={styles.tableTitle}>COOLING TEMPERATURE LOG</Text>

            <View style={[styles.tableHeaderRow, styles.groupHeader]}>
              <View style={[styles.hCell, styles.borderRight, colStyle(WIDTHS.INDEX)]}><Text style={styles.hText}>#</Text></View>

              <View style={[styles.hCell, styles.borderRight, colStyle(WIDTHS.FOOD_ITEM + WIDTHS.TIME_INTO_UNIT)]}>
                <View>
                  <Text style={[styles.hText, styles.instructionText]}>COOLING (10 °C within 2hours)</Text>
                </View>
                <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#333' }}>
                  <View style={[styles.hCell, styles.borderRight, colStyle(WIDTHS.FOOD_ITEM)]}><Text style={styles.hText}>FOOD ITEM</Text></View>
                  <View style={[styles.hCell, styles.borderRight, colStyle(WIDTHS.TIME_INTO_UNIT)]}>
                    <Text style={[styles.hText, { fontSize: 8 }]}>Time into{"\n"}Fridge/Display{"\n"}Chiller/Deep{"\n"}Freezer/Chiller{"\n"}Room/Freezer Room</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.hCell, styles.borderRight, colStyle(WIDTHS.TIME + WIDTHS.TEMP + WIDTHS.SIGN)]}><Text style={styles.hText}>1ST RECORD</Text></View>
              <View style={[styles.hCell, styles.borderRight, colStyle(WIDTHS.TIME + WIDTHS.TEMP + WIDTHS.SIGN)]}><Text style={styles.hText}>2ND RECORD</Text></View>
              <View style={[styles.hCell, styles.borderRight, colStyle(WIDTHS.TIME + WIDTHS.TEMP + WIDTHS.SIGN)]}><Text style={styles.hText}>3RD RECORD</Text></View>

              <View style={[styles.hCell, colStyle(WIDTHS.STAFF_NAME)]}><Text style={styles.hText}>STAFF'S NAME</Text></View>
            </View>

            <View style={[styles.tableHeaderRow, styles.detailHeader]}>
              <View style={[styles.hCell, styles.borderRight, colStyle(WIDTHS.INDEX)]} /><View style={[styles.hCell, styles.borderRight, colStyle(WIDTHS.FOOD_ITEM + WIDTHS.TIME_INTO_UNIT)]} />
              {[...Array(3)].map((_, i) => (
                <React.Fragment key={i}>
                  <View style={[styles.hCell, styles.borderRight, colStyle(WIDTHS.TIME)]}><Text style={styles.hText}>TIME</Text></View>
                  <View style={[styles.hCell, styles.borderRight, colStyle(WIDTHS.TEMP)]}><Text style={styles.hText}>TEMP</Text></View>
                  <View style={[styles.hCell, styles.borderRight, colStyle(WIDTHS.SIGN)]}><Text style={styles.hText}>SIGN</Text></View>
                </React.Fragment>
              ))}
              <View style={[styles.hCell, colStyle(WIDTHS.STAFF_NAME)]} />
            </View>

            {rows.map((r, ri) => (
              <View key={ri} style={styles.row}>
                <View style={[styles.cell, styles.borderRight, colStyle(WIDTHS.INDEX)]}><Text style={styles.cellText}>{r.index || ri + 1}</Text></View>

                <View style={[styles.cell, styles.borderRight, colStyle(WIDTHS.FOOD_ITEM)]}><Text style={styles.cellText}>{r.foodItem || ''}</Text></View>
                <View style={[styles.cell, styles.borderRight, colStyle(WIDTHS.TIME_INTO_UNIT)]}><Text style={styles.cellText}>{r.timeIntoUnit || r.timeIntoUnit || ''}</Text></View>

                <View style={[styles.cell, styles.borderRight, colStyle(WIDTHS.TIME)]}><Text style={styles.cellText}>{r.time1 || ''}</Text></View>
                <View style={[styles.cell, styles.borderRight, colStyle(WIDTHS.TEMP)]}><Text style={styles.cellText}>{r.temp1 ? `${r.temp1} °C` : ''}</Text></View>
                <View style={[styles.cell, styles.borderRight, colStyle(WIDTHS.SIGN)]}>{renderSignatureCell(r.sign1, WIDTHS.SIGN)}</View>

                <View style={[styles.cell, styles.borderRight, colStyle(WIDTHS.TIME)]}><Text style={styles.cellText}>{r.time2 || ''}</Text></View>
                <View style={[styles.cell, styles.borderRight, colStyle(WIDTHS.TEMP)]}><Text style={styles.cellText}>{r.temp2 ? `${r.temp2} °C` : ''}</Text></View>
                <View style={[styles.cell, styles.borderRight, colStyle(WIDTHS.SIGN)]}>{renderSignatureCell(r.sign2, WIDTHS.SIGN)}</View>

                <View style={[styles.cell, styles.borderRight, colStyle(WIDTHS.TIME)]}><Text style={styles.cellText}>{r.time3 || ''}</Text></View>
                <View style={[styles.cell, styles.borderRight, colStyle(WIDTHS.TEMP)]}><Text style={styles.cellText}>{r.temp3 ? `${r.temp3} °C` : ''}</Text></View>
                <View style={[styles.cell, styles.borderRight, colStyle(WIDTHS.SIGN)]}>{renderSignatureCell(r.sign3, WIDTHS.SIGN)}</View>

                <View style={[styles.cell, colStyle(WIDTHS.STAFF_NAME)]}><Text style={styles.cellText}>{r.staffName || ''}</Text></View>
              </View>
            ))}

            </View>
          </ScrollView>
        )}

        {/* Footer */}
        <View style={styles.footerSection}>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 12 }}>CHEF Signature:</Text>
            {(() => {
              const uri = resolveSignatureUri(metadata.chefSignature);
              return uri ? <SignatureThumb uri={uri} width={260} height={80} layers={14} spread={1.6} /> : <Text style={styles.signatureLine}>{'______________________________'}</Text>;
            })()}
          </View>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 12 }}>Corrective Action:</Text>
            <Text style={styles.textarea}>{metadata.correctiveAction || ''}</Text>
          </View>
          <View style={{ marginBottom: 12 }}>
            {/* Sign-off section: HSEQ and Complex Manager signatures (no duplicate "Verified by" heading) */}
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '700' }}>HSEQ Manager:</Text>
              {(() => {
                const uri = resolveSignatureUri(metadata.hseqManagerSignature || metadata.hseqSign);
                return uri ? <SignatureThumb uri={uri} width={260} height={64} layers={12} spread={1.4} /> : <Text style={{ marginTop: 8, fontSize: 12 }}>{'______________________________'}</Text>;
              })()}
            </View>
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '700' }}>Complex Manager:</Text>
              {(() => {
                const uri = resolveSignatureUri(metadata.complexManagerSignature);
                return uri ? <SignatureThumb uri={uri} width={260} height={64} layers={12} spread={1.4} /> : <Text style={{ marginTop: 8, fontSize: 12 }}>{'______________________________'}</Text>;
              })()}
            </View>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff' },
  card: { backgroundColor: '#fff' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  logoArea: { flexDirection: 'row', alignItems: 'center' },
  issueBox: { alignItems: 'flex-end', minWidth: 140, borderWidth: 1, borderColor: '#333', padding: 6 },
  issueLabel: { fontSize: 10 },
  issueValue: { fontSize: 12, fontWeight: '700' },
  logo: { width: 38, height: 28, resizeMode: 'contain' },
  companyText: { fontWeight: '900', fontSize: 14, marginLeft: 6 },
  subjectBandRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#333', paddingVertical: 4 },
  subjectLeft: { flex: 1 },
  subjectSmall: { fontWeight: '700', fontSize: 11 },
  compiledBoxThin: { paddingHorizontal: 8 },
  compiledLabelSmall: { fontSize: 10, fontWeight: '700' },
  table: { borderWidth: 1, borderColor: '#333', marginTop: 4, overflow: 'hidden' },
  tableTitle: { textAlign: 'center', fontWeight: '800', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#333' },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#333' },
  groupHeader: { backgroundColor: '#f3f5f7' },
  detailHeader: { backgroundColor: '#f3f5f7', borderBottomWidth: 1 },
  hCell: { paddingVertical: 6, paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center' },
  hText: { fontWeight: '800', fontSize: 10, textTransform: 'uppercase' },
  instructionText: { fontWeight: '700', fontSize: 10, textAlign: 'center' },
  borderRight: { borderRightWidth: 1, borderRightColor: '#333' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ddd', minHeight: 36, alignItems: 'center' },
  cell: { padding: 6, justifyContent: 'center' },
  cellText: { fontSize: 12 },
  footerSection: { marginTop: 12, marginBottom: 12, paddingHorizontal: 4 },
  signatureLine: { borderBottomWidth: 1, borderColor: '#333', paddingVertical: 8, fontSize: 14 },
  textarea: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 4, minHeight: 48 }
});

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

const A4_WIDTH = 794;
export default function ThawingTemperaturePresentational({ payload, exportingWide = false }) {
  if (!payload) return null;
  const p = payload.payload || payload;
  const { metadata = {}, formData = [], layoutHints = {}, _tableWidth } = p;

  const rowsToRender = (formData && formData.length) ? formData : Array.from({ length: 20 }, (_, i) => ({ index: i + 1 }));

  // Accept either the explicit TIME/TEMP/SIGN widths, or a legacy TIME_TEMP_SIGN value
  const rawWidths = (layoutHints && layoutHints.WIDTHS) || {};
  let WIDTHS = {
    INDEX: rawWidths.INDEX || 36,
    FOOD_ITEM: rawWidths.FOOD_ITEM || 220,
    TIME: rawWidths.TIME || rawWidths.TIME_TEMP_SIGN || 70,
    TEMP: rawWidths.TEMP || rawWidths.TIME_TEMP_SIGN || 70,
    SIGN: rawWidths.SIGN || rawWidths.TIME_TEMP_SIGN || 90,
    STAFF_NAME: rawWidths.STAFF_NAME || 140,
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
    TIME: Math.round(WIDTHS.TIME * scale),
    TEMP: Math.round(WIDTHS.TEMP * scale),
    SIGN: Math.round(WIDTHS.SIGN * scale),
    STAFF_NAME: Math.round(WIDTHS.STAFF_NAME * scale),
  } : WIDTHS;
  const exportA4Style = exportingWide ? { width: A4_WIDTH, maxWidth: A4_WIDTH, alignSelf: 'center' } : {};

  const baseTable = exportingWide ? adjustedTableWidth : (Number(_tableWidth) || 1000);
  const colStyle = (w) => {
    const width = Number(w) || 0;
    const flex = width / Math.max(1, baseTable);
    const minWidth = Math.max(36, Math.round(width * 0.18));
    return { flex, minWidth, flexShrink: 1 };
  };

  // helper: resolve legacy base64 or data: URIs and render helper
  const resolveSignatureUri = (val) => {
    if (!val) return null;
    if (typeof val !== 'string') return null;
    const s = val.trim();
    if (!s) return null;
    if (s.startsWith('data:')) return s;
    // heuristic: long, no-space base64 blob -> image/png
    const base64ish = /^[A-Za-z0-9+/=\r\n]+$/;
    const compact = s.replace(/\s+/g, '');
    if (compact.length > 100 && base64ish.test(compact)) return `data:image/png;base64,${compact}`;
    return null;
  };

  const renderSignatureCell = (val, cellWidth) => {
    const uri = resolveSignatureUri(val);
    if (!uri) return <Text style={styles.cellText}>{''}</Text>;
    // Make cell signatures much more visible: larger height and heavier layering
    const w = Math.max(60, (cellWidth || 120) - 4);
    const h = 56; // intentionally oversized for visibility
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <SignatureThumb uri={uri} width={w} height={h} layers={14} spread={1.6} />
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
          <View style={styles.subjectLeft}><Text style={styles.subjectSmall}>SUBJECT: THAWING TEMPERATURE LOG</Text></View>
          <View style={styles.compiledBoxThin}><Text style={styles.compiledLabelSmall}>COMPILED BY: {metadata.compiledBy || ''}</Text></View>
          <View style={styles.compiledBoxThin}><Text style={styles.compiledLabelSmall}>APPROVED BY: {metadata.approvedBy || ''}</Text></View>
        </View>

        <View style={styles.probeRowTight}>
          <Text style={styles.probeTextSmall}>PROBE THERMOMETER TEMPERATURE LOG FOR THAWED FOOD</Text>
          {/* Date removed: issue date already displayed in the header block */}
        </View>

        {/* Table: shrink to A4 width and disable horizontal scroll during export */}
        {exportingWide ? (
          <View style={[styles.table, exportA4Style]}> 
            <Text style={styles.tableTitle}>THAWING TEMPERATURE LOG</Text>

            <View style={[styles.tableGroupHeader]}>
              <View style={[styles.hCellFixed, { width: adjustedWidths.INDEX }]}><Text style={styles.hText}>#</Text></View>
              <View style={[styles.hCellFixed, { width: adjustedWidths.FOOD_ITEM }]}><Text style={styles.hText}>FOOD ITEM</Text></View>
              <View style={[styles.hGroupCell, { width: adjustedWidths.TIME + adjustedWidths.TEMP + adjustedWidths.SIGN }]}><Text style={styles.hText}>1ST RECORD</Text></View>
              <View style={[styles.hGroupCell, { width: adjustedWidths.TIME + adjustedWidths.TEMP + adjustedWidths.SIGN }]}><Text style={styles.hText}>2ND RECORD</Text></View>
              <View style={[styles.hGroupCell, { width: adjustedWidths.TIME + adjustedWidths.TEMP + adjustedWidths.SIGN }]}><Text style={styles.hText}>3RD RECORD</Text></View>
              <View style={[styles.hCellFixed, { width: adjustedWidths.STAFF_NAME }]}><Text style={styles.hText}>STAFF'S NAME</Text></View>
            </View>

            <View style={[styles.tableHeaderRow, styles.detailHeader]}>
              <View style={[styles.hCellFixed, { width: adjustedWidths.INDEX }]} />
              <View style={[styles.hCellFixed, { width: adjustedWidths.FOOD_ITEM }]} />
              {[...Array(3)].map((_, i) => (
                <React.Fragment key={i}>
                  <View style={[styles.hCellFixed, { width: adjustedWidths.TIME }]}><Text style={styles.hText}>TIME</Text></View>
                  <View style={[styles.hCellFixed, { width: adjustedWidths.TEMP }]}><Text style={styles.hText}>TEMP</Text></View>
                  <View style={[styles.hCellFixed, { width: adjustedWidths.SIGN }]}><Text style={styles.hText}>SIGN</Text></View>
                </React.Fragment>
              ))}
              <View style={[styles.hCellFixed, { width: adjustedWidths.STAFF_NAME }]} />
            </View>

            {rowsToRender.map((r, ri) => (
              <View key={ri} style={styles.row}>
                <View style={[styles.cellFixed, { width: adjustedWidths.INDEX }]}><Text style={styles.cellText}>{r.index || ri + 1}</Text></View>
                <View style={[styles.cellFixed, { width: adjustedWidths.FOOD_ITEM }]}>
                  <Text style={styles.cellText}>{r.foodItem || ''}</Text>
                </View>

                <View style={[styles.cellFixed, { width: adjustedWidths.TIME }]}><Text style={styles.cellText}>{r.time1 || ''}</Text></View>
                <View style={[styles.cellFixed, { width: adjustedWidths.TEMP }]}><Text style={styles.cellText}>{r.temp1 ? `${r.temp1} °C` : ''}</Text></View>
                <View style={[styles.cellFixed, { width: adjustedWidths.SIGN }]}>{renderSignatureCell(r.sign1, adjustedWidths.SIGN)}</View>

                <View style={[styles.cellFixed, { width: adjustedWidths.TIME }]}><Text style={styles.cellText}>{r.time2 || ''}</Text></View>
                <View style={[styles.cellFixed, { width: adjustedWidths.TEMP }]}><Text style={styles.cellText}>{r.temp2 ? `${r.temp2} °C` : ''}</Text></View>
                <View style={[styles.cellFixed, { width: adjustedWidths.SIGN }]}>{renderSignatureCell(r.sign2, adjustedWidths.SIGN)}</View>

                <View style={[styles.cellFixed, { width: adjustedWidths.TIME }]}><Text style={styles.cellText}>{r.time3 || ''}</Text></View>
                <View style={[styles.cellFixed, { width: adjustedWidths.TEMP }]}><Text style={styles.cellText}>{r.temp3 ? `${r.temp3} °C` : ''}</Text></View>
                <View style={[styles.cellFixed, { width: adjustedWidths.SIGN }]}>{renderSignatureCell(r.sign3, adjustedWidths.SIGN)}</View>

                <View style={[styles.cellFixed, { width: adjustedWidths.STAFF_NAME }]}><Text style={styles.cellText}>{r.staffName || ''}</Text></View>
              </View>
            ))}

          </View>
        ) : (
            <View style={[styles.table, { minWidth: _tableWidth || 1000 }]}> 
              <Text style={styles.tableTitle}>THAWING TEMPERATURE LOG</Text>

              <View style={[styles.tableGroupHeader]}>
                <View style={[styles.hCellFixed, colStyle(WIDTHS.INDEX)]}><Text style={styles.hText}>#</Text></View>
                <View style={[styles.hCellFixed, colStyle(WIDTHS.FOOD_ITEM)]}><Text style={styles.hText}>FOOD ITEM</Text></View>
                <View style={[styles.hGroupCell, colStyle(WIDTHS.TIME + WIDTHS.TEMP + WIDTHS.SIGN)]}><Text style={styles.hText}>1ST RECORD</Text></View>
                <View style={[styles.hGroupCell, colStyle(WIDTHS.TIME + WIDTHS.TEMP + WIDTHS.SIGN)]}><Text style={styles.hText}>2ND RECORD</Text></View>
                <View style={[styles.hGroupCell, colStyle(WIDTHS.TIME + WIDTHS.TEMP + WIDTHS.SIGN)]}><Text style={styles.hText}>3RD RECORD</Text></View>
                <View style={[styles.hCellFixed, colStyle(WIDTHS.STAFF_NAME)]}><Text style={styles.hText}>STAFF'S NAME</Text></View>
              </View>

              <View style={[styles.tableHeaderRow, styles.detailHeader]}>
                <View style={[styles.hCellFixed, colStyle(WIDTHS.INDEX)]} />
                <View style={[styles.hCellFixed, colStyle(WIDTHS.FOOD_ITEM)]} />
                {[...Array(3)].map((_, i) => (
                  <React.Fragment key={i}>
                    <View style={[styles.hCellFixed, colStyle(WIDTHS.TIME)]}><Text style={styles.hText}>TIME</Text></View>
                    <View style={[styles.hCellFixed, colStyle(WIDTHS.TEMP)]}><Text style={styles.hText}>TEMP</Text></View>
                    <View style={[styles.hCellFixed, colStyle(WIDTHS.SIGN)]}><Text style={styles.hText}>SIGN</Text></View>
                  </React.Fragment>
                ))}
                <View style={[styles.hCellFixed, colStyle(WIDTHS.STAFF_NAME)]} />
              </View>

              {rowsToRender.map((r, ri) => (
                <View key={ri} style={styles.row}>
                  <View style={[styles.cellFixed, colStyle(WIDTHS.INDEX)]}><Text style={styles.cellText}>{r.index || ri + 1}</Text></View>
                  <View style={[styles.cellFixed, colStyle(WIDTHS.FOOD_ITEM)]}>
                    <Text style={styles.cellText}>{r.foodItem || ''}</Text>
                  </View>

                  <View style={[styles.cellFixed, colStyle(WIDTHS.TIME)]}><Text style={styles.cellText}>{r.time1 || ''}</Text></View>
                  <View style={[styles.cellFixed, colStyle(WIDTHS.TEMP)]}><Text style={styles.cellText}>{r.temp1 ? `${r.temp1} °C` : ''}</Text></View>
                  <View style={[styles.cellFixed, colStyle(WIDTHS.SIGN)]}>{renderSignatureCell(r.sign1, WIDTHS.SIGN)}</View>

                  <View style={[styles.cellFixed, colStyle(WIDTHS.TIME)]}><Text style={styles.cellText}>{r.time2 || ''}</Text></View>
                  <View style={[styles.cellFixed, colStyle(WIDTHS.TEMP)]}><Text style={styles.cellText}>{r.temp2 ? `${r.temp2} °C` : ''}</Text></View>
                  <View style={[styles.cellFixed, colStyle(WIDTHS.SIGN)]}>{renderSignatureCell(r.sign2, WIDTHS.SIGN)}</View>

                  <View style={[styles.cellFixed, colStyle(WIDTHS.TIME)]}><Text style={styles.cellText}>{r.time3 || ''}</Text></View>
                  <View style={[styles.cellFixed, colStyle(WIDTHS.TEMP)]}><Text style={styles.cellText}>{r.temp3 ? `${r.temp3} °C` : ''}</Text></View>
                  <View style={[styles.cellFixed, colStyle(WIDTHS.SIGN)]}>{renderSignatureCell(r.sign3, WIDTHS.SIGN)}</View>

                  <View style={[styles.cellFixed, colStyle(WIDTHS.STAFF_NAME)]}><Text style={styles.cellText}>{r.staffName || ''}</Text></View>
                </View>
              ))}

              </View>
        )}

        {/* Footer: Chef signature, corrective action and verified-by lines */}
        <View style={styles.footerSection}>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 12 }}>CHEF Signature:</Text>
              {(() => {
                const val = metadata.chefSign || metadata.chefSignature;
                const uri = resolveSignatureUri(val);
                return uri ? <SignatureThumb uri={uri} width={260} height={80} layers={16} spread={1.8} /> : <Text style={styles.signatureLine}>{'______________________________'}</Text>;
              })()}
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 12 }}>Corrective Action:</Text>
            <Text style={styles.textarea}>{metadata.correctiveAction || ''}</Text>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 12 }}>Verified by:</Text>
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '700' }}>HSEQ Manager:</Text>
              {(() => {
                const val = metadata.hseqManagerSignature || metadata.hseqManagerSign || metadata.hseqSign;
                if (val) {
                  const s = String(val).trim();
                  const compact = s.replace(/\s+/g, '');
                  const isData = s.startsWith('data:');
                  const base64ish = /^[A-Za-z0-9+/=\r\n]+$/;
                  const uri = isData ? s : (compact.length > 100 && base64ish.test(compact) ? `data:image/png;base64,${compact}` : null);
                  if (uri) return <SignatureThumb uri={uri} width={260} height={64} layers={14} spread={1.6} />;
                }
                return <Text style={{ marginTop: 8, fontSize: 12 }}>{'______________________________'}</Text>;
              })()}
            </View>
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '700' }}>Complex Manager:</Text>
              {(() => {
                const val = metadata.complexManagerSignature;
                if (val) {
                  const s = String(val).trim();
                  const compact = s.replace(/\s+/g, '');
                  const isData = s.startsWith('data:');
                  const base64ish = /^[A-Za-z0-9+/=\r\n]+$/;
                  const uri = isData ? s : (compact.length > 100 && base64ish.test(compact) ? `data:image/png;base64,${compact}` : null);
                  if (uri) return <SignatureThumb uri={uri} width={260} height={64} layers={14} spread={1.6} />;
                }
                return <Text style={{ marginTop: 8, fontSize: 12 }}>{'______________________________'}</Text>;
              })()}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 6, backgroundColor: '#fff' },
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
  probeRowTight: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#ccc', paddingVertical: 4 },
  probeTextSmall: { fontSize: 11, fontWeight: '700' },
  probeDateSmall: { fontSize: 11 },
  table: { borderWidth: 1, borderColor: '#333', marginTop: 4, overflow: 'hidden' },
  tableTitle: { textAlign: 'center', fontWeight: '800', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#333' },
  tableGroupHeader: { flexDirection: 'row', backgroundColor: '#f3f5f7', borderBottomWidth: 1, borderColor: '#333' },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#333' },
  detailHeader: { backgroundColor: '#f3f5f7' },
  hCellFixed: { padding: 6, borderRightWidth: 1, borderRightColor: '#333', alignItems: 'center', justifyContent: 'center' },
  hGroupCell: { padding: 6, borderRightWidth: 1, borderRightColor: '#333', alignItems: 'center', justifyContent: 'center' },
  hText: { fontWeight: '800', fontSize: 10 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc', minHeight: 36, alignItems: 'center' },
  cellFixed: { padding: 6, borderRightWidth: 1, borderRightColor: '#ccc', justifyContent: 'center' },
  cellText: { fontSize: 12 },
  footerSection: { marginTop: 12, marginBottom: 12, paddingHorizontal: 4 },
  signatureLine: { borderBottomWidth: 1, borderColor: '#333', paddingVertical: 8, fontSize: 14 },
  textarea: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 4, minHeight: 48 }
});

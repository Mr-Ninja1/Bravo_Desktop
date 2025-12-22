import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

const A4_WIDTH = 794;
export default function CookingTemperaturePresentational({ payload, exportingWide = false }) {
  if (!payload) return null;
  const p = payload.payload || payload;
  const { metadata = {}, formData = [], layoutHints = {}, _tableWidth } = p;

  // Helper: normalize many possible signature shapes into a usable image URI
  const resolveSignatureUri = (val) => {
    if (!val) return null;
    // string values
    if (typeof val === 'string') {
      const s = String(val);
      if (s.startsWith('data:')) return s;
      if (s.startsWith('http:') || s.startsWith('https:') || s.startsWith('file:') || s.startsWith('blob:')) return s;
      // long base64 blobs (legacy) -> convert to data: URI
      // crude check: long and mostly base64 chars
      const maybeBase64 = /^[A-Za-z0-9+/=\s]+$/.test(s.replace(/\s+/g, ''));
      if (maybeBase64 && s.replace(/\s+/g, '').length > 200) return `data:image/png;base64,${s.replace(/\s+/g, '')}`;
      return null;
    }
    // object shapes
    if (typeof val === 'object') {
      if (val.uri) return val.uri;
      if (val.data) {
        const d = String(val.data);
        return d.startsWith('data:') ? d : `data:image/png;base64,${d}`;
      }
    }
    return null;
  };

  // Ensure we render 15 rows to match the editable form
  const rowsToRender = (formData && formData.length) ? formData : Array.from({ length: 15 }, (_, i) => ({ index: i + 1 }));

  // Fixed pixel widths (approx) based on the editable form flexes
  const WIDTHS = (layoutHints && layoutHints.WIDTHS) || {
    INDEX: 40,
    FOOD_ITEM: 300,
    TIME: 80,
    TEMP: 80,
    SIGN: 100,
    STAFF_NAME: 160,
  };
  const tableWidth = (_tableWidth && Number(_tableWidth)) || 900;
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

  return (
    <ScrollView contentContainerStyle={exportingWide ? { padding: 0, margin: 0, backgroundColor: '#fff' } : styles.container}>
      <View style={[styles.card, exportA4Style]}>

        {/* Top row: logo left, title center, issue date right */}
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

        {/* Subject and compiled/approved strip */}
        <View style={styles.subjectBandRow}>
          <View style={styles.subjectLeft}><Text style={styles.subjectSmall}>SUBJECT: COOKING TEMPERATURE LOG</Text></View>
          <View style={styles.compiledBoxThin}><Text style={styles.compiledLabelSmall}>COMPILED BY: {metadata.compiledBy || ''}</Text></View>
          <View style={styles.compiledBoxThin}><Text style={styles.compiledLabelSmall}>APPROVED BY: {metadata.approvedBy || ''}</Text></View>
        </View>

        {/* Probe thermometer subtitle + date (tight above table) */}
        <View style={styles.probeRowTight}>
          <Text style={styles.probeTextSmall}>PROBE THERMOMETER TEMPERATURE LOG FOR COOKED FOOD</Text>
          <Text style={styles.probeDateSmall}>DATE: {metadata.date || ''}</Text>
        </View>

        {/* Table: shrink to A4 width and disable horizontal scroll during export */}
        {exportingWide ? (
          <View style={[styles.table, exportA4Style]}> 
            <Text style={styles.tableTitle}>COOKING TEMPERATURE LOG</Text>

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
                <View style={[styles.cellFixed, { width: adjustedWidths.SIGN }]}>
                  {(() => {
                    const u = resolveSignatureUri(r.sign1);
                    return u ? <SignatureThumb uri={u} width={adjustedWidths.SIGN - 8} height={48} layers={8} spread={1.0} /> : <Text style={styles.cellText}>{r.sign1 || ''}</Text>;
                  })()}
                </View>

                <View style={[styles.cellFixed, { width: adjustedWidths.TIME }]}><Text style={styles.cellText}>{r.time2 || ''}</Text></View>
                <View style={[styles.cellFixed, { width: adjustedWidths.TEMP }]}><Text style={styles.cellText}>{r.temp2 ? `${r.temp2} °C` : ''}</Text></View>
                <View style={[styles.cellFixed, { width: adjustedWidths.SIGN }]}>
                  {(() => {
                    const u = resolveSignatureUri(r.sign2);
                    return u ? <SignatureThumb uri={u} width={adjustedWidths.SIGN - 8} height={48} layers={8} spread={1.0} /> : <Text style={styles.cellText}>{r.sign2 || ''}</Text>;
                  })()}
                </View>

                <View style={[styles.cellFixed, { width: adjustedWidths.TIME }]}><Text style={styles.cellText}>{r.time3 || ''}</Text></View>
                <View style={[styles.cellFixed, { width: adjustedWidths.TEMP }]}><Text style={styles.cellText}>{r.temp3 ? `${r.temp3} °C` : ''}</Text></View>
                <View style={[styles.cellFixed, { width: adjustedWidths.SIGN }]}>
                  {(() => {
                    const u = resolveSignatureUri(r.sign3);
                    return u ? <SignatureThumb uri={u} width={adjustedWidths.SIGN - 8} height={48} layers={8} spread={1.0} /> : <Text style={styles.cellText}>{r.sign3 || ''}</Text>;
                  })()}
                </View>

                <View style={[styles.cellFixed, { width: adjustedWidths.STAFF_NAME }]}><Text style={styles.cellText}>{r.staffName || ''}</Text></View>
              </View>
            ))}

          </View>
        ) : (
          <ScrollView horizontal contentContainerStyle={{}} showsHorizontalScrollIndicator={true}>
            <View style={[styles.table, { minWidth: _tableWidth || 900 }]}> 
              {/* Title */}
              <Text style={styles.tableTitle}>COOKING TEMPERATURE LOG</Text>

            {/* Header group row */}
            <View style={[styles.tableGroupHeader]}>
              <View style={[styles.hCellFixed, { width: WIDTHS.INDEX }]}><Text style={styles.hText}>#</Text></View>
              <View style={[styles.hCellFixed, { width: WIDTHS.FOOD_ITEM }]}><Text style={styles.hText}>FOOD ITEM</Text></View>
              <View style={[styles.hGroupCell, { width: WIDTHS.TIME + WIDTHS.TEMP + WIDTHS.SIGN }]}><Text style={styles.hText}>1ST RECORD</Text></View>
              <View style={[styles.hGroupCell, { width: WIDTHS.TIME + WIDTHS.TEMP + WIDTHS.SIGN }]}><Text style={styles.hText}>2ND RECORD</Text></View>
              <View style={[styles.hGroupCell, { width: WIDTHS.TIME + WIDTHS.TEMP + WIDTHS.SIGN }]}><Text style={styles.hText}>3RD RECORD</Text></View>
              <View style={[styles.hCellFixed, { width: WIDTHS.STAFF_NAME }]}><Text style={styles.hText}>STAFF'S NAME</Text></View>
            </View>

            {/* Subheader row */}
            <View style={[styles.tableHeaderRow, styles.detailHeader]}>
              <View style={[styles.hCellFixed, { width: WIDTHS.INDEX }]} />
              <View style={[styles.hCellFixed, { width: WIDTHS.FOOD_ITEM }]} />
              {[...Array(3)].map((_, i) => (
                <React.Fragment key={i}>
                  <View style={[styles.hCellFixed, { width: WIDTHS.TIME }]}><Text style={styles.hText}>TIME</Text></View>
                  <View style={[styles.hCellFixed, { width: WIDTHS.TEMP }]}><Text style={styles.hText}>TEMP</Text></View>
                  <View style={[styles.hCellFixed, { width: WIDTHS.SIGN }]}><Text style={styles.hText}>SIGN</Text></View>
                </React.Fragment>
              ))}
              <View style={[styles.hCellFixed, { width: WIDTHS.STAFF_NAME }]} />
            </View>

            {/* Rows */}
            {rowsToRender.map((r, ri) => (
              <View key={ri} style={styles.row}>
                <View style={[styles.cellFixed, { width: WIDTHS.INDEX }]}><Text style={styles.cellText}>{r.index || ri + 1}</Text></View>
                <View style={[styles.cellFixed, { width: WIDTHS.FOOD_ITEM }]}>
                  <Text style={styles.cellText}>{r.foodItem || ''}</Text>
                </View>

                <View style={[styles.cellFixed, { width: WIDTHS.TIME }]}><Text style={styles.cellText}>{r.time1 || ''}</Text></View>
                <View style={[styles.cellFixed, { width: WIDTHS.TEMP }]}><Text style={styles.cellText}>{r.temp1 ? `${r.temp1} °C` : ''}</Text></View>
                <View style={[styles.cellFixed, { width: WIDTHS.SIGN }]}>
                  {(() => {
                    const u = resolveSignatureUri(r.sign1);
                    return u ? <SignatureThumb uri={u} width={WIDTHS.SIGN - 8} height={48} layers={8} spread={1.0} /> : <Text style={styles.cellText}>{r.sign1 || ''}</Text>;
                  })()}
                </View>

                <View style={[styles.cellFixed, { width: WIDTHS.TIME }]}><Text style={styles.cellText}>{r.time2 || ''}</Text></View>
                <View style={[styles.cellFixed, { width: WIDTHS.TEMP }]}><Text style={styles.cellText}>{r.temp2 ? `${r.temp2} °C` : ''}</Text></View>
                <View style={[styles.cellFixed, { width: WIDTHS.SIGN }]}>
                  {(() => {
                    const u = resolveSignatureUri(r.sign2);
                    return u ? <SignatureThumb uri={u} width={WIDTHS.SIGN - 8} height={48} layers={8} spread={1.0} /> : <Text style={styles.cellText}>{r.sign2 || ''}</Text>;
                  })()}
                </View>

                <View style={[styles.cellFixed, { width: WIDTHS.TIME }]}><Text style={styles.cellText}>{r.time3 || ''}</Text></View>
                <View style={[styles.cellFixed, { width: WIDTHS.TEMP }]}><Text style={styles.cellText}>{r.temp3 ? `${r.temp3} °C` : ''}</Text></View>
                <View style={[styles.cellFixed, { width: WIDTHS.SIGN }]}>
                  {(() => {
                    const u = resolveSignatureUri(r.sign3);
                    return u ? <SignatureThumb uri={u} width={WIDTHS.SIGN - 8} height={48} layers={8} spread={1.0} /> : <Text style={styles.cellText}>{r.sign3 || ''}</Text>;
                  })()}
                </View>

                <View style={[styles.cellFixed, { width: WIDTHS.STAFF_NAME }]}><Text style={styles.cellText}>{r.staffName || ''}</Text></View>
              </View>
            ))}

            </View>
          </ScrollView>
        )}

        {/* --- Footer Section: Chef / Corrective Action / Verified By (HSEQ & Complex Manager) --- */}
        <View style={styles.footerSection}>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 12 }}>CHEF Signature:</Text>
            {resolveSignatureUri(metadata.chefSignature) ? (
              <SignatureThumb uri={resolveSignatureUri(metadata.chefSignature)} width={220} height={80} layers={8} spread={1.0} />
            ) : (
              <Text style={styles.signatureLine}>{'______________________________'}</Text>
            )}
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 12 }}>Corrective Action:</Text>
            <Text style={styles.textarea}>{metadata.correctiveAction || metadata.corrective_action || metadata.correctiveActionText || ''}</Text>
          </View>

          <View style={{ marginBottom: 12 }}>
            {/* Show only Complex Manager signature here — remove the decorative "Verified by" header and HSEQ Manager label per request */}
            <Text style={{ fontSize: 12, fontWeight: '700' }}>Complex Manager:</Text>
            {resolveSignatureUri(metadata.complexManagerSignature) ? (
              <SignatureThumb uri={resolveSignatureUri(metadata.complexManagerSignature)} width={220} height={80} layers={8} spread={1.0} />
            ) : (
              <Text style={{ marginTop: 4 }}>{'______________________________'}</Text>
            )}
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

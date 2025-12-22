import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

export default function CertificateOfAnalysisPresentational({ payload }) {
  if (!payload) return null;
  const p = payload.payload || payload;
  const meta = p.metadata || {};
  const data = p.formData || {};
  const products = data.products || [];

  // Responsive column defaults
  const DEFAULT_COLS = {
    PRODUCT: 140,
    BATCH_NO: 120,
    TIME: 90,
    DATE_REC: 110,
    APPEARANCE: 120,
    WEIGHT: 100,
    TEXTURE: 120,
    ORGANIC_TEST: 100,
    RESULT: 140,
    COMMENT: 180,
    SAMPLED_BY: 160,
    SFC_SIGN: 140,
  };
  const WIDTHS = (p.layoutHints && p.layoutHints.WIDTHS) || DEFAULT_COLS;
  const tableWidth = Object.values(WIDTHS).reduce((a, b) => a + (Number(b) || 0), 0) || 1;
  const TOTAL = Object.values(WIDTHS).reduce((s, v) => s + (Number(v) || 0), 0) || 1;
  const colStyle = (w) => {
    const width = Number(w) || 0;
    const flex = width / TOTAL;
    const min = Math.max(28, Math.round(width * 0.28));
    return { flex, minWidth: min, flexShrink: 1 };
  };
  const leftSum = (WIDTHS.PRODUCT || 0) + (WIDTHS.BATCH_NO || 0) + (WIDTHS.TIME || 0) + (WIDTHS.DATE_REC || 0);
  const testsSum = (WIDTHS.APPEARANCE || 0) + (WIDTHS.WEIGHT || 0) + (WIDTHS.TEXTURE || 0) + (WIDTHS.ORGANIC_TEST || 0);
  const rightSum = Math.max(0, tableWidth - leftSum - testsSum);

  // Helper to render signature thumbnails safely
  const renderSignature = (val, w = 130, h = 40) => {
    if (!val) return <Text style={styles.emptyValue}>-</Text>;
    const uri = String(val).startsWith('data:') 
      ? val 
      : (String(val).length > 100 ? `data:image/png;base64,${String(val).replace(/\s+/g, '')}` : null);
    
    return uri 
      ? <SignatureThumb uri={uri} width={w} height={h} layers={6} spread={1.0} /> 
      : <Text style={styles.cellText}>{String(val)}</Text>;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>

        {/* TOP HEADER: left product label area, right time/date */}
        <View style={styles.headerRowTop}>
          <Image source={require('../../assets/logo.jpeg')} style={styles.logo} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={styles.brandName}>BRAVO BRANDS LIMITED</Text>
            <Text style={styles.title}>CERTIFICATE OF ANALYSIS</Text>
          </View>
          <View style={styles.metaBoxRight}>
            <Text style={styles.metaTextSmall}>Issue date: {meta.issueDate || data.issueDate || ''}</Text>
          </View>
        </View>

        {/* DATA TABLE: responsive table */}
        <View style={styles.tableWrapper}>
          <View>
            {/* removed duplicate outside labels: Ingredient / Product and external tests title */}

            {/* Spanning header: reserve space for left columns, then group header above the three test columns */}
            <View style={styles.spanningHeaderRowExact}>
              <View style={{ width: leftSum }} />
              <View style={[styles.testsHeaderGroupExact, { width: testsSum }]}><Text style={styles.testsHeaderText}>Organoleptic & Morphologistic Tests</Text></View>
              <View style={{ width: rightSum }} />
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.columnHeader, colStyle(WIDTHS.PRODUCT)]}>Product</Text>
              <Text style={[styles.columnHeader, colStyle(WIDTHS.BATCH_NO)]}>Batch No</Text>
              <Text style={[styles.columnHeader, colStyle(WIDTHS.TIME)]}>Time</Text>
              <Text style={[styles.columnHeader, colStyle(WIDTHS.DATE_REC)]}>Date Rec.</Text>
              <Text style={[styles.columnHeader, colStyle(WIDTHS.APPEARANCE)]}>Appearance</Text>
              <Text style={[styles.columnHeader, colStyle(WIDTHS.WEIGHT)]}>Weight</Text>
              <Text style={[styles.columnHeader, colStyle(WIDTHS.TEXTURE)]}>Texture</Text>
              <Text style={[styles.columnHeader, colStyle(WIDTHS.ORGANIC_TEST), { backgroundColor: '#fdfdfd' }]}>Organic Test</Text>
              <Text style={[styles.columnHeader, colStyle(WIDTHS.RESULT)]}>Result</Text>
              <Text style={[styles.columnHeader, colStyle(WIDTHS.COMMENT)]}>Comment</Text>
              <Text style={[styles.columnHeader, colStyle(WIDTHS.SAMPLED_BY)]}>Sampled By</Text>
              <Text style={[styles.columnHeader, colStyle(WIDTHS.SFC_SIGN)]}>SFC sign</Text>
            </View>

            {products && products.length ? products.map((item, idx) => (
              <View key={item.id || idx} style={styles.tableRow}>
                <Text style={[styles.cellText, colStyle(WIDTHS.PRODUCT)]}>{item.product || ''}</Text>
                <Text style={[styles.cellText, colStyle(WIDTHS.BATCH_NO)]}>{item.batchNo || ''}</Text>
                <Text style={[styles.cellText, colStyle(WIDTHS.TIME)]}>{item.time || ''}</Text>
                <Text style={[styles.cellText, colStyle(WIDTHS.DATE_REC)]}>{item.dateReceived || ''}</Text>
                <Text style={[styles.cellText, colStyle(WIDTHS.APPEARANCE)]}>{item.appearance || ''}</Text>
                <Text style={[styles.cellText, colStyle(WIDTHS.WEIGHT)]}>{item.weight || ''}</Text>
                <Text style={[styles.cellText, colStyle(WIDTHS.TEXTURE)]}>{item.texture || ''}</Text>
                <Text style={[styles.cellText, colStyle(WIDTHS.ORGANIC_TEST)]}>{item.organicTest || ''}</Text>
                <Text style={[styles.cellText, colStyle(WIDTHS.RESULT), { fontWeight: '700', color: item.result ? '#065f46' : '#111' }]}>{item.result || ''}</Text>
                <Text style={[styles.cellText, colStyle(WIDTHS.COMMENT)]}>{item.comment || ''}</Text>
                <View style={[{ padding: 4, alignItems: 'center' }, colStyle(WIDTHS.SAMPLED_BY)]}>
                  {renderSignature(item.sampledBy)}
                </View>
                <View style={[{ padding: 4, alignItems: 'center' }, colStyle(WIDTHS.SFC_SIGN)]}>
                  {renderSignature(item.sfcSign)}
                </View>
              </View>
            )) : (
              <View style={styles.tableRow}><Text style={styles.cellText}>No products recorded</Text></View>
            )}
          </View>
        </View>

        {/* Sampled / Managers row */}
        <View style={[styles.sampledManagersRow, { justifyContent: 'space-between' }]}>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.smallLabel}>HSEQ Manager:</Text>
            {renderSignature(data.hseqManager, 160, 50)}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.smallLabel}>COMPLEX MANAGER:</Text>
            {renderSignature(data.complexManager, 160, 50)}
          </View>
        </View>

        {/* Results and comments are rendered inside the table rows above; no separate summary here */}

        {data.footerDate ? (
          <View style={styles.dateBox}>
             <Text style={styles.inputLabel}>DATE: <Text style={styles.inputValue}>{data.footerDate}</Text></Text>
          </View>
        ) : null}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 8, backgroundColor: '#F3F4F6' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, borderColor: '#1F2937', borderWidth: 1 },
  headerRowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  logo: { width: 55, height: 55, marginRight: 12 },
  brandName: { fontSize: 13, fontWeight: '800', color: '#185a9d' },
  title: { fontSize: 15, fontWeight: '900', color: '#111827' },
  metaBox: { alignItems: 'flex-end' },
  metaText: { fontSize: 10, color: '#4B5563' },

  tableWrapper: { marginTop: 10, borderWidth: 1, borderColor: '#ccc' },
  spanningHeaderRow: { flexDirection: 'row', backgroundColor: '#fff' },
  testsHeaderGroup: { width: 280, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#ccc', backgroundColor: '#fcfcfc', alignItems: 'center', paddingVertical: 4 },
  testsHeaderText: { fontSize: 9, fontWeight: 'bold' },

  tableHeader: { flexDirection: 'row', backgroundColor: '#f2f2f2', borderBottomWidth: 1, borderColor: '#ccc' },
  columnHeader: { fontSize: 9, fontWeight: 'bold', padding: 8, textAlign: 'center', borderRightWidth: 1, borderColor: '#ccc' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee', alignItems: 'center' },
  cellText: { padding: 8, fontSize: 11, borderRightWidth: 1, borderColor: '#ccc', textAlign: 'center', color: '#333' },
  emptyValue: { color: '#999', fontSize: 11 },

  footerSignatureArea: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, flexWrap: 'wrap' },
  footerSignBox: { width: '48%', marginBottom: 15 },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#374151', marginBottom: 4 },
  inputValue: { fontSize: 13, color: '#111' },
  dateBox: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10, marginTop: 5 }
  ,
  metaBoxRight: { alignItems: 'flex-end' },
  metaTextSmall: { fontSize: 10, color: '#6b7280' },
  testsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  leftLabelsTitle: { fontSize: 12, fontWeight: '700', padding: 6 },
  rightTestsTitle: { fontSize: 11, fontWeight: '700', padding: 6 },
  spanningHeaderRowExact: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  testsHeaderGroupExact: { width: 340, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#ccc', backgroundColor: '#fafafa', alignItems: 'center', paddingVertical: 6 },
  sampledManagersRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#eee' },
  smallLabel: { fontSize: 11, color: '#374151', fontWeight: '600' }
});
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

// Dummy presentational used for debugging: ignores payload and renders static content
// A4 width in pixels at 96dpi: ~794
const A4_WIDTH = 794;

export default function MixingControlSheetPresentational({ payload, exportingWide = false }) {
  const rows = Array.isArray(payload?.formData) ? payload.formData : [];
  const formatTemp = (v) => {
    if (v === null || typeof v === 'undefined') return '';
    const s = String(v).trim();
    if (s === '') return '';
    // remove any degree symbols or stray C letters, then extract numeric value if present
    const stripped = s.replace(/[°℃]/g, '').trim();
    // try to find a numeric token
    const m = stripped.match(/[+-]?\d+(?:\.\d+)?/);
    if (m) return `${m[0]}°C`;
    // fallback: if string already had a trailing C-like marker, return original
    if (/°|℃|\bC$/i.test(s)) return s;
    return `${stripped}°C`;
  };
  // Column width defaults (will be used responsively)
  const DEFAULT_COLS = {
    PROD_DATE: 120,
    PROD_NAME: 180,
    BATCH_NO: 100,
    INGREDIENTS: 220,
    INGREDIENTS_WEIGHT: 160,
    MIXING_TIME: 120,
    MIXING_TEMP: 120,
    DOUGH_DIVIDING: 160,
    PRODUCT_QUANTITY: 120,
    MIXER_MAN_SIGN: 140,
    SUP_SIGN: 140,
  };
  const WIDTHS = (payload?.layoutHints && payload.layoutHints.WIDTHS) || DEFAULT_COLS;
  const tableWidth = Object.values(WIDTHS).reduce((a, b) => a + (Number(b) || 0), 0) || 1;
  const TOTAL = Object.values(WIDTHS).reduce((s, v) => s + (Number(v) || 0), 0) || 1;
  const colStyle = (w) => {
    const width = Number(w) || 0;
    const flex = width / TOTAL;
    const min = Math.max(36, Math.round(width * 0.28));
    return { flex, minWidth: min, flexShrink: 1 };
  };
  const metadata = payload?.metadata || {};
  let issueDate = '';
  if (payload?.savedAt) {
    try { issueDate = new Date(payload.savedAt).toLocaleDateString(); } catch (e) { issueDate = String(payload.savedAt); }
  } else if (metadata.issueDate) issueDate = String(metadata.issueDate);

  // Shrink table and form to A4 width during export
  let scale = 1;
  if (exportingWide && tableWidth > A4_WIDTH) {
    scale = A4_WIDTH / tableWidth;
  }
  const adjustedWidths = Object.values(WIDTHS).map(w => Math.round(Number(w || 0) * scale));
  const adjustedTableWidth = exportingWide ? Math.round(tableWidth * scale) : tableWidth;
  const exportA4Style = exportingWide ? { width: A4_WIDTH, maxWidth: A4_WIDTH, alignSelf: 'center' } : {};

  return (
    <View style={[styles.container, exportA4Style]}>
      <ScrollView contentContainerStyle={exportingWide ? { padding: 0, margin: 0, backgroundColor: '#fff' } : styles.content}>
        <View style={[styles.headerBox, exportA4Style]}>
          <View style={[styles.headerTop, exportA4Style]}>
            <View style={styles.logoWrap}>
              <Image source={require('../../assets/logo.jpeg')} style={styles.logo} />
              <View>
                <Text style={styles.brand}>Bravo Brands Limited</Text>
                <Text style={styles.sub}>Food Safety Management System</Text>
              </View>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Issue Date: {String(issueDate)}</Text>
            </View>
          </View>
          <View style={styles.subjectRow}><Text style={styles.subjectText}>Subject: MIXING CONTROL SHEET</Text></View>
        </View>

        {/* Table: shrink to A4 width and disable horizontal scroll during export */}
        {exportingWide ? (
          <View style={[styles.tableWrap, { width: adjustedTableWidth }]}> 
            <View style={styles.tableHeader}>
              <View style={[styles.headerCell, colStyle(WIDTHS.PROD_DATE)]}><Text style={styles.headerText}>PRODUCTION DATE</Text></View>
              <View style={[styles.headerCell, colStyle(WIDTHS.PROD_NAME)]}><Text style={styles.headerText}>PRODUCT NAME</Text></View>
              <View style={[styles.headerCell, colStyle(WIDTHS.BATCH_NO)]}><Text style={styles.headerText}>BATCH NO.</Text></View>
              <View style={[styles.headerCell, colStyle(WIDTHS.INGREDIENTS)]}><Text style={styles.headerText}>INGREDIENTS</Text></View>
              <View style={[styles.headerCell, colStyle(WIDTHS.INGREDIENTS_WEIGHT)]}><Text style={styles.headerText}>INGREDIENTS WEIGHT (kgs)</Text></View>
              <View style={[styles.headerCell, colStyle(WIDTHS.MIXING_TIME)]}><Text style={styles.headerText}>MIXING TIME</Text></View>
              <View style={[styles.headerCell, colStyle(WIDTHS.MIXING_TEMP)]}><Text style={styles.headerText}>MIXING TEMP</Text></View>
              <View style={[styles.headerCell, colStyle(WIDTHS.DOUGH_DIVIDING)]}><Text style={styles.headerText}>DOUGH DIVIDING/SCALING (kgs)</Text></View>
              <View style={[styles.headerCell, colStyle(WIDTHS.PRODUCT_QUANTITY)]}><Text style={styles.headerText}>PRODUCT QUANTITY</Text></View>
              <View style={[styles.headerCell, colStyle(WIDTHS.MIXER_MAN_SIGN)]}><Text style={styles.headerText}>MIXER MAN SIGN</Text></View>
              <View style={[styles.headerCell, colStyle(WIDTHS.SUP_SIGN)]}><Text style={styles.headerText}>SUP SIGN</Text></View>
            </View>

            {rows.map((row, idx) => (
              <View key={idx} style={styles.row}>
                <View style={[styles.cell, colStyle(WIDTHS.PROD_DATE)]}><Text style={styles.cellText}>{String(row?.prodDate ?? '')}</Text></View>
                <View style={[styles.cell, colStyle(WIDTHS.PROD_NAME)]}><Text style={styles.cellText}>{String(row?.prodName ?? '')}</Text></View>
                <View style={[styles.cell, colStyle(WIDTHS.BATCH_NO)]}><Text style={styles.cellText}>{String(row?.batchNo ?? '')}</Text></View>
                <View style={[styles.cell, colStyle(WIDTHS.INGREDIENTS)]}><Text style={styles.cellText}>{String(row?.ingredients ?? '')}</Text></View>
                <View style={[styles.cell, colStyle(WIDTHS.INGREDIENTS_WEIGHT)]}><Text style={styles.cellText}>{String(row?.ingredientsWeight ?? '')}</Text></View>
                <View style={[styles.cell, colStyle(WIDTHS.MIXING_TIME)]}><Text style={styles.cellText}>{String(row?.mixingTime ?? '')}</Text></View>
                <View style={[styles.cell, colStyle(WIDTHS.MIXING_TEMP)]}><Text style={styles.cellText}>{formatTemp(row?.mixingTemp ?? '')}</Text></View>
                <View style={[styles.cell, colStyle(WIDTHS.DOUGH_DIVIDING)]}><Text style={styles.cellText}>{String(row?.doughDividingScaling ?? '')}</Text></View>
                <View style={[styles.cell, colStyle(WIDTHS.PRODUCT_QUANTITY)]}><Text style={styles.cellText}>{String(row?.productQuantity ?? '')}</Text></View>
                <View style={[styles.cell, colStyle(WIDTHS.MIXER_MAN_SIGN)]}>
                  {row?.mixerManSign ? (
                    <SignatureThumb uri={String(row.mixerManSign).startsWith('data:') ? row.mixerManSign : `data:image/png;base64,${row.mixerManSign}`} width={120} height={60} layers={6} spread={0.9} />
                  ) : <Text style={styles.cellText}>{String(row?.mixerManSign ?? '')}</Text>}
                </View>
                <View style={[styles.cell, colStyle(WIDTHS.SUP_SIGN)]}>
                  {row?.supSign ? (
                    <SignatureThumb uri={String(row.supSign).startsWith('data:') ? row.supSign : `data:image/png;base64,${row.supSign}`} width={120} height={60} layers={6} spread={0.9} />
                  ) : <Text style={styles.cellText}>{String(row?.supSign ?? '')}</Text>}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.tableWrap, { width: '100%' }]}> 
            <View style={styles.tableHeader}>
              <View style={[styles.headerCell, colStyle(WIDTHS.PROD_DATE)]}><Text style={styles.headerText}>PRODUCTION DATE</Text></View>
              <View style={[styles.headerCell, colStyle(WIDTHS.PROD_NAME)]}><Text style={styles.headerText}>PRODUCT NAME</Text></View>
              <View style={[styles.headerCell, colStyle(WIDTHS.BATCH_NO)]}><Text style={styles.headerText}>BATCH NO.</Text></View>
              <View style={[styles.headerCell, colStyle(WIDTHS.INGREDIENTS)]}><Text style={styles.headerText}>INGREDIENTS</Text></View>
              <View style={[styles.headerCell, colStyle(WIDTHS.INGREDIENTS_WEIGHT)]}><Text style={styles.headerText}>INGREDIENTS WEIGHT (kgs)</Text></View>
              <View style={[styles.headerCell, colStyle(WIDTHS.MIXING_TIME)]}><Text style={styles.headerText}>MIXING TIME</Text></View>
              <View style={[styles.headerCell, colStyle(WIDTHS.MIXING_TEMP)]}><Text style={styles.headerText}>MIXING TEMP</Text></View>
              <View style={[styles.headerCell, colStyle(WIDTHS.DOUGH_DIVIDING)]}><Text style={styles.headerText}>DOUGH DIVIDING/SCALING (kgs)</Text></View>
              <View style={[styles.headerCell, colStyle(WIDTHS.PRODUCT_QUANTITY)]}><Text style={styles.headerText}>PRODUCT QUANTITY</Text></View>
              <View style={[styles.headerCell, colStyle(WIDTHS.MIXER_MAN_SIGN)]}><Text style={styles.headerText}>MIXER MAN SIGN</Text></View>
              <View style={[styles.headerCell, colStyle(WIDTHS.SUP_SIGN)]}><Text style={styles.headerText}>SUP SIGN</Text></View>
            </View>
            {rows.map((row, idx) => (
              <View key={idx} style={styles.row}>
                <View style={[styles.cell, colStyle(WIDTHS.PROD_DATE)]}><Text style={styles.cellText}>{String(row?.prodDate ?? '')}</Text></View>
                <View style={[styles.cell, colStyle(WIDTHS.PROD_NAME)]}><Text style={styles.cellText}>{String(row?.prodName ?? '')}</Text></View>
                <View style={[styles.cell, colStyle(WIDTHS.BATCH_NO)]}><Text style={styles.cellText}>{String(row?.batchNo ?? '')}</Text></View>
                <View style={[styles.cell, colStyle(WIDTHS.INGREDIENTS)]}><Text style={styles.cellText}>{String(row?.ingredients ?? '')}</Text></View>
                <View style={[styles.cell, colStyle(WIDTHS.INGREDIENTS_WEIGHT)]}><Text style={styles.cellText}>{String(row?.ingredientsWeight ?? '')}</Text></View>
                <View style={[styles.cell, colStyle(WIDTHS.MIXING_TIME)]}><Text style={styles.cellText}>{String(row?.mixingTime ?? '')}</Text></View>
                <View style={[styles.cell, colStyle(WIDTHS.MIXING_TEMP)]}><Text style={styles.cellText}>{formatTemp(row?.mixingTemp ?? '')}</Text></View>
                <View style={[styles.cell, colStyle(WIDTHS.DOUGH_DIVIDING)]}><Text style={styles.cellText}>{String(row?.doughDividingScaling ?? '')}</Text></View>
                <View style={[styles.cell, colStyle(WIDTHS.PRODUCT_QUANTITY)]}><Text style={styles.cellText}>{String(row?.productQuantity ?? '')}</Text></View>
                <View style={[styles.cell, colStyle(WIDTHS.MIXER_MAN_SIGN)]}>
                  {row?.mixerManSign ? (
                    <SignatureThumb uri={String(row.mixerManSign).startsWith('data:') ? row.mixerManSign : `data:image/png;base64,${row.mixerManSign}`} width={120} height={60} layers={6} spread={0.9} />
                  ) : <Text style={styles.cellText}>{String(row?.mixerManSign ?? '')}</Text>}
                </View>
                <View style={[styles.cell, colStyle(WIDTHS.SUP_SIGN)]}>
                  {row?.supSign ? (
                    <SignatureThumb uri={String(row.supSign).startsWith('data:') ? row.supSign : `data:image/png;base64,${row.supSign}`} width={120} height={60} layers={6} spread={0.9} />
                  ) : <Text style={styles.cellText}>{String(row?.supSign ?? '')}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={[styles.footerRow, exportA4Style]}>
          <View style={styles.footerCol}>
            <Text style={styles.footerLabel}>VERIFIED BY:</Text>
            {payload?.verification?.mixerManSign ? (
              <SignatureThumb uri={String(payload.verification.mixerManSign).startsWith('data:') ? payload.verification.mixerManSign : `data:image/png;base64,${payload.verification.mixerManSign}`} width={220} height={80} layers={8} spread={1.0} />
            ) : <Text style={styles.footerLabel}>{String(payload?.verification?.mixerManSign || '')}</Text>}
          </View>
          <View style={styles.footerCol}>
            <Text style={styles.footerLabel}>COMPLEX MANAGER:</Text>
            {payload?.verification?.complexManagerSign ? (
              <SignatureThumb uri={String(payload.verification.complexManagerSign).startsWith('data:') ? payload.verification.complexManagerSign : `data:image/png;base64,${payload.verification.complexManagerSign}`} width={220} height={80} layers={8} spread={1.0} />
            ) : <Text style={styles.footerLabel}>{String(payload?.verification?.complexManagerSign || '')}</Text>}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 12 },
  headerBox: { padding: 12, marginBottom: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoWrap: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 48, height: 48, marginRight: 8 },
  brand: { fontWeight: '700', fontSize: 16, color: '#185a9d' },
  sub: { fontSize: 12, color: '#43cea2' },
  metaCol: { alignItems: 'flex-end' },
  metaLabel: { fontSize: 12, color: '#333' },
  subjectRow: { paddingVertical: 8, alignItems: 'center' },
  subjectText: { fontWeight: '800', fontSize: 14, textTransform: 'uppercase' },
  signRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaSmall: { fontSize: 12, color: '#333' },
  tableWrap: { borderWidth: 1, borderColor: '#333', borderRadius: 6, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f5f7', borderBottomWidth: 1, borderColor: '#333' },
  headerCell: { padding: 8, borderRightWidth: 1, borderRightColor: '#333' },
  headerText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#333' },
  cell: { padding: 6, borderRightWidth: 1, borderRightColor: '#333', justifyContent: 'center' },
  cellText: { fontSize: 12 },
  footerRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  footerCol: { flex: 1, minWidth: 140, paddingRight: 8 },
  footerLabel: { fontSize: 12, color: '#333', fontWeight: '700' },
});

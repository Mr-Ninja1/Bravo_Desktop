import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

// A4 width in pixels at 72dpi: 595, at 96dpi: 794, at 300dpi: 2480. For RN, use ~794 for web, ~595 for PDF, but can be tuned.
const A4_WIDTH = 794;

export default function BakingControlSheetPresentational({ payload, exportingWide = false }) {
  if (!payload) return null;
  const { metadata, formData } = payload;

  const columnHeaders = [
    { key: 'prodDate', label: 'PRODUCTION DATE', width: 120 },
    { key: 'prodName', label: 'PRODUCT NAME', width: 220 },
    { key: 'batchNo', label: 'BATCH NO.', width: 120 },
    { key: 'proofingTemp', label: 'PROOFING TEMP', width: 140 },
    { key: 'proofingTime', label: 'PROOFING TIME', width: 120 },
    { key: 'ovenTemp', label: 'OVEN TEMP', width: 140 },
    { key: 'bakingTime', label: 'BAKING TIME', width: 120 },
    { key: 'bakerSign', label: 'BAKER SIGN', width: 160 },
    { key: 'supervisorSign', label: 'SUPERVISOR SIGN', width: 160 },
  ];

  // Calculate table width
  const tableWidth = columnHeaders.reduce((s, c) => s + (c.width || 120), 0);

  // If exportingWide, shrink columns proportionally to fit A4
  let adjustedHeaders = columnHeaders;
  let adjustedTableWidth = tableWidth;
  if (exportingWide && tableWidth > A4_WIDTH) {
    const scale = A4_WIDTH / tableWidth;
    adjustedHeaders = columnHeaders.map(col => ({ ...col, width: Math.round((col.width || 120) * scale) }));
    adjustedTableWidth = A4_WIDTH;
  }

  const normalizeSignature = (v) => {
    if (!v) return null;
    // handle object shapes like { uri } or { data }
    if (typeof v === 'object') {
      if (v.uri && typeof v.uri === 'string') return v.uri.trim();
      if (v.data && typeof v.data === 'string') {
        const compact = v.data.replace(/\s+/g, '');
        if (compact.length) return `data:image/png;base64,${compact}`;
      }
      return null;
    }
    if (typeof v !== 'string') return null;
    const s = v.trim();
    if (!s) return null;
    if (s.startsWith('data:')) return s;
    const compact = s.replace(/\s+/g, '');
    if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
    return null;
  };

  const renderMaybeSignature = (val, textStyle = {}) => {
    const uri = normalizeSignature(val);
    if (uri) return <SignatureThumb uri={uri} width={240} height={96} layers={10} spread={1.2} />;
    return <Text style={textStyle}>{val || ''}</Text>;
  };

  const renderRow = (item, index) => (
    <View key={index} style={styles.row}>
      {adjustedHeaders.map(col => (
        <View key={col.key} style={[styles.cell, { width: col.width }]}>
          {(col.key === 'bakerSign' || col.key === 'supervisorSign') ? renderMaybeSignature(item[col.key], styles.inputText) : <Text style={styles.inputText}>{item[col.key]}</Text>}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerBox}>
          <View style={styles.headerTop}>
            <View style={styles.logoWrap}>
              <Image source={require('../../assets/logo.jpeg')} style={styles.logo} />
              <View>
                <Text style={styles.brand}>Bravo Brands Limited</Text>
                <Text style={styles.sub}>Food Safety Management System</Text>
              </View>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Issue Date: {metadata.issueDate}</Text>
            </View>
          </View>
          <View style={styles.subjectRow}><Text style={styles.subjectText}>Subject: BAKING CONTROL SHEET</Text></View>
          <View style={styles.signRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.metaSmall}>Compiled By:</Text>
              {renderMaybeSignature(metadata.compiledBy)}
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={styles.metaSmall}>Approved By:</Text>
              {renderMaybeSignature(metadata.approvedBy)}
            </View>
          </View>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>Note:</Text>
          <Text style={styles.noteText}>This form should be completed daily by both Baker Man and Supervisor. File this form as evidence of performing the controls.</Text>
        </View>

        {/* If exportingWide, disable horizontal scroll and shrink table to A4 width */}
        {exportingWide ? (
          <View style={[styles.tableWrap, { width: adjustedTableWidth }]}> 
            <View style={styles.tableHeader}>
              {adjustedHeaders.map(col => (
                <View key={col.key} style={[styles.headerCell, { width: col.width }]}>
                  <Text style={styles.headerText}>{col.label}</Text>
                </View>
              ))}
            </View>
            {formData.map(renderRow)}
          </View>
        ) : (
          <ScrollView horizontal contentContainerStyle={{ minWidth: tableWidth }}>
            <View style={[styles.tableWrap, { width: tableWidth }]}> 
              <View style={styles.tableHeader}>
                {columnHeaders.map(col => (
                  <View key={col.key} style={[styles.headerCell, { width: col.width }]}>
                    <Text style={styles.headerText}>{col.label}</Text>
                  </View>
                ))}
              </View>
              {formData.map(renderRow)}
            </View>
          </ScrollView>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f7f9' },
  content: { padding: 12 },
  headerBox: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e6eef2', marginBottom: 12 },
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
  noteBox: { backgroundColor: '#fff9f0', borderRadius: 6, padding: 10, borderWidth: 1, borderColor: '#f0d9b5', marginBottom: 12 },
  noteTitle: { fontWeight: '700', marginBottom: 4 },
  noteText: { fontSize: 12, color: '#444' },
  tableWrap: { backgroundColor: '#fff', borderRadius: 6, borderWidth: 1.5, borderColor: '#333', overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f5f7', borderBottomWidth: 1.5, borderColor: '#333' },
  headerCell: { padding: 8, borderRightWidth: 1.2, borderRightColor: '#333' },
  headerText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', borderBottomWidth: 1.2, borderColor: '#333' },
  cell: { padding: 6, borderRightWidth: 1.2, borderRightColor: '#333' },
  inputText: { padding: 8, fontSize: 12, textAlign: 'left', minHeight: 48, lineHeight: 18 },
});

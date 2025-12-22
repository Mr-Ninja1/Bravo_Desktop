import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

const normalizeSignature = (v) => {
  if (!v) return null;
  if (typeof v !== 'string') return null;
  if (v.startsWith('data:')) return v;
  const compact = v.replace(/\s+/g, '');
  if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
};

const renderSignature = (val, textStyle = {}, thumbProps = {}) => {
  const uri = normalizeSignature(val);
  if (uri) return <SignatureThumb uri={uri} {...thumbProps} />;
  return <Text style={textStyle}>{val || ''}</Text>;
};

/**
 * Read-only presentational renderer for Products Net Content Checklist saved payloads.
 * Expects payload to contain: metadata, formData (array), layoutHints, assets.logoDataUri
 */
const ProductsNetContentChecklistPresentational = ({ payload }) => {
  const p = payload || {};
  const metadata = p.metadata || {};
  const formData = Array.isArray(p.formData) ? p.formData : [];
  const verification = p.verification || {};
  const layoutHints = p.layoutHints || { name: 3, date: 1, expectedWeight: 2, weight1: 1, weight2: 1, weight3: 1, weight4: 1, weight5: 1 };

  const cols = [
    { key: 'name', label: 'NAME OF PRODUCT', flex: layoutHints.name || 3 },
    { key: 'date', label: 'DATE', flex: layoutHints.date || 1 },
    { key: 'expectedWeight', label: 'EXPECTED WEIGHT (g)', flex: layoutHints.expectedWeight || 2 },
    { key: 'weight1', label: 'W1', flex: layoutHints.weight1 || 1 },
    { key: 'weight2', label: 'W2', flex: layoutHints.weight2 || 1 },
    { key: 'weight3', label: 'W3', flex: layoutHints.weight3 || 1 },
    { key: 'weight4', label: 'W4', flex: layoutHints.weight4 || 1 },
    { key: 'weight5', label: 'W5', flex: layoutHints.weight5 || 1 },
  ];

  const assets = p.assets || {};

  // Calculate a rough width so horizontal ScrollView gives reasonable spacing
  const roughWidth = Object.values(layoutHints).reduce((s, v) => s + (v || 0) * 80, 200);

  return (
    <ScrollView horizontal contentContainerStyle={{ padding: 12 }}>
      <View style={[styles.container, { width: roughWidth }]}> 
        {/* Top header: bordered bar with logo/company on left and issue date/page on right */}
        <View style={styles.topHeaderBar}>
          <View style={styles.topLeft}> 
            {assets.logoDataUri ? (
              <Image source={{ uri: assets.logoDataUri }} style={styles.logo} />
            ) : (
              <Image source={require('../../assets/logo.jpeg')} style={styles.logo} />
            )}
            <View style={styles.brandWrap}>
              <Text style={styles.brand}>BRAVO BRANDS LIMITED</Text>
              <Text style={styles.brandSub}>Food Safety Management System</Text>
            </View>
          </View>
          <View style={styles.topRight}>
            <Text style={styles.issueDate}>Issue Date: {metadata.issueDate || (p.savedAt ? new Date(p.savedAt).toLocaleDateString() : '')}</Text>
            <Text style={styles.page}>Page 1 of 1</Text>
          </View>
        </View>

        <View style={styles.headerBox}>
          <Text style={styles.subject}><Text style={{fontWeight:'700'}}>Subject:</Text> PRODUCTS NET CONTENT CHECKLIST</Text>
          <Text style={styles.savedAt}>Saved: {p.savedAt ? new Date(p.savedAt).toLocaleString() : ''}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaLeft}>Compiled By: {metadata.compiledBy || ''}</Text>
            <Text style={styles.metaRight}>Approved By: {metadata.approvedBy || ''}</Text>
          </View>
        </View>

        <View style={styles.tableWrap}>
          <View style={styles.tableHeader}>
            {cols.map(col => (
              <View key={col.key} style={[styles.headerCell, { flex: col.flex }]}>
                <Text style={styles.headerText}>{col.label}</Text>
              </View>
            ))}
          </View>

          {formData.length === 0 ? (
            <View style={styles.emptyRow}><Text style={styles.emptyText}>No entries</Text></View>
          ) : (
            formData.map((item, idx) => {
              const rowObj = (item && typeof item === 'object') ? item : { value: item };
              return (
                <View key={idx} style={styles.row}>
                  {cols.map(col => {
                    const raw = rowObj[col.key];
                    const text = raw === undefined || raw === null ? (rowObj.value ?? '') : raw;
                    return (
                      <View key={col.key} style={[styles.cell, { flex: col.flex }]}> 
                        <Text style={styles.cellText}>{String(text)}</Text>
                      </View>
                    );
                  })}
                </View>
              );
            })
          )}
        </View>

        <View style={styles.verifyFooter}>
          <View style={styles.verifyCol} />
          <View style={styles.verifyCol}>
            <View style={{ marginBottom: 6 }}>
              <Text style={{ fontWeight: '700' }}>Supervisor</Text>
              {renderSignature(verification.supervisorSign || verification.supervisor || '', styles.verifyValue, { width: 160, height: 44 })}
            </View>
            <View style={{ marginBottom: 6 }}>
              <Text style={{ fontWeight: '700' }}>HSEQ Manager</Text>
              {renderSignature(verification.hseqManagerSign || verification.hseqManager || '', styles.verifyValue, { width: 160, height: 44 })}
            </View>
            <View style={{ marginBottom: 6 }}>
              <Text style={{ fontWeight: '700' }}>Complex Manager</Text>
              {renderSignature(verification.complexManagerSign || verification.complexManager || '', styles.verifyValue, { width: 160, height: 44 })}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff' },
  headerBox: { alignItems: 'flex-start', marginBottom: 12, paddingTop: 8 },
  topHeaderBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#000', padding: 6, marginBottom: 8 },
  topLeft: { flexDirection: 'row', alignItems: 'center' },
  topRight: { alignItems: 'flex-end' },
  logo: { width: 44, height: 44, marginRight: 10 },
  brandWrap: { flexDirection: 'column' },
  brand: { fontSize: 14, fontWeight: '800', color: '#185a9d' },
  brandSub: { fontSize: 11, color: '#333' },
  title: { fontWeight: '800', fontSize: 18, color: '#222', textAlign: 'left', marginBottom: 4 },
  subject: { fontSize: 16, marginBottom: 6 },
  savedAt: { fontSize: 12, color: '#666', marginBottom: 6 },
  meta: { fontSize: 12, color: '#555', marginBottom: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 6 },
  metaLeft: { fontSize: 12 },
  metaRight: { fontSize: 12 },
  issueDate: { fontSize: 12 },
  page: { fontSize: 10, marginTop: 4 },
  tableWrap: { borderWidth: 1, borderColor: '#333', borderRadius: 4, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f5f7', borderBottomWidth: 1, borderColor: '#333' },
  headerCell: { padding: 8, borderRightWidth: 1, borderRightColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  headerText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee', minHeight: 44 },
  cell: { padding: 8, borderRightWidth: 1, borderRightColor: '#eee', justifyContent: 'center' },
  cellText: { fontSize: 12 },
  emptyRow: { padding: 12, alignItems: 'center' },
  emptyText: { color: '#666' },
  verifyFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  verifyCol: { flex: 1 },
  verifyLabel: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  verifyValue: { fontSize: 12, marginBottom: 6 },
});

export default ProductsNetContentChecklistPresentational;

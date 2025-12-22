import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

const normalizeSignature = (v) => {
  if (!v) return null;
  // already a data uri
  if (typeof v === 'string') {
    if (v.startsWith('data:')) return v;
    const compact = v.replace(/\s+/g, '');
    if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
    return null;
  }
  // object shaped signature (uri, data, signature, base64)
  if (typeof v === 'object') {
    if (v.uri && typeof v.uri === 'string') return v.uri;
    if (v.data && typeof v.data === 'string') return v.data.startsWith('data:') ? v.data : `data:image/png;base64,${v.data}`;
    if (v.signature && typeof v.signature === 'string') return v.signature.startsWith('data:') ? v.signature : `data:image/png;base64,${v.signature}`;
    if (v.base64 && typeof v.base64 === 'string') return `data:image/png;base64,${v.base64}`;
  }
  return null;
};

const renderSignature = (val, textStyle = {}, thumbProps = {}) => {
  const uri = normalizeSignature(val);
  if (uri) return <SignatureThumb uri={uri} {...thumbProps} />;
  return null; // no fallback text — render only the thumbnail when present
};

const WEEK_DAYS = ['Sun','Mon','Tue','Wed','Thurs','Fri','Sat'];

export default function SculleryArea_CleaningChecklistPresentational({ payload }) {
  if (!payload) return null;
  const { metadata = {}, formData = [], layoutHints = {}, _tableWidth } = payload;
  const COL = {
    AREA: layoutHints?.area || 260,
    FREQUENCY: layoutHints?.frequency || 150,
    DAY_GROUP_WIDTH: layoutHints?.dayGroup || 140,
    CHECK: layoutHints?.checkWidth || 40,
    CLEANED_BY: layoutHints?.cleanedByWidth || 100,
  };
  const tableWidth = _tableWidth || (COL.AREA + COL.FREQUENCY + WEEK_DAYS.length * COL.DAY_GROUP_WIDTH);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Image source={require('../../assets/logo.jpeg')} style={styles.brandLogo} />
              <View style={{ flex: 1 }}>
                <Text style={styles.brandName}>Bravo! Food Safety Inspections</Text>
                <Text style={styles.brandSub}>Bravo Brands Central</Text>
              </View>
            </View>
            <View style={styles.headerMeta}>
              <Text style={styles.docText}>Issue Date: {metadata.issueDate || ''}</Text>
              <Text style={styles.docText}>Page 1 of 1</Text>
            </View>
            <Text style={styles.mainTitle}>SCULLERY AREA CLEANING CHECKLIST</Text>
            <View style={styles.areaMetaRow}>
              <View style={[styles.metaField, { flex: 2 }]}>
                <Text style={styles.metaLabel}>LOCATION:</Text>
                <Text style={styles.metaValue}>{metadata.location || 'SCULLERY'}</Text>
              </View>
              <View style={styles.metaField}>
                <Text style={styles.metaLabel}>WEEK:</Text>
                <Text style={styles.metaValue}>{metadata.week || ''}</Text>
              </View>
              <View style={styles.metaField}>
                <Text style={styles.metaLabel}>MONTH:</Text>
                <Text style={styles.metaValue}>{metadata.month || ''}</Text>
              </View>
              <View style={styles.metaField}>
                <Text style={styles.metaLabel}>YEAR:</Text>
                <Text style={styles.metaValue}>{metadata.year || ''}</Text>
              </View>
            </View>
            <Text style={styles.areaTitle}>SCULLERY AREA</Text>
          </View>

          <View style={styles.verificationRow}>
            <View style={{ flex: 1 }}>
                <Text style={styles.verificationLabel}>Verified By: HSEQ Manager:</Text>
                {(() => {
                  const v = metadata.hseqSign || metadata.hseqManagerSign || metadata.hseqManagerSignature || metadata.hseqManager || '';
                  return renderSignature(v, styles.verificationValue, { width: 220, height: 44 });
                })()}
              </View>
          </View>

          <ScrollView horizontal style={styles.tableScroll}>
            <View style={{ width: tableWidth }}>
              <View style={styles.headerRow}>
                <View style={[styles.headerCell, { width: COL.AREA, height: 40 }]}>
                  <Text style={styles.headerText}>Area to be cleaned</Text>
                </View>
                <View style={[styles.headerCell, { width: COL.FREQUENCY, height: 40 }]}>
                  <Text style={styles.headerText}>Frequency (Per Week)</Text>
                </View>
                {WEEK_DAYS.map(day => (
                  <View key={day} style={[styles.dayHeaderGroup, { width: COL.DAY_GROUP_WIDTH }]}>
                    <View style={[styles.headerCell, { width: COL.CHECK, height: 40, borderBottomWidth: 0, borderRightWidth: 0 }]}>
                      <Text style={styles.headerText}>{day}</Text>
                    </View>
                    <View style={[styles.headerCell, { width: COL.CLEANED_BY, height: 40, borderLeftWidth: 1, borderLeftColor: '#1F2937', borderBottomWidth: 0 }]}>
                      <Text style={styles.headerText}>Cleaned BY</Text>
                    </View>
                  </View>
                ))}
              </View>

              {Array.isArray(formData) && formData.map(row => (
                <View key={row.id || `${row.area}-${row.name}`} style={styles.row}>
                  <View style={[styles.cell, { width: COL.AREA }, styles.leftContent]}>
                    <Text style={styles.equipmentText}>{row.name}</Text>
                  </View>
                  <View style={[styles.cell, { width: COL.FREQUENCY }, styles.centerContent]}>
                    <Text style={styles.equipmentText}>{row.frequency}</Text>
                  </View>
                  {WEEK_DAYS.map(d => (
                    <View key={`${row.id || row.name}-${d}`} style={[styles.dayGroupCell, { width: COL.DAY_GROUP_WIDTH }]}>
                      <View style={[styles.cell, styles.centerContent, { width: COL.CHECK }]}>
                        <Text style={styles.checkText}>{row.checks?.[d]?.checked ? '✓' : ''}</Text>
                      </View>
                      <View style={[styles.cell, styles.centerContent, { width: COL.CLEANED_BY }]}>
                        <Text style={styles.equipmentText}>{row.checks?.[d]?.cleanedBy || ''}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={{ height: 12 }} />
          <View style={styles.signaturesRow}>
              <View style={styles.signatureCell}>
                <Text style={styles.signatureLabel}>Approved By:</Text>
                {renderSignature(metadata.approvedBySignature || metadata.approvedBy || metadata.approvedBySign || '', styles.signatureValue, { width: 220, height: 48 })}
              </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, borderColor: '#1F2937', borderWidth: 1 },
  header: { borderBottomColor: '#1F2937', borderBottomWidth: 1, paddingBottom: 10, marginBottom: 10 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  brandLogo: { width: 56, height: 56, marginRight: 12, borderRadius: 8, backgroundColor: '#fff' },
  brandName: { fontSize: 16, fontWeight: '700', color: '#185a9d' },
  brandSub: { fontSize: 12, color: '#43cea2' },
  headerMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  docText: { fontSize: 10, color: '#6B7280' },
  mainTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937', textAlign: 'center', marginBottom: 10 },
  areaMetaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 15, borderWidth: 1, borderColor: '#1F2937' },
  metaField: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 100, paddingVertical: 4, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#1F2937' },
  metaLabel: { fontSize: 11, fontWeight: '600', color: '#4B5563', marginRight: 4 },
  metaValue: { fontSize: 12, color: '#1F2937' },
  areaTitle: { fontSize: 14, fontWeight: '700', marginTop: 8, color: '#1F2937' },
  verificationRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#1F2937', marginBottom: 10, backgroundColor: '#E5E7EB', padding: 8 },
  verificationLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4, color: '#1F2937' },
  verificationValue: { fontSize: 14, color: '#1F2937' },
  tableScroll: { borderRadius: 4, borderWidth: 1, borderColor: '#1F2937' },
  headerRow: { flexDirection: 'row', backgroundColor: '#F3F4F6', minHeight: 40, borderBottomWidth: 2, borderBottomColor: '#1F2937' },
  headerCell: { padding: 5, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#1F2937' },
  headerText: { fontSize: 11, fontWeight: '700', color: '#000000', textAlign: 'center' },
  dayHeaderGroup: { flexDirection: 'row', borderRightWidth: 1, borderRightColor: '#1F2937' },
  row: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#4B5563', minHeight: 40 },
  dayGroupCell: { flexDirection: 'row', borderRightWidth: 1, borderRightColor: '#4B5563' },
  cell: { paddingHorizontal: 4, paddingVertical: 6, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#4B5563', minHeight: 40 },
  leftContent: { alignItems: 'flex-start' },
  centerContent: { alignItems: 'center' },
  equipmentText: { fontSize: 12, color: '#1F2937' },
  checkText: { fontSize: 14, color: '#10B981', fontWeight: '700' },
  signaturesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  signatureCell: { flex: 1, padding: 8 },
  signatureLabel: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  signatureValue: { fontSize: 14, color: '#1F2937', marginTop: 6 }
});

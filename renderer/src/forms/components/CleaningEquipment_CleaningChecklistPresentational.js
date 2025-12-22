import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

function normalizeSignature(v) {
  if (!v && v !== '') return null;
  // support object-shaped signatures saved as { uri } or { data }
  if (v && typeof v === 'object') {
    const maybe = v.uri || v.data || v.base64 || v.signature || v.dataUri;
    if (!maybe || typeof maybe !== 'string') return null;
    const s = maybe.trim();
    if (!s) return null;
    if (s.indexOf('data:') >= 0) return s;
    const compact = s.replace(/\s+/g, '');
    if (/^[A-Za-z0-9+/=]+$/.test(compact) && compact.length > 100) return `data:image/png;base64,${compact}`;
    return null;
  }

  const str = String(v).trim();
  if (!str) return null;
  if (str.indexOf('data:') >= 0) return str;
  const compact = str.replace(/\s+/g, '');
  if (/^[A-Za-z0-9+/=]+$/.test(compact) && compact.length > 100) return `data:image/png;base64,${compact}`;
  return null;
}

function renderMaybeSignature(v, style = {}) {
  const uri = normalizeSignature(v);
  if (uri) return <SignatureThumb uri={uri} style={style} />;
  return <Text>{v || ''}</Text>;
}

function renderSignatureOnly(v, style = {}) {
  const uri = normalizeSignature(v);
  if (uri) return <SignatureThumb uri={uri} style={style} />;
  // explicitly render nothing if no signature available
  return null;
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat'];

// A4 width in pixels at 96dpi: ~794
const A4_WIDTH = 794;

export default function CleaningEquipment_CleaningChecklistPresentational({ payload, exportingWide = false }) {
  if (!payload) return null;
  const meta = payload.metadata || {};
  const items = Array.isArray(payload.formData) ? payload.formData : (payload.formData?.items || []);

  // Original column widths
  const areaColWidth = 260;
  const freqColWidth = 150;
  const checkColWidth = 40;
  const cleanedByColWidth = 100;
  // Total table width
  const tableWidth = areaColWidth + freqColWidth + WEEK_DAYS.length * (checkColWidth + cleanedByColWidth);

  // If exportingWide, shrink columns proportionally to fit A4
  let scale = 1;
  if (exportingWide && tableWidth > A4_WIDTH) {
    scale = A4_WIDTH / tableWidth;
  }
  const adjustedAreaCol = Math.round(areaColWidth * scale);
  const adjustedFreqCol = Math.round(freqColWidth * scale);
  const adjustedCheckCol = Math.round(checkColWidth * scale);
  const adjustedCleanedByCol = Math.round(cleanedByColWidth * scale);
  const adjustedTableWidth = exportingWide ? Math.round(tableWidth * scale) : tableWidth;


  // Helper style for export mode
  const exportA4Style = exportingWide ? { width: A4_WIDTH, maxWidth: A4_WIDTH, alignSelf: 'center' } : {};
  const scrollStyle = exportingWide ? { padding: 0, margin: 0, backgroundColor: '#fff' } : styles.scroll;
  const cardStyle = exportingWide ? { width: A4_WIDTH, maxWidth: A4_WIDTH, alignSelf: 'center', padding: 0, borderRadius: 0, borderWidth: 0, margin: 0, backgroundColor: '#fff' } : styles.card;

  return (
    <ScrollView contentContainerStyle={scrollStyle}>
      <View style={cardStyle}>
        <View style={[styles.headerTop, exportingWide ? { width: A4_WIDTH, maxWidth: A4_WIDTH } : {}]}>
          <View style={[styles.brandRow, exportingWide ? { width: A4_WIDTH, maxWidth: A4_WIDTH } : {}]}>
            <Image source={require('../../assets/logo.jpeg')} style={styles.brandLogo} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={styles.brandName}>Bravo! Food Safety Inspections</Text>
              <Text style={styles.brandSub}>Bravo Brands Central</Text>
            </View>
          </View>

          <View style={[styles.headerMeta, exportingWide ? { width: A4_WIDTH, maxWidth: A4_WIDTH } : {}]}>
            <Text style={styles.docText}>Issue Date: {meta.issueDate || ''}</Text>
            <Text style={styles.docText}>Page 1 of 1</Text>
          </View>

          <Text style={styles.mainTitle}>CLEANING EQUIPMENT CHECKLIST</Text>

          <View style={[styles.areaMetaRow, exportingWide ? { width: A4_WIDTH, maxWidth: A4_WIDTH } : {}]}>
            <View style={[styles.metaField, { flex: 2 }]}>
              <Text style={styles.metaLabel}>LOCATION:</Text>
              <Text style={styles.metaValue}>{meta.location || ''}</Text>
            </View>
            <View style={styles.metaField}>
              <Text style={styles.metaLabel}>WEEK:</Text>
              <Text style={styles.metaValue}>{meta.week || ''}</Text>
            </View>
            <View style={styles.metaField}>
              <Text style={styles.metaLabel}>MONTH:</Text>
              <Text style={styles.metaValue}>{meta.month || ''}</Text>
            </View>
            <View style={styles.metaField}>
              <Text style={styles.metaLabel}>YEAR:</Text>
              <Text style={styles.metaValue}>{meta.year || ''}</Text>
            </View>
          </View>

          <Text style={styles.areaTitle}>CLEANING EQUIPMENT</Text>

          <View style={[styles.verificationRow, exportingWide ? { width: A4_WIDTH, maxWidth: A4_WIDTH } : {}]}>
            <View style={styles.verificationCell}>
              <Text style={styles.verificationLabel}>Verified By: HSEQ Manager:</Text>
              {renderSignatureOnly(meta.hseqSign || meta.hseqManager || '', { width: 240, height: 60 })}
            </View>
            <View style={styles.verificationCell}>
              <Text style={styles.verificationLabel}>Approved By:</Text>
              {renderSignatureOnly(meta.approvedBySign || meta.approvedBy || '', { width: 240, height: 60 })}
            </View>
          </View>
        </View>

        {/* If exportingWide, disable horizontal scroll and shrink table to A4 width */}
        {exportingWide ? (
          <View style={[styles.tableScroll, { width: adjustedTableWidth }]}> 
            <View style={styles.tableHeader}>
              <View style={[styles.cell, { width: adjustedAreaCol }]}><Text style={styles.headerText}>Equipment</Text></View>
              <View style={[styles.cell, { width: adjustedFreqCol }]}><Text style={styles.headerText}>Frequency</Text></View>
              {WEEK_DAYS.map(d => (
                <View key={d} style={styles.dayGroup}>
                  <View style={[styles.cell, { width: adjustedCheckCol }]}><Text style={styles.headerText}>{d}</Text></View>
                  <View style={[styles.cell, { width: adjustedCleanedByCol }]}><Text style={styles.headerText}>Cleaned BY</Text></View>
                </View>
              ))}
            </View>

            {items.map(item => (
              <View key={item.id || item.name} style={styles.row}>
                <View style={[styles.cell, { width: adjustedAreaCol }]}><Text style={styles.cellText}>{item.name}</Text></View>
                <View style={[styles.cell, { width: adjustedFreqCol }]}><Text style={styles.cellText}>{item.frequency || ''}</Text></View>
                {WEEK_DAYS.map(day => (
                  <View key={`${item.id || item.name}-${day}`} style={styles.dayGroup}>
                    <View style={[styles.cell, { width: adjustedCheckCol }]}><Text style={styles.cellText}>{item.checks?.[day]?.checked ? '✓' : ''}</Text></View>
                    <View style={[styles.cell, { width: adjustedCleanedByCol }]}><Text style={styles.cellText}>{item.checks?.[day]?.cleanedBy || ''}</Text></View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : (
          <ScrollView horizontal style={styles.tableScroll}>
            <View>
              <View style={styles.tableHeader}>
                <View style={[styles.cell, styles.areaCol]}><Text style={styles.headerText}>Equipment</Text></View>
                <View style={[styles.cell, styles.freqCol]}><Text style={styles.headerText}>Frequency</Text></View>
                {WEEK_DAYS.map(d => (
                  <View key={d} style={styles.dayGroup}>
                    <View style={[styles.cell, styles.checkCol]}><Text style={styles.headerText}>{d}</Text></View>
                    <View style={[styles.cell, styles.cleanedByCol]}><Text style={styles.headerText}>Cleaned BY</Text></View>
                  </View>
                ))}
              </View>

              {items.map(item => (
                <View key={item.id || item.name} style={styles.row}>
                  <View style={[styles.cell, styles.areaCol]}><Text style={styles.cellText}>{item.name}</Text></View>
                  <View style={[styles.cell, styles.freqCol]}><Text style={styles.cellText}>{item.frequency || ''}</Text></View>
                  {WEEK_DAYS.map(day => (
                    <View key={`${item.id || item.name}-${day}`} style={styles.dayGroup}>
                      <View style={[styles.cell, styles.checkCol]}><Text style={styles.cellText}>{item.checks?.[day]?.checked ? '✓' : ''}</Text></View>
                      <View style={[styles.cell, styles.cleanedByCol]}><Text style={styles.cellText}>{item.checks?.[day]?.cleanedBy || ''}</Text></View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 8 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#1F2937' },
  headerTop: { marginBottom: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  brandLogo: { width: 56, height: 56, marginRight: 12, borderRadius: 8, backgroundColor: '#fff' },
  brandName: { fontSize: 16, fontWeight: '700', color: '#185a9d' },
  brandSub: { fontSize: 12, color: '#43cea2' },
  headerMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  docText: { fontSize: 10, color: '#6B7280' },
  mainTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937', textAlign: 'center', marginBottom: 10 },
  areaMetaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8, borderWidth: 1, borderColor: '#1F2937' },
  metaField: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 100, paddingVertical: 4, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#1F2937' },
  metaLabel: { fontSize: 11, fontWeight: '600', color: '#4B5563', marginRight: 4 },
  metaValue: { fontSize: 13, color: '#111827' },
  verificationRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#1F2937', marginBottom: 10, backgroundColor: '#E5E7EB' },
  verificationCell: { padding: 8, borderRightWidth: 1, borderRightColor: '#1F2937' },
  verificationLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4, color: '#1F2937' },
  tableScroll: { borderWidth: 1, borderColor: '#1F2937', borderRadius: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', paddingVertical: 6, alignItems: 'center' },
  headerText: { color: '#111827', fontWeight: '700', textAlign: 'center', fontSize: 11 },
  cell: { padding: 6, borderRightWidth: 1, borderRightColor: '#1F2937', justifyContent: 'center' },
  areaCol: { width: 260 },
  freqCol: { width: 150 },
  dayGroup: { flexDirection: 'row' },
  checkCol: { width: 40, alignItems: 'center', justifyContent: 'center' },
  cleanedByCol: { width: 100, paddingLeft: 6 },
  sectionHeader: { backgroundColor: '#F3F4F6', padding: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  sectionHeaderText: { fontSize: 13, fontWeight: '700' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', alignItems: 'center' },
  cellText: { fontSize: 12, color: '#111827' },
});

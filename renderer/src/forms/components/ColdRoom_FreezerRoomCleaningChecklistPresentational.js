import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';


export const EXPORT_KEY = 'cold_room_freezer_room_cleaning_checklist';
function normalizeSignature(v) {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (s.startsWith('data:')) return s;
  if (s.startsWith('http:') || s.startsWith('https:') || s.startsWith('file:') || s.startsWith('blob:')) return s;
  const compact = s.replace(/\s+/g, '');
  const base64ish = /^[A-Za-z0-9+/=]+$/;
  if (compact.length > 100 && base64ish.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
}

function renderMaybeSignature(v, opts = {}) {
  const uri = normalizeSignature(v);
  const { width, height } = opts || {};
  if (uri) return <SignatureThumb uri={uri} width={width} height={height} />;
  return <Text style={styles.signatureValueText}>{v || ''}</Text>;
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];

export default function ColdRoom_FreezerRoomCleaningChecklistPresentational({ payload }) {
  if (!payload) return null;

  // New column widths to match the interactive form
  const AREA = 220;
  const FREQ = 80;
  const DAY_GROUP = 240; 
  const CHECK = 40;
  const NAME = 90;
  const SUP_SIGN = 110;

  const TABLE_WIDTH = AREA + FREQ + (WEEK_DAYS.length * DAY_GROUP);
  const rows = payload.formData || [];
  const metadata = payload.metadata || {};

  return (
    <ScrollView contentContainerStyle={{ padding: 8 }}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image source={require('../../assets/logo.jpeg')} style={styles.brandLogo} />
          <View style={{ flex: 1 }}>
            <Text style={styles.brandName}>Bravo! Food Safety Inspections</Text>
            <Text style={styles.brandSub}>Bravo Brands Central</Text>
          </View>
        </View>
        <View style={styles.headerMeta}>
          <Text style={styles.docText}>Doc No: BBN-SHEQ-P-16-R-11b</Text>
          <Text style={styles.docText}>Page 1 of 1</Text>
        </View>
        <Text style={styles.mainTitle}>{payload?.title || 'COLD ROOM & FREEZER ROOM CLEANING CHECKLIST'}</Text>
        
        <View style={styles.areaMetaRow}>
          <View style={[styles.metaField, { flex: 2 }]}>
            <Text style={styles.metaLabel}>LOCATION:</Text>
            <Text style={styles.metaValue}>{metadata.location || ''}</Text>
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
      </View>

      {/* MAIN TABLE */}
      <ScrollView horizontal contentContainerStyle={{ minWidth: TABLE_WIDTH }}>
        <View style={styles.table}>
          {/* TABLE HEADER */}
          <View style={styles.headerRow}>
            <View style={[styles.headerCell, { width: AREA }]}><Text style={styles.headerText}>Area to be cleaned</Text></View>
            <View style={[styles.headerCell, { width: FREQ }]}><Text style={styles.headerText}>Freq</Text></View>
            {WEEK_DAYS.map(day => (
              <View key={day} style={[styles.dayHeaderGroup, { width: DAY_GROUP }]}>
                <Text style={styles.headerText}>{day}</Text>
                <View style={styles.subHeaderRow}>
                  <Text style={[styles.subHeaderText, { width: CHECK }]}>✓</Text>
                  <Text style={[styles.subHeaderText, { width: NAME }]}>Cleaned By</Text>
                  <Text style={[styles.subHeaderText, { width: SUP_SIGN, borderRightWidth: 0 }]}>SUP SIGN</Text>
                </View>
              </View>
            ))}
          </View>

          {/* DATA ROWS */}
          {rows.map((r, idx) => (
            <View key={r.id || idx} style={styles.row}>
              <View style={[styles.cell, { width: AREA }]}><Text style={styles.equipmentText}>{r.name}</Text></View>
              <View style={[styles.cell, { width: FREQ, alignItems: 'center' }]}><Text style={styles.equipmentText}>{r.frequency}</Text></View>
              {WEEK_DAYS.map(day => {
                const c = r.checks?.[day] || { checked: false, cleanedBy: '', supSign: '' };
                return (
                  <View key={day} style={styles.dayGroupContainer}>
                    <View style={[styles.cell, { width: CHECK, borderRightWidth: 1, alignItems: 'center' }]}>
                      <Text style={styles.equipmentText}>{c.checked ? '✓' : ''}</Text>
                    </View>
                    <View style={[styles.cell, { width: NAME, borderRightWidth: 1 }]}>
                      <Text style={styles.equipmentText}>{c.cleanedBy}</Text>
                    </View>
                    <View style={[styles.cell, { width: SUP_SIGN, borderRightWidth: 0 }]}>
                      {renderMaybeSignature(c.supSign, { width: SUP_SIGN - 4, height: 35 })}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}

          {/* FOOTER SIGNATURE: HSEQ SIGN */}
          <View style={styles.footerSigRow}>
            <View style={[styles.cell, { width: AREA + FREQ, backgroundColor: '#f3f4f6' }]}>
              <Text style={styles.footerLabel}>HSEQ SIGN</Text>
            </View>
            {WEEK_DAYS.map(day => (
              <View key={day} style={styles.dayGroupContainer}>
                <View style={{ width: CHECK, borderRightWidth: 1, backgroundColor: '#f3f4f6', justifyContent: 'center' }}>
                  <Text style={styles.dayIndicator}>{day}</Text>
                </View>
                <View style={{ width: NAME + SUP_SIGN, justifyContent: 'center', paddingHorizontal: 2 }}>
                  {renderMaybeSignature(metadata.hseqDaySigns?.[day], { width: (NAME + SUP_SIGN) - 8, height: 45 })}
                </View>
              </View>
            ))}
          </View>

          {/* FOOTER SIGNATURE: COMPLEX MANAGER */}
          <View style={styles.footerSigRow}>
            <View style={[styles.cell, { width: AREA + FREQ, backgroundColor: '#f3f4f6' }]}>
              <Text style={styles.footerLabel}>COMPLEX MANAGER / FSC SIGN</Text>
            </View>
            {WEEK_DAYS.map(day => (
              <View key={day} style={styles.dayGroupContainer}>
                <View style={{ width: CHECK, borderRightWidth: 1, backgroundColor: '#f3f4f6', justifyContent: 'center' }}>
                  <Text style={styles.dayIndicator}>{day}</Text>
                </View>
                <View style={{ width: NAME + SUP_SIGN, justifyContent: 'center', paddingHorizontal: 2 }}>
                  {renderMaybeSignature(metadata.managerDaySigns?.[day], { width: (NAME + SUP_SIGN) - 8, height: 45 })}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { borderBottomWidth: 1, borderBottomColor: '#1F2937', paddingBottom: 8, marginBottom: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  brandLogo: { width: 56, height: 56, marginRight: 12 },
  brandName: { fontSize: 16, fontWeight: '700', color: '#185a9d' },
  brandSub: { fontSize: 12, color: '#43cea2' },
  headerMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  docText: { fontSize: 10, color: '#6B7280' },
  mainTitle: { fontSize: 16, fontWeight: '800', color: '#1F2937', textAlign: 'center', marginBottom: 10 },
  areaMetaRow: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: '#1F2937' },
  metaField: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 100, padding: 4, borderRightWidth: 1, borderRightColor: '#1F2937' },
  metaLabel: { fontSize: 10, fontWeight: '600', color: '#4B5563', marginRight: 4 },
  metaValue: { fontSize: 11, color: '#1F2937' },
  table: { borderWidth: 1, borderColor: '#1F2937' },
  headerRow: { flexDirection: 'row', backgroundColor: '#6B7280' },
  headerCell: { padding: 5, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#1F2937' },
  headerText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  dayHeaderGroup: { borderRightWidth: 1, borderRightColor: '#1F2937', alignItems: 'center' },
  subHeaderRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#fff' },
  subHeaderText: { color: '#fff', fontSize: 9, textAlign: 'center', paddingVertical: 4, borderRightWidth: 1, borderRightColor: '#fff' },
  row: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#4B5563', minHeight: 40 },
  cell: { padding: 4, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#4B5563' },
  dayGroupContainer: { flexDirection: 'row', borderRightWidth: 1, borderRightColor: '#4B5563' },
  equipmentText: { fontSize: 11, color: '#1F2937' },
  footerSigRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 60 },
  footerLabel: { fontSize: 9, fontWeight: 'bold', textAlign: 'right', paddingRight: 10, flex: 1 },
  dayIndicator: { fontSize: 8, textAlign: 'center', fontWeight: 'bold', color: '#666' },
  signatureValueText: { fontSize: 10, color: '#1F2937' }
});
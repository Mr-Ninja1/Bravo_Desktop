import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat'];

export default function DryStoragePresentational({ payload }) {
  if (!payload) return null;
  const layout = payload.layoutHints || {};
  const AREA = layout.area || 260;
  const FREQUENCY = layout.frequency || 150;
  const DAY_GROUP = layout.dayGroup || 140;
  const CHECK = layout.checkWidth || 40;
  const CLEANED_BY = layout.cleanedByWidth || (DAY_GROUP - CHECK);
  const TABLE_WIDTH = payload._tableWidth || (AREA + FREQUENCY + WEEK_DAYS.length * DAY_GROUP);

  const rows = payload.formData || [];

  return (
    <ScrollView contentContainerStyle={{ padding: 8 }}>
        <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image source={require('../../assets/logo.jpeg')} style={styles.brandLogo} />
          <View style={{ flex: 1 }}>
            <Text style={styles.brandName}>Bravo! Food Safety Inspections</Text>
            <Text style={styles.brandSub}>Bravo Brands Central</Text>
          </View>
        </View>
        <View style={styles.headerMeta}>
          <Text style={styles.docText}>Issue Date: {payload?.date || ''}</Text>
          <Text style={styles.docText}>Page 1 of 1</Text>
        </View>
        <Text style={styles.mainTitle}>{payload?.title || 'DRY STORAGE AREA CLEANING CHECKLIST'}</Text>
        {/* metadata row: Location / Week / Month / Year */}
        <View style={styles.areaMetaRow}>
          <View style={[styles.metaField, { flex: 2 }]}> 
            <Text style={styles.metaLabel}>LOCATION:</Text>
            <Text style={styles.metaValue}>{payload?.metadata?.location || ''}</Text>
          </View>
          <View style={styles.metaField}>
            <Text style={styles.metaLabel}>WEEK:</Text>
            <Text style={styles.metaValue}>{payload?.metadata?.week || ''}</Text>
          </View>
          <View style={styles.metaField}>
            <Text style={styles.metaLabel}>MONTH:</Text>
            <Text style={styles.metaValue}>{payload?.metadata?.month || ''}</Text>
          </View>
          <View style={styles.metaField}>
            <Text style={styles.metaLabel}>YEAR:</Text>
            <Text style={styles.metaValue}>{payload?.metadata?.year || ''}</Text>
          </View>
        </View>
        <Text style={styles.areaTitle}>WAREHOUSE AREA</Text>
        {/* verification / HSEQ Manager */}
        <View style={styles.verificationRowView}>
          <Text style={styles.verificationLabel}>Verified By: HSEQ Manager:</Text>
          {(() => {
            const v = payload?.metadata?.hseqSign || payload?.metadata?.hseqManagerSign || payload?.metadata?.hseqManager || null;
            const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
            return uri ? <SignatureThumb uri={uri} width={200} height={60} layers={6} spread={1.0} /> : <Text style={styles.verificationValue}>{payload?.metadata?.hseqManager || ''}</Text>;
          })()}
        </View>
      </View>

      <ScrollView horizontal contentContainerStyle={{ minWidth: TABLE_WIDTH }}>
        <View style={styles.table}>
          <View style={styles.headerRow}>
            <View style={[styles.headerCell, { width: AREA }]}><Text style={styles.headerText}>Area to be cleaned</Text></View>
            <View style={[styles.headerCell, { width: FREQUENCY }]}><Text style={styles.headerText}>Frequency (Per Week)</Text></View>
            {WEEK_DAYS.map(d => (
              <View key={d} style={[styles.dayHeaderGroup, { width: DAY_GROUP }]}>
                <View style={[styles.headerCell, { width: CHECK }]}><Text style={styles.headerText}>{d}</Text></View>
                <View style={[styles.headerCell, { width: CLEANED_BY }]}><Text style={styles.headerText}>Cleaned BY</Text></View>
              </View>
            ))}
          </View>

          {(rows.length ? rows : payload?.formData || []).map((r, idx) => (
            <View key={r.id || idx} style={styles.row}>
              <View style={[styles.cell, { width: AREA }]}><Text style={styles.equipmentText}>{r.name}</Text></View>
              <View style={[styles.cell, { width: FREQUENCY }]}><Text style={styles.equipmentText}>{r.frequencyText || r.frequencyValue}</Text></View>
              {WEEK_DAYS.map(d => {
                const c = r.checks?.[d] || { checked: false, cleanedBy: '' };
                return (
                  <View key={d} style={{ flexDirection: 'row' }}>
                    <View style={[styles.cell, { width: CHECK }]}><Text style={styles.equipmentText}>{c.checked ? '✓' : ''}</Text></View>
                    <View style={[styles.cell, { width: CLEANED_BY }]}><Text style={[styles.equipmentText, { textAlign: 'left' }]}>{c.cleanedBy}</Text></View>
                  </View>
                );
              })}
            </View>
          ))}
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
  mainTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937', textAlign: 'center', marginBottom: 10 },
  areaMetaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8, borderWidth: 1, borderColor: '#1F2937' },
  metaField: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 100, paddingVertical: 4, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#1F2937' },
  metaLabel: { fontSize: 11, fontWeight: '600', color: '#4B5563', marginRight: 4 },
  metaValue: { fontSize: 12, color: '#1F2937' },
  areaTitle: { fontSize: 12, fontWeight: '700', marginTop: 6, marginBottom: 6 },
  verificationRowView: { marginTop: 6, padding: 6, borderWidth: 1, borderColor: '#1F2937', backgroundColor: '#E5E7EB' },
  verificationLabel: { fontSize: 12, fontWeight: '600', color: '#1F2937' },
  verificationValue: { fontSize: 12, marginTop: 4 },
  table: { borderWidth: 1, borderColor: '#1F2937' },
  headerRow: { flexDirection: 'row', backgroundColor: '#F3F4F6', minHeight: 40, borderBottomWidth: 2, borderBottomColor: '#1F2937' },
  headerCell: { padding: 5, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#1F2937' },
  headerText: { fontSize: 11, fontWeight: '700', color: '#000000', textAlign: 'center' },
  dayHeaderGroup: { flexDirection: 'row', borderRightWidth: 1, borderRightColor: '#1F2937' },
  row: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#4B5563', minHeight: 40 },
  cell: { paddingHorizontal: 4, paddingVertical: 6, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#4B5563', minHeight: 40 },
  equipmentText: { fontSize: 12, color: '#1F2937' },
});

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

function normalizeSignature(v) {
  if (!v) return null;
  if (String(v).startsWith('data:')) return v;
  const compact = String(v).replace(/\s+/g, '');
  if (compact.length > 200) return `data:image/png;base64,${compact}`;
  return null;
}

function renderMaybeSignature(v, style = {}) {
  const uri = normalizeSignature(v);
  if (uri) return <SignatureThumb uri={uri} style={style} />;
  return <Text>{v || ''}</Text>;
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat'];

export default function ColdRoom_FreezerRoomCleaningChecklistPresentational({ payload }) {
  if (!payload) return null;
  const layout = payload.layoutHints || {};
  const AREA = layout.area || 300;
  const FREQUENCY = layout.frequency || 150;
  const DAY_GROUP = layout.dayGroup || 150;
  const CHECK = layout.checkWidth || 60;
  const CLEANED_BY = layout.cleanedByWidth || 90;
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
          <Text style={styles.docText}>Doc No: {payload?.metadata?.docNo || 'BBN-SHEQ-P-XX'} | Issue Date: {payload?.date || ''}</Text>
          <Text style={styles.docText}>Page 1 of 1</Text>
        </View>
        <Text style={styles.mainTitle}>{payload?.title || 'COLD ROOM & FREEZER ROOM CLEANING CHECKLIST'}</Text>
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
        <Text style={styles.areaTitle}>COLD ROOM / FREEZER ROOM</Text>
      </View>

      <View style={styles.verificationRowView}>
        <Text style={styles.verificationLabel}>Verified By: HSEQ Manager:</Text>
        {renderMaybeSignature(payload?.metadata?.hseqSign || payload?.metadata?.hseqManager || '', { width: 240, height: 60 })}
      </View>

      <ScrollView horizontal contentContainerStyle={{ minWidth: TABLE_WIDTH }}>
        <View style={styles.table}>
          <View style={styles.headerRow}>
            <View style={[styles.headerCell, { width: AREA }]}><Text style={styles.headerText}>Area to be cleaned</Text></View>
            <View style={[styles.headerCell, { width: FREQUENCY }]}><Text style={styles.headerText}>Frequency</Text></View>
            {WEEK_DAYS.map(d => (
              <View key={d} style={[styles.dayHeaderGroup, { width: DAY_GROUP }]}>
                <View style={[styles.headerCell, { width: CHECK }]}><Text style={styles.headerText}>{d}</Text></View>
                <View style={[styles.headerCell, { width: CLEANED_BY }]}><Text style={styles.headerText}>Cleaned BY</Text></View>
              </View>
            ))}
          </View>

          {(rows.length ? rows : []).map((r, idx) => (
            <View key={r.id || idx} style={styles.row}>
              <View style={[styles.cell, { width: AREA }]}><Text style={styles.equipmentText}>{r.name}</Text></View>
              <View style={[styles.cell, { width: FREQUENCY }]}><Text style={styles.equipmentText}>{r.frequency}</Text></View>
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

      <View style={{ height: 12 }} />
      <View style={styles.signaturesRow}>
        <View style={styles.signatureCell}>
          <Text style={styles.signatureLabel}>Approved By:</Text>
          {renderMaybeSignature(payload?.metadata?.approvedBySign || payload?.metadata?.approvedBy || '', { width: 220, height: 60 })}
        </View>
      </View>
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
  signaturesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  signatureCell: { flex: 1, padding: 8 },
  signatureLabel: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  signatureValue: { fontSize: 14, color: '#1F2937', marginTop: 6 }
});

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening'];

function normalizeSignature(val) {
  if (!val) return null;
  // already a data uri
  if (typeof val === 'string' && val.startsWith('data:')) return val;
  // object shaped
  if (typeof val === 'object') {
    if (val.uri && typeof val.uri === 'string') return val.uri;
    if (val.data && typeof val.data === 'string') return val.data.startsWith('data:') ? val.data : `data:image/png;base64,${val.data}`;
    if (val.signature && typeof val.signature === 'string') return val.signature.startsWith('data:') ? val.signature : `data:image/png;base64,${val.signature}`;
    if (val.base64 && typeof val.base64 === 'string') return `data:image/png;base64,${val.base64}`;
  }
  // legacy compact base64 string
  if (typeof val === 'string') {
    const compact = val.replace(/\s+/g, '');
    if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  }
  return null;
}

const A4_WIDTH = 794;
export default function WalkInChillerLogPresentational({ payload, exportingWide = false }) {
  if (!payload) return null;
  const layout = payload.layoutHints || {};
  const DATE = layout.DATE || 80;
  const RECORD_SLOT_WIDTH = layout.RECORD_SLOT_WIDTH || 300;
  const ACTION = layout.ACTION || 360;
  const SIGNATURE = layout.SIGNATURE || 200;
  const TABLE_WIDTH = payload._tableWidth || (DATE + (TIME_SLOTS.length * RECORD_SLOT_WIDTH) + ACTION + SIGNATURE);

  const rows = Array.isArray(payload.formData) ? payload.formData : [];
  let scale = 1;
  let adjustedTableWidth = TABLE_WIDTH;
  if (exportingWide && TABLE_WIDTH > A4_WIDTH) {
    scale = A4_WIDTH / TABLE_WIDTH;
    adjustedTableWidth = A4_WIDTH;
  }
  const exportA4Style = exportingWide ? { width: A4_WIDTH, maxWidth: A4_WIDTH, alignSelf: 'center' } : {};

  return (
    <ScrollView contentContainerStyle={exportingWide ? { padding: 0, margin: 0, backgroundColor: '#fff' } : { padding: 8 }}>
      <View style={[styles.header, exportA4Style]}>
        <View style={styles.brandRow}>
          <Image source={require('../../assets/logo.jpeg')} style={styles.brandLogo} />
          <View style={{ flex: 1 }}>
            <Text style={styles.brandName}>Bravo! Food Safety Inspections</Text>
            <Text style={styles.brandSub}>Bravo Brands Central</Text>
          </View>
          <View style={styles.issueDateBox}>
            <Text style={styles.issueDateText}>Issue Date: {payload.date}</Text>
          </View>
        </View>

        <View style={styles.areaMetaRow}>
          <View style={[styles.metaField, { flex: 2 }]}>
            <Text style={styles.metaLabel}>Month</Text>
            <Text style={styles.metaValue}>{payload?.metadata?.month || ''}</Text>
          </View>
          <View style={styles.metaField}>
            <Text style={styles.metaLabel}>Location</Text>
            <Text style={styles.metaValue}>{payload?.metadata?.location || ''}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.subject}>{payload.title}</Text>
      <Text style={styles.instruction}>Instruction: The temperature of the Walk-in Chiller should be between 0° C and 4° C</Text>

      {exportingWide ? (
        <View style={{ width: adjustedTableWidth }}>
          <View style={styles.headerRow}>
            <View style={[styles.headerCell, { width: DATE }]}><Text style={styles.headerText}>Date</Text></View>
            {TIME_SLOTS.map(slot => (
              <View key={slot} style={[styles.headerCell, { width: RECORD_SLOT_WIDTH }]}> 
                <Text style={styles.headerText}>{slot}</Text>
                <View style={styles.slotHeaderRow}><Text style={styles.slotHeaderText}>Temp</Text><Text style={styles.slotHeaderText}>Time</Text><Text style={styles.slotHeaderText}>Sign</Text></View>
              </View>
            ))}
            <View style={[styles.headerCell, { width: ACTION }]}><Text style={styles.headerText}>If temp out of spec - what was done?</Text></View>
            <View style={[styles.headerCell, { width: SIGNATURE }]}><Text style={styles.headerText}>Sup Name & Sign</Text></View>
          </View>

          {rows.map((item, idx) => (
            <View key={item.day || idx} style={styles.row}>
              <View style={[styles.cell, { width: DATE }]}><Text style={styles.cellText}>{item.day}</Text></View>
              {TIME_SLOTS.map(slot => (
                <View key={slot} style={[styles.recordSlot, { width: RECORD_SLOT_WIDTH }]}> 
                  <View style={styles.slotRow}>
                    <Text style={styles.slotValue}>{item[slot]?.temp || ''}</Text>
                    <Text style={styles.slotValue}>{item[slot]?.time || ''}</Text>
                    { (() => {
                      const s = item[slot]?.sign;
                      const uri = normalizeSignature(s);
                      return uri ? <SignatureThumb uri={uri} width={140} height={44} layers={7} spread={0.8} /> : <Text style={styles.slotValue}>{s || ''}</Text>;
                    })() }
                  </View>
                </View>
              ))}
              <View style={[styles.cell, { width: ACTION }]}><Text style={styles.cellText}>{item.correctiveAction || ''}</Text></View>
              <View style={[styles.cell, { width: SIGNATURE }]}>
                { (() => {
                  const s = item.supNameSign;
                  const uri = normalizeSignature(s);
                  return uri ? <SignatureThumb uri={uri} width={140} height={44} layers={7} spread={0.8} /> : <Text style={styles.cellText}>{s || ''}</Text>;
                })() }
              </View>
            </View>
          ))}
        </View>
      ) : (
        <ScrollView horizontal contentContainerStyle={{ minWidth: TABLE_WIDTH }}>
          <View>
            <View style={styles.headerRow}>
              <View style={[styles.headerCell, { width: DATE }]}><Text style={styles.headerText}>Date</Text></View>
              {TIME_SLOTS.map(slot => (
                <View key={slot} style={[styles.headerCell, { width: RECORD_SLOT_WIDTH }]}> 
                  <Text style={styles.headerText}>{slot}</Text>
                  <View style={styles.slotHeaderRow}><Text style={styles.slotHeaderText}>Temp</Text><Text style={styles.slotHeaderText}>Time</Text><Text style={styles.slotHeaderText}>Sign</Text></View>
                </View>
              ))}
              <View style={[styles.headerCell, { width: ACTION }]}><Text style={styles.headerText}>If temp out of spec - what was done?</Text></View>
              <View style={[styles.headerCell, { width: SIGNATURE }]}><Text style={styles.headerText}>Sup Name & Sign</Text></View>
            </View>

            {rows.map((item, idx) => (
              <View key={item.day || idx} style={styles.row}>
                <View style={[styles.cell, { width: DATE }]}><Text style={styles.cellText}>{item.day}</Text></View>
                {TIME_SLOTS.map(slot => (
                  <View key={slot} style={[styles.recordSlot, { width: RECORD_SLOT_WIDTH }]}> 
                    <View style={styles.slotRow}>
                      <Text style={styles.slotValue}>{item[slot]?.temp || ''}</Text>
                      <Text style={styles.slotValue}>{item[slot]?.time || ''}</Text>
                      { (() => {
                        const s = item[slot]?.sign;
                        const uri = normalizeSignature(s);
                        return uri ? <SignatureThumb uri={uri} width={140} height={44} layers={7} spread={0.8} /> : <Text style={styles.slotValue}>{s || ''}</Text>;
                      })() }
                    </View>
                  </View>
                ))}
                <View style={[styles.cell, { width: ACTION }]}><Text style={styles.cellText}>{item.correctiveAction || ''}</Text></View>
                <View style={[styles.cell, { width: SIGNATURE }]}>
                  { (() => {
                    const s = item.supNameSign;
                    const uri = normalizeSignature(s);
                    return uri ? <SignatureThumb uri={uri} width={140} height={44} layers={7} spread={0.8} /> : <Text style={styles.cellText}>{s || ''}</Text>;
                  })() }
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <View style={{ height: 24 }} />
      <View style={styles.signaturesRow}>
        <View style={styles.signatureCell}>
          <Text style={styles.signatureLabel}>Verified By: HSEQ Manager</Text>
          {(() => {
            const v = payload?.metadata?.hseqManagerSign || payload?.metadata?.hseqManager || '';
            const uri = normalizeSignature(v);
            return uri ? <SignatureThumb uri={uri} width={220} height={60} layers={7} spread={1.0} /> : <Text style={styles.signatureValue}>{v || ''}</Text>;
          })()}
        </View>
        <View style={styles.signatureCell}>
          <Text style={styles.signatureLabel}>Complex Manager</Text>
          {(() => {
            const v = payload?.metadata?.complexManagerSign || payload?.metadata?.complexManager || '';
            const uri = normalizeSignature(v);
            return uri ? <SignatureThumb uri={uri} width={220} height={60} layers={7} spread={1.0} /> : <Text style={styles.signatureValue}>{v || ''}</Text>;
          })()}
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  brandLogo: { width: 56, height: 56, marginRight: 12 },
  brandName: { fontSize: 16, fontWeight: '700', color: '#185a9d' },
  brandSub: { fontSize: 12, color: '#43cea2' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metaText: { fontSize: 12 },
  issueDateBox: { alignItems: 'flex-end' },
  issueDateText: { fontSize: 12, color: '#374151' },
  areaMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metaField: { flexDirection: 'column', paddingVertical: 2, paddingHorizontal: 8, minWidth: 80 },
  metaLabel: { fontSize: 11, fontWeight: '700', color: '#4B5563' },
  metaValue: { fontSize: 12, color: '#111827' },
  subject: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  instruction: { color: '#b91c1c', fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  headerRow: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  headerCell: { padding: 6, borderRightWidth: 1, borderRightColor: '#1F2937', justifyContent: 'center', alignItems: 'center' },
  headerText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  slotHeaderRow: { flexDirection: 'row', width: '100%', marginTop: 4 },
  slotHeaderText: { flex: 1, textAlign: 'center', fontSize: 11 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', minHeight: 44, alignItems: 'center' },
  cell: { padding: 6, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#E5E7EB' },
  cellText: { fontSize: 12 },
  recordSlot: { borderRightWidth: 1, borderRightColor: '#E5E7EB', padding: 4 },
  slotRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  slotValue: { flex: 1, textAlign: 'center' },
  signThumb: { width: 140, height: 44, resizeMode: 'contain', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 4 },
  signaturesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  signatureCell: { flex: 1, padding: 8 },
  signatureLabel: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  signatureValue: { fontSize: 14, color: '#1F2937', marginTop: 6 }
});

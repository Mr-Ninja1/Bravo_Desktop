import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

const normalizeSignature = (v) => {
  if (!v) return null;
  // If it's an object with uri/data fields
  if (typeof v === 'object') {
    if (v.uri && typeof v.uri === 'string') return v.uri;
    if (v.data && typeof v.data === 'string') return v.data.startsWith('data:') ? v.data : `data:image/png;base64,${v.data.replace(/\s+/g, '')}`;
    return null;
  }
  if (typeof v !== 'string') return null;
  if (v.startsWith('data:')) return v;
  const compact = v.replace(/\s+/g, '');
  if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
};

const renderMaybeSignature = (val, width = 240, height = 80) => {
  const uri = normalizeSignature(val);
  if (uri) {
    // keep layers reasonable relative to width
    const layers = Math.max(4, Math.round(width / 40));
    return <SignatureThumb uri={uri} width={width} height={height} layers={layers} spread={1.0} />;
  }
  return <Text style={{ width, textAlign: 'center' }}>{val || ''}</Text>;
};

export default function BOH_ShelfLifeInspectionPresentational({ payload, exportingWide = false }) {
  if (!payload) return null;
  const { title = 'BOH PRODUCTS SHELF-LIFE INSPECTION CHECKLIST', frequency = payload?.metadata?.frequency || 'DAILY', formData = [], verification = {}, layoutHints = {}, assets = {} } = payload;

  // Table column widths
  const baseWidths = {
    name: 420,
    dateIn: 100,
    timeIn: 100,
    timeOut: 100,
    usedBy: 120,
    bakerChefName: 220,
    quantity: 80,
    sign: 80,
  };
  const baseTableW = Object.values(baseWidths).reduce((a, b) => a + b, 0);
  const A4_WIDTH = 794; // px for A4 at 96dpi
  const tableW = exportingWide ? A4_WIDTH : (payload._tableWidth || baseTableW);
  const scale = exportingWide ? (A4_WIDTH / baseTableW) : 1;
  const colWidths = Object.fromEntries(Object.entries(baseWidths).map(([k, v]) => [k, Math.round(v * scale)]));

  return (
    <ScrollView style={styles.container} horizontal={false} contentContainerStyle={{ padding: 12 }}>
      <View style={styles.headerRow}>
        {assets?.logoDataUri ? (
          <Image source={{ uri: assets.logoDataUri }} style={styles.logo} />
        ) : (
          <Image source={require('../../assets/logo.jpeg')} style={styles.logo} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.companyName}>Bravo</Text>
        </View>
        <View style={styles.issueWrap}><Text style={styles.issueText}>Issue Date: {payload?.metadata?.dateOfIssue || payload?.metadata?.date || ''}</Text></View>
      </View>
      <View style={styles.titleRow}><Text style={styles.title}>{title}</Text><Text style={styles.frequency}>FREQUENCY: {frequency}</Text></View>

      {exportingWide ? (
        <View style={[styles.tableContainer, { width: tableW, maxWidth: tableW, alignSelf: 'center' }]}> 
          <View style={[styles.thead, { width: tableW }]}> 
            <Text style={[styles.th, { width: colWidths.name }]}>ITEMS</Text>
            <Text style={[styles.th, { width: colWidths.dateIn }]}>DATE IN</Text>
            <Text style={[styles.th, { width: colWidths.timeIn }]}>TIME IN</Text>
            <Text style={[styles.th, { width: colWidths.timeOut }]}>TIME OUT</Text>
            <Text style={[styles.th, { width: colWidths.usedBy }]}>USED BY</Text>
            <Text style={[styles.th, { width: colWidths.bakerChefName }]}>BAKER/CHEFS NAME</Text>
            <Text style={[styles.th, { width: colWidths.quantity }]}>QUANTITY</Text>
            <Text style={[styles.th, { width: colWidths.sign }]}>SIGN</Text>
          </View>

          {formData.map((r, idx) => (
            <View key={r.name || idx} style={[styles.trow, { width: tableW }]}> 
              <Text style={[styles.td, { width: colWidths.name }]}>{r.name}</Text>
              <Text style={[styles.td, { width: colWidths.dateIn }]}>{r.dateIn}</Text>
              <Text style={[styles.td, { width: colWidths.timeIn }]}>{r.timeIn}</Text>
              <Text style={[styles.td, { width: colWidths.timeOut }]}>{r.timeOut}</Text>
              <Text style={[styles.td, { width: colWidths.usedBy }]}>{r.usedBy}</Text>
              <Text style={[styles.td, { width: colWidths.bakerChefName }]}>{r.bakerChefName}</Text>
              <Text style={[styles.td, { width: colWidths.quantity }]}>{r.quantity}</Text>
              <View style={[styles.td, { width: colWidths.sign, justifyContent: 'center', alignItems: 'center' }]}> 
                {renderMaybeSignature(r.sign, Math.max(40, colWidths.sign - 8), Math.max(32, Math.round((colWidths.sign - 8) * 0.6)))}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <ScrollView horizontal contentContainerStyle={{ minWidth: tableW }}>
          <View style={[styles.tableContainer, { minWidth: tableW }]}> 
            <View style={styles.thead}>
              <Text style={[styles.th, { width: 420 }]}>ITEMS</Text>
              <Text style={[styles.th, { width: 100 }]}>DATE IN</Text>
              <Text style={[styles.th, { width: 100 }]}>TIME IN</Text>
              <Text style={[styles.th, { width: 100 }]}>TIME OUT</Text>
              <Text style={[styles.th, { width: 120 }]}>USED BY</Text>
              <Text style={[styles.th, { width: 220 }]}>BAKER/CHEFS NAME</Text>
              <Text style={[styles.th, { width: 80 }]}>QUANTITY</Text>
              <Text style={[styles.th, { width: 80 }]}>SIGN</Text>
            </View>

            {formData.map((r, idx) => (
              <View key={r.name || idx} style={styles.trow}>
                  <Text style={[styles.td, { width: 420 }]}>{r.name}</Text>
                  <Text style={[styles.td, { width: 100 }]}>{r.dateIn}</Text>
                  <Text style={[styles.td, { width: 100 }]}>{r.timeIn}</Text>
                  <Text style={[styles.td, { width: 100 }]}>{r.timeOut}</Text>
                  <Text style={[styles.td, { width: 120 }]}>{r.usedBy}</Text>
                  <Text style={[styles.td, { width: 220 }]}>{r.bakerChefName}</Text>
                  <Text style={[styles.td, { width: 80 }]}>{r.quantity}</Text>
                  <View style={[styles.td, { width: 80, justifyContent: 'center', alignItems: 'center' }]}>
                    {renderMaybeSignature(r.sign, Math.max(40, 80 - 8), Math.max(32, Math.round((80 - 8) * 0.6)))}
                  </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <View style={{ height: 12 }} />
      <View style={styles.footerRowMultiple}>
        <View style={styles.footerCol}><Text style={styles.footerLabel}>DATE: {payload?.metadata?.date || ''}</Text></View>

        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>HSEQ MANAGER:</Text>
          {renderMaybeSignature(verification?.hseqManagerSign || verification?.hseqManager || verification?.hseqManagerSignature)}
        </View>

        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>COMPLEX MANAGER:</Text>
          {renderMaybeSignature(verification?.complexManagerSign || verification?.complexManager || verification?.complexManagerSignature)}
        </View>

        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>BAKER / CHEF SIGN:</Text>
          {renderMaybeSignature(verification?.bakerSign || verification?.baker || verification?.bakerSignature)}
        </View>

        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>VERIFIED BY:</Text>
          {renderMaybeSignature(verification?.verifiedBySign || verification?.verifiedBy || verification?.verifiedBySignature)}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logo: { width: 56, height: 56, marginRight: 12 },
  companyName: { fontSize: 18, fontWeight: '900', color: '#185a9d' },
  titleRow: { alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '800', color: '#111' },
  frequency: { fontSize: 12, color: '#444', marginTop: 4 },
  tableContainer: { borderWidth: 1, borderColor: '#000', marginTop: 8 },
  thead: { flexDirection: 'row', backgroundColor: '#eee', borderBottomWidth: 1, borderColor: '#000' },
  th: { padding: 6, fontWeight: '700', fontSize: 12, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
  trow: { flexDirection: 'row', minHeight: 56, borderBottomWidth: 1, borderBottomColor: '#000' },
  td: { paddingHorizontal: 6, paddingVertical: 8, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
  footerRow: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  footerLabel: { fontSize: 12, color: '#333' },
  footerRowMultiple: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  footerCol: { flex: 1, minWidth: 140, paddingRight: 8 },
  issueWrap: { position: 'absolute', right: 12, top: 8 },
  issueText: { fontSize: 12, fontWeight: '700', color: '#374151' },
});

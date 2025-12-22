import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

const A4_WIDTH = 794;
export default function DisplayChillerShelfLifeInspectionPresentational({ payload, exportingWide = false }) {
  if (!payload) return null;
  const { title = 'DISPLAY CHILLER & FOH PRODUCTS SHELF-LIFE INSPECTION CHECKLIST', frequency = 'DAILY', formData = [], layoutHints = {}, assets = {}, date = '', verifiedBy = '', verifiedBySign = '', baristaSign = '' } = payload;

  const TABLE_WIDTH = payload._tableWidth || 1000;
  const exportA4Style = exportingWide ? { width: A4_WIDTH, maxWidth: A4_WIDTH, alignSelf: 'center' } : {};

  return (
    <ScrollView style={styles.container} horizontal={false} contentContainerStyle={exportingWide ? { padding: 0, margin: 0, backgroundColor: '#fff' } : { padding: 12 }}>
      <View style={styles.headerRow}>
        {assets?.logoDataUri ? (
          <Image source={{ uri: assets.logoDataUri }} style={styles.logo} />
        ) : (
          <Image source={require('../../assets/logo.jpeg')} style={styles.logo} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.companyName}>Bravo</Text>
        </View>
      </View>
      <View style={styles.titleRow}><Text style={styles.title}>{title}</Text><Text style={styles.frequency}>FREQUENCY: {frequency}</Text></View>

      <View style={[styles.tableContainer, exportingWide ? exportA4Style : { width: '100%', maxWidth: TABLE_WIDTH }]}> 
        <View style={styles.thead}>
          {(() => {
            const cols = [
              [320, Math.round((320 / TABLE_WIDTH) * 100)],
              [80, Math.round((80 / TABLE_WIDTH) * 100)],
              [80, Math.round((80 / TABLE_WIDTH) * 100)],
              [80, Math.round((80 / TABLE_WIDTH) * 100)],
              [100, Math.round((100 / TABLE_WIDTH) * 100)],
              [160, Math.round((160 / TABLE_WIDTH) * 100)],
              [60, Math.round((60 / TABLE_WIDTH) * 100)],
              [120, Math.round((120 / TABLE_WIDTH) * 100)],
            ];
            const labels = ['ITEMS','DATE IN','TIME IN','TIME OUT','USED BY','BAKER/CHEFS /BARISTAS NAME','QUANTITY','SIGN'];
            return labels.map((lab, i) => (
              <Text key={lab} style={[styles.th, exportingWide ? { width: cols[i][0] } : { width: cols[i][1] + '%' }]}>{lab}</Text>
            ));
          })()}
        </View>

        {formData.map((r, idx) => (
          <View key={r.id || idx} style={styles.trow}>
            {(() => {
              const vals = [r.item, r.dateIn, r.timeIn, r.timeOut, r.usedBy, r.staffName, r.quantity, r.sign];
              return vals.map((val, i) => {
                const cols = [320,80,80,80,100,160,60,120];
                const pct = Math.round((cols[i] / TABLE_WIDTH) * 100);
                const cellStyle = exportingWide ? { width: cols[i] } : { width: pct + '%' };
                if (i === 7) {
                  const uri = val ? (String(val).startsWith('data:') ? val : `data:image/png;base64,${val}`) : null;
                  return (
                    <View key={i} style={[styles.td, cellStyle, { alignItems: 'center', justifyContent: 'center' }]}>
                      {uri ? <SignatureThumb uri={uri} width={exportingWide ? 120 : 120} height={exportingWide ? 80 : 80} layers={5} spread={0.8} /> : <Text style={{ color: '#333' }}>{val || ''}</Text>}
                    </View>
                  );
                }
                return <Text key={i} style={[styles.td, cellStyle]}>{val}</Text>;
              });
            })()}
          </View>
        ))}
      </View>

    <View style={{ height: 12 }} />
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Text style={styles.footer}>DATE: {date || '______________________'}    VERIFIED BY: {verifiedBy || '______________________'}</Text>
    <View style={{ marginLeft: 12 }}>
      {(() => {
        const v = verifiedBySign;
        const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
        return uri ? <SignatureThumb uri={uri} width={160} height={80} layers={5} spread={0.9} /> : null;
      })()}
    </View>
  </View>
  <View style={{ marginTop: 8 }}>
    <Text style={{ fontSize: 12, fontWeight: '700' }}>BARISTA SIGN:</Text>
    <View style={{ marginTop: 6 }}>
      {(() => {
        const v = baristaSign;
        const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
        return uri ? <SignatureThumb uri={uri} width={320} height={160} layers={6} spread={1.0} /> : <Text style={{ color: '#666' }}>______________________</Text>;
      })()}
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
  footer: { fontSize: 12, color: '#333', marginTop: 8 },
});

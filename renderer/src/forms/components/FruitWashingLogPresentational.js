import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

export default function FruitWashingLogPresentational({ payload }) {
  if (!payload) return null;
  const p = payload.payload || payload;
  const metadata = p.metadata || {};
  const formData = Array.isArray(p.formData) ? p.formData : [];
  const logoDataUri = p.assets && p.assets.logoDataUri;
  const hints = p.layoutHints || {};

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.content, { flexGrow: 1 }]}
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.headerBox}>
        <View style={styles.brandRow}>
          {logoDataUri ? (
            <Image source={{ uri: logoDataUri }} style={styles.logo} resizeMode="contain" />
          ) : (
            <Image source={require('../../assets/logo.jpeg')} style={styles.logo} resizeMode="contain" />
          )}
          <View style={styles.brandTextWrap}>
            <Text style={styles.brandTitle}>Bravo!</Text>
            <Text style={styles.brandSubtitle}>Food Safety Inspections</Text>
          </View>
        </View>
        <Text style={styles.title}>{metadata.subject || 'FRUIT ,VEGETABLE & EGG WASHING + SANITIZING LOG'}</Text>
        <Text style={styles.meta}>Doc No: {metadata.docNo || ''} • Issue Date: {metadata.issueDate || ''}</Text>
      </View>

      {/* Site row (read-only) */}
      <View style={styles.siteRow}><Text style={styles.siteLabel}>SITE:</Text><Text style={styles.siteValue}>{metadata.site || ''}</Text></View>

      <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.tableWrap}>
          <View style={styles.tableHeader}>
          <View style={[styles.headerCell, { width: hints.DATE || 80 }]}><Text style={styles.headerText}>Date</Text></View>
          <View style={[styles.headerCell, { width: hints.NAME || 220 }]}><Text style={styles.headerText}>Product being washed</Text></View>
          <View style={[styles.headerCell, { width: hints.SANITIZER || 180 }]}><Text style={styles.headerText}>Name of Sanitizer Used</Text></View>
          <View style={[styles.headerCell, { width: hints.CONC || 140 }]}><Text style={styles.headerText}>Concentration of Sanitizer</Text></View>
          <View style={[styles.headerCell, { width: hints.START || 100 }]}><Text style={styles.headerText}>Disinfection Start time</Text></View>
          <View style={[styles.headerCell, { width: hints.END || 100 }]}><Text style={styles.headerText}>Disinfection End time</Text></View>
          <View style={[styles.headerCell, { width: hints.RINSING || 80 }]}><Text style={styles.headerText}>Rinsing Done Yes/No</Text></View>
          <View style={[styles.headerCell, { width: hints.PERSON || 160 }]}><Text style={styles.headerText}>Person washing fruits & veg</Text></View>
          <View style={[styles.headerCell, { width: hints.SIGN || 100, borderRightWidth: 0 }]}><Text style={styles.headerText}>Sup Sign</Text></View>
        </View>

        {formData.length === 0 ? (
          <View style={styles.emptyRow}><Text style={styles.empty}>No entries saved.</Text></View>
        ) : (
          formData.map((row, idx) => (
            <View key={idx} style={styles.row}>
              <View style={[styles.cell, { width: hints.DATE || 80 }]}><Text style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">{row.date}</Text></View>
              <View style={[styles.cell, { width: hints.NAME || 220 }]}><Text style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">{row.productWashed}</Text></View>
              <View style={[styles.cell, { width: hints.SANITIZER || 180 }]}><Text style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">{row.sanitizerName}</Text></View>
              <View style={[styles.cell, { width: hints.CONC || 140 }]}><Text style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">{row.sanitizerConcentration}</Text></View>
              <View style={[styles.cell, { width: hints.START || 100 }]}><Text style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">{row.disinfectionStartTime}</Text></View>
              <View style={[styles.cell, { width: hints.END || 100 }]}><Text style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">{row.disinfectionEndTime}</Text></View>
              <View style={[styles.cell, { width: hints.RINSING || 80 }]}><Text style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">{row.rinsingDone}</Text></View>
              <View style={[styles.cell, { width: hints.PERSON || 160 }]}><Text style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">{row.personWashing}</Text></View>
              <View style={[styles.cell, { width: hints.SIGN || 100, borderRightWidth: 0 }]}>
                {row.supSign ? (
                  <SignatureThumb uri={String(row.supSign).startsWith('data:') ? row.supSign : `data:image/png;base64,${row.supSign}`} width={hints.SIGN || 100} height={48} layers={8} spread={1.0} />
                ) : (
                  <Text style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">{''}</Text>
                )}
              </View>
            </View>
          ))
        )}
        </View>
      </ScrollView>

      <View style={styles.verifyFooter}>
        <View style={[styles.verifyCol, { flex: 1 }]}> 
          <Text style={styles.verifyLabel}>Verified by</Text>
          {metadata.verification?.verifiedBySign ? (
            <SignatureThumb uri={String(metadata.verification.verifiedBySign).startsWith('data:') ? metadata.verification.verifiedBySign : `data:image/png;base64,${metadata.verification.verifiedBySign}`} width={160} height={60} layers={8} spread={1.0} />
          ) : (
            <Text style={styles.verifyValue}>{metadata.verification?.verifiedBySign || ''}</Text>
          )}
        </View>
        <View style={[styles.verifyCol, { flex: 1 }]}> 
          <Text style={styles.verifyLabel}>HSEQ Manager</Text>
          {metadata.verification?.hseqManagerSign ? (
            <SignatureThumb uri={String(metadata.verification.hseqManagerSign).startsWith('data:') ? metadata.verification.hseqManagerSign : `data:image/png;base64,${metadata.verification.hseqManagerSign}`} width={160} height={60} layers={8} spread={1.0} />
          ) : (
            <Text style={styles.verifyValue}>{metadata.verification?.hseqManagerSign || ''}</Text>
          )}
        </View>
        <View style={[styles.verifyCol, { flex: 1 }]}> 
          <Text style={styles.verifyLabel}>Complex Manager</Text>
          {metadata.verification?.complexManagerSign ? (
            <SignatureThumb uri={String(metadata.verification.complexManagerSign).startsWith('data:') ? metadata.verification.complexManagerSign : `data:image/png;base64,${metadata.verification.complexManagerSign}`} width={160} height={60} layers={8} spread={1.0} />
          ) : (
            <Text style={styles.verifyValue}>{metadata.verification?.complexManagerSign || ''}</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 12, backgroundColor: '#fff' },
  headerBox: { alignItems: 'center', marginBottom: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  logo: { width: 48, height: 48, borderRadius: 8, marginRight: 12, backgroundColor: '#fff' },
  brandTextWrap: { flexDirection: 'column' },
  brandTitle: { fontSize: 20, fontWeight: '800', color: '#185a9d' },
  brandSubtitle: { fontSize: 12, color: '#43cea2', fontWeight: '600' },
  title: { fontWeight: '800', fontSize: 16, color: '#222', textAlign: 'center', marginBottom: 4 },
  meta: { fontSize: 12, color: '#555', marginBottom: 8 },
  siteRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  siteLabel: { fontWeight: '700', marginRight: 8 },
  siteValue: { fontSize: 12 },
  tableWrap: { backgroundColor: '#fff', borderRadius: 0, borderWidth: 1.2, borderColor: '#333', overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f5f7', borderBottomWidth: 1.2, borderColor: '#333' },
  headerCell: { padding: 4, borderRightWidth: 1, borderRightColor: '#333', justifyContent: 'center', alignItems: 'center', minHeight: 48 },
  headerText: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  emptyRow: { padding: 12 },
  empty: { color: '#666', fontStyle: 'italic' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#333', minHeight: 44 },
  cell: { padding: 6, borderRightWidth: 1, borderRightColor: '#333', justifyContent: 'center' },
  cellText: { fontSize: 12, textAlign: 'center' },
  verifyFooter: { marginTop: 16, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  verifyCol: { flex: 1 },
  verifyLabel: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  verifyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  verifyText: { fontSize: 12, fontWeight: '500' },
  verifyValue: { fontSize: 12 }
});

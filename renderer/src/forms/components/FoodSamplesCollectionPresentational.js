import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

export default function FoodSamplesCollectionPresentational({ payload }) {
  if (!payload) return null;
  // Support both legacy shapes and canonical saved payloads
  const site = payload.site || payload.formData?.site || '';
  const location = payload.location || payload.formData?.location || '';
  // Supervisor name/sign may be stored at top-level or inside formData in older saves
  const supervisorName = payload.supervisorName || payload.supervisor || payload.formData?.supervisorName || payload.formData?.supervisor || '';
  const supervisorSign = payload.supervisorSign || payload.formData?.supervisorSign || (payload.metadata && payload.metadata.supervisorSign) || '';
  const logEntries = (payload.formData && payload.formData.logEntries) || payload.logEntries || [];
  const specification = payload.specification || (payload.formData && payload.formData.specification) || '';
  const logoDataUri = payload.assets && payload.assets.logoDataUri;
  // fallback to bundled asset if base64 not present (helps web and any failed base64 reads)
  let bundledLogo = null;
  try {
    // path from src/forms/components to src/assets is '../../assets/logo.jpeg'
    bundledLogo = require('../../assets/logo.jpeg');
  } catch (e) {
    bundledLogo = null;
  }

  // allow saved payload to control column widths via layoutHints; fallback to defaults
  const hints = payload.layoutHints || payload.formData?.layoutHints || { NAME: 220, PREP: 240, DATE: 120, TIME: 100, DISPOSE: 120 };
  const wName = hints.NAME || 220;
  const wPrep = hints.PREP || 240;
  const wDate = hints.DATE || 120;
  const wTime = hints.TIME || 100;
  const wDispose = hints.DISPOSE || 120;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.card}>
        {/* Header: logo + company + doc meta */}
        <View style={styles.headerWrap}>
          <View style={styles.headerLeft}>
            {logoDataUri ? (
              <Image source={{ uri: logoDataUri }} style={styles.logoImage} resizeMode="contain" />
            ) : bundledLogo ? (
              <Image source={bundledLogo} style={styles.logoImage} resizeMode="contain" />
            ) : null}
            <Text style={styles.companyName}>{payload.companyName || 'BRAVO BRANDS LIMITED'}</Text>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>FOOD SAMPLES COLLECTION LOG</Text>
            <View style={styles.docRow}><Text style={styles.docLabel}>Doc No:</Text><Text style={styles.docValue}>{payload.docNo || 'BBN-SHEQ-F-B.1'}</Text></View>
            <View style={styles.docRow}><Text style={styles.docLabel}>Issue Date:</Text><Text style={styles.docValue}>{payload.issueDate || ''}</Text></View>
          </View>
          <View style={styles.headerRight}><Text style={styles.pageInfo}>{payload.pageInfo || 'Page 1 of 1'}</Text></View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>Site: {site}</Text>
          <Text style={styles.meta}>Location: {location}</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.meta}>Name of Supervisor: {supervisorName}</Text>
            {supervisorSign ? (
              <SignatureThumb uri={String(supervisorSign).startsWith('data:') ? supervisorSign : `data:image/png;base64,${supervisorSign}`} width={200} height={64} layers={10} spread={1.2} />
            ) : null}
          </View>
        </View>

        {specification ? (
          <View style={styles.specBox}><Text style={styles.specText}>{specification}</Text></View>
        ) : null}

        <View style={styles.tableOuter}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colHeader, styles.columnBase, { width: wName }]}>Name of Food Sample</Text>
            <Text style={[styles.colHeader, styles.columnBase, { width: wPrep }]}>Preparation Method</Text>
            <Text style={[styles.colHeader, styles.columnBase, { width: wDate }]}>Date Collected</Text>
            <Text style={[styles.colHeader, styles.columnBase, { width: wTime }]}>Time Collected</Text>
            <Text style={[styles.colHeader, styles.columnBase, { width: wDispose, borderRightWidth: 0 }]}>Date of Disposal</Text>
          </View>
          {logEntries.length === 0 ? (
            <Text style={styles.empty}>No samples recorded.</Text>
          ) : (
            logEntries.map((row, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text numberOfLines={2} ellipsizeMode="tail" style={[styles.cell, styles.columnBase, { width: wName }]}>{row.name}</Text>
                <Text numberOfLines={2} ellipsizeMode="tail" style={[styles.cell, styles.columnBase, { width: wPrep }]}>{row.preparationMethod}</Text>
                <Text style={[styles.cell, styles.columnBase, { width: wDate }]}>{row.dateCollected}</Text>
                <Text style={[styles.cell, styles.columnBase, { width: wTime }]}>{row.timeCollected}</Text>
                <Text style={[styles.cell, styles.columnBase, { width: wDispose, borderRightWidth: 0 }]}>{row.dateDisposal}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 12 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 6 },
  title: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  headerWrap: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 8 },
  headerLeft: { width: 140, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, paddingLeft: 12 },
  headerRight: { width: 80, alignItems: 'flex-end', marginTop: 10 },
  companyName: { fontSize: 12, fontWeight: '700' },
  docRow: { flexDirection: 'row', marginTop: 4 },
  docLabel: { fontSize: 12, fontWeight: '700', marginRight: 6 },
  docValue: { fontSize: 12 },
  pageInfo: { fontSize: 10, fontWeight: '700' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  meta: { fontSize: 12 },
  tableOuter: { borderWidth: 1, borderColor: '#000', width: '100%', marginTop: 8 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#eee', borderBottomWidth: 1, borderColor: '#000', alignItems: 'center', minHeight: 36 },
  tableRow: { flexDirection: 'row', minHeight: 36, alignItems: 'center', borderBottomWidth: 1, borderColor: '#000' },
  colHeader: { fontWeight: '700', paddingHorizontal: 4, textAlign: 'center' },
  columnBase: { paddingHorizontal: 6, paddingVertical: 6, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000' },
  empty: { color: '#666', fontStyle: 'italic', padding: 12 },
  cell: { paddingHorizontal: 6, fontSize: 12, textAlign: 'center' }
  ,
  logoImage: { width: 84, height: 44, marginBottom: 4 },
  specBox: { borderWidth: 1, borderColor: '#000', padding: 8, marginBottom: 8, borderRadius: 4 },
  specText: { fontSize: 12, lineHeight: 18 }
});

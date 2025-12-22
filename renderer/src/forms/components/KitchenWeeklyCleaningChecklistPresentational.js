import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

export default function KitchenWeeklyCleaningChecklistPresentational({ payload, exportingWide = false }) {
  if (!payload) return null;
  const p = payload.payload || payload;
  const { metadata = {}, formData = [], layoutHints = {}, _tableWidth } = p;
  const hints = layoutHints || {};
  const WEEK_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // 1. Column defaults (reduced AREA to better fit content for export)
  const defaultWidths = { AREA: 180, FREQ: 120, DAY_GROUP: 120, CHECK: 30, CLEANED_BY: 80 };
  
  const baseTableWidth = (Number(hints.AREA || defaultWidths.AREA)) 
    + (Number(hints.FREQ || defaultWidths.FREQ)) 
    + (WEEK_DAYS.length * Number(hints.DAY_GROUP || defaultWidths.DAY_GROUP));

  const TABLE_W = _tableWidth || baseTableWidth;
  const EXPORT_WIDTH = 900;
  let scale = 1;
  let tableW = TABLE_W;

  if (exportingWide && TABLE_W > EXPORT_WIDTH) {
    scale = EXPORT_WIDTH / TABLE_W;
    tableW = EXPORT_WIDTH;
  }

  // Define the fixed width style for all row-level containers
  const exportA4Style = exportingWide ? { width: tableW, minWidth: tableW } : {};

  const adjustedWidths = exportingWide ? {
    AREA: Math.round((hints.AREA || defaultWidths.AREA) * scale),
    FREQ: Math.round((hints.FREQ || defaultWidths.FREQ) * scale),
    DAY_GROUP: Math.round((hints.DAY_GROUP || defaultWidths.DAY_GROUP) * scale),
    CHECK: Math.round(defaultWidths.CHECK * scale),
    CLEANED_BY: Math.round(defaultWidths.CLEANED_BY * scale),
  } : defaultWidths;

  const totalForFlex = baseTableWidth || 1;
  
  const col = (k, def) => {
    if (exportingWide) return { width: adjustedWidths[k] || Math.round(def * scale) };
    const w = Number(hints[k] || defaultWidths[k] || def) || def;
    return { flex: w / totalForFlex, minWidth: Math.max(24, Math.round(def * 0.28)), flexShrink: 1 };
  };

  const inner = (() => {
    const check = Number(hints.CHECK || defaultWidths.CHECK);
    const cleaned = Number(hints.CLEANED_BY || defaultWidths.CLEANED_BY);
    const s = (check + cleaned) || 1;
    return { checkFrac: check / s, cleanedFrac: cleaned / s };
  })();

  const resolveSignatureUri = (val) => {
    if (!val) return null;
    if (typeof val === 'object') {
      if (val.uri && typeof val.uri === 'string') {
        const u = val.uri.trim(); if (u) return u;
      }
      if (val.data && typeof val.data === 'string') {
        const compact = val.data.replace(/\s+/g, '');
        if (compact.length) return `data:image/png;base64,${compact}`;
      }
      return null;
    }
    if (typeof val !== 'string') return null;
    const s = val.trim(); if (!s) return null;
    if (s.startsWith('data:') || s.startsWith('http:') || s.startsWith('https:') || s.startsWith('file:') || s.startsWith('blob:')) return s;
    const base64ish = /^[A-Za-z0-9+/=\r\n]+$/;
    const compact = s.replace(/\s+/g, '');
    if (compact.length > 100 && base64ish.test(compact)) return `data:image/png;base64,${compact}`;
    return null;
  };

  // 2. Use a standard View when exporting to avoid ScrollView clipping logic
  const ContainerView = exportingWide ? View : ScrollView;

  return (
    <ContainerView 
      style={[{ backgroundColor: '#fff' }, exportingWide ? { width: tableW } : null]}
      contentContainerStyle={exportingWide ? null : styles.container}
    >
      <View style={[styles.card, exportingWide ? { width: tableW, padding: 12 } : styles.container]}>
        <View style={[styles.headerRow, exportA4Style]}>
          <View style={styles.headerLeft}>
            <View style={styles.logoWrap}>
              {p.assets?.logoDataUri ? (
                <Image source={{ uri: p.assets.logoDataUri }} style={styles.logo} />
              ) : (
                <Image source={require('../../assets/logo.jpeg')} style={styles.logo} />
              )}
            </View>
            <Text style={styles.companyText}>{metadata.companyName || 'Bravo'}</Text>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>{p.title || 'Kitchen Weekly Cleaning Checklist'}</Text>
            <View style={styles.metaRow}>
              <View style={{ flex: 1, alignItems: 'flex-start' }}>
                <Text style={styles.metaText}>Location: {metadata.location || ''}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.metaText}>Week: {metadata.week || ''}</Text>
                <Text style={[styles.metaText, { marginLeft: 12 }]}>Month: {metadata.month || ''}</Text>
                <Text style={[styles.metaText, { marginLeft: 8 }]}>Year: {metadata.year || ''}</Text>
              </View>
            </View>

            {/* Signature row moved above table so signatures are not pushed to next page */}
            <View style={styles.signRow}>
              <View style={styles.signCol}>
                <Text style={[styles.footerText, { fontWeight: '700', marginBottom: 6 }]}>Verified By: HSEQ Manager</Text>
                {(() => {
                  const raw = p.hseqSign || p.hseqManagerSignature || metadata.hseqSign || metadata.verifiedBy;
                  const uri = resolveSignatureUri(raw);
                  return uri ? <SignatureThumb uri={uri} width={160} height={64} layers={12} spread={1.2} /> : <Text style={styles.footerText}>{metadata.hseqManager || ''}</Text>;
                })()}
              </View>
              <View style={styles.signCol}>
                <Text style={[styles.footerText, { fontWeight: '700', marginBottom: 6 }]}>Complex Manager</Text>
                {(() => {
                  const rawC = p.complexManagerSign || p.complexManagerSignature || metadata.complexManagerSign;
                  const uri = resolveSignatureUri(rawC);
                  return uri ? <SignatureThumb uri={uri} width={160} height={64} layers={12} spread={1.2} /> : <Text style={styles.footerText}>{metadata.complexManager || ''}</Text>;
                })()}
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.table, exportA4Style]}>
          <View style={[styles.tableHeaderRow, { backgroundColor: '#f3f5f7' }, exportA4Style]}>
            <View style={[styles.headerCell, col('AREA', 300)]}><Text style={styles.headerText}>Area to be cleaned</Text></View>
            <View style={[styles.headerCell, col('FREQ', 150)]}><Text style={styles.headerText}>Frequency</Text></View>
            {WEEK_DAYS.map(d => (
              <View key={d} style={[styles.headerGroup, col('DAY_GROUP', 150)]}>
                <Text style={styles.headerDay}>{d}</Text>
                <Text style={styles.headerSubText}>Cleaned By</Text>
              </View>
            ))}
          </View>

          {formData.map((item, idx) => (
            <View key={item.id || idx} style={[styles.row, exportA4Style, { overflow: 'visible' }]}>
              <View style={[styles.cell, col('AREA', 300)]}><Text style={styles.areaText}>{item.name}</Text></View>
              <View style={[styles.cell, col('FREQ', 150)]}><Text style={styles.freqText}>{item.frequency}</Text></View>
              {WEEK_DAYS.map(d => (
                <View key={d} style={[styles.dayGroup, col('DAY_GROUP', 150)]}>
                  <View style={[styles.checkCell, { flex: inner.checkFrac }]}>
                    <Text style={styles.checkText}>{item.checks?.[d]?.checked ? '✓' : ''}</Text>
                  </View>
                  <View style={[styles.cleanedByCell, { flex: inner.cleanedFrac }]}>
                    <Text style={styles.cleanedByText}>{item.checks?.[d]?.cleanedBy || ''}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* footer signatures moved above table to avoid pagination */}
      </View>
    </ContainerView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff' },
  card: { backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logoWrap: { width: 80, height: 80, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  logo: { width: 72, height: 72, resizeMode: 'contain' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  companyText: { fontSize: 16, fontWeight: '800', color: '#374151', marginLeft: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, width: '100%' },
  metaText: { fontSize: 12, color: '#444' },
  signRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 8 },
  signCol: { width: 220, alignItems: 'flex-start' },
  table: { borderWidth: 1, borderColor: '#d1d5db' },
  tableHeaderRow: { flexDirection: 'row' },
  headerCell: { padding: 6, borderRightWidth: 1, borderRightColor: '#e6e6e6', alignItems: 'center', justifyContent: 'center' },
  headerGroup: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#e6e6e6' },
  headerDay: { color: '#111827', fontWeight: '700', paddingVertical: 6 },
  headerSubText: { color: '#111827', fontWeight: '700', fontSize: 11, paddingBottom: 6 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e6e6e6', minHeight: 40, backgroundColor: '#fff' },
  cell: { padding: 6, borderRightWidth: 1, borderRightColor: '#e6e6e6', justifyContent: 'center' },
  areaText: { fontSize: 12, color: '#374151' },
  freqText: { fontSize: 12, color: '#6B7280' },
  dayGroup: { flexDirection: 'row', borderRightWidth: 1, borderRightColor: '#e6e6e6', alignItems: 'center' },
  checkCell: { justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#e6e6e6' },
  cleanedByCell: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  checkText: { textAlign: 'center' },
  cleanedByText: { textAlign: 'center' },
  footerRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 12, fontWeight: '700' }
});
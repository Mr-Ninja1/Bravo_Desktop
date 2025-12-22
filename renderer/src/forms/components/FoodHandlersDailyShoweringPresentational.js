import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

export default function FoodHandlersDailyShoweringPresentational({ payload }) {
  if (!payload) return null;

  // Support wrapper shape used by SavedFormRenderer: payload may be { payload }
  const p = (payload && (payload.payload || payload)) || {};
  const week = p.week || '';
  const month = p.month || '';
  const year = p.year || '';
  const compiledBy = p.compiledBy || '';
  const approvedBy = p.approvedBy || '';
  const verifiedBy = p.verifiedBy || '';
  const logEntries = p.logEntries || [];
  const logoDataUri = p.assets && p.assets.logoDataUri;

  // Prefer explicit widths array or fallback to layoutHints keys
  const hints = p.layoutHints || {};
  const widths = Array.isArray(hints.widths) && hints.widths.length ? hints.widths : (
    hints ? [hints.largeCol || 150, hints.mediumCol || 90].concat(Array.from({ length: 7 * 2 }, (_, i) => i % 2 === 0 ? 60 : 45)).concat([110]) : []
  );

  const totalWidth = p._tableWidth || widths.reduce((s, w) => s + (Number(w) || 0), 0) || 1000;

  // header geometry (matches editor constants)
  const HEADER_H = 40;
  const ROW_H = 35;

  const largeCol = widths[0] || 150;
  const mediumCol = widths[1] || 90;
  const dayBlocks = [];
  // the rest of widths are 7 * 2 daily cols then sup sign at the end
  const dailyCols = widths.slice(2, 2 + 7 * 2);
  const supCol = widths[2 + 7 * 2] || 110;

  // compute per-day block widths (pair of time + sign)
  for (let d = 0; d < 7; d++) {
    const timeW = dailyCols[d * 2] || 60;
    const signW = dailyCols[d * 2 + 1] || 45;
    dayBlocks.push({ timeW, signW, total: (timeW + signW) });
  }

  return (
    <ScrollView contentContainerStyle={[styles.scroll]}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.headerRow}>
          {logoDataUri ? <Image source={{ uri: logoDataUri }} style={styles.logo} resizeMode="contain" /> : <Image source={require('../../assets/logo.jpeg')} style={styles.logo} resizeMode="contain" />}
          <Text style={styles.title}>FOOD HANDLERS DAILY SHOWERING LOG</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>Week: {week}</Text>
          <Text style={styles.meta}>Month: {month}</Text>
          <Text style={styles.meta}>Year: {year}</Text>
        </View>

        {/* Table - horizontal scroll with fixed widths */}
        <ScrollView horizontal contentContainerStyle={{ minWidth: totalWidth }}>
          <View style={[styles.table, { minWidth: totalWidth }]}>

            {/* Top header band: empty fixed columns + day headers + sup sign placeholder */}
            <View style={[styles.headerBand, { height: HEADER_H }]}> 
              <View style={{ width: largeCol + mediumCol }} />
              {dayBlocks.map((db, i) => (
                <View key={`day-${i}`} style={[styles.dayHeader, { width: db.total, height: HEADER_H }] }>
                  <Text style={styles.headerText}>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i]}</Text>
                </View>
              ))}
              <View style={{ width: supCol }} />
            </View>

            {/* Bottom header band: render subheaders while spanning cells are absolutely positioned above */}
            <View style={{ position: 'relative' }}>
              {/* Absolutely-positioned spanning cells so they visually span the two header rows */}
              <View style={[styles.spanningAbsolute, { width: largeCol, height: HEADER_H * 2, left: 0, top: -HEADER_H }]}>
                <Text style={styles.headerText}>Full Name</Text>
              </View>
              <View style={[styles.spanningAbsolute, { width: mediumCol, height: HEADER_H * 2, left: largeCol, top: -HEADER_H }]}>
                <Text style={styles.headerText}>Job Title</Text>
              </View>
              <View style={[styles.spanningAbsolute, { width: supCol, height: HEADER_H * 2, right: 0, top: -HEADER_H }]}>
                <Text style={styles.headerText}>Sup{"\n"}Sign</Text>
              </View>

              <View style={[styles.headerBand, { height: HEADER_H }]}> 
                <View style={{ width: largeCol + mediumCol }} />
                <View style={{ flexDirection: 'row' }}>
                  {dayBlocks.flatMap((db, di) => [
                    <View key={`time-${di}`} style={[styles.subHeaderCell, { width: db.timeW, height: HEADER_H }]}>
                      <Text style={styles.headerText}>Shower{"\n"}Time</Text>
                    </View>,
                    <View key={`sign-${di}`} style={[styles.subHeaderCell, { width: db.signW, height: HEADER_H }]}>
                      <Text style={styles.headerText}>Sign</Text>
                    </View>
                  ])}
                </View>
              </View>
            </View>

            {/* Data rows */}
            {logEntries.length === 0 ? (
              <Text style={styles.empty}>No entries saved.</Text>
            ) : (
              logEntries.map((row, rIdx) => (
                <View key={`row-${rIdx}`} style={[styles.dataRow, { height: ROW_H }]}>
                  {/* Full name */}
                  <Text style={[styles.dataCell, { width: largeCol }]} numberOfLines={1} ellipsizeMode="tail">{row[0] || ''}</Text>
                  {/* Job title */}
                  <Text style={[styles.dataCell, { width: mediumCol }]} numberOfLines={1} ellipsizeMode="tail">{row[1] || ''}</Text>
                  {/* 7 days of time/sign */}
                  {Array.from({ length: 7 }).map((_, d) => (
                    <React.Fragment key={`d-${d}`}>
                      <Text style={[styles.dataCell, { width: (dailyCols[d * 2] || 60) }]} numberOfLines={1} ellipsizeMode="tail">{row[2 + d * 2] || ''}</Text>
                      {(() => {
                        const signVal = row[2 + d * 2 + 1];
                        const uri = signVal ? (String(signVal).startsWith('data:') ? signVal : `data:image/png;base64,${signVal}`) : null;
                        return uri ? <SignatureThumb uri={uri} width={(dailyCols[d * 2 + 1] || 45) - 4} height={40} layers={5} spread={0.8} /> : <Text style={[styles.dataCell, { width: (dailyCols[d * 2 + 1] || 45) }]} numberOfLines={1} ellipsizeMode="tail">{row[2 + d * 2 + 1] || ''}</Text>;
                      })()}
                    </React.Fragment>
                  ))}
                  {/* Supervisor sign */}
                  {(() => {
                    const supVal = row[2 + 7 * 2];
                    const supUri = supVal ? (String(supVal).startsWith('data:') ? supVal : `data:image/png;base64,${supVal}`) : null;
                    return supUri ? <SignatureThumb uri={supUri} width={Math.max(60, supCol - 8)} height={40} layers={6} spread={1.0} /> : <Text style={[styles.dataCell, { width: supCol }]} numberOfLines={1} ellipsizeMode="tail">{row[2 + 7 * 2] || ''}</Text>;
                  })()}
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.meta}>Compiled By: {compiledBy}</Text>
          <Text style={styles.meta}>Approved By: {approvedBy}</Text>
          <View>
            {(() => {
              const v = p.metadata?.verifiedBySign || verifiedBy || p.metadata?.verifiedBy || null;
              const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
              return uri ? <SignatureThumb uri={uri} width={220} height={64} layers={8} spread={1.0} /> : <Text style={styles.meta}>Verified By: {verifiedBy}</Text>;
            })()}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 12 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 6 },
  title: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  meta: { fontSize: 12 },
  table: { borderTopWidth: 1, borderColor: '#ddd', paddingTop: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logo: { width: 72, height: 36, marginRight: 8 },
  headerBand: { flexDirection: 'row', backgroundColor: '#e9e9e9' },
  dayHeader: { justifyContent: 'center', alignItems: 'center', borderLeftWidth: 1, borderColor: '#000' },
  spanningCell: { justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#000', backgroundColor: '#e9e9e9' },
  spanningAbsolute: { position: 'absolute', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#000', backgroundColor: '#e9e9e9', zIndex: 10 },
  subHeaderCell: { justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderColor: '#000', backgroundColor: '#f5f5f5' },
  headerText: { fontSize: 11, fontWeight: '700', textAlign: 'center', lineHeight: 14 },
  empty: { color: '#666', fontStyle: 'italic' },
  dataRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc' },
  dataCell: { paddingHorizontal: 4, fontSize: 12, textAlign: 'center' },
  footer: { marginTop: 8 },
  cell: { flex: 1, paddingHorizontal: 4, fontSize: 12 },
});

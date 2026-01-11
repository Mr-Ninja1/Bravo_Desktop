import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';


export default function FoodHandlersDailyShoweringPresentational({ payload }) {
  if (!payload) return null;

  const p = (payload && (payload.payload || payload)) || {};
  const week = p.week || '';
  const month = p.month || '';
  const year = p.year || '';
  const compiledBy = p.compiledBy || '';
  const approvedBy = p.approvedBy || '';
  const verifiedBy = p.verifiedBy || '';
  const logEntries = p.logEntries || [];
  const logoDataUri = p.assets && p.assets.logoDataUri;

  const hints = p.layoutHints || {};
  const widths = Array.isArray(hints.widths) && hints.widths.length ? hints.widths : (
    [180, 120].concat(Array.from({ length: 7 * 2 }, (_, i) => i % 2 === 0 ? 70 : 100)).concat([110])
  );

  const totalWidth = p._tableWidth || widths.reduce((s, w) => s + (Number(w) || 0), 0) || 1600;

  const HEADER_H = 40;
  const ROW_H = 45;

  const largeCol = widths[0]; // Full name
  const mediumCol = widths[1]; // Job title
  const dailyCols = widths.slice(2, 2 + 14);
  const supCol = widths[16];

  const dayBlocks = [];
  for (let d = 0; d < 7; d++) {
    const timeW = dailyCols[d * 2];
    const signW = dailyCols[d * 2 + 1];
    dayBlocks.push({ timeW, signW, total: (timeW + signW) });
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.card}>
        {/* Header Section */}
        <View style={styles.headerRow}>
          {logoDataUri ? (
            <Image source={{ uri: logoDataUri }} style={styles.logo} resizeMode="contain" />
          ) : (
            <Image source={require('../../assets/logo.jpeg')} style={styles.logo} resizeMode="contain" />
          )}
          <Text style={styles.title}>FOOD HANDLERS DAILY SHOWERING LOG</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.metaLabel}>Compiled By</Text>
            <Text style={styles.metaValue}>{compiledBy}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.metaLabel}>Approved By</Text>
            <Text style={styles.metaValue}>{approvedBy}</Text>
          </View>
        </View>

        <View style={styles.infoRowSmall}>
          <Text style={styles.meta}>Week: {week}</Text>
          <Text style={styles.meta}>Month: {month}</Text>
          <Text style={styles.meta}>Year: {year}</Text>
          <View style={styles.verifiedWrap}>
            {(() => {
              const v = p.metadata?.verifiedBySign || verifiedBy || p.metadata?.verifiedBy || null;
              const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
              return uri ? (
                <SignatureThumb uri={uri} width={150} height={40} layers={6} spread={1.0} />
              ) : (
                <Text style={styles.meta}>Verified By: {verifiedBy}</Text>
              );
            })()}
          </View>
        </View>

        {/* Table Section */}
        <ScrollView horizontal contentContainerStyle={{ minWidth: totalWidth }}>
          <View style={[styles.table, { minWidth: totalWidth }]}>

            {/* ROW 1: TOP HEADERS */}
            <View style={[styles.headerBand, { height: HEADER_H }]}>
              <View style={[styles.spanningCell, { width: largeCol + mediumCol }]}>
                <Text style={styles.headerText}>Staff Details</Text>
              </View>
              {dayBlocks.map((db, i) => (
                <View key={`day-${i}`} style={[styles.dayHeader, { width: db.total, height: HEADER_H }]}>
                  <Text style={styles.headerText}>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</Text>
                </View>
              ))}
              <View style={[styles.spanningCell, { width: supCol, borderRightWidth: 0 }]}>
                <Text style={styles.headerText}>Supervisor</Text>
              </View>
            </View>

            {/* ROW 2: SUB-HEADERS */}
            <View style={[styles.headerBand, { height: HEADER_H }]}>
              <View style={[styles.subHeaderCell, { width: largeCol }]}>
                <Text style={styles.headerText}>Full Name</Text>
              </View>
              <View style={[styles.subHeaderCell, { width: mediumCol }]}>
                <Text style={styles.headerText}>Job Title</Text>
              </View>
              {dayBlocks.flatMap((db, di) => [
                <View key={`time-${di}`} style={[styles.subHeaderCell, { width: db.timeW }]}>
                  <Text style={styles.headerText}>Time</Text>
                </View>,
                <View key={`sign-${di}`} style={[styles.subHeaderCell, { width: db.signW }]}>
                  <Text style={styles.headerText}>Sign</Text>
                </View>
              ])}
              <View style={[styles.subHeaderCell, { width: supCol, borderRightWidth: 0 }]}>
                <Text style={styles.headerText}>Sup Sign</Text>
              </View>
            </View>

            {/* DATA ROWS */}
            {logEntries.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.empty}>No entries saved.</Text>
              </View>
            ) : (
              logEntries.map((row, rIdx) => (
                <View key={`row-${rIdx}`} style={[styles.dataRow, { height: ROW_H }]}>
                  {/* Staff Info */}
                  <Text style={[styles.dataCell, { width: largeCol }]}>{row[0] || ''}</Text>
                  <Text style={[styles.dataCell, { width: mediumCol }]}>{row[1] || ''}</Text>
                  
                  {/* Daily Log Data */}
                  {Array.from({ length: 7 }).map((_, d) => (
                    <React.Fragment key={`d-${d}`}>
                      <Text style={[styles.dataCell, { width: dailyCols[d * 2] }]}>{row[2 + d * 2] || ''}</Text>
                      <View style={[styles.dataCell, { width: dailyCols[d * 2 + 1], justifyContent: 'center', alignItems: 'center' }]}>
                        {(() => {
                          const signVal = row[2 + d * 2 + 1];
                          const uri = signVal ? (String(signVal).startsWith('data:') ? signVal : `data:image/png;base64,${signVal}`) : null;
                          return uri ? <SignatureThumb uri={uri} width={dailyCols[d * 2 + 1] - 10} height={35} /> : null;
                        })()}
                      </View>
                    </React.Fragment>
                  ))}

                  {/* Supervisor Column */}
                  <View style={[styles.dataCell, { width: supCol, borderRightWidth: 0, justifyContent: 'center', alignItems: 'center' }]}>
                    {(() => {
                      const supVal = row[16]; // Index for supervisor sign
                      const supUri = supVal ? (String(supVal).startsWith('data:') ? supVal : `data:image/png;base64,${supVal}`) : null;
                      return supUri ? <SignatureThumb uri={supUri} width={supCol - 15} height={38} /> : null;
                    })()}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
        <View style={styles.footer} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 12 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 6 },
  title: { fontSize: 16, fontWeight: '800', textAlign: 'center', flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  logo: { width: 80, height: 40, marginRight: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  infoCol: { flex: 1 },
  infoRowSmall: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  metaLabel: { fontSize: 11, fontWeight: '700' },
  metaValue: { fontSize: 12, borderBottomWidth: 1, borderBottomColor: '#eee', minWidth: 100 },
  meta: { fontSize: 12, marginRight: 15 },
  verifiedWrap: { marginLeft: 'auto' },
  
  // Table Styling
  table: { borderWidth: 1.5, borderColor: '#000' },
  headerBand: { flexDirection: 'row', borderBottomWidth: 1.5, borderColor: '#000', backgroundColor: '#fff' },
  spanningCell: { justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderColor: '#000' },
  dayHeader: { justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderColor: '#000' },
  subHeaderCell: { justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderColor: '#000', paddingVertical: 4 },
  headerText: { fontSize: 10, fontWeight: 'bold', textAlign: 'center', color: '#000' },
  
  dataRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' },
  dataCell: { 
    fontSize: 11, 
    textAlign: 'center', 
    borderRightWidth: 1, 
    borderColor: '#000', 
    paddingHorizontal: 4,
    justifyContent: 'center',
    textAlignVertical: 'center' 
  },
  
  emptyContainer: { padding: 20, alignItems: 'center' },
  empty: { color: '#666', fontStyle: 'italic' },
  footer: { height: 20 }
});
import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

export default function BinLinersChangingLogPresentational({ payload }) {
  const p = payload || {};
  const entries = p.logEntries || [];
  const logoSource = p.assets?.logoDataUri ? { uri: p.assets.logoDataUri } : require('../../assets/logo.jpeg');
  const hints = p.layoutHints || {};
  // fixed column widths (desktop renderer should not rely on payload widths)
  const FIXED_COLS = { DATE: 100, CHANGED_BY: 240, AREA: 200, STAFF_SIGN: 200, SUP_SIGN: 200 };
  const TOTAL_FIXED_WIDTH = FIXED_COLS.DATE + FIXED_COLS.CHANGED_BY + FIXED_COLS.AREA + FIXED_COLS.STAFF_SIGN + FIXED_COLS.SUP_SIGN;
  const tableWidth = p._tableWidth ? Number(p._tableWidth) : null;

  // build column style overrides: prefer numeric hint but fall back to fixed column widths
  const colDateStyle = { width: Number(hints.DATE || FIXED_COLS.DATE), minWidth: Number(hints.DATE || FIXED_COLS.DATE), maxWidth: Number(hints.DATE || FIXED_COLS.DATE), flex: 0, flexShrink: 0 };
  const colChangedByStyle = { width: Number(hints.CHANGED_BY || FIXED_COLS.CHANGED_BY), minWidth: Number(hints.CHANGED_BY || FIXED_COLS.CHANGED_BY), maxWidth: Number(hints.CHANGED_BY || FIXED_COLS.CHANGED_BY), flex: 0, flexShrink: 0 };
  const colAreaStyle = { width: Number(hints.AREA || FIXED_COLS.AREA), minWidth: Number(hints.AREA || FIXED_COLS.AREA), maxWidth: Number(hints.AREA || FIXED_COLS.AREA), flex: 0, flexShrink: 0 };
  const colStaffSignStyle = { width: Number(hints.STAFF_SIGN || FIXED_COLS.STAFF_SIGN), minWidth: Number(hints.STAFF_SIGN || FIXED_COLS.STAFF_SIGN), maxWidth: Number(hints.STAFF_SIGN || FIXED_COLS.STAFF_SIGN), flex: 0, flexShrink: 0 };
  const colSupervisorSignStyle = { width: Number(hints.SUP_SIGN || FIXED_COLS.SUP_SIGN), minWidth: Number(hints.SUP_SIGN || FIXED_COLS.SUP_SIGN), maxWidth: Number(hints.SUP_SIGN || FIXED_COLS.SUP_SIGN), flex: 0, flexShrink: 0 };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Image source={logoSource} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.companyName}>BRAVO BRANDS LIMITED</Text>
          <Text style={styles.systemName}>Food Safety Management System</Text>
          <Text style={styles.subject}>Subject: BIN LINERS CHANGING LOG</Text>
        </View>
        <View style={styles.headerCenter}>
          <View style={styles.docRow}><Text style={styles.docLabel}>Doc No:</Text><Text style={styles.docValue}>BBN-SHEQ-F-BL-2</Text></View>
          <View style={styles.docRow}><Text style={styles.docLabel}>Issue Date:</Text><Text style={styles.docValue}>{p.date || ''}</Text></View>
          <View style={styles.docRow}><Text style={styles.docLabel}>Revision Date:</Text><Text style={styles.docValue}>N/A</Text></View>
        </View>
        <View style={styles.headerRight}><Text style={styles.pageInfo}>Page 1 of 1</Text></View>
      </View>

      {/* Table: enable horizontal scrolling and enforce widths from layoutHints */}
      <ScrollView horizontal contentContainerStyle={{ minWidth: tableWidth || TOTAL_FIXED_WIDTH }}>
            <View style={[styles.tableOuter, { width: tableWidth || TOTAL_FIXED_WIDTH }]}> 
              <View style={[styles.tableHeaderRow, { flexWrap: 'nowrap' }]}>
                <View style={[styles.colDate, colDateStyle]}><Text style={styles.colHeader} numberOfLines={1} ellipsizeMode="tail">DATE</Text></View>
                <View style={[styles.colChangedBy, colChangedByStyle]}><Text style={styles.colHeader} numberOfLines={1} ellipsizeMode="tail">CHANGED BY</Text></View>
                <View style={[styles.colArea, colAreaStyle]}><Text style={styles.colHeader} numberOfLines={1} ellipsizeMode="tail">AREA</Text></View>
                <View style={[styles.colStaffSign, colStaffSignStyle]}><Text style={styles.colHeader} numberOfLines={1} ellipsizeMode="tail">STAFF SIGN</Text></View>
                <View style={[styles.colSupervisorSign, colSupervisorSignStyle]}><Text style={styles.colHeader} numberOfLines={1} ellipsizeMode="tail">SUPERVISOR SIGN</Text></View>
              </View>
          {entries.map((e, i) => (
            <View key={i} style={[styles.tableRow, { flexWrap: 'nowrap' }]}>
              <View style={[styles.colDate, colDateStyle]}><Text numberOfLines={1} ellipsizeMode="tail">{e.date || ''}</Text></View>
              <View style={[styles.colChangedBy, colChangedByStyle]}><Text numberOfLines={1} ellipsizeMode="tail">{e.changedBy || ''}</Text></View>
              <View style={[styles.colArea, colAreaStyle]}><Text numberOfLines={1} ellipsizeMode="tail">{e.area || ''}</Text></View>
              <View style={[styles.colStaffSign, colStaffSignStyle]}>
                {(() => {
                  const v = e.staffSign;
                  const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
                  return uri ? <SignatureThumb uri={uri} width={150} height={60} layers={5} spread={0.9} /> : <Text>{v || ''}</Text>;
                })()}
              </View>

              <View style={[styles.colSupervisorSign, colSupervisorSignStyle]}>
                {(() => {
                  const v = e.supervisorSign;
                  const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
                  return uri ? <SignatureThumb uri={uri} width={150} height={60} layers={5} spread={0.9} /> : <Text>{v || ''}</Text>;
                })()}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.verificationBlock}>
        <View style={styles.verifyRow}>
          <Text style={styles.verifyLabel}>VERIFIED BY:</Text>
          {(() => {
            const v = p.metadata?.verifiedBySign;
            const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
            return uri ? <SignatureThumb uri={uri} width={240} height={80} layers={6} spread={1.0} /> : <Text style={styles.verifyValue}>{p.metadata?.verifiedBy || ''}</Text>;
          })()}
        </View>
        <View style={styles.verifyRow}>
          <Text style={styles.verifyLabel}>HSEQ Manager:</Text>
          {(() => {
            const v = p.metadata?.hseqManagerSign;
            const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
            return uri ? <SignatureThumb uri={uri} width={240} height={80} layers={6} spread={1.0} /> : <Text style={styles.verifyValue}>{p.metadata?.hseqManager || ''}</Text>;
          })()}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 120 },
  topHeader: { flexDirection: 'row', borderWidth: 1, borderColor: '#000', padding: 8, marginBottom: 8 },
  headerLeft: { width: 260, paddingRight: 12, borderRightWidth: 1, borderRightColor: '#000' },
  headerCenter: { flex: 1, paddingHorizontal: 12, justifyContent: 'center' },
  headerRight: { width: 120, justifyContent: 'center', alignItems: 'flex-end' },
  logoImage: { width: 96, height: 36, marginBottom: 6 },
  companyName: { fontSize: 10, fontWeight: '700' },
  systemName: { fontSize: 9, lineHeight: 10, marginBottom: 6 },
  subject: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  docRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  docLabel: { fontSize: 10, fontWeight: '700', marginRight: 6 },
  docValue: { fontSize: 10 },
  pageInfo: { fontSize: 10, fontWeight: '700' },

  tableOuter: { borderWidth: 1, borderColor: '#000', width: '100%' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#eee', borderBottomWidth: 1, borderColor: '#000', minHeight: 40, alignItems: 'center' },
  tableRow: { flexDirection: 'row', minHeight: 40, borderBottomWidth: 1, borderColor: '#000', alignItems: 'center' },
  colHeader: { fontWeight: '700', fontSize: 11, textAlign: 'center' },
  
  // prevent header text from shrinking/wrapping
  colHeaderNoWrap: { fontWeight: '700', fontSize: 11, textAlign: 'center', flexShrink: 0 },

  colDate: { paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colChangedBy: { paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colArea: { paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colStaffSign: { paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colSupervisorSign: { paddingHorizontal: 6 },

  verificationBlock: { marginTop: 12, paddingHorizontal: 4 },
  verifyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  verifyLabel: { width: 120, fontSize: 12, fontWeight: '700' },
  verifyValue: { flex: 1 }
});

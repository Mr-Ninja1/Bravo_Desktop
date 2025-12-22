import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

export default function PreShiftMeetingAttendancePresentational({ payload }) {
  if (!payload) return null;
  const { metadata = {}, agenda = '', presenter = '', dateVal = '', issues = [], table = {}, layoutHints = {}, assets = {} } = payload;
  const left = table.left || {};
  const right = table.right || {};
  const rows = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
      {/* Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          {assets.logoDataUri ? (
            <Image source={{ uri: assets.logoDataUri }} style={styles.logoImage} resizeMode="contain" />
          ) : (
            <Image source={require('../../assets/logo.jpeg')} style={styles.logoImage} resizeMode="contain" />
          )}
          <Text style={styles.bravoBrand}>Bravo</Text>
          <Text style={styles.companyName}>BRAVO BRANDS LIMITED</Text>
          <Text style={styles.systemName}>Safety Management System</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.docRow}>
            <Text style={styles.docLabel}>Doc No:</Text>
            <Text style={styles.docValue}>BBN-SHEQ-PSM-R-01</Text>
            <Text style={[styles.docLabel, { marginLeft: 12 }]}>Page 1 of 1</Text>
          </View>
          <View style={styles.docRow}>
            <Text style={styles.docLabel}>Issue Date:</Text>
            <Text style={styles.docValue}>{dateVal}</Text>
            <Text style={[styles.docLabel, { marginLeft: 12 }]}>Review Date:</Text>
            <Text style={styles.docValue}>N/A</Text>
          </View>
          <View style={[styles.docRow, { marginTop: 8, borderTopWidth: 1, borderColor: '#000', paddingTop: 4 }]}>
            <Text style={styles.docLabel}>Compiled By:</Text>
            {(() => {
              const v = metadata.compiledBySign || metadata.compiledBy || (payload && payload.compiledBy) || '';
              const uri = v ? (String(v).startsWith('data:') ? v : (String(v).length > 100 ? `data:image/png;base64,${String(v).replace(/\s+/g, '')}` : null)) : null;
              const name = metadata.compiledBy || (payload && payload.compiledBy) || 'Michael C. Zulu';
              return uri ? <SignatureThumb uri={uri} width={160} height={50} layers={6} spread={0.9} /> : <Text style={styles.docValue}>{name}</Text>;
            })()}
            <Text style={[styles.docLabel, { marginLeft: 12 }]}>Approved By:</Text>
            {(() => {
              const v = metadata.approvedBySign || metadata.approvedBy || (payload && payload.approvedBy) || '';
              const uri = v ? (String(v).startsWith('data:') ? v : (String(v).length > 100 ? `data:image/png;base64,${String(v).replace(/\s+/g, '')}` : null)) : null;
              const name = metadata.approvedBy || (payload && payload.approvedBy) || 'Hasani Al';
              return uri ? <SignatureThumb uri={uri} width={160} height={50} layers={6} spread={0.9} /> : <Text style={styles.docValue}>{name}</Text>;
            })()}
          </View>
          <View style={styles.docRow}>
            <Text style={styles.docLabel}>Version No:</Text>
            <Text style={styles.docValue}>01</Text>
            <Text style={[styles.docLabel, { marginLeft: 12 }]}>Rev No:</Text>
            <Text style={styles.docValue}>00</Text>
          </View>
        </View>
      </View>
      <Text style={styles.title}>PRE-SHIFT MEETING ATTENDANCE REGISTER</Text>
      <View style={styles.infoBlock}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>AGENDA:</Text>
          <Text style={[styles.infoFill, styles.inputUnderline, { flex: 2.5 }]}>{agenda}</Text>
          <Text style={[styles.infoLabel, { marginLeft: 16 }]}>PRESENTER:</Text>
          <Text style={[styles.infoFill, styles.inputUnderline, { flex: 1.5 }]}>{presenter}</Text>
          <Text style={[styles.infoLabel, { marginLeft: 16 }]}>DATE:</Text>
          <Text style={[styles.infoFill, styles.inputUnderline, { flex: 1 }]}>{dateVal}</Text>
        </View>
        <View style={styles.topicsBlock}>
          <Text style={styles.topicsTitle}>ITEMS/ISSUES DISCUSSED:</Text>
          {issues.map((issue, index) => (
            <View key={index} style={styles.topicLine}>
              <Text style={styles.dot}>{index + 1}.</Text>
              <Text style={[styles.topicInput, styles.inputUnderline]}>{issue}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.tableOuter}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.colHeader, { width: 48 }]}>S/N</Text>
          <Text style={[styles.colHeader, { width: 156 }]}>FULL NAME</Text>
          <Text style={[styles.colHeader, { width: 132 }]}>JOB TITLE</Text>
          <Text style={[styles.colHeader, { width: 160, borderRightWidth: 0 }]}>SIGNATURE</Text>
          <Text style={[styles.colHeader, { width: 48 }]}>S/N</Text>
          <Text style={[styles.colHeader, { width: 156 }]}>FULL NAME</Text>
          <Text style={[styles.colHeader, { width: 132 }]}>JOB TITLE</Text>
          <Text style={[styles.colHeader, { width: 160, borderRightWidth: 0 }]}>SIGNATURE</Text>
        </View>
        {rows.map((n) => (
          <View key={`row-${n}`} style={styles.tableRow}>
            <Text style={[styles.cellText, { width: 48 }]}>{n}.</Text>
            <Text style={[styles.cellInput, { width: 156 }]}>{left[n]?.name}</Text>
            <Text style={[styles.cellInput, { width: 132 }]}>{left[n]?.job}</Text>
                <View style={{ width: 160, alignItems: 'center', justifyContent: 'center' }}>
                  {(() => {
                    const v = left[n]?.sign;
                    const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
                    return uri ? <SignatureThumb uri={uri} width={150} height={60} layers={6} spread={0.9} /> : <Text style={[styles.cellInput, { borderRightWidth: 0 }]}>{v || ''}</Text>;
                  })()}
                </View>
            <Text style={[styles.cellText, { width: 48 }]}>{n + 10}.</Text>
            <Text style={[styles.cellInput, { width: 156 }]}>{right[n + 10]?.name}</Text>
            <Text style={[styles.cellInput, { width: 132 }]}>{right[n + 10]?.job}</Text>
            <View style={{ width: 160, alignItems: 'center', justifyContent: 'center' }}>
              {(() => {
                const v = right[n + 10]?.sign;
                const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
                return uri ? <SignatureThumb uri={uri} width={150} height={60} layers={6} spread={0.9} /> : <Text style={[styles.cellInput, { borderRightWidth: 0 }]}>{v || ''}</Text>;
              })()}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  mainScrollContent: { padding: 16, paddingBottom: 120 },
  topHeader: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingRight: 10
  },
  headerLeft: {
    width: 240, 
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#000',
    alignItems: 'flex-start',
  },
  headerRight: {
    flex: 1, 
    paddingLeft: 12,
  },
  logoPlaceholder: { 
    width: 80, 
    height: 32, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#333'
  },
  logoText: { 
    fontSize: 18, 
    fontWeight: '900', 
    color: '#333' 
  },
  logoImage: {
    width: 96,
    height: 36,
    marginBottom: 6,
  },
  bravoBrand: {
    fontSize: 28,
    fontWeight: '900',
    color: '#185a9d',
    marginTop: -8,
    marginBottom: -2,
    letterSpacing: 1.5,
  },
  companyName: { 
    fontSize: 10, 
    fontWeight: '700',
    lineHeight: 12,
    marginTop: -2 
  },
  systemName: {
    fontSize: 9,
    lineHeight: 10,
    marginBottom: 8,
  },
  docRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  docLabel: { fontSize: 10, fontWeight: '700', marginRight: 4, lineHeight: 12 },
  docValue: { fontSize: 10, color: '#111', marginRight: 12, flexShrink: 1, lineHeight: 12 },
  title: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginVertical: 8, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 4 },
  infoBlock: { borderWidth: 1, borderColor: '#000', padding: 10, marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12 },
  infoLabel: { fontWeight: '700', marginRight: 6, fontSize: 13 },
  infoFill: { flex: 1, marginRight: 0 },
  topicsBlock: { marginTop: 6 },
  topicsTitle: { fontWeight: '700', marginBottom: 6, fontSize: 13 },
  topicLine: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  dot: { width: 20, fontSize: 13, fontWeight: '600' },
  inputUnderline: { 
    borderBottomWidth: 1, 
    borderBottomColor: '#000', 
    paddingVertical: 0, 
    fontSize: 13,
    height: 20, 
    paddingLeft: 4,
    backgroundColor: '#f9f9f9' 
  },
  topicInput: { flex: 1 },
  tableOuter: { 
    borderWidth: 1, 
    borderColor: '#000',
    width: '100%',
  },
  tableHeaderRow: { 
    flexDirection: 'row', 
    backgroundColor: '#eee', 
    paddingVertical: 6, 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: '#000',
    minHeight: 40 
  },
  colHeader: { fontWeight: '700', textAlign: 'center', fontSize: 10, borderRightWidth: 1, borderRightColor: '#000', paddingHorizontal: 2 },
  tableRow: { 
    flexDirection: 'row', 
    minHeight: 72, 
    alignItems: 'stretch', 
    borderBottomWidth: 1, 
    borderBottomColor: '#000' 
  },
  cellInput: { fontSize: 12, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', paddingHorizontal: 2 },
  cellText: { fontSize: 12, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', paddingHorizontal: 2 },
});

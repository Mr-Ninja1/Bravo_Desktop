import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

export default function ToolboxTalkRegisterPresentational({ payload }) {
  if (!payload) return null;
  const p = payload.payload || payload;
  const meta = p.metadata || {};
  const formData = p.formData || {};
  const issues = formData.issues || [];
  const cells = formData.cells || { left: {}, right: {} };

  const rows = Array.from({ length: 10 }, (_, i) => i + 1);

  const resolveSignatureUri = (val) => {
    if (!val) return null;
    const s = String(val);
    if (s.startsWith('data:')) return s;
    if (s.length > 100 && !s.includes(' ')) return `data:image/png;base64,${s}`;
    return null;
  };

  const logo = () => (
    <Image source={require('../../assets/logo.jpeg')} style={styles.logoImage} resizeMode="contain" />
  );

  return (
    <ScrollView contentContainerStyle={styles.mainScrollContent}>
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          {logo()}
          <Text style={styles.companyName}>BRAVO BRANDS LIMITED</Text>
          <Text style={styles.systemName}>Safety Management System</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.docRow}>
            <Text style={styles.docLabel}>Doc No:</Text>
            <Text style={styles.docValue}>BBN-SHEQ-TBT-R-01</Text>
            <Text style={[styles.docLabel, { marginLeft: 12 }]}>Page 1 of 1</Text>
          </View>
          <View style={styles.docRow}>
            <Text style={styles.docLabel}>Issue Date:</Text>
            <Text style={styles.docValue}>{meta.date || ''}</Text>
            <Text style={[styles.docLabel, { marginLeft: 12 }]}>Review Date:</Text>
            <Text style={styles.docValue}>N/A</Text>
          </View>
          <View style={[styles.docRow, { marginTop: 8, borderTopWidth: 1, borderColor: '#000', paddingTop: 4 }]}>
            <Text style={styles.docLabel}>Compiled By:</Text>
            <Text style={styles.docValue}>Michael C. Zulu</Text>
            <Text style={[styles.docLabel, { marginLeft: 12 }]}>Approved By:</Text>
            <Text style={styles.docValue}>Hasani Al</Text>
          </View>
        </View>
      </View>

      <Text style={styles.title}>TOOL BOX TALK REGISTER</Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Presenter:</Text>
        <Text style={styles.metaValue}>{meta.presenter || ''}</Text>
        <Text style={[styles.metaLabel, { marginLeft: 16 }]}>Date:</Text>
        <Text style={styles.metaValue}>{meta.date || ''}</Text>
      </View>

      <View style={styles.infoBlock}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>AGENDA/TOPIC:</Text>
          <Text style={[styles.infoFill, styles.inputUnderline]}>{meta.agenda || ''}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>PRESENTER:</Text>
          <Text style={[styles.infoFill, styles.inputUnderline]}>{meta.presenter || ''}</Text>
          <Text style={[styles.infoLabel, { marginLeft: 16 }]}>DATE:</Text>
          <Text style={[styles.infoFill, styles.inputUnderline]}>{meta.date || ''}</Text>
        </View>
        <View style={styles.topicsBlock}>
          <Text style={styles.topicsTitle}>KEY POINTS DISCUSSED:</Text>
          {issues.map((issue, index) => (
            <View key={index} style={styles.topicLine}>
              <Text style={styles.dot}>{index + 1}.</Text>
              <Text style={[styles.topicInput, styles.inputUnderline]}>{issue}</Text>
            </View>
          ))}
        </View>
      </View>

        <View style={{ width: '100%' }}>
        <View style={[styles.tableOuter, { alignSelf: 'stretch', paddingHorizontal: 0 }]}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colHeader, styles.columnBase, { width: 48 }]}>S/N</Text>
            <Text style={[styles.colHeader, styles.columnBase, { width: 156 }]}>FULL NAME (Print)</Text>
            <Text style={[styles.colHeader, styles.columnBase, { width: 132 }]}>JOB TITLE/DEPT</Text>
            <Text style={[styles.colHeader, styles.columnBase, { width: 140, borderRightWidth: 0 }]}>SIGNATURE</Text>

            <Text style={[styles.colHeader, styles.columnBase, { width: 48 }]}>S/N</Text>
            <Text style={[styles.colHeader, styles.columnBase, { width: 156 }]}>FULL NAME (Print)</Text>
            <Text style={[styles.colHeader, styles.columnBase, { width: 132 }]}>JOB TITLE/DEPT</Text>
            <Text style={[styles.colHeader, styles.columnBase, { width: 140, borderRightWidth: 0 }]}>SIGNATURE</Text>
          </View>
          {rows.map((n) => (
            <View key={`row-${n}`} style={styles.tableRow}>
              <Text style={[styles.cellText, styles.columnBase, { width: 48 }]}>{n}.</Text>
              <Text numberOfLines={2} ellipsizeMode="tail" style={[styles.cellInput, styles.columnBase, { width: 156 }]}>{cells.left[n]?.name || ''}</Text>
              <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.cellInput, styles.columnBase, { width: 132 }]}>{cells.left[n]?.job || ''}</Text>
              {(() => {
                const s = cells.left[n]?.sign;
                const uri = resolveSignatureUri(s);
                return uri ? (
                  <SignatureThumb uri={uri} width={140} height={44} layers={7} spread={0.8} />
                ) : (
                  <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.cellInput, styles.columnBase, { width: 140, borderRightWidth: 0 }]}>{s || ''}</Text>
                );
              })()}

              <Text style={[styles.cellText, styles.columnBase, { width: 48 }]}>{n + 10}.</Text>
              <Text numberOfLines={2} ellipsizeMode="tail" style={[styles.cellInput, styles.columnBase, { width: 156 }]}>{cells.right[n + 10]?.name || ''}</Text>
              <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.cellInput, styles.columnBase, { width: 132 }]}>{cells.right[n + 10]?.job || ''}</Text>
              {(() => {
                const s = cells.right[n + 10]?.sign;
                const uri = resolveSignatureUri(s);
                return uri ? (
                  <SignatureThumb uri={uri} width={140} height={44} layers={7} spread={0.8} />
                ) : (
                  <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.cellInput, styles.columnBase, { width: 140, borderRightWidth: 0 }]}>{s || ''}</Text>
                );
              })()}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  logoImage: {
    width: 96,
    height: 36,
    marginBottom: 6,
  },
  companyName: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
    marginTop: -8
  },
  systemName: {
    fontSize: 9,
    lineHeight: 10,
    marginBottom: 8,
  },
  docRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  docLabel: { fontSize: 10, fontWeight: '700', marginRight: 4, lineHeight: 12 },
  docValue: { fontSize: 10, color: '#111', marginRight: 12, flexShrink: 1, lineHeight: 12 },
  title: { fontSize: 18, fontWeight: '900', textAlign: 'center', marginVertical: 10, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 6 },
  infoBlock: { borderWidth: 1, borderColor: '#000', padding: 10, marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12 },
  infoLabel: { fontWeight: '800', marginRight: 6, fontSize: 14 },
  infoFill: { flex: 1, marginRight: 0, fontSize: 14, fontWeight: '600' },
  topicsBlock: { marginTop: 6 },
  topicsTitle: { fontWeight: '800', marginBottom: 6, fontSize: 15 },
  topicLine: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  dot: { width: 20, fontSize: 13, fontWeight: '600' },
  inputUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingVertical: 0,
    fontSize: 14,
    height: 22,
    paddingLeft: 6,
    backgroundColor: '#fff'
  },
  topicInput: { flex: 1 },
  tableOuter: {
    borderWidth: 1,
    borderColor: '#000',
    width: '100%',
    alignSelf: 'stretch',
    paddingHorizontal: 0,
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
  colHeader: { fontWeight: '800', textAlign: 'center', fontSize: 11 },
  tableRow: {
    flexDirection: 'row',
    minHeight: 36,
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: '#000'
  },
  colSn: {
    flex: 0.07,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: '#000',
    justifyContent: 'center'
  },
  colName: {
    flex: 0.38,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: '#000',
    justifyContent: 'center'
  },
  colJob: {
    flex: 0.32,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: '#000',
    justifyContent: 'center'
  },
  colSign: {
    flex: 0.23,
    paddingHorizontal: 6,
    borderRightWidth: 0,
    justifyContent: 'center'
  },
  cellInput: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    textAlignVertical: 'center',
    fontSize: 13
  },
  cellText: { fontSize: 13, textAlign: 'center' },
  columnBase: { paddingHorizontal: 6, paddingVertical: 6, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000' },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  metaLabel: { fontWeight: '800', marginRight: 6, fontSize: 13 },
  metaValue: { fontSize: 13, fontWeight: '700' }
});
import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

// normalizeSignature: accepts data: URIs or legacy base64 blobs and returns a data: URI or null
const normalizeSignature = (v) => {
  if (!v) return null;
  if (typeof v !== 'string') return null;
  if (v.startsWith('data:')) return v;
  const compact = v.replace(/\s+/g, '');
  if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
};

const renderSignature = (val, textStyle, thumbProps = {}) => {
  const uri = normalizeSignature(val);
  if (uri) {
    // Provide stronger defaults for this presentational so signatures appear
    // visually bolder. Callers may override by passing explicit thumbProps.
    const strongDefaults = { layers: 7, spread: 1.2 };
    const finalThumbProps = Object.assign({}, strongDefaults, thumbProps);
    return <SignatureThumb uri={uri} {...finalThumbProps} />;
  }
  return <Text style={textStyle}>{val || ''}</Text>;
};

const PPEIssuancePresentational = ({ payload }) => {
  const p = payload || {};
  const metadata = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : [];
  const assets = p.assets || {};

  const columnOrder = ['id','name','jobTitle','apron','cap','chefHat','trousers','safetyBoots','shirt','golfTShirt','workSuit','chefCoat','staffNrc','staffSign','supSign'];

  return (
    <ScrollView horizontal contentContainerStyle={{ padding: 12 }}>
      <View style={[styles.container]}>
        {/* Header: left logo+company block, right metadata. Title/subject centered below to match editable form */}
        <View style={styles.headerRow}>
          <View style={styles.logoAndTitle}>
            {assets.logoDataUri ? (
              <Image source={{ uri: assets.logoDataUri }} style={styles.logoLeft} />
            ) : (
              <Image source={require('../../assets/logo.jpeg')} style={styles.logoLeft} />
            )}
            <Text style={styles.logoText}>Bravo</Text>
            <View style={styles.titleBlock}>
              <Text style={styles.documentTitle}>BRAVO BRANDS LIMITED</Text>
              <Text style={styles.documentTitleSub}>Food Safety Management System</Text>
            </View>
          </View>

          <View style={styles.metaCol}><Text style={styles.metaText}>Issue Date: {metadata.issueDate || ''}</Text></View>
        </View>

        {/* Centered form title and subject (matches editable form layout) */}
        <View style={styles.centerTitleWrap}>
          <Text style={styles.centeredTitle}>{p.title || 'Personal  Protective Equipment Log'}</Text>
          <Text style={styles.subjectText}><Text style={styles.boldText}>Subject:</Text> {metadata.subject || 'Personal Protective Equipment'}</Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.hCell, styles.noCol]}>NO.</Text>
          <Text style={[styles.hCell, styles.nameCol]}>NAME</Text>
          <Text style={[styles.hCell, styles.jobCol]}>JOB TITLE</Text>
          <Text style={[styles.hCell, styles.ppeCol]}>APRON</Text>
          <Text style={[styles.hCell, styles.ppeCol]}>CAP</Text>
          <Text style={[styles.hCell, styles.ppeCol]}>CHEF HAT</Text>
          <Text style={[styles.hCell, styles.ppeCol]}>TROUSERS</Text>
          <Text style={[styles.hCell, styles.ppeCol]}>SAFETY BOOTS</Text>
          <Text style={[styles.hCell, styles.ppeCol]}>SHIRT</Text>
          <Text style={[styles.hCell, styles.ppeCol]}>GOLF T-SHIRT</Text>
          <Text style={[styles.hCell, styles.ppeCol]}>WORK SUIT</Text>
          <Text style={[styles.hCell, styles.ppeCol]}>CHEF COAT</Text>
          <Text style={[styles.hCell, styles.signCol]}>STAFF NRC</Text>
          <Text style={[styles.hCell, styles.signCol]}>STAFF SIGN</Text>
          <Text style={[styles.hCell, styles.signCol]}>SUP SIGN</Text>
        </View>

        {rows.map((r, i) => (
          <View key={r.id || i} style={styles.row}>
            <Text style={[styles.cell, styles.noCol]}>{r.id || i+1}</Text>
            <Text style={[styles.cell, styles.nameCol]}>{r.name || ''}</Text>
            <Text style={[styles.cell, styles.jobCol]}>{r.jobTitle || ''}</Text>
            {['apron','cap','chefHat','trousers','safetyBoots','shirt','golfTShirt','workSuit','chefCoat'].map((k,i)=>{
              const v = r[k];
              const disp = v === 'tick' ? '✔️' : (v === 'cross' ? '✖️' : '');
              return <Text key={`p-${i}`} style={[styles.cell, styles.ppeCol]}>{disp}</Text>;
            })}
            <View style={[styles.cell, styles.signCol]}>{renderSignature(r.staffNrc, styles.cellText, { width: columnWidths.sign - 8, height: 32 })}</View>
            <View style={[styles.cell, styles.signCol]}>{renderSignature(r.staffSign, styles.cellText, { width: columnWidths.sign - 8, height: 32 })}</View>
            <View style={[styles.cell, styles.signCol]}>{renderSignature(r.supSign, styles.cellText, { width: columnWidths.sign - 8, height: 32 })}</View>
          </View>
        ))}

        <View style={styles.footerRow}>
          {(() => {
            const hseq = metadata.hseqManagerSignature || metadata.hseqManagerSign || metadata.hseqManager || '';
            const complex = metadata.complexManagerSignature || metadata.complexManagerSign || metadata.complexManager || '';
            const fin = metadata.financialControllerSignature || metadata.financialController || '';
            return (
              <>
                <View style={{ flex: 1 }}>{renderSignature(hseq, styles.footerText, { width: 160, height: 48 })}</View>
                <View style={{ flex: 1 }}>{renderSignature(complex, styles.footerText, { width: 160, height: 48 })}</View>
                <View style={{ flex: 1 }}>{renderSignature(fin, styles.footerText, { width: 160, height: 48 })}</View>
              </>
            );
          })()}
        </View>
      </View>
    </ScrollView>
  );
};

const columnWidths = {
  no: 40, name: 180, job: 140, ppe: 60, sign: 120
};
const totalWidth = columnWidths.no + columnWidths.name + columnWidths.job + (columnWidths.ppe * 9) + (columnWidths.sign * 3);

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', width: totalWidth },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, borderWidth: 1, borderColor: '#000', padding: 6 },
  logoAndTitle: { flexDirection: 'row', alignItems: 'center', flex: 2 },
  logoLeft: { width: 36, height: 36, resizeMode: 'contain', marginRight: 8 },
  logoText: { fontSize: 24, fontWeight: 'bold', color: '#A00', marginRight: 10 },
  titleBlock: { borderLeftWidth: 1, borderLeftColor: '#000', paddingLeft: 10 },
  documentTitle: { fontWeight: 'bold', fontSize: 12 },
  documentTitleSub: { fontSize: 10 },
  metaCol: { flex: 1.5, alignItems: 'flex-start', marginLeft: 10 },
  metaText: { fontSize: 10 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#eee', borderWidth: 1, borderColor: '#000' },
  hCell: { padding: 6, fontSize: 10, fontWeight: '700', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 34 },
  cell: { padding: 6, fontSize: 10, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000' },
  noCol: { width: columnWidths.no },
  nameCol: { width: columnWidths.name, textAlign: 'left' },
  jobCol: { width: columnWidths.job },
  ppeCol: { width: columnWidths.ppe },
  signCol: { width: columnWidths.sign },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  footerText: { fontWeight: '700', fontSize: 10, flex: 1 }
  ,
  centerTitleWrap: { alignItems: 'center', marginVertical: 6 },
  centeredTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  subjectText: { fontSize: 12, marginTop: 4 },
  boldText: { fontWeight: '700' }
});

export default PPEIssuancePresentational;

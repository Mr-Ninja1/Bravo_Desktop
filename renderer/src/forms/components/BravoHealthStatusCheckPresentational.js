import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

function normalizeSignature(v) {
  if (!v) return null;
  // string cases
  if (typeof v === 'string') {
    const s = v.trim();
    // data URI
    if (s.startsWith('data:')) return s;
    // http(s) or file or content URIs
    if (/^https?:\/\//i.test(s) || /^file:\/\//i.test(s) || /^content:\/\//i.test(s) || s.startsWith('/')) return s;
    // compact base64
    const compact = s.replace(/\s+/g, '');
    if (compact.length > 200 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
    return null;
  }

  // object-shaped signature
  if (typeof v === 'object') {
    if (v.uri && typeof v.uri === 'string') return v.uri;
    if (v.data && typeof v.data === 'string') return v.data.startsWith('data:') ? v.data : `data:image/png;base64,${v.data}`;
    if (v.signature && typeof v.signature === 'string') return v.signature.startsWith('data:') ? v.signature : `data:image/png;base64,${v.signature}`;
    if (v.base64 && typeof v.base64 === 'string') return `data:image/png;base64,${v.base64}`;
  }
  return null;
}

function renderMaybeSignature(v, thumbProps = {}) {
  const uri = normalizeSignature(v);
  if (uri) return <SignatureThumb uri={uri} {...thumbProps} />;
  return <Text>{v || ''}</Text>;
}

const daysOfWeek = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function BravoHealthStatusCheckPresentational({ payload }) {
  if (!payload) return null;
  // DEBUG: inspect metadata keys when rendering saved form (temporary)
  try { console.log('BravoHealth payload metadata:', payload?.metadata); console.log('keys:', { supervisorSign: payload?.metadata?.supervisorSign, supervisorName: payload?.metadata?.supervisorName, complexManagerSign: payload?.metadata?.complexManagerSign, hseqManagerSign: payload?.metadata?.hseqManagerSign }); } catch (e) {}
  const layout = payload.layoutHints || {};
  const nameW = layout.name || 140;
  const positionW = layout.position || 100;
  const dayCol = layout.dayCol || 140;
  const fitWidth = layout.fitWidth || 40;
  const commentWidth = layout.commentWidth || (dayCol - fitWidth);
  const tableWidth = payload._tableWidth || (nameW + positionW + (7 * dayCol));

  const rows = Array.isArray(payload.formData) ? payload.formData : [];

  return (
    <ScrollView contentContainerStyle={{ padding: 10 }}>
      {/* Document Header */}
      <View style={styles.docHeader}>
        <View style={styles.logoAndTitle}>
          <Image source={require('../../assets/logo.jpeg')} style={styles.logoImage} />
          <View>
            <Text style={styles.logoText}>Bravo</Text>
            <Text style={styles.documentTitle}>FOOD PRODUCTION AND SERVICE PERSONNEL</Text>
            <Text style={styles.documentSub}>Food Safety Management System</Text>
          </View>
        </View>
        <View style={styles.docDetails}>
          <Text style={styles.detailText}>Doc Ref: {payload?.metadata?.docRef || 'BBN-SHEQ-P-R-72'}</Text>
          <Text style={styles.detailText}>Issue Date: {payload?.metadata?.issueDate || payload?.date || ''}</Text>
        </View>
      </View>

      <Text style={styles.formTitle}>BRAVO BRANDS HEALTH STATUS CHECK</Text>

      {/* Section / meta fields (SITE / WEEK / MONTH / YEAR / supervisor signatures) */}
      <View style={styles.sectionRow}>
        <View style={[styles.metaBox, { flex: 1 }]}>
          <Text style={styles.metaLabel}>SITE</Text>
          <Text style={styles.metaValue}>{payload?.metadata?.site || 'Enter Site'}</Text>
        </View>
        <View style={[styles.metaBox, { flex: 1 }]}>
          <Text style={styles.metaLabel}>WEEK</Text>
          <Text style={styles.metaValue}>{payload?.metadata?.week || 'Enter Week'}</Text>
        </View>
        <View style={[styles.metaBox, { flex: 1 }]}>
          <Text style={styles.metaLabel}>MONTH</Text>
          <Text style={styles.metaValue}>{payload?.metadata?.month || 'Enter Month'}</Text>
        </View>
      </View>

      <View style={styles.signRow}>
        <View style={[styles.signBox, { flex: 1 }]}>
          <Text style={styles.signLabel}>Supervisor  Sign</Text>
          {(() => {
            const v = payload?.metadata?.supervisorSign || payload?.metadata?.supervisorSignature || payload?.metadata?.supervisor || payload?.metadata?.supervisorName || '';
            return renderMaybeSignature(v, { width: 220, height: 60 });
          })()}
        </View>
        <View style={[styles.signBox, { flex: 1 }]}>
          <Text style={styles.signLabel}>Complex Manager Name &</Text>
          {renderMaybeSignature(payload?.metadata?.complexManagerSign || payload?.metadata?.complexManager || '', { width: 220, height: 60 })}
        </View>
        <View style={[styles.signBox, { flex: 1 }]}>
          <Text style={styles.signLabel}>HSEQ Manager Sign</Text>
          {renderMaybeSignature(payload?.metadata?.hseqManagerSign || payload?.metadata?.hseqManager || payload?.metadata?.hseqSign || '', { width: 220, height: 60 })}
        </View>
      </View>

      {/* Explanatory text above the table (copied from editable form) */}
      <View style={styles.explanatory}>
        <Text style={styles.p}>Ask if employee is unwell or if the employee has been unwell on leave or at home?</Text>
        <Text style={styles.p}>Ask if employee is taking/has taken any medicine - Medicine refers to ALL medications e.g. Company doctor prescriptions, local medicines from herbalists, any self-treatment etc</Text>
        <Text style={styles.p}>Ask if employee has taken any banned substances e.g. marijuana, hashish etc.</Text>
        <Text style={[styles.p, styles.pBold]}>Ask if employee has any symptoms or suffering from?</Text>
        <View style={styles.list}>
          <Text style={styles.li}>- Infection of the ears, nose, throat, eyes, teeth or chest</Text>
          <Text style={styles.li}>- Flu-like infections</Text>
          <Text style={styles.li}>- Skin Infections</Text>
          <Text style={styles.li}>- Vomiting</Text>
          <Text style={styles.li}>- Diarrhoea</Text>
          <Text style={styles.li}>- Jaundice</Text>
        </View>
        <Text style={[styles.p, styles.pBold]}>Ask the employee if he has been in contact to their knowledge with any person with the following</Text>
        <View style={styles.list}>
          <Text style={styles.li}>- Typhoid</Text>
          <Text style={styles.li}>- Paraphoid</Text>
          <Text style={styles.li}>- Dysentery</Text>
          <Text style={styles.li}>- Hepatitis</Text>
          <Text style={styles.li}>- Any other infectious disease</Text>
        </View>
        <Text style={[styles.p, styles.pBold]}>The supervisor must check the following for each employee</Text>
        <View style={styles.list}>
          <Text style={styles.li}>- All cuts, pimples and boils are covered with a waterproof dressing</Text>
          <Text style={styles.li}>- Jewellery is in line with company policy</Text>
          <Text style={styles.li}>- Chefs have a hat or hair net</Text>
          <Text style={styles.li}>- The employee is wearing their safety shoes</Text>
          <Text style={styles.li}>- The employee is neatly dressed</Text>
        </View>
        <Text style={styles.p}>If any employee answers to A & B positively then they must be referred to the Complex manager</Text>
        <Text style={styles.p}>If any employee does not comply with company policy (section C), this must be rectified before they start work</Text>
      </View>

      {/* Note - appear above the table */}
      <Text style={styles.note}>Note - The supervisor and the manager will be liable for the health of employees and subordinates once they sign the above</Text>

      {/* The table (horizontal scroll if needed) */}
      <ScrollView horizontal contentContainerStyle={{ minWidth: tableWidth, marginTop: 6 }}>
        <View style={styles.table}>
          <View style={[styles.headerRow, { minWidth: tableWidth }]}> 
            <Text style={[styles.headerCell, { width: nameW }]}>NAMES</Text>
            <Text style={[styles.headerCell, { width: positionW }]}>POSITION</Text>
            {daysOfWeek.map(d => (
              <View key={d} style={[styles.dayCol, { width: dayCol }]}> 
                <Text style={styles.dayTitle}>{d}</Text>
                <View style={styles.subHeaderRow}>
                  <Text style={[styles.subCell, { width: fitWidth }]}>{'Fit for\nwork'}</Text>
                  <Text style={[styles.subCell, { width: commentWidth }]}>Managers comment</Text>
                </View>
              </View>
            ))}
          </View>

          {rows.map((r, idx) => (
            <View key={r.id || idx} style={[styles.row, { minWidth: tableWidth }]}> 
              <Text style={[styles.cell, { width: nameW }]}>{r.name}</Text>
              <Text style={[styles.cell, { width: positionW }]}>{r.position}</Text>
              {daysOfWeek.map(d => {
                const cell = r.weeklyChecks?.[d] || { fit: null, comment: '' };
                return (
                  <View key={d} style={{ flexDirection: 'row' }}>
                    <Text style={[styles.cell, { width: fitWidth }]}>{cell.fit === true ? '✓' : (cell.fit === false ? 'X' : '')}</Text>
                    <Text style={[styles.cell, { width: commentWidth, textAlign: 'left' }]}>{cell.comment}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Removed duplicate signature block that appeared below the table */}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  table: { borderWidth: 1, borderColor: '#000' },
  headerRow: { flexDirection: 'row', backgroundColor: '#eee', borderBottomWidth: 1, borderBottomColor: '#000' },
  headerCell: { fontWeight: '700', padding: 6, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
  dayCol: { borderRightWidth: 1, borderRightColor: '#000' },
  dayTitle: { textAlign: 'center', fontWeight: '700', padding: 4, borderBottomWidth: 1, borderBottomColor: '#000' },
  subHeaderRow: { flexDirection: 'row' },
  subCell: { padding: 4, fontSize: 10, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 36, alignItems: 'center' },
  cell: { padding: 6, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
  docHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderWidth: 1, borderColor: '#000', padding: 6, marginBottom: 6 },
  logoAndTitle: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 48, height: 36, resizeMode: 'contain', marginRight: 8 },
  logoText: { fontSize: 20, fontWeight: '700', color: '#A00' },
  documentTitle: { fontWeight: '700', fontSize: 12 },
  documentSub: { fontSize: 10 },
  docDetails: { alignItems: 'flex-start' },
  detailText: { fontSize: 10 },
  formTitle: { fontSize: 14, fontWeight: '700', marginTop: 8, marginBottom: 6 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  metaBox: { borderWidth: 1, borderColor: '#ccc', padding: 6, marginRight: 6 },
  metaLabel: { fontSize: 10, fontWeight: '700' },
  metaValue: { fontSize: 10, paddingTop: 4, borderBottomWidth: 1, borderBottomColor: '#000' },
  signRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  signBox: { padding: 6, borderWidth: 0 },
  signLabel: { fontSize: 10, fontWeight: '700' },
  signValue: { fontSize: 10, paddingTop: 6, borderBottomWidth: 1, borderBottomColor: '#000' },
  explanatory: { marginBottom: 8 },
  p: { fontSize: 10, marginBottom: 4 },
  pBold: { fontWeight: '700' },
  list: { marginLeft: 8, marginBottom: 6 },
  li: { fontSize: 10, marginBottom: 2 },
  note: { fontSize: 10, marginTop: 8, marginBottom: 8 },
  signaturesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  signatureBox: { flex: 1, alignItems: 'center' },
  signatureLabel: { fontSize: 10, fontWeight: '700' },
  signatureValue: { fontSize: 10, marginTop: 6 },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

function normalizeSignature(v) {
  if (!v) return null;
  if (String(v).startsWith('data:')) return v;
  const compact = String(v).replace(/\s+/g, '');
  if (compact.length > 200) return `data:image/png;base64,${compact}`;
  return null;
}

function renderMaybeSignature(v, style = {}) {
  const uri = normalizeSignature(v);
  if (uri) return <SignatureThumb uri={uri} style={style} />;
  return <Text>{v || ''}</Text>;
}

// Presentational (read-only) renderer for saved Visitors Log Book payloads
export default function VisitorsLogBookPresentational({ payload, embedded = false }) {
  if (!payload) return null;
  const meta = payload.metadata || {};
  const assets = payload.assets || {};
  // ensure issue date displays the current system date to avoid showing old saved dates
  const formatIssueDate = (d = new Date()) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };
  const issueDateValue = formatIssueDate();
  const entries = Array.isArray(payload.formData) ? payload.formData : [];

  const Root = embedded ? View : ScrollView;
  const rootProps = embedded ? { style: styles.container } : { contentContainerStyle: styles.container };

  return (
    <Root {...rootProps}>
      <View style={styles.headerRowTop}>
        <View style={styles.logoWrap}>
          {assets.logoDataUri ? (
            <Image source={{ uri: assets.logoDataUri }} style={styles.logo} />
          ) : (
            <Image source={require('../../assets/logo.jpeg')} style={styles.logo} />
          )}
        </View>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>BRAVO BRANDS VISITORS LOG BOOK</Text>
          <Text style={styles.bold}>FOOD PRODUCTION AND SERVICE VISITORS</Text>
        </View>
        <View style={styles.headerRight}>
          <Text><Text style={styles.bold}>Doc. Ref:</Text> {meta.docRef || payload.formType || ''}</Text>
          <Text><Text style={styles.bold}>Issue Date:</Text> {issueDateValue}</Text>
        </View>
      </View>

      {/* Site / Section / Month / Year */}
      <View style={styles.siteRow}>
        <View style={styles.siteCol}><Text style={styles.bold}>SITE</Text><Text>{meta.site || payload.site || ''}</Text></View>
        <View style={styles.siteCol}><Text style={styles.bold}>SECTION/DEPARTMENT</Text><Text>{meta.section || ''}</Text></View>
      </View>
      <View style={styles.siteRow}>
        <View style={[styles.siteCol, styles.smallCol]}><Text style={styles.bold}>MONTH</Text><Text>{meta.month || payload.month || ''}</Text></View>
        <View style={[styles.siteCol, styles.smallCol]}><Text style={styles.bold}>YEAR</Text><Text>{meta.year || payload.year || ''}</Text></View>
      </View>

      {/* Manager signature block (placed before health checks in the editable form) */}
      <View style={styles.managerBlock}>
        <View style={styles.managerCol}>
          <Text style={styles.bold}>SITE MANAGER NAME & SIGNATURE</Text>
          {renderMaybeSignature(meta.siteManager || payload.siteManager || '', { width: 220, height: 60 })}
        </View>
        <View style={styles.managerCol}>
          <Text style={styles.bold}>VERIFIED BY HSEQ MANAGER</Text>
          {renderMaybeSignature(meta.verifiedManager || payload.verifiedManager || '', { width: 220, height: 60 })}
        </View>
      </View>

      {/* Health check questions rendered as a two-column table */}
      <View style={styles.healthSection}>
        <Text style={[styles.bold, { marginBottom: 6 }]}>HEALTH CHECK</Text>
        <View style={styles.healthTable}>
          {/* Parent/simple questions */}
          {[
            { q: 'Ask if visitor is unwell or if the visitor has been unwell at home?', key: 'unwell' },
            { q: 'Ask if visitor is taking/has taken any medicine - Medicine refers to ALL medications e.g. Company doctor prescriptions, local medicines from herbalists, any self-treatment etc.', key: 'medicine' },
            { q: 'Ask if visitor has taken any banned substances e.g. marijuana, hashish etc', key: 'bannedSubstances' },
            { q: 'Ask if visitor has any symptoms or suffering from? (A/B)', key: 'symptoms' },
          ].map((row, idx) => (
            <View key={`h-${idx}`} style={styles.healthTableRow}>
              <Text style={[styles.healthTableQ]}>{row.q}</Text>
              <Text style={[styles.healthTableA]}>{payload.healthAnswers?.[row.key] || ''}</Text>
            </View>
          ))}

          {/* Sub question groups */}
          {[
            { q: 'Infection of the ears, nose, throat, eyes, teeth or chest', key: 'infectionEarsNoseThroat' },
            { q: 'Flu - like infections', key: 'fluLike' },
            { q: 'Skin infections', key: 'skinInfections' },
            { q: 'Vomiting', key: 'vomiting' },
            { q: 'Diarrhoea', key: 'diarrhoea' },
            { q: 'Jaundice', key: 'jaundice' },
          ].map((row, idx) => (
            <View key={`sub-${idx}`} style={styles.healthTableRow}>
              <Text style={[styles.healthTableQ, styles.subQ]}>{row.q}</Text>
              <Text style={[styles.healthTableA]}>{payload.healthAnswers?.[row.key] || ''}</Text>
            </View>
          ))}

          {/* Contact group */}
          <View style={styles.healthTableRow}>
            <Text style={styles.healthTableQ}>Ask the visitor if he has been in contact to their knowledge with any person with the following (A/B)</Text>
            <Text style={styles.healthTableA}>{payload.healthAnswers?.contactWithDisease || ''}</Text>
          </View>
          {[
            { q: 'Typhoid', key: 'typhoid' },
            { q: 'Paratyphoid', key: 'paratyphoid' },
            { q: 'Dysentery', key: 'dysentery' },
            { q: 'Hepatitis', key: 'hepatitis' },
            { q: 'Any other infectious disease', key: 'otherInfectious' },
          ].map((row, idx) => (
            <View key={`contact-${idx}`} style={styles.healthTableRow}>
              <Text style={[styles.healthTableQ, styles.subQ]}>{row.q}</Text>
              <Text style={[styles.healthTableA]}>{payload.healthAnswers?.[row.key] || ''}</Text>
            </View>
          ))}

          {/* Host checks */}
          <View style={[styles.healthTableRow, styles.hostHeaderRow]}>
            <Text style={[styles.bold]}>The host must ensure to check the following for each visitor?</Text>
            <Text />
          </View>
          {[
            { q: 'All cuts, pimples and boils are covered with a waterproof dressing', key: 'cutsCovered' },
            { q: 'Jewellery is in line with company policy', key: 'jewellery' },
            { q: 'Chefs have a hat or hair net', key: 'hairnet' },
            { q: 'The visitor is wearing their safety shoes', key: 'safetyShoes' },
            { q: 'The visitor is newly dressed', key: 'neatlyDressed' },
          ].map((row, idx) => (
            <View key={`host-${idx}`} style={styles.healthTableRow}>
              <Text style={[styles.healthTableQ]}>{row.q}</Text>
              <Text style={[styles.healthTableA]}>{payload.healthAnswers?.[row.key] || ''}</Text>
            </View>
          ))}
        </View>
        </View>

      {/* Instruction and notes */}
      <View style={styles.instructionBlock}>
        <Text style={styles.instructionText}>If any visitor answers to A & B positively then they must be referred to the <Text style={styles.bold}>Complex Manager</Text></Text>
        <Text style={styles.instructionText}>If any visitor does not comply with company policy (Section C), this must be rectified before they are allowed into the Food Production Area</Text>
        <Text style={styles.noteText}><Text style={styles.bold}>Note -</Text> The supervisor and the manager will be liable for the health of visitors and subordinates once they sign</Text>
        <Text style={styles.noteText}>The form must be completed for each shift by the <Text style={styles.bold}>Manager</Text></Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.cell, styles.nameCol]}>NAME</Text>
        <Text style={[styles.cell, styles.addressCol]}>ADDRESS</Text>
        <Text style={[styles.cell, styles.contactCol]}>CONTACT NO.</Text>
        <Text style={[styles.cell, styles.purposeCol]}>PURPOSE</Text>
        <Text style={[styles.cell, styles.timeCol]}>TIME IN</Text>
        <Text style={[styles.cell, styles.timeCol]}>TIME OUT</Text>
        <Text style={[styles.cell, styles.authCol]}>AUTHORISE BY</Text>
      </View>

      {entries.map((e, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={[styles.cell, styles.nameCol]}>{e.name}</Text>
          <Text style={[styles.cell, styles.addressCol]}>{e.address}</Text>
          <Text style={[styles.cell, styles.contactCol]}>{e.contact}</Text>
          <Text style={[styles.cell, styles.purposeCol]}>{e.purpose}</Text>
          <Text style={[styles.cell, styles.timeCol]}>{e.timeIn}</Text>
          <Text style={[styles.cell, styles.timeCol]}>{e.timeOut}</Text>
          <Text style={[styles.cell, styles.authCol]}>{e.authority}</Text>
        </View>
      ))}

      <View style={styles.footer}>
      
        <Text style={[styles.bold, { marginTop: 8 }]}>AUTHORIZED BY</Text>
        {renderMaybeSignature(meta.authorizedBySign || payload.authorizedBySign || '', { width: 260, height: 80 })}
      </View>
    </Root>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12 },
  title: { textAlign: 'center', fontWeight: '900', fontSize: 18, marginBottom: 6 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  headerRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  logoWrap: { width: 72, alignItems: 'flex-start' },
  logo: { width: 64, height: 48, resizeMode: 'contain' },
  titleWrap: { flex: 1, alignItems: 'center' },
  headerLeft: { flex: 1 },
  headerRight: { width: 200, alignItems: 'flex-end' },
  bold: { fontWeight: '700' },
  siteRow: { flexDirection: 'row', marginBottom: 6 },
  siteCol: { flex: 1, padding: 6, borderWidth: 1, borderColor: '#000', backgroundColor: '#eee', minHeight: 28 },
  smallCol: { flex: 0.5 },
  managerBlock: { flexDirection: 'row', marginBottom: 6 },
  managerCol: { flex: 1, padding: 6, borderWidth: 1, borderColor: '#000', minHeight: 40, justifyContent: 'center' },
  healthSection: { marginTop: 6, borderTopWidth: 1, borderTopColor: '#ccc', paddingTop: 8 },
  healthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  healthQ: { flex: 0.8, paddingRight: 8 },
  healthA: { flex: 0.2, textAlign: 'center' },
  subQuestions: { paddingLeft: 12, marginBottom: 6 },
  subQuestionsList: { marginBottom: 6 },
  subRow: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderColor: '#eee', alignItems: 'center' },
  subQ: { flex: 0.85, paddingLeft: 8 },
  subA: { flex: 0.15, textAlign: 'center', fontWeight: '700' },
  hostChecks: { marginTop: 6 },
  hostCheck: { flex: 0.8 },
  /* Health table styles */
  healthTable: { borderWidth: 1, borderColor: '#000', borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  healthTableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e6e6e6', paddingVertical: 6, alignItems: 'center' },
  healthTableQ: { flex: 0.8, paddingHorizontal: 8, fontSize: 12 },
  healthTableA: { flex: 0.2, textAlign: 'center', fontWeight: '700' },
  hostHeaderRow: { backgroundColor: '#f5f5f5', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#e6e6e6' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#eee', borderWidth: 1, borderColor: '#000', marginTop: 8 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' },
  cell: { padding: 6, fontSize: 12, textAlign: 'center' },
  nameCol: { flex: 0.2, borderRightWidth: 1, borderRightColor: '#000' },
  addressCol: { flex: 0.25, borderRightWidth: 1, borderRightColor: '#000' },
  contactCol: { flex: 0.12, borderRightWidth: 1, borderRightColor: '#000' },
  purposeCol: { flex: 0.18, borderRightWidth: 1, borderRightColor: '#000' },
  timeCol: { flex: 0.08, borderRightWidth: 1, borderRightColor: '#000' },
  authCol: { flex: 0.17, padding: 6 },
  footer: { marginTop: 12 },
  instructionBlock: { marginTop: 8, padding: 6, backgroundColor: '#fff' },
  instructionText: { fontSize: 12, marginBottom: 6 },
  noteText: { fontSize: 12, marginBottom: 4 },
});

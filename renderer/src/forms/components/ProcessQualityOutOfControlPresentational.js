import React from 'react';
import { ScrollView, View, Text, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

const normalizeSignature = (v) => {
  if (!v) return null;
  if (typeof v !== 'string') return null;
  if (v.startsWith('data:')) return v;
  const compact = v.replace(/\s+/g, '');
  if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
};

const renderMaybeSignature = (val, textStyle = {}) => {
  const uri = normalizeSignature(val);
  if (uri) return <SignatureThumb uri={uri} width={140} height={44} />;
  return <Text style={textStyle}>{val || ''}</Text>;
};

export default function ProcessQualityOutOfControlPresentational({ payload }) {
  if (!payload) return null;
  const get = (key) => {
    if (payload?.formData && Object.prototype.hasOwnProperty.call(payload.formData, key)) return payload.formData[key];
    if (payload?.metadata && Object.prototype.hasOwnProperty.call(payload.metadata, key)) return payload.metadata[key];
    if (Object.prototype.hasOwnProperty.call(payload, key)) return payload[key];
    return '';
  };

  const logoDataUri = payload.assets && payload.assets.logoDataUri;
  let bundledLogo = null;
  try { bundledLogo = require('../../assets/logo.jpeg'); } catch (e) { bundledLogo = null; }

  const data = payload.formData || {};
  const samples = data.samples || [];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <View style={styles.leftHeader}>
          {logoDataUri ? (
            <Image source={{ uri: logoDataUri }} style={styles.logo} resizeMode="contain" />
          ) : bundledLogo ? (
            <Image source={bundledLogo} style={styles.logo} resizeMode="contain" />
          ) : (
            <View style={styles.logoPlaceholder}><Text style={styles.logoText}>Logo</Text></View>
          )}
          <View style={styles.brandWrap}>
            <Text style={styles.companyName}>{payload.companyName || get('companyName') || ''}</Text>
            {payload.companySubtitle || get('companySubtitle') ? (
              <Text style={styles.subtitle}>{payload.companySubtitle || get('companySubtitle')}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.titleWrap}><Text style={styles.title}>{payload.title || 'Process & Quality Out of Control Report'}</Text></View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}><Text style={styles.metaLabel}>Number:</Text><Text>{get('number')}</Text></View>
        <View style={styles.metaItem}><Text style={styles.metaLabel}>Date:</Text><Text>{get('date')}</Text></View>
      </View>

      <ScrollView horizontal contentContainerStyle={styles.horizContainer} nestedScrollEnabled>
        <View style={styles.contentRowInner}>
          <View style={[styles.leftColumn, { minWidth: 700 }]}> 
            <View style={styles.sectionHeader}><Text style={styles.sectionHeaderText}>PROCESS AND QUALITY OUT OF CONTROL</Text></View>

            <View style={styles.gridRow}>
                <View style={[styles.cell, { flex: 1.5 }]}>
                <Text style={styles.labelText}>Number:</Text>
                <Text>{get('number')}</Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.labelText}>Reported by:</Text>
                <Text>{get('reportedBy')}</Text>
              </View>
                <View style={styles.cell}>
                <Text style={styles.labelText}>Sign:</Text>
                {renderMaybeSignature(get('reportedBySign'))}
              </View>
              <View style={[styles.cell, { borderRightWidth: 0 }]}> 
                <Text style={styles.labelText}>Time:</Text>
                <Text>{get('reportedByTime')}</Text>
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={[styles.cell, { flex: 1.5 }]}>
                <Text style={styles.labelText}>Date:</Text>
                <Text>{get('date')}</Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.labelText}>Notified:</Text>
                <Text>{get('notified')}</Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.labelText}>Sign:</Text>
                {renderMaybeSignature(get('notifiedSign'))}
              </View>
              <View style={[styles.cell, { borderRightWidth: 0 }]}> 
                <Text style={styles.labelText}>Time:</Text>
                <Text>{get('notifiedTime')}</Text>
              </View>
            </View>

            <View style={styles.gridRow}>
                <View style={[styles.cell, { flex: 4, borderRightWidth: 0 }]}>
                <Text style={styles.labelText}>Out of control description</Text>
                <Text>{get('outOfControlDescription')}</Text>
              </View>
            </View>

            <View style={[styles.gridRow, styles.tableHeaderRow]}>
              <Text style={[styles.tableHeaderText, { flex: 3 }]}>Sample identification</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Result</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Specification</Text>
              <Text style={[styles.tableHeaderText, { flex: 3, borderRightWidth: 0 }]}>Result after corrective</Text>
            </View>
            {samples.map((s, idx) => (
              <View key={`sample-${idx}`} style={[styles.gridRow, styles.dataRow]}> 
                <View style={[styles.cell, { flex: 3 }]}><Text>{s.sampleIdentification}</Text></View>
                <View style={[styles.cell, { flex: 2 }]}><Text>{s.result}</Text></View>
                <View style={[styles.cell, { flex: 2 }]}><Text>{s.specification}</Text></View>
                <View style={[styles.cell, { flex: 3, borderRightWidth: 0 }]}><Text>{s.resultAfterCorrective}</Text></View>
              </View>
            ))}

            <View style={styles.gridRow}>
                <View style={[styles.cell, { flex: 1 }]}>
                <Text style={styles.labelText}>Out of Control Issued by:</Text>
                <Text>{get('outOfControlIssuedBy')}</Text>
              </View>
              <View style={[styles.cell, { flex: 1, borderRightWidth: 0 }]}>
                <Text style={styles.labelText}>Origin of Out of Control</Text>
                <Text>{get('originOfOutOfControl')}</Text>
              </View>
            </View>

            {[...Array(3)].map((_, i) => (
              <View key={`space-${i}`} style={[styles.gridRow, styles.spacerRow]}>
                <View style={[styles.cell, { flex: 1 }]}><Text>{get(`spacer${i+1}`)}</Text></View>
                <View style={[styles.cell, { flex: 1, borderRightWidth: 0 }]}><Text>{get(`spacer${i+1 + 3}`)}</Text></View>
              </View>
            ))}

            <View style={styles.signatureContainer}>
              <View style={styles.signatureRow}><Text style={styles.signatureTitle}>Signed:</Text>{renderMaybeSignature(get('signed1'))}</View>
              <View style={styles.signatureRow}><Text style={styles.signatureTitle}>HSEQ MANAGER:</Text>{renderMaybeSignature(get('hseqManagerSign') || get('hseqManager') || get('hseqManagerSignature'))}</View>
              <View style={styles.signatureRow}><Text style={styles.signatureTitle}>Signed:</Text>{renderMaybeSignature(get('signed2'))}</View>
              <View style={styles.signatureRow}><Text style={styles.signatureTitle}>Head of Section:</Text>{renderMaybeSignature(get('headOfSectionSign'))}</View>
              <View style={styles.signatureRow}><Text style={styles.signatureTitle}>Signed:</Text>{renderMaybeSignature(get('signed3'))}</View>
              <View style={styles.signatureRow}><Text style={styles.signatureTitle}>Complex manager:</Text>{renderMaybeSignature(get('complexManagerSign') || get('complexManager') || get('complexManagerSignature'))}</View>
            </View>
          </View>

          <View style={[styles.rightColumn, { minWidth: 420, paddingLeft: 12 }]}> 
            <View style={styles.problemBlock}><Text style={styles.questionText}>1. What happened to process or Quality parameter?</Text><Text>{get('q1')}</Text></View>
            <View style={styles.problemBlock}><Text style={styles.questionText}>2. What was the possible cause?</Text><Text>{get('q2')}</Text></View>

            <View style={styles.problemBlock}><Text style={styles.actionHeader}>Five ways to establish root cause. What was wrong?</Text><Text>{get('fiveWays')}</Text></View>
            {[1,2,3,4,5].map(i => (
              <View key={`why-${i}`} style={styles.problemBlock}><Text style={styles.actionHeader}>{`${i}. Why?`}</Text><Text>{get(`why${i}`)}</Text></View>
            ))}

            <View style={styles.problemBlock}><Text style={styles.actionHeader}>Root cause of the problem</Text><Text>{get('rootCause')}</Text></View>
            <View style={styles.problemBlock}><Text style={styles.actionHeader}>Corrective Action:</Text><Text>{get('correctiveAction')}</Text></View>
            <View style={styles.problemBlock}><Text style={styles.actionHeader}>Follow up:</Text><Text>{get('followUp')}</Text></View>
          </View>
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 12 },
  headerBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  leftHeader: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 56, height: 56, marginRight: 8 },
  logoPlaceholder: { width: 56, height: 56, marginRight: 8, backgroundColor: '#fff', borderWidth:1, borderColor:'#ccc', justifyContent:'center', alignItems:'center' },
  logoText: { fontWeight: '700' },
  brandWrap: { flexDirection: 'column' },
  companyName: { fontSize: 16, fontWeight: '800', color: '#185a9d' },
  subtitle: { fontSize: 10, color: '#444' },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: { fontSize: 14, fontWeight: '800' },

  metaRow: { flexDirection: 'row', marginBottom: 8 },
  metaItem: { flex: 1, paddingRight: 8 },
  metaLabel: { fontSize: 10, fontWeight: '700', marginBottom: 4 },

  horizContainer: { paddingLeft: 12, paddingRight: 24 },
  contentRowInner: { flexDirection: 'row' },
  leftColumn: { flex: 2, borderRightWidth: 1, borderColor: '#000' },
  rightColumn: { flex: 1 },
  sectionHeader: { backgroundColor: '#ddd', padding: 5, borderBottomWidth: 1, borderColor: '#000' },
  sectionHeaderText: { fontWeight: 'bold', textAlign: 'center', fontSize: 12 },
  gridRow: { flexDirection: 'row' },
  cell: { borderBottomWidth: 1, borderColor: '#000', paddingHorizontal: 0, flex: 1 },
  labelText: { fontSize: 10, paddingHorizontal: 4, paddingTop: 2, fontWeight: 'bold', backgroundColor: '#fff' },
  tableHeaderRow: { backgroundColor: '#ccc', borderBottomWidth: 2 },
  tableHeaderText: { fontWeight: 'bold', fontSize: 10, padding: 4, borderRightWidth: 1, borderColor: '#000', textAlign: 'center' },
  dataRow: { minHeight: 30 },
  spacerRow: { minHeight: 30, borderBottomWidth: 1, borderColor: '#000' },

  signatureContainer: { padding: 10, borderTopWidth: 1, borderColor: '#000' },
  signatureRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 0 },
  signatureTitle: { fontSize: 12, fontWeight: 'bold', width: 120, paddingBottom: 2 },

  problemBlock: { borderBottomWidth: 1, borderColor: '#000', minHeight: 40 },
  questionText: { fontSize: 11, padding: 4, fontWeight: 'bold' },
  actionHeader: { fontWeight: 'bold', fontSize: 12, padding: 4 },
});

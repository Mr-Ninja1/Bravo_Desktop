import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, useWindowDimensions } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

export default function MouldingProofingBakingLogPresentational({ payload = {}, exportingWide = false }) {
  const { width: windowWidth } = useWindowDimensions();
  
  const normalizeIncoming = (incoming) => {
    if (!incoming) return {};
    let v = incoming;
    if (v.payload) v = v.payload;
    if (v.meta && v.meta.payload) v = v.meta.payload;
    if (v.payload) v = v.payload;
    return v || {};
  };

  const p = normalizeIncoming(payload);
  let metaCandidate = p.metadata || p.meta || {};
  if (metaCandidate && metaCandidate.metadata) metaCandidate = metaCandidate.metadata;
  const metadata = metaCandidate || {};
  
  const correctiveText = metadata.correctiveAction ?? metadata.corrective ?? p.correctiveAction ?? payload.correctiveAction ?? '';
  const { formData = [], layoutHints = {} } = p;
  const logo = p.assets && p.assets.logoDataUri ? { uri: p.assets.logoDataUri } : require('../../assets/logo.jpeg');

  // Relative weights to distribute the 100% width
  const COL_WEIGHTS = {
    num: layoutHints.num || 35,
    food: layoutHints.food || 180,
    mouldingTime: layoutHints.mouldingTime || 75,
    mouldingSign: layoutHints.mouldingSign || 85,
    proofTimeIn: layoutHints.proofTimeIn || 75,
    proofTimeOut: layoutHints.proofTimeOut || 75,
    proofSign: layoutHints.proofSign || 85,
    bakeTimeIn: layoutHints.bakeTimeIn || 75,
    bakeTemp: layoutHints.bakeTemp || 75,
    bakeTimeOut: layoutHints.bakeTimeOut || 75,
    staff: layoutHints.staff || 110,
  };

  const TOTAL_WEIGHT = Object.values(COL_WEIGHTS).reduce((s, v) => s + v, 0);

  const normalizeSignature = (v) => {
    if (!v) return null;
    if (typeof v !== 'string') {
      const maybe = v && (v.uri || v.data || v.base64 || v);
      if (typeof maybe === 'string') v = maybe;
      else return null;
    }
    if (v.startsWith('data:')) return v;
    const compact = v.replace(/\s+/g, '');
    if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
    return null;
  };

  const renderSig = (val, width = 60, height = 30) => {
    const uri = normalizeSignature(val);
    if (uri) return <SignatureThumb uri={uri} width={width} height={height} />;
    return <Text style={{fontSize: 9}}>{val || ''}</Text>;
  };

  // Helper to calculate flex share
  const getColStyle = (keys) => {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    const weightSum = keysArray.reduce((s, k) => s + (COL_WEIGHTS[k] || 0), 0);
    return {
      flex: weightSum / TOTAL_WEIGHT,
      justifyContent: 'center',
      borderRightWidth: 1,
      borderRightColor: '#ccc',
      paddingHorizontal: 2,
    };
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header Info Section */}
      <View style={styles.headerDocBox}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <View style={{ flex: 1, paddingLeft: 8 }}>
          <Text style={styles.companyName}>BRAVO BRANDS LIMITED</Text>
          <Text style={styles.headerSubject}>MOULDING PROOFING AND BAKING LOG SHEET</Text>
          <Text style={styles.smallNote}>Subject: MOULDING PROOFING AND BAKING LOG SHEET</Text>
        </View>
        <View style={styles.docBox}>
          <View style={styles.docRow}><Text style={styles.docLabel}>Issue Date:</Text><Text style={styles.docVal}>{p.issueDate || metadata.issueDate || ''}</Text></View>
          <View style={styles.docRow}><Text style={styles.docLabel}>Revision Date:</Text><Text style={styles.docVal}>{p.revisionDate || metadata.revisionDate || ''}</Text></View>
          <View style={styles.docRow}><Text style={styles.docLabel}>Location:</Text><Text style={styles.docVal}>{metadata.location || p.location || ''}</Text></View>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View>
          <Text style={styles.metaLabel}>Compiled By:</Text>
          <Text style={styles.metaVal}>{metadata.compiledBy || 'Michael zulu'}</Text>
        </View>
        <View>
          <Text style={styles.metaLabel}>Approved By:</Text>
          <Text style={styles.metaVal}>{metadata.approvedBy || 'Hassani Ali'}</Text>
        </View>
      </View>

      {/* Table Section - Fluid width, no horizontal scroll */}
      <View style={styles.tableWrapper}>
        
        {/* Main Headers */}
        <View style={styles.headerRow}> 
          <View style={[getColStyle('num')]}><Text style={styles.headerText}>#</Text></View>
          <View style={[getColStyle('food')]}><Text style={styles.headerText}>FOOD ITEM</Text></View>
          <View style={[getColStyle(['mouldingTime', 'mouldingSign'])]}><Text style={styles.headerText}>MOULDING</Text></View>
          <View style={[getColStyle(['proofTimeIn', 'proofTimeOut', 'proofSign'])]}><Text style={styles.headerText}>PROOFING</Text></View>
          <View style={[getColStyle(['bakeTimeIn', 'bakeTemp', 'bakeTimeOut'])]}><Text style={styles.headerText}>BAKING TEMP (180°C - 300°C)</Text></View>
          <View style={[getColStyle('staff'), { borderRightWidth: 0 }]}><Text style={styles.headerText}>STAFF'S NAME</Text></View>
        </View>

        {/* Sub Headers */}
        <View style={styles.subHeaderRow}> 
          <View style={[getColStyle('num')]}><Text style={styles.subText}>#</Text></View>
          <View style={[getColStyle('food')]}><Text style={styles.subText}></Text></View>
          <View style={[getColStyle('mouldingTime')]}><Text style={styles.subText}>TIME</Text></View>
          <View style={[getColStyle('mouldingSign')]}><Text style={styles.subText}>SIGN</Text></View>
          <View style={[getColStyle('proofTimeIn')]}><Text style={styles.subText}>TIME IN</Text></View>
          <View style={[getColStyle('proofTimeOut')]}><Text style={styles.subText}>TIME OUT</Text></View>
          <View style={[getColStyle('proofSign')]}><Text style={styles.subText}>SIGN</Text></View>
          <View style={[getColStyle('bakeTimeIn')]}><Text style={styles.subText}>TIME IN</Text></View>
          <View style={[getColStyle('bakeTemp')]}><Text style={styles.subText}>TEMP</Text></View>
          <View style={[getColStyle('bakeTimeOut')]}><Text style={styles.subText}>TIME OUT</Text></View>
          <View style={[getColStyle('staff'), { borderRightWidth: 0 }]}><Text style={styles.subText}></Text></View>
        </View>

        {/* Data Rows */}
        {(formData || []).map((r, idx) => (
          <View key={idx} style={styles.row}> 
            <View style={[getColStyle('num'), {alignItems: 'center'}]}><Text style={styles.cellText}>{idx+1}</Text></View>
            <View style={[getColStyle('food')]}><Text style={styles.cellText}>{r.product || ''}</Text></View>
            <View style={[getColStyle('mouldingTime'), {alignItems: 'center'}]}><Text style={styles.cellText}>{r.mouldingTime || ''}</Text></View>
            <View style={[getColStyle('mouldingSign'), {alignItems: 'center'}]}>{renderSig(r.mouldingSign)}</View>
            <View style={[getColStyle('proofTimeIn'), {alignItems: 'center'}]}><Text style={styles.cellText}>{r.proofTimeIn || ''}</Text></View>
            <View style={[getColStyle('proofTimeOut'), {alignItems: 'center'}]}><Text style={styles.cellText}>{r.proofTimeOut || ''}</Text></View>
            <View style={[getColStyle('proofSign'), {alignItems: 'center'}]}>{renderSig(r.proofSign)}</View>
            <View style={[getColStyle('bakeTimeIn'), {alignItems: 'center'}]}><Text style={styles.cellText}>{r.bakeTimeIn || ''}</Text></View>
            <View style={[getColStyle('bakeTemp'), {alignItems: 'center'}]}>
               <Text style={styles.cellText}>
                {(() => {
                  const raw = r.bakeTemp || '';
                  const s = String(raw).trim();
                  if (!s) return '';
                  if (s.includes('°') || /c$/i.test(s)) return s;
                  return `${s} °C`;
                })()}
              </Text>
            </View>
            <View style={[getColStyle('bakeTimeOut'), {alignItems: 'center'}]}><Text style={styles.cellText}>{r.bakeTimeOut || ''}</Text></View>
            <View style={[getColStyle('staff'), { borderRightWidth: 0 }]}><Text style={styles.cellText}>{r.staffName || ''}</Text></View>
          </View>
        ))}
      </View>

      {/* Footer Section */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.footerLabel}>Head Chef/Baker Signature:</Text>
            {renderSig(p.headChefSign, 180, 50)}
          </View>
        </View>

        <View style={{ marginTop: 8 }}>
          <Text style={styles.footerLabel}>Corrective Action:</Text>
          <View style={styles.correctiveBox}>
            <Text style={styles.correctiveText}>{correctiveText || 'N/A'}</Text>
          </View>
        </View>

        <View style={[styles.footerRow, { marginTop: 12 }]}> 
          <View style={{ flex: 1 }}>
            <Text style={styles.footerLabel}>Verified By:</Text>
            {renderSig(p.verifiedBySign, 160, 40)}
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[styles.footerLabel, { textAlign: 'right' }]}>Complex Manager Signature</Text>
            {renderSig(p.complexManagerSign, 160, 40)}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff' },
  headerDocBox: { flexDirection: 'row', marginBottom: 12, borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 4 },
  logo: { width: 50, height: 50 },
  companyName: { fontWeight: '800', color: '#185a9d', fontSize: 13 },
  headerSubject: { fontWeight: '800', fontSize: 11 },
  smallNote: { fontSize: 9, color: '#666' },
  docBox: { width: 160, borderLeftWidth: 1, borderColor: '#eee', paddingLeft: 8 },
  docRow: { flexDirection: 'row', justifyContent: 'space-between' },
  docLabel: { fontWeight: '700', fontSize: 9, color: '#374151' },
  docVal: { fontSize: 9, textAlign: 'right' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  metaLabel: { fontWeight: '700', fontSize: 10, color: '#374151' },
  metaVal: { fontSize: 10, color: '#111827' },

  tableWrapper: { borderWidth: 1, borderColor: '#ccc', width: '100%', borderRadius: 4, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', backgroundColor: '#eef2ff', borderBottomWidth: 1, borderColor: '#ccc', minHeight: 40 },
  headerText: { fontWeight: '800', fontSize: 8, textAlign: 'center' },
  
  subHeaderRow: { flexDirection: 'row', backgroundColor: '#f9fafb', borderBottomWidth: 1, borderColor: '#ccc' },
  subText: { fontWeight: '700', fontSize: 7, textAlign: 'center' },

  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee', minHeight: 35 },
  cellText: { fontSize: 8, textAlign: 'center' },

  footer: { marginTop: 12 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  footerLabel: { fontWeight: '700', fontSize: 10, marginBottom: 4 },
  correctiveBox: { borderWidth: 1, borderColor: '#eee', padding: 6, minHeight: 40, backgroundColor: '#fafafa' },
  correctiveText: { fontSize: 9, color: '#444' }
});
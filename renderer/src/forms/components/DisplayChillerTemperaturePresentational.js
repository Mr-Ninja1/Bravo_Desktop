import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

export default function DisplayChillerTemperaturePresentational({ payload }) {
  if (!payload) return null;
  const p = payload.payload || payload;
  const { metadata = {}, formData = [], layoutHints = {}, _tableWidth } = p;
  const rows = formData && formData.length ? formData : (p.rows || []);

  const WIDTHS = (layoutHints && layoutHints.WIDTHS) || {
    DATE: 60,
    TEMP: 80,
    SIGN: 120,
    CORRECTIVE_ACTION: 300,
    SUP_NAME_SIGN: 140,
    COMPLEX_SIGN: 140,
    FSC_SIGN: 120,
    HSEQ_SIGN: 140,
  };

  const COL = WIDTHS;

  const TOTAL = Object.values(COL).reduce((s, v) => s + (Number(v) || 0), 0) || 1;
  const colStyle = (w) => {
    const width = Number(w) || 0;
    const flex = width / TOTAL;
    const min = Math.max(36, Math.round(width * 0.28));
    return { flex, minWidth: min, flexShrink: 1 };
  };

  const rowsToRender = rows && rows.length ? rows : Array.from({ length: 31 }, (_, i) => ({ day: i + 1 }));

  const normalizeSignature = (v) => {
    if (!v) return null;
    const s = String(v).trim();
    if (!s) return null;
    if (s.startsWith('data:')) return s;
    const compact = s.replace(/\s+/g, '');
    if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
    return null;
  };

  const ordinal = (n) => {
    const num = Number(n) || 0;
    const rem100 = num % 100;
    if (rem100 >= 11 && rem100 <= 13) return `${num}th`;
    switch (num % 10) {
      case 1: return `${num}st`;
      case 2: return `${num}nd`;
      case 3: return `${num}rd`;
      default: return `${num}th`;
    }
  };

  const TABLE_WIDTH = COL.DATE + (COL.TEMP + COL.SIGN) * 3 + COL.CORRECTIVE_ACTION + COL.SUP_NAME_SIGN + COL.COMPLEX_SIGN + COL.FSC_SIGN + COL.HSEQ_SIGN;

  const chillerName = metadata.displayChillerName || '';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.topBranding}>
          <View style={styles.logoArea}>
            <View style={styles.logoWrap}>
              {p.assets?.logoDataUri ? <Image source={{ uri: p.assets.logoDataUri }} style={styles.logo} /> : <Image source={require('../../assets/logo.jpeg')} style={styles.logo} />}
            </View>
            <View style={styles.companyArea}>
              <Text style={styles.companyText}>{metadata.companyName || 'Bravo'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.titleText}>DISPLAY CHILLER TEMPERATURE LOG SHEET</Text>
        </View>

        <View style={styles.subjectBand}>
          <View style={styles.subjectLeft}>
            <Text style={styles.subjectLabel}>Name of display chiller:</Text>
            <Text style={styles.subjectContent}>{chillerName}</Text>
          </View>
          <View style={styles.compiledBox}>
            <View style={styles.compiledRow}>
              <Text style={styles.compiledLabel}>COMPILED BY:</Text>
              <Text style={styles.compiledValue}>{metadata.compiledBy || ''}</Text>
            </View>
            <View style={styles.compiledRow}>
              <Text style={styles.compiledLabel}>APPROVED BY:</Text>
              <Text style={styles.compiledValue}>{metadata.approvedBy || ''}</Text>
            </View>
          </View>
        </View>

        <View style={styles.metaInfoRow}
             accessible={false}>
          <View style={styles.metaInfoField}><Text style={styles.metaInfoLabel}>Month:</Text><Text style={styles.metaInfoValue}>{metadata.month || ''}</Text></View>
          <View style={styles.metaInfoField}><Text style={styles.metaInfoLabel}>Year:</Text><Text style={styles.metaInfoValue}>{metadata.year || ''}</Text></View>
          <View style={[styles.metaInfoField, { flex: 1 }]}><Text style={styles.metaInfoLabel}>Location:</Text><Text style={styles.metaInfoValue}>{metadata.location || ''}</Text></View>
        </View>

        <View style={styles.instructionBox}>
          <Text style={styles.instructionText}><Text style={{ fontWeight: '800' }}>Instruction:</Text> {metadata.instruction || 'The temperature of the chiller should be between 0°C and 4°C.'}</Text>
        </View>

        <View style={styles.tableOuter}>
          <View style={styles.tableWrap}>
            <View style={[styles.tableGroupHeader]}> 
              <View style={[styles.hCellFlex, colStyle(COL.DATE)]}><Text style={styles.hText}>DATE</Text></View>
              <View style={[styles.hGroupFlex, colStyle(COL.TEMP + COL.SIGN)]}><Text style={styles.hText}>MORNING</Text></View>
              <View style={[styles.hGroupFlex, colStyle(COL.TEMP + COL.SIGN)]}><Text style={styles.hText}>AFTERNOON</Text></View>
              <View style={[styles.hGroupFlex, colStyle(COL.TEMP + COL.SIGN)]}><Text style={styles.hText}>EVENING</Text></View>
              <View style={[styles.hCellFlex, colStyle(COL.CORRECTIVE_ACTION)]}><Text style={styles.hText}>IF TEMPERATURE IS OUT OF SPECIFICATION, WHAT WAS DONE ABOUT IT?</Text></View>
              <View style={[styles.hCellFlex, colStyle(COL.SUP_NAME_SIGN)]}><Text style={styles.hText}>SUP SIGN</Text></View>
              <View style={[styles.hCellFlex, colStyle(COL.COMPLEX_SIGN)]}><Text style={styles.hText}>COMPLEX SIGN</Text></View>
              <View style={[styles.hCellFlex, colStyle(COL.FSC_SIGN)]}><Text style={styles.hText}>FSC SIGN</Text></View>
              <View style={[styles.hCellFlex, colStyle(COL.HSEQ_SIGN)]}><Text style={styles.hText}>HSEQ SIGN</Text></View>
            </View>

            <View style={[styles.tableHeaderRow, styles.detailHeader]}>
              <View style={[styles.hCellFlex, colStyle(COL.DATE)]} />
              <View style={[styles.hCellFlex, colStyle(COL.TEMP)]}><Text style={styles.hText}>TEMP</Text></View>
              <View style={[styles.hCellFlex, colStyle(COL.SIGN)]}><Text style={styles.hText}>STAFF SIGN</Text></View>
              <View style={[styles.hCellFlex, colStyle(COL.TEMP)]}><Text style={styles.hText}>TEMP</Text></View>
              <View style={[styles.hCellFlex, colStyle(COL.SIGN)]}><Text style={styles.hText}>STAFF SIGN</Text></View>
              <View style={[styles.hCellFlex, colStyle(COL.TEMP)]}><Text style={styles.hText}>TEMP</Text></View>
              <View style={[styles.hCellFlex, colStyle(COL.SIGN)]}><Text style={styles.hText}>STAFF SIGN</Text></View>
              <View style={[styles.hCellFlex, colStyle(COL.CORRECTIVE_ACTION)]} />
              <View style={[styles.hCellFlex, colStyle(COL.SUP_NAME_SIGN)]} />
              <View style={[styles.hCellFlex, colStyle(COL.COMPLEX_SIGN)]} />
              <View style={[styles.hCellFlex, colStyle(COL.FSC_SIGN)]} />
              <View style={[styles.hCellFlex, colStyle(COL.HSEQ_SIGN)]} />
            </View>

            {rowsToRender.map((r, ri) => (
              <View key={ri} style={styles.row}>
                <View style={[styles.cellFlex, colStyle(COL.DATE)]}><Text style={styles.cellText}>{ordinal(r.day || (ri + 1))}</Text></View>

                  <View style={[styles.cellFlex, colStyle(COL.TEMP)]}><Text style={styles.cellText}>{r.tempMorning || ''}</Text></View>
                  <View style={[styles.cellFlex, colStyle(COL.SIGN)]}>{(() => {
                  const v = r.staffSignMorning;
                  const uri = normalizeSignature(v);
                    return uri ? <SignatureThumb uri={uri} width={80} height={44} layers={5} spread={0.8} /> : <Text style={styles.cellText}>{v || ''}</Text>;
                })()}</View>

                  <View style={[styles.cellFlex, colStyle(COL.TEMP)]}><Text style={styles.cellText}>{r.tempAfternoon || ''}</Text></View>
                  <View style={[styles.cellFlex, colStyle(COL.SIGN)]}>{(() => {
                  const v = r.staffSignAfternoon;
                  const uri = normalizeSignature(v);
                    return uri ? <SignatureThumb uri={uri} width={80} height={44} layers={5} spread={0.8} /> : <Text style={styles.cellText}>{v || ''}</Text>;
                })()}</View>

                  <View style={[styles.cellFlex, colStyle(COL.TEMP)]}><Text style={styles.cellText}>{r.tempEvening || ''}</Text></View>
                  <View style={[styles.cellFlex, colStyle(COL.SIGN)]}>{(() => {
                  const v = r.staffSignEvening;
                  const uri = normalizeSignature(v);
                    return uri ? <SignatureThumb uri={uri} width={80} height={44} layers={5} spread={0.8} /> : <Text style={styles.cellText}>{v || ''}</Text>;
                })()}</View>

                  <View style={[styles.cellFlex, colStyle(COL.CORRECTIVE_ACTION)]}><Text style={styles.cellText}>{r.outOfSpecAction || ''}</Text></View>
                  <View style={[styles.cellFlex, colStyle(COL.SUP_NAME_SIGN)]}>{(() => {
                  const v = r.supNameSign;
                  const uri = normalizeSignature(v);
                    return uri ? <SignatureThumb uri={uri} width={100} height={44} layers={6} spread={0.9} /> : <Text style={styles.cellText}>{v || ''}</Text>;
                })()}</View>
                  <View style={[styles.cellFlex, colStyle(COL.COMPLEX_SIGN)]}>{(() => {
                  const v = r.complexManagerSign;
                  const uri = normalizeSignature(v);
                    return uri ? <SignatureThumb uri={uri} width={100} height={44} layers={6} spread={0.9} /> : <Text style={styles.cellText}>{v || ''}</Text>;
                })()}</View>

                <View style={[styles.cellFlex, colStyle(COL.FSC_SIGN)]}>{(() => {
                  const v = r.fscSign;
                  const uri = normalizeSignature(v);
                  return uri ? <SignatureThumb uri={uri} width={90} height={44} layers={6} spread={0.9} /> : <Text style={styles.cellText}>{v || ''}</Text>;
                })()}</View>

                <View style={[styles.cellFlex, colStyle(COL.HSEQ_SIGN)]}>{(() => {
                  const v = r.hseqManagerSign;
                  const uri = normalizeSignature(v);
                  return uri ? <SignatureThumb uri={uri} width={100} height={44} layers={6} spread={0.9} /> : <Text style={styles.cellText}>{v || ''}</Text>;
                })()}</View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footerRow} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff' },
  card: { backgroundColor: '#fff' },
  titleRow: { alignItems: 'center', marginBottom: 6 },
  titleText: { fontSize: 14, fontWeight: '900', textTransform: 'uppercase', color: '#111827' },
  logoArea: { flexDirection: 'row', alignItems: 'center', width: 420 },
  logoWrap: { width: 96, height: 72, justifyContent: 'center', alignItems: 'center' },
  logo: { width: 88, height: 64, resizeMode: 'contain' },
  companyArea: { marginLeft: 8 },
  companyText: { fontSize: 18, fontWeight: '900', color: '#111827' },
  tableWrap: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6e6e6', overflow: 'hidden', marginTop: 12, width: '100%' },
  tableOuter: { width: '100%', overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f3f4f6' },
  detailHeader: { borderBottomWidth: 1, borderColor: '#e6e6e6' },
  hCellFixed: { paddingVertical: 6, paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#cbd5e1', backgroundColor: '#f8fafc' },
  hGroupCell: { paddingVertical: 6, paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#cbd5e1', backgroundColor: '#eef2ff', textAlign: 'center' },
  hGroupFlex: { paddingVertical: 6, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#cbd5e1', backgroundColor: '#eef2ff', textAlign: 'center' },
  hCellFlex: { paddingVertical: 6, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#cbd5e1', backgroundColor: '#f8fafc' },
  tableGroupHeader: { flexDirection: 'row', backgroundColor: '#eef2ff', borderBottomWidth: 1, borderBottomColor: '#cbd5e1' },
  subjectBand: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', padding: 6, marginBottom: 8 },
  subjectLeft: { flex: 1 },
  subjectLabel: { fontWeight: '700', fontSize: 10, color: '#111827' },
  subjectContent: { fontWeight: '800', fontSize: 12, marginTop: 2 },
  compiledBox: { width: 220, borderLeftWidth: 1, borderLeftColor: '#cbd5e1', paddingLeft: 8, justifyContent: 'center' },
  compiledRow: { flexDirection: 'row', justifyContent: 'space-between' },
  compiledLabel: { fontWeight: '700', fontSize: 10 },
  compiledValue: { fontSize: 10 },
  brandingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaInfoRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  metaInfoField: { marginRight: 16 },
  metaInfoLabel: { fontSize: 10, fontWeight: '700' },
  metaInfoValue: { fontSize: 10, borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingHorizontal: 6 },
  instructionBox: { marginTop: 8, padding: 8, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff' },
  instructionText: { fontSize: 12 },
  hText: { fontWeight: '700', fontSize: 10, color: '#111827', textAlign: 'center', textTransform: 'uppercase' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#cbd5e1', minHeight: 36, alignItems: 'center' },
  cellFixed: { padding: 6, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#cbd5e1' },
  cellFlex: { padding: 6, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#cbd5e1', flexShrink: 1 },
  cellText: { fontSize: 12, color: '#111827' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e6e6e6' },
});

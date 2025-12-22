import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

export default function UnderbarChillerTemperaturePresentational({ payload }) {
  if (!payload) return null;
  const p = payload.payload || payload;
  const { metadata = {}, formData = [], layoutHints = {}, _tableWidth } = p;
  const rows = formData && formData.length ? formData : (p.rows || []);

  const WIDTHS = (layoutHints && layoutHints.WIDTHS) || {
    DATE: 60,
    TEMP: 80,
    SIGN: 120,
    CORRECTIVE_ACTION: 300,
    SUP_NAME_SIGN: 180,
    COMPLEX_SIGN: 160,
    FSC_SIGN: 140,
    HSEQ_SIGN: 160,
  };

  const COL = WIDTHS;

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

  const TABLE_WIDTH = COL.DATE + (COL.TEMP + COL.SIGN) * 3 + COL.CORRECTIVE_ACTION + COL.SUP_NAME_SIGN + COL.COMPLEX_SIGN + COL.FSC_SIGN + COL.HSEQ_SIGN;

  const TOTAL = Object.values(COL).reduce((s, v) => s + (Number(v) || 0), 0) || 1;
  const colStyle = (w) => {
    const width = Number(w) || 0;
    const flex = width / TOTAL;
    const min = Math.max(36, Math.round(width * 0.18));
    return { flex, minWidth: min, flexShrink: 1 };
  };
  const sigWidthFor = (w) => Math.min(160, Math.max(64, Math.round((Number(w) || 120) * 0.8)));
  const sigHeightFor = (w) => Math.max(40, Math.round((Number(w) || 120) * 0.5));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.brandingRowTop}> 
          <View style={styles.logoAreaTop}>
            <View style={styles.logoWrap}>
              {p.assets?.logoDataUri ? <Image source={{ uri: p.assets.logoDataUri }} style={styles.logo} /> : <Image source={require('../../assets/logo.jpeg')} style={styles.logo} />}
            </View>
            <View style={styles.companyAreaTop}>
              <Text style={styles.companyText}>{metadata.companyName || 'Bravo'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.subjectBand}>
          <View style={styles.subjectLeft}>
            <Text style={styles.subjectLabel}>SUBJECT:</Text>
            <Text style={styles.subjectContent}>{p.title || metadata.subject || 'UNDERBAR CHILLER TEMPERATURE LOG SHEET'}</Text>
          </View>
          <View style={styles.compiledBox}>
            <View style={styles.compiledRow}>
              <Text style={styles.compiledLabel}>COMPILED BY:</Text>
              {(() => {
                const v = metadata.compiledBySign || metadata.compiledBy || '';
                const uri = normalizeSignature(v);
                const name = metadata.compiledBy || '';
                return uri ? <SignatureThumb uri={uri} width={160} height={50} layers={6} spread={0.9} /> : <Text style={styles.compiledValue}>{name}</Text>;
              })()}
            </View>
            <View style={styles.compiledRow}>
              <Text style={styles.compiledLabel}>APPROVED BY:</Text>
              {(() => {
                const v = metadata.approvedBySign || metadata.approvedBy || '';
                const uri = normalizeSignature(v);
                const name = metadata.approvedBy || '';
                return uri ? <SignatureThumb uri={uri} width={160} height={50} layers={6} spread={0.9} /> : <Text style={styles.compiledValue}>{name}</Text>;
              })()}
            </View>
          </View>
        </View>

        <View style={styles.instructionBox}>
          <Text style={styles.instructionText}><Text style={{ fontWeight: '800' }}>Instruction:</Text> {metadata.instruction || 'The temperature of the Underbar Chiller should be between 0°C and 4°C.'}</Text>
        </View>

        <View style={styles.tableWrap}>
          <View style={[styles.tableGroupHeader]}> 
            <View style={[styles.hCellFixed, colStyle(COL.DATE)]}><Text style={styles.hText}>DATE</Text></View>
            <View style={[styles.hGroupCell, colStyle(COL.TEMP + COL.SIGN)]}><Text style={styles.hText}>MORNING</Text></View>
            <View style={[styles.hGroupCell, colStyle(COL.TEMP + COL.SIGN)]}><Text style={styles.hText}>AFTERNOON</Text></View>
            <View style={[styles.hGroupCell, colStyle(COL.TEMP + COL.SIGN)]}><Text style={styles.hText}>EVENING</Text></View>
            <View style={[styles.hCellFixed, colStyle(COL.CORRECTIVE_ACTION)]}><Text style={styles.hText}>IF TEMPERATURE IS OUT OF SPECIFICATION, WHAT WAS DONE ABOUT IT?</Text></View>
            <View style={[styles.hCellFixed, colStyle(COL.SUP_NAME_SIGN)]}><Text style={styles.hText}>SUP SIGN</Text></View>
            <View style={[styles.hCellFixed, colStyle(COL.COMPLEX_SIGN)]}><Text style={styles.hText}>COMPLEX MANAGER SIGN</Text></View>
            <View style={[styles.hCellFixed, colStyle(COL.FSC_SIGN)]}><Text style={styles.hText}>FSC SIGN</Text></View>
            <View style={[styles.hCellFixed, colStyle(COL.HSEQ_SIGN)]}><Text style={styles.hText}>HSEQ MANAGER SIGN</Text></View>
          </View>

          <View style={[styles.tableHeaderRow, styles.detailHeader]}>
            <View style={[styles.hCellFixed, colStyle(COL.DATE)]} />
            <View style={[styles.hCellFixed, colStyle(COL.TEMP)]}><Text style={styles.hText}>TEMP</Text></View>
            <View style={[styles.hCellFixed, colStyle(COL.SIGN)]}><Text style={styles.hText}>STAFF SIGN</Text></View>
            <View style={[styles.hCellFixed, colStyle(COL.TEMP)]}><Text style={styles.hText}>TEMP</Text></View>
            <View style={[styles.hCellFixed, colStyle(COL.SIGN)]}><Text style={styles.hText}>STAFF SIGN</Text></View>
            <View style={[styles.hCellFixed, colStyle(COL.TEMP)]}><Text style={styles.hText}>TEMP</Text></View>
            <View style={[styles.hCellFixed, colStyle(COL.SIGN)]}><Text style={styles.hText}>STAFF SIGN</Text></View>
            <View style={[styles.hCellFixed, colStyle(COL.CORRECTIVE_ACTION)]} />
            <View style={[styles.hCellFixed, colStyle(COL.SUP_NAME_SIGN)]} />
            <View style={[styles.hCellFixed, colStyle(COL.COMPLEX_SIGN)]} />
            <View style={[styles.hCellFixed, colStyle(COL.FSC_SIGN)]} />
            <View style={[styles.hCellFixed, colStyle(COL.HSEQ_SIGN)]} />
          </View>

          {rowsToRender.map((r, ri) => (
            <View key={ri} style={styles.row}>
              <View style={[styles.cellFixed, colStyle(COL.DATE)]}><Text style={styles.cellText}>{r.day || (ri + 1)}</Text></View>

              <View style={[styles.cellFixed, colStyle(COL.TEMP)]}><Text style={styles.cellText}>{r.tempMorning || ''}</Text></View>
              <View style={[styles.cellFixed, colStyle(COL.SIGN)]}>{(() => {
                const v = r.staffSignMorning;
                const uri = normalizeSignature(v);
                const sw = sigWidthFor(COL.SIGN);
                return uri ? <SignatureThumb uri={uri} width={sw} height={sigHeightFor(sw)} layers={5} spread={0.8} /> : <Text style={styles.cellText}>{v || ''}</Text>;
              })()}</View>

              <View style={[styles.cellFixed, colStyle(COL.TEMP)]}><Text style={styles.cellText}>{r.tempAfternoon || ''}</Text></View>
              <View style={[styles.cellFixed, colStyle(COL.SIGN)]}>{(() => {
                const v = r.staffSignAfternoon;
                const uri = normalizeSignature(v);
                const sw = sigWidthFor(COL.SIGN);
                return uri ? <SignatureThumb uri={uri} width={sw} height={sigHeightFor(sw)} layers={5} spread={0.8} /> : <Text style={styles.cellText}>{v || ''}</Text>;
              })()}</View>

              <View style={[styles.cellFixed, colStyle(COL.TEMP)]}><Text style={styles.cellText}>{r.tempEvening || ''}</Text></View>
              <View style={[styles.cellFixed, colStyle(COL.SIGN)]}>{(() => {
                const v = r.staffSignEvening;
                const uri = normalizeSignature(v);
                const sw = sigWidthFor(COL.SIGN);
                return uri ? <SignatureThumb uri={uri} width={sw} height={sigHeightFor(sw)} layers={5} spread={0.8} /> : <Text style={styles.cellText}>{v || ''}</Text>;
              })()}</View>

              <View style={[styles.cellFixed, colStyle(COL.CORRECTIVE_ACTION)]}><Text style={styles.cellText}>{r.outOfSpecAction || ''}</Text></View>
              <View style={[styles.cellFixed, colStyle(COL.SUP_NAME_SIGN)]}>{(() => {
                const v = r.supNameSign;
                const uri = normalizeSignature(v);
                const sw = sigWidthFor(COL.SUP_NAME_SIGN);
                return uri ? <SignatureThumb uri={uri} width={sw} height={sigHeightFor(sw)} layers={6} spread={0.9} /> : <Text style={styles.cellText}>{v || ''}</Text>;
              })()}</View>
              <View style={[styles.cellFixed, colStyle(COL.COMPLEX_SIGN)]}>{(() => {
                const v = r.complexManagerSign;
                const uri = normalizeSignature(v);
                const sw = sigWidthFor(COL.COMPLEX_SIGN);
                return uri ? <SignatureThumb uri={uri} width={sw} height={sigHeightFor(sw)} layers={6} spread={0.9} /> : <Text style={styles.cellText}>{v || ''}</Text>;
              })()}</View>

              <View style={[styles.cellFixed, colStyle(COL.FSC_SIGN)]}>{(() => {
                const v = r.fscSign;
                const uri = normalizeSignature(v);
                const sw = sigWidthFor(COL.FSC_SIGN);
                return uri ? <SignatureThumb uri={uri} width={sw} height={sigHeightFor(sw)} layers={6} spread={0.9} /> : <Text style={styles.cellText}>{v || ''}</Text>;
              })()}</View>

              <View style={[styles.cellFixed, colStyle(COL.HSEQ_SIGN)]}>{(() => {
                const v = r.hseqManagerSign;
                const uri = normalizeSignature(v);
                const sw = sigWidthFor(COL.HSEQ_SIGN);
                return uri ? <SignatureThumb uri={uri} width={sw} height={sigHeightFor(sw)} layers={6} spread={0.9} /> : <Text style={styles.cellText}>{v || ''}</Text>;
              })()}</View>
            </View>
          ))}
          </View>
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
  tableWrap: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6e6e6', overflow: 'hidden', marginTop: 12 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f3f4f6' },
  detailHeader: { borderBottomWidth: 1, borderColor: '#e6e6e6' },
  hCellFixed: { paddingVertical: 6, paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#cbd5e1', backgroundColor: '#f8fafc' },
  hGroupCell: { paddingVertical: 6, paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#cbd5e1', backgroundColor: '#eef2ff', textAlign: 'center' },
  tableGroupHeader: { flexDirection: 'row', backgroundColor: '#eef2ff', borderBottomWidth: 1, borderBottomColor: '#cbd5e1' },
  subjectBand: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', padding: 6, marginBottom: 8 },
  subjectLeft: { flex: 1 },
  subjectLabel: { fontWeight: '700', fontSize: 10, color: '#111827' },
  subjectContent: { fontWeight: '800', fontSize: 12, marginTop: 2 },
  compiledBox: { width: 220, borderLeftWidth: 1, borderLeftColor: '#cbd5e1', paddingLeft: 8, justifyContent: 'center' },
  compiledRow: { flexDirection: 'row', justifyContent: 'space-between' },
  compiledLabel: { fontWeight: '700', fontSize: 10 },
  compiledValue: { fontSize: 10 },
  brandingRowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logoAreaTop: { flexDirection: 'row', alignItems: 'center' },
  companyAreaTop: { marginLeft: 8 },
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
  cellText: { fontSize: 12, color: '#111827' }
  ,
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e6e6e6' },
  footerItem: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  footerLabel: { marginTop: 6, fontSize: 12, fontWeight: '700', color: '#374151' },
  footerText: { fontSize: 12, color: '#111827' },
});

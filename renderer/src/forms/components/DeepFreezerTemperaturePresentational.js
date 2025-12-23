import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

export default function DeepFreezerTemperaturePresentational({ payload, exportingWide = false }) {
  if (!payload) return null;
  const p = payload.payload || payload;
  const { metadata = {}, formData = [], layoutHints = {}, _tableWidth } = p;
  const rows = formData && formData.length ? formData : (p.rows || []);

  // Respect `exportingWide` passed directly or as a payload flag
  const effectiveExporting = exportingWide || (payload && (payload.__exportingWide || (payload.payload && payload.payload.__exportingWide))) || false;

  const COL_WEIGHTS = (layoutHints && layoutHints.WIDTHS) || {
    DATE: 60,
    TEMP: 80,
    SIGN: 120,
    CORRECTIVE_ACTION: 300,
    SUP_NAME_SIGN: 140,
    COMPLEX_SIGN: 140,
    FSC_SIGN: 120,
    HSEQ_SIGN: 140,
  };

  // Use flexible column sizing so the modal width decides export sizing.
  // We also support an `exportingWide` flow which will compute a scaled
  // fixed width layout (like KitchenWeekly) to avoid ScrollView clipping
  // when html2canvas captures the DOM.
  const TOTAL_WEIGHT = Object.values(COL_WEIGHTS).reduce((s, v) => s + (Number(v) || 0), 0) || 1;

  // Compute table widths and optional export scaling
  const baseTableWidth = Object.values(COL_WEIGHTS).reduce((s, v) => s + (Number(v) || 0), 0) || 1;
  const TABLE_W = Number(_tableWidth) || baseTableWidth;
  const EXPORT_WIDTH = 900;
  let scale = 1;
  let tableW = TABLE_W;
  if (effectiveExporting && TABLE_W > EXPORT_WIDTH) {
    scale = EXPORT_WIDTH / TABLE_W;
    tableW = EXPORT_WIDTH;
  }

  const adjustedWeights = {};
  Object.keys(COL_WEIGHTS).forEach(k => { adjustedWeights[k] = Math.max(1, Math.round((Number(COL_WEIGHTS[k]||0) || 0) * scale)); });

  const getColStyle = (keys) => {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    if (effectiveExporting) {
      const widthSum = keysArray.reduce((s, k) => s + (Number(adjustedWeights[k] || 0)), 0) || 0;
      return { width: widthSum, minWidth: widthSum, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#cbd5e1', paddingHorizontal: 4 };
    }
    const weightSum = keysArray.reduce((s, k) => s + (Number(COL_WEIGHTS[k] || 0)), 0);
    return { flex: weightSum / TOTAL_WEIGHT, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#cbd5e1', paddingHorizontal: 4 };
  };

  const sigWidthFor = (key) => {
    const base = Number(COL_WEIGHTS[key] || 120) || 120;
    const w = effectiveExporting ? (adjustedWeights[key] || Math.round(base * scale)) : base;
    return Math.min(160, Math.max(48, Math.round(w * 0.8)));
  };
  const sigHeightFor = (w) => Math.max(36, Math.round((Number(w) || 120) * 0.5));

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

  // remove any fixed TABLE_WIDTH — export width will be determined by the modal
  // const TABLE_WIDTH = COL.DATE + (COL.TEMP + COL.SIGN) * 3 + COL.CORRECTIVE_ACTION + COL.SUP_NAME_SIGN + COL.COMPLEX_SIGN + COL.FSC_SIGN + COL.HSEQ_SIGN;

  // Use freezerName from metadata only (no fallback to subject)
  const freezerName = metadata.freezerName || '';

  const exportWrapperStyle = { padding: 0, margin: 0, backgroundColor: '#fff' };
  const exportA4Style = effectiveExporting ? { width: tableW, minWidth: tableW } : {};
  const Wrapper = effectiveExporting ? View : ScrollView;
  const wrapperProps = effectiveExporting ? { style: { ...exportWrapperStyle, width: tableW } } : { contentContainerStyle: styles.container };

  return (
    <Wrapper {...wrapperProps}>
      <View style={styles.card}>
        {/* Branding row: logo + company name on top-left above all content */}
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

        <View style={styles.titleRow}>
          <Text style={styles.titleText}>DEEP FREEZER TEMPERATURE LOG SHEET</Text>
        </View>
        <View style={styles.subjectBand}>
          <View style={styles.subjectLeft}>
            <Text style={styles.subjectLabel}>Name of freezer:</Text>
            <Text style={styles.subjectContent}>{freezerName}</Text>
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
        <View style={styles.metaInfoRow}>
            <View style={styles.metaInfoField}><Text style={styles.metaInfoLabel}>Month:</Text><Text style={styles.metaInfoValue}>{metadata.month || ''}</Text></View>
            <View style={styles.metaInfoField}><Text style={styles.metaInfoLabel}>Year:</Text><Text style={styles.metaInfoValue}>{metadata.year || ''}</Text></View>
            <View style={[styles.metaInfoField, { flex: 1 }]}><Text style={styles.metaInfoLabel}>Location:</Text><Text style={styles.metaInfoValue}>{metadata.location || ''}</Text></View>
        </View>

        <View style={styles.instructionBox}>
          <Text style={styles.instructionText}><Text style={{ fontWeight: '800' }}>Instruction:</Text> {metadata.instruction || 'The temperature of the Deep Freezer should be less than -18°C and not fall below -12°C.'}</Text>
        </View>

        <View style={[styles.tableWrap, exportA4Style]}>
          <View style={[styles.tableGroupHeader]}> 
            <View style={[styles.hCellFixed, getColStyle('DATE')]}><Text style={styles.hText}>DATE</Text></View>
            <View style={[styles.hGroupCell, getColStyle(['TEMP','SIGN'])]}><Text style={styles.hText}>MORNING</Text></View>
            <View style={[styles.hGroupCell, getColStyle(['TEMP','SIGN'])]}><Text style={styles.hText}>AFTERNOON</Text></View>
            <View style={[styles.hGroupCell, getColStyle(['TEMP','SIGN'])]}><Text style={styles.hText}>EVENING</Text></View>
            <View style={[styles.hCellFixed, getColStyle('CORRECTIVE_ACTION')]}><Text style={styles.hText}>IF TEMPERATURE IS OUT OF SPECIFICATION, WHAT WAS DONE ABOUT IT?</Text></View>
            <View style={[styles.hCellFixed, getColStyle('SUP_NAME_SIGN')]}><Text style={styles.hText}>SUP SIGN</Text></View>
            <View style={[styles.hCellFixed, getColStyle('COMPLEX_SIGN')]}><Text style={styles.hText}>COMPLEX SIGN</Text></View>
            <View style={[styles.hCellFixed, getColStyle('FSC_SIGN')]}><Text style={styles.hText}>FSC SIGN</Text></View>
            <View style={[styles.hCellFixed, getColStyle('HSEQ_SIGN')]}><Text style={styles.hText}>HSEQ SIGN</Text></View>
          </View>

          <View style={[styles.tableHeaderRow, styles.detailHeader]}>
            <View style={[styles.hCellFixed, getColStyle('DATE')]} />
            <View style={[styles.hCellFixed, getColStyle('TEMP')]}><Text style={styles.hText}>TEMP</Text></View>
            <View style={[styles.hCellFixed, getColStyle('SIGN')]}><Text style={styles.hText}>STAFF SIGN</Text></View>
            <View style={[styles.hCellFixed, getColStyle('TEMP')]}><Text style={styles.hText}>TEMP</Text></View>
            <View style={[styles.hCellFixed, getColStyle('SIGN')]}><Text style={styles.hText}>STAFF SIGN</Text></View>
            <View style={[styles.hCellFixed, getColStyle('TEMP')]}><Text style={styles.hText}>TEMP</Text></View>
            <View style={[styles.hCellFixed, getColStyle('SIGN')]}><Text style={styles.hText}>STAFF SIGN</Text></View>
            <View style={[styles.hCellFixed, getColStyle('CORRECTIVE_ACTION')]} />
            <View style={[styles.hCellFixed, getColStyle('SUP_NAME_SIGN')]} />
            <View style={[styles.hCellFixed, getColStyle('COMPLEX_SIGN')]} />
            <View style={[styles.hCellFixed, getColStyle('FSC_SIGN')]} />
            <View style={[styles.hCellFixed, getColStyle('HSEQ_SIGN')]} />
          </View>

          {rowsToRender.map((r, ri) => (
            <View key={ri} style={styles.row}>
              <View style={[styles.cellFixed, getColStyle('DATE')]}><Text style={styles.cellText}>{ordinal(r.day || (ri + 1))}</Text></View>

                <View style={[styles.cellFixed, getColStyle('TEMP')]}><Text style={styles.cellText}>{r.tempMorning || ''}</Text></View>
                <View style={[styles.cellFixed, getColStyle('SIGN')]}>{(() => {
                  const v = r.staffSignMorning;
                  const uri = normalizeSignature(v);
                  const sw = sigWidthFor('SIGN');
                  return uri ? <SignatureThumb uri={uri} width={sw} height={sigHeightFor(sw)} layers={5} spread={0.8} /> : <Text style={styles.cellText}>{v || ''}</Text>;
                })()}</View>

                <View style={[styles.cellFixed, getColStyle('TEMP')]}><Text style={styles.cellText}>{r.tempAfternoon || ''}</Text></View>
                <View style={[styles.cellFixed, getColStyle('SIGN')]}>{(() => {
                  const v = r.staffSignAfternoon;
                  const uri = normalizeSignature(v);
                  const sw = sigWidthFor('SIGN');
                  return uri ? <SignatureThumb uri={uri} width={sw} height={sigHeightFor(sw)} layers={5} spread={0.8} /> : <Text style={styles.cellText}>{v || ''}</Text>;
                })()}</View>

                <View style={[styles.cellFixed, getColStyle('TEMP')]}><Text style={styles.cellText}>{r.tempEvening || ''}</Text></View>
                <View style={[styles.cellFixed, getColStyle('SIGN')]}>{(() => {
                  const v = r.staffSignEvening;
                  const uri = normalizeSignature(v);
                  const sw = sigWidthFor('SIGN');
                  return uri ? <SignatureThumb uri={uri} width={sw} height={sigHeightFor(sw)} layers={5} spread={0.8} /> : <Text style={styles.cellText}>{v || ''}</Text>;
                })()}</View>

                <View style={[styles.cellFixed, getColStyle('CORRECTIVE_ACTION')]}><Text style={styles.cellText}>{r.outOfSpecAction || ''}</Text></View>
                <View style={[styles.cellFixed, getColStyle('SUP_NAME_SIGN')]}>{(() => {
                  const v = r.supNameSign;
                  const uri = normalizeSignature(v);
                  const sw = sigWidthFor('SUP_NAME_SIGN');
                  return uri ? <SignatureThumb uri={uri} width={sw} height={sigHeightFor(sw)} layers={6} spread={0.9} /> : <Text style={styles.cellText}>{v || ''}</Text>;
                })()}</View>
                <View style={[styles.cellFixed, getColStyle('COMPLEX_SIGN')]}>{(() => {
                  const v = r.complexManagerSign;
                  const uri = normalizeSignature(v);
                  const sw = sigWidthFor('COMPLEX_SIGN');
                  return uri ? <SignatureThumb uri={uri} width={sw} height={sigHeightFor(sw)} layers={6} spread={0.9} /> : <Text style={styles.cellText}>{v || ''}</Text>;
                })()}</View>

                <View style={[styles.cellFixed, getColStyle('FSC_SIGN')]}>{(() => {
                  const v = r.fscSign;
                  const uri = normalizeSignature(v);
                  const sw = sigWidthFor('FSC_SIGN');
                  return uri ? <SignatureThumb uri={uri} width={sw} height={sigHeightFor(sw)} layers={6} spread={0.9} /> : <Text style={styles.cellText}>{v || ''}</Text>;
                })()}</View>

                <View style={[styles.cellFixed, getColStyle('HSEQ_SIGN')]}>{(() => {
                  const v = r.hseqManagerSign;
                  const uri = normalizeSignature(v);
                  const sw = sigWidthFor('HSEQ_SIGN');
                  return uri ? <SignatureThumb uri={uri} width={sw} height={sigHeightFor(sw)} layers={6} spread={0.9} /> : <Text style={styles.cellText}>{v || ''}</Text>;
                })()}</View>
            </View>
          ))}
        </View>

        <View style={styles.footerRow}>
          
         

         
        </View>
      </View>
    </Wrapper>
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
  cellText: { fontSize: 12, color: '#111827' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e6e6e6' },
  footerItem: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  footerLabel: { marginTop: 6, fontSize: 12, fontWeight: '700', color: '#374151' },
  footerText: { fontSize: 12, color: '#111827' },
});

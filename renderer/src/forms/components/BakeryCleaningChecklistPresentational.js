import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

const DAYS_OF_WEEK = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const A4_WIDTH = 794;
export default function BakeryCleaningChecklistPresentational({ payload, exportingWide = false }) {
  const p = payload || {};
  const payloadCore = p.payload || p;
  const { metadata = {}, formData = [], verification = {}, layoutHints = {}, _tableWidth } = payloadCore;

  const logo = payloadCore.assets && payloadCore.assets.logoDataUri ? { uri: payloadCore.assets.logoDataUri } : require('../../assets/logo.jpeg');

  const COL = {
    AREA: (layoutHints && layoutHints.AREA) || layoutHints.AREA || 300,
    FREQ: (layoutHints && layoutHints.FREQ) || layoutHints.FREQ || 150,
    DAY: (layoutHints && layoutHints.DAY_COL) || layoutHints.DAY_COL || 150,
  };

  const TABLE_WIDTH = _tableWidth || (COL.AREA + COL.FREQ + (DAYS_OF_WEEK.length * COL.DAY));

  // Calculate scale and adjusted column widths for export
  let scale = 1;
  if (exportingWide && TABLE_WIDTH > A4_WIDTH) {
    scale = A4_WIDTH / TABLE_WIDTH;
  }
  const adjustedArea = Math.round(COL.AREA * scale);
  const adjustedFreq = Math.round(COL.FREQ * scale);
  const adjustedDay = Math.round(COL.DAY * scale);
  const adjustedTableWidth = exportingWide ? Math.round(TABLE_WIDTH * scale) : TABLE_WIDTH;

  const normalizeSignature = (v) => {
    if (!v) return null;
    // handle object shapes like { uri } or { data }
    if (typeof v === 'object') {
      const maybe = v.uri || v.data || v.base64 || v;
      if (typeof maybe === 'string') return normalizeSignature(maybe);
      return null;
    }
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) return null;
      if (s.startsWith('data:')) return s.replace(/\s+/g, '');
      // data urls with whitespace/newlines
      if (/^data:image\/.+;base64,/.test(s)) return s.replace(/\s+/g, '');
      const compact = s.replace(/\s+/g, '');
      // treat long base64 as image
      if (/^[A-Za-z0-9+/=]+$/.test(compact) && compact.length > 100) return `data:image/png;base64,${compact}`;
    }
    return null;
  };

  const renderMaybeSignature = (val, textStyle = {}) => {
    const uri = normalizeSignature(val);
    if (uri) return <SignatureThumb uri={uri} width={240} height={96} layers={10} spread={1.2} />;
    return <Text style={textStyle}>{val || ''}</Text>;
  };

  const renderDayCell = (item, day, dayWidth) => {
    const dayObj = item.days && item.days[day] ? item.days[day] : { checked: false, cleanedBy: '' };
    return (
      <View key={day} style={[styles.dayCol, { width: dayWidth }] }>
        <View style={styles.checkBoxWrap}>
          {dayObj.checked ? <Text style={styles.checkMark}>✓</Text> : <View style={styles.emptyBox} />}
        </View>
        <Text style={styles.cleanedByText}>{dayObj.cleanedBy || ''}</Text>
      </View>
    );
  };

  const exportA4Style = exportingWide ? { width: A4_WIDTH, maxWidth: A4_WIDTH, alignSelf: 'center' } : {};

  return (
    <ScrollView contentContainerStyle={exportingWide ? { padding: 0, margin: 0, backgroundColor: '#fff' } : styles.container}>
      <View style={[styles.headerTop, exportA4Style]}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <View style={{ flex: 1, paddingLeft: 12 }}>
          <Text style={styles.companyName}>Bravo</Text>
          <Text style={styles.areaTitle}>BAKERY & CONFECTIONARY AREA</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.mainTitle}>BAKERY AREA CLEANING CHECKLIST</Text>
          <Text style={styles.docText}>Issued: {metadata.month || ''} {metadata.year || ''}</Text>
        </View>
      </View>

      <View style={styles.metaRow}> 
        <View style={styles.metaCol}><Text style={styles.metaLabel}>Location:</Text><Text style={styles.metaVal}>{metadata.location}</Text></View>
        <View style={styles.metaCol}><Text style={styles.metaLabel}>Week:</Text><Text style={styles.metaVal}>{metadata.week}</Text></View>
      </View>

      {exportingWide ? (
        <View style={[styles.tableScroll, exportA4Style]}>
          <View style={{ width: adjustedTableWidth }}>
            <View style={[styles.headerRow, { width: adjustedTableWidth }]}> 
              <View style={[styles.headerCell, { width: adjustedArea }]}> 
                <Text style={styles.headerText}>Area to be cleaned</Text>
              </View>
              <View style={[styles.headerCell, { width: adjustedFreq }]}> 
                <Text style={styles.headerText}>Frequency</Text>
              </View>
              {DAYS_OF_WEEK.map((day) => (
                <View key={day} style={[styles.dayHeaderContainer, { width: adjustedDay }]}> 
                  <View style={styles.dayHeaderMain}><Text style={styles.dayHeaderText}>{day.toUpperCase()}</Text></View>
                  <View style={styles.dayHeaderSub}><Text style={styles.dayHeaderSubText}>CHECK</Text><Text style={styles.dayHeaderSubText}>CLEANED BY</Text></View>
                </View>
              ))}
            </View>

            {formData.map(item => (
              <View key={item.id} style={[styles.row, { width: adjustedTableWidth }]}> 
                <View style={[styles.cell, { width: adjustedArea }]}><Text style={styles.areaText}>{item.name}</Text></View>
                <View style={[styles.cell, { width: adjustedFreq }]}><Text style={styles.freqText}>{item.frequency}</Text></View>
                {DAYS_OF_WEEK.map(d => renderDayCell(item, d, adjustedDay))}
              </View>
            ))}
          </View>
        </View>
      ) : (
        <ScrollView horizontal contentContainerStyle={{ width: TABLE_WIDTH }} style={styles.tableScroll}>
          <View style={{ width: TABLE_WIDTH }}>
            <View style={[styles.headerRow, { width: TABLE_WIDTH }]}> 
              <View style={[styles.headerCell, { width: COL.AREA }]}>
                <Text style={styles.headerText}>Area to be cleaned</Text>
              </View>
              <View style={[styles.headerCell, { width: COL.FREQ }]}>
                <Text style={styles.headerText}>Frequency</Text>
              </View>
              {DAYS_OF_WEEK.map((day) => (
                <View key={day} style={[styles.dayHeaderContainer, { width: COL.DAY }]}> 
                  <View style={styles.dayHeaderMain}><Text style={styles.dayHeaderText}>{day.toUpperCase()}</Text></View>
                  <View style={styles.dayHeaderSub}><Text style={styles.dayHeaderSubText}>CHECK</Text><Text style={styles.dayHeaderSubText}>CLEANED BY</Text></View>
                </View>
              ))}
            </View>

            {formData.map(item => (
              <View key={item.id} style={[styles.row, { width: TABLE_WIDTH }]}> 
                <View style={[styles.cell, { width: COL.AREA }]}><Text style={styles.areaText}>{item.name}</Text></View>
                <View style={[styles.cell, { width: COL.FREQ }]}><Text style={styles.freqText}>{item.frequency}</Text></View>
                {DAYS_OF_WEEK.map(d => renderDayCell(item, d, COL.DAY))}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <View style={styles.verificationContainer}>
        <View style={styles.verificationRow}>
          <Text style={styles.verificationLabel}>Verified by (HSEQ):</Text>
          {renderMaybeSignature(verification.hseqManager || verification.hseqManagerSign || verification.hseqManagerSignature, styles.verificationVal)}
        </View>
        <View style={styles.verificationRow}>
          <Text style={styles.verificationLabel}>Complex Manager:</Text>
          {renderMaybeSignature(verification.complexManager || verification.complexManagerSign || verification.complexManagerSignature, styles.verificationVal)}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff' },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  logo: { width: 72, height: 72, borderRadius: 6 },
  companyName: { fontSize: 18, fontWeight: '800', color: '#185a9d' },
  areaTitle: { fontSize: 12, fontWeight: '700', color: '#374151' },
  mainTitle: { fontSize: 16, fontWeight: '800', color: '#1F2937' },
  docText: { fontSize: 10, color: '#6b7280' },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 12 },
  metaCol: { marginRight: 24 },
  metaLabel: { fontWeight: '700', color: '#374151' },
  metaVal: { color: '#111827' },

  tableScroll: { borderWidth: 1, borderColor: '#1F2937', borderRadius: 6, backgroundColor: '#fff' },
  // Use a lighter grey header background and black text for better print contrast
  headerRow: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderBottomWidth: 2, borderColor: '#1F2937', minHeight: 48, alignItems: 'center' },
  headerCell: { padding: 8, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#4B5563' },
  headerText: { color: '#000', fontWeight: '800' },
  dayHeaderContainer: { flexDirection: 'column', borderRightWidth: 1, borderRightColor: '#4B5563' },
  // Make day headers light background with dark text for print visibility
  dayHeaderMain: { backgroundColor: '#f3f4f6', height: 26, justifyContent: 'center', alignItems: 'center' },
  dayHeaderText: { color: '#000', fontWeight: '800' },
  dayHeaderSub: { flexDirection: 'row', height: 20, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, backgroundColor: '#f8fafc' },
  dayHeaderSubText: { fontSize: 9, fontWeight: '600', color: '#000' },

  row: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#4B5563', minHeight: 44, alignItems: 'center' },
  cell: { padding: 6, borderRightWidth: 1, borderRightColor: '#4B5563', justifyContent: 'center', alignItems: 'center' },
  areaText: { fontSize: 12, color: '#374151' },
  freqText: { fontSize: 12, color: '#6B7280' },

  dayCol: { flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#4B5563', paddingVertical: 6 },
  checkBoxWrap: { height: 22, justifyContent: 'center', alignItems: 'center' },
  emptyBox: { width: 18, height: 18, borderWidth: 2, borderColor: '#4B5563', borderRadius: 4, backgroundColor: '#fff' },
  checkMark: { color: '#10B981', fontSize: 14, fontWeight: '800' },
  cleanedByText: { marginTop: 6, fontSize: 11, color: '#111827' },

  verificationContainer: { marginTop: 12 },
  verificationLabel: { fontWeight: '700', color: '#374151', marginBottom: 6 },
  verificationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  verificationVal: { marginLeft: 8, color: '#111827' },
});
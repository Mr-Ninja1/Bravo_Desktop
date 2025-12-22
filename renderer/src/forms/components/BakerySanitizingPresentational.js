import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';

// Pixel-faithful presentational renderer for Bakery Sanitizing Log
// Accepts: { payload }
export default function BakerySanitizingPresentational({ payload = {}, embedded = false }) {
  const p = payload || {};
  // Support both payload and wrapper shapes
  const payloadCore = p.payload || p;

  const title = payloadCore.title || 'FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET - BAKERY';
  const metadata = payloadCore.metadata || {};
  const timeSlots = payloadCore.timeSlots || [];
  const formData = payloadCore.formData || [];
  const layoutHints = payloadCore.layoutHints || {};
  const tableWidth = payloadCore._tableWidth || layoutHints._tableWidth;
  const assets = payloadCore.assets || null;

  const logo = assets && assets.logoDataUri ? { uri: assets.logoDataUri } : require('../../assets/logo.jpeg');

  const COL = {
    EQUIP: layoutHints.EQUIP || layoutHints.EQUIPMENT || 220,
    PPM: layoutHints.PPM || 80,
    TIME: layoutHints.TIME_SLOT || layoutHints.TIME || 44,
    STAFF: layoutHints.STAFF || 120,
    SIGN: layoutHints.SIGN || 120,
    SUP: layoutHints.SUP || 120,
  };

  const timeColsWidth = (timeSlots.length || 0) * COL.TIME;
  const minWidth = (tableWidth || (COL.EQUIP + COL.PPM + timeColsWidth + COL.STAFF + COL.SIGN + COL.SUP));

  // Helper to render an underline placeholder when cell empty (matches editable look)
  const renderUnderline = (text) => {
    if (text === undefined || text === null || String(text).trim() === '') return <Text style={styles.underline}>______</Text>;
    return <Text style={styles.cellText}>{String(text)}</Text>;
  };

  const renderSignatureCell = (val, w, h) => {
    if (!val) return renderUnderline(val);
    const v = String(val);
    const uri = v.startsWith('data:') ? v : `data:image/png;base64,${v}`;
    return <Image source={{ uri }} style={{ width: w || (COL.SIGN - 8), height: h || 60, resizeMode: 'contain' }} />;
  };

  const formatTime = (t) => {
    if (!t && t !== 0) return '';
    const s = String(t);
    // common patterns: '06:00AM', '06:00PM', or already '06:00'
    return s.replace(/(AM|PM)/i, '').trim();
  };

  const content = (
    <>
      <View style={styles.headerTop}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.companyName}>Bravo</Text>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.metadataContainer}>
        <View style={styles.metaRowTop}>
          <View style={styles.metaItem}><Text style={styles.metaLabel}>Date:</Text>{renderUnderline(metadata.date)}</View>
          <View style={styles.metaItem}><Text style={styles.metaLabel}>Location:</Text>{renderUnderline(metadata.location)}</View>
          <View style={styles.metaItem}><Text style={styles.metaLabel}>Shift:</Text>{renderUnderline(metadata.shift)}</View>
        </View>
        <View style={styles.metaRowTopSecond}>
          <View style={{ flex: 1 }}>
            <Text style={styles.metaLabel}>Verified By:</Text>
            {/* Only signature is supported for Verified By; no free-text name */}
          </View>
          <View style={{ width: 260, alignItems: 'center', marginLeft: 12 }}>
            {/* render signature image if present */}
            {metadata && metadata.verifiedBySign ? renderSignatureCell(metadata.verifiedBySign, 240, 80) : null}
          </View>
        </View>
        <Text style={styles.tickBadge}>✓ TICK AFTER CLEANING</Text>
      </View>

      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={true}
        directionalLockEnabled={true}
        contentContainerStyle={{ width: minWidth, alignItems: 'flex-start' }}
        style={styles.tableWrapper}
      >
        <View style={[styles.table, { width: minWidth, alignSelf: 'flex-start' }]}>
          <View style={[styles.headerRow, { width: minWidth }]}>
            <View style={[styles.hCell, { width: COL.EQUIP }]}><Text style={styles.hText}>EQUIPMENT</Text></View>
            <View style={[styles.hCell, { width: COL.PPM }]}><Text style={styles.hText}>SANITIZER (PPM)</Text></View>
            <View style={{ width: timeColsWidth }}>
              <View style={[styles.hCellMainTime]}>
                <Text style={styles.hText}>TIME INTERVAL</Text>
              </View>
              <View style={[styles.timeSubRow, { flexDirection: 'row' }]}> 
                {timeSlots.map((t, i) => (
                  <View key={i} style={[styles.hCell, { width: COL.TIME }]}>
                    <Text style={styles.hTextSmall}>{formatTime(t)}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={[styles.hCell, { width: COL.STAFF }]}><Text style={styles.hText}>STAFF NAME</Text></View>
            <View style={[styles.hCell, { width: COL.SIGN }]}><Text style={styles.hText}>STAFF SIGN</Text></View>
            <View style={[styles.hCell, { width: COL.SUP }]}><Text style={styles.hText}>SUP NAME</Text></View>
            <View style={[styles.hCell, { width: COL.SUP }]}><Text style={styles.hText}>SUP SIGN</Text></View>
          </View>

          {(formData.length ? formData : Array.from({ length: 8 }).map((_,i)=>({ name: '', ppm: '', times: {}, staffName: '', staffSign: '', supName: '', supSign: '' }))).map((row, rIdx) => (
            <View key={rIdx} style={[styles.row, { width: minWidth }]}>
              <View style={[styles.cell, { width: COL.EQUIP }]}>{renderUnderline(row.name)}</View>
              <View style={[styles.cell, { width: COL.PPM }]}>{renderUnderline(row.ppm)}</View>
              <View style={{ flexDirection: 'row', width: timeColsWidth }}>
                {timeSlots.map((t, ti) => (
                  <View key={ti} style={[styles.cell, { width: COL.TIME }]}>
                    <View style={[styles.checkbox, row.times && row.times[t] ? styles.checkboxChecked : null]}>
                      {row.times && row.times[t] ? <Text style={styles.checkMark}>✓</Text> : null}
                    </View>
                  </View>
                ))}
              </View>
              <View style={[styles.cell, { width: COL.STAFF }]}>{renderUnderline(row.staffName)}</View>
              <View style={[styles.cell, { width: COL.SIGN }]}>{renderSignatureCell(row.staffSign, COL.SIGN - 8, 60)}</View>
              <View style={[styles.cell, { width: COL.SUP }]}>{renderUnderline(row.supName)}</View>
              <View style={[styles.cell, { width: COL.SUP }]}>{renderSignatureCell(row.supSign, COL.SUP - 8, 60)}</View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Text style={styles.footer}>Instruction: All food handlers are required to clean and sanitize the equipment after use.</Text>
    </>
  );

  return embedded ? <View style={styles.container}>{content}</View> : <ScrollView contentContainerStyle={styles.container}>{content}</ScrollView>;
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff' },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  logo: { width: 72, height: 48, marginRight: 8 },
  companyName: { fontSize: 16, fontWeight: '800', color: '#185a9d' },
  titleRow: { alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 14, fontWeight: '800', color: '#185a9d', textAlign: 'center' },
  metadataContainer: { marginBottom: 10, padding: 8, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, backgroundColor: '#fff' },
  metaRowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metaRowTopSecond: { marginBottom: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaLabel: { fontWeight: '700', marginRight: 6, color: '#374151' },
  metadataContainerInner: { flexDirection: 'row' },
  tickBadge: { marginTop: 8, backgroundColor: '#e6ffea', padding: 6, borderRadius: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#c9f2d0', color: '#085f1a', fontWeight: '700' },
  tableWrapper: { borderWidth: 1, borderColor: '#4B5563', borderRadius: 6, backgroundColor: '#fff' },
  table: { backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', backgroundColor: '#e9e9e9', borderBottomWidth: 2, borderColor: '#4B5563', alignItems: 'center' },
  hCell: { padding: 6, borderRightWidth: 1, borderColor: '#4B5563', justifyContent: 'center', alignItems: 'center' },
  hText: { fontWeight: '800', fontSize: 12, color: '#111827' },
  hTextSmall: { fontWeight: '700', fontSize: 11, color: '#111827' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e7eb', minHeight: 40, alignItems: 'center' },
  cell: { padding: 6, borderRightWidth: 1, borderColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  cellText: { textAlign: 'left', paddingLeft: 6, color: '#111827' },
  underline: { color: '#9CA3AF', fontWeight: '700' },
  checkbox: { width: 28, height: 28, borderWidth: 1.5, borderColor: '#4B5563', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f6fff6' },
  checkboxChecked: { backgroundColor: '#1f8f1f', borderColor: '#1f8f1f' },
  checkMark: { color: '#fff', fontWeight: '800' },
  footer: { marginTop: 12, color: '#6b7280', fontStyle: 'italic', textAlign: 'center' },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';

const EXPORT_WIDTH = 1100; // Increased base width for better spacing

export default function FOH_DailyCleaningPresentational({ payload, exportingWide = false }) {
  if (!payload) return null;
  const { metadata = {}, formData = [], layoutHints = {} } = payload;
  const timeSlots = payload.timeSlots || ['15:00','16:00','17:00','18:00','19:00','20:00','21:00'];

  const hints = layoutHints || {};
  
  // Revised widths to ensure no text overlap
  const defaultWidths = {
    EQUIPMENT: 160,    // Increased for longer item names
    PPM: 80,          // Increased for "SANITIZER (PPM)" title
    TIME_SLOT: 52,    // Wider slots for better touch targets
    STAFF_NAME: 130,
    SIGNATURE: 130,
    SUP_NAME: 100,
    SUP_SIGN: 90,
  };

  const slotCount = timeSlots.length;
  const computedTableW = (hints.EQUIPMENT || defaultWidths.EQUIPMENT)
    + (hints.PPM || defaultWidths.PPM)
    + slotCount * (hints.TIME_SLOT || defaultWidths.TIME_SLOT)
    + (hints.STAFF_NAME || defaultWidths.STAFF_NAME)
    + (hints.SIGNATURE || defaultWidths.SIGNATURE)
    + (hints.SUP_NAME || defaultWidths.SUP_NAME)
    + (hints.SUP_SIGN || defaultWidths.SUP_SIGN);

  const tableW = payload._tableWidth || computedTableW;
  let scale = 1;
  if (exportingWide && tableW > EXPORT_WIDTH) {
    scale = EXPORT_WIDTH / tableW;
  }

  const colWidth = (k) => {
    const base = hints[k] || defaultWidths[k];
    return exportingWide ? Math.round(base * scale) : base;
  };

  const md = metadata || {};
  const date = md.date || md.Date || payload.date || '';
  const location = md.location || md.site || '';
  const shift = md.shift || md.Shift || '';

  const renderSignature = (val, w) => {
    if (!val) return <Text style={styles.underline}>__________</Text>;
    const uri = String(val).startsWith('data:') ? val : `data:image/png;base64,${val}`;
    return <Image source={{ uri }} style={{ width: w - 10, height: 50, resizeMode: 'contain' }} />;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={exportingWide ? { width: EXPORT_WIDTH, alignSelf: 'center' } : { width: '100%' }}>
        
        {/* Header Section */}
        <View style={styles.headerTop}>
          <Image source={payload.assets?.logoDataUri ? { uri: payload.assets.logoDataUri } : require('../../assets/logo.jpeg')} style={styles.logo} />
          <Text style={styles.companyName}>BRAVO BRANDS</Text>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.formTitle}>FOOD CONTACT SURFACE CLEANING & SANITIZING LOG SHEET FOH</Text>
        </View>

        {/* Metadata Grid */}
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}><Text style={styles.metaLabel}>DATE:</Text><Text style={styles.metaValue}>{date}</Text></View>
          <View style={styles.metaItem}><Text style={styles.metaLabel}>LOCATION:</Text><Text style={styles.metaValue}>{location}</Text></View>
          <View style={styles.metaItem}><Text style={styles.metaLabel}>SHIFT:</Text><Text style={styles.metaValue}>{shift}</Text></View>
        </View>

        {/* Table Area */}
        <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableWrapper}>
          <View style={[styles.table, { width: tableW }]}>
            
            {/* Header Row */}
            <View style={styles.headerRow}>
              <View style={[styles.hCell, { width: colWidth('EQUIPMENT') }]}><Text style={styles.hText}>EQUIPMENT</Text></View>
              <View style={[styles.hCell, { width: colWidth('PPM') }]}><Text style={styles.hText}>SANITIZER{"\n"}(PPM)</Text></View>
              
              <View style={{ width: slotCount * colWidth('TIME_SLOT') }}>
                <View style={styles.hCellTimeMain}><Text style={styles.hText}>TIME INTERVAL</Text></View>
                <View style={{ flexDirection: 'row' }}>
                  {timeSlots.map((t, i) => (
                    <View key={i} style={[styles.hCell, { width: colWidth('TIME_SLOT'), borderTopWidth: 1, borderColor: '#ccc' }]}>
                      <Text style={styles.hTextSmall}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={[styles.hCell, { width: colWidth('STAFF_NAME') }]}><Text style={styles.hText}>STAFF NAME</Text></View>
              <View style={[styles.hCell, { width: colWidth('SIGNATURE') }]}><Text style={styles.hText}>STAFF SIGN</Text></View>
              <View style={[styles.hCell, { width: colWidth('SUP_NAME') }]}><Text style={styles.hText}>SUP NAME</Text></View>
              <View style={[styles.hCell, { width: colWidth('SUP_SIGN') }]}><Text style={styles.hText}>SUP SIGN</Text></View>
            </View>

            {/* Data Rows */}
            {(formData.length ? formData : Array.from({ length: 8 }).map(() => ({}))).map((row, idx) => (
              <View key={idx} style={styles.row}>
                <View style={[styles.cell, { width: colWidth('EQUIPMENT'), alignItems: 'flex-start' }]}>
                  <Text style={styles.cellTextBold}>{row.name}</Text>
                </View>
                <View style={[styles.cell, { width: colWidth('PPM') }]}>
                  <Text style={styles.cellText}>{row.ppm}</Text>
                </View>
                
                <View style={{ flexDirection: 'row' }}>
                  {timeSlots.map((t, ti) => (
                    <View key={ti} style={[styles.cell, { width: colWidth('TIME_SLOT') }]}>
                      <View style={[styles.checkbox, row.times?.[t] && styles.checkboxChecked]}>
                        {row.times?.[t] && <Text style={styles.checkMark}>✓</Text>}
                      </View>
                    </View>
                  ))}
                </View>

                <View style={[styles.cell, { width: colWidth('STAFF_NAME') }]}><Text style={styles.cellText}>{row.staffName}</Text></View>
                <View style={[styles.cell, { width: colWidth('SIGNATURE') }]}>{renderSignature(row.staffSign, colWidth('SIGNATURE'))}</View>
                <View style={[styles.cell, { width: colWidth('SUP_NAME') }]}><Text style={styles.cellText}>{row.supName || row.SUPName}</Text></View>
                <View style={[styles.cell, { width: colWidth('SUP_SIGN') }]}>{renderSignature(row.supSign, colWidth('SUP_SIGN'))}</View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', flex: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 2, borderColor: '#185a9d' },
  logo: { width: 60, height: 50, marginRight: 15, resizeMode: 'contain' },
  companyName: { fontSize: 22, fontWeight: '900', color: '#185a9d' },
  titleRow: { padding: 10, alignItems: 'center' },
  formTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center', color: '#333' },
  
  metaGrid: { flexDirection: 'row', backgroundColor: '#f8f9fa', margin: 10, padding: 10, borderRadius: 5, borderWidth: 1, borderColor: '#eee' },
  metaItem: { flex: 1, paddingHorizontal: 5 },
  metaLabel: { fontSize: 10, fontWeight: 'bold', color: '#666' },
  metaValue: { fontSize: 13, fontWeight: '700', color: '#222', marginTop: 2 },

  tableWrapper: { marginTop: 10 },
  table: { borderWidth: 1, borderColor: '#333', marginLeft: 10, marginRight: 10 },
  headerRow: { flexDirection: 'row', backgroundColor: '#f0f0f0' },
  hCell: { padding: 8, borderRightWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'center' },
  hCellTimeMain: { height: 30, justifyContent: 'center', alignItems: 'center' },
  hText: { fontSize: 11, fontWeight: '900', textAlign: 'center', color: '#000' },
  hTextSmall: { fontSize: 10, fontWeight: '700' },

  row: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#333', minHeight: 60 },
  cell: { padding: 5, borderRightWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'center' },
  cellText: { fontSize: 12, color: '#333', textAlign: 'center' },
  cellTextBold: { fontSize: 11, fontWeight: 'bold', color: '#000' },
  
  checkbox: { width: 24, height: 24, borderWidth: 1, borderColor: '#333', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  checkMark: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  underline: { color: '#ccc', fontSize: 10 }
});
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, useWindowDimensions } from 'react-native';

const EXPORT_WIDTH = 1100;

export default function FOH_DailyCleaningPresentational({ payload, exportingWide = false }) {
  const { width: windowWidth } = useWindowDimensions();
  
  if (!payload) return null;
  const { metadata = {}, formData = [], layoutHints = {} } = payload;
  const timeSlots = payload.timeSlots || ['15:00','16:00','17:00','18:00','19:00','20:00','21:00'];

  const hints = layoutHints || {};
  
  // Significantly increased widths to fill space and prevent text crowding
  const defaultWidths = {
    EQUIPMENT: 200,    // Wider for equipment names
    PPM: 100,         // Wider for Sanitizer title
    TIME_SLOT: 65,    // Larger touch areas for checkboxes
    STAFF_NAME: 150,
    SIGNATURE: 150,
    SUP_NAME: 120,
    SUP_SIGN: 110,
  };

  const slotCount = timeSlots.length;
  
  // Calculate the minimum required width based on content
  const contentRequiredWidth = (hints.EQUIPMENT || defaultWidths.EQUIPMENT)
    + (hints.PPM || defaultWidths.PPM)
    + slotCount * (hints.TIME_SLOT || defaultWidths.TIME_SLOT)
    + (hints.STAFF_NAME || defaultWidths.STAFF_NAME)
    + (hints.SIGNATURE || defaultWidths.SIGNATURE)
    + (hints.SUP_NAME || defaultWidths.SUP_NAME)
    + (hints.SUP_SIGN || defaultWidths.SUP_SIGN);

  // If not exporting, we ensure the table is at least as wide as the screen (minus margins)
  const tableW = exportingWide 
    ? (payload._tableWidth || contentRequiredWidth) 
    : Math.max(windowWidth - 20, contentRequiredWidth);

  let scale = 1;
  if (exportingWide && tableW > EXPORT_WIDTH) {
    scale = EXPORT_WIDTH / tableW;
  }

  // Helper to distribute width proportionally if the table is stretched to fit the screen
  const getColWidth = (key) => {
    const base = hints[key] || defaultWidths[key];
    if (exportingWide) return Math.round(base * scale);
    
    // Proportional scaling for mobile screen filling
    const ratio = tableW / contentRequiredWidth;
    return base * ratio;
  };

  const md = metadata || {};
  const date = md.date || md.Date || payload.date || '';
  const location = md.location || md.site || '';
  const shift = md.shift || md.Shift || '';

  const renderSignature = (val, w) => {
    if (!val) return <Text style={styles.underline}>__________</Text>;
    const uri = String(val).startsWith('data:') ? val : `data:image/png;base64,${val}`;
    return <Image source={{ uri }} style={{ width: w - 20, height: 50, resizeMode: 'contain' }} />;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={exportingWide ? { width: EXPORT_WIDTH, alignSelf: 'center' } : { width: '100%' }}>
        
        {/* Header Section */}
        <View style={styles.headerTop}>
          <Image source={payload.assets?.logoDataUri ? { uri: payload.assets.logoDataUri } : require('../../assets/logo.jpeg')} style={styles.logo} />
          <View>
            <Text style={styles.companyName}>BRAVO BRANDS</Text>
            <Text style={styles.subHeader}>Food Safety Management System</Text>
          </View>
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
              <View style={[styles.hCell, { width: getColWidth('EQUIPMENT') }]}><Text style={styles.hText}>EQUIPMENT</Text></View>
              <View style={[styles.hCell, { width: getColWidth('PPM') }]}><Text style={styles.hText}>SANITIZER{"\n"}(PPM)</Text></View>
              
              <View style={{ width: slotCount * getColWidth('TIME_SLOT') }}>
                <View style={styles.hCellTimeMain}><Text style={styles.hText}>TIME INTERVAL</Text></View>
                <View style={{ flexDirection: 'row' }}>
                  {timeSlots.map((t, i) => (
                    <View key={i} style={[styles.hCell, { width: getColWidth('TIME_SLOT'), borderTopWidth: 1, borderColor: '#333' }]}>
                      <Text style={styles.hTextSmall}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={[styles.hCell, { width: getColWidth('STAFF_NAME') }]}><Text style={styles.hText}>STAFF NAME</Text></View>
              <View style={[styles.hCell, { width: getColWidth('SIGNATURE') }]}><Text style={styles.hText}>STAFF SIGN</Text></View>
              <View style={[styles.hCell, { width: getColWidth('SUP_NAME') }]}><Text style={styles.hText}>SUP NAME</Text></View>
              <View style={[styles.hCell, { width: getColWidth('SUP_SIGN'), borderRightWidth: 0 }]}><Text style={styles.hText}>SUP SIGN</Text></View>
            </View>

            {/* Data Rows */}
            {(formData.length ? formData : Array.from({ length: 10 }).map(() => ({}))).map((row, idx) => (
              <View key={idx} style={styles.row}>
                <View style={[styles.cell, { width: getColWidth('EQUIPMENT'), alignItems: 'flex-start' }]}>
                  <Text style={styles.cellTextBold}>{row.name || '-'}</Text>
                </View>
                <View style={[styles.cell, { width: getColWidth('PPM') }]}>
                  <Text style={styles.cellText}>{row.ppm || '-'}</Text>
                </View>
                
                <View style={{ flexDirection: 'row' }}>
                  {timeSlots.map((t, ti) => (
                    <View key={ti} style={[styles.cell, { width: getColWidth('TIME_SLOT') }]}>
                      <View style={[styles.checkbox, row.times?.[t] && styles.checkboxChecked]}>
                        {row.times?.[t] && <Text style={styles.checkMark}>✓</Text>}
                      </View>
                    </View>
                  ))}
                </View>

                <View style={[styles.cell, { width: getColWidth('STAFF_NAME') }]}><Text style={styles.cellText}>{row.staffName || '-'}</Text></View>
                <View style={[styles.cell, { width: getColWidth('SIGNATURE') }]}>{renderSignature(row.staffSign, getColWidth('SIGNATURE'))}</View>
                <View style={[styles.cell, { width: getColWidth('SUP_NAME') }]}><Text style={styles.cellText}>{row.supName || row.SUPName || '-'}</Text></View>
                <View style={[styles.cell, { width: getColWidth('SUP_SIGN'), borderRightWidth: 0 }]}>{renderSignature(row.supSign, getColWidth('SUP_SIGN'))}</View>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', flex: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 3, borderColor: '#185a9d' },
  logo: { width: 70, height: 60, marginRight: 15, resizeMode: 'contain' },
  companyName: { fontSize: 26, fontWeight: '900', color: '#185a9d', letterSpacing: 1 },
  subHeader: { fontSize: 12, color: '#666', fontWeight: '600' },
  titleRow: { padding: 15, alignItems: 'center', backgroundColor: '#f9fafb' },
  formTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', color: '#111', textTransform: 'uppercase' },
  
  metaGrid: { flexDirection: 'row', backgroundColor: '#fff', margin: 10, padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', elevation: 2 },
  metaItem: { flex: 1, borderRightWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 10 },
  metaLabel: { fontSize: 11, fontWeight: '800', color: '#6b7280', marginBottom: 4 },
  metaValue: { fontSize: 15, fontWeight: '700', color: '#111' },

  tableWrapper: { marginTop: 10 },
  table: { borderWidth: 2, borderColor: '#333', marginLeft: 10, marginRight: 10, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', backgroundColor: '#1f2937' },
  hCell: { padding: 10, borderRightWidth: 1, borderColor: '#4b5563', justifyContent: 'center', alignItems: 'center' },
  hCellTimeMain: { height: 35, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderColor: '#4b5563' },
  hText: { fontSize: 12, fontWeight: '900', textAlign: 'center', color: '#fff', textTransform: 'uppercase' },
  hTextSmall: { fontSize: 11, fontWeight: '700', color: '#fff' },

  row: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#333', minHeight: 70 },
  cell: { padding: 8, borderRightWidth: 1, borderColor: '#d1d5db', justifyContent: 'center', alignItems: 'center' },
  cellText: { fontSize: 13, color: '#374151', textAlign: 'center' },
  cellTextBold: { fontSize: 12, fontWeight: 'bold', color: '#111', textTransform: 'uppercase' },
  
  checkbox: { width: 30, height: 30, borderWidth: 2, borderColor: '#333', borderRadius: 6, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  checkboxChecked: { backgroundColor: '#10b981', borderColor: '#059669' },
  checkMark: { color: '#fff', fontWeight: '900', fontSize: 18 },
  underline: { color: '#d1d5db', fontSize: 12 }
});
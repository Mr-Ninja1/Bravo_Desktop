import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

const A4_WIDTH = 794;
export default function BeverageReceivingPresentational({ payload, exportingWide = false }) {
  const p = payload || {};
  const rows = p.formData || [];
  const logoSource = p.assets?.logoDataUri ? { uri: p.assets.logoDataUri } : require('../../assets/logo.jpeg');
  const hints = p.layoutHints || {};
  const meta = p.metadata || {};

  // Column widths
  // Prefer numeric hints but fall back to fixed defaults; coerce to Number
  const DEFAULT_COLS = { name: 260, supplier: 180, clean: 90, temp: 90, tempOfBeverage: 120, stateOfProduct: 140, expiryDate: 120, remarks: 300 };
  const colWidths = {
    name: Number(hints.NAME) || DEFAULT_COLS.name,
    supplier: Number(hints.SUPPLIER) || DEFAULT_COLS.supplier,
    clean: Number(hints.CLEAN) || DEFAULT_COLS.clean,
    temp: Number(hints.TEMP) || DEFAULT_COLS.temp,
    tempOfBeverage: Number(hints.TEMP_OF_BEVERAGE) || DEFAULT_COLS.tempOfBeverage,
    stateOfProduct: Number(hints.STATE_OF_PRODUCT) || DEFAULT_COLS.stateOfProduct,
    expiryDate: Number(hints.EXPIRY_DATE) || DEFAULT_COLS.expiryDate,
    remarks: Number(hints.REMARKS) || DEFAULT_COLS.remarks,
  };
  const totalWidth = Object.values(colWidths).reduce((s, v) => s + (Number(v) || 0), 0);
  const TOTAL = totalWidth || 1;
  const colStyle = (w) => {
    const width = Number(w) || 0;
    const flex = width / TOTAL;
    const min = Math.max(28, Math.round(width * 0.28));
    return { flex, minWidth: min, flexShrink: 1 };
  };

  // Calculate scale and adjusted column widths for export
  let scale = 1;
  if (exportingWide && totalWidth > A4_WIDTH) {
    scale = A4_WIDTH / totalWidth;
  }
  const adjustedWidths = {
    name: Math.round(colWidths.name * scale),
    supplier: Math.round(colWidths.supplier * scale),
    clean: Math.round(colWidths.clean * scale),
    temp: Math.round(colWidths.temp * scale),
    tempOfBeverage: Math.round(colWidths.tempOfBeverage * scale),
    stateOfProduct: Math.round(colWidths.stateOfProduct * scale),
    expiryDate: Math.round(colWidths.expiryDate * scale),
    remarks: Math.round(colWidths.remarks * scale),
  };
  const adjustedTableWidth = exportingWide ? Math.round(totalWidth * scale) : totalWidth;
  const exportA4Style = exportingWide ? { width: A4_WIDTH, maxWidth: A4_WIDTH, alignSelf: 'center' } : {};

  return (
    <ScrollView contentContainerStyle={exportingWide ? { padding: 0, margin: 0, backgroundColor: '#fff' } : styles.container}>
      {/* Header */}
      <View style={styles.docHeader}>
        <View style={styles.logoAndSystem}>
          <Image source={logoSource} style={styles.logoImage} resizeMode="contain" />
          <View style={styles.systemDetailsWrap}>
            <Text style={styles.logoText}>Bravo</Text>
            <View style={styles.systemDetails}>
              <Text style={styles.systemText}>BRAVO BRANDS LIMITED</Text>
              <Text style={styles.systemText}>Food Safety Management System</Text>
            </View>
          </View>
        </View>
        <View style={styles.docDetailsRight}>
          <Text style={styles.detailLabel}>Issue Date:</Text>
          <Text style={styles.detailValue}>{p.date || ''}</Text>
          <Text style={styles.detailLabel}>Page:</Text>
          <Text style={styles.detailValue}>1 of 1</Text>
        </View>
      </View>
      <View style={styles.subjectRow}>
        <View style={styles.subjectItem}><Text style={styles.subjectLabel}>Subject:</Text><Text style={styles.subjectValue}>Beverage and Water Receiving Checklist</Text></View>
        <View style={styles.versionDetails}><Text style={styles.versionText}>Version No: v1.0</Text></View>
      </View>
      <View style={styles.subDetailRow}>
        <View style={styles.subDetailItem}>
          <Text style={styles.subDetailLabel}>Compiled By:</Text>
          {(() => {
            const v = meta.compiledBySign || meta.compiledBy || '';
            const uri = v ? (String(v).startsWith('data:') ? v : (String(v).length > 100 ? `data:image/png;base64,${String(v).replace(/\s+/g, '')}` : null)) : null;
            const name = meta.compiledBy || 'Patrnan';
            return uri ? <SignatureThumb uri={uri} width={200} height={60} layers={6} spread={1.0} /> : <Text style={styles.subDetailValue}>{name}</Text>;
          })()}
        </View>
        <View style={styles.subDetailItem}>
          <Text style={styles.subDetailLabel}>Approved By:</Text>
          {(() => {
            const v = meta.approvedBySign || meta.approvedBy || '';
            const uri = v ? (String(v).startsWith('data:') ? v : (String(v).length > 100 ? `data:image/png;base64,${String(v).replace(/\s+/g, '')}` : null)) : null;
            const name = meta.approvedBy || 'Hassani Ali';
            return uri ? <SignatureThumb uri={uri} width={200} height={60} layers={6} spread={1.0} /> : <Text style={styles.subDetailValue}>{name}</Text>;
          })()}
        </View>
      </View>
      <View style={styles.specificationSection}>
        <Text style={styles.specLabel}>Specification:</Text>
        <Text style={styles.specText}>Beverages and water shall be at Room temperature (20-25°C); packaging shall be intact; no signs of pests, cars shall be intact, seals shall not be broken and label shall be legible and correct.</Text>
      </View>
      {/* Delivery Details */}
      <View style={styles.deliveryDetails}>
        <View style={styles.deliveryRow}>
          <Text style={styles.deliveryLabel}>Date of Delivery:</Text><Text style={styles.deliveryValue}>{meta.dateOfDelivery || ''}</Text>
          <Text style={styles.deliveryLabel}>Received By:</Text><Text style={styles.deliveryValue}>{meta.receivedBy || ''}</Text>
          <Text style={styles.deliveryLabel}>Complex Manager:</Text><Text style={styles.deliveryValue}>{meta.complexManager || ''}</Text>
        </View>
        <View style={styles.deliveryRow}>
          <Text style={styles.deliveryLabel}>Time of Delivery:</Text><Text style={styles.deliveryValue}>{meta.timeOfDelivery || ''}</Text>
          <Text style={styles.deliveryLabel}>Invoice No:</Text><Text style={styles.deliveryValue}>{meta.invoiceNo || ''}</Text>
          <Text style={styles.deliveryLabel}>Drivers Name:</Text><Text style={styles.deliveryValue}>{meta.driversName || ''}</Text>
        </View>
        <View style={styles.deliveryRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.deliveryLabel}>Vehicle Reg No:</Text>
            <Text style={styles.deliveryValue}>{meta.vehicleRegNo || ''}</Text>
          </View>

          <View style={{ width: 260, alignItems: 'flex-start' }}>
            <Text style={styles.deliveryLabel}>Signature:</Text>
            {(() => {
              const v = meta.signature;
              const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
              return uri ? <SignatureThumb uri={uri} width={240} height={80} layers={6} spread={1.0} /> : <Text style={styles.deliveryValue}>{v || ''}</Text>;
            })()}
          </View>
        </View>
      </View>
      {/* Table: shrink to A4 width and disable horizontal scroll during export */}
      {exportingWide ? (
        <View style={[tableStyles.tableContainer, exportA4Style, { width: adjustedTableWidth }]}> 
          <View style={tableStyles.tableHeader}>
            <Text style={[tableStyles.headerCell, { width: adjustedWidths.name }]}>Name of Product</Text>
            <Text style={[tableStyles.headerCell, { width: adjustedWidths.supplier }]}>Supplier</Text>
            <Text style={[tableStyles.headerCell, { width: adjustedWidths.clean }]}>Clean</Text>
            <Text style={[tableStyles.headerCell, { width: adjustedWidths.temp }]}>Temp</Text>
            <Text style={[tableStyles.headerCell, { width: adjustedWidths.tempOfBeverage }]}>Temp of Beverage</Text>
            <Text style={[tableStyles.headerCell, { width: adjustedWidths.stateOfProduct }]}>State of Product</Text>
            <Text style={[tableStyles.headerCell, { width: adjustedWidths.expiryDate }]}>Expiry Date</Text>
            <Text style={[tableStyles.headerCell, { width: adjustedWidths.remarks }]}>Remarks</Text>
          </View>
          {rows.map((row, i) => (
            <View key={i} style={tableStyles.tableRow}>
              <Text style={[tableStyles.dataCell, { width: adjustedWidths.name }]}>{row.nameOfProduct || ''}</Text>
              <Text style={[tableStyles.dataCell, { width: adjustedWidths.supplier }]}>{row.supplier || ''}</Text>
              <Text style={[tableStyles.dataCell, { width: adjustedWidths.clean }]}>{row.clean ? '✓' : ''}</Text>
              <Text style={[tableStyles.dataCell, { width: adjustedWidths.temp }]}>{row.temp || ''}</Text>
              <Text style={[tableStyles.dataCell, { width: adjustedWidths.tempOfBeverage }]}>{row.tempOfBeverage || ''}</Text>
              <Text style={[tableStyles.dataCell, { width: adjustedWidths.stateOfProduct }]}>{row.stateOfProduct || ''}</Text>
              <Text style={[tableStyles.dataCell, { width: adjustedWidths.expiryDate }]}>{row.expiryDate || ''}</Text>
              <Text style={[tableStyles.dataCell, { width: adjustedWidths.remarks }]}>{row.remarks || ''}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={[tableStyles.tableContainer, { width: '100%' }]}> 
            <View style={[tableStyles.tableHeader, { flexWrap: 'nowrap' }]}>
              <Text style={[tableStyles.headerCell, colStyle(colWidths.name)]} numberOfLines={1} ellipsizeMode="tail">Name of Product</Text>
              <Text style={[tableStyles.headerCell, colStyle(colWidths.supplier)]} numberOfLines={1} ellipsizeMode="tail">Supplier</Text>
              <Text style={[tableStyles.headerCell, colStyle(colWidths.clean)]} numberOfLines={1} ellipsizeMode="tail">Clean</Text>
              <Text style={[tableStyles.headerCell, colStyle(colWidths.temp)]} numberOfLines={1} ellipsizeMode="tail">Temp</Text>
              <Text style={[tableStyles.headerCell, colStyle(colWidths.tempOfBeverage)]} numberOfLines={1} ellipsizeMode="tail">Temp of Beverage</Text>
              <Text style={[tableStyles.headerCell, colStyle(colWidths.stateOfProduct)]} numberOfLines={1} ellipsizeMode="tail">State of Product</Text>
              <Text style={[tableStyles.headerCell, colStyle(colWidths.expiryDate)]} numberOfLines={1} ellipsizeMode="tail">Expiry Date</Text>
              <Text style={[tableStyles.headerCell, colStyle(colWidths.remarks)]} numberOfLines={1} ellipsizeMode="tail">Remarks</Text>
            </View>
            {rows.map((row, i) => (
              <View key={i} style={[tableStyles.tableRow, { flexWrap: 'nowrap' }]}>
                <Text style={[tableStyles.dataCell, colStyle(colWidths.name)]} numberOfLines={1} ellipsizeMode="tail">{row.nameOfProduct || ''}</Text>
                <Text style={[tableStyles.dataCell, colStyle(colWidths.supplier)]} numberOfLines={1} ellipsizeMode="tail">{row.supplier || ''}</Text>
                <Text style={[tableStyles.dataCell, colStyle(colWidths.clean)]} numberOfLines={1} ellipsizeMode="tail">{row.clean ? '✓' : ''}</Text>
                <Text style={[tableStyles.dataCell, colStyle(colWidths.temp)]} numberOfLines={1} ellipsizeMode="tail">{row.temp || ''}</Text>
                <Text style={[tableStyles.dataCell, colStyle(colWidths.tempOfBeverage)]} numberOfLines={1} ellipsizeMode="tail">{row.tempOfBeverage || ''}</Text>
                <Text style={[tableStyles.dataCell, colStyle(colWidths.stateOfProduct)]} numberOfLines={1} ellipsizeMode="tail">{row.stateOfProduct || ''}</Text>
                <Text style={[tableStyles.dataCell, colStyle(colWidths.expiryDate)]} numberOfLines={1} ellipsizeMode="tail">{row.expiryDate || ''}</Text>
                <Text style={[tableStyles.dataCell, colStyle(colWidths.remarks)]} numberOfLines={1} ellipsizeMode="tail">{row.remarks || ''}</Text>
              </View>
            ))}
          </View>
      )}
      {/* Verification Footer */}
      <View style={styles.verificationFooter}>
        <View style={{ marginTop: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.deliveryLabel}>Verified By</Text>
              {meta.verifiedBySign ? (
                (() => {
                  const v = meta.verifiedBySign;
                  const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
                  return uri ? <SignatureThumb uri={uri} width={220} height={80} layers={6} spread={1.0} /> : <Text style={styles.deliveryValue}>{v || ''}</Text>;
                })()
              ) : (
                <Text style={styles.deliveryValue}>{meta.verifiedBy || ''}</Text>
              )}
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.deliveryLabel}>HSEQ Manager</Text>
              {meta.hseqManagerSign ? (
                (() => {
                  const v = meta.hseqManagerSign;
                  const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
                  return uri ? <SignatureThumb uri={uri} width={220} height={80} layers={6} spread={1.0} /> : <Text style={styles.deliveryValue}>{v || ''}</Text>;
                })()
              ) : (
                <Text style={styles.deliveryValue}>{meta.hseqManager || ''}</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 10, paddingBottom: 120 },
  docHeader: { flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#000', marginBottom: 5, padding: 2 },
  logoAndSystem: { flexDirection: 'row', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#000', paddingRight: 5, flex: 1.5 },
  logoImage: { width: 48, height: 48, marginRight: 10 },
  logoText: { fontWeight: 'bold', fontSize: 28, color: '#007A33', marginRight: 10 },
  systemDetails: { justifyContent: 'center' },
  systemText: { fontSize: 12, fontWeight: 'bold', lineHeight: 14 },
  docDetailsRight: { flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' },
  detailLabel: { fontWeight: 'bold', fontSize: 12 },
  detailValue: { fontSize: 12 },
  subjectRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#000', borderBottomWidth: 0 },
  subjectItem: { flex: 4, padding: 5, backgroundColor: '#eee', borderRightWidth: 1, borderRightColor: '#000', flexDirection: 'row' },
  subjectLabel: { fontWeight: 'bold', fontSize: 14 },
  subjectValue: { fontSize: 16, marginLeft: 8 },
  versionDetails: { flex: 1, padding: 5, justifyContent: 'center', alignItems: 'flex-start' },
  versionText: { fontSize: 8 },
  subDetailRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#000', marginBottom: 10 },
  subDetailItem: { flex: 1, padding: 5, borderRightWidth: 1, borderRightColor: '#000', flexDirection: 'row' },
  subDetailLabel: { fontWeight: 'bold', fontSize: 9 },
  subDetailValue: { fontSize: 9, marginLeft: 5, borderBottomWidth: 1, borderBottomColor: '#000', flex: 1 },
  specificationSection: { marginBottom: 10, padding: 5, borderWidth: 1, borderColor: '#000' },
  specLabel: { fontWeight: 'bold', fontSize: 14, marginBottom: 6 },
  specText: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  deliveryDetails: { marginBottom: 10, padding: 5, borderWidth: 1, borderColor: '#000' },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, justifyContent: 'space-between' },
  deliveryLabel: { fontWeight: 'bold', fontSize: 12, marginRight: 8, flexShrink: 0 },
  deliveryValue: { fontSize: 12, minWidth: 60, borderBottomWidth: 1, borderBottomColor: '#000', paddingVertical: 4, marginRight: 15 },
  verificationFooter: { marginTop: 10 },
  verificationText: { fontWeight: 'bold', fontSize: 12, marginBottom: 8 },
  verificationSignature: { fontSize: 12, fontWeight: 'bold' },
});

const tableStyles = StyleSheet.create({
  tableContainer: { borderWidth: 1, borderColor: '#000' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#eee', alignItems: 'stretch' },
  headerCell: { fontWeight: 'bold', fontSize: 12, padding: 8, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', minHeight: 60, textAlignVertical: 'center' },
  nameCol: { width: 260 }, supplierCol: { width: 180 }, cleanCol: { width: 90 }, tempCol: { width: 90 }, tempOfBeverageCol: { width: 120 }, stateOfProductCol: { width: 140 }, expiryDateCol: { width: 120 }, remarksCol: { width: 300 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 48, alignItems: 'stretch' },
  dataCell: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 6, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center', textAlignVertical: 'center' },
});

import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

const A4_WIDTH = 794;
export default function VegetablesFruitsReceivingPresentational({ payload, exportingWide = false }) {
  if (!payload) return null;
  // normalize wrapper payloads saved by formStorage
  const p = payload.payload || payload;
  const meta = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : [];

  const resolveSignatureUri = (val) => {
    if (!val) return null;
    const s = String(val);
    if (s.startsWith('data:')) return s;
    // Heuristic: older saves may store raw base64 strings (very long, no spaces)
    if (s.length > 100 && !s.includes(' ')) return `data:image/png;base64,${s}`;
    return null;
  };

  const deliverySigUri = resolveSignatureUri(meta.signature);
  const verifiedUri = resolveSignatureUri(meta.verifiedBySign) || resolveSignatureUri(meta.verifiedBy);
  const hseqUri = resolveSignatureUri(meta.hseqManagerSign) || resolveSignatureUri(meta.hseqManager);

  const exportA4Style = exportingWide ? { width: A4_WIDTH, maxWidth: A4_WIDTH, alignSelf: 'center' } : {};

  return (
    <ScrollView contentContainerStyle={exportingWide ? { padding: 0, margin: 0, backgroundColor: '#fff' } : styles.outerContainer}>
      <View style={[styles.docHeader, exportA4Style]}>
        <View style={styles.logoAndSystem}>
          <Image source={require('../../assets/logo.jpeg')} style={styles.logoImage} resizeMode="contain" />
          <View style={styles.systemDetailsWrap}>
            <Text style={styles.logoText}>Bravo</Text>
            <View style={styles.systemDetails}>
              <Text style={styles.systemText}>BRAVO BRANDS LIMITED</Text>
              <Text style={styles.systemText}>Food Safety Management System</Text>
            </View>
          </View>
        </View>

        <View style={styles.docDetailsRight}>
          <View style={styles.detailRowItem}>
            <Text style={styles.detailLabel}>Issue Date:</Text>
            <Text style={styles.detailValue}>{meta.issueDate || ''}</Text>
          </View>
          <View style={styles.detailRowItem}>
            <Text style={styles.detailLabel}>Page:</Text>
            <Text style={styles.detailValue}>1 of 1</Text>
          </View>
        </View>
      </View>

      <View style={styles.subjectRow}>
        <View style={styles.subjectItem}>
          <Text style={styles.subjectLabel}>Subject:</Text>
          <Text style={styles.subjectValue}>Vegetables and Fruits Receiving Checklist</Text>
        </View>
      </View>

      <View style={styles.subDetailRow}>
        <View style={styles.subDetailItem}>
          <Text style={styles.subDetailLabel}>Compiled By:</Text>
          {(() => {
            const v = resolveSignatureUri(meta.compiledBySign) || resolveSignatureUri(meta.compiledBy);
            const name = meta.compiledBy || meta.compiled_by || 'Michael Zulu C.';
            return v ? <SignatureThumb uri={v} width={180} height={60} layers={6} spread={0.9} /> : <Text style={styles.subDetailValue}>{name}</Text>;
          })()}
        </View>
        <View style={styles.subDetailItem}>
          <Text style={styles.subDetailLabel}>Approved By:</Text>
          {(() => {
            const v = resolveSignatureUri(meta.approvedBySign) || resolveSignatureUri(meta.approvedBy);
            const name = meta.approvedBy || meta.approved_by || 'Hassani Ali';
            return v ? <SignatureThumb uri={v} width={180} height={60} layers={6} spread={0.9} /> : <Text style={styles.subDetailValue}>{name}</Text>;
          })()}
        </View>
      </View>

      <View style={styles.specificationSection}>
        <Text style={styles.specLabel}>Specification:</Text>
        <Text style={styles.specText}>{meta.specification || 'Vegetables and fruits must be delivered clean, practically free of any visible foreign matter such as soils; practically free from pests; practically free from damage caused by pests.'}</Text>
      </View>

      <View style={styles.deliveryDetails}>
        <View style={styles.deliveryRow}>
          <Text style={styles.deliveryLabel}>Date of Delivery:</Text>
          <Text style={styles.deliveryValue}>{meta.dateOfDelivery || ''}</Text>
          <Text style={styles.deliveryLabel}>Received By:</Text>
          <Text style={styles.deliveryValue}>{meta.receivedBy || ''}</Text>
          <Text style={styles.deliveryLabel}>Complex Manager:</Text>
          <Text style={styles.deliveryValue}>{meta.complexManager || ''}</Text>
        </View>
        <View style={styles.deliveryRow}>
          <Text style={styles.deliveryLabel}>Time of Delivery:</Text>
          <Text style={styles.deliveryValue}>{meta.timeOfDelivery || ''}</Text>
          <Text style={styles.deliveryLabel}>Invoice No:</Text>
          <Text style={styles.deliveryValue}>{meta.invoiceNo || ''}</Text>
          <Text style={styles.deliveryLabel}>Drivers Name:</Text>
          <Text style={styles.deliveryValue}>{meta.driversName || ''}</Text>
        </View>
        <View style={styles.deliveryRow}>
          <Text style={styles.deliveryLabel}>Vehicle Reg No:</Text>
          <Text style={styles.deliveryValue}>{meta.vehicleRegNo || ''}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.deliveryLabel, { marginLeft: 10 }]}>Signature:</Text>
            {deliverySigUri ? (
              <SignatureThumb uri={deliverySigUri} width={160} height={60} layers={6} spread={0.9} />
            ) : (
              <Text style={[styles.deliveryValue, { marginLeft: 8 }]}>{meta.signature || ''}</Text>
            )}
          </View>
        </View>
      </View>

      {exportingWide ? (
        <View style={{ width: A4_WIDTH }}>
          <View style={dailyStyles.tableContainer}>
            <View style={dailyStyles.tableHeader}>
              <Text style={[dailyStyles.headerCell, dailyStyles.nameCol, dailyStyles.spanTwoRows]}>Type of Veg / Fruit</Text>
              <Text style={[dailyStyles.headerCell, dailyStyles.supplierCol, dailyStyles.spanTwoRows]}>Supplier</Text>

              <View style={dailyStyles.groupHeaderCol}>
                <Text style={dailyStyles.groupHeaderTitle}>Delivery Vehicle</Text>
                <View style={dailyStyles.subHeaderRow}>
                  <Text style={[dailyStyles.subHeaderCell, dailyStyles.cleanCol]}>Clean</Text>
                  <Text style={[dailyStyles.subHeaderCell, dailyStyles.tempCol, dailyStyles.lastSubHeaderCell]}>Temp</Text>
                </View>
              </View>

              <View style={[dailyStyles.groupHeaderCol, dailyStyles.lastGroupHeaderCol]}>
                <Text style={dailyStyles.groupHeaderTitle}>Product</Text>
                <View style={dailyStyles.subHeaderRow}>
                  <Text style={[dailyStyles.subHeaderCell, dailyStyles.stateOfProductCol]}>State of{"\n"}Product</Text>
                  <Text style={[dailyStyles.subHeaderCell, dailyStyles.expiryDateCol]}>Expiry Date</Text>
                  <Text style={[dailyStyles.subHeaderCell, dailyStyles.remarksCol, dailyStyles.lastSubHeaderCell]}>Remarks</Text>
                </View>
              </View>
            </View>

            {rows.map((r, idx) => (
              <View style={dailyStyles.tableRow} key={r.id || r._id || `row-${idx}`}>
                <Text style={[dailyStyles.dataCell, dailyStyles.nameCol]}>{r.typeOfVegFruit}</Text>
                <Text style={[dailyStyles.dataCell, dailyStyles.supplierCol]}>{r.supplier}</Text>
                <Text style={[dailyStyles.dataCell, dailyStyles.cleanCol, dailyStyles.checkboxCell]}>{r.clean ? '✓' : ''}</Text>
                <Text style={[dailyStyles.dataCell, dailyStyles.tempCol]}>{r.temp}</Text>
                <Text style={[dailyStyles.dataCell, dailyStyles.stateOfProductCol]}>{r.stateOfProduct}</Text>
                <Text style={[dailyStyles.dataCell, dailyStyles.expiryDateCol]}>{r.expiryDate}</Text>
                <Text style={[dailyStyles.dataCell, dailyStyles.remarksCol]}>{r.remarks}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <ScrollView horizontal contentContainerStyle={{ minWidth: 1123 }}>
          <View style={dailyStyles.tableContainer}>
            <View style={dailyStyles.tableHeader}>
              <Text style={[dailyStyles.headerCell, dailyStyles.nameCol, dailyStyles.spanTwoRows]}>Type of Veg / Fruit</Text>
              <Text style={[dailyStyles.headerCell, dailyStyles.supplierCol, dailyStyles.spanTwoRows]}>Supplier</Text>

              <View style={dailyStyles.groupHeaderCol}>
                <Text style={dailyStyles.groupHeaderTitle}>Delivery Vehicle</Text>
                <View style={dailyStyles.subHeaderRow}>
                  <Text style={[dailyStyles.subHeaderCell, dailyStyles.cleanCol]}>Clean</Text>
                  <Text style={[dailyStyles.subHeaderCell, dailyStyles.tempCol, dailyStyles.lastSubHeaderCell]}>Temp</Text>
                </View>
              </View>

              <View style={[dailyStyles.groupHeaderCol, dailyStyles.lastGroupHeaderCol]}>
                <Text style={dailyStyles.groupHeaderTitle}>Product</Text>
                <View style={dailyStyles.subHeaderRow}>
                  <Text style={[dailyStyles.subHeaderCell, dailyStyles.stateOfProductCol]}>State of{"\n"}Product</Text>
                  <Text style={[dailyStyles.subHeaderCell, dailyStyles.expiryDateCol]}>Expiry Date</Text>
                  <Text style={[dailyStyles.subHeaderCell, dailyStyles.remarksCol, dailyStyles.lastSubHeaderCell]}>Remarks</Text>
                </View>
              </View>
            </View>

            {rows.map((r, idx) => (
              <View style={dailyStyles.tableRow} key={r.id || r._id || `row-${idx}`}>
                <Text style={[dailyStyles.dataCell, dailyStyles.nameCol]}>{r.typeOfVegFruit}</Text>
                <Text style={[dailyStyles.dataCell, dailyStyles.supplierCol]}>{r.supplier}</Text>
                <Text style={[dailyStyles.dataCell, dailyStyles.cleanCol, dailyStyles.checkboxCell]}>{r.clean ? '✓' : ''}</Text>
                <Text style={[dailyStyles.dataCell, dailyStyles.tempCol]}>{r.temp}</Text>
                <Text style={[dailyStyles.dataCell, dailyStyles.stateOfProductCol]}>{r.stateOfProduct}</Text>
                <Text style={[dailyStyles.dataCell, dailyStyles.expiryDateCol]}>{r.expiryDate}</Text>
                <Text style={[dailyStyles.dataCell, dailyStyles.remarksCol]}>{r.remarks}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <View style={styles.verificationFooter}>
        <Text style={styles.verificationText}>VERIFIED BY</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontWeight: '700', marginRight: 8 }}>Verified By</Text>
              {verifiedUri ? (
                <SignatureThumb uri={verifiedUri} width={160} height={60} layers={6} spread={0.9} />
              ) : (
                <Text>{meta.verifiedBy || ''}</Text>
              )}
            </View>
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontWeight: '700', marginRight: 8 }}>HSEQ Manager</Text>
              {hseqUri ? (
                <SignatureThumb uri={hseqUri} width={160} height={60} layers={6} spread={0.9} />
              ) : (
                <Text>{meta.hseqManager || ''}</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  outerContainer: { padding: 10, backgroundColor: '#fff' },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 5,
    padding: 4,
  },
  logoAndSystem: { flexDirection: 'row', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#000', paddingRight: 6, flex: 1.5 },
  logoImage: { width: 48, height: 48, marginRight: 10 },
  logoText: { fontWeight: 'bold', fontSize: 28, color: '#007A33', marginRight: 10 },
  systemDetails: { justifyContent: 'center' },
  systemText: { fontSize: 12, fontWeight: 'bold', lineHeight: 14 },
  systemDetailsWrap: { justifyContent: 'center' },
  docDetailsRight: { flex: 1, paddingLeft: 6, justifyContent: 'space-between', alignItems: 'flex-end' },
  detailRowItem: { flexDirection: 'row', fontSize: 8, paddingVertical: 1 },
  detailLabel: { fontWeight: 'bold', fontSize: 12, marginRight: 6 },
  detailValue: { fontSize: 12 },
  subjectRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#000', borderBottomWidth: 0 },
  subjectItem: { flex: 4, padding: 6, backgroundColor: '#eee', borderRightWidth: 1, borderRightColor: '#000', flexDirection: 'row' },
  subjectLabel: { fontWeight: 'bold', fontSize: 14 },
  subjectValue: { fontSize: 16, marginLeft: 8 },
  subDetailRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#000', marginBottom: 10 },
  subDetailItem: { flex: 1, padding: 6, borderRightWidth: 1, borderRightColor: '#000', flexDirection: 'row' },
  subDetailLabel: { fontWeight: 'bold', fontSize: 9 },
  subDetailValue: { fontSize: 9, marginLeft: 5, borderBottomWidth: 1, borderBottomColor: '#000', flex: 1 },
  specificationSection: { marginBottom: 10, padding: 6, borderWidth: 1, borderColor: '#000' },
  specLabel: { fontWeight: 'bold', fontSize: 14, marginBottom: 6 },
  specText: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  deliveryDetails: { marginBottom: 10, padding: 6, borderWidth: 1, borderColor: '#000' },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, justifyContent: 'space-between' },
  deliveryLabel: { fontWeight: 'bold', fontSize: 12, marginRight: 8, flexShrink: 0 },
  deliveryValue: { fontSize: 12 },
  verificationFooter: { marginTop: 10 },
  verificationText: { fontWeight: 'bold', fontSize: 12, marginBottom: 8 },
  verificationSignature: { fontSize: 12, fontWeight: 'bold' },
});

const dailyStyles = StyleSheet.create({
  tableContainer: { borderWidth: 1, borderColor: '#000' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#eee', alignItems: 'stretch' },
  headerCell: { fontWeight: 'bold', fontSize: 12, padding: 8, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', minHeight: 60, textAlignVertical: 'center' },
  spanTwoRows: { minHeight: 90 },
  groupHeaderCol: { borderRightWidth: 1, borderRightColor: '#000', width: 180 },
  lastGroupHeaderCol: { borderRightWidth: 0, width: 560 },
  groupHeaderTitle: { fontWeight: 'bold', fontSize: 14, paddingHorizontal: 6, paddingVertical: 6, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 45, flexWrap: 'wrap' },
  subHeaderRow: { flexDirection: 'row', height: 45 },
  subHeaderCell: { fontWeight: 'bold', fontSize: 12, padding: 4, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', textAlignVertical: 'center' },
  lastSubHeaderCell: { borderRightWidth: 0 },
  // column widths copied from editable form
  nameCol: { width: 260 },
  supplierCol: { width: 180 },
  cleanCol: { width: 90, borderRightWidth: 1, borderRightColor: '#000' },
  tempCol: { width: 90, borderRightWidth: 1, borderRightColor: '#000' },
  tempOfBeverageCol: { width: 120 },
  stateOfProductCol: { width: 140 },
  expiryDateCol: { width: 120 },
  remarksCol: { width: 300, borderRightWidth: 0 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 48, alignItems: 'stretch' },
  dataCell: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 6, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center', textAlignVertical: 'center' },
  checkboxCell: { justifyContent: 'center', alignItems: 'center' },
  checkboxText: { fontSize: 18, fontWeight: 'bold' },
});

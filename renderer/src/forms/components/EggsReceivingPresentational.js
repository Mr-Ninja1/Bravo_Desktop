import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

export default function EggsReceivingPresentational({ payload }) {
  if (!payload) return null;
  const p = payload.payload || payload;
  const meta = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : [];
  const logoSource = (p.assets && p.assets.logoDataUri) ? { uri: p.assets.logoDataUri } : require('../../assets/logo.jpeg');
  const hints = p.layoutHints || {};

  return (
    // Outer vertical scroll for modal; inner horizontal scroll replaced by responsive layout
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View style={[styles.container, { minWidth: undefined }]}>
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
            <Text style={styles.subjectValue}>{p.title || 'Eggs Receiving Checklist'}</Text>
          </View>
          <View style={styles.versionDetails}>
            <Text style={styles.versionText}>Version No: {p.templateVersion || '01'}</Text>
          </View>
        </View>

        <View style={styles.subDetailRow}>
          <View style={styles.subDetailItem}>
            <Text style={styles.subDetailLabel}>Compiled By:</Text>
            <Text style={styles.subDetailValue}>Michael</Text>
          </View>
          <View style={styles.subDetailItem}>
            <Text style={styles.subDetailLabel}>Approved By:</Text>
            <Text style={styles.subDetailValue}>Hassani Ali</Text>
          </View>
        </View>

        <View style={styles.specificationSection}>
          <Text style={styles.specLabel}>Specification:</Text>
          <Text style={styles.specText}>
            Eggs must be fresh, clean, without bad smell, not broken and no signs of pests; the tray must be of plastic; 10 randomly selected eggs shall be able to sink when placed in fresh water and label shall be legible and correct.
          </Text>
        </View>

        <View style={styles.deliveryDetails}>
          {/* Wrap label/value pairs so they don't overflow on narrow screens */}
          <View style={styles.deliveryRow}>
            <View style={styles.deliveryPair}>
              <Text style={styles.deliveryLabel}>Date of Delivery:</Text>
              <Text style={styles.deliveryValue}>{meta.dateOfDelivery || meta.date || ''}</Text>
            </View>
            <View style={styles.deliveryPair}>
              <Text style={styles.deliveryLabel}>Received By:</Text>
              <Text style={styles.deliveryValue}>{meta.receivedBy || ''}</Text>
            </View>
            <View style={styles.deliveryPair}>
              <Text style={styles.deliveryLabel}>Complex Manager:</Text>
              <Text style={styles.deliveryValue}>{meta.complexManager || ''}</Text>
            </View>
          </View>

          <View style={styles.deliveryRow}>
            <View style={styles.deliveryPair}>
              <Text style={styles.deliveryLabel}>Time of Delivery:</Text>
              <Text style={styles.deliveryValue}>{meta.timeOfDelivery || ''}</Text>
            </View>
            <View style={styles.deliveryPair}>
              <Text style={styles.deliveryLabel}>Invoice No.:</Text>
              <Text style={styles.deliveryValue}>{meta.invoiceNo || ''}</Text>
            </View>
            <View style={styles.deliveryPair}>
              <Text style={styles.deliveryLabel}>Drivers Name:</Text>
              <Text style={styles.deliveryValue}>{meta.driversName || ''}</Text>
            </View>
          </View>

          <View style={styles.deliveryRow}>
            <View style={styles.deliveryPair}>
              <Text style={styles.deliveryLabel}>Vehicle Reg No.:</Text>
              <Text style={styles.deliveryValue}>{meta.vehicleRegNo || ''}</Text>
            </View>
            <View style={styles.deliveryPair}>
              <Text style={styles.deliveryLabel}>Signature:</Text>
              {meta.signature ? (
                (() => {
                  const v = meta.signature;
                  const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
                  return uri ? <SignatureThumb uri={uri} width={240} height={80} layers={6} spread={1.0} /> : <Text style={[styles.deliveryValue, { flex: 1 }]}>{v || ''}</Text>;
                })()
              ) : (
                <Text style={[styles.deliveryValue, { flex: 1 }]}>{meta.signature || ''}</Text>
              )}
            </View>
          </View>
        </View>

  <View style={{ height: 12 }} />

          <View style={dailyStyles.tableContainer}>
          <View style={dailyStyles.tableHeader}>
            <Text style={[dailyStyles.headerCell, { flex: 0.28, minWidth: hints.CATEGORY || dailyStyles.categoryCol.width, minHeight: 60 }, dailyStyles.spanTwoRows]}>Category of Eggs (Large, Medium, Small or mixed sizes)</Text>
            <Text style={[dailyStyles.headerCell, { flex: 0.16, minWidth: hints.SUPPLIER || dailyStyles.supplierCol.width, minHeight: 60 }, dailyStyles.spanTwoRows]}>Supplier</Text>

            <View style={dailyStyles.deliveryGroupHeaderCol}>
              <Text style={dailyStyles.groupHeaderTitle}>Delivery Vehicle</Text>
              <View style={dailyStyles.subHeaderRow}>
                <Text style={[dailyStyles.subHeaderCell, dailyStyles.cleanCol, dailyStyles.lastSubHeaderCell]}>Clean</Text>
              </View>
            </View>

            <View style={dailyStyles.productGroupHeaderCol}>
              <Text style={dailyStyles.groupHeaderTitle}>Product</Text>
              <View style={dailyStyles.subHeaderRow}>
                <Text style={[dailyStyles.subHeaderCell, dailyStyles.stateOfProductCol]}>State of Product</Text>
                <Text style={[dailyStyles.subHeaderCell, dailyStyles.expiryDateCol]}>Expiry Date</Text>
                <Text style={[dailyStyles.subHeaderCell, dailyStyles.remarksCol, dailyStyles.lastSubHeaderCell]}>Remarks</Text>
              </View>
            </View>
          </View>

          {rows.map((item) => (
            <View style={dailyStyles.tableRow} key={item.id || item._id || JSON.stringify(item).slice(0,20)}>
              <Text style={[dailyStyles.dataCell, { flex: 0.28, minWidth: hints.CATEGORY || dailyStyles.categoryCol.width }]} numberOfLines={1} ellipsizeMode="tail">{item.categoryOfEggs}</Text>
              <Text style={[dailyStyles.dataCell, { flex: 0.16, minWidth: hints.SUPPLIER || dailyStyles.supplierCol.width }]} numberOfLines={1} ellipsizeMode="tail">{item.supplier}</Text>
              <Text style={[dailyStyles.dataCell, { flex: 0.06, minWidth: hints.CLEAN || dailyStyles.cleanCol.width }, dailyStyles.checkboxCell]} numberOfLines={1} ellipsizeMode="tail">{item.clean ? '✓' : ''}</Text>
              <Text style={[dailyStyles.dataCell, { flex: 0.12, minWidth: hints.STATE || dailyStyles.stateOfProductCol.width }]} numberOfLines={1} ellipsizeMode="tail">{item.stateOfProduct}</Text>
              <Text style={[dailyStyles.dataCell, { flex: 0.10, minWidth: hints.EXPIRY || dailyStyles.expiryDateCol.width }]} numberOfLines={1} ellipsizeMode="tail">{item.expiryDate}</Text>
              <Text style={[dailyStyles.dataCell, { flex: 0.28, minWidth: hints.REMARKS || dailyStyles.remarksCol.width }]} numberOfLines={1} ellipsizeMode="tail">{item.remarks}</Text>
            </View>
          ))}
        </View>

        <View style={styles.verificationFooter}>
          <Text style={styles.verificationText}>VERIFIED BY</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
  safeArea: { flex: 1, backgroundColor: '#fff' },
  scrollViewContent: { padding: 10 },
  container: { backgroundColor: '#fff', minWidth: 1123, paddingHorizontal: 8 },
  docHeader: { flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#000', marginBottom: 5, padding: 2 },
  logoAndSystem: { flexDirection: 'row', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#000', paddingRight: 5, flex: 1.5 },
  logoImage: { width: 48, height: 48, marginRight: 10 },
  logoText: { fontWeight: 'bold', fontSize: 28, color: '#007A33', marginRight: 10 },
  systemDetails: { justifyContent: 'center' },
  systemText: { fontSize: 12, fontWeight: 'bold', lineHeight: 14 },
  docDetails: { flex: 1, paddingLeft: 5, justifyContent: 'space-between' },
  detailRowItem: { flexDirection: 'row', fontSize: 8, paddingVertical: 1 },
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
  deliveryRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, justifyContent: 'flex-start', flexWrap: 'wrap', gap: 8 },
  deliveryPair: { minWidth: 140, flexBasis: '30%', marginRight: 8 },
  deliveryLabel: { fontWeight: 'bold', fontSize: 12, marginRight: 6, flexShrink: 0 },
  deliveryValue: { borderBottomWidth: 0, fontSize: 12, paddingVertical: 2, marginTop: 2 },
  verificationFooter: { marginTop: 10 },
  verificationText: { fontWeight: 'bold', fontSize: 12, marginBottom: 8 },
  verificationSignature: { fontSize: 12, fontWeight: 'bold' },
});

// Horizontal scroll content style to match editable form
styles.horizontalScrollContent = { flexGrow: 1 };

const dailyStyles = StyleSheet.create({
  tableContainer: { borderWidth: 1, borderColor: '#000' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#eee', alignItems: 'stretch' },
  headerCell: { fontWeight: 'bold', fontSize: 12, padding: 8, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', minHeight: 60, textAlignVertical: 'center' },
  spanTwoRows: { minHeight: 90 },
  // Group header widths must equal the sum of their subcolumns to align headers
  deliveryGroupHeaderCol: { width: 90, borderRightWidth: 1, borderRightColor: '#000' },
  productGroupHeaderCol: { width: 560, borderRightWidth: 0 },
  groupHeaderTitle: { fontWeight: 'bold', fontSize: 14, paddingHorizontal: 6, paddingVertical: 6, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 45, flexWrap: 'wrap' },
  subHeaderRow: { flexDirection: 'row', height: 45 },
  subHeaderCell: { fontWeight: 'bold', fontSize: 12, padding: 4, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', textAlignVertical: 'center' },
  lastSubHeaderCell: { borderRightWidth: 0 },
  categoryCol: { width: 300 }, supplierCol: { width: 180 }, cleanCol: { width: 90, borderRightWidth: 1, borderRightColor: '#000' }, stateOfProductCol: { width: 140 }, expiryDateCol: { width: 120 }, remarksCol: { width: 300, borderRightWidth: 0 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 48, alignItems: 'stretch' },
  dataCell: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 6, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center', textAlignVertical: 'center' },
  checkboxCell: { justifyContent: 'center', alignItems: 'center' },
  checkboxText: { fontSize: 18, fontWeight: 'bold' },
});

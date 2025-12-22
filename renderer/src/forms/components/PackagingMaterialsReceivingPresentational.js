import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

const resolveSignatureUri = (v) => {
  if (!v) return null;
  const s = String(v).trim();
  if (s.startsWith('data:')) return s;
  if (s.length > 100 && !s.includes(' ')) return `data:image/png;base64,${s}`;
  return null;
};

// Presentational renderer that closely mirrors the editable PackagingMaterialsReceivingForm layout
// Uses payload.formData and payload.metadata to display read-only content with identical column widths
export default function PackagingMaterialsReceivingPresentational({ payload }) {
  const p = payload || {};
  const meta = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : [];

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={styles.container} horizontal={false} nestedScrollEnabled>
      <ScrollView horizontal contentContainerStyle={{ minWidth: 1123 }} showsHorizontalScrollIndicator={false}>
        <View style={styles.innerContainer}>
          <View style={styles.docHeader}>
            <View style={styles.logoAndSystem}>
              <Image source={require('../../assets/logo.jpeg')} style={styles.logoImage} resizeMode="contain" />
              <View>
                <Text style={styles.logoText}>Bravo</Text>
                <Text style={styles.systemText}>BRAVO BRANDS LIMITED</Text>
                <Text style={styles.systemText}>Food Safety Management System</Text>
              </View>
            </View>

            <View style={styles.docDetailsRight}>
              <View style={styles.detailRowItem}>
                <Text style={styles.detailLabel}>Issue Date:</Text>
                <Text style={styles.detailValue}>{meta.issueDate || meta.issueDate || p.issueDate || ''}</Text>
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
              <Text style={styles.subjectValue}>{p.title || 'Packaging Materials Receiving Checklist'}</Text>
            </View>
            <View style={styles.versionDetails}>
              <Text style={styles.versionText}>Version No: {meta.versionNo || p.versionNo || ''}</Text>
            </View>
          </View>

          <View style={styles.subDetailRow}>
            <View style={styles.subDetailItem}>
              <Text style={styles.subDetailLabel}>Compiled By:</Text>
              {(() => {
                const v = resolveSignatureUri(meta.compiledBySign) || resolveSignatureUri(meta.compiledBy);
                const name = meta.compiledBy || 'QA Team';
                return v ? <SignatureThumb uri={v} width={200} height={60} layers={6} spread={1.0} /> : <Text style={styles.subDetailValue}>{name}</Text>;
              })()}
            </View>
            <View style={styles.subDetailItem}>
              <Text style={styles.subDetailLabel}>Approved By:</Text>
              {(() => {
                const v = resolveSignatureUri(meta.approvedBySign) || resolveSignatureUri(meta.approvedBy);
                const name = meta.approvedBy || 'Hassani Ali';
                return v ? <SignatureThumb uri={v} width={200} height={60} layers={6} spread={1.0} /> : <Text style={styles.subDetailValue}>{name}</Text>;
              })()}
            </View>
          </View>

          <View style={styles.specificationSection}>
            <Text style={styles.specLabel}>Specification:</Text>
            <Text style={styles.specText}>{p.specification || 'Packaging materials shall be clean, dry, intact with no tears or damage; labels/printing shall be correct and match the order; seals shall be intact and no contamination observed.'}</Text>
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
              <Text style={styles.deliveryLabel}>Signature:</Text>
              {meta.signature ? (
                (() => {
                  const v = meta.signature;
                  const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
                  return uri ? <SignatureThumb uri={uri} width={240} height={80} layers={6} spread={1.0} /> : <Text style={[styles.deliveryValue, { flex: 2 }]}>{v || ''}</Text>;
                })()
              ) : (
                <Text style={[styles.deliveryValue, { flex: 2 }]}>{meta.signature || ''}</Text>
              )}
            </View>
          </View>

          <View style={dailyStyles.tableContainer}>
            <View style={dailyStyles.tableHeader}>
              <Text style={[dailyStyles.headerCell, dailyStyles.nameCol, dailyStyles.spanTwoRows]}>Name of Product</Text>
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

            {rows.map((item) => (
              <View key={item.id} style={dailyStyles.tableRow}>
                <Text style={[dailyStyles.dataCell, dailyStyles.nameCol]}>{item.nameOfProduct || ''}</Text>
                <Text style={[dailyStyles.dataCell, dailyStyles.supplierCol]}>{item.supplier || ''}</Text>
                <Text style={[dailyStyles.dataCell, dailyStyles.cleanCol]}>{item.clean ? '✓' : ''}</Text>
                <Text style={[dailyStyles.dataCell, dailyStyles.tempCol]}>{item.temp || ''}</Text>
                <Text style={[dailyStyles.dataCell, dailyStyles.stateOfProductCol]}>{item.stateOfProduct || ''}</Text>
                <Text style={[dailyStyles.dataCell, dailyStyles.expiryDateCol]}>{item.expiryDate || ''}</Text>
                <Text style={[dailyStyles.dataCell, dailyStyles.remarksCol]}>{item.remarks || ''}</Text>
              </View>
            ))}
          </View>

          <View style={styles.verificationFooter}>
            <Text style={styles.verificationText}>VERIFIED BY</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontWeight: '700' }}>Verified By</Text>
                {meta.verifiedBySign ? (
                  (() => {
                    const v = meta.verifiedBySign;
                    const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
                    return uri ? <SignatureThumb uri={uri} width={220} height={80} layers={6} spread={1.0} /> : <Text>{v || ''}</Text>;
                  })()
                ) : (
                  <Text>{meta.verifiedBy || ''}</Text>
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={{ fontWeight: '700' }}>HSEQ Manager</Text>
                {meta.hseqManagerSign ? (
                  (() => {
                    const v = meta.hseqManagerSign;
                    const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
                    return uri ? <SignatureThumb uri={uri} width={220} height={80} layers={6} spread={1.0} /> : <Text>{v || ''}</Text>;
                  })()
                ) : (
                  <Text>{meta.hseqManager || ''}</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 10 },
  innerContainer: { paddingHorizontal: 8, paddingVertical: 6 },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 5,
    padding: 6,
  },
  logoAndSystem: { flexDirection: 'row', alignItems: 'center', flex: 1.5 },
  logoImage: { width: 48, height: 48, marginRight: 10 },
  logoText: { fontWeight: 'bold', fontSize: 28, color: '#007A33', marginRight: 10 },
  systemText: { fontSize: 12, fontWeight: 'bold', lineHeight: 14 },
  docDetailsRight: { flex: 1, paddingLeft: 5, justifyContent: 'space-between' },
  detailRowItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 1 },
  detailLabel: { fontWeight: 'bold', fontSize: 12, marginRight: 6 },
  detailValue: { fontSize: 12 },
  subjectRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#000', borderBottomWidth: 0 },
  subjectItem: { flex: 4, padding: 5, backgroundColor: '#eee', borderRightWidth: 1, borderRightColor: '#000', flexDirection: 'row', alignItems: 'center' },
  subjectLabel: { fontWeight: 'bold', fontSize: 14 },
  subjectValue: { fontSize: 16, marginLeft: 8 },
  versionDetails: { flex: 1, padding: 5, justifyContent: 'center', alignItems: 'flex-start' },
  versionText: { fontSize: 8 },
  subDetailRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#000', marginBottom: 10 },
  subDetailItem: { flex: 1, padding: 5, borderRightWidth: 1, borderRightColor: '#000', flexDirection: 'row', alignItems: 'center' },
  subDetailLabel: { fontWeight: 'bold', fontSize: 9 },
  subDetailValue: { fontSize: 9, marginLeft: 5, borderBottomWidth: 1, borderBottomColor: '#000', flex: 1 },
  specificationSection: { marginBottom: 10, padding: 5, borderWidth: 1, borderColor: '#000' },
  specLabel: { fontWeight: 'bold', fontSize: 14, marginBottom: 6 },
  specText: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  deliveryDetails: { marginBottom: 10, padding: 5, borderWidth: 1, borderColor: '#000' },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, justifyContent: 'space-between' },
  deliveryLabel: { fontWeight: 'bold', fontSize: 12, marginRight: 8, flexShrink: 0 },
  deliveryValue: { fontSize: 12, paddingHorizontal: 8 },
  verificationFooter: { marginTop: 10 },
  verificationText: { fontWeight: 'bold', fontSize: 12, marginBottom: 8 },
  verificationSignature: { fontSize: 12, fontWeight: 'bold' },
});


const dailyStyles = StyleSheet.create({
  tableContainer: { borderWidth: 1, borderColor: '#000' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#eee', alignItems: 'stretch' },
  headerCell: { fontWeight: 'bold', fontSize: 12, padding: 8, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', minHeight: 60, textAlignVertical: 'center' },
  spanTwoRows: { minHeight: 90 },
  groupHeaderCol: { borderRightWidth: 1, borderRightColor: '#000' },
  lastGroupHeaderCol: { borderRightWidth: 0 },
  groupHeaderTitle: { fontWeight: 'bold', fontSize: 14, padding: 6, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#000', height: 36, textAlignVertical: 'center' },
  subHeaderRow: { flexDirection: 'row', height: 45 },
  subHeaderCell: { fontWeight: 'bold', fontSize: 12, padding: 4, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', textAlignVertical: 'center' },
  lastSubHeaderCell: { borderRightWidth: 0 },
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
});

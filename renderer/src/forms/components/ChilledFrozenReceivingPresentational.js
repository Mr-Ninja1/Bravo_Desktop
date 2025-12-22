import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

export default function ChilledFrozenReceivingPresentational({ payload }) {
  const meta = payload?.metadata || {};
  const data = payload?.formData || [];
  const logoUri = payload?.assets?.logoDataUri;

  return (
    <ScrollView horizontal style={{ flex: 1 }} contentContainerStyle={{ minWidth: 1123 }}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.logoImage} />
          ) : (
            <Image source={require('../../assets/logo.jpeg')} style={styles.logoImage} />
          )}
          <View style={styles.headerTextWrap}>
            <Text style={styles.logoText}>Bravo</Text>
            <Text style={styles.systemText}>BRAVO BRANDS LIMITED</Text>
            <Text style={styles.systemText}>Food Safety Management System</Text>
          </View>
          <View style={styles.docDetails}>
            <Text style={styles.detailLabel}>Issue Date: <Text style={styles.detailValue}>{meta.issueDate}</Text></Text>
            <Text style={styles.detailLabel}>Page: <Text style={styles.detailValue}>1 of 1</Text></Text>
          </View>
        </View>
        <View style={styles.subjectRow}>
          <Text style={styles.subjectLabel}>Subject:</Text>
          <Text style={styles.subjectValue}>Chilled & Frozen Receiving Checklist</Text>
          <Text style={styles.versionText}>Version No: {meta.versionNo}</Text>
        </View>
        <View style={styles.subDetailRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.subDetailLabel}>Compiled By:</Text>
            {(() => {
              const v = meta.compiledBySign || meta.compiledBy || '';
              const uri = v ? (String(v).startsWith('data:') ? v : (String(v).length > 100 ? `data:image/png;base64,${String(v).replace(/\s+/g, '')}` : null)) : null;
              const name = meta.compiledBy || 'Michael Zulu C.';
              return uri ? <SignatureThumb uri={uri} width={220} height={60} layers={6} spread={1.0} /> : <Text style={styles.subDetailValue}>{name}</Text>;
            })()}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.subDetailLabel}>Approved By:</Text>
            {(() => {
              const v = meta.approvedBySign || meta.approvedBy || '';
              const uri = v ? (String(v).startsWith('data:') ? v : (String(v).length > 100 ? `data:image/png;base64,${String(v).replace(/\s+/g, '')}` : null)) : null;
              const name = meta.approvedBy || 'Hassani Ali';
              return uri ? <SignatureThumb uri={uri} width={220} height={60} layers={6} spread={1.0} /> : <Text style={styles.subDetailValue}>{name}</Text>;
            })()}
          </View>
        </View>
        <View style={styles.specificationSection}>
          <Text style={styles.specLabel}>Specification:</Text>
          <Text style={styles.specText}>Packaging shall be intact, no signs of pests; seals shall be intact and labels shall be legible and correct.</Text>
        </View>
        <View style={styles.deliveryDetails}>
          <View style={styles.deliveryGrid}>
            <View style={styles.deliveryCol}>
              <Text style={styles.deliveryLabel}>Date of Delivery: <Text style={styles.deliveryValue}>{meta.dateOfDelivery}</Text></Text>
              <Text style={styles.deliveryLabel}>Received By: <Text style={styles.deliveryValue}>{meta.receivedBy}</Text></Text>
              <Text style={styles.deliveryLabel}>Complex Manager: <Text style={styles.deliveryValue}>{meta.complexManager}</Text></Text>
              <Text style={styles.deliveryLabel}>Time of Delivery: <Text style={styles.deliveryValue}>{meta.timeOfDelivery}</Text></Text>
            </View>
            <View style={styles.deliveryCol}>
              <Text style={styles.deliveryLabel}>Invoice No.: <Text style={styles.deliveryValue}>{meta.invoiceNo}</Text></Text>
              <Text style={styles.deliveryLabel}>Drivers Name: <Text style={styles.deliveryValue}>{meta.driversName}</Text></Text>
              <Text style={styles.deliveryLabel}>Vehicle Reg No.: <Text style={styles.deliveryValue}>{meta.vehicleRegNo}</Text></Text>
              <View style={{ marginTop: 6 }}>
                <Text style={styles.deliveryLabel}>Signature:</Text>
                {(() => {
                  const v = meta.signature;
                  const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
                  return uri ? <SignatureThumb uri={uri} width={240} height={80} layers={6} spread={1.0} /> : <Text style={styles.deliveryValue}>{v || ''}</Text>;
                })()}
              </View>
            </View>
          </View>
        </View>
        <ScrollView horizontal style={{ marginVertical: 12 }}>
          <View style={styles.tableContainer}>
            {/* Grouped header row */}
            <View style={{ flexDirection: 'row', backgroundColor: '#eee' }}>
              <Text style={[styles.headerCell, styles.nameCol, styles.spanTwoRows]}></Text>
              <Text style={[styles.headerCell, styles.supplierCol, styles.spanTwoRows]}></Text>
              <View style={{ flexDirection: 'row' }}>
                <Text style={[styles.groupHeader, { width: styles.cleanCol.width + styles.tempCol.width + styles.tempOfBeverageCol.width }]}>Delivery Vehicle</Text>
                <Text style={[styles.groupHeader, { width: styles.stateOfProductCol.width + styles.expiryDateCol.width }]}>Product</Text>
              </View>
              <Text style={[styles.headerCell, styles.remarksCol, styles.lastSubHeaderCell]}></Text>
            </View>
            {/* Divider line between grouped header and column header */}
            <View style={{ height: 2, backgroundColor: '#bbb', marginBottom: -2, marginHorizontal: 0 }} />
            {/* Actual column header row */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.headerCell, styles.nameCol]}>Name of Product</Text>
              <Text style={[styles.headerCell, styles.supplierCol]}>Supplier</Text>
              <Text style={[styles.headerCell, styles.cleanCol]}>Clean</Text>
              <Text style={[styles.headerCell, styles.tempCol]}>Temp</Text>
              <Text style={[styles.headerCell, styles.tempOfBeverageCol]}>Temp of Chilled/Frozen Product</Text>
              <Text style={[styles.headerCell, styles.stateOfProductCol]}>State of Product</Text>
              <Text style={[styles.headerCell, styles.expiryDateCol]}>Expiry Date</Text>
              <Text style={[styles.headerCell, styles.remarksCol]}>Remarks</Text>
            </View>
            {data.map((row, idx) => (
              <View style={styles.tableRow} key={row.id || idx}>
                <Text style={[styles.dataCell, styles.nameCol]}>{row.nameOfProduct}</Text>
                <Text style={[styles.dataCell, styles.supplierCol]}>{row.supplier}</Text>
                <Text style={[styles.dataCell, styles.cleanCol]}>{row.clean ? '✓' : ''}</Text>
                <Text style={[styles.dataCell, styles.tempCol]}>{row.temp}</Text>
                <Text style={[styles.dataCell, styles.tempOfBeverageCol]}>{row.tempOfChldFrznProduct}</Text>
                <Text style={[styles.dataCell, styles.stateOfProductCol]}>{row.stateOfProduct}</Text>
                <Text style={[styles.dataCell, styles.expiryDateCol]}>{row.expiryDate}</Text>
                <Text style={[styles.dataCell, styles.remarksCol]}>{row.remarks}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
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
  groupHeader: { fontWeight: 'bold', fontSize: 13, paddingVertical: 4, paddingHorizontal: 8, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', backgroundColor: '#eee', height: 24, textAlignVertical: 'center' },
  container: { backgroundColor: '#fff', minWidth: 1123, padding: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#000', marginBottom: 5, padding: 2 },
  logoImage: { width: 48, height: 48, marginRight: 10 },
  headerTextWrap: { flex: 1, marginRight: 10 },
  logoText: { fontWeight: 'bold', fontSize: 28, color: '#007A33' },
  systemText: { fontSize: 12, fontWeight: 'bold', lineHeight: 14 },
  docDetails: { minWidth: 120 },
  detailLabel: { fontWeight: 'bold', fontSize: 12 },
  detailValue: { fontSize: 12 },
  subjectRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#000', borderBottomWidth: 0, alignItems: 'center', padding: 5 },
  subjectLabel: { fontWeight: 'bold', fontSize: 14 },
  subjectValue: { fontSize: 16, marginLeft: 8 },
  versionText: { fontSize: 8, marginLeft: 12 },
  subDetailRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#000', marginBottom: 10, padding: 5 },
  subDetailLabel: { fontWeight: 'bold', fontSize: 9 },
  subDetailValue: { fontSize: 9, marginLeft: 5, borderBottomWidth: 1, borderBottomColor: '#000' },
  specificationSection: { marginBottom: 10, padding: 5, borderWidth: 1, borderColor: '#000' },
  specLabel: { fontWeight: 'bold', fontSize: 14, marginBottom: 6 },
  specText: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  deliveryDetails: { marginBottom: 10, padding: 5, borderWidth: 1, borderColor: '#000' },
  deliveryGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 24 },
  deliveryCol: { flex: 1, flexDirection: 'column', gap: 6 },
  deliveryLabel: { fontWeight: 'bold', fontSize: 12, marginRight: 8 },
  deliveryValue: { fontSize: 12 },
  tableContainer: { borderWidth: 1, borderColor: '#000', minWidth: 1123 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#eee', alignItems: 'stretch' },
  headerCell: { fontWeight: 'bold', fontSize: 12, padding: 8, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', minHeight: 60, textAlignVertical: 'center' },
  nameCol: { width: 220 },
  supplierCol: { width: 160 },
  cleanCol: { width: 70 },
  tempCol: { width: 70 },
  tempOfBeverageCol: { width: 110 },
  stateOfProductCol: { width: 120 },
  expiryDateCol: { width: 100 },
  remarksCol: { width: 260, borderRightWidth: 0, textAlign: 'left', paddingLeft: 12 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 48, alignItems: 'stretch' },
  dataCell: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 6, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center', textAlignVertical: 'center' },
  verificationFooter: { marginTop: 10 },
  verificationText: { fontWeight: 'bold', fontSize: 12, marginBottom: 8 },
  verificationSignature: { fontSize: 12, fontWeight: 'bold' },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import ResponsiveTable from '../../components/ResponsiveTable';
import SignatureThumb from '../../components/SignatureThumb';

export default function ProductRejectionPresentational({ payload }) {
  if (!payload) return null;
  const {
    rejectionEntries = [],
    storeOfficer = '',
    complexManager = '',
    financeStockController = '',
    rejectedProductCollector = '',
    assets = {},
  } = payload;

  const rejectionCriteria = [
    { product: 'Chilled products', criteria: 'Products above 4°C; damaged packaging; broken seals; incorrect/missing label; missing expiry.' },
    { product: 'Frozen products', criteria: 'Product above -18°C; damaged packaging; broken seals; incorrect/missing label; missing expiry.' },
    { product: 'Dry Goods', criteria: 'Damaged packaging; broken seals; incorrect/missing label; missing expiry.' },
    { product: 'Cleaning Chemicals', criteria: 'Not in original containers; damaged packaging; missing MSDS; broken seals; missing expiry.' },
    { product: 'Eggs', criteria: 'Dirty, bad smell, broken, pests; 10/10 float test; missing/incorrect label.' },
    { product: 'Vegetables', criteria: 'Dirty, visible foreign matter, pest damage.' },
  ];

  return (
    <ScrollView style={styles.safeArea} contentContainerStyle={styles.mainScrollContent}>
      <View style={styles.headerBlock}>
        <View style={styles.headerLeft}>
          {assets.logoDataUri ? (
            <Image source={{ uri: assets.logoDataUri }} style={styles.logoImage} resizeMode="contain" />
          ) : (
            <Image source={require('../../assets/logo.jpeg')} style={styles.logoImage} resizeMode="contain" />
          )}
          <Text style={styles.bravoBrand}>Bravo</Text>
          <Text style={styles.companyName}>BRAVO BRANDS LIMITED</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.subject}>PRODUCT REJECTION FORM</Text>
          <View style={styles.docRow}><Text style={styles.docLabel}>Version No:</Text><Text style={styles.docValue}>01</Text></View>
          <View style={styles.docRow}><Text style={styles.docLabel}>Rev No:</Text><Text style={styles.docValue}>00</Text></View>
        </View>
      </View>
      <View style={styles.compiledRow}>
        <View style={styles.compiledItem}>
          <Text style={styles.compiledLabel}>Compiled By:</Text>
          {(() => {
            const v = payload.compiledBySign || (payload.metadata && payload.metadata.compiledBySign) || payload.compiledBy || (payload.metadata && payload.metadata.compiledBy) || '';
            const uri = v ? (String(v).startsWith('data:') ? v : (String(v).length > 100 ? `data:image/png;base64,${String(v).replace(/\s+/g, '')}` : null)) : null;
            const name = payload.compiledBy || (payload.metadata && payload.metadata.compiledBy) || 'Michael Zulu C.';
            return uri ? <SignatureThumb uri={uri} width={220} height={60} layers={6} spread={1.0} /> : <Text style={styles.compiledValue}>{name}</Text>;
          })()}
        </View>
        <View style={styles.compiledItem}>
          <Text style={styles.compiledLabel}>Approved By:</Text>
          {(() => {
            const v = payload.approvedBySign || (payload.metadata && payload.metadata.approvedBySign) || payload.approvedBy || (payload.metadata && payload.metadata.approvedBy) || '';
            const uri = v ? (String(v).startsWith('data:') ? v : (String(v).length > 100 ? `data:image/png;base64,${String(v).replace(/\s+/g, '')}` : null)) : null;
            const name = payload.approvedBy || (payload.metadata && payload.metadata.approvedBy) || 'Hassani Ali';
            return uri ? <SignatureThumb uri={uri} width={220} height={60} layers={6} spread={1.0} /> : <Text style={styles.compiledValue}>{name}</Text>;
          })()}
        </View>
      </View>
      <View style={styles.criteriaBox}>
        <Text style={styles.criteriaTitle}>Criteria for Rejecting the product</Text>
        {rejectionCriteria.map((c, i) => (
          <View key={i} style={styles.criteriaRow}>
            <Text style={styles.criteriaProduct}>{c.product}</Text>
            <Text style={styles.criteriaText}>{c.criteria}</Text>
          </View>
        ))}
      </View>
      <View style={{ width: '100%' }}>
        <ResponsiveTable>
          <View style={[styles.tableOuter, { alignSelf: 'stretch', paddingHorizontal: 0 }]}> 
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colHeader, { width: 40 }]}>S/N</Text>
            <Text style={[styles.colHeader, { width: 160 }]}>Name of product Rejected</Text>
            <Text style={[styles.colHeader, { width: 120 }]}>Suppliers Name</Text>
            <Text style={[styles.colHeader, { width: 120 }]}>Invoice/Delivery No.</Text>
            <Text style={[styles.colHeader, { width: 120 }]}>Product Batch No.</Text>
            <Text style={[styles.colHeader, { width: 100 }]}>Expiry Date</Text>
            <Text style={[styles.colHeader, { width: 180, borderRightWidth: 0 }]}>Reason for rejecting the product</Text>
          </View>
          {(rejectionEntries || []).map((entry, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.cellText, { width: 40 }]}>{idx + 1}.</Text>
              <Text style={[styles.cellInput, { width: 160 }]}>{entry.name}</Text>
              <Text style={[styles.cellInput, { width: 120 }]}>{entry.supplier}</Text>
              <Text style={[styles.cellInput, { width: 120 }]}>{entry.invoice}</Text>
              <Text style={[styles.cellInput, { width: 120 }]}>{entry.batch}</Text>
              <Text style={[styles.cellInput, { width: 100 }]}>{entry.expiry}</Text>
              <Text style={[styles.cellInput, { width: 180, borderRightWidth: 0 }]}>{entry.reason}</Text>
            </View>
          ))}
          </View>
        </ResponsiveTable>
      </View>
      <View style={styles.signatures}>
        <View style={styles.sigRow}>
          <Text style={styles.sigLabel}>Name & signature of stores Officer:</Text>
          {payload.storeOfficerSign ? (
            (() => {
              const v = payload.storeOfficerSign;
              const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
              return uri ? <SignatureThumb uri={uri} width={240} height={80} layers={6} spread={1.0} /> : <Text style={styles.sigInput}>{v || ''}</Text>;
            })()
          ) : (
            <Text style={styles.sigInput}>{storeOfficer}</Text>
          )}
        </View>

        <View style={styles.sigRow}>
          <Text style={styles.sigLabel}>Verified by complex manager (Name & signature):</Text>
          {payload.complexManagerSign ? (
            (() => {
              const v = payload.complexManagerSign;
              const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
              return uri ? <SignatureThumb uri={uri} width={240} height={80} layers={6} spread={1.0} /> : <Text style={styles.sigInput}>{v || ''}</Text>;
            })()
          ) : (
            <Text style={styles.sigInput}>{complexManager}</Text>
          )}
        </View>

        <View style={styles.sigRow}>
          <Text style={styles.sigLabel}>Approved by (Finance and stock controller):</Text>
          {payload.financeStockControllerSign ? (
            (() => {
              const v = payload.financeStockControllerSign;
              const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
              return uri ? <SignatureThumb uri={uri} width={240} height={80} layers={6} spread={1.0} /> : <Text style={styles.sigInput}>{v || ''}</Text>;
            })()
          ) : (
            <Text style={styles.sigInput}>{financeStockController}</Text>
          )}
        </View>

        <View style={styles.sigRow}>
          <Text style={styles.sigLabel}>Rejected product collected by (Name & signature):</Text>
          {payload.rejectedProductCollectorSign ? (
            (() => {
              const v = payload.rejectedProductCollectorSign;
              const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
              return uri ? <SignatureThumb uri={uri} width={240} height={80} layers={6} spread={1.0} /> : <Text style={styles.sigInput}>{v || ''}</Text>;
            })()
          ) : (
            <Text style={styles.sigInput}>{rejectedProductCollector}</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  mainScrollContent: { padding: 16, paddingBottom: 120 },
  headerBlock: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#000', paddingRight: 10 },
  headerLeft: { width: 180, paddingRight: 12, borderRightWidth: 1, borderRightColor: '#000', alignItems: 'flex-start' },
  headerRight: { flex: 1, paddingLeft: 12 },
  logoImage: { width: 72, height: 36, marginBottom: 2 },
  bravoBrand: { fontSize: 28, fontWeight: '900', color: '#185a9d', marginTop: -8, marginBottom: -2, letterSpacing: 1.5 },
  companyName: { fontSize: 10, fontWeight: '700', lineHeight: 12, marginTop: -2 },
  subject: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 4 },
  docRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  docLabel: { fontSize: 10, fontWeight: '700', marginRight: 4, lineHeight: 12 },
  docValue: { fontSize: 10, color: '#111', marginRight: 12, flexShrink: 1, lineHeight: 12 },
  compiledRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  compiledItem: { flexDirection: 'row', alignItems: 'center' },
  compiledLabel: { fontWeight: '700', fontSize: 12, marginRight: 4 },
  compiledValue: { fontSize: 12, color: '#111' },
  criteriaBox: { borderWidth: 1, borderColor: '#000', padding: 10, marginBottom: 10 },
  criteriaTitle: { fontWeight: '700', marginBottom: 6, fontSize: 13 },
  criteriaRow: { flexDirection: 'row', marginBottom: 4 },
  criteriaProduct: { fontWeight: '700', width: 120, fontSize: 12 },
  criteriaText: { flex: 1, fontSize: 12 },
  tableOuter: { borderWidth: 1, borderColor: '#000', width: '100%' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#eee', paddingVertical: 6, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 40 },
  colHeader: { fontWeight: '700', textAlign: 'center', fontSize: 10, borderRightWidth: 1, borderRightColor: '#000', paddingHorizontal: 2 },
  tableRow: { flexDirection: 'row', minHeight: 36, alignItems: 'stretch', borderBottomWidth: 1, borderBottomColor: '#000' },
  cellInput: { fontSize: 12, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', paddingHorizontal: 2 },
  cellText: { fontSize: 12, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', paddingHorizontal: 2 },
  signatures: { marginTop: 16 },
  sigRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sigLabel: { fontWeight: '700', fontSize: 12, width: 260 },
  sigInput: { borderBottomWidth: 1, borderBottomColor: '#000', flex: 1, fontSize: 12, minHeight: 20, marginLeft: 8 },
});

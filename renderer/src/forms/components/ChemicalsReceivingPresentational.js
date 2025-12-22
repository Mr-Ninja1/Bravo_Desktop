import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

const ChemicalsReceivingPresentational = ({ payload }) => {
    const { metadata = {}, formData = [] } = payload || {};

    const resolveSignatureUri = (val) => {
        if (!val) return null;
        const s = String(val);
        if (s.startsWith('data:')) return s;
        if (s.length > 100 && !s.includes(' ')) return `data:image/png;base64,${s}`;
        return null;
    };

    const deliverySigUri = resolveSignatureUri(metadata.signature);
    const verifiedUri = resolveSignatureUri(metadata.verifiedBySign) || resolveSignatureUri(metadata.verifiedBy);
    const hseqUri = resolveSignatureUri(metadata.hseqManagerSign) || resolveSignatureUri(metadata.hseqManager);
    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 8 }}>
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
                    <Text>Issue Date: {metadata.issueDate}</Text>
                    <Text>Version: {metadata.versionNo}</Text>
                </View>
            </View>
            <View style={styles.titleRow}>
                <Text style={styles.formTitle}>{payload && payload.title ? payload.title : 'Chemicals Receiving'}</Text>
            </View>

            <View style={styles.specificationSection}>
                <Text style={styles.specLabel}>Chemicals shall be received in original containers, seal must not be broken, label must be legible and correct, the chemical shall be food grade, shall not be expired and a Safety Data Sheet shall accompany the chemical.</Text>
            </View>

            <View style={styles.deliveryDetails}>
                <Text>Date of Delivery: {metadata.dateOfDelivery}</Text>
                <Text>Received By: {metadata.receivedBy}</Text>
                <Text>Complex Manager: {metadata.complexManager}</Text>
                <Text>Time of Delivery: {metadata.timeOfDelivery}</Text>
                <Text>Invoice No: {metadata.invoiceNo}</Text>
                <Text>Driver: {metadata.driversName}</Text>
                <Text>Vehicle Reg No: {metadata.vehicleRegNo}</Text>
                <View style={{ marginTop: 6 }}>
                    <Text style={{ fontWeight: '700' }}>Signature:</Text>
                    {metadata.signature ? (
                        (() => {
                            const v = metadata.signature;
                            const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
                            return uri ? <SignatureThumb uri={uri} width={240} height={80} layers={6} spread={1.0} /> : null;
                        })()
                    ) : null}
                </View>
            </View>

            {/* Table: top grouped header row + subheader row to match editable form */}
            <ScrollView horizontal contentContainerStyle={{ minWidth: 1123 }}>
                <View style={styles.tableContainer}>
                    <View style={styles.groupHeaderRow}>
                        <Text style={[styles.groupCell, styles.nameCol]}>Name of Product</Text>
                        <Text style={[styles.groupCell, styles.supplierCol]}>Supplier</Text>
                        <Text style={[styles.groupCell, styles.deliveryGroupCol]}>Delivery{"\n"}Vehicle</Text>
                        <Text style={[styles.groupCell, styles.productGroupCol]}>Product</Text>
                    </View>
                    <View style={styles.subHeaderRow}>
                        <Text style={[styles.subCell, styles.nameCol]} />
                        <Text style={[styles.subCell, styles.supplierCol]} />
                        <Text style={[styles.subCell, styles.cleanCol]}>Clean</Text>
                        <Text style={[styles.subCell, styles.stateOfProductCol]}>State of Product</Text>
                        <Text style={[styles.subCell, styles.expiryDateCol]}>Expiry Date</Text>
                        <Text style={[styles.subCell, styles.remarksCol]}>Remarks</Text>
                    </View>

                    {/* Verified signatures moved below the table for better presentation */}

                    {formData.map((r) => (
                        <View key={r.id} style={styles.row}>
                            <Text style={[styles.cell, styles.nameCol]}>{r.nameOfProduct}</Text>
                            <Text style={[styles.cell, styles.supplierCol]}>{r.supplier}</Text>
                            <Text style={[styles.cell, styles.cleanCol]}>{r.clean ? '✓' : ''}</Text>
                            <Text style={[styles.cell, styles.stateOfProductCol]}>{r.stateOfProduct}</Text>
                            <Text style={[styles.cell, styles.expiryDateCol]}>{r.expiryDate}</Text>
                            <Text style={[styles.cell, styles.remarksCol]}>{r.remarks}</Text>
                        </View>
                    ))}
                    </View>
                </ScrollView>

                {/* Verified signatures below the table */}
                <View style={{ marginTop: 12 }}>
                    <Text style={{ fontWeight: '700', marginBottom: 6 }}>VERIFIED BY</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ fontWeight: '700', marginRight: 8 }}>Verified By</Text>
                                        {metadata.verifiedBySign ? (
                                            (() => {
                                                const v = metadata.verifiedBySign;
                                                const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
                                                return uri ? <SignatureThumb uri={uri} width={160} height={60} layers={5} spread={0.9} /> : <Text>{v || ''}</Text>;
                                            })()
                                        ) : (
                                            <Text>{metadata.verifiedBy || ''}</Text>
                                        )}
                                    </View>
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ fontWeight: '700', marginRight: 8 }}>HSEQ Manager</Text>
                                {metadata.hseqManagerSign ? (
                                    (() => {
                                        const v = metadata.hseqManagerSign;
                                        const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
                                        return uri ? <SignatureThumb uri={uri} width={160} height={60} layers={5} spread={0.9} /> : <Text>{v || ''}</Text>;
                                    })()
                                ) : (
                                    <Text>{metadata.hseqManager || ''}</Text>
                                )}
                            </View>
                        </View>
                    </View>
        </View>
    </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { backgroundColor: '#fff' },
    docHeader: { flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, padding: 6, marginBottom: 6 },
    logoAndSystem: { flexDirection: 'row', alignItems: 'center' },
    logoImage: { width: 48, height: 48, marginRight: 8 },
    logoText: { fontWeight: 'bold', fontSize: 20, color: '#007A33' },
    systemText: { fontSize: 12 },
    docDetailsRight: { justifyContent: 'center' },
    specificationSection: { marginBottom: 8 },
    specLabel: { fontSize: 12 },
    deliveryDetails: { marginBottom: 8 },
    titleRow: { alignItems: 'center', marginBottom: 8 },
    formTitle: { fontSize: 16, fontWeight: '900' },
    tableContainer: { borderWidth: 1, borderColor: '#000' },
    groupHeaderRow: { flexDirection: 'row', backgroundColor: '#eee' },
    groupCell: { padding: 8, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center', fontWeight: '700' },
    subHeaderRow: { flexDirection: 'row', backgroundColor: '#eee' },
    subCell: { padding: 6, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center', fontWeight: '700' },
    row: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#000' },
    cell: { padding: 8, borderRightWidth: 1, borderRightColor: '#000' },
    nameCol: { width: 260 },
    supplierCol: { width: 180 },
    // Delivery group is a single Clean column (width 90)
    deliveryGroupCol: { width: 90 },
    cleanCol: { width: 90 },
    // Product subcolumns total to 560 (140 + 120 + 300)
    productGroupCol: { width: 560 },
    stateOfProductCol: { width: 140 },
    expiryDateCol: { width: 120 },
    remarksCol: { width: 300, borderRightWidth: 0 },
});

export default ChemicalsReceivingPresentational;

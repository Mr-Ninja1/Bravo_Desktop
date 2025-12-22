import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

function normalizeSignature(v) {
    if (!v) return null;
    if (String(v).startsWith('data:')) return v;
    const compact = String(v).replace(/\s+/g, '');
    if (compact.length > 200) return `data:image/png;base64,${compact}`;
    return null;
}

function renderMaybeSignature(v, opts = {}) {
    const uri = normalizeSignature(v);
    // accept { width, height } in opts and fall back to sensible defaults
    const width = opts.width || 110;
    const height = opts.height || 40;
    // Keep a container that reserves the same width so the table layout stays stable
    if (uri) {
        return (
            <View style={{ width, paddingHorizontal: 6, justifyContent: 'center', borderRightWidth: 0 }}>
                <SignatureThumb uri={uri} width={width} height={height} layers={8} spread={1.0} />
            </View>
        );
    }
    return (
        <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.cellInput, styles.columnBase, { width, borderRightWidth: 0 }]}>
            {v || ''}
        </Text>
    );
}

// Normalizes different saved payload shapes into the canonical shape this renderer expects.
function normalizePayload(payload) {
    if (!payload) return null;

    const normalized = {};

    // metadata
    normalized.metadata = payload.metadata || payload.meta || {};

    // top-level date/title fallbacks
    normalized.title = payload.title || payload.formType || 'Training Attendance Register';
    normalized.date = payload.date || normalized.metadata.date || normalized.metadata.issueDate || '';

    // assets (prefer embedded data uri)
    normalized.assets = payload.assets || (payload.meta && payload.meta.assets) || undefined;

    // formData: prefer object with topics/cells; accept legacy arrays/rows
    const raw = payload.formData || payload.data || payload.fields || {};

    const formData = { topics: [], cells: { left: {}, right: {} } };

    // topics: can be stored as array, newline-separated string, or in metadata
    if (raw.topics && Array.isArray(raw.topics)) {
        formData.topics = raw.topics;
    } else if (typeof raw.topics === 'string') {
        formData.topics = raw.topics.split('\n').map(t => t.trim()).filter(Boolean);
    } else if (normalized.metadata.topics) {
        formData.topics = Array.isArray(normalized.metadata.topics) ? normalized.metadata.topics : String(normalized.metadata.topics).split('\n').map(t => t.trim()).filter(Boolean);
    }

    // cells: preferred shape is { left: {1:{...}}, right: {10:{...}} }
    if (raw.cells && (raw.cells.left || raw.cells.right)) {
        formData.cells.left = raw.cells.left || {};
        formData.cells.right = raw.cells.right || {};
    } else if (Array.isArray(raw.rows) && raw.rows.length > 0) {
        // legacy rows: map first 9 -> left, next 9 -> right
        raw.rows.forEach((row, idx) => {
            const n = idx + 1;
            if (n <= 9) {
                formData.cells.left[n] = {
                    name: row.fullName || row.name || row[1] || '',
                    nrc: row.nrc || row.nrcNumber || row[2] || '',
                    job: row.jobTitle || row[3] || '',
                    sign: row.signature || row[4] || ''
                };
            } else {
                const k = n - 9; // 10..18 mapped with keys 10..18 in our renderer
                formData.cells.right[n] = {
                    name: row.fullName || row.name || row[1] || '',
                    nrc: row.nrc || row.nrcNumber || row[2] || '',
                    job: row.jobTitle || row[3] || '',
                    sign: row.signature || row[4] || ''
                };
            }
        });
    } else if (raw.left || raw.right) {
        // maybe stored under left/right directly
        formData.cells.left = raw.left || {};
        formData.cells.right = raw.right || {};
    }

    normalized.formData = formData;
    return normalized;
}

export default function TrainingAttendanceRegisterPresentational({ payload }) {
    const normalized = normalizePayload(payload);
    if (!normalized) return null;

    const meta = normalized.metadata || {};
    const data = normalized.formData || { topics: [], cells: { left: {}, right: {} } };
    const topics = data.topics || [];
    const cells = data.cells || { left: {}, right: {} };

    // rows for left column (1..9) and right column (10..18)
    const leftRows = Array.from({ length: 9 }, (_, i) => i + 1);

    // logo: prefer embedded data uri in payload.assets, fall back to bundled asset
    const logoSource = (normalized.assets && normalized.assets.logoDataUri) ? { uri: normalized.assets.logoDataUri } : require('../../assets/logo.jpeg');

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.topHeader}>
                <View style={styles.headerLeft}>
                    <Image source={logoSource} style={styles.logoImage} resizeMode="contain" />
                    <View style={{ marginTop: 4 }}>
                        <Text style={styles.companyName}>BRAVO BRANDS LIMITED</Text>
                        <Text style={styles.systemName}>Food Safety Management System</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <View style={styles.docRow}>
                        <Text style={styles.docLabel}>Issue Date:</Text>
                        <Text style={styles.docValue}>{meta.date || normalized.date || ''}</Text>
                        <Text style={[styles.docLabel, { marginLeft: 12 }]}>Review Date:</Text>
                        <Text style={styles.docValue}>N/A</Text>
                    </View>
                    <View style={[styles.docRow, { marginTop: 8, borderTopWidth: 1, borderColor: '#000', paddingTop: 4 }]}>
                        <Text style={styles.docLabel}>Compiled By:</Text>
                        <Text style={styles.docValue}>Michael C. Zulu</Text>
                        <Text style={[styles.docLabel, { marginLeft: 12 }]}>Approved By:</Text>
                        <Text style={styles.docValue}>Hasani Al</Text>
                    </View>
                    <View style={styles.docRow}>
                        <Text style={styles.docLabel}>Version No:</Text>
                        <Text style={styles.docValue}>01</Text>
                        <Text style={[styles.docLabel, { marginLeft: 12 }]}>Rev No:</Text>
                        <Text style={styles.docValue}>00</Text>
                    </View>
                </View>
            </View>

            <Text style={styles.title}>{normalized.title || 'Training Attendance Register'}</Text>

            <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Subject:</Text>
                <Text style={styles.metaValue}>{meta.subject || ''}</Text>
                <Text style={[styles.metaLabel, { marginLeft: 16 }]}>Presenter:</Text>
                <Text style={styles.metaValue}>{meta.presenter || ''}</Text>
                <Text style={[styles.metaLabel, { marginLeft: 16 }]}>Date:</Text>
                <Text style={styles.metaValue}>{meta.date || normalized.date || ''}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Topics Discussed</Text>
                {topics.map((t, i) => (
                    <Text key={i} style={styles.topic}>{i + 1}. {t}</Text>
                ))}
            </View>

                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} contentContainerStyle={{ flexGrow: 1 }}>
                        <View style={styles.tableOuter}>
                            <View style={styles.tableHeaderRow}>
                            <Text style={[styles.colHeader, styles.columnBase, { width: 48 }]}>S/N</Text>
                            <Text style={[styles.colHeader, styles.columnBase, { width: 156 }]}>FULL NAME</Text>
                            <Text style={[styles.colHeader, styles.columnBase, { width: 132 }]}>NRC NUMBER</Text>
                            <Text style={[styles.colHeader, styles.columnBase, { width: 160 }]}>JOB TITLE</Text>
                            <Text style={[styles.colHeader, styles.columnBase, { width: 110, borderRightWidth: 0 }]}>SIGNATURE</Text>

                            <Text style={[styles.colHeader, styles.columnBase, { width: 48 }]}>S/N</Text>
                            <Text style={[styles.colHeader, styles.columnBase, { width: 156 }]}>FULL NAME</Text>
                            <Text style={[styles.colHeader, styles.columnBase, { width: 132 }]}>NRC NUMBER</Text>
                            <Text style={[styles.colHeader, styles.columnBase, { width: 160 }]}>JOB TITLE</Text>
                            <Text style={[styles.colHeader, styles.columnBase, { width: 110, borderRightWidth: 0 }]}>SIGNATURE</Text>
                        </View>

                {leftRows.map((n) => (
                    <View key={`row-${n}`} style={styles.tableRow}>
                        <Text style={[styles.cellText, styles.columnBase, { width: 48 }]}>{n}.</Text>
                            <Text numberOfLines={2} ellipsizeMode="tail" style={[styles.cellInput, styles.columnBase, { width: 156 }]}>{cells.left[n]?.name || ''}</Text>
                            <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.cellInput, styles.columnBase, { width: 132 }]}>{cells.left[n]?.nrc || ''}</Text>
                            <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.cellInput, styles.columnBase, { width: 160 }]}>{cells.left[n]?.job || ''}</Text>
                            {renderMaybeSignature(cells.left[n]?.sign || '', { width: 110, height: 40 })}

                        <Text style={[styles.cellText, styles.columnBase, { width: 48 }]}>{n + 9}.</Text>
                        <Text numberOfLines={2} ellipsizeMode="tail" style={[styles.cellInput, styles.columnBase, { width: 156 }]}>{cells.right[n + 9]?.name || ''}</Text>
                        <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.cellInput, styles.columnBase, { width: 132 }]}>{cells.right[n + 9]?.nrc || ''}</Text>
                        <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.cellInput, styles.columnBase, { width: 160 }]}>{cells.right[n + 9]?.job || ''}</Text>
                        {renderMaybeSignature(cells.right[n + 9]?.sign || '', { width: 110, height: 40 })}
                    </View>
                ))}
                        </View>
                    </ScrollView>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, paddingBottom: 80 },
    title: { fontSize: 18, fontWeight: '900', textAlign: 'center', marginVertical: 10, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, flexWrap: 'wrap' },
    metaLabel: { fontWeight: '800', marginRight: 6, fontSize: 13 },
    metaValue: { fontSize: 13, fontWeight: '700', marginRight: 12 },
    section: { marginBottom: 12 },
    sectionTitle: { fontWeight: '800', marginBottom: 6 },
    topic: { marginLeft: 8, marginTop: 4, fontSize: 13 },
    tableOuter: { borderWidth: 1, borderColor: '#000', width: '100%', alignSelf: 'stretch' },
    // header block styles (match editable form)
    topHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#000', paddingRight: 10 },
    headerLeft: { width: 240, paddingRight: 12, borderRightWidth: 1, borderRightColor: '#000', alignItems: 'flex-start' },
    headerRight: { flex: 1, paddingLeft: 12 },
    logoImage: { width: 96, height: 36, marginBottom: 6 },
    companyName: { fontSize: 12, fontWeight: '800', lineHeight: 14, marginTop: -6 },
    systemName: { fontSize: 10, lineHeight: 12, marginBottom: 8 },
    docRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    docLabel: { fontSize: 10, fontWeight: '700', marginRight: 4, lineHeight: 12 },
    docValue: { fontSize: 10, color: '#111', marginRight: 12, flexShrink: 1, lineHeight: 12 },
    tableHeaderRow: { flexDirection: 'row', backgroundColor: '#eee', paddingVertical: 6, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 40 },
    colHeader: { fontWeight: '800', textAlign: 'center', fontSize: 11 },
    tableRow: { flexDirection: 'row', minHeight: 36, alignItems: 'stretch', borderBottomWidth: 1, borderBottomColor: '#000' },
    
    // Column styles: These flex values determine the width. 
    // The sum of the 10 flex values should be balanced across the row.
    // Original flex values (x2): 0.07, 0.38, 0.16, 0.32, 0.23 -> Sum = 1.16 
    // New total sum: 2.32 (too high for a standard flex: 1 container)
    // Recalculated for better fitting within a single row:
    colSn: { flex: 0.5, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000', justifyContent: 'center' }, // Adjusted from 0.07
    colName: { flex: 3.5, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000', justifyContent: 'center' }, // Adjusted from 0.38
    colNrc: { flex: 1.5, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000', justifyContent: 'center' }, // Adjusted from 0.16
    colJob: { flex: 2.5, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000', justifyContent: 'center' }, // Adjusted from 0.32
    colSign: { flex: 2, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000', justifyContent: 'center' }, // Adjusted from 0.23

    // Use a separate style for the LAST column to handle the outer right border
    colSignLast: { flex: 2, paddingHorizontal: 6, justifyContent: 'center' },

    // The sum of one set of new flex values is 10. The sum of all ten is 20. 
    // With no spacing between them, this should fill the `tableOuter` container (which has no explicit flex value but takes 100% width).

    columnBase: { paddingHorizontal: 6, paddingVertical: 6, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000' },
    cellInput: { fontSize: 13, textAlign: 'center', paddingHorizontal: 2 },
    cellText: { fontSize: 13, textAlign: 'center' },
    cellContainer: { minHeight: 36, justifyContent: 'center', overflow: 'hidden' }
});
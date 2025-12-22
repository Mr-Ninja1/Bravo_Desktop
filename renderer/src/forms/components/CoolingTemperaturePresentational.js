import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { getDraft, setDraft, removeDraft } from '../../utils/formDrafts';
import { addFormHistory } from '../../utils/formHistory';
import EditableFormContainer from '../../components/EditableFormContainer';
import SignatureField from '../../components/SignatureField';
import SignatureThumb from '../../components/SignatureThumb';


const DRAFT_KEY = 'cooling_temperature_log_draft';
const MAX_ROWS = 20; // Set to 20 rows per request

const emptyRow = {
    foodItem: '',
    timeIntoUnit: '', // New column
    // record 1
    time1: '', temp1: '', sign1: '',
    // record 2
    time2: '', temp2: '', sign2: '',
    // record 3
    time3: '', temp3: '', sign3: '',
    staffName: '',
};

const initialRows = Array.from({ length: MAX_ROWS }, () => ({ ...emptyRow }));

// Updated metadata to reflect the form's header details from the image
const initialMeta = {
    subject: 'TEMPERATURE RECORD FOR COOLING', // Updated
    docNo: 'BBN-SHEQ-TRC-1.1', // Matched image
    issueDate: '', // will default to today if not provided
    date: '',
    revisionDate: 'N/A', // Matched image
    compiledBy: 'MICHAEL ZULU C.', // Matched image
    approvedBy: 'Hassani Ali', // Matched image
    versionNo: '01', // Matched image
    revNo: '00', // Matched image
    chefSignature: '', // Re-added for the footer
    correctiveAction: '', // Re-added for the footer
    complexManagerSignature: '', // Re-added for the footer
};

export default function CoolingTemperatureLog() {
    const [rows, setRows] = useState(initialRows);
    const [meta, setMeta] = useState(initialMeta);
    const [busy, setBusy] = useState(false);
    const [logoDataUri, setLogoDataUri] = useState(null);
    const saveTimer = useRef(null);
    const [editMode, setEditMode] = useState(false);

    // Helper to format date
    const getTodayDate = () => {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    // Load Draft and Set Initial Date
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const d = await getDraft(DRAFT_KEY);
                if (d && mounted) {
                    if (d.rows) setRows(d.rows);
                    if (d.meta) {
                        // treat the static template example date as a placeholder and replace it with today
                        const exampleDates = ['31/08/25', '31/08/2025'];
                        const draftIssue = d.meta.issueDate || d.meta.date;
                        if (!draftIssue || exampleDates.includes(draftIssue)) {
                            const today = getTodayDate();
                            setMeta(prev => ({ ...initialMeta, ...d.meta, issueDate: today, date: d.meta.date || today }));
                        } else {
                            setMeta(prev => ({ ...initialMeta, ...d.meta }));
                        }
                    }
                } else if (mounted) {
                    // no draft: default both date fields to today
                    const today = getTodayDate();
                    setMeta(prev => ({ ...prev, issueDate: today, date: today }));
                }
            } catch (e) { console.warn('load draft', e); }
        })();
        // don't attempt to use expo FileSystem/Asset in the Desktop renderer bundle;
        // renderer presentational components prefer `payload.assets.logoDataUri` or a direct require('../../assets/logo.jpeg')
        (async () => {
            try { if (mounted) setLogoDataUri(null); } catch (e) { /* ignore */ }
        })();
        return () => { mounted = false; };
    }, []);

    // Autosave Draft
    useEffect(() => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => setDraft(DRAFT_KEY, { rows, meta }), 700);
        return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    }, [rows, meta]);

    const setCell = useCallback((r, k, v) => setRows(prev => prev.map((row, i) => i === r ? { ...row, [k]: v } : row)), []);
    const setMetaField = (k, v) => setMeta(prev => ({ ...prev, [k]: v }));

    const handleSubmit = async () => {
        const logData = rows.map((r, i) => ({ index: i + 1, ...r }));

        setBusy(true);
        try {
            // ensure metadata contains company name for saved rendering
            const normalizedMeta = { companyName: 'BRAVO BRANDS LIMITED', ...meta };

            // compute numeric WIDTHS from COL_FLEX relative flex values and desired table width
            const TABLE_WIDTH = 1000;
            const flexMap = COL_FLEX || {};
            const flexTotal = Object.values(flexMap).reduce((s, v) => s + (Number(v) || 0), 0) || 1;
            const WIDTHS = Object.keys(flexMap).reduce((acc, k) => {
                acc[k] = Math.round((TABLE_WIDTH * (Number(flexMap[k]) || 0)) / flexTotal);
                return acc;
            }, {});

            const payload = {
                formType: 'CoolingTemperatureLog',
                templateVersion: 'v1.0',
                title: 'Temperature Record for Cooling (Cooling Temperature Log)',
                date: normalizedMeta.issueDate || getTodayDate(),
                metadata: normalizedMeta,
                formData: logData,
                // include both the original flex map and computed absolute widths for renderers
                layoutHints: { COL_FLEX: flexMap, WIDTHS },
                _tableWidth: TABLE_WIDTH,
                assets: logoDataUri ? { logoDataUri } : {},
                savedAt: Date.now(),
            };

            // save: pass payload so addFormHistory preserves it for SavedFormRenderer
            await addFormHistory({ title: payload.title, date: payload.date, savedAt: payload.savedAt, payload });
            await removeDraft(DRAFT_KEY);
            // Reset form
            setRows(initialRows);
            // Reset meta to initial state (fixed values from image) but clear signatures
            setMeta(prev => ({
                ...initialMeta,
                chefSignature: '',
                correctiveAction: '',
                complexManagerSignature: ''
            }));
            Alert.alert('Saved', 'Form saved');
        } catch (e) {
            console.warn('submit error', e);
            Alert.alert('Error', 'Failed to submit log. Please try again.');
        }
        setBusy(false);
    };

    const handleSaveDraft = async () => {
        setBusy(true);
        try { await setDraft(DRAFT_KEY, { rows, meta }); } catch (e) { console.warn('save draft error', e); }
        setBusy(false);
    };

    // Action buttons rendered outside the children wrapper so they remain tappable
    // when editMode is false. EditableFormContainer will render this prop above the modal.
    const actionButtons = (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#f6c342' }]} onPress={handleSaveDraft} disabled={busy}><Text style={[styles.btnText, { fontSize: 14 }]}>{busy ? 'Saving...' : 'Save Draft'}</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#3b82f6' }]} onPress={handleSubmit} disabled={busy}><Text style={[styles.btnText, { fontSize: 14 }]}>{busy ? 'Submitting...' : 'Submit Log'}</Text></TouchableOpacity>
        </View>
    );

    // Flex values for column widths 
    const COL_FLEX = {
        INDEX: 0.6,
        FOOD_ITEM: 2.5, 
        TIME_INTO_UNIT: 2.5, 
        TIME_TEMP_SIGN: 1.0, // Each T/T/S column (9 total)
        STAFF_NAME: 1.5,
    };

    // Normalize previewable signature values for read-only rendering
    const resolvePreviewUri = (val) => {
        if (!val) return null;
        if (typeof val === 'object') {
            if (val.uri && typeof val.uri === 'string') {
                const u = val.uri.trim(); if (u) return u;
            }
            if (val.data && typeof val.data === 'string') {
                const compact = val.data.replace(/\s+/g, '');
                if (compact.length) return `data:image/png;base64,${compact}`;
            }
            return null;
        }
        if (typeof val !== 'string') return null;
        const s = val.trim(); if (!s) return null;
        if (s.startsWith('data:') || s.startsWith('http:') || s.startsWith('https:') || s.startsWith('file:') || s.startsWith('blob:')) return s;
        const base64ish = /^[A-Za-z0-9+/=\r\n]+$/;
        const compact = s.replace(/\s+/g, '');
        if (compact.length > 100 && base64ish.test(compact)) return `data:image/png;base64,${compact}`;
        return null;
    };
    
    return (
        <EditableFormContainer editMode={editMode} setEditMode={setEditMode} onSaveDraft={handleSaveDraft} actionButtons={actionButtons}>
        <View style={styles.container}>
            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 180, flexGrow: 1 }]} keyboardShouldPersistTaps="handled">
                
                {/* --- 1. Document Header (Metadata Block) --- */}
                <View style={styles.metaContainer}>
                    <View style={styles.metaHeaderBox}>
                        <View style={styles.brandRow}>
                            <Image 
                                source={require('../../assets/logo.jpeg')} 
                                style={styles.logoImage} 
                                resizeMode="contain" 
                            />
                            <View style={styles.brandTextWrap}>
                                <Text style={styles.brandTitle}>[BRAVO BRANDS LIMITED]</Text>
                                <Text style={styles.brandSubtitle}>Food Safety Management System</Text>
                            </View>
                        </View>
                        <View style={styles.docInfoGrid}>
                            <Text style={[styles.docInfoLabel, styles.docInfoHalf]}>Doc No: </Text>
                            <Text style={[styles.docInfoValue, styles.docInfoHalf]}>{meta.docNo}</Text>
                            
                                <Text style={[styles.docInfoLabel, styles.docInfoHalf]}>Issue Date: </Text>
                                <Text style={[styles.docInfoValue, styles.docInfoHalf]}>{meta.issueDate}</Text>

                            <Text style={[styles.docInfoLabel, styles.docInfoHalf, styles.noBorderBottom]}>Revision Date: </Text>
                            <Text style={[styles.docInfoValue, styles.docInfoHalf, styles.noBorderBottom]}>{meta.revisionDate}</Text>
                        </View>
                        <View style={styles.pageInfoBox}>
                             <Text style={styles.pageInfoText}>Page 1 of 1</Text>
                        </View>
                    </View>

                    <View style={styles.metaSubjectRow}>
                        <Text style={styles.metaSubjectText}>Project:</Text>
                        <Text style={styles.metaSubjectValue}>{meta.subject}</Text>
                        
                        <Text style={styles.metaVersionText}>Version No.</Text>
                        <Text style={styles.metaVersionValue}>{meta.versionNo}</Text>

                        <Text style={styles.metaRevText}>Rev no:</Text>
                        <Text style={styles.metaRevValue}>{meta.revNo}</Text>
                    </View>
                    
                    <View style={styles.metaCompiledRow}>
                        <View style={[styles.metaRowItem, styles.borderRight, { flex: 1.5 }]}>
                            <Text style={styles.metaCompiledLabel}>Compiled By:</Text>
                            <Text style={styles.metaCompiledValue}>{meta.compiledBy}</Text>
                        </View>
                        <View style={[styles.metaRowItem, styles.borderRight, { flex: 1.5 }]}>
                            <Text style={styles.metaCompiledLabel}>Approved By:</Text>
                            <Text style={styles.metaCompiledValue}>{meta.approvedBy}</Text>
                        </View>
                        <View style={{ flex: 1 }} />
                    </View>

                </View>

                {/* --- 2. Table Block --- */}
                <View style={styles.tableWrap}>
                    <Text style={styles.tableTitle}>COOLING TEMPERATURE LOG</Text>

                    {/* Header Row 1: Probe Thermometer / Date */}
                    <View style={styles.logHeaderRow1}>
                        {/* Updated text as per user request */}
                        <Text style={[styles.logHeaderRow1Text, { fontSize: 14 }]}>PROBE THERMOMETER TEMPERATURE LOG FOR COOLING FOOD</Text> 
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.logHeaderRow1Text, { fontSize: 12 }]}>DATE</Text>
                            <Text style={[styles.logHeaderRow1Text, { fontSize: 14 }]}>{meta.date || meta.issueDate}</Text>
                        </View>
                    </View>
                    
                    {/* Header Row 2: Group Labels (COOLING, FOOD ITEM, TIME INTO UNIT, 1ST RECORD, etc.) */}
                    <View style={[styles.tableHeaderRow, styles.groupHeader]}>
                        
                        <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.INDEX }]} />
                        
                        {/* Cooling Instruction Column Span */}
                        <View style={{ flex: COL_FLEX.FOOD_ITEM + COL_FLEX.TIME_INTO_UNIT, borderRightWidth: 1, borderColor: '#333', justifyContent: 'center' }}>
                            <View style={styles.instructionBox}>
                                {/* Updated instruction text as per user request */}
                                <Text style={[styles.hText, styles.instructionText]}>
                                    COOLING (10 °C within 2hours)
                                </Text>
                            </View>
                            
                            <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#333' }}>
                                {/* Food Item Column */}
                                <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.FOOD_ITEM / (COL_FLEX.FOOD_ITEM + COL_FLEX.TIME_INTO_UNIT) }]}>
                                    <Text style={[styles.hText, { fontSize: 10 }]}>FOOD ITEM</Text>
                                </View>
                                {/* Time Into Unit Column (New) */}
                                <View style={[styles.hCell, { flex: COL_FLEX.TIME_INTO_UNIT / (COL_FLEX.FOOD_ITEM + COL_FLEX.TIME_INTO_UNIT) }]}>
                                    <Text style={[styles.hText, { fontSize: 8 }]}>
                                        Time into {'\n'}Fridge/Display{'\n'}Chiller/Deep{'\n'}Freezer/Chiller{'\n'}Room/Freezer Room
                                    </Text>
                                </View>
                            </View>

                        </View>

                        {/* Record Group Spans */}
                        <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN * 3 }]}><Text style={styles.hText}>1ST RECORD</Text></View>
                        <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN * 3 }]}><Text style={styles.hText}>2ND RECORD</Text></View>
                        <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN * 3 }]}><Text style={styles.hText}>3RD RECORD</Text></View>
                        
                        <View style={[styles.hCell, { flex: COL_FLEX.STAFF_NAME }]}>
                            <Text style={styles.hText}>STAFF'S NAME</Text>
                        </View>
                    </View>

                    {/* Header Row 3: Detail Labels (#, TIME, TEMP, SIGN) */}
                    <View style={[styles.tableHeaderRow, styles.detailHeader]}>
                        <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.INDEX }]}><Text style={styles.hText}>#</Text></View>
                        <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.FOOD_ITEM + COL_FLEX.TIME_INTO_UNIT }]} />
                        
                        {/* T/T/S columns */}
                        {[...Array(3)].map((_, i) => (
                            <React.Fragment key={i}>
                                <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}><Text style={styles.hText}>TIME</Text></View>
                                <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}><Text style={styles.hText}>TEMP</Text></View>
                                <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}><Text style={styles.hText}>SIGN</Text></View>
                            </React.Fragment>
                        ))}

                        <View style={[styles.hCell, { flex: COL_FLEX.STAFF_NAME }]} />
                    </View>

                    {/* Data Rows */}
                    {rows.map((row, ri) => (
                        <View key={ri} style={styles.row}>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.INDEX }]}><Text style={{ textAlign: 'center', fontSize: 12, fontWeight: '700' }}>{ri + 1}</Text></View>
                            
                            {/* Food Item */}
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.FOOD_ITEM }]}>
                                {editMode ? (
                                    <TextInput style={styles.input} value={row.foodItem} onChangeText={v => setCell(ri, 'foodItem', v)} placeholder="e.g., Soup" />
                                ) : (
                                    <Text style={styles.readOnlyCell}>{row.foodItem}</Text>
                                )}
                            </View>

                            {/* Time Into Unit (New) */}
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_INTO_UNIT }]}>
                                {editMode ? (
                                    <TextInput style={styles.input} value={row.timeIntoUnit} onChangeText={v => setCell(ri, 'timeIntoUnit', v)} placeholder="HH:MM" />
                                ) : (
                                    <Text style={styles.readOnlyCell}>{row.timeIntoUnit}</Text>
                                )}
                            </View>

                            {/* 1st Record */}
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>{editMode ? <TextInput style={styles.input} value={row.time1} onChangeText={v => setCell(ri, 'time1', v)} placeholder="HH:MM" /> : <Text style={styles.readOnlyCell}>{row.time1}</Text>}</View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>{editMode ? <TextInput style={styles.input} value={row.temp1} onChangeText={v => setCell(ri, 'temp1', v)} placeholder="°C" keyboardType="numeric" /> : <Text style={styles.readOnlyCell}>{row.temp1}</Text>}</View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>{editMode ? <SignatureField value={row.sign1} onChange={v => setCell(ri, 'sign1', v)} editable={editMode} width={100} height={48} placeholder="Tap to sign" /> : (() => {
                                // render image preview when available to avoid showing long data URLs
                                const uri = resolvePreviewUri(row.sign1);
                                if (uri) return (<View style={{ alignItems: 'center', justifyContent: 'center' }}><SignatureThumb uri={uri} width={80} height={48} layers={10} spread={1.2} /></View>);
                                return <Text style={styles.readOnlyCell}>{row.sign1}</Text>;
                            })()}</View>

                            {/* 2nd Record */}
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>{editMode ? <TextInput style={styles.input} value={row.time2} onChangeText={v => setCell(ri, 'time2', v)} placeholder="HH:MM" /> : <Text style={styles.readOnlyCell}>{row.time2}</Text>}</View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>{editMode ? <TextInput style={styles.input} value={row.temp2} onChangeText={v => setCell(ri, 'temp2', v)} placeholder="°C" keyboardType="numeric" /> : <Text style={styles.readOnlyCell}>{row.temp2}</Text>}</View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>{editMode ? <SignatureField value={row.sign2} onChange={v => setCell(ri, 'sign2', v)} editable={editMode} width={100} height={48} placeholder="Tap to sign" /> : (() => {
                                const uri = resolvePreviewUri(row.sign2);
                                if (uri) return (<View style={{ alignItems: 'center', justifyContent: 'center' }}><SignatureThumb uri={uri} width={80} height={48} layers={10} spread={1.2} /></View>);
                                return <Text style={styles.readOnlyCell}>{row.sign2}</Text>;
                            })()}</View>

                            {/* 3rd Record */}
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>{editMode ? <TextInput style={styles.input} value={row.time3} onChangeText={v => setCell(ri, 'time3', v)} placeholder="HH:MM" /> : <Text style={styles.readOnlyCell}>{row.time3}</Text>}</View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>{editMode ? <TextInput style={styles.input} value={row.temp3} onChangeText={v => setCell(ri, 'temp3', v)} placeholder="°C" keyboardType="numeric" /> : <Text style={styles.readOnlyCell}>{row.temp3}</Text>}</View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>{editMode ? <SignatureField value={row.sign3} onChange={v => setCell(ri, 'sign3', v)} editable={editMode} width={100} height={48} placeholder="Tap to sign" /> : (() => {
                                const uri = resolvePreviewUri(row.sign3);
                                if (uri) return (<View style={{ alignItems: 'center', justifyContent: 'center' }}><SignatureThumb uri={uri} width={80} height={48} layers={10} spread={1.2} /></View>);
                                return <Text style={styles.readOnlyCell}>{row.sign3}</Text>;
                            })()}</View>

                            {/* Staff Name */}
                            <View style={[styles.cell, { flex: COL_FLEX.STAFF_NAME }]}>
                                {editMode ? <TextInput style={styles.input} value={row.staffName} onChangeText={v => setCell(ri, 'staffName', v)} placeholder="Name" /> : <Text style={styles.readOnlyCell}>{row.staffName}</Text>}
                            </View>
                        </View>
                    ))}
                </View>

                {/* --- 3. Footer Section (Re-added) --- */}
                <View style={styles.footerSection}>
                    <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 12 }}>CHEF Signature:</Text>
                        {editMode ? (
                            <SignatureField value={meta.chefSignature} onChange={v => setMetaField('chefSignature', v)} editable={editMode} width={260} height={80} />
                        ) : (
                            (() => {
                                const uri = resolvePreviewUri(meta.chefSignature);
                                return uri ? <SignatureThumb uri={uri} width={260} height={80} layers={14} spread={1.6} /> : <Text style={styles.signatureInput}>{meta.chefSignature || ''}</Text>;
                            })()
                        )}
                    </View>

                    <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 12 }}>Corrective Action:</Text>
                        <TextInput style={[styles.textarea, { fontSize: 14 }]} value={meta.correctiveAction} onChangeText={v => setMetaField('correctiveAction', v)} placeholder="Document corrective action" multiline numberOfLines={3} />
                    </View>

                    <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 12 }}>COMPLEX Manager Signature:</Text>
                        {editMode ? (
                            <SignatureField value={meta.complexManagerSignature} onChange={v => setMetaField('complexManagerSignature', v)} editable={editMode} width={260} height={80} />
                        ) : (
                            (() => {
                                const uri = resolvePreviewUri(meta.complexManagerSignature);
                                return uri ? <SignatureThumb uri={uri} width={260} height={80} layers={14} spread={1.6} /> : <Text style={styles.signatureInput}>{meta.complexManagerSignature || ''}</Text>;
                            })()
                        )}
                    </View>

                    {/* Removed duplicate decorative "Verified by" label - signatures are shown above */}
                </View>

                {/* spacer so content can scroll above the floating actionButtons */}
                <View style={{ height: 110 }} />

            </ScrollView>
        </View>
        </EditableFormContainer>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7fbfc' },
    content: { padding: 12 },
    
    // --- Metadata Styles (Adjusted to closely match the image structure) ---
    metaContainer: {
        borderWidth: 2,
        borderColor: '#333',
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    metaHeaderBox: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        padding: 4,
        borderBottomWidth: 1,
        borderColor: '#333'
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', width: '50%' },
    logoImage: { width: 56, height: 56, marginRight: 8 },

    brandTextWrap: { flexDirection: 'column', flexShrink: 1, justifyContent: 'center' },
    brandTitle: { fontSize: 12, fontWeight: '700', color: '#333' },
    brandSubtitle: { fontSize: 10, color: '#444', fontWeight: '500' },

    docInfoGrid: {
        width: '40%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderWidth: 1,
        borderColor: '#333',
        fontSize: 10,
        alignSelf: 'flex-start',
    },
    docInfoHalf: { width: '50%' },
    docInfoLabel: { 
        padding: 2, 
        fontWeight: '700', 
        borderRightWidth: 1, 
        borderBottomWidth: 1, 
        borderColor: '#333', 
        textAlign: 'left'
    },
    docInfoValue: { 
        padding: 2, 
        fontWeight: '400', 
        borderBottomWidth: 1, 
        borderColor: '#333', 
        textAlign: 'left'
    },
    noBorderBottom: { borderBottomWidth: 0 },
    
    pageInfoBox: {
        position: 'absolute',
        top: 0,
        right: 0,
        padding: 4,
        borderLeftWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#333',
        height: 58, 
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    pageInfoText: {
        fontSize: 10,
        fontWeight: '700',
    },

    metaSubjectRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
    },
    metaSubjectText: { fontWeight: '700', fontSize: 10, padding: 4, flex: 0.5 },
    metaSubjectValue: { fontSize: 10, padding: 4, flex: 4, borderRightWidth: 1, borderColor: '#333' },
    metaVersionText: { fontWeight: '700', fontSize: 10, padding: 4, flex: 1.2 },
    metaVersionValue: { fontSize: 10, padding: 4, flex: 1, borderRightWidth: 1, borderColor: '#333' },
    metaRevText: { fontWeight: '700', fontSize: 10, padding: 4, flex: 0.8 },
    metaRevValue: { fontSize: 10, padding: 4, flex: 0.8 },
    
    metaCompiledRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    metaRowItem: {
        padding: 4, 
        borderRightWidth: 1,
        borderColor: '#333',
    },
    metaCompiledLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    metaCompiledValue: { fontSize: 12, fontWeight: '500', marginTop: 2, textTransform: 'uppercase' },


    // --- Table Styles ---
    tableWrap: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#333', overflow: 'hidden' },
    tableTitle: { 
        fontSize: 14, 
        fontWeight: '800', 
        textAlign: 'center', 
        paddingVertical: 6, 
        borderBottomWidth: 2, 
        borderColor: '#333', 
        textTransform: 'uppercase' 
    },
    logHeaderRow1: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 4,
        borderBottomWidth: 1,
        borderColor: '#333',
        backgroundColor: '#f9f9f9',
    },
    logHeaderRow1Text: {
        fontSize: 10,
        fontWeight: '700',
    },
    tableHeaderRow: { 
        flexDirection: 'row', 
        backgroundColor: '#f3f5f7', 
        paddingVertical: 0,
    },
    groupHeader: {
        borderBottomWidth: 1,
        borderColor: '#333',
    },
    detailHeader: {
        borderBottomWidth: 2,
        borderColor: '#333',
    },
    instructionBox: {
        padding: 4, 
        alignItems: 'center',
    },
    instructionText: {
        textAlign: 'center', 
        fontWeight: 'bold', 
        fontSize: 9, 
        textTransform: 'none'
    },
    hCell: { 
        paddingVertical: 4, 
        paddingHorizontal: 2, 
        justifyContent: 'center', 
        alignItems: 'center',
    },
    hText: { 
        fontWeight: '800', 
        fontSize: 8, 
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    borderRight: { borderRightWidth: 1, borderRightColor: '#333' },

    // --- Data Row Styles ---
    row: { 
        flexDirection: 'row', 
        borderBottomWidth: 1, 
        borderColor: '#ddd', 
        minHeight: 38 
    },
    cell: { 
        padding: 1, 
        justifyContent: 'center', 
    },
    input: { 
        padding: 2, 
        fontSize: 10, 
        textAlign: 'center', 
        minHeight: 36,
        color: '#444',
    },
    readOnlyCell: { paddingVertical: 6, paddingHorizontal: 4, textAlign: 'center', fontSize: 12, color: '#333' },
    
    // --- Footer Styles (Re-added) ---
    footerSection: { marginTop: 12, marginBottom: 12, paddingHorizontal: 4 },
    signatureInput: { borderBottomWidth: 1, borderColor: '#333', padding: 6, minHeight: 36, fontSize: 12 },
    textarea: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6, textAlignVertical: 'top', fontSize: 12 },

    // --- Button Styles ---
    buttonRow: { 
        flexDirection: 'row', 
        justifyContent: 'flex-end', 
        paddingVertical: 12, 
        paddingHorizontal: 4, 
        gap: 8 
    },
    btn: { 
        paddingVertical: 10, 
        paddingHorizontal: 16, 
        borderRadius: 8, 
        elevation: 3, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.25, 
        shadowRadius: 3.84 
    },
    btnText: { color: '#fff', fontWeight: '700' },
});

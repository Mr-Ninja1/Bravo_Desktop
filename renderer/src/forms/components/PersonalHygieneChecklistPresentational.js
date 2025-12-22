import React from 'react';
import { ScrollView, View, Text, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

// Exact numeric widths used by the editable form
const columnWidths = {
	date: 70,
	name: 180,
	check: 75,
	comment: 140,
	checkedBy: 110,
};
const totalWidth = columnWidths.date + columnWidths.name + (columnWidths.check * 10) + columnWidths.comment + columnWidths.checkedBy;

export default function PersonalHygieneChecklistPresentational({ payload, embedded = false }) {
	if (!payload) return null;
	const p = payload.payload || payload;
	const meta = p.metadata || {};
	const rows = Array.isArray(p.formData) ? p.formData : [];

	const Root = embedded ? View : ScrollView;
	const rootProps = embedded ? { style: styles.container } : { contentContainerStyle: styles.container };

		return (
			<Root {...rootProps}>
				<View style={styles.headerRowTop}>
					<View style={styles.leftHeader}>
						<Image source={require('../../assets/logo.jpeg')} style={styles.logo} />
						<View style={styles.companyBlock}>
							<Text style={styles.company}>BRAVO BRANDS LIMITED</Text>
							<Text style={styles.system}>Food Safety Management System</Text>
						</View>
					</View>

					<View style={styles.centerHeader}>
						<Text style={styles.formTitle}>{p.title || 'Personal Hygiene Checklist'}</Text>
					</View>

					<View style={styles.headerRight}>
						<Text style={styles.metaText}><Text style={styles.bold}>Issue Date:</Text> {meta.issueDate || p.savedAt || ''}</Text>
						<Text style={styles.metaText}><Text style={styles.bold}>Page</Text> 1 of 1</Text>
					</View>
				</View>

				<Text style={styles.subject}><Text style={styles.bold}>Subject:</Text> Personnel Hygiene Checklist</Text>

			<View style={styles.infoRowTop}>
					<Text style={styles.infoText}><Text style={styles.bold}>Compiled By:</Text> {meta.compiledBy || ''}</Text>
					<Text style={styles.infoText}><Text style={styles.bold}>Approved By:</Text> {meta.approvedBy || 'Hassani Ali'}</Text>
			</View>

					{/* make the table horizontally scrollable inside the saved-modal */}
					<ScrollView horizontal contentContainerStyle={{ minWidth: totalWidth + 20 }}>
						<View style={[styles.tableWrapper, { width: totalWidth + 20 }]}>
							<View style={styles.tableHeaderRow}>
					<Text style={[styles.headerCell, { width: columnWidths.date, minHeight: 70 }]}>DATE</Text>
					<Text style={[styles.headerCell, { width: columnWidths.name, minHeight: 70 }]}>NAME</Text>

					<Text style={[styles.headerCell, { width: columnWidths.check, minHeight: 70 }]}>HAIR{"\n"}COVER{"\n"}?</Text>
					<Text style={[styles.headerCell, { width: columnWidths.check, minHeight: 70 }]}>SHORT{"\n"}NAILS{"\n"}?</Text>
					<Text style={[styles.headerCell, { width: columnWidths.check, minHeight: 70 }]}>WORK{"\n"}SUIT{"\n"}?</Text>
					<Text style={[styles.headerCell, { width: columnWidths.check, minHeight: 70 }]}>ANY{"\n"}JEWELLERY{"\n"}?</Text>
					<Text style={[styles.headerCell, { width: columnWidths.check, minHeight: 70 }]}>ANY{"\n"}LIPSTICK{"\n"}?</Text>
					<Text style={[styles.headerCell, { width: columnWidths.check, minHeight: 70 }]}>PERSISTENT{"\n"}DIARRHOEA{"\n"}?</Text>
					<Text style={[styles.headerCell, { width: columnWidths.check, minHeight: 70 }]}>PERSISTENT{"\n"}COUGH{"\n"}?</Text>
					<Text style={[styles.headerCell, { width: columnWidths.check, minHeight: 70 }]}>RUNNING{"\n"}NOSE{"\n"}?</Text>
					<Text style={[styles.headerCell, { width: columnWidths.check, minHeight: 70 }]}>SKIN{"\n"}INFECTION{"\n"}?</Text>
					<Text style={[styles.headerCell, { width: columnWidths.check, minHeight: 70 }]}>OPEN{"\n"}WOUND{"\n"}?</Text>

					<Text style={[styles.headerCell, { width: columnWidths.comment, minHeight: 70 }]}>COMMENT</Text>
					<Text style={[styles.headerCell, { width: columnWidths.checkedBy, minHeight: 70 }]}>CHECKED{"\n"}BY?</Text>
							</View>

									{rows.map((r, idx) => (
								<View key={r.id || idx} style={styles.tableRow}>
						<Text style={[styles.cell, { width: columnWidths.date }]}>{r.date || ''}</Text>
						<Text style={[styles.cellLeft, { width: columnWidths.name }]}>{r.name || ''}</Text>

						{['hairCover','shortNails','workSuit','jewellery','lipstick','persistentDiarrhoea','persistentCough','runningNose','skinInfection','openWound'].map((k, i) => {
							const v = r[k];
							const disp = v === 'tick' ? '✔️' : (v === 'cross' ? '✖️' : '');
							return <Text key={`c-${i}`} style={[styles.cell, { width: columnWidths.check }]}>{disp}</Text>;
						})}

										<Text style={[styles.cell, { width: columnWidths.comment }]}>{r.comment || ''}</Text>
										<Text style={[styles.cell, { width: columnWidths.checkedBy }]}>{r.checkedBy || ''}</Text>
									</View>
								))}
							</View>
						</ScrollView>
    
										{/* Footer signatures: HSEQ MANAGER and Supervisor */}
										<View style={styles.footerSignaturesRow}>
											<View style={styles.signatureBlock}>
												<Text style={styles.footerLabel}>HSEQ MANAGER SIGN</Text>
												{meta.hseqSign ? (
													<SignatureThumb uri={String(meta.hseqSign).startsWith('data:') ? meta.hseqSign : `data:image/png;base64,${meta.hseqSign}`} width={260} height={80} layers={6} spread={1.0} />
												) : (
													<Text style={styles.footerText}>..................................</Text>
												)}
											</View>

											<View style={styles.signatureBlock}>
												<Text style={styles.footerLabel}>SUPERVISOR SIGN</Text>
												{meta.supervisorSign ? (
													<SignatureThumb uri={String(meta.supervisorSign).startsWith('data:') ? meta.supervisorSign : `data:image/png;base64,${meta.supervisorSign}`} width={260} height={80} layers={6} spread={1.0} />
												) : (
													<Text style={styles.footerText}>..................................</Text>
												)}
											</View>
										</View>
		</Root>
	);
}

const styles = StyleSheet.create({
	container: { padding: 12, backgroundColor: '#fff' },
	headerRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
	logoWrap: { width: 72, alignItems: 'flex-start' },
	logo: { width: 64, height: 48, resizeMode: 'contain' },
		/* left side: logo + company block */
		leftHeader: { flexDirection: 'row', alignItems: 'center', flex: 1 },
		companyBlock: { marginLeft: 8 },
		titleWrap: { flex: 1, alignItems: 'center' },
		company: { fontWeight: '900', fontSize: 14 },
		system: { fontSize: 11, color: '#666' },
		/* center header: form title */
		centerHeader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
		formTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center' },
	headerRight: { width: 140, alignItems: 'flex-end' },
	metaText: { fontSize: 12 },
	subject: { fontSize: 12, marginBottom: 6 },
	infoRowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
	infoText: { fontSize: 12 },

	tableWrapper: { borderWidth: 1, borderColor: '#000', overflow: 'hidden' },
	tableHeaderRow: { flexDirection: 'row', backgroundColor: '#eee', borderBottomWidth: 1, borderColor: '#000' },
	headerCell: { padding: 6, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center', fontWeight: '700' },
	tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' },
	cell: { padding: 6, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center', fontSize: 12 },
	cellLeft: { padding: 6, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'left', fontSize: 12 },
	bold: { fontWeight: '700' },
	footerSignaturesRow: { flexDirection: 'row', justifyContent: 'flex-start', marginTop: 12, gap: 24 },
	signatureBlock: { flexDirection: 'column', alignItems: 'flex-start' },
	footerLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
	footerText: { fontSize: 12 },
});


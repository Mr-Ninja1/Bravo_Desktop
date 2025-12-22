import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

const normalizeSignature = (v) => {
  if (!v) return null;
  // If already an object with uri, use it
  if (typeof v === 'object' && v.uri) return v.uri;
  if (typeof v !== 'string') return null;
  const s = v;
  // already a data URI or http/file URL
  if (s.startsWith('data:') || s.startsWith('http:') || s.startsWith('https:') || s.startsWith('file:')) return s;
  // compact base64 (legacy storage might contain raw base64 blobs)
  const compact = s.replace(/\s+/g, '');
  if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
};

// Presentational (read-only) renderer for Food Handlers Daily Handwashing form
// Accepts a `payload` prop that matches the shape produced by the editable form
// No export width constraint
export default function FoodHandlersPresentational({ payload, exportingWide = false }) {
  if (!payload) return null;

  const {
    title = 'Food Handlers Daily Handwashing Tracking Log Sheet',
    date = '',
    location = '',
    shift = '',
    verifiedBy = '',
    complexManagerSign = '',
    timeSlots = [],
    handlers = [],
    layoutHints = {},
    assets = {},
  } = payload;

  const get = (key) => {
    if (payload?.formData && Object.prototype.hasOwnProperty.call(payload.formData, key)) return payload.formData[key];
    if (payload?.metadata && Object.prototype.hasOwnProperty.call(payload.metadata, key)) return payload.metadata[key];
    if (Object.prototype.hasOwnProperty.call(payload, key)) return payload[key];
    return '';
  };

  // Try several common places and alternate key names to find a signature value.
  const findSignature = (baseKey) => {
    const variants = [baseKey, `${baseKey}Sign`, `${baseKey}Signature`, `${baseKey}sign`, `${baseKey}signature`];
    const containers = [payload, payload?.formData, payload?.metadata];
    for (const c of containers) {
      if (!c) continue;
      for (const k of variants) {
        if (Object.prototype.hasOwnProperty.call(c, k) && c[k]) return c[k];
      }
    }
    // deep scan: sometimes signatures are nested under metadata.formData or similar
    try {
      const scan = JSON.stringify(payload || {});
      // quick heuristic: if baseKey appears in JSON, try to extract it via regex for data: URIs
      const re = new RegExp(`(data:[^\"]{50,})`, 'g');
      const m = re.exec(scan);
      if (m && m[1]) return m[1];
    } catch (e) { /* ignore */ }
    return '';
  };

  // Use layoutHints when provided to better match saved proportions
  let nameW = layoutHints.nameW || 140;
  let jobW = layoutHints.jobW || 100;
  let signW = layoutHints.signW || 80;
  let timeW = 48;
  let tableW = 40 + nameW + jobW + (timeSlots.length * timeW) + signW * 3;

  // Proportional shrink for export
  const TARGET_EXPORT_WIDTH = 700;
  let scale = 1;
  if (exportingWide && tableW > TARGET_EXPORT_WIDTH) {
    scale = TARGET_EXPORT_WIDTH / tableW;
    nameW = Math.round(nameW * scale);
    jobW = Math.round(jobW * scale);
    signW = Math.round(signW * scale);
    timeW = Math.round(timeW * scale);
    tableW = TARGET_EXPORT_WIDTH;
  }

  const renderSignatureCell = (val, w = signW, h = 60) => {
    const uri = normalizeSignature(val);
    if (uri) return <SignatureThumb uri={uri} width={w} height={h} layers={6} spread={0.9} />;
    return <Text style={styles.dataCell}>{''}</Text>;
  };

  // For export, allow horizontal scroll and do not shrink width
  const exportContainerStyle = exportingWide
    ? { padding: 12, backgroundColor: '#fff', width: '100%', alignSelf: 'stretch', alignItems: 'center' }
    : { padding: 12, backgroundColor: '#fff' };
  return (
    <ScrollView style={styles.container} horizontal={exportingWide} contentContainerStyle={exportContainerStyle}>
      <View>
        <View style={styles.logoRow}>
        {/* If an embedded logo exists, use it; otherwise fallback to local asset */}
        {assets && assets.logoDataUri ? (
          <Image source={{ uri: assets.logoDataUri }} style={styles.logo} resizeMode="contain" />
        ) : (
          <Image source={require('../../assets/logo.jpeg')} style={styles.logo} resizeMode="contain" />
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Text style={styles.companyNameLarge}>Bravo</Text>
        </View>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.formTitle}>{title}</Text>
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{date}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{location}</Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <Text style={styles.label}>Shift:</Text>
          <Text style={styles.value}>{shift}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.label}>Verified By:</Text>
          {/* Render verified signature as thumbnail when possible, otherwise show text */}
          {(() => {
            const v = findSignature('verifiedBy') || get('verifiedBy') || verifiedBy;
            const uri = normalizeSignature(v);
            if (uri) return <SignatureThumb uri={uri} width={140} height={60} layers={6} spread={0.9} />;
            return <Text style={styles.value}>{v}</Text>;
          })()}
        </View>
      </View>

      <View style={exportingWide ? [styles.tableScroll, { width: tableW, maxWidth: tableW, alignSelf: 'center' }] : styles.tableScroll}>
        <View style={exportingWide ? [styles.tableHeaderRow, { width: tableW, maxWidth: tableW }] : styles.tableHeaderRow}>
          <Text style={[styles.headerCell, styles.snCell]}>S/N</Text>
          <Text style={[styles.headerCell, { minWidth: nameW, width: nameW }]}>Full Name</Text>
          <Text style={[styles.headerCell, { minWidth: jobW, width: jobW }]}>Job Title</Text>
          {timeSlots.map((t) => (
            <Text key={t} style={[styles.headerCell, { minWidth: timeW, width: timeW }]}>{t}</Text>
          ))}
          <Text style={[styles.headerCell, { minWidth: signW, width: signW }]}>Staff Sign</Text>
          <Text style={[styles.headerCell, { minWidth: signW, width: signW }]}>Sup Name</Text>
          <Text style={[styles.headerCell, { minWidth: signW, width: signW }]}>Sup Sign</Text>
        </View>

        {handlers.map((row, idx) => (
          <View key={idx} style={exportingWide ? [styles.tableRow, { width: tableW, maxWidth: tableW }] : styles.tableRow}>
            <Text style={[styles.dataCell, styles.snCell, exportingWide ? { width: Math.round(40 * scale), minWidth: Math.round(40 * scale) } : {}]}>{row.id || idx + 1}</Text>
            <Text style={[styles.dataCell, exportingWide ? { width: nameW, minWidth: nameW } : { minWidth: nameW, width: nameW }]}>{row.fullName}</Text>
            <Text style={[styles.dataCell, exportingWide ? { width: jobW, minWidth: jobW } : { minWidth: jobW, width: jobW }]}>{row.jobTitle}</Text>
            {timeSlots.map((time) => (
              <Text key={time} style={[styles.dataCell, exportingWide ? { width: timeW, minWidth: timeW } : { minWidth: timeW, width: timeW }]}>{row.checks && row.checks[time] ? '\u2611' : '\u2610'}</Text>
            ))}
            <View style={[exportingWide ? { width: signW, minWidth: signW, alignItems: 'center' } : { minWidth: signW, width: signW, alignItems: 'center' }]}>{row.staffSign ? renderSignatureCell(row.staffSign, signW - 8, 44) : <Text style={styles.dataCell}>{''}</Text>}</View>
            <Text style={[styles.dataCell, exportingWide ? { width: signW, minWidth: signW } : { minWidth: signW, width: signW }]}>{row.supName}</Text>
            <View style={[exportingWide ? { width: signW, minWidth: signW, alignItems: 'center' } : { minWidth: signW, width: signW, alignItems: 'center' }]}>{row.supSign ? renderSignatureCell(row.supSign, signW - 8, 44) : <Text style={styles.dataCell}>{''}</Text>}</View>
          </View>
        ))}
      </View>

  <View style={styles.footerRow}>
  </View>
        <Text style={styles.footerLabel}>Complex Manager:</Text>
        {(() => {
          const cm = findSignature('complexManager') || findSignature('complexManagerSign') || get('complexManagerSign') || complexManagerSign;
          const uri = normalizeSignature(cm);
          if (uri) return <SignatureThumb uri={uri} width={200} height={80} layers={6} spread={0.9} />;
          return <Text style={styles.footerValue}>{cm}</Text>;
        })()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff' },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  logo: { width: 48, height: 48, marginRight: 12, borderRadius: 8, backgroundColor: '#fff' },
  titleRow: { alignItems: 'center', marginBottom: 8 },
  formTitle: { fontSize: 16, fontWeight: '800', color: '#1f2937' },
  companyNameSmall: { fontSize: 14, fontWeight: '800', color: '#185a9d' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailItem: { flex: 1, paddingRight: 8 },
  label: { fontWeight: '700', color: '#185a9d', marginBottom: 4 },
  value: { backgroundColor: '#f6f8fa', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e0e0e0' },
  tableScroll: { marginTop: 12 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#eef3fb', paddingVertical: 8, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e6e6e6', paddingVertical: 8, alignItems: 'center' },
  headerCell: { fontWeight: '700', fontSize: 12, paddingHorizontal: 6, textAlign: 'center' },
  dataCell: { fontSize: 12, paddingHorizontal: 6, textAlign: 'center' },
  snCell: { minWidth: 40, width: 40 },
  nameCell: { minWidth: 130, maxWidth: 260 },
  jobCell: { minWidth: 100, maxWidth: 160 },
  timeCell: { minWidth: 48, width: 48 },
  signCell: { minWidth: 80, width: 80 },
  supCell: { minWidth: 80, width: 80 },
  footerRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  footerLabel: { fontWeight: '700', color: '#185a9d', marginRight: 8 },
  footerValue: { backgroundColor: '#f6f8fa', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e0e0e0' },
});

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

export default function KitchenDailyCleaningPresentational({ payload }) {
  if (!payload) return null;
  const p = payload.payload || payload;
  const { metadata = {}, formData = [], layoutHints = {}, _tableWidth } = p;
  const COL = layoutHints || {};

  // Determine time slots list from payload (preserve original order), fallback to default 11 slots
  const DEFAULT_SLOTS = ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'];
  // Prefer an explicit `timeSlots` array saved in the payload. If absent,
  // fall back to inspecting the first row's `times` keys (preserve order).
  // Only use the DEFAULT_SLOTS as a last resort.
  let timesList = DEFAULT_SLOTS;
  if (Array.isArray(p.timeSlots) && p.timeSlots.length) {
    timesList = p.timeSlots;
  } else {
    for (let i = 0; i < formData.length; i++) {
      const row = formData[i];
      if (row && row.times && typeof row.times === 'object') {
        const keys = Object.keys(row.times);
        if (keys.length > 0) {
          // preserve the keys order as-is; if they look like times, use them
          timesList = keys;
          break;
        }
      }
    }
  }
  const perTimeWidth = COL.TIME_SLOT || 56;

  // normalize signature values into a previewable uri (data:..., http(s)://, file:, blob:, or {uri}/{data})
  const resolveSignatureUri = (val) => {
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
    const base64ish = /^[A-Za-z0-9+/=\s]+$/;
    const compact = s.replace(/\s+/g, '');
    if (compact.length > 100 && base64ish.test(compact)) return `data:image/png;base64,${compact}`;
    return null;
  };

  return (
    <ScrollView contentContainerStyle={styles.container} nestedScrollEnabled={true}>
      <View style={styles.card}>
        <Text style={{ padding: 12 }}>Kitchen Daily Cleaning (preview)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff' },
  card: { backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd', paddingBottom: 6 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  logoWrap: { width: 72, height: 72, justifyContent: 'center', alignItems: 'center' },
  logo: { width: 64, height: 48, resizeMode: 'contain' },
  companyText: { fontSize: 16, fontWeight: '800', marginLeft: 8 },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: '#111' },
  table: { borderWidth: 1, borderColor: '#4B5563' },
  headerRowDark: { flexDirection: 'row', backgroundColor: '#f3f4f6' },
  headerCell: { padding: 6, borderRightWidth: 1, borderRightColor: '#e6e6e6', alignItems: 'center', justifyContent: 'center' },
  headerText: { color: '#111', fontWeight: '700' },
  timeHeaderCell: { padding: 4, borderRightWidth: 1, borderRightColor: '#e6e6e6', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7f7f7' },
  timeHeaderText: { color: '#111', fontSize: 10 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ddd', minHeight: 36, alignItems: 'center' },
  cell: { padding: 6, borderRightWidth: 1, borderRightColor: '#ddd', justifyContent: 'center' },
  timeBox: { padding: 6, borderRightWidth: 1, borderRightColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  checkMark: { fontSize: 14, fontWeight: '700', color: '#008000' },
  areaText: { fontSize: 12 }
});

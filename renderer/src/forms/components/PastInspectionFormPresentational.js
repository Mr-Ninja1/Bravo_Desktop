import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Animated, Easing } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

export default function PastInspectionFormPresentational({ payload }) {
  if (!payload) return null;
  const p = payload.payload || payload;
  const meta = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : [];
  const logoDataUri = p.assets && p.assets.logoDataUri;

  // prefer explicit widths from payload.layoutHints so saved presentational matches editor
  const hints = p.layoutHints || {};
  const widths = [
    hints.DATE || 48,
    hints.AREA || 140,
    hints.TYPE || 80,
    hints.QTY || 48,
    hints.COMMENT || 215,
    hints.INSPECTOR || 100,
    hints.SIGN || 128,
  ];

  const wiggle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // small horizontal oscillation: -3..+3 px
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(wiggle, { toValue: 1, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: -1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: 0, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [wiggle]);

  const translateX = wiggle.interpolate({ inputRange: [-1, 0, 1], outputRange: [-3, 0, 3] });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        {logoDataUri ? (
          <Image source={{ uri: logoDataUri }} style={styles.logo} resizeMode="contain" />
        ) : (
          <Image source={require('../../assets/logo.jpeg')} style={styles.logo} resizeMode="contain" />
        )}
        <View>
          <Text style={styles.title}>Pest Inspection Form</Text>
          <Text style={styles.subtitle}>{meta.companySubtitle || ''}</Text>
        </View>
      </View>

      {/* Approved By display (show signature if available) */}
      <View style={styles.headerMetaRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.metaLabel}>Approved By:</Text>
          {(() => {
            const v = meta.approvedBySign || meta.approvedBy || '';
            const uri = v ? (String(v).startsWith('data:') ? v : (String(v).length > 100 ? `data:image/png;base64,${String(v).replace(/\s+/g, '')}` : null)) : null;
            return uri ? <SignatureThumb uri={uri} width={200} height={60} layers={6} spread={1.0} /> : <Text style={styles.metaLabel}>{String(meta.approvedBy || '')}</Text>;
          })()}
        </View>
      </View>

      <Animated.View style={[styles.table, { transform: [{ translateX }] }] }>
        <View style={styles.tableHeader}>
          {['Date','Area Inspected','Type','Qty','Comment/Corrective Action Taken','Name of Inspector','Complex Manager\'s Sign'].map((h, i) => (
            <View key={h} style={[styles.headerCell, { width: widths[i], borderRightWidth: i === widths.length -1 ? 0 : 1 }]}> 
              <Text style={styles.colHeader}>{h}</Text>
            </View>
          ))}
        </View>

        {rows.map(r => (
          <View key={r.id} style={styles.row}>
              <View style={[styles.dataCell, { width: widths[0], borderRightWidth: 1 }]}> 
                <Text style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">{r.dateLabel}</Text>
              </View>
              <View style={[styles.dataCell, { width: widths[1], borderRightWidth: 1 }]}> 
                <Text style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">{r.area}</Text>
              </View>
              <View style={[styles.dataCell, { width: widths[2], borderRightWidth: 1 }]}> 
                <Text style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">{r.type}</Text>
              </View>
              <View style={[styles.dataCell, { width: widths[3], borderRightWidth: 1 }]}> 
                <Text style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">{r.qty}</Text>
              </View>
              <View style={[styles.dataCell, { width: widths[4], borderRightWidth: 1 }]}> 
                <Text style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">{r.comment}</Text>
              </View>
              <View style={[styles.dataCell, { width: widths[5], borderRightWidth: 1 }]}> 
                <Text style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">{r.inspector}</Text>
              </View>
              <View style={[styles.dataCell, { width: widths[6], borderRightWidth: 0 }]}> 
                {(() => {
                  const v = r.sign;
                  const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
                  return uri ? <SignatureThumb uri={uri} width={Math.max(72, widths[6] - 12)} height={60} layers={5} spread={0.8} /> : <Text style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">{r.sign}</Text>;
                })()}
              </View>
          </View>
        ))}
      </Animated.View>
      <View style={styles.verificationFooter}>
        <Text style={styles.verificationText}>VERIFIED BY</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginTop: 6 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.metaLabel}>HSEQ Manager</Text>
            {(() => {
              const v = meta.hseqManagerSign || meta.hseqManager || '';
              const uri = v ? (String(v).startsWith('data:') ? v : (String(v).length > 100 ? `data:image/png;base64,${String(v).replace(/\s+/g, '')}` : null)) : null;
              return uri ? <SignatureThumb uri={uri} width={220} height={80} layers={6} spread={1.0} /> : <Text style={styles.metaLabel}>{String(meta.hseqManager || '')}</Text>;
            })()}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logo: { width: 56, height: 56, marginRight: 12 },
  title: { fontWeight: '700', fontSize: 16 },
  subtitle: { fontSize: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metaLabel: { fontSize: 12 },
  headerMetaRow: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 8 },
  verificationFooter: { marginTop: 12 },
  verificationText: { fontWeight: '700', fontSize: 12, marginBottom: 6 },

  // table container: solid border around the table for print
  table: { borderWidth: 1, borderColor: '#000', overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#eee', borderBottomWidth: 1, borderColor: '#000' },
  headerCell: { justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8, paddingVertical: 10, borderRightColor: '#000' },
  colHeader: { fontWeight: '700', fontSize: 12, textAlign: 'left' },

  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', alignItems: 'center', minHeight: 36 },
  dataCell: { justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 6, borderRightColor: '#000' },
  cellText: { textAlign: 'left', fontSize: 12 },
});

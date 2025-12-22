import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';

export default function CustomerSatisfactionQuestionnairePresentational({ payload }) {
  const p = (payload && (payload.payload || payload)) || {};
  const data = p.formData || {};
  const sections = data.sections || [];
  const logoDataUri = p.assets && p.assets.logoDataUri;
  const hints = p.layoutHints || {};
  const qWidth = hints.QUESTION || 520;
  const aWidth = hints.ANSWER || 80;
  const gap = hints.gap || 8;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        {logoDataUri ? <Image source={{ uri: logoDataUri }} style={styles.logo} resizeMode="contain" /> : <Image source={require('../../assets/logo.jpeg')} style={styles.logo} resizeMode="contain" />}
        <View style={styles.headerMeta}>
          <Text style={styles.company}>{data.companyName || 'Bravo'}</Text>
          <Text style={styles.subject}>{data.subject || 'Customer Satisfaction Questionnaire'}</Text>
          <Text style={styles.meta}>{data.issueDate || ''} {data.formTime ? `· ${data.formTime}` : ''}</Text>
        </View>
      </View>

      <View style={styles.table}>
        {sections.map((s, si) => (
          <View key={si} style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            {s.questions.map(q => (
              <View key={q.id} style={[styles.questionRowFixed, { marginBottom: gap }]}> 
                <View style={[styles.questionCell, { width: qWidth }]}>
                  <Text style={styles.questionText} numberOfLines={2} ellipsizeMode="tail">{q.text}</Text>
                </View>
                <View style={[styles.answerCell, { width: aWidth }]}> 
                  <Text style={styles.answerText}>{q.rating || ''}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Text style={styles.label}>Customer:</Text>
          <Text style={styles.value}>{data.customerName || ''}</Text>
        </View>
        <View style={styles.footerRow}>
          <Text style={styles.label}>Comments:</Text>
          <Text style={styles.value}>{data.otherComment || ''}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  logo: { width: 72, height: 36, marginRight: 12 },
  headerMeta: { flex: 1 },
  company: { fontSize: 20, fontWeight: '800', color: '#185a9d' },
  subject: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  meta: { color: '#666', marginTop: 4 },
  table: { marginTop: 8 },
  sectionBlock: { marginBottom: 12 },
  sectionTitle: { fontWeight: '800', marginBottom: 8, fontSize: 14 },
  questionRowFixed: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 8, borderWidth: 1, borderColor: '#eee', borderRadius: 6 },
  questionCell: { paddingRight: 12 },
  questionText: { fontSize: 14, color: '#222' },
  answerCell: { justifyContent: 'center', alignItems: 'center' },
  answerText: { fontWeight: '700', fontSize: 14 },
  footer: { marginTop: 12 },
  footerRow: { flexDirection: 'row', marginTop: 8 },
  label: { fontWeight: '700', marginRight: 8, minWidth: 100 },
  value: { flex: 1 }
});

import React from 'react';
import { ScrollView, View, Text, StyleSheet, Image } from 'react-native';

export default function CustomerSatisfactionPresentational({ payload }) {
  if (!payload) return null;
  const data = payload.formData || {};
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}><Image source={require('../../assets/logo.jpeg')} style={styles.logo} /><Text style={styles.title}>{data.subject}</Text></View>
      <View style={styles.section}><Text>Customer: {data.customerName}</Text><Text>Contact: {data.contactInfo}</Text></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({ container:{padding:12}, header:{flexDirection:'row',alignItems:'center'}, logo:{width:48,height:48,marginRight:8}, title:{fontWeight:'700'}, section:{marginTop:8} });

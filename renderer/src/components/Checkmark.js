import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Checkmark({ size = 18 }) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.check, { fontSize: size }]}>✔︎</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: 'center', alignItems: 'center' },
  check: { color: '#10B981', fontWeight: '800' }
});

import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';

export default function ResponsiveTable({ children, horizontal = true, style }) {
  if (horizontal) {
    return (
      <ScrollView horizontal contentContainerStyle={[styles.hWrap, style]}>
        <View>{children}</View>
      </ScrollView>
    );
  }
  return <View style={[styles.wrap, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  hWrap: { alignItems: 'flex-start' },
  wrap: { width: '100%' }
});

import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

export default function SignatureThumb({ uri, width = 140, height = 44, layers = 3, spread = 0.6 }) {
  if (!uri) return null;
  const offsets = [];
  const mid = Math.floor(layers / 2);
  for (let i = 0; i < layers; i++) {
    const x = (i - mid) * spread;
    const y = ((i % 2) - 0.5) * (spread / 2);
    offsets.push({ x, y });
  }

  return (
    React.createElement(View, { style: [styles.container, { width, height }] },
      offsets.map((o, i) => React.createElement(Image, { key: i, source: { uri }, style: [styles.image, { width, height, left: o.x, top: o.y }], resizeMode: "contain" }))
    )
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', overflow: 'hidden' },
  image: { position: 'absolute', top: 0, opacity: 1 },
});

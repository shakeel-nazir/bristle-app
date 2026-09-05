import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';

export default function GlassCard({ style, children, onPress, intensity = 40, tint = 'light' }) {
  return (
    <Pressable onPress={onPress} style={[styles.outer, style]}>
      <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFillObject} />
      <View style={styles.tintOverlay} pointerEvents="none" />
      <View style={styles.content}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  content: {
    flex: 1,
  },
});

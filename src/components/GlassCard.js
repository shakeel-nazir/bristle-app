import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';

export default function GlassCard({ style, children, onPress, intensity = 40, tint = 'light' }) {
  const borderRadius = (style && style.borderRadius) || 0;

  return (
    <View style={[styles.shadowWrap, style]}>
      <Pressable onPress={onPress} style={[styles.clip, { borderRadius }]}>
        <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFillObject} />
        <View style={styles.tintOverlay} pointerEvents="none" />
        <View style={styles.content}>{children}</View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    shadowColor: '#2E2A26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  clip: {
    flex: 1,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  content: {
    flex: 1,
  },
});

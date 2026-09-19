import React, { useRef } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { BlurView } from 'expo-blur';

export default function GlassCard({ style, children, onPress, intensity = 40, tint = 'light' }) {
  const borderRadius = (style && style.borderRadius) || 0;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scale, { toValue: 0.96, speed: 50, bounciness: 6, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scale, { toValue: 1, speed: 20, bounciness: 10, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[styles.shadowWrap, style, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.clip, { borderRadius }]}
      >
        <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFillObject} />
        <View style={styles.tintOverlay} pointerEvents="none" />
        <View style={styles.content}>{children}</View>
      </Pressable>
    </Animated.View>
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

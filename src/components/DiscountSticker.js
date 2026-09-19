import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';

export default function DiscountSticker({ percent, code }) {
  const scale = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    scale.setValue(0);
    rotate.setValue(0);
    Animated.sequence([
      Animated.spring(scale, { toValue: 1, speed: 14, bounciness: 18, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.timing(rotate, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(rotate, { toValue: 0.6, speed: 12, bounciness: 20, useNativeDriver: true }),
    ]).start();
  }, [percent, code, scale, rotate]);

  const rotateDeg = rotate.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: ['0deg', '6deg', '14deg'],
  });

  return (
    <Animated.View style={[styles.discountSticker, { transform: [{ scale }, { rotate: rotateDeg }] }]}>
      <Text style={styles.discountStickerPercent}>{percent}% OFF</Text>
      <Text style={styles.discountStickerCode}>Code {code} active</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  discountSticker: {
    position: 'absolute',
    top: 28,
    right: 20,
    zIndex: 10,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    shadowColor: '#2E2A26',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  discountStickerPercent: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.accentText,
  },
  discountStickerCode: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.accentText,
    marginTop: 1,
  },
});

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Linking, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import { buildGoogleCalendarUrl } from '../utils/calendar';
import Confetti from '../components/Confetti';
import AnimatedPressable from '../components/AnimatedPressable';

export default function SuccessScreen({ route, navigation }) {
  const { service, date, time, rawDate, address, deposit, balance } = route.params;
  const badgeScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(badgeScale, {
      toValue: 1,
      speed: 10,
      bounciness: 14,
      useNativeDriver: true,
    }).start();
  }, [badgeScale]);

  const handleAddToCalendar = () => {
    if (!rawDate) return;
    const url = buildGoogleCalendarUrl({ rawDate, time, service, address });
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Confetti trigger />

      <Animated.View style={[styles.badge, { transform: [{ scale: badgeScale }] }]}>
        <Ionicons name="checkmark" size={44} color="#FFFFFF" />
      </Animated.View>

      <Text style={styles.title}>Booking confirmed</Text>
      <Text style={styles.subtitle}>
        Your {service.name.toLowerCase()} is set for {date} at {time}. We've charged your ${deposit.toFixed(2)} deposit
        — the ${balance.toFixed(2)} balance is due after the clean. We will text you when your cleaner is on the way.
      </Text>

      {rawDate && (
        <AnimatedPressable style={styles.calendarButton} onPress={handleAddToCalendar}>
          <Text style={styles.calendarButtonText}>Add to Calendar</Text>
        </AnimatedPressable>
      )}

      <AnimatedPressable
        style={styles.button}
        onPress={() => navigation.popToTop()}
      >
        <Text style={styles.buttonText}>Back to home</Text>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  calendarButton: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  calendarButtonText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.accentText,
    fontSize: 15,
    fontWeight: '600',
  },
});

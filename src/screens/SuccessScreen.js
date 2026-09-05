import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';

export default function SuccessScreen({ route, navigation }) {
  const { service, date, time, deposit, balance } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.check}>✓</Text>
      <Text style={styles.title}>Booking confirmed</Text>
      <Text style={styles.subtitle}>
        Your {service.name.toLowerCase()} is set for {date} at {time}. We've charged your ${deposit.toFixed(2)} deposit
        — the ${balance.toFixed(2)} balance is due after the clean. We will text you when your cleaner is on the way.
      </Text>

      <Pressable
        style={styles.button}
        onPress={() => navigation.popToTop()}
      >
        <Text style={styles.buttonText}>Back to home</Text>
      </Pressable>
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
  check: {
    fontSize: 48,
    color: colors.primary,
    marginBottom: spacing.md,
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

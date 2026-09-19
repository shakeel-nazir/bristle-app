import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors, spacing, radius } from '../theme/theme';
import { useBooking } from '../context/BookingContext';
import GlassCard from '../components/GlassCard';
import AnimatedPressable from '../components/AnimatedPressable';
import { REFERRAL_DISCOUNT_PERCENT } from '../utils/referral';

export default function RedeemCodeScreen({ navigation }) {
  const { applyDiscountCode, discount } = useBooking();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    const result = applyDiscountCode(code);
    if (!result.success) {
      setError(result.message);
      return;
    }
    setError('');
    setApplied(true);
  };

  const handlePaste = async () => {
    try {
      const text =
        Platform.OS === 'web' && navigator?.clipboard?.readText
          ? await navigator.clipboard.readText()
          : await Clipboard.getStringAsync();
      if (text) {
        setCode(text.trim());
        if (error) setError('');
      }
    } catch (e) {
      setError("Couldn't access your clipboard — paste the code manually.");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient
        colors={colors.pageGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.content}>
        <GlassCard style={styles.backButton} intensity={30} onPress={() => navigation.goBack()}>
          <View style={styles.backButtonInner}>
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
          </View>
        </GlassCard>

        <Text style={styles.title}>Enter savings code</Text>
        <Text style={styles.subtitle}>Have a friend's referral code? Redeem it for {REFERRAL_DISCOUNT_PERCENT}% off.</Text>

        {applied ? (
          <GlassCard style={styles.successCard} intensity={45}>
            <View style={styles.successInner}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.successTitle}>Code applied!</Text>
              <Text style={styles.successMessage}>
                {discount?.percent}% off ({discount?.code}) will be applied automatically at checkout.
              </Text>
              <AnimatedPressable style={styles.doneButton} onPress={() => navigation.goBack()}>
                <Text style={styles.doneButtonText}>Done</Text>
              </AnimatedPressable>
            </View>
          </GlassCard>
        ) : (
          <>
            <GlassCard style={styles.inputCard} intensity={45}>
              <View style={styles.inputInner}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. JAMIE25"
                  placeholderTextColor={colors.textSecondary}
                  value={code}
                  onChangeText={(text) => {
                    setCode(text);
                    if (error) setError('');
                  }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <AnimatedPressable style={styles.pasteButton} onPress={handlePaste} scaleTo={0.9}>
                  <Ionicons name="clipboard-outline" size={16} color={colors.accent} style={{ marginRight: 4 }} />
                  <Text style={styles.pasteButtonText}>Paste</Text>
                </AnimatedPressable>
              </View>
            </GlassCard>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <AnimatedPressable style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply code</Text>
            </AnimatedPressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: 64,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: spacing.lg,
  },
  backButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  inputCard: {
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.text,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
  },
  pasteButtonText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  error: {
    color: '#A32D2D',
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  applyButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  applyButtonText: {
    color: colors.accentText,
    fontSize: 15,
    fontWeight: '600',
  },
  successCard: {
    borderRadius: radius.lg,
  },
  successInner: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  successIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3F8557',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  successTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  successMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  doneButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.xl,
  },
  doneButtonText: {
    color: colors.accentText,
    fontSize: 14,
    fontWeight: '600',
  },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import GlassCard from '../components/GlassCard';
import AnimatedPressable from '../components/AnimatedPressable';
import { getMyReferralCode, REFERRAL_DISCOUNT_PERCENT } from '../utils/referral';

export default function ReferScreen({ navigation }) {
  const code = getMyReferralCode();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Book your first clean with Bristle and get ${REFERRAL_DISCOUNT_PERCENT}% off using my code ${code}! 🧽`,
      });
    } catch (e) {
      // Sharing isn't available in this environment — nothing to do.
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.pageGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <GlassCard style={styles.backButton} intensity={30} onPress={() => navigation.goBack()}>
          <View style={styles.backButtonInner}>
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
          </View>
        </GlassCard>

        <Text style={styles.title}>Refer a Friend</Text>
        <Text style={styles.subtitle}>
          Share your code — your friend gets {REFERRAL_DISCOUNT_PERCENT}% off their first clean.
        </Text>

        <GlassCard style={styles.codeCard} intensity={45}>
          <View style={styles.codeInner}>
            <View style={styles.giftIcon}>
              <Ionicons name="gift-outline" size={22} color={colors.accent} />
            </View>
            <Text style={styles.codeLabel}>Your referral code</Text>
            <Text style={styles.code}>{code}</Text>
            <AnimatedPressable style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={16} color={colors.accentText} style={{ marginRight: 6 }} />
              <Text style={styles.shareButtonText}>Share code</Text>
            </AnimatedPressable>
          </View>
        </GlassCard>

        <Text style={styles.hint}>
          They save {REFERRAL_DISCOUNT_PERCENT}% at checkout — you'll see credit appear on your account once
          they've completed their first clean.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 64,
    paddingBottom: spacing.xl,
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
  codeCard: {
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  codeInner: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  giftIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: 'rgba(232,115,74,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  codeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  code: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  shareButton: {
    flexDirection: 'row',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    color: colors.accentText,
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
});

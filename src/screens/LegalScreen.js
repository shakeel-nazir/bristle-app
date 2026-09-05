import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import GlassCard from '../components/GlassCard';

const sections = [
  {
    title: 'Terms of Service',
    body:
      'By booking a clean through Bristle, you agree to provide accurate address and access details, ' +
      'be available (or arrange access) for the scheduled window, and pay the remaining balance once the ' +
      'clean is complete. A 50% deposit is charged at booking; cancellations affect deposit refunds per our policy.',
  },
  {
    title: 'Privacy Policy',
    body:
      'We collect only what is needed to schedule and deliver your clean: your name, address, and booking ' +
      'details. We do not sell your information. Address lookups are powered by OpenStreetMap/Nominatim and ' +
      'are not stored beyond your booking record.',
  },
  {
    title: 'Cancellation Policy',
    body:
      'You can cancel a scheduled clean any time from the home screen. Deposits secure your cleaner\'s time ' +
      'and are non-refundable within 24 hours of the appointment.',
  },
  {
    title: 'Service Area',
    body: 'Bristle currently operates in Ottawa, Ontario only. HST (13%) applies to all bookings.',
  },
];

export default function LegalScreen({ navigation }) {
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

        <Text style={styles.title}>Legal</Text>

        {sections.map((section) => (
          <GlassCard key={section.title} style={styles.card} intensity={45}>
            <View style={styles.cardInner}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          </GlassCard>
        ))}
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
    marginBottom: spacing.lg,
  },
  card: {
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  cardInner: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
});

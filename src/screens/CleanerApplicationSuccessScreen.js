import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import GlassCard from '../components/GlassCard';

const STEPS = [
  { label: 'Application Submitted', sublabel: 'Today', done: true },
  { label: 'Under Review', sublabel: "We're taking a look", current: true },
  { label: 'Interview', sublabel: 'A quick call with our team' },
  { label: 'Background Check', sublabel: 'Standard for all cleaners' },
  { label: 'Decision', sublabel: "We'll email you either way" },
];

const CURRENT_STEP_INDEX = 1;
const PROGRESS_PERCENT = Math.round((CURRENT_STEP_INDEX / (STEPS.length - 1)) * 100);

export default function CleanerApplicationSuccessScreen({ route, navigation }) {
  const { fullName, email, phone, experience, days, timeBlocks } = route.params;
  const firstName = fullName?.trim().split(' ')[0] || 'there';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.pageGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Application status</Text>
        <Text style={styles.subtitle}>Thanks, {firstName} — we'll keep this page updated as things move.</Text>

        <GlassCard style={styles.statusCard} intensity={45}>
          <View style={styles.statusInner}>
            <View style={styles.statusHeaderRow}>
              <View style={styles.statusIcon}>
                <Ionicons name="time-outline" size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>In progress</Text>
                <Text style={styles.statusMessage}>
                  We're on it! Your application is being reviewed by our team.
                </Text>
              </View>
            </View>

            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${PROGRESS_PERCENT}%` }]} />
              </View>
              <Text style={styles.progressLabel}>{PROGRESS_PERCENT}%</Text>
            </View>
          </View>
        </GlassCard>

        <Text style={styles.sectionLabel}>Timeline</Text>
        <GlassCard style={styles.timelineCard} intensity={45}>
          <View style={styles.timelineInner}>
            {STEPS.map((step, index) => {
              const isLast = index === STEPS.length - 1;
              return (
                <View key={step.label} style={styles.timelineItem}>
                  <View style={styles.timelineIndicator}>
                    <View
                      style={[
                        styles.dot,
                        step.done && styles.dotDone,
                        step.current && styles.dotCurrent,
                      ]}
                    >
                      {step.done && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
                    </View>
                    {!isLast && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineText}>
                    <Text style={[styles.timelineLabel, (step.done || step.current) && styles.timelineLabelActive]}>
                      {step.label}
                    </Text>
                    <Text style={styles.timelineSublabel}>{step.sublabel}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </GlassCard>

        <Text style={styles.sectionLabel}>Your details</Text>
        <GlassCard style={styles.detailsCard} intensity={45}>
          <View style={styles.detailsInner}>
            <Row label="Name" value={fullName} />
            <Row label="Email" value={email} />
            <Row label="Phone" value={phone} />
            <Row label="Experience" value={experience} />
            <Row label="Availability" value={`${days?.join(', ')} · ${timeBlocks?.join(', ')}`} />
          </View>
        </GlassCard>

        <Pressable style={styles.button} onPress={() => navigation.popToTop()}>
          <Text style={styles.buttonText}>Back to home</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
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
  statusCard: {
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  statusInner: {
    padding: spacing.md,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(232,115,74,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  statusMessage: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(46,42,38,0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    width: 36,
    textAlign: 'right',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timelineCard: {
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  timelineInner: {
    padding: spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineIndicator: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: '#3F8557',
    borderColor: '#3F8557',
  },
  dotCurrent: {
    borderColor: colors.accent,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 24,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  timelineText: {
    flex: 1,
    paddingBottom: spacing.md,
    paddingLeft: spacing.sm,
  },
  timelineLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timelineLabelActive: {
    color: colors.text,
  },
  timelineSublabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  detailsCard: {
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  detailsInner: {
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    gap: spacing.md,
  },
  rowLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  rowValue: {
    fontSize: 13,
    color: colors.text,
    maxWidth: '65%',
    textAlign: 'right',
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.accentText,
    fontSize: 15,
    fontWeight: '600',
  },
});

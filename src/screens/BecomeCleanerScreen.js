import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import GlassCard from '../components/GlassCard';

const STEP_COUNT = 4;

const EXPERIENCE_LEVELS = ['New to cleaning', '1–3 years', '3–5 years', '5+ years'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_BLOCKS = ['Morning', 'Afternoon', 'Evening'];

function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

export default function BecomeCleanerScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [experience, setExperience] = useState(null);
  const [about, setAbout] = useState('');

  const [days, setDays] = useState([]);
  const [timeBlocks, setTimeBlocks] = useState([]);

  const [consent, setConsent] = useState(false);

  const toggle = (list, setList, value) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const goNext = () => {
    if (step === 0) {
      if (!fullName.trim()) return setError('Enter your full name');
      if (!isValidEmail(email)) return setError('Enter a valid email');
      if (!phone.trim()) return setError('Enter your phone number');
    }
    if (step === 1) {
      if (!experience) return setError('Select your experience level');
    }
    if (step === 2) {
      if (days.length === 0) return setError('Select at least one day');
      if (timeBlocks.length === 0) return setError('Select at least one time of day');
    }
    setError('');
    setStep((s) => Math.min(s + 1, STEP_COUNT - 1));
  };

  const goBack = () => {
    if (step === 0) {
      navigation.goBack();
      return;
    }
    setError('');
    setStep((s) => s - 1);
  };

  const handleSubmit = () => {
    if (!consent) {
      setError('Please confirm to submit your application');
      return;
    }
    navigation.navigate('CleanerApplicationSuccess', {
      fullName,
      email,
      phone,
      experience,
      days,
      timeBlocks,
    });
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
        <View style={styles.headerRow}>
          <GlassCard style={styles.backButton} intensity={30} onPress={goBack}>
            <View style={styles.backButtonInner}>
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
            </View>
          </GlassCard>
          <Text style={styles.stepLabel}>Step {step + 1} of {STEP_COUNT}</Text>
        </View>

        <View style={styles.progressRow}>
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <View key={i} style={[styles.progressBar, i <= step && styles.progressBarFilled]} />
          ))}
        </View>

        {step === 0 && (
          <>
            <Text style={styles.title}>Become a Cleaner</Text>
            <Text style={styles.subtitle}>Let's start with the basics</Text>

            <GlassCard style={styles.card} intensity={45}>
              <View style={styles.cardInner}>
                <Text style={styles.fieldLabel}>Full name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Jamie Rivera"
                  placeholderTextColor={colors.textSecondary}
                  value={fullName}
                  onChangeText={setFullName}
                />
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="jamie@example.com"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Text style={styles.fieldLabel}>Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="(613) 555-0100"
                  placeholderTextColor={colors.textSecondary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </GlassCard>
          </>
        )}

        {step === 1 && (
          <>
            <Text style={styles.title}>Your experience</Text>
            <Text style={styles.subtitle}>No experience? That's okay — everyone starts somewhere</Text>

            <View style={styles.chipRow}>
              {EXPERIENCE_LEVELS.map((level) => (
                <Pressable
                  key={level}
                  style={[styles.chip, experience === level && styles.chipSelected]}
                  onPress={() => {
                    setExperience(level);
                    if (error) setError('');
                  }}
                >
                  <Text style={[styles.chipText, experience === level && styles.chipTextSelected]}>{level}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Anything else we should know? (optional)</Text>
            <GlassCard style={styles.card} intensity={45}>
              <View style={styles.cardInner}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Certifications, specialties, why you'd be great at this…"
                  placeholderTextColor={colors.textSecondary}
                  value={about}
                  onChangeText={setAbout}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </GlassCard>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.title}>Your availability</Text>
            <Text style={styles.subtitle}>Pick every day and time block that works for you</Text>

            <Text style={styles.fieldLabel}>Days</Text>
            <View style={styles.chipRow}>
              {WEEKDAYS.map((day) => (
                <Pressable
                  key={day}
                  style={[styles.chip, days.includes(day) && styles.chipSelected]}
                  onPress={() => {
                    toggle(days, setDays, day);
                    if (error) setError('');
                  }}
                >
                  <Text style={[styles.chipText, days.includes(day) && styles.chipTextSelected]}>{day}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Time of day</Text>
            <View style={styles.chipRow}>
              {TIME_BLOCKS.map((block) => (
                <Pressable
                  key={block}
                  style={[styles.chip, timeBlocks.includes(block) && styles.chipSelected]}
                  onPress={() => {
                    toggle(timeBlocks, setTimeBlocks, block);
                    if (error) setError('');
                  }}
                >
                  <Text style={[styles.chipText, timeBlocks.includes(block) && styles.chipTextSelected]}>{block}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.title}>Review & submit</Text>
            <Text style={styles.subtitle}>Make sure everything looks right</Text>

            <GlassCard style={styles.card} intensity={45}>
              <View style={styles.cardInner}>
                <Row label="Name" value={fullName} />
                <Row label="Email" value={email} />
                <Row label="Phone" value={phone} />
                <View style={styles.divider} />
                <Row label="Experience" value={experience} />
                {about ? <Row label="About" value={about} /> : null}
                <View style={styles.divider} />
                <Row label="Days" value={days.join(', ')} />
                <Row label="Times" value={timeBlocks.join(', ')} />
              </View>
            </GlassCard>

            <Pressable style={styles.consentRow} onPress={() => setConsent(!consent)}>
              <View style={[styles.checkbox, consent && styles.checkboxChecked]}>
                {consent && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.consentText}>
                I confirm this information is accurate and consent to a background check.
              </Text>
            </Pressable>
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.button} onPress={step === STEP_COUNT - 1 ? handleSubmit : goNext}>
          <Text style={styles.buttonText}>{step === STEP_COUNT - 1 ? 'Submit application' : 'Continue'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }) {
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  backButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  progressRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(46,42,38,0.12)',
  },
  progressBarFilled: {
    backgroundColor: colors.accent,
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
  card: {
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  cardInner: {
    padding: spacing.md,
  },
  fieldLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.background,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  consentText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  error: {
    color: '#A32D2D',
    fontSize: 13,
    marginTop: spacing.sm,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonText: {
    color: colors.accentText,
    fontSize: 15,
    fontWeight: '600',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import GlassCard from '../components/GlassCard';
import AnimatedPressable from '../components/AnimatedPressable';
import { useAuth } from '../context/AuthContext';
import { BATHROOM_OPTIONS, BEDROOM_OPTIONS, PET_OPTIONS } from '../utils/home';

// Used twice: as the required step right after signing in (no navigation, no back button),
// and as an edit screen opened from Account.
export default function HomeDetailsScreen({ navigation }) {
  const { home, saveHome } = useAuth();
  const editing = !!navigation;

  const [bedrooms, setBedrooms] = useState(home ? home.bedrooms : null);
  const [bathrooms, setBathrooms] = useState(home ? home.bathrooms : null);
  const [pets, setPets] = useState(home ? home.pets || [] : null);
  const [petNotes, setPetNotes] = useState(home?.petNotes || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const hasPets = pets && pets.length > 0;

  const togglePet = (value) => {
    setError('');
    if (value === 'none') {
      setPets([]);
      setPetNotes('');
      return;
    }
    const current = pets || [];
    setPets(current.includes(value) ? current.filter((p) => p !== value) : [...current, value]);
  };

  const save = async () => {
    if (bedrooms === null || bathrooms === null || pets === null) {
      setError('Please answer all three questions.');
      return;
    }
    setError('');
    setSaving(true);
    const result = await saveHome({
      bedrooms,
      bathrooms,
      pets,
      petNotes: hasPets ? petNotes.trim() : '',
    });
    setSaving(false);
    if (result?.error) {
      setError('Couldn’t save that. Check your connection and try again.');
      return;
    }
    if (editing) navigation.goBack();
  };

  const Chips = ({ options, selected, onPress }) => (
    <View style={styles.chipRow}>
      {options.map((o) => {
        const on = selected(o.value);
        return (
          <AnimatedPressable key={String(o.value)} style={[styles.chip, on && styles.chipOn]} onPress={() => onPress(o.value)}>
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.label}</Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient
        colors={colors.pageGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {editing ? (
          <GlassCard style={styles.backButton} intensity={30} onPress={() => navigation.goBack()}>
            <View style={styles.backButtonInner}>
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
            </View>
          </GlassCard>
        ) : null}

        <Text style={styles.title}>{editing ? 'Your home' : 'Tell us about your home'}</Text>
        <Text style={styles.subtitle}>
          This helps us send the right cleaner and plan the right amount of time.
        </Text>

        <GlassCard style={styles.card} intensity={45}>
          <View style={styles.cardInner}>
            <Text style={styles.question}>How many bedrooms?</Text>
            <Chips
              options={BEDROOM_OPTIONS}
              selected={(v) => bedrooms === v}
              onPress={(v) => {
                setBedrooms(v);
                setError('');
              }}
            />

            <Text style={styles.question}>How many bathrooms?</Text>
            <Chips
              options={BATHROOM_OPTIONS}
              selected={(v) => bathrooms === v}
              onPress={(v) => {
                setBathrooms(v);
                setError('');
              }}
            />

            <Text style={styles.question}>Do you have pets?</Text>
            <Chips
              options={PET_OPTIONS}
              selected={(v) => (v === 'none' ? pets !== null && pets.length === 0 : (pets || []).includes(v))}
              onPress={togglePet}
            />

            {hasPets ? (
              <TextInput
                style={styles.input}
                value={petNotes}
                onChangeText={setPetNotes}
                placeholder="Anything we should know? (optional)"
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            ) : null}
          </View>
        </GlassCard>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AnimatedPressable style={styles.button} onPress={save} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Text style={styles.buttonText}>{editing ? 'Save' : 'Continue'}</Text>
          )}
        </AnimatedPressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: 64, paddingBottom: spacing.xl },
  backButton: { width: 36, height: 36, borderRadius: 18, marginBottom: spacing.lg },
  backButtonInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: colors.primary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg, lineHeight: 18 },
  card: { borderRadius: radius.lg, marginBottom: spacing.md },
  cardInner: { padding: spacing.md },
  question: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: spacing.sm, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.text },
  chipTextOn: { color: colors.background },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    minHeight: 64,
    marginTop: spacing.xs,
  },
  error: { color: '#A32D2D', fontSize: 13, marginBottom: spacing.sm },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  buttonText: { color: colors.accentText, fontSize: 15, fontWeight: '600' },
});

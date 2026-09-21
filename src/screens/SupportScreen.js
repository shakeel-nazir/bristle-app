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
import { useBooking } from '../context/BookingContext';
import { useTickets } from '../context/TicketContext';
import { TICKET_CATEGORIES, TICKET_STATUS_LABELS } from '../utils/tickets';

export default function SupportScreen({ navigation }) {
  const { tickets, createTicket } = useTickets();
  const { allBookings } = useBooking();
  const [composing, setComposing] = useState(tickets.length === 0);
  const [category, setCategory] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const recent = allBookings
    .filter((b) => b.status !== 'cancelled')
    .sort((a, b) => b.createdMs - a.createdMs).slice(0, 4);

  const send = async () => {
    if (!category) return setError('Pick what this is about.');
    if (!message.trim()) return setError('Write a short message so we know how to help.');
    setError('');
    setSending(true);
    const picked = recent.find((b) => b.id === bookingId);
    const result = await createTicket({
      category,
      message: message.trim(),
      bookingLabel: picked ? `${picked.service?.name} · ${picked.date}` : '',
    });
    setSending(false);
    if (result.error) return setError(result.error);
    setCategory(null);
    setBookingId(null);
    setMessage('');
    setComposing(false);
    navigation.navigate('Ticket', { id: result.id });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient
        colors={colors.pageGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <GlassCard style={styles.backButton} intensity={30} onPress={() => navigation.goBack()}>
          <View style={styles.backButtonInner}>
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
          </View>
        </GlassCard>

        <Text style={styles.title}>Support</Text>
        <Text style={styles.subtitle}>Send us a message and we’ll reply right here in the app.</Text>

        {composing ? (
          <GlassCard style={styles.card} intensity={45}>
            <View style={styles.cardInner}>
              <Text style={styles.label}>What’s it about?</Text>
              <View style={styles.chipRow}>
                {TICKET_CATEGORIES.map((c) => (
                  <AnimatedPressable
                    key={c}
                    style={[styles.chip, category === c && styles.chipOn]}
                    onPress={() => {
                      setCategory(c);
                      setError('');
                    }}
                  >
                    <Text style={[styles.chipText, category === c && styles.chipTextOn]}>{c}</Text>
                  </AnimatedPressable>
                ))}
              </View>

              {recent.length > 0 ? (
                <>
                  <Text style={styles.label}>Which booking? (optional)</Text>
                  <View style={styles.chipRow}>
                    {recent.map((b) => (
                      <AnimatedPressable
                        key={b.id}
                        style={[styles.chip, bookingId === b.id && styles.chipOn]}
                        onPress={() => setBookingId(bookingId === b.id ? null : b.id)}
                      >
                        <Text style={[styles.chipText, bookingId === b.id && styles.chipTextOn]}>
                          {b.service?.name?.replace(' Clean', '')} · {b.date} · {b.time}
                        </Text>
                      </AnimatedPressable>
                    ))}
                  </View>
                </>
              ) : null}

              <Text style={styles.label}>Your message</Text>
              <TextInput
                style={styles.input}
                value={message}
                onChangeText={(t) => {
                  setMessage(t);
                  setError('');
                }}
                placeholder="Tell us what happened or what you need…"
                placeholderTextColor={colors.textSecondary}
                multiline
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <AnimatedPressable style={styles.primary} onPress={send} disabled={sending}>
                {sending ? (
                  <ActivityIndicator color={colors.accentText} />
                ) : (
                  <Text style={styles.primaryText}>Send message</Text>
                )}
              </AnimatedPressable>
            </View>
          </GlassCard>
        ) : (
          <AnimatedPressable style={styles.primary} onPress={() => setComposing(true)}>
            <Text style={styles.primaryText}>New ticket</Text>
          </AnimatedPressable>
        )}

        {tickets.length > 0 ? <Text style={styles.section}>Your tickets</Text> : null}
        {tickets.map((t) => {
          const last = t.messages[t.messages.length - 1];
          const unread = t.status === 'answered' && t.customerSeen === false;
          return (
            <GlassCard
              key={t.id}
              style={styles.card}
              intensity={45}
              onPress={() => navigation.navigate('Ticket', { id: t.id })}
            >
              <View style={styles.cardInner}>
                <View style={styles.rowTop}>
                  <Text style={styles.ticketTitle} numberOfLines={1}>
                    {t.category}
                    {unread ? '  •' : ''}
                  </Text>
                  <Text style={[styles.status, t.status === 'answered' && styles.statusAnswered]}>
                    {TICKET_STATUS_LABELS[t.status]}
                  </Text>
                </View>
                <Text style={styles.preview} numberOfLines={2}>
                  {last.from === 'admin' ? 'Bristle: ' : 'You: '}
                  {last.text}
                </Text>
              </View>
            </GlassCard>
          );
        })}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: 64, paddingBottom: spacing.xl },
  backButton: { width: 36, height: 36, borderRadius: 18, marginBottom: spacing.lg },
  backButtonInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: colors.primary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg },
  card: { borderRadius: radius.lg, marginBottom: spacing.sm },
  cardInner: { padding: spacing.md },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: spacing.sm, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.xs },
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
    minHeight: 96,
    textAlignVertical: 'top',
  },
  error: { color: '#A32D2D', fontSize: 13, marginTop: spacing.sm },
  primary: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryText: { color: colors.accentText, fontSize: 15, fontWeight: '600' },
  section: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ticketTitle: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 },
  status: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  statusAnswered: { color: '#3F8557' },
  preview: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 17 },
});

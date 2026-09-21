import React, { useEffect, useState } from 'react';
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
import { useTickets } from '../context/TicketContext';
import { TICKET_STATUS_LABELS, formatTicketTime } from '../utils/tickets';

export default function TicketScreen({ route, navigation }) {
  const { tickets, reply, markSeen } = useTickets();
  const ticket = tickets.find((t) => t.id === route.params.id);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ticket && ticket.status === 'answered' && ticket.customerSeen === false) markSeen(ticket.id);
  }, [ticket, markSeen]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    setError('');
    const result = await reply(ticket.id, text.trim());
    setSending(false);
    if (result.error) return setError(result.error);
    setText('');
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

        {!ticket ? (
          <Text style={styles.muted}>This ticket is no longer available.</Text>
        ) : (
          <>
            <Text style={styles.title}>{ticket.category}</Text>
            <Text style={styles.subtitle}>
              {TICKET_STATUS_LABELS[ticket.status]}
              {ticket.bookingLabel ? ` · ${ticket.bookingLabel}` : ''}
            </Text>

            {ticket.messages.map((m, i) => {
              const mine = m.from === 'customer';
              return (
                <View key={i} style={[styles.bubbleWrap, mine ? styles.wrapMine : styles.wrapTheirs]}>
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    {!mine ? <Text style={styles.from}>Bristle support</Text> : null}
                    <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{m.text}</Text>
                  </View>
                  <Text style={styles.time}>{formatTicketTime(m.ts)}</Text>
                </View>
              );
            })}

            <View style={styles.composer}>
              <TextInput
                style={styles.input}
                value={text}
                onChangeText={setText}
                placeholder={ticket.status === 'closed' ? 'Reply to reopen this ticket…' : 'Write a reply…'}
                placeholderTextColor={colors.textSecondary}
                multiline
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <AnimatedPressable style={styles.send} onPress={send} disabled={sending || !text.trim()}>
                {sending ? (
                  <ActivityIndicator color={colors.accentText} />
                ) : (
                  <Text style={styles.sendText}>Send</Text>
                )}
              </AnimatedPressable>
            </View>
          </>
        )}
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
  muted: { fontSize: 13, color: colors.textSecondary },
  bubbleWrap: { marginBottom: spacing.md, maxWidth: '85%' },
  wrapMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  wrapTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: spacing.md },
  bubbleMine: { backgroundColor: colors.accent },
  bubbleTheirs: { backgroundColor: colors.card },
  from: { fontSize: 11, fontWeight: '700', color: colors.accent, marginBottom: 2 },
  bubbleText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  bubbleTextMine: { color: colors.accentText },
  time: { fontSize: 10, color: colors.textSecondary, marginTop: 3 },
  composer: { marginTop: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  error: { color: '#A32D2D', fontSize: 13, marginTop: spacing.sm },
  send: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  sendText: { color: colors.accentText, fontSize: 15, fontWeight: '600' },
});

import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TextInput } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';
import AnimatedPressable from './AnimatedPressable';

const QUICK = [
  'Your cleaner is running about 15 minutes late. Sorry for the wait!',
  'Your cleaner has arrived and is at your door.',
  'Something has come up and we need to reschedule. We’ll be in touch shortly.',
  'Quick reminder: please make sure someone is home or the cleaner can get in.',
];

// Admin: send a customer a quick message about a booking, no ticket needed.
export default function MessageCustomerModal({ visible, booking, onClose, onSend }) {
  if (!booking) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Composer key={booking.id} booking={booking} onClose={onClose} onSend={onSend} />
    </Modal>
  );
}

function Composer({ booking, onClose, onSend }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const send = async () => {
    if (!text.trim()) return setError('Write a message first.');
    setSending(true);
    setError('');
    const ok = await onSend(text.trim());
    setSending(false);
    if (!ok) setError('Couldn’t send that. Please try again.');
  };

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={styles.title}>Message customer</Text>
        <Text style={styles.sub}>
          {booking.service?.name} · {booking.date} · {booking.time}
        </Text>
        <Text style={styles.hint}>They’ll get a notification on their Home screen and can reply.</Text>

        <View style={styles.chips}>
          {QUICK.map((q) => (
            <AnimatedPressable key={q} style={styles.chip} onPress={() => setText(q)} scaleTo={0.97}>
              <Text style={styles.chipText}>{q}</Text>
            </AnimatedPressable>
          ))}
        </View>

        <TextInput
          style={styles.input}
          value={text}
          onChangeText={(t) => {
            setText(t);
            setError('');
          }}
          multiline
          placeholder="Or write your own message…"
          placeholderTextColor={colors.textSecondary}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.footer}>
          <AnimatedPressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </AnimatedPressable>
          <AnimatedPressable style={styles.send} onPress={send} disabled={sending}>
            <Text style={styles.sendText}>{sending ? 'Sending…' : 'Send message'}</Text>
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(24,20,16,0.45)', alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  card: { width: '100%', maxWidth: 440, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  sub: { fontSize: 12, color: colors.accent, fontWeight: '600', marginTop: 2 },
  hint: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.sm },
  chips: { gap: 6, marginBottom: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardMuted, borderRadius: radius.sm, paddingVertical: 8, paddingHorizontal: spacing.md },
  chipText: { fontSize: 12, color: colors.text, lineHeight: 17 },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: radius.sm, padding: spacing.md, fontSize: 14, color: colors.text, minHeight: 72, textAlignVertical: 'top' },
  error: { color: '#A32D2D', fontSize: 13, marginTop: spacing.sm },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  cancel: { paddingVertical: 10, paddingHorizontal: spacing.md },
  cancelText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  send: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: spacing.lg },
  sendText: { color: colors.accentText, fontSize: 14, fontWeight: '700' },
});

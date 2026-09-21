import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';
import AnimatedPressable from './AnimatedPressable';
import MonthCalendar from './MonthCalendar';
import { checkCleaner, describeSlot } from '../utils/matching';
import { TIME_SLOTS, formatBookingDate } from '../utils/dates';

// Admin editor for an upcoming booking: date, time, and the list of work to be done.
export default function EditBookingModal({ visible, booking, cleaners, bookings, onClose, onSave }) {
  if (!booking) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Editor key={booking.id} booking={booking} cleaners={cleaners} bookings={bookings} onClose={onClose} onSave={onSave} />
    </Modal>
  );
}

function Editor({ booking, cleaners, bookings, onClose, onSave }) {
  const [date, setDate] = useState(booking.rawDate ? new Date(booking.rawDate) : null);
  const [time, setTime] = useState(booking.time);
  const [tasksText, setTasksText] = useState((booking.service?.tasks || []).map((t) => t.label).join('\n'));
  const [note, setNote] = useState(booking.adminNote || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const changedSlot = !!date && (formatBookingDate(date) !== booking.date || time !== booking.time);
  const candidate = date ? { ...booking, date: formatBookingDate(date), time } : null;

  // Who is free at the new time? (Ignores this booking's own current slot.)
  const freeCount = candidate ? cleaners.filter((c) => checkCleaner(c, candidate, bookings).ok).length : 0;
  const assigned = booking.cleanerId ? cleaners.find((c) => c.id === booking.cleanerId) : null;
  const assignedCheck = candidate && booking.cleanerId ? (assigned ? checkCleaner(assigned, candidate, bookings) : { ok: false, reason: 'is no longer an approved cleaner' }) : null;
  const willUnassign = !!(assignedCheck && !assignedCheck.ok);

  const save = async () => {
    if (!date) return setError('Pick a date.');
    const lines = tasksText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return setError('Add at least one task.');
    setError('');
    setSaving(true);
    const existing = booking.service?.tasks || [];
    const tasks = lines.map((label, i) => {
      const match = existing.find((t) => t.label.toLowerCase() === label.toLowerCase());
      return match ? { ...match, label } : { id: `t${Date.now()}${i}`, label, minutes: 20 };
    });
    const fields = {
      date: formatBookingDate(date),
      time,
      rawDate: date.toISOString(),
      service: { ...booking.service, tasks },
      adminNote: note.trim() || null,
      ...(willUnassign ? { cleanerId: null, cleanerName: null } : {}),
    };
    const ok = await onSave(fields);
    setSaving(false);
    if (!ok) setError('Couldn’t save that. Please try again.');
  };

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={styles.title}>Edit booking</Text>
        <Text style={styles.sub}>{describeSlot(booking)} · {booking.service?.name}</Text>

        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Date</Text>
          <MonthCalendar selectedDate={date} onSelectDate={setDate} isDateAvailable={() => true} />

          <Text style={styles.label}>Time</Text>
          <View style={styles.chips}>
            {TIME_SLOTS.map((t) => (
              <AnimatedPressable key={t} style={[styles.chip, time === t && styles.chipOn]} onPress={() => setTime(t)}>
                <Text style={[styles.chipText, time === t && styles.chipTextOn]}>{t}</Text>
              </AnimatedPressable>
            ))}
          </View>

          {candidate ? (
            <View style={[styles.notice, freeCount > 0 ? styles.noticeOk : styles.noticeWarn]}>
              <Text style={[styles.noticeText, freeCount > 0 ? styles.noticeTextOk : styles.noticeTextWarn]}>
                {freeCount > 0
                  ? `${freeCount} cleaner${freeCount === 1 ? '' : 's'} free at this time.`
                  : 'No cleaner is free at this time. You can still save it and assign someone later.'}
              </Text>
              {willUnassign ? (
                <Text style={styles.noticeTextWarn}>
                  {booking.cleanerName} can’t do this time ({assignedCheck.reason.charAt(0).toLowerCase() + assignedCheck.reason.slice(1)}), so
                  they’ll be unassigned when you save.
                </Text>
              ) : null}
            </View>
          ) : null}

          <Text style={styles.label}>Work to be done (one task per line)</Text>
          <TextInput style={styles.input} value={tasksText} onChangeText={setTasksText} multiline placeholder="Kitchen&#10;Bathrooms" placeholderTextColor={colors.textSecondary} />

          <Text style={styles.label}>Note to customer (optional)</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="e.g. Moved to the afternoon as requested"
            placeholderTextColor={colors.textSecondary}
          />
          {changedSlot ? <Text style={styles.hint}>The customer sees the new date and time right away.</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <AnimatedPressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </AnimatedPressable>
          <AnimatedPressable style={styles.save} onPress={save} disabled={saving}>
            <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save changes'}</Text>
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(24,20,16,0.45)', alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  card: { width: '100%', maxWidth: 460, maxHeight: '92%', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  sub: { fontSize: 12, color: colors.accent, fontWeight: '600', marginTop: 2, marginBottom: spacing.sm },
  scroll: { flexGrow: 0 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardMuted, borderRadius: radius.sm, paddingVertical: 8, paddingHorizontal: 14 },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.text },
  chipTextOn: { color: colors.background },
  notice: { borderRadius: radius.sm, padding: spacing.sm, marginTop: spacing.sm, gap: 4 },
  noticeOk: { backgroundColor: 'rgba(63,133,87,0.12)' },
  noticeWarn: { backgroundColor: 'rgba(163,45,45,0.10)' },
  noticeText: { fontSize: 12, fontWeight: '600' },
  noticeTextOk: { color: '#3F8557' },
  noticeTextWarn: { color: '#A32D2D', fontSize: 12, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: radius.sm, padding: spacing.md, fontSize: 14, color: colors.text, minHeight: 84, textAlignVertical: 'top' },
  noteInput: { minHeight: 56 },
  hint: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.sm },
  error: { color: '#A32D2D', fontSize: 13, marginTop: spacing.sm },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  cancel: { paddingVertical: 10, paddingHorizontal: spacing.md },
  cancelText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  save: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: spacing.lg },
  saveText: { color: colors.accentText, fontSize: 14, fontWeight: '700' },
});

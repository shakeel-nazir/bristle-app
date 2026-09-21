import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';
import AnimatedPressable from './AnimatedPressable';
import { checkCleaner, isActiveJob } from '../utils/matching';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_BLOCKS = ['Morning', 'Afternoon', 'Evening'];
const EXPERIENCE_LEVELS = ['New to cleaning', '1–3 years', '3–5 years', '5+ years'];

// Admin editor for a cleaner's details: someone changed their mind about days, times or their name.
export default function EditCleanerModal({ visible, cleaner, bookings, onClose, onSave }) {
  if (!cleaner) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Editor key={cleaner.id} cleaner={cleaner} bookings={bookings} onClose={onClose} onSave={onSave} />
    </Modal>
  );
}

const toggle = (list, value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
const inOrder = (list, order) => order.filter((v) => list.includes(v));

function Editor({ cleaner, bookings, onClose, onSave }) {
  const [fullName, setFullName] = useState(cleaner.fullName || '');
  const [email, setEmail] = useState(cleaner.email || '');
  const [phone, setPhone] = useState(cleaner.phone || '');
  const [experience, setExperience] = useState(cleaner.experience || null);
  const [days, setDays] = useState(cleaner.days || []);
  const [timeBlocks, setTimeBlocks] = useState(cleaner.timeBlocks || []);
  const [about, setAbout] = useState(cleaner.about || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isApproved = cleaner.status === 'approved';
  const changedHours =
    JSON.stringify(inOrder(days, WEEKDAYS)) !== JSON.stringify(inOrder(cleaner.days || [], WEEKDAYS)) ||
    JSON.stringify(inOrder(timeBlocks, TIME_BLOCKS)) !== JSON.stringify(inOrder(cleaner.timeBlocks || [], TIME_BLOCKS));

  // Jobs already assigned to them that the new hours can no longer cover.
  const updated = { ...cleaner, days, timeBlocks };
  const clashes = bookings
    .filter((b) => b.cleanerId === cleaner.id && isActiveJob(b))
    .map((b) => ({ booking: b, check: checkCleaner(updated, b, bookings) }))
    .filter((x) => !x.check.ok && /work|available/i.test(x.check.reason));

  const save = async () => {
    if (!fullName.trim()) return setError('Enter a name.');
    if (days.length === 0) return setError('Pick at least one day.');
    if (timeBlocks.length === 0) return setError('Pick at least one time of day.');
    setError('');
    setSaving(true);
    const ok = await onSave(
      {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        experience,
        about: about.trim(),
        days: inOrder(days, WEEKDAYS),
        timeBlocks: inOrder(timeBlocks, TIME_BLOCKS),
      },
      clashes.map((x) => x.booking.id),
    );
    setSaving(false);
    if (!ok) setError('Couldn’t save that. Please try again.');
  };

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={styles.title}>Edit cleaner</Text>
        <Text style={styles.sub}>{isApproved ? 'Approved · new days and times reach customers right away' : 'Application details'}</Text>

        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Full name</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Full name" placeholderTextColor={colors.textSecondary} />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="(613) 555-0100" placeholderTextColor={colors.textSecondary} keyboardType="phone-pad" />

          <Text style={styles.label}>Experience</Text>
          <View style={styles.chips}>
            {EXPERIENCE_LEVELS.map((level) => (
              <AnimatedPressable key={level} style={[styles.chip, experience === level && styles.chipOn]} onPress={() => setExperience(level)}>
                <Text style={[styles.chipText, experience === level && styles.chipTextOn]}>{level}</Text>
              </AnimatedPressable>
            ))}
          </View>

          <Text style={styles.label}>Days they can work</Text>
          <View style={styles.chips}>
            {WEEKDAYS.map((d) => (
              <AnimatedPressable key={d} style={[styles.chip, days.includes(d) && styles.chipOn]} onPress={() => setDays(toggle(days, d))}>
                <Text style={[styles.chipText, days.includes(d) && styles.chipTextOn]}>{d}</Text>
              </AnimatedPressable>
            ))}
          </View>

          <Text style={styles.label}>Times of day</Text>
          <View style={styles.chips}>
            {TIME_BLOCKS.map((b) => (
              <AnimatedPressable key={b} style={[styles.chip, timeBlocks.includes(b) && styles.chipOn]} onPress={() => setTimeBlocks(toggle(timeBlocks, b))}>
                <Text style={[styles.chipText, timeBlocks.includes(b) && styles.chipTextOn]}>{b}</Text>
              </AnimatedPressable>
            ))}
          </View>

          {changedHours && isApproved ? (
            <View style={[styles.notice, clashes.length ? styles.noticeWarn : styles.noticeOk]}>
              {clashes.length ? (
                <>
                  <Text style={styles.noticeTextWarn}>
                    These jobs no longer fit their new hours, so they’ll be unassigned when you save:
                  </Text>
                  {clashes.map(({ booking, check }) => (
                    <Text key={booking.id} style={styles.noticeTextWarn}>
                      • {booking.date} · {booking.time} ({check.reason.charAt(0).toLowerCase() + check.reason.slice(1)})
                    </Text>
                  ))}
                </>
              ) : (
                <Text style={styles.noticeTextOk}>Customers will see their new days and times as bookable right away.</Text>
              )}
            </View>
          ) : null}

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput style={[styles.input, styles.noteInput]} value={about} onChangeText={setAbout} multiline placeholder="Anything worth remembering" placeholderTextColor={colors.textSecondary} />

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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
  },
  noteInput: { minHeight: 60, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardMuted, borderRadius: radius.sm, paddingVertical: 8, paddingHorizontal: 14 },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.text },
  chipTextOn: { color: colors.background },
  notice: { borderRadius: radius.sm, padding: spacing.sm, marginTop: spacing.sm, gap: 4 },
  noticeOk: { backgroundColor: 'rgba(63,133,87,0.12)' },
  noticeWarn: { backgroundColor: 'rgba(163,45,45,0.10)' },
  noticeTextOk: { fontSize: 12, fontWeight: '600', color: '#3F8557' },
  noticeTextWarn: { fontSize: 12, fontWeight: '600', color: '#A32D2D' },
  error: { fontSize: 12, color: '#A32D2D', marginTop: spacing.sm },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
  cancel: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.md },
  cancelText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  save: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 18 },
  saveText: { fontSize: 14, fontWeight: '700', color: colors.accentText },
});

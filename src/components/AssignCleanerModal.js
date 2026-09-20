import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';
import AnimatedPressable from './AnimatedPressable';
import { checkCleaner, describeSlot } from '../utils/matching';

export default function AssignCleanerModal({ visible, booking, cleaners, bookings, onClose, onAssign }) {
  const rows = booking
    ? cleaners
        .map((c) => ({ c, check: checkCleaner(c, booking, bookings) }))
        .sort((a, b) => Number(b.check.ok) - Number(a.check.ok))
    : [];
  const availableCount = rows.filter((r) => r.check.ok).length;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Assign a cleaner</Text>
          {booking ? <Text style={styles.slot}>{describeSlot(booking)}</Text> : null}

          {cleaners.length === 0 ? (
            <Text style={styles.empty}>
              No approved cleaners yet. Approve an applicant on the Applications tab first.
            </Text>
          ) : (
            <>
              <Text style={styles.summary}>
                {availableCount} of {cleaners.length} available for this time
              </Text>
              <ScrollView style={styles.list}>
                {rows.map(({ c, check }) => {
                  const current = booking?.cleanerId === c.id;
                  return (
                    <AnimatedPressable
                      key={c.id}
                      style={[styles.row, !check.ok && styles.rowDisabled, current && styles.rowCurrent]}
                      onPress={() => check.ok && onAssign(c)}
                      disabled={!check.ok}
                      scaleTo={0.98}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{c.fullName || 'Cleaner'}</Text>
                        <Text style={styles.detail} numberOfLines={2}>
                          {(c.days || []).join(', ')} · {(c.timeBlocks || []).join(', ')}
                        </Text>
                      </View>
                      <Text style={[styles.tag, check.ok ? styles.tagOk : styles.tagNo]}>
                        {current ? 'Assigned' : check.ok ? 'Available' : check.reason}
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </ScrollView>
            </>
          )}

          <View style={styles.footer}>
            {booking?.cleanerId ? (
              <AnimatedPressable onPress={() => onAssign(null)}>
                <Text style={styles.unassign}>Unassign {booking.cleanerName}</Text>
              </AnimatedPressable>
            ) : (
              <View />
            )}
            <AnimatedPressable style={styles.close} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </AnimatedPressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(24,20,16,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  slot: { fontSize: 13, color: colors.accent, fontWeight: '600', marginTop: 2 },
  summary: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.sm },
  empty: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginTop: spacing.md },
  list: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.card,
  },
  rowDisabled: { opacity: 0.6, backgroundColor: colors.cardMuted },
  rowCurrent: { borderColor: '#3F8557', borderWidth: 2 },
  name: { fontSize: 14, fontWeight: '700', color: colors.text },
  detail: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  tag: { fontSize: 12, fontWeight: '700', marginLeft: spacing.sm, maxWidth: '45%', textAlign: 'right' },
  tagOk: { color: '#3F8557' },
  tagNo: { color: '#A32D2D', fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  unassign: { fontSize: 13, fontWeight: '600', color: '#A32D2D' },
  close: {
    backgroundColor: colors.cardMuted,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  closeText: { fontSize: 13, fontWeight: '600', color: colors.text },
});

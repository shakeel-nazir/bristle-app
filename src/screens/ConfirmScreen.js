import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import { useBooking } from '../context/BookingContext';
import GlassCard from '../components/GlassCard';
import { getPriceBreakdown, HST_RATE } from '../utils/pricing';

export default function ConfirmScreen({ route, navigation }) {
  const { service, date, time, rawDate, address, viewOnly } = route.params;
  const { addBooking, canBookMore } = useBooking();
  const { subtotal, tax, total, deposit, balance } = getPriceBreakdown(service.price);

  const handleConfirm = () => {
    if (!canBookMore) return;
    addBooking({ service, date, time, rawDate, address, subtotal, tax, total, deposit, balance });
    navigation.navigate('Success', { service, date, time, rawDate, address, deposit, balance });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.pageGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <GlassCard style={styles.backButton} intensity={30} onPress={() => navigation.goBack()}>
            <View style={styles.backButtonInner}>
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
            </View>
          </GlassCard>
          {!viewOnly && (
            <Pressable onPress={() => navigation.popToTop()}>
              <Text style={styles.cancelLink}>Cancel</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.title}>{viewOnly ? 'Your booking' : 'Confirm booking'}</Text>

        <GlassCard style={styles.card} intensity={45}>
          <View style={styles.cardInner}>
            <Row label="Package" value={service.name} />
            {service.tasks?.length > 0 && (
              <Row label="Tasks" value={service.tasks.map((t) => t.label).join(', ')} />
            )}
            <Row label="Date" value={date} />
            <Row label="Time" value={time} />
            <Row label="Address" value={address} />
            <View style={styles.divider} />
            <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
            <Row label={`HST (${Math.round(HST_RATE * 100)}%, Ontario)`} value={`$${tax.toFixed(2)}`} />
            <Row label="Total" value={`$${total.toFixed(2)}`} />
            <View style={styles.divider} />
            <Row label="Deposit due now (50%)" value={`$${deposit.toFixed(2)}`} bold />
            <Row label="Balance due after clean" value={`$${balance.toFixed(2)}`} />
          </View>
        </GlassCard>

        {!viewOnly && !canBookMore && (
          <Text style={styles.limitText}>
            You've reached the max of 2 scheduled cleans. Cancel one from home to book another.
          </Text>
        )}

        {!viewOnly && (
          <Pressable
            style={[styles.button, !canBookMore && styles.buttonDisabled]}
            onPress={handleConfirm}
            disabled={!canBookMore}
          >
            <Text style={styles.buttonText}>Pay ${deposit.toFixed(2)} deposit</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Row({ label, value, bold }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowValueBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: 64,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
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
  cancelLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A32D2D',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  card: {
    borderRadius: radius.md,
  },
  cardInner: {
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
  rowValueBold: {
    fontWeight: '700',
    color: colors.primary,
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
  },
  limitText: {
    fontSize: 12,
    color: '#A32D2D',
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  buttonText: {
    color: colors.accentText,
    fontSize: 15,
    fontWeight: '600',
  },
});

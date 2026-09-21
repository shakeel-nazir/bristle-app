import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import { useBooking } from '../context/BookingContext';
import GlassCard from '../components/GlassCard';
import ConfirmModal from '../components/ConfirmModal';
import AnimatedPressable from '../components/AnimatedPressable';
import { getPriceBreakdown, provinceOf } from '../utils/pricing';

export default function ConfirmScreen({ route, navigation }) {
  const { addBooking, cancelBooking, canBookMore, discount, consumeDiscount, allBookings } = useBooking();
  // When viewing an existing booking, follow its live copy so status changes show up right away.
  const live = route.params.viewOnly ? allBookings.find((b) => b.id === route.params.id) : null;
  const params = live ? { ...route.params, ...live } : route.params;
  const { id, service, date, time, rawDate, address, viewOnly, status } = params;
  const canModify = viewOnly && (!status || status === 'active');
  const discountPercent = !viewOnly && discount ? discount.percent : 0;
  const freshBreakdown = getPriceBreakdown(service.price, discountPercent, provinceOf(address));

  // A booking already made keeps the exact numbers (and discount, if any) it was charged
  // at the time — recomputing from the current global discount would misreport what happened.
  const subtotal = viewOnly ? params.subtotal ?? 0 : freshBreakdown.subtotal;
  const discountAmount = viewOnly ? params.discountAmount || 0 : freshBreakdown.discountAmount;
  const discountCodeUsed = viewOnly ? params.discountCode : discount?.code;
  const tax = viewOnly ? params.tax ?? 0 : freshBreakdown.tax;
  // Bookings made before tax lines were saved only have the one total tax figure.
  const taxLines = viewOnly
    ? params.taxLines || [{ label: provinceOf(address) === 'QC' ? 'GST + QST' : 'HST (13%, Ontario)', amount: tax }]
    : freshBreakdown.taxLines;
  const total = viewOnly ? params.total ?? 0 : freshBreakdown.total;
  const deposit = viewOnly ? params.deposit ?? 0 : freshBreakdown.deposit;
  const balance = viewOnly ? params.balance ?? 0 : freshBreakdown.balance;
  const [cancelVisible, setCancelVisible] = useState(false);

  const handleConfirm = () => {
    if (!canBookMore) return;
    addBooking({
      service,
      date,
      time,
      rawDate,
      address,
      subtotal,
      discountAmount,
      discountCode: discountPercent > 0 ? discountCodeUsed : null,
      tax,
      taxLines,
      total,
      deposit,
      balance,
    });
    if (discountPercent > 0) consumeDiscount();
    navigation.navigate('Success', { service, date, time, rawDate, address, deposit, balance });
  };

  const handleCancelBooking = () => {
    cancelBooking(id);
    setCancelVisible(false);
    navigation.popToTop();
  };

  const handleReschedule = () => {
    cancelBooking(id);
    navigation.navigate('Booking', { service });
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

        <Text style={styles.title}>
          {!viewOnly ? 'Confirm booking' : canModify || status === 'on_the_way' || status === 'in_progress' ? 'Your booking' : 'Past job'}
        </Text>
        {viewOnly && params.adminNote ? (
          <View style={[styles.statusBanner, styles.statusNeutral]}>
            <Text style={styles.statusBannerText}>Note from Bristle: {params.adminNote}</Text>
          </View>
        ) : null}
        {viewOnly && status && status !== 'active' ? (
          <View
            style={[
              styles.statusBanner,
              status === 'on_the_way' || status === 'in_progress' ? styles.statusGood : status === 'cancelled' ? styles.statusBad : styles.statusNeutral,
            ]}
          >
            <Text style={styles.statusBannerText}>
              {status === 'on_the_way'
                ? 'Your cleaner is on the way!'
                : status === 'in_progress'
                  ? 'Your clean is underway'
                  : status === 'completed'
                  ? 'Completed'
                  : 'Cancelled'}
            </Text>
          </View>
        ) : null}

        <GlassCard style={styles.card} intensity={45}>
          <View style={styles.cardInner}>
            <Row label="Package" value={service.name} />
            {service.tasks?.length > 0 && (
              <Row label="Tasks" value={service.tasks.map((t) => t.label).join(', ')} />
            )}
            <Row label="Date" value={date} />
            <Row label="Time" value={time} />
            <Row label="Address" value={address} />
            {viewOnly && params.cleanerName ? <Row label="Cleaner" value={params.cleanerName.split(' ')[0]} /> : null}
            <View style={styles.divider} />
            <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
            {discountAmount > 0 && (
              <Row label={`Discount (${discountCodeUsed})`} value={`-$${discountAmount.toFixed(2)}`} discount />
            )}
            {taxLines.map((t) => (
              <Row key={t.label} label={t.label} value={`$${t.amount.toFixed(2)}`} />
            ))}
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
          <AnimatedPressable
            style={[styles.button, !canBookMore && styles.buttonDisabled]}
            onPress={handleConfirm}
            disabled={!canBookMore}
          >
            <Text style={styles.buttonText}>Pay ${deposit.toFixed(2)} deposit</Text>
          </AnimatedPressable>
        )}

        {canModify && (
          <>
            <AnimatedPressable style={styles.rescheduleButton} onPress={handleReschedule}>
              <Text style={styles.rescheduleButtonText}>Reschedule</Text>
            </AnimatedPressable>
            <AnimatedPressable style={styles.cancelButton} onPress={() => setCancelVisible(true)}>
              <Text style={styles.cancelButtonText}>Cancel booking</Text>
            </AnimatedPressable>
          </>
        )}
      </View>

      <ConfirmModal
        visible={cancelVisible}
        title="Cancel booking?"
        message={`This will cancel your ${service.name.toLowerCase()} on ${date}.`}
        onRequestClose={() => setCancelVisible(false)}
        buttons={[
          { text: 'Keep booking', style: 'cancel', onPress: () => setCancelVisible(false) },
          { text: 'Cancel booking', style: 'destructive', onPress: handleCancelBooking },
        ]}
      />
    </View>
  );
}

function Row({ label, value, bold, discount }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, discount && styles.rowLabelDiscount]}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowValueBold, discount && styles.rowValueDiscount]}>
        {value}
      </Text>
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
  rowLabelDiscount: {
    color: '#3F8557',
  },
  rowValueDiscount: {
    color: '#3F8557',
    fontWeight: '700',
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
  statusBanner: {
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  statusGood: { backgroundColor: '#3F8557' },
  statusBad: { backgroundColor: '#A32D2D' },
  statusNeutral: { backgroundColor: colors.primary },
  statusBannerText: { color: colors.accentText, fontSize: 13, fontWeight: '700' },
  rescheduleButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  rescheduleButtonText: {
    color: colors.accentText,
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  cancelButtonText: {
    color: '#A32D2D',
    fontSize: 15,
    fontWeight: '600',
  },
});

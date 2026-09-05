import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import { useBooking } from '../context/BookingContext';
import GlassCard from '../components/GlassCard';
import { getDepositBreakdown } from '../utils/pricing';

export default function ConfirmScreen({ route, navigation }) {
  const { service, date, time, address, viewOnly } = route.params;
  const { setUpcomingBooking } = useBooking();
  const { deposit, balance } = getDepositBreakdown(service.price);

  const handleConfirm = () => {
    setUpcomingBooking({ service, date, time, address, deposit, balance });
    navigation.navigate('Success', { service, date, time, deposit, balance });
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
        {viewOnly && (
          <GlassCard style={styles.backButton} intensity={30} onPress={() => navigation.goBack()}>
            <View style={styles.backButtonInner}>
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
            </View>
          </GlassCard>
        )}

        <Text style={styles.title}>{viewOnly ? 'Your booking' : 'Confirm booking'}</Text>

        <GlassCard style={styles.card} intensity={45}>
          <View style={styles.cardInner}>
            <Row label="Service" value={service.name} />
            <Row label="Date" value={date} />
            <Row label="Time" value={time} />
            <Row label="Address" value={address} />
            <View style={styles.divider} />
            <Row label="Total" value={`$${service.price.toFixed(2)}`} />
            <Row label="Deposit due now (50%)" value={`$${deposit.toFixed(2)}`} bold />
            <Row label="Balance due after clean" value={`$${balance.toFixed(2)}`} />
          </View>
        </GlassCard>

        {!viewOnly && (
          <Pressable style={styles.button} onPress={handleConfirm}>
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: spacing.lg,
  },
  backButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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

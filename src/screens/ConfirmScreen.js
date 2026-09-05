import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';
import { useBooking } from '../context/BookingContext';

export default function ConfirmScreen({ route, navigation }) {
  const { service, date, time, address } = route.params;
  const { setUpcomingBooking } = useBooking();

  const handleConfirm = () => {
    setUpcomingBooking({ service, date, time, address });
    navigation.navigate('Success', { service, date, time });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirm booking</Text>

      <View style={styles.card}>
        <Row label="Service" value={service.name} />
        <Row label="Date" value={date} />
        <Row label="Time" value={time} />
        <Row label="Address" value={address} />
        <View style={styles.divider} />
        <Row label="Total" value={`$${service.price}`} bold />
      </View>

      <Pressable style={styles.button} onPress={handleConfirm}>
        <Text style={styles.buttonText}>Confirm and pay</Text>
      </Pressable>
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
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
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

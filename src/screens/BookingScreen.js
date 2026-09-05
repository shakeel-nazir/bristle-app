import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';

const timeSlots = ['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM'];
const dates = ['Today', 'Tomorrow', 'Thu, Sep 10', 'Fri, Sep 11'];

export default function BookingScreen({ route, navigation }) {
  const { service } = route.params;
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (!selectedTime) {
      setError('Pick a time slot first');
      return;
    }
    if (!address.trim()) {
      setError('Enter your address');
      return;
    }
    setError('');
    navigation.navigate('Confirm', {
      service,
      date: selectedDate,
      time: selectedTime,
      address,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
      </Pressable>

      <Text style={styles.title}>{service.name}</Text>
      <Text style={styles.price}>From ${service.price} · {service.duration}</Text>

      <Text style={styles.sectionLabel}>Choose a date</Text>
      <View style={styles.row}>
        {dates.map((d) => (
          <Pressable
            key={d}
            style={[styles.chip, selectedDate === d && styles.chipSelected]}
            onPress={() => setSelectedDate(d)}
          >
            <Text style={[styles.chipText, selectedDate === d && styles.chipTextSelected]}>{d}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Choose a time</Text>
      <View style={styles.row}>
        {timeSlots.map((t) => (
          <Pressable
            key={t}
            style={[styles.chip, selectedTime === t && styles.chipSelected]}
            onPress={() => setSelectedTime(t)}
          >
            <Text style={[styles.chipText, selectedTime === t && styles.chipTextSelected]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Address</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your address"
        placeholderTextColor={colors.textSecondary}
        value={address}
        onChangeText={(text) => {
          setAddress(text);
          if (error) setError('');
        }}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 64,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  price: {
    fontSize: 14,
    color: colors.accent,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.background,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
  },
  error: {
    color: '#A32D2D',
    fontSize: 13,
    marginTop: spacing.sm,
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

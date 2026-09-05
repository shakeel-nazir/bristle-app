import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import MonthCalendar from '../components/MonthCalendar';
import AddressAutocomplete from '../components/AddressAutocomplete';
import GlassCard from '../components/GlassCard';

const timeSlots = ['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM'];

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatDate(date) {
  return `${WEEKDAY_SHORT[date.getDay()]}, ${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`;
}

// Cleaners aren't available on Sundays.
function isDateAvailable(date) {
  return date.getDay() !== 0;
}

export default function BookingScreen({ route, navigation }) {
  const { service } = route.params;
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [address, setAddress] = useState('');
  const [addressValid, setAddressValid] = useState(false);
  const [error, setError] = useState('');

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    if (error) setError('');
  };

  const handleContinue = () => {
    if (!selectedDate) {
      setError('Pick a date first');
      return;
    }
    if (!selectedTime) {
      setError('Pick a time slot first');
      return;
    }
    if (!address.trim()) {
      setError('Enter your Ottawa address');
      return;
    }
    if (!addressValid) {
      setError('Select an Ottawa address from the suggestions list to continue');
      return;
    }
    setError('');
    navigation.navigate('Confirm', {
      service,
      date: formatDate(selectedDate),
      time: selectedTime,
      address,
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.pageGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <GlassCard style={styles.backButton} intensity={30} onPress={() => navigation.goBack()}>
          <View style={styles.backButtonInner}>
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
          </View>
        </GlassCard>

        <Text style={styles.title}>{service.name}</Text>
        <Text style={styles.price}>${service.price} · {service.duration}</Text>

        {service.tasks?.length > 0 && (
          <GlassCard style={styles.tasksCard} intensity={45}>
            <View style={styles.tasksInner}>
              {service.tasks.map((task) => (
                <View key={task.id} style={styles.taskChip}>
                  <Text style={styles.taskChipText}>{task.label}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        )}

        <Text style={styles.sectionLabel}>Choose a date</Text>
        <MonthCalendar
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          isDateAvailable={isDateAvailable}
        />

        <Text style={styles.sectionLabel}>Available times</Text>
        <GlassCard style={styles.timesCard} intensity={45}>
          <View style={styles.timesInner}>
            {selectedDate ? (
              <>
                <Text style={styles.timesForDate}>{formatDate(selectedDate)}</Text>
                <View style={styles.row}>
                  {timeSlots.map((t) => (
                    <Pressable
                      key={t}
                      style={[styles.chip, selectedTime === t && styles.chipSelected]}
                      onPress={() => {
                        setSelectedTime(t);
                        if (error) setError('');
                      }}
                    >
                      <Text style={[styles.chipText, selectedTime === t && styles.chipTextSelected]}>{t}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : (
              <Text style={styles.timesEmpty}>Pick a date to see open slots</Text>
            )}
          </View>
        </GlassCard>

        <Text style={styles.sectionLabel}>Address (Ottawa only)</Text>
        <AddressAutocomplete
          placeholder="Start typing your Ottawa address"
          value={address}
          onChangeText={(text) => {
            setAddress(text);
            if (error) setError('');
          }}
          onValidChange={(valid) => {
            setAddressValid(valid);
            if (error) setError('');
          }}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
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
  },
  price: {
    fontSize: 14,
    color: colors.accent,
    marginBottom: spacing.md,
  },
  tasksCard: {
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  tasksInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    padding: spacing.md,
  },
  taskChip: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
  },
  taskChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  sectionLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  timesCard: {
    borderRadius: radius.lg,
  },
  timesInner: {
    padding: spacing.md,
  },
  timesForDate: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  timesEmpty: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.5)',
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

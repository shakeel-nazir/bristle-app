import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import GlassCard from '../components/GlassCard';
import GaugeRing from '../components/GaugeRing';

const MIN_MINUTES_PER_TASK = 20;

function formatMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export default function TaskBuilderScreen({ route, navigation }) {
  const { durationHours, price } = route.params;
  const capMinutes = durationHours * 60;

  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState('');

  const totalMinutes = tasks.reduce((sum, t) => sum + t.minutes, 0);
  const remaining = capMinutes - totalMinutes;
  const isFull = remaining <= 0;
  const canAddTask = taskName.trim().length > 0 && remaining >= MIN_MINUTES_PER_TASK;

  const handleAddTask = () => {
    if (!canAddTask) return;
    setTasks([...tasks, { id: `${Date.now()}`, label: taskName.trim(), minutes: MIN_MINUTES_PER_TASK }]);
    setTaskName('');
  };

  const adjustTask = (id, delta) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const otherMinutes = totalMinutes - t.minutes;
        const maxForTask = capMinutes - otherMinutes;
        const next = Math.min(maxForTask, Math.max(MIN_MINUTES_PER_TASK, t.minutes + delta));
        return { ...t, minutes: next };
      }),
    );
  };

  const removeTask = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const handleContinue = () => {
    if (!isFull) return;
    navigation.navigate('Booking', {
      service: {
        id: `custom-${durationHours}h`,
        name: `${durationHours}-Hour Clean`,
        price,
        duration: `${durationHours} hrs`,
        tasks,
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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

        <Text style={styles.title}>Build your {durationHours}-hour clean</Text>
        <Text style={styles.subtitle}>Add what you want done — each item takes at least 20 min</Text>

        <GaugeRing
          progress={totalMinutes / capMinutes}
          sublabel={`${formatMinutes(totalMinutes)} of ${formatMinutes(capMinutes)}`}
        />

        {isFull ? (
          <Text style={styles.fullText}>Your {durationHours} hours are fully booked</Text>
        ) : (
          <Text style={styles.remainingText}>{formatMinutes(remaining)} left to fill</Text>
        )}

        <GlassCard style={styles.addCard} intensity={45}>
          <View style={styles.addInner}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Kitchen, bathrooms, windows…"
              placeholderTextColor={colors.textSecondary}
              value={taskName}
              onChangeText={setTaskName}
              onSubmitEditing={handleAddTask}
              editable={!isFull}
            />
            <Pressable
              style={[styles.addButton, !canAddTask && styles.addButtonDisabled]}
              onPress={handleAddTask}
              disabled={!canAddTask}
            >
              <Ionicons name="add" size={20} color={colors.accentText} />
            </Pressable>
          </View>
        </GlassCard>

        {tasks.length > 0 && (
          <View style={styles.taskList}>
            {tasks.map((task) => (
              <GlassCard key={task.id} style={styles.taskRow} intensity={40}>
                <View style={styles.taskRowInner}>
                  <Text style={styles.taskLabel} numberOfLines={1}>{task.label}</Text>
                  <View style={styles.taskControls}>
                    <Pressable
                      style={styles.stepperButton}
                      onPress={() => adjustTask(task.id, -MIN_MINUTES_PER_TASK)}
                      disabled={task.minutes <= MIN_MINUTES_PER_TASK}
                    >
                      <Ionicons name="remove" size={14} color={colors.text} />
                    </Pressable>
                    <Text style={styles.taskMinutes}>{formatMinutes(task.minutes)}</Text>
                    <Pressable
                      style={styles.stepperButton}
                      onPress={() => adjustTask(task.id, MIN_MINUTES_PER_TASK)}
                      disabled={remaining < MIN_MINUTES_PER_TASK}
                    >
                      <Ionicons name="add" size={14} color={colors.text} />
                    </Pressable>
                    <Pressable style={styles.removeButton} onPress={() => removeTask(task.id)}>
                      <Ionicons name="close" size={16} color={colors.textSecondary} />
                    </Pressable>
                  </View>
                </View>
              </GlassCard>
            ))}
          </View>
        )}

        <Pressable
          style={[styles.continueButton, !isFull && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!isFull}
        >
          <Text style={[styles.continueText, !isFull && styles.continueTextDisabled]}>
            {isFull ? `Continue · $${price}` : 'Fill your time to continue'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: spacing.xl,
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
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  fullText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3F8557',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  remainingText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  addCard: {
    borderRadius: radius.lg,
    marginTop: spacing.lg,
  },
  addInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  taskList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  taskRow: {
    borderRadius: radius.md,
  },
  taskRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    paddingLeft: spacing.md,
  },
  taskLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginRight: spacing.sm,
  },
  taskControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepperButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskMinutes: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 44,
    textAlign: 'center',
  },
  removeButton: {
    marginLeft: spacing.xs,
    padding: spacing.xs,
  },
  continueButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  continueButtonDisabled: {
    backgroundColor: colors.border,
  },
  continueText: {
    color: colors.accentText,
    fontSize: 15,
    fontWeight: '600',
  },
  continueTextDisabled: {
    color: colors.textSecondary,
  },
});

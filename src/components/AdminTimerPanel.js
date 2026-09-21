import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import { timerState, formatClock } from '../utils/cleanTimer';
import useNow from '../utils/useNow';

// A dot on the progress bar where a task finishes: green when done, and it pulses when that task
// is about to finish.
function BarDot({ fraction, done, almostDone }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!almostDone) return undefined;
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [almostDone, pulse]);

  return (
    <View style={[styles.barDotWrap, { left: `${fraction * 100}%` }]} pointerEvents="none">
      {almostDone ? (
        <Animated.View
          style={[
            styles.barHalo,
            {
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
            },
          ]}
        />
      ) : null}
      <View style={[styles.barDot, done && styles.barDotDone, almostDone && styles.barDotSoon]} />
    </View>
  );
}

// The same live timer the customer sees, in a compact form for the admin booking card.
export default function AdminTimerPanel({ booking }) {
  const now = useNow();
  if (!booking.startedMs) return null;
  const t = timerState(booking, now);
  const current = t.tasks[t.currentIndex];
  const over = t.finished && t.overMs > 0;

  return (
    <View style={[styles.panel, over && styles.panelOver]}>
      <View style={styles.top}>
        <View style={styles.big}>
          <Text style={[styles.bigTime, over && styles.textOver]}>
            {over ? `+${formatClock(t.overMs)}` : formatClock(t.remainingMs)}
          </Text>
          <Text style={styles.bigLabel}>{over ? 'over the booked time' : 'left in total'}</Text>
        </View>
        <View style={styles.now}>
          {t.finished ? (
            <Text style={[styles.nowTask, over && styles.textOver]}>
              {over ? 'Past the booked time' : 'All tasks done'}
            </Text>
          ) : (
            <>
              <Text style={styles.nowLabel}>
                Task {t.currentIndex + 1} of {t.tasks.length}{current?.almostDone ? ' · almost done' : ''}
              </Text>
              <Text style={styles.nowTask} numberOfLines={1}>{current?.label}</Text>
              <Text style={styles.nowClock}>{formatClock(current?.leftMs ?? 0)}</Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.barWrap}>
        <View style={styles.track}>
          <View style={[styles.fill, over && styles.fillOver, { width: `${Math.round(t.progress * 100)}%` }]} />
        </View>
        {t.tasks.slice(0, -1).map((task, i) => (
          <BarDot
            key={`${task.label}-${i}`}
            fraction={task.endFraction}
            done={task.state === 'done'}
            almostDone={task.almostDone}
          />
        ))}
      </View>

      <View style={styles.tasks}>
        {t.tasks.map((task, i) => (
          <View key={`${task.label}-${i}`} style={styles.taskRow}>
            <Ionicons
              name={task.state === 'done' ? 'checkmark-circle' : task.state === 'current' ? 'play-circle' : 'ellipse-outline'}
              size={16}
              color={task.state === 'done' ? '#3F8557' : task.state === 'current' ? colors.accent : colors.border}
            />
            <Text
              style={[styles.taskLabel, task.state === 'done' && styles.taskDone, task.state === 'current' && styles.taskCurrent]}
              numberOfLines={1}
            >
              {task.label}
            </Text>
            <Text style={[styles.taskTime, task.state === 'current' && styles.taskTimeCurrent]}>
              {task.state === 'done' ? 'Done' : task.state === 'current' ? formatClock(task.leftMs) : `${task.minutes} min`}
            </Text>
          </View>
        ))}
      </View>

      {over ? <Text style={styles.overHint}>Mark completed when your cleaner is finished.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: 'rgba(232,115,74,0.10)', borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm, marginBottom: spacing.xs },
  panelOver: { backgroundColor: 'rgba(163,45,45,0.10)' },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  big: { minWidth: 110 },
  bigTime: { fontSize: 26, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  bigLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  now: { flex: 1, alignItems: 'flex-end' },
  nowLabel: { fontSize: 11, fontWeight: '700', color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.5 },
  nowTask: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 1 },
  nowClock: { fontSize: 18, fontWeight: '800', color: colors.accent, fontVariant: ['tabular-nums'] },
  textOver: { color: '#A32D2D' },
  barWrap: { height: 14, justifyContent: 'center', marginTop: spacing.sm },
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(46,42,38,0.10)', overflow: 'hidden' },
  barDotWrap: { position: 'absolute', top: 0, width: 14, height: 14, marginLeft: -7, alignItems: 'center', justifyContent: 'center' },
  barHalo: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  barDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: 'rgba(46,42,38,0.35)' },
  barDotDone: { backgroundColor: '#3F8557', borderColor: '#FFFFFF' },
  barDotSoon: { backgroundColor: colors.accent, borderColor: '#FFFFFF' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: colors.accent },
  fillOver: { backgroundColor: '#A32D2D' },
  tasks: { marginTop: spacing.sm, gap: 4 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  taskLabel: { flex: 1, fontSize: 13, color: colors.textSecondary },
  taskDone: { textDecorationLine: 'line-through', opacity: 0.7 },
  taskCurrent: { color: colors.text, fontWeight: '700' },
  taskTime: { fontSize: 12, color: colors.textSecondary, fontVariant: ['tabular-nums'] },
  taskTimeCurrent: { color: colors.accent, fontWeight: '700' },
  overHint: { fontSize: 12, color: '#A32D2D', fontWeight: '600', marginTop: spacing.sm },
});

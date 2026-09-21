import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import GlassCard from './GlassCard';
import AnimatedPressable from './AnimatedPressable';
import { timerState, formatClock, formatLeft } from '../utils/cleanTimer';

const SIZE = 136;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Re-renders every second so the clocks tick. Nothing is written anywhere; the time is worked out
// from when the clean was started.
function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function PulsingDot() {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <View style={styles.dotWrap}>
      <Animated.View
        style={[
          styles.dotHalo,
          { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }] },
        ]}
      />
      <View style={styles.dot} />
    </View>
  );
}

// The big "your clean is underway" card on Home: overall ring, the task being done right now with
// its own countdown, and a checklist that fills in as each task finishes.
export default function CleaningTimerCard({ booking, onViewBooking }) {
  const now = useNow();
  const t = timerState(booking, now);
  const current = t.tasks[t.currentIndex];
  const firstName = booking.cleanerName ? booking.cleanerName.split(' ')[0] : null;

  return (
    <GlassCard style={styles.card} intensity={55}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <PulsingDot />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Your clean is underway</Text>
            <Text style={styles.subtitle}>
              {firstName ? `${firstName} is working on it` : 'Your cleaner is working on it'}
              {' · '}
              {booking.service?.name}
            </Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.ringWrap}>
            <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              <Defs>
                <LinearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#F2A15B" />
                  <Stop offset="55%" stopColor="#E8734A" />
                  <Stop offset="100%" stopColor="#D65B8A" />
                </LinearGradient>
              </Defs>
              <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke="rgba(46,42,38,0.08)" strokeWidth={STROKE} fill="none" />
              <Circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                stroke="url(#timerGradient)"
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - t.progress)}
                strokeOpacity={t.progress > 0.004 ? 1 : 0}
                fill="none"
                rotation="-90"
                origin={`${SIZE / 2}, ${SIZE / 2}`}
              />
            </Svg>
            <View style={styles.ringCenter} pointerEvents="none">
              {t.finished ? (
                <Ionicons name="sparkles" size={34} color={colors.accent} />
              ) : (
                <>
                  <Text style={styles.ringTime}>{formatClock(t.remainingMs)}</Text>
                  <Text style={styles.ringLabel}>left in total</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.now}>
            {t.finished ? (
              <>
                <Text style={styles.nowLabel}>Almost done</Text>
                <Text style={styles.nowTask}>Final touches</Text>
                <Text style={styles.nowHint}>Your cleaner is wrapping up the last details.</Text>
              </>
            ) : (
              <>
                <Text style={styles.nowLabel}>Right now</Text>
                <Text style={styles.nowTask} numberOfLines={2}>
                  {current?.label}
                </Text>
                <Text style={styles.nowClock}>{formatClock(current?.leftMs ?? 0)}</Text>
                <View style={styles.track}>
                  <View style={[styles.trackFill, { width: `${Math.round((current?.progress ?? 0) * 100)}%` }]} />
                </View>
                <Text style={styles.nowHint}>
                  Task {t.currentIndex + 1} of {t.tasks.length} · {formatLeft(t.remainingMs)}
                </Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.list}>
          {t.tasks.map((task, i) => (
            <View key={`${task.label}-${i}`} style={[styles.row, task.state === 'current' && styles.rowCurrent]}>
              <View
                style={[
                  styles.check,
                  task.state === 'done' && styles.checkDone,
                  task.state === 'current' && styles.checkCurrent,
                ]}
              >
                {task.state === 'done' ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                {task.state === 'current' ? <View style={styles.checkInner} /> : null}
              </View>
              <Text
                style={[styles.rowLabel, task.state === 'done' && styles.rowLabelDone, task.state === 'current' && styles.rowLabelCurrent]}
                numberOfLines={1}
              >
                {task.label}
              </Text>
              <Text style={[styles.rowTime, task.state === 'current' && styles.rowTimeCurrent]}>
                {task.state === 'done' ? 'Done' : task.state === 'current' ? formatClock(task.leftMs) : `${task.minutes} min`}
              </Text>
            </View>
          ))}
        </View>

        {onViewBooking ? (
          <View style={styles.footer}>
            <AnimatedPressable style={styles.viewButton} onPress={onViewBooking}>
              <Text style={styles.viewButtonText}>View Booking</Text>
            </AnimatedPressable>
          </View>
        ) : null}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, marginBottom: spacing.md },
  inner: { padding: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dotWrap: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  dotHalo: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#3F8557' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3F8557' },
  title: { fontSize: 16, fontWeight: '700', color: colors.primary },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  ringWrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ringTime: { fontSize: 24, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  ringLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  now: { flex: 1 },
  nowLabel: { fontSize: 11, fontWeight: '700', color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.6 },
  nowTask: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 2 },
  nowClock: { fontSize: 26, fontWeight: '800', color: colors.accent, marginTop: 2, fontVariant: ['tabular-nums'] },
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(46,42,38,0.08)', overflow: 'hidden', marginTop: 6 },
  trackFill: { height: '100%', borderRadius: 3, backgroundColor: colors.accent },
  nowHint: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  list: { marginTop: spacing.md, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 8, paddingHorizontal: 10, borderRadius: radius.sm },
  rowCurrent: { backgroundColor: 'rgba(232,115,74,0.12)' },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: '#3F8557', borderColor: '#3F8557' },
  checkCurrent: { borderColor: colors.accent },
  checkInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  rowLabel: { flex: 1, fontSize: 14, color: colors.textSecondary },
  rowLabelDone: { color: colors.textSecondary, textDecorationLine: 'line-through', opacity: 0.7 },
  rowLabelCurrent: { color: colors.text, fontWeight: '700' },
  rowTime: { fontSize: 12, color: colors.textSecondary, fontVariant: ['tabular-nums'] },
  footer: { alignItems: 'flex-end', marginTop: spacing.md },
  viewButton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 18 },
  viewButtonText: { color: colors.background, fontSize: 14, fontWeight: '700' },
  rowTimeCurrent: { color: colors.accent, fontWeight: '700' },
});

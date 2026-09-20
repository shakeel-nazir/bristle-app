import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import GlassCard from '../components/GlassCard';
import AnimatedPressable from '../components/AnimatedPressable';
import {
  adminSignIn,
  adminSignOut,
  fetchApplications,
  fetchBookings,
  isFirebaseConfigured,
  watchAdminUser,
} from '../services/adminApi';

function formatWhen(ms) {
  if (!ms) return '';
  return new Date(ms).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' });
}

function money(n) {
  return typeof n === 'number' ? `$${n.toFixed(2)}` : '—';
}

export default function AdminScreen({ navigation }) {
  const [user, setUser] = useState(undefined);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => watchAdminUser(setUser), []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [b, a] = await Promise.all([fetchBookings(), fetchApplications()]);
      setBookings(b);
      setApplications(a);
    } catch (e) {
      setLoadError("Couldn't load data. This account may not have admin access.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const handleSignIn = async () => {
    setError('');
    try {
      await adminSignIn(email, password);
    } catch (e) {
      setError('Sign-in failed. Check your email and password.');
    }
  };

  const items = tab === 'bookings' ? bookings : applications;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.pageGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <GlassCard style={styles.backButton} intensity={30} onPress={() => navigation.goBack()}>
            <View style={styles.backButtonInner}>
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
            </View>
          </GlassCard>
          {user ? (
            <View style={styles.headerActions}>
              <AnimatedPressable onPress={load}>
                <Text style={styles.link}>Refresh</Text>
              </AnimatedPressable>
              <AnimatedPressable onPress={adminSignOut}>
                <Text style={styles.linkDanger}>Sign out</Text>
              </AnimatedPressable>
            </View>
          ) : null}
        </View>

        <Text style={styles.title}>Admin</Text>

        {!isFirebaseConfigured ? (
          <Text style={styles.muted}>Firebase isn't configured for this build.</Text>
        ) : user === undefined ? (
          <ActivityIndicator color={colors.accent} />
        ) : !user ? (
          <GlassCard style={styles.card} intensity={45}>
            <View style={styles.cardInner}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onSubmitEditing={handleSignIn}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <AnimatedPressable style={styles.button} onPress={handleSignIn}>
                <Text style={styles.buttonText}>Sign in</Text>
              </AnimatedPressable>
            </View>
          </GlassCard>
        ) : (
          <>
            <View style={styles.tabs}>
              {[
                ['bookings', `Bookings (${bookings.length})`],
                ['applications', `Applications (${applications.length})`],
              ].map(([key, label]) => (
                <AnimatedPressable
                  key={key}
                  style={[styles.tab, tab === key && styles.tabActive]}
                  onPress={() => setTab(key)}
                >
                  <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
                </AnimatedPressable>
              ))}
            </View>

            {loading ? <ActivityIndicator color={colors.accent} /> : null}
            {loadError ? <Text style={styles.error}>{loadError}</Text> : null}
            {!loading && !loadError && items.length === 0 ? (
              <Text style={styles.muted}>Nothing here yet.</Text>
            ) : null}

            {tab === 'bookings'
              ? bookings.map((b) => <BookingCard key={b.id} b={b} />)
              : applications.map((a) => <ApplicationCard key={a.id} a={a} />)}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StatusPill({ status }) {
  const cancelled = status === 'cancelled';
  return (
    <View style={[styles.pill, cancelled ? styles.pillCancelled : styles.pillActive]}>
      <Text style={[styles.pillText, cancelled ? styles.pillTextCancelled : styles.pillTextActive]}>
        {status || 'active'}
      </Text>
    </View>
  );
}

function Line({ label, value }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={styles.lineValue}>{value}</Text>
    </View>
  );
}

function BookingCard({ b }) {
  return (
    <GlassCard style={styles.card} intensity={45}>
      <View style={styles.cardInner}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>{b.service?.name || 'Booking'}</Text>
          <StatusPill status={b.status} />
        </View>
        <Line label="When" value={`${b.date || ''} · ${b.time || ''}`} />
        <Line label="Address" value={b.address} />
        <Line label="Tasks" value={b.service?.tasks?.map((t) => t.label).join(', ')} />
        <Line label="Total" value={money(b.total)} />
        <Line label="Deposit" value={money(b.deposit)} />
        <Line label="Discount" value={b.discountCode ? `${b.discountCode} (-${money(b.discountAmount)})` : ''} />
        <Line label="Booked" value={formatWhen(b.createdMs)} />
      </View>
    </GlassCard>
  );
}

function ApplicationCard({ a }) {
  return (
    <GlassCard style={styles.card} intensity={45}>
      <View style={styles.cardInner}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>{a.fullName || 'Applicant'}</Text>
          <StatusPill status={a.status} />
        </View>
        <Line label="Email" value={a.email} />
        <Line label="Phone" value={a.phone} />
        <Line label="Experience" value={a.experience} />
        <Line label="Days" value={a.days?.join(', ')} />
        <Line label="Times" value={a.timeBlocks?.join(', ')} />
        <Line label="About" value={a.about} />
        <Line label="Submitted" value={formatWhen(a.createdMs)} />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: 64, paddingBottom: spacing.xl },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerActions: { flexDirection: 'row', gap: spacing.md },
  backButton: { width: 36, height: 36, borderRadius: 18 },
  backButtonInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: colors.primary, marginBottom: spacing.md },
  link: { fontSize: 13, fontWeight: '600', color: colors.accent },
  linkDanger: { fontSize: 13, fontWeight: '600', color: '#A32D2D' },
  muted: { fontSize: 13, color: colors.textSecondary },
  card: { borderRadius: radius.lg, marginBottom: spacing.sm },
  cardInner: { padding: spacing.md },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1, marginRight: spacing.sm },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, gap: spacing.md },
  lineLabel: { fontSize: 12, color: colors.textSecondary },
  lineValue: { fontSize: 12, color: colors.text, maxWidth: '70%', textAlign: 'right' },
  pill: { borderRadius: 10, paddingVertical: 3, paddingHorizontal: 8 },
  pillActive: { backgroundColor: 'rgba(63,133,87,0.15)' },
  pillCancelled: { backgroundColor: 'rgba(163,45,45,0.12)' },
  pillText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  pillTextActive: { color: '#3F8557' },
  pillTextCancelled: { color: '#A32D2D' },
  tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  tab: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 13, color: colors.text },
  tabTextActive: { color: colors.background },
  label: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
  },
  error: { color: '#A32D2D', fontSize: 13, marginTop: spacing.sm },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonText: { color: colors.accentText, fontSize: 15, fontWeight: '600' },
});

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import GlassCard from '../components/GlassCard';
import AnimatedPressable from '../components/AnimatedPressable';
import ConfirmModal from '../components/ConfirmModal';
import AssignCleanerModal from '../components/AssignCleanerModal';
import {
  adminSignIn,
  adminSignOut,
  fetchApplications,
  fetchBookings,
  isFirebaseConfigured,
  setApplicationStatus,
  removeApplication,
  removeBooking,
  setBookingCleaner,
  setBookingStatus,
  watchAdminUser,
} from '../services/adminApi';
import { STATUS_LABELS, isFinalStatus, nextStatus } from '../utils/applicationStatus';
import { describeHome } from '../utils/home';
import { cleanerStats } from '../utils/cleanerStats';

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
  const [tab, setTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [assigning, setAssigning] = useState(null); // booking currently being matched
  const [toDelete, setToDelete] = useState(null); // { kind: 'booking' | 'application', id, label }

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

  const changeStatus = async (id, status) => {
    setLoadError('');
    try {
      await setApplicationStatus(id, status, applications.find((a) => a.id === id));
      setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch (e) {
      setLoadError("Couldn't update that application. Check your admin rules and try again.");
    }
  };

  const changeBookingStatus = async (id, status) => {
    setLoadError('');
    try {
      await setBookingStatus(id, status);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    } catch (e) {
      setLoadError("Couldn't update that booking. Check your admin rules and try again.");
    }
  };

  const assign = async (cleaner) => {
    const booking = assigning;
    setAssigning(null);
    if (!booking) return;
    setLoadError('');
    try {
      await setBookingCleaner(booking.id, cleaner);
      const fields = { cleanerId: cleaner ? cleaner.id : null, cleanerName: cleaner ? cleaner.fullName || 'Cleaner' : null };
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, ...fields } : b)));
    } catch (e) {
      setLoadError("Couldn't assign that cleaner. Check your admin rules and try again.");
    }
  };

  const confirmDelete = async () => {
    const target = toDelete;
    setToDelete(null);
    if (!target) return;
    setLoadError('');
    try {
      if (target.kind === 'booking') {
        await removeBooking(target.id);
        setBookings((prev) => prev.filter((b) => b.id !== target.id));
      } else {
        await removeApplication(target.id);
        setApplications((prev) => prev.filter((a) => a.id !== target.id));
      }
    } catch (e) {
      setLoadError("Couldn't delete that. Check your admin rules and try again.");
    }
  };

  const handleSignIn = async () => {
    setError('');
    try {
      await adminSignIn(email, password);
    } catch (e) {
      setError('Sign-in failed. Check your email and password.');
    }
  };

  const isUpcoming = (b) => b.status === 'active' || b.status === 'on_the_way' || !b.status;
  const upcoming = bookings.filter(isUpcoming);
  const past = bookings.filter((b) => !isUpcoming(b));
  const cleaners = applications.filter((a) => a.status === 'approved');
  const items = tab === 'upcoming' ? upcoming : tab === 'past' ? past : tab === 'cleaners' ? cleaners : applications;

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
                ['upcoming', `Upcoming (${upcoming.length})`],
                ['past', `Past (${past.length})`],
                ['cleaners', `Cleaners (${cleaners.length})`],
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

            {tab === 'cleaners'
              ? cleaners.map((c) => <CleanerCard key={c.id} c={c} bookings={bookings} />)
              : tab === 'applications'
              ? applications.map((a) => <ApplicationCard key={a.id} a={a} onChange={changeStatus} onDelete={() => setToDelete({ kind: 'application', id: a.id, label: a.fullName || 'this applicant' })} />)
              : items.map((b) => <BookingCard key={b.id} b={b} onChange={changeBookingStatus} onAssign={() => setAssigning(b)} onDelete={() => setToDelete({ kind: 'booking', id: b.id, label: `${b.service?.name || 'this booking'} on ${b.date || ''}` })} />)}
          </>
        )}
      </ScrollView>

      <AssignCleanerModal
        visible={!!assigning}
        booking={assigning ? bookings.find((b) => b.id === assigning.id) || assigning : null}
        cleaners={applications.filter((a) => a.status === 'approved')}
        bookings={bookings}
        onClose={() => setAssigning(null)}
        onAssign={assign}
      />

      <ConfirmModal
        visible={!!toDelete}
        title={toDelete?.kind === 'booking' ? 'Delete this booking?' : 'Delete this application?'}
        message={`This permanently deletes ${toDelete?.label || ''}. It can’t be undone.`}
        onRequestClose={() => setToDelete(null)}
        buttons={[
          { text: 'Keep', style: 'cancel', onPress: () => setToDelete(null) },
          { text: 'Delete', style: 'destructive', onPress: confirmDelete },
        ]}
      />
    </View>
  );
}

function StatusPill({ status }) {
  const bad = status === 'cancelled' || status === 'declined';
  const good = status === 'active' || status === 'approved' || !status;
  return (
    <View style={[styles.pill, bad ? styles.pillCancelled : good ? styles.pillActive : styles.pillProgress]}>
      <Text style={[styles.pillText, bad ? styles.pillTextCancelled : good ? styles.pillTextActive : styles.pillTextProgress]}>
        {STATUS_LABELS[status] || 'Active'}
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

function BookingCard({ b, onChange, onAssign, onDelete }) {
  const scheduled = b.status === 'active' || !b.status;
  const enRoute = b.status === 'on_the_way';
  return (
    <GlassCard style={styles.card} intensity={45}>
      <View style={styles.cardInner}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>{b.service?.name || 'Booking'}</Text>
          <StatusPill status={b.status} />
        </View>
        <Line label="When" value={`${b.date || ''} · ${b.time || ''}`} />
        <Line label="Address" value={b.address} />
        <Line label="Home" value={describeHome(b.home)} />
        <Line label="Pet notes" value={b.home?.petNotes} />
        <Line label="Cleaner" value={b.cleanerName || (b.status === 'active' || b.status === 'on_the_way' || !b.status ? 'Not assigned' : '')} />
        <Line label="Tasks" value={b.service?.tasks?.map((t) => t.label).join(', ')} />
        <Line label="Total" value={money(b.total)} />
        <Line label="Deposit" value={money(b.deposit)} />
        <Line label="Discount" value={b.discountCode ? `${b.discountCode} (-${money(b.discountAmount)})` : ''} />
        <Line label="Booked" value={formatWhen(b.createdMs)} />
        <View style={styles.actions}>
            {scheduled ? (
              <AnimatedPressable style={styles.advanceButton} onPress={() => onChange(b.id, 'on_the_way')}>
                <Text style={styles.advanceText}>Cleaner is on the way</Text>
              </AnimatedPressable>
            ) : null}
          {scheduled || enRoute ? (
            <AnimatedPressable
              style={enRoute ? styles.advanceButton : styles.secondaryButton}
              onPress={() => onChange(b.id, 'completed')}
            >
              <Text style={enRoute ? styles.advanceText : styles.secondaryText}>Mark completed</Text>
            </AnimatedPressable>
          ) : null}
          {scheduled || enRoute ? (
            <AnimatedPressable style={styles.secondaryButton} onPress={onAssign}>
              <Text style={styles.secondaryText}>{b.cleanerId ? 'Change cleaner' : 'Assign cleaner'}</Text>
            </AnimatedPressable>
          ) : null}
          <AnimatedPressable style={styles.deleteButton} onPress={onDelete}>
            <Text style={styles.declineText}>Delete</Text>
          </AnimatedPressable>
        </View>
      </View>
    </GlassCard>
  );
}

function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const STATE_LABEL = { en_route: 'En route', booked: 'Booked', free: 'Free' };

function CleanerCard({ c, bookings }) {
  const st = cleanerStats(c, bookings);
  const where = st.enRoute
    ? `On the way to ${st.enRoute.address}`
    : st.next
      ? `Next: ${st.next.date} · ${st.next.time} — ${st.next.address}`
      : 'No upcoming jobs';
  return (
    <GlassCard style={styles.card} intensity={45}>
      <View style={styles.cardInner}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>{c.fullName || 'Cleaner'}</Text>
          <View style={[styles.pill, st.state === 'free' ? styles.pillActive : styles.pillProgress]}>
            <Text style={[styles.pillText, st.state === 'free' ? styles.pillTextActive : styles.pillTextProgress]}>
              {STATE_LABEL[st.state]}
            </Text>
          </View>
        </View>

        <View style={styles.stats}>
          <Stat value={st.completed} label="Jobs done" />
          <Stat value={st.upcoming} label="Upcoming" />
          <Stat value={`${st.freePercent}%`} label="Free (7 days)" />
        </View>

        <Line label="Right now" value={where} />
        <Line label="Booked, next 7 days" value={`${st.bookedHours} of ${st.capacity} hrs`} />
        <Line label="Hours worked" value={`${st.completedHours} hrs`} />
        <Line label="Works" value={`${(c.days || []).join(', ')} · ${(c.timeBlocks || []).join(', ')}`} />
        <Line label="Experience" value={c.experience} />
        <Line label="Email" value={c.email} />
        <Line label="Phone" value={c.phone} />

        <View style={styles.actions}>
          {c.phone ? (
            <AnimatedPressable
              style={styles.advanceButton}
              onPress={() => Linking.openURL(`tel:${String(c.phone).replace(/[^\d+]/g, '')}`)}
            >
              <Text style={styles.advanceText}>Call</Text>
            </AnimatedPressable>
          ) : null}
          {c.email ? (
            <AnimatedPressable style={styles.secondaryButton} onPress={() => Linking.openURL(`mailto:${c.email}`)}>
              <Text style={styles.secondaryText}>Email</Text>
            </AnimatedPressable>
          ) : null}
        </View>
      </View>
    </GlassCard>
  );
}

function ApplicationCard({ a, onChange, onDelete }) {
  const next = nextStatus(a.status);
  const open = !isFinalStatus(a.status);
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
        <View style={styles.actions}>
          {open && next ? (
              <AnimatedPressable style={styles.advanceButton} onPress={() => onChange(a.id, next)}>
                <Text style={styles.advanceText}>
                  {next === 'approved' ? 'Approve' : `Move to ${STATUS_LABELS[next]}`}
                </Text>
              </AnimatedPressable>
          ) : null}
          {open ? (
            <AnimatedPressable style={styles.declineButton} onPress={() => onChange(a.id, 'declined')}>
              <Text style={styles.declineText}>Decline</Text>
            </AnimatedPressable>
          ) : null}
          <AnimatedPressable style={styles.deleteButton} onPress={onDelete}>
            <Text style={styles.declineText}>Delete</Text>
          </AnimatedPressable>
        </View>
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
  pillProgress: { backgroundColor: 'rgba(232,115,74,0.15)' },
  pillTextProgress: { color: colors.accent },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  advanceButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  advanceText: { color: colors.accentText, fontSize: 13, fontWeight: '600' },
  stats: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 9,
    paddingHorizontal: spacing.md,
  },
  secondaryText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  deleteButton: { paddingVertical: 10, paddingHorizontal: spacing.sm, marginLeft: 'auto' },
  declineButton: { paddingVertical: 10, paddingHorizontal: spacing.sm },
  declineText: { color: '#A32D2D', fontSize: 13, fontWeight: '600' },
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

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import GlassCard from '../components/GlassCard';
import AnimatedPressable from '../components/AnimatedPressable';
import ConfirmModal from '../components/ConfirmModal';
import AssignCleanerModal from '../components/AssignCleanerModal';
import EditBookingModal from '../components/EditBookingModal';
import MessageCustomerModal from '../components/MessageCustomerModal';
import {
  adminSignIn,
  adminSignOut,
  answerTicket,
  editBooking,
  messageCustomer,
  changeTicketStatus,
  liveApplications,
  liveBookings,
  liveTickets,
  syncAvailability,
  isFirebaseConfigured,
  setApplicationStatus,
  removeApplication,
  removeBooking,
  removeTicket,
  setBookingCleaner,
  setBookingStatus,
  watchAdminUser,
} from '../services/adminApi';
import { STATUS_LABELS, isFinalStatus, nextStatus } from '../utils/applicationStatus';
import { describeHome } from '../utils/home';
import { cleanerStats } from '../utils/cleanerStats';
import { TICKET_STATUS_LABELS } from '../utils/tickets';

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
  // Two sides to the business: the people who want cleaning, and the people who clean.
  const [section, setSection] = useState('customers');
  const [tab, setTab] = useState('upcoming');
  const [tickets, setTickets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [appsReady, setAppsReady] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(null); // booking being edited
  const [messaging, setMessaging] = useState(null); // booking whose customer we're messaging
  const [notice, setNotice] = useState('');
  const [assigning, setAssigning] = useState(null); // booking currently being matched
  const [toDelete, setToDelete] = useState(null); // { kind: 'booking' | 'application', id, label }

  useEffect(() => watchAdminUser(setUser), []);

  // Live feeds: the lists update on their own whenever anything changes.
  useEffect(() => {
    if (!user) return undefined;
    setLoading(true);
    setLoadError('');
    const failed = () => {
      setLoading(false);
      setLoadError("Couldn't load data. This account may not have admin access.");
    };
    const arrived = (set) => (rows) => {
      set(rows);
      setLoading(false);
    };
    const stops = [
      liveBookings(arrived(setBookings), failed),
      liveApplications((rows) => {
        setAppsReady(true);
        arrived(setApplications)(rows);
      }, failed),
      liveTickets(arrived(setTickets), failed),
    ];
    return () => {
      setAppsReady(false);
      stops.forEach((stop) => stop());
    };
  }, [user]);

  // Keep the public "which times are open" records matching the approved cleaners.
  const availabilitySig = applications
    .filter((a) => a.status === 'approved')
    .map((a) => `${a.id}:${(a.days || []).join('')}:${(a.timeBlocks || []).join('')}`)
    .sort()
    .join('|');
  useEffect(() => {
    if (!user || !appsReady) return;
    syncAvailability(applications).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, appsReady, availabilitySig]);

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

  const replyToTicket = async (id, text) => {
    setLoadError('');
    try {
      await answerTicket(id, text);
      const msg = { from: 'admin', text, ts: Date.now() };
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: 'answered', messages: [...t.messages, msg], updatedMs: msg.ts } : t)),
      );
      return true;
    } catch (e) {
      setLoadError("Couldn't send that reply. Check your admin rules and try again.");
      return false;
    }
  };

  const setTicketState = async (id, status) => {
    setLoadError('');
    try {
      await changeTicketStatus(id, status);
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    } catch (e) {
      setLoadError("Couldn't update that ticket. Check your admin rules and try again.");
    }
  };

  const sendCustomerMessage = async (text) => {
    const booking = messaging;
    if (!booking) return false;
    try {
      await messageCustomer({
        uid: booking.uid,
        text,
        bookingLabel: `${booking.service?.name || 'Booking'} · ${booking.date}`,
      });
      setMessaging(null);
      setNotice('Message sent. The customer will see it on their Home screen.');
      setTimeout(() => setNotice(''), 4000);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Returns true when saved, so the editor knows whether to close.
  const saveBookingEdit = async (fields) => {
    const booking = editing;
    if (!booking) return false;
    setLoadError('');
    try {
      await editBooking(booking.id, fields);
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, ...fields } : b)));
      setEditing(null);
      return true;
    } catch (e) {
      setLoadError("Couldn't save those changes. Check your admin rules and try again.");
      return false;
    }
  };

  const confirmDelete = async () => {
    const target = toDelete;
    setToDelete(null);
    if (!target) return;
    setLoadError('');
    try {
      if (target.kind === 'ticket') {
        await removeTicket(target.id);
        setTickets((prev) => prev.filter((t) => t.id !== target.id));
      } else if (target.kind === 'booking') {
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
  const pipeline = applications.filter((a) => ['under_review', 'interview', 'background_check'].includes(a.status));
  const needsCleaner = upcoming.filter((b) => !b.cleanerId).length;
  const openTickets = tickets.filter((t) => t.status === 'open').length;
  const sortedTickets = [...tickets].sort(
    (a, b) => ['open', 'answered', 'closed'].indexOf(a.status) - ['open', 'answered', 'closed'].indexOf(b.status) || b.updatedMs - a.updatedMs,
  );

  // Two sections, each with its own tabs. Numbers in red/orange are things that need you.
  const SECTIONS = [
    { key: 'customers', label: 'Customers', hint: 'Jobs & support', alert: needsCleaner + openTickets },
    { key: 'cleaners', label: 'Cleaners', hint: 'Roster & applications', alert: pipeline.length },
  ];
  const TABS = {
    customers: [
      ['upcoming', `Upcoming (${upcoming.length})`],
      ['past', `Past (${past.length})`],
      ['support', `Support (${tickets.length})`, openTickets],
    ],
    cleaners: [
      ['roster', `Roster (${cleaners.length})`],
      ['applications', `Applications (${applications.length})`, pipeline.length],
    ],
  };
  const switchSection = (key) => {
    setSection(key);
    setTab(TABS[key][0][0]);
  };
  const summary =
    section === 'customers'
      ? `${upcoming.length} upcoming · ${needsCleaner} need a cleaner · ${openTickets} open ticket${openTickets === 1 ? '' : 's'}`
      : `${cleaners.length} approved · ${pipeline.length} application${pipeline.length === 1 ? '' : 's'} in progress`;
  const items =
    tab === 'upcoming' ? upcoming : tab === 'past' ? past : tab === 'support' ? tickets : tab === 'roster' ? cleaners : applications;

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
            <View style={styles.sections}>
              {SECTIONS.map((sec) => (
                <AnimatedPressable
                  key={sec.key}
                  style={[styles.section, section === sec.key && styles.sectionOn]}
                  onPress={() => switchSection(sec.key)}
                >
                  <View style={styles.sectionTop}>
                    <Text style={[styles.sectionLabel, section === sec.key && styles.sectionLabelOn]}>{sec.label}</Text>
                    {sec.alert > 0 ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{sec.alert}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.sectionHint, section === sec.key && styles.sectionHintOn]}>{sec.hint}</Text>
                </AnimatedPressable>
              ))}
            </View>
            <Text style={styles.summary}>{summary}</Text>

            <View style={styles.tabs}>
              {TABS[section].map(([key, label, alert]) => (
                <AnimatedPressable
                  key={key}
                  style={[styles.tab, tab === key && styles.tabActive]}
                  onPress={() => setTab(key)}
                >
                  <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
                    {label}
                    {alert ? `  ● ${alert}` : ''}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>

            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            {loading ? <ActivityIndicator color={colors.accent} /> : null}
            {loadError ? <Text style={styles.error}>{loadError}</Text> : null}
            {!loading && !loadError && items.length === 0 ? (
              <Text style={styles.muted}>Nothing here yet.</Text>
            ) : null}

            {tab === 'support'
              ? sortedTickets.map((t) => (
                  <TicketCard
                    key={t.id}
                    t={t}
                    onReply={replyToTicket}
                    onStatus={setTicketState}
                    onDelete={() => setToDelete({ kind: 'ticket', id: t.id, label: `this ${t.category || 'support'} ticket` })}
                  />
                ))
              : tab === 'roster'
              ? cleaners.map((c) => <CleanerCard key={c.id} c={c} bookings={bookings} />)
              : tab === 'applications'
              ? applications.map((a) => <ApplicationCard key={a.id} a={a} onChange={changeStatus} onDelete={() => setToDelete({ kind: 'application', id: a.id, label: a.fullName || 'this applicant' })} />)
              : items.map((b) => <BookingCard key={b.id} b={b} onChange={changeBookingStatus} onAssign={() => setAssigning(b)} onEdit={() => setEditing(b)} onMessage={() => setMessaging(b)} onDelete={() => setToDelete({ kind: 'booking', id: b.id, label: `${b.service?.name || 'this booking'} on ${b.date || ''}` })} />)}
          </>
        )}
      </ScrollView>

      <MessageCustomerModal
        visible={!!messaging}
        booking={messaging}
        onClose={() => setMessaging(null)}
        onSend={sendCustomerMessage}
      />

      <EditBookingModal
        visible={!!editing}
        booking={editing ? bookings.find((b) => b.id === editing.id) || editing : null}
        cleaners={applications.filter((a) => a.status === 'approved')}
        bookings={bookings}
        onClose={() => setEditing(null)}
        onSave={saveBookingEdit}
      />

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
        title={`Delete this ${toDelete?.kind || 'item'}?`}
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

function BookingCard({ b, onChange, onAssign, onEdit, onMessage, onDelete }) {
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
        <Line label="Note to customer" value={b.adminNote} />
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
          {(scheduled || enRoute) && b.uid ? (
            <AnimatedPressable style={styles.secondaryButton} onPress={onMessage}>
              <Text style={styles.secondaryText}>Message</Text>
            </AnimatedPressable>
          ) : null}
          {scheduled || enRoute ? (
            <AnimatedPressable style={styles.secondaryButton} onPress={onEdit}>
              <Text style={styles.secondaryText}>Edit</Text>
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

function TicketCard({ t, onReply, onStatus, onDelete }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const who = t.userName || t.userEmail || 'Customer';

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const ok = await onReply(t.id, text.trim());
    setSending(false);
    if (ok) setText('');
  };

  return (
    <GlassCard style={styles.card} intensity={45}>
      <View style={styles.cardInner}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>{t.category || 'Support'}</Text>
          <View
            style={[
              styles.pill,
              t.status === 'open' ? styles.pillProgress : t.status === 'answered' ? styles.pillActive : styles.pillCancelled,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                t.status === 'open' ? styles.pillTextProgress : t.status === 'answered' ? styles.pillTextActive : styles.pillTextCancelled,
              ]}
            >
              {t.status === 'open' ? 'Needs reply' : TICKET_STATUS_LABELS[t.status]}
            </Text>
          </View>
        </View>
        <Line label="From" value={[who, t.userName && t.userEmail ? t.userEmail : ''].filter(Boolean).join(' · ')} />
        <Line label="Booking" value={t.bookingLabel} />
        <Line label="Last activity" value={formatWhen(t.updatedMs)} />

        <View style={styles.thread}>
          {t.messages.map((m, i) => (
            <View key={i} style={[styles.msg, m.from === 'admin' ? styles.msgAdmin : styles.msgCustomer]}>
              <Text style={styles.msgFrom}>{m.from === 'admin' ? 'You' : who}</Text>
              <Text style={styles.msgText}>{m.text}</Text>
              <Text style={styles.msgTime}>{formatWhen(m.ts)}</Text>
            </View>
          ))}
        </View>

        <TextInput
          style={styles.replyInput}
          value={text}
          onChangeText={setText}
          placeholder="Write your reply…"
          placeholderTextColor={colors.textSecondary}
          multiline
        />
        <View style={styles.actions}>
          <AnimatedPressable style={styles.advanceButton} onPress={send} disabled={sending || !text.trim()}>
            <Text style={styles.advanceText}>{sending ? 'Sending…' : 'Send reply'}</Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={styles.secondaryButton}
            onPress={() => onStatus(t.id, t.status === 'closed' ? 'open' : 'closed')}
          >
            <Text style={styles.secondaryText}>{t.status === 'closed' ? 'Reopen' : 'Close'}</Text>
          </AnimatedPressable>
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
  sections: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  section: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  sectionOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  sectionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: { fontSize: 16, fontWeight: '800', color: colors.primary },
  sectionLabelOn: { color: colors.background },
  sectionHint: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  sectionHintOn: { color: 'rgba(244,238,233,0.7)' },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.accentText, fontSize: 11, fontWeight: '800' },
  summary: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.md },
  thread: { marginTop: spacing.sm, gap: spacing.sm },
  msg: { borderRadius: radius.sm, padding: spacing.sm },
  msgCustomer: { backgroundColor: 'rgba(255,255,255,0.7)', marginRight: 24 },
  msgAdmin: { backgroundColor: 'rgba(232,115,74,0.15)', marginLeft: 24 },
  msgFrom: { fontSize: 11, fontWeight: '700', color: colors.accent },
  msgText: { fontSize: 13, color: colors.text, lineHeight: 19, marginTop: 1 },
  msgTime: { fontSize: 10, color: colors.textSecondary, marginTop: 3 },
  replyInput: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: 13,
    color: colors.text,
    minHeight: 56,
    marginTop: spacing.md,
    textAlignVertical: 'top',
  },
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
  notice: { color: '#3F8557', fontSize: 13, fontWeight: '600', marginBottom: spacing.sm },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonText: { color: colors.accentText, fontSize: 15, fontWeight: '600' },
});

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import { useBooking } from '../context/BookingContext';
import { useApplication } from '../context/ApplicationContext';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketContext';
import GlassCard from '../components/GlassCard';
import ConfirmModal from '../components/ConfirmModal';
import AnimatedPressable from '../components/AnimatedPressable';
import DiscountSticker from '../components/DiscountSticker';
import { buildGoogleCalendarUrl } from '../utils/calendar';
import { getApplicationView } from '../utils/applicationStatus';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const quickServices = [
  { id: 'becomeCleaner', label: 'Become a Cleaner', icon: 'briefcase-outline' },
  { id: 'refer', label: 'Refer a Friend', icon: 'gift-outline' },
  { id: 'redeem', label: 'Enter Savings Code', icon: 'pricetag-outline' },
  { id: 'payment', label: 'Payment', icon: 'card-outline' },
  { id: 'pastJobs', label: 'Past Jobs', icon: 'time-outline' },
  { id: 'account', label: 'Account', icon: 'person-outline' },
];

export default function HomeScreen({ navigation }) {
  const { upcomingBookings, canBookMore, discount } = useBooking();
  const { application, cancelApplication } = useApplication();
  const { displayFirstName } = useAuth();
  const { unreadCount, tickets } = useTickets();
  const unreadTicket = tickets.find((t) => t.status === 'answered' && t.customerSeen === false);
  const [limitVisible, setLimitVisible] = useState(false);
  const [comingSoonVisible, setComingSoonVisible] = useState(false);
  const [cancelAppVisible, setCancelAppVisible] = useState(false);
  const applicationView = getApplicationView(application?.status);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideIn = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
    const check = () => {
      if (window.location.hash.includes('admin')) navigation.navigate('Admin');
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, [navigation]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(slideIn, { toValue: 0, speed: 14, bounciness: 6, useNativeDriver: true }),
    ]).start();
  }, [fadeIn, slideIn]);

  const handleViewBooking = (booking) => {
    navigation.navigate('Confirm', { ...booking, viewOnly: true });
  };

  const handleAddToCalendar = (booking) => {
    if (!booking.rawDate) return;
    const url = buildGoogleCalendarUrl({
      rawDate: booking.rawDate,
      time: booking.time,
      service: booking.service,
      address: booking.address,
    });
    Linking.openURL(url);
  };

  const startBooking = () => {
    if (!canBookMore) {
      setLimitVisible(true);
      return;
    }
    navigation.navigate('Duration');
  };

  const confirmCancelApplication = () => {
    cancelApplication();
    setCancelAppVisible(false);
  };

  const handleQuickService = (id) => {
    if (id === 'becomeCleaner') {
      navigation.navigate(application ? 'CleanerApplicationSuccess' : 'BecomeCleaner');
      return;
    }
    if (id === 'reschedule') {
      navigation.navigate('Booking', { service: upcomingBookings[0].service });
      return;
    }
    if (id === 'legal') {
      navigation.navigate('Legal');
      return;
    }
    if (id === 'refer') {
      navigation.navigate('Refer');
      return;
    }
    if (id === 'pastJobs') {
      navigation.navigate('PastJobs');
      return;
    }
    if (id === 'account') {
      navigation.navigate('Account');
      return;
    }
    if (id === 'redeem') {
      navigation.navigate('RedeemCode');
      return;
    }
    setComingSoonVisible(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.pageGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {discount && <DiscountSticker percent={discount.percent} code={discount.code} />}

      <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideIn }] }}>
        <View style={styles.header}>
          <Pressable onLongPress={() => navigation.navigate('Admin')} delayLongPress={800}>
            <Text style={styles.brand}>BRISTLE</Text>
          </Pressable>
          <Text style={styles.tagline}>You decide what gets cleaned</Text>

          <Text style={styles.greeting}>
            {getGreeting()}
            {displayFirstName ? ', ' : ''}
            {displayFirstName ? <Text style={styles.greetingBold}>{displayFirstName}</Text> : null}
          </Text>
          <Text style={styles.subGreeting}>How can we help?</Text>
        </View>
      </Animated.View>

      <Animated.View style={{ flex: 1, opacity: fadeIn, transform: [{ translateY: slideIn }] }}>
        <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>
        {unreadTicket ? (
          <GlassCard
            style={styles.supportNotice}
            intensity={45}
            onPress={() => navigation.navigate('Ticket', { id: unreadTicket.id })}
          >
            <View style={styles.supportNoticeInner}>
              <View style={styles.supportNoticeIcon}>
                <Ionicons name="chatbubble-ellipses" size={18} color={colors.accentText} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.supportNoticeTitle}>
                  {unreadCount > 1 ? `${unreadCount} new replies from support` : 'New reply from support'}
                </Text>
                <Text style={styles.supportNoticeText} numberOfLines={1}>
                  {unreadTicket.messages[unreadTicket.messages.length - 1].text}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          </GlassCard>
        ) : null}

        {upcomingBookings.length > 0 ? (
          upcomingBookings.map((booking) => (
            <GlassCard key={booking.id} style={styles.upcomingCard} intensity={45}>
              <View style={styles.upcomingInner}>
                <View style={styles.upcomingHeaderRow}>
                  <View style={styles.upcomingIcon}>
                    <Ionicons name="calendar" size={18} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.upcomingTitle} numberOfLines={1}>
                      Upcoming clean · {booking.service.name}
                    </Text>
                    <Text style={styles.upcomingSubtitle}>
                      {booking.date} · {booking.time}
                    </Text>
                    {booking.cleanerName ? (
                      <Text style={styles.upcomingSubtitle}>
                        Your cleaner: {booking.cleanerName.split(' ')[0]}
                      </Text>
                    ) : null}
                  </View>
                </View>
                {booking.status === 'on_the_way' ? (
                  <View style={styles.onTheWay}>
                    <Ionicons name="car" size={18} color={colors.accentText} />
                    <Text style={styles.onTheWayText}>Your cleaner is on the way!</Text>
                  </View>
                ) : null}
                <View style={styles.upcomingFooterRow}>
                  <Pressable onPress={() => handleAddToCalendar(booking)}>
                    <Text style={styles.calendarLinkText}>Add to Calendar</Text>
                  </Pressable>
                  <AnimatedPressable style={styles.viewBookingButton} onPress={() => handleViewBooking(booking)}>
                    <Text style={styles.viewBookingText}>View Booking</Text>
                  </AnimatedPressable>
                </View>
              </View>
            </GlassCard>
          ))
        ) : null}

        {application && (
          <GlassCard style={styles.applicationCard} intensity={45}>
            <View style={styles.applicationInner}>
              <View style={styles.applicationHeaderRow}>
                <View style={styles.applicationIcon}>
                  <Ionicons name="briefcase" size={18} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.applicationTitle} numberOfLines={1}>Cleaner application</Text>
                  <Text style={styles.applicationSubtitle}>{applicationView.label}</Text>
                </View>
              </View>

              <View style={styles.applicationProgressRow}>
                <View style={styles.applicationProgressTrack}>
                  <View style={[styles.applicationProgressFill, { width: `${applicationView.percent}%` }]} />
                </View>
                <Text style={styles.applicationProgressLabel}>{applicationView.percent}%</Text>
              </View>

              <View style={styles.applicationFooterRow}>
                <AnimatedPressable onPress={() => setCancelAppVisible(true)}>
                  <Text style={styles.cancelApplicationText}>Cancel application</Text>
                </AnimatedPressable>
                <AnimatedPressable
                  style={styles.viewApplicationButton}
                  onPress={() => navigation.navigate('CleanerApplicationSuccess')}
                >
                  <Text style={styles.viewApplicationText}>View status</Text>
                </AnimatedPressable>
              </View>
            </View>
          </GlassCard>
        )}

        <GlassCard style={styles.startCard} intensity={45} onPress={() => startBooking()}>
          <View style={styles.startInner}>
            <View style={styles.startIconWrap}>
              <Ionicons name="sparkles-outline" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.startTitle}>Let's get started</Text>
              <Text style={styles.startSubtitle}>Pick your time on the next step</Text>
            </View>
            <View style={styles.serviceArrow}>
              <Ionicons name="arrow-forward" size={16} color={colors.accentText} />
            </View>
          </View>
        </GlassCard>

        <Text style={styles.sectionLabel}>Services</Text>
        <View style={styles.quickGrid}>
          {quickServices
            .filter((item) => item.id !== 'reschedule' || upcomingBookings.length > 0)
            .map((item) => (
            <GlassCard
              key={item.id}
              style={styles.quickItem}
              intensity={40}
              onPress={() => handleQuickService(item.id)}
            >
              <View style={styles.quickInner}>
                <View style={styles.quickIconWrap}>
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                </View>
                <Text style={styles.quickLabel} numberOfLines={2}>{item.label}</Text>
              </View>
            </GlassCard>
          ))}
        </View>

        <View style={styles.footerLinks}>
          <Pressable onPress={() => navigation.navigate('Legal')} hitSlop={10}>
            <Text style={styles.footerLink}>Legal</Text>
          </Pressable>
          <Text style={styles.footerDot}>·</Text>
          <Pressable onPress={() => navigation.navigate('Support')} hitSlop={10}>
            <Text style={styles.footerLink}>
              Support
              {unreadCount > 0 ? <Text style={styles.footerDotAlert}> ●</Text> : null}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      </Animated.View>

      <ConfirmModal
        visible={limitVisible}
        title="Booking limit reached"
        message="You can have up to 2 scheduled cleans at a time. Cancel one to book another."
        onRequestClose={() => setLimitVisible(false)}
        buttons={[{ text: 'OK', onPress: () => setLimitVisible(false) }]}
      />

      <ConfirmModal
        visible={comingSoonVisible}
        title="Coming soon"
        message="This isn't wired up yet."
        onRequestClose={() => setComingSoonVisible(false)}
        buttons={[{ text: 'OK', onPress: () => setComingSoonVisible(false) }]}
      />

      <ConfirmModal
        visible={cancelAppVisible}
        title="Cancel application?"
        message="This will withdraw your cleaner application. You can always apply again later."
        onRequestClose={() => setCancelAppVisible(false)}
        buttons={[
          { text: 'Keep application', style: 'cancel', onPress: () => setCancelAppVisible(false) },
          { text: 'Cancel application', style: 'destructive', onPress: confirmCancelApplication },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 36,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  brand: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 64,
    color: colors.primary,
    width: '100%',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    marginTop: -6,
    marginBottom: spacing.md,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.primary,
  },
  greetingBold: {
    fontWeight: '800',
  },
  subGreeting: {
    fontSize: 15,
    color: colors.primary,
    opacity: 0.7,
    marginTop: 2,
  },
  sheet: {
    flex: 1,
  },
  sheetContent: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.xl,
  },
  upcomingCard: {
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  upcomingInner: {
    padding: spacing.md,
  },
  upcomingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  upcomingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(232,115,74,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  upcomingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  upcomingSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  onTheWay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#3F8557',
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  onTheWayText: { color: colors.accentText, fontSize: 13, fontWeight: '700' },
  upcomingFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  viewBookingButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  viewBookingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.background,
  },
  applicationCard: {
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  applicationInner: {
    padding: spacing.md,
  },
  applicationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  applicationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(232,115,74,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  applicationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  applicationSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  applicationProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  applicationProgressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(46,42,38,0.12)',
    overflow: 'hidden',
  },
  applicationProgressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  applicationProgressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    width: 36,
    textAlign: 'right',
  },
  applicationFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelApplicationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A32D2D',
  },
  viewApplicationButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  viewApplicationText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.background,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  startCard: {
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  startInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  startIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  startTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  startSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  serviceArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  footerLink: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  supportNotice: { borderRadius: radius.lg, marginBottom: spacing.md },
  supportNoticeInner: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  supportNoticeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  supportNoticeTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  supportNoticeText: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  footerDotAlert: { color: colors.accent, fontSize: 10 },
  footerDot: { fontSize: 12, color: colors.textSecondary },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  quickItem: {
    width: '31.5%',
    borderRadius: radius.md,
  },
  quickInner: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});

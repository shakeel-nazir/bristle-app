import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import { useBooking } from '../context/BookingContext';
import GlassCard from '../components/GlassCard';
import ConfirmModal from '../components/ConfirmModal';
import { buildGoogleCalendarUrl } from '../utils/calendar';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const quickServices = [
  { id: 'book', label: 'Book a Clean', icon: 'add-circle-outline' },
  { id: 'reschedule', label: 'Reschedule', icon: 'calendar-outline' },
  { id: 'legal', label: 'Legal', icon: 'document-text-outline' },
  { id: 'support', label: 'Support', icon: 'chatbubble-ellipses-outline' },
  { id: 'payment', label: 'Payment', icon: 'card-outline' },
  { id: 'refer', label: 'Refer a Friend', icon: 'gift-outline' },
];

export default function HomeScreen({ navigation }) {
  const { upcomingBookings, cancelBooking, canBookMore } = useBooking();
  const [cancelTarget, setCancelTarget] = useState(null);
  const [limitVisible, setLimitVisible] = useState(false);
  const [comingSoonVisible, setComingSoonVisible] = useState(false);

  const handleViewBooking = (booking) => {
    navigation.navigate('Confirm', { ...booking, viewOnly: true });
  };

  const handleCancelBooking = (booking) => setCancelTarget(booking);

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

  const confirmCancelBooking = () => {
    if (cancelTarget) cancelBooking(cancelTarget.id);
    setCancelTarget(null);
  };

  const startBooking = () => {
    if (!canBookMore) {
      setLimitVisible(true);
      return;
    }
    navigation.navigate('Duration');
  };

  const handleQuickService = (id) => {
    if (id === 'book') {
      startBooking();
      return;
    }
    if (id === 'reschedule') {
      if (upcomingBookings.length > 0) {
        navigation.navigate('Booking', { service: upcomingBookings[0].service });
      } else {
        startBooking();
      }
      return;
    }
    if (id === 'legal') {
      navigation.navigate('Legal');
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

      <View style={styles.header}>
        <Text style={styles.brand}>bristle</Text>
        <Text style={styles.tagline}>You decide what gets cleaned</Text>

        <Text style={styles.greeting}>
          {getGreeting()}, <Text style={styles.greetingBold}>Andrew</Text>
        </Text>
        <Text style={styles.subGreeting}>How can we help?</Text>
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>
        {upcomingBookings.length > 0 ? (
          upcomingBookings.map((booking) => (
            <GlassCard key={booking.id} style={styles.upcomingCard} intensity={45}>
              <View style={styles.upcomingInner}>
                <View style={styles.upcomingHeaderRow}>
                  <View style={styles.upcomingIcon}>
                    <Ionicons name="calendar" size={18} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.upcomingTitle}>Upcoming clean</Text>
                    <Text style={styles.upcomingSubtitle}>
                      {booking.date} · {booking.time}
                    </Text>
                  </View>
                </View>
                <View style={styles.upcomingFooterRow}>
                  <Text style={styles.upcomingServiceName}>{booking.service.name}</Text>
                  <Pressable style={styles.viewBookingButton} onPress={() => handleViewBooking(booking)}>
                    <Text style={styles.viewBookingText}>View Booking</Text>
                  </Pressable>
                </View>
                <View style={styles.linkRow}>
                  <Pressable onPress={() => handleAddToCalendar(booking)}>
                    <Text style={styles.calendarLinkText}>Add to Calendar</Text>
                  </Pressable>
                  <Pressable onPress={() => handleCancelBooking(booking)}>
                    <Text style={styles.cancelLinkText}>Cancel booking</Text>
                  </Pressable>
                </View>
              </View>
            </GlassCard>
          ))
        ) : (
          <GlassCard
            style={styles.nextCard}
            intensity={45}
            onPress={() => startBooking()}
          >
            <View style={styles.nextInner}>
              <View style={styles.nextIcon}>
                <Ionicons name="calendar-outline" size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextTitle}>No cleans booked yet</Text>
                <Text style={styles.nextSubtitle}>Book your first clean below</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
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
          {quickServices.map((item) => (
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
      </ScrollView>

      {cancelTarget && (
        <ConfirmModal
          visible={!!cancelTarget}
          title="Cancel booking?"
          message={`This will cancel your ${cancelTarget.service.name.toLowerCase()} on ${cancelTarget.date}.`}
          onRequestClose={() => setCancelTarget(null)}
          buttons={[
            { text: 'Keep booking', style: 'cancel', onPress: () => setCancelTarget(null) },
            { text: 'Cancel booking', style: 'destructive', onPress: confirmCancelBooking },
          ]}
        />
      )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
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
    marginBottom: spacing.lg,
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
  nextCard: {
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  nextInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  nextIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(232,115,74,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  nextTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  nextSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
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
  upcomingFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upcomingServiceName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  calendarLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  cancelLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A32D2D',
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
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickItem: {
    width: '31%',
    borderRadius: radius.md,
  },
  quickInner: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});

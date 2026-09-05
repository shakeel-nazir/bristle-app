import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import { useBooking } from '../context/BookingContext';
import GlassCard from '../components/GlassCard';
import ConfirmModal from '../components/ConfirmModal';

const durations = [
  {
    id: '2h',
    hours: 2,
    price: 89,
    icon: 'sparkles-outline',
  },
  {
    id: '4h',
    hours: 4,
    price: 159,
    icon: 'flash-outline',
  },
];

const quickServices = [
  { id: 'book', label: 'Book a Clean', icon: 'add-circle-outline' },
  { id: 'reschedule', label: 'Reschedule', icon: 'calendar-outline' },
  { id: 'addons', label: 'Add-ons', icon: 'pricetag-outline' },
  { id: 'support', label: 'Support', icon: 'chatbubble-ellipses-outline' },
  { id: 'payment', label: 'Payment', icon: 'card-outline' },
  { id: 'refer', label: 'Refer a Friend', icon: 'gift-outline' },
];

export default function HomeScreen({ navigation }) {
  const { upcomingBooking, cancelBooking } = useBooking();
  const [cancelConfirmVisible, setCancelConfirmVisible] = useState(false);
  const [comingSoonVisible, setComingSoonVisible] = useState(false);

  const handleViewBooking = () => {
    if (!upcomingBooking) return;
    navigation.navigate('Confirm', { ...upcomingBooking, viewOnly: true });
  };

  const handleCancelBooking = () => setCancelConfirmVisible(true);

  const confirmCancelBooking = () => {
    cancelBooking();
    setCancelConfirmVisible(false);
  };

  const handleQuickService = (id) => {
    if (id === 'book') {
      navigation.navigate('TaskBuilder', { durationHours: durations[0].hours, price: durations[0].price });
      return;
    }
    if (id === 'reschedule') {
      if (upcomingBooking) {
        navigation.navigate('Booking', { service: upcomingBooking.service });
      } else {
        navigation.navigate('TaskBuilder', { durationHours: durations[0].hours, price: durations[0].price });
      }
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

        <Text style={styles.greeting}>
          Good morning, <Text style={styles.greetingBold}>Andrew</Text>
        </Text>
        <Text style={styles.subGreeting}>What needs cleaning today?</Text>

        {upcomingBooking && (
          <GlassCard style={styles.statusPill} intensity={30} onPress={handleViewBooking}>
            <View style={styles.statusPillInner}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>1</Text>
              </View>
              <Text style={styles.statusPillText}>You have a clean scheduled</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </View>
          </GlassCard>
        )}
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>
        {upcomingBooking ? (
          <GlassCard style={styles.upcomingCard} intensity={45}>
            <View style={styles.upcomingInner}>
              <View style={styles.upcomingHeaderRow}>
                <View style={styles.upcomingIcon}>
                  <Ionicons name="calendar" size={18} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.upcomingTitle}>Upcoming clean</Text>
                  <Text style={styles.upcomingSubtitle}>
                    {upcomingBooking.date} · {upcomingBooking.time}
                  </Text>
                </View>
              </View>
              <View style={styles.upcomingFooterRow}>
                <View>
                  <Text style={styles.upcomingServiceName}>{upcomingBooking.service.name}</Text>
                  <Text style={styles.upcomingPrice}>${upcomingBooking.deposit?.toFixed(2)} deposit paid</Text>
                  <Text style={styles.upcomingBalance}>${upcomingBooking.balance?.toFixed(2)} due after clean</Text>
                </View>
                <Pressable style={styles.viewBookingButton} onPress={handleViewBooking}>
                  <Text style={styles.viewBookingText}>View Booking</Text>
                </Pressable>
              </View>
              <Pressable style={styles.cancelLink} onPress={handleCancelBooking}>
                <Text style={styles.cancelLinkText}>Cancel booking</Text>
              </Pressable>
            </View>
          </GlassCard>
        ) : (
          <GlassCard
            style={styles.nextCard}
            intensity={45}
            onPress={() => navigation.navigate('TaskBuilder', { durationHours: durations[0].hours, price: durations[0].price })}
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

        <Text style={styles.sectionLabel}>Choose your time</Text>

        <View style={styles.grid}>
          {durations.map((option) => (
            <GlassCard
              key={option.id}
              style={styles.serviceCard}
              intensity={45}
              onPress={() => navigation.navigate('TaskBuilder', { durationHours: option.hours, price: option.price })}
            >
              <View style={styles.serviceInner}>
                <View style={styles.serviceIconWrap}>
                  <Ionicons name={option.icon} size={22} color={colors.primary} />
                </View>
                <Text style={styles.serviceName}>{option.hours} Hours</Text>
                <Text style={styles.serviceDescription}>You decide what gets cleaned</Text>
                <View style={styles.servicePriceRow}>
                  <Text style={styles.servicePrice}>${option.price}</Text>
                  <View style={styles.serviceArrow}>
                    <Ionicons name="arrow-forward" size={14} color={colors.accentText} />
                  </View>
                </View>
              </View>
            </GlassCard>
          ))}
        </View>

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

      {upcomingBooking && (
        <ConfirmModal
          visible={cancelConfirmVisible}
          title="Cancel booking?"
          message={`This will cancel your ${upcomingBooking.service.name.toLowerCase()} on ${upcomingBooking.date}.`}
          onRequestClose={() => setCancelConfirmVisible(false)}
          buttons={[
            { text: 'Keep booking', style: 'cancel', onPress: () => setCancelConfirmVisible(false) },
            { text: 'Cancel booking', style: 'destructive', onPress: confirmCancelBooking },
          ]}
        />
      )}

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
    fontSize: 44,
    color: colors.primary,
    width: '100%',
    marginBottom: spacing.lg,
    letterSpacing: -0.5,
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
  statusPill: {
    borderRadius: radius.lg,
    marginTop: spacing.lg,
  },
  statusPillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  statusBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusPillText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
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
    fontSize: 13,
    color: colors.textSecondary,
  },
  upcomingPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  upcomingBalance: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  cancelLink: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
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
  grid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  serviceCard: {
    flex: 1,
    borderRadius: radius.lg,
  },
  serviceInner: {
    padding: spacing.md,
  },
  serviceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  serviceDescription: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 15,
  },
  servicePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
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

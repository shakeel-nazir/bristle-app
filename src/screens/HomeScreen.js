import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';

const services = [
  {
    id: 'normal',
    name: 'Normal Clean',
    price: 89,
    duration: '~2 hrs',
    description: 'Dusting, vacuuming, kitchen & bathrooms — regular upkeep',
    icon: 'sparkles-outline',
    tint: ['#DCEBD8', '#C7E0D4'],
  },
  {
    id: 'super',
    name: 'Super Clean',
    price: 159,
    duration: '~4 hrs',
    description: 'Deep clean inside appliances, baseboards, windows & more',
    icon: 'flash-outline',
    tint: ['#F7D9C4', '#EFC3D3'],
  },
];

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <LinearGradient colors={colors.logoGradient} style={styles.logo} />
            <Text style={styles.brand}>Bristle</Text>
          </View>
          <Pressable style={styles.iconButton}>
            <Ionicons name="person-outline" size={18} color={colors.primary} />
          </Pressable>
        </View>

        <Text style={styles.greeting}>
          Good morning, <Text style={styles.greetingBold}>Andrew</Text>
        </Text>
        <Text style={styles.subGreeting}>What needs cleaning today?</Text>
      </LinearGradient>

      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>
        <Pressable style={styles.nextCard}>
          <View style={styles.nextIcon}>
            <Ionicons name="calendar-outline" size={18} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.nextTitle}>No cleans booked yet</Text>
            <Text style={styles.nextSubtitle}>Book your first clean below</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>

        <Text style={styles.sectionLabel}>Choose a clean</Text>

        <View style={styles.grid}>
          {services.map((service) => (
            <Pressable
              key={service.id}
              style={styles.serviceCard}
              onPress={() => navigation.navigate('Booking', { service })}
            >
              <LinearGradient colors={service.tint} style={styles.serviceIconWrap}>
                <Ionicons name={service.icon} size={22} color={colors.primary} />
              </LinearGradient>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceDuration}>{service.duration}</Text>
              <Text style={styles.serviceDescription}>{service.description}</Text>
              <View style={styles.servicePriceRow}>
                <Text style={styles.servicePrice}>From ${service.price}</Text>
                <View style={styles.serviceArrow}>
                  <Ionicons name="arrow-forward" size={14} color={colors.accentText} />
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Others</Text>
        <View style={styles.listCard}>
          <ListRow icon="help-circle-outline" label="How booking works" />
          <ListRow icon="pricetag-outline" label="Pricing & add-ons" />
          <ListRow icon="chatbubble-ellipses-outline" label="Contact support" last />
        </View>
      </ScrollView>
    </View>
  );
}

function ListRow({ icon, label, last }) {
  return (
    <Pressable style={[styles.listRow, !last && styles.listRowBorder]}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
      <Text style={styles.listLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingTop: 64,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: spacing.sm,
  },
  brand: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: -spacing.lg,
  },
  sheetContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  nextIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
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
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  serviceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  serviceDuration: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
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
  listCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  listRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listLabel: {
    fontSize: 13,
    color: colors.text,
  },
});

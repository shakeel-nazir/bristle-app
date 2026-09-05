import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import GlassCard from '../components/GlassCard';

const durations = [
  { id: '2h', hours: 2, price: 89, icon: 'sparkles-outline' },
  { id: '4h', hours: 4, price: 159, icon: 'flash-outline' },
];

export default function DurationScreen({ navigation }) {
  return (
    <View style={styles.container}>
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

        <Text style={styles.title}>Choose your time</Text>
        <Text style={styles.subtitle}>You decide what gets cleaned next</Text>

        {durations.map((option) => (
          <GlassCard
            key={option.id}
            style={styles.card}
            intensity={45}
            onPress={() => navigation.navigate('TaskBuilder', { durationHours: option.hours, price: option.price })}
          >
            <View style={styles.cardInner}>
              <View style={styles.iconWrap}>
                <Ionicons name={option.icon} size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{option.hours} Hours</Text>
                <Text style={styles.cardPrice}>${option.price}</Text>
              </View>
              <View style={styles.arrow}>
                <Ionicons name="arrow-forward" size={16} color={colors.accentText} />
              </View>
            </View>
          </GlassCard>
        ))}
      </ScrollView>
    </View>
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
  card: {
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cardPrice: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

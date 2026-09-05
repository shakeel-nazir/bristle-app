import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';

const services = [
  { id: 'standard', name: 'Standard clean', price: 89, description: 'Regular upkeep clean for your whole home' },
  { id: 'deep', name: 'Deep clean', price: 159, description: 'Detailed clean including baseboards, inside appliances' },
  { id: 'moveout', name: 'Move out / move in', price: 199, description: 'Full clean for an empty or emptying home' },
  { id: 'office', name: 'Office clean', price: 129, description: 'For small offices and shared workspaces' },
];

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Good morning</Text>
      <Text style={styles.title}>Bristle</Text>

      <Text style={styles.sectionLabel}>Book a service</Text>

      {services.map((service) => (
        <Pressable
          key={service.id}
          style={styles.card}
          onPress={() => navigation.navigate('Booking', { service })}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{service.name}</Text>
            <Text style={styles.cardDescription}>{service.description}</Text>
          </View>
          <Text style={styles.cardPrice}>From ${service.price}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  greeting: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  cardDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
});

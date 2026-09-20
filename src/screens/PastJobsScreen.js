import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import { useBooking } from '../context/BookingContext';
import GlassCard from '../components/GlassCard';
import { STATUS_LABELS } from '../utils/applicationStatus';

export default function PastJobsScreen({ navigation }) {
  const { pastBookings } = useBooking();

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

        <Text style={styles.title}>Past jobs</Text>

        {pastBookings.length === 0 ? (
          <Text style={styles.empty}>
            Nothing here yet. Cleans you’ve had (and any you’ve cancelled) will show up here.
          </Text>
        ) : (
          pastBookings.map((b) => {
            const done = b.status === 'completed';
            return (
              <GlassCard
                key={b.id}
                style={styles.card}
                intensity={45}
                onPress={() => navigation.navigate('Confirm', { ...b, viewOnly: true })}
              >
                <View style={styles.cardInner}>
                  <View style={styles.icon}>
                    <Ionicons
                      name={done ? 'checkmark-done' : 'close'}
                      size={20}
                      color={done ? '#3F8557' : '#A32D2D'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name} numberOfLines={1}>{b.service?.name}</Text>
                    <Text style={styles.sub} numberOfLines={1}>{b.date} · {b.time}</Text>
                    <Text style={styles.sub} numberOfLines={1}>{b.address}</Text>
                  </View>
                  <View style={styles.right}>
                    <Text style={[styles.status, done ? styles.statusDone : styles.statusCancelled]}>
                      {STATUS_LABELS[b.status] || b.status}
                    </Text>
                    <Text style={styles.total}>
                      {typeof b.total === 'number' ? `$${b.total.toFixed(2)}` : ''}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: 64, paddingBottom: spacing.xl },
  backButton: { width: 36, height: 36, borderRadius: 18, marginBottom: spacing.lg },
  backButtonInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: colors.primary, marginBottom: spacing.lg },
  empty: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  card: { borderRadius: radius.lg, marginBottom: spacing.sm },
  cardInner: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  name: { fontSize: 14, fontWeight: '700', color: colors.text },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  right: { alignItems: 'flex-end', marginLeft: spacing.sm },
  status: { fontSize: 12, fontWeight: '700' },
  statusDone: { color: '#3F8557' },
  statusCancelled: { color: '#A32D2D' },
  total: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});

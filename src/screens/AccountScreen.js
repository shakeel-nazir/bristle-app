import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import GlassCard from '../components/GlassCard';
import ConfirmModal from '../components/ConfirmModal';
import AnimatedPressable from '../components/AnimatedPressable';
import { authRequired, useAuth } from '../context/AuthContext';

export default function AccountScreen({ navigation }) {
  const { user, isGuest, email, displayFirstName, signOut, deleteAccount } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  const title = isGuest ? 'Guest' : user?.displayName || email || 'Your account';

  const handleDelete = async () => {
    setConfirmDelete(false);
    setError('');
    const result = await deleteAccount();
    if (result?.error) setError(result.error);
  };

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

        <Text style={styles.title}>Account</Text>

        <GlassCard style={styles.card} intensity={45}>
          <View style={styles.cardInner}>
            <View style={styles.avatar}>
              <Ionicons name={isGuest ? 'person-outline' : 'person'} size={22} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{authRequired ? title : displayFirstName}</Text>
              <Text style={styles.sub} numberOfLines={1}>
                {!authRequired
                  ? 'Sign-in is off in this build'
                  : isGuest
                    ? 'Signed in as a guest'
                    : email || 'Signed in'}
              </Text>
            </View>
          </View>
        </GlassCard>

        {authRequired && isGuest ? (
          <Text style={styles.hint}>
            You’re using a guest account. To keep your bookings under an account, sign out and create one.
          </Text>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {authRequired ? (
          <>
            <AnimatedPressable style={styles.primary} onPress={signOut}>
              <Text style={styles.primaryText}>{isGuest ? 'Sign in or create account' : 'Sign out'}</Text>
            </AnimatedPressable>

            <AnimatedPressable style={styles.danger} onPress={() => setConfirmDelete(true)}>
              <Text style={styles.dangerText}>Delete account</Text>
            </AnimatedPressable>
          </>
        ) : null}
      </ScrollView>

      <ConfirmModal
        visible={confirmDelete}
        title="Delete your account?"
        message="This permanently deletes your account and all of your bookings and applications. This can’t be undone."
        onRequestClose={() => setConfirmDelete(false)}
        buttons={[
          { text: 'Keep account', style: 'cancel', onPress: () => setConfirmDelete(false) },
          { text: 'Delete account', style: 'destructive', onPress: handleDelete },
        ]}
      />
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
  card: { borderRadius: radius.lg, marginBottom: spacing.md },
  cardInner: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(232,115,74,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  hint: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: spacing.md },
  error: { color: '#A32D2D', fontSize: 13, marginBottom: spacing.sm },
  primary: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  primaryText: { color: colors.accentText, fontSize: 15, fontWeight: '600' },
  danger: { padding: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  dangerText: { color: '#A32D2D', fontSize: 15, fontWeight: '600' },
});

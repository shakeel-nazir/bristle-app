import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as AppleAuthentication from 'expo-apple-authentication';
import { colors, spacing, radius } from '../theme/theme';
import GlassCard from '../components/GlassCard';
import AnimatedPressable from '../components/AnimatedPressable';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { signInEmail, signUpEmail, signInGuest, signInApple, resetPassword } = useAuth();
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => {});
  }, []);

  const isSignUp = mode === 'signup';

  const finish = (result) => {
    setBusy(false);
    if (result?.error) setError(result.error);
  };

  const submit = async () => {
    setError('');
    setNotice('');
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    finish(isSignUp ? await signUpEmail(name, email, password) : await signInEmail(email, password));
  };

  const forgot = async () => {
    setError('');
    setNotice('');
    if (!email.trim()) {
      setError('Enter your email above first, then tap “Forgot password?”.');
      return;
    }
    setBusy(true);
    const result = await resetPassword(email);
    setBusy(false);
    if (result?.error) setError(result.error);
    else setNotice('Check your email for a link to reset your password.');
  };

  const apple = async () => {
    setError('');
    setBusy(true);
    finish(await signInApple());
  };

  const guest = async () => {
    setError('');
    setBusy(true);
    finish(await signInGuest());
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient
        colors={colors.pageGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>BRISTLE</Text>
        <Text style={styles.tagline}>You decide what gets cleaned</Text>

        <GlassCard style={styles.card} intensity={45}>
          <View style={styles.cardInner}>
            <Text style={styles.heading}>{isSignUp ? 'Create your account' : 'Welcome back'}</Text>

            {isSignUp ? (
              <>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Jamie Rivera"
                  placeholderTextColor={colors.textSecondary}
                  autoComplete="name"
                />
              </>
            ) : null}

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="jamie@example.com"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={isSignUp ? 'At least 6 characters' : 'Password'}
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              onSubmitEditing={submit}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}

            <AnimatedPressable style={styles.primary} onPress={submit} disabled={busy}>
              {busy ? (
                <ActivityIndicator color={colors.accentText} />
              ) : (
                <Text style={styles.primaryText}>{isSignUp ? 'Create account' : 'Sign in'}</Text>
              )}
            </AnimatedPressable>

            {!isSignUp ? (
              <AnimatedPressable onPress={forgot} scaleTo={0.97}>
                <Text style={styles.link}>Forgot password?</Text>
              </AnimatedPressable>
            ) : null}
          </View>
        </GlassCard>

        {appleAvailable ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={radius.md}
            style={styles.appleButton}
            onPress={apple}
          />
        ) : null}

        <AnimatedPressable
          onPress={() => {
            setMode(isSignUp ? 'signin' : 'signup');
            setError('');
            setNotice('');
          }}
          scaleTo={0.97}
        >
          <Text style={styles.switchText}>
            {isSignUp ? 'Already have an account? ' : 'New to Bristle? '}
            <Text style={styles.switchAction}>{isSignUp ? 'Sign in' : 'Create an account'}</Text>
          </Text>
        </AnimatedPressable>

        <AnimatedPressable style={styles.guest} onPress={guest} disabled={busy}>
          <Text style={styles.guestText}>Continue as guest</Text>
        </AnimatedPressable>
        <Text style={styles.guestHint}>
          Guests can book cleans too. Create an account any time to keep everything in one place.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: 72, paddingBottom: spacing.xl },
  brand: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 64,
    color: colors.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    marginTop: -6,
    marginBottom: spacing.lg,
  },
  card: { borderRadius: radius.lg, marginBottom: spacing.md },
  cardInner: { padding: spacing.md },
  heading: { fontSize: 18, fontWeight: '700', color: colors.primary, marginBottom: spacing.xs },
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
  notice: { color: '#3F8557', fontSize: 13, marginTop: spacing.sm },
  primary: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryText: { color: colors.accentText, fontSize: 15, fontWeight: '600' },
  link: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  appleButton: { height: 48, marginBottom: spacing.md },
  switchText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  switchAction: { color: colors.accent, fontWeight: '600' },
  guest: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  guestText: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  guestHint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 17,
  },
});

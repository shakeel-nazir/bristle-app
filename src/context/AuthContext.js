import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  OAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { auth, isFirebaseConfigured } from '../services/firebase';
import { deleteMyData, getUserProfile, isDemo, saveHomeProfile } from '../services/dataStore';

const AuthContext = createContext(null);

// When Firebase isn't configured (or in the dev-only demo mode) there is nothing to sign in to,
// so the app runs open, exactly as before.
export const authRequired = isFirebaseConfigured && !isDemo;

function friendlyError(e) {
  switch (e?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with that email already exists. Try signing in instead.';
    case 'auth/weak-password':
      return 'Please choose a password with at least 6 characters.';
    case 'auth/invalid-email':
      return 'That email address doesn’t look right.';
    case 'auth/network-request-failed':
      return 'No connection. Check your internet and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/configuration-not-found':
    case 'auth/operation-not-allowed':
    case 'auth/admin-restricted-operation':
      return 'This sign-in method isn’t turned on yet.';
    case 'auth/requires-recent-login':
      return 'For security, sign out and sign back in, then try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

function randomNonce() {
  return `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(authRequired);
  // undefined = still loading, null/object = loaded (holds the saved home details, if any).
  const [profile, setProfile] = useState(undefined);
  const profileUid = authRequired ? user?.uid : 'local';

  useEffect(() => {
    if (!authRequired || !auth) return undefined;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!profileUid) {
      setProfile(undefined);
      return undefined;
    }
    let active = true;
    setProfile(undefined);
    getUserProfile(profileUid)
      .then((p) => active && setProfile(p || {}))
      .catch(() => active && setProfile({}));
    return () => {
      active = false;
    };
  }, [profileUid]);

  // Wrap an action so callers get { ok } or { error } and never have to handle raw Firebase errors.
  const run = async (fn) => {
    try {
      await fn();
      return { ok: true };
    } catch (e) {
      if (e?.code === 'ERR_REQUEST_CANCELED') return { cancelled: true };
      return { error: friendlyError(e) };
    }
  };

  const value = useMemo(() => {
    const isGuest = !!user?.isAnonymous;
    const nameSource = user?.displayName || user?.email?.split('@')[0] || '';
    const firstName = nameSource.split(/[\s._-]/)[0];
    const displayFirstName = !authRequired ? 'Andrew' : isGuest || !firstName ? '' : firstName;
    return {
      user,
      loading,
      isGuest,
      displayFirstName,
      email: user?.email || '',
      profileLoading: !!profileUid && profile === undefined,
      home: profile?.home || null,

      saveHome: (home) =>
        run(async () => {
          await saveHomeProfile(profileUid, home);
          setProfile((prev) => ({ ...(prev || {}), home }));
        }),

      signInEmail: (email, password) =>
        run(() => signInWithEmailAndPassword(auth, email.trim(), password)),

      signUpEmail: (name, email, password) =>
        run(async () => {
          const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
          if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
          setUser({ ...cred.user });
        }),

      signInGuest: () => run(() => signInAnonymously(auth)),

      signInApple: () =>
        run(async () => {
          const rawNonce = randomNonce();
          const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
          const apple = await AppleAuthentication.signInAsync({
            requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
            nonce: hashedNonce,
          });
          const credential = new OAuthProvider('apple.com').credential({
            idToken: apple.identityToken,
            rawNonce,
          });
          const cred = await signInWithCredential(auth, credential);
          // Apple only shares the name the very first time, so save it now.
          const given = apple.fullName?.givenName;
          if (given && !cred.user.displayName) {
            await updateProfile(cred.user, {
              displayName: [given, apple.fullName?.familyName].filter(Boolean).join(' '),
            });
            setUser({ ...cred.user });
          }
        }),

      resetPassword: (email) => run(() => sendPasswordResetEmail(auth, email.trim())),

      signOut: () => run(() => firebaseSignOut(auth)),

      // Removes the account and everything it created (App Store requires in-app deletion).
      deleteAccount: () =>
        run(async () => {
          const current = auth.currentUser;
          await deleteMyData(current.uid);
          await deleteUser(current);
        }),
    };
  }, [user, loading, profile, profileUid]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

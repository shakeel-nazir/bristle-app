import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from './firebase';

export { isFirebaseConfigured };

export function watchAdminUser(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export function adminSignIn(email, password) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export function adminSignOut() {
  return signOut(auth);
}

async function fetchCollection(name, orderField) {
  const snap = await getDocs(query(collection(db, name), orderBy(orderField, 'desc')));
  return snap.docs.map((d) => {
    const data = d.data();
    const ts = data[orderField];
    return { ...data, id: d.id, createdMs: ts?.toMillis ? ts.toMillis() : 0 };
  });
}

export const fetchBookings = () => fetchCollection('bookings', 'createdAt');
export const fetchApplications = () => fetchCollection('cleanerApplications', 'submittedAt');

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';

// Demo mode is dev-only (never true in a production build): open the dev site with #demo in the
// URL and everything runs against in-memory data, so the admin flow works without any login.
export const isDemo =
  __DEV__ && typeof window !== 'undefined' && String(window.location?.hash || '').includes('demo');

const useMemory = isDemo || !isFirebaseConfigured;
export const dataAvailable = isDemo || isFirebaseConfigured;

const currentUid = () => auth?.currentUser?.uid || null;

const mem = { bookings: new Map(), cleanerApplications: new Map() };
const appListeners = new Map();

function memPatch(name, id, patch) {
  const current = mem[name].get(id);
  if (!current) return;
  mem[name].set(id, { ...current, ...patch });
  if (name === 'cleanerApplications') {
    (appListeners.get(id) || []).forEach((cb) => cb(mem[name].get(id)));
  }
}

async function safeWrite(label, fn) {
  try {
    await fn();
  } catch (e) {
    if (__DEV__) console.warn(`[firebase] ${label} failed`, e);
  }
}

export function saveBookingRemote(booking) {
  if (useMemory) {
    mem.bookings.set(booking.id, { ...booking, status: 'active', createdMs: Date.now() });
    return Promise.resolve();
  }
  return safeWrite('saveBooking', () =>
    setDoc(doc(collection(db, 'bookings'), booking.id), {
      ...booking,
      uid: currentUid(),
      status: 'active',
      createdAt: serverTimestamp(),
    }),
  );
}

export function markBookingCancelledRemote(id) {
  if (useMemory) {
    memPatch('bookings', id, { status: 'cancelled' });
    return Promise.resolve();
  }
  return safeWrite('cancelBooking', () =>
    updateDoc(doc(collection(db, 'bookings'), id), {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
    }),
  );
}

export function saveApplicationRemote(application) {
  if (useMemory) {
    mem.cleanerApplications.set(application.id, {
      ...application,
      status: 'under_review',
      createdMs: Date.now(),
    });
    return Promise.resolve();
  }
  return safeWrite('saveApplication', () =>
    setDoc(doc(collection(db, 'cleanerApplications'), application.id), {
      ...application,
      uid: currentUid(),
      status: 'under_review',
      submittedAt: serverTimestamp(),
    }),
  );
}

export function markApplicationCancelledRemote(id) {
  if (useMemory) {
    memPatch('cleanerApplications', id, { status: 'cancelled' });
    return Promise.resolve();
  }
  return safeWrite('cancelApplication', () =>
    updateDoc(doc(collection(db, 'cleanerApplications'), id), {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
    }),
  );
}

// Admin action. Throws on failure so the admin page can tell you.
export async function updateApplicationStatus(id, status) {
  if (useMemory) {
    memPatch('cleanerApplications', id, { status });
    return;
  }
  await updateDoc(doc(collection(db, 'cleanerApplications'), id), {
    status,
    updatedAt: serverTimestamp(),
  });
}

// Lets the applicant's device follow the status you set. Returns an unsubscribe function.
export function subscribeApplication(id, callback) {
  if (useMemory) {
    const list = appListeners.get(id) || [];
    list.push(callback);
    appListeners.set(id, list);
    return () => appListeners.set(id, (appListeners.get(id) || []).filter((cb) => cb !== callback));
  }
  return onSnapshot(
    doc(db, 'cleanerApplications', id),
    (snap) => {
      if (snap.exists()) callback(snap.data());
    },
    () => {},
  );
}

async function listFromFirestore(name, orderField) {
  const snap = await getDocs(query(collection(db, name), orderBy(orderField, 'desc')));
  return snap.docs.map((d) => {
    const data = d.data();
    const ts = data[orderField];
    return { ...data, id: d.id, createdMs: ts?.toMillis ? ts.toMillis() : 0 };
  });
}

function listFromMemory(name) {
  return Array.from(mem[name].values()).sort((a, b) => b.createdMs - a.createdMs);
}

export const listBookings = () =>
  useMemory ? Promise.resolve(listFromMemory('bookings')) : listFromFirestore('bookings', 'createdAt');

export const listApplications = () =>
  useMemory
    ? Promise.resolve(listFromMemory('cleanerApplications'))
    : listFromFirestore('cleanerApplications', 'submittedAt');

// Account deletion: remove everything this user created. Throws on failure.
export async function deleteMyData(uid) {
  if (useMemory || !uid) return;
  for (const name of ['bookings', 'cleanerApplications']) {
    const snap = await getDocs(query(collection(db, name), where('uid', '==', uid)));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  }
}

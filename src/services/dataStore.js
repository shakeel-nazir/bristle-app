import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import * as Crypto from 'expo-crypto';
import { auth, db, isFirebaseConfigured } from './firebase';

// Demo mode is dev-only (never true in a production build): open the dev site with #demo in the
// URL and everything runs against in-memory data, so the admin flow works without any login.
export const isDemo =
  __DEV__ && typeof window !== 'undefined' && String(window.location?.hash || '').includes('demo');

const useMemory = isDemo || !isFirebaseConfigured;
export const dataAvailable = isDemo || isFirebaseConfigured;

const currentUid = () => auth?.currentUser?.uid || null;

const mem = {
  bookings: new Map(),
  cleanerApplications: new Map(),
  // Demo/offline seed so redeeming can be tried without a second account.
  referralCodes: new Map([['DEMO25', { ownerUid: 'demo-owner' }]]),
  users: new Map(),
};
const appListeners = new Map();

// Sample data so the admin page has something to show in the dev-only #demo mode.
if (isDemo) {
  const ago = (h) => Date.now() - h * 3600 * 1000;
  const svc = (name, price, tasks) => ({ name, price, duration: name.slice(0, 1) + ' hrs', tasks: tasks.map((label, i) => ({ id: String(i), label })) });
  [
    { id: 'b1', service: svc('4-Hour Clean', 159, ['Kitchen', 'Bathrooms', 'Floors']), date: 'Sat, Sep 26', time: '9:00 AM', address: '123 Bank St, Centretown, ON K1P 5N5', subtotal: 159, tax: 20.67, balance: 89.83, total: 179.67, deposit: 89.84, discountAmount: 0, home: { bedrooms: 3, bathrooms: 2, pets: ['dog'], petNotes: 'Friendly lab, will be in the yard' }, status: 'active', uid: 'local', createdMs: ago(3) },
    { id: 'b2', service: svc('2-Hour Clean', 89, ['Kitchen', 'Living room']), date: 'Tue, Sep 29', time: '1:00 PM', address: '48 Elgin St, Ottawa, ON K2P 1L4', subtotal: 89, tax: 8.68, balance: 37.71, total: 75.43, deposit: 37.72, discountAmount: 22.25, discountCode: 'K7M2QX', home: { bedrooms: 1, bathrooms: 1, pets: [] }, status: 'active', createdMs: ago(20) },
    { id: 'b4', uid: 'local', service: svc('2-Hour Clean', 89, ['Kitchen', 'Bathrooms']), date: 'Mon, Sep 14', time: '10:00 AM', address: '123 Bank St, Centretown, ON K1P 5N5', subtotal: 89, tax: 11.57, balance: 50.28, total: 100.57, deposit: 50.29, discountAmount: 0, home: { bedrooms: 3, bathrooms: 2, pets: ['dog'] }, status: 'completed', createdMs: ago(150) },
    { id: 'b3', service: svc('2-Hour Clean', 89, ['Bathrooms']), date: 'Fri, Sep 25', time: '11:00 AM', address: '900 Bronson Ave, Ottawa, ON K1S 4G6', subtotal: 89, tax: 11.57, balance: 50.28, total: 100.57, deposit: 50.29, discountAmount: 0, home: { bedrooms: 2, bathrooms: 1.5, pets: ['cat', 'dog'] }, status: 'cancelled', createdMs: ago(50) },
  ].forEach((b) => mem.bookings.set(b.id, b));
  [
    { id: 'a1', fullName: 'Jamie Rivera', email: 'jamie@example.com', phone: '(613) 555-0100', experience: '3–5 years', days: ['Mon', 'Tue', 'Thu'], timeBlocks: ['Morning'], about: 'Certified in green cleaning products.', status: 'under_review', createdMs: ago(2) },
    { id: 'a2', fullName: 'Priya Shah', email: 'priya@example.com', phone: '(613) 555-0142', experience: '5+ years', days: ['Wed', 'Fri', 'Sat'], timeBlocks: ['Morning', 'Afternoon'], status: 'approved', createdMs: ago(30) },
    { id: 'a3', fullName: 'Marcus Lee', email: 'marcus@example.com', phone: '(613) 555-0177', experience: 'New to cleaning', days: ['Sat', 'Sun'], timeBlocks: ['Afternoon'], status: 'approved', createdMs: ago(90) },
    { id: 'a4', fullName: 'Dana Okafor', email: 'dana@example.com', phone: '(613) 555-0190', experience: '1–3 years', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], timeBlocks: ['Morning', 'Afternoon'], status: 'interview', createdMs: ago(60) },
  ].forEach((a) => mem.cleanerApplications.set(a.id, a));
}


const bookingListeners = new Set();

function memBookingsFor(uid) {
  return Array.from(mem.bookings.values()).filter((b) => b.uid === uid);
}

function notifyBookings() {
  bookingListeners.forEach((l) => l.cb(memBookingsFor(l.uid)));
}

function memPatch(name, id, patch) {
  const current = mem[name].get(id);
  if (!current) return;
  mem[name].set(id, { ...current, ...patch });
  if (name === 'bookings') notifyBookings();
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
    mem.bookings.set(booking.id, {
      ...booking,
      uid: currentUid() || 'local',
      status: 'active',
      createdMs: Date.now(),
    });
    notifyBookings();
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

// Admin action (e.g. 'on_the_way', 'completed'). Throws on failure so the admin page can tell you.
export async function updateBookingStatus(id, status) {
  if (useMemory) {
    memPatch('bookings', id, { status });
    return;
  }
  const stamp = { on_the_way: 'onTheWayAt', completed: 'completedAt' }[status];
  await updateDoc(doc(collection(db, 'bookings'), id), {
    status,
    ...(stamp ? { [stamp]: serverTimestamp() } : {}),
  });
}

// Follows this person's bookings live, so status changes you make show up on their phone.
export function subscribeMyBookings(uid, callback) {
  if (useMemory) {
    const listener = { uid, cb: callback };
    bookingListeners.add(listener);
    callback(memBookingsFor(uid));
    return () => bookingListeners.delete(listener);
  }
  return onSnapshot(
    query(collection(db, 'bookings'), where('uid', '==', uid)),
    (snap) =>
      callback(
        snap.docs.map((d) => {
          const data = d.data();
          return { ...data, id: d.id, createdMs: data.createdAt?.toMillis?.() ?? Date.now() };
        }),
      ),
    () => callback([]),
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

// Admin action: give a booking a cleaner (an approved applicant), or pass null to unassign.
export async function assignBookingCleaner(id, cleaner) {
  const fields = { cleanerId: cleaner ? cleaner.id : null, cleanerName: cleaner ? cleaner.fullName || 'Cleaner' : null };
  if (useMemory) {
    memPatch('bookings', id, fields);
    return;
  }
  await updateDoc(doc(collection(db, 'bookings'), id), fields);
}

// Admin action: permanently removes a booking / application. Throws on failure.
export async function deleteBooking(id) {
  if (useMemory) {
    mem.bookings.delete(id);
    notifyBookings();
    return;
  }
  await deleteDoc(doc(collection(db, 'bookings'), id));
}

export async function deleteApplication(id) {
  if (useMemory) {
    mem.cleanerApplications.delete(id);
    (appListeners.get(id) || []).forEach((cb) => cb(null));
    return;
  }
  await deleteDoc(doc(collection(db, 'cleanerApplications'), id));
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
      else if (!snap.metadata.hasPendingWrites) callback(null); // deleted by the admin
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

// ---- Profile (home details) ----
export async function getUserProfile(uid) {
  if (useMemory) return mem.users.get(uid) || null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// Throws on failure so the form can tell the person.
export async function saveHomeProfile(uid, home) {
  if (useMemory) {
    mem.users.set(uid, { ...(mem.users.get(uid) || {}), home });
    return;
  }
  await setDoc(doc(db, 'users', uid), { home, homeUpdatedAt: serverTimestamp() }, { merge: true });
}

// ---- Referral codes ----
// Unambiguous characters only (no 0/O, 1/I), so codes are easy to read out and type.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function makeCode() {
  return Array.from(Crypto.getRandomBytes(6), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

// Returns this person's referral code, creating a random one the first time.
export async function getOrCreateReferralCode(uid) {
  if (useMemory) {
    for (const [code, v] of mem.referralCodes) if (v.ownerUid === uid) return code;
    let code = makeCode();
    while (mem.referralCodes.has(code)) code = makeCode();
    mem.referralCodes.set(code, { ownerUid: uid });
    return code;
  }
  const existing = await getDocs(
    query(collection(db, 'referralCodes'), where('ownerUid', '==', uid), limit(1)),
  );
  if (!existing.empty) return existing.docs[0].id;
  // A clash with someone else's code is rejected by the rules (no overwrites), so just retry.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = makeCode();
    try {
      await setDoc(doc(db, 'referralCodes', code), { ownerUid: uid, createdAt: serverTimestamp() });
      return code;
    } catch (e) {
      if (attempt === 5) throw e;
    }
  }
  return null;
}

// Returns { ownerUid } if the code exists, otherwise null. Throws if it can't be checked.
export async function lookupReferralCode(code) {
  if (useMemory) return mem.referralCodes.get(code) || null;
  const snap = await getDoc(doc(db, 'referralCodes', code));
  return snap.exists() ? { ownerUid: snap.data().ownerUid } : null;
}

export async function hasUsedReferral(uid) {
  if (useMemory) return mem.users.get(uid)?.referralUsed || null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data().referralUsed || null : null;
}

export function markReferralUsed(uid, code) {
  if (useMemory) {
    mem.users.set(uid, { ...(mem.users.get(uid) || {}), referralUsed: code });
    return Promise.resolve();
  }
  return safeWrite('markReferralUsed', () => setDoc(doc(db, 'users', uid), { referralUsed: code }, { merge: true }));
}

// Account deletion: remove everything this user created. Throws on failure.
export async function deleteMyData(uid) {
  if (useMemory || !uid) return;
  for (const [name, field] of [
    ['bookings', 'uid'],
    ['cleanerApplications', 'uid'],
    ['referralCodes', 'ownerUid'],
  ]) {
    const snap = await getDocs(query(collection(db, name), where(field, '==', uid)));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  }
  await deleteDoc(doc(db, 'users', uid));
}

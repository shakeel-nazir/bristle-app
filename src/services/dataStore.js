import {
  arrayUnion,
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
  writeBatch,
} from 'firebase/firestore';
import * as Crypto from 'expo-crypto';
import { isActiveJob, parseSlot } from '../utils/matching';
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
  tickets: new Map(),
};
const appListeners = new Map();
const ticketListeners = new Set();

function ticketsFor(uid) {
  return Array.from(mem.tickets.values()).filter((t) => t.uid === uid);
}
function notifyTickets() {
  ticketListeners.forEach((l) => l.cb(ticketsFor(l.uid)));
}

// Sample data so the admin page has something to show in the dev-only #demo mode.
if (isDemo) {
  const ago = (h) => Date.now() - h * 3600 * 1000;
  const svc = (name, price, tasks) => ({ name, price, duration: name.slice(0, 1) + ' hrs', tasks: tasks.map((label, i) => ({ id: String(i), label })) });
  [
    { id: 'b1', cleanerId: 'a2', cleanerName: 'Priya Shah', rawDate: new Date(2026, 8, 26).toISOString(), service: svc('4-Hour Clean', 159, ['Kitchen', 'Bathrooms', 'Floors']), date: 'Sat, Sep 26', time: '9:00 AM', address: '123 Bank St, Centretown, ON K1P 5N5', subtotal: 159, tax: 20.67, balance: 89.83, total: 179.67, deposit: 89.84, discountAmount: 0, home: { bedrooms: 3, bathrooms: 2, pets: ['dog'], petNotes: 'Friendly lab, will be in the yard' }, status: 'active', uid: 'local', createdMs: ago(3) },
    { id: 'b2', rawDate: new Date(2026, 8, 29).toISOString(), service: svc('2-Hour Clean', 89, ['Kitchen', 'Living room']), date: 'Tue, Sep 29', time: '1:00 PM', address: '48 Elgin St, Ottawa, ON K2P 1L4', subtotal: 89, tax: 8.68, balance: 37.71, total: 75.43, deposit: 37.72, discountAmount: 22.25, discountCode: 'K7M2QX', home: { bedrooms: 1, bathrooms: 1, pets: [] }, status: 'active', createdMs: ago(20) },
    { id: 'b4', cleanerId: 'a2', cleanerName: 'Priya Shah', rawDate: new Date(2026, 8, 14).toISOString(), uid: 'local', service: svc('2-Hour Clean', 89, ['Kitchen', 'Bathrooms']), date: 'Mon, Sep 14', time: '10:00 AM', address: '123 Bank St, Centretown, ON K1P 5N5', subtotal: 89, tax: 11.57, balance: 50.28, total: 100.57, deposit: 50.29, discountAmount: 0, home: { bedrooms: 3, bathrooms: 2, pets: ['dog'] }, status: 'completed', createdMs: ago(150) },
    { id: 'b5', cleanerId: 'a3', cleanerName: 'Marcus Lee', rawDate: new Date(2026, 8, 12).toISOString(), service: svc('4-Hour Clean', 159, ['Whole home']), date: 'Sat, Sep 12', time: '1:00 PM', address: '77 Somerset St W, Ottawa, ON K2P 0H6', subtotal: 159, tax: 20.67, balance: 89.83, total: 179.67, deposit: 89.84, discountAmount: 0, home: { bedrooms: 2, bathrooms: 1, pets: [] }, status: 'completed', createdMs: ago(200) },
    { id: 'b3', rawDate: new Date(2026, 8, 25).toISOString(), service: svc('2-Hour Clean', 89, ['Bathrooms']), date: 'Fri, Sep 25', time: '11:00 AM', address: '900 Bronson Ave, Ottawa, ON K1S 4G6', subtotal: 89, tax: 11.57, balance: 50.28, total: 100.57, deposit: 50.29, discountAmount: 0, home: { bedrooms: 2, bathrooms: 1.5, pets: ['cat', 'dog'] }, status: 'cancelled', createdMs: ago(50) },
  ].forEach((b) => mem.bookings.set(b.id, b));
  [
    { id: 'a1', fullName: 'Jamie Rivera', email: 'jamie@example.com', phone: '(613) 555-0100', experience: '3–5 years', days: ['Mon', 'Tue', 'Thu'], timeBlocks: ['Morning'], about: 'Certified in green cleaning products.', status: 'under_review', createdMs: ago(2) },
    { id: 'a2', fullName: 'Priya Shah', email: 'priya@example.com', phone: '(613) 555-0142', experience: '5+ years', days: ['Wed', 'Fri', 'Sat'], timeBlocks: ['Morning', 'Afternoon'], status: 'approved', createdMs: ago(30) },
    { id: 'a3', fullName: 'Marcus Lee', email: 'marcus@example.com', phone: '(613) 555-0177', experience: 'New to cleaning', days: ['Sat', 'Sun'], timeBlocks: ['Afternoon'], status: 'approved', createdMs: ago(90) },
    { id: 'a4', fullName: 'Dana Okafor', email: 'dana@example.com', phone: '(613) 555-0190', experience: '1–3 years', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], timeBlocks: ['Morning', 'Afternoon'], status: 'interview', createdMs: ago(60) },
  ].forEach((a) => mem.cleanerApplications.set(a.id, a));
  const msg = (from, text, h) => ({ from, text, ts: ago(h) });
  [
    { id: 't1', uid: 'local', category: 'Booking', userName: '', userEmail: '', bookingLabel: '4-Hour Clean · Sat, Sep 26', status: 'answered', customerSeen: false, messages: [msg('customer', 'Can I change my cleaning to the afternoon? Something came up in the morning.', 5), msg('admin', 'Of course! I’ve moved you to 1:00 PM on Saturday. See you then.', 2)], createdMs: ago(5), updatedMs: ago(2) },
    { id: 't2', uid: 'someone-else', category: 'Payment', userName: 'Jordan Blake', userEmail: 'jordan@example.com', bookingLabel: '2-Hour Clean · Tue, Sep 29', status: 'open', customerSeen: true, messages: [msg('customer', 'I was charged the deposit twice, can you check?', 1)], createdMs: ago(1), updatedMs: ago(1) },
    { id: 't3', uid: 'someone-else2', category: 'Something else', userName: 'Guest', userEmail: '', status: 'closed', customerSeen: true, messages: [msg('customer', 'Do you bring your own supplies?', 50), msg('admin', 'Yes, we bring everything, including eco-friendly products.', 48)], createdMs: ago(50), updatedMs: ago(48) },
  ].forEach((t) => mem.tickets.set(t.id, t));
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

// Public, personal-details-free records that let the booking screen know which times are open.
const busyRef = (id) => doc(db, 'busySlots', id);
const availabilityRef = (id) => doc(db, 'cleanerAvailability', id);
const busyFor = (b) => ({ date: b.date, time: b.time, hours: parseSlot(b)?.hours || 2, cleanerId: null, active: true });

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
  return safeWrite('saveBooking', async () => {
    const batch = writeBatch(db);
    batch.set(doc(collection(db, 'bookings'), booking.id), {
      ...booking,
      uid: currentUid(),
      status: 'active',
      createdAt: serverTimestamp(),
    });
    batch.set(busyRef(booking.id), busyFor(booking));
    await batch.commit();
  });
}

export function markBookingCancelledRemote(id) {
  if (useMemory) {
    memPatch('bookings', id, { status: 'cancelled' });
    return Promise.resolve();
  }
  return safeWrite('cancelBooking', async () => {
    const batch = writeBatch(db);
    batch.update(doc(collection(db, 'bookings'), id), { status: 'cancelled', cancelledAt: serverTimestamp() });
    batch.set(busyRef(id), { active: false }, { merge: true }); // frees the time for other customers
    await batch.commit();
  });
}

// Admin action (e.g. 'on_the_way', 'in_progress', 'completed'). Throws on failure so the admin page can tell you.
export async function updateBookingStatus(id, status) {
  // 'in_progress' starts the clean timer. startedMs is the admin's clock; the customer's screen
  // counts from it. Going back to 'on_the_way' stops (clears) the timer.
  const timer =
    status === 'in_progress' ? { startedMs: Date.now() } : status === 'on_the_way' ? { startedMs: null } : {};
  if (useMemory) {
    memPatch('bookings', id, { status, ...timer });
    return;
  }
  const stamp = { on_the_way: 'onTheWayAt', in_progress: 'startedAt', completed: 'completedAt' }[status];
  const batch = writeBatch(db);
  batch.update(doc(collection(db, 'bookings'), id), {
    status,
    ...timer,
    ...(stamp ? { [stamp]: serverTimestamp() } : {}),
  });
  if (!isActiveJob({ status })) batch.set(busyRef(id), { active: false }, { merge: true });
  await batch.commit();
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
  return safeWrite('cancelApplication', async () => {
    const batch = writeBatch(db);
    batch.update(doc(collection(db, 'cleanerApplications'), id), {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
    });
    batch.delete(availabilityRef(id)); // a withdrawn applicant is no longer bookable
    await batch.commit();
  });
}

// Admin action. Throws on failure so the admin page can tell you.
export async function updateApplicationStatus(id, status, application) {
  if (useMemory) {
    memPatch('cleanerApplications', id, { status });
    return;
  }
  const batch = writeBatch(db);
  batch.update(doc(collection(db, 'cleanerApplications'), id), { status, updatedAt: serverTimestamp() });
  // Only approved cleaners count towards which times customers can book.
  if (status === 'approved' && application) {
    batch.set(availabilityRef(id), {
      days: application.days || [],
      timeBlocks: application.timeBlocks || [],
    });
  } else {
    batch.delete(availabilityRef(id));
  }
  await batch.commit();
}

// Admin action: give a booking a cleaner (an approved applicant), or pass null to unassign.
export async function assignBookingCleaner(id, cleaner) {
  const fields = { cleanerId: cleaner ? cleaner.id : null, cleanerName: cleaner ? cleaner.fullName || 'Cleaner' : null };
  if (useMemory) {
    memPatch('bookings', id, fields);
    return;
  }
  const batch = writeBatch(db);
  batch.update(doc(collection(db, 'bookings'), id), fields);
  batch.set(busyRef(id), { cleanerId: fields.cleanerId }, { merge: true });
  await batch.commit();
}

// Admin action: change an upcoming booking's date, time, tasks, or add a note. Throws on failure.
// If a cleaner had to be unassigned the fields include cleanerId/cleanerName: null.
export async function updateBookingDetails(id, fields) {
  if (useMemory) {
    memPatch('bookings', id, fields);
    return;
  }
  const batch = writeBatch(db);
  batch.update(doc(collection(db, 'bookings'), id), { ...fields, editedAt: serverTimestamp() });
  const busy = { date: fields.date, time: fields.time };
  if ('cleanerId' in fields) busy.cleanerId = fields.cleanerId;
  batch.set(busyRef(id), busy, { merge: true }); // keeps other customers' available times correct
  await batch.commit();
}

// Admin action: change a cleaner's details (name, contact, experience, days, times).
// `bookingIds` are their bookings (so a new name shows everywhere); `unassignIds` are jobs the new
// hours can no longer cover, which go back to "needs a cleaner". Throws on failure.
export async function updateCleanerDetails(id, fields, { approved, bookingIds = [], unassignIds = [] } = {}) {
  const nameChanged = 'fullName' in fields;
  if (useMemory) {
    memPatch('cleanerApplications', id, fields);
    bookingIds.forEach((b) => {
      if (unassignIds.includes(b)) memPatch('bookings', b, { cleanerId: null, cleanerName: null });
      else if (nameChanged) memPatch('bookings', b, { cleanerName: fields.fullName });
    });
    return;
  }
  const batch = writeBatch(db);
  batch.update(doc(collection(db, 'cleanerApplications'), id), { ...fields, updatedAt: serverTimestamp() });
  if (approved) {
    batch.set(availabilityRef(id), { days: fields.days || [], timeBlocks: fields.timeBlocks || [] });
  }
  bookingIds.forEach((b) => {
    if (unassignIds.includes(b)) {
      batch.update(doc(collection(db, 'bookings'), b), { cleanerId: null, cleanerName: null });
      batch.set(busyRef(b), { cleanerId: null }, { merge: true });
    } else if (nameChanged) {
      batch.update(doc(collection(db, 'bookings'), b), { cleanerName: fields.fullName });
    }
  });
  await batch.commit();
}

// Admin action: a cleaner is no longer working with us. They stop being bookable, and the jobs
// they had coming up (`jobIds`) go back to "needs a cleaner". Their record and their name on past
// jobs are kept, and they can be reinstated later. Throws on failure.
export async function removeCleanerFromRoster(id, jobIds = []) {
  const freed = { cleanerId: null, cleanerName: null, status: 'active', startedMs: null };
  if (useMemory) {
    memPatch('cleanerApplications', id, { status: 'removed' });
    jobIds.forEach((b) => memPatch('bookings', b, freed));
    return;
  }
  const batch = writeBatch(db);
  batch.update(doc(collection(db, 'cleanerApplications'), id), {
    status: 'removed',
    removedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.delete(availabilityRef(id)); // no longer bookable
  jobIds.forEach((b) => {
    batch.update(doc(collection(db, 'bookings'), b), freed);
    batch.set(busyRef(b), { cleanerId: null }, { merge: true });
  });
  await batch.commit();
}

// Admin action: permanently removes a booking / application. Throws on failure.
export async function deleteBooking(id) {
  if (useMemory) {
    mem.bookings.delete(id);
    notifyBookings();
    return;
  }
  const batch = writeBatch(db);
  batch.delete(doc(collection(db, 'bookings'), id));
  batch.delete(busyRef(id));
  await batch.commit();
}

export async function deleteApplication(id) {
  if (useMemory) {
    mem.cleanerApplications.delete(id);
    (appListeners.get(id) || []).forEach((cb) => cb(null));
    return;
  }
  const batch = writeBatch(db);
  batch.delete(doc(collection(db, 'cleanerApplications'), id));
  batch.delete(availabilityRef(id));
  await batch.commit();
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

// What the booking screen needs to know which times are open: approved cleaners' working
// hours and the times already taken. Contains no personal details.
export async function getSupply() {
  if (useMemory) {
    return {
      enforced: isDemo,
      cleaners: Array.from(mem.cleanerApplications.values())
        .filter((a) => a.status === 'approved')
        .map((a) => ({ id: a.id, days: a.days || [], timeBlocks: a.timeBlocks || [] })),
      busy: Array.from(mem.bookings.values()).map((b) => ({
        id: b.id,
        date: b.date,
        time: b.time,
        hours: parseSlot(b)?.hours || 2,
        cleanerId: b.cleanerId || null,
        active: isActiveJob(b),
      })),
    };
  }
  const [cleaners, busy] = await Promise.all([
    getDocs(collection(db, 'cleanerAvailability')),
    getDocs(collection(db, 'busySlots')),
  ]);
  return {
    enforced: true,
    cleaners: cleaners.docs.map((d) => ({ id: d.id, ...d.data() })),
    busy: busy.docs.map((d) => ({ id: d.id, ...d.data() })),
  };
}

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
  // The public records go first: the rules check ownership through the booking / application.
  const mine = async (name, field) => getDocs(query(collection(db, name), where(field, '==', uid)));
  for (const d of (await mine('bookings', 'uid')).docs) {
    await deleteDoc(busyRef(d.id));
    await deleteDoc(d.ref);
  }
  for (const d of (await mine('cleanerApplications', 'uid')).docs) {
    await deleteDoc(availabilityRef(d.id));
    await deleteDoc(d.ref);
  }
  for (const d of (await mine('referralCodes', 'ownerUid')).docs) await deleteDoc(d.ref);
  for (const d of (await mine('tickets', 'uid')).docs) await deleteDoc(d.ref);
  await deleteDoc(doc(db, 'users', uid));
}

// ---- Support tickets ----
function mapTicket(d) {
  const data = d.data();
  return {
    ...data,
    id: d.id,
    createdMs: data.createdAt?.toMillis?.() ?? Date.now(),
    updatedMs: data.updatedAt?.toMillis?.() ?? Date.now(),
  };
}

// A customer opens a ticket. Throws on failure so the form can say so.
export async function createTicketRemote({ uid, category, message, userName, userEmail, bookingLabel }) {
  const first = { from: 'customer', text: message, ts: Date.now() };
  const base = { uid, category, userName, userEmail, bookingLabel: bookingLabel || '', status: 'open', customerSeen: true, messages: [first] };
  if (useMemory) {
    const id = `t${Date.now()}`;
    mem.tickets.set(id, { ...base, id, createdMs: Date.now(), updatedMs: Date.now() });
    notifyTickets();
    return id;
  }
  const ref = doc(collection(db, 'tickets'));
  await setDoc(ref, { ...base, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

// Admin starts a conversation (e.g. "your cleaner is running late") with no ticket from the customer.
// It appears as an unread message on their Home screen and they can reply.
export async function createAdminMessage({ uid, text, bookingLabel }) {
  const base = {
    uid,
    category: 'Message from Bristle',
    userName: '',
    userEmail: '',
    bookingLabel: bookingLabel || '',
    status: 'answered',
    customerSeen: false,
    messages: [{ from: 'admin', text, ts: Date.now() }],
  };
  if (useMemory) {
    const id = `t${Date.now()}`;
    mem.tickets.set(id, { ...base, id, createdMs: Date.now(), updatedMs: Date.now() });
    notifyTickets();
    return id;
  }
  const ref = doc(collection(db, 'tickets'));
  await setDoc(ref, { ...base, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

// Adds a message. `from` is 'customer' (reopens the ticket) or 'admin' (marks it answered).
export async function replyTicket(id, from, text) {
  const message = { from, text, ts: Date.now() };
  const status = from === 'admin' ? 'answered' : 'open';
  if (useMemory) {
    const t = mem.tickets.get(id);
    if (!t) return;
    mem.tickets.set(id, { ...t, status, customerSeen: from === 'customer', messages: [...t.messages, message], updatedMs: Date.now() });
    notifyTickets();
    return;
  }
  await updateDoc(doc(db, 'tickets', id), {
    messages: arrayUnion(message),
    status,
    customerSeen: from === 'customer',
    updatedAt: serverTimestamp(),
  });
}

// Admin: close or reopen.
export async function setTicketStatus(id, status) {
  if (useMemory) {
    const t = mem.tickets.get(id);
    if (t) {
      mem.tickets.set(id, { ...t, status, updatedMs: Date.now() });
      notifyTickets();
    }
    return;
  }
  await updateDoc(doc(db, 'tickets', id), { status, updatedAt: serverTimestamp() });
}

// Customer opened an answered ticket, so the "new reply" dot can go away.
export async function markTicketSeen(id) {
  if (useMemory) {
    const t = mem.tickets.get(id);
    if (t) {
      mem.tickets.set(id, { ...t, customerSeen: true });
      notifyTickets();
    }
    return;
  }
  await updateDoc(doc(db, 'tickets', id), { customerSeen: true });
}

export async function deleteTicket(id) {
  if (useMemory) {
    mem.tickets.delete(id);
    notifyTickets();
    return;
  }
  await deleteDoc(doc(db, 'tickets', id));
}

// Follows this person's tickets live, so your replies appear in their app.
export function subscribeMyTickets(uid, callback) {
  if (useMemory) {
    const listener = { uid, cb: callback };
    ticketListeners.add(listener);
    callback(ticketsFor(uid));
    return () => ticketListeners.delete(listener);
  }
  return onSnapshot(
    query(collection(db, 'tickets'), where('uid', '==', uid)),
    (snap) => callback(snap.docs.map(mapTicket)),
    () => callback([]),
  );
}

// Admin: every ticket, newest activity first.
export async function listTickets() {
  if (useMemory) return Array.from(mem.tickets.values()).sort((a, b) => b.updatedMs - a.updatedMs);
  const snap = await getDocs(query(collection(db, 'tickets'), orderBy('updatedAt', 'desc')));
  return snap.docs.map(mapTicket);
}

// ---- Admin live feeds ----
// Keep the admin panel current without a refresh button. Firestore pushes changes; the in-memory
// demo backend has no push channel, so it is checked every couple of seconds instead.
function watchList(name, orderField, fromMemory, mapDoc, callback, onError) {
  if (useMemory) {
    const tick = () => callback(fromMemory());
    tick();
    const timer = setInterval(tick, 2000);
    return () => clearInterval(timer);
  }
  return onSnapshot(
    query(collection(db, name), orderBy(orderField, 'desc')),
    (snap) => callback(snap.docs.map(mapDoc)),
    (e) => onError?.(e),
  );
}

const mapTimed = (orderField) => (d) => {
  const data = d.data();
  const ts = data[orderField];
  return { ...data, id: d.id, createdMs: ts?.toMillis ? ts.toMillis() : 0 };
};

export const watchBookings = (cb, onError) =>
  watchList('bookings', 'createdAt', () => listFromMemory('bookings'), mapTimed('createdAt'), cb, onError);

export const watchApplications = (cb, onError) =>
  watchList(
    'cleanerApplications',
    'submittedAt',
    () => listFromMemory('cleanerApplications'),
    mapTimed('submittedAt'),
    cb,
    onError,
  );

export const watchTickets = (cb, onError) =>
  watchList(
    'tickets',
    'updatedAt',
    () => Array.from(mem.tickets.values()).sort((a, b) => b.updatedMs - a.updatedMs),
    mapTicket,
    cb,
    onError,
  );

// Admin: make sure every approved cleaner's working hours are published for booking, and that
// nobody else's are. Cleaners approved before availability existed (or whose publish failed) get
// fixed here. Returns how many records were changed.
export async function syncCleanerAvailability(applications) {
  if (useMemory) return 0;
  const existing = new Map((await getDocs(collection(db, 'cleanerAvailability'))).docs.map((d) => [d.id, d.data()]));
  const same = (a, b) =>
    JSON.stringify([...(a || [])].sort()) === JSON.stringify([...(b || [])].sort());
  const batch = writeBatch(db);
  let changes = 0;
  const approved = new Set();
  for (const a of applications) {
    if (a.status !== 'approved') continue;
    approved.add(a.id);
    const have = existing.get(a.id);
    if (!have || !same(have.days, a.days) || !same(have.timeBlocks, a.timeBlocks)) {
      batch.set(availabilityRef(a.id), { days: a.days || [], timeBlocks: a.timeBlocks || [] });
      changes += 1;
    }
  }
  for (const id of existing.keys()) {
    if (!approved.has(id)) {
      batch.delete(availabilityRef(id));
      changes += 1;
    }
  }
  if (changes) await batch.commit();
  return changes;
}

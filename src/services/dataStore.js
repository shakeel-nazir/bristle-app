import { collection, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

async function safeWrite(label, fn) {
  if (!isFirebaseConfigured) return;
  try {
    await fn();
  } catch (e) {
    if (__DEV__) console.warn(`[firebase] ${label} failed`, e);
  }
}

export function saveBookingRemote(booking) {
  return safeWrite('saveBooking', () =>
    setDoc(doc(collection(db, 'bookings'), booking.id), {
      ...booking,
      status: 'active',
      createdAt: serverTimestamp(),
    }),
  );
}

export function markBookingCancelledRemote(id) {
  return safeWrite('cancelBooking', () =>
    updateDoc(doc(collection(db, 'bookings'), id), {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
    }),
  );
}

export function saveApplicationRemote(application) {
  return safeWrite('saveApplication', () =>
    setDoc(doc(collection(db, 'cleanerApplications'), application.id), {
      ...application,
      status: 'submitted',
      submittedAt: serverTimestamp(),
    }),
  );
}

export function markApplicationCancelledRemote(id) {
  return safeWrite('cancelApplication', () =>
    updateDoc(doc(collection(db, 'cleanerApplications'), id), {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
    }),
  );
}

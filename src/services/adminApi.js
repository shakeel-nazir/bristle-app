import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebase';
import {
  assignBookingCleaner,
  createAdminMessage,
  dataAvailable,
  deleteApplication,
  deleteBooking,
  deleteTicket,
  listTickets,
  replyTicket,
  setTicketStatus,
  isDemo,
  listApplications,
  listBookings,
  updateApplicationStatus,
  updateBookingDetails,
  updateBookingStatus,
} from './dataStore';

export const isFirebaseConfigured = dataAvailable;
export const fetchBookings = listBookings;
export const fetchApplications = listApplications;
export const setApplicationStatus = updateApplicationStatus;
export const setBookingStatus = updateBookingStatus;
export const setBookingCleaner = assignBookingCleaner;
export const fetchTickets = listTickets;
export const answerTicket = (id, text) => replyTicket(id, 'admin', text);
export const changeTicketStatus = setTicketStatus;
export const removeTicket = deleteTicket;
export const messageCustomer = createAdminMessage;
export const editBooking = updateBookingDetails;
export const removeBooking = deleteBooking;
export const removeApplication = deleteApplication;

export function watchAdminUser(callback) {
  if (isDemo) {
    callback({ email: 'demo@local' });
    return () => {};
  }
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
  return isDemo ? Promise.resolve() : signOut(auth);
}

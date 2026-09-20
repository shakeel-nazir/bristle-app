import React, { createContext, useContext, useState } from 'react';
import { REFERRAL_DISCOUNT_PERCENT } from '../utils/referral';
import { useAuth } from './AuthContext';
import {
  hasUsedReferral,
  lookupReferralCode,
  markBookingCancelledRemote,
  markReferralUsed,
  saveBookingRemote,
} from '../services/dataStore';

const BookingContext = createContext(null);

export const MAX_BOOKINGS = 2;

export function BookingProvider({ children }) {
  const { user, home } = useAuth();
  const uid = user?.uid || 'local';
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [discount, setDiscount] = useState(null);

  const addBooking = (booking) => {
    let added = false;
    const record = { id: `${Date.now()}`, ...booking, home: home || null };
    setUpcomingBookings((prev) => {
      if (prev.length >= MAX_BOOKINGS) return prev;
      added = true;
      return [...prev, record];
    });
    if (added) saveBookingRemote(record);
    return added;
  };

  const cancelBooking = (id) => {
    setUpcomingBookings((prev) => prev.filter((b) => b.id !== id));
    markBookingCancelledRemote(id);
  };

  // Checks the code really exists (someone's referral code), isn't your own, and that you
  // haven't already used a referral code before.
  const applyDiscountCode = async (rawCode) => {
    const code = rawCode.toUpperCase().replace(/[\s-]/g, '');
    if (!code) return { success: false, message: 'Enter a code' };
    try {
      const found = await lookupReferralCode(code);
      if (!found) return { success: false, message: "That code isn't valid. Check it and try again." };
      if (found.ownerUid === uid) {
        return { success: false, message: "You can't redeem your own referral code." };
      }
      if (await hasUsedReferral(uid)) {
        return { success: false, message: "You've already used a referral code." };
      }
    } catch (e) {
      return { success: false, message: "Couldn't check that code. Please try again." };
    }
    setDiscount({ code, percent: REFERRAL_DISCOUNT_PERCENT });
    return { success: true };
  };

  const clearDiscount = () => setDiscount(null);

  // The discount was used on a paid booking, so it can't be used again.
  const consumeDiscount = () => {
    if (discount) markReferralUsed(uid, discount.code);
    setDiscount(null);
  };

  const canBookMore = upcomingBookings.length < MAX_BOOKINGS;

  return (
    <BookingContext.Provider
      value={{
        upcomingBookings,
        addBooking,
        cancelBooking,
        canBookMore,
        discount,
        applyDiscountCode,
        clearDiscount,
        consumeDiscount,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  return useContext(BookingContext);
}

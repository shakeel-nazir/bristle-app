import React, { createContext, useContext, useState } from 'react';
import { getMyReferralCode, REFERRAL_DISCOUNT_PERCENT } from '../utils/referral';
import { saveBookingRemote, markBookingCancelledRemote } from '../services/dataStore';

const BookingContext = createContext(null);

export const MAX_BOOKINGS = 2;

export function BookingProvider({ children }) {
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [discount, setDiscount] = useState(null);

  const addBooking = (booking) => {
    let added = false;
    const record = { id: `${Date.now()}`, ...booking };
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

  const applyDiscountCode = (rawCode) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return { success: false, message: 'Enter a code' };
    if (code === getMyReferralCode()) {
      return { success: false, message: "You can't redeem your own referral code" };
    }
    if (code.length < 4) return { success: false, message: "That code doesn't look right" };
    setDiscount({ code, percent: REFERRAL_DISCOUNT_PERCENT });
    return { success: true };
  };

  const clearDiscount = () => setDiscount(null);

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
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  return useContext(BookingContext);
}

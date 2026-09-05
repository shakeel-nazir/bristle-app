import React, { createContext, useContext, useState } from 'react';

const BookingContext = createContext(null);

export const MAX_BOOKINGS = 2;

export function BookingProvider({ children }) {
  const [upcomingBookings, setUpcomingBookings] = useState([]);

  const addBooking = (booking) => {
    let added = false;
    setUpcomingBookings((prev) => {
      if (prev.length >= MAX_BOOKINGS) return prev;
      added = true;
      return [...prev, { id: `${Date.now()}`, ...booking }];
    });
    return added;
  };

  const cancelBooking = (id) => {
    setUpcomingBookings((prev) => prev.filter((b) => b.id !== id));
  };

  const canBookMore = upcomingBookings.length < MAX_BOOKINGS;

  return (
    <BookingContext.Provider value={{ upcomingBookings, addBooking, cancelBooking, canBookMore }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  return useContext(BookingContext);
}

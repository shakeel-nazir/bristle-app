import React, { createContext, useContext, useState } from 'react';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [upcomingBooking, setUpcomingBooking] = useState(null);

  const cancelBooking = () => setUpcomingBooking(null);

  return (
    <BookingContext.Provider value={{ upcomingBooking, setUpcomingBooking, cancelBooking }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  return useContext(BookingContext);
}

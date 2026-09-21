import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  createTicketRemote,
  markTicketSeen,
  replyTicket,
  subscribeMyTickets,
} from '../services/dataStore';

const TicketContext = createContext(null);

export function TicketProvider({ children }) {
  const { user, isGuest } = useAuth();
  const uid = user?.uid || 'local';
  const [tickets, setTickets] = useState([]);

  useEffect(() => subscribeMyTickets(uid, setTickets), [uid]);

  const value = useMemo(() => {
    const sorted = [...tickets].sort((a, b) => b.updatedMs - a.updatedMs);
    return {
      tickets: sorted,
      // Tickets you've answered that the customer hasn't opened yet.
      unreadCount: sorted.filter((t) => t.status === 'answered' && t.customerSeen === false).length,

      createTicket: async ({ category, message, bookingLabel }) => {
        try {
          const id = await createTicketRemote({
            uid,
            category,
            message,
            bookingLabel,
            userName: user?.displayName || (isGuest ? 'Guest' : ''),
            userEmail: user?.email || '',
          });
          return { ok: true, id };
        } catch (e) {
          return { error: 'Couldn’t send that. Check your connection and try again.' };
        }
      },

      reply: async (id, text) => {
        try {
          await replyTicket(id, 'customer', text);
          return { ok: true };
        } catch (e) {
          return { error: 'Couldn’t send that. Please try again.' };
        }
      },

      markSeen: (id) => markTicketSeen(id).catch(() => {}),
    };
  }, [tickets, uid, user, isGuest]);

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
}

export function useTickets() {
  return useContext(TicketContext);
}

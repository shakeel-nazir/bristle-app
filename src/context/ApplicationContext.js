import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  markApplicationCancelledRemote,
  saveApplicationRemote,
  subscribeApplication,
} from '../services/dataStore';

const ApplicationContext = createContext(null);

// Random (not timestamp) so an application's id can't be guessed by someone else.
function randomId() {
  return `${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function ApplicationProvider({ children }) {
  const [application, setApplication] = useState(null);
  const applicationId = application?.id;

  useEffect(() => {
    if (!applicationId) return undefined;
    return subscribeApplication(applicationId, (data) => {
      // data is null when the application was deleted on the admin side.
      setApplication((prev) => {
        if (!prev || prev.id !== applicationId) return prev;
        return data ? { ...prev, status: data.status } : null;
      });
    });
  }, [applicationId]);

  const submitApplication = (data) => {
    const record = { id: randomId(), ...data, status: 'under_review', submittedAt: Date.now() };
    setApplication(record);
    saveApplicationRemote(record);
  };

  const cancelApplication = () => {
    if (applicationId) markApplicationCancelledRemote(applicationId);
    setApplication(null);
  };

  return (
    <ApplicationContext.Provider value={{ application, submitApplication, cancelApplication }}>
      {children}
    </ApplicationContext.Provider>
  );
}

export function useApplication() {
  return useContext(ApplicationContext);
}

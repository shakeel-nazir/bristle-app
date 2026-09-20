import React, { createContext, useContext, useState } from 'react';
import { saveApplicationRemote, markApplicationCancelledRemote } from '../services/dataStore';

const ApplicationContext = createContext(null);

export function ApplicationProvider({ children }) {
  const [application, setApplication] = useState(null);

  const submitApplication = (data) => {
    const record = { id: `${Date.now()}`, ...data, submittedAt: Date.now() };
    setApplication(record);
    saveApplicationRemote(record);
  };

  const cancelApplication = () => {
    if (application?.id) markApplicationCancelledRemote(application.id);
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

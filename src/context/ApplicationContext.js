import React, { createContext, useContext, useState } from 'react';

const ApplicationContext = createContext(null);

export function ApplicationProvider({ children }) {
  const [application, setApplication] = useState(null);

  const submitApplication = (data) => {
    setApplication({ ...data, submittedAt: Date.now() });
  };

  const cancelApplication = () => setApplication(null);

  return (
    <ApplicationContext.Provider value={{ application, submitApplication, cancelApplication }}>
      {children}
    </ApplicationContext.Provider>
  );
}

export function useApplication() {
  return useContext(ApplicationContext);
}

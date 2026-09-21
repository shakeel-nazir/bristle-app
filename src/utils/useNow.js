import { useEffect, useState } from 'react';

// Re-renders every second so clocks tick. Nothing is written anywhere; timers are worked out from
// when the clean was started.
export default function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

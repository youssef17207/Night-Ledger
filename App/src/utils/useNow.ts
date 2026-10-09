import { useEffect, useState } from 'react';

/**
 * The app's clock. Re-renders on a steady tick, and immediately when the tab becomes
 * visible again, so "today", "next up", late flags and missed-block detection all
 * follow real time without a refresh (including across midnight).
 */
export function useNow(tickMs = 20_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, tickMs);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', tick);
    };
  }, [tickMs]);

  return now;
}

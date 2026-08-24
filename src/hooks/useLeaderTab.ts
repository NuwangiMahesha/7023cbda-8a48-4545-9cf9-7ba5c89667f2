import { useEffect, useState } from 'react';
import { LEADER_KEY } from '../utils/storage';

const HEARTBEAT_MS = 2000;
const STALE_MS = 5000;

/**
 * Exactly one open tab settles rounds. Every tab writes a heartbeat; a tab
 * becomes leader when the stored heartbeat is its own or has gone stale. This
 * stops two tabs (player app + admin portal) from settling the same period
 * twice and paying out twice.
 */
export function useLeaderTab(): boolean {
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    const id = Math.random().toString(36).slice(2);

    function claim() {
      let current: {id: string;at: number;} | null = null;
      try {
        const raw = window.localStorage.getItem(LEADER_KEY);
        current = raw ? JSON.parse(raw) : null;
      } catch {
        current = null;
      }

      const stale = !current || Date.now() - current.at > STALE_MS;
      if (stale || current?.id === id) {
        try {
          window.localStorage.setItem(LEADER_KEY, JSON.stringify({ id, at: Date.now() }));
          setIsLeader(true);
          return;
        } catch {
          setIsLeader(true);
          return;
        }
      }
      setIsLeader(false);
    }

    claim();
    const timer = window.setInterval(claim, HEARTBEAT_MS);
    return () => window.clearInterval(timer);
  }, []);

  return isLeader;
}
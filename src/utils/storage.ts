/**
 * Shared persistence layer. In production this state lives in the database and
 * is read over the API; here it is mirrored into localStorage so that a page
 * reload — or opening the admin portal in a second tab — sees exactly the same
 * players, balances, bets and pending requests as the player app.
 */

export const STATE_KEY = 'prisma-play-state-v2';
export const LEADER_KEY = 'prisma-play-leader';

export function readState<T>(): T | null {
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

export function writeState(serialized: string): void {
  try {
    window.localStorage.setItem(STATE_KEY, serialized);
  } catch {

    /* storage unavailable — the session simply stays in memory */}
}
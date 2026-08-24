/**
 * Local-storage helpers that survive the move to Firestore.
 *
 * Only the leader-tab key remains here.  All game state (users, bets,
 * transactions, rounds, settings) now lives in Firestore and is synced
 * via realtime listeners in AppContext.
 */

export const LEADER_KEY = 'prisma-play-leader';
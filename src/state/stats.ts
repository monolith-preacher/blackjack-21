import type { Outcome, RoundSummary } from '../engine';

export interface Stats {
  rounds: number;
  handsPlayed: number;
  wins: number;
  losses: number;
  pushes: number;
  blackjacks: number;
  busts: number;
  doubles: number;
  splits: number;
  /** Consecutive winning rounds (pushes do not break the streak). */
  currentStreak: number;
  bestStreak: number;
  biggestWin: number;
  totalWagered: number;
  net: number;
  peakBalance: number;
  refills: number;
}

export const EMPTY_STATS: Stats = {
  rounds: 0,
  handsPlayed: 0,
  wins: 0,
  losses: 0,
  pushes: 0,
  blackjacks: 0,
  busts: 0,
  doubles: 0,
  splits: 0,
  currentStreak: 0,
  bestStreak: 0,
  biggestWin: 0,
  totalWagered: 0,
  net: 0,
  peakBalance: 0,
  refills: 0,
};

export function recordRound(stats: Stats, r: RoundSummary): Stats {
  const count = (pred: (o: Outcome) => boolean) => r.hands.filter((h) => pred(h.outcome)).length;
  const currentStreak = r.net > 0 ? stats.currentStreak + 1 : r.net < 0 ? 0 : stats.currentStreak;
  return {
    ...stats,
    rounds: stats.rounds + 1,
    handsPlayed: stats.handsPlayed + r.hands.length,
    wins: stats.wins + count((o) => o === 'win' || o === 'blackjack'),
    losses: stats.losses + count((o) => o === 'lose' || o === 'bust'),
    pushes: stats.pushes + count((o) => o === 'push'),
    blackjacks: stats.blackjacks + count((o) => o === 'blackjack'),
    busts: stats.busts + count((o) => o === 'bust'),
    doubles: stats.doubles + r.hands.filter((h) => h.doubled).length,
    splits: stats.splits + r.splits,
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
    biggestWin: Math.max(stats.biggestWin, r.net),
    totalWagered: stats.totalWagered + r.totalBet,
    net: stats.net + r.net,
    peakBalance: Math.max(stats.peakBalance, r.balanceAfter),
  };
}

export function winRate(stats: Stats): number {
  const decided = stats.wins + stats.losses;
  return decided === 0 ? 0 : stats.wins / decided;
}

export type RoundOutcome = 'blackjack' | 'win' | 'push' | 'lose' | 'bust';

export interface HistoryEntry {
  roundId: number;
  outcome: RoundOutcome;
  net: number;
  bet: number;
  playerTotals: number[];
  dealerTotal: number;
  dealerBust: boolean;
  at: number;
}

export const HISTORY_LIMIT = 30;

export function roundOutcome(r: RoundSummary): RoundOutcome {
  if (r.hands.some((h) => h.outcome === 'blackjack')) return 'blackjack';
  if (r.net > 0) return 'win';
  if (r.net === 0) return 'push';
  return r.hands.every((h) => h.outcome === 'bust') ? 'bust' : 'lose';
}

export function addToHistory(history: HistoryEntry[], r: RoundSummary, at = Date.now()): HistoryEntry[] {
  const entry: HistoryEntry = {
    roundId: r.roundId,
    outcome: roundOutcome(r),
    net: r.net,
    bet: r.totalBet,
    playerTotals: r.hands.map((h) => h.total),
    dealerTotal: r.dealerTotal,
    dealerBust: r.dealerBust,
    at,
  };
  return [entry, ...history].slice(0, HISTORY_LIMIT);
}

import type { GameState, Phase } from '../engine';
import { EMPTY_STATS, type HistoryEntry, type Stats } from './stats';

const PREFIX = 'bj21.v1.';
export const STORAGE_KEYS = {
  game: `${PREFIX}game`,
  stats: `${PREFIX}stats`,
  history: `${PREFIX}history`,
  settings: `${PREFIX}settings`,
} as const;

export function loadJSON<T>(key: string, validate: (v: unknown) => v is T): T | null {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    return validate(value) ? value : null;
  } catch {
    return null;
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or disabled (private mode): the game keeps working without persistence.
  }
}

export function removeKey(key: string): void {
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    /* ignore */
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const PHASES: Phase[] = ['betting', 'dealing', 'playerTurn', 'dealerTurn', 'settled'];

export function isGameState(v: unknown): v is GameState {
  if (!isObj(v)) return false;
  const shoe = v.shoe;
  const dealer = v.dealer;
  return (
    PHASES.includes(v.phase as Phase) &&
    isNum(v.balance) &&
    v.balance >= 0 &&
    isObj(v.rules) &&
    Array.isArray(v.pendingBet) &&
    Array.isArray(v.hands) &&
    isNum(v.activeHand) &&
    isNum(v.roundId) &&
    isNum(v.handSeq) &&
    isNum(v.lastBet) &&
    isObj(shoe) &&
    Array.isArray(shoe.cards) &&
    isObj(dealer) &&
    Array.isArray(dealer.cards)
  );
}

export function isStats(v: unknown): v is Stats {
  return isObj(v) && Object.keys(EMPTY_STATS).every((k) => isNum(v[k]));
}

export function isHistory(v: unknown): v is HistoryEntry[] {
  return Array.isArray(v) && v.every((e) => isObj(e) && isNum(e.roundId) && isNum(e.net) && typeof e.outcome === 'string');
}

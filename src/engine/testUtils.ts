import type { ChipValue } from './chips';
import { addChip, advance, createGame, needsAdvance, startRound, type CreateGameOptions, type GameState } from './game';
import { createStackedShoe } from './shoe';
import type { Rank, Rng } from './types';

/** Small deterministic PRNG (mulberry32) for reproducible tests. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Runs automatic steps until the player must act or the round is settled. */
export function runAuto(s: GameState, rng?: Rng): GameState {
  let state = s;
  let guard = 0;
  while (needsAdvance(state)) {
    state = advance(state, rng);
    if (++guard > 100) throw new Error('advance loop did not terminate');
  }
  return state;
}

/**
 * Starts a round with a stacked shoe. Deal order is: player, dealer up, player, dealer hole,
 * then any further cards in the order they are drawn.
 */
export function dealRound(
  cards: Rank[],
  bet: ChipValue[] = [100],
  opts: Omit<CreateGameOptions, 'shoe'> = {},
): GameState {
  let s = createGame({ ...opts, shoe: createStackedShoe(cards), rng: seededRng(1) });
  for (const chip of bet) s = addChip(s, chip);
  return runAuto(startRound(s));
}

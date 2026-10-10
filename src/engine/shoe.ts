import { RANKS, SUITS, type Card, type Rank, type Rng, type Suit } from './types';

export interface Shoe {
  /** Remaining cards; index 0 is the next card to be dealt. */
  cards: Card[];
  /** Number of cards in the shoe when it was shuffled. */
  size: number;
  /** Reshuffle before a new round once this many cards (or fewer) remain. */
  cutCardRemaining: number;
  /** Incremented on each reshuffle so card ids stay unique across shoes. */
  generation: number;
}

/** Cryptographically strong RNG (falls back to Math.random where crypto is unavailable). */
export const cryptoRng: Rng = () => {
  const c = globalThis.crypto;
  if (c?.getRandomValues) {
    const buf = new Uint32Array(1);
    c.getRandomValues(buf);
    return buf[0] / 2 ** 32;
  }
  return Math.random();
};

/** Unbiased Fisher–Yates shuffle. Returns a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function buildDecks(decks: number, generation: number): Card[] {
  const cards: Card[] = [];
  for (let d = 0; d < decks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({ id: `g${generation}-d${d}-${rank}${suit[0]}`, rank, suit });
      }
    }
  }
  return cards;
}

export function createShoe(decks: number, penetration: number, rng: Rng, generation = 1): Shoe {
  const cards = shuffle(buildDecks(decks, generation), rng);
  return {
    cards,
    size: cards.length,
    cutCardRemaining: Math.round(cards.length * (1 - penetration)),
    generation,
  };
}

export function needsReshuffle(shoe: Shoe): boolean {
  return shoe.cards.length <= shoe.cutCardRemaining;
}

/**
 * Builds a shoe whose top cards are exactly `top` (in dealing order). Intended for tests and
 * debugging; the cut card is placed at the bottom so it never forces a reshuffle mid-test.
 */
export function createStackedShoe(top: ReadonlyArray<Rank | `${Rank}${'s' | 'h' | 'd' | 'c'}`>): Shoe {
  const suitByLetter: Record<string, Suit> = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' };
  const cards: Card[] = top.map((spec, i) => {
    const last = spec[spec.length - 1];
    const hasSuit = last in suitByLetter;
    const rank = (hasSuit ? spec.slice(0, -1) : spec) as Rank;
    const suit = hasSuit ? suitByLetter[last] : SUITS[i % 4];
    return { id: `t-${i}-${rank}${suit[0]}`, rank, suit };
  });
  return { cards, size: cards.length, cutCardRemaining: 0, generation: 0 };
}

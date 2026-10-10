export const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
export type Rank = (typeof RANKS)[number];

export interface Card {
  /** Unique within a shoe generation — used as a stable React key and for animations. */
  id: string;
  rank: Rank;
  suit: Suit;
}

/** Random number generator returning a float in [0, 1). Injectable for deterministic tests. */
export type Rng = () => number;

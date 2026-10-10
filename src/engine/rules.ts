export interface Rules {
  /** Number of 52-card decks in the shoe. */
  decks: number;
  /** Fraction of the shoe dealt before the cut card triggers a reshuffle (0–1). */
  penetration: number;
  /** false = dealer stands on all 17s (S17); true = dealer hits soft 17 (H17). */
  dealerHitsSoft17: boolean;
  /** Profit multiplier for a natural blackjack (1.5 = pays 3:2). */
  blackjackPayout: number;
  /** Dealer checks the hole card for blackjack when showing an Ace or ten-value card. */
  dealerPeek: boolean;
  /** Allow doubling down on hands created by a split. */
  doubleAfterSplit: boolean;
  /** Maximum number of player hands after splits (4 = up to 3 splits). */
  maxHands: number;
  /** true = any two ten-value cards may be split (e.g. K+Q); false = identical ranks only. */
  splitByValue: boolean;
  minBet: number;
  maxBet: number;
  startingBalance: number;
}

/**
 * House rules used by the game. Split aces receive exactly one card each and cannot be
 * re-split, hit or doubled; a 21 made after a split counts as 21, not blackjack.
 */
export const DEFAULT_RULES: Rules = {
  decks: 6,
  penetration: 0.75,
  dealerHitsSoft17: false,
  blackjackPayout: 1.5,
  dealerPeek: true,
  doubleAfterSplit: true,
  maxHands: 4,
  splitByValue: false,
  minBet: 5,
  maxBet: 5000,
  startingBalance: 1000,
};

export function createRules(overrides: Partial<Rules> = {}): Rules {
  return { ...DEFAULT_RULES, ...overrides };
}

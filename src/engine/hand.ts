import type { Card, Rank } from './types';

export interface HandValue {
  /** Best total: aces count as 11 when that does not bust the hand. */
  total: number;
  /** True when an ace is currently counted as 11. */
  soft: boolean;
}

export function rankValue(rank: Rank): number {
  if (rank === 'A') return 1;
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10;
  return Number(rank);
}

export function isTenValue(rank: Rank): boolean {
  return rankValue(rank) === 10;
}

export function evaluateHand(cards: readonly Card[]): HandValue {
  let hard = 0;
  let hasAce = false;
  for (const card of cards) {
    hard += rankValue(card.rank);
    if (card.rank === 'A') hasAce = true;
  }
  // At most one ace can ever count as 11 (two would be 22).
  if (hasAce && hard + 10 <= 21) return { total: hard + 10, soft: true };
  return { total: hard, soft: false };
}

/** Two-card 21. Whether it counts as a natural (not after a split) is decided by the game. */
export function isTwoCardTwentyOne(cards: readonly Card[]): boolean {
  return cards.length === 2 && evaluateHand(cards).total === 21;
}

export function isBust(cards: readonly Card[]): boolean {
  return evaluateHand(cards).total > 21;
}

/** Text shown on the hand badge, e.g. "7 / 17" for a soft 17 still in play. */
export function formatHandValue(cards: readonly Card[], final = false): string {
  if (cards.length === 0) return '';
  const { total, soft } = evaluateHand(cards);
  if (soft && total < 21 && !final) return `${total - 10} / ${total}`;
  return String(total);
}

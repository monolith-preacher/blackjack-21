import { describe, expect, it } from 'vitest';
import { evaluateHand, formatHandValue, isBust, isTwoCardTwentyOne } from './hand';
import type { Card, Rank } from './types';

const hand = (...ranks: Rank[]): Card[] => ranks.map((rank, i) => ({ id: String(i), rank, suit: 'spades' }));

describe('evaluateHand', () => {
  it('sums number and face cards', () => {
    expect(evaluateHand(hand('7', '8'))).toEqual({ total: 15, soft: false });
    expect(evaluateHand(hand('K', 'Q'))).toEqual({ total: 20, soft: false });
    expect(evaluateHand(hand('J', '10', '2'))).toEqual({ total: 22, soft: false });
  });

  it('counts an ace as 11 when it does not bust (soft hand)', () => {
    expect(evaluateHand(hand('A', '6'))).toEqual({ total: 17, soft: true });
    expect(evaluateHand(hand('A', 'K'))).toEqual({ total: 21, soft: true });
  });

  it('counts an ace as 1 when 11 would bust (hard hand)', () => {
    expect(evaluateHand(hand('A', '6', '10'))).toEqual({ total: 17, soft: false });
    expect(evaluateHand(hand('A', '9', '5'))).toEqual({ total: 15, soft: false });
  });

  it('handles multiple aces — only one can be 11', () => {
    expect(evaluateHand(hand('A', 'A'))).toEqual({ total: 12, soft: true });
    expect(evaluateHand(hand('A', 'A', '9'))).toEqual({ total: 21, soft: true });
    expect(evaluateHand(hand('A', 'A', 'A', 'A', '7'))).toEqual({ total: 21, soft: true });
    expect(evaluateHand(hand('A', 'A', 'K', 'Q'))).toEqual({ total: 22, soft: false });
  });

  it('detects two-card 21 and bust', () => {
    expect(isTwoCardTwentyOne(hand('A', 'J'))).toBe(true);
    expect(isTwoCardTwentyOne(hand('7', '7', '7'))).toBe(false);
    expect(isBust(hand('K', '5', '9'))).toBe(true);
    expect(isBust(hand('A', '5', '9'))).toBe(false);
  });

  it('formats soft totals for display', () => {
    expect(formatHandValue(hand('A', '6'))).toBe('7 / 17');
    expect(formatHandValue(hand('A', '6'), true)).toBe('17');
    expect(formatHandValue(hand('A', 'K'))).toBe('21');
    expect(formatHandValue(hand('10', '6'))).toBe('16');
    expect(formatHandValue([])).toBe('');
  });
});

import { describe, expect, it } from 'vitest';
import type { HandResult, RoundSummary } from '../engine';
import { sanitizeSettings } from './settings';
import { addToHistory, EMPTY_STATS, HISTORY_LIMIT, recordRound, roundOutcome, winRate } from './stats';
import { isGameState } from './storage';
import { createGame } from '../engine';
import { seededRng } from '../engine/testUtils';

function summary(hands: Partial<HandResult>[], extra: Partial<RoundSummary> = {}): RoundSummary {
  const full = hands.map((h) => ({ outcome: 'win', bet: 100, payout: 200, total: 20, doubled: false, ...h }) as HandResult);
  const totalBet = full.reduce((a, h) => a + h.bet, 0);
  const totalPayout = full.reduce((a, h) => a + h.payout, 0);
  return {
    roundId: 1,
    hands: full,
    dealerTotal: 18,
    dealerBust: false,
    dealerBlackjack: false,
    splits: full.length - 1,
    totalBet,
    totalPayout,
    net: totalPayout - totalBet,
    balanceAfter: 1000,
    ...extra,
  };
}

describe('stats', () => {
  it('counts outcomes, blackjacks and streaks', () => {
    let s = recordRound(EMPTY_STATS, summary([{ outcome: 'blackjack', payout: 250 }]));
    s = recordRound(s, summary([{ outcome: 'win' }]));
    s = recordRound(s, summary([{ outcome: 'push', payout: 100 }]));
    expect(s.currentStreak).toBe(2); // push keeps the streak
    s = recordRound(s, summary([{ outcome: 'bust', payout: 0 }]));
    expect(s.currentStreak).toBe(0);
    expect(s.bestStreak).toBe(2);
    expect(s).toMatchObject({ rounds: 4, wins: 2, losses: 1, pushes: 1, blackjacks: 1, busts: 1 });
    expect(s.biggestWin).toBe(150);
    expect(s.net).toBe(150 + 100 + 0 - 100);
    expect(winRate(s)).toBeCloseTo(2 / 3);
  });

  it('counts split hands individually', () => {
    const s = recordRound(EMPTY_STATS, summary([{ outcome: 'win', doubled: true, bet: 200, payout: 400 }, { outcome: 'lose', payout: 0 }]));
    expect(s).toMatchObject({ handsPlayed: 2, wins: 1, losses: 1, doubles: 1, splits: 1, rounds: 1 });
    expect(s.currentStreak).toBe(1);
  });

  it('classifies rounds and keeps a bounded history', () => {
    expect(roundOutcome(summary([{ outcome: 'bust', payout: 0 }]))).toBe('bust');
    expect(roundOutcome(summary([{ outcome: 'lose', payout: 0 }, { outcome: 'bust', payout: 0 }]))).toBe('lose');
    expect(roundOutcome(summary([{ outcome: 'push', payout: 100 }]))).toBe('push');
    let h = addToHistory([], summary([{}]));
    for (let i = 0; i < 40; i++) h = addToHistory(h, summary([{}], { roundId: i + 2 }));
    expect(h).toHaveLength(HISTORY_LIMIT);
    expect(h[0].roundId).toBe(41);
  });
});

describe('persistence validation', () => {
  it('accepts a real game state and rejects garbage', () => {
    const game = JSON.parse(JSON.stringify(createGame({ rng: seededRng(1) })));
    expect(isGameState(game)).toBe(true);
    expect(isGameState({ ...game, balance: -5 })).toBe(false);
    expect(isGameState({ ...game, phase: 'weird' })).toBe(false);
    expect(isGameState(null)).toBe(false);
  });

  it('sanitizes settings', () => {
    expect(sanitizeSettings({ volume: 4, speed: 'warp', soundEnabled: false })).toEqual({
      soundEnabled: false,
      volume: 1,
      speed: 'normal',
      showHints: true,
    });
  });
});

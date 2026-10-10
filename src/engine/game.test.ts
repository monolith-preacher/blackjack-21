import { describe, expect, it } from 'vitest';
import { CHIP_VALUES, chipsForAmount } from './chips';
import {
  addChip,
  advance,
  availableActions,
  canDeal,
  canDouble,
  canSplit,
  clearBet,
  createGame,
  double,
  doubleBet,
  GameError,
  hit,
  isBroke,
  newRound,
  rebet,
  refill,
  split,
  stand,
  startRound,
  undoChip,
  type GameState,
} from './game';
import { evaluateHand } from './hand';
import { createStackedShoe } from './shoe';
import { dealRound, runAuto, seededRng } from './testUtils';

const finish = (s: GameState) => runAuto(s);

describe('betting', () => {
  it('stacks chips, undoes and clears without touching the balance', () => {
    let s = createGame({ rng: seededRng(1) });
    s = addChip(addChip(addChip(s, 25), 5), 100);
    expect(s.pendingBet).toEqual([25, 5, 100]);
    expect(s.balance).toBe(1000);
    s = undoChip(s);
    expect(s.pendingBet).toEqual([25, 5]);
    s = clearBet(s);
    expect(s.pendingBet).toEqual([]);
  });

  it('rejects bets above the balance or the table maximum', () => {
    const s = createGame({ rng: seededRng(1), balance: 120 });
    expect(() => addChip(s, 500)).toThrow(GameError);
    const capped = createGame({ rng: seededRng(1), rules: { maxBet: 100 } });
    expect(() => addChip(addChip(capped, 100), 5)).toThrow(GameError);
  });

  it('requires the table minimum to deal', () => {
    const s = createGame({ rng: seededRng(1), rules: { minBet: 25 } });
    expect(canDeal(s)).toBe(false);
    expect(canDeal(addChip(s, 5))).toBe(false);
    expect(canDeal(addChip(s, 25))).toBe(true);
    expect(() => startRound(addChip(s, 5))).toThrow(GameError);
  });

  it('deducts the bet when the round starts and remembers it for rebet', () => {
    const s = dealRound(['10', '9', '8', '7'], [100, 25]);
    expect(s.balance).toBe(875);
    expect(s.hands[0].bet).toBe(125);
    expect(s.lastBet).toBe(125);
    const next = newRound(finish(stand(s)));
    const rebetState = rebet(next);
    expect(rebetState.pendingBet.reduce((a, b) => a + b, 0)).toBe(125);
  });

  it('doubles the pending bet within limits', () => {
    const s = addChip(createGame({ rng: seededRng(1) }), 100);
    expect(doubleBet(s).pendingBet).toEqual([100, 100]);
    expect(() => doubleBet(addChip(createGame({ rng: seededRng(1), balance: 150 }), 100))).toThrow(GameError);
  });

  it('allows a refill only when the player cannot cover the minimum bet', () => {
    const rich = createGame({ rng: seededRng(1) });
    expect(isBroke(rich)).toBe(false);
    expect(() => refill(rich)).toThrow(GameError);
    const broke = createGame({ rng: seededRng(1), balance: 2.5 });
    expect(isBroke(broke)).toBe(true);
    expect(refill(broke).balance).toBe(1000);
  });

  it('breaks amounts into chips', () => {
    expect(chipsForAmount(1630)).toEqual([1000, 500, 100, 25, 5]);
    expect(chipsForAmount(7.5)).toEqual([5]);
    expect(CHIP_VALUES[0]).toBe(5);
  });
});

describe('dealing and naturals', () => {
  it('deals player, dealer, player, dealer with the hole card hidden', () => {
    const s = dealRound(['10', '9', '8', '7']);
    expect(s.hands[0].cards.map((c) => c.rank)).toEqual(['10', '8']);
    expect(s.dealer.cards.map((c) => c.rank)).toEqual(['9', '7']);
    expect(s.dealer.holeRevealed).toBe(false);
    expect(s.phase).toBe('playerTurn');
  });

  it('pays a natural blackjack 3:2 and the dealer does not draw', () => {
    const s = dealRound(['A', '9', 'K', '7']);
    expect(s.phase).toBe('settled');
    expect(s.hands[0].outcome).toBe('blackjack');
    expect(s.hands[0].payout).toBe(250);
    expect(s.balance).toBe(1150);
    expect(s.dealer.cards).toHaveLength(2);
    expect(s.dealer.holeRevealed).toBe(true);
    expect(s.result?.net).toBe(150);
  });

  it('pays 3:2 on odd bets with half chips', () => {
    const s = dealRound(['A', '9', 'K', '7'], [5]);
    expect(s.hands[0].payout).toBe(12.5);
    expect(s.balance).toBe(1007.5);
  });

  it('pushes when both player and dealer have blackjack', () => {
    const s = dealRound(['A', 'A', 'K', 'K']);
    expect(s.hands[0].outcome).toBe('push');
    expect(s.balance).toBe(1000);
  });

  it('dealer peeks and ends the round immediately on a dealer blackjack', () => {
    let s = createGame({ shoe: createStackedShoe(['10', 'A', '9', 'K']), rng: seededRng(1) });
    s = startRound(addChip(s, 100));
    for (let i = 0; i < 4; i++) s = advance(s);
    s = advance(s); // naturals / peek
    expect(s.lastEvent).toEqual({ type: 'peek', dealerBlackjack: true });
    expect(s.phase).toBe('dealerTurn');
    s = finish(s);
    expect(s.hands[0].outcome).toBe('lose');
    expect(s.balance).toBe(900);
  });

  it('dealer peeks with a ten up and play continues without blackjack', () => {
    const s = dealRound(['10', 'K', '9', '7']);
    expect(s.lastEvent).toEqual({ type: 'peek', dealerBlackjack: false });
    expect(s.phase).toBe('playerTurn');
  });

  it('without peek (European style) a dealer blackjack also beats doubled bets', () => {
    let s = dealRound(['6', 'A', '5', 'K', '9'], [100], { rules: { dealerPeek: false } });
    expect(s.phase).toBe('playerTurn');
    s = finish(double(s));
    expect(s.hands[0].outcome).toBe('lose');
    expect(s.balance).toBe(800);
  });
});

describe('player actions and outcomes', () => {
  it('busts when going over 21 and the dealer does not need to draw', () => {
    let s = dealRound(['10', '10', '6', '6', 'K']);
    s = hit(s);
    expect(s.hands[0].status).toBe('bust');
    s = finish(s);
    expect(s.hands[0].outcome).toBe('bust');
    expect(s.dealer.cards).toHaveLength(2);
    expect(s.balance).toBe(900);
  });

  it('a bust loses even if the dealer also busts', () => {
    // Two hands: first busts, second stands; dealer then busts. Only the second wins.
    let s = dealRound(['8', '10', '8', '6', 'K', '4', 'K', 'K'], [100], {});
    s = runAuto(split(s)); // hand 1: 8+K = 18
    s = hit(runAuto(stand(s))); // hand 2: 8+4 = 12 -> hit K = 22 bust
    s = finish(s);
    expect(s.hands.map((h) => h.outcome)).toEqual(['win', 'bust']);
    expect(s.dealer.cards).toHaveLength(3); // 10+6+K = 26
  });

  it('wins 1:1 when beating the dealer', () => {
    const s = finish(stand(dealRound(['10', '10', '9', '8'])));
    expect(s.hands[0].outcome).toBe('win');
    expect(s.balance).toBe(1100);
  });

  it('pushes on equal totals and returns the bet', () => {
    const s = finish(stand(dealRound(['10', '10', '8', '8'])));
    expect(s.hands[0].outcome).toBe('push');
    expect(s.balance).toBe(1000);
  });

  it('loses when the dealer has more', () => {
    const s = finish(stand(dealRound(['10', '10', '7', '9'])));
    expect(s.hands[0].outcome).toBe('lose');
    expect(s.balance).toBe(900);
  });

  it('wins when the dealer busts', () => {
    const s = finish(stand(dealRound(['10', '10', '2', '6', 'K'])));
    expect(s.result?.dealerBust).toBe(true);
    expect(s.hands[0].outcome).toBe('win');
    expect(s.balance).toBe(1100);
  });

  it('automatically stands on 21', () => {
    const s = hit(dealRound(['5', '10', '6', '7', 'K']));
    expect(s.hands[0].status).toBe('stood');
    expect(s.phase).toBe('dealerTurn');
  });

  it('a multi-card 21 is not a blackjack and pays 1:1', () => {
    const s = finish(hit(dealRound(['5', '10', '6', '7', 'K'])));
    expect(s.hands[0].outcome).toBe('win');
    expect(s.hands[0].payout).toBe(200);
  });

  it('rejects actions outside the player turn', () => {
    const betting = createGame({ rng: seededRng(1) });
    expect(() => hit(betting)).toThrow(GameError);
    expect(() => stand(betting)).toThrow(GameError);
    const settled = finish(stand(dealRound(['10', '10', '9', '8'])));
    expect(() => hit(settled)).toThrow(GameError);
    expect(() => double(settled)).toThrow(GameError);
  });
});

describe('dealer behaviour', () => {
  it('draws until reaching at least 17', () => {
    const s = finish(stand(dealRound(['10', '5', '7', '6', '3', '4'])));
    expect(s.dealer.cards.map((c) => c.rank)).toEqual(['5', '6', '3', '4']);
    expect(s.result?.dealerTotal).toBe(18);
    expect(s.hands[0].outcome).toBe('lose');
  });

  it('stands on soft 17 (S17)', () => {
    const s = finish(stand(dealRound(['10', 'A', '8', '6', '4'])));
    expect(s.dealer.cards).toHaveLength(2);
    expect(s.result?.dealerTotal).toBe(17);
    expect(s.hands[0].outcome).toBe('win');
  });

  it('hits soft 17 when the H17 rule is enabled', () => {
    const s = finish(stand(dealRound(['10', 'A', '8', '6', '4'], [100], { rules: { dealerHitsSoft17: true } })));
    expect(s.dealer.cards).toHaveLength(3);
    expect(s.result?.dealerTotal).toBe(21);
    expect(s.hands[0].outcome).toBe('lose');
  });

  it('stands on a hard 17 containing an ace under both S17 and H17', () => {
    for (const dealerHitsSoft17 of [false, true]) {
      const s = finish(stand(dealRound(['10', '6', '9', '10', 'A', '5'], [100], { rules: { dealerHitsSoft17 } })));
      expect(s.dealer.cards.map((c) => c.rank)).toEqual(['6', '10', 'A']);
      expect(s.result?.dealerTotal).toBe(17);
      expect(s.hands[0].outcome).toBe('win');
    }
  });
});

describe('double down', () => {
  it('doubles the bet, takes exactly one card and stands', () => {
    let s = dealRound(['5', '10', '6', '7', '10']);
    expect(canDouble(s)).toBe(true);
    s = double(s);
    expect(s.hands[0].cards).toHaveLength(3);
    expect(s.hands[0].bet).toBe(200);
    expect(s.hands[0].doubled).toBe(true);
    expect(s.balance).toBe(800);
    s = finish(s);
    expect(s.hands[0].outcome).toBe('win');
    expect(s.balance).toBe(1200);
  });

  it('loses double the bet on a bust', () => {
    const s = finish(double(dealRound(['10', '10', '6', '7', 'K'])));
    expect(s.hands[0].outcome).toBe('bust');
    expect(s.balance).toBe(800);
  });

  it('is only allowed on the first two cards and with enough balance', () => {
    const s = hit(dealRound(['2', '10', '3', '7', '2']));
    expect(s.hands[0].cards).toHaveLength(3);
    expect(canDouble(s)).toBe(false);
    expect(() => double(s)).toThrow(GameError);
    const poor = dealRound(['5', '10', '6', '7'], [100, 25], { balance: 150 });
    expect(poor.balance).toBe(25);
    expect(canDouble(poor)).toBe(false);
  });
});

describe('split', () => {
  it('splits a pair into two hands with equal bets, allowing double after split', () => {
    let s = dealRound(['8', '10', '8', '7', '3', '10', 'K']);
    expect(canSplit(s)).toBe(true);
    s = split(s);
    expect(s.hands).toHaveLength(2);
    expect(s.balance).toBe(800);
    s = runAuto(s); // hand 1 receives its second card
    expect(s.hands[0].cards.map((c) => c.rank)).toEqual(['8', '3']);
    expect(canDouble(s)).toBe(true);
    s = runAuto(double(s)); // 8+3+10 = 21, then hand 2 receives K
    expect(s.activeHand).toBe(1);
    expect(s.hands[1].cards.map((c) => c.rank)).toEqual(['8', 'K']);
    s = finish(stand(s));
    expect(s.hands.map((h) => h.outcome)).toEqual(['win', 'win']);
    expect(s.result?.totalBet).toBe(300);
    expect(s.result?.totalPayout).toBe(600);
    expect(s.balance).toBe(1300);
  });

  it('split aces receive one card each, 21 is not blackjack', () => {
    let s = dealRound(['A', '9', 'A', '8', 'K', '5']);
    s = finish(split(s));
    expect(s.hands[0].cards.map((c) => c.rank)).toEqual(['A', 'K']);
    expect(s.hands[1].cards.map((c) => c.rank)).toEqual(['A', '5']);
    expect(s.hands.every((h) => h.status === 'stood')).toBe(true);
    expect(s.hands.map((h) => h.outcome)).toEqual(['win', 'lose']);
    expect(s.hands[0].payout).toBe(200);
    expect(s.balance).toBe(1000);
  });

  it('does not allow re-splitting aces, hitting or doubling them', () => {
    let s = dealRound(['A', '9', 'A', '8', 'A', '5']);
    s = runAuto(split(s));
    expect(s.hands[0].cards.map((c) => c.rank)).toEqual(['A', 'A']);
    expect(s.hands[0].status).toBe('stood');
    expect(s.hands[1].cards.map((c) => c.rank)).toEqual(['A', '5']);
    expect(s.phase).toBe('settled');
  });

  it('re-splits up to the maximum number of hands', () => {
    let s = dealRound(['8', '10', '8', '7', '8', '8', '8', '2', '2', '2', '2']);
    s = runAuto(split(s)); // [8,8] [8]
    expect(canSplit(s)).toBe(true);
    s = runAuto(split(s)); // [8,8] [8] [8]
    expect(canSplit(s)).toBe(true);
    s = runAuto(split(s)); // [8,8] [8] [8] [8] -> 4 hands
    expect(s.hands).toHaveLength(4);
    expect(s.hands[0].cards.map((c) => c.rank)).toEqual(['8', '8']);
    expect(canSplit(s)).toBe(false);
    expect(s.balance).toBe(600);
  });

  it('only splits identical ranks unless splitByValue is enabled', () => {
    expect(canSplit(dealRound(['K', '9', 'Q', '7']))).toBe(false);
    expect(canSplit(dealRound(['K', '9', 'Q', '7'], [100], { rules: { splitByValue: true } }))).toBe(true);
  });

  it('respects the double-after-split rule and the balance', () => {
    const s = runAuto(split(dealRound(['8', '10', '8', '7', '3'], [100], { rules: { doubleAfterSplit: false } })));
    expect(canDouble(s)).toBe(false);
    const poor = dealRound(['8', '10', '8', '7'], [100], { balance: 150 });
    expect(canSplit(poor)).toBe(false);
    expect(availableActions(poor)).toEqual({ hit: true, stand: true, double: false, split: false });
  });
});

describe('balance consistency (randomized simulation)', () => {
  it('never goes negative and always matches the sum of round results', () => {
    const rng = seededRng(2024);
    let s = createGame({ rng, rules: { maxBet: 500 } });
    let expected = s.balance;
    let rounds = 0;
    while (rounds < 3000) {
      if (s.balance < s.rules.minBet) {
        s = refill(s);
        expected = s.balance;
      }
      const chip = ([5, 25, 100] as const)[Math.floor(rng() * 3)];
      if (chip > s.balance) continue;
      s = runAuto(startRound(addChip(s, chip), rng), rng);
      while (s.phase === 'playerTurn') {
        const a = availableActions(s);
        const r = rng();
        if (a.split && r < 0.3) s = split(s);
        else if (a.double && r < 0.45) s = double(s, rng);
        else if (a.hit && r < 0.7) s = hit(s, rng);
        else s = stand(s);
        expect(s.balance).toBeGreaterThanOrEqual(0);
        s = runAuto(s, rng);
      }
      expect(s.phase).toBe('settled');
      const r = s.result!;
      expected += r.net;
      expect(s.balance).toBeCloseTo(expected, 9);
      for (const h of s.hands) {
        const total = evaluateHand(h.cards).total;
        if (total > 21) expect(h.outcome).toBe('bust');
        if (h.outcome === 'blackjack') expect(h.payout).toBe(h.bet * 2.5);
      }
      expect(r.dealerTotal >= 17 || s.hands.every((h) => h.status === 'bust' || h.status === 'blackjack') || r.dealerBlackjack).toBe(true);
      s = newRound(s);
      rounds++;
    }
  });
});

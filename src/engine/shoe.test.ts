import { describe, expect, it } from 'vitest';
import { addChip, createGame, startRound } from './game';
import { createShoe, needsReshuffle, shuffle } from './shoe';
import { seededRng } from './testUtils';

describe('shoe', () => {
  it('builds six complete decks with unique ids', () => {
    const shoe = createShoe(6, 0.75, seededRng(42));
    expect(shoe.cards).toHaveLength(312);
    expect(new Set(shoe.cards.map((c) => c.id)).size).toBe(312);
    const counts = new Map<string, number>();
    for (const c of shoe.cards) counts.set(c.rank + c.suit, (counts.get(c.rank + c.suit) ?? 0) + 1);
    expect(counts.size).toBe(52);
    for (const n of counts.values()) expect(n).toBe(6);
  });

  it('places the cut card according to penetration', () => {
    const shoe = createShoe(6, 0.75, seededRng(1));
    expect(shoe.cutCardRemaining).toBe(78);
    expect(needsReshuffle(shoe)).toBe(false);
    expect(needsReshuffle({ ...shoe, cards: shoe.cards.slice(0, 78) })).toBe(true);
  });

  it('shuffle is a permutation and deterministic for a given rng', () => {
    const items = Array.from({ length: 52 }, (_, i) => i);
    const a = shuffle(items, seededRng(7));
    const b = shuffle(items, seededRng(7));
    expect(a).toEqual(b);
    expect([...a].sort((x, y) => x - y)).toEqual(items);
    expect(a).not.toEqual(items);
  });

  it('shuffle is unbiased (every element lands in every position about equally)', () => {
    const rng = seededRng(123);
    const n = 4;
    const trials = 40000;
    const hits = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let t = 0; t < trials; t++) {
      shuffle([0, 1, 2, 3], rng).forEach((v, pos) => hits[v][pos]++);
    }
    const expected = trials / n;
    for (const row of hits) for (const h of row) expect(Math.abs(h - expected) / expected).toBeLessThan(0.05);
  });

  it('reshuffles at the start of a round once the cut card is reached', () => {
    const rng = seededRng(5);
    let s = createGame({ rng });
    s = { ...s, shoe: { ...s.shoe, cards: s.shoe.cards.slice(0, 60) } };
    s = startRound(addChip(s, 25), rng);
    expect(s.lastEvent).toEqual({ type: 'roundStart', reshuffled: true });
    expect(s.shoe.cards).toHaveLength(312);
    expect(s.shoe.generation).toBe(2);
  });
});

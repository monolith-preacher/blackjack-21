import { describe, expect, it } from 'vitest';
import { computeCardWidth } from './useTableSizing';

describe('computeCardWidth', () => {
  it('fits the vertical budget on a regular desktop felt', () => {
    const { cardWidth, compact } = computeCardWidth(1360, 690);
    expect(compact).toBe(false);
    expect(cardWidth * 4 + 186).toBeLessThanOrEqual(690);
  });

  it('is limited by width on narrow (portrait) tables', () => {
    expect(computeCardWidth(360, 640).cardWidth).toBe(Math.round((360 - 70) / 5.8));
  });

  it('switches to compact mode on short tables and never goes below the minimum', () => {
    expect(computeCardWidth(800, 300).compact).toBe(true);
    expect(computeCardWidth(200, 100).cardWidth).toBe(36);
    expect(computeCardWidth(4000, 3000).cardWidth).toBe(124);
  });
});

import { useLayoutEffect, useState, type RefObject } from 'react';

export interface TableSize {
  /** Card width in px that fits both the dealer row and the player row on the felt. */
  cardWidth: number;
  /** Short tables hide decorative elements (felt print, zone label). */
  compact: boolean;
}

const MIN_CARD = 36;
const MAX_CARD = 124;

/**
 * Vertical budget, in card widths plus fixed px, of everything stacked on the felt:
 * dealer row (label, card, badge), felt print, message band and player row (card, bets, padding).
 */
export function computeCardWidth(width: number, height: number): TableSize {
  const byWidth = (width - 70) / 5.8;
  const regular = (height - 186) / 4.0;
  if (regular >= 60) {
    return { cardWidth: Math.round(Math.max(MIN_CARD, Math.min(MAX_CARD, regular, byWidth))), compact: false };
  }
  const compact = (height - 118) / 3.45;
  return { cardWidth: Math.round(Math.max(MIN_CARD, Math.min(MAX_CARD, compact, byWidth))), compact: true };
}

export function useTableSizing(ref: RefObject<HTMLElement | null>): TableSize | null {
  const [size, setSize] = useState<TableSize | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const next = computeCardWidth(el.clientWidth, el.clientHeight);
      setSize((prev) => (prev && prev.cardWidth === next.cardWidth && prev.compact === next.compact ? prev : next));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

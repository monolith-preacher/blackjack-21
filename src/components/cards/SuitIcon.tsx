import type { Suit } from '../../engine';

/** Vector suit symbols (avoids emoji rendering of ♥/♦ on some platforms). */
const PATHS: Record<Suit, string> = {
  hearts:
    'M50 90 C46 84 30 72 18 58 C6 44 4 30 10 20 C17 8 32 5 42 13 C46 16 48 20 50 24 C52 20 54 16 58 13 C68 5 83 8 90 20 C96 30 94 44 82 58 C70 72 54 84 50 90 Z',
  diamonds: 'M50 4 C60 22 72 37 88 50 C72 63 60 78 50 96 C40 78 28 63 12 50 C28 37 40 22 50 4 Z',
  spades:
    'M50 6 C56 18 70 30 82 42 C94 54 94 70 82 78 C72 84 61 81 55 74 C56 84 60 90 68 95 L32 95 C40 90 44 84 45 74 C39 81 28 84 18 78 C6 70 6 54 18 42 C30 30 44 18 50 6 Z',
  clubs:
    'M50 8 C62 8 70 17 70 28 C70 34 68 38 64 42 C68 40 72 39 76 39 C87 39 95 48 95 59 C95 70 87 78 76 78 C67 78 60 73 56 66 C56 80 60 88 68 95 L32 95 C40 88 44 80 44 66 C40 73 33 78 24 78 C13 78 5 70 5 59 C5 48 13 39 24 39 C28 39 32 40 36 42 C32 38 30 34 30 28 C30 17 38 8 50 8 Z',
};

export const SUIT_NAMES: Record<Suit, string> = {
  hearts: 'copas',
  diamonds: 'ouros',
  spades: 'espadas',
  clubs: 'paus',
};

export function isRed(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

interface Props {
  suit: Suit;
  className?: string;
  style?: React.CSSProperties;
}

export function SuitIcon({ suit, className, style }: Props) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden="true" focusable="false">
      <path d={PATHS[suit]} fill="currentColor" />
    </svg>
  );
}

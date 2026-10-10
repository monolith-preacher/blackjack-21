import { memo } from 'react';
import type { Card, Rank } from '../../engine';
import { isRed, SuitIcon } from './SuitIcon';

/** Pip positions (x: 0 left – 1 right, y: 0 top – 1 bottom) for number cards. */
const PIPS: Partial<Record<Rank, Array<[number, number]>>> = {
  '2': [[0.5, 0], [0.5, 1]],
  '3': [[0.5, 0], [0.5, 0.5], [0.5, 1]],
  '4': [[0, 0], [1, 0], [0, 1], [1, 1]],
  '5': [[0, 0], [1, 0], [0.5, 0.5], [0, 1], [1, 1]],
  '6': [[0, 0], [1, 0], [0, 0.5], [1, 0.5], [0, 1], [1, 1]],
  '7': [[0, 0], [1, 0], [0.5, 0.25], [0, 0.5], [1, 0.5], [0, 1], [1, 1]],
  '8': [[0, 0], [1, 0], [0.5, 0.25], [0, 0.5], [1, 0.5], [0.5, 0.75], [0, 1], [1, 1]],
  '9': [[0, 0], [1, 0], [0, 1 / 3], [1, 1 / 3], [0.5, 0.5], [0, 2 / 3], [1, 2 / 3], [0, 1], [1, 1]],
  '10': [[0, 0], [1, 0], [0.5, 1 / 6], [0, 1 / 3], [1, 1 / 3], [0, 2 / 3], [1, 2 / 3], [0.5, 5 / 6], [0, 1], [1, 1]],
};

const COURT_TITLE: Partial<Record<Rank, string>> = { J: 'Valete', Q: 'Dama', K: 'Rei' };

function Crown({ rank }: { rank: 'J' | 'Q' | 'K' }) {
  if (rank === 'K') {
    return (
      <svg viewBox="0 0 60 34" className="court-crown" aria-hidden="true">
        <path d="M4 30 L8 8 L20 20 L30 3 L40 20 L52 8 L56 30 Z" fill="var(--court-gold)" stroke="var(--court-ink)" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="8" cy="7" r="3" fill="var(--court-accent)" />
        <circle cx="30" cy="3" r="3" fill="var(--court-accent)" />
        <circle cx="52" cy="7" r="3" fill="var(--court-accent)" />
        <rect x="4" y="27" width="52" height="5" rx="1" fill="var(--court-accent)" />
      </svg>
    );
  }
  if (rank === 'Q') {
    return (
      <svg viewBox="0 0 60 34" className="court-crown" aria-hidden="true">
        <path d="M6 30 C8 20 10 14 14 10 C18 16 22 18 26 12 L30 4 L34 12 C38 18 42 16 46 10 C50 14 52 20 54 30 Z" fill="var(--court-gold)" stroke="var(--court-ink)" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="30" cy="4" r="3.4" fill="var(--court-accent)" />
        <circle cx="14" cy="9" r="2.6" fill="var(--court-accent)" />
        <circle cx="46" cy="9" r="2.6" fill="var(--court-accent)" />
        <path d="M6 27 Q30 33 54 27 L54 31 Q30 37 6 31 Z" fill="var(--court-accent)" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 60 34" className="court-crown" aria-hidden="true">
      <path d="M10 30 L14 14 Q30 4 46 14 L50 30 Z" fill="var(--court-accent)" stroke="var(--court-ink)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M40 12 C46 2 54 2 56 4 C50 6 46 10 44 16 Z" fill="var(--court-gold)" stroke="var(--court-ink)" strokeWidth="1.5" />
      <rect x="10" y="26" width="40" height="5" rx="1" fill="var(--court-gold)" />
    </svg>
  );
}

function CourtHalf({ card }: { card: Card }) {
  const rank = card.rank as 'J' | 'Q' | 'K';
  return (
    <div className="court-half">
      <Crown rank={rank} />
      <span className="court-letter">{rank}</span>
      <SuitIcon suit={card.suit} className="court-suit" />
    </div>
  );
}

function Center({ card }: { card: Card }) {
  if (card.rank === 'A') {
    return (
      <div className="card-center card-center--ace">
        <SuitIcon suit={card.suit} className="ace-pip" />
      </div>
    );
  }
  if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') {
    return (
      <div className="card-center card-center--court">
        <div className="court-frame">
          <CourtHalf card={card} />
          <div className="court-divider" />
          <CourtHalf card={card} />
        </div>
      </div>
    );
  }
  const pips = PIPS[card.rank] ?? [];
  return (
    <div className="card-center card-center--pips">
      {pips.map(([x, y], i) => (
        <SuitIcon
          key={i}
          suit={card.suit}
          className={`pip${y > 0.5 ? ' pip--flipped' : ''}`}
          style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
        />
      ))}
    </div>
  );
}

function Corner({ card, flipped }: { card: Card; flipped?: boolean }) {
  return (
    <div className={`card-corner${flipped ? ' card-corner--br' : ''}`}>
      <span className="card-rank">{card.rank}</span>
      <SuitIcon suit={card.suit} className="card-corner-suit" />
    </div>
  );
}

export const CardFace = memo(function CardFace({ card }: { card: Card }) {
  return (
    <div className={`card-face card-front ${isRed(card.suit) ? 'is-red' : 'is-black'}`} title={COURT_TITLE[card.rank]}>
      <Corner card={card} />
      <Center card={card} />
      <Corner card={card} flipped />
    </div>
  );
});

export const CardBack = memo(function CardBack() {
  return (
    <div className="card-face card-back">
      <div className="card-back-pattern">
        <div className="card-back-medallion">
          <span>21</span>
        </div>
      </div>
    </div>
  );
});

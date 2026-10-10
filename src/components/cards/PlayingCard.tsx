import { useLayoutEffect, useRef } from 'react';
import { anchorRect, flyFrom, isBooting, previousRect, rememberRect } from '../../animation/fly';
import { useSpeed } from '../../animation/SpeedContext';
import type { Card } from '../../engine';
import { SUIT_NAMES } from './SuitIcon';
import { CardBack, CardFace } from './CardFace';

interface Props {
  card: Card;
  faceDown?: boolean;
  /** Position within the hand, drives the CSS layout. */
  index: number;
  count: number;
  /** Small deterministic tilt so hands look hand-dealt rather than perfectly aligned. */
  tilt?: number;
}

const DEAL_MS = 480;
const MOVE_MS = 420;

function cardLabel(card: Card, faceDown?: boolean): string {
  return faceDown ? 'Carta virada' : `${card.rank} de ${SUIT_NAMES[card.suit]}`;
}

export function PlayingCard({ card, faceDown = false, index, count, tilt = 0 }: Props) {
  const slotRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const speed = useSpeed();

  // Fly in on mount: from the card's previous position (after a split) or from the shoe.
  useLayoutEffect(() => {
    const el = slotRef.current;
    if (!el) return;
    const prev = previousRect(card.id);
    let anim: Animation | undefined;
    if (prev) {
      anim = flyFrom(el, prev, { duration: MOVE_MS * speed });
    } else if (!isBooting()) {
      const shoe = anchorRect('shoe');
      if (shoe) {
        anim = flyFrom(el, shoe, { duration: DEAL_MS * speed, rotate: -24, arc: -18 });
        if (!faceDown && innerRef.current) {
          innerRef.current.animate(
            [
              { transform: 'rotateY(180deg)' },
              { transform: 'rotateY(180deg)', offset: 0.4 },
              { transform: 'rotateY(0deg)' },
            ],
            { duration: DEAL_MS * speed, easing: 'ease-out' },
          );
        }
      }
    }
    if (anim) anim.onfinish = () => rememberRect(card.id, el);
    return () => rememberRect(card.id, el);
    // Mount-only: the card id never changes for a given element.
  }, []);

  useLayoutEffect(() => {
    rememberRect(card.id, slotRef.current);
  });

  return (
    <div
      ref={slotRef}
      className="card-slot"
      style={{ '--i': index, '--n': count, zIndex: index + 1 } as React.CSSProperties}
      role="img"
      aria-label={cardLabel(card, faceDown)}
    >
      <div className="card" style={{ '--tilt': `${tilt}deg` } as React.CSSProperties}>
        <div ref={innerRef} className={`card-inner${faceDown ? ' is-face-down' : ''}`}>
          <CardFace card={card} />
          <CardBack />
        </div>
      </div>
    </div>
  );
}

/** Stable pseudo-random tilt in [-2.5, 2.5] degrees derived from the card id. */
export function tiltFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 50) - 25) / 10;
}

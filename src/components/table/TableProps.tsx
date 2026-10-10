import type { Rules, Shoe } from '../../engine';
import { ChipStack } from '../chips/ChipStack';
import type { ChipValue } from '../../engine';

/** Card shoe at the dealer's right. Its mouth is the origin of every dealt card. */
export function ShoeView({ shoe }: { shoe: Shoe }) {
  const dealt = shoe.size - shoe.cards.length;
  const untilCut = Math.max(0, shoe.cards.length - shoe.cutCardRemaining);
  const fill = shoe.cards.length / Math.max(1, shoe.size);
  return (
    <div className="shoe" title={`Shoe: ${shoe.cards.length} cartas restantes · ${untilCut} até o corte`}>
      <div className="shoe-body">
        <div className="shoe-cards" style={{ '--fill': fill } as React.CSSProperties} />
        <div className="shoe-mouth" data-anchor="shoe" />
      </div>
      <div className="shoe-meter" aria-hidden="true">
        <div className="shoe-meter-fill" style={{ width: `${fill * 100}%` }} />
        <div className="shoe-meter-cut" style={{ left: `${(shoe.cutCardRemaining / Math.max(1, shoe.size)) * 100}%` }} />
      </div>
      <span className="shoe-label">{shoe.cards.length} {shoe.cards.length === 1 ? 'carta' : 'cartas'}</span>
      <span className="sr-only">{dealt} cartas já distribuídas</span>
    </div>
  );
}

/** Discard tray at the dealer's left; its pile grows as the shoe is used. */
export function DiscardTray({ shoe }: { shoe: Shoe }) {
  const used = shoe.size - shoe.cards.length;
  const layers = Math.min(14, Math.ceil((used / Math.max(1, shoe.size)) * 18));
  return (
    <div className="discard" title={`Descarte: ${used} cartas`}>
      <div className="discard-tray" data-anchor="discard">
        {Array.from({ length: layers }, (_, i) => (
          <div key={i} className="discard-card" style={{ '--k': i } as React.CSSProperties} />
        ))}
      </div>
      <span className="shoe-label">Descarte</span>
    </div>
  );
}

/** Curved table print: payout and dealer rule, like the text printed on casino felt. */
export function FeltPrint({ rules }: { rules: Rules }) {
  const payout = rules.blackjackPayout === 1.5 ? '3 PARA 2' : `${rules.blackjackPayout} PARA 1`;
  const dealerRule = rules.dealerHitsSoft17 ? 'DEALER COMPRA NO 17 SUAVE' : 'DEALER PARA EM TODOS OS 17';
  return (
    <svg className="felt-print" viewBox="0 0 800 124" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <path id="arc-outer" d="M 70 6 Q 400 116 730 6" />
        <path id="arc-inner" d="M 130 34 Q 400 134 670 34" />
      </defs>
      <path d="M 30 40 Q 400 196 770 40" className="felt-print-line" />
      <text className="felt-print-title">
        <textPath href="#arc-outer" startOffset="50%" textAnchor="middle">
          BLACKJACK PAGA {payout}
        </textPath>
      </text>
      <text className="felt-print-sub">
        <textPath href="#arc-inner" startOffset="50%" textAnchor="middle">
          {dealerRule}
        </textPath>
      </text>
    </svg>
  );
}

interface BetSpotProps {
  chips: ChipValue[];
  minBet: number;
}

export function BetSpot({ chips, minBet }: BetSpotProps) {
  return (
    <div className={`bet-spot${chips.length ? ' has-chips' : ''}`}>
      <div className="bet-spot-ring">
        {chips.length === 0 && (
          <span className="bet-spot-label">
            Aposta
            <small>mín. {minBet}</small>
          </span>
        )}
        <ChipStack chips={chips} fromRack />
      </div>
    </div>
  );
}

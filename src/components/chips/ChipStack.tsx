import { useLayoutEffect, useRef } from 'react';
import { anchorRect, flyFrom, isBooting } from '../../animation/fly';
import { useSpeed } from '../../animation/SpeedContext';
import { chipsForAmount, type ChipValue } from '../../engine';
import { formatAmount } from '../../utils/format';
import { Chip } from './Chip';

const MAX_VISIBLE = 12;

interface StackChipProps {
  value: ChipValue;
  index: number;
  /** Fly from the matching chip in the rack when mounted (user placed it). */
  fromRack: boolean;
}

function StackChip({ value, index, fromRack }: StackChipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const speed = useSpeed();
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || isBooting()) return;
    const src = fromRack ? anchorRect(`rack-${value}`) : undefined;
    if (src) flyFrom(el, src, { duration: 380 * speed, arc: -40, rotate: 90 });
    else el.animate(
      [{ transform: 'translateY(-14px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
      { duration: 260 * speed, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'backwards' },
    );
    // Mount-only animation.
  }, []);
  return (
    <div ref={ref} className="stack-chip" style={{ '--k': index } as React.CSSProperties}>
      <Chip value={value} />
    </div>
  );
}

interface Props {
  /** Explicit chips (betting circle) or an amount broken down into chips. */
  chips?: ChipValue[];
  amount?: number;
  fromRack?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function ChipStack({ chips, amount, fromRack = false, showLabel = true, className }: Props) {
  const list = chips ?? chipsForAmount(amount ?? 0);
  const total = amount ?? list.reduce((a, b) => a + b, 0);
  const visible = list.slice(-MAX_VISIBLE);
  const offset = list.length - visible.length;
  return (
    <div className={`chip-stack ${className ?? ''}`} style={{ '--count': visible.length } as React.CSSProperties}>
      <div className="chip-stack-pile">
        {visible.map((v, i) => (
          <StackChip key={offset + i} value={v} index={i} fromRack={fromRack} />
        ))}
      </div>
      {showLabel && total > 0 && <div className="chip-stack-label">{formatAmount(total)}</div>}
    </div>
  );
}

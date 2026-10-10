import { memo } from 'react';
import type { ChipValue } from '../../engine';

interface ChipStyle {
  base: string;
  dark: string;
  stripe: string;
  text: string;
}

export const CHIP_STYLES: Record<ChipValue, ChipStyle> = {
  5: { base: '#c3202f', dark: '#7d0f1b', stripe: '#f7f2e8', text: '#fff7ea' },
  25: { base: '#17824a', dark: '#0b4a29', stripe: '#f7f2e8', text: '#f4fff7' },
  100: { base: '#24242b', dark: '#0b0b0e', stripe: '#e9c46a', text: '#f6e3a6' },
  500: { base: '#6a32a0', dark: '#3a1660', stripe: '#f1d27a', text: '#fbf0ff' },
  1000: { base: '#d39b22', dark: '#8a5f0b', stripe: '#2a1b06', text: '#2a1b06' },
};

const EDGE_CIRC = 2 * Math.PI * 41;

function label(value: ChipValue): string {
  return value >= 1000 ? `${value / 1000}K` : String(value);
}

interface Props {
  value: ChipValue;
  className?: string;
}

/** Casino chip drawn in SVG: edge inserts, dashed inlay ring and value label. */
export const Chip = memo(function Chip({ value, className }: Props) {
  const c = CHIP_STYLES[value];
  const gid = `chip-${value}`;
  return (
    <svg viewBox="0 0 100 100" className={`chip ${className ?? ''}`} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${gid}-shine`} cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.38" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.25" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={c.dark} />
      <circle cx="50" cy="50" r="46" fill={c.base} />
      <circle
        cx="50"
        cy="50"
        r="41"
        fill="none"
        stroke={c.stripe}
        strokeWidth="9"
        strokeDasharray={`${EDGE_CIRC / 16} ${EDGE_CIRC / 16}`}
        transform="rotate(-11.25 50 50)"
      />
      <circle cx="50" cy="50" r="32" fill={c.dark} opacity="0.35" />
      <circle cx="50" cy="50" r="30" fill={c.base} stroke={c.stripe} strokeWidth="1.6" strokeDasharray="3.2 2.6" />
      <circle cx="50" cy="50" r="24" fill={c.base} stroke={c.dark} strokeOpacity="0.5" strokeWidth="1" />
      <text
        x="50"
        y="51"
        textAnchor="middle"
        dominantBaseline="central"
        fill={c.text}
        fontFamily="Cinzel, Georgia, serif"
        fontWeight="800"
        fontSize={value >= 1000 ? 20 : value >= 100 ? 21 : 24}
      >
        {label(value)}
      </text>
      <circle cx="50" cy="50" r="48" fill={`url(#${gid}-shine)`} />
    </svg>
  );
});

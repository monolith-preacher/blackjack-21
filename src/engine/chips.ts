/** Chip denominations available to the player, lowest first. */
export const CHIP_VALUES = [5, 25, 100, 500, 1000] as const;
export type ChipValue = (typeof CHIP_VALUES)[number];

/**
 * Greedy breakdown of an amount into chips (largest first). Any remainder smaller than the
 * lowest chip (e.g. the 2.5 from a 3:2 payout on 5) is ignored for display purposes.
 */
export function chipsForAmount(amount: number): ChipValue[] {
  const out: ChipValue[] = [];
  let rest = amount;
  for (let i = CHIP_VALUES.length - 1; i >= 0; i--) {
    const v = CHIP_VALUES[i];
    while (rest >= v) {
      out.push(v);
      rest -= v;
    }
  }
  return out;
}

const amountFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

/** 1234.5 → "1.234,5" */
export function formatAmount(value: number): string {
  return amountFmt.format(value);
}

/** Signed amount: "+150", "−100", "0". */
export function formatSigned(value: number): string {
  if (value > 0) return `+${formatAmount(value)}`;
  if (value < 0) return `−${formatAmount(-value)}`;
  return '0';
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

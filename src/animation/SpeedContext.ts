import { createContext, useContext } from 'react';

/** Multiplier for animation durations (1 = normal, < 1 faster). */
export const SpeedContext = createContext(1);

export function useSpeed(): number {
  return useContext(SpeedContext);
}

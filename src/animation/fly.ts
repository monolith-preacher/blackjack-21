/*
 * Small helpers for "fly-in" animations using the Web Animations API. Elements are laid out at
 * their final position by CSS; on mount we animate a transform from a source rectangle (the
 * shoe, the chip rack, or the element's own previous position) back to `none`. Because only
 * `transform` is animated, layout and game logic never wait on animations.
 */

const lastRects = new Map<string, DOMRect>();
const bootTime = typeof performance !== 'undefined' ? performance.now() : 0;

/** Elements mounted right after page load (restored state) should appear without flying in. */
export function isBooting(): boolean {
  return performance.now() - bootTime < 400;
}

export function rememberRect(id: string, el: Element | null): void {
  if (!el || !el.isConnected) return;
  if (el.getAnimations().length > 0) return;
  lastRects.set(id, el.getBoundingClientRect());
}

export function previousRect(id: string): DOMRect | undefined {
  return lastRects.get(id);
}

export function clearRects(): void {
  lastRects.clear();
}

export function anchorRect(name: string): DOMRect | undefined {
  return document.querySelector(`[data-anchor="${name}"]`)?.getBoundingClientRect();
}

export function prefersReducedMotion(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface FlyOptions {
  duration: number;
  easing?: string;
  /** Rotation (deg) at the start of the flight. */
  rotate?: number;
  /** Starting opacity. */
  opacity?: number;
  /** Peak height of an arc in px (negative = upward). */
  arc?: number;
}

export function flyFrom(el: HTMLElement, from: DOMRect, opts: FlyOptions): Animation | undefined {
  const to = el.getBoundingClientRect();
  if (to.width === 0 || from.width === 0) return undefined;
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return undefined;
  const scale = Math.min(2, Math.max(0.3, from.width / to.width));
  const rotate = opts.rotate ?? 0;
  const frames: Keyframe[] = [
    { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(${rotate}deg)`, opacity: opts.opacity ?? 1 },
  ];
  if (opts.arc) {
    frames.push({
      offset: 0.5,
      transform: `translate(${dx / 2}px, ${dy / 2 + opts.arc}px) scale(${(scale + 1) / 2}) rotate(${rotate / 2}deg)`,
    });
  }
  frames.push({ transform: 'none', opacity: 1 });
  return el.animate(frames, {
    duration: prefersReducedMotion() ? Math.min(opts.duration, 120) : opts.duration,
    easing: opts.easing ?? 'cubic-bezier(.2,.75,.25,1)',
    fill: 'backwards',
  });
}

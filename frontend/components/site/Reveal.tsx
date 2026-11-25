// components/site/Reveal.tsx — Scroll-triggered reveal for public sections.
//
// Progressive enhancement: content is visible in the server HTML. After
// hydration, only elements that are still BELOW the viewport are hidden and
// then faded in when scrolled to, so above-the-fold content never flashes and
// the page works without JavaScript. Reduced-motion users see no movement
// (handled in site.css).
//
// Two independent triggers guarantee content can never stay invisible:
//   1. IntersectionObserver (primary)
//   2. one shared, throttled, passive scroll/resize check (backstop for any
//      environment where observer callbacks are delayed)
// Deep links (/ta#pricing) skip hiding entirely.

'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode, type CSSProperties } from 'react';

// ── Shared scroll backstop ────────────────────────────────────────────────────
const pending = new Set<() => boolean>(); // each returns true once revealed
let timer: number | null = null;

function runChecks() {
  timer = null;
  for (const check of [...pending]) if (check()) pending.delete(check);
  if (pending.size === 0) detach();
}
function schedule() {
  if (timer === null) timer = window.setTimeout(runChecks, 90);
}
function attach() {
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
}
function detach() {
  window.removeEventListener('scroll', schedule);
  window.removeEventListener('resize', schedule);
}

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Stagger delay in ms. */
  delay?: number;
}

export default function Reveal({ children, as: Tag = 'div', className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<'idle' | 'hidden' | 'shown'>('idle');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Deep link: the browser jumps straight to a section — never hide anything.
    if (window.location.hash) return;

    // Already on (or above) screen at load → leave it alone.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    let done = false;
    let io: IntersectionObserver | null = null;

    const reveal = () => {
      if (done) return;
      done = true;
      setState('shown');
      io?.disconnect();
      pending.delete(check);
    };
    // True once the element has entered (or been scrolled past) the viewport.
    const check = () => {
      if (done) return true;
      if (el.getBoundingClientRect().top < window.innerHeight * 0.95) {
        reveal();
        return true;
      }
      return false;
    };

    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) reveal();
        },
        { rootMargin: '0px 0px -5% 0px' }
      );
      io.observe(el);
    }

    if (pending.size === 0) attach();
    pending.add(check);

    // Hide only once we know the element is off-screen.
    requestAnimationFrame(() => setState((s) => (s === 'idle' && !done ? 'hidden' : s)));

    return () => {
      done = true;
      io?.disconnect();
      pending.delete(check);
      if (pending.size === 0) detach();
    };
  }, []);

  const style = delay ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties) : undefined;

  return (
    <Tag
      ref={ref}
      className={className}
      style={style}
      data-reveal={state === 'idle' ? undefined : state}
    >
      {children}
    </Tag>
  );
}

'use client';

import { useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Box, Button, Group, Stack, Text } from '@mantine/core';
import type { TourController } from '@/lib/tour/useTourController';
import styles from './TourOverlay.module.css';

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: string;
}

function measureTarget(selector: string): TargetRect | null {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  const radius = window.getComputedStyle(el).borderRadius || '8px';
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height, radius };
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Places the tooltip below the spotlighted rect when there's room, else above; clamps horizontally to the viewport. */
function tooltipPosition(rect: TargetRect | null): CSSProperties {
  if (!rect || typeof window === 'undefined') {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }
  const margin = 12;
  const tooltipWidth = 320;
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const spaceBelow = viewportHeight - (rect.top + rect.height);
  const preferBelow = spaceBelow >= 160 || spaceBelow >= rect.top;

  const left = Math.min(Math.max(margin, rect.left), Math.max(margin, viewportWidth - tooltipWidth - margin));

  return preferBelow
    ? { top: rect.top + rect.height + margin, left }
    : { bottom: viewportHeight - rect.top + margin, left };
}

/**
 * Backdrop + spotlight cutout + positioned tooltip for one active guided
 * tour. Purely presentational -- all step state lives in `controller`
 * (lib/tour/useTourController.ts).
 */
export default function TourOverlay({ controller }: { controller: TourController }) {
  const { isOpen, isTopMost, currentStep, currentIndex, totalSteps, next, back, skip } = controller;
  const [rect, setRect] = useState<TargetRect | null>(null);
  // True while polling for a target that hasn't mounted yet -- kept separate
  // from `rect` so a not-yet-mounted target renders nothing rather than a
  // misleading centered dialog that then jumps to the spotlight once found.
  const [measuring, setMeasuring] = useState(true);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!isOpen || !currentStep) {
      setRect(null);
      setMeasuring(true);
      return;
    }

    setMeasuring(true);
    let cancelled = false;
    let attempts = 0;
    let retryTimer = 0;
    let resizeObserver: ResizeObserver | null = null;
    const measure = () => setRect(measureTarget(currentStep.targetSelector));

    // A role-filtered step's target should always be in the DOM once the
    // sidebar has rendered, but poll briefly anyway before concluding it
    // genuinely won't appear -- cheap safety net, matches the tour engine
    // this was ported from.
    const MAX_ATTEMPTS = 20;
    const RETRY_MS = 150;

    const tryMeasure = () => {
      if (cancelled) return;
      const target = document.querySelector<HTMLElement>(currentStep.targetSelector);
      if (!target) {
        attempts += 1;
        if (attempts >= MAX_ATTEMPTS) {
          console.error(`[GuidedTour] target not found for step "${currentStep.id}": ${currentStep.targetSelector}`);
          next();
          return;
        }
        retryTimer = window.setTimeout(tryMeasure, RETRY_MS);
        return;
      }

      setMeasuring(false);
      target.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      measure();

      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(target);
      window.addEventListener('resize', measure, { passive: true });
      window.addEventListener('scroll', measure, { passive: true, capture: true });
    };

    tryMeasure();

    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentStep?.id]);

  useLayoutEffect(() => {
    if (!isOpen || !currentStep || measuring) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    tooltipRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentStep?.id, measuring]);

  useLayoutEffect(() => {
    if (isOpen || !previouslyFocusedRef.current) return;
    previouslyFocusedRef.current.focus?.();
    previouslyFocusedRef.current = null;
  }, [isOpen]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      skip();
      return;
    }
    if (event.key === 'Tab') {
      const container = tooltipRef.current;
      if (!container) return;
      const focusable = container.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  if (!isOpen || !currentStep || !isTopMost || measuring) return null;

  const isLastStep = currentIndex + 1 >= totalSteps;
  const reducedMotion = prefersReducedMotion();

  return (
    <>
      {/* WHAT: always intercepts pointer events (a real modal backdrop)
          WHY: the tour registers with closeOnOutsideClick: false -- letting
               clicks pass through to the page (e.g. sidebar links) while a
               step is open would let a user navigate away while the tour
               logically stays "open", and z-index uses the shared popover
               token so this renders above fixed chrome (sidebar/header,
               which use --z-fixed/--z-sticky, both lower) */}
      {/* eslint-disable-next-line react/forbid-dom-props */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-popover)', pointerEvents: 'auto' }}>
        {rect ? (
          <div
            className={reducedMotion ? styles.spotlight : `${styles.spotlight} ${styles.spotlightAnimated}`}
            // WHAT: positions the spotlight cutout over the live-measured target
            // WHY: top/left/width/height/radius come from getBoundingClientRect()
            //      at runtime -- inherently can't be a static CSS class
            // eslint-disable-next-line react/forbid-dom-props
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              borderRadius: rect.radius,
            }}
          />
        ) : (
          <div className={styles.backdropFallback} />
        )}
      </div>
      <div
        ref={tooltipRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guided-tour-step-title"
        aria-describedby="guided-tour-step-description"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        // WHAT: positions the tooltip relative to the live-measured spotlight rect
        // WHY: computed by tooltipPosition() at runtime, can't be a static CSS class.
        //      z-index uses the shared tooltip token, one level above the
        //      backdrop's popover token, so it always paints above both the
        //      backdrop and fixed admin chrome.
        // eslint-disable-next-line react/forbid-dom-props
        style={{ position: 'fixed', zIndex: 'var(--z-tooltip)', width: 320, maxWidth: 'calc(100vw - 24px)', ...tooltipPosition(rect) }}
      >
        <Box p="md" style={{ background: 'var(--mantine-color-body)', borderRadius: 12, boxShadow: 'var(--mantine-shadow-lg)' }}>
          <Stack gap="sm">
            <Text id="guided-tour-step-title" fw={700}>
              {currentStep.title}
            </Text>
            <Text id="guided-tour-step-description" size="sm" c="dimmed">
              {currentStep.description}
            </Text>
            <Text size="xs" c="dimmed">
              Step {currentIndex + 1} of {totalSteps}
            </Text>
            <Group justify="space-between">
              <Button variant="subtle" size="xs" onClick={skip}>
                Skip
              </Button>
              <Group gap="xs">
                {currentIndex > 0 ? (
                  <Button variant="default" size="xs" onClick={back}>
                    Back
                  </Button>
                ) : null}
                <Button size="xs" onClick={next}>
                  {isLastStep ? 'Done' : 'Next'}
                </Button>
              </Group>
            </Group>
          </Stack>
        </Box>
      </div>
      <div aria-live="polite" className="sr-only">
        {`Step ${currentIndex + 1} of ${totalSteps}: ${typeof currentStep.title === 'string' ? currentStep.title : ''}`}
      </div>
    </>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOverlayManager } from '@sovereignsquad/gds-core/client';
import type { TourStepConfig } from './types';
import { markTourSeen } from './storage';

export interface TourController {
  isOpen: boolean;
  isTopMost: boolean;
  currentStep: TourStepConfig | null;
  currentIndex: number;
  totalSteps: number;
  start: () => void;
  next: () => void;
  back: () => void;
  skip: () => void;
}

/**
 * Step-sequencing state for one guided tour. Registers with
 * OverlayManagerProvider (mounted in components/AdminLayout.tsx) so it
 * coordinates with the notification panel / other overlays instead of
 * running an independent overlay stack. Tours here are always
 * manually-triggered (from components/tour/TourMenu.tsx) -- there is no
 * autoStart option, unlike the sibling implementation this was ported from.
 */
export function useTourController(tourId: string, steps: TourStepConfig[]): TourController {
  const availableSteps = useMemo(
    () => steps.filter((step) => step.isAvailable?.() ?? true),
    [steps]
  );

  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const overlayManager = useOverlayManager();

  const finish = useCallback(
    (status: 'completed' | 'skipped') => {
      setIsOpen(false);
      overlayManager.closeOverlay(tourId, status === 'completed' ? 'action' : 'programmatic');
      overlayManager.unregisterOverlay(tourId);
      markTourSeen(tourId, status);
    },
    [overlayManager, tourId]
  );

  const start = useCallback(() => {
    if (availableSteps.length === 0) return;
    setCurrentIndex(0);
    setIsOpen(true);
    overlayManager.registerOverlay({
      id: tourId,
      kind: 'popover',
      policy: { closeOnEscape: true, closeOnOutsideClick: false, returnFocus: true },
    });
    overlayManager.openOverlay({ id: tourId, kind: 'popover' });
  }, [availableSteps.length, overlayManager, tourId]);

  // Reads currentIndex from the closure rather than a setCurrentIndex functional
  // updater -- React can invoke an updater during another component's render,
  // and finish() below has side effects (closes/unregisters a *different*
  // component's overlay state), which isn't safe to do from inside one.
  const next = useCallback(() => {
    if (currentIndex + 1 >= availableSteps.length) {
      finish('completed');
      return;
    }
    setCurrentIndex(currentIndex + 1);
  }, [currentIndex, availableSteps.length, finish]);

  const back = useCallback(() => {
    setCurrentIndex((index) => Math.max(0, index - 1));
  }, []);

  const skip = useCallback(() => {
    finish('skipped');
  }, [finish]);

  // Always safe to unregister on unmount even if never opened -- the
  // manager treats an unknown id as a no-op.
  useEffect(() => {
    return () => {
      overlayManager.unregisterOverlay(tourId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId]);

  return {
    isOpen,
    isTopMost: isOpen && overlayManager.isTopMost(tourId),
    currentStep: isOpen ? availableSteps[currentIndex] ?? null : null,
    currentIndex,
    totalSteps: availableSteps.length,
    start,
    next,
    back,
    skip,
  };
}

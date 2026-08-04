'use client';

/* WHAT: Header entry point for the guided tour system -- a bell-style
 *       ActionIcon that opens a dropdown listing the welcome tour and all
 *       six segment tours.
 * WHY: Trigger model is fully manual (no auto-start) -- this is the one
 *      persistent, discoverable way to start or replay any tour. Structured
 *      like NotificationPanel.tsx (outside-click-to-close, Escape-to-close,
 *      focus-on-open) for consistency with the app's existing header-icon
 *      dropdown pattern. */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActionIcon } from '@mantine/core';
import { IconCheck, IconHelpCircle } from '@tabler/icons-react';
import styles from './TourMenu.module.css';
import TourOverlay from './TourOverlay';
import { useTourController, type TourController } from '@/lib/tour/useTourController';
import { hasTourBeenSeen } from '@/lib/tour/storage';
import { getWelcomeTourSteps } from '@/lib/tour/config/welcomeTourSteps';
import { getSegmentTourSteps, getSegmentTourMeta } from '@/lib/tour/config/segmentTourSteps';
import type { UserRole } from '@/lib/users';

interface TourEntry {
  tourId: string;
  title: string;
  description: string;
  controller: TourController;
}

export default function TourMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | undefined>(undefined);
  const [loadingRole, setLoadingRole] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/admin/auth', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (data.user?.role) {
            setUserRole(data.user.role as UserRole);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user role:', error);
      } finally {
        setLoadingRole(false);
      }
    };

    fetchUserRole();
  }, []);

  // WHAT: Close on outside click. WHY: standard dropdown UX, matches NotificationPanel.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // WHAT: Escape-to-close + focus the panel on open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const segmentMeta = useMemo(() => getSegmentTourMeta(), []);

  const welcomeSteps = useMemo(() => getWelcomeTourSteps(userRole), [userRole]);
  const operationsSteps = useMemo(() => getSegmentTourSteps('operations', userRole), [userRole]);
  const entitiesSteps = useMemo(() => getSegmentTourSteps('entities', userRole), [userRole]);
  const reportsSteps = useMemo(() => getSegmentTourSteps('reports', userRole), [userRole]);
  const dataSteps = useMemo(() => getSegmentTourSteps('data', userRole), [userRole]);
  const analyticsSteps = useMemo(() => getSegmentTourSteps('analytics', userRole), [userRole]);
  const systemSteps = useMemo(() => getSegmentTourSteps('system', userRole), [userRole]);

  const welcomeController = useTourController('welcome', welcomeSteps);
  const operationsController = useTourController('operations', operationsSteps);
  const entitiesController = useTourController('entities', entitiesSteps);
  const reportsController = useTourController('reports', reportsSteps);
  const dataController = useTourController('data', dataSteps);
  const analyticsController = useTourController('analytics', analyticsSteps);
  const systemController = useTourController('system', systemSteps);

  const segmentControllers: Record<string, TourController> = {
    operations: operationsController,
    entities: entitiesController,
    reports: reportsController,
    data: dataController,
    analytics: analyticsController,
    system: systemController,
  };

  const entries: TourEntry[] = [
    {
      tourId: 'welcome',
      title: 'Welcome tour',
      description: 'A quick look at the six areas of the admin panel.',
      controller: welcomeController,
    },
    ...segmentMeta.map((section) => ({
      tourId: section.key,
      title: section.title,
      description: section.description,
      controller: segmentControllers[section.key],
    })),
    // Hide any tour that would have zero accessible steps for the current
    // role, rather than showing it disabled.
  ].filter((entry) => entry.controller.totalSteps > 0);

  const startTour = (controller: TourController) => {
    setIsOpen(false);
    controller.start();
  };

  return (
    <>
      <div className={styles.tourMenuWrapper}>
        <ActionIcon
          variant="default"
          size="lg"
          radius="md"
          color="gray"
          onClick={() => setIsOpen((prev) => !prev)}
          title="Guided tours"
          aria-label="Guided tours"
          aria-expanded={isOpen}
        >
          <IconHelpCircle size={18} stroke={1.8} />
        </ActionIcon>

        {isOpen && (
          <div ref={panelRef} className={styles.tourPanel} role="dialog" aria-label="Guided tours" tabIndex={-1}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>Guided tours</h3>
            </div>
            <div className={styles.tourList}>
              {loadingRole ? (
                <div className={styles.emptyState}>
                  <p>Loading…</p>
                </div>
              ) : (
                entries.map((entry) => {
                  const seen = hasTourBeenSeen(entry.tourId);
                  return (
                    <button
                      key={entry.tourId}
                      type="button"
                      className={styles.tourItem}
                      onClick={() => startTour(entry.controller)}
                    >
                      <div className={styles.tourItemHeader}>
                        <span className={styles.tourItemTitle}>{entry.title}</span>
                        {seen && (
                          <span className={styles.tourItemCheck} aria-label="Completed">
                            <IconCheck size={14} stroke={2} />
                          </span>
                        )}
                      </div>
                      <p className={styles.tourItemDescription}>{entry.description}</p>
                      <span className={styles.tourItemAction}>{seen ? 'Replay' : 'Start'}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <TourOverlay controller={welcomeController} />
      <TourOverlay controller={operationsController} />
      <TourOverlay controller={entitiesController} />
      <TourOverlay controller={reportsController} />
      <TourOverlay controller={dataController} />
      <TourOverlay controller={analyticsController} />
      <TourOverlay controller={systemController} />
    </>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import styles from './OrganizationActivitiesList.module.css';

interface Activity {
  _id: string;
  name: string;
  type: string;
  startDate?: string;
  metadata?: {
    viewSlug?: string;
  };
}

interface OrganizationActivitiesListProps {
  activities: Activity[];
  organizationName: string;
}

export default function OrganizationActivitiesList({ activities, organizationName }: OrganizationActivitiesListProps) {
  if (!activities || activities.length === 0) {
    return null;
  }

  return (
    <div className={styles.activitiesSection}>
      <h2 className={styles.title}>
        {organizationName} Events ({activities.length})
      </h2>
      
      <div className={styles.activitiesGrid}>
        {activities.map((activity) => (
          <ActivityCard key={activity._id} activity={activity} />
        ))}
      </div>
    </div>
  );
}

function ActivityCard({ activity }: { activity: Activity }) {
  const formattedDate = activity.startDate ? formatDate(activity.startDate) : 'TBD';
  const viewSlug = activity.metadata?.viewSlug;

  // WHAT: Link to report if viewSlug exists, otherwise just a static card
  // WHY: Consistency with partner event list
  const CardContent = (
    <>
      <div className={styles.activityHeader}>
        <h3 className={styles.activityName}>{activity.name}</h3>
        <p className={styles.activityDate}>{formattedDate}</p>
        <span className={styles.activityType}>Event</span>
      </div>
      
      {viewSlug && (
        <div className={styles.activityAction}>
          <span className={styles.actionText}>View Report</span>
          <span className={styles.actionArrow}>→</span>
        </div>
      )}
    </>
  );

  if (viewSlug) {
    return (
      <Link href={`/report/${viewSlug}`} className={styles.activityCard}>
        {CardContent}
      </Link>
    );
  }

  return (
    <div className={styles.activityCard}>
      {CardContent}
    </div>
  );
}

function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (error) {
    return isoDate;
  }
}

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './OrganizationEntityList.module.css';

interface Entity {
  _id: string;
  name: string;
  type: string;
  status: string;
  metadata?: {
    logoUrl?: string;
    emoji?: string;
  };
}

interface OrganizationEntityListProps {
  entities: Entity[];
  organizationName: string;
  showList?: boolean;
  showTitle?: boolean;
  showDetails?: boolean;
}

export default function OrganizationEntityList({
  entities,
  organizationName,
  showList = true,
  showTitle = true,
  showDetails = true,
}: OrganizationEntityListProps) {
  if (!showList || !entities || entities.length === 0) return null;

  return (
    <div className={styles.entitiesSection}>
      {showTitle && <h2 className={styles.title}>{organizationName} Members ({entities.length})</h2>}
      <div className={styles.entitiesGrid}>
        {entities.map((entity) => (
          <EntityCard key={entity._id} entity={entity} showDetails={showDetails} />
        ))}
      </div>
    </div>
  );
}

function EntityCard({ entity, showDetails }: { entity: Entity; showDetails: boolean }) {
  // WHAT: Link to the appropriate report based on entity type
  // WHY: Allow drilling down from organization into partners
  const reportHref = entity.type === 'partner' 
    ? `/partner-report/${entity._id}` 
    : `/report/${entity._id}`;

  return (
    <Link href={reportHref} className={styles.entityCard}>
      <div className={styles.entityHeader}>
        {entity.metadata?.logoUrl ? (
          <Image 
            src={entity.metadata.logoUrl} 
            alt={entity.name} 
            width={40} 
            height={40} 
            className={styles.entityLogo}
            unoptimized
          />
        ) : (
          <span className={styles.entityIcon}>{entity.metadata?.emoji || '🏢'}</span>
        )}
              <div>
                <h3 className={styles.entityName}>{entity.name}</h3>
          {showDetails && <span className={styles.entityType}>Member</span>}
              </div>
      </div>

      {showDetails && (
        <div className={styles.action}>
          <span>View Report</span>
          <span>→</span>
        </div>
      )}
    </Link>
  );
}

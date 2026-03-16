'use client';

import React, { useEffect, useState } from 'react';
import styles from './EntityTree.module.css';

interface Entity {
  _id: string;
  name: string;
  type: string;
  children?: Entity[];
}

interface EntityTreeProps {
  onEntitySelect: (entityId: string | null) => void;
  selectedEntityId?: string | null;
}

const TreeNode: React.FC<{ 
  entity: Entity; 
  level: number; 
  selectedEntityId?: string | null; 
  onEntitySelect: (id: string | null) => void;
}> = ({ entity, level, selectedEntityId, onEntitySelect }) => {
  const isSelected = selectedEntityId === entity._id;
  return (
    <div className="flex flex-col">
      <div 
        onClick={() => onEntitySelect(entity._id)}
        className={`${styles.entityTreeNode} ${
          isSelected ? styles.selected : styles.unselected
        } ${styles[`level-${Math.min(level, 10)}`]}`}
      >
        {/* WHAT/WHY: Small inline metadata tag for entity type identification */}
        <span className="text-xs uppercase text-gray-400 mr-2">[{entity.type}]</span>
        {entity.name}
      </div>
    </div>
  );
};

/**
 * V3 Dashboard: EntityTree
 * Recursive navigation component to traverse the Organization/Entity hierarchy.
 */
export default function EntityTree({ onEntitySelect, selectedEntityId }: EntityTreeProps) {
  const [rootEntities, setRootEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch top-level entities
    fetch('/api/v3/entities?parentEntityId=null', {
      headers: {
        'x-v3-org-id': 'current-session-org-id' 
      }
    })
      .then(res => res.json())
      .then(data => {
        setRootEntities(data.entities || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch entities', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-sm text-gray-500 animate-pulse">Loading hierarchy...</div>;
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full p-4 overflow-y-auto">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Organization Index</h2>
      <div 
        onClick={() => onEntitySelect(null)}
        className={`py-1 px-2 mb-2 cursor-pointer rounded text-sm font-medium ${
          !selectedEntityId ? 'bg-indigo-50 text-indigo-700' : 'text-gray-800 hover:bg-gray-100'
        }`}
      >
        All Organization Data
      </div>
      <div className="space-y-1">
        {rootEntities.map(entity => (
          <TreeNode 
            key={entity._id} 
            entity={entity} 
            level={0} 
            selectedEntityId={selectedEntityId}
            onEntitySelect={onEntitySelect}
          />
        ))}
      </div>
    </div>
  );
}

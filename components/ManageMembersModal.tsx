'use client';

import React, { useState, useEffect, useCallback } from 'react';
import FormModal from './modals/FormModal';
import { apiGet, apiPost } from '@/lib/apiClient';

interface Entity {
  _id: string;
  name: string;
  organizationId?: string;
  type: string;
}

interface ManageMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: { _id: string; name: string } | null;
}

export default function ManageMembersModal({ isOpen, onClose, organization }: ManageMembersModalProps) {
  const [allEntities, setAllEntities] = useState<Entity[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Load all entities (Partners)
      // Note: We'll use a new or existing API to get all partners
      const res = await apiGet('/api/v3/entities');
      if (res.success) {
        setAllEntities(res.entities);
        
        // 2. Identify which ones belong to this organization
        const membersResponse = await apiGet(`/api/admin/organizations/${organization!._id}/members`);
        if (membersResponse.success) {
          setSelectedIds(membersResponse.members.map((m: any) => m._id));
        }
      }
    } catch (err: any) {
      setError('Failed to load members: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    if (isOpen && organization) {
      loadData();
    }
  }, [isOpen, organization, loadData]);

  const handleToggleMember = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!organization) return;
    setSaving(true);
    try {
      const res = await apiPost(`/api/admin/organizations/${organization._id}/members`, {
        entityIds: selectedIds
      });
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Failed to save changes');
      }
    } catch (err: any) {
      setError('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSave}
      title={`Manage Members: ${organization?.name}`}
      submitText="Save Assignments"
      isSubmitting={saving}
      size="lg"
    >
      <div className="members-modal-content">
        {loading ? (
          <div className="py-8 text-center">Loading Partners...</div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded mb-4">{error}</div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Select the Partners that belong to this organization. 
              Note: A partner can only belong to one organization.
            </p>
            <div className="max-h-[400px] overflow-y-auto border border-gray-100 rounded">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="p-3 w-10"></th>
                    <th className="p-3">Partner Name</th>
                    <th className="p-3">Current Org</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allEntities.map(entity => (
                    <tr 
                      key={entity._id} 
                      className={`hover:bg-gray-50 cursor-pointer ${selectedIds.includes(entity._id) ? 'bg-blue-50/30' : ''}`}
                      onClick={() => handleToggleMember(entity._id)}
                    >
                      <td className="p-3">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(entity._id)}
                          readOnly
                          className="w-4 h-4 text-blue-600 rounded border-gray-300"
                        />
                      </td>
                      <td className="p-3 text-sm font-medium text-gray-900">
                        {entity.name}
                      </td>
                      <td className="p-3 text-xs text-gray-500">
                        {entity.organizationId === organization?._id ? (
                          <span className="text-blue-600 font-semibold italic">This Org</span>
                        ) : entity.organizationId ? (
                          <span className="text-orange-600">Other Org</span>
                        ) : (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {allEntities.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-gray-500">
                        No partners available for assignment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </FormModal>
  );
}

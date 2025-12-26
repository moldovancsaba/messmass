'use client';

/**
 * Google Sheets Sync Buttons Component
 * 
 * WHAT: Control buttons for pull and push synchronization
 * WHY: Allow partners to manually trigger sync operations
 * 
 * Features:
 * - Pull button to sync sheet → MessMass
 * - Push button to sync MessMass → sheet
 * - Dry-run mode for previewing changes
 * - Loading and error states
 * - Real-time feedback with status messages
 */

import { useState } from 'react';

interface SyncSummary {
  eventsCreated?: number;
  eventsUpdated?: number;
  rowsCreated?: number;
  rowsUpdated?: number;
  errors?: Array<{ row: number; error: string }>;
}

interface GoogleSheetsSyncButtonsProps {
  partnerId: string;
  isConnected: boolean;
  onSyncComplete?: (type: 'pull' | 'push', summary: SyncSummary) => void;
  onError?: (error: string) => void;
}

export default function GoogleSheetsSyncButtons({
  partnerId,
  isConnected,
  onSyncComplete,
  onError
}: GoogleSheetsSyncButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeSync, setActiveSync] = useState<'pull' | 'push' | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [showDryRun, setShowDryRun] = useState(false);

  // Execute sync operation
  const executeSyncOperation = async (
    type: 'pull' | 'push',
    isDryRun: boolean
  ) => {
    setIsLoading(true);
    setStatusMessage('');
    setActiveSync(type);

    try {
      const endpoint = `/api/partners/${partnerId}/google-sheet/${type}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: isDryRun })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMessage = data.error || `Failed to ${type} events`;
        setStatusMessage(`❌ ${errorMessage}`);
        onError?.(errorMessage);
        return;
      }

      // Show success message with counts
      const summary = data.summary || {};
      const totalCount = 
        (summary.eventsCreated || 0) + 
        (summary.eventsUpdated || 0) +
        (summary.rowsCreated || 0) +
        (summary.rowsUpdated || 0);

      const message = isDryRun
        ? `🔍 Dry run: Would process ${totalCount} items`
        : data.message || `✅ ${type === 'pull' ? 'Pulled' : 'Pushed'} successfully`;

      setStatusMessage(message);
      onSyncComplete?.(type, summary);

      // Show error count if any
      if (summary.errors?.length > 0) {
        setStatusMessage(
          `⚠️ ${totalCount} processed, ${summary.errors.length} errors`
        );
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStatusMessage(`❌ ${errorMessage}`);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
      setActiveSync(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-sm text-yellow-900">
          🔗 <strong>Connect a Google Sheet first</strong> to enable sync operations
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Sync Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => executeSyncOperation('pull', false)}
          disabled={isLoading}
          className="btn btn-primary flex items-center gap-2"
          title="Pull events from Google Sheet into MessMass"
        >
          <span>⬇️</span>
          <span>{isLoading && activeSync === 'pull' ? 'Pulling...' : 'Pull Events'}</span>
        </button>

        <button
          onClick={() => executeSyncOperation('push', false)}
          disabled={isLoading}
          className="btn btn-primary flex items-center gap-2"
          title="Push MessMass events to Google Sheet"
        >
          <span>⬆️</span>
          <span>{isLoading && activeSync === 'push' ? 'Pushing...' : 'Push Events'}</span>
        </button>

        {/* Dry Run Toggle */}
        <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200 transition">
          <input
            type="checkbox"
            checked={showDryRun}
            onChange={(e) => setShowDryRun(e.target.checked)}
            disabled={isLoading}
            className="cursor-pointer"
          />
          <span className="text-sm text-gray-700">🔍 Dry Run</span>
        </label>
      </div>

      {/* Dry Run Mode Notice */}
      {showDryRun && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-900">
          <p>
            <strong>🔍 Dry Run Mode:</strong> Preview changes without making any actual modifications.
            Click the buttons above to see what would be synced.
          </p>
        </div>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div className={`rounded-md p-3 text-sm ${
          statusMessage.startsWith('✅')
            ? 'bg-green-50 text-green-900 border border-green-200'
            : statusMessage.startsWith('⚠️')
            ? 'bg-yellow-50 text-yellow-900 border border-yellow-200'
            : 'bg-red-50 text-red-900 border border-red-200'
        }`}>
          {statusMessage}
        </div>
      )}

      {/* Help Text */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-xs text-gray-700">
        <p className="mb-2">
          <strong>Pull:</strong> Import events from your Google Sheet into MessMass
        </p>
        <p>
          <strong>Push:</strong> Export MessMass events to your Google Sheet
        </p>
      </div>
    </div>
  );
}
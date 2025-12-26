'use client';

/**
 * Google Sheets Connect Modal Component
 * 
 * WHAT: Modal dialog for connecting a Google Sheet to a partner
 * WHY: Provide user-friendly interface for entering sheet ID and configuration
 * 
 * Features:
 * - Input for Google Sheet ID extraction from URL
 * - Tab name configuration (default: "Events")
 * - Sync mode selection (manual/auto)
 * - Connection testing and validation
 * - Loading and error states
 */

import { useState } from 'react';
import FormModal from '@/components/modals/FormModal';

interface GoogleSheetsConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (config: any) => void;
  partnerId: string;
  partnerName?: string;
  isLoading?: boolean;
}

export default function GoogleSheetsConnectModal({
  isOpen,
  onClose,
  onSuccess,
  partnerId,
  partnerName = 'Unknown',
  isLoading = false
}: GoogleSheetsConnectModalProps) {
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetName, setSheetName] = useState('Events');
  const [syncMode, setSyncMode] = useState<'manual' | 'auto'>('manual');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract sheet ID from URL
  const extractSheetId = (url: string): string => {
    // Match patterns like: /d/{id}/ or /d/{id} or just {id}
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) return match[1];
    
    // If it's just an ID, return as-is
    if (/^[a-zA-Z0-9-_]+$/.test(url)) return url;
    
    return '';
  };

  const handleConnect = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      // Extract and validate sheet ID
      const sheetId = extractSheetId(sheetUrl.trim());
      if (!sheetId) {
        setError('Invalid Google Sheet URL or ID. Please provide a valid Google Sheets URL or sheet ID.');
        setIsSubmitting(false);
        return;
      }

      if (!sheetName.trim()) {
        setError('Tab name is required.');
        setIsSubmitting(false);
        return;
      }

      // Call API to connect sheet
      const response = await fetch(
        `/api/partners/${partnerId}/google-sheet/connect`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sheetId,
            sheetName: sheetName.trim(),
            syncMode
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to connect to Google Sheet');
        setIsSubmitting(false);
        return;
      }

      // Success - reset form and notify parent
      setSheetUrl('');
      setSheetName('Events');
      setSyncMode('manual');
      setError('');
      onSuccess(data.config);
      onClose();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleConnect}
      title="Connect Google Sheet"
      size="lg"
    >
      <div className="space-y-4">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-900">
          <p className="font-semibold mb-1">📋 How to connect:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Open your Google Sheet</li>
            <li>Copy the sheet URL from your browser</li>
            <li>Paste it below or just enter the sheet ID</li>
            <li>Verify the tab name and sync mode</li>
          </ol>
        </div>

        {/* Sheet URL Input */}
        <div className="form-group">
          <label className="form-label-block">
            Google Sheet URL or ID *
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="https://docs.google.com/spreadsheets/d/1Tj2sDMu... or just the ID"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            disabled={isSubmitting || isLoading}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Paste the full Google Sheets URL or just the sheet ID
          </p>
        </div>

        {/* Tab Name Input */}
        <div className="form-group">
          <label className="form-label-block">
            Tab Name
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Events"
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
            disabled={isSubmitting || isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Name of the sheet tab to sync (default: "Events")
          </p>
        </div>

        {/* Sync Mode Selection */}
        <div className="form-group">
          <label className="form-label-block">
            Sync Mode
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="syncMode"
                value="manual"
                checked={syncMode === 'manual'}
                onChange={(e) => setSyncMode(e.target.value as 'manual' | 'auto')}
                disabled={isSubmitting || isLoading}
                className="mr-2"
              />
              <span className="text-sm">
                <strong>Manual</strong> - Sync when you click the button
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="syncMode"
                value="auto"
                checked={syncMode === 'auto'}
                onChange={(e) => setSyncMode(e.target.value as 'manual' | 'auto')}
                disabled={isSubmitting || isLoading}
                className="mr-2"
              />
              <span className="text-sm">
                <strong>Auto</strong> - Sync automatically (future feature)
              </span>
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-900">
            <p className="font-semibold">❌ Connection Error</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {/* Partner Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm">
          <p className="text-gray-700">
            <strong>Connecting to:</strong> {partnerName}
          </p>
        </div>
      </div>

      {/* Modal Actions */}
      <div className="flex gap-2 justify-end mt-6">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting || isLoading}
          className="btn btn-ghost"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isLoading || !sheetUrl.trim()}
          className="btn btn-primary"
          onClick={handleConnect}
        >
          {isSubmitting ? '🔄 Connecting...' : '✅ Connect Sheet'}
        </button>
      </div>
    </FormModal>
  );
}
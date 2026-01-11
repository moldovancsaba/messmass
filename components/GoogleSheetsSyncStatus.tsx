'use client';

/**
 * Google Sheets Sync Status Component
 * 
 * WHAT: Display connection status, statistics, and sync history
 * WHY: Show partners their Google Sheet integration health and stats
 * 
 * Features:
 * - Connection status (connected/disconnected)
 * - Sheet metadata (ID, name, URL)
 * - Sync statistics (events created/updated, last sync times)
 * - Health status (sheet accessible, row counts)
 * - Error messages and troubleshooting info
 */

import { useState, useEffect, useCallback } from 'react';

interface GoogleSheetStatus {
  connected: boolean;
  config?: {
    sheetUrl: string;
    sheetId: string;
    sheetName: string;
    syncMode: string;
    lastSyncAt: string | null;
    lastSyncStatus: string;
    lastSyncError: string | null;
  };
  stats?: {
    totalEvents: number;
    lastPullAt: string | null;
    lastPushAt: string | null;
    pullCount: number;
    pushCount: number;
    eventsCreated: number;
    eventsUpdated: number;
  };
  healthCheck?: {
    status: 'healthy' | 'warning' | 'error';
    sheetAccessible: boolean;
    rowCount?: number;
    lastChecked?: string;
    error?: string;
    warning?: string; // Added warning message
  };
}

interface GoogleSheetsSyncStatusProps {
  partnerId: string;
  onDisconnect?: () => void;
}

export default function GoogleSheetsSyncStatus({
  partnerId,
  onDisconnect
}: GoogleSheetsSyncStatusProps) {
  const [status, setStatus] = useState<GoogleSheetStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkHealth, setCheckHealth] = useState(false);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const url = new URL(
        `/api/partners/${partnerId}/google-sheet/status`,
        window.location.origin
      );
      
      if (checkHealth) {
        url.searchParams.append('checkHealth', 'true');
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to fetch status');
        setStatus(null);
        return;
      }

      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [partnerId, checkHealth]);

  // Fetch status on mount and when partner changes
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <p className="text-sm text-gray-600">🔄 Loading status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-sm font-semibold text-red-900">❌ Error</p>
        <p className="text-sm text-red-700 mt-1">{error}</p>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  // Not connected
  if (!status.connected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-sm font-semibold text-yellow-900">
          🔌 No Google Sheet Connected
        </p>
        <p className="text-sm text-yellow-700 mt-1">
          Connect a Google Sheet to start syncing events
        </p>
      </div>
    );
  }

  // Connected - show full status
  const config = status.config!;
  const stats = status.stats!;
  const health = status.healthCheck;

  // Format timestamps
  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Determine health color
  const getHealthColor = () => {
    if (!health) return 'gray';
    if (health.status === 'healthy') return 'green';
    if (health.status === 'warning') return 'yellow';
    return 'red';
  };

  const healthColor = getHealthColor();
  const healthBgClass = `bg-${healthColor}-50`;
  const healthBorderClass = `border-${healthColor}-200`;
  const healthTextClass = `text-${healthColor}-900`;

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className={`rounded-md p-4 border ${healthBgClass} ${healthBorderClass}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-sm font-semibold ${healthTextClass}`}>
              ✅ Google Sheet Connected
            </p>
            <p className="text-sm text-gray-700 mt-1">
              <strong>Tab:</strong> {config.sheetName}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Mode:</strong> {config.syncMode === 'manual' ? '🔘 Manual' : '⚙️ Auto'}
            </p>
          </div>
          <a
            href={config.sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
          >
            Open Sheet →
          </a>
        </div>
      </div>

      {/* Sheet Health */}
      {health && (
        <div className={`rounded-md p-4 border bg-gray-50 border-gray-200`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {health.status === 'healthy' ? '✅ Sheet Healthy' : '⚠️ Sheet Issues'}
              </p>
              {health.sheetAccessible ? (
                <>
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>Rows:</strong> {health.rowCount || '?'}
                  </p>
                  {health.warning && (
                    <p className="text-sm text-yellow-700 mt-1">
                      <strong>⚠️</strong> {health.warning}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-red-700 mt-1">
                  <strong>❌</strong> Cannot access sheet: {health.error}
                </p>
              )}
            </div>
            <button
              onClick={() => setCheckHealth(!checkHealth)}
              className="text-sm text-gray-600 hover:text-gray-900"
              title="Refresh health status"
            >
              🔄
            </button>
          </div>
        </div>
      )}

      {/* Sync Statistics */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm font-semibold text-blue-900 mb-3">📊 Sync Statistics</p>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded p-2">
            <p className="text-xs text-gray-500">Events Created</p>
            <p className="text-lg font-semibold text-blue-900">{stats.eventsCreated}</p>
          </div>
          
          <div className="bg-white rounded p-2">
            <p className="text-xs text-gray-500">Events Updated</p>
            <p className="text-lg font-semibold text-blue-900">{stats.eventsUpdated}</p>
          </div>
          
          <div className="bg-white rounded p-2">
            <p className="text-xs text-gray-500">Total Pulls</p>
            <p className="text-lg font-semibold text-blue-900">{stats.pullCount}</p>
          </div>
          
          <div className="bg-white rounded p-2">
            <p className="text-xs text-gray-500">Total Pushes</p>
            <p className="text-lg font-semibold text-blue-900">{stats.pushCount}</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-xs text-gray-600 mb-1">
            Last Pull: <strong>{formatDate(stats.lastPullAt)}</strong>
          </p>
          <p className="text-xs text-gray-600">
            Last Push: <strong>{formatDate(stats.lastPushAt)}</strong>
          </p>
        </div>
      </div>

      {/* Last Sync Status */}
      {config.lastSyncStatus && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <p className="text-xs text-gray-600 mb-1">
            <strong>Last Sync:</strong> {formatDate(config.lastSyncAt)}
          </p>
          <p className="text-xs">
            <strong>Status:</strong>{' '}
            {config.lastSyncStatus === 'success' ? (
              <span className="text-green-700">✅ Success</span>
            ) : config.lastSyncStatus === 'error' ? (
              <span className="text-red-700">❌ Error</span>
            ) : (
              <span className="text-blue-700">{config.lastSyncStatus}</span>
            )}
          </p>
          {config.lastSyncError && (
            <p className="text-xs text-red-700 mt-1">
              <strong>Error:</strong> {config.lastSyncError}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => setCheckHealth(!checkHealth)}
          className="btn btn-sm btn-ghost"
          disabled={isLoading}
        >
          🔄 Refresh Status
        </button>
        
        {onDisconnect && (
          <button
            onClick={onDisconnect}
            className="btn btn-sm btn-ghost text-red-600 hover:bg-red-50"
          >
            🔌 Disconnect
          </button>
        )}
      </div>
    </div>
  );
}
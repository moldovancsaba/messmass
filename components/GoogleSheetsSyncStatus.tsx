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
  refreshKey?: number;
}

export default function GoogleSheetsSyncStatus({
  partnerId,
  onDisconnect,
  refreshKey
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

  useEffect(() => {
    if (refreshKey === undefined) return;
    fetchStatus();
  }, [refreshKey, fetchStatus]);

  if (isLoading) {
    return (
      <div className="alert">
        <p className="text-sm text-gray-600">🔄 Loading status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <p className="text-sm font-semibold">❌ Error</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  // Not connected
  if (!status.connected) {
    return (
      <div className="alert alert-warning">
        <p className="text-sm font-semibold">
          🔌 No Google Sheet Connected
        </p>
        <p className="text-sm mt-1">
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
    <div className="flex flex-col gap-4">
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
            className="text-info text-sm font-semibold"
          >
            Open Sheet →
          </a>
        </div>
      </div>

      {/* Sheet Health */}
      {health && (
        <div className={"alert"}>
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
                    <p className="text-sm mt-1">
                      <strong>⚠️</strong> {health.warning}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm mt-1">
                  <strong>❌</strong> Cannot access sheet: {health.error}
                </p>
              )}
            </div>
            <button
              onClick={() => setCheckHealth(!checkHealth)}
              className="text-sm text-gray-600"
              title="Refresh health status"
            >
              🔄
            </button>
          </div>
        </div>
      )}

      {/* Sync Statistics */}
      <div className="alert alert-info">
        <p className="text-sm font-semibold mb-3">📊 Sync Statistics</p>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded p-2">
            <p className="text-xs text-gray-500">Events Created</p>
            <p className="text-lg font-semibold">{stats.eventsCreated}</p>
          </div>
          
          <div className="bg-white rounded p-2">
            <p className="text-xs text-gray-500">Events Updated</p>
            <p className="text-lg font-semibold">{stats.eventsUpdated}</p>
          </div>
          
          <div className="bg-white rounded p-2">
            <p className="text-xs text-gray-500">Total Pulls</p>
            <p className="text-lg font-semibold">{stats.pullCount}</p>
          </div>
          
          <div className="bg-white rounded p-2">
            <p className="text-xs text-gray-500">Total Pushes</p>
            <p className="text-lg font-semibold">{stats.pushCount}</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t">
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
        <div className="bg-gray-50 border rounded-md p-3">
          <p className="text-xs text-gray-600 mb-1">
            <strong>Last Sync:</strong> {formatDate(config.lastSyncAt)}
          </p>
          <p className="text-xs">
            <strong>Status:</strong>{' '}
            {config.lastSyncStatus === 'success' ? (
              <span className="text-success">✅ Success</span>
            ) : config.lastSyncStatus === 'error' ? (
              <span className="">❌ Error</span>
            ) : (
              <span className="">{config.lastSyncStatus}</span>
            )}
          </p>
          {config.lastSyncError && (
            <p className="text-xs mt-1">
              <strong>Error:</strong> {config.lastSyncError}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => setCheckHealth(!checkHealth)}
          className="btn btn-small btn-secondary"
          disabled={isLoading}
        >
          🔄 Refresh Status
        </button>
        
        {onDisconnect && (
          <button
            onClick={onDisconnect}
            className="btn btn-small btn-danger"
          >
            🔌 Disconnect
          </button>
        )}
      </div>
    </div>
  );
}

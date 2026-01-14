'use client';

/**
 * Partner Detail Page with Google Sheets Integration
 * 
 * WHAT: Main detail view for individual partners with Google Sheets sync section
 * WHY: Enable partners to manage and monitor Google Sheets synchronization
 * 
 * Route: /admin/partners/[id]
 * 
 * Features:
 * - Partner information and metadata
 * - Google Sheets connection section
 * - Sync controls (pull/push/status)
 * - Connection management (connect/disconnect)
 * - Sync statistics and history
 * 
 * Version: 11.55.1
 * Created: 2025-12-26T14:18:00.000Z (UTC)
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import GoogleSheetsConnectModal from '@/components/GoogleSheetsConnectModal';
import GoogleSheetsSyncButtons from '@/components/GoogleSheetsSyncButtons';
import GoogleSheetsSyncStatus from '@/components/GoogleSheetsSyncStatus';

interface PartnerData {
  _id: string;
  name: string;
  emoji: string;
  googleSheetConfig?: {
    enabled: boolean;
    sheetId: string;
    sheetName: string;
  };
}

export default function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, loading: authLoading } = useAdminAuth();
  const router = useRouter();
  const [partnerId, setPartnerId] = useState<string>('');
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Unwrap params
  useEffect(() => {
    params.then((resolvedParams) => {
      setPartnerId(resolvedParams.id);
    });
  }, [params]);

  // Fetch partner data
  useEffect(() => {
    if (!partnerId) return;

    const fetchPartner = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`/api/partners/${partnerId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch partner');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to load partner');
        }

        setPartner(data.partner);
        setIsConnected(!!data.partner.googleSheetConfig?.enabled);
      } catch (err) {
        console.error('Error fetching partner:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPartner();
  }, [partnerId]);

  // Auth check
  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-card">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/admin/login');
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-card">
          <p>Loading partner details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !partner) {
    return (
      <div className="admin-container">
        <div className="error-card">
          <h2>Error</h2>
          <p>{error || 'Failed to load partner'}</p>
          <button
            onClick={() => router.back()}
            className="btn btn-primary mt-4"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Handle disconnect
  const handleDisconnect = async () => {
    if (!confirm('Disconnect from Google Sheet?')) return;

    try {
      const response = await fetch(
        `/api/partners/${partnerId}/google-sheet/disconnect`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        setIsConnected(false);
        // Reload partner data to reflect changes
        const refreshResponse = await fetch(`/api/partners/${partnerId}`);
        const refreshData = await refreshResponse.json();
        if (refreshData.success) {
          setPartner(refreshData.partner);
        }
      }
    } catch (err) {
      console.error('Error disconnecting:', err);
    }
  };

  // Handle connect success
  const handleConnectSuccess = async () => {
    setIsConnected(true);
    setShowConnectModal(false);
    
    // Reload partner data to reflect new connection
    try {
      const response = await fetch(`/api/partners/${partnerId}`);
      const data = await response.json();
      if (data.success) {
        setPartner(data.partner);
      }
    } catch (err) {
      console.error('Error reloading partner data:', err);
    }
  };

  return (
    <div className="admin-container space-y-6">
      {/* Header */}
      <div className="card card-md p-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="section-title">
              {partner.emoji} {partner.name}
            </h1>
            <p className="text-sm text-gray-600 mt-1">Partner ID: {partner._id}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="btn btn-secondary"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Google Sheets Integration Section */}
      <div className="card card-md p-lg">
        <h2 className="section-title mb-4">📊 Google Sheets Integration</h2>

        <div className="space-y-4">
          {/* Sync Status Display */}
          {isConnected && partnerId && (
            <GoogleSheetsSyncStatus
              partnerId={partnerId}
              onDisconnect={handleDisconnect}
            />
          )}

          {/* Sync Buttons */}
          {partnerId && (
            <GoogleSheetsSyncButtons
              partnerId={partnerId}
              isConnected={isConnected}
              onSyncComplete={(type, summary) => {
                console.log(`${type} complete:`, summary);
              }}
              onError={(error) => {
                console.error('Sync error:', error);
              }}
            />
          )}

          {/* Connect Button */}
          {!isConnected && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-900 mb-3">
                <strong>🔗 Ready to connect a Google Sheet?</strong>
              </p>
              <button
                onClick={() => setShowConnectModal(true)}
                className="btn btn-primary"
              >
                ✅ Connect Google Sheet
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Connect Modal */}
      <GoogleSheetsConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onSuccess={handleConnectSuccess}
        partnerId={partnerId}
        partnerName={partner.name}
      />

      {/* Additional Partner Sections */}
      <div className="grid grid-cols-2 gap-4">
        {/* Quick Links */}
        <div className="card card-md p-lg">
          <h3 className="font-semibold text-gray-900 mb-3">🔗 Quick Links</h3>
          <div className="space-y-2">
            <a
              href={`/admin/partners/${partnerId}/analytics`}
              className="block text-blue-600 hover:text-blue-800 text-sm"
            >
              📈 View Analytics →
            </a>
            <a
              href={`/admin/partners/${partnerId}/kyc-data`}
              className="block text-blue-600 hover:text-blue-800 text-sm"
            >
              📋 KYC Data →
            </a>
            <a
              href={`/admin/partners`}
              className="block text-blue-600 hover:text-blue-800 text-sm"
            >
              🤝 Back to Partners →
            </a>
          </div>
        </div>

        {/* Info Box */}
        <div className="card card-md p-lg">
          <h3 className="font-semibold text-gray-900 mb-3">ℹ️ Integration Info</h3>
          <p className="text-xs text-gray-600 space-y-1">
            <p>• Pull: Sync events from your Google Sheet into MessMass</p>
            <p>• Push: Export MessMass events to your Google Sheet</p>
            <p>• Manual: Control syncs with buttons (no automatic background jobs)</p>
          </p>
        </div>
      </div>
    </div>
  );
}

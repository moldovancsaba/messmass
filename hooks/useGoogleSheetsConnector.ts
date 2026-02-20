import { useCallback, useState } from 'react';
import { apiGet, apiPost } from '@/lib/apiClient';

export type SyncMode = 'manual' | 'auto';

export interface GoogleSheetsConnectPayload {
  sheetId: string;
  sheetName: string;
  syncMode: SyncMode;
  metadata?: Record<string, unknown>;
}

interface UseGoogleSheetsConnectorOptions {
  connectEndpoint: string;
}

export function useGoogleSheetsConnector({
  connectEndpoint,
}: UseGoogleSheetsConnectorOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const extractSheetId = useCallback((input: string): string => {
    const trimmed = input.trim();

    if (!trimmed) return '';

    const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      return match[1];
    }

    if (/^[a-zA-Z0-9-_]+$/.test(trimmed)) {
      return trimmed;
    }

    return '';
  }, []);

  const connect = useCallback(
    async (payload: GoogleSheetsConnectPayload) => {
      setIsSubmitting(true);
      setError('');

      try {
        const response = await apiPost(connectEndpoint, payload);
        return response;
      } catch (apiError) {
        const message =
          apiError instanceof Error ? apiError.message : 'Connection failed';
        setError(message);
        throw apiError;
      } finally {
        setIsSubmitting(false);
      }
    },
    [connectEndpoint]
  );

  const downloadTemplate = useCallback(async (context: string = 'events') => {
    return apiGet<string>(`/api/google-sheets/template?context=${context}`);
  }, []);

  return {
    connect,
    downloadTemplate,
    extractSheetId,
    isSubmitting,
    error,
    setError,
  };
}

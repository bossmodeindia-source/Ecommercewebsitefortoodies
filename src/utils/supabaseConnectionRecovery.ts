/**
 * Supabase Connection Recovery Utility
 * Helps wake up paused projects and restore connection
 */

import { projectId, publicAnonKey } from './supabase/info';

export interface ConnectionStatus {
  status: 'online' | 'offline' | 'paused' | 'checking' | 'error';
  message: string;
  lastChecked: Date;
  canRetry: boolean;
  fixUrl?: string;
}

let connectionStatus: ConnectionStatus = {
  status: 'checking',
  message: 'Checking connection...',
  lastChecked: new Date(),
  canRetry: true,
};

// Any of these statuses means the Supabase server is UP and responding.
// 401 = anon key valid but root path needs auth → project is reachable.
// 403 = RLS / role restriction → project is reachable.
// 400 = bad request → project is reachable.
// 404 = no OpenAPI schema at root → project is reachable.
const REACHABLE_STATUSES = new Set([200, 201, 204, 400, 401, 403, 404]);

/**
 * Check if Supabase project is reachable
 */
export async function checkSupabaseConnection(): Promise<ConnectionStatus> {
  const supabaseUrl = `https://${projectId}.supabase.co`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': publicAnonKey,
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok || REACHABLE_STATUSES.has(response.status)) {
      connectionStatus = {
        status: 'online',
        message: 'Supabase is reachable and responding',
        lastChecked: new Date(),
        canRetry: false,
      };
      return connectionStatus;
    } else if (response.status === 503) {
      connectionStatus = {
        status: 'paused',
        message: 'Project is PAUSED. Click "Resume Project" in dashboard.',
        lastChecked: new Date(),
        canRetry: true,
        fixUrl: `https://supabase.com/dashboard/project/${projectId}`,
      };
      return connectionStatus;
    } else {
      connectionStatus = {
        status: 'error',
        message: `Unexpected response: ${response.status} ${response.statusText}`,
        lastChecked: new Date(),
        canRetry: true,
        fixUrl: `https://supabase.com/dashboard/project/${projectId}`,
      };
      return connectionStatus;
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      connectionStatus = {
        status: 'offline',
        message: 'Connection timeout. Project may be paused or unreachable.',
        lastChecked: new Date(),
        canRetry: true,
        fixUrl: `https://supabase.com/dashboard/project/${projectId}`,
      };
    } else if (error.message?.includes('Failed to fetch')) {
      connectionStatus = {
        status: 'offline',
        message: 'Cannot reach Supabase. Project may be paused, or network issue.',
        lastChecked: new Date(),
        canRetry: true,
        fixUrl: `https://supabase.com/dashboard/project/${projectId}`,
      };
    } else {
      connectionStatus = {
        status: 'error',
        message: `Connection error: ${error.message}`,
        lastChecked: new Date(),
        canRetry: true,
        fixUrl: `https://supabase.com/dashboard/project/${projectId}`,
      };
    }
    return connectionStatus;
  }
}

/**
 * Attempt to wake up Supabase by making multiple requests
 */
export async function attemptWakeup(): Promise<ConnectionStatus> {
  const supabaseUrl = `https://${projectId}.supabase.co`;
  const maxAttempts = 5;

  for (let i = 1; i <= maxAttempts; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: { 'apikey': publicAnonKey },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok || REACHABLE_STATUSES.has(response.status)) {
        connectionStatus = {
          status: 'online',
          message: 'Project is now online! Refresh page to use Supabase.',
          lastChecked: new Date(),
          canRetry: false,
        };
        return connectionStatus;
      } else if (response.status === 503) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
    } catch {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  connectionStatus = {
    status: 'paused',
    message: 'Project is still paused. Please resume manually in dashboard.',
    lastChecked: new Date(),
    canRetry: true,
    fixUrl: `https://supabase.com/dashboard/project/${projectId}`,
  };

  return connectionStatus;
}

/**
 * Get current connection status
 */
export function getConnectionStatus(): ConnectionStatus {
  return connectionStatus;
}

/**
 * Check connection with retry logic
 */
export async function checkConnectionWithRetry(maxRetries = 3): Promise<ConnectionStatus> {
  for (let i = 0; i < maxRetries; i++) {
    const status = await checkSupabaseConnection();
    if (status.status === 'online') return status;
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  return connectionStatus;
}

/**
 * Start periodic connection monitoring
 */
export function startConnectionMonitoring(intervalMs = 30000): () => void {
  const intervalId = setInterval(async () => {
    await checkSupabaseConnection();
  }, intervalMs);

  return () => clearInterval(intervalId);
}

/**
 * Get helpful troubleshooting steps based on current status
 */
export function getTroubleshootingSteps(status: ConnectionStatus): string[] {
  switch (status.status) {
    case 'paused':
      return [
        '1. Open Supabase Dashboard',
        '2. Look for "Project Paused" banner',
        '3. Click "Resume Project" button',
        '4. Wait 2-3 minutes for project to resume',
        '5. Refresh this page',
      ];
    case 'offline':
      return [
        '1. Check your internet connection',
        '2. Disable VPN if active',
        '3. Check if Supabase.com is accessible',
        '4. Verify project is not paused in dashboard',
        '5. Try refreshing the page',
      ];
    case 'error':
      return [
        '1. Check browser console for detailed errors',
        '2. Verify API keys in /utils/supabase/info.tsx',
        '3. Check if database tables exist',
        '4. Contact Supabase support if issue persists',
      ];
    case 'online':
      return ['All systems operational!'];
    default:
      return ['Checking connection...'];
  }
}

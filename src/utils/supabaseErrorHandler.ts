/**
 * Supabase Error Handler Utility
 * Provides consistent, user-friendly error messages for Supabase connection issues
 */

export interface SupabaseErrorInfo {
  isConnectionError: boolean;
  isPausedProject: boolean;
  userMessage: string;
  consoleMessage: string;
  shouldShowWarning: boolean;
}

/**
 * Analyze a Supabase error and return helpful context
 */
export function analyzeSupabaseError(error: any): SupabaseErrorInfo {
  const errorMessage = error?.message || String(error);
  
  // Connection/Network errors (most common - paused project)
  if (errorMessage.includes('Failed to fetch') || 
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('Connection refused')) {
    return {
      isConnectionError: true,
      isPausedProject: true,
      userMessage: 'Data saved locally. Enable cloud sync by resuming Supabase project.',
      consoleMessage: '💾 Saved to localStorage (Supabase offline)',
      shouldShowWarning: false // Don't spam console
    };
  }
  
  // Timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return {
      isConnectionError: true,
      isPausedProject: true,
      userMessage: 'Connection timeout. Project may be paused.',
      consoleMessage: '⏱️ Connection timeout (Supabase likely paused)',
      shouldShowWarning: false
    };
  }
  
  // Table doesn't exist
  if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
    return {
      isConnectionError: false,
      isPausedProject: false,
      userMessage: 'Database tables not found. Run migration in SQL Editor.',
      consoleMessage: '⚠️ Database tables not created - run migration SQL',
      shouldShowWarning: true
    };
  }
  
  // RLS policy errors
  if (errorMessage.includes('infinite recursion') || errorMessage.includes('policy')) {
    return {
      isConnectionError: false,
      isPausedProject: false,
      userMessage: 'Database policy error. Check RLS configuration.',
      consoleMessage: '⚠️ RLS policy issue detected',
      shouldShowWarning: true
    };
  }
  
  // Authentication errors
  if (errorMessage.includes('JWT') || 
      errorMessage.includes('expired') || 
      errorMessage.includes('invalid token')) {
    return {
      isConnectionError: false,
      isPausedProject: false,
      userMessage: 'Authentication token invalid. Check API keys.',
      consoleMessage: '⚠️ Auth token invalid - check credentials',
      shouldShowWarning: true
    };
  }
  
  // Generic database error
  return {
    isConnectionError: false,
    isPausedProject: false,
    userMessage: 'Database operation failed. Using local storage.',
    consoleMessage: `⚠️ Supabase error: ${errorMessage}`,
    shouldShowWarning: true
  };
}

/**
 * Log a Supabase error with appropriate context
 * Only shows warnings for actual issues, not connection failures
 */
export function logSupabaseError(
  operation: string,
  error: any,
  options: { silent?: boolean; fallbackAction?: string } = {}
) {
  const analysis = analyzeSupabaseError(error);
  
  if (options.silent && analysis.isPausedProject) {
    // Don't log anything for paused project errors in silent mode
    return analysis;
  }
  
  if (analysis.shouldShowWarning) {
    console.warn(`⚠️ ${operation}:`, analysis.consoleMessage);
    if (options.fallbackAction) {
      console.log(`💾 Fallback: ${options.fallbackAction}`);
    }
  } else if (!analysis.isPausedProject) {
    // Only log connection errors once
    if (!hasLoggedConnectionError()) {
      console.log(analysis.consoleMessage);
      markConnectionErrorLogged();
    }
  }
  
  return analysis;
}

// Track if we've already logged a connection error this session
let connectionErrorLogged = false;

function hasLoggedConnectionError(): boolean {
  return connectionErrorLogged;
}

function markConnectionErrorLogged(): void {
  connectionErrorLogged = true;
  // Reset after 5 minutes
  setTimeout(() => {
    connectionErrorLogged = false;
  }, 5 * 60 * 1000);
}

/**
 * Get a user-friendly message for save operations
 */
export function getSaveSuccessMessage(
  itemName: string,
  usedSupabase: boolean
): string {
  if (usedSupabase) {
    return `✅ ${itemName} saved to cloud + local storage`;
  } else {
    return `💾 ${itemName} saved locally (Supabase offline)`;
  }
}

/**
 * Handle a Supabase save operation with automatic fallback
 */
export async function handleSupabaseSave<T>(
  operation: () => Promise<T>,
  fallbackFn: () => void,
  itemName: string
): Promise<{ success: boolean; data?: T; usedFallback: boolean }> {
  try {
    const data = await operation();
    console.log(getSaveSuccessMessage(itemName, true));
    return { success: true, data, usedFallback: false };
  } catch (error: any) {
    const analysis = analyzeSupabaseError(error);
    
    // Execute fallback (usually localStorage save)
    fallbackFn();
    
    if (analysis.isPausedProject) {
      console.log(`💾 ${itemName} saved to localStorage (Supabase offline)`);
      if (!hasLoggedConnectionError()) {
        console.log('💡 Tip: Resume Supabase project to enable cloud sync');
        markConnectionErrorLogged();
      }
    } else if (analysis.shouldShowWarning) {
      console.warn(`⚠️ Could not save ${itemName} to Supabase:`, analysis.consoleMessage);
      console.log(`💾 ${itemName} saved to localStorage as fallback`);
    }
    
    return { success: true, usedFallback: true };
  }
}

/**
 * Check if an error is a "safe" connection error (not a real problem)
 */
export function isSafeConnectionError(error: any): boolean {
  const analysis = analyzeSupabaseError(error);
  return analysis.isPausedProject || analysis.isConnectionError;
}

/**
 * Format error for user display (non-technical)
 */
export function formatUserError(error: any): string {
  const analysis = analyzeSupabaseError(error);
  
  if (analysis.isPausedProject) {
    return 'Working offline. Data saved locally.';
  }
  
  return analysis.userMessage;
}

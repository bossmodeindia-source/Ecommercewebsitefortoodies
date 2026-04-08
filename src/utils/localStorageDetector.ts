/**
 * DEVELOPMENT MODE: localStorage Misuse Detector
 * ===============================================
 *
 * This utility helps detect when code is incorrectly using localStorage
 * as a production database instead of as UI preferences.
 *
 * Only runs in development mode (Vite: import.meta.env.DEV).
 */

// Keys that are ALLOWED in localStorage (UI preferences only)
const ALLOWED_KEYS = [
  // Auth tokens (managed by Supabase Auth SDK)
  'toodies-auth',
  'toodies_access_token',
  'sb-mvehfbmjtycgnzahffod-auth-token',

  // UI Preferences
  'toodies_shown_popups',
  'toodies_ui_preferences',
  'toodies_theme',

  // Temporary drafts
  'toodies_draft_design',
  'toodies_clipboard',

  // Feature flags (synced with Supabase)
  'ai_design_feature_enabled',
  'ai_providers',

  // Admin bypass (development only)
  'admin_bypass_active',
  'toodies_user',
];

// Keys that are DEPRECATED and should be migrated to Supabase
const DEPRECATED_KEYS = [
  'toodies_products',
  'toodies_users',
  'toodies_current_user',
  'toodies_orders',
  'toodies_admin_settings',
  'toodies_categories',
  'toodies_coupons',
  'toodies_message_templates',
  'toodies_popup_messages',
  'toodies_chat_conversations',
  'toodies_ai_config',
  'toodies_business_info',
  'toodies_3d_model_configs',
  'toodies_3d_website_integration',
  'toodies_admin_auth',
  'billingCalculationSettings',
  'heroContent',
  'printingMethods',
  'supabase_phone_auth_config',
];

/**
 * Scan localStorage and warn about deprecated keys (dev only)
 */
export function detectLocalStorageMisuse(): void {
  // Only run in development — Vite sets import.meta.env.DEV correctly
  if (typeof window === 'undefined') return;
  if (import.meta.env.PROD) return;

  const deprecatedKeysFound: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (DEPRECATED_KEYS.includes(key)) {
      deprecatedKeysFound.push(key);
    }
  }

  // Only warn if truly deprecated keys are found (not just allowed ones)
  if (deprecatedKeysFound.length > 0) {
    console.groupCollapsed('%c[Toodies] localStorage migration needed', 'color:#d4af37');
    deprecatedKeysFound.forEach(key => {
      const size = ((localStorage.getItem(key)?.length || 0) / 1024).toFixed(1);
      console.warn(`  ${key} (${size} KB) → move to Supabase`);
    });
    console.groupEnd();
  }
}

/**
 * Clear all deprecated localStorage keys
 */
export function clearDeprecatedLocalStorage(): void {
  DEPRECATED_KEYS.forEach(key => localStorage.removeItem(key));
}

/**
 * Get localStorage usage summary
 */
export function getLocalStorageSummary() {
  let totalSize = 0;
  let allowedSize = 0;
  let deprecatedSize = 0;
  const keys: Array<{ key: string; size: number; status: 'allowed' | 'deprecated' | 'suspicious' }> = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    const value = localStorage.getItem(key);
    const size = value?.length || 0;
    totalSize += size;

    let status: 'allowed' | 'deprecated' | 'suspicious' = 'suspicious';
    if (ALLOWED_KEYS.includes(key)) {
      status = 'allowed';
      allowedSize += size;
    } else if (DEPRECATED_KEYS.includes(key)) {
      status = 'deprecated';
      deprecatedSize += size;
    }

    keys.push({ key, size, status });
  }

  return {
    totalSize,
    allowedSize,
    deprecatedSize,
    keys: keys.sort((a, b) => b.size - a.size),
  };
}

// Auto-detect on import — development only, deferred so it doesn't block render
if (typeof window !== 'undefined' && !import.meta.env.PROD) {
  setTimeout(detectLocalStorageMisuse, 3000);
}

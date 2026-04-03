/**
 * DEVELOPMENT MODE: localStorage Misuse Detector
 * ===============================================
 * 
 * This utility helps detect when code is incorrectly using localStorage
 * as a production database instead of as UI preferences.
 * 
 * Only runs in development mode and logs warnings to console.
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
  'ai_providers', // Cached, synced with Supabase
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
  'admin_bypass_active',
  'billingCalculationSettings',
  'heroContent',
  'printingMethods',
  'supabase_phone_auth_config',
];

/**
 * Scan localStorage and warn about deprecated keys
 */
export function detectLocalStorageMisuse(): void {
  // Only run in development
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') {
    return;
  }

  const deprecatedKeysFound: string[] = [];
  const suspiciousKeysFound: string[] = [];

  // Scan all localStorage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    // Check if it's a deprecated key
    if (DEPRECATED_KEYS.includes(key)) {
      deprecatedKeysFound.push(key);
    }
    // Check if it's suspicious (not in allowed list and starts with toodies)
    else if (key.startsWith('toodies_') && !ALLOWED_KEYS.includes(key)) {
      suspiciousKeysFound.push(key);
    }
  }

  // Log warnings
  if (deprecatedKeysFound.length > 0 || suspiciousKeysFound.length > 0) {
    console.warn('');
    console.warn('⚠️  localStorage MISUSE DETECTED');
    console.warn('═══════════════════════════════════════════════════');
    console.warn('');
    console.warn('You are using localStorage for production data storage.');
    console.warn('This is INCORRECT for production deployment!');
    console.warn('');
    
    if (deprecatedKeysFound.length > 0) {
      console.warn('❌ DEPRECATED KEYS (should be in Supabase):');
      deprecatedKeysFound.forEach(key => {
        const size = localStorage.getItem(key)?.length || 0;
        console.warn(`   - ${key} (${(size / 1024).toFixed(2)} KB)`);
      });
      console.warn('');
    }
    
    if (suspiciousKeysFound.length > 0) {
      console.warn('⚠️  SUSPICIOUS KEYS (review if needed):');
      suspiciousKeysFound.forEach(key => {
        const size = localStorage.getItem(key)?.length || 0;
        console.warn(`   - ${key} (${(size / 1024).toFixed(2)} KB)`);
      });
      console.warn('');
    }
    
    console.warn('📖 READ: /PRODUCTION_ARCHITECTURE.md for correct approach');
    console.warn('');
    console.warn('🔧 TO FIX:');
    console.warn('   1. Use supabaseApi for all data operations');
    console.warn('   2. Use localStorage only for UI preferences');
    console.warn('   3. Remove storageUtils imports for data operations');
    console.warn('═══════════════════════════════════════════════════');
    console.warn('');
  }
}

/**
 * Clear all deprecated localStorage keys
 * Use with caution - this will delete data!
 */
export function clearDeprecatedLocalStorage(): void {
  const keysCleared: string[] = [];
  
  DEPRECATED_KEYS.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      keysCleared.push(key);
    }
  });
  
  if (keysCleared.length > 0) {
    console.log(`✅ Cleared ${keysCleared.length} deprecated localStorage keys:`);
    keysCleared.forEach(key => console.log(`   - ${key}`));
  } else {
    console.log('✅ No deprecated keys found');
  }
}

/**
 * Get localStorage usage summary
 */
export function getLocalStorageSummary(): {
  totalSize: number;
  allowedSize: number;
  deprecatedSize: number;
  keys: Array<{ key: string; size: number; status: 'allowed' | 'deprecated' | 'suspicious' }>;
} {
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

// Auto-detect on import (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // Run after a short delay to avoid blocking initial render
  setTimeout(() => {
    detectLocalStorageMisuse();
  }, 2000);
}

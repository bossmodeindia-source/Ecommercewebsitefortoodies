/**
 * LOCAL STORAGE UTILITY
 * =====================
 * This file handles ONLY client-side UI preferences and temporary draft data.
 * All persistent data (users, products, orders, etc.) is stored in Supabase.
 * 
 * What localStorage IS used for:
 * - UI preferences (theme, sidebar state)
 * - Temporary draft data (2D designer auto-save before submission)
 * - Popup dismissal tracking (which popups user has seen)
 * - Clipboard data (copy/paste in designer)
 * 
 * What localStorage is NOT used for:
 * - User accounts and authentication (Supabase Auth)
 * - Products, orders, coupons (Supabase Database)
 * - File uploads (Supabase Storage)
 * - Any production data
 */

// ============================================================
// UI PREFERENCES (Client-side only, not synced)
// ============================================================

/**
 * Get shown popup IDs (which popups the user has dismissed)
 */
export function getShownPopups(): string[] {
  try {
    const data = localStorage.getItem('toodies_shown_popups');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Mark a popup as shown
 */
export function addShownPopup(popupId: string): void {
  try {
    const shown = getShownPopups();
    if (!shown.includes(popupId)) {
      shown.push(popupId);
      localStorage.setItem('toodies_shown_popups', JSON.stringify(shown));
    }
  } catch (error) {
    console.warn('Failed to save shown popup:', error);
  }
}

/**
 * Clear shown popups (for testing)
 */
export function clearShownPopups(): void {
  try {
    localStorage.removeItem('toodies_shown_popups');
  } catch (error) {
    console.warn('Failed to clear shown popups:', error);
  }
}

// ============================================================
// DESIGNER DRAFT DATA (Temporary, until design is submitted)
// ============================================================

export interface DesignerDraft {
  elements: any[];
  color: string;
  productId?: string;
  timestamp: string;
}

/**
 * Save designer draft (auto-save while user is working)
 */
export function saveDesignerDraft(draft: DesignerDraft): void {
  try {
    localStorage.setItem('toodies_draft_design', JSON.stringify(draft));
  } catch (error) {
    console.warn('Failed to save designer draft:', error);
  }
}

/**
 * Load designer draft
 */
export function loadDesignerDraft(): DesignerDraft | null {
  try {
    const data = localStorage.getItem('toodies_draft_design');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Clear designer draft (after submission or explicit clear)
 */
export function clearDesignerDraft(): void {
  try {
    localStorage.removeItem('toodies_draft_design');
  } catch (error) {
    console.warn('Failed to clear designer draft:', error);
  }
}

// ============================================================
// CLIPBOARD (Copy/paste in designer)
// ============================================================

/**
 * Save element to clipboard
 */
export function saveToClipboard(element: any): void {
  try {
    localStorage.setItem('toodies_clipboard', JSON.stringify(element));
  } catch (error) {
    console.warn('Failed to save to clipboard:', error);
  }
}

/**
 * Load element from clipboard
 */
export function loadFromClipboard(): any | null {
  try {
    const data = localStorage.getItem('toodies_clipboard');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// ============================================================
// LEGACY COMPATIBILITY LAYER
// ============================================================
// These are kept for backwards compatibility but should be migrated to Supabase
// They will be removed in a future version

/**
 * @deprecated Use Supabase Auth instead
 */
export const storageUtils = {
  // These are DEPRECATED and should not be used
  // They are kept only for backwards compatibility
  // All new code should use supabaseApi from /utils/supabaseApi.ts
  
  getShownPopups,
  saveShownPopups: (popups: string[]) => {
    try {
      localStorage.setItem('toodies_shown_popups', JSON.stringify(popups));
    } catch (error) {
      console.warn('Failed to save shown popups:', error);
    }
  },
  addShownPopup,
  removeShownPopup: (popupId: string) => {
    try {
      const shown = getShownPopups();
      const filtered = shown.filter(id => id !== popupId);
      localStorage.setItem('toodies_shown_popups', JSON.stringify(filtered));
    } catch (error) {
      console.warn('Failed to remove shown popup:', error);
    }
  },
};

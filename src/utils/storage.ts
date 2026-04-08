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

export function getShownPopups(): string[] {
  try {
    const data = localStorage.getItem('toodies_shown_popups');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

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

export function saveDesignerDraft(draft: DesignerDraft): void {
  try {
    localStorage.setItem('toodies_draft_design', JSON.stringify(draft));
  } catch (error) {
    console.warn('Failed to save designer draft:', error);
  }
}

export function loadDesignerDraft(): DesignerDraft | null {
  try {
    const data = localStorage.getItem('toodies_draft_design');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

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

export function saveToClipboard(element: any): void {
  try {
    localStorage.setItem('toodies_clipboard', JSON.stringify(element));
  } catch (error) {
    console.warn('Failed to save to clipboard:', error);
  }
}

export function loadFromClipboard(): any | null {
  try {
    const data = localStorage.getItem('toodies_clipboard');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// ============================================================
// HELPER — safe localStorage JSON read/write
// ============================================================

function readKey<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeKey(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to write localStorage key "${key}":`, e);
  }
}

// ============================================================
// LEGACY COMPATIBILITY LAYER
// ============================================================
// These methods exist so that components that haven't yet been
// fully migrated to Supabase don't crash at runtime.
// Production data is served by Supabase; these are safe stubs
// that return empty / default values and persist nothing critical.

export const storageUtils = {
  // ── Popup tracking ──────────────────────────────────────────────────
  getShownPopups,
  saveShownPopups: (popups: string[]) => writeKey('toodies_shown_popups', popups),
  addShownPopup,
  removeShownPopup: (popupId: string) => {
    const shown = getShownPopups().filter(id => id !== popupId);
    writeKey('toodies_shown_popups', shown);
  },

  // ── Popup messages (admin-created; Supabase is primary) ─────────────
  getPopupMessages: (): any[] => readKey('toodies_popup_messages', []),
  savePopupMessages: (msgs: any[]) => writeKey('toodies_popup_messages', msgs),
  addPopupMessage: (msg: any) => {
    const msgs = readKey<any[]>('toodies_popup_messages', []);
    writeKey('toodies_popup_messages', [...msgs, msg]);
  },
  updatePopupMessage: (id: string, updatedMsg: any) => {
    const msgs = readKey<any[]>('toodies_popup_messages', []);
    const idx = msgs.findIndex((m: any) => m.id === id);
    if (idx >= 0) {
      msgs[idx] = updatedMsg;
    } else {
      msgs.push(updatedMsg);
    }
    writeKey('toodies_popup_messages', msgs);
  },
  deletePopupMessage: (id: string) => {
    const msgs = readKey<any[]>('toodies_popup_messages', []).filter((m: any) => m.id !== id);
    writeKey('toodies_popup_messages', msgs);
  },

  // ── Chat conversations (Supabase is primary) ─────────────────────────
  getChatConversations: (): any[] => readKey('toodies_chat_conversations', []),
  saveChatConversations: (convs: any[]) => writeKey('toodies_chat_conversations', convs),
  addChatConversation: (conv: any) => {
    const convs = readKey<any[]>('toodies_chat_conversations', []);
    const exists = convs.findIndex((c: any) => c.id === conv.id);
    if (exists >= 0) {
      convs[exists] = conv;
    } else {
      convs.push(conv);
    }
    writeKey('toodies_chat_conversations', convs);
  },
  updateChatConversation: (idOrConv: string | any, updatedConv?: any) => {
    const convs = readKey<any[]>('toodies_chat_conversations', []);
    // Support both (id, conv) and (conv) signatures
    if (typeof idOrConv === 'string' && updatedConv) {
      const idx = convs.findIndex((c: any) => c.id === idOrConv);
      if (idx >= 0) convs[idx] = updatedConv;
    } else {
      const conv = idOrConv;
      const idx = convs.findIndex((c: any) => c.id === conv.id);
      if (idx >= 0) convs[idx] = conv;
    }
    writeKey('toodies_chat_conversations', convs);
  },

  // ── Admin settings (Supabase is primary) ─────────────────────────────
  getAdminSettings: (): any => readKey('toodies_admin_settings', {}),
  saveAdminSettings: (settings: any) => writeKey('toodies_admin_settings', settings),

  // ── Business info (Supabase is primary) ──────────────────────────────
  getBusinessInfo: (): any => readKey('toodies_business_info', {
    companyName: 'Toodies',
    phone: '+91 98865 10858',
    email: 'hello@toodies.com',
    whatsapp: '+919886510858',
    city: 'Bangalore',
    state: 'Karnataka',
    socialMedia: {},
  }),
  saveBusinessInfo: (info: any) => writeKey('toodies_business_info', info),

  // ── Products (Supabase is primary; stub returns [] for safety) ────────
  getProducts: (): any[] => readKey('toodies_products', []),
  addProduct: (product: any) => {
    const products = readKey<any[]>('toodies_products', []);
    writeKey('toodies_products', [...products, { ...product, id: product.id || Date.now().toString() }]);
  },
  updateProduct: (id: string, data: any) => {
    const products = readKey<any[]>('toodies_products', []);
    writeKey('toodies_products', products.map((p: any) => p.id === id ? { ...p, ...data } : p));
  },
  deleteProduct: (id: string) => {
    const products = readKey<any[]>('toodies_products', []);
    writeKey('toodies_products', products.filter((p: any) => p.id !== id));
  },

  // ── Categories (Supabase is primary) ─────────────────────────────────
  getCategories: (): string[] => readKey('toodies_categories', []),
  addCategory: (name: string): boolean => {
    const cats = readKey<string[]>('toodies_categories', []);
    if (cats.includes(name)) return false;
    writeKey('toodies_categories', [...cats, name]);
    return true;
  },
  deleteCategory: (name: string) => {
    const cats = readKey<string[]>('toodies_categories', []).filter(c => c !== name);
    writeKey('toodies_categories', cats);
  },

  // ── Orders (Supabase is primary; stub returns [] for safety) ─────────
  getOrders: (): any[] => readKey('toodies_orders', []),
  saveOrders: (orders: any[]) => writeKey('toodies_orders', orders),
  createOrder: (order: any) => {
    const orders = readKey<any[]>('toodies_orders', []);
    writeKey('toodies_orders', [...orders, { ...order, id: order.id || Date.now().toString() }]);
  },
  updateOrder: (id: string, data: any) => {
    const orders = readKey<any[]>('toodies_orders', []);
    writeKey('toodies_orders', orders.map((o: any) => o.id === id ? { ...o, ...data } : o));
  },

  // ── Users / Auth (Supabase Auth is primary) ──────────────────────────
  getUsers: (): any[] => readKey('toodies_users', []),
  saveUsers: (users: any[]) => writeKey('toodies_users', users),
  getCurrentUser: (): any | null => readKey('toodies_user', null),
  updateCurrentUser: (user: any) => {
    writeKey('toodies_user', user);
    localStorage.setItem('toodies_user', JSON.stringify(user));
  },
  loginUser: (_email: string, _password: string): any | null => {
    // Stub — real auth handled by Supabase (authApi.customerSignin)
    throw new Error('localStorage auth is disabled. Please use Supabase auth.');
  },
  registerUser: (_email: string, _mobile: string, _password: string, _name: string): any | null => {
    // Stub — real auth handled by Supabase (authApi.customerSignup)
    throw new Error('localStorage auth is disabled. Please use Supabase auth.');
  },
  logoutUser: () => {
    localStorage.removeItem('toodies_access_token');
    localStorage.removeItem('toodies_user');
  },
  logoutAdmin: () => {
    localStorage.removeItem('toodies_access_token');
    localStorage.removeItem('toodies_user');
    localStorage.removeItem('admin_bypass_active');
  },

  // ── Coupons (Supabase is primary) ────────────────────────────────────
  getCoupons: (): any[] => readKey('toodies_coupons', []),
  addCoupon: (coupon: any) => {
    const coupons = readKey<any[]>('toodies_coupons', []);
    writeKey('toodies_coupons', [...coupons, { ...coupon, id: coupon.id || Date.now().toString() }]);
  },
  updateCoupon: (coupon: any) => {
    const coupons = readKey<any[]>('toodies_coupons', []);
    const idx = coupons.findIndex((c: any) => c.id === coupon.id);
    if (idx >= 0) coupons[idx] = coupon; else coupons.push(coupon);
    writeKey('toodies_coupons', coupons);
  },
  deleteCoupon: (id: string) => {
    const coupons = readKey<any[]>('toodies_coupons', []).filter((c: any) => c.id !== id);
    writeKey('toodies_coupons', coupons);
  },

  // ── AI Config (localStorage only) ────────────────────────────────────
  getAIConfig: (): any => readKey('toodies_ai_config', {
    isEnabled: false,
    enabled: false,
    autoReply: false,
    greetingMessage: 'Hello! How can I help you today?',
    provider: 'openai',
  }),
  saveAIConfig: (config: any) => writeKey('toodies_ai_config', config),

  // ── Message templates (Supabase is primary) ──────────────────────────
  getMessageTemplates: (): any[] => readKey('toodies_message_templates', []),
  saveMessageTemplates: (templates: any[]) => writeKey('toodies_message_templates', templates),
  addMessageTemplate: (template: any) => {
    const templates = readKey<any[]>('toodies_message_templates', []);
    writeKey('toodies_message_templates', [...templates, template]);
  },
  updateMessageTemplate: (id: string, updatedTemplate: any) => {
    const templates = readKey<any[]>('toodies_message_templates', []);
    const idx = templates.findIndex((t: any) => t.id === id);
    if (idx >= 0) {
      templates[idx] = updatedTemplate;
    } else {
      templates.push(updatedTemplate);
    }
    writeKey('toodies_message_templates', templates);
  },
  deleteMessageTemplate: (id: string) => {
    const templates = readKey<any[]>('toodies_message_templates', []).filter((t: any) => t.id !== id);
    writeKey('toodies_message_templates', templates);
  },

  // ── 3D Model configs (Supabase is primary) ───────────────────────────
  get3DModelConfigs: (): any[] => readKey('toodies_3d_model_configs', []),
  get3DModelConfigByProductId: (productId: string): any | null => {
    const configs = readKey<any[]>('toodies_3d_model_configs', []);
    return configs.find((c: any) => c.productId === productId || c.product_id === productId) || null;
  },
  save3DModelConfig: (config: any) => {
    const configs = readKey<any[]>('toodies_3d_model_configs', []);
    const idx = configs.findIndex((c: any) => c.id === config.id);
    if (idx >= 0) configs[idx] = config; else configs.push(config);
    writeKey('toodies_3d_model_configs', configs);
  },
  delete3DModelConfig: (id: string) => {
    const configs = readKey<any[]>('toodies_3d_model_configs', []).filter((c: any) => c.id !== id);
    writeKey('toodies_3d_model_configs', configs);
  },
};
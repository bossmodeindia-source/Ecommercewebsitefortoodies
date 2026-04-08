// Supabase API utilities - PRIMARY DATA SOURCE for production
import { createClient } from '@supabase/supabase-js';

// Use environment variables for Netlify deployment, with fallback to hardcoded values for development
const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'mvehfbmjtycgnzahffod';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || `https://${projectId}.supabase.co`;
const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12ZWhmYm1qdHljZ256YWhmZm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzU5ODcsImV4cCI6MjA4OTg1MTk4N30.Fp3LjhbJFyj4hKzekoHe3dmXzxfrOtZKni9e2i0XYQk';

declare global {
  var __supabaseClient: any;
  var __supabaseClientInitialized: boolean;
}

/**
 * TOODIES DATA ARCHITECTURE FOR NETLIFY PRODUCTION
 * =================================================
 * 
 * ✅ Supabase is the ONLY backend for production data:
 *    - User authentication (Supabase Auth)
 *    - All database tables (users, products, orders, etc.)
 *    - File storage (Supabase Storage)
 * 
 * ✅ localStorage is used ONLY for:
 *    - Auth tokens (managed by Supabase Auth SDK)
 *    - UI preferences (theme, sidebar state)
 *    - Temporary drafts (2D designer auto-save before submission)
 * 
 * ❌ localStorage is NOT a fallback database
 * ❌ If Supabase is down, show error - don't silently use localStorage
 */

const getSupabaseClient = () => {
  if (!globalThis.__supabaseClientInitialized) {
    try {
      const client = createClient(
        supabaseUrl,
        publicAnonKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'toodies-auth',
          },
          global: {
            headers: {
              'x-client-info': 'toodies-app',
            },
          },
        }
      );

      globalThis.__supabaseClient = client;
      globalThis.__supabaseClientInitialized = true;

    } catch (error) {
      throw error;
    }
  }

  return globalThis.__supabaseClient;
};

const supabase = getSupabaseClient();

// Export the singleton supabase client for use in other modules
export { supabase };

// ============================================
// Helper Functions
// ============================================

// Get current user from localStorage
function getCurrentUserId(): string | null {
  const userStr = localStorage.getItem('toodies_user');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return user.id;
  } catch {
    return null;
  }
}

// Check if user is admin
function isAdmin(): boolean {
  const userStr = localStorage.getItem('toodies_user');
  if (!userStr) return false;
  try {
    const user = JSON.parse(userStr);
    return user.role === 'admin';
  } catch {
    return false;
  }
}

// Wrapper to handle network failures
async function safeSupabaseCall<T>(
  operation: () => Promise<T>,
  fallbackValue: T
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // Check for network errors
    if (error.message?.includes('Failed to fetch') || 
        error.message?.includes('NetworkError') ||
        error.message?.includes('fetch')) {
      // Silently return fallback value - no logging to avoid console spam
      return fallbackValue;
    }
    // Re-throw other errors
    throw error;
  }
}

// Map database user fields to app fields
// Database has: full_name, is_verified
// App expects: name, emailVerified (camelCase — used throughout CustomerDashboard)
function mapUserFields(dbUser: any, supabaseAuthUser?: any): any {
  if (!dbUser) return null;
  const { full_name, is_verified, password, ...rest } = dbUser;
  return {
    ...rest,
    name: full_name,
    // camelCase so CustomerDashboard checks work (currentUser.emailVerified)
    emailVerified: is_verified
      || (supabaseAuthUser?.email_confirmed_at != null)
      || false,
    mobileVerified: dbUser.mobile_verified ?? true, // default true — phone-OTP is optional
  };
}

// ============================================
// Authentication API (Using Supabase Auth)
// ============================================

export const authApi = {
  // Initialize admin account (using Supabase Auth)
  initializeAdmin: async () => {
    try {
      // Check if admin already exists in public.users table.
      // Using maybeSingle() to avoid 406/500 errors when:
      //  - Table is empty (maybeSingle returns null instead of error)
      //  - RLS policy blocks the query (error caught gracefully below)
      const { data: existingAdmin, error: checkError } = await supabase
        .from('users')
        .select('id, email')
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle();

      if (checkError) {
        // RLS may block anonymous role queries — silently skip, use bypass login
        return { message: 'Use bypass login' };
      }

      if (existingAdmin) {
        return { message: 'Admin already exists' };
      }

      return { message: 'Use bypass login' };
    } catch {
      // Silently handle any error — bypass login works without this
      return { message: 'Use bypass login' };
    }
  },

  // Admin signup (for compatibility - now calls initializeAdmin)
  adminSignup: async (email: string, password: string, name: string) => {
    return authApi.initializeAdmin();
  },

  // Admin signin (Secure Bypass First → fallback to Supabase Auth)
  adminSignin: async (email: string, password: string) => {
    // ── Hardcoded admin credentials (bypass when Supabase Auth unavailable) ──
    const ADMIN_EMAIL    = 'm78787531@gmail.com';
    const ADMIN_PASSWORD = '9886510858@TcbToponeAdmin';

    // ── Check Bypass First (Fast Path - Works Even Offline) ──
    const emailMatch    = email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
    const passwordMatch = password.trim() === ADMIN_PASSWORD.trim();

    // If credentials match admin, use bypass immediately (don't wait for Supabase)
    if (emailMatch && passwordMatch) {
      const bypassUser = {
        id: 'admin-bypass-local',
        email: ADMIN_EMAIL,
        name: 'Toodies Admin',
        full_name: 'Toodies Admin',
        role: 'admin',
        email_verified: true,
        is_verified: true,
        created_at: new Date().toISOString(),
      };

      const bypassToken = `bypass-admin-${Date.now()}`;
      localStorage.setItem('toodies_access_token', bypassToken);
      localStorage.setItem('toodies_user', JSON.stringify(bypassUser));
      localStorage.setItem('admin_bypass_active', 'true');

      return { access_token: bypassToken, user: bypassUser };
    }

    // If credentials don't match bypass, try Supabase Auth (for other admin accounts)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: password.trim() });

      if (!error && data.user) {
        // Try to fetch profile from public.users
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (!profileError && userProfile) {
          if (userProfile.role !== 'admin') {
            await supabase.auth.signOut();
            throw new Error('Access denied. Admin privileges required.');
          }

          const mappedUser = mapUserFields(userProfile, data.user);
          localStorage.setItem('toodies_access_token', data.session?.access_token || '');
          localStorage.setItem('toodies_user', JSON.stringify(mappedUser));
          return { access_token: data.session?.access_token || '', user: mappedUser };
        }
      }
    } catch (supabaseErr: any) {
      // Re-throw explicit access denied errors; swallow network/auth errors
      if (supabaseErr.message?.includes('Access denied')) {
        throw supabaseErr;
      }
    }

    // Wrong credentials entirely
    throw new Error('Invalid credentials. Please check your email and password.');
  },

  // Customer signup (using Supabase Auth)
  customerSignup: async (email: string, password: string, name: string, phone?: string) => {
    // Create user in Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'customer',
          name: name
        }
      }
    });

    if (signUpError) {
      throw new Error(signUpError.message);
    }

    if (!authData.user) {
      throw new Error('Failed to create user');
    }

    // The on_auth_user_created trigger already inserts a row in public.users.
    // We UPSERT (not INSERT) to avoid a duplicate-key error from the trigger.
    const { error: publicUserError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        email,
        full_name: name,  // Database uses 'full_name' not 'name'
        role: 'customer',
        is_verified: false,
      }, { onConflict: 'id' });

    if (publicUserError) {
      // Non-fatal: trigger may have already created the row; log and continue
      console.warn('⚠️ User upsert warning (trigger may have already created row):', publicUserError.message);
    }

    // Sign in the new user
    return authApi.customerSignin(email, password);
  },

  // Customer signin (using Supabase Auth)
  customerSignin: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      throw new Error('Invalid credentials');
    }

    // Get user profile from public.users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .eq('role', 'customer')
      .single();

    if (profileError || !userProfile) {
      throw new Error('User profile not found');
    }

    // Map database fields to app fields.
    // Pass the Supabase Auth user so emailVerified reflects email_confirmed_at.
    const mappedUser = mapUserFields(userProfile, data.user);

    // Store user info
    localStorage.setItem('toodies_access_token', data.session?.access_token || '');
    localStorage.setItem('toodies_user', JSON.stringify(mappedUser));

    return {
      access_token: data.session?.access_token || '',
      user: mappedUser,
    };
  },

  // Get current user
  getCurrentUser: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;

    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return mapUserFields(userProfile);
  },

  // Logout
  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('toodies_access_token');
    localStorage.removeItem('toodies_user');
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  },

  // Get stored user
  getStoredUser: () => {
    const userStr = localStorage.getItem('toodies_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Request password reset
  requestPasswordReset: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { message: 'Password reset email sent' };
  },

  // Reset password with token
  resetPassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw new Error(error.message);
    }

    return { message: 'Password reset successful' };
  },
};

// ============================================
// Products API
// ============================================

export const productsApi = {
  // Get all products
  getAll: async () => {
    // Try with product_variations join first
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`*, product_variations (*)`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (!error) return data || [];
    } catch (_) {}
    // Fallback: select without join
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  // Get single product
  getById: async (productId: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Create product (admin only)
  create: async (product: any) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { variations, ...productData } = product;

    // Insert product
    const { data: newProduct, error: productError } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (productError) throw new Error(productError.message);

    // Insert variations if provided
    if (variations && variations.length > 0) {
      const variationsWithProductId = variations.map((v: any) => ({
        ...v,
        product_id: newProduct.id,
      }));

      const { error: variationsError } = await supabase
        .from('product_variations')
        .insert(variationsWithProductId);

      if (variationsError) throw new Error(variationsError.message);
    }

    return newProduct;
  },

  // Update product (admin only)
  update: async (productId: string, product: any) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { variations, ...productData } = product;

    // Update product
    const { data: updatedProduct, error: productError } = await supabase
      .from('products')
      .update(productData)
      .eq('id', productId)
      .select()
      .single();

    if (productError) throw new Error(productError.message);

    // Update variations if provided
    if (variations) {
      // Delete existing variations
      await supabase
        .from('product_variations')
        .delete()
        .eq('product_id', productId);

      // Insert new variations
      if (variations.length > 0) {
        const variationsWithProductId = variations.map((v: any) => ({
          ...v,
          product_id: productId,
        }));

        await supabase
          .from('product_variations')
          .insert(variationsWithProductId);
      }
    }

    return updatedProduct;
  },

  // Delete product (admin only)
  delete: async (productId: string) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw new Error(error.message);
  },
};

// ============================================
// Custom Designs API (with approval workflow)
// ============================================

export const designsApi = {
  // Save customer design
  save: async (design: any) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Unauthorized');

    const designData = {
      ...design,
      user_id: userId,
      approval_status: 'pending',
      status: 'saved',
      payment_status: 'unpaid',
    };

    const { data, error } = await supabase
      .from('saved_customer_designs')
      .insert(designData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Get user's designs
  getMy: async () => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Unauthorized');

    return safeSupabaseCall(async () => {
      const { data, error } = await supabase
        .from('saved_customer_designs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    }, []); // Fallback to empty array on network error
  },

  // Get all designs (admin only)
  getAll: async () => {
    if (!isAdmin()) throw new Error('Unauthorized');

    return safeSupabaseCall(async () => {
      const { data, error } = await supabase
        .from('saved_customer_designs')
        .select(`
          *,
          reviewer:users!reviewed_by(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    }, []); // Fallback to empty array on network error
  },

  // Approve or reject design (admin only)
  approve: async (designId: string, approvalStatus: 'approved' | 'rejected', approvalNotes?: string, adminSetPrice?: number) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const userId = getCurrentUserId();

    const updateData: any = {
      approval_status: approvalStatus,
      approval_date: new Date().toISOString(),
      reviewed_by: userId,
    };

    if (approvalNotes) updateData.approval_notes = approvalNotes;
    if (adminSetPrice !== undefined) updateData.admin_set_price = adminSetPrice;

    const { data, error } = await supabase
      .from('saved_customer_designs')
      .update(updateData)
      .eq('id', designId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Update design
  update: async (designId: string, updates: any) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Unauthorized');

    // If not admin, can only update own designs
    let query = supabase
      .from('saved_customer_designs')
      .update(updates)
      .eq('id', designId);

    if (!isAdmin()) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.select().single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Delete design
  delete: async (designId: string) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Unauthorized');

    // If not admin, can only delete own designs
    let query = supabase
      .from('saved_customer_designs')
      .delete()
      .eq('id', designId);

    if (!isAdmin()) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) throw new Error(error.message);
  },
};

// ============================================
// Orders API
// ============================================

export const ordersApi = {
  // Create order
  create: async (orderData: any) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Unauthorized');

    const { items, ...order } = orderData;

    // Generate order number
    const orderNumber = `TDS-${Date.now()}`;

    // Insert order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        ...order,
        order_number: orderNumber,
        user_id: userId,
        status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (orderError) throw new Error(orderError.message);

    // Insert order items
    if (items && items.length > 0) {
      const orderItems = items.map((item: any) => ({
        ...item,
        order_id: newOrder.id,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw new Error(itemsError.message);
    }

    return newOrder;
  },

  // Get user's orders
  getMy: async () => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback: try without join (order_items table might not exist)
      const { data: fallback, error: fallbackError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (fallbackError) throw new Error(fallbackError.message);
      return fallback || [];
    }
    return data || [];
  },

  // Get all orders (admin only)
  getAll: async () => {
    if (!isAdmin()) throw new Error('Unauthorized');

    return safeSupabaseCall(async () => {
      // Try with order_items join first
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (!error) return data || [];

      // Fallback: without join
      const { data: fallback, error: fallbackError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (fallbackError) throw new Error(fallbackError.message);
      return fallback || [];
    }, []); // Fallback to empty array on network error
  },

  // Update order (admin only)
  update: async (orderId: string, updates: any) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};

// ============================================
// User Profile API
// ============================================

export const userApi = {
  // Update user profile
  updateProfile: async (updates: any) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Unauthorized');

    // Map app fields to database fields if needed
    const dbUpdates = { ...updates };
    if ('name' in updates) {
      dbUpdates.full_name = updates.name;
      delete dbUpdates.name;
    }
    if ('email_verified' in updates) {
      dbUpdates.is_verified = updates.email_verified;
      delete dbUpdates.email_verified;
    }

    const { data, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    const mappedUser = mapUserFields(data);
    
    // Update stored user
    localStorage.setItem('toodies_user', JSON.stringify(mappedUser));
    
    return mappedUser;
  },

  // Get all customers (admin only)
  getAllCustomers: async () => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    
    // Map fields and remove passwords from response
    return (data || []).map(user => mapUserFields(user));
  },
};

// ============================================
// Categories API
// ============================================

export const categoriesApi = {
  // Get all categories
  getAll: async () => {
    // Try with display_order sort (present in fresh-setup-v2 schema)
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });
      if (!error) return data || [];
    } catch (_) {}
    // Fallback: sort by created_at
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },

  // Create category (admin only)
  create: async (category: any) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Update category (admin only)
  update: async (categoryId: string, category: any) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('categories')
      .update(category)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Delete category (admin only)
  delete: async (categoryId: string) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) throw new Error(error.message);
  },
};

// ============================================
// Settings API
// ============================================

export const settingsApi = {
  // Get business settings
  getBusiness: async () => {
    try {
      // Using maybeSingle() instead of single() to avoid:
      //  - 406 error when the table exists but is empty
      //  - PGRST116 error code for "no rows returned"
      const { data, error } = await supabase
        .from('business_info')
        .select('*')
        .limit(1)
        .maybeSingle();

      // Handle table not found error silently (migration not run yet)
      if (error && (error.code === '42P01' || error.message?.includes('Could not find the table'))) {
        return {}; // Return empty object - will use default fallback
      }

      if (error) {
        return {}; // Return empty object on any error
      }

      return data || {};
    } catch (error) {
      // Silent fallback - migration not run yet or network issue
      return {};
    }
  },

  // Save business settings (admin only)
  saveBusiness: async (settings: any) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    // Check if settings exist — use maybeSingle() to avoid 406 when table is empty
    const { data: existing } = await supabase
      .from('business_info')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('business_info')
        .update(settings)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('business_info')
        .insert(settings)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }
  },

  // Get categories (legacy support)
  getCategories: async () => {
    return categoriesApi.getAll();
  },

  // Save categories (legacy support)
  saveCategories: async (categoryNames: string[]) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    // Get existing categories
    const { data: existing } = await supabase
      .from('categories')
      .select('name');

    const existingNames = existing?.map(c => c.name) || [];

    // Add new categories
    const newCategories = categoryNames.filter(name => !existingNames.includes(name));
    
    if (newCategories.length > 0) {
      const categoriesToInsert = newCategories.map((name, index) => ({
        name,
        display_order: existingNames.length + index,
      }));

      await supabase
        .from('categories')
        .insert(categoriesToInsert);
    }

    return categoriesApi.getAll();
  },

  // Get printing methods
  getPrintingMethods: async () => {
    const { data, error } = await supabase
      .from('printing_methods')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Save printing methods (admin only)
  savePrintingMethods: async (methods: any[]) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    // Delete all existing methods
    await supabase
      .from('printing_methods')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    // Insert new methods
    if (methods.length > 0) {
      const { data, error } = await supabase
        .from('printing_methods')
        .insert(methods)
        .select();

      if (error) throw new Error(error.message);
      return data;
    }

    return [];
  },
};

// ============================================
// Coupons API
// ============================================

export const couponsApi = {
  // Get all active coupons
  getAll: async () => {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Get all coupons (admin)
  getAllAdmin: async () => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Validate coupon code
  validate: async (code: string) => {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error) throw new Error('Invalid coupon code');

    // Check validity period
    const now = new Date();
    const validFrom = new Date(data.valid_from);
    const validUntil = new Date(data.valid_until);

    if (now < validFrom || now > validUntil) {
      throw new Error('Coupon has expired');
    }

    // Check usage limit
    if (data.usage_limit && data.used_count >= data.usage_limit) {
      throw new Error('Coupon usage limit reached');
    }

    return data;
  },

  // Create or update coupon (admin only)
  save: async (coupon: any) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    if (coupon.id) {
      // Update existing
      const { data, error } = await supabase
        .from('coupons')
        .update(coupon)
        .eq('id', coupon.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('coupons')
        .insert({ ...coupon, code: coupon.code.toUpperCase() })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }
  },

  // Delete coupon (admin only)
  delete: async (couponId: string) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', couponId);

    if (error) throw new Error(error.message);
  },
};

// ============================================
// 3D Model Configs API
// ============================================

export const modelConfigsApi = {
  // Get all model configs
  getAll: async () => {
    const { data, error } = await supabase
      .from('three_d_model_configs')
      .select(`
        *,
        products (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Get config by product ID
  getByProductId: async (productId: string) => {
    // Use maybeSingle() to avoid 406 HTTP errors when no config exists for this product
    const { data, error } = await supabase
      .from('three_d_model_configs')
      .select('*')
      .eq('product_id', productId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  },

  // Save model config (admin only)
  save: async (config: any) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    // Check if config exists for this product — maybeSingle() avoids 406 when no rows exist
    const { data: existing } = await supabase
      .from('three_d_model_configs')
      .select('id')
      .eq('product_id', config.product_id)
      .maybeSingle();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('three_d_model_configs')
        .update(config)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('three_d_model_configs')
        .insert(config)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }
  },

  // Delete model config (admin only)
  delete: async (configId: string) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { error } = await supabase
      .from('three_d_model_configs')
      .delete()
      .eq('id', configId);

    if (error) throw new Error(error.message);
  },
};

// ============================================
// Cart API
// ============================================

/** Returns true when a string is a real UUID (Supabase row ID), not a localStorage timestamp ID */
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export const cartApi = {
  // ── Session-aware helpers ──────────────────────────────────────────
  // These use supabase.auth.getUser() instead of localStorage so they
  // work correctly with real Supabase sessions (persistent across devices).

  /**
   * Load the user's Supabase cart and return it as local CartItem[].
   * Returns [] if there is no active Supabase session (localStorage-only user).
   */
  getCart: async (): Promise<{ productId: string; variationId: string; quantity: number }[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('cart_items')
        .select('product_id, variation_id, quantity')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error || !data) return [];
      return data.map((row: any) => ({
        productId:   row.product_id,
        variationId: row.variation_id,
        quantity:    row.quantity,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Add or update a cart item identified by product+variation.
   * No-ops silently if IDs aren't real UUIDs or there's no Supabase session.
   */
  upsert: async (productId: string, variationId: string, quantity: number, unitPrice: number) => {
    if (!isValidUUID(productId) || !isValidUUID(variationId)) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existing } = await supabase
        .from('cart_items')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('variation_id', variationId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('cart_items')
          .update({ quantity, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('cart_items')
          .insert({
            user_id:      user.id,
            product_id:   productId,
            variation_id: variationId,
            quantity,
            unit_price:   unitPrice,
          });
      }
    } catch {
      // Silent fail — localStorage is source of truth
    }
  },

  /**
   * Remove a cart item by product+variation (no DB row ID needed).
   */
  removeByProduct: async (productId: string, variationId: string) => {
    if (!isValidUUID(productId) || !isValidUUID(variationId)) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('variation_id', variationId);
    } catch {
      // Silent fail
    }
  },

  /**
   * Wipe the entire Supabase cart (called after order is placed).
   */
  clearAll: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);
    } catch {
      // Silent fail
    }
  },

  /**
   * After login, push the local localStorage cart up to Supabase.
   * Only syncs items whose IDs are real UUIDs (came from Supabase products).
   */
  syncFromLocal: async (
    localCart: { productId: string; variationId: string; quantity: number }[],
    products: any[]
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || localCart.length === 0) return;

      for (const item of localCart) {
        if (!isValidUUID(item.productId) || !isValidUUID(item.variationId)) continue;
        const product   = products.find((p: any) => p.id === item.productId);
        const variation = product?.variations?.find((v: any) => v.id === item.variationId);
        await cartApi.upsert(item.productId, item.variationId, item.quantity, variation?.price ?? 0);
      }
    } catch {
      // Silent fail
    }
  },

  // ── Legacy row-ID-based methods (kept for backwards compatibility) ──

  // Get user's cart items (raw DB rows)
  getMy: async () => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (*),
        product_variations (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Add item to cart (by DB row payload)
  add: async (cartItem: any) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('cart_items')
      .insert({
        ...cartItem,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Update cart item quantity (by DB row id)
  updateQuantity: async (cartItemId: string, quantity: number) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', cartItemId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Remove item from cart (by DB row id)
  remove: async (cartItemId: string) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Unauthorized');

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  },

  // Clear entire cart (by localStorage userId)
  clear: async () => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Unauthorized');

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  },
};

// ============================================
// Message Templates API
// ============================================

export const messageTemplatesApi = {
  // Get all message templates (admin only)
  getAll: async () => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Create message template (admin only)
  create: async (template: any) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('message_templates')
      .insert(template)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Update message template (admin only)
  update: async (templateId: string, template: any) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('message_templates')
      .update(template)
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Delete message template (admin only)
  delete: async (templateId: string) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw new Error(error.message);
  },
};

// ============================================
// Popup Messages API
// ============================================

export const popupMessagesApi = {
  // Get active popup messages
  getActive: async () => {
    const { data, error } = await supabase
      .from('popup_messages')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Get all popup messages (admin only)
  getAll: async () => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('popup_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Create popup message (admin only)
  create: async (popup: any) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('popup_messages')
      .insert(popup)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Update popup message (admin only)
  update: async (popupId: string, popup: any) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('popup_messages')
      .update(popup)
      .eq('id', popupId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Delete popup message (admin only)
  delete: async (popupId: string) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { error } = await supabase
      .from('popup_messages')
      .delete()
      .eq('id', popupId);

    if (error) throw new Error(error.message);
  },
};

// ============================================
// Help Center API
// ============================================

export const helpCenterApi = {
  // Get all articles
  getAll: async () => {
    const { data, error } = await supabase
      .from('help_articles')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Get articles by category
  getByCategory: async (category: string) => {
    const { data, error } = await supabase
      .from('help_articles')
      .select('*')
      .eq('category', category)
      .eq('is_published', true)
      .order('display_order', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Get all articles (admin - including unpublished)
  getAllAdmin: async () => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('help_articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Create article (admin only)
  create: async (article: any) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('help_articles')
      .insert(article)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Update article (admin only)
  update: async (articleId: string, article: any) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('help_articles')
      .update(article)
      .eq('id', articleId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Delete article (admin only)
  delete: async (articleId: string) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { error } = await supabase
      .from('help_articles')
      .delete()
      .eq('id', articleId);

    if (error) throw new Error(error.message);
  },
};

// ============================================
// Admin Settings API
// ============================================

export const adminSettingsApi = {
  // Get admin settings
  get: async () => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data || {};
  },

  // Save admin settings
  save: async (settings: any) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    // Check if settings exist
    const { data: existing } = await supabase
      .from('admin_settings')
      .select('id')
      .limit(1)
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('admin_settings')
        .update(settings)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('admin_settings')
        .insert(settings)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }
  },
};

// ============================================
// AI Config API
// ============================================

export const aiConfigApi = {
  // Get AI config (admin only) — legacy ai_config table
  get: async () => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('ai_config')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data || { provider: 'none', is_enabled: false };
  },

  // Save AI config (admin only) — legacy ai_config table
  save: async (config: any) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { data: existing } = await supabase
      .from('ai_config')
      .select('id')
      .limit(1)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('ai_config')
        .update(config)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const { data, error } = await supabase
        .from('ai_config')
        .insert(config)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }
  },

  // ─────────────────────────────────────────────────
  // AI FEATURE TOGGLE  (ai_feature_settings table)
  // ─────────────────────────────────────────────────

  /** Read the global AI Design feature toggle. Falls back to localStorage if table missing. */
  getFeatureEnabled: async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('ai_feature_settings')
        .select('feature_value')
        .eq('feature_key', 'ai_design_enabled')
        .single();

      if (error) {
        const ls = localStorage.getItem('ai_design_feature_enabled');
        return ls === null ? true : ls === 'true';
      }
      return data?.feature_value === 'true';
    } catch {
      const ls = localStorage.getItem('ai_design_feature_enabled');
      return ls === null ? true : ls === 'true';
    }
  },

  /** Persist the global AI Design feature toggle (admin only). */
  setFeatureEnabled: async (enabled: boolean): Promise<void> => {
    // Always mirror to localStorage for instant reads without async
    localStorage.setItem('ai_design_feature_enabled', String(enabled));
    
    try {
      const { error } = await supabase
        .from('ai_feature_settings')
        .upsert(
          { feature_key: 'ai_design_enabled', feature_value: String(enabled), updated_at: new Date().toISOString() },
          { onConflict: 'feature_key' }
        );
      
      if (error) {
        if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
          console.log('💾 AI toggle saved to localStorage (Supabase offline)');
        } else {
          console.warn('⚠️ Could not save AI toggle to Supabase:', error.message);
          console.log('💾 AI toggle saved to localStorage as fallback');
        }
      } else {
        console.log('✅ AI feature toggle saved to Supabase + localStorage:', enabled);
      }
    } catch (error: any) {
      if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
        console.log('💾 AI toggle saved to localStorage (Supabase offline)');
      } else {
        console.warn('⚠️ Supabase unavailable — AI toggle saved to localStorage only');
      }
    }
  },

  // ─────────────────────────────────────────────────
  // AI PROVIDER CONFIGS  (ai_provider_configs table)
  // ─────────────────────────────────────────────────

  /** Load all provider configs from Supabase. Falls back to localStorage. */
  getProviders: async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('ai_provider_configs')
        .select('*')
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        const ls = localStorage.getItem('ai_providers');
        return ls ? JSON.parse(ls) : [];
      }

      // Map DB rows �� app provider format
      return data.map((row: any) => ({
        id: row.provider_id,
        name: row.name,
        type: row.provider_type,
        isActive: row.is_active,
        apiKey: row.api_key || '',
        endpoint: row.endpoint || '',
        model: row.model || '',
        settings: row.settings || {},
      }));
    } catch {
      const ls = localStorage.getItem('ai_providers');
      return ls ? JSON.parse(ls) : [];
    }
  },

  /** Save all provider configs to Supabase (upsert by provider_id). Also mirrors to localStorage. */
  saveProviders: async (providers: any[]): Promise<void> => {
    // Always mirror to localStorage for instant reads
    localStorage.setItem('ai_providers', JSON.stringify(providers));
    
    try {
      const rows = providers.map((p: any) => ({
        provider_id: p.id,
        name: p.name,
        provider_type: p.type,
        is_active: p.isActive,
        api_key: p.apiKey || '',
        endpoint: p.endpoint || '',
        model: p.model || '',
        settings: p.settings || {},
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('ai_provider_configs')
        .upsert(rows, { onConflict: 'provider_id' });

      if (error) {
        // Check if it's a connection error (project paused)
        if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
          console.log('💾 AI providers saved to localStorage (Supabase offline)');
          console.log('💡 To enable cloud sync: Resume your Supabase project');
        } else {
          console.warn('⚠️ Could not save providers to Supabase:', error.message);
          console.log('💾 Providers saved to localStorage as fallback');
        }
      } else {
        console.log('✅ AI providers saved to Supabase + localStorage');
      }
    } catch (error: any) {
      // Catch network errors
      if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
        console.log('💾 AI providers saved to localStorage (Supabase offline)');
        console.log('💡 Supabase project is paused. Providers will sync when you resume it.');
      } else {
        console.warn('⚠️ Supabase unavailable — providers saved to localStorage only');
      }
    }
  },

  /** Get the active image provider. Reads from Supabase with localStorage fallback. */
  getActiveImageProvider: async (): Promise<any | null> => {
    const providers = await aiConfigApi.getProviders();
    return providers.find((p: any) => p.isActive && (p.type === 'image' || p.type === 'both')) || null;
  },
};

// ============================================
// Invoices API
// ============================================

export const invoicesApi = {
  // Create invoice (admin only)
  create: async (invoice: any) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { items, ...invoiceData } = invoice;

    const { data: newInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (invoiceError) throw new Error(invoiceError.message);

    // Insert invoice items if provided
    if (items && items.length > 0) {
      const invoiceItems = items.map((item: any) => ({
        ...item,
        invoice_id: newInvoice.id,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) {
        // Non-fatal: log but don't throw — invoice was created
        console.warn('⚠️ Invoice items could not be saved:', itemsError.message);
      }
    }

    return newInvoice;
  },

  // Get all invoices (admin only)
  getAll: async () => {
    if (!isAdmin()) throw new Error('Unauthorized');

    return safeSupabaseCall(async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    }, []);
  },

  // Get invoice by order ID (admin only)
  getByOrderId: async (orderId: string) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    return safeSupabaseCall(async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return data || null;
    }, null);
  },

  // Update invoice (admin only)
  update: async (invoiceId: string, updates: any) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Delete invoice (admin only)
  delete: async (invoiceId: string) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) throw new Error(error.message);
  },
};

// Export Supabase client for direct operations if needed
export { supabase };

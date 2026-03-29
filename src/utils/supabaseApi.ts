// Supabase API utilities with silent error handling
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './supabase/info';

declare global {
  var __supabaseClient: any;
  var __supabaseClientInitialized: boolean;
}

const getSupabaseClient = () => {
  // Create client only once per page load
  if (!globalThis.__supabaseClientInitialized) {
    try {
      const client = createClient(
        `https://${projectId}.supabase.co`,
        publicAnonKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'toodies-auth',
          }
        }
      );
      
      globalThis.__supabaseClient = client;
      globalThis.__supabaseClientInitialized = true;
      
      console.log('✅ Supabase client initialized for project:', projectId);
      
      // Test connection (async - doesn't block)
      setTimeout(async () => {
        try {
          const { error } = await globalThis.__supabaseClient
            .from('users')
            .select('id')
            .limit(1);
          
          if (error) {
            if (error.message?.includes('Failed to fetch')) {
              console.error('❌ SUPABASE CONNECTION FAILED: Cannot reach database');
              console.error('Possible causes:');
              console.error('1. Supabase project is paused or deleted');
              console.error('2. Network/CORS issues');
              console.error('3. Invalid credentials');
              console.error(`Project: https://${projectId}.supabase.co`);
            } else if (error.message?.includes('infinite recursion')) {
              console.error('❌ DATABASE ERROR: Row Level Security policies have infinite recursion');
              console.error('📝 Fix: Run the SQL script in /database/setup.sql in your Supabase SQL Editor');
            } else {
              console.error('❌ Database error:', error.message);
            }
          } else {
            console.log('✅ Supabase database connection verified');
          }
        } catch (e) {
          console.error('❌ Supabase connection test failed:', e);
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error);
      // Return a mock client for offline mode
      globalThis.__supabaseClient = {
        auth: {
          signInWithPassword: async () => ({ data: null, error: new Error('Offline mode') }),
          signUp: async () => ({ data: null, error: new Error('Offline mode') }),
          signOut: async () => ({ error: null }),
          getUser: async () => ({ data: { user: null }, error: new Error('Offline mode') })
        },
        from: () => ({
          select: () => ({ eq: () => ({ single: async () => ({ data: null, error: new Error('Offline mode') }) }) }),
          insert: async () => ({ data: null, error: new Error('Offline mode') }),
          update: () => ({ eq: async () => ({ data: null, error: new Error('Offline mode') }) }),
          delete: () => ({ eq: async () => ({ data: null, error: new Error('Offline mode') }) })
        })
      };
      globalThis.__supabaseClientInitialized = true;
    }
  }
  return globalThis.__supabaseClient;
};

const supabase = getSupabaseClient();

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
// App expects: name, email_verified
function mapUserFields(dbUser: any): any {
  if (!dbUser) return null;
  const { full_name, is_verified, password, ...rest } = dbUser;
  return {
    ...rest,
    name: full_name,
    email_verified: is_verified
  };
}

// ============================================
// Authentication API (Using Supabase Auth)
// ============================================

export const authApi = {
  // Initialize admin account (using Supabase Auth)
  initializeAdmin: async () => {
    try {
      const adminEmail = 'm78787531@gmail.com';
      const adminPassword = '9886510858@TcbToponeAdmin';

      // Check if admin already exists in public.users table
      const { data: existingAdmin, error: checkError } = await supabase
        .from('users')
        .select('id, email')
        .eq('role', 'admin')
        .limit(1)
        .single();

      if (existingAdmin) {
        console.log('✅ Admin already exists');
        return { message: 'Admin already exists' };
      }

      console.log('⚠️ Admin creation skipped - use bypass login');
      return { message: 'Use bypass login' };
    } catch (error: any) {
      console.error('❌ Admin initialization error:', error);
      throw error;
    }
  },

  // Admin signup (for compatibility - now calls initializeAdmin)
  adminSignup: async (email: string, password: string, name: string) => {
    return authApi.initializeAdmin();
  },

  // Admin signin (using Supabase Auth)
  adminSignin: async (email: string, password: string) => {
    console.log('🔐 ===== ADMIN LOGIN - SUPABASE AUTH =====');
    console.log('Attempting login with Supabase Auth...');
    console.log('Email:', email);

    try {
      // Use Supabase Auth to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Supabase Auth error:', error.message);
        throw new Error('Invalid credentials. Please check your email and password.');
      }

      if (!data.user) {
        console.error('❌ No user returned from Supabase Auth');
        throw new Error('Authentication failed. Please try again.');
      }

      console.log('✅ Supabase Auth successful - User ID:', data.user.id);

      // Get user profile from public.users table to check role
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('❌ Failed to fetch user profile:', profileError);
        throw new Error('User profile not found. Please contact administrator.');
      }

      // Verify user is admin
      if (userProfile.role !== 'admin') {
        console.error('❌ User is not an admin. Role:', userProfile.role);
        // Sign out the user since they're not admin
        await supabase.auth.signOut();
        throw new Error('Access denied. Admin privileges required.');
      }

      console.log('✅ Admin role verified');

      // Map database fields to app fields
      const mappedUser = mapUserFields(userProfile);

      // Store user info
      localStorage.setItem('toodies_access_token', data.session?.access_token || '');
      localStorage.setItem('toodies_user', JSON.stringify(mappedUser));

      console.log('✅ Admin login successful');
      console.log('===== END LOGIN =====');

      return {
        access_token: data.session?.access_token || '',
        user: mappedUser,
      };
    } catch (error: any) {
      console.error('❌ Admin signin failed:', error);
      throw error;
    }
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

    // Create corresponding entry in public.users table
    const { error: publicUserError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name: name,  // Database uses 'full_name' not 'name'
        role: 'customer',
        is_verified: false,  // Database uses 'is_verified' not 'email_verified'
      });

    if (publicUserError) {
      throw new Error(publicUserError.message);
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

    // Map database fields to app fields
    const mappedUser = mapUserFields(userProfile);

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
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_variations (*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Get single product
  getById: async (productId: string) => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_variations (*)
      `)
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
      .select(`
        *,
        order_items (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Get all orders (admin only)
  getAll: async () => {
    if (!isAdmin()) throw new Error('Unauthorized');

    return safeSupabaseCall(async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
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
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

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
      const { data, error } = await supabase
        .from('business_info')
        .select('*')
        .limit(1)
        .single();

      // Handle "no rows" error gracefully (table empty)
      if (error && error.code === 'PGRST116') {
        return {}; // Return empty object if no data
      }
      
      // Handle table not found error silently (migration not run yet)
      if (error && (error.code === '42P01' || error.message.includes('Could not find the table'))) {
        return {}; // Return empty object - will use localStorage fallback
      }
      
      if (error) {
        return {}; // Return empty object on any error
      }
      
      return data || {};
    } catch (error) {
      // Silent fallback - migration not run yet
      return {};
    }
  },

  // Save business settings (admin only)
  saveBusiness: async (settings: any) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    // Check if settings exist
    const { data: existing } = await supabase
      .from('business_info')
      .select('id')
      .limit(1)
      .single();

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
    const { data, error } = await supabase
      .from('three_d_model_configs')
      .select('*')
      .eq('product_id', productId)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
  },

  // Save model config (admin only)
  save: async (config: any) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    // Check if config exists for this product
    const { data: existing } = await supabase
      .from('three_d_model_configs')
      .select('id')
      .eq('product_id', config.product_id)
      .single();

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

export const cartApi = {
  // Get user's cart items
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

  // Add item to cart
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

  // Update cart item quantity
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

  // Remove item from cart
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

  // Clear entire cart
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
  // Get AI config (admin only)
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

  // Save AI config (admin only)
  save: async (config: any) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    // Check if config exists
    const { data: existing } = await supabase
      .from('ai_config')
      .select('id')
      .limit(1)
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('ai_config')
        .update(config)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('ai_config')
        .insert(config)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }
  },
};

// ============================================
// Invoices API
// ============================================

export const invoicesApi = {
  // Get invoice by order ID
  getByOrderId: async (orderId: string) => {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*)
      `)
      .eq('order_id', orderId)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
  },

  // Create invoice (admin only)
  create: async (invoiceData: any) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { items, ...invoice } = invoiceData;

    // Insert invoice
    const { data: newInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoice)
      .select()
      .single();

    if (invoiceError) throw new Error(invoiceError.message);

    // Insert invoice items
    if (items && items.length > 0) {
      const invoiceItems = items.map((item: any) => ({
        ...item,
        invoice_id: newInvoice.id,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw new Error(itemsError.message);
    }

    return newInvoice;
  },

  // Update invoice (admin only)
  update: async (invoiceId: string, invoiceData: any) => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { items, ...invoice } = invoiceData;

    // Update invoice
    const { data: updatedInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .update(invoice)
      .eq('id', invoiceId)
      .select()
      .single();

    if (invoiceError) throw new Error(invoiceError.message);

    // Update invoice items if provided
    if (items) {
      // Delete existing items
      await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);

      // Insert new items
      if (items.length > 0) {
        const invoiceItems = items.map((item: any) => ({
          ...item,
          invoice_id: invoiceId,
        }));

        await supabase
          .from('invoice_items')
          .insert(invoiceItems);
      }
    }

    return updatedInvoice;
  },
};

// ============================================
// Chat Conversations API
// ============================================

export const chatApi = {
  // Get all conversations (admin only)
  getAllConversations: async () => {
    if (!isAdmin()) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Get user's conversations
  getMyConversations: async () => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Get messages for a conversation
  getMessages: async (conversationId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Create conversation
  createConversation: async (conversation: any) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        ...conversation,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Send message
  sendMessage: async (message: any) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert(message)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Update conversation's updated_at
    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', message.conversation_id);

    return data;
  },

  // Update conversation
  updateConversation: async (conversationId: string, updates: any) => {
    const { data, error } = await supabase
      .from('chat_conversations')
      .update(updates)
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};

// Export Supabase client for direct operations if needed
export { supabase };
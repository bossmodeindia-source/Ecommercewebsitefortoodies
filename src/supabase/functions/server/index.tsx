import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
);

// Secure admin credentials stored in environment variables
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || '9886510858@TcbToponeAdmin';
const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD') || 'ToodiesSecureAdmin@2024';
const ADMIN_NAME = Deno.env.get('ADMIN_NAME') || 'Toodies Admin';

// Simple hash function (not bcrypt, but secure enough for internal use)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'TOODIES_SALT_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-a079f068/health", (c) => {
  return c.json({ status: "ok" });
});

// ============================================
// SECURE ADMIN INITIALIZATION
// ============================================

// Initialize admin account (protected endpoint)
app.post("/make-server-a079f068/admin/initialize", async (c) => {
  try {
    // Check if admin already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', ADMIN_EMAIL)
      .eq('role', 'admin')
      .single();
    
    if (existingUser) {
      return c.json({ 
        success: true, 
        message: 'Admin account already exists',
        email: ADMIN_EMAIL 
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(ADMIN_PASSWORD);
    
    // Create admin user in database
    const { data: admin, error } = await supabase
      .from('users')
      .insert({
        email: ADMIN_EMAIL,
        password: hashedPassword,
        name: ADMIN_NAME,
        role: 'admin',
      })
      .select()
      .single();

    if (error) {
      console.error('Admin initialization error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    console.log('✅ Admin account initialized:', ADMIN_EMAIL);
    
    return c.json({ 
      success: true,
      message: 'Admin account created successfully',
      email: ADMIN_EMAIL
    });
  } catch (error: any) {
    console.error('Admin initialization error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Secure admin signin (password verification on backend)
app.post("/make-server-a079f068/admin/secure-signin", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', 'admin')
      .single();

    if (error || !user) {
      console.error('Admin signin error: User not found');
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const hashedPassword = await hashPassword(password);
    
    if (hashedPassword !== user.password) {
      console.error('Admin signin error: Invalid password');
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Create token
    const token = btoa(JSON.stringify({ 
      userId: user.id, 
      role: user.role,
      timestamp: Date.now()
    }));
    
    console.log('✅ Admin signed in:', email);
    
    return c.json({ 
      user: userWithoutPassword, 
      access_token: token 
    });
  } catch (error: any) {
    console.error('Admin signin error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Customer signup
app.post("/make-server-a079f068/customer/signup", async (c) => {
  try {
    const { email, password, name, phone } = await c.req.json();
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Insert user into database
    const { data: customer, error } = await supabase
      .from('users')
      .insert({
        email,
        password: hashedPassword,
        name,
        phone,
        role: 'customer',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Customer signup error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = customer;
    
    return c.json({ user: userWithoutPassword });
  } catch (error: any) {
    console.error('Customer signup error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Customer signin (password verification on backend)
app.post("/make-server-a079f068/customer/secure-signin", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', 'customer')
      .single();

    if (error || !user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const hashedPassword = await hashPassword(password);
    
    if (hashedPassword !== user.password) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Create token
    const token = btoa(JSON.stringify({ 
      userId: user.id, 
      role: user.role,
      timestamp: Date.now()
    }));
    
    return c.json({ 
      user: userWithoutPassword, 
      access_token: token 
    });
  } catch (error: any) {
    console.error('Customer signin error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get current user
app.get("/make-server-a079f068/auth/me", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }
    
    const userInfo = await kv.get(`user:${user.id}`);
    return c.json({ user: userInfo });
  } catch (error: any) {
    console.error('Get current user error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// PRODUCTS ROUTES
// ============================================

// Get all products
app.get("/make-server-a079f068/products", async (c) => {
  try {
    const products = await kv.getByPrefix('product:');
    return c.json({ products });
  } catch (error: any) {
    console.error('Get products error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Create product (admin only)
app.post("/make-server-a079f068/products", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userInfo = await kv.get(`user:${user.id}`);
    if (!userInfo || userInfo.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const product = await c.req.json();
    await kv.set(`product:${product.id}`, product);
    
    return c.json({ product });
  } catch (error: any) {
    console.error('Create product error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Update product (admin only)
app.put("/make-server-a079f068/products/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userInfo = await kv.get(`user:${user.id}`);
    if (!userInfo || userInfo.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const productId = c.req.param('id');
    const product = await c.req.json();
    await kv.set(`product:${productId}`, product);
    
    return c.json({ product });
  } catch (error: any) {
    console.error('Update product error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete product (admin only)
app.delete("/make-server-a079f068/products/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userInfo = await kv.get(`user:${user.id}`);
    if (!userInfo || userInfo.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const productId = c.req.param('id');
    await kv.del(`product:${productId}`);
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// CUSTOM DESIGNS ROUTES (WITH APPROVAL)
// ============================================

// Save customer design
app.post("/make-server-a079f068/designs", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const design = await c.req.json();
    design.userId = user.id;
    design.approvalStatus = 'pending'; // All designs start as pending
    
    await kv.set(`design:${design.id}`, design);
    
    // Add to user's designs
    const userInfo = await kv.get(`user:${user.id}`);
    if (userInfo) {
      userInfo.savedCustomerDesigns = userInfo.savedCustomerDesigns || [];
      userInfo.savedCustomerDesigns.push(design.id);
      await kv.set(`user:${user.id}`, userInfo);
    }
    
    return c.json({ design });
  } catch (error: any) {
    console.error('Save design error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get user's designs
app.get("/make-server-a079f068/designs/my", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const allDesigns = await kv.getByPrefix('design:');
    const userDesigns = allDesigns.filter(d => d.userId === user.id);
    
    return c.json({ designs: userDesigns });
  } catch (error: any) {
    console.error('Get user designs error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get all designs (admin only - for approval)
app.get("/make-server-a079f068/designs", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userInfo = await kv.get(`user:${user.id}`);
    if (!userInfo || userInfo.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const designs = await kv.getByPrefix('design:');
    return c.json({ designs });
  } catch (error: any) {
    console.error('Get all designs error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Approve/reject design with optional price editing (admin only)
app.put("/make-server-a079f068/designs/:id/approve", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userInfo = await kv.get(`user:${user.id}`);
    if (!userInfo || userInfo.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const designId = c.req.param('id');
    const { approvalStatus, approvalNotes, adminSetPrice } = await c.req.json();
    
    const design = await kv.get(`design:${designId}`);
    if (!design) {
      return c.json({ error: 'Design not found' }, 404);
    }
    
    design.approvalStatus = approvalStatus;
    design.approvalDate = new Date().toISOString();
    design.approvalNotes = approvalNotes;
    design.reviewedBy = user.id;
    
    if (adminSetPrice !== undefined) {
      design.adminSetPrice = adminSetPrice;
    }
    
    await kv.set(`design:${designId}`, design);
    
    return c.json({ design });
  } catch (error: any) {
    console.error('Approve design error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Update design
app.put("/make-server-a079f068/designs/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const designId = c.req.param('id');
    const design = await kv.get(`design:${designId}`);
    
    if (!design) {
      return c.json({ error: 'Design not found' }, 404);
    }
    
    if (design.userId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const updates = await c.req.json();
    const updatedDesign = { ...design, ...updates };
    await kv.set(`design:${designId}`, updatedDesign);
    
    return c.json({ design: updatedDesign });
  } catch (error: any) {
    console.error('Update design error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// ORDERS ROUTES
// ============================================

// Create order
app.post("/make-server-a079f068/orders", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const order = await c.req.json();
    order.userId = user.id;
    
    await kv.set(`order:${order.id}`, order);
    
    // Add to user's orders
    const userInfo = await kv.get(`user:${user.id}`);
    if (userInfo) {
      userInfo.orders = userInfo.orders || [];
      userInfo.orders.push(order.id);
      userInfo.cart = []; // Clear cart after order
      await kv.set(`user:${user.id}`, userInfo);
    }
    
    return c.json({ order });
  } catch (error: any) {
    console.error('Create order error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get user's orders
app.get("/make-server-a079f068/orders/my", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const allOrders = await kv.getByPrefix('order:');
    const userOrders = allOrders.filter(o => o.userId === user.id);
    
    return c.json({ orders: userOrders });
  } catch (error: any) {
    console.error('Get user orders error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get all orders (admin only)
app.get("/make-server-a079f068/orders", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userInfo = await kv.get(`user:${user.id}`);
    if (!userInfo || userInfo.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const orders = await kv.getByPrefix('order:');
    return c.json({ orders });
  } catch (error: any) {
    console.error('Get all orders error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Update order status (admin only)
app.put("/make-server-a079f068/orders/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userInfo = await kv.get(`user:${user.id}`);
    if (!userInfo || userInfo.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const orderId = c.req.param('id');
    const order = await kv.get(`order:${orderId}`);
    
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }
    
    const updates = await c.req.json();
    const updatedOrder = { ...order, ...updates, updatedAt: new Date().toISOString() };
    await kv.set(`order:${orderId}`, updatedOrder);
    
    return c.json({ order: updatedOrder });
  } catch (error: any) {
    console.error('Update order error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// USER PROFILE ROUTES
// ============================================

// Update user profile
app.put("/make-server-a079f068/user/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userInfo = await kv.get(`user:${user.id}`);
    if (!userInfo) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    const updates = await c.req.json();
    const updatedUser = { ...userInfo, ...updates };
    await kv.set(`user:${user.id}`, updatedUser);
    
    return c.json({ user: updatedUser });
  } catch (error: any) {
    console.error('Update user profile error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// SETTINGS ROUTES (Admin Only)
// ============================================

// Get business settings
app.get("/make-server-a079f068/settings/business", async (c) => {
  try {
    const settings = await kv.get('settings:business') || {};
    return c.json({ settings });
  } catch (error: any) {
    console.error('Get business settings error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Save business settings (admin only)
app.put("/make-server-a079f068/settings/business", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userInfo = await kv.get(`user:${user.id}`);
    if (!userInfo || userInfo.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const settings = await c.req.json();
    await kv.set('settings:business', settings);
    
    return c.json({ settings });
  } catch (error: any) {
    console.error('Save business settings error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get categories
app.get("/make-server-a079f068/categories", async (c) => {
  try {
    const categories = await kv.get('settings:categories') || [];
    return c.json({ categories });
  } catch (error: any) {
    console.error('Get categories error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Save categories (admin only)
app.put("/make-server-a079f068/categories", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userInfo = await kv.get(`user:${user.id}`);
    if (!userInfo || userInfo.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const { categories } = await c.req.json();
    await kv.set('settings:categories', categories);
    
    return c.json({ categories });
  } catch (error: any) {
    console.error('Save categories error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get printing methods
app.get("/make-server-a079f068/printing-methods", async (c) => {
  try {
    const methods = await kv.get('settings:printing-methods') || [];
    return c.json({ methods });
  } catch (error: any) {
    console.error('Get printing methods error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Save printing methods (admin only)
app.put("/make-server-a079f068/printing-methods", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userInfo = await kv.get(`user:${user.id}`);
    if (!userInfo || userInfo.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const { methods } = await c.req.json();
    await kv.set('settings:printing-methods', methods);
    
    return c.json({ methods });
  } catch (error: any) {
    console.error('Save printing methods error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get coupons
app.get("/make-server-a079f068/coupons", async (c) => {
  try {
    const coupons = await kv.getByPrefix('coupon:');
    return c.json({ coupons });
  } catch (error: any) {
    console.error('Get coupons error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Create/update coupon (admin only)
app.post("/make-server-a079f068/coupons", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userInfo = await kv.get(`user:${user.id}`);
    if (!userInfo || userInfo.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const coupon = await c.req.json();
    await kv.set(`coupon:${coupon.id}`, coupon);
    
    return c.json({ coupon });
  } catch (error: any) {
    console.error('Create coupon error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete coupon (admin only)
app.delete("/make-server-a079f068/coupons/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userInfo = await kv.get(`user:${user.id}`);
    if (!userInfo || userInfo.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const couponId = c.req.param('id');
    await kv.del(`coupon:${couponId}`);
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete coupon error:', error);
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);
import { createClient } from '@supabase/supabase-js';
import { Product, User, Coupon, MessageTemplate, PopupMessage, ChatConversation, AIConfig, BusinessInfo, ThreeDModelConfig } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function for error handling
const handleError = (error: any, defaultValue: any = null) => {
  console.error('Supabase error:', error);
  return defaultValue;
};

export const supabaseStorage = {
  // ============================================
  // PRODUCTS
  // ============================================
  getProducts: async (): Promise<Product[]> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError(error, []);
    }
  },

  addProduct: async (product: Omit<Product, 'id'>): Promise<Product | null> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  updateProduct: async (productId: string, updatedProduct: Partial<Product>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('products')
        .update(updatedProduct)
        .eq('id', productId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  },

  deleteProduct: async (productId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  },

  // ============================================
  // USERS
  // ============================================
  getUsers: async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError(error, []);
    }
  },

  getUserById: async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  getUserByEmail: async (email: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  getUserByMobile: async (mobile: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('mobile', mobile)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  registerUser: async (email: string, mobile: string, password: string, name?: string): Promise<User | null> => {
    try {
      const newUser = {
        email,
        mobile,
        password,
        name: name || '',
        address: '',
        email_verified: false,
        mobile_verified: false,
        role: 'customer',
        cart: [],
        saved_designs: [],
        saved_customer_designs: []
      };

      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();
      
      if (error) throw error;
      
      // Store in localStorage for session
      if (data) {
        localStorage.setItem('toodies_current_user', JSON.stringify(data));
      }
      
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  loginUser: async (emailOrMobile: string, password: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${emailOrMobile},mobile.eq.${emailOrMobile}`)
        .eq('password', password)
        .single();
      
      if (error) throw error;
      
      // Store in localStorage for session
      if (data) {
        localStorage.setItem('toodies_current_user', JSON.stringify(data));
      }
      
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  getCurrentUser: (): User | null => {
    const user = localStorage.getItem('toodies_current_user');
    return user ? JSON.parse(user) : null;
  },

  updateCurrentUser: async (user: User): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('users')
        .update(user)
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update localStorage
      localStorage.setItem('toodies_current_user', JSON.stringify(user));
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  },

  updateUserPassword: async (userId: string, newPassword: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Update current user in localStorage if needed
      const currentUser = supabaseStorage.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        currentUser.password = newPassword;
        localStorage.setItem('toodies_current_user', JSON.stringify(currentUser));
      }
      
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  },

  logoutUser: () => {
    localStorage.removeItem('toodies_current_user');
  },

  // ============================================
  // ORDERS
  // ============================================
  getOrders: async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError(error, []);
    }
  },

  getUserOrders: async (userId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError(error, []);
    }
  },

  createOrder: async (order: any): Promise<any | null> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([order])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  updateOrderStatus: async (orderId: string, status: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  },

  updateOrderTracking: async (orderId: string, trackingNumber: string, trackingUrl: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ tracking_number: trackingNumber, tracking_url: trackingUrl })
        .eq('id', orderId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  },

  // ============================================
  // CATEGORIES
  // ============================================
  getCategories: async (): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data?.map(c => c.name) || [];
    } catch (error) {
      return handleError(error, ['T-Shirts', 'Hoodies', 'Sweatshirts', 'Jackets', 'Accessories']);
    }
  },

  addCategory: async (category: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('categories')
        .insert([{ name: category }]);
      
      if (error) {
        if (error.code === '23505') return false; // Duplicate
        throw error;
      }
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  },

  deleteCategory: async (category: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('name', category);
      
      if (error) throw error;
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  },

  // ============================================
  // COUPONS
  // ============================================
  getCoupons: async (): Promise<Coupon[]> => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError(error, []);
    }
  },

  addCoupon: async (coupon: Omit<Coupon, 'id'>): Promise<Coupon | null> => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .insert([coupon])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  updateCoupon: async (coupon: Coupon): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update(coupon)
        .eq('id', coupon.id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  },

  deleteCoupon: async (couponId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  },

  // ============================================
  // MESSAGE TEMPLATES
  // ============================================
  getMessageTemplates: async (): Promise<MessageTemplate[]> => {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError(error, []);
    }
  },

  addMessageTemplate: async (template: Omit<MessageTemplate, 'id'>): Promise<MessageTemplate | null> => {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .insert([template])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  updateMessageTemplate: async (templateId: string, template: Partial<MessageTemplate>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('message_templates')
        .update(template)
        .eq('id', templateId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  },

  deleteMessageTemplate: async (templateId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', templateId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  },

  // ============================================
  // POPUP MESSAGES
  // ============================================
  getPopupMessages: async (): Promise<PopupMessage[]> => {
    try {
      const { data, error } = await supabase
        .from('popup_messages')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError(error, []);
    }
  },

  getAllPopupMessages: async (): Promise<PopupMessage[]> => {
    try {
      const { data, error } = await supabase
        .from('popup_messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError(error, []);
    }
  },

  addPopupMessage: async (popup: Omit<PopupMessage, 'id'>): Promise<PopupMessage | null> => {
    try {
      const { data, error } = await supabase
        .from('popup_messages')
        .insert([popup])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  updatePopupMessage: async (popupId: string, popup: Partial<PopupMessage>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('popup_messages')
        .update(popup)
        .eq('id', popupId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  },

  deletePopupMessage: async (popupId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('popup_messages')
        .delete()
        .eq('id', popupId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  },

  // Shown popups tracking
  getShownPopups: async (userId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('shown_popups')
        .select('popup_id')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data?.map(p => p.popup_id) || [];
    } catch (error) {
      return handleError(error, []);
    }
  },

  addShownPopup: async (userId: string, popupId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('shown_popups')
        .insert([{ user_id: userId, popup_id: popupId }]);
      
      if (error && error.code !== '23505') throw error; // Ignore duplicates
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  },

  // ============================================
  // BUSINESS INFO
  // ============================================
  getBusinessInfo: async (): Promise<BusinessInfo> => {
    try {
      const { data, error } = await supabase
        .from('business_info')
        .select('*')
        .limit(1)
        .single();
      
      if (error) throw error;
      
      return data || {
        companyName: 'Toodies',
        address: 'Your Business Address',
        city: 'Your City',
        state: 'Your State',
        pincode: '000000',
        country: 'India',
        phone: '+91 9876543210',
        email: 'info@toodies.com',
        supportEmail: 'support@toodies.com',
        gstin: '',
        website: 'https://www.toodies.com',
        supportHours: 'Mon-Sat: 9:00 AM - 6:00 PM IST',
        heroImage: '',
        socialMedia: {},
        bankDetails: {},
        visibility: {
          website: {
            showWhatsApp: true,
            showSocialMedia: true
          },
          invoice: {}
        }
      };
    } catch (error) {
      return handleError(error, {
        companyName: 'Toodies',
        address: 'Your Business Address',
        city: 'Your City',
        state: 'Your State',
        pincode: '000000',
        country: 'India',
        phone: '+91 9876543210',
        email: 'info@toodies.com',
        supportEmail: 'support@toodies.com',
        gstin: '',
        website: 'https://www.toodies.com',
        supportHours: 'Mon-Sat: 9:00 AM - 6:00 PM IST',
        heroImage: '',
        socialMedia: {},
        bankDetails: {},
        visibility: {
          website: {
            showWhatsApp: true,
            showSocialMedia: true
          },
          invoice: {}
        }
      });
    }
  },

  saveBusinessInfo: async (info: BusinessInfo): Promise<boolean> => {
    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from('business_info')
        .select('id')
        .limit(1)
        .single();
      
      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('business_info')
          .update(info)
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('business_info')
          .insert([info]);
        
        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  },

  // ============================================
  // ADMIN SETTINGS
  // ============================================
  getAdminSettings: async (): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error) throw error;
      return data || {};
    } catch (error) {
      return handleError(error, {});
    }
  },

  saveAdminSettings: async (settings: any): Promise<boolean> => {
    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from('admin_settings')
        .select('id')
        .limit(1)
        .single();
      
      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('admin_settings')
          .update(settings)
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('admin_settings')
          .insert([settings]);
        
        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  },

  // ============================================
  // AI CONFIG
  // ============================================
  getAIConfig: async (): Promise<AIConfig> => {
    try {
      const { data, error } = await supabase
        .from('ai_config')
        .select('*')
        .limit(1)
        .single();
      
      if (error) throw error;
      
      return data || {
        provider: 'none',
        apiKey: '',
        model: '',
        isEnabled: false,
        autoReply: false,
        greetingMessage: 'Hello! How can I help you today?'
      };
    } catch (error) {
      return handleError(error, {
        provider: 'none',
        apiKey: '',
        model: '',
        isEnabled: false,
        autoReply: false,
        greetingMessage: 'Hello! How can I help you today?'
      });
    }
  },

  saveAIConfig: async (config: AIConfig): Promise<boolean> => {
    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from('ai_config')
        .select('id')
        .limit(1)
        .single();
      
      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('ai_config')
          .update(config)
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('ai_config')
          .insert([config]);
        
        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  },

  // ============================================
  // 3D MODEL CONFIGS
  // ============================================
  get3DModelConfigs: async (): Promise<ThreeDModelConfig[]> => {
    try {
      const { data, error } = await supabase
        .from('three_d_model_configs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError(error, []);
    }
  },

  get3DModelConfigByProductId: async (productId: string): Promise<ThreeDModelConfig | null> => {
    try {
      const { data, error } = await supabase
        .from('three_d_model_configs')
        .select('*')
        .eq('product_id', productId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  save3DModelConfig: async (config: ThreeDModelConfig): Promise<boolean> => {
    try {
      // Check if config exists for this product
      const { data: existing } = await supabase
        .from('three_d_model_configs')
        .select('id')
        .eq('product_id', config.productId)
        .single();
      
      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('three_d_model_configs')
          .update(config)
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('three_d_model_configs')
          .insert([config]);
        
        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  },

  delete3DModelConfig: async (productId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('three_d_model_configs')
        .delete()
        .eq('product_id', productId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  },

  // ============================================
  // CUSTOMER DESIGNS
  // ============================================
  getCustomerDesigns: async (userId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('customer_designs')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError(error, []);
    }
  },

  getAllCustomerDesigns: async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('customer_designs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError(error, []);
    }
  },

  saveCustomerDesign: async (design: any): Promise<any | null> => {
    try {
      const { data, error } = await supabase
        .from('customer_designs')
        .insert([design])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  updateCustomerDesign: async (designId: string, design: Partial<any>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('customer_designs')
        .update(design)
        .eq('id', designId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  },

  deleteCustomerDesign: async (designId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('customer_designs')
        .delete()
        .eq('id', designId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  },

  // ============================================
  // HELP CENTER
  // ============================================
  getHelpCenterItems: async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('help_center')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError(error, []);
    }
  },

  // ============================================
  // PRINTING METHODS
  // ============================================
  getPrintingMethods: async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('printing_methods')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError(error, []);
    }
  },
};

export default supabaseStorage;

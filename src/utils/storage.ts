import { Product, User, Coupon, MessageTemplate, PopupMessage, ChatConversation, ChatMessage, AIConfig, BusinessInfo, ThreeDModelConfig } from '../types';

const ADMIN_PASSWORD = '9886510858@Tcbadmin'; // Change this in production
const PRODUCTS_KEY = 'toodies_products';
const USERS_KEY = 'toodies_users';
const CURRENT_USER_KEY = 'toodies_current_user';
const ADMIN_AUTH_KEY = 'toodies_admin_auth';
const ORDERS_KEY = 'toodies_orders';
const ADMIN_SETTINGS_KEY = 'toodies_admin_settings';
const CATEGORIES_KEY = 'toodies_categories';
const COUPONS_KEY = 'toodies_coupons';
const MESSAGE_TEMPLATES_KEY = 'toodies_message_templates';
const POPUP_MESSAGES_KEY = 'toodies_popup_messages';
const SHOWN_POPUPS_KEY = 'toodies_shown_popups'; // Track which popups have been shown
const CHAT_CONVERSATIONS_KEY = 'toodies_chat_conversations';
const AI_CONFIG_KEY = 'toodies_ai_config';
const BUSINESS_INFO_KEY = 'toodies_business_info';
const THREE_D_MODEL_CONFIG_KEY = 'toodies_3d_model_configs';
const THREE_D_WEBSITE_INTEGRATION_KEY = 'toodies_3d_website_integration';

export const storageUtils = {
  // Admin Authentication
  verifyAdminPassword: (password: string): boolean => {
    return password === ADMIN_PASSWORD;
  },

  setAdminAuth: (isAuthenticated: boolean) => {
    localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(isAuthenticated));
  },

  isAdminAuthenticated: (): boolean => {
    const auth = localStorage.getItem(ADMIN_AUTH_KEY);
    return auth ? JSON.parse(auth) : false;
  },

  logoutAdmin: () => {
    localStorage.removeItem(ADMIN_AUTH_KEY);
  },

  // Products
  getProducts: (): Product[] => {
    const products = localStorage.getItem(PRODUCTS_KEY);
    const parsedProducts = products ? JSON.parse(products) : [];
    // Migrate old products without images array
    return parsedProducts.map((p: Product) => ({
      ...p,
      images: p.images || []
    }));
  },

  saveProducts: (products: Product[]) => {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  },

  addProduct: (product: Product) => {
    const products = storageUtils.getProducts();
    products.push(product);
    storageUtils.saveProducts(products);
  },

  updateProduct: (productId: string, updatedProduct: Product) => {
    const products = storageUtils.getProducts();
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
      products[index] = updatedProduct;
      storageUtils.saveProducts(products);
    }
  },

  deleteProduct: (productId: string) => {
    const products = storageUtils.getProducts();
    const filtered = products.filter(p => p.id !== productId);
    storageUtils.saveProducts(filtered);
  },

  // Users
  getUsers: (): User[] => {
    const users = localStorage.getItem(USERS_KEY);
    const parsedUsers = users ? JSON.parse(users) : [];
    // Migrate old users
    return parsedUsers.map((u: User) => ({
      ...u,
      createdAt: u.createdAt || new Date().toISOString(),
      savedDesigns: u.savedDesigns || []
    }));
  },

  saveUsers: (users: User[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  registerUser: (email: string, mobile: string, password: string, name?: string): User => {
    const users = storageUtils.getUsers();
    const newUser: User = {
      id: Date.now().toString(),
      email,
      mobile,
      password,
      name: name || '',
      address: '',
      emailVerified: false,
      mobileVerified: false,
      cart: [],
      orders: [],
      savedDesigns: [],
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    storageUtils.saveUsers(users);
    return newUser;
  },

  loginUser: (emailOrMobile: string, password: string): User | null => {
    const users = storageUtils.getUsers();
    const user = users.find(
      u => (u.email === emailOrMobile || u.mobile === emailOrMobile) && u.password === password
    );
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  getCurrentUser: (): User | null => {
    const user = localStorage.getItem(CURRENT_USER_KEY);
    if (!user) return null;
    const parsed = JSON.parse(user);
    return {
      ...parsed,
      savedDesigns: parsed.savedDesigns || []
    };
  },

  // Create or get guest user for design purposes
  getOrCreateGuestUser: (): User => {
    const currentUser = storageUtils.getCurrentUser();
    if (currentUser) return currentUser;

    // Check for existing guest user
    const users = storageUtils.getUsers();
    let guestUser = users.find(u => u.email === 'guest@toodies.local');

    if (!guestUser) {
      // Create new guest user
      guestUser = {
        id: 'guest_' + Date.now(),
        email: 'guest@toodies.local',
        mobile: '',
        password: '',
        name: 'Guest User',
        address: '',
        emailVerified: false,
        mobileVerified: false,
        cart: [],
        orders: [],
        savedDesigns: [],
        createdAt: new Date().toISOString()
      };
      users.push(guestUser);
      storageUtils.saveUsers(users);
    }

    // Auto-login guest user
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(guestUser));
    return guestUser;
  },

  updateCurrentUser: (user: User) => {
    try {
      // Clean up old designs before saving
      const updatedUser = { ...user, savedDesigns: user.savedDesigns || [] };
      
      // Separate auto-save designs (no images) from full designs (with images)
      const customerDesigns = updatedUser.savedCustomerDesigns || [];
      const fullDesigns = customerDesigns.filter(d => !d.isAutoSave && d.canvasSnapshot);
      const autoSaveDesigns = customerDesigns.filter(d => d.isAutoSave);
      
      // Keep only most recent 5 full designs (with images) and 5 auto-saves
      const recentFullDesigns = fullDesigns
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5);
      
      const recentAutoSaves = autoSaveDesigns
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5);
      
      updatedUser.savedCustomerDesigns = [...recentFullDesigns, ...recentAutoSaves];
      
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      const users = storageUtils.getUsers();
      const index = users.findIndex(u => u.id === user.id);
      if (index !== -1) {
        users[index] = updatedUser;
        storageUtils.saveUsers(users);
      }
    } catch (error: any) {
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded. Emergency cleanup...');
        
        // Emergency cleanup: keep only 2 full designs with images
        const emergencyUser = { ...user, savedDesigns: user.savedDesigns || [] };
        const customerDesigns = emergencyUser.savedCustomerDesigns || [];
        const fullDesigns = customerDesigns.filter(d => !d.isAutoSave && d.canvasSnapshot);
        
        // Keep only 2 most recent with images
        emergencyUser.savedCustomerDesigns = fullDesigns
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 2);
        
        // Try again with minimal data
        try {
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(emergencyUser));
          const users = storageUtils.getUsers();
          const index = users.findIndex(u => u.id === user.id);
          if (index !== -1) {
            users[index] = emergencyUser;
            storageUtils.saveUsers(users);
          }
          console.log('Emergency cleanup successful - kept 2 most recent designs');
        } catch (retryError) {
          console.error('Failed to save even after emergency cleanup:', retryError);
          throw retryError;
        }
      } else {
        throw error;
      }
    }
  },

  getUserByMobile: (mobile: string): User | null => {
    const users = storageUtils.getUsers();
    return users.find(u => u.mobile === mobile) || null;
  },

  getUserById: (userId: string): User | null => {
    const users = storageUtils.getUsers();
    return users.find(u => u.id === userId) || null;
  },

  updateUserPassword: (userId: string, newPassword: string) => {
    const users = storageUtils.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index].password = newPassword;
      storageUtils.saveUsers(users);
      
      // Update current user if logged in
      const currentUser = storageUtils.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        currentUser.password = newPassword;
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
      }
    }
  },

  logoutUser: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  // Orders
  getOrders: (): any[] => {
    const orders = localStorage.getItem(ORDERS_KEY);
    return orders ? JSON.parse(orders) : [];
  },

  saveOrders: (orders: any[]) => {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  },

  createOrder: (order: any) => {
    const orders = storageUtils.getOrders();
    orders.push(order);
    storageUtils.saveOrders(orders);
    
    // Update user's orders
    const user = storageUtils.getCurrentUser();
    if (user) {
      user.orders.push(order);
      user.cart = [];
      storageUtils.updateCurrentUser(user);
    }
    
    return order;
  },

  updateOrderTracking: (orderId: string, trackingNumber: string, trackingUrl: string) => {
    const orders = storageUtils.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index].trackingNumber = trackingNumber;
      orders[index].trackingUrl = trackingUrl;
      storageUtils.saveOrders(orders);
      
      // Update user's order as well
      const users = storageUtils.getUsers();
      const userIndex = users.findIndex(u => u.id === orders[index].userId);
      if (userIndex !== -1) {
        const orderIdx = users[userIndex].orders.findIndex(o => o.id === orderId);
        if (orderIdx !== -1) {
          users[userIndex].orders[orderIdx].trackingNumber = trackingNumber;
          users[userIndex].orders[orderIdx].trackingUrl = trackingUrl;
          storageUtils.saveUsers(users);
        }
      }
    }
  },

  updateOrderStatus: (orderId: string, status: string) => {
    const orders = storageUtils.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index].status = status;
      storageUtils.saveOrders(orders);
      
      // Update user's order as well
      const users = storageUtils.getUsers();
      const userIndex = users.findIndex(u => u.id === orders[index].userId);
      if (userIndex !== -1) {
        const orderIdx = users[userIndex].orders.findIndex(o => o.id === orderId);
        if (orderIdx !== -1) {
          users[userIndex].orders[orderIdx].status = status;
          storageUtils.saveUsers(users);
        }
      }
    }
  },

  // Admin Settings
  getAdminSettings: (): { 
    whatsappNumber: string; 
    gmail: string; 
    razorpayKeyId?: string; 
    razorpayKeySecret?: string; 
    razorpayEnabled?: boolean; 
    designerUrl?: string;
    paymentMethods?: {
      razorpay: boolean;
      upi: boolean;
      cod: boolean;
      netbanking: boolean;
      wallet: boolean;
      emi: boolean;
    };
    whatsappApiToken?: string;
    whatsappPhoneNumberId?: string;
    whatsappEnabled?: boolean;
    gmailApiKey?: string;
    gmailClientId?: string;
    gmailClientSecret?: string;
    smtpHost?: string;
    smtpPort?: string;
    smtpUsername?: string;
    smtpPassword?: string;
    emailEnabled?: boolean;
    emailProvider?: 'gmail' | 'smtp' | 'sendgrid';
    // SMS API Configuration
    smsEnabled?: boolean;
    smsProvider?: 'twilio' | 'msg91' | 'aws-sns' | 'other';
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioPhoneNumber?: string;
    msg91AuthKey?: string;
    msg91SenderId?: string;
    msg91TemplateId?: string;
    awsSnsAccessKeyId?: string;
    awsSnsSecretAccessKey?: string;
    awsSnsRegion?: string;
    otherSmsApiUrl?: string;
    otherSmsApiKey?: string;
    otherSmsApiMethod?: 'GET' | 'POST';
    // SEO & Analytics
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    analyticsEnabled?: boolean;
    companyGSTIN?: string;
    companyAddress?: string;
    companyLogo?: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankIFSC?: string;
    bankName?: string;
  } => {
    const settings = localStorage.getItem(ADMIN_SETTINGS_KEY);
    return settings ? JSON.parse(settings) : { 
      whatsappNumber: '', 
      gmail: '', 
      razorpayKeyId: '', 
      razorpayKeySecret: '', 
      razorpayEnabled: false, 
      designerUrl: '',
      paymentMethods: {
        razorpay: true,
        upi: true,
        cod: true,
        netbanking: true,
        wallet: true,
        emi: true
      },
      whatsappApiToken: '',
      whatsappPhoneNumberId: '',
      whatsappEnabled: false,
      gmailApiKey: '',
      gmailClientId: '',
      gmailClientSecret: '',
      smtpHost: '',
      smtpPort: '',
      smtpUsername: '',
      smtpPassword: '',
      emailEnabled: false,
      emailProvider: 'gmail',
      // SMS API defaults
      smsEnabled: false,
      smsProvider: 'twilio',
      twilioAccountSid: '',
      twilioAuthToken: '',
      twilioPhoneNumber: '',
      msg91AuthKey: '',
      msg91SenderId: '',
      msg91TemplateId: '',
      awsSnsAccessKeyId: '',
      awsSnsSecretAccessKey: '',
      awsSnsRegion: 'us-east-1',
      otherSmsApiUrl: '',
      otherSmsApiKey: '',
      otherSmsApiMethod: 'POST',
      // SEO & Analytics defaults
      googleAnalyticsId: '',
      facebookPixelId: '',
      analyticsEnabled: false,
      companyGSTIN: '',
      companyAddress: '',
      companyLogo: '',
      bankAccountName: '',
      bankAccountNumber: '',
      bankIFSC: '',
      bankName: ''
    };
  },

  saveAdminSettings: (
    whatsappNumber: string, 
    gmail: string, 
    razorpayKeyId?: string, 
    razorpayKeySecret?: string, 
    razorpayEnabled?: boolean, 
    designerUrl?: string,
    paymentMethods?: {
      razorpay: boolean;
      upi: boolean;
      cod: boolean;
      netbanking: boolean;
      wallet: boolean;
      emi: boolean;
    },
    whatsappApiToken?: string,
    whatsappPhoneNumberId?: string,
    whatsappEnabled?: boolean,
    gmailApiKey?: string,
    gmailClientId?: string,
    gmailClientSecret?: string,
    smtpHost?: string,
    smtpPort?: string,
    smtpUsername?: string,
    smtpPassword?: string,
    emailEnabled?: boolean,
    emailProvider?: 'gmail' | 'smtp' | 'sendgrid',
    companyGSTIN?: string,
    companyAddress?: string,
    companyLogo?: string,
    bankAccountName?: string,
    bankAccountNumber?: string,
    bankIFSC?: string,
    bankName?: string,
    // SMS API parameters
    smsEnabled?: boolean,
    smsProvider?: 'twilio' | 'msg91' | 'aws-sns' | 'other',
    twilioAccountSid?: string,
    twilioAuthToken?: string,
    twilioPhoneNumber?: string,
    msg91AuthKey?: string,
    msg91SenderId?: string,
    msg91TemplateId?: string,
    awsSnsAccessKeyId?: string,
    awsSnsSecretAccessKey?: string,
    awsSnsRegion?: string,
    otherSmsApiUrl?: string,
    otherSmsApiKey?: string,
    otherSmsApiMethod?: 'GET' | 'POST',
    // SEO & Analytics parameters
    googleAnalyticsId?: string,
    facebookPixelId?: string,
    analyticsEnabled?: boolean,
    // Background Removal API parameters
    backgroundRemovalApiKey?: string,
    backgroundRemovalEnabled?: boolean
  ) => {
    const currentSettings = storageUtils.getAdminSettings();
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify({ 
      whatsappNumber, 
      gmail,
      razorpayKeyId: razorpayKeyId || '',
      razorpayKeySecret: razorpayKeySecret || '',
      razorpayEnabled: razorpayEnabled || false,
      designerUrl: designerUrl || '',
      paymentMethods: paymentMethods || currentSettings.paymentMethods,
      whatsappApiToken: whatsappApiToken || '',
      whatsappPhoneNumberId: whatsappPhoneNumberId || '',
      whatsappEnabled: whatsappEnabled || false,
      gmailApiKey: gmailApiKey || '',
      gmailClientId: gmailClientId || '',
      gmailClientSecret: gmailClientSecret || '',
      smtpHost: smtpHost || '',
      smtpPort: smtpPort || '',
      smtpUsername: smtpUsername || '',
      smtpPassword: smtpPassword || '',
      emailEnabled: emailEnabled || false,
      emailProvider: emailProvider || 'gmail',
      // SMS API settings
      smsEnabled: smsEnabled || false,
      smsProvider: smsProvider || 'twilio',
      twilioAccountSid: twilioAccountSid || '',
      twilioAuthToken: twilioAuthToken || '',
      twilioPhoneNumber: twilioPhoneNumber || '',
      msg91AuthKey: msg91AuthKey || '',
      msg91SenderId: msg91SenderId || '',
      msg91TemplateId: msg91TemplateId || '',
      awsSnsAccessKeyId: awsSnsAccessKeyId || '',
      awsSnsSecretAccessKey: awsSnsSecretAccessKey || '',
      awsSnsRegion: awsSnsRegion || 'us-east-1',
      otherSmsApiUrl: otherSmsApiUrl || '',
      otherSmsApiKey: otherSmsApiKey || '',
      otherSmsApiMethod: otherSmsApiMethod || 'POST',
      // SEO & Analytics settings
      googleAnalyticsId: googleAnalyticsId || '',
      facebookPixelId: facebookPixelId || '',
      analyticsEnabled: analyticsEnabled || false,
      // Background Removal API settings
      backgroundRemovalApiKey: backgroundRemovalApiKey || '',
      backgroundRemovalEnabled: backgroundRemovalEnabled || false,
      companyGSTIN: companyGSTIN || '',
      companyAddress: companyAddress || '',
      companyLogo: companyLogo || '',
      bankAccountName: bankAccountName || '',
      bankAccountNumber: bankAccountNumber || '',
      bankIFSC: bankIFSC || '',
      bankName: bankName || ''
    }));
  },

  // Categories
  getCategories: (): string[] => {
    const categories = localStorage.getItem(CATEGORIES_KEY);
    const defaultCategories = ['T-Shirts', 'Hoodies', 'Sweatshirts', 'Jackets', 'Accessories'];
    return categories ? JSON.parse(categories) : defaultCategories;
  },

  saveCategories: (categories: string[]) => {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  },

  addCategory: (category: string) => {
    const categories = storageUtils.getCategories();
    if (!categories.includes(category)) {
      categories.push(category);
      storageUtils.saveCategories(categories);
      return true;
    }
    return false;
  },

  deleteCategory: (category: string) => {
    const categories = storageUtils.getCategories();
    const filtered = categories.filter(c => c !== category);
    storageUtils.saveCategories(filtered);
  },

  // Coupons
  getCoupons: (): Coupon[] => {
    const coupons = localStorage.getItem(COUPONS_KEY);
    return coupons ? JSON.parse(coupons) : [];
  },

  saveCoupons: (coupons: Coupon[]) => {
    localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
  },

  addCoupon: (coupon: Coupon) => {
    const coupons = storageUtils.getCoupons();
    coupons.push(coupon);
    storageUtils.saveCoupons(coupons);
  },

  updateCoupon: (updatedCoupon: Coupon) => {
    const coupons = storageUtils.getCoupons();
    const index = coupons.findIndex(c => c.id === updatedCoupon.id);
    if (index !== -1) {
      coupons[index] = updatedCoupon;
      storageUtils.saveCoupons(coupons);
    }
  },

  deleteCoupon: (couponId: string) => {
    const coupons = storageUtils.getCoupons();
    const filtered = coupons.filter(c => c.id !== couponId);
    storageUtils.saveCoupons(filtered);
  },

  // Message Templates
  getMessageTemplates: (): MessageTemplate[] => {
    const templates = localStorage.getItem(MESSAGE_TEMPLATES_KEY);
    return templates ? JSON.parse(templates) : [];
  },

  saveMessageTemplates: (templates: MessageTemplate[]) => {
    localStorage.setItem(MESSAGE_TEMPLATES_KEY, JSON.stringify(templates));
  },

  addMessageTemplate: (template: MessageTemplate) => {
    const templates = storageUtils.getMessageTemplates();
    templates.push(template);
    storageUtils.saveMessageTemplates(templates);
  },

  updateMessageTemplate: (templateId: string, updatedTemplate: MessageTemplate) => {
    const templates = storageUtils.getMessageTemplates();
    const index = templates.findIndex(t => t.id === templateId);
    if (index !== -1) {
      templates[index] = updatedTemplate;
      storageUtils.saveMessageTemplates(templates);
    }
  },

  deleteMessageTemplate: (templateId: string) => {
    const templates = storageUtils.getMessageTemplates();
    const filtered = templates.filter(t => t.id !== templateId);
    storageUtils.saveMessageTemplates(filtered);
  },

  // Popup Messages
  getPopupMessages: (): PopupMessage[] => {
    const popups = localStorage.getItem(POPUP_MESSAGES_KEY);
    return popups ? JSON.parse(popups) : [];
  },

  savePopupMessages: (popups: PopupMessage[]) => {
    localStorage.setItem(POPUP_MESSAGES_KEY, JSON.stringify(popups));
  },

  addPopupMessage: (popup: PopupMessage) => {
    const popups = storageUtils.getPopupMessages();
    popups.push(popup);
    storageUtils.savePopupMessages(popups);
  },

  updatePopupMessage: (popupId: string, updatedPopup: PopupMessage) => {
    const popups = storageUtils.getPopupMessages();
    const index = popups.findIndex(p => p.id === popupId);
    if (index !== -1) {
      popups[index] = updatedPopup;
      storageUtils.savePopupMessages(popups);
    }
  },

  deletePopupMessage: (popupId: string) => {
    const popups = storageUtils.getPopupMessages();
    const filtered = popups.filter(p => p.id !== popupId);
    storageUtils.savePopupMessages(filtered);
  },

  // Shown Popups
  getShownPopups: (): string[] => {
    const shownPopups = localStorage.getItem(SHOWN_POPUPS_KEY);
    return shownPopups ? JSON.parse(shownPopups) : [];
  },

  saveShownPopups: (shownPopups: string[]) => {
    localStorage.setItem(SHOWN_POPUPS_KEY, JSON.stringify(shownPopups));
  },

  addShownPopup: (popupId: string) => {
    const shownPopups = storageUtils.getShownPopups();
    if (!shownPopups.includes(popupId)) {
      shownPopups.push(popupId);
      storageUtils.saveShownPopups(shownPopups);
    }
  },

  removeShownPopup: (popupId: string) => {
    const shownPopups = storageUtils.getShownPopups();
    const filtered = shownPopups.filter(p => p !== popupId);
    storageUtils.saveShownPopups(filtered);
  },

  // Chat Conversations
  getChatConversations: (): ChatConversation[] => {
    const conversations = localStorage.getItem(CHAT_CONVERSATIONS_KEY);
    return conversations ? JSON.parse(conversations) : [];
  },

  saveChatConversations: (conversations: ChatConversation[]) => {
    localStorage.setItem(CHAT_CONVERSATIONS_KEY, JSON.stringify(conversations));
  },

  addChatConversation: (conversation: ChatConversation) => {
    const conversations = storageUtils.getChatConversations();
    conversations.push(conversation);
    storageUtils.saveChatConversations(conversations);
  },

  updateChatConversation: (conversationId: string, updatedConversation: ChatConversation) => {
    const conversations = storageUtils.getChatConversations();
    const index = conversations.findIndex(c => c.id === conversationId);
    if (index !== -1) {
      conversations[index] = updatedConversation;
      storageUtils.saveChatConversations(conversations);
    }
  },

  deleteChatConversation: (conversationId: string) => {
    const conversations = storageUtils.getChatConversations();
    const filtered = conversations.filter(c => c.id !== conversationId);
    storageUtils.saveChatConversations(filtered);
  },

  // AI Config
  getAIConfig: (): AIConfig => {
    const config = localStorage.getItem(AI_CONFIG_KEY);
    return config ? JSON.parse(config) : { 
      provider: 'none',
      apiKey: '', 
      model: '', 
      isEnabled: false, 
      autoReply: false, 
      greetingMessage: 'Hello! How can I help you today?' 
    };
  },

  saveAIConfig: (config: AIConfig) => {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
  },

  // Invoice Management
  saveInvoice: (invoice: any) => {
    // Save invoice by updating the related order
    const orders = storageUtils.getOrders();
    const orderIndex = orders.findIndex(o => o.id === invoice.orderId);
    if (orderIndex !== -1) {
      orders[orderIndex].invoice = invoice;
      storageUtils.saveOrders(orders);
    }
  },

  // Business Information
  getBusinessInfo: (): BusinessInfo => {
    const info = localStorage.getItem(BUSINESS_INFO_KEY);
    return info ? JSON.parse(info) : {
      companyName: 'Toodies',
      address: 'Your Business Address',
      city: 'Your City',
      state: 'Your State',
      pincode: '000000',
      country: 'India',
      phone: '+91 9876543210',
      email: 'info@toodies.com',
      supportEmail: 'support@toodies.com',
      gstin: 'YOUR_GSTIN_NUMBER',
      website: 'https://www.toodies.com',
      supportHours: 'Mon-Sat: 9:00 AM - 6:00 PM IST',
      heroImage: '', // Default empty, admin can upload
      socialMedia: {
        facebook: '',
        instagram: '',
        twitter: '',
        linkedin: ''
      },
      bankDetails: {
        accountName: 'Toodies',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        branchName: ''
      },
      visibility: {
        website: {
          showAddress: true,
          showPhone: true,
          showEmail: true,
          showSupportEmail: true,
          showSupportHours: true,
          showSocialMedia: true,
          showGSTIN: false,
          showWhatsApp: true
        },
        invoice: {
          showFullAddress: true,
          showPhone: true,
          showEmail: true,
          showGSTIN: true,
          showWebsite: false,
          showBankDetails: true
        }
      }
    };
  },

  saveBusinessInfo: (info: BusinessInfo) => {
    localStorage.setItem(BUSINESS_INFO_KEY, JSON.stringify(info));
  },

  // 3D Model Configs
  get3DModelConfigs: (): ThreeDModelConfig[] => {
    const configs = localStorage.getItem(THREE_D_MODEL_CONFIG_KEY);
    return configs ? JSON.parse(configs) : [];
  },

  save3DModelConfigs: (configs: ThreeDModelConfig[]) => {
    // Remove glbFileUrl from configs before saving to prevent quota exceeded errors
    const configsToSave = configs.map(config => {
      const { glbFileUrl, ...configWithoutGlb } = config;
      return configWithoutGlb;
    });
    
    try {
      localStorage.setItem(THREE_D_MODEL_CONFIG_KEY, JSON.stringify(configsToSave));
    } catch (error) {
      console.error('Failed to save 3D model configs to localStorage:', error);
      if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        // Handle quota exceeded
        alert('Browser storage is full! Please use smaller image files (max 1-2MB recommended) for 2D mockups.');
      }
    }
  },

  add3DModelConfig: (config: ThreeDModelConfig) => {
    const configs = storageUtils.get3DModelConfigs();
    // Remove glbFileUrl before adding to prevent quota exceeded errors
    const { glbFileUrl, ...configWithoutGlb } = config;
    configs.push(configWithoutGlb as ThreeDModelConfig);
    storageUtils.save3DModelConfigs(configs);
  },

  update3DModelConfig: (updatedConfig: ThreeDModelConfig) => {
    const configs = storageUtils.get3DModelConfigs();
    const index = configs.findIndex(c => c.id === updatedConfig.id);
    if (index !== -1) {
      // Remove glbFileUrl before updating to prevent quota exceeded errors
      const { glbFileUrl, ...configWithoutGlb } = updatedConfig;
      configs[index] = configWithoutGlb as ThreeDModelConfig;
      storageUtils.save3DModelConfigs(configs);
    }
  },

  delete3DModelConfig: (configId: string) => {
    const configs = storageUtils.get3DModelConfigs();
    const filtered = configs.filter(c => c.id !== configId);
    storageUtils.save3DModelConfigs(filtered);
  },

  get3DModelConfigByProductId: (productId: string): ThreeDModelConfig | null => {
    const configs = storageUtils.get3DModelConfigs();
    return configs.find(c => c.productId === productId) || null;
  },

  // 3D Website Integration
  get3DWebsiteIntegration: (): any => {
    const integration = localStorage.getItem(THREE_D_WEBSITE_INTEGRATION_KEY);
    return integration ? JSON.parse(integration) : {
      id: '1',
      websiteUrl: 'https://github.com/bossmodeindia-source/toodies-3d-studio',
      isEnabled: false,
      designCategories: ['T-Shirts', 'Hoodies', 'Sweatshirts'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  save3DWebsiteIntegration: (integration: any) => {
    localStorage.setItem(THREE_D_WEBSITE_INTEGRATION_KEY, JSON.stringify(integration));
  },

  update3DWebsiteIntegration: (updates: Partial<any>) => {
    const current = storageUtils.get3DWebsiteIntegration();
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    storageUtils.save3DWebsiteIntegration(updated);
  }
};
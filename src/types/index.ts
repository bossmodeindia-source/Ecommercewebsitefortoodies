// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  mobile?: string;           // alias used by localStorage auth
  address?: string;
  role: 'admin' | 'customer';
  createdAt: string;
  // Verification flags (camelCase used everywhere in the app)
  emailVerified?: boolean;
  mobileVerified?: boolean;
  // Legacy / extended fields
  savedCustomerDesigns?: any[];
  savedDesigns?: CustomDesign[]; // Legacy designs
  cart?: CartItem[];
  orders?: any[];
  isGuest?: boolean;
  // Supabase mapped extras (kept for compatibility)
  email_verified?: boolean;
  is_verified?: boolean;
}

// Product Types
export interface ProductVariation {
  id: string;
  color: string;
  size: string;
  price: number;
  stock: number;
  sku?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  variations: ProductVariation[];
  images: string[];
  image?: string; // Legacy: Main product image
  createdAt: string;
  updatedAt?: string;
  isActive?: boolean;
  tags?: string[];
  gender?: 'men' | 'women' | 'unisex';
  printingMethods?: string[]; // Available printing methods for the product
  // Payment options
  allowPrepaid?: boolean; // Allow full prepaid payment
  allowPostpaid?: boolean; // Allow COD/postpaid payment
  partialPaymentPercentage?: number; // Percentage required for partial payment (e.g., 30)
  codExtraCharge?: number; // Extra charge for COD (e.g., 50)
  // Custom design payment settings
  customDesignAllowPostpaid?: boolean; // Allow postpaid for custom designs
  customDesignPartialPaymentPercentage?: number; // Partial payment % for custom designs
}

// Order Types
export interface CartItem {
  productId: string;
  variationId: string;
  quantity: number;
  customDesignUrl?: string; // 3D design link
  twoDDesignData?: any; // 2D designer data
}

export interface OrderItem {
  productId: string;
  productName: string;
  variationId: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
  customDesignUrl?: string;
  twoDDesignData?: any;
}

export interface Order {
  id: string;
  orderNumber?: string; // TDS format order number
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  userMobile?: string;       // alias used by notification service
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  date?: string;             // alias for createdAt used by storageUtils
  updatedAt: string;
  shippingAddress?: string;
  paymentMethod?: string;
  paymentId?: string;
  trackingNumber?: string;
  invoiceId?: string;
  // Payment flags
  notificationSent?: boolean;
  discount?: number;
  couponCode?: string;
  paymentStatus?: 'pending' | 'completed' | 'failed';
  // Razorpay
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  // Prepaid payment tracking
  prepaidAmount?: number;
  prepaidDate?: string;
  prepaidReference?: string;
  prepaidNotes?: string;
  remainingAmount?: number;
}

// Custom Design Types
export interface CustomDesign {
  id: string;
  userId?: string;
  name: string;
  designUrl?: string; // URL to the design
  productId: string;
  productName?: string;
  variationId?: string;
  color?: string;
  size?: string;
  category?: string;
  designUploads?: any[];
  createdAt: string;
  updatedAt?: string;
  status?: 'draft' | 'completed';
}

// Coupon Types
export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  applicableCategories?: string[];
  applicableProducts?: string[];
  createdAt: string;
}

// Message Template Types
export interface MessageTemplate {
  id: string;
  name: string;
  type: 'order_confirmation' | 'shipping_update' | 'delivery_confirmation' | 'custom';
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Popup Message Types
export interface PopupMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'promo';
  buttonText?: string;
  buttonLink?: string;
  showOnPages: ('home' | 'products' | 'cart' | 'all')[];
  displayFrequency: 'once' | 'daily' | 'always';
  isActive: boolean;
  validFrom?: string;
  validUntil?: string;
  createdAt: string;
}

// Chat Types
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'customer';
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: 'open' | 'closed';
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

// AI Configuration Types
export interface AIConfig {
  enabled: boolean;
  provider: 'openai' | 'custom';
  apiKey?: string;
  model?: string;
  temperature?: number;
  systemPrompt?: string;
  autoReply: boolean;
  autoReplyDelay?: number;
  fallbackToHuman: boolean;
  confidenceThreshold?: number;
}

// Business Info Types
export interface BusinessInfo {
  companyName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
  email: string;
  supportEmail?: string;
  whatsapp?: string;
  gstin: string;
  website?: string;
  supportHours?: string;
  heroImage?: string; // Admin-uploaded hero/banner image for landing page
  // Gifting Templates
  neckLabelTemplate?: string;
  thankYouCardTemplate?: string;
  boxTemplate?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName?: string;
  };
  visibility?: {
    website: {
      showAddress: boolean;
      showPhone: boolean;
      showEmail: boolean;
      showSupportEmail: boolean;
      showSupportHours: boolean;
      showSocialMedia: boolean;
      showGSTIN: boolean;
      showWhatsApp: boolean;
    };
    invoice: {
      showFullAddress: boolean;
      showPhone: boolean;
      showEmail: boolean;
      showGSTIN: boolean;
      showWebsite: boolean;
      showBankDetails: boolean;
    };
  };
}

// 2D Designer Types
export interface PrintingMethod {
  id: string;
  name: string;
  description: string;
  technicalSpecs?: string; // Technical specifications or language code
  previewInstructions?: string; // Instructions for 2D designer preview
  
  // Pricing: Cost per square inch (₹/inch²)
  costPerSquareInch: number;
  
  // Minimum charge (optional) - for very small designs
  minimumCharge?: number;
  
  isActive: boolean;
  enabled?: boolean; // Admin can enable/disable this method
  showPrice?: boolean; // Admin can show/hide price to customers
  createdAt?: string;
  printArea?: {
    x: number; // X position as percentage (0-100)
    y: number; // Y position as percentage (0-100)
    width: number; // Width as percentage (0-100)
    height: number; // Height as percentage (0-100)
  };
  visualEffect?: {
    type: 'embroidery' | 'vinyl' | 'screen-print' | 'dtg' | 'heat-transfer' | 'none';
    // CSS filters for preview
    filter?: string; // e.g., "brightness(1.2) contrast(1.1)"
    // Texture overlay
    textureUrl?: string;
    textureOpacity?: number; // 0-1
    // Border/outline effects
    outline?: {
      width: number;
      color: string;
      style: 'solid' | 'dashed' | 'dotted';
    };
    // Shadow effects
    shadow?: {
      offsetX: number;
      offsetY: number;
      blur: number;
      color: string;
    };
    // 3D effect simulation
    emboss?: boolean;
    // Glossiness for vinyl
    glossy?: boolean;
  };
}

export interface ThreeDModelConfig {
  id: string;
  productId: string;
  modelUrl: string; // 2D mockup image URL
  glbFileUrl?: string; // Not used for 2D
  availableColors: string[];
  availableSizes: string[];
  availableFabrics: string[];
  printingMethods: PrintingMethod[];
  defaultColor?: string;
  defaultSize?: string;
  defaultFabric?: string;
  modelPrice?: number; // Base price for the model/product (in INR)
  
  // Print Resolution Settings
  printDPI?: number; // Default: 300 DPI
  canvasWidthInches?: number; // Physical width of printable area in inches
  canvasHeightInches?: number; // Physical height of printable area in inches
  
  createdAt: string;
  updatedAt: string;
  category?: string; // Product category for grouping
}

export interface CustomerDesignUpload {
  id: string;
  imageUrl: string;
  // 3D position/rotation/scale (for old 3D designs)
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  area?: 'Front' | 'Back' | 'Left' | 'Right';
  // 2D position/rotation/size (for new 2D designs)
  x?: number; // Percentage
  y?: number; // Percentage
  width?: number; // Pixels
  height?: number; // Pixels
  widthInches?: number; // Actual print size in inches
  heightInches?: number; // Actual print size in inches
  areaSquareInches?: number; // Calculated print area
  rotationDegrees?: number; // Rotation in degrees
  printingMethodId?: string; // Which printing method for this layer
  printingCost?: number; // Calculated cost for this layer
}

// Saved Customer Design (from 2D Designer with full data)
export interface SavedCustomerDesign {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  productId: string;
  productName: string;
  color: string;
  size: string;
  fabric: string;
  printingMethod: string;
  printingCost: number;
  totalCost: number;
  designUploads: CustomerDesignUpload[];
  thumbnailUrl?: string;
  canvasSnapshot?: string;
  createdAt: string;
  updatedAt?: string;
  status?: 'saved' | 'ordered';
  orderId?: string;
  paymentStatus?: 'unpaid' | 'paid';
  // Gifting fields
  isGifting?: boolean;
  neckLabel?: {
    text: string;
    color: string;
    size: string;
  };
  thankYouCard?: {
    text?: string;
    customImage?: string;
  };
  box?: {
    text?: string;
    color?: string;
  };
  // Admin approval fields
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvalDate?: string;
  approvalNotes?: string; // Admin's reason for approval/rejection
  reviewedBy?: string; // Admin ID who reviewed
  // Admin price override
  adminSetPrice?: number; // Admin-defined price (overrides calculated cost)
  showPrintingCost?: boolean; // Show printing method cost breakdown to customer
  priceBreakdown?: {
    baseProductPrice?: number;
    printingCost?: number;
    additionalCharges?: number;
    discount?: number;
  };
}

// Invoice Types
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber?: string;
  date: string;
  dueDate?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax?: number;
  taxRate?: number;
  discount?: number;
  shippingCost?: number;
  total: number;
  notes?: string;
  terms?: string;
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}
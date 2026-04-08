import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Palette, Package, User as UserIcon, X, Menu, LogOut, Search, Bell, HeadphonesIcon, MessageCircle } from 'lucide-react';
import { OrderTracking } from './OrderTracking';
import { CustomerProfile } from './CustomerProfile';
import { EnhancedPaymentDialog } from './EnhancedPaymentDialog';
import { CheckoutDialog } from './CheckoutDialog';
import { PopupDisplay } from './PopupDisplay';
import { ShoppingCart } from './ShoppingCart';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { SavedDesigns } from './SavedDesigns';
import { StudioMyCustomDesigns } from './StudioMyCustomDesigns';
import { HelpCenter } from './HelpCenter';

import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Badge } from './ui/badge';

import { User, Product, CartItem, Order, CustomDesign } from '../types';
import { storageUtils } from '../utils/storage';
import { notificationService } from '../utils/notifications';
import { toast } from 'sonner@2.0.3';
import { productsApi, authApi, cartApi } from '../utils/supabaseApi';

import toodiesLogo from 'figma:asset/d31f1d417f75594ba1ab67a4c64ef32e85ec2234.png';

interface CustomerDashboardProps {
  user: User;
  onLogout: () => void;
  onOpen2DStudio?: () => void;
}

export function CustomerDashboard({ user, onLogout, onOpen2DStudio }: CustomerDashboardProps) {
  const [activeTab, setActiveTab] = useState('shop');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(user.cart || []);
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [is3DDesignerOpen, setIs3DDesignerOpen] = useState(false);
  const [selected3DProduct, setSelected3DProduct] = useState<Product | null>(null);
  const [editingDesignId, setEditingDesignId] = useState<string | undefined>(undefined);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [checkoutDiscount, setCheckoutDiscount] = useState(0);
  const [checkoutCouponCode, setCheckoutCouponCode] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [customDesignUrl, setCustomDesignUrl] = useState('');
  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Store original cart for Buy Now restoration
  const [originalCart, setOriginalCart] = useState<CartItem[] | null>(null);

  // Help Center button dragging
  const [helpButtonPosition, setHelpButtonPosition] = useState({ x: 0, y: 0 });
  const [isHelpButtonDragging, setIsHelpButtonDragging] = useState(false);
  const [dragHasMoved, setDragHasMoved] = useState(false);
  const helpButtonDragStart = useRef({ x: 0, y: 0 });
  const helpButtonMouseStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    loadProducts();
    refreshUser();
    loadSupabaseCart();

    // Check for notifications
    const popups = storageUtils.getPopupMessages();
    const userPopups = popups.filter(p => 
      p.isActive && 
      (p.targetAudience === 'all' || 
      (user.emailVerified ? p.targetAudience === 'verified' : p.targetAudience === 'unverified'))
    );
    setNotificationCount(userPopups.length);

    // Initial mobile check
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, selectedCategory, selectedGender]);

  /**
   * On mount: try to pull cart from Supabase (cross-device persistence).
   * Merges with any localStorage cart so items added before login aren't lost.
   */
  const loadSupabaseCart = async () => {
    try {
      const supabaseCart = await cartApi.getCart();
      if (supabaseCart.length === 0) return; // nothing in Supabase, keep localStorage cart

      // Merge: for items in Supabase, use those quantities; keep local-only items
      setCart(prev => {
        const merged = [...supabaseCart];
        prev.forEach(localItem => {
          const alreadySynced = merged.find(
            s => s.productId === localItem.productId && s.variationId === localItem.variationId
          );
          if (!alreadySynced) merged.push(localItem); // local-only item (localStorage product)
        });
        return merged;
      });
    } catch {
      // Silent — localStorage cart is already in state
    }
  };

  const refreshUser = () => {
    const updatedUser = storageUtils.getCurrentUser();
    if (updatedUser) {
      setCurrentUser(updatedUser);
      setCart(updatedUser.cart || []);
    }
  };

  // Map Supabase product format → local Product type
  function mapDbProduct(dbProd: any): Product {
    // product_variations join from Supabase
    const variations = dbProd.product_variations?.length
      ? dbProd.product_variations.map((v: any) => ({
          id: v.id,
          color: v.color || '',
          size: v.size || '',
          price: (parseFloat(dbProd.base_price) || 0) + (parseFloat(v.additional_price) || 0),
          stock: v.stock_quantity ?? v.stock ?? 0,
          sku: v.sku,
        }))
      : (Array.isArray(dbProd.variations) ? dbProd.variations : []);

    const imgs = Array.isArray(dbProd.images) ? dbProd.images
      : (dbProd.image_url ? [dbProd.image_url] : []);

    return {
      id: dbProd.id,
      name: dbProd.name || '',
      description: dbProd.description || '',
      category: dbProd.category || dbProd.category_id || '',
      basePrice: parseFloat(dbProd.base_price) || 0,
      variations,
      images: imgs,
      image: imgs[0] || dbProd.image || '',
      gender: dbProd.gender || 'unisex',
      printingMethods: dbProd.printing_methods || dbProd.printingMethods || [],
      isActive: dbProd.is_active ?? true,
      createdAt: dbProd.created_at || dbProd.createdAt || new Date().toISOString(),
      allowPrepaid: dbProd.allow_prepaid ?? true,
      allowPostpaid: dbProd.allow_postpaid ?? true,
      partialPaymentPercentage: dbProd.partial_payment_percentage || 30,
      codExtraCharge: dbProd.cod_extra_charge || 50,
      customDesignAllowPostpaid: dbProd.custom_design_allow_postpaid ?? false,
      customDesignPartialPaymentPercentage: dbProd.custom_design_partial_payment_percentage || 100,
    };
  }

  const loadProducts = async () => {
    try {
      const dbProducts = await productsApi.getAll();
      if (dbProducts && dbProducts.length > 0) {
        setProducts(dbProducts.map(mapDbProduct));
        return;
      }
    } catch {
      // silent — fall back below
    }
    // Fallback to localStorage
    const allProducts = storageUtils.getProducts();
    setProducts(allProducts);
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (selectedGender !== 'all') {
      filtered = filtered.filter(p => p.gender === selectedGender || p.gender === 'unisex');
    }

    setFilteredProducts(filtered);
  };

  const categories = [...new Set(products.map(p => p.category))];

  const handleAddToCartQuick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleAddToCart = (productId: string, variationId: string, quantity: number) => {
    const existingItemIndex = cart.findIndex(
      item => item.productId === productId && item.variationId === variationId
    );

    let newCart: CartItem[];
    if (existingItemIndex >= 0) {
      newCart = [...cart];
      newCart[existingItemIndex].quantity += quantity;
    } else {
      newCart = [...cart, { productId, variationId, quantity }];
    }

    setCart(newCart);
    const updatedUser = { ...currentUser, cart: newCart };
    storageUtils.updateCurrentUser(updatedUser);
    setCurrentUser(updatedUser);

    // Persist to Supabase (fire-and-forget, silent on failure)
    const product   = products.find(p => p.id === productId);
    const variation = product?.variations.find(v => v.id === variationId);
    const newQty    = existingItemIndex >= 0 ? newCart[existingItemIndex].quantity : quantity;
    cartApi.upsert(productId, variationId, newQty, variation?.price ?? 0);

    toast.success('Added to cart!');
  };

  const handleAddToCartWithDesign = (productId: string, designUrl: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const variationId = product.variations[0].id;
    
    const existingItemIndex = cart.findIndex(
      item => item.productId === productId && item.variationId === variationId && item.customDesignUrl === designUrl
    );

    let newCart: CartItem[];
    if (existingItemIndex >= 0) {
      newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
    } else {
      newCart = [...cart, { productId, variationId, quantity: 1, customDesignUrl: designUrl }];
    }

    setCart(newCart);
    const updatedUser = { ...currentUser, cart: newCart };
    storageUtils.updateCurrentUser(updatedUser);
    setCurrentUser(updatedUser);

    // Sync to Supabase
    const variation = product.variations[0];
    const newQty = existingItemIndex >= 0 ? newCart[existingItemIndex].quantity : 1;
    cartApi.upsert(productId, variationId, newQty, variation?.price ?? 0);

    toast.success('Custom design added to cart!');
  };

  const handleUpdateQuantity = (productId: string, variationId: string, quantity: number) => {
    if (quantity < 1) return;
    
    const newCart = cart.map(item =>
      item.productId === productId && item.variationId === variationId
        ? { ...item, quantity }
        : item
    );
    setCart(newCart);
    const updatedUser = { ...currentUser, cart: newCart };
    storageUtils.updateCurrentUser(updatedUser);
    setCurrentUser(updatedUser);

    // Sync updated quantity to Supabase
    const product   = products.find(p => p.id === productId);
    const variation = product?.variations.find(v => v.id === variationId);
    cartApi.upsert(productId, variationId, quantity, variation?.price ?? 0);
  };

  const handleRemoveItem = (productId: string, variationId: string) => {
    const newCart = cart.filter(
      item => !(item.productId === productId && item.variationId === variationId)
    );
    setCart(newCart);
    const updatedUser = { ...currentUser, cart: newCart };
    storageUtils.updateCurrentUser(updatedUser);
    setCurrentUser(updatedUser);

    // Remove from Supabase
    cartApi.removeByProduct(productId, variationId);

    toast.success('Removed from cart');
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Accept both camelCase (app) and snake_case (Supabase-mapped) verification flags
    const isEmailVerified = currentUser.emailVerified || (currentUser as any).email_verified || false;
    const isMobileVerified = currentUser.mobileVerified ?? true; // default true for Supabase users

    if (!isEmailVerified) {
      toast.error('Please verify your email before placing an order');
      setActiveTab('profile');
      return;
    }

    let total = 0;
    cart.forEach(cartItem => {
      const product = products.find(p => p.id === cartItem.productId);
      if (product) {
        const variation = product.variations.find(v => v.id === cartItem.variationId);
        if (variation) {
          total += variation.price * cartItem.quantity;
        }
      }
    });

    setCheckoutTotal(total);
    setCheckoutDiscount(0);
    setCheckoutCouponCode('');
    setShippingAddress(currentUser.address || '');
    setCustomDesignUrl('');
    setIsCheckoutDialogOpen(true);
  };

  // Handle Buy Now for individual item from cart
  const handleBuyNow = (productId: string, variationId: string) => {
    const isEmailVerified = currentUser.emailVerified || (currentUser as any).email_verified || false;
    if (!isEmailVerified) {
      toast.error('Please verify your email before placing an order');
      setActiveTab('profile');
      return;
    }

    // Find the specific cart item
    const cartItem = cart.find(item => item.productId === productId && item.variationId === variationId);
    if (!cartItem) {
      toast.error('Item not found in cart');
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) {
      toast.error('Product not found');
      return;
    }

    const variation = product.variations.find(v => v.id === variationId);
    if (!variation) {
      toast.error('Product variation not found');
      return;
    }

    // Calculate total for this single item
    const total = variation.price * cartItem.quantity;

    // Temporarily store the cart and replace with single item
    const backupCart = [...cart];
    setCart([cartItem]);
    setOriginalCart(backupCart);

    setCheckoutTotal(total);
    setCheckoutDiscount(0);
    setCheckoutCouponCode('');
    setShippingAddress(currentUser.address || '');
    setCustomDesignUrl('');
    setIsCheckoutDialogOpen(true);

    // Toast to inform user
    toast.success(`Proceeding to checkout with ${product.name}`, {
      description: `${variation.color} • ${variation.size} • Qty: ${cartItem.quantity}`
    });
  };

  const handleProceedToPayment = (address: string) => {
    setShippingAddress(address);
    setIsCheckoutDialogOpen(false);
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = (paymentMethod: 'razorpay' | 'cod' | 'upi', paymentData?: any) => {
    const order: Order = {
      id: Date.now().toString(),
      items: [...cart],
      total: checkoutTotal,
      date: new Date().toISOString(),
      status: paymentMethod === 'cod' ? 'pending' : 'processing',
      userId: currentUser.id,
      userEmail: currentUser.email,
      userMobile: currentUser.mobile,
      shippingAddress: shippingAddress,
      notificationSent: true,
      discount: checkoutDiscount,
      couponCode: checkoutCouponCode || undefined,
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed',
      paymentId: paymentData?.paymentId,
      razorpayOrderId: paymentData?.razorpayOrderId,
      razorpayPaymentId: paymentData?.razorpayPaymentId,
      razorpaySignature: paymentData?.razorpaySignature,
    };

    storageUtils.createOrder(order);
    
    // Handle cart cleanup based on whether it was a Buy Now or Checkout All
    let finalCart: CartItem[];
    if (originalCart) {
      // This was a Buy Now - remove purchased items from original cart
      const purchasedItemIds = cart.map(item => `${item.productId}-${item.variationId}`);
      finalCart = originalCart.filter(
        item => !purchasedItemIds.includes(`${item.productId}-${item.variationId}`)
      );
      setOriginalCart(null);
      // Remove only the purchased items from Supabase cart
      cart.forEach(item => cartApi.removeByProduct(item.productId, item.variationId));
    } else {
      // This was Checkout All - clear the entire cart
      finalCart = [];
      // Clear Supabase cart entirely
      cartApi.clearAll();
    }
    
    // Update cart in storage and state
    const updatedUser = { ...currentUser, cart: finalCart };
    storageUtils.updateCurrentUser(updatedUser);
    setCart(finalCart);
    
    // Mark customer designs in the order as paid
    if (currentUser.savedCustomerDesigns && currentUser.savedCustomerDesigns.length > 0) {
      // Find designs that are in the order
      const updatedDesigns = currentUser.savedCustomerDesigns.map(design => {
        // Check if this design's product is in the order
        const isInOrder = cart.some(item => item.productId === design.productId);
        if (isInOrder && design.paymentStatus !== 'paid') {
          return {
            ...design,
            paymentStatus: 'paid' as const,
            orderId: order.id
          };
        }
        return design;
      });
      
      const updatedUserWithDesigns = { ...updatedUser, savedCustomerDesigns: updatedDesigns };
      storageUtils.updateCurrentUser(updatedUserWithDesigns);
    }
    
    notificationService.sendWhatsAppNotification(currentUser.mobile, order);
    notificationService.sendEmailNotification(currentUser.email, order);

    toast.success('Order placed successfully!');
    setIsPaymentDialogOpen(false);
    refreshUser();
    setActiveTab('orders');
  };

  const handleLogout = () => {
    authApi.logout().catch(() => {});
    storageUtils.logoutUser();
    onLogout();
  };

  const handleDesignerClick = () => {
    // Get products that have 2D model configurations
    const productsWithModels = products.filter(p =>
      storageUtils.get3DModelConfigByProductId(p.id) !== null
    );

    if (productsWithModels.length === 0) {
      toast.error('No products configured for 2D design yet', {
        description: 'Please check back later or contact support'
      });
      return;
    }

    // If only one product, open directly
    if (productsWithModels.length === 1) {
      setSelected3DProduct(productsWithModels[0]);
      setIs3DDesignerOpen(true);
      return;
    }

    // Multiple products - show selection toast
    toast.info('Click on any product to start designing!', {
      description: 'Look for the "Create 2D Design" button on product cards'
    });
  };

  // Improved Help Center button drag handlers
  const handleHelpButtonMouseDown = (e: React.MouseEvent) => {
    setIsHelpButtonDragging(true);
    setDragHasMoved(false);
    helpButtonDragStart.current = helpButtonPosition;
    helpButtonMouseStart.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isHelpButtonDragging) return;
      
      const dx = e.clientX - helpButtonMouseStart.current.x;
      const dy = e.clientY - helpButtonMouseStart.current.y;
      
      // If moved more than 5px, it's a drag
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        setDragHasMoved(true);
      }
      
      setHelpButtonPosition({ 
        x: helpButtonDragStart.current.x + dx, 
        y: helpButtonDragStart.current.y + dy 
      });
    };

    const handleMouseUp = () => {
      if (isHelpButtonDragging) {
        setIsHelpButtonDragging(false);
      }
    };

    if (isHelpButtonDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isHelpButtonDragging]);

  const handleHelpButtonClick = () => {
    // Only open if not dragged significantly
    if (!dragHasMoved) {
      setIsHelpCenterOpen(true);
    }
  };

  const navItems = [
    { id: 'shop', label: 'Store', icon: ShoppingBag },
    { id: 'designs', label: 'Studio', icon: Palette },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-black text-slate-100 flex overflow-hidden selection:bg-[#d4af37]/30">
      {/* Sidebar Navigation - Desktop */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="hidden lg:flex flex-col glass-card border-r border-[#d4af37]/10 h-screen sticky top-0 z-50 bg-black/80 backdrop-blur-2xl transition-all duration-300"
      >
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.img 
                key="logo"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                src={toodiesLogo} 
                alt="Toodies" 
                className="h-8 w-auto" 
              />
            )}
          </AnimatePresence>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-slate-500 hover:text-[#d4af37]"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                activeTab === item.id 
                  ? 'bg-gradient-to-r from-[#d4af37]/20 to-transparent text-[#d4af37] border border-[#d4af37]/20' 
                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === item.id ? 'text-[#d4af37]' : ''}`} />
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-bold text-sm tracking-wide"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {item.id === 'orders' && (currentUser.orders?.length ?? 0) > 0 && isSidebarOpen && (
                <Badge className="ml-auto bg-[#d4af37]/20 text-[#d4af37] border-0 h-5 px-1.5 text-[10px]">
                  {currentUser.orders?.length}
                </Badge>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            {isSidebarOpen && <span className="font-bold text-sm">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-black relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#d4af37]/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#d4af37]/3 rounded-full blur-[120px]" />
        </div>

        {/* Top Header */}
        <header className="h-20 glass-card border-b border-white/5 sticky top-0 z-40 px-6 flex items-center justify-between gap-4 bg-black/40 backdrop-blur-xl">
          <div className="flex-1 max-w-2xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search premium collections..." 
              className="bg-white/5 border-white/10 h-11 pl-12 rounded-xl focus:border-[#d4af37]/50 focus:ring-[#d4af37]/10 w-full"
            />
          </div>

          <div className="flex items-center gap-3">
            <ShoppingCart
              cart={cart}
              products={products}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onCheckout={handleCheckout}
              onBuyNow={handleBuyNow}
            />
            
            {/* Notification Bell */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsHelpCenterOpen(true)}
              className="relative h-10 w-10 rounded-xl bg-white/5 hover:bg-[#d4af37]/10 border border-white/10 hover:border-[#d4af37]/30 transition-all"
            >
              <Bell className="w-5 h-5 text-slate-400 hover:text-[#d4af37] transition-colors" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-black animate-bounce">
                  {notificationCount}
                </span>
              )}
            </Button>
            
            <div className="w-px h-8 bg-white/10 mx-2" />
            
            <div className="flex items-center gap-3 pl-2">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-xs font-bold text-white leading-none mb-1">{currentUser.name || 'Member'}</p>
                <p className="text-[10px] text-[#d4af37] uppercase tracking-tighter">Gold Member</p>
              </div>
              <div 
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#c9a227] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform border border-white/10"
                onClick={() => setActiveTab('profile')}
              >
                <UserIcon className="w-5 h-5 text-black" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'shop' && (
                <div className="space-y-10">
                  {/* Hero Callout */}
                  <Card className="glass-card border-[#d4af37]/20 overflow-hidden relative rounded-[40px] group luxury-glow">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 via-transparent to-[#d4af37]/5 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-8 lg:p-12 relative z-10">
                      <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
                        <div className="flex-1 space-y-6">
                          <Badge className="bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30 px-3 py-1 text-[10px] uppercase tracking-[2px] font-bold">
                            Premium Experience
                          </Badge>
                          <h2 className="text-4xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                            Design Your <br />
                            <span className="gradient-text glow-text">Statement Piece</span>
                          </h2>
                          <p className="text-slate-400 text-lg max-w-xl font-light">
                            Craft bespoke luxury with our integrated 2D studio. High-resolution previews for the discerning eye.
                          </p>
                          <div className="pt-2">
                            <Button
                              onClick={onOpen2DStudio || handleDesignerClick}
                              className="glow-button h-16 px-10 text-lg rounded-2xl border-0 shadow-lg"
                            >
                              <Palette className="w-5 h-5 mr-3" />
                              Launch 2D Studio
                            </Button>
                          </div>
                        </div>
                        <div className="relative hidden xl:block">
                          <div className="w-64 h-64 bg-[#d4af37]/10 rounded-full blur-[60px] animate-pulse absolute inset-0 m-auto" />
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                            className="relative z-10 p-10 rounded-full border-2 border-dashed border-[#d4af37]/20"
                          >
                            <Palette className="w-32 h-32 text-[#d4af37]/30" />
                          </motion.div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Collections Header */}
                  <div className="flex flex-col md:flex-row gap-6 items-end justify-between border-b border-white/5 pb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Explore Collections</h3>
                      <p className="text-slate-500 text-sm">Discover premium basics ready for your vision</p>
                    </div>
                    
                    <div className="flex gap-4 w-full md:w-auto">
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-slate-300 h-11 w-40 rounded-xl">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f172a] border-white/10 text-slate-200">
                          <SelectItem value="all">All Styles</SelectItem>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={selectedGender} onValueChange={setSelectedGender}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-slate-300 h-11 w-32 rounded-xl">
                          <SelectValue placeholder="Gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f172a] border-white/10 text-slate-200">
                          <SelectItem value="all">Unisex</SelectItem>
                          <SelectItem value="men">Men</SelectItem>
                          <SelectItem value="women">Women</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Products Grid */}
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-32 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                      <Search className="w-16 h-16 text-slate-700 mx-auto mb-6 opacity-50" />
                      <h3 className="text-xl font-bold text-slate-400 mb-2">No matches found</h3>
                      <p className="text-slate-600">Try adjusting your filters or search keywords</p>
                      <Button 
                        variant="link" 
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('all');
                          setSelectedGender('all');
                        }}
                        className="text-cyan-400 mt-4"
                      >
                        Reset All Filters
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                      {filteredProducts.map((product, index) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index % 4 * 0.1 }}
                        >
                          <ProductCard
                            product={product}
                            onAddToCart={handleAddToCartQuick}
                            onOpenDesigner={(p) => {
                              setSelected3DProduct(p);
                              setIs3DDesignerOpen(true);
                            }}
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'designs' && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center border border-[#d4af37]/20">
                      <Palette className="w-6 h-6 text-[#d4af37]" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white tracking-tight">Your Design Studio</h2>
                      <p className="text-slate-500 font-light">View and purchase your custom creations</p>
                    </div>
                  </div>
                  <StudioMyCustomDesigns />
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center border border-[#d4af37]/20">
                      <Package className="w-6 h-6 text-[#d4af37]" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white tracking-tight">Order Tracking</h2>
                      <p className="text-slate-500 font-light">Real-time status of your premium apparel</p>
                    </div>
                  </div>
                  <OrderTracking user={currentUser} />
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center border border-[#d4af37]/20">
                      <UserIcon className="w-6 h-6 text-[#d4af37]" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white tracking-tight">Account Settings</h2>
                      <p className="text-slate-500 font-light">Manage your profile and security</p>
                    </div>
                  </div>
                  <CustomerProfile user={currentUser} onUpdate={(updatedUser) => setCurrentUser(updatedUser)} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Navigation - Bottom Bar */}
        <nav className="lg:hidden h-20 glass-card border-t border-white/5 sticky bottom-0 z-50 px-6 flex items-center justify-around bg-black/90 backdrop-blur-xl">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === item.id ? 'text-[#d4af37]' : 'text-slate-500'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              {activeTab === item.id && (
                <motion.div 
                  layoutId="mobileNavLine"
                  className="w-8 h-1 bg-[#d4af37] rounded-full mt-1 shadow-[0_0_10px_#d4af37]"
                />
              )}
            </button>
          ))}
        </nav>
      </main>

      {/* Overlays & Modals */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onAddToCart={handleAddToCart}
      />

      <EnhancedPaymentDialog
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        total={checkoutTotal}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <CheckoutDialog
        isOpen={isCheckoutDialogOpen}
        onClose={() => {
          setIsCheckoutDialogOpen(false);
          if (originalCart) {
            setCart(originalCart);
            setOriginalCart(null);
          }
        }}
        cart={cart}
        products={products}
        total={checkoutTotal}
        discount={checkoutDiscount}
        couponCode={checkoutCouponCode}
        shippingAddress={shippingAddress}
        onProceedToPayment={handleProceedToPayment}
      />

      <PopupDisplay 
        user={currentUser} 
        onVerifyClick={() => setActiveTab('profile')}
      />

      {/* Help Center Overlay */}
      <AnimatePresence>
        {isHelpCenterOpen && (
          <HelpCenter
            user={currentUser}
            onClose={() => setIsHelpCenterOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Help Center Floating Button */}
      {!isHelpCenterOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            transform: `translate(${helpButtonPosition.x}px, ${helpButtonPosition.y}px)`,
            zIndex: 50,
          }}
          className="lg:bottom-8 lg:right-8"
        >
          <Button
            onClick={handleHelpButtonClick}
            onMouseDown={handleHelpButtonMouseDown}
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#c9a227] hover:from-[#c9a227] hover:to-[#d4af37] text-black border-0 shadow-2xl relative group overflow-hidden transition-all active:scale-95 ${isHelpButtonDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            <div className="absolute inset-0 bg-white/20 translate-y-16 group-hover:translate-y-0 transition-transform duration-300" />
            <HeadphonesIcon className="w-8 h-8 relative z-10 pointer-events-none" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-black animate-bounce shadow-lg pointer-events-none">
                {notificationCount}
              </span>
            )}
          </Button>
        </div>
      )}

      {/* WhatsApp Floating Button */}
      {(() => {
        const businessInfo = storageUtils.getBusinessInfo();
        if (businessInfo.visibility?.website.showWhatsApp === false) return null;
        
        const whatsappNumber = businessInfo.whatsapp || '+919876543210';
        const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
        const message = encodeURIComponent(`Hi! I'm interested in learning more about Toodies products.`);
        const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`;

        return (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '104px',
              zIndex: 50,
            }}
            className="lg:bottom-8 lg:right-28"
          >
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white shadow-2xl relative group overflow-hidden transition-all hover:scale-110 active:scale-95"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-16 group-hover:translate-y-0 transition-transform duration-300" />
              <MessageCircle className="w-8 h-8 relative z-10 pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping pointer-events-none" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full pointer-events-none" />
            </a>
          </motion.div>
        );
      })()}
    </div>
  );
}
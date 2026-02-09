import { useState, useEffect } from 'react';
import { User, Product, CartItem, Order } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LogOut, ExternalLink, Palette, ShoppingCart as CartIcon, Package, Store } from 'lucide-react';
import { motion } from 'motion/react';
import { storageUtils } from '../utils/storage';
import { notificationService } from '../utils/notifications';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { ShoppingCart } from './ShoppingCart';
import { OrderTracking } from './OrderTracking';
import { toast } from 'sonner@2.0.3';
import toodiesLogo from 'figma:asset/d31f1d417f75594ba1ab67a4c64ef32e85ec2234.png';

interface CustomerDashboardProps {
  user: User;
  onLogout: () => void;
}

export function CustomerDashboard({ user, onLogout }: CustomerDashboardProps) {
  const [activeTab, setActiveTab] = useState('shop');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(user.cart);
  const [designerUrl, setDesignerUrl] = useState('');
  const [currentUser, setCurrentUser] = useState<User>(user);

  useEffect(() => {
    loadProducts();
    refreshUser();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, selectedCategory, selectedGender]);

  const refreshUser = () => {
    const updatedUser = storageUtils.getCurrentUser();
    if (updatedUser) {
      setCurrentUser(updatedUser);
      setCart(updatedUser.cart);
    }
  };

  const loadProducts = () => {
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
    toast.success('Added to cart!');
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
  };

  const handleRemoveItem = (productId: string, variationId: string) => {
    const newCart = cart.filter(
      item => !(item.productId === productId && item.variationId === variationId)
    );
    setCart(newCart);
    const updatedUser = { ...currentUser, cart: newCart };
    storageUtils.updateCurrentUser(updatedUser);
    setCurrentUser(updatedUser);
    toast.success('Removed from cart');
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Calculate total
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

    // Create order
    const order: Order = {
      id: Date.now().toString(),
      items: [...cart],
      total,
      date: new Date().toISOString(),
      status: 'pending',
      userId: currentUser.id,
      userEmail: currentUser.email,
      userMobile: currentUser.mobile,
      notificationSent: true
    };

    // Save order
    storageUtils.createOrder(order);

    // Send notifications
    notificationService.sendWhatsAppNotification(currentUser.mobile, order);
    notificationService.sendEmailNotification(currentUser.email, order);

    toast.success('Order placed successfully! Check your email and WhatsApp for confirmation.');
    
    // Refresh user data
    refreshUser();
    
    // Switch to orders tab
    setActiveTab('orders');
  };

  const handleLogout = () => {
    storageUtils.logoutUser();
    onLogout();
  };

  const handleDesignerClick = () => {
    if (designerUrl) {
      window.open(designerUrl, '_blank');
    } else {
      toast.info('3D Designer integration coming soon!');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="glass-card border-b border-cyan-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div 
                className="flex items-center gap-3"
                whileHover={{ scale: 1.05 }}
              >
                <img src={toodiesLogo} alt="Toodies" className="h-10 w-auto" />
              </motion.div>
            </div>
            
            <div className="flex items-center gap-3">
              <ShoppingCart
                cart={cart}
                products={products}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCheckout={handleCheckout}
              />
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Welcome Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-3xl font-bold text-cyan-100 glow-text mb-2">
            Welcome back!
          </h2>
          <p className="text-slate-400">{currentUser.email}</p>
        </motion.div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 bg-[#0f172a]/50 border border-cyan-500/20">
            <TabsTrigger 
              value="shop"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-500 data-[state=active]:text-white text-slate-300"
            >
              <Store className="w-4 h-4 mr-2" />
              Shop
            </TabsTrigger>
            <TabsTrigger 
              value="orders"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-500 data-[state=active]:text-white text-slate-300"
            >
              <Package className="w-4 h-4 mr-2" />
              Track Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shop" className="space-y-6">
            {/* 3D Designer Call-to-Action */}
            <Card className="glass-card border-cyan-500/30 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-teal-500/10" />
              <CardContent className="p-6 relative z-10">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="bg-gradient-to-br from-cyan-500/30 to-teal-500/30 p-3 rounded-xl glow-border"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Palette className="w-8 h-8 text-cyan-400" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold text-cyan-100 mb-1">Design Your Custom Product</h3>
                      <p className="text-slate-300">Use our 3D designer to create unique designs</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleDesignerClick}
                    className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white glow-button border-0"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open 3D Designer
                  </Button>
                </div>
                <div className="mt-4 pt-4 border-t border-cyan-500/20">
                  <Input
                    placeholder="Or paste your 3D designer URL here..."
                    value={designerUrl}
                    onChange={(e) => setDesignerUrl(e.target.value)}
                    className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 placeholder:text-slate-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Filters & Search */}
            <div className="space-y-4">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 placeholder:text-slate-500"
              />
              
              <div className="flex flex-wrap gap-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48 bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f172a] border-cyan-500/30">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedGender} onValueChange={setSelectedGender}>
                  <SelectTrigger className="w-48 bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100">
                    <SelectValue placeholder="All Genders" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f172a] border-cyan-500/30">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="men">Men</SelectItem>
                    <SelectItem value="women">Women</SelectItem>
                    <SelectItem value="unisex">Unisex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No products found</p>
              </div>
            ) : (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
              >
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCartQuick}
                  />
                ))}
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="orders">
            <OrderTracking user={currentUser} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}

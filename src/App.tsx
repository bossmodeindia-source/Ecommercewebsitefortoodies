import { useState, useEffect } from 'react';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { CustomerAuth } from './components/CustomerAuth';
import { CustomerDashboard } from './components/CustomerDashboard';
import { Button } from './components/ui/button';
import { storageUtils } from './utils/storage';
import { User } from './types';
import { Toaster } from './components/ui/sonner';
import { Shield, Store, Sparkles, Palette, ShoppingBag } from 'lucide-react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { motion } from 'motion/react';
import toodiesLogo from 'figma:asset/d31f1d417f75594ba1ab67a4c64ef32e85ec2234.png';
import tigerIcon from 'figma:asset/0384d838979de15e8db05f2eef126aa9e88613fe.png';

type ViewMode = 'landing' | 'admin' | 'customer';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const user = storageUtils.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setViewMode('customer');
    }
    
    // Check if admin is already authenticated
    if (storageUtils.isAdminAuthenticated()) {
      setIsAdminAuthenticated(true);
      setViewMode('admin');
    }

    // Add some sample products if none exist
    const products = storageUtils.getProducts();
    if (products.length === 0) {
      initializeSampleProducts();
    }
  }, []);

  const initializeSampleProducts = () => {
    const sampleProducts = [
      {
        id: '1',
        name: 'Classic White T-Shirt',
        description: 'Premium quality cotton t-shirt, perfect for everyday wear and custom designs',
        category: 'T-Shirts',
        gender: 'unisex' as const,
        basePrice: 24.99,
        image: 'https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=500',
        variations: [
          { id: 'v1', color: 'White', size: 'S', price: 24.99, stock: 50 },
          { id: 'v2', color: 'White', size: 'M', price: 24.99, stock: 75 },
          { id: 'v3', color: 'White', size: 'L', price: 24.99, stock: 60 },
          { id: 'v4', color: 'White', size: 'XL', price: 26.99, stock: 40 },
          { id: 'v5', color: 'Black', size: 'M', price: 24.99, stock: 65 },
          { id: 'v6', color: 'Black', size: 'L', price: 24.99, stock: 55 },
        ],
        printingMethods: ['Screen Print', 'DTG', 'Vinyl'],
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Premium Hoodie',
        description: 'Comfortable and stylish hoodie, perfect for customization',
        category: 'Hoodies',
        gender: 'unisex' as const,
        basePrice: 49.99,
        image: 'https://images.unsplash.com/photo-1646514336754-1c3fe17e28c2?w=500',
        variations: [
          { id: 'v7', color: 'Black', size: 'M', price: 49.99, stock: 30 },
          { id: 'v8', color: 'Black', size: 'L', price: 49.99, stock: 25 },
          { id: 'v9', color: 'Gray', size: 'M', price: 49.99, stock: 35 },
          { id: 'v10', color: 'Gray', size: 'L', price: 49.99, stock: 40 },
          { id: 'v11', color: 'Navy', size: 'L', price: 49.99, stock: 20 },
        ],
        printingMethods: ['Embroidery', 'Screen Print', 'DTG'],
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Crew Neck Sweatshirt',
        description: 'Cozy sweatshirt for custom designs and everyday comfort',
        category: 'Sweatshirts',
        gender: 'unisex' as const,
        basePrice: 39.99,
        image: 'https://images.unsplash.com/photo-1655183003965-619ad3fc5ed0?w=500',
        variations: [
          { id: 'v12', color: 'Beige', size: 'S', price: 39.99, stock: 45 },
          { id: 'v13', color: 'Beige', size: 'M', price: 39.99, stock: 50 },
          { id: 'v14', color: 'Beige', size: 'L', price: 39.99, stock: 35 },
          { id: 'v15', color: 'Green', size: 'M', price: 39.99, stock: 30 },
          { id: 'v16', color: 'Green', size: 'L', price: 39.99, stock: 28 },
        ],
        printingMethods: ['Screen Print', 'DTG', 'Vinyl'],
        createdAt: new Date().toISOString()
      }
    ];

    sampleProducts.forEach(product => storageUtils.addProduct(product));
  };

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
    setViewMode('admin');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setViewMode('landing');
  };

  const handleCustomerLogin = (user: User) => {
    setCurrentUser(user);
    setViewMode('customer');
  };

  const handleCustomerLogout = () => {
    setCurrentUser(null);
    setViewMode('landing');
  };

  const goToCustomer = () => {
    setViewMode('customer');
  };

  const goToAdmin = () => {
    setViewMode('admin');
  };

  // Landing Page
  if (viewMode === 'landing') {
    return (
      <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden flex items-center justify-center p-4">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <Toaster />
        
        <div className="max-w-6xl w-full relative z-10">
          {/* Header */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div 
              className="mb-6"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-2xl animate-pulse-glow" />
                <ImageWithFallback
                  src={tigerIcon}
                  alt="Toodies Icon"
                  className="w-24 h-24 mx-auto rounded-full object-cover shadow-2xl mb-6 relative border-2 border-cyan-500/50"
                />
              </div>
              
              <motion.h1 
                className="mb-4 flex justify-center"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <img src={toodiesLogo} alt="Toodies" className="h-28 w-auto drop-shadow-2xl" />
              </motion.h1>
              
              <motion.p 
                className="text-xl text-cyan-100/80 tracking-wide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Custom Apparel & Design Platform
              </motion.p>
            </motion.div>
          </motion.div>

          {/* Main Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
              className="glass-card glass-card-hover rounded-3xl p-8 relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <motion.div 
                  className="bg-gradient-to-br from-cyan-500/20 to-teal-500/20 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 mx-auto glow-border"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Store className="w-10 h-10 text-cyan-400" />
                </motion.div>
                
                <h2 className="text-3xl font-bold text-cyan-100 mb-4 text-center">Shop Now</h2>
                <p className="text-slate-300 mb-8 text-center leading-relaxed">
                  Browse our collection and customize your perfect apparel with cutting-edge 3D design tools
                </p>
                
                <Button
                  onClick={goToCustomer}
                  className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white glow-button border-0 py-6 text-lg rounded-xl"
                  size="lg"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Customer Portal
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
              className="glass-card glass-card-hover rounded-3xl p-8 relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <motion.div 
                  className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 mx-auto glow-border"
                  whileHover={{ rotate: -360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Shield className="w-10 h-10 text-teal-400" />
                </motion.div>
                
                <h2 className="text-3xl font-bold text-teal-100 mb-4 text-center">Admin Access</h2>
                <p className="text-slate-300 mb-8 text-center leading-relaxed">
                  Manage products, inventory, and website content with powerful admin tools
                </p>
                
                <Button
                  onClick={goToAdmin}
                  className="w-full bg-transparent border-2 border-teal-500 text-teal-400 hover:bg-teal-500/20 hover:border-teal-400 py-6 text-lg rounded-xl transition-all duration-300"
                  size="lg"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Admin Panel
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Features Section */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="glass-card rounded-2xl p-8">
              <h3 className="text-xl font-bold text-cyan-100 mb-6 glow-text">Platform Features</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <motion.div 
                  className="flex flex-col items-center"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 w-16 h-16 rounded-xl flex items-center justify-center mb-3 glow-border">
                    <Sparkles className="w-8 h-8 text-cyan-400" />
                  </div>
                  <span className="text-slate-200 font-medium">3D Design Integration</span>
                </motion.div>
                
                <motion.div 
                  className="flex flex-col items-center"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 w-16 h-16 rounded-xl flex items-center justify-center mb-3 glow-border">
                    <Palette className="w-8 h-8 text-teal-400" />
                  </div>
                  <span className="text-slate-200 font-medium">Custom Printing Options</span>
                </motion.div>
                
                <motion.div 
                  className="flex flex-col items-center"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-gradient-to-br from-blue-500/20 to-teal-500/20 w-16 h-16 rounded-xl flex items-center justify-center mb-3 glow-border">
                    <ShoppingBag className="w-8 h-8 text-blue-400" />
                  </div>
                  <span className="text-slate-200 font-medium">Multiple Product Types</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Admin View
  if (viewMode === 'admin') {
    if (!isAdminAuthenticated) {
      return (
        <>
          <Toaster />
          <AdminLogin onLogin={handleAdminLogin} />
        </>
      );
    }
    return (
      <>
        <Toaster />
        <AdminDashboard onLogout={handleAdminLogout} />
      </>
    );
  }

  // Customer View
  if (!currentUser) {
    return (
      <>
        <Toaster />
        <CustomerAuth onLogin={handleCustomerLogin} />
      </>
    );
  }

  return (
    <>
      <Toaster />
      <CustomerDashboard user={currentUser} onLogout={handleCustomerLogout} />
    </>
  );
}
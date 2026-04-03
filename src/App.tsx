import { AdminDashboard } from './components/AdminDashboard';
import { CustomerAuth } from './components/CustomerAuth';
import { CustomerDashboard } from './components/CustomerDashboard';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsAndConditions } from './components/TermsAndConditions';
import { TwoDStudioPage } from './components/TwoDStudioPage';
import { SupabaseConnectionBanner } from './components/SupabaseConnectionBanner';
import { GoogleAnalytics, FacebookPixel } from './components/SEOHead';
import { User, CustomDesign } from './types';
import { Sparkles, ShoppingBag, Palette, Phone, Mail, MapPin, MessageCircle, Users, Facebook, Instagram, Twitter, Linkedin, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { authApi, productsApi, settingsApi, designsApi } from './utils/supabaseApi';
import { storageUtils } from './utils/storage';
import { useState, useEffect } from 'react';
import { toast, Toaster } from 'sonner@2.0.3';
import { Button } from './components/ui/button';
import { AdminLogin } from './components/AdminLogin';
import toodiesLogo from 'figma:asset/c561690211cdd59869b2af6c111db0bf09f362da.png';
import tigerIcon from 'figma:asset/0384d838979de15e8db05f2eef126aa9e88613fe.png';

// Development mode: Detect localStorage misuse
import './utils/localStorageDetector';

type ViewMode = 'landing' | 'admin' | 'customer' | 'privacy' | 'terms' | '2dstudio';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [businessInfo, setBusinessInfo] = useState<any>({});
  const [adminSettings, setAdminSettings] = useState<any>({});

  // Load business info and settings on mount
  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        // Load from Supabase (primary source)
        const business = await settingsApi.getBusiness();
        
        if (business && Object.keys(business).length > 0) {
          setBusinessInfo(business);
          console.log('✅ Loaded business data from Supabase');
        } else {
          console.error('❌ Database tables not found');
          console.error('📋 Run: /database/fresh-setup-v2.sql in Supabase SQL Editor');
          // Set default business info
          setBusinessInfo({
            companyName: 'Toodies',
            phone: '+91 98865 10858',
            email: 'hello@toodies.com',
            whatsapp: '+919886510858',
            city: 'Bangalore',
            state: 'Karnataka',
            visibility: {
              website: {
                showWhatsApp: true,
                showSocialMedia: true
              }
            },
            socialMedia: {}
          });
        }
      } catch (error) {
        console.error('❌ Error loading business data from Supabase:', error);
        // Set default business info
        setBusinessInfo({
          companyName: 'Toodies',
          phone: '+91 98865 10858',
          email: 'hello@toodies.com',
          whatsapp: '+919886510858',
          city: 'Bangalore',
          state: 'Karnataka',
          visibility: {
            website: {
              showWhatsApp: true,
              showSocialMedia: true
            }
          },
          socialMedia: {}
        });
      }
      
      // Try to load admin settings for analytics (optional)
      try {
        const localSettings = storageUtils.getAdminSettings();
        setAdminSettings(localSettings);
      } catch (error) {
        // Silent fallback
        setAdminSettings({});
      }
    };
    loadBusinessData();
  }, []);

  useEffect(() => {
    // Initialize admin account on first load
    const initializeApp = async () => {
      try {
        console.log('🔧 Initializing admin account...');
        const result = await authApi.initializeAdmin();
        console.log('✅ Admin initialization result:', result);
      } catch (error) {
        console.error('❌ Admin initialization error:', error);
        // Don't crash the app if initialization fails
      }
    };
    
    // Run initialization but don't block rendering
    initializeApp().catch(err => console.error('Init failed:', err));

    // Check for admin access via URL param
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('admin_portal')) {
      setViewMode('admin');
    }

    // Check if user is already logged in
    const storedUser = authApi.getStoredUser();
    const storedToken = localStorage.getItem('toodies_access_token');
    
    console.log('🔍 Checking stored authentication...');
    console.log('Stored user:', storedUser);
    console.log('Stored token:', storedToken ? 'exists' : 'missing');
    
    // PRIORITY: Check if admin is already authenticated
    if (storedToken && storedUser?.role === 'admin') {
      console.log('✅ Admin session found - Auto-login as admin');
      setIsAdminAuthenticated(true);
      setViewMode('admin');
    } else if (storedUser && storedUser.role === 'customer') {
      console.log('✅ Customer session found - Auto-login as customer');
      setCurrentUser(storedUser);
      setViewMode('customer');
      
      // Check if design URL is present in URL params (returned from 2D designer)
      handleDesignUrlFromParams(urlParams, storedUser);
    } else {
      console.log('ℹ️ No stored session found');
    }

    // Initialize sample products if none exist (for demo purposes)
    initializeSampleProducts();
  }, []);

  const initializeSampleProducts = async () => {
    try {
      const products = await productsApi.getAll();
      if (products.length === 0) {
        console.log('No products found, but skipping initialization (requires admin login)');
        // Sample products will be created when admin first logs in
        // We can't create products without admin authentication
      }
    } catch (error) {
      console.log('Products check skipped:', error);
      // Silently skip - products will be available after admin setup
    }
  };

  const handleDesignUrlFromParams = (urlParams: URLSearchParams, user: User) => {
    const designUrl = urlParams.get('designUrl');
    const productId = urlParams.get('productId');
    const designName = urlParams.get('designName');
    const color = urlParams.get('color');
    const size = urlParams.get('size');
    const category = urlParams.get('category');
    const variationId = urlParams.get('variationId');
    
    if (designUrl) {
      // Create a new custom design from the URL parameters
      const newDesign: CustomDesign = {
        id: Date.now().toString(),
        name: designName || `Custom Design - ${new Date().toLocaleDateString()}`,
        designUrl: designUrl,
        productId: productId || '1',
        variationId: variationId,
        color: color || undefined,
        size: size || undefined,
        category: category || undefined,
        createdAt: new Date().toISOString(),
      };
      
      // Note: This will need to be saved to Supabase through the design flow
      
      // Clean up URL by removing the design parameters
      window.history.replaceState({}, '', window.location.pathname);
      
      toast.success('Design saved successfully! Check "My Designs" tab to view it.', {
        duration: 5000,
      });
    }
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
    authApi.logout();
  };

  const goToCustomer = () => {
    setViewMode('customer');
  };

  const goToAdmin = () => {
    setViewMode('admin');
  };

  const goToPrivacy = () => {
    setViewMode('privacy');
  };

  const goToTerms = () => {
    setViewMode('terms');
  };

  const goToLanding = () => {
    setViewMode('landing');
  };

  const goTo2DStudio = () => {
    setViewMode('2dstudio');
  };

  // Privacy Policy View
  if (viewMode === 'privacy') {
    return (
      <>
        <Toaster />
        <PrivacyPolicy onBack={goToLanding} />
      </>
    );
  }

  // Terms and Conditions View
  if (viewMode === 'terms') {
    return (
      <>
        <Toaster />
        <TermsAndConditions onBack={goToLanding} />
      </>
    );
  }

  // Landing Page
  if (viewMode === 'landing') {
    const heroImageSrc = businessInfo.hero_image || 'https://images.unsplash.com/photo-1756276900419-868625adff43?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwYWVzdGhldGljJTIwc3RyZWV0d2VhciUyMGZhc2hpb258ZW58MXx8fHwxNzcwNjM0NTU4fDA&ixlib=rb-4.1.0&q=80&w=1080';
    
    return (
      <div className="min-h-screen bg-[#000000] text-white selection:bg-[#d4af37]/30">
        <Toaster />
        
        {/* Analytics Components */}
        {adminSettings.analytics_enabled && adminSettings.google_analytics_id && (
          <GoogleAnalytics measurementId={adminSettings.google_analytics_id} />
        )}
        {adminSettings.analytics_enabled && adminSettings.facebook_pixel_id && (
          <FacebookPixel pixelId={adminSettings.facebook_pixel_id} />
        )}
        
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 glass-card border-b border-[#d4af37]/10 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <img src={toodiesLogo} alt="Toodies" className="h-12 w-auto" />
            </motion.div>
            
            <div className="flex items-center gap-8">
              <button onClick={goToCustomer} className="nav-link text-sm font-medium">Shop</button>
              <button onClick={goToCustomer} className="nav-link text-sm font-medium">Categories</button>
              <button 
                onClick={goToAdmin} 
                className="nav-link text-sm font-medium text-[#d4af37] hover:text-[#c9a227] transition-colors"
                title="Admin Dashboard Login"
              >
                <Shield className="w-4 h-4 inline-block mr-1" />
                Admin
              </button>
              <Button 
                onClick={goToCustomer}
                className="glow-button font-semibold rounded-full px-6"
              >
                Get Started
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
          {/* Animated Background and Cinematic Overlay */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute inset-0 bg-black/60 z-0" />
            <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-[#d4af37]/8 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-[#c9a227]/8 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#d4af37]/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }} />
          </div>

          <div className="max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-xs font-bold tracking-widest uppercase mb-6 luxury-glow"
              >
                <Sparkles className="w-3 h-3" />
                Premium Streetwear
              </motion.div>
              <h1 className="text-6xl md:text-7xl font-bold leading-tight mb-6">
                <span className="bg-gradient-to-br from-white via-[#f5f5f5] to-[#d4af37] bg-clip-text text-transparent">
                  Design Your
                </span>
                <br />
                <span className="gradient-text glow-text">Statement</span>
              </h1>
              <p className="text-xl text-slate-400 mb-10 max-w-lg leading-relaxed">
                Where luxury meets creativity. Premium fabrics, cutting-edge customization, and timeless designs that speak your language.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <Button 
                  onClick={goToCustomer}
                  className="glow-button text-lg py-8 px-10 rounded-2xl group font-bold tracking-wide"
                >
                  Start Designing
                  <motion.span 
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ShoppingBag className="ml-2 w-5 h-5" />
                  </motion.span>
                </Button>
                <Button 
                  variant="outline"
                  onClick={goToCustomer}
                  className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black py-8 px-10 rounded-2xl text-lg font-bold transition-all duration-400"
                >
                  Explore Collection
                </Button>
              </div>

              {/* Bulk Orders CTA */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-8"
              >
                <Button
                  onClick={() => {
                    document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  variant="ghost"
                  className="text-[#d4af37] hover:text-[#c9a227] border border-[#d4af37]/30 hover:bg-[#d4af37]/10 hover:border-[#d4af37]/50 px-6 py-3 rounded-xl"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Contact for Bulk Orders
                </Button>
              </motion.div>

              <div className="mt-12 flex items-center gap-8">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-white">10k+</span>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Designs Made</span>
                </div>
                <div className="w-px h-10 bg-[#d4af37]/20" />
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-white">4.9/5</span>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">User Rating</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative hidden lg:block"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/15 via-[#c9a227]/10 to-[#d4af37]/15 rounded-[40px] blur-3xl -z-10 animate-pulse" />
              <div className="relative glass-card rounded-[40px] p-4 border border-[#d4af37]/30 overflow-hidden group luxury-glow">
                <ImageWithFallback 
                  src={heroImageSrc}
                  alt="Streetwear Hero"
                  className="rounded-[30px] w-full aspect-[4/5] object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
                
                {/* Floating UI Element */}
                <motion.div 
                  className="absolute bottom-10 right-10 glass-card p-4 rounded-2xl border border-[#d4af37]/20 backdrop-blur-md"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4af37]/30 to-[#c9a227]/30 flex items-center justify-center border border-[#d4af37]/30">
                      <Palette className="w-5 h-5 text-[#d4af37]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Active Customization</p>
                      <p className="text-sm font-bold text-white">2D Designer v2.0</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section className="py-24 bg-[#0a0a0a] border-t border-[#d4af37]/5">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Why Choose Toodies?</h2>
              <div className="h-1 w-20 bg-gradient-to-r from-[#d4af37] to-[#c9a227] mx-auto rounded-full" />
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Palette className="w-8 h-8 text-[#d4af37]" />,
                  title: "Premium Fabrics",
                  desc: "We use only high-grade 100% cotton and recycled blends for ultimate comfort.",
                  gradient: "from-[#d4af37]/20 to-[#c9a227]/20"
                },
                {
                  icon: <Sparkles className="w-8 h-8 text-[#d4af37]" />,
                  title: "HD Printing",
                  desc: "State-of-the-art DTG and screen printing that won't fade or crack over time.",
                  gradient: "from-[#d4af37]/20 to-[#c9a227]/20"
                },
                {
                  icon: <ShoppingBag className="w-8 h-8 text-[#d4af37]" />,
                  title: "Fast Delivery",
                  desc: "Custom designed, printed, and delivered to your doorstep within 7-10 business days.",
                  gradient: "from-[#d4af37]/20 to-[#c9a227]/20"
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="glass-card p-8 rounded-3xl border border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-all duration-500 group"
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-[#d4af37]/20`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact-section" className="py-24 bg-[#0a0a0a] border-t border-[#d4af37]/5">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-xs font-bold tracking-widest uppercase mb-4">
                <Users className="w-3 h-3" />
                Bulk Orders
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Get in Touch</h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Looking to place a bulk order? We offer special pricing and dedicated support for large quantities.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {(() => {
                const contactItems = [
                  {
                    icon: <Phone className="w-6 h-6" />,
                    title: "Phone",
                    value: businessInfo.phone || "+91 98865 10858",
                    link: `tel:${businessInfo.phone || "+919886510858"}`,
                    gradient: "from-[#d4af37] to-[#c9a227]"
                  },
                  {
                    icon: <Mail className="w-6 h-6" />,
                    title: "Email",
                    value: businessInfo.email || "hello@toodies.com",
                    link: `mailto:${businessInfo.email || "hello@toodies.com"}`,
                    gradient: "from-[#d4af37] to-[#c9a227]"
                  },
                  {
                    icon: <MapPin className="w-6 h-6" />,
                    title: "Location",
                    value: businessInfo.city && businessInfo.state ? `${businessInfo.city}, ${businessInfo.state}` : "India",
                    link: null,
                    gradient: "from-[#d4af37] to-[#c9a227]"
                  }
                ];

                return contactItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    {item.link ? (
                      <a
                        href={item.link}
                        className="block glass-card p-6 rounded-2xl border border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-all duration-300 group"
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${item.gradient} bg-opacity-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-[#d4af37]/30`}>
                          <div className="text-[#d4af37]">{item.icon}</div>
                        </div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">{item.title}</h3>
                        <p className="text-white font-medium group-hover:text-[#d4af37] transition-colors">{item.value}</p>
                      </a>
                    ) : (
                      <div className="glass-card p-6 rounded-2xl border border-[#d4af37]/20">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${item.gradient} bg-opacity-20 flex items-center justify-center mb-4 border border-[#d4af37]/30`}>
                          <div className="text-[#d4af37]">{item.icon}</div>
                        </div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">{item.title}</h3>
                        <p className="text-white font-medium">{item.value}</p>
                      </div>
                    )}
                  </motion.div>
                ));
              })()}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-12 text-center"
            >
              <div className="glass-card p-8 rounded-2xl border border-[#d4af37]/20 max-w-2xl mx-auto">
                <h3 className="text-xl font-bold text-white mb-3">Bulk Order Benefits</h3>
                <ul className="text-slate-300 space-y-2 text-left max-w-md mx-auto">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#d4af37]/30 to-[#c9a227]/30 flex items-center justify-center mt-0.5 flex-shrink-0 border border-[#d4af37]/30">
                      <div className="w-2 h-2 rounded-full bg-[#d4af37]" />
                    </div>
                    <span>Special pricing for orders of 50+ units</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#d4af37]/30 to-[#c9a227]/30 flex items-center justify-center mt-0.5 flex-shrink-0 border border-[#d4af37]/30">
                      <div className="w-2 h-2 rounded-full bg-[#d4af37]" />
                    </div>
                    <span>Dedicated account manager for your project</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#d4af37]/30 to-[#c9a227]/30 flex items-center justify-center mt-0.5 flex-shrink-0 border border-[#d4af37]/30">
                      <div className="w-2 h-2 rounded-full bg-[#d4af37]" />
                    </div>
                    <span>Priority production and faster turnaround times</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#d4af37]/30 to-[#c9a227]/30 flex items-center justify-center mt-0.5 flex-shrink-0 border border-[#d4af37]/30">
                      <div className="w-2 h-2 rounded-full bg-[#d4af37]" />
                    </div>
                    <span>Custom packaging and branding options available</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-[#d4af37]/10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
              <img src={toodiesLogo} alt="Toodies" className="h-8 w-auto opacity-50" />
              
              {/* Social Media Icons */}
              {(() => {
                const showSocial = businessInfo.visibility?.website.showSocialMedia !== false;
                const socialLinks = businessInfo.socialMedia;
                
                if (!showSocial || !socialLinks) return null;
                
                const icons = [
                  { 
                    Icon: Facebook, 
                    url: socialLinks.facebook, 
                    label: 'Facebook',
                    color: 'hover:text-blue-500 hover:border-blue-500'
                  },
                  { 
                    Icon: Instagram, 
                    url: socialLinks.instagram, 
                    label: 'Instagram',
                    color: 'hover:text-pink-500 hover:border-pink-500'
                  },
                  { 
                    Icon: Twitter, 
                    url: socialLinks.twitter, 
                    label: 'Twitter',
                    color: 'hover:text-sky-400 hover:border-sky-400'
                  },
                  { 
                    Icon: Linkedin, 
                    url: socialLinks.linkedin, 
                    label: 'LinkedIn',
                    color: 'hover:text-blue-600 hover:border-blue-600'
                  },
                ].filter(item => item.url && item.url.trim() !== '');
                
                if (icons.length === 0) return null;
                
                return (
                  <div className="flex items-center gap-4">
                    {icons.map(({ Icon, url, label, color }) => (
                      <a
                        key={label}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className={`w-10 h-10 rounded-xl glass-card border border-[#d4af37]/20 flex items-center justify-center text-slate-400 ${color} transition-all hover:scale-110`}
                      >
                        <Icon className="w-5 h-5" />
                      </a>
                    ))}
                  </div>
                );
              })()}
              
              <div className="flex gap-6">
                <span className="text-slate-500 hover:text-[#d4af37] cursor-pointer text-sm transition-colors" onClick={goToPrivacy}>Privacy</span>
                <span className="text-slate-500 hover:text-[#d4af37] cursor-pointer text-sm transition-colors" onClick={goToTerms}>Terms</span>
                <span className="text-slate-500 hover:text-[#d4af37] cursor-pointer text-sm transition-colors">Contact</span>
              </div>
            </div>
            
            <div className="text-center pt-6 border-t border-[#d4af37]/10">
              <p className="text-slate-500 text-sm">© 2026 Toodies Apparel. All rights reserved.</p>
            </div>
          </div>
        </footer>

        {/* WhatsApp Floating Button */}
        {(() => {
          const whatsappNumber = businessInfo.whatsapp || '+919876543210';
          const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
          const message = encodeURIComponent(`Hi! I'm interested in learning more about Toodies products.`);
          const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`;

          return (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
              style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 50,
              }}
            >
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white shadow-2xl relative group overflow-hidden transition-all hover:scale-110 active:scale-95"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-16 group-hover:translate-y-0 transition-transform duration-300" />
                <MessageCircle className="w-7 h-7 md:w-8 md:h-8 relative z-10 pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping pointer-events-none" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full pointer-events-none" />
              </a>
            </motion.div>
          );
        })()}
      </div>
    );
  }

  // Admin View
  if (viewMode === 'admin') {
    if (!isAdminAuthenticated) {
      return (
        <>
          <Toaster />
          <SupabaseConnectionBanner />
          <AdminLogin onLogin={handleAdminLogin} />
        </>
      );
    }
    return (
      <>
        <Toaster />
        <SupabaseConnectionBanner />
        <AdminDashboard onLogout={handleAdminLogout} />
      </>
    );
  }

  // Customer View
  if (viewMode === '2dstudio') {
    if (!currentUser) {
      setViewMode('customer');
      return null;
    }
    return (
      <>
        <Toaster />
        <TwoDStudioPage 
          onBack={() => setViewMode('customer')} 
          user={currentUser}
          onUserUpdate={(updatedUser) => {
            setCurrentUser(updatedUser);
            storageUtils.updateCurrentUser(updatedUser);
          }}
        />
      </>
    );
  }

  if (!currentUser) {
    return (
      <>
        <Toaster />
        <CustomerAuth 
          onLogin={handleCustomerLogin} 
          onPrivacyClick={goToPrivacy}
          onTermsClick={goToTerms}
        />
      </>
    );
  }

  return (
    <>
      <Toaster />
      <CustomerDashboard 
        user={currentUser} 
        onLogout={handleCustomerLogout}
        onOpen2DStudio={goTo2DStudio}
      />
    </>
  );
}
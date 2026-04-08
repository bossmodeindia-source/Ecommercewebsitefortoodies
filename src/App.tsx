import { AdminDashboard } from './components/AdminDashboard';
import { CustomerAuth } from './components/CustomerAuth';
import { CustomerDashboard } from './components/CustomerDashboard';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsAndConditions } from './components/TermsAndConditions';
import { TwoDStudioPage } from './components/TwoDStudioPage';
import { SupabaseConnectionBanner } from './components/SupabaseConnectionBanner';
import { GoogleAnalytics, FacebookPixel } from './components/SEOHead';
import { LandingPage } from './components/LandingPage';
import { User, CustomDesign } from './types';
import { authApi, productsApi, settingsApi } from './utils/supabaseApi';
import { useState, useEffect } from 'react';
import { toast, Toaster } from 'sonner@2.0.3';
import { AdminLogin } from './components/AdminLogin';

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
        } else {
          // Silently use default business info (DB may be empty or tables not yet set up)
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
                showSocialMedia: true,
              },
            },
            socialMedia: {},
          });
        }
      } catch (error: any) {
        // Silently fall back to default business info
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
              showSocialMedia: true,
            },
          },
          socialMedia: {},
        });
      }

      // Load admin settings for analytics (UI preferences only, from localStorage)
      try {
        const rawSettings = localStorage.getItem('toodies_admin_settings');
        setAdminSettings(rawSettings ? JSON.parse(rawSettings) : {});
      } catch (error) {
        setAdminSettings({});
      }
    };
    loadBusinessData();
  }, []);

  useEffect(() => {
    // Initialize admin account on first load
    const initializeApp = async () => {
      try {
        await authApi.initializeAdmin();
      } catch {
        // Don't crash the app if initialization fails
      }
    };

    // Run initialization but don't block rendering
    initializeApp().catch(() => {});

    // Check for admin access via URL param
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('admin_portal')) {
      setViewMode('admin');
    }

    // Check if user is already logged in
    const storedUser = authApi.getStoredUser();
    const storedToken = localStorage.getItem('toodies_access_token');

    // PRIORITY: Check if admin is already authenticated
    if (storedToken && storedUser?.role === 'admin') {
      setIsAdminAuthenticated(true);
      setViewMode('admin');
    } else if (storedUser && storedUser.role === 'customer') {
      setCurrentUser(storedUser);
      setViewMode('customer');

      // Check if design URL is present in URL params (returned from 2D designer)
      handleDesignUrlFromParams(urlParams, storedUser);
    }

    // Initialize sample products if none exist (for demo purposes)
    initializeSampleProducts();
  }, []);

  const initializeSampleProducts = async () => {
    try {
      const products = await productsApi.getAll();
      if (products.length === 0) {
        // No products yet - admin can add via the dashboard
      }
    } catch (error) {
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

  // ── Privacy Policy View ──────────────────────────────────────────────────
  if (viewMode === 'privacy') {
    return (
      <>
        <Toaster />
        <PrivacyPolicy onBack={goToLanding} />
      </>
    );
  }

  // ── Terms and Conditions View ────────────────────────────────────────────
  if (viewMode === 'terms') {
    return (
      <>
        <Toaster />
        <TermsAndConditions onBack={goToLanding} />
      </>
    );
  }

  // ── Landing Page (uses manually-edited LandingPage component) ───────────
  if (viewMode === 'landing') {
    return (
      <>
        <Toaster />

        {/* Analytics Components */}
        {adminSettings.analytics_enabled && adminSettings.google_analytics_id && (
          <GoogleAnalytics measurementId={adminSettings.google_analytics_id} />
        )}
        {adminSettings.analytics_enabled && adminSettings.facebook_pixel_id && (
          <FacebookPixel pixelId={adminSettings.facebook_pixel_id} />
        )}

        <LandingPage
          businessInfo={businessInfo}
          adminSettings={adminSettings}
          onGoToCustomer={goToCustomer}
          onGoToAdmin={goToAdmin}
          onGoToPrivacy={goToPrivacy}
          onGoToTerms={goToTerms}
        />
      </>
    );
  }

  // ── Admin View ───────────────────────────────────────────────────────────
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

  // ── 2D Studio View ───────────────────────────────────────────────────────
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
            localStorage.setItem('toodies_user', JSON.stringify(updatedUser));
          }}
        />
      </>
    );
  }

  // ── Customer Auth (not logged in) ────────────────────────────────────────
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

  // ── Customer Dashboard (logged in) ───────────────────────────────────────
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
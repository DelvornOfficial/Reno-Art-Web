import React, { useState, useEffect, lazy, Suspense } from 'react';
import './App.css';
import Header from './components';
import ProductCatalog from './components/catalog/ProductCatalog';
import CurrencySwitcher from './components/currency/CurrencySwitcher';
import Footer from './components/footer/Footer';
import { fetchProductById, pingUserActivity, fetchUserPurchases } from './services/api';
import { useToast } from './context/ToastContext';

// On-Demand Lazy Loaded Pages (Downloaded ONLY when visitor actually visits the page)
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const MyProductsPage = lazy(() => import('./pages/MyProductsPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));

// Lazy load heavy modal & drawers
const LoginModal = lazy(() => import('./components/auth/LoginModal'));
const CartDrawer = lazy(() => import('./components/cart/CartDrawer'));
const ProfileModal = lazy(() => import('./components/profile/ProfileModal'));

// Ultra-fast lightweight minimal fallback loader during route transitions
function PageLoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '1rem',
      color: '#6B6861',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        border: '2px solid rgba(10, 10, 12, 0.1)',
        borderTopColor: '#0A0A0C',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite'
      }} />
      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Loading Studio Experience...</span>
    </div>
  );
}

export function App() {
  const { showToast } = useToast();
  const [currentRoute, setCurrentRoute] = useState(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path === '/signup' || hash === '#signup') return 'signup';
    if (path === '/billing' || hash === '#billing') return 'billing';
    if (path === '/profile' || hash === '#profile') return 'profile';
    if (path === '/my-products' || hash === '#my-products') return 'my-products';
    if (path === '/terms' || hash === '#terms') return 'terms';
    if (path === '/privacy' || hash === '#privacy') return 'privacy';
    if (path === '/refund' || hash === '#refund') return 'refund';
    if (path === '/license' || hash === '#license') return 'license';
    if (path.startsWith('/product/') || hash.startsWith('#product/')) return 'product';
    return 'home';
  });

  const [selectedProductId, setSelectedProductId] = useState(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path.startsWith('/product/')) return path.replace('/product/', '');
    if (hash.startsWith('#product/')) return hash.replace('#product/', '');
    return null;
  });

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [hasDismissedLogin, setHasDismissedLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem('reno_user')));
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('reno_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem('reno_cart_items');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const updateCartItems = (updater) => {
    setCartItems((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('reno_cart_items', JSON.stringify(next));
      } catch (e) {
        console.error('Failed saving cart to localStorage', e);
      }
      return next;
    });
  };
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) return hash;
    return localStorage.getItem('reno_active_profile_tab') || 'subscription';
  });

  const handleSelectProfileTab = (tabId) => {
    setActiveProfileTab(tabId);
    try {
      localStorage.setItem('reno_active_profile_tab', tabId);
      window.history.replaceState({ route: 'profile', tab: tabId }, '', `/profile#${tabId}`);
    } catch { }
  };
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(false);
  const [purchasedProducts, setPurchasedProducts] = useState(() => {
    try {
      const stored = localStorage.getItem('reno_purchased_products');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Cross-device Cloud Sync: Fetch real purchased products from database for logged in user
  useEffect(() => {
    if (user) {
      const userIdOrEmail = user.id || user.email || user.identifier;
      setIsLoadingPurchases(true);
      fetchUserPurchases(userIdOrEmail)
        .then((serverPurchases) => {
          if (serverPurchases && Array.isArray(serverPurchases)) {
            setPurchasedProducts(serverPurchases);
            localStorage.setItem('reno_purchased_products', JSON.stringify(serverPurchases));
          }
        })
        .finally(() => {
          setIsLoadingPurchases(false);
        });
    }
  }, [user?.id, user?.email, user?.identifier]);

  const handleLoginSuccess = (userData) => {
    const userPayload = userData || { identifier: 'architect@studio.design' };
    setIsLoggedIn(true);
    setUser(userPayload);
    localStorage.setItem('reno_user', JSON.stringify(userPayload));
    setIsLoginOpen(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('reno_user');
    setIsProfileOpen(false);
  };

  const handleAddToCart = (product) => {
    if (!isLoggedIn) {
      setIsLoginOpen(true);
      return;
    }
    const isPurchased = (purchasedProducts || []).some(
      (p) => String(p.id) === String(product.id) || String(p.product_id) === String(product.id)
    );
    if (isPurchased) {
      showToast("You have already purchased this product. You can access it in My Products.", "info");
      return;
    }
    updateCartItems((prev) => {
      if (prev.some((item) => item.id === product.id)) return prev;
      return [...prev, product];
    });
    setIsCartOpen(true);

    if (user && user.id) {
      pingUserActivity(user.id, {
        cart_items_count: cartItems.length + 1,
        cart_product_ids: [...cartItems, product].map(i => i.id).join(','),
        current_page: currentRoute,
        funnel_stage: "Cart Active",
        cart_dropoff_event: {
          action: "added_to_cart",
          product_id: product.id,
          product_title: product.title,
          price: product.price
        }
      });
    }
  };

  const handleRemoveFromCart = (index) => {
    const removedItem = cartItems[index];
    updateCartItems((prev) => prev.filter((_, i) => i !== index));

    if (user && user.id && removedItem) {
      pingUserActivity(user.id, {
        cart_items_count: Math.max(0, cartItems.length - 1),
        cart_product_ids: cartItems.filter((_, i) => i !== index).map(i => i.id).join(','),
        current_page: currentRoute,
        funnel_stage: cartItems.length - 1 === 0 ? "Browsing" : "Cart Active",
        cart_dropoff_event: {
          action: "removed_from_cart",
          product_id: removedItem.id,
          product_title: removedItem.title,
          price: removedItem.price
        }
      });
    }
  };

  const handleCheckout = (selectedItems = null) => {
    if (!isLoggedIn) {
      setIsLoginOpen(true);
      return;
    }
    setIsCartOpen(false);
    setCurrentRoute('billing');
    window.history.pushState({ route: 'billing' }, '', '/billing');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (user && user.id) {
      pingUserActivity(user.id, {
        cart_items_count: cartItems.length,
        cart_product_ids: cartItems.map(i => i.id).join(','),
        current_page: 'billing',
        funnel_stage: "Entered Billing",
        cart_dropoff_event: {
          action: "entered_billing_page",
          items_count: cartItems.length
        }
      });
    }
  };

  const handleBuyNow = (product) => {
    if (!isLoggedIn) {
      setIsLoginOpen(true);
      return;
    }
    const isPurchased = (purchasedProducts || []).some(
      (p) => String(p.id) === String(product.id) || String(p.product_id) === String(product.id)
    );
    if (isPurchased) {
      showToast("You have already purchased this product. You can access it in My Products.", "info");
      return;
    }
    updateCartItems((prev) => {
      if (prev.some((item) => item.id === product.id)) return prev;
      return [...prev, product];
    });
    setCheckoutItems([product]);
    setIsCartOpen(false);
    setCurrentRoute('billing');
    window.history.pushState({ route: 'billing' }, '', '/billing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [checkoutItems, setCheckoutItems] = useState(null);

  const handleCompletePurchase = (itemsBought) => {
    const updatedPurchased = [...purchasedProducts, ...itemsBought];
    setPurchasedProducts(updatedPurchased);
    localStorage.setItem('reno_purchased_products', JSON.stringify(updatedPurchased));

    // Remove bought items from cart
    const boughtIds = new Set(itemsBought.map(b => b.id));
    updateCartItems(prev => prev.filter(item => !boughtIds.has(item.id)));
    setCheckoutItems(null);
  };

  const navigateToProfileTab = (tabId = 'profile-setting') => {
    if (tabId === 'my-product') {
      setCurrentRoute('my-products');
      window.history.pushState({ route: 'my-products' }, '', '/my-products');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setActiveProfileTab(tabId);
    setCurrentRoute('profile');
    window.history.pushState({ route: 'profile', tab: tabId }, '', `/profile#${tabId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/signup' || hash === '#signup') setCurrentRoute('signup');
      else if (path === '/billing' || hash === '#billing') setCurrentRoute('billing');
      else if (path === '/profile' || hash === '#profile') setCurrentRoute('profile');
      else if (path === '/my-products' || hash === '#my-products') setCurrentRoute('my-products');
      else if (path === '/terms' || hash === '#terms') setCurrentRoute('terms');
      else if (path === '/privacy' || hash === '#privacy') setCurrentRoute('privacy');
      else if (path === '/refund' || hash === '#refund') setCurrentRoute('refund');
      else if (path === '/license' || hash === '#license') setCurrentRoute('license');
      else if (path.startsWith('/product/') || hash.startsWith('#product/')) {
        const id = path.startsWith('/product/') ? path.replace('/product/', '') : hash.replace('#product/', '');
        setSelectedProductId(id);
        setCurrentRoute('product');
      } else {
        setCurrentRoute('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  // Activity heartbeat & Dwell / Funnel telemetry to CRM
  useEffect(() => {
    if (!user || !user.id) return;
    const pageKey = currentRoute || 'home';
    const interval = setInterval(() => {
      pingUserActivity(user.id, {
        cart_items_count: cartItems.length,
        cart_product_ids: cartItems.map(i => i.id).join(','),
        current_page: currentRoute,
        current_product_id: selectedProductId || '',
        current_product_title: selectedProduct ? selectedProduct.title : '',
        time_spent_seconds: 10,
        page_dwell_times: { [pageKey]: 10 },
        funnel_stage: currentRoute === 'billing' ? "Entered Billing" : (cartItems.length > 0 ? "Cart Active" : "Browsing")
      });
    }, 10000);

    // Initial ping
    pingUserActivity(user.id, {
      cart_items_count: cartItems.length,
      cart_product_ids: cartItems.map(i => i.id).join(','),
      current_page: currentRoute,
      current_product_id: selectedProductId || '',
      current_product_title: selectedProduct ? selectedProduct.title : '',
      time_spent_seconds: 0,
      page_dwell_times: { [pageKey]: 1 },
      funnel_stage: currentRoute === 'billing' ? "Entered Billing" : (cartItems.length > 0 ? "Cart Active" : "Browsing")
    });

    return () => clearInterval(interval);
  }, [user, currentRoute, selectedProductId, selectedProduct, cartItems.length]);
  useEffect(() => {
    if (isLoggedIn || isLoginOpen) return;

    // Interval ladder: 10s, 30s, 60s, 90s...
    const promptIntervals = [10000, 30000, 60000, 90000];
    const attempt = Number(sessionStorage.getItem('reno_login_prompt_count') || 0);
    const delay = attempt < promptIntervals.length ? promptIntervals[attempt] : 90000;

    const timer = setTimeout(() => {
      setIsLoginOpen(true);
      sessionStorage.setItem('reno_login_prompt_count', String(attempt + 1));
    }, delay);

    return () => clearTimeout(timer);
  }, [isLoggedIn, isLoginOpen]);

  // Navigate to Signup Dedicated Page (Updates browser URL without full reload)
  const navigateToSignup = () => {
    setIsLoginOpen(false);
    setCurrentRoute('signup');
    window.history.pushState({ route: 'signup' }, '', '/signup');
  };

  // Navigate back to Home (Updates browser URL without full reload)
  const navigateToHome = () => {
    setCurrentRoute('home');
    window.history.pushState({ route: 'home' }, '', '/');
  };

  // Close Login Modal handler: when closed without logging in, reveal persistent login button in header
  const handleCloseLogin = () => {
    setIsLoginOpen(false);
    setHasDismissedLogin(true);
  };

  const handleOpenLogin = () => {
    setIsLoginOpen(true);
  };

  const navigateToProfile = () => {
    setCurrentRoute('profile');
    window.history.pushState({ route: 'profile' }, '', '/profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTogglePlan = (newPlan) => {
    const updated = { ...(user || {}), plan: newPlan };
    setUser(updated);
    localStorage.setItem('reno_user', JSON.stringify(updated));
  };

  // If on individual product page
  useEffect(() => {
    if (currentRoute === 'product' && selectedProductId) {
      setIsLoadingProduct(true);
      fetchProductById(selectedProductId)
        .then((p) => {
          setSelectedProduct(p);
        })
        .finally(() => {
          setIsLoadingProduct(false);
        });
    }
  }, [currentRoute, selectedProductId]);

  const navigateToProduct = (prod) => {
    setSelectedProductId(prod.id);
    setSelectedProduct(prod);
    setIsLoadingProduct(false);
    setCurrentRoute('product');
    window.history.pushState({ route: 'product', id: prod.id }, '', `/product/${prod.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If on individual product page
  if (currentRoute === 'product') {
    const product = selectedProduct;
    return (
      <div className="app-container">
        <Header
          onOpenLogin={handleOpenLogin}
          showLoginBtn={!isLoggedIn}
          isLoggedIn={isLoggedIn}
          user={user}
          onOpenProfile={navigateToProfile}
          cartCount={cartItems.length}
          onOpenCart={() => setIsCartOpen(true)}
          onNavigateSidebar={(itemId) => navigateToProfileTab(itemId)}
        />
        <ProductDetailPage
          product={product}
          isLoadingProduct={isLoadingProduct}
          user={user}
          onNavigateToHome={navigateToHome}
          onOpenLogin={handleOpenLogin}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          cartProductIds={cartItems.map((item) => item.id)}
          isPurchased={(purchasedProducts || []).some(
            (p) => String(p.id) === String(product?.id) || String(p.product_id) === String(product?.id)
          )}
        />
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onRemoveItem={handleRemoveFromCart}
          onCheckout={() => {
            setCheckoutItems(null);
            handleCheckout();
          }}
          onSingleCheckout={(singleItem) => {
            setCheckoutItems([singleItem]);
            handleCheckout();
          }}
          isLoggedIn={isLoggedIn}
          onOpenLogin={handleOpenLogin}
        />
        <LoginModal
          isOpen={isLoginOpen}
          onClose={handleCloseLogin}
          onNavigateToSignup={navigateToSignup}
          onLoginSuccess={handleLoginSuccess}
        />
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          user={user}
          onLogout={handleLogout}
        />
        <CurrencySwitcher />
      </div>
    );
  }

  // If on legal document pages (terms, privacy, refund, license)
  if (['terms', 'privacy', 'refund', 'license'].includes(currentRoute)) {
    return (
      <div className="app-container">
        <Header
          onOpenLogin={handleOpenLogin}
          showLoginBtn={!isLoggedIn}
          isLoggedIn={isLoggedIn}
          user={user}
          onOpenProfile={navigateToProfile}
          cartCount={cartItems.length}
          onOpenCart={() => setIsCartOpen(true)}
        />
        <Suspense fallback={<PageLoadingFallback />}>
          <LegalPage
            type={currentRoute}
            onNavigateToHome={navigateToHome}
            onOpenLogin={handleOpenLogin}
          />
        </Suspense>
        <Suspense fallback={null}>
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cartItems={cartItems}
            onRemoveItem={handleRemoveFromCart}
            onCheckout={() => {
              setCheckoutItems(null);
              handleCheckout();
            }}
            onSingleCheckout={(singleItem) => {
              setCheckoutItems([singleItem]);
              handleCheckout();
            }}
            isLoggedIn={isLoggedIn}
            onOpenLogin={handleOpenLogin}
          />
          <LoginModal
            isOpen={isLoginOpen}
            onClose={handleCloseLogin}
            onNavigateToSignup={navigateToSignup}
            onLoginSuccess={handleLoginSuccess}
          />
          <ProfileModal
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            user={user}
            onLogout={handleLogout}
          />
        </Suspense>
        <CurrencySwitcher />
      </div >
    );
  }

  // If on dedicated billing & checkout page
  if (currentRoute === 'billing') {
    return (
      <div className="app-container">
        <Suspense fallback={<PageLoadingFallback />}>
          <BillingPage
            cartItems={checkoutItems && checkoutItems.length > 0 ? checkoutItems : cartItems}
            allCartItems={cartItems}
            user={user}
            onNavigateToHome={navigateToHome}
            onNavigateToProfile={() => navigateToProfileTab('my-product')}
            onCompletePurchase={handleCompletePurchase}
            onSelectCheckoutItem={(item) => setCheckoutItems(item ? [item] : null)}
          />
        </Suspense>
      </div >
    );
  }

  // If on dedicated my purchased products page
  if (currentRoute === 'my-products') {
    return (
      <div className="app-container">
        <Suspense fallback={<PageLoadingFallback />}>
          <MyProductsPage
            user={user}
            purchasedProducts={purchasedProducts}
            isLoading={isLoadingPurchases}
            onNavigateToHome={navigateToHome}
            onOpenProduct={(prod) => navigateToProduct(prod.id)}
          />
        </Suspense>
      </div>
    );
  }

  // If on dedicated profile page
  if (currentRoute === 'profile') {
    return (
      <div className="app-container">
        <Suspense fallback={<PageLoadingFallback />}>
          <ProfilePage
            user={user}
            onNavigateToHome={navigateToHome}
            onLogout={handleLogout}
            onTogglePlan={handleTogglePlan}
            purchasedProducts={purchasedProducts}
            activeSidebarItem={activeProfileTab}
            onSelectSidebarItem={handleSelectProfileTab}
          />
        </Suspense>
      </div>
    );
  }

  // If on signup page, render the dedicated page
  if (currentRoute === 'signup') {
    return (
      <Suspense fallback={<PageLoadingFallback />}>
        <SignupPage
          onNavigateToHome={navigateToHome}
          onOpenLogin={handleOpenLogin}
          onSignupSuccess={handleLoginSuccess}
        />
      </Suspense>
    );
  }

  // Home Screen with Header and Automatic Login Overlay
  return (
    <div className="app-container">
      <Header
        onOpenLogin={handleOpenLogin}
        showLoginBtn={!isLoggedIn}
        isLoggedIn={isLoggedIn}
        user={user}
        onOpenProfile={navigateToProfile}
        cartCount={cartItems.length}
        onOpenCart={() => setIsCartOpen(true)}
        onNavigateSidebar={(itemId) => navigateToProfileTab(itemId)}
      />

      {/* E-Commerce Product Catalog & 3D Architectural Showcase */}
      <main className="app-main-content">
        <ProductCatalog
          onQuickView={navigateToProduct}
          onAddToCart={handleAddToCart}
          cartProductIds={cartItems.map((item) => item.id)}
          purchasedProductIds={(purchasedProducts || []).flatMap((p) => [
            p.id ? String(p.id) : null,
            p.product_id ? String(p.product_id) : null
          ]).filter(Boolean)}
        />
      </main>

      {/* Modern Minimalist Footer */}
      <Footer />

      {/* Shopping Cart Drawer, Login & Profile (Suspense Isolated) */}
      <Suspense fallback={null}>
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onRemoveItem={handleRemoveFromCart}
          onCheckout={() => {
            setCheckoutItems(null);
            handleCheckout();
          }}
          onSingleCheckout={(singleItem) => {
            setCheckoutItems([singleItem]);
            handleCheckout();
          }}
          isLoggedIn={isLoggedIn}
          onOpenLogin={handleOpenLogin}
        />

        <LoginModal
          isOpen={isLoginOpen}
          onClose={handleCloseLogin}
          onNavigateToSignup={navigateToSignup}
          onLoginSuccess={handleLoginSuccess}
        />

        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          user={user}
          onLogout={handleLogout}
        />
      </Suspense>

      {/* Floating Currency Selector */}
      <CurrencySwitcher />
    </div >
  );
}

export default App;

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ShopProvider } from './context/ShopContext';
import { RouterProvider } from './context/RouterContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { CartDrawer } from './components/storefront/CartDrawer';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { WhatsAppButton } from './components/common/WhatsAppButton';

import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { WishlistPage } from './pages/WishlistPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { PoliciesPage } from './pages/PoliciesPage';
import { AuthPage } from './pages/AuthPage';
import { AccountPage } from './pages/AccountPage';
import { DealsPage } from './pages/DealsPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { FaqPage } from './pages/FaqPage';
import { BlogPage } from './pages/BlogPage';
import { BlogPostPage } from './pages/BlogPostPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { ShippingPolicyPage } from './pages/ShippingPolicyPage';
import { ReturnPolicyPage } from './pages/ReturnPolicyPage';
import { RefundPolicyPage } from './pages/RefundPolicyPage';
import { NotFoundPage } from './pages/NotFoundPage';

import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
};

const StorefrontLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF9F5] text-[#1E1012]">
      <Header />
      <CartDrawer />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileBottomNav />
      <WhatsAppButton />
    </div>
  );
};

export function App() {
  return (
    <ShopProvider>
      <Router>
        <RouterProvider>
          <ScrollToTop />
          <Routes>
            {/* Storefront Public Routes */}
            <Route path="/" element={<StorefrontLayout><HomePage /></StorefrontLayout>} />
            <Route path="/shop" element={<StorefrontLayout><CatalogPage /></StorefrontLayout>} />
            <Route path="/shop/:category" element={<StorefrontLayout><CatalogPage /></StorefrontLayout>} />
            <Route path="/catalog" element={<StorefrontLayout><CatalogPage /></StorefrontLayout>} />
            
            <Route path="/product/:id" element={<StorefrontLayout><ProductDetailPage /></StorefrontLayout>} />
            <Route path="/product/slug/:slug" element={<StorefrontLayout><ProductDetailPage /></StorefrontLayout>} />
            
            <Route path="/cart" element={<StorefrontLayout><CartPage /></StorefrontLayout>} />
            <Route path="/wishlist" element={<StorefrontLayout><WishlistPage /></StorefrontLayout>} />
            <Route path="/checkout" element={<StorefrontLayout><CheckoutPage /></StorefrontLayout>} />
            <Route path="/order-confirmation/:orderId" element={<StorefrontLayout><OrderConfirmationPage /></StorefrontLayout>} />
            <Route path="/order-success/:orderId" element={<StorefrontLayout><OrderConfirmationPage /></StorefrontLayout>} />
            <Route path="/tracking" element={<StorefrontLayout><OrderTrackingPage /></StorefrontLayout>} />
            <Route path="/track-order" element={<StorefrontLayout><OrderTrackingPage /></StorefrontLayout>} />
            
            <Route path="/about" element={<StorefrontLayout><AboutPage /></StorefrontLayout>} />
            <Route path="/contact" element={<StorefrontLayout><ContactPage /></StorefrontLayout>} />
            <Route path="/faq" element={<StorefrontLayout><FaqPage /></StorefrontLayout>} />
            
            <Route path="/blog" element={<StorefrontLayout><BlogPage /></StorefrontLayout>} />
            <Route path="/blog/:slug" element={<StorefrontLayout><BlogPostPage /></StorefrontLayout>} />
            
            <Route path="/policies" element={<StorefrontLayout><PoliciesPage /></StorefrontLayout>} />
            <Route path="/privacy" element={<StorefrontLayout><PrivacyPolicyPage /></StorefrontLayout>} />
            <Route path="/terms" element={<StorefrontLayout><TermsPage /></StorefrontLayout>} />
            <Route path="/shipping-policy" element={<StorefrontLayout><ShippingPolicyPage /></StorefrontLayout>} />
            <Route path="/returns" element={<StorefrontLayout><ReturnPolicyPage /></StorefrontLayout>} />
            <Route path="/return-policy" element={<StorefrontLayout><ReturnPolicyPage /></StorefrontLayout>} />
            <Route path="/refund-policy" element={<StorefrontLayout><RefundPolicyPage /></StorefrontLayout>} />
            <Route path="/deals" element={<StorefrontLayout><DealsPage /></StorefrontLayout>} />

            {/* Auth & Account Routes */}
            <Route path="/auth" element={<StorefrontLayout><AuthPage /></StorefrontLayout>} />
            <Route path="/login" element={<StorefrontLayout><AuthPage /></StorefrontLayout>} />
            <Route path="/account" element={<StorefrontLayout><AccountPage /></StorefrontLayout>} />
            <Route path="/account/orders" element={<StorefrontLayout><AccountPage /></StorefrontLayout>} />
            <Route path="/account/orders/:id" element={<StorefrontLayout><AccountPage /></StorefrontLayout>} />
            <Route path="/account/addresses" element={<StorefrontLayout><AccountPage /></StorefrontLayout>} />

            {/* Admin Management Suite (Protected Routes) */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="products/new" element={<AdminProductsPage />} />
              <Route path="products/:id" element={<AdminProductsPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="orders/:id" element={<AdminOrdersPage />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="customers" element={<AdminCustomersPage />} />
              <Route path="coupons" element={<AdminCouponsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="inventory" element={<AdminProductsPage />} />
              <Route path="suppliers" element={<AdminProductsPage />} />
              <Route path="couriers" element={<AdminSettingsPage />} />
              <Route path="media" element={<AdminSettingsPage />} />
              <Route path="banners" element={<AdminSettingsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
            </Route>

            {/* Custom 404 Route */}
            <Route path="*" element={<StorefrontLayout><NotFoundPage /></StorefrontLayout>} />
          </Routes>
        </RouterProvider>
      </Router>
    </ShopProvider>
  );
}

export default App;

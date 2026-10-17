/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ShopProvider, useShop } from './context/ShopContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { ToastContainer } from './components/common/ToastContainer';
import { AuthModal } from './components/common/AuthModal';
import { CartDrawer } from './components/storefront/CartDrawer';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { CustomerAccountPage } from './pages/CustomerAccountPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PoliciesPage } from './pages/PoliciesPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AdminPages } from './pages/admin/AdminPages';
import { ErrorBoundary } from './components/common/ErrorBoundary';

import { WhatsAppButton } from './components/common/WhatsAppButton';

const AppLayout: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, authModalMode } = useShop();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-slate-900 selection:bg-amber-900 selection:text-white">
      <Header />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/catalog/:categorySlug" element={<CatalogPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/tracking" element={<OrderTrackingPage />} />
          <Route path="/tracking/:orderId" element={<OrderTrackingPage />} />
          <Route path="/account" element={<CustomerAccountPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/policies" element={<PoliciesPage defaultTab="about" />} />
          <Route path="/privacy-policy" element={<PoliciesPage defaultTab="privacy" />} />
          <Route path="/shipping-policy" element={<PoliciesPage defaultTab="shipping" />} />
          <Route path="/refund-policy" element={<PoliciesPage defaultTab="refund" />} />
          <Route path="/return-policy" element={<PoliciesPage defaultTab="return" />} />
          <Route path="/cancellation-policy" element={<PoliciesPage defaultTab="cancellation" />} />
          <Route path="/terms" element={<PoliciesPage defaultTab="terms" />} />
          <Route path="/terms-conditions" element={<PoliciesPage defaultTab="terms" />} />
          <Route path="/faq" element={<PoliciesPage defaultTab="faq" />} />
          <Route path="/admin" element={<AdminPages />} />
          <Route path="/admin/:tab" element={<AdminPages />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <CartDrawer />
      <WhatsAppButton />
      <Footer />
      <ToastContainer />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ShopProvider>
          <AppLayout />
        </ShopProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

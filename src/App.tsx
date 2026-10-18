/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ShopProvider, useShop } from './context/ShopContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { ToastContainer } from './components/common/ToastContainer';
import { AuthModal } from './components/common/AuthModal';
import { CartDrawer } from './components/storefront/CartDrawer';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { OfflineBanner } from './components/common/OfflineBanner';
import { RequireAuth, RequireRole } from './components/common/RouteGuards';
import { WhatsAppButton } from './components/common/WhatsAppButton';
import { lazyRetry } from './utils/lazyRetry';
import {
  ProductGridSkeleton,
  ProductDetailSkeleton,
  PageSkeleton,
  TableSkeleton,
} from './components/common/Skeletons';

// Core entry pages retained in primary bundle
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { CartPage } from './pages/CartPage';

// Code-split auxiliary and heavy pages via lazyRetry
const ProductDetailPage = lazyRetry(
  () => import('./pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })),
  'ProductDetailPage'
);
const CheckoutPage = lazyRetry(
  () => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })),
  'CheckoutPage'
);
const PaymentPage = lazyRetry(
  () => import('./pages/PaymentPage').then((m) => ({ default: m.PaymentPage })),
  'PaymentPage'
);
const OrderTrackingPage = lazyRetry(
  () => import('./pages/OrderTrackingPage').then((m) => ({ default: m.OrderTrackingPage })),
  'OrderTrackingPage'
);
const CustomerAccountPage = lazyRetry(
  () => import('./pages/CustomerAccountPage').then((m) => ({ default: m.CustomerAccountPage })),
  'CustomerAccountPage'
);
const ResetPasswordPage = lazyRetry(
  () => import('./pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
  'ResetPasswordPage'
);
const AboutPage = lazyRetry(
  () => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })),
  'AboutPage'
);
const ContactPage = lazyRetry(
  () => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })),
  'ContactPage'
);
const PoliciesPage = lazyRetry(
  () => import('./pages/PoliciesPage').then((m) => ({ default: m.PoliciesPage })),
  'PoliciesPage'
);
const NotFoundPage = lazyRetry(
  () => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
  'NotFoundPage'
);
const ErrorPage = lazyRetry(
  () => import('./pages/ErrorPage').then((m) => ({ default: m.ErrorPage })),
  'ErrorPage'
);
const AdminPages = lazyRetry(
  () => import('./pages/admin/AdminPages').then((m) => ({ default: m.AdminPages })),
  'AdminPages'
);

const AppLayout: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, authModalMode } = useShop();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-slate-900 selection:bg-amber-900 selection:text-white">
      <OfflineBanner />
      <Header />

      <main className="flex-1">
        <ErrorBoundary level="section" name="storefront-routes">
          <Routes>
            {/* Core Storefront */}
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/catalog/:categorySlug" element={<CatalogPage />} />
            <Route path="/cart" element={<CartPage />} />

            {/* Code-split Product Detail with Skeleton */}
            <Route
              path="/product/:slug"
              element={
                <Suspense fallback={<ProductDetailSkeleton />}>
                  <ProductDetailPage />
                </Suspense>
              }
            />

            {/* Code-split Checkout with Skeleton */}
            <Route
              path="/checkout"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <CheckoutPage />
                </Suspense>
              }
            />

            {/* Code-split Payment & UTR Portal with Skeleton */}
            <Route
              path="/pay/:orderNumber"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <PaymentPage />
                </Suspense>
              }
            />

            {/* Order Tracking with Skeleton */}
            <Route
              path="/tracking"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <OrderTrackingPage />
                </Suspense>
              }
            />
            <Route
              path="/tracking/:orderId"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <OrderTrackingPage />
                </Suspense>
              }
            />

            {/* Customer Account with Authentication Guard */}
            <Route
              path="/account"
              element={
                <RequireAuth>
                  <Suspense fallback={<PageSkeleton />}>
                    <CustomerAccountPage />
                  </Suspense>
                </RequireAuth>
              }
            />

            {/* Password Reset */}
            <Route
              path="/reset-password"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <ResetPasswordPage />
                </Suspense>
              }
            />

            {/* Static Information & Policy Pages */}
            <Route
              path="/about"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <AboutPage />
                </Suspense>
              }
            />
            <Route
              path="/contact"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <ContactPage />
                </Suspense>
              }
            />
            <Route
              path="/policies"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <PoliciesPage defaultTab="about" />
                </Suspense>
              }
            />
            <Route
              path="/privacy-policy"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <PoliciesPage defaultTab="privacy" />
                </Suspense>
              }
            />
            <Route
              path="/shipping-policy"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <PoliciesPage defaultTab="shipping" />
                </Suspense>
              }
            />
            <Route
              path="/refund-policy"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <PoliciesPage defaultTab="refund" />
                </Suspense>
              }
            />
            <Route
              path="/return-policy"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <PoliciesPage defaultTab="return" />
                </Suspense>
              }
            />
            <Route
              path="/cancellation-policy"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <PoliciesPage defaultTab="cancellation" />
                </Suspense>
              }
            />
            <Route
              path="/terms"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <PoliciesPage defaultTab="terms" />
                </Suspense>
              }
            />
            <Route
              path="/terms-conditions"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <PoliciesPage defaultTab="terms" />
                </Suspense>
              }
            />
            <Route
              path="/faq"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <PoliciesPage defaultTab="faq" />
                </Suspense>
              }
            />

            {/* Dedicated 500 Route */}
            <Route
              path="/500"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <ErrorPage />
                </Suspense>
              }
            />

            {/* Admin Management Hub with Role Guard */}
            <Route
              path="/admin"
              element={
                <RequireRole roles={['staff', 'admin', 'super_admin']}>
                  <Suspense fallback={<TableSkeleton rows={8} />}>
                    <AdminPages />
                  </Suspense>
                </RequireRole>
              }
            />
            <Route
              path="/admin/:tab"
              element={
                <RequireRole roles={['staff', 'admin', 'super_admin']}>
                  <Suspense fallback={<TableSkeleton rows={8} />}>
                    <AdminPages />
                  </Suspense>
                </RequireRole>
              }
            />

            {/* 404 Fallback */}
            <Route
              path="*"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <NotFoundPage />
                </Suspense>
              }
            />
          </Routes>
        </ErrorBoundary>
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
    <ErrorBoundary level="full" name="app-root">
      <BrowserRouter>
        <ShopProvider>
          <AppLayout />
        </ShopProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

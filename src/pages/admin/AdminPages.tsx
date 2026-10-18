import React, { useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ToastContainer } from '../../components/common/ToastContainer';
import { AuthModal } from '../../components/common/AuthModal';

// Code-split admin modules to prevent bloating public storefront bundle
const AdminDashboard = lazy(() => import('../../components/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const HomepageManager = lazy(() => import('../../components/admin/HomepageManager').then((m) => ({ default: m.HomepageManager })));
const MediaLibraryPage = lazy(() => import('../../components/admin/MediaLibraryPage').then((m) => ({ default: m.MediaLibraryPage })));
const ProductManager = lazy(() => import('../../components/admin/ProductManager').then((m) => ({ default: m.ProductManager })));
const CategoryManager = lazy(() => import('../../components/admin/CategoryManager').then((m) => ({ default: m.CategoryManager })));
const OrderManager = lazy(() => import('../../components/admin/OrderManager').then((m) => ({ default: m.OrderManager })));
const CustomerManager = lazy(() => import('../../components/admin/CustomerManager').then((m) => ({ default: m.CustomerManager })));
const InventoryManager = lazy(() => import('../../components/admin/InventoryManager').then((m) => ({ default: m.InventoryManager })));
const SupplierManager = lazy(() => import('../../components/admin/SupplierManager').then((m) => ({ default: m.SupplierManager })));
const CourierManager = lazy(() => import('../../components/admin/CourierManager').then((m) => ({ default: m.CourierManager })));
const CouponManager = lazy(() => import('../../components/admin/CouponManager').then((m) => ({ default: m.CouponManager })));
const ContentManager = lazy(() => import('../../components/admin/ContentManager').then((m) => ({ default: m.ContentManager })));
const NotificationManager = lazy(() => import('../../components/admin/NotificationManager').then((m) => ({ default: m.NotificationManager })));

const AdminLoadingFallback: React.FC = () => (
  <div className="min-h-[400px] flex items-center justify-center p-12 text-center">
    <div className="space-y-3">
      <div className="w-8 h-8 border-2 border-amber-900 border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs text-stone-500 font-medium">Loading Management Suite...</p>
    </div>
  </div>
);

export const AdminPages: React.FC = () => {
  const { tab } = useParams<{ tab?: string }>();
  const { setAdminTab, setViewMode, isAuthModalOpen, setIsAuthModalOpen, authModalMode } = useShop();
  const navigate = useNavigate();

  const currentTab = tab || 'dashboard';

  useEffect(() => {
    setViewMode('admin');
    const validTabs = [
      'dashboard',
      'homepage',
      'media',
      'products',
      'categories',
      'orders',
      'inventory',
      'suppliers',
      'couriers',
      'coupons',
      'content',
      'customers',
      'notifications',
    ] as const;

    if (validTabs.includes(currentTab as any)) {
      setAdminTab(currentTab as any);
    } else {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [currentTab, setAdminTab, setViewMode, navigate]);

  return (
    <AdminLayout>
      <Suspense fallback={<AdminLoadingFallback />}>
        {currentTab === 'dashboard' && <AdminDashboard />}
        {currentTab === 'homepage' && <HomepageManager />}
        {currentTab === 'media' && <MediaLibraryPage />}
        {currentTab === 'products' && <ProductManager />}
        {currentTab === 'categories' && <CategoryManager />}
        {currentTab === 'orders' && <OrderManager />}
        {currentTab === 'customers' && <CustomerManager />}
        {currentTab === 'inventory' && <InventoryManager />}
        {currentTab === 'suppliers' && <SupplierManager />}
        {currentTab === 'couriers' && <CourierManager />}
        {currentTab === 'coupons' && <CouponManager />}
        {currentTab === 'content' && <ContentManager />}
        {currentTab === 'notifications' && <NotificationManager />}
      </Suspense>

      <ToastContainer />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
      />
    </AdminLayout>
  );
};

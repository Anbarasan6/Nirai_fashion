import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { AdminDashboard } from '../../components/admin/AdminDashboard';
import { HomepageManager } from '../../components/admin/HomepageManager';
import { MediaLibraryPage } from '../../components/admin/MediaLibraryPage';
import { ProductManager } from '../../components/admin/ProductManager';
import { CategoryManager } from '../../components/admin/CategoryManager';
import { OrderManager } from '../../components/admin/OrderManager';
import { CustomerManager } from '../../components/admin/CustomerManager';
import { InventoryManager } from '../../components/admin/InventoryManager';
import { SupplierManager } from '../../components/admin/SupplierManager';
import { CouponManager } from '../../components/admin/CouponManager';
import { ContentManager } from '../../components/admin/ContentManager';
import { ToastContainer } from '../../components/common/ToastContainer';
import { AuthModal } from '../../components/common/AuthModal';

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
      'coupons',
      'content',
      'customers',
    ] as const;

    if (validTabs.includes(currentTab as any)) {
      setAdminTab(currentTab as any);
    } else {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [currentTab, setAdminTab, setViewMode, navigate]);

  return (
    <AdminLayout>
      {currentTab === 'dashboard' && <AdminDashboard />}
      {currentTab === 'homepage' && <HomepageManager />}
      {currentTab === 'media' && <MediaLibraryPage />}
      {currentTab === 'products' && <ProductManager />}
      {currentTab === 'categories' && <CategoryManager />}
      {currentTab === 'orders' && <OrderManager />}
      {currentTab === 'customers' && <CustomerManager />}
      {currentTab === 'inventory' && <InventoryManager />}
      {currentTab === 'suppliers' && <SupplierManager />}
      {currentTab === 'coupons' && <CouponManager />}
      {currentTab === 'content' && <ContentManager />}

      <ToastContainer />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
      />
    </AdminLayout>
  );
};

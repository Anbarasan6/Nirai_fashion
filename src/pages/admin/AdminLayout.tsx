import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, FolderKanban, ShoppingCart, Users, Tag, Settings, FileSpreadsheet, ArrowLeft, RefreshCw, LogOut, Trash2, RotateCcw } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { AdminLoginPage } from './AdminLoginPage';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshData } = useShop();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => localStorage.getItem('nirai_admin_auth') === 'true'
  );

  if (!isAuthenticated) {
    return <AdminLoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const handleLogout = () => {
    localStorage.removeItem('nirai_admin_auth');
    setIsAuthenticated(false);
    navigate('/');
  };

  const handleClearAllData = async () => {
    if (window.confirm('⚠️ ATTENTION: Are you sure you want to CLEAR ALL inventory products, orders, and customer data?')) {
      await StorageService.clearAllData();
      alert('All inventory and order data cleared successfully.');
    }
  };

  const handleRestoreSampleData = async () => {
    await StorageService.restoreSampleData();
    alert('Sample handloom saree products and categories restored successfully!');
  };

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Products & Sarees', path: '/admin/products', icon: ShoppingBag },
    { label: 'Orders Workflow', path: '/admin/orders', icon: ShoppingCart },
    { label: 'Categories', path: '/admin/categories', icon: FolderKanban },
    { label: 'Customer CRM', path: '/admin/customers', icon: Users },
    { label: 'Coupons', path: '/admin/coupons', icon: Tag },
    { label: 'Store Settings', path: '/admin/settings', icon: Settings },
    { label: 'XLSX Reports', path: '/admin/reports', icon: FileSpreadsheet },
  ];

  return (
    <div className="min-h-screen bg-[#F2ECDF] text-[#1E1012]">
      
      {/* Top Admin Header */}
      <header className="bg-[#2D1619] text-[#F4E8C1] border-b border-[#D4AF37]/30 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-1.5 rounded-lg bg-[#3D2024] hover:bg-[#4A0E17] text-[#D4AF37] transition"
              title="Return to Storefront"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#F4E8C1]">
                NIRAI Admin Operations Suite
              </h1>
              <p className="text-[10px] text-[#A09295]">Authenticated Secure Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRestoreSampleData}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-[#3D2024] hover:bg-[#4A0E17] text-xs text-[#F4E8C1] rounded-lg border border-[#D4AF37]/30"
              title="Restore Sample Data"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Restore Samples</span>
            </button>

            <button
              onClick={handleClearAllData}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-red-900/60 hover:bg-red-800 text-xs text-red-200 rounded-lg border border-red-500/40"
              title="Clear All Data"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Clear Data</span>
            </button>

            <button
              onClick={() => refreshData()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3D2024] hover:bg-[#4A0E17] border border-[#D4AF37]/40 text-xs text-[#F4E8C1] rounded-lg transition"
              title="Sync with Supabase"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">Sync DB</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-xs text-white font-bold rounded-lg transition shadow-sm ml-2"
              title="Logout from Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="bg-[#231114] border-t border-[#D4AF37]/20 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 flex gap-1 py-1 text-xs font-semibold">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg whitespace-nowrap flex items-center gap-2 transition ${
                    active
                      ? 'bg-[#4A0E17] text-[#F4E8C1] font-bold border-b-2 border-[#D4AF37]'
                      : 'text-[#C5B7BA] hover:bg-[#3D2024] hover:text-[#F4E8C1]'
                  }`}
                >
                  <IconComp className={`w-4 h-4 ${active ? 'text-[#D4AF37]' : ''}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

    </div>
  );
};

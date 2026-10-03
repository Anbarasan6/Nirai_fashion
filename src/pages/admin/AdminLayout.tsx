import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingBag, FolderKanban, ShoppingCart, Users, Tag, 
  FileSpreadsheet, RefreshCw, LogOut, Trash2, RotateCcw, Menu, X, 
  Type, ExternalLink, ShieldCheck, LucideIcon
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { AdminLoginPage } from './AdminLoginPage';

interface MenuItem {
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshData } = useShop();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

  const menuGroups: MenuGroup[] = [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Dashboard Overview', path: '/admin', icon: LayoutDashboard }
      ]
    },
    {
      title: 'STORE OPERATIONS',
      items: [
        { label: 'Products & Sarees Catalog', path: '/admin/products', icon: ShoppingBag },
        { label: 'Orders & Payment Proofs', path: '/admin/orders', icon: ShoppingCart },
        { label: 'Categories & Collections', path: '/admin/categories', icon: FolderKanban },
        { label: 'Customer Directory & CRM', path: '/admin/customers', icon: Users },
        { label: 'Promo Coupons & Offers', path: '/admin/coupons', icon: Tag },
        { label: 'Sales Reports (XLSX)', path: '/admin/reports', icon: FileSpreadsheet }
      ]
    },
    {
      title: 'DYNAMIC PAGE & BRAND CMS',
      items: [
        { label: 'All Page Words & Brand CMS', path: '/admin/settings', icon: Type, badge: 'Dynamic' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F5EE] text-[#1E1012] flex flex-col md:flex-row">
      
      {/* Mobile Top Navbar */}
      <div className="md:hidden bg-[#2D1619] text-[#F4E8C1] border-b border-[#D4AF37]/30 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#B38F24] flex items-center justify-center text-[#2D1619] font-black font-serif-luxury text-sm shadow-md">
            N
          </div>
          <div>
            <span className="font-serif-luxury text-base font-bold text-[#F4E8C1] tracking-wide">NIRAI</span>
            <span className="block text-[9px] text-[#D4AF37] uppercase font-bold tracking-wider">Admin Control Suite</span>
          </div>
        </div>

        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-lg bg-[#3D2024] text-[#D4AF37] border border-[#D4AF37]/30"
        >
          {mobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Left Sidebar Navigation (Desktop Permanent & Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 bg-[#2D1619] text-[#F4E8C1] border-r border-[#D4AF37]/30 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } shadow-2xl`}
      >
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
          
          {/* Brand Header */}
          <div className="p-5 border-b border-[#D4AF37]/20 flex items-center justify-between bg-[#231114]">
            <Link to="/admin" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] via-[#F4E8C1] to-[#B38F24] flex items-center justify-center text-[#2D1619] font-black font-serif-luxury text-lg shadow-lg group-hover:scale-105 transition transform">
                N
              </div>
              <div>
                <h1 className="font-serif-luxury text-lg font-bold text-[#F4E8C1] tracking-wide leading-none group-hover:text-[#D4AF37] transition">
                  NIRAI SILKS
                </h1>
                <p className="text-[10px] text-[#D4AF37] font-semibold mt-1 tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#D4AF37]" />
                  <span>Admin Control Suite</span>
                </p>
              </div>
            </Link>

            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-[#3D2024] hover:bg-[#4A0E17] text-[#D4AF37] border border-[#D4AF37]/30 transition"
              title="Open Customer Storefront"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick Actions Bar */}
          <div className="p-3 bg-[#281316] border-b border-[#D4AF37]/15 flex items-center justify-between text-xs px-4">
            <span className="text-[10px] text-[#A09295] font-semibold uppercase tracking-wider">Store Status</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live & Online</span>
            </span>
          </div>

          {/* Navigation Groups */}
          <div className="p-4 space-y-6 flex-1">
            {menuGroups.map((group, idx) => (
              <div key={idx} className="space-y-2">
                <h3 className="px-3 text-[10px] font-bold text-[#A09295] uppercase tracking-wider">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const IconComp = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                          active
                            ? 'bg-gradient-to-r from-[#4A0E17] to-[#3D2024] text-[#F4E8C1] font-bold border-l-4 border-[#D4AF37] shadow-md'
                            : 'text-[#C5B7BA] hover:bg-[#3D2024] hover:text-[#F4E8C1]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <IconComp className={`w-4 h-4 ${active ? 'text-[#D4AF37]' : 'text-[#8A7B7E]'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[9px] px-2 py-0.5 rounded-md bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-bold uppercase">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* System Control & Database Actions */}
          <div className="p-4 border-t border-[#D4AF37]/20 bg-[#231114] space-y-2 text-xs">
            <h3 className="px-1 text-[10px] font-bold text-[#A09295] uppercase tracking-wider mb-2">
              SYSTEM CONTROLS
            </h3>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleRestoreSampleData}
                className="flex items-center justify-center gap-1 py-2 px-2 bg-[#3D2024] hover:bg-[#4A0E17] text-[#F4E8C1] rounded-lg border border-[#D4AF37]/30 text-[11px] font-bold transition"
                title="Restore Default Handloom Sample Data"
              >
                <RotateCcw className="w-3 h-3 text-[#D4AF37]" />
                <span>Restore</span>
              </button>

              <button
                onClick={handleClearAllData}
                className="flex items-center justify-center gap-1 py-2 px-2 bg-red-950/60 hover:bg-red-900 text-red-200 rounded-lg border border-red-500/40 text-[11px] font-bold transition"
                title="Clear All Inventory and Orders"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
                <span>Clear Data</span>
              </button>
            </div>

            <button
              onClick={() => refreshData()}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#3D2024] hover:bg-[#4A0E17] border border-[#D4AF37]/40 text-[#F4E8C1] rounded-lg text-xs font-bold transition mt-1"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Sync Supabase DB</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold shadow-md transition mt-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout Admin</span>
            </button>
          </div>

        </div>
      </aside>

      {/* Backdrop Overlay for Mobile */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Main Admin Work Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-[#E2D9C8] sticky top-0 z-30 shadow-xs px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif-luxury text-sm font-bold text-[#4A0E17]">
              {location.pathname === '/admin' && 'Dashboard Analytics'}
              {location.pathname === '/admin/products' && 'Saree Products & Inventory'}
              {location.pathname === '/admin/orders' && 'Order Verification & Workflow'}
              {location.pathname === '/admin/categories' && 'Categories Manager'}
              {location.pathname === '/admin/customers' && 'Customer CRM Directory'}
              {location.pathname === '/admin/coupons' && 'Coupons & Discount Offers'}
              {location.pathname === '/admin/settings' && 'Homepage & Brand Experience Manager'}
              {location.pathname === '/admin/reports' && 'XLSX Analytics & Export Reports'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 bg-[#F2ECDF] hover:bg-[#E5DAC6] text-[#2D1619] rounded-lg border border-[#D4AF37]/50 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Customer View</span>
            </Link>

            <div className="h-4 w-px bg-[#E2D9C8]" />

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#2D1619] text-[#D4AF37] font-bold text-xs flex items-center justify-center border border-[#D4AF37]/40 shadow-xs">
                A
              </div>
              <span className="text-xs font-bold text-[#2D1619] hidden sm:inline">Admin</span>
            </div>
          </div>
        </header>

        {/* Dynamic Route View */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

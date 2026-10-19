import React from 'react';
import { useShop } from '../../context/ShopContext';
import { ShieldAlert, LogIn, Loader2 } from 'lucide-react';

interface RequireAuthProps {
  children: React.ReactNode;
}

/**
 * Route guard that ensures the user has an active authenticated session.
 * Prompts user to log in if unauthenticated.
 */
export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { currentUser, isAuthLoading, openAuthModal } = useShop();

  if (isAuthLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-amber-900 animate-spin" />
        <p className="text-xs text-stone-500 font-medium">Verifying authentication session...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-[#E8E2D5] rounded-2xl shadow-sm text-center">
        <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-900">
          <LogIn className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-serif font-bold text-slate-900 mb-2">Sign In Required</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Please sign in to your Nirai account to view your profile, orders, and saved addresses.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="w-full py-3 bg-[#2D1619] text-amber-100 font-medium rounded-xl hover:bg-amber-950 transition-colors shadow-sm cursor-pointer"
        >
          Sign In to Your Account
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

interface RequireRoleProps {
  children: React.ReactNode;
  roles: Array<'customer' | 'staff' | 'admin' | 'super_admin'>;
}

/**
 * Route guard that checks if the authenticated user has one of the allowed roles.
 */
export const RequireRole: React.FC<RequireRoleProps> = ({ children, roles }) => {
  const { currentUser, isAuthLoading } = useShop();

  if (isAuthLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-amber-900 animate-spin" />
        <p className="text-xs text-stone-500 font-medium">Verifying administrative access permissions...</p>
      </div>
    );
  }

  if (!currentUser || !roles.includes(currentUser.role)) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-rose-200 rounded-2xl shadow-sm text-center">
        <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-800">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-serif font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          You do not have administrative or staff privileges to access this console.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-2.5 bg-[#2D1619] text-amber-100 text-sm font-medium rounded-xl hover:bg-amber-950 transition-colors"
        >
          Return to Storefront
        </a>
      </div>
    );
  }

  return <>{children}</>;
};

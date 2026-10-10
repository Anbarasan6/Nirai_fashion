import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { User } from '../../types';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
}) => {
  const { setCurrentUser, setViewMode, showToast, refreshData } = useShop();

  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const users = StorageService.getUsers();
    const matched = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

    if (!matched) {
      showToast('No account found with this email. You can sign up below.', 'error');
      return;
    }

    if (!matched.isActive) {
      showToast('This account has been suspended by administration.', 'error');
      return;
    }

    setCurrentUser(matched);
    showToast(`Welcome back, ${matched.name}!`, 'success');
    onClose();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('Please enter your name and email address', 'error');
      return;
    }

    const users = StorageService.getUsers();
    const existing = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      showToast('An account with this email already exists. Please log in.', 'error');
      setMode('login');
      return;
    }

    const newUser: User = {
      id: `cust-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      role: 'customer',
      isActive: true,
      createdAt: new Date().toISOString(),
      addresses: [
        {
          id: `addr-${Date.now()}`,
          fullName: name.trim(),
          phone: phone.trim() || '+91 98400 00000',
          street: '10, Temple View Avenue',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600028',
          isDefault: true,
        },
      ],
    };

    StorageService.saveUser(newUser);
    refreshData();
    setCurrentUser(newUser);
    showToast(`Welcome to Nirai, ${newUser.name}! Your account has been created.`, 'success');
    onClose();
  };

  // Quick One-Click Demo Logins
  const handleQuickLogin = (demoEmail: string, role: string, launchAdmin = false) => {
    const users = StorageService.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === demoEmail.toLowerCase());
    if (user) {
      setCurrentUser(user);
      showToast(`Logged in as ${user.name} (${role})`, 'success');
      if (launchAdmin) {
        setViewMode('admin');
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-[#E8E2D5] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#2D1619] text-amber-100 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-amber-300 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block mb-1">
            NIRAI ACCOUNT GATEWAY
          </span>
          <h2 className="font-serif text-2xl font-bold text-white">
            {mode === 'login' ? 'Sign In to Nirai' : 'Create an Account'}
          </h2>
          <p className="text-xs text-amber-200/80 mt-1">
            {mode === 'login'
              ? 'Access your orders, saved addresses, and bridal wishlist.'
              : 'Join the Nirai family for authentic handloom craftsmanship.'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Tabs */}
          <div className="flex border-b border-stone-200">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'border-amber-900 text-amber-950'
                  : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'border-amber-900 text-amber-950'
                  : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. priya@example.com"
                    className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-amber-900"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-stone-700">Password</label>
                  <span className="text-[10px] text-amber-800 hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-amber-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 mt-2"
              >
                <span>Sign In to Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Senthil Kumar"
                    className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-amber-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="senthil@example.com"
                    className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-amber-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98400 12345"
                    className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-amber-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 mt-2"
              >
                <span>Register & Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* 1-Click Fast Demo Logins */}
          <div className="pt-4 border-t border-stone-100 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-950">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>One-Click Test Accounts:</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickLogin('priya@example.com', 'Customer')}
                className="p-2 bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-300 rounded-lg text-left transition-colors cursor-pointer"
              >
                <div className="font-semibold text-slate-800">Priya Sundaram</div>
                <div className="text-[10px] text-stone-500">Customer (Chennai)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('rajesh.kannan@example.com', 'Customer')}
                className="p-2 bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-300 rounded-lg text-left transition-colors cursor-pointer"
              >
                <div className="font-semibold text-slate-800">Rajesh Kannan</div>
                <div className="text-[10px] text-stone-500">Customer (Coimbatore)</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

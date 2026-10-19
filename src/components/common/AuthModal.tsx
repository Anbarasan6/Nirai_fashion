import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { supabase } from '../../services/supabase';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Loader2,
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
  const { showToast } = useShop();

  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!email.trim() || !password.trim()) {
      setAuthError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      if (error) {
        setAuthError(error.message);
        showToast(error.message, 'error');
        return;
      }

      showToast(`Welcome back! Logged in successfully.`, 'success');
      onClose();
    } catch (err: any) {
      setAuthError(err?.message || 'Login failed.');
      showToast(err?.message || 'Login failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!name.trim() || !email.trim()) {
      setAuthError('Please enter your full name and email address.');
      return;
    }

    if (!password.trim() || password.trim().length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        options: {
          data: {
            name: name.trim(),
            phone: phone.trim() || undefined,
          },
        },
      });

      if (error) {
        setAuthError(error.message);
        showToast(error.message, 'error');
        return;
      }

      if (data.session) {
        showToast(`Welcome to Nirai, ${name.trim()}! Your account has been created.`, 'success');
      } else {
        showToast(`Account created! A confirmation email was sent to ${email.trim()}.`, 'info');
      }
      onClose();
    } catch (err: any) {
      setAuthError(err?.message || 'Account registration failed.');
      showToast(err?.message || 'Account registration failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!forgotEmail.trim()) {
      setAuthError('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim().toLowerCase(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        setAuthError(error.message);
        showToast(error.message, 'error');
        return;
      }

      setForgotSent(true);
      showToast(`Password recovery link dispatched to ${forgotEmail.trim()}`, 'success');
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to dispatch password recovery link.');
      showToast(err?.message || 'Failed to dispatch password recovery link.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-[#E8E2D5] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#2D1619] text-amber-100 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-amber-300 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block mb-1">
            NIRAI ACCOUNT GATEWAY
          </span>
          <h2 className="font-serif text-2xl font-bold text-white">
            {isForgotMode
              ? 'Reset Your Password'
              : mode === 'login'
              ? 'Sign In to Nirai'
              : 'Create an Account'}
          </h2>
          <p className="text-xs text-amber-200/80 mt-1">
            {isForgotMode
              ? 'Enter your registered email to receive a password recovery link.'
              : mode === 'login'
              ? 'Access your orders, saved addresses, and handloom wishlist.'
              : 'Join the Nirai family for authentic handloom craftsmanship.'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {isForgotMode ? (
            <div className="space-y-4 text-xs">
              {forgotSent ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-semibold text-emerald-900 text-sm">
                    Password Reset Link Dispatched
                  </p>
                  <p className="text-stone-600 text-[11px] leading-relaxed">
                    We sent password recovery instructions to{' '}
                    <strong className="text-slate-900">{forgotEmail}</strong>. Please check your inbox and click the link to update your credentials.
                  </p>
                  <button
                    onClick={() => {
                      setIsForgotMode(false);
                      setForgotSent(false);
                      setMode('login');
                      setAuthError(null);
                    }}
                    className="w-full py-2 bg-[#2D1619] text-amber-100 rounded-lg font-semibold mt-2 cursor-pointer hover:bg-amber-950 transition-colors"
                  >
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-3.5">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Registered Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="e.g. priya@example.com"
                        className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-amber-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Recovery Link</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(false);
                      setAuthError(null);
                    }}
                    className="w-full text-center text-[11px] text-stone-500 hover:text-stone-800 transition-colors cursor-pointer pt-1"
                  >
                    Cancel and return to Sign In
                  </button>
                </form>
              )}
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex border-b border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setAuthError(null);
                  }}
                  className={`flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
                    mode === 'login'
                      ? 'border-amber-900 text-amber-950'
                      : 'border-transparent text-stone-400 hover:text-stone-700'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setAuthError(null);
                  }}
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
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(email);
                          setIsForgotMode(true);
                          setAuthError(null);
                        }}
                        className="text-[10px] text-amber-800 hover:underline cursor-pointer bg-transparent border-0 p-0"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-amber-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In with Password</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
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
                    <label className="block font-semibold text-stone-700 mb-1">Create Password (min. 6 characters)</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-amber-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Phone Number (Optional)</label>
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
                    disabled={isLoading}
                    className="w-full py-2.5 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Register with Supabase</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          <div className="pt-2 text-center text-[11px] text-stone-400">
            Powered by Supabase Auth & Industry Standard Encryption
          </div>
        </div>
      </div>
    </div>
  );
};

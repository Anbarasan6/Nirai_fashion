import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { supabase } from '../services/supabase';
import { Seo } from '../components/common/Seo';
import { Lock, CheckCircle2, AlertCircle, ArrowRight, Loader2, KeyRound } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useShop();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasValidSession, setHasValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if recovery session is active from email link
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasValidSession(Boolean(session));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password.trim(),
      });

      if (error) {
        setErrorMsg(error.message);
        showToast(error.message, 'error');
        return;
      }

      setIsSuccess(true);
      showToast('Password updated successfully! You can now sign in.', 'success');
      setTimeout(() => {
        navigate('/account');
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update password.');
      showToast(err?.message || 'Failed to update password.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
      <Seo title="Reset Password" canonical="/reset-password" noindex={true} />
      <div className="max-w-md w-full bg-white border border-[#E8E2D5] rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#2D1619] text-amber-100 p-8 text-center relative">
          <div className="w-14 h-14 bg-amber-400/10 border border-amber-400/20 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-300">
            <KeyRound className="w-7 h-7" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block mb-1">
            SECURITY CREDENTIALS
          </span>
          <h1 className="font-serif text-2xl font-bold text-white">Create New Password</h1>
          <p className="text-xs text-amber-200/80 mt-1 max-w-xs mx-auto">
            Choose a strong passkey for your Nirai customer account.
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {isSuccess ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h2 className="font-serif text-lg font-bold text-emerald-950">Password Updated!</h2>
              <p className="text-xs text-stone-600">
                Your password has been changed successfully. Redirecting you to your account...
              </p>
              <button
                onClick={() => navigate('/account')}
                className="mt-3 px-6 py-2 bg-[#2D1619] text-amber-100 text-xs font-semibold rounded-lg hover:bg-amber-950 transition-colors"
              >
                Go to Account Now
              </button>
            </div>
          ) : hasValidSession === false ? (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl space-y-3 text-center">
              <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
              <h2 className="font-serif text-base font-bold text-amber-950">
                Invalid or Expired Link
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                This password reset link is invalid or has already expired. Please request a new recovery link from the sign-in modal.
              </p>
              <button
                onClick={() => navigate('/')}
                className="mt-2 px-6 py-2 bg-[#2D1619] text-amber-100 text-xs font-semibold rounded-lg hover:bg-amber-950 transition-colors"
              >
                Return to Storefront
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  New Password (min. 6 characters)
                </label>
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
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-amber-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-amber-900 hover:bg-amber-950 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Save Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

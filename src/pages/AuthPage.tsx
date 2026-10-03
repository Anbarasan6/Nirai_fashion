import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User as UserIcon, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const AuthPage: React.FC = () => {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const { loginUser, registerUser } = useShop();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    loginUser(email, name || email.split('@')[0]);
    navigate('/account');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    registerUser(name, email, phone);
    navigate('/account');
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(`Password reset link sent to ${email}. Please check your inbox.`);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white p-8 rounded-3xl border border-[#E2D9C8] shadow-xl space-y-6">
        
        {/* Header Tabs */}
        <div className="flex border-b border-[#F2ECDF]">
          <button
            onClick={() => { setTab('login'); setMessage(''); }}
            className={`flex-1 py-3 text-xs font-bold transition border-b-2 ${
              tab === 'login' ? 'border-[#4A0E17] text-[#4A0E17]' : 'border-transparent text-[#8A7B7E]'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('register'); setMessage(''); }}
            className={`flex-1 py-3 text-xs font-bold transition border-b-2 ${
              tab === 'register' ? 'border-[#4A0E17] text-[#4A0E17]' : 'border-transparent text-[#8A7B7E]'
            }`}
          >
            Create Account
          </button>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl text-center">
            {message}
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#2D1619] block mb-1">Email Address / Phone *</label>
              <div className="relative">
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. customer@gmail.com"
                  className="w-full p-3 pl-10 border border-[#D4AF37]/50 rounded-xl"
                  required
                />
                <Mail className="w-4 h-4 text-[#8A7B7E] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#2D1619] block mb-1">Password *</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 pl-10 border border-[#D4AF37]/50 rounded-xl"
                  required
                />
                <Lock className="w-4 h-4 text-[#8A7B7E] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setTab('forgot')}
                className="text-xs text-[#800020] hover:underline font-semibold"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#2D1619] text-[#F4E8C1] font-extrabold text-xs rounded-xl hover:bg-[#4A0E17] flex items-center justify-center gap-2 shadow-md"
            >
              <span>Sign In to NIRAI</span>
              <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
            </button>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#2D1619] block mb-1">Full Name *</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priyadarshini M."
                  className="w-full p-3 pl-10 border border-[#D4AF37]/50 rounded-xl"
                  required
                />
                <UserIcon className="w-4 h-4 text-[#8A7B7E] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#2D1619] block mb-1">Mobile Number (WhatsApp) *</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-Digit Mobile Number"
                  className="w-full p-3 pl-10 border border-[#D4AF37]/50 rounded-xl"
                  required
                />
                <Phone className="w-4 h-4 text-[#8A7B7E] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#2D1619] block mb-1">Email Address *</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full p-3 pl-10 border border-[#D4AF37]/50 rounded-xl"
                  required
                />
                <Mail className="w-4 h-4 text-[#8A7B7E] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#2D1619] font-extrabold text-xs rounded-xl hover:shadow-lg flex items-center justify-center gap-2"
            >
              <span>Create Free Account</span>
              <ShieldCheck className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Forgot Password */}
        {tab === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4 text-xs">
            <p className="text-xs text-[#6B5B5E]">
              Enter your registered email address and we will send a password reset link.
            </p>
            <div>
              <label className="font-bold text-[#2D1619] block mb-1">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full p-3 border border-[#D4AF37]/50 rounded-xl"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#2D1619] text-[#F4E8C1] font-bold rounded-xl"
            >
              Send Reset Link
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

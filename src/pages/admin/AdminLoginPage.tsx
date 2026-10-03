import React, { useState } from 'react';
import { Lock, User, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Admin Credentials
    const validUser = (username.trim().toLowerCase() === 'admin' || username.trim().toLowerCase() === 'admin@niraifashions.com');
    const validPass = (password === 'admin' || password === 'niraiadmin123');

    if (validUser && validPass) {
      localStorage.setItem('nirai_admin_auth', 'true');
      onLoginSuccess();
    } else {
      setError('Invalid Admin Credentials. Default username: admin | password: admin');
    }
  };

  return (
    <div className="min-h-screen bg-[#1E0B0E] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Silk Ambient Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#4A0E17]/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-[#2D1619] text-[#FBF9F5] p-8 rounded-3xl border-2 border-[#D4AF37]/50 shadow-2xl relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto bg-[#4A0E17] border border-[#D4AF37] rounded-full flex items-center justify-center text-[#D4AF37] shadow-lg">
            <Lock className="w-6 h-6" />
          </div>

          <h1 className="font-serif-luxury text-2xl font-extrabold text-[#F4E8C1] tracking-wide">
            NIRAI Admin Portal
          </h1>
          <p className="text-xs text-[#ECE6D9]">
            Restricted Master Operations Suite
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-900/60 border border-red-500 rounded-xl text-xs text-red-200 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-[#F4E8C1] block mb-1">
              Admin Username / Email
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-[#3D2024] text-[#FBF9F5] placeholder-[#A09295] p-3 pl-10 rounded-xl border border-[#D4AF37]/40 focus:outline-none focus:border-[#D4AF37]"
                required
              />
              <User className="w-4 h-4 text-[#D4AF37] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="font-bold text-[#F4E8C1] block mb-1">
              Security Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#3D2024] text-[#FBF9F5] placeholder-[#A09295] p-3 pl-10 rounded-xl border border-[#D4AF37]/40 focus:outline-none focus:border-[#D4AF37]"
                required
              />
              <Lock className="w-4 h-4 text-[#D4AF37] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="p-3 bg-[#4A0E17]/40 rounded-xl border border-[#D4AF37]/20 text-[11px] text-[#ECE6D9]">
            <p className="font-bold text-[#D4AF37] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              Default Credentials:
            </p>
            <p>Username: <strong className="text-white">admin</strong></p>
            <p>Password: <strong className="text-white">admin</strong></p>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#2D1619] font-extrabold text-sm rounded-xl hover:shadow-xl transition shadow-lg flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Authenticate Admin Access</span>
          </button>
        </form>

      </div>
    </div>
  );
};

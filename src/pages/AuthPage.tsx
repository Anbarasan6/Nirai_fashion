import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User as UserIcon, Phone, ArrowRight, ShieldCheck, Smartphone, CheckCircle } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const AuthPage: React.FC = () => {
  const [tab, setTab] = useState<'otp' | 'login' | 'register'>('otp');
  
  // OTP Form State
  const [phoneOtp, setPhoneOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [timer, setTimer] = useState(30);

  // Email/Password State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const { loginUser, registerUser } = useShop();
  const navigate = useNavigate();

  useEffect(() => {
    let interval: any;
    if (otpSent && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOtp || phoneOtp.length < 10) return;
    setOtpSent(true);
    setTimer(30);
    setMessage(`SMS OTP code sent to +91 ${phoneOtp}`);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) return;
    loginUser(`${phoneOtp}@phone.nirai`, `Customer (${phoneOtp})`);
    navigate('/account');
  };

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

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2D9C8] shadow-xl space-y-6">
        
        <div className="text-center space-y-1">
          <span className="font-serif-luxury text-2xl font-extrabold text-[#2D1619]">
            NIRAI Account Login
          </span>
          <p className="text-xs text-[#8A7B7E]">
            Sign in to track orders, manage addresses, and view invoices.
          </p>
        </div>

        {/* Header Tabs */}
        <div className="flex border-b border-[#F2ECDF]">
          <button
            onClick={() => { setTab('otp'); setMessage(''); setOtpSent(false); }}
            className={`flex-1 py-3 text-xs font-bold transition border-b-2 flex items-center justify-center gap-1 ${
              tab === 'otp' ? 'border-[#4A0E17] text-[#4A0E17]' : 'border-transparent text-[#8A7B7E]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Phone OTP</span>
          </button>
          <button
            onClick={() => { setTab('login'); setMessage(''); }}
            className={`flex-1 py-3 text-xs font-bold transition border-b-2 ${
              tab === 'login' ? 'border-[#4A0E17] text-[#4A0E17]' : 'border-transparent text-[#8A7B7E]'
            }`}
          >
            Email Login
          </button>
          <button
            onClick={() => { setTab('register'); setMessage(''); }}
            className={`flex-1 py-3 text-xs font-bold transition border-b-2 ${
              tab === 'register' ? 'border-[#4A0E17] text-[#4A0E17]' : 'border-transparent text-[#8A7B7E]'
            }`}
          >
            Register
          </button>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Phone OTP Auth */}
        {tab === 'otp' && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">Mobile Number (India) *</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-bold text-[#4A0E17]">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phoneOtp}
                      onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full p-3 pl-12 border border-[#D4AF37]/50 rounded-xl focus:outline-none focus:border-[#4A0E17]"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#4A0E17] text-[#F4E8C1] font-bold text-xs rounded-xl hover:bg-[#2D1619] transition shadow flex items-center justify-center gap-1.5"
                >
                  <span>Send Login OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">Enter 4-Digit Verification OTP *</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="1 2 3 4"
                    className="w-full p-3 text-center tracking-widest text-lg font-mono font-bold border border-[#D4AF37]/50 rounded-xl focus:outline-none focus:border-[#4A0E17]"
                    required
                  />
                  <p className="text-[11px] text-[#8A7B7E] mt-1 text-center">
                    Demo OTP: Enter any 4 digits (e.g. 1234)
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#8A7B7E]">
                  <span>{timer > 0 ? `Resend OTP in ${timer}s` : 'Didn\'t receive OTP?'}</span>
                  {timer === 0 && (
                    <button
                      type="button"
                      onClick={() => setTimer(30)}
                      className="font-bold text-[#4A0E17] hover:underline"
                    >
                      Resend SMS
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#2D1619] font-extrabold text-xs rounded-xl shadow hover:shadow-lg transition"
                >
                  Verify OTP & Login
                </button>
              </form>
            )}
          </div>
        )}

        {/* Email Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#2D1619] block mb-1">Email Address *</label>
              <div className="relative">
                <input
                  type="email"
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

            <button
              type="submit"
              className="w-full py-3 bg-[#4A0E17] text-[#F4E8C1] font-bold text-xs rounded-xl hover:bg-[#2D1619] transition shadow"
            >
              Sign In to Account
            </button>
          </form>
        )}

        {/* Registration Form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#2D1619] block mb-1">Full Name *</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anbarasan K"
                  className="w-full p-3 pl-10 border border-[#D4AF37]/50 rounded-xl"
                  required
                />
                <UserIcon className="w-4 h-4 text-[#8A7B7E] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#2D1619] block mb-1">Email Address *</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@gmail.com"
                  className="w-full p-3 pl-10 border border-[#D4AF37]/50 rounded-xl"
                  required
                />
                <Mail className="w-4 h-4 text-[#8A7B7E] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#2D1619] block mb-1">Mobile Phone *</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full p-3 pl-10 border border-[#D4AF37]/50 rounded-xl"
                  required
                />
                <Phone className="w-4 h-4 text-[#8A7B7E] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#4A0E17] text-[#F4E8C1] font-bold text-xs rounded-xl hover:bg-[#2D1619] transition shadow"
            >
              Create New Account
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-[#F2ECDF] text-center">
          <span className="text-[11px] text-[#8A7B7E] flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Encrypted 256-bit Secure Handloom Portal</span>
          </span>
        </div>
      </div>
    </div>
  );
};

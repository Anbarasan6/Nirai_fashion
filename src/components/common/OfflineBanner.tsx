import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (showRestored) {
    return (
      <div className="bg-emerald-600 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-sm transition-all duration-300 sticky top-0 z-50">
        <Wifi className="w-3.5 h-3.5 animate-pulse" />
        <span>Internet connection restored · இணைய இணைப்பு மீண்டும் கிடைத்துள்ளது</span>
      </div>
    );
  }

  if (!isOffline) return null;

  return (
    <div className="bg-[#881337] text-white text-xs font-semibold py-2.5 px-4 text-center flex items-center justify-center gap-2 shadow-md sticky top-0 z-50 animate-fadeIn">
      <WifiOff className="w-4 h-4 text-amber-300" />
      <span>
        You are currently offline. Check your mobile network or Wi-Fi connection. · இணைய இணைப்பு துண்டிக்கப்பட்டுள்ளது.
      </span>
    </div>
  );
};

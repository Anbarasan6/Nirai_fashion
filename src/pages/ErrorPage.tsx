import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface ErrorPageProps {
  error?: Error | null;
  resetError?: () => void;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ error, resetError }) => {
  const navigate = useNavigate();
  const errorRef = `ERR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const handleReload = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="bg-[#FAF9F5] min-h-[70vh] py-16 flex items-center justify-center px-4">
      <div className="max-w-md w-full mx-auto text-center space-y-6 bg-white p-8 rounded-2xl border border-[#E8E2D5] shadow-lg">
        <div className="w-16 h-16 bg-rose-50 text-rose-700 rounded-full flex items-center justify-center mx-auto border border-rose-200">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] uppercase tracking-widest text-[#8C2D38] font-bold block">
            500 · Server &amp; System Interruption
          </span>
          <h1 className="font-serif text-2xl font-bold text-slate-900">
            Something Went Wrong
          </h1>
          <p className="text-xs text-amber-950 font-medium">
            மன்னிக்கவும், தற்காலிக தொழில்நுட்பக் கோளாறு ஏற்பட்டுள்ளது.
          </p>
          <p className="text-xs text-stone-500 leading-relaxed pt-1">
            Our systems encountered an unexpected condition. Don&apos;t worry — your shopping cart and customer profile are preserved.
          </p>
          <div className="p-2 bg-stone-50 rounded border border-stone-200 text-[11px] font-mono text-stone-500">
            Error Ref: <span className="font-bold text-stone-800">{errorRef}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleReload}
            className="flex-1 py-2.5 px-4 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Page (மீண்டும் ஏற்றுக)</span>
          </button>

          <button
            onClick={() => navigate('/')}
            className="flex-1 py-2.5 px-4 border border-stone-300 hover:bg-stone-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return Home (முகப்பு)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

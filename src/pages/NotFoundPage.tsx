import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-20 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-900 border border-amber-200">
          <Compass className="w-10 h-10 animate-spin-slow" />
        </div>

        <div>
          <span className="text-xs uppercase tracking-widest text-amber-900 font-bold block mb-1">
            404 Error
          </span>
          <h1 className="font-serif text-3xl font-bold text-slate-900">
            Page Not Found
          </h1>
          <p className="text-xs text-stone-500 mt-2">
            The page or collection URL you are looking for has moved or does not exist.
          </p>
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </button>

          <button
            onClick={() => navigate('/catalog')}
            className="px-5 py-2.5 border border-stone-300 hover:bg-stone-50 text-slate-800 text-xs font-semibold rounded-xl cursor-pointer"
          >
            Explore Catalog
          </button>
        </div>
      </div>
    </div>
  );
};

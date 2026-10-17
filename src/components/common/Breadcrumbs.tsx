import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export const Breadcrumbs: React.FC<{ items: BreadcrumbItem[] }> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-stone-500 mb-6 flex-wrap gap-1">
      <Link
        to="/"
        className="hover:text-slate-900 flex items-center gap-1 transition-colors"
        title="Home"
      >
        <Home className="w-3.5 h-3.5 text-amber-900" />
        <span>Home</span>
      </Link>

      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-3 h-3 text-stone-400 shrink-0" />
          {item.path ? (
            <Link
              to={item.path}
              className="hover:text-slate-900 font-medium transition-colors line-clamp-1"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-900 font-bold line-clamp-1">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

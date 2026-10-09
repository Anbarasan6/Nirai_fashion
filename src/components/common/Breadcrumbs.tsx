import React from 'react';
import { Link } from './Link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://niraifashions.vercel.app/',
      },
      ...items.map((item, idx) => ({
        '@type': 'ListItem',
        position: idx + 2,
        name: item.label,
        item: item.path ? `https://niraifashions.vercel.app${item.path}` : undefined,
      })),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />
      <nav aria-label="Breadcrumb" className="py-3 px-4 sm:px-6 bg-[#F4F1EA]/60 border-b border-amber-900/10 text-xs text-amber-950/70 font-sans">
        <ol className="max-w-7xl mx-auto flex items-center flex-wrap gap-1.5">
          <li className="flex items-center">
            <Link to="/" className="flex items-center hover:text-amber-900 transition-colors gap-1">
              <Home className="w-3.5 h-3.5 text-amber-900/60" />
              <span>Home</span>
            </Link>
          </li>
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-1.5">
              <ChevronRight className="w-3 h-3 text-amber-900/40 shrink-0" />
              {item.path ? (
                <Link to={item.path} className="hover:text-amber-900 transition-colors font-medium">
                  {item.label}
                </Link>
              ) : (
                <span className="font-semibold text-amber-950 truncate max-w-[200px] sm:max-w-none">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

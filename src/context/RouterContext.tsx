import React, { createContext, useContext, useState, useEffect } from 'react';

interface RouterContextType {
  pathname: string;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  queryParams: Record<string, string>;
  categorySlug?: string;
  productSlug?: string;
  blogSlug?: string;
  orderId?: string;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pathname, setPathname] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  const [queryParams, setQueryParams] = useState<Record<string, string>>({});

  const syncRoute = () => {
    if (typeof window === 'undefined') return;
    const currentPath = window.location.pathname || '/';
    setPathname(currentPath);

    const searchParams = new URLSearchParams(window.location.search);
    const params: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      params[key] = val;
    });

    // Hash fallback support for legacy bookmarks
    if (window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== currentPath) {
        window.history.replaceState(null, '', hash.startsWith('/') ? hash : `/${hash}`);
        setPathname(hash.startsWith('/') ? hash : `/${hash}`);
      }
    }

    setQueryParams(params);
  };

  useEffect(() => {
    syncRoute();
    const handlePopState = () => syncRoute();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string, options?: { replace?: boolean }) => {
    if (typeof window === 'undefined') return;
    const target = path.startsWith('/') ? path : `/${path}`;
    if (options?.replace) {
      window.history.replaceState(null, '', target);
    } else {
      window.history.pushState(null, '', target);
    }
    syncRoute();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper extraction for dynamic routes
  let categorySlug: string | undefined;
  let productSlug: string | undefined;
  let blogSlug: string | undefined;
  let orderId: string | undefined;

  if (pathname.startsWith('/shop/')) {
    categorySlug = pathname.replace('/shop/', '');
  } else if (pathname.startsWith('/product/')) {
    productSlug = pathname.replace('/product/', '');
  } else if (pathname.startsWith('/blog/')) {
    blogSlug = pathname.replace('/blog/', '');
  } else if (pathname.startsWith('/order-success/')) {
    orderId = pathname.replace('/order-success/', '');
  } else if (pathname.startsWith('/account/orders/')) {
    orderId = pathname.replace('/account/orders/', '');
  }

  return (
    <RouterContext.Provider value={{
      pathname,
      navigate,
      queryParams,
      categorySlug,
      productSlug,
      blogSlug,
      orderId
    }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};

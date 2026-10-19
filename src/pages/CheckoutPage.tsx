import React from 'react';
import { CheckoutPage as CheckoutComponent } from '../components/storefront/CheckoutPage';
import { Seo } from '../components/common/Seo';

export const CheckoutPage: React.FC = () => {
  return (
    <>
      <Seo title="Secure Checkout" canonical="/checkout" noindex={true} />
      <CheckoutComponent />
    </>
  );
};

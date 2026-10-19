import React from 'react';
import { PaymentPage as PaymentComponent } from '../components/storefront/PaymentPage';
import { Seo } from '../components/common/Seo';

export const PaymentPage: React.FC = () => {
  return (
    <>
      <Seo title="Payment Verification" noindex={true} />
      <PaymentComponent />
    </>
  );
};

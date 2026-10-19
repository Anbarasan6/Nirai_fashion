import React from 'react';
import { CustomerAccountPage as AccountComponent } from '../components/storefront/CustomerAccountPage';
import { Seo } from '../components/common/Seo';

export const CustomerAccountPage: React.FC = () => {
  return (
    <>
      <Seo title="My Account" canonical="/account" noindex={true} />
      <AccountComponent />
    </>
  );
};

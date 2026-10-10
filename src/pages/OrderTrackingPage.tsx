import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { OrderTrackingPage as TrackingComponent } from '../components/storefront/OrderTrackingPage';

export const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId?: string }>();
  const [searchParams] = useSearchParams();
  const { setTrackingOrderId } = useShop();

  useEffect(() => {
    const id = orderId || searchParams.get('id') || searchParams.get('order');
    if (id) {
      setTrackingOrderId(id);
    }
  }, [orderId, searchParams, setTrackingOrderId]);

  return <TrackingComponent />;
};

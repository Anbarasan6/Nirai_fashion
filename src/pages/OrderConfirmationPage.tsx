import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, MapPin, Truck, Printer } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { StorageService } from '../services/storage';

export const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { language, t } = useShop();

  const order = StorageService.getOrderById(orderId || '');

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#4A0E17]">Order Not Found</h2>
        <Link to="/" className="inline-block px-6 py-2.5 bg-[#4A0E17] text-[#F4E8C1] text-xs font-bold rounded-full">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Success Banner */}
      <div className="bg-white p-8 rounded-3xl border-2 border-[#D4AF37]/50 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 bg-[#F4E8C1] text-[#4A0E17] rounded-full flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-10 h-10 text-[#4A0E17]" />
        </div>

        <h1 className="font-serif-luxury text-2xl sm:text-4xl font-extrabold text-[#2D1619]">
          {t('orderConfirmed')}
        </h1>

        <p className="text-xs sm:text-sm text-[#4A0E17] max-w-md mx-auto">
          Thank you for supporting Salem master handloom weavers! Your payment reference has been recorded.
        </p>

        <div className="inline-block px-4 py-2 bg-[#F4E8C1] text-[#4A0E17] text-xs font-extrabold rounded-full border border-[#D4AF37]">
          Order Number: <span className="font-mono text-sm">{order.order_number}</span>
        </div>
      </div>

      {/* Order Details Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-[#F2ECDF] pb-4">
          <h3 className="font-serif-luxury text-base font-bold text-[#2D1619]">
            Ordered Silk Sarees
          </h3>
          <span className="px-3 py-1 bg-[#F4E8C1] text-[#4A0E17] text-xs font-bold rounded-full">
            Payment Status: {order.payment_status}
          </span>
        </div>

        {/* Item List */}
        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 py-2 border-b border-[#FBF9F5]">
              {item.image && (
                <img src={item.image} alt={item.product_name} className="w-14 h-16 object-cover rounded-lg border border-[#E2D9C8]" />
              )}
              <div className="flex-1">
                <h4 className="text-xs font-bold text-[#2D1619]">
                  {language === 'ta' && item.name_ta ? item.name_ta : item.product_name}
                </h4>
                {item.selected_variant && (
                  <p className="text-[11px] text-[#4A0E17]">Variant: {item.selected_variant}</p>
                )}
                <p className="text-xs text-[#8A7B7E]">Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}</p>
              </div>
              <span className="text-xs font-extrabold text-[#4A0E17]">
                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>

        {/* Shipping Address & Total */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#F2ECDF]">
          <div className="space-y-1 text-xs text-[#4A0E17]">
            <h4 className="font-bold text-[#2D1619] flex items-center gap-1 mb-1">
              <MapPin className="w-4 h-4 text-[#D4AF37]" />
              <span>Shipping Address</span>
            </h4>
            <p className="font-semibold">{order.shipping_address.fullName || order.customer_name}</p>
            <p>{order.shipping_address.street}, {order.shipping_address.city}</p>
            <p>{order.shipping_address.state} - {order.shipping_address.pincode}</p>
            <p className="pt-1">Phone: <strong>{order.phone}</strong></p>
          </div>

          <div className="space-y-1 text-xs text-right text-[#4A0E17]">
            <p>Subtotal: ₹{order.subtotal.toLocaleString('en-IN')}</p>
            {order.discount > 0 && <p className="text-green-700">Discount: -₹{order.discount.toLocaleString('en-IN')}</p>}
            <p>Shipping: {order.shipping_fee === 0 ? 'FREE' : `₹${order.shipping_fee}`}</p>
            <p className="text-base font-extrabold text-[#2D1619] pt-2 border-t border-[#E2D9C8]">
              Total Paid: ₹{order.total_amount.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-[#F2ECDF]">
          <Link
            to={`/tracking?id=${order.order_number}`}
            className="flex-1 py-3 bg-[#2D1619] text-[#F4E8C1] font-bold text-xs rounded-xl hover:bg-[#4A0E17] text-center flex items-center justify-center gap-2"
          >
            <Truck className="w-4 h-4 text-[#D4AF37]" />
            <span>{t('trackStatus')}</span>
          </Link>
          <button
            onClick={() => window.print()}
            className="px-5 py-3 bg-[#ECE6D9] text-[#2D1619] font-bold text-xs rounded-xl hover:bg-[#D5CEBF] flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice Receipt</span>
          </button>
        </div>

      </div>

    </div>
  );
};

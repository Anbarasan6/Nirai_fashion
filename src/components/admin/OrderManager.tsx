import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import {
  Search,
  Truck,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  Eye,
} from 'lucide-react';

const STATUS_OPTIONS: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const PAYMENT_OPTIONS: PaymentStatus[] = ['Pending', 'Paid', 'Refunded', 'Failed'];

export const OrderManager: React.FC = () => {
  const { showToast, refreshData } = useShop();
  const [orders, setOrders] = useState<Order[]>(() => StorageService.getOrders());
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Form inside modal
  const [status, setStatus] = useState<OrderStatus>('Confirmed');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [courierName, setCourierName] = useState('BlueDart Express');
  const [trackingId, setTrackingId] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('https://www.bluedart.com');

  const syncOrders = () => {
    setOrders(StorageService.getOrders());
    refreshData();
  };

  const handleOpenEdit = (order: Order) => {
    setSelectedOrder(order);
    setStatus(order.status);
    setPaymentStatus(order.paymentStatus);
    setCourierName(order.shippingDetails?.courierName || 'BlueDart Express');
    setTrackingId(order.shippingDetails?.trackingId || '');
    setTrackingUrl(order.shippingDetails?.trackingUrl || 'https://www.bluedart.com');
  };

  const handleUpdateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    StorageService.updateOrderStatus(selectedOrder.id, status, paymentStatus, {
      courierName,
      trackingId,
      trackingUrl,
    });

    syncOrders();
    setSelectedOrder(null);
    showToast(`Order #${selectedOrder.orderNumber} updated to ${status}`, 'success');
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.includes(search);
    const matchesStatus = selectedStatus === 'all' || o.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search by order ID, customer, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs p-2.5 pl-9 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-900"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-2.5 top-3" />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-500 font-semibold">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
          >
            <option value="all">All Orders ({orders.length})</option>
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-[#E2DBD0] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-semibold">Order ID</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Customer Details</th>
                <th className="py-3 px-4 font-semibold">Items</th>
                <th className="py-3 px-4 font-semibold">Grand Total</th>
                <th className="py-3 px-4 font-semibold">Order Status</th>
                <th className="py-3 px-4 font-semibold">Payment</th>
                <th className="py-3 px-4 font-semibold">Courier Tracking</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {order.orderNumber}
                  </td>
                  <td className="py-3 px-4 text-stone-500 text-[11px] whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900 block">{order.customerName}</span>
                    <span className="text-[11px] text-stone-500">{order.customerPhone}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800">
                      {order.items.length} item(s)
                    </span>
                    <span className="text-[10px] text-stone-400 block line-clamp-1">
                      {order.items.map((i) => i.productName).join(', ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-serif font-bold text-slate-900 tabular-nums">
                    ₹{order.grandTotal.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        order.status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'Cancelled'
                          ? 'bg-rose-100 text-rose-800'
                          : order.status === 'Shipped'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="capitalize font-semibold text-slate-800 block">
                      {order.paymentMethod}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        order.paymentStatus === 'Paid'
                          ? 'text-emerald-700'
                          : order.paymentStatus === 'Refunded'
                          ? 'text-purple-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[11px]">
                    <span className="font-semibold text-slate-800 block">
                      {order.shippingDetails?.courierName || 'Unassigned'}
                    </span>
                    <span className="font-mono text-stone-500">
                      {order.shippingDetails?.trackingId || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenEdit(order)}
                      className="px-2.5 py-1.5 bg-amber-900 hover:bg-amber-950 text-white rounded-md text-[11px] font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Update</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Order Status & Courier Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2DBD0] shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div>
                <h3 className="font-serif text-base font-bold text-slate-900">
                  Manage Order #{selectedOrder.orderNumber}
                </h3>
                <span className="text-xs text-stone-500">
                  Customer: {selectedOrder.customerName} ({selectedOrder.customerPhone})
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-stone-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateOrder} className="p-6 space-y-4 text-xs">
              {/* Order Status & Payment Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Fulfillment Status</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-md bg-white font-semibold"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e: any) => setPaymentStatus(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-md bg-white font-semibold"
                  >
                    {PAYMENT_OPTIONS.map((ps) => (
                      <option key={ps} value={ps}>
                        {ps}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Courier Partner & Tracking */}
              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-3">
                <span className="font-serif font-bold text-amber-950 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-amber-800" />
                  <span>Courier & Tracking Details (Visible to Customer)</span>
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Courier Partner</label>
                    <select
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      className="w-full p-2 border border-stone-300 rounded-md bg-white"
                    >
                      <option value="BlueDart Express">BlueDart Express</option>
                      <option value="Delhivery Logistics">Delhivery Logistics</option>
                      <option value="DTDC Express">DTDC Express</option>
                      <option value="India Post Speed Post">India Post Speed Post</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Tracking ID / AWB</label>
                    <input
                      type="text"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                      placeholder="e.g. BD882194301IN"
                      className="w-full p-2 border border-stone-300 rounded-md font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Courier Portal URL</label>
                  <input
                    type="text"
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-md"
                  />
                </div>
              </div>

              {/* Shipping Address Review */}
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-stone-600 text-[11px]">
                <span className="font-bold text-slate-800 block mb-0.5">Shipping Destination:</span>
                <p>{selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}</p>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-semibold"
                >
                  Save & Update Tracking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

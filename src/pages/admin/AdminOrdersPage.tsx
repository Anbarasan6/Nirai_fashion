import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Search, CheckCircle2, Truck, Package, XCircle, Eye, Printer, X } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import type { Order } from '../../types';

export const AdminOrdersPage: React.FC = () => {
  const { orders } = useShop();
  const [selectedTab, setSelectedTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeOrderModal, setActiveOrderModal] = useState<Order | null>(null);

  const filteredOrders = orders.filter(o => {
    if (selectedTab !== 'ALL' && o.status !== selectedTab && o.payment_status !== selectedTab) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        (o.utr_number && o.utr_number.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleUpdateStatus = async (id: string, status: Order['status'], paymentStatus?: Order['payment_status']) => {
    await StorageService.updateOrderStatus(id, status, paymentStatus);
    if (activeOrderModal && activeOrderModal.id === id) {
      setActiveOrderModal({
        ...activeOrderModal,
        status,
        payment_status: paymentStatus || activeOrderModal.payment_status
      });
    }
  };

  const exportPdfInvoice = (ord: Order) => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('NIRAI HANDLOOM SILKS', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Salem & Elampillai Weavers, Tamil Nadu, India', 14, 26);
    doc.text(`INVOICE RECEIPT: ${ord.order_number}`, 14, 34);
    doc.text(`Date: ${new Date(ord.created_at).toLocaleDateString()}`, 14, 40);

    doc.text(`Customer: ${ord.customer_name}`, 14, 52);
    doc.text(`Phone: ${ord.phone}`, 14, 58);
    doc.text(`Address: ${ord.shipping_address.street}, ${ord.shipping_address.city} - ${ord.shipping_address.pincode}`, 14, 64);
    doc.text(`Payment Ref UTR: ${ord.utr_number || 'N/A'}`, 14, 70);

    let y = 82;
    doc.setFont('helvetica', 'bold');
    doc.text('Saree Item Description', 14, y);
    doc.text('Qty', 130, y);
    doc.text('Price (INR)', 160, y);

    doc.setFont('helvetica', 'normal');
    ord.items.forEach(item => {
      y += 8;
      doc.text(item.product_name.substring(0, 45), 14, y);
      doc.text(String(item.quantity), 130, y);
      doc.text(`Rs. ${(item.price * item.quantity).toLocaleString('en-IN')}`, 160, y);
    });

    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount Paid: Rs. ${ord.total_amount.toLocaleString('en-IN')}`, 14, y);

    doc.save(`Invoice_${ord.order_number}.pdf`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Search Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm">
        <div>
          <h2 className="font-serif-luxury text-xl font-bold text-[#2D1619]">
            Order Processing & UTR Verification
          </h2>
          <p className="text-xs text-[#8A7B7E]">Verify 0% gateway fee UPI payments and dispatch shipments</p>
        </div>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order No, Phone, UTR..."
            className="w-full text-xs pl-3 pr-8 py-2.5 border border-[#D4AF37]/50 rounded-xl bg-[#FBF9F5]"
          />
          <Search className="w-4 h-4 text-[#8A7B7E] absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {['ALL', 'PENDING', 'VERIFYING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-2 rounded-xl transition whitespace-nowrap ${
              selectedTab === tab
                ? 'bg-[#2D1619] text-[#F4E8C1] shadow-md'
                : 'bg-white text-[#2D1619] border border-[#E2D9C8] hover:bg-[#ECE6D9]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-[#E2D9C8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2D9C8] text-[11px] font-bold text-[#8A7B7E] uppercase bg-[#FBF9F5]">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Method / UTR</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2ECDF] text-xs">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-[#FBF9F5]">
                  <td className="py-3 px-4 font-mono font-bold text-[#2D1619]">{ord.order_number}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold">{ord.customer_name}</div>
                    <div className="text-[11px] text-[#8A7B7E]">{ord.phone}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold">{ord.items.length} Sarees</td>
                  <td className="py-3 px-4 font-extrabold text-[#4A0E17]">₹{ord.total_amount.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4">
                    <div>{ord.payment_method}</div>
                    <div className="font-mono text-[11px] text-[#4A0E17] font-bold">{ord.utr_number || 'N/A'}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      ord.payment_status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {ord.payment_status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-[#2D1619]">{ord.status}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setActiveOrderModal(ord)}
                        className="p-1.5 text-[#2D1619] hover:bg-[#F4E8C1] rounded-lg transition"
                        title="View UTR Proof & Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => exportPdfInvoice(ord)}
                        className="p-1.5 text-[#4A0E17] hover:bg-[#ECE6D9] rounded-lg transition"
                        title="Download Invoice PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order & UTR Verification Drawer/Modal */}
      {activeOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 border-2 border-[#D4AF37] shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#F2ECDF] pb-3">
              <div>
                <h3 className="font-serif-luxury text-lg font-bold text-[#2D1619]">
                  Verify Order {activeOrderModal.order_number}
                </h3>
                <p className="text-xs text-[#8A7B7E]">Placed on {new Date(activeOrderModal.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setActiveOrderModal(null)} className="text-[#8A7B7E] hover:text-[#2D1619]">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Customer & UTR info */}
            <div className="p-4 bg-[#FBF9F5] rounded-xl border border-[#E2D9C8] space-y-2 text-xs">
              <p>Customer: <strong>{activeOrderModal.customer_name}</strong> ({activeOrderModal.phone})</p>
              <p>Address: {activeOrderModal.shipping_address.street}, {activeOrderModal.shipping_address.city} - {activeOrderModal.shipping_address.pincode}</p>
              <p>Submitted UTR / Ref No: <strong className="font-mono text-sm text-[#4A0E17]">{activeOrderModal.utr_number || 'N/A'}</strong></p>
              <p>Total Payable: <strong className="text-base text-[#4A0E17]">₹{activeOrderModal.total_amount.toLocaleString('en-IN')}</strong></p>
            </div>

            {/* Cloudinary Screenshot Proof Preview */}
            {activeOrderModal.utr_proof_url ? (
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#2D1619] block">
                  Payment Proof Screenshot (Uploaded via Cloudinary)
                </label>
                <div className="max-h-60 overflow-hidden rounded-xl border border-[#E2D9C8] bg-black/5 p-2">
                  <img src={activeOrderModal.utr_proof_url} alt="UTR Screenshot Proof" className="max-h-56 mx-auto object-contain rounded-lg" />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200">
                No screenshot uploaded. Verified via 12-Digit UTR Bank SMS reference.
              </div>
            )}

            {/* Status Workflow Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-[#F2ECDF]">
              <label className="text-xs font-bold text-[#2D1619] block">Update Workflow Status</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleUpdateStatus(activeOrderModal.id, 'PENDING', 'PAID')}
                  className="py-2.5 bg-green-700 text-white font-bold rounded-xl hover:bg-green-800 flex items-center justify-center gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Mark Paid</span>
                </button>

                <button
                  onClick={() => handleUpdateStatus(activeOrderModal.id, 'SHIPPED', 'PAID')}
                  className="py-2.5 bg-[#4A0E17] text-[#F4E8C1] font-bold rounded-xl hover:bg-[#2D1619] flex items-center justify-center gap-1"
                >
                  <Truck className="w-4 h-4 text-[#D4AF37]" />
                  <span>Dispatch Shipment</span>
                </button>

                <button
                  onClick={() => handleUpdateStatus(activeOrderModal.id, 'DELIVERED', 'PAID')}
                  className="py-2.5 bg-[#D4AF37] text-[#2D1619] font-bold rounded-xl hover:bg-[#B8860B] flex items-center justify-center gap-1"
                >
                  <Package className="w-4 h-4" />
                  <span>Mark Delivered</span>
                </button>

                <button
                  onClick={() => handleUpdateStatus(activeOrderModal.id, 'CANCELLED', 'FAILED')}
                  className="py-2.5 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200 flex items-center justify-center gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Cancel Order</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

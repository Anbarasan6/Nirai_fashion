import React, { useState, useRef, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { Order, OrderStatus, PaymentStatus, PaymentSubmission } from '../../types';
import {
  Search,
  Truck,
  CheckCircle2,
  X,
  Package,
  Clock,
  XCircle,
  RefreshCw,
  Printer,
  Tag,
  Settings2,
  ChevronRight,
  MapPin,
  CreditCard,
  ArrowUpRight,
  FileDown,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  ShieldCheck,
  ExternalLink,
  Image as ImageIcon,
  Check,
  Ban,
  CheckCircle,
} from 'lucide-react';

const STATUS_OPTIONS: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Returned',
];

const PAYMENT_OPTIONS: PaymentStatus[] = [
  'Awaiting Payment',
  'Verification Pending',
  'Paid',
  'Rejected',
  'Expired',
  'Refunded',
];

const COURIER_OPTIONS = [
  { label: 'BlueDart Express (BLUEDART)', value: 'BlueDart Express', url: 'https://www.bluedart.com' },
  { label: 'Delhivery Logistics', value: 'Delhivery Logistics', url: 'https://www.delhivery.com' },
  { label: 'DTDC Express', value: 'DTDC Express', url: 'https://www.dtdc.in' },
  { label: 'India Post Speed Post', value: 'India Post Speed Post', url: 'https://www.indiapost.gov.in' },
  { label: 'Professional Couriers', value: 'Professional Couriers', url: 'https://www.tpcindia.com' },
  { label: 'Ekart Logistics', value: 'Ekart Logistics', url: 'https://ekartlogistics.com' },
  { label: 'Xpressbees', value: 'Xpressbees', url: 'https://www.xpressbees.com' },
  { label: 'Ecom Express', value: 'Ecom Express', url: 'https://ecomexpress.in' },
];

// --- Status badge helpers ---
function getStatusBadge(status: OrderStatus) {
  const map: Record<OrderStatus, string> = {
    Pending: 'bg-amber-100 text-amber-900 border-amber-200',
    Confirmed: 'bg-amber-100 text-amber-900 border-amber-200',
    Processing: 'bg-sky-100 text-sky-800 border-sky-200',
    Shipped: 'bg-violet-100 text-violet-800 border-violet-200',
    Delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
    Returned: 'bg-orange-100 text-orange-800 border-orange-200',
  };
  return map[status] || 'bg-stone-100 text-stone-700 border-stone-200';
}

function getPayBadge(status: PaymentStatus) {
  const map: Record<PaymentStatus, string> = {
    'Awaiting Payment': 'text-amber-800 bg-amber-50 border border-amber-200',
    'Verification Pending': 'text-orange-900 bg-orange-100 border border-orange-300 font-black',
    'Paid': 'text-emerald-800 bg-emerald-50 border border-emerald-200',
    'Rejected': 'text-rose-800 bg-rose-50 border border-rose-200',
    'Expired': 'text-stone-600 bg-stone-100 border border-stone-200',
    'Refunded': 'text-purple-800 bg-purple-50 border border-purple-200',
    'Pending': 'text-amber-800 bg-amber-50 border border-amber-200',
    'PENDING_VERIFICATION': 'text-orange-900 bg-orange-100 border border-orange-300 font-black',
    'Failed': 'text-rose-800 bg-rose-50 border border-rose-200',
  };
  return map[status] || 'text-stone-600 bg-stone-50 border border-stone-200';
}

// --- Tab filter buckets ---
const FILTER_TABS = [
  { id: 'all', label: 'All Orders', statuses: [] as OrderStatus[], isPaymentQueue: false },
  { id: 'verification_pending', label: 'Payment Verification', statuses: [] as OrderStatus[], isPaymentQueue: true },
  { id: 'pending', label: 'Pending & Confirmed', statuses: ['Pending', 'Confirmed'] as OrderStatus[], isPaymentQueue: false },
  { id: 'processing', label: 'Processing & Packaging', statuses: ['Processing'] as OrderStatus[], isPaymentQueue: false },
  { id: 'shipped', label: 'Shipped & In Transit', statuses: ['Shipped'] as OrderStatus[], isPaymentQueue: false },
  { id: 'delivered', label: 'Delivered', statuses: ['Delivered'] as OrderStatus[], isPaymentQueue: false },
  { id: 'cancelled', label: 'Cancelled / Returned', statuses: ['Cancelled', 'Returned'] as OrderStatus[], isPaymentQueue: false },
];

// --- Shipping Label Print Component ---
const ShippingLabelPrint: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => {
  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Print controls - hidden when printing */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 print:hidden">
          <h3 className="font-serif font-bold text-slate-900">Courier Shipping Label</h3>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-[#2D1619] text-amber-100 text-xs font-semibold rounded-lg hover:bg-[#431B21] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Courier Shipping Label
            </button>
            <button onClick={onClose} className="p-2 text-stone-400 hover:text-slate-800 rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Label Content */}
        <div id="shipping-label" className="p-6 font-sans">
          {/* Header */}
          <div className="flex items-start justify-between mb-4 pb-4 border-b-2 border-slate-900">
            <div>
              <h1 className="text-2xl font-black tracking-widest text-slate-900 uppercase">NIRAI HANDLOOMS</h1>
              <p className="text-xs text-stone-500">Direct Master Weaver Apparel &amp; Silks</p>
            </div>
            <div className="border-2 border-slate-900 px-3 py-1.5 text-xs font-black tracking-widest uppercase">
              EXPRESS AIR PARCEL
            </div>
          </div>

          {/* Barcode simulation */}
          <div className="border-2 border-slate-800 rounded p-4 mb-4 text-center bg-white">
            <div className="flex justify-center gap-[2px] mb-2" aria-hidden="true">
              {Array.from({ length: 60 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-900"
                  style={{
                    width: i % 3 === 0 ? '3px' : i % 5 === 0 ? '1px' : '2px',
                    height: '40px',
                  }}
                />
              ))}
            </div>
            <p className="font-mono font-bold text-xs tracking-[0.3em] text-slate-900">
              AWB / TRACKING: {order.orderNumber}
            </p>
          </div>

          {/* Address Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
            <div className="border border-stone-300 rounded-lg p-3">
              <p className="font-black uppercase text-[10px] tracking-widest text-stone-500 mb-2">SHIP TO (RECIPIENT):</p>
              <p className="font-bold text-base text-slate-900">{order.customerName}</p>
              <p className="text-stone-700 mt-1 leading-relaxed uppercase">
                {order.shippingAddress.street}
                {order.shippingAddress.landmark ? `, ${order.shippingAddress.landmark}` : ''}
              </p>
              <p className="text-stone-700 uppercase">
                {order.shippingAddress.city}, {order.shippingAddress.state}
              </p>
              <p className="font-bold mt-1">PINCODE: {order.shippingAddress.pincode}</p>
              <p className="font-bold">PHONE: {order.customerPhone}</p>
            </div>
            <div className="border border-stone-300 rounded-lg p-3 bg-stone-50">
              <p className="font-black uppercase text-[10px] tracking-widest text-stone-500 mb-2">SHIP FROM (SENDER):</p>
              <p className="font-bold text-slate-900">NIRAI HANDLOOMS &amp; APPAREL</p>
              <p className="text-stone-700 mt-1 leading-relaxed">
                18 Cathedral Road, Opp. Botanical Garden
              </p>
              <p className="text-stone-700">Chennai, Tamil Nadu - 600086</p>
              <p className="font-bold mt-1">CONTACT: +91 44 2498 7654</p>
              <p className="font-bold">GSTIN: 33AAAAF9901Z1ZX</p>
            </div>
          </div>

          {/* Manifest */}
          <div className="border border-stone-300 rounded-lg overflow-hidden mb-3 text-xs">
            <div className="bg-stone-100 px-3 py-2">
              <p className="font-black uppercase tracking-widest text-[10px] text-stone-600">
                ORDER ITEM MANIFEST (ORDER #{order.orderNumber}):
              </p>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="px-3 py-1.5 text-[10px] font-bold uppercase text-stone-500">Item Description</th>
                  <th className="px-3 py-1.5 text-[10px] font-bold uppercase text-stone-500">Variant</th>
                  <th className="px-3 py-1.5 text-[10px] font-bold uppercase text-stone-500 text-center">QTY</th>
                  <th className="px-3 py-1.5 text-[10px] font-bold uppercase text-stone-500 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i} className="border-b border-stone-100">
                    <td className="px-3 py-1.5 font-semibold text-slate-800">{item.productName}</td>
                    <td className="px-3 py-1.5 text-stone-600">
                      {[item.size, item.color].filter(Boolean).join(' / ') || item.variantName || '—'}
                    </td>
                    <td className="px-3 py-1.5 text-center font-bold">{item.quantity}</td>
                    <td className="px-3 py-1.5 text-right font-bold tabular-nums">₹{item.totalPrice.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between px-3 py-2 bg-stone-50 border-t border-stone-200 text-[10px] font-bold uppercase">
              <span>PAYMENT: {order.paymentMethod} ({order.paymentStatus})</span>
              <span>GRAND TOTAL: ₹{order.grandTotal.toLocaleString()}</span>
              <span>PACKAGE TYPE: PRE-INSPECTED HANDLOOM BOX</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const OrderManager: React.FC = () => {
  const { showToast, refreshData, currentUser } = useShop();
  const [orders, setOrders] = useState<Order[]>(() => StorageService.getOrders());
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showLabel, setShowLabel] = useState(false);
  const [labelOrder, setLabelOrder] = useState<Order | null>(null);

  // Submissions & Payment Verification State
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [signedProofUrls, setSignedProofUrls] = useState<Record<string, string>>({});
  const [isVerifyingSubId, setIsVerifyingSubId] = useState<string | null>(null);
  const [rejectingSub, setRejectingSub] = useState<PaymentSubmission | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [manualPaidModalOpen, setManualPaidModalOpen] = useState(false);
  const [manualPaidNoteInput, setManualPaidNoteInput] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Modal form state
  const [status, setStatus] = useState<OrderStatus>('Confirmed');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [courierName, setCourierName] = useState('BlueDart Express');
  const [trackingId, setTrackingId] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('https://www.bluedart.com');
  const [utrNumber, setUtrNumber] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  const syncOrders = () => {
    const fresh = StorageService.getOrders();
    setOrders(fresh);
    refreshData();
  };

  const loadSubmissions = async (orderId: string) => {
    setLoadingSubmissions(true);
    try {
      const list = await StorageService.getPaymentSubmissions(orderId);
      setSubmissions(list);
      // Fetch signed URLs for screenshots
      const urlMap: Record<string, string> = {};
      for (const sub of list) {
        if (sub.screenshotPath) {
          const url = await StorageService.getSignedPaymentProofUrl(sub.screenshotPath);
          if (url) urlMap[sub.id] = url;
        }
      }
      setSignedProofUrls(urlMap);
    } catch (err: any) {
      console.error('Failed to load payment submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleOpenEdit = (order: Order) => {
    setSelectedOrder(order);
    setStatus(order.status);
    setPaymentStatus(order.paymentStatus);
    setCourierName(order.shippingDetails?.courierName || 'BlueDart Express');
    setTrackingId(order.shippingDetails?.trackingId || '');
    setTrackingUrl(order.shippingDetails?.trackingUrl || 'https://www.bluedart.com');
    setEstimatedDelivery(order.shippingDetails?.estimatedDelivery || '');
    setUtrNumber(order.utrNumber || '');
    setInternalNotes(order.notes || '');
    loadSubmissions(order.id);
  };

  const handleVerifyPayment = async (sub: PaymentSubmission) => {
    if (!selectedOrder) return;
    const confirmed = window.confirm(
      `Confirm Payment Verification:\n\nOrder: #${selectedOrder.orderNumber}\nUTR: ${sub.utr}\nAmount: ₹${sub.amountPaid.toLocaleString()}\nPayer: ${sub.payerName}\n\nHave you verified this credit in your merchant bank/UPI statement?`
    );
    if (!confirmed) return;

    setIsVerifyingSubId(sub.id);
    setIsActionLoading(true);
    try {
      const res = await StorageService.verifyPayment(sub.id, 'Verified by operations staff in OrderManager');
      if (res.success) {
        showToast(`Payment verified! Order #${selectedOrder.orderNumber} is now Confirmed & Paid.`, 'success');
        syncOrders();
        setSelectedOrder({
          ...selectedOrder,
          paymentStatus: 'Paid',
          status: 'Confirmed',
        });
        setPaymentStatus('Paid');
        setStatus('Confirmed');
        await loadSubmissions(selectedOrder.id);
      } else {
        showToast(res.error || 'Payment verification failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Payment verification failed', 'error');
    } finally {
      setIsVerifyingSubId(null);
      setIsActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingSub || !selectedOrder) return;
    if (!rejectReasonInput.trim() || rejectReasonInput.trim().length < 5) {
      showToast('Please provide a specific rejection reason (at least 5 characters)', 'error');
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await StorageService.rejectPayment(rejectingSub.id, rejectReasonInput.trim());
      if (res.success) {
        showToast(`Payment rejected for Order #${selectedOrder.orderNumber}. Stock hold retained until payment deadline.`, 'info');
        syncOrders();
        setSelectedOrder({
          ...selectedOrder,
          paymentStatus: 'Rejected',
        });
        setPaymentStatus('Rejected');
        setRejectingSub(null);
        setRejectReasonInput('');
        await loadSubmissions(selectedOrder.id);
      } else {
        showToast(res.error || 'Failed to reject payment', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to reject payment', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmManualPaid = async () => {
    if (!selectedOrder) return;
    if (!manualPaidNoteInput.trim() || manualPaidNoteInput.trim().length < 5) {
      showToast('Please enter an explanatory note (e.g. Cash collected in store)', 'error');
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await StorageService.markOrderPaidManually(selectedOrder.id, manualPaidNoteInput.trim());
      if (res.success) {
        showToast(`Order #${selectedOrder.orderNumber} marked as Paid manually.`, 'success');
        syncOrders();
        setSelectedOrder({
          ...selectedOrder,
          paymentStatus: 'Paid',
          status: 'Confirmed',
        });
        setPaymentStatus('Paid');
        setStatus('Confirmed');
        setManualPaidModalOpen(false);
        setManualPaidNoteInput('');
        await loadSubmissions(selectedOrder.id);
      } else {
        showToast(res.error || 'Failed to mark order as paid', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to mark order as paid', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const checkDuplicateUtr = (utr: string, currentOrderId: string) => {
    const norm = utr.trim().toUpperCase();
    if (!norm) return null;
    const otherOrder = orders.find(
      (o) => o.id !== currentOrderId && o.utrNumber?.trim().toUpperCase() === norm
    );
    return otherOrder ? otherOrder.orderNumber : null;
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      await StorageService.updateOrderStatus(
        selectedOrder.id,
        status,
        paymentStatus,
        { courierName, trackingId, trackingUrl, estimatedDelivery },
        { utrNumber: utrNumber.trim(), notes: internalNotes.trim() }
      );

      syncOrders();
      setSelectedOrder(null);
      showToast(`Order #${selectedOrder.orderNumber} updated → ${status}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Status transition rejected by server', 'error');
    }
  };

  // Tab-based counts
  const tabCounts = FILTER_TABS.reduce((acc, tab) => {
    if (tab.id === 'all') {
      acc[tab.id] = orders.length;
    } else if (tab.id === 'verification_pending') {
      acc[tab.id] = orders.filter((o) => o.paymentStatus === 'Verification Pending').length;
    } else {
      acc[tab.id] = orders.filter((o) => tab.statuses.includes(o.status)).length;
    }
    return acc;
  }, {} as Record<string, number>);

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const currentTab = FILTER_TABS.find((t) => t.id === activeTab) || FILTER_TABS[0];

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.includes(search) ||
      (o.utrNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.shippingDetails?.trackingId || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'verification_pending') {
      return o.paymentStatus === 'Verification Pending';
    }

    return currentTab.statuses.length === 0 || currentTab.statuses.includes(o.status);
  });

  // Oldest first for verification queue as required
  if (activeTab === 'verification_pending') {
    filteredOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  const handleCourierChange = (val: string) => {
    setCourierName(val);
    const found = COURIER_OPTIONS.find((c) => c.value === val);
    if (found) setTrackingUrl(found.url);
  };

  const openLabel = (order: Order) => {
    setLabelOrder(order);
    setShowLabel(true);
    setSelectedOrder(null);
  };

  // Export CSV
  const exportCSV = () => {
    const rows = [
      ['Order #', 'Date', 'Customer', 'Phone', 'Email', 'Items', 'Grand Total', 'Status', 'Payment Status', 'Payment Method', 'UTR', 'Courier', 'Tracking ID', 'City', 'Pincode'],
      ...orders.map((o) => [
        o.orderNumber,
        new Date(o.createdAt).toLocaleDateString(),
        o.customerName,
        o.customerPhone,
        o.customerEmail,
        o.items.length,
        o.grandTotal,
        o.status,
        o.paymentStatus,
        o.paymentMethod,
        o.utrNumber || '',
        o.shippingDetails?.courierName || '',
        o.shippingDetails?.trackingId || '',
        o.shippingAddress.city,
        o.shippingAddress.pincode,
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nirai_orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Order manifest exported as CSV', 'success');
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-[#E2DBD0] shadow-2xs p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-slate-900">
            Fulfillment &amp; Order Processing Pipeline
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Section-wise order management by status, instant courier tracking updates &amp; manifest printing.
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0"
        >
          <FileDown className="w-4 h-4" />
          Reports &amp; Manifest Download
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-white rounded-xl border border-[#E2DBD0] shadow-2xs overflow-x-auto">
        <div className="flex min-w-max">
          {FILTER_TABS.map((tab, i) => {
            const isActive = activeTab === tab.id;
            const count = tabCounts[tab.id] || 0;
            const dotColors = [
              'bg-slate-800', 'bg-amber-500', 'bg-sky-500',
              'bg-violet-500', 'bg-emerald-500', 'bg-rose-500',
            ];
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${isActive
                    ? 'border-amber-900 text-amber-900 bg-amber-50/40'
                    : 'border-transparent text-stone-500 hover:text-slate-800 hover:bg-stone-50'
                  }`}
              >
                <span
                  className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center text-white ${isActive ? 'bg-amber-900' : dotColors[i] || 'bg-stone-400'
                    }`}
                >
                  {count}
                </span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search + Count */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by Order #, Customer Name, Phone, AWB..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs p-2.5 pl-9 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-900"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-2.5 top-2.5" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-500 whitespace-nowrap">
            Showing <strong>{filteredOrders.length}</strong> order(s)
          </span>
          <button
            onClick={syncOrders}
            className="p-2 text-stone-500 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
            title="Refresh orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-[#E2DBD0] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-semibold">Order ID &amp; Date</th>
                <th className="py-3 px-4 font-semibold">Customer Details</th>
                <th className="py-3 px-4 font-semibold">Handloom Items</th>
                <th className="py-3 px-4 font-semibold">Grand Total</th>
                <th className="py-3 px-4 font-semibold">Fulfillment Stage</th>
                <th className="py-3 px-4 font-semibold">Payment Info</th>
                <th className="py-3 px-4 font-semibold">Courier Tracking</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-stone-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No orders found</p>
                    <p className="text-xs mt-1">Try adjusting the filter or search query</p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{order.orderNumber}</span>
                      <span className="text-[11px] text-stone-400">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{order.customerName}</span>
                      <span className="text-[11px] text-stone-500">{order.customerPhone}</span>
                      <span className="text-[11px] text-stone-400 block truncate max-w-[160px]">
                        {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 block">{order.items.length} item(s)</span>
                      <span className="text-[10px] text-amber-800 block line-clamp-2 max-w-[180px]">
                        {order.items.map((i) => i.productName).join(', ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-serif font-bold text-slate-900 tabular-nums whitespace-nowrap">
                      ₹{order.grandTotal.toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${getStatusBadge(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-[11px] font-semibold text-slate-700 block">
                        {order.paymentMethod === 'ONLINE_UPI' ? 'Direct UPI' : order.paymentMethod}
                      </span>
                      <span className={`text-[10px] font-bold ${getPayBadge(order.paymentStatus)}`}>
                        {order.paymentStatus === 'PENDING_VERIFICATION' ? 'Verifying...' : order.paymentStatus}
                      </span>
                      {order.utrNumber && (
                        <span className="text-[10px] text-stone-400 block font-mono">UTR: {order.utrNumber}</span>
                      )}
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
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Print Label button */}
                        <button
                          onClick={() => openLabel(order)}
                          title="Print Shipping Label"
                          className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Tag className="w-3 h-3" />
                          <span>Label</span>
                        </button>
                        {/* Manage button */}
                        <button
                          onClick={() => handleOpenEdit(order)}
                          className="px-2.5 py-1.5 bg-amber-900 hover:bg-amber-950 text-white rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Settings2 className="w-3 h-3" />
                          <span>Manage</span>
                        </button>
                      </div>
                      <button
                        onClick={() => handleOpenEdit(order)}
                        className="text-[10px] text-amber-800 hover:text-amber-950 flex items-center gap-0.5 ml-auto mt-1 cursor-pointer"
                      >
                        Pack &amp; Process <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-stone-200 bg-stone-50 text-xs">
            <span className="text-stone-500">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredOrders.length)} of {filteredOrders.length} orders
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1 bg-white border border-stone-300 rounded hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-7 h-7 rounded text-xs font-semibold cursor-pointer ${page === i + 1
                      ? 'bg-amber-900 text-white'
                      : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'
                    }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-2.5 py-1 bg-white border border-stone-300 rounded hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manage Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-start justify-center p-4 pt-10">
          <div className="bg-white rounded-2xl border border-[#E2DBD0] shadow-2xl w-full max-w-2xl overflow-hidden">
            {/* Modal Header */}
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
                className="p-1.5 text-stone-400 hover:text-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateOrder} className="p-6 space-y-5 text-xs overflow-y-auto max-h-[80vh]">
              {/* Status Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Fulfillment Status</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-lg bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-amber-800"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e: any) => setPaymentStatus(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-lg bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-amber-800"
                  >
                    {PAYMENT_OPTIONS.map((ps) => (
                      <option key={ps} value={ps}>{ps}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Order Items / Manifest */}
              <div className="rounded-xl border border-stone-200 overflow-hidden">
                <div className="bg-stone-50 px-4 py-2.5 flex items-center justify-between border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-800" />
                    <span className="font-serif font-bold text-slate-900 text-xs">
                      Order Items, Production Images &amp; Supplier Sourcing
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400">Click Production Image to view Product Page</span>
                </div>
                <div className="divide-y divide-stone-100">
                  <div className="grid grid-cols-[120px_1fr_1fr_auto] gap-2 px-4 py-2 text-[10px] font-bold uppercase text-stone-400 tracking-widest">
                    <span>Production Image</span>
                    <span>Product &amp; Variant Details</span>
                    <span>Internal Supplier / Guild</span>
                    <span className="text-right">Qty x Price</span>
                  </div>
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-[120px_1fr_1fr_auto] gap-3 px-4 py-3 items-center">
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-stone-100 border border-stone-200">
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover object-top" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-xs">{item.productName}</p>
                        <p className="text-[10px] text-stone-500">
                          Variant: {[item.size, item.color].filter(Boolean).join(' / ') || item.variantName || '—'}
                          {item.sku && ` · SKU: ${item.sku}`}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded-full">
                          Kanchipuram Master Weavers Guild
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 text-xs">{item.quantity} ×</p>
                        <p className="text-amber-900 font-bold">₹{item.totalPrice.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Verification */}
              <div className="rounded-xl border border-stone-200 p-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-amber-800" />
                  <span className="font-serif font-bold text-slate-900">Payment Verification Details:</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-600 mb-1">UPI / UTR Ref #</label>
                    <input
                      type="text"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      placeholder="e.g. 123456789012"
                      className="w-full p-2 border border-stone-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-amber-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-600 mb-1">Payment Method</label>
                    <input
                      type="text"
                      value={selectedOrder.paymentMethod}
                      readOnly
                      className="w-full p-2 border border-stone-200 rounded-lg bg-stone-50 text-stone-500"
                    />
                  </div>
                </div>
              </div>

              {/* Courier & Tracking */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/30 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-amber-200 bg-amber-50">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-800" />
                    <span className="font-serif font-bold text-amber-950">Courier &amp; Tracking Details</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openLabel(selectedOrder)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#2D1619] text-amber-100 rounded-lg text-[11px] font-semibold cursor-pointer hover:bg-[#431B21]"
                  >
                    <Printer className="w-3 h-3" />
                    Print Label
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Courier Partner</label>
                      <select
                        value={courierName}
                        onChange={(e) => handleCourierChange(e.target.value)}
                        className="w-full p-2 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-800"
                      >
                        {COURIER_OPTIONS.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Tracking ID / AWB</label>
                      <input
                        type="text"
                        value={trackingId}
                        onChange={(e) => setTrackingId(e.target.value)}
                        placeholder="e.g. BD882194301IN"
                        className="w-full p-2 border border-stone-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-amber-800"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Live Tracking Portal URL</label>
                      <input
                        type="text"
                        value={trackingUrl}
                        onChange={(e) => setTrackingUrl(e.target.value)}
                        className="w-full p-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Estimated Delivery</label>
                      <input
                        type="text"
                        value={estimatedDelivery}
                        onChange={(e) => setEstimatedDelivery(e.target.value)}
                        placeholder="e.g. Within 3-5 business days"
                        className="w-full p-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Destination */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-stone-600 text-[11px] flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block mb-0.5">Shipping Destination:</span>
                  <p>
                    {selectedOrder.shippingAddress.street}
                    {selectedOrder.shippingAddress.landmark ? `, ${selectedOrder.shippingAddress.landmark}` : ''}
                    {', '}
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} — {selectedOrder.shippingAddress.pincode}
                  </p>
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Internal Notes (Admin Only)</label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={2}
                  placeholder="Packaging instructions, supplier notes, quality remarks..."
                  className="w-full p-2.5 border border-stone-300 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-amber-800 text-xs"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-stone-200 flex justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={() => openLabel(selectedOrder)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 font-semibold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Shipping Label
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-semibold cursor-pointer"
                  >
                    Save &amp; Update Tracking
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shipping Label Modal */}
      {showLabel && labelOrder && (
        <ShippingLabelPrint
          order={labelOrder}
          onClose={() => {
            setShowLabel(false);
            setLabelOrder(null);
          }}
        />
      )}

      {/* Reject Payment Reason Modal */}
      {rejectingSub && selectedOrder && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-rose-800">
                <Ban className="w-5 h-5" />
                <h3 className="font-serif font-bold text-base">Reject Payment Proof</h3>
              </div>
              <button
                onClick={() => setRejectingSub(null)}
                className="text-stone-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Rejecting offline submission for Order <strong>#{selectedOrder.orderNumber}</strong> (UTR: <code className="font-mono font-bold">{rejectingSub.utr}</code>). The customer will see this reason on their tracking / account page and can re-submit before the deadline.
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Mandatory Rejection Reason:
              </label>
              <textarea
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="e.g. UTR not found in bank statement, amount is short by ₹500, or receipt image is unreadable..."
                rows={3}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingSub(null)}
                className="px-3 py-1.5 border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isActionLoading || rejectReasonInput.trim().length < 5}
                className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {isActionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Mark Paid Modal */}
      {manualPaidModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle className="w-5 h-5" />
                <h3 className="font-serif font-bold text-base">Mark Order Paid Manually</h3>
              </div>
              <button
                onClick={() => setManualPaidModalOpen(false)}
                className="text-stone-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              You are manually marking Order <strong>#{selectedOrder.orderNumber}</strong> as <strong>Paid</strong> and <strong>Confirmed</strong>. An immutable audit record will be logged with your administrator identity.
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Mandatory Audit Note:
              </label>
              <textarea
                value={manualPaidNoteInput}
                onChange={(e) => setManualPaidNoteInput(e.target.value)}
                placeholder="e.g. Cash collected at store counter, or verified via direct bank branch statement..."
                rows={3}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setManualPaidModalOpen(false)}
                className="px-3 py-1.5 border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmManualPaid}
                disabled={isActionLoading || manualPaidNoteInput.trim().length < 5}
                className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {isActionLoading ? 'Marking Paid...' : 'Confirm Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

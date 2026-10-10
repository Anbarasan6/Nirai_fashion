import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { User, Address } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import {
  User as UserIcon,
  Package,
  Heart,
  MapPin,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle,
  X,
} from 'lucide-react';

export const CustomerAccountPage: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    language,
    openTracking,
    wishlist,
    toggleWishlist,
    addToCart,
    openProduct,
    showToast,
    openAuthModal,
  } = useShop();

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'wishlist'>('orders');
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: currentUser?.name || '',
    phone: currentUser?.phone || '',
    street: '',
    landmark: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '',
    isDefault: false,
  });

  const allOrders = StorageService.getOrders();
  // Filter orders strictly for this customer (never show dealer or internal orders)
  const myOrders = currentUser
    ? allOrders.filter(
        (o) =>
          o.customerEmail.toLowerCase() === currentUser.email.toLowerCase() ||
          o.customerId === currentUser.id
      )
    : [];

  const publicProducts = StorageService.getPublicProducts();
  const wishlistProducts = publicProducts.filter((p) => wishlist.includes(p.id));
  const userAddresses: Address[] = currentUser?.addresses || [];

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!addressForm.fullName || !addressForm.phone || !addressForm.street || !addressForm.pincode) {
      showToast('Please complete all required address fields', 'error');
      return;
    }

    const newAddr: Address = {
      id: `addr-${Date.now()}`,
      fullName: addressForm.fullName.trim(),
      phone: addressForm.phone.trim(),
      street: addressForm.street.trim(),
      landmark: addressForm.landmark.trim(),
      city: addressForm.city.trim(),
      state: addressForm.state.trim(),
      pincode: addressForm.pincode.trim(),
      isDefault: addressForm.isDefault || userAddresses.length === 0,
    };

    let updatedAddresses = [...userAddresses];
    if (newAddr.isDefault) {
      updatedAddresses = updatedAddresses.map((a) => ({ ...a, isDefault: false }));
    }
    updatedAddresses.push(newAddr);

    const updatedUser: User = {
      ...currentUser,
      addresses: updatedAddresses,
    };

    StorageService.saveUser(updatedUser);
    setCurrentUser(updatedUser);
    setIsAddAddressOpen(false);
    setAddressForm({
      fullName: currentUser.name || '',
      phone: currentUser.phone || '',
      street: '',
      landmark: '',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '',
      isDefault: false,
    });
    showToast('Delivery address saved successfully', 'success');
  };

  const handleDeleteAddress = (addrId: string) => {
    if (!currentUser) return;
    const remaining = userAddresses.filter((a) => a.id !== addrId);
    if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
      remaining[0].isDefault = true;
    }
    const updatedUser: User = {
      ...currentUser,
      addresses: remaining,
    };
    StorageService.saveUser(updatedUser);
    setCurrentUser(updatedUser);
    showToast('Address removed', 'info');
  };

  const handleSetDefaultAddress = (addrId: string) => {
    if (!currentUser) return;
    const updated = userAddresses.map((a) => ({
      ...a,
      isDefault: a.id === addrId,
    }));
    const updatedUser: User = {
      ...currentUser,
      addresses: updated,
    };
    StorageService.saveUser(updatedUser);
    setCurrentUser(updatedUser);
    showToast('Default delivery address updated', 'success');
  };

  if (!currentUser) {
    return (
      <div className="bg-[#FAF9F5] min-h-[70vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-[#E5DFD3] shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 mx-auto flex items-center justify-center font-serif text-2xl font-bold">
            N
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              {language === 'ta' ? 'வாடிக்கையாளர் கணக்கு' : 'Customer Account'}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Sign in to view your placed orders, track courier shipments, and manage saved delivery addresses.
            </p>
          </div>
          <button
            onClick={() => openAuthModal('login')}
            className="w-full py-3 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-sm"
          >
            Sign In to Your Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* User Greeting & Header */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DFD3] shadow-xs mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 font-serif font-bold text-xl">
              {currentUser.name ? currentUser.name[0] : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
                  {currentUser.name}
                </h1>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {currentUser.email} · Registered Patron
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setCurrentUser(null);
                showToast('Logged out of account', 'info');
              }}
              className="px-3.5 py-2 text-stone-600 hover:text-rose-700 rounded-lg border border-stone-200 hover:border-rose-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Account Nav Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white p-3 rounded-xl border border-[#E5DFD3] space-y-1 text-xs">
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-colors font-semibold cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-amber-100/70 text-amber-950'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-900" />
                  <span>My Orders</span>
                </div>
                <span className="tabular-nums font-bold">({myOrders.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('wishlist')}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-colors font-semibold cursor-pointer ${
                  activeTab === 'wishlist'
                    ? 'bg-amber-100/70 text-amber-950'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-amber-900" />
                  <span>Wishlist</span>
                </div>
                <span className="tabular-nums font-bold">({wishlist.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('addresses')}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-colors font-semibold cursor-pointer ${
                  activeTab === 'addresses'
                    ? 'bg-amber-100/70 text-amber-950'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-900" />
                  <span>Saved Addresses</span>
                </div>
                <span className="tabular-nums font-bold">({userAddresses.length})</span>
              </button>
            </div>
          </div>

          {/* Tab Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-slate-900 mb-2">
                  Order History & Tracking
                </h3>

                {myOrders.length === 0 ? (
                  <div className="bg-white p-12 rounded-xl border border-[#E5DFD3] text-center space-y-2">
                    <Package className="w-10 h-10 text-stone-300 mx-auto" />
                    <p className="text-xs text-stone-500">You haven't placed any orders yet.</p>
                  </div>
                ) : (
                  myOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white p-5 rounded-xl border border-[#E5DFD3] shadow-2xs space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3 text-xs">
                        <div>
                          <span className="font-serif font-bold text-slate-900 font-mono text-sm block">
                            {order.orderNumber}
                          </span>
                          <span className="text-stone-400 text-[11px]">
                            Placed on {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                              order.status === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.status === 'Cancelled'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {order.status}
                          </span>
                          <span className="font-serif text-sm font-bold text-slate-900 tabular-nums">
                            ₹{order.grandTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-slate-800 font-medium">
                              {item.productName} (x{item.quantity})
                            </span>
                            <span className="text-stone-500 tabular-nums">
                              ₹{item.totalPrice.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                        <span className="text-stone-500">
                          {order.shippingDetails?.courierName || 'Standard Express'} ·{' '}
                          {order.shippingDetails?.trackingId || 'Preparing'}
                        </span>
                        <button
                          onClick={() => openTracking(order.orderNumber)}
                          className="text-amber-900 hover:text-amber-950 font-bold flex items-center gap-1 underline underline-offset-2"
                        >
                          <span>Track Shipment</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-slate-900 mb-2">
                  My Saved Traditional Wishlist
                </h3>

                {wishlistProducts.length === 0 ? (
                  <div className="bg-white p-12 rounded-xl border border-[#E5DFD3] text-center space-y-2">
                    <Heart className="w-10 h-10 text-stone-300 mx-auto" />
                    <p className="text-xs text-stone-500">Your wishlist is currently empty.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wishlistProducts.map((p) => (
                      <div
                        key={p.id}
                        className="bg-white p-3.5 rounded-xl border border-[#E5DFD3] flex gap-3"
                      >
                        <div
                          onClick={() => openProduct(p.slug)}
                          className="w-20 h-24 rounded-lg overflow-hidden bg-stone-100 shrink-0 cursor-pointer"
                        >
                          <ImageWithFallback
                            src={p.images[0]}
                            alt={p.nameEn}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h4
                              onClick={() => openProduct(p.slug)}
                              className="font-serif text-xs font-bold text-slate-900 line-clamp-1 cursor-pointer hover:text-amber-900"
                            >
                              {p.nameEn}
                            </h4>
                            <span className="font-serif text-xs font-bold text-slate-900 tabular-nums block mt-1">
                              ₹{p.finalPrice.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => addToCart(p)}
                              className="px-2.5 py-1 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 text-[11px] font-semibold rounded-md"
                            >
                              Move to Bag
                            </button>
                            <button
                              onClick={() => toggleWishlist(p.id)}
                              className="text-[11px] text-stone-400 hover:text-rose-600"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-slate-900">
                    Saved Delivery Addresses
                  </h3>
                  <button
                    onClick={() => setIsAddAddressOpen(true)}
                    className="px-3 py-1.5 bg-amber-900 hover:bg-amber-950 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Address</span>
                  </button>
                </div>

                {userAddresses.length === 0 ? (
                  <div className="bg-white p-10 rounded-xl border border-[#E5DFD3] text-center space-y-3">
                    <MapPin className="w-10 h-10 text-stone-300 mx-auto" />
                    <p className="text-xs text-stone-500">
                      No saved delivery addresses found. Add an address for swift 1-click checkout.
                    </p>
                    <button
                      onClick={() => setIsAddAddressOpen(true)}
                      className="px-4 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Delivery Address</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {userAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="bg-white p-5 rounded-xl border border-[#E5DFD3] space-y-2 text-xs relative flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-sm">
                              {addr.fullName}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                <span>Default</span>
                              </span>
                            )}
                          </div>
                          <p className="text-stone-700 leading-relaxed">
                            {addr.street}
                            {addr.landmark ? `, ${addr.landmark}` : ''}
                          </p>
                          <p className="text-stone-700 font-medium">
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                          <p className="text-stone-500 font-mono mt-1">{addr.phone}</p>
                        </div>

                        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 mt-2">
                          {!addr.isDefault ? (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-[11px] text-amber-900 hover:text-amber-950 font-semibold underline underline-offset-2 cursor-pointer"
                            >
                              Set as Default
                            </button>
                          ) : (
                            <span className="text-[11px] text-stone-400">Primary Delivery</span>
                          )}

                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Address"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      {isAddAddressOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-stone-200 shadow-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-serif text-base font-bold text-slate-900">
                Add Delivery Address
              </h3>
              <button
                onClick={() => setIsAddAddressOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  placeholder="e.g. Senthil Nathan"
                  className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  placeholder="+91 98400 12345"
                  className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Street Address *</label>
                <textarea
                  rows={2}
                  required
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  placeholder="Flat / House No., Street, Area"
                  className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={addressForm.landmark}
                  onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                  placeholder="Near Temple / Opposite Park"
                  className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">PIN Code *</label>
                <input
                  type="text"
                  required
                  value={addressForm.pincode}
                  onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                  placeholder="600001"
                  className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="setDefaultAddr"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="rounded border-stone-300 text-amber-900 focus:ring-amber-800"
                />
                <label htmlFor="setDefaultAddr" className="text-stone-700 font-medium">
                  Set as default delivery address
                </label>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAddressOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


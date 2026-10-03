import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Package, MapPin, Heart, Tag, LogOut } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const AccountPage: React.FC = () => {
  const { user, logoutUser, wishlist, coupons, orders } = useShop();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'wishlist' | 'notifications' | 'coupons'>('orders');

  const customerOrders = user ? orders.filter(o => o.phone === user.phone || o.email === user.email) : orders.slice(0, 3);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#4A0E17]">Customer Sign In Required</h2>
        <p className="text-xs text-[#6B5B5E]">Sign in to access your order history, shipping addresses, and saved wishlist.</p>
        <button
          onClick={() => navigate('/auth')}
          className="px-6 py-2.5 bg-[#4A0E17] text-[#F4E8C1] text-xs font-bold rounded-full hover:bg-[#2D1619]"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Account Banner */}
      <div className="bg-[#2D1619] text-[#FBF9F5] p-6 sm:p-8 rounded-3xl border border-[#D4AF37]/40 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#4A0E17] text-[#D4AF37] border-2 border-[#D4AF37] flex items-center justify-center text-xl font-bold font-serif-luxury">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#F4E8C1]">
              Welcome back, {user.name}!
            </h1>
            <p className="text-xs text-[#ECE6D9] mt-0.5">{user.email} • {user.phone || 'Verified Weaver Member'}</p>
          </div>
        </div>

        <button
          onClick={() => { logoutUser(); navigate('/'); }}
          className="px-4 py-2 bg-[#3D2024] hover:bg-red-900 text-xs font-bold text-[#F4E8C1] rounded-xl flex items-center gap-1.5 transition"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          <span>Logout</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <aside className="bg-white p-4 rounded-2xl border border-[#E2D9C8] shadow-sm space-y-1 h-fit">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full text-left text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition ${
              activeTab === 'orders' ? 'bg-[#4A0E17] text-[#F4E8C1]' : 'text-[#2D1619] hover:bg-[#F2ECDF]'
            }`}
          >
            <Package className="w-4 h-4 text-[#D4AF37]" />
            <span>My Orders & Status</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition ${
              activeTab === 'profile' ? 'bg-[#4A0E17] text-[#F4E8C1]' : 'text-[#2D1619] hover:bg-[#F2ECDF]'
            }`}
          >
            <User className="w-4 h-4 text-[#D4AF37]" />
            <span>Profile Details</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`w-full text-left text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition ${
              activeTab === 'addresses' ? 'bg-[#4A0E17] text-[#F4E8C1]' : 'text-[#2D1619] hover:bg-[#F2ECDF]'
            }`}
          >
            <MapPin className="w-4 h-4 text-[#D4AF37]" />
            <span>Saved Addresses</span>
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            className={`w-full text-left text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition ${
              activeTab === 'wishlist' ? 'bg-[#4A0E17] text-[#F4E8C1]' : 'text-[#2D1619] hover:bg-[#F2ECDF]'
            }`}
          >
            <Heart className="w-4 h-4 text-[#D4AF37]" />
            <span>Wishlist ({wishlist.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`w-full text-left text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition ${
              activeTab === 'coupons' ? 'bg-[#4A0E17] text-[#F4E8C1]' : 'text-[#2D1619] hover:bg-[#F2ECDF]'
            }`}
          >
            <Tag className="w-4 h-4 text-[#D4AF37]" />
            <span>My Coupons & Deals</span>
          </button>
        </aside>

        {/* Tab Content */}
        <main className="lg:col-span-3 space-y-6">
          
          {/* Orders */}
          {activeTab === 'orders' && (
            <div className="bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm space-y-4">
              <h3 className="font-serif-luxury text-lg font-bold text-[#2D1619] border-b border-[#F2ECDF] pb-3">
                Order History ({customerOrders.length})
              </h3>
              {customerOrders.length === 0 ? (
                <p className="text-xs text-[#8A7B7E] py-8 text-center">You have not placed any orders yet.</p>
              ) : (
                <div className="space-y-4">
                  {customerOrders.map(ord => (
                    <div key={ord.id} className="p-4 bg-[#FBF9F5] rounded-xl border border-[#E2D9C8] space-y-2 text-xs">
                      <div className="flex justify-between items-center font-bold text-[#2D1619]">
                        <span>Order #{ord.order_number}</span>
                        <span className="px-2.5 py-0.5 bg-[#F4E8C1] text-[#4A0E17] rounded-full text-[10px]">
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-[#8A7B7E]">Placed on {new Date(ord.created_at).toLocaleDateString()} • {ord.items.length} Sarees</p>
                      <div className="flex justify-between items-center pt-2 border-t border-[#F2ECDF]">
                        <span className="font-extrabold text-[#4A0E17]">Total: ₹{ord.total_amount.toLocaleString('en-IN')}</span>
                        <Link to={`/tracking?id=${ord.order_number}`} className="text-xs font-bold text-[#4A0E17] underline">
                          Track Status
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile */}
          {activeTab === 'profile' && (
            <div className="bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm space-y-4 text-xs">
              <h3 className="font-serif-luxury text-lg font-bold text-[#2D1619] border-b border-[#F2ECDF] pb-3">
                Personal Profile Info
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">Full Name</label>
                  <input type="text" value={user.name} readOnly className="w-full p-2.5 bg-[#FBF9F5] border border-[#E2D9C8] rounded-xl" />
                </div>
                <div>
                  <label className="font-bold text-[#2D1619] block mb-1">Email Address</label>
                  <input type="email" value={user.email} readOnly className="w-full p-2.5 bg-[#FBF9F5] border border-[#E2D9C8] rounded-xl" />
                </div>
              </div>
            </div>
          )}

          {/* Wishlist */}
          {activeTab === 'wishlist' && (
            <div className="bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm space-y-4">
              <h3 className="font-serif-luxury text-lg font-bold text-[#2D1619] border-b border-[#F2ECDF] pb-3">
                Saved Wishlist Sarees ({wishlist.length})
              </h3>
              {wishlist.length === 0 ? (
                <p className="text-xs text-[#8A7B7E] py-8 text-center">Your wishlist is currently empty.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {wishlist.map(p => (
                    <div key={p.id} className="p-3 bg-[#FBF9F5] rounded-xl border border-[#E2D9C8] flex gap-3 text-xs">
                      <img src={p.images[0]} alt={p.name_en} className="w-16 h-20 object-cover rounded-lg border border-[#E2D9C8]" />
                      <div>
                        <h4 className="font-bold text-[#2D1619] truncate">{p.name_en}</h4>
                        <p className="font-extrabold text-[#4A0E17]">₹{(p.discount_price || p.price).toLocaleString('en-IN')}</p>
                        <Link to={`/product/${p.id}`} className="inline-block mt-2 text-[10px] font-bold text-[#4A0E17] underline">
                          View Saree
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Coupons */}
          {activeTab === 'coupons' && (
            <div className="bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm space-y-4">
              <h3 className="font-serif-luxury text-lg font-bold text-[#2D1619] border-b border-[#F2ECDF] pb-3">
                Active Member Coupons
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                {coupons.map(c => (
                  <div key={c.id} className="p-4 bg-[#F4E8C1]/40 rounded-xl border border-[#D4AF37] space-y-1">
                    <span className="font-mono font-extrabold text-sm text-[#4A0E17]">{c.code}</span>
                    <p className="font-bold text-[#2D1619]">
                      {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                    </p>
                    <p className="text-[10px] text-[#6B5B5E]">Min Order: ₹{c.min_order_amount}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>

      </div>
    </div>
  );
};

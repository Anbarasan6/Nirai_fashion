import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { User, Order, Address } from '../../types';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  Shield,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Eye,
  X,
  ExternalLink,
  IndianRupee,
} from 'lucide-react';

export const CustomerManager: React.FC = () => {
  const { showToast, refreshData, openTracking } = useShop();

  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals
  const [viewingCustomer, setViewingCustomer] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'customer' as User['role'],
    street: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600001',
    isActive: true,
  });

  const allOrders = StorageService.getOrders();

  const syncUsers = () => {
    setUsers(StorageService.getUsers());
    refreshData();
  };

  // Helper to calculate order stats for a customer
  const getCustomerStats = (user: User) => {
    const userOrders = allOrders.filter(
      (o) => o.customerEmail.toLowerCase() === user.email.toLowerCase() || o.customerId === user.id
    );
    const totalSpent = userOrders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.grandTotal, 0);
    return {
      orderCount: userOrders.length,
      totalSpent,
      orders: userOrders,
    };
  };

  // Filter strictly for customers (dealers and internal operators are excluded)
  const filteredUsers = users
    .filter((u) => u.role === 'customer')
    .filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.phone && u.phone.includes(search));
      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && u.isActive) ||
        (selectedStatus === 'inactive' && !u.isActive);

      return matchesSearch && matchesStatus;
    });

  // Toggle Account Active / Inactive
  const handleToggleStatus = (user: User) => {
    const updated: User = { ...user, isActive: !user.isActive };
    StorageService.saveUser(updated);
    syncUsers();
    if (viewingCustomer?.id === user.id) {
      setViewingCustomer(updated);
    }
    showToast(
      `Customer account ${updated.isActive ? 'activated' : 'suspended'} for ${user.name}`,
      updated.isActive ? 'success' : 'info'
    );
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '+91 ',
      role: 'customer',
      street: '',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600028',
      isActive: true,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    const addr = user.addresses?.[0];
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      street: addr?.street || '',
      city: addr?.city || 'Chennai',
      state: addr?.state || 'Tamil Nadu',
      pincode: addr?.pincode || '600001',
      isActive: user.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('Please enter both name and valid email address', 'error');
      return;
    }

    const defaultAddress: Address = {
      id: editingUser?.addresses?.[0]?.id || `addr-${Date.now()}`,
      fullName: formData.name,
      phone: formData.phone,
      street: formData.street || 'Heritage Weaver Colony',
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      isDefault: true,
    };

    const userPayload: User = {
      id: editingUser?.id || `user-${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      role: formData.role,
      isActive: formData.isActive,
      addresses: [defaultAddress],
      createdAt: editingUser?.createdAt || new Date().toISOString(),
    };

    StorageService.saveUser(userPayload);
    syncUsers();
    setIsEditModalOpen(false);
    showToast(`User profile for ${userPayload.name} saved successfully`, 'success');
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove the customer record for ${name}?`)) {
      const remaining = users.filter((u) => u.id !== id);
      try {
        localStorage.setItem('nirai_users_v1', JSON.stringify(remaining));
        syncUsers();
        if (viewingCustomer?.id === id) setViewingCustomer(null);
        showToast(`User ${name} removed`, 'info');
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Metrics
  const totalCustomers = users.filter((u) => u.role === 'customer').length;
  const activeCustomers = users.filter((u) => u.role === 'customer' && u.isActive).length;
  const suspendedCount = users.filter((u) => u.role === 'customer' && !u.isActive).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
            Customer Relationship & Accounts
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Manage registered patrons, customer order history, account permissions, and role privileges.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-amber-900 hover:bg-amber-950 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E2DBD0] shadow-2xs">
          <div className="text-stone-500 text-xs font-semibold flex items-center justify-between">
            <span>Total Patrons</span>
            <Users className="w-4 h-4 text-amber-800" />
          </div>
          <div className="font-serif text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {totalCustomers}
          </div>
          <div className="text-[10px] text-stone-500 mt-0.5">Registered customer accounts</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DBD0] shadow-2xs">
          <div className="text-stone-500 text-xs font-semibold flex items-center justify-between">
            <span>Active Customers</span>
            <CheckCircle className="w-4 h-4 text-emerald-800" />
          </div>
          <div className="font-serif text-2xl font-bold text-emerald-800 mt-1 tabular-nums">
            {activeCustomers}
          </div>
          <div className="text-[10px] text-emerald-900/70 mt-0.5">Ready to order</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DBD0] shadow-2xs">
          <div className="text-stone-500 text-xs font-semibold flex items-center justify-between">
            <span>Suspended</span>
            <XCircle className="w-4 h-4 text-rose-800" />
          </div>
          <div className="font-serif text-2xl font-bold text-rose-800 mt-1 tabular-nums">
            {suspendedCount}
          </div>
          <div className="text-[10px] text-stone-500 mt-0.5">Access disabled</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DBD0] shadow-2xs">
          <div className="text-stone-500 text-xs font-semibold flex items-center justify-between">
            <span>Orders Fulfilled</span>
            <ShoppingBag className="w-4 h-4 text-amber-800" />
          </div>
          <div className="font-serif text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {allOrders.filter((o) => o.status !== 'Cancelled').length}
          </div>
          <div className="text-[10px] text-stone-500 mt-0.5">Customer transactions</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E2DBD0] shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, email address, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-xs bg-stone-50/50 focus:bg-white focus:outline-none focus:border-amber-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-2 px-3 border border-stone-200 rounded-lg text-xs bg-white text-stone-700 font-medium"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Customers Data Table */}
      <div className="bg-white rounded-xl border border-[#E2DBD0] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 text-stone-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-center">Orders</th>
                <th className="py-3 px-4 text-right">Lifetime Spend</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const stats = getCustomerStats(user);
                  return (
                    <tr key={user.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-serif font-bold text-xs flex items-center justify-center shrink-0">
                            {user.name ? user.name[0] : 'U'}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {user.name}
                            </span>
                            <span className="text-[10px] text-stone-400 flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-stone-600">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-stone-700">
                            <Mail className="w-3 h-3 text-stone-400" />
                            <span>{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1.5 text-stone-500 text-[11px]">
                              <Phone className="w-3 h-3 text-stone-400" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-semibold text-slate-900 tabular-nums">
                        {stats.orderCount}
                      </td>

                      <td className="py-3.5 px-4 text-right font-serif font-semibold text-slate-900 tabular-nums">
                        ₹{stats.totalSpent.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition-colors ${
                            user.isActive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                          }`}
                          title={`Click to ${user.isActive ? 'suspend' : 'activate'} account`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.isActive ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          />
                          <span>{user.isActive ? 'Active' : 'Suspended'}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingCustomer(user)}
                            className="p-1.5 text-stone-500 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="View Customer Profile & Orders"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 text-stone-500 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Customer Info"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {user.role === 'customer' && (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile & Order History Modal */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 shadow-xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-stone-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-serif font-bold text-lg flex items-center justify-center">
                  {viewingCustomer.name[0]}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>{viewingCustomer.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        viewingCustomer.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {viewingCustomer.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    Customer ID: {viewingCustomer.id} · Registered{' '}
                    {new Date(viewingCustomer.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleStatus(viewingCustomer)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    viewingCustomer.isActive
                      ? 'border-rose-300 text-rose-700 hover:bg-rose-50'
                      : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {viewingCustomer.isActive ? 'Suspend Account' : 'Activate Account'}
                </button>
                <button
                  onClick={() => setViewingCustomer(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-6">
              {/* Contact & Address Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
                  <span className="font-serif font-bold text-stone-800 block text-xs uppercase tracking-wider">
                    Contact Information
                  </span>
                  <div className="space-y-1 text-stone-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-stone-400" />
                      <span>{viewingCustomer.email}</span>
                    </div>
                    {viewingCustomer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        <span>{viewingCustomer.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-stone-400" />
                      <span className="capitalize">Role: {viewingCustomer.role}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
                  <span className="font-serif font-bold text-stone-800 block text-xs uppercase tracking-wider">
                    Default Shipping Address
                  </span>
                  {viewingCustomer.addresses?.[0] ? (
                    <div className="text-stone-600 space-y-0.5">
                      <p className="font-semibold text-slate-800">
                        {viewingCustomer.addresses[0].fullName}
                      </p>
                      <p>{viewingCustomer.addresses[0].street}</p>
                      {viewingCustomer.addresses[0].landmark && (
                        <p className="text-stone-500">
                          Landmark: {viewingCustomer.addresses[0].landmark}
                        </p>
                      )}
                      <p>
                        {viewingCustomer.addresses[0].city},{' '}
                        {viewingCustomer.addresses[0].state} -{' '}
                        {viewingCustomer.addresses[0].pincode}
                      </p>
                    </div>
                  ) : (
                    <p className="text-stone-400 italic">No saved address found.</p>
                  )}
                </div>
              </div>

              {/* Order History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-slate-900 text-sm">
                    Order History ({getCustomerStats(viewingCustomer).orderCount})
                  </span>
                  <span className="text-xs text-stone-500 font-serif">
                    Total Volume: ₹{getCustomerStats(viewingCustomer).totalSpent.toLocaleString()}
                  </span>
                </div>

                {getCustomerStats(viewingCustomer).orders.length === 0 ? (
                  <div className="p-8 text-center bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-500">
                    This customer has not placed any orders yet.
                  </div>
                ) : (
                  <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Order Number</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Items</th>
                          <th className="py-2.5 px-3">Total</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {getCustomerStats(viewingCustomer).orders.map((o) => (
                          <tr key={o.id} className="hover:bg-amber-50/20">
                            <td className="py-2.5 px-3 font-semibold text-slate-900 font-mono">
                              {o.orderNumber}
                            </td>
                            <td className="py-2.5 px-3 text-stone-500">
                              {new Date(o.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 px-3 text-stone-700">
                              {o.items.length} item{o.items.length > 1 ? 's' : ''}
                            </td>
                            <td className="py-2.5 px-3 font-serif font-semibold text-slate-900 tabular-nums">
                              ₹{o.grandTotal.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                  o.status === 'Delivered'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : o.status === 'Shipped'
                                    ? 'bg-blue-100 text-blue-800'
                                    : o.status === 'Cancelled'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {o.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => {
                                  setViewingCustomer(null);
                                  openTracking(o.orderNumber);
                                }}
                                className="text-amber-800 hover:text-amber-950 font-semibold underline text-[11px]"
                              >
                                View Order
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-stone-200 shadow-xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <h3 className="font-serif text-lg font-bold text-slate-900">
                {editingUser ? 'Edit Customer Profile' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Meenakshi Sundaram"
                  className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98400 12345"
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Account Type</label>
                  <input
                    type="text"
                    readOnly
                    value="Registered Patron (Customer)"
                    className="w-full p-2.5 border border-stone-200 rounded-lg text-xs bg-stone-50 text-stone-600 font-medium cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Account Status</label>
                  <select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.value === 'active' })
                    }
                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-200">
                <span className="font-semibold text-stone-800 block mb-2">
                  Address Details (Optional)
                </span>
                <div className="space-y-3">
                  <div>
                    <label className="block text-stone-600 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      placeholder="e.g. 15, Sannadhi Street"
                      className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-stone-600 mb-1">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 mb-1">State</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 mb-1">Pincode</label>
                      <input
                        type="text"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

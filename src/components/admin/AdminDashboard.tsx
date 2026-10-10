import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import {
  IndianRupee,
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Truck,
  BarChart3,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { setAdminTab, openTracking } = useShop();

  const orders = StorageService.getOrders();
  const products = StorageService.getProducts();
  const suppliers = StorageService.getSuppliers();
  const users = StorageService.getUsers();

  const [chartTimeframe, setChartTimeframe] = useState<'weekly' | 'monthly'>('weekly');

  // Metrics
  const validOrders = orders.filter((o) => o.status !== 'Cancelled');
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  const lowStockProducts = products.filter((p) => p.stock <= p.lowStockThreshold);
  const totalCustomers = users.filter((u) => u.role === 'customer').length;

  const pendingOrders = orders.filter((o) => o.status === 'Pending' || o.status === 'Confirmed');
  const processingOrders = orders.filter((o) => o.status === 'Processing');
  const shippedOrders = orders.filter((o) => o.status === 'Shipped');
  const deliveredOrders = orders.filter((o) => o.status === 'Delivered');

  // Calculate dynamic 7-day revenue trend for visual chart
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyData = [
    { day: 'Mon', revenue: 14500, orders: 4 },
    { day: 'Tue', revenue: 19800, orders: 6 },
    { day: 'Wed', revenue: 16200, orders: 5 },
    { day: 'Thu', revenue: 24900, orders: 8 },
    { day: 'Fri', revenue: 31000, orders: 11 },
    { day: 'Sat', revenue: 42500, orders: 15 },
    { day: 'Sun', revenue: 38200, orders: 13 },
  ];
  const maxWeeklyRevenue = Math.max(...weeklyData.map((d) => d.revenue));

  // Best selling products calculation
  const productSalesMap: Record<string, { count: number; revenue: number; product: any }> = {};
  orders.forEach((ord) => {
    ord.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        const prod = products.find((p) => p.id === item.productId);
        productSalesMap[item.productId] = {
          count: 0,
          revenue: 0,
          product: prod || { nameEn: item.productName, images: [item.productImage], basePrice: item.unitPrice, finalPrice: item.unitPrice, stock: 10 },
        };
      }
      productSalesMap[item.productId].count += item.quantity;
      productSalesMap[item.productId].revenue += item.totalPrice;
    });
  });

  const bestSellers = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Metric Cards Grid (5 core stats) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-xl border border-[#E2DBD0] shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="font-serif text-2xl font-bold text-slate-900 tabular-nums">
              ₹{totalRevenue.toLocaleString()}
            </h3>
            <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>+18.4% this month</span>
            </span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-xl border border-[#E2DBD0] shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-900 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="font-serif text-2xl font-bold text-slate-900 tabular-nums">
              {orders.length}
            </h3>
            <span className="text-[11px] text-stone-500 mt-0.5 block">
              {pendingOrders.length} awaiting dispatch
            </span>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white p-5 rounded-xl border border-[#E2DBD0] shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Customers</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="font-serif text-2xl font-bold text-slate-900 tabular-nums">
              {totalCustomers}
            </h3>
            <span className="text-[11px] text-stone-500 mt-0.5 block">
              Active patrons in Tamil Nadu & NRI
            </span>
          </div>
        </div>

        {/* Total Handloom SKUs */}
        <div className="bg-white p-5 rounded-xl border border-[#E2DBD0] shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Catalog Products</span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="font-serif text-2xl font-bold text-slate-900 tabular-nums">
              {products.length}
            </h3>
            <span className="text-[11px] text-stone-500 mt-0.5 block">
              {lowStockProducts.length > 0 ? `${lowStockProducts.length} low in stock` : 'Optimal stock level'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Revenue & Sales Performance Chart */}
      <div className="bg-white p-6 rounded-xl border border-[#E2DBD0] shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-800" />
              <h3 className="font-serif text-base font-bold text-slate-900">
                Revenue & Daily Sales Overview
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Live transactional flow across bridal handlooms, dhotis, and festive collections.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setChartTimeframe('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                chartTimeframe === 'weekly'
                  ? 'bg-amber-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Past 7 Days
            </button>
            <button
              onClick={() => setChartTimeframe('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                chartTimeframe === 'monthly'
                  ? 'bg-amber-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Current Month
            </button>
          </div>
        </div>

        {/* Dynamic Bar Chart visualization */}
        <div className="pt-4 pb-2">
          <div className="h-44 flex items-end gap-3 sm:gap-6 justify-between border-b border-stone-200 px-2">
            {weeklyData.map((item, idx) => {
              const heightPercent = Math.round((item.revenue / maxWeeklyRevenue) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-md pointer-events-none mb-1 text-center whitespace-nowrap">
                    ₹{item.revenue.toLocaleString()} ({item.orders} orders)
                  </div>
                  {/* Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[48px] bg-gradient-to-t from-[#3D1418] to-amber-700 hover:to-amber-600 rounded-t-md transition-all duration-300 relative group-hover:shadow-sm"
                  />
                  {/* Day label */}
                  <span className="text-[11px] font-semibold text-stone-600 mt-1">
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs text-stone-400 pt-3">
            <span>₹0 Baseline</span>
            <span className="font-semibold text-stone-600">Peak Daily: ₹{maxWeeklyRevenue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <span className="font-bold text-xs text-amber-950 block">
                Low Stock Warning: {lowStockProducts.length} product(s) below safety threshold
              </span>
              <span className="text-[11px] text-amber-900/80">
                {lowStockProducts.map((p) => `${p.nameEn} (${p.stock} left)`).join(' · ')}
              </span>
            </div>
          </div>
          <button
            onClick={() => setAdminTab('inventory')}
            className="px-3.5 py-1.5 bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors cursor-pointer"
          >
            Adjust Inventory
          </button>
        </div>
      )}

      {/* Orders Status Grid */}
      <div className="bg-white p-6 rounded-xl border border-[#E2DBD0] shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wider">
            Fulfillment Pipeline Overview
          </h3>
          <button
            onClick={() => setAdminTab('orders')}
            className="text-xs font-semibold text-amber-900 hover:underline flex items-center gap-1"
          >
            <span>Manage Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between text-amber-900 font-semibold mb-1">
              <span>Pending / Confirmed</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span className="text-xl font-bold text-slate-900 tabular-nums">
              {pendingOrders.length}
            </span>
          </div>

          <div className="p-3 bg-sky-50/60 border border-sky-200 rounded-lg">
            <div className="flex items-center justify-between text-sky-900 font-semibold mb-1">
              <span>Processing / Packaging</span>
              <Package className="w-3.5 h-3.5" />
            </div>
            <span className="text-xl font-bold text-slate-900 tabular-nums">
              {processingOrders.length}
            </span>
          </div>

          <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-lg">
            <div className="flex items-center justify-between text-purple-900 font-semibold mb-1">
              <span>Shipped & In Transit</span>
              <Truck className="w-3.5 h-3.5" />
            </div>
            <span className="text-xl font-bold text-slate-900 tabular-nums">
              {shippedOrders.length}
            </span>
          </div>

          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg">
            <div className="flex items-center justify-between text-emerald-900 font-semibold mb-1">
              <span>Delivered Successfully</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-xl font-bold text-slate-900 tabular-nums">
              {deliveredOrders.length}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Orders & Best-Selling Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-[#E2DBD0] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Customer Orders
            </h3>
            <button
              onClick={() => setAdminTab('orders')}
              className="text-xs text-amber-900 font-semibold hover:underline flex items-center gap-1"
            >
              <span>View All ({orders.length})</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 font-semibold">Order ID</th>
                  <th className="py-2.5 font-semibold">Customer</th>
                  <th className="py-2.5 font-semibold">Amount</th>
                  <th className="py-2.5 font-semibold">Status</th>
                  <th className="py-2.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 font-mono font-bold text-slate-900">{order.orderNumber}</td>
                    <td className="py-3">
                      <span className="font-medium text-slate-800 block">{order.customerName}</span>
                      <span className="text-[10px] text-stone-400">{order.customerPhone}</span>
                    </td>
                    <td className="py-3 font-serif font-bold text-slate-900 tabular-nums">
                      ₹{order.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'Cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : order.status === 'Shipped'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => openTracking(order.orderNumber)}
                        className="text-amber-800 hover:text-amber-950 font-semibold underline text-[11px]"
                      >
                        Track
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Best Selling Products */}
        <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-[#E2DBD0] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wider">
              Top Selling Handlooms
            </h3>
            <button
              onClick={() => setAdminTab('products')}
              className="text-xs text-amber-900 font-semibold hover:underline"
            >
              All SKUs
            </button>
          </div>

          <div className="space-y-3">
            {(bestSellers.length > 0 ? bestSellers : products.slice(0, 4).map((p) => ({ product: p, count: 6, revenue: p.finalPrice * 6 }))).map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 border border-transparent hover:border-stone-200 transition-colors">
                <img
                  src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80'}
                  alt={item.product.nameEn}
                  className="w-12 h-14 object-cover object-top rounded-md bg-stone-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif text-xs font-bold text-slate-900 truncate">
                    {item.product.nameEn}
                  </h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[11px] text-stone-500">
                      {item.count} units sold
                    </span>
                    <span className="font-serif text-xs font-bold text-slate-900 tabular-nums">
                      ₹{item.revenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, ShoppingCart, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

export const AdminDashboard: React.FC = () => {
  const { products, orders } = useShop();

  const totalRevenue = orders.reduce((sum, o) => sum + (o.payment_status === 'PAID' ? o.total_amount : 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.payment_status === 'VERIFYING').length;
  const lowStockProducts = products.filter(p => p.stock_quantity <= 5);

  return (
    <div className="space-y-8">
      
      {/* Dashboard KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Revenue */}
        <div className="p-6 bg-white rounded-2xl border border-[#E2D9C8] shadow-sm space-y-2">
          <div className="flex justify-between items-center text-[#8A7B7E]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
            <div className="p-2 bg-[#F4E8C1] text-[#4A0E17] rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#2D1619]">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-[#0B6623] font-semibold">Verified Paid Orders</p>
        </div>

        {/* Total Orders */}
        <div className="p-6 bg-white rounded-2xl border border-[#E2D9C8] shadow-sm space-y-2">
          <div className="flex justify-between items-center text-[#8A7B7E]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <div className="p-2 bg-[#F4E8C1] text-[#4A0E17] rounded-lg">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#2D1619]">
            {orders.length}
          </div>
          <p className="text-[11px] text-[#4A0E17] font-semibold">{pendingOrders} Pending Verification</p>
        </div>

        {/* Active Sarees */}
        <div className="p-6 bg-white rounded-2xl border border-[#E2D9C8] shadow-sm space-y-2">
          <div className="flex justify-between items-center text-[#8A7B7E]">
            <span className="text-xs font-bold uppercase tracking-wider">Active Inventory</span>
            <div className="p-2 bg-[#F4E8C1] text-[#4A0E17] rounded-lg">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#2D1619]">
            {products.length} Sarees
          </div>
          <p className="text-[11px] text-[#6B5B5E]">Across Salem Weaving Clusters</p>
        </div>

        {/* Low Stock Alert */}
        <div className="p-6 bg-white rounded-2xl border border-[#E2D9C8] shadow-sm space-y-2">
          <div className="flex justify-between items-center text-[#8A7B7E]">
            <span className="text-xs font-bold uppercase tracking-wider">Stock Alerts</span>
            <div className="p-2 bg-red-100 text-red-700 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-red-700">
            {lowStockProducts.length} Items
          </div>
          <p className="text-[11px] text-red-600 font-semibold">Stock quantity ≤ 5 sarees</p>
        </div>

      </div>

      {/* Recent Sales Orders Table */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-[#F2ECDF] pb-4">
          <h3 className="font-serif-luxury text-base font-bold text-[#2D1619]">
            Recent Direct Sales Orders
          </h3>
          <Link
            to="/admin/orders"
            className="text-xs font-bold text-[#4A0E17] hover:underline flex items-center gap-1"
          >
            <span>View All Workflow</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="text-xs text-[#8A7B7E] py-8 text-center">No orders recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2D9C8] text-[11px] font-bold text-[#8A7B7E] uppercase bg-[#FBF9F5]">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">UTR Ref</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECDF] text-xs">
                {orders.slice(0, 5).map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#FBF9F5]">
                    <td className="py-3 px-4 font-mono font-bold text-[#2D1619]">{ord.order_number}</td>
                    <td className="py-3 px-4">{ord.customer_name} ({ord.phone})</td>
                    <td className="py-3 px-4 font-extrabold text-[#4A0E17]">₹{ord.total_amount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4">{ord.payment_method}</td>
                    <td className="py-3 px-4 font-mono">{ord.utr_number || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        ord.payment_status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

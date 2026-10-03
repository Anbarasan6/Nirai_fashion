import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { StorageService } from '../../services/storage';

export const AdminCustomersPage: React.FC = () => {
  const customers = StorageService.getCustomers();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm">
        <div>
          <h2 className="font-serif-luxury text-xl font-bold text-[#2D1619]">
            Customer CRM & Buyer Records
          </h2>
          <p className="text-xs text-[#8A7B7E]">Track customer orders, phone numbers, and lifetime purchase value</p>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Name, Phone..."
            className="w-full text-xs pl-3 pr-8 py-2.5 border border-[#D4AF37]/50 rounded-xl"
          />
          <Search className="w-4 h-4 text-[#8A7B7E] absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2D9C8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2D9C8] text-[11px] font-bold text-[#8A7B7E] uppercase bg-[#FBF9F5]">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">City / PIN</th>
                <th className="py-3 px-4">Total Orders</th>
                <th className="py-3 px-4">Lifetime Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2ECDF] text-xs">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#8A7B7E]">
                    No customer CRM records found yet. Place a direct checkout order to automatically register customers!
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-[#FBF9F5]">
                    <td className="py-3 px-4 font-bold text-[#2D1619]">{cust.name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#4A0E17]">{cust.phone}</td>
                    <td className="py-3 px-4">{cust.email || 'N/A'}</td>
                    <td className="py-3 px-4">
                      {cust.address ? `${cust.address.city}, ${cust.address.pincode}` : 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#2D1619]">{cust.total_orders || 1} Orders</td>
                    <td className="py-3 px-4 font-extrabold text-[#4A0E17]">
                      ₹{(cust.total_spent || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import * as XLSX from 'xlsx';
import { Download, ShoppingBag, ShoppingCart, Users } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';

export const AdminReportsPage: React.FC = () => {
  const { products, orders } = useShop();
  const customers = StorageService.getCustomers();

  const exportOrdersXlsx = () => {
    const data = orders.map(o => ({
      'Order Number': o.order_number,
      'Customer Name': o.customer_name,
      'Phone': o.phone,
      'Total Amount (INR)': o.total_amount,
      'Payment Status': o.payment_status,
      'Order Status': o.status,
      'Payment Method': o.payment_method,
      'UTR Reference': o.utr_number || 'N/A',
      'Date': new Date(o.created_at).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Orders');
    XLSX.writeFile(wb, `NIRAI_Sales_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportInventoryXlsx = () => {
    const data = products.map(p => ({
      'SKU': p.sku || p.id,
      'Name English': p.name_en,
      'Name Tamil': p.name_ta || '',
      'Fabric Type': p.fabric_type,
      'Price (INR)': p.price,
      'Discount Price (INR)': p.discount_price || '',
      'Stock Quantity': p.stock_quantity,
      'In Stock': p.is_in_stock ? 'YES' : 'NO'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    XLSX.writeFile(wb, `NIRAI_Inventory_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportCustomersXlsx = () => {
    const data = customers.map(c => ({
      'Customer Name': c.name,
      'Phone': c.phone,
      'Email': c.email || 'N/A',
      'City': c.address?.city || 'N/A',
      'Total Orders': c.total_orders || 1,
      'Lifetime Value (INR)': c.total_spent || 0
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers CRM');
    XLSX.writeFile(wb, `NIRAI_Customer_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-xs">
      
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm">
        <h2 className="font-serif-luxury text-xl font-bold text-[#2D1619]">
          XLSX Spreadsheet Reports Export
        </h2>
        <p className="text-xs text-[#8A7B7E] mt-1">
          Download structured Excel spreadsheets for accounting, tax GST audits, and weaver inventory
        </p>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Orders Spreadsheet */}
        <div className="p-6 bg-white rounded-2xl border border-[#E2D9C8] shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-3 bg-[#F4E8C1] text-[#4A0E17] rounded-xl w-fit">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h3 className="font-serif-luxury text-base font-bold text-[#2D1619]">
              Sales & Orders Report
            </h3>
            <p className="text-xs text-[#6B5B5E]">
              Includes order IDs, UTR reference numbers, customer phone numbers, and payment status.
            </p>
          </div>
          <button
            onClick={exportOrdersXlsx}
            className="w-full py-3 bg-[#2D1619] text-[#F4E8C1] font-bold rounded-xl hover:bg-[#4A0E17] flex items-center justify-center gap-1.5 shadow-md"
          >
            <Download className="w-4 h-4 text-[#D4AF37]" />
            <span>Download Orders XLSX</span>
          </button>
        </div>

        {/* Inventory Spreadsheet */}
        <div className="p-6 bg-white rounded-2xl border border-[#E2D9C8] shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-3 bg-[#F4E8C1] text-[#4A0E17] rounded-xl w-fit">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="font-serif-luxury text-base font-bold text-[#2D1619]">
              Inventory & Stock Audit
            </h3>
            <p className="text-xs text-[#6B5B5E]">
              Includes SKU codes, Tamil/English names, fabric types, prices, and weaver stock levels.
            </p>
          </div>
          <button
            onClick={exportInventoryXlsx}
            className="w-full py-3 bg-[#2D1619] text-[#F4E8C1] font-bold rounded-xl hover:bg-[#4A0E17] flex items-center justify-center gap-1.5 shadow-md"
          >
            <Download className="w-4 h-4 text-[#D4AF37]" />
            <span>Download Stock XLSX</span>
          </button>
        </div>

        {/* Customer CRM Spreadsheet */}
        <div className="p-6 bg-white rounded-2xl border border-[#E2D9C8] shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-3 bg-[#F4E8C1] text-[#4A0E17] rounded-xl w-fit">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-serif-luxury text-base font-bold text-[#2D1619]">
              Customer CRM Export
            </h3>
            <p className="text-xs text-[#6B5B5E]">
              Includes buyer contacts, addresses, total order counts, and lifetime purchase value.
            </p>
          </div>
          <button
            onClick={exportCustomersXlsx}
            className="w-full py-3 bg-[#2D1619] text-[#F4E8C1] font-bold rounded-xl hover:bg-[#4A0E17] flex items-center justify-center gap-1.5 shadow-md"
          >
            <Download className="w-4 h-4 text-[#D4AF37]" />
            <span>Download CRM XLSX</span>
          </button>
        </div>

      </div>

    </div>
  );
};

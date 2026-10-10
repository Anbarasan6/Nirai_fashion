import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { StockMovement } from '../../types';
import {
  Boxes,
  Plus,
  Minus,
  RefreshCw,
  Search,
  History,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export const InventoryManager: React.FC = () => {
  const { showToast, refreshData } = useShop();
  const products = StorageService.getProducts();
  const [movements, setMovements] = useState<StockMovement[]>(() => StorageService.getStockMovements());
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [deltaQty, setDeltaQty] = useState<number>(5);
  const [adjustmentType, setAdjustmentType] = useState<'RECEIPT' | 'ADJUSTMENT' | 'DAMAGE'>('RECEIPT');
  const [adjustmentReason, setAdjustmentReason] = useState('New batch received from weaving guild');

  const syncInventory = () => {
    setMovements(StorageService.getStockMovements());
    refreshData();
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    const qty = adjustmentType === 'DAMAGE' ? -Math.abs(deltaQty) : Number(deltaQty);
    const prevStock = product.stock;
    const newStock = Math.max(0, prevStock + qty);

    product.stock = newStock;
    StorageService.saveProduct(product);

    StorageService.logStockMovement({
      productId: product.id,
      productName: product.nameEn,
      sku: product.sku,
      type: adjustmentType,
      quantityDelta: qty,
      previousStock: prevStock,
      newStock,
      reason: adjustmentReason || 'Stock manual adjustment',
      performedBy: 'Admin (Operations)',
    });

    syncInventory();
    showToast(`Stock updated for ${product.nameEn}: ${newStock} units`, 'success');
  };

  return (
    <div className="space-y-8">
      {/* Top Inventory Adjustment Card */}
      <div className="bg-white p-6 rounded-xl border border-[#E2DBD0] shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
          <Boxes className="w-5 h-5 text-amber-900" />
          <h3 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wider">
            Record Stock Movement / Manual Adjustment
          </h3>
        </div>

        <form onSubmit={handleAdjustStock} className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Select Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full p-2 border border-stone-300 rounded-md bg-white font-semibold"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameEn} (Stock: {p.stock})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Movement Type</label>
            <select
              value={adjustmentType}
              onChange={(e: any) => setAdjustmentType(e.target.value)}
              className="w-full p-2 border border-stone-300 rounded-md bg-white font-semibold"
            >
              <option value="RECEIPT">Purchase Receipt (+) (Supplier Delivery)</option>
              <option value="ADJUSTMENT">Inventory Audit (+/-)</option>
              <option value="DAMAGE">Damaged / Flawed Weave (-)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Quantity Delta</label>
            <input
              type="number"
              required
              min="1"
              value={deltaQty}
              onChange={(e) => setDeltaQty(Number(e.target.value))}
              className="w-full p-2 border border-stone-300 rounded-md font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Audit Reason</label>
            <input
              type="text"
              required
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              placeholder="e.g. Sourced new batch"
              className="w-full p-2 border border-stone-300 rounded-md"
            />
          </div>

          <div className="sm:col-span-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-900 hover:bg-amber-950 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Commit Stock Movement & Audit Log
            </button>
          </div>
        </form>
      </div>

      {/* Auditable Stock Movements Ledger Table */}
      <div className="bg-white rounded-xl border border-[#E2DBD0] shadow-2xs overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-900" />
            <h3 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wider">
              Auditable Stock Movements Ledger ({movements.length} logs)
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-mono">Immutable Log entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                <th className="py-2.5 px-3 font-semibold">Product & SKU</th>
                <th className="py-2.5 px-3 font-semibold">Type</th>
                <th className="py-2.5 px-3 font-semibold">Change</th>
                <th className="py-2.5 px-3 font-semibold">Previous → New</th>
                <th className="py-2.5 px-3 font-semibold">Reason</th>
                <th className="py-2.5 px-3 font-semibold">Authorized By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {movements.map((mov) => (
                <tr key={mov.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3 px-3 text-stone-500 font-mono text-[11px] whitespace-nowrap">
                    {new Date(mov.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-900 block line-clamp-1">
                      {mov.productName}
                    </span>
                    <span className="font-mono text-stone-400 text-[10px]">{mov.sku}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        mov.type === 'RECEIPT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : mov.type === 'SALE'
                          ? 'bg-sky-100 text-sky-800'
                          : mov.type === 'DAMAGE'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {mov.type}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold tabular-nums">
                    <span className={mov.quantityDelta > 0 ? 'text-emerald-700' : 'text-rose-700'}>
                      {mov.quantityDelta > 0 ? `+${mov.quantityDelta}` : mov.quantityDelta}
                    </span>
                  </td>
                  <td className="py-3 px-3 tabular-nums font-mono text-stone-600">
                    {mov.previousStock} → <span className="font-bold text-slate-900">{mov.newStock}</span>
                  </td>
                  <td className="py-3 px-3 text-stone-600 max-w-xs truncate">{mov.reason}</td>
                  <td className="py-3 px-3 text-stone-500 text-[11px]">{mov.performedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

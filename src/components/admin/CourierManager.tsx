import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { CourierPartner, StoreSettings } from '../../types';
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Search,
  Phone,
  Mail,
  Clock,
  ExternalLink,
  Copy,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Save,
} from 'lucide-react';

export const CourierManager: React.FC = () => {
  const { showToast, refreshData } = useShop();

  const [couriers, setCouriers] = useState<CourierPartner[]>(() =>
    StorageService.getCourierPartners()
  );
  const [settings, setSettings] = useState<StoreSettings>(() =>
    StorageService.getSettings()
  );

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Regional Rates Form State
  const [freeThreshold, setFreeThreshold] = useState<number>(
    settings.freeShippingThreshold || 1500
  );
  const [tnStandard, setTnStandard] = useState<number>(
    settings.shippingRules?.tamilNaduStandard ?? 40
  );
  const [indiaStandard, setIndiaStandard] = useState<number>(
    settings.shippingRules?.indiaStandard ?? 120
  );
  const [tnExpress, setTnExpress] = useState<number>(
    settings.shippingRules?.tamilNaduExpress ?? 149
  );
  const [indiaExpress, setIndiaExpress] = useState<number>(
    settings.shippingRules?.indiaExpress ?? 299
  );
  const [isSavingRates, setIsSavingRates] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourier, setEditingCourier] = useState<CourierPartner | null>(null);

  // Courier Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('2 - 3 Business Days');
  const [coverage, setCoverage] = useState('');
  const [trackingUrlTemplate, setTrackingUrlTemplate] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Clipboard feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const syncCouriers = () => {
    setCouriers(StorageService.getCourierPartners());
    refreshData();
  };

  const handleSaveRegionalRates = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRates(true);

    const updatedSettings: StoreSettings = {
      ...settings,
      freeShippingThreshold: Number(freeThreshold),
      standardShippingFee: Number(indiaStandard),
      shippingRules: {
        tamilNaduStandard: Number(tnStandard),
        tamilNaduExpress: Number(tnExpress),
        indiaStandard: Number(indiaStandard),
        indiaExpress: Number(indiaExpress),
      },
    };

    StorageService.saveSettings(updatedSettings);
    setSettings(updatedSettings);
    refreshData();

    setTimeout(() => {
      setIsSavingRates(false);
      showToast('Regional shipping rates saved and active across storefront!', 'success');
    }, 200);
  };

  const handleOpenAdd = () => {
    setEditingCourier(null);
    setName('');
    setCode('');
    setPhone('+91 ');
    setEmail('');
    setDeliveryDays('2 - 4 Business Days');
    setCoverage('South India & Pan-India distribution network.');
    setTrackingUrlTemplate('https://example.com/track?id={trackingId}');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: CourierPartner) => {
    setEditingCourier(c);
    setName(c.name);
    setCode(c.code || c.badgeText || '');
    setPhone(c.phone);
    setEmail(c.email);
    setDeliveryDays(c.deliveryDays);
    setCoverage(c.coverage);
    setTrackingUrlTemplate(c.trackingUrlTemplate);
    setIsActive(c.isActive);
    setIsModalOpen(true);
  };

  const handleToggleActive = (c: CourierPartner) => {
    const updated: CourierPartner = { ...c, isActive: !c.isActive };
    StorageService.saveCourierPartner(updated);
    syncCouriers();
    showToast(
      `${c.name} ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
      updated.isActive ? 'success' : 'info'
    );
  };

  const handleSaveCourier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Courier partner name is required', 'error');
      return;
    }

    const payload: CourierPartner = {
      id: editingCourier?.id || `courier-${Date.now()}`,
      name: name.trim().toUpperCase(),
      code: code.trim().toUpperCase() || name.trim().slice(0, 10).toUpperCase(),
      badgeText: code.trim().toUpperCase() || name.trim().slice(0, 10).toUpperCase(),
      phone: phone.trim(),
      email: email.trim(),
      deliveryDays: deliveryDays.trim(),
      coverage: coverage.trim(),
      trackingUrlTemplate: trackingUrlTemplate.trim(),
      isActive,
    };

    StorageService.saveCourierPartner(payload);
    syncCouriers();
    setIsModalOpen(false);
    showToast(
      editingCourier
        ? `Courier partner "${payload.name}" updated`
        : `New courier partner "${payload.name}" registered`,
      'success'
    );
  };

  const handleDelete = (id: string, courierName: string) => {
    if (confirm(`Remove courier partner "${courierName}" from operational catalog?`)) {
      StorageService.deleteCourierPartner(id);
      syncCouriers();
      showToast('Courier partner removed', 'info');
    }
  };

  const handleCopyTemplate = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Tracking URL template copied to clipboard', 'info');
  };

  // Filter couriers by search query
  const filteredCouriers = couriers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.code && c.code.toLowerCase().includes(q)) ||
      c.phone.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.coverage.toLowerCase().includes(q)
    );
  });

  const activeCount = couriers.filter((c) => c.isActive).length;

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-900/10 border border-amber-900/20 text-amber-900 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <h2 className="font-serif text-lg font-bold text-slate-900 uppercase tracking-wide">
              Courier Partners & Regional Shipping Rates
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1 pl-10">
            Configure Nirai Tamil Nadu vs Outer Tamil Nadu rates, Express delivery fees, and partner API / site details.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-amber-900 hover:bg-amber-950 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Courier Partner</span>
        </button>
      </div>

      {/* REGIONAL SHIPPING COST & FREE DELIVERY CONTROL ENGINE */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#E2DBD0] shadow-2xs space-y-4">
        <form onSubmit={handleSaveRegionalRates} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-900" />
              <h3 className="font-serif text-xs sm:text-sm font-bold text-amber-950 uppercase tracking-wider">
                Regional Shipping Cost & Free Delivery Control Engine
              </h3>
            </div>

            <button
              type="submit"
              disabled={isSavingRates}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs self-start sm:self-auto disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSavingRates ? 'Saving...' : 'Save Regional Rates'}</span>
            </button>
          </div>

          {/* 5 Input Boxes Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
            {/* Free Delivery Threshold */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Free Delivery Threshold (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="50"
                required
                value={freeThreshold}
                onChange={(e) => setFreeThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500/30"
              />
              <span className="text-[10px] text-stone-500 block mt-1 leading-tight">
                Standard orders above this get FREE shipping
              </span>
            </div>

            {/* Standard: Within TN */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Standard : Within TN (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="5"
                required
                value={tnStandard}
                onChange={(e) => setTnStandard(Number(e.target.value))}
                className="w-full px-3 py-2 bg-emerald-50/30 border border-emerald-400 rounded-lg text-xs font-semibold text-emerald-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30"
              />
              <span className="text-[10px] text-stone-500 block mt-1 leading-tight">
                Standard rate inside Tamil Nadu
              </span>
            </div>

            {/* Standard: Outside TN */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Standard : Outside TN (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="5"
                required
                value={indiaStandard}
                onChange={(e) => setIndiaStandard(Number(e.target.value))}
                className="w-full px-3 py-2 bg-amber-50/30 border border-amber-400 rounded-lg text-xs font-semibold text-amber-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500/30"
              />
              <span className="text-[10px] text-stone-500 block mt-1 leading-tight">
                Standard rate in rest of India
              </span>
            </div>

            {/* Express: Within TN */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Express : Within TN (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="5"
                required
                value={tnExpress}
                onChange={(e) => setTnExpress(Number(e.target.value))}
                className="w-full px-3 py-2 bg-purple-50/30 border border-purple-300 rounded-lg text-xs font-semibold text-purple-900 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-500/30"
              />
              <span className="text-[10px] text-stone-500 block mt-1 leading-tight">
                Express 24-48h rate inside Tamil Nadu
              </span>
            </div>

            {/* Express: Outside TN */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Express : Outside TN (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="5"
                required
                value={indiaExpress}
                onChange={(e) => setIndiaExpress(Number(e.target.value))}
                className="w-full px-3 py-2 bg-blue-50/30 border border-blue-300 rounded-lg text-xs font-semibold text-blue-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500/30"
              />
              <span className="text-[10px] text-stone-500 block mt-1 leading-tight">
                Express 24-48h rate outside / rest of India
              </span>
            </div>
          </div>
        </form>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by courier name, code, or phone..."
            className="w-full pl-9 pr-8 py-2 bg-white border border-[#E2DBD0] rounded-lg text-xs focus:outline-none focus:border-amber-600 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-stone-500 font-medium">
          Active Partners:{' '}
          <span className="font-bold text-slate-800">
            {activeCount} / {couriers.length}
          </span>
        </div>
      </div>

      {/* Courier Partner Cards Grid */}
      {filteredCouriers.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2DBD0] p-12 text-center space-y-3">
          <Truck className="w-10 h-10 text-stone-300 mx-auto" />
          <p className="text-xs text-stone-600 font-semibold">No courier partners match your search</p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-amber-900 hover:underline font-semibold cursor-pointer"
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCouriers.map((courier) => {
            const isCopied = copiedId === courier.id;

            return (
              <div
                key={courier.id}
                className={`bg-white rounded-xl border p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between ${
                  courier.id === 'courier-indiapost'
                    ? 'border-amber-800/60 ring-1 ring-amber-700/20'
                    : 'border-[#E2DBD0]'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider">
                      {courier.code || courier.badgeText || 'PARTNER'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(courier)}
                      title={`Click to ${courier.isActive ? 'deactivate' : 'activate'}`}
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer ${
                        courier.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          courier.isActive ? 'bg-emerald-500' : 'bg-stone-400'
                        }`}
                      />
                      <span>{courier.isActive ? 'Active' : 'Inactive'}</span>
                    </button>
                  </div>

                  {/* Partner Name */}
                  <h4 className="font-serif font-bold text-sm text-slate-900 uppercase tracking-wide">
                    {courier.name}
                  </h4>

                  {/* Contact & Transit Info */}
                  <div className="space-y-1.5 mt-3 text-xs text-stone-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <a
                        href={`tel:${courier.phone}`}
                        className="hover:text-amber-900 transition-colors"
                      >
                        {courier.phone}
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <a
                        href={`mailto:${courier.email}`}
                        className="hover:text-amber-900 transition-colors truncate"
                      >
                        {courier.email}
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="font-semibold text-stone-800">
                        {courier.deliveryDays}
                      </span>
                    </div>
                  </div>

                  {/* Description / Coverage Box */}
                  <div className="bg-[#FAF8F5] border border-[#EBE5DC] p-2.5 rounded-lg text-xs text-stone-600 leading-relaxed mt-3">
                    {courier.coverage}
                  </div>

                  {/* Tracking Portal Template */}
                  <div className="mt-3">
                    <span className="text-[10px] text-stone-400 block mb-1 font-medium">
                      Tracking Portal Template:
                    </span>
                    <div className="bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 font-mono text-[11px] text-stone-600 flex items-center justify-between gap-1 group">
                      <span className="truncate select-all" title={courier.trackingUrlTemplate}>
                        {courier.trackingUrlTemplate}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyTemplate(courier.trackingUrlTemplate, courier.id)}
                        title="Copy tracking template URL"
                        className="p-0.5 text-stone-400 hover:text-amber-900 transition-colors shrink-0 cursor-pointer"
                      >
                        {isCopied ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="border-t border-stone-100 pt-3 mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(courier)}
                    className="text-xs font-semibold text-amber-900 hover:text-amber-950 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(courier.id, courier.name)}
                    title="Delete partner"
                    className="p-1 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Courier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E2DBD0] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-900/10 border border-amber-900/20 text-amber-900 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-slate-900">
                    {editingCourier ? 'Edit Courier Partner Details' : 'Register New Courier Partner'}
                  </h3>
                  <span className="text-[11px] text-stone-500">
                    Nirai Logistics & Dispatch Engine
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCourier} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Courier Partner Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. BLUE DART EXPRESS"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-600 uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Partner Code / Badge *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. BLUEDART"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-600 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Support Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 1860 233 1234"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Support Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="support@bluedart.com"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Expected Delivery Duration *
                </label>
                <input
                  type="text"
                  required
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(e.target.value)}
                  placeholder="e.g. 2 - 3 Business Days"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Network Coverage & Operational Notes *
                </label>
                <textarea
                  rows={2}
                  required
                  value={coverage}
                  onChange={(e) => setCoverage(e.target.value)}
                  placeholder="e.g. Primary air express partner for metro cities & tier-1 quick dispatch."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-600 resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Tracking Portal URL Template *
                </label>
                <input
                  type="text"
                  required
                  value={trackingUrlTemplate}
                  onChange={(e) => setTrackingUrlTemplate(e.target.value)}
                  placeholder="https://www.bluedart.com/tracking?track={trackingId}"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-600 font-mono text-[11px]"
                />
                <span className="text-[10px] text-stone-400 block mt-1">
                  Use <code className="text-amber-800 font-bold">&#123;trackingId&#125;</code> as the dynamic AWB/tracking code replacement tag.
                </span>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="courierActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-amber-900 rounded cursor-pointer"
                />
                <label
                  htmlFor="courierActive"
                  className="font-semibold text-stone-700 cursor-pointer select-none"
                >
                  Partner is active for fulfillment assignment
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingCourier ? 'Update Partner' : 'Save Courier Partner'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

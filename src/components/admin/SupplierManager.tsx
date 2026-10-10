import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { Supplier } from '../../types';
import { Truck, Plus, Edit2, Trash2, X, Lock, Phone, Mail, MapPin } from 'lucide-react';

export const SupplierManager: React.FC = () => {
  const { showToast, refreshData } = useShop();
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => StorageService.getSuppliers());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Kanchipuram');
  const [state, setState] = useState('Tamil Nadu');
  const [leadTimeDays, setLeadTimeDays] = useState(7);
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  const syncSuppliers = () => {
    setSuppliers(StorageService.getSuppliers());
    refreshData();
  };

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setName('');
    setContactPerson('');
    setPhone('+91 ');
    setEmail('');
    setCity('Kanchipuram');
    setState('Tamil Nadu');
    setLeadTimeDays(7);
    setNotes('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setContactPerson(s.contactPerson);
    setPhone(s.phone);
    setEmail(s.email);
    setCity(s.city);
    setState(s.state);
    setLeadTimeDays(s.leadTimeDays);
    setNotes(s.notes || '');
    setIsActive(s.isActive);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: Supplier = {
      id: editingSupplier?.id || `sup-${Date.now()}`,
      name,
      contactPerson,
      phone,
      email,
      city,
      state,
      leadTimeDays: Number(leadTimeDays),
      notes,
      isActive,
      productsSuppliedCount: editingSupplier?.productsSuppliedCount || 0,
    };

    StorageService.saveSupplier(payload);
    syncSuppliers();
    setIsModalOpen(false);
    showToast(editingSupplier ? 'Supplier updated' : 'New supplier registered', 'success');
  };

  const handleDelete = (id: string, supName: string) => {
    if (confirm(`Remove supplier partner "${supName}"?`)) {
      StorageService.deleteSupplier(id);
      syncSuppliers();
      showToast('Supplier removed', 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sourcing Security Isolation Notice */}
      <div className="p-4 bg-amber-900/10 border border-amber-900/20 rounded-xl flex items-center gap-3">
        <Lock className="w-5 h-5 text-amber-900 shrink-0" />
        <div className="text-xs text-stone-800">
          <span className="font-bold text-amber-950 block">
            Strict Sourcing Partner Isolation Enforced
          </span>
          <span>
            Supplier identities, lead times, contact details, and wholesale procurement prices are strictly restricted to the operations console and permanently stripped from all public APIs.
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-bold text-slate-900">
            Internal Sourcing & Master Weaver Directory
          </h2>
          <p className="text-xs text-stone-500">
            Manage procurement cooperatives across Kanchipuram, Salem, Madurai, and Karaikudi.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-amber-900 hover:bg-amber-950 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Sourcing Partner</span>
        </button>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {suppliers.map((sup) => (
          <div
            key={sup.id}
            className="bg-white rounded-xl border border-[#E2DBD0] shadow-2xs p-5 space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-serif text-base font-bold text-slate-900">
                    {sup.name}
                  </h3>
                  <span className="text-xs text-stone-500 font-medium">
                    Contact: {sup.contactPerson}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    sup.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {sup.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>{sup.city}, {sup.state}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span className="font-mono">{sup.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  <span>{sup.email}</span>
                </div>
              </div>

              {sup.notes && (
                <div className="mt-3 p-2.5 bg-stone-50 rounded-lg text-[11px] text-stone-500 italic border border-stone-100">
                  "{sup.notes}"
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-stone-500 font-medium">
                Lead Time: <span className="font-bold text-slate-800">{sup.leadTimeDays} days</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(sup)}
                  className="p-1.5 text-stone-600 hover:text-amber-900 rounded hover:bg-stone-100"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(sup.id, sup.name)}
                  className="p-1.5 text-stone-600 hover:text-rose-600 rounded hover:bg-stone-100"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2DBD0] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="font-serif text-base font-bold text-slate-900">
                {editingSupplier ? 'Edit Sourcing Partner' : 'Register Sourcing Partner'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Guild / Cooperative Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kanchipuram Master Weavers Guild"
                  className="w-full p-2 border border-stone-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Key Contact Person</label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. S. Ramanathan"
                    className="w-full p-2 border border-stone-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Lead Time (Days)</label>
                  <input
                    type="number"
                    value={leadTimeDays}
                    onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                    className="w-full p-2 border border-stone-300 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">City / Region</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="GI certification status, lot terms..."
                  className="w-full p-2 border border-stone-300 rounded-md"
                />
              </div>

              <label className="flex items-center gap-2 font-semibold text-stone-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-amber-900"
                />
                <span>Active Sourcing Partner</span>
              </label>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-lg font-semibold"
                >
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

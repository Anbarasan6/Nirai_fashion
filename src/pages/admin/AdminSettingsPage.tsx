import React, { useState } from 'react';
import { Save, Building, QrCode, CheckCircle2 } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import type { StoreSettings } from '../../types';

export const AdminSettingsPage: React.FC = () => {
  const { settings } = useShop();

  const [storeName] = useState(settings.store_name);
  const [upiId, setUpiId] = useState(settings.upi_id);
  const [upiName, setUpiName] = useState(settings.upi_name);
  const [bankName, setBankName] = useState(settings.bank_details?.bankName || 'State Bank of India');
  const [accountName, setAccountName] = useState(settings.bank_details?.accountName || 'NIRAI HANDLOOM SILKS');
  const [accountNumber, setAccountNumber] = useState(settings.bank_details?.accountNumber || '40982310492');
  const [ifscCode, setIfscCode] = useState(settings.bank_details?.ifscCode || 'SBIN0001824');
  const [branch, setBranch] = useState(settings.bank_details?.branch || 'Elampillai Main Branch');
  const [contactPhone] = useState(settings.contact_phone);
  const [contactEmail] = useState(settings.contact_email);
  const [announcementEn, setAnnouncementEn] = useState(settings.announcement_en);
  const [announcementTa, setAnnouncementTa] = useState(settings.announcement_ta);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedSettings: StoreSettings = {
      id: 'store_settings',
      store_name: storeName,
      upi_id: upiId,
      upi_name: upiName,
      qr_code_url: settings.qr_code_url,
      bank_details: {
        bankName,
        accountName,
        accountNumber,
        ifscCode,
        branch
      },
      contact_phone: contactPhone,
      contact_email: contactEmail,
      announcement_en: announcementEn,
      announcement_ta: announcementTa
    };

    await StorageService.updateSettings(updatedSettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSaveSettings} className="max-w-4xl mx-auto space-y-8 text-xs">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm">
        <div>
          <h2 className="font-serif-luxury text-xl font-bold text-[#2D1619]">
            Store & UPI Payment Settings
          </h2>
          <p className="text-xs text-[#8A7B7E]">Configure 0% fee UPI IDs, Bank NEFT accounts, and bilingual banners</p>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 bg-[#2D1619] text-[#F4E8C1] text-xs font-bold rounded-xl hover:bg-[#4A0E17] flex items-center gap-1.5 shadow-md"
        >
          <Save className="w-4 h-4 text-[#D4AF37]" />
          <span>Save Configuration</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-700" />
          <span>Settings saved and synchronized with Supabase database successfully!</span>
        </div>
      )}

      {/* UPI QR & Account Config */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm space-y-4">
        <h3 className="font-serif-luxury text-base font-bold text-[#2D1619] flex items-center gap-2 border-b border-[#F2ECDF] pb-3">
          <QrCode className="w-5 h-5 text-[#D4AF37]" />
          <span>Direct UPI Gateway Settings (0% Fee)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-[#2D1619] block mb-1">Merchant UPI ID (e.g. nirai@upi)</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl font-mono"
              required
            />
          </div>

          <div>
            <label className="font-bold text-[#2D1619] block mb-1">UPI Account Holder Name</label>
            <input
              type="text"
              value={upiName}
              onChange={(e) => setUpiName(e.target.value)}
              className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl"
              required
            />
          </div>
        </div>
      </div>

      {/* Direct Bank Details */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm space-y-4">
        <h3 className="font-serif-luxury text-base font-bold text-[#2D1619] flex items-center gap-2 border-b border-[#F2ECDF] pb-3">
          <Building className="w-5 h-5 text-[#D4AF37]" />
          <span>Direct Bank Transfer Configuration</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-[#2D1619] block mb-1">Bank Name</label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl"
            />
          </div>

          <div>
            <label className="font-bold text-[#2D1619] block mb-1">Account Name</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl"
            />
          </div>

          <div>
            <label className="font-bold text-[#2D1619] block mb-1">Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-[#2D1619] block mb-1">IFSC Code</label>
            <input
              type="text"
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value)}
              className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl font-mono"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="font-bold text-[#2D1619] block mb-1">Branch Location</label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Store Info & Announcements */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2D9C8] shadow-sm space-y-4">
        <h3 className="font-serif-luxury text-base font-bold text-[#2D1619] border-b border-[#F2ECDF] pb-3">
          Bilingual Announcement Banners
        </h3>

        <div className="space-y-4">
          <div>
            <label className="font-bold text-[#2D1619] block mb-1">Top Banner Announcement (English)</label>
            <input
              type="text"
              value={announcementEn}
              onChange={(e) => setAnnouncementEn(e.target.value)}
              className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl"
            />
          </div>

          <div>
            <label className="font-bold text-[#2D1619] block mb-1">Top Banner Announcement (Tamil - தமிழ்)</label>
            <input
              type="text"
              value={announcementTa}
              onChange={(e) => setAnnouncementTa(e.target.value)}
              className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl"
            />
          </div>
        </div>
      </div>

    </form>
  );
};

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const ContactPage: React.FC = () => {
  const { settings, orders } = useShop();
  const [selectedOrder, setSelectedOrder] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-2">
        <h1 className="font-serif-luxury text-3xl font-extrabold text-[#2D1619]">Contact Master Weaver Support</h1>
        <p className="text-xs text-[#6B5B5E]">Direct assistance for orders, custom saree weaving, and bulk wedding inquiries.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6 text-xs text-[#4A0E17]">
          <div className="p-5 bg-white rounded-2xl border border-[#E2D9C8] space-y-3">
            <h3 className="font-serif-luxury text-base font-bold text-[#2D1619]">Salem Weaver Loom Office</h3>
            <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#D4AF37]" /> Elampillai Main Road, Salem - 637502, Tamil Nadu</p>
            <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#D4AF37]" /> {settings.contact_phone}</p>
            <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#D4AF37]" /> {settings.contact_email}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E2D9C8] shadow-md">
          {submitted ? (
            <div className="p-6 bg-green-50 text-green-800 text-xs font-bold rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-green-700 mx-auto" />
              <p>Thank you! Your enquiry has been sent. Our Salem team will contact you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#2D1619] block mb-1">Associate Order ID (Optional)</label>
                <select value={selectedOrder} onChange={(e) => setSelectedOrder(e.target.value)} className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl">
                  <option value="">General Enquiry (No Order)</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.order_number}>{o.order_number} ({o.customer_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#2D1619] block mb-1">Your Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl" required />
              </div>

              <div>
                <label className="font-bold text-[#2D1619] block mb-1">WhatsApp Phone Number *</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl" required />
              </div>

              <div>
                <label className="font-bold text-[#2D1619] block mb-1">Enquiry Message *</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="w-full p-2.5 border border-[#D4AF37]/50 rounded-xl" required />
              </div>

              <button type="submit" className="w-full py-3 bg-[#2D1619] text-[#F4E8C1] font-bold rounded-xl flex items-center justify-center gap-1.5">
                <Send className="w-4 h-4 text-[#D4AF37]" />
                <span>Submit Support Ticket</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

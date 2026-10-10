import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Phone, Mail, MapPin, Send, Clock, CheckCircle2 } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { storeSettings, showToast } = useShop();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      showToast('Please fill in all required contact form fields', 'error');
      return;
    }
    setIsSubmitted(true);
    showToast('Your message has been sent to our customer care team!', 'success');
  };

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
            Contact Customer Support
          </h1>
          <p className="text-xs text-stone-600">
            Have a query regarding product sizing, custom saree borders, or your ongoing order shipment? We are here to assist you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Contact Details Card */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DFD3] shadow-2xs space-y-6">
            <h2 className="font-serif text-lg font-bold text-slate-900 border-b border-stone-100 pb-3">
              Get in Touch
            </h2>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-900 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">Phone Support</span>
                  <a href={`tel:${storeSettings?.supportPhone}`} className="text-stone-600 hover:text-amber-900 font-mono">
                    {storeSettings?.supportPhone || '+91 44 2498 7654'}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-900 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">Email Desk</span>
                  <a href={`mailto:${storeSettings?.supportEmail}`} className="text-stone-600 hover:text-amber-900">
                    {storeSettings?.supportEmail || 'care@nirai.in'}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-900 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">Heritage Flagship Store</span>
                  <p className="text-stone-600 leading-relaxed">
                    Nirai Handloom House, 42 Weaver Guild Street, Kanchipuram, Tamil Nadu 631501
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-900 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">Working Hours</span>
                  <p className="text-stone-600">Monday – Saturday: 9:30 AM to 7:30 PM IST</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DFD3] shadow-2xs">
            {isSubmitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-xl font-bold text-slate-900">
                  Message Sent Successfully!
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Thank you for reaching out. Our customer care executive will contact you via email or WhatsApp shortly.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <h2 className="font-serif text-lg font-bold text-slate-900 border-b border-stone-100 pb-3">
                  Send an Inquiry
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ananya Swaminathan"
                      className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98401 22334"
                      className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Your Message *</label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we assist you with your handloom selection?"
                    className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>Submit Inquiry</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

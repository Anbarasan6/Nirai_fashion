import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

export const WhatsAppButton: React.FC = () => {
  const { storeSettings } = useShop();

  const phone = storeSettings?.supportPhone?.replace(/[^0-9]/g, '') || '919840122334';
  const defaultMsg = encodeURIComponent(
    'Vanakkam Nirai! I would like to inquire about your South Indian traditional handloom collection and custom saree borders.'
  );
  const whatsappUrl = `https://wa.me/${phone}?text=${defaultMsg}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 border border-emerald-400/40 group"
      title="Chat with Handloom Assistant on WhatsApp"
    >
      <MessageCircle className="w-6 h-6 fill-current" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-bold pl-0 group-hover:pl-2">
        WhatsApp Assist
      </span>
    </a>
  );
};

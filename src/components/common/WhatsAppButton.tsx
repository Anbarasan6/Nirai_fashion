import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

export const WhatsAppButton: React.FC = () => {
  const { settings, language } = useShop();
  const rawPhone = (settings.contact_phone || '9876543210').replace(/[^0-9]/g, '');
  const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

  const message = language === 'ta'
    ? 'வணக்கம் நிறை பட்டு நெசவாளர் குழு, எனக்கு உதவி தேவை.'
    : 'Hello NIRAI Handloom Silks Weaver Team, I would like to inquire about saree orders.';

  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 bg-[#25D366] hover:bg-[#1EBE57] text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 group transition-all duration-300 hover:scale-110"
      aria-label="Contact Weaver Support on WhatsApp"
      title="Chat with Master Weaver Support"
    >
      <MessageCircle className="w-6 h-6 fill-white stroke-[#25D366]" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap text-xs font-bold pl-1">
        {language === 'ta' ? 'வாட்ஸ்அப் உதவி' : 'Weaver WhatsApp'}
      </span>
    </a>
  );
};

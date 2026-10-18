import React from 'react';
import { AlertCircle, Phone, MessageCircle } from 'lucide-react';

export default function TrackErrorState({
  errorMessage,
  supportPhone,
  whatsappNumber,
  searchInput,
}) {
  if (!errorMessage) return null;

  return (
    <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-3 animate-in fade-in">
      <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-rose-900">অর্ডার খুঁজে পাওয়া যায়নি</h3>
      <p className="text-xs text-rose-700 max-w-md mx-auto">{errorMessage}</p>
      <div className="pt-2 flex flex-wrap justify-center gap-3">
        <a
          href={`tel:${supportPhone}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-neutral-800 border border-rose-200 rounded-xl text-xs font-bold shadow-2xs hover:bg-rose-100 transition"
        >
          <Phone className="w-3.5 h-3.5 text-rose-600" />
          <span>সহায়তার জন্য কল করুন</span>
        </a>
        <a
          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
            `Hello, I could not track my order with query: ${searchInput}`
          )}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-2xs hover:bg-emerald-700 transition"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>WhatsApp সাপোর্ট</span>
        </a>
      </div>
    </div>
  );
}

import React from 'react';
import { MessageCircle, Phone } from 'lucide-react';

export default function TrackSupportHub({
  activeOrder,
  whatsappNumber,
  supportPhone,
}) {
  return (
    <div className="bg-gradient-to-br from-amber-50/60 to-emerald-50/60 rounded-3xl border border-amber-200/70 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="space-y-1 text-center sm:text-left">
        <h4 className="text-sm font-extrabold text-neutral-900">
          অর্ডার নিয়ে কোনো প্রশ্ন বা পরিবর্তন প্রয়োজন?
        </h4>
        <p className="text-xs text-neutral-600">
          আমাদের কাস্টমার কেয়ার টিম সকাল ১০টা থেকে রাত ১০টা পর্যন্ত সক্রিয় আছে।
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
        <a
          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
            `Hello, I have an inquiry about my order ${activeOrder.order_number}`
          )}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span>WhatsApp মেসেজ</span>
        </a>
        <a
          href={`tel:${supportPhone}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1b3b2b] hover:bg-[#142e22] text-white text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
        >
          <Phone className="w-4 h-4" />
          <span>কল করুন</span>
        </a>
      </div>
    </div>
  );
}

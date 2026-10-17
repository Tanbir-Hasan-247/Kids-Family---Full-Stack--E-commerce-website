import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

const WhatsAppWidget = ({ phoneNumber = '+8801700000000' }) => {
  const [showTooltip, setShowTooltip] = useState(true);

  // Clean phone number for URL
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const message = encodeURIComponent(
    'আসসালামু আলাইকুম! আমি Kids & Family ওয়েবসাইট থেকে প্রোডাক্ট সংক্রান্ত তথ্য জানতে যোগাযোগ করছি।'
  );
  const waUrl = `https://wa.me/${cleanPhone}?text=${message}`;

  return (
    <aside aria-label="WhatsApp Support" className="hidden lg:flex fixed bottom-6 right-6 z-40 items-center gap-2.5 pointer-events-none">
      {/* Tooltip speech bubble (points right to WhatsApp button) */}
      {showTooltip && (
        <div className="relative bg-white text-neutral-800 text-xs py-2 px-3.5 rounded-2xl shadow-xl border border-neutral-200/80 max-w-[210px] hidden sm:flex items-start gap-2 animate-in fade-in slide-in-from-right-2 duration-300 pointer-events-auto">
          <div className="flex-1">
            <p className="font-bold text-[#1b3b2b] text-[11px] leading-tight">সাহায্য প্রয়োজন?</p>
            <p className="text-[10px] text-neutral-600 mt-0.5 leading-snug">
              অর্ডার বা সাইজের জন্য WhatsApp-এ কথা বলুন!
            </p>
          </div>
          <button
            onClick={() => setShowTooltip(false)}
            className="text-neutral-400 hover:text-neutral-700 p-0.5 rounded-full hover:bg-neutral-100 transition"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          {/* Triangle tail pointing right */}
          <div className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-white border-t border-r border-neutral-200/80 rotate-45" />
        </div>
      )}

      {/* WhatsApp Action Button */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-13 h-13 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 pointer-events-auto shrink-0"
        title="Chat on WhatsApp"
      >
        {/* Subtle ping pulse animation */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 animate-ping group-hover:opacity-40" />
        
        {/* WhatsApp Icon */}
        <svg className="w-7 h-7 fill-current relative z-10" viewBox="0 0 24 24">
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 17.75c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31c-.82-1.31-1.26-2.83-1.26-4.4 0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42 1.56 1.56 2.41 3.63 2.41 5.84 0 4.54-3.7 8.24-8.23 8.24zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.98-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.55.13.17 1.74 2.66 4.21 3.73.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.3z" />
        </svg>

        {/* Online Indicator Badge */}
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-300 border-2 border-white rounded-full" />
      </a>
    </aside>
  );
};

export default WhatsAppWidget;


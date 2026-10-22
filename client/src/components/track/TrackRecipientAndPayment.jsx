import React from 'react';
import { MapPin, User, Phone, Calendar } from 'lucide-react';

export default function TrackRecipientAndPayment({ activeOrder }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Delivery Details */}
      <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
          <MapPin className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-extrabold text-neutral-900">
            ডেলিভারির তথ্য (Delivery Details)
          </h3>
        </div>
        <div className="space-y-2 text-xs text-neutral-700">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="font-bold text-neutral-900">{activeOrder.full_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <a
              href={`tel:${activeOrder.phone}`}
              className="text-[#1b3b2b] font-bold hover:underline"
            >
              {activeOrder.phone}
            </a>
          </div>
          <div className="flex items-start gap-2 pt-1">
            <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
            <span className="text-neutral-600">
              {(() => {
                const city = activeOrder.city || '';
                const isGenericZone =
                  city.toLowerCase().includes('outside') ||
                  city.toLowerCase().includes('inside');
                const isAlreadyInLine =
                  city &&
                  activeOrder.address_line
                    ?.toLowerCase()
                    .includes(city.toLowerCase());

                if (!city || isGenericZone || isAlreadyInLine) {
                  return activeOrder.address_line;
                }
                return `${activeOrder.address_line}, ${city}`;
              })()}
            </span>
          </div>
          {activeOrder.notes && (
            <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-100 text-[11px] text-neutral-600">
              <strong>কাস্টমার নোট:</strong> {activeOrder.notes}
            </div>
          )}
        </div>
      </div>

      {/* Payment & Order Summary */}
      <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
          <Calendar className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-extrabold text-neutral-900">
            পেমেন্ট ও অর্ডারের সারসংক্ষেপ
          </h3>
        </div>
        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-neutral-500">অর্ডারের তারিখ:</span>
            <span className="font-semibold text-neutral-800">
              {new Date(activeOrder.created_at).toLocaleString('bn-BD', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-500">পেমেন্ট মেথড:</span>
            <span className="font-bold text-neutral-900 uppercase">
              {activeOrder.payment_method_display || activeOrder.payment_method}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-500">পেমেন্ট স্ট্যাটাস:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-md text-[10px] uppercase ${
                activeOrder.payment_status === 'paid'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {activeOrder.payment_status === 'paid'
                ? 'পরিশোধিত (Paid)'
                : 'পরিশোধযোগ্য (Unpaid)'}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
            <span className="font-bold text-neutral-700">সর্বমোট প্রদেয়:</span>
            <span className="text-lg font-black text-[#1b3b2b]">
              ৳{activeOrder.total}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

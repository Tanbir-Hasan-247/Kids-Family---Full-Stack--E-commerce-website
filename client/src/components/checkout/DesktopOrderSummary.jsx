import React from 'react';
import { ShieldCheck, Plus, Minus, Trash2 } from 'lucide-react';
import { formatImageUrl } from '../../api/axios';
import VariantBadges from '../common/VariantBadges';

export default function DesktopOrderSummary({
  items,
  subtotal,
  shippingFee,
  total,
  deliveryZone,
  updateQuantity,
  removeItem,
}) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs sticky top-24 space-y-6">
      <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider pb-3 border-b border-neutral-100 flex items-center justify-between">
        <span>অর্ডার বিবরণী</span>
        <span className="text-xs text-neutral-500 font-medium">
          ({items.length} টি পণ্য)
        </span>
      </h2>

      {/* Items list */}
      <div className="divide-y divide-neutral-100 max-h-80 overflow-y-auto pr-1">
        {items.map((item) => {
          const itemImg = formatImageUrl(item.variant?.image);

          return (
            <div key={item.id} className="py-3 flex items-center gap-3">
              <div className="w-12 h-14 bg-neutral-100 rounded-lg overflow-hidden shrink-0 border border-neutral-200">
                <img
                  src={itemImg || 'https://placehold.co/100x120/1a1a1a/d4af37?text=KF'}
                  alt={item.product_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-neutral-900 truncate">
                  {item.product_name}
                </h4>
                <VariantBadges variant={item.variant} className="mt-1" />
                <p className="text-[11px] font-semibold text-neutral-700 mt-1">
                  ৳{item.variant?.price || 0}
                </p>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center border border-neutral-200 rounded-lg bg-neutral-50 shrink-0">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, 'decrease')}
                  className="p-1 hover:text-amber-700 active:scale-90 transition cursor-pointer text-neutral-600"
                  aria-label="কম পরিমাণ"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="px-2 text-xs font-bold text-neutral-800">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, 'increase')}
                  className="p-1 hover:text-amber-700 active:scale-90 transition cursor-pointer text-neutral-600"
                  aria-label="বেশি পরিমাণ"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <div className="text-right shrink-0 min-w-[50px]">
                <span className="text-xs font-extrabold text-[#1b3b2b] block">
                  ৳
                  {item.subtotal ||
                    (Number(item.variant?.price || 0) * item.quantity).toFixed(0)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="p-1 text-neutral-400 hover:text-rose-600 active:scale-90 transition cursor-pointer shrink-0"
                title="মুছে ফেলুন"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Calculations */}
      <div className="space-y-2.5 pt-4 border-t border-neutral-200 text-xs text-neutral-600">
        <div className="flex justify-between">
          <span>সাবটোটাল</span>
          <span className="font-semibold text-neutral-900">৳{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>
            ডেলিভারি চার্জ ({deliveryZone === 'inside_dhaka' ? 'ঢাকা' : 'ঢাকার বাইরে'})
          </span>
          <span className="font-semibold text-neutral-900">৳{shippingFee}</span>
        </div>
        <div className="flex justify-between text-base font-black text-neutral-900 pt-3 border-t border-neutral-200">
          <span>সর্বমোট পরিশোধযোগ্য</span>
          <span className="text-[#1b3b2b]">৳{total.toFixed(2)}</span>
        </div>
      </div>

      <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 flex items-center gap-2.5 text-[11px] text-neutral-600">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>১০০% নিরাপদ ডেলিভারি ও সাইজ এক্সচেঞ্জ সুবিধা।</span>
      </div>
    </div>
  );
}

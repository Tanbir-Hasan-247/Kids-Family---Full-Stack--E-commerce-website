import React from 'react';
import { ShoppingBag, ChevronDown, ChevronUp, Plus, Minus, Trash2 } from 'lucide-react';
import { formatImageUrl } from '../../api/axios';
import VariantBadges from '../common/VariantBadges';

export default function MobileOrderSummaryAccordion({
  items,
  total,
  subtotal,
  shippingFee,
  isOpen,
  onToggle,
  updateQuantity,
  removeItem,
}) {
  return (
    <div className="lg:hidden mb-6 bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between bg-amber-50/60 text-left cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-amber-800" />
          <span className="text-xs font-bold text-neutral-900">
            অর্ডার সামারি ({items.length} টি আইটেম)
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#1b3b2b]">
          <span>৳{total.toFixed(0)}</span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-neutral-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-neutral-500" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 divide-y divide-neutral-100 bg-white animate-in slide-in-from-top-1">
          {items.map((item) => {
            const itemImg = formatImageUrl(item.variant?.image);

            return (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-2.5 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-12 h-14 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                    <img
                      src={itemImg || 'https://placehold.co/100x120/1a1a1a/d4af37?text=KF'}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-neutral-900 truncate">
                      {item.product_name}
                    </p>
                    <VariantBadges variant={item.variant} className="mt-1" />
                    <p className="text-[11px] font-semibold text-neutral-700 mt-1">
                      ৳{item.variant?.price || 0}
                    </p>
                  </div>
                </div>

                {/* Quantity controls & Price */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center border border-neutral-200 rounded-lg bg-neutral-50">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 'decrease')}
                      className="p-1 hover:text-amber-700 active:scale-90 transition cursor-pointer text-neutral-600"
                      aria-label="কম পরিমাণ"
                    >
                      <Minus className="w-3.5 h-3.5" />
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
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right min-w-[50px]">
                    <span className="font-black text-neutral-900 block">
                      ৳
                      {item.subtotal ||
                        (Number(item.variant?.price || 0) * item.quantity).toFixed(0)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-neutral-400 hover:text-rose-600 active:scale-90 transition cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="pt-3 space-y-1 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>সাবটোটাল</span>
              <span className="font-semibold text-neutral-900">৳{subtotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span>ডেলিভারি চার্জ</span>
              <span className="font-semibold text-neutral-900">৳{shippingFee}</span>
            </div>
            <div className="flex justify-between font-black text-sm text-neutral-900 pt-1.5 border-t border-neutral-200">
              <span>সর্বমোট</span>
              <span className="text-[#1b3b2b]">৳{total.toFixed(0)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

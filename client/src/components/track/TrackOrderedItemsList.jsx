import React from 'react';
import { ShoppingBag, Package } from 'lucide-react';
import { formatImageUrl } from '../../api/axios';
import VariantBadges from '../common/VariantBadges';

export default function TrackOrderedItemsList({ activeOrder }) {
  return (
    <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm overflow-hidden">
      <div className="p-5 sm:p-6 bg-neutral-50/60 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-[#1b3b2b]" />
          <h3 className="text-sm font-extrabold text-neutral-900">
            অর্ডারকৃত পণ্যের তালিকা ({activeOrder.items?.length || 0} টি আইটেম)
          </h3>
        </div>
      </div>

      <div className="divide-y divide-neutral-100 p-4 sm:p-6 space-y-4">
        {activeOrder.items?.map((item) => {
          const imgUrl = formatImageUrl(item.image);
          return (
            <div
              key={item.id}
              className="pt-3 first:pt-0 flex items-center gap-3 sm:gap-4"
            >
              {/* Item Image */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200/80 flex items-center justify-center">
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <Package className="w-6 h-6 text-neutral-400" />
                )}
              </div>

              {/* Item Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                  {item.product_name}
                </h4>
                {/* Variant badges */}
                {item.attributes && item.attributes.length > 0 && (
                  <VariantBadges
                    variant={{ attributes: item.attributes, sku: item.variant_sku }}
                    showSku={false}
                    className="mt-1"
                  />
                )}
                <div className="text-xs text-neutral-500">
                  পরিমাণঃ <strong className="text-neutral-800">{item.quantity}</strong> × ৳
                  {item.price}
                </div>
              </div>

              {/* Subtotal */}
              <div className="text-right shrink-0">
                <span className="text-xs sm:text-sm font-extrabold text-[#1b3b2b]">
                  ৳{item.subtotal || item.price * item.quantity}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Price Breakdown Footer */}
      <div className="bg-neutral-50 p-5 sm:p-6 border-t border-neutral-200/80 space-y-2 text-xs">
        <div className="flex justify-between text-neutral-600">
          <span>পণ্যের মোট মূল্য (Subtotal):</span>
          <span className="font-semibold text-neutral-900">৳{activeOrder.subtotal}</span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>ডেলিভারি চার্জ (Shipping Fee):</span>
          <span className="font-semibold text-neutral-900">
            ৳{activeOrder.shipping_fee}
          </span>
        </div>
        <div className="flex justify-between text-base font-black text-neutral-900 pt-2 border-t border-neutral-200">
          <span>সর্বমোট পরিশোধযোগ্য (Grand Total):</span>
          <span className="text-[#1b3b2b]">৳{activeOrder.total}</span>
        </div>
      </div>
    </div>
  );
}

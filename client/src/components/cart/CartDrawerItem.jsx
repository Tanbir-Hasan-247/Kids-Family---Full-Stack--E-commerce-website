import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { formatImageUrl } from '../../api/axios';
import VariantBadges from '../common/VariantBadges';

const CartDrawerItem = ({ item, onUpdateQuantity, onRemove }) => {
  return (
    <div className="py-3.5 flex gap-3 items-center">
      {/* Thumbnail */}
      <div className="w-16 h-20 sm:w-18 sm:h-22 bg-neutral-100 rounded-lg overflow-hidden shrink-0 border border-neutral-200">
        <img
          src={
            formatImageUrl(item.variant?.image) ||
            'https://placehold.co/200x260/1a1a1a/d4af37?text=KF'
          }
          alt={item.product_name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-neutral-900 truncate">
          {item.product_name}
        </h4>

        {/* Variant Attributes (Color & Size Badges) */}
        <VariantBadges variant={item.variant} className="mt-1" />

        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs font-black text-[#1b3b2b]">
            ৳{item.variant?.price}
          </span>
          {item.variant?.compare_at_price && (
            <span className="text-[10px] text-neutral-400 line-through">
              ৳{item.variant.compare_at_price}
            </span>
          )}
          {item.variant?.sku && (
            <span className="text-[9px] text-neutral-400 ml-auto font-mono">
              {item.variant.sku}
            </span>
          )}
        </div>

        {/* Quantity controls */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border border-neutral-200 rounded-lg bg-neutral-50">
            <button
              onClick={() => onUpdateQuantity(item.id, 'decrease')}
              className="p-1 hover:text-amber-700 active:scale-90 transition cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs font-bold text-neutral-800">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, 'increase')}
              className="p-1 hover:text-amber-700 active:scale-90 transition cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => onRemove(item.id)}
            className="text-neutral-400 hover:text-rose-500 active:scale-90 p-1 transition cursor-pointer"
            title="পণ্যটি মুছে ফেলুন"
            aria-label="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartDrawerItem;


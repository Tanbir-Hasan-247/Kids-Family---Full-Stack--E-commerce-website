import React from 'react';
import {
  Minus,
  Plus,
  Heart,
  ShoppingBag,
  Zap,
  AlertCircle,
} from 'lucide-react';

export default function ProductActionButtons({
  quantity,
  setQuantity,
  activeVariant,
  toggleWishlist,
  productId,
  favorited,
  handleAddToBag,
  handleDirectBuy,
  addingToBag,
  feedbackMsg,
}) {
  return (
    <div className="pt-2 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center border border-neutral-300 rounded-2xl bg-neutral-50 px-2 py-1 shrink-0">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="p-2 text-neutral-600 hover:text-neutral-900 cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-8 text-center text-sm font-bold text-neutral-900">
            {quantity}
          </span>
          <button
            onClick={() =>
              setQuantity((q) =>
                activeVariant?.stock ? Math.min(activeVariant.stock, q + 1) : q + 1
              )
            }
            className="p-2 text-neutral-600 hover:text-neutral-900 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Wishlist Button */}
        <button
          onClick={() => toggleWishlist(productId)}
          className={`p-3 rounded-2xl border transition shadow-xs shrink-0 cursor-pointer ${
            favorited
              ? 'border-rose-300 bg-rose-50 text-rose-500'
              : 'border-neutral-300 text-neutral-600 hover:text-rose-500 hover:bg-neutral-50'
          }`}
          title={favorited ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-5 h-5 ${favorited ? 'fill-rose-500' : ''}`} />
        </button>
      </div>

      {/* Action Buttons: Add to Bag & Direct Buy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        <button
          onClick={handleAddToBag}
          disabled={addingToBag || (activeVariant && activeVariant.stock < 1)}
          className="w-full py-3.5 px-4 rounded-2xl border-2 border-[#1b3b2b] text-[#1b3b2b] hover:bg-[#1b3b2b] hover:text-white disabled:border-neutral-300 disabled:text-neutral-400 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer disabled:cursor-not-allowed"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>
            {activeVariant && activeVariant.stock < 1
              ? 'Out of Stock'
              : 'কার্ট-এ যোগ করুন'}
          </span>
        </button>

        <button
          onClick={handleDirectBuy}
          disabled={addingToBag || (activeVariant && activeVariant.stock < 1)}
          className="w-full py-3.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-98 disabled:bg-neutral-300 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer disabled:cursor-not-allowed"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>সরাসরি অর্ডার করুন</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}
    </div>
  );
}

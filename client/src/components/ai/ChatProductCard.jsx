import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag, CheckCircle2, ArrowRight } from 'lucide-react';
import { formatImageUrl } from '../../api/axios';

export default function ChatProductCard({
  product,
  isAdded,
  isAdding,
  onAddToCart,
  onNavigate,
}) {
  return (
    <div
      className={`bg-white border rounded-2xl p-2.5 sm:p-3 shadow-xs transition-all duration-200 flex flex-col justify-between ${
        isAdded
          ? 'border-emerald-500/80 bg-emerald-50/20 shadow-xs'
          : 'border-neutral-200/90 hover:border-amber-400 hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <Link
          to={`/products/${product.id}`}
          onClick={onNavigate}
          className="w-16 h-16 rounded-xl bg-neutral-100 border border-neutral-200/80 overflow-hidden shrink-0 flex items-center justify-center group"
        >
          {product.thumbnail ? (
            <img
              src={formatImageUrl(product.thumbnail)}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition"
              loading="lazy"
            />
          ) : (
            <Package className="w-6 h-6 text-neutral-300" />
          )}
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm inline-block mb-0.5">
            {product.category_name}
          </span>
          <Link
            to={`/products/${product.id}`}
            onClick={onNavigate}
            className="font-bold text-neutral-900 text-xs line-clamp-1 hover:text-[#1b3b2b] transition block"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Price & Discount */}
          <div className="flex items-center gap-2 mt-1">
            <span className="font-black text-xs text-[#1b3b2b]">
              ৳{Number(product.starting_price).toLocaleString()}
            </span>
            {product.is_on_sale && product.max_discount > 0 && (
              <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded-full border border-rose-200/60">
                -{product.max_discount}%
              </span>
            )}
            {product.available_sizes && product.available_sizes.length > 0 && (
              <span className="text-[9px] text-neutral-500 truncate">
                সাইজ: {product.available_sizes.join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-neutral-100">
        <button
          onClick={(e) => onAddToCart(e, product)}
          disabled={isAdding}
          className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
            isAdded
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-[#1b3b2b] text-white hover:bg-[#25523c] active:scale-[0.98]'
          }`}
        >
          {isAdded ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              <span>কার্টে যোগ হয়েছে!</span>
            </>
          ) : isAdding ? (
            <span>যুক্ত হচ্ছে...</span>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
              <span>কার্টে নিন (Add to Cart)</span>
            </>
          )}
        </button>

        <Link
          to={`/products/${product.id}`}
          onClick={onNavigate}
          className="p-1.5 px-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 font-semibold text-[10px] flex items-center gap-1 shrink-0"
          title="বিস্তারিত দেখুন"
        >
          <span>বিস্তারিত</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

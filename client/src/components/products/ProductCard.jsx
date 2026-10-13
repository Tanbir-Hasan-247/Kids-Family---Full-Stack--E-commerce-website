import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { formatImageUrl } from '../../api/axios';

const ProductCard = ({ product }) => {
  const { toggleWishlist, isFavorited } = useWishlist();
  const favorited = isFavorited(product.id);

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const imageSrc =
    formatImageUrl(product.thumbnail) ||
    'https://placehold.co/600x800/1e293b/f8fafc?text=' + encodeURIComponent(product.name);

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-neutral-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      {/* Image Container */}
      <Link
        to={`/products/${product.id}`}
        className="relative block aspect-3/4 overflow-hidden bg-neutral-100"
      >
        <img
          src={imageSrc}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Sale / Discount Badge */}
        {product.is_on_sale && product.max_discount > 0 && (
          <span className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-sm tracking-wide">
            {product.max_discount}% OFF
          </span>
        )}

        {/* Favorite Heart Button */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full transition-all duration-200 shadow-sm ${
            favorited
              ? 'bg-rose-50 text-rose-500 fill-rose-500 scale-110'
              : 'bg-white/90 text-neutral-600 hover:text-rose-500 hover:bg-white'
          }`}
          title={favorited ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-4 h-4 ${favorited ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Quick View Overlay on hover */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none sm:pointer-events-auto">
          <div className="w-full py-2.5 bg-white/95 backdrop-blur-xs text-[#1b3b2b] text-xs font-bold text-center rounded-xl shadow-md border border-neutral-200 flex items-center justify-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Select Options</span>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between">
        <div>
          <span className="text-[10px] sm:text-[11px] font-semibold text-amber-700 uppercase tracking-wider mb-1 truncate block">
            {product.category_name || 'Festive Wear'}
          </span>

          <Link
            to={`/products/${product.id}`}
            className="text-xs sm:text-sm font-bold text-neutral-900 hover:text-amber-800 transition line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] leading-tight mb-2"
          >
            {product.name}
          </Link>
        </div>

        <div className="mt-auto pt-1">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm sm:text-base font-black text-[#1b3b2b]">
              ৳{product.starting_price || product.base_price}
            </span>
            {product.compare_at_price && (
              <span className="text-[10px] sm:text-xs text-neutral-400 line-through">
                ৳{product.compare_at_price}
              </span>
            )}
          </div>

          {/* GhorerBazar style direct Order Now button */}
          <Link
            to={`/products/${product.id}`}
            className="mt-2.5 w-full py-2 px-2 sm:px-3 rounded-xl bg-[#1b3b2b] hover:bg-[#142e22] active:scale-95 text-white text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition-all duration-150"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>অর্ডার করুন</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;


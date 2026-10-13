import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/products/ProductCard';

const WishlistPage = () => {
  const { items, count } = useWishlist();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Your Wishlist</h1>
        <p className="text-xs text-neutral-500 mt-1">
          {count} {count === 1 ? 'saved item' : 'saved items'}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-neutral-200/80 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-neutral-800">Your Wishlist is Empty</h3>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto">
            Tap the heart icon on any outfit to save it for later.
          </p>
          <Link
            to="/products"
            className="inline-block px-6 py-2.5 bg-[#1b3b2b] text-white rounded-full text-xs font-bold hover:bg-[#142e22] transition"
          >
            Explore Outfits
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <ProductCard key={item.id} product={item.product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;


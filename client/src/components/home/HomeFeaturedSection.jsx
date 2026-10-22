import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import ProductCard from '../products/ProductCard';

const HomeFeaturedSection = ({ products, loading }) => {
  if (!loading && (!products || products.length === 0)) return null;

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <h2 className="text-lg sm:text-2xl font-black text-neutral-900 tracking-tight">
              টপ ট্রেন্ডিং ও বেস্টসেলার কালেকশন
            </h2>
          </div>
          <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5">
            অভিভাবকদের সবচেয়ে পছন্দের ট্রেন্ডি পোশাকসমূহ
          </p>
        </div>

        <Link
          to="/products"
          className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 shrink-0"
        >
          <span>সব দেখুন</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-3/4 bg-neutral-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
};

export default HomeFeaturedSection;

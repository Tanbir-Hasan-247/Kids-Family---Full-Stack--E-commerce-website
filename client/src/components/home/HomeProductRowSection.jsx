import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import ProductCard from '../products/ProductCard';

const HomeProductRowSection = ({
  emoji,
  title,
  subtitle,
  linkUrl,
  bannerClass,
  buttonClass,
  products,
}) => {
  if (!products || products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      <div className={`flex items-center justify-between mb-4 sm:mb-6 ${bannerClass}`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl">{emoji}</span>
            <h2 className="text-lg sm:text-2xl font-black text-neutral-900 tracking-tight">
              {title}
            </h2>
          </div>
          <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5">
            {subtitle}
          </p>
        </div>

        <Link
          to={linkUrl}
          className={buttonClass}
        >
          <span>সব দেখুন</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="py-8 text-center text-xs text-neutral-400 bg-white rounded-2xl border border-neutral-100">
          {emptyText}
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

export default HomeProductRowSection;

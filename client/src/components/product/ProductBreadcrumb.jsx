import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function ProductBreadcrumb({ product }) {
  if (!product) return null;

  return (
    <nav className="text-xs text-neutral-400 mb-6 sm:mb-8 flex flex-wrap items-center gap-1.5 sm:gap-2">
      <Link to="/" className="hover:text-neutral-700 transition">
        হোম
      </Link>
      <ChevronRight className="w-3.5 h-3.5 shrink-0 text-neutral-300" />
      <Link to="/products" className="hover:text-neutral-700 transition">
        সকল পণ্য
      </Link>
      {product.category?.parent_name && (
        <>
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-neutral-300" />
          <Link
            to={`/products?cat=${product.category.parent_slug || ''}`}
            className="hover:text-amber-800 font-semibold text-neutral-600 transition"
          >
            {product.category.parent_name}
          </Link>
        </>
      )}
      {product.category?.name && (
        <>
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-neutral-300" />
          <Link
            to={`/products?cat=${product.category.slug || ''}`}
            className="hover:text-amber-800 font-semibold text-neutral-600 transition"
          >
            {product.category.name}
          </Link>
        </>
      )}
      <ChevronRight className="w-3.5 h-3.5 shrink-0 text-neutral-300" />
      <span className="text-neutral-800 font-bold truncate max-w-[180px] sm:max-w-xs">
        {product.name}
      </span>
    </nav>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';

const NavbarDesktopLinks = ({ categories }) => {
  return (
    <nav className="hidden lg:flex items-center justify-center space-x-8 py-2.5 border-t border-neutral-100 text-sm font-medium">
      <Link
        to="/"
        className="text-neutral-700 hover:text-amber-700 transition"
      >
        Home
      </Link>

      <Link
        to="/products"
        className="text-neutral-700 hover:text-amber-700 transition"
      >
        All Products
      </Link>

      <Link
        to="/sale"
        className="text-rose-600 font-semibold hover:text-rose-700 transition flex items-center gap-1"
      >
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        Special Offers & Sale
      </Link>

      {categories.map((cat) => (
        <Link
          key={cat.id}
          to={`/products?cat=${encodeURIComponent(cat.slug || '')}`}
          className="text-neutral-700 hover:text-amber-700 transition"
        >
          {cat.name}
        </Link>
      ))}
    </nav>
  );
};

export default NavbarDesktopLinks;

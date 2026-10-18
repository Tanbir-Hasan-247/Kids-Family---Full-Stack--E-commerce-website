import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingBag, Truck, Package, ShieldCheck } from 'lucide-react';

const NavbarMobileDrawer = ({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  openDrawer,
  totalItems,
  user,
  categories,
}) => {
  if (!isOpen) return null;

  return (
    <div className="lg:hidden border-t border-neutral-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top-2">
      <form onSubmit={onSearchSubmit} className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="AI Search: যেমন '৫ বছরের বাচ্চার পাঞ্জাবি'..."
          className="w-full bg-neutral-100 text-sm pl-9 pr-4 py-2 rounded-lg border border-neutral-200 focus:outline-none"
        />

        <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
      </form>

      <div className="flex flex-col space-y-2 text-sm font-medium pt-2">
        <Link
          to="/"
          onClick={onClose}
          className="py-1.5 text-neutral-800"
        >
          Home
        </Link>

        <Link
          to="/products"
          onClick={onClose}
          className="py-1.5 text-neutral-800"
        >
          All Products
        </Link>

        <Link
          to="/sale"
          onClick={onClose}
          className="py-1.5 text-rose-600 font-semibold"
        >
          Special Offers & Sale
        </Link>

        <button
          type="button"
          onClick={() => {
            onClose();
            openDrawer();
          }}
          className="py-1.5 text-neutral-800 text-left flex items-center justify-between font-semibold cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#1b3b2b]" />
            <span>My Shopping Bag (কার্ট)</span>
          </span>
          {totalItems > 0 && (
            <span className="bg-[#1b3b2b] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {totalItems}
            </span>
          )}
        </button>

        <Link
          to="/track-order"
          onClick={onClose}
          className="py-1.5 text-emerald-800 font-bold flex items-center gap-2"
        >
          <Truck className="w-4 h-4 text-emerald-700" />
          <span>অর্ডার ট্র্যাক করুন (Track Order)</span>
        </Link>

        <Link
          to="/orders"
          onClick={onClose}
          className="py-1.5 text-neutral-800 font-medium flex items-center gap-2"
        >
          <Package className="w-4 h-4 text-neutral-500" />
          <span>আমার অর্ডারসমূহ (Order History)</span>
        </Link>

        {(user?.is_staff || user?.is_superuser) && (
          <Link
            to="/admin"
            onClick={onClose}
            className="py-1.5 text-[#1b3b2b] font-bold flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-[#1b3b2b]" />
            Admin Panel
          </Link>
        )}

        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/products?cat=${encodeURIComponent(cat.slug || '')}`}
            onClick={onClose}
            className="py-1.5 text-neutral-700 hover:text-amber-700"
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default NavbarMobileDrawer;

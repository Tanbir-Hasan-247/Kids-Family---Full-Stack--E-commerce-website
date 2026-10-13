import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingBag, Package, Phone, X, MessageCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const BottomNav = () => {
  const location = useLocation();
  const { totalItems, openDrawer } = useCart();
  const [showSupportModal, setShowSupportModal] = useState(false);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile & Tablet Fixed Bottom App Bar (GhorerBazar style) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 transition-all"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)' }}
      >
        <div className="max-w-md mx-auto grid grid-cols-5 items-center text-center">
          {/* 1. Home */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
              isActive('/')
                ? 'text-[#1b3b2b] font-bold'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <div className={`p-1 rounded-full ${isActive('/') ? 'bg-amber-100/70 text-[#1b3b2b]' : ''}`}>
              <Home className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">হোম</span>
          </Link>

          {/* 2. Categories / All Products */}
          <Link
            to="/products"
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
              isActive('/products') && !location.search.includes('sale=true')
                ? 'text-[#1b3b2b] font-bold'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <div className={`p-1 rounded-full ${isActive('/products') ? 'bg-amber-100/70 text-[#1b3b2b]' : ''}`}>
              <LayoutGrid className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">ক্যাটাগরি</span>
          </Link>

          {/* 3. Shopping Cart Drawer Trigger (Center Highlight) */}
          <button
            type="button"
            onClick={openDrawer}
            className="flex flex-col items-center justify-center py-1 rounded-xl text-neutral-700 relative active:scale-95 transition"
            aria-label="Open Shopping Bag"
          >
            <div className="relative p-1 rounded-full bg-[#1b3b2b] text-white shadow-md">
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center border-2 border-white animate-bounce">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 font-bold text-[#1b3b2b]">কার্ট ({totalItems})</span>
          </button>

          {/* 4. Orders */}
          <Link
            to="/orders"
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
              isActive('/orders')
                ? 'text-[#1b3b2b] font-bold'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <div className={`p-1 rounded-full ${isActive('/orders') ? 'bg-amber-100/70 text-[#1b3b2b]' : ''}`}>
              <Package className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">অর্ডার</span>
          </Link>

          {/* 5. Support / Helpline */}
          <button
            type="button"
            onClick={() => setShowSupportModal(true)}
            className="flex flex-col items-center justify-center py-1 rounded-xl text-neutral-500 hover:text-neutral-800 active:scale-95 transition"
          >
            <div className="p-1 rounded-full text-emerald-700 bg-emerald-50">
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">হেল্পলাইন</span>
          </button>
        </div>
      </nav>

      {/* Quick Helpline & Order Support Popup (Bangladeshi E-commerce Style) */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom-6 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-neutral-900">কাস্টমার সাপোর্ট</h3>
                  <p className="text-[11px] text-neutral-500">ফোন বা হোয়াটসঅ্যাপে সরাসরি অর্ডার করুন</p>
                </div>
              </div>
              <button
                onClick={() => setShowSupportModal(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 pt-1">
              <a
                href="tel:+8801700000000"
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white rounded-2xl font-bold text-sm shadow-md transition"
              >
                <Phone className="w-4 h-4" />
                <span>সরাসরি কল করুন (০১৭০০-০০০০০০)</span>
              </a>

              <a
                href="https://wa.me/8801700000000?text=Hello%20Kids%20%26%20Family,%20I%20want%20to%20order"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white rounded-2xl font-bold text-sm shadow-md transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>হোয়াটসঅ্যাপে মেসেজ দিন</span>
              </a>
            </div>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-neutral-500">
                সকাল ১০:০০ টা থেকে রাত ১০:০০ টা পর্যন্ত আমাদের সাপোর্ট টিম সার্বক্ষণিক প্রস্তুত।
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNav;


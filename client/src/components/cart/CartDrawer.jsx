import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useShopSettings } from '../../context/ShopSettingsContext';
import { formatImageUrl } from '../../api/axios';
import VariantBadges from '../common/VariantBadges';

const CartDrawer = () => {
  const navigate = useNavigate();
  const { settings } = useShopSettings();
  const {
    isDrawerOpen,
    closeDrawer,
    items,
    totalItems,
    totalPrice,
    updateQuantity,
    removeItem,
  } = useCart();

  const [isMounted, setIsMounted] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);

  // Manage mount & body scroll lock with exit transition support
  useEffect(() => {
    if (isDrawerOpen) {
      setIsMounted(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setIsMounted(false), 300);
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Touch swipe-to-close on mobile (swiping to the right closes)
  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    if (touchEndX - touchStartX > 60) {
      closeDrawer();
    }
    setTouchStartX(null);
  };

  if (!isDrawerOpen && !isMounted) return null;

  const handleCheckoutClick = () => {
    closeDrawer();
    navigate('/checkout');
  };

  const parsedTotal = parseFloat(totalPrice) || 0;
  const feeInside = Number(settings?.delivery_inside_dhaka ?? 60);
  const shippingFee = parsedTotal > 0 ? feeInside : 0;
  const grandTotal = parsedTotal + shippingFee;

  return (
    <div
      className={`fixed inset-0 z-60 overflow-hidden transition-all duration-300 ${
        isDrawerOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart Drawer"
    >
      {/* 
        Dark Translucent Backdrop:
        - On mobile, leaves ~15% visible on the left side so user clearly sees the right-side drawer
        - Tapping anywhere on backdrop closes drawer
      */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out cursor-pointer ${
          isDrawerOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Right-Side Slide-Over Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={`w-[85vw] max-w-[360px] sm:w-[420px] sm:max-w-md bg-white shadow-2xl flex flex-col h-full transform transition-transform duration-300 ease-out select-none sm:select-auto ${
            isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/80 shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#1b3b2b]" />
              <h2 className="text-sm sm:text-base font-extrabold text-neutral-900">
                শপিং ব্যাগ (Cart)
              </h2>
              <span className="text-[11px] sm:text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                {totalItems}
              </span>
            </div>
            <button
              onClick={closeDrawer}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 active:scale-95 rounded-full hover:bg-neutral-100 transition cursor-pointer"
              title="Close Bag"
              aria-label="Close Shopping Bag"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 divide-y divide-neutral-100 overscroll-contain">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-800">আপনার কার্ট খালি</h3>
                  <p className="text-xs text-neutral-500 mt-1 max-w-[220px]">
                    এখনো কোনো প্রডাক্ট যুক্ত করা হয়নি। পছন্দের পণ্য এখনই কার্ট-এ যুক্ত করুন।
                  </p>
                </div>
                <button
                  onClick={closeDrawer}
                  className="px-5 py-2.5 rounded-full bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-bold text-xs shadow-md transition cursor-pointer"
                >
                  কেনাকাটা শুরু করুন
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="py-3.5 flex gap-3 items-center">
                  {/* Thumbnail */}
                  <div className="w-16 h-20 sm:w-18 sm:h-22 bg-neutral-100 rounded-lg overflow-hidden shrink-0 border border-neutral-200">
                    <img
                      src={
                        formatImageUrl(item.variant?.image) ||
                        'https://placehold.co/200x260/1a1a1a/d4af37?text=KF'
                      }
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-neutral-900 truncate">
                      {item.product_name}
                    </h4>

                    {/* Variant Attributes (Color & Size Badges) */}
                    <VariantBadges variant={item.variant} className="mt-1" />

                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs font-black text-[#1b3b2b]">
                        ৳{item.variant?.price}
                      </span>
                      {item.variant?.compare_at_price && (
                        <span className="text-[10px] text-neutral-400 line-through">
                          ৳{item.variant.compare_at_price}
                        </span>
                      )}
                      {item.variant?.sku && (
                        <span className="text-[9px] text-neutral-400 ml-auto font-mono">
                          {item.variant.sku}
                        </span>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-neutral-200 rounded-lg bg-neutral-50">
                        <button
                          onClick={() => updateQuantity(item.id, 'decrease')}
                          className="p-1 hover:text-amber-700 active:scale-90 transition cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-xs font-bold text-neutral-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 'increase')}
                          className="p-1 hover:text-amber-700 active:scale-90 transition cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-neutral-400 hover:text-rose-500 active:scale-90 p-1 transition cursor-pointer"
                        title="পণ্যটি মুছে ফেলুন"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div
              className="border-t border-neutral-200 p-4 sm:p-5 space-y-3 bg-neutral-50/90 shrink-0 shadow-inner"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
            >
              <div className="space-y-1 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>সাবটোটাল</span>
                  <span className="font-bold text-neutral-900">৳{parsedTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-neutral-500">
                  <span>ডেলিভারি চার্জ</span>
                  <span className="font-semibold text-neutral-800">৳{shippingFee}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-neutral-900 pt-1.5 border-t border-neutral-200">
                  <span>মোট প্রদেয়</span>
                  <span className="text-[#1b3b2b] text-base">৳{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckoutClick}
                className="w-full py-3 px-4 bg-[#1b3b2b] hover:bg-[#142e22] active:scale-98 text-amber-400 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <span>অর্ডার সম্পন্ন করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={closeDrawer}
                className="w-full text-center text-xs text-neutral-500 hover:text-neutral-800 font-medium py-1 transition cursor-pointer"
              >
                আরো পণ্য দেখুন (Continue Shopping)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;


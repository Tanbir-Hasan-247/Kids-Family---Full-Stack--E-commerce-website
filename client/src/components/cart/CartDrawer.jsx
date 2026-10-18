import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useShopSettings } from '../../context/ShopSettingsContext';
import CartDrawerHeader from './CartDrawerHeader';
import CartDrawerItem from './CartDrawerItem';
import CartDrawerFooter from './CartDrawerFooter';

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
      {/* Dark Translucent Backdrop */}
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
          <CartDrawerHeader
            totalItems={totalItems}
            onClose={closeDrawer}
          />

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
                <CartDrawerItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <CartDrawerFooter
              parsedTotal={parsedTotal}
              shippingFee={shippingFee}
              grandTotal={grandTotal}
              onCheckout={handleCheckoutClick}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useShopSettings } from '../context/ShopSettingsContext';
import { formatImageUrl } from '../api/axios';
import VariantBadges from '../components/common/VariantBadges';

const CartPage = () => {
  const navigate = useNavigate();
  const { items, totalPrice, updateQuantity, removeItem } = useCart();
  const { settings } = useShopSettings();

  const subtotal = parseFloat(totalPrice) || 0;
  const feeInside = Number(settings?.delivery_inside_dhaka ?? 60);
  const shippingFee = subtotal > 0 ? feeInside : 0;
  const grandTotal = subtotal + shippingFee;

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">Your Shopping Bag is Empty</h2>
        <p className="text-xs text-neutral-500">
          Looks like you haven't added any products yet.
        </p>
        <Link
          to="/products"
          className="inline-block px-6 py-2.5 rounded-full bg-[#1b3b2b] text-white text-xs font-bold"
        >
          Explore Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Shopping Bag</h1>
        <p className="text-xs text-neutral-500 mt-1">Review your selected family outfits</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs divide-y divide-neutral-100">
          {items.map((item) => (
            <div key={item.id} className="py-4 flex gap-4 items-center">
              <div className="w-20 h-24 bg-neutral-100 rounded-xl overflow-hidden shrink-0 border border-neutral-200">
                <img
                  src={
                    formatImageUrl(item.variant?.image) ||
                    'https://placehold.co/200x260/1a1a1a/d4af37?text=KF'
                  }
                  alt={item.product_name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-neutral-900 truncate">
                  {item.product_name}
                </h4>
                <VariantBadges variant={item.variant} className="mt-1.5" />
                <span className="text-sm font-extrabold text-[#1b3b2b] block mt-1.5">
                  ৳{item.variant?.price}
                </span>

                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center border border-neutral-200 rounded-lg bg-neutral-50">
                    <button
                      onClick={() => updateQuantity(item.id, 'decrease')}
                      className="p-1 hover:text-amber-700 transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 'increase')}
                      className="p-1 hover:text-amber-700 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-black text-neutral-900">
                  ৳{(parseFloat(item.variant?.price || 0) * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Card */}
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider pb-3 border-b border-neutral-100">
              Bag Summary
            </h3>
            <div className="space-y-2 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-900">৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span className="font-semibold text-neutral-900">৳{shippingFee}</span>
              </div>
              <div className="flex justify-between text-base font-black text-neutral-900 pt-3 border-t border-neutral-200">
                <span>Total Amount</span>
                <span className="text-[#1b3b2b]">৳{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 px-4 bg-[#1b3b2b] hover:bg-[#142e22] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;


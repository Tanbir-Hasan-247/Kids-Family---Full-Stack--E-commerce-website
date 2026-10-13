import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag,
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  User,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useShopSettings } from '../context/ShopSettingsContext';
import api from '../api/axios';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { settings } = useShopSettings();

  const feeInside = Number(settings?.delivery_inside_dhaka ?? 60);
  const feeOutside = Number(settings?.delivery_outside_dhaka ?? 120);

  const [deliveryZone, setDeliveryZone] = useState('inside_dhaka'); // 'inside_dhaka' or 'outside_dhaka'
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  const [formData, setFormData] = useState({
    full_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '',
    phone: user?.phone || '',
    email: user?.email || '',
    address_line: user?.address || '',
    city: 'Dhaka',
    notes: '',
    payment_method: 'cod',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const subtotal = parseFloat(totalPrice) || 0;
  const shippingFee = deliveryZone === 'inside_dhaka' ? feeInside : feeOutside;
  const total = subtotal + shippingFee;

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mx-auto shadow-inner">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">আপনার শপিং ব্যাগটি খালি</h2>
        <p className="text-xs text-neutral-500">
          অর্ডার সম্পন্ন করতে অনুগ্রহ করে ব্যাগ-এ পণ্য যোগ করুন।
        </p>
        <Link
          to="/products"
          className="inline-block px-6 py-3 rounded-full bg-[#1b3b2b] hover:bg-[#142e22] text-white text-xs font-bold shadow-md transition"
        >
          প্রোডাক্ট কালেকশন দেখুন
        </Link>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleZoneChange = (zone) => {
    setDeliveryZone(zone);
    if (zone === 'inside_dhaka') {
      setFormData((prev) => ({ ...prev, city: 'Dhaka' }));
    } else {
      setFormData((prev) => ({ ...prev, city: prev.city === 'Dhaka' ? 'Outside Dhaka' : prev.city }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        shipping_fee: shippingFee,
      };

      const res = await api.post('/orders/checkout/', payload);
      if (res.data.success) {
        await clearCart();
        navigate(`/order-success/${res.data.order.order_number}`, {
          state: { order: res.data.order },
        });
      }
    } catch (err) {
      console.error('Checkout error:', err);
      const msg = err.response?.data?.message || 'Failed to place order. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-3xl font-black text-neutral-900 tracking-tight">
          অর্ডার সম্পন্ন করুন (Checkout & Shipping)
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          সহজ ১-পেজ চেকআউট • ক্যাশ অন ডেলিভারিতে পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন
        </p>
      </div>

      {/* Mobile Top Order Summary Accordion (GhorerBazar style) */}
      <div className="lg:hidden mb-6 bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
          className="w-full p-4 flex items-center justify-between bg-amber-50/60 text-left"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-800" />
            <span className="text-xs font-bold text-neutral-900">
              অর্ডার সামারি ({items.length} টি আইটেম)
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#1b3b2b]">
            <span>৳{total.toFixed(0)}</span>
            {mobileSummaryOpen ? (
              <ChevronUp className="w-4 h-4 text-neutral-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            )}
          </div>
        </button>

        {mobileSummaryOpen && (
          <div className="p-4 divide-y divide-neutral-100 bg-white animate-in slide-in-from-top-1">
            {items.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-12 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                    <img
                      src={item.variant?.image || 'https://placehold.co/100x120/1a1a1a/d4af37?text=KF'}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-neutral-900 truncate">{item.product_name}</p>
                    <p className="text-[10px] text-neutral-400">পরিমাণ: {item.quantity}</p>
                  </div>
                </div>
                <span className="font-bold text-neutral-900 shrink-0">
                  ৳{item.subtotal || item.variant?.price * item.quantity}
                </span>
              </div>
            ))}

            <div className="pt-3 space-y-1 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>সাবটোটাল</span>
                <span className="font-semibold text-neutral-900">৳{subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>ডেলিভারি চার্জ</span>
                <span className="font-semibold text-neutral-900">৳{shippingFee}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-neutral-900 pt-1.5 border-t border-neutral-200">
                <span>সর্বমোট</span>
                <span className="text-[#1b3b2b]">৳{total.toFixed(0)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left: Checkout Form */}
        <div className="lg:col-span-7 space-y-6">
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Customer Details */}
            <div className="bg-white p-5 sm:p-7 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                    ১. কাস্টমার ও ডেলিভারি তথ্য
                  </h2>
                  <p className="text-[11px] text-neutral-500">আপনার সঠিক তথ্য প্রদান করুন</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    আপনার নাম (Full Name) *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="যেমন: তানবীর হাসান"
                    className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:border-amber-600 bg-neutral-50/50 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    মোবাইল নাম্বার (Mobile Number) *
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="যেমন: 01700000000"
                    className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:border-amber-600 bg-neutral-50/50 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Delivery Zone Selector (GhorerBazar style) */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-2">
                  ডেলিভারি এলাকা নির্বাচন করুন *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleZoneChange('inside_dhaka')}
                    className={`p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition ${
                      deliveryZone === 'inside_dhaka'
                        ? 'border-[#1b3b2b] bg-emerald-50/60 shadow-xs'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-neutral-900 block">
                        ঢাকা সিটির ভেতরে
                      </span>
                      <span className="text-[11px] text-neutral-500">হোম ডেলিভারি (২-৩ দিন)</span>
                    </div>
                    <span className="text-xs font-black text-[#1b3b2b] bg-white px-2.5 py-1 rounded-full border border-neutral-200">
                      ৳{feeInside}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleZoneChange('outside_dhaka')}
                    className={`p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition ${
                      deliveryZone === 'outside_dhaka'
                        ? 'border-[#1b3b2b] bg-emerald-50/60 shadow-xs'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-neutral-900 block">
                        ঢাকা সিটির বাইরে
                      </span>
                      <span className="text-[11px] text-neutral-500">সমগ্র বাংলাদেশ (৩-৫ দিন)</span>
                    </div>
                    <span className="text-xs font-black text-[#1b3b2b] bg-white px-2.5 py-1 rounded-full border border-neutral-200">
                      ৳{feeOutside}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  সম্পূর্ণ ঠিকানা (Full Delivery Address) *
                </label>
                <input
                  type="text"
                  name="address_line"
                  required
                  value={formData.address_line}
                  onChange={handleChange}
                  placeholder="বাসা/হোল্ডিং নম্বর, রোড, এলাকা/গ্রাম, থানা ও জেলা"
                  className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:border-amber-600 bg-neutral-50/50 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    শহর / জেলা (City / District) *
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="যেমন: Dhaka / Chittagong / Sylhet"
                    className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:border-amber-600 bg-neutral-50/50 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    ইমেইল এড্রেস (Email - ঐচ্ছিক)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="অর্ডার রিসিপ্ট পাওয়ার জন্য"
                    className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:border-amber-600 bg-neutral-50/50 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  অর্ডারের বিশেষ নোট (Optional)
                </label>
                <textarea
                  name="notes"
                  rows="2"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="যেমন: গেট নম্বর, ডেলিভারির আগে কল করবেন ইত্যাদি..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:border-amber-600 bg-neutral-50/50 focus:bg-white transition"
                ></textarea>
              </div>
            </div>

            {/* 2. Payment Method */}
            <div className="bg-white p-5 sm:p-7 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                <div className="p-2 bg-emerald-100 text-emerald-900 rounded-xl">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                    ২. পেমেন্ট পদ্ধতি নির্বাচন করুন
                  </h2>
                  <p className="text-[11px] text-neutral-500">নিরাপদ ও সহজ পেমেন্ট</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <label
                  className={`p-4 rounded-2xl border-2 cursor-pointer flex items-start gap-3 transition ${
                    formData.payment_method === 'cod'
                      ? 'border-[#1b3b2b] bg-emerald-50/50 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="cod"
                    checked={formData.payment_method === 'cod'}
                    onChange={handleChange}
                    className="mt-1 accent-[#1b3b2b]"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-neutral-900 block">
                      ক্যাশ অন ডেলিভারি (COD)
                    </span>
                    <span className="text-[11px] text-neutral-500 leading-tight block mt-1">
                      পণ্য হাতে পেয়ে চেক করে ডেলিভারি ম্যানকে টাকা দিন
                    </span>
                  </div>
                </label>

                <label
                  className={`p-4 rounded-2xl border-2 cursor-pointer flex items-start gap-3 transition ${
                    formData.payment_method === 'online'
                      ? 'border-[#1b3b2b] bg-emerald-50/50 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="online"
                    checked={formData.payment_method === 'online'}
                    onChange={handleChange}
                    className="mt-1 accent-[#1b3b2b]"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-neutral-900 block">
                      বিকাশ / নগদ / কার্ড
                    </span>
                    <span className="text-[11px] text-neutral-500 leading-tight block mt-1">
                      ইনস্ট্যান্ট ডিজিটাল পেমেন্ট ও দ্রুত প্রসেসিং
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Desktop / In-page Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-[#1b3b2b] hover:bg-[#153224] disabled:bg-neutral-300 text-white font-extrabold text-sm sm:text-base shadow-xl active:scale-98 transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {loading ? 'অর্ডার প্রসেসিং হচ্ছে...' : `অর্ডার কনফার্ম করুন • ৳${total.toFixed(0)}`}
              </span>
            </button>
          </form>
        </div>

        {/* Right: Desktop Order Summary */}
        <div className="hidden lg:block lg:col-span-5">
          <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs sticky top-24 space-y-6">
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider pb-3 border-b border-neutral-100 flex items-center justify-between">
              <span>অর্ডার বিবরণী</span>
              <span className="text-xs text-neutral-500 font-medium">({items.length} টি পণ্য)</span>
            </h2>

            {/* Items list */}
            <div className="divide-y divide-neutral-100 max-h-80 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="py-3 flex items-center gap-3">
                  <div className="w-12 h-14 bg-neutral-100 rounded-lg overflow-hidden shrink-0 border border-neutral-200">
                    <img
                      src={item.variant?.image || 'https://placehold.co/100x120/1a1a1a/d4af37?text=KF'}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-neutral-900 truncate">
                      {item.product_name}
                    </h4>
                    <p className="text-[11px] text-neutral-400">পরিমাণ: {item.quantity}</p>
                  </div>
                  <span className="text-xs font-extrabold text-[#1b3b2b]">
                    ৳{item.subtotal || item.variant?.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-2.5 pt-4 border-t border-neutral-200 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>সাবটোটাল</span>
                <span className="font-semibold text-neutral-900">৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>ডেলিভারি চার্জ ({deliveryZone === 'inside_dhaka' ? 'ঢাকা' : 'ঢাকার বাইরে'})</span>
                <span className="font-semibold text-neutral-900">৳{shippingFee}</span>
              </div>
              <div className="flex justify-between text-base font-black text-neutral-900 pt-3 border-t border-neutral-200">
                <span>সর্বমোট পরিশোধযোগ্য</span>
                <span className="text-[#1b3b2b]">৳{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 flex items-center gap-2.5 text-[11px] text-neutral-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>১০০% নিরাপদ ডেলিভারি ও সাইজ এক্সচেঞ্জ সুবিধা।</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Confirm Bar (GhorerBazar style) */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-4 py-2.5 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
        <div>
          <span className="text-[10px] text-neutral-400 block font-medium">সর্বমোট:</span>
          <span className="text-base font-black text-[#1b3b2b]">৳{total.toFixed(0)}</span>
        </div>

        <button
          type="submit"
          form="checkout-form"
          disabled={loading}
          className="flex-1 max-w-xs py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{loading ? 'অর্ডার হচ্ছে...' : 'অর্ডার কনফার্ম করুন'}</span>
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;

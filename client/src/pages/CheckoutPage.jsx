import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useShopSettings } from '../context/ShopSettingsContext';
import api from '../api/axios';
import EmptyCartMessage from '../components/checkout/EmptyCartMessage';
import MobileOrderSummaryAccordion from '../components/checkout/MobileOrderSummaryAccordion';
import CustomerShippingForm from '../components/checkout/CustomerShippingForm';
import PaymentMethodSelector from '../components/checkout/PaymentMethodSelector';
import DesktopOrderSummary from '../components/checkout/DesktopOrderSummary';
import MobileStickyBottomBar from '../components/checkout/MobileStickyBottomBar';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, totalPrice, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const { settings } = useShopSettings();

  const feeInside = Number(settings?.delivery_inside_dhaka ?? 60);
  const feeOutside = Number(settings?.delivery_outside_dhaka ?? 120);

  const [deliveryZone, setDeliveryZone] = useState('inside_dhaka');
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

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        full_name:
          prev.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        phone: prev.phone || user.phone || '',
        email: prev.email || user.email || '',
        address_line: prev.address_line || user.address || '',
      }));
    }
  }, [user]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const subtotal = parseFloat(totalPrice) || 0;
  const shippingFee = deliveryZone === 'inside_dhaka' ? feeInside : feeOutside;
  const total = subtotal + shippingFee;

  if (items.length === 0) {
    return <EmptyCartMessage />;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleZoneChange = (zone) => {
    setDeliveryZone(zone);
    if (zone === 'inside_dhaka') {
      setFormData((prev) => ({ ...prev, city: 'Dhaka' }));
    } else {
      setFormData((prev) => ({
        ...prev,
        city: prev.city === 'Dhaka' ? 'Outside Dhaka' : prev.city,
      }));
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

      {/* Mobile Top Order Summary Accordion */}
      <MobileOrderSummaryAccordion
        items={items}
        total={total}
        subtotal={subtotal}
        shippingFee={shippingFee}
        isOpen={mobileSummaryOpen}
        onToggle={() => setMobileSummaryOpen(!mobileSummaryOpen)}
        updateQuantity={updateQuantity}
        removeItem={removeItem}
      />

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

            {/* 1. Customer & Shipping Details */}
            <CustomerShippingForm
              formData={formData}
              handleChange={handleChange}
              deliveryZone={deliveryZone}
              handleZoneChange={handleZoneChange}
              feeInside={feeInside}
              feeOutside={feeOutside}
            />

            {/* 2. Payment Method */}
            <PaymentMethodSelector
              paymentMethod={formData.payment_method}
              handleChange={handleChange}
            />

            {/* Desktop / In-page Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-[#1b3b2b] hover:bg-[#153224] disabled:bg-neutral-300 text-white font-extrabold text-sm sm:text-base shadow-xl active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {loading
                  ? 'অর্ডার প্রসেসিং হচ্ছে...'
                  : `অর্ডার কনফার্ম করুন • ৳${total.toFixed(0)}`}
              </span>
            </button>
          </form>
        </div>

        {/* Right: Desktop Order Summary */}
        <div className="hidden lg:block lg:col-span-5">
          <DesktopOrderSummary
            items={items}
            subtotal={subtotal}
            shippingFee={shippingFee}
            total={total}
            deliveryZone={deliveryZone}
            updateQuantity={updateQuantity}
            removeItem={removeItem}
          />
        </div>
      </div>

      {/* Mobile Sticky Bottom Confirm Bar */}
      <MobileStickyBottomBar total={total} loading={loading} />
    </div>
  );
};

export default CheckoutPage;

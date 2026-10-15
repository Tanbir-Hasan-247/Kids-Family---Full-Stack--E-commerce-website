import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, Phone, MapPin, Truck } from 'lucide-react';
import api from '../api/axios';

const OrderSuccessPage = () => {
  const { orderNumber } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);

  useEffect(() => {
    if (!order && orderNumber) {
      const fetchOrder = async () => {
        try {
          const res = await api.get(`/orders/${orderNumber}/`);
          setOrder(res.data);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    }
  }, [order, orderNumber]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-8">
      {/* Celebration Icon */}
      <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-in zoom-in-75 duration-300">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          ORDER RECEIVED
        </span>
        <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
          Thank You for Shopping with Us!
        </h1>
        <p className="text-xs text-neutral-500 max-w-md mx-auto">
          Your order has been recorded successfully. Our customer support team will contact you
          shortly for confirmation before dispatching.
        </p>
      </div>

      {/* Order Info Card */}
      {order && (
        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-md p-6 text-left space-y-4">
          <div className="flex flex-wrap items-center justify-between pb-4 border-b border-neutral-100 gap-2">
            <div>
              <span className="text-[11px] text-neutral-400 block">Order Number</span>
              <span className="text-base font-extrabold text-[#1b3b2b] tracking-wider">
                {order.order_number}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-neutral-400 block">Total Amount</span>
              <span className="text-base font-black text-neutral-900">৳{order.total}</span>
            </div>
          </div>

          <div className="text-xs text-neutral-600 space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <span>
                <strong>Shipping To:</strong> {order.full_name}, {order.address_line}, {order.city}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>
                <strong>Contact:</strong> {order.phone}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
        <Link
          to={orderNumber ? `/track-order/${orderNumber}` : '/track-order'}
          className="px-6 py-3 rounded-full bg-[#1b3b2b] text-white text-xs font-bold hover:bg-[#142e22] shadow-md transition flex items-center gap-2 active:scale-95"
        >
          <Truck className="w-4 h-4 text-emerald-300" />
          <span>অর্ডার ট্র্যাক করুন (Track Order)</span>
        </Link>
        <Link
          to="/products"
          className="px-6 py-3 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition flex items-center gap-2 active:scale-95"
        >
          <span>আরও কেনাকাটা করুন</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/orders"
          className="px-5 py-3 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition flex items-center gap-2 active:scale-95"
        >
          <Package className="w-4 h-4 text-neutral-500" />
          <span>অর্ডার হিস্ট্রি</span>
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccessPage;


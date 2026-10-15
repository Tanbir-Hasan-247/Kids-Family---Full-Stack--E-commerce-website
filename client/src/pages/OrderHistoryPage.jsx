import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Calendar,
  Clock,
  ChevronRight,
  Printer,
  Search,
  Truck,
  CheckCircle2,
  AlertCircle,
  Boxes,
  MapPin,
  ArrowRight,
  ShoppingBag,
  Copy,
  Check,
  TrendingUp
} from 'lucide-react';
import api, { formatImageUrl } from '../api/axios';
import OrderInvoiceModal from '../components/admin/OrderInvoiceModal';
import VariantBadges from '../components/common/VariantBadges';

const getStatusBadge = (status) => {
  switch (status) {
    case 'delivered':
      return {
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        label: 'ডেলিভারি সম্পন্ন',
        icon: CheckCircle2,
      };
    case 'shipped':
      return {
        bg: 'bg-blue-100 text-blue-800 border-blue-200',
        label: 'ডেলিভারির পথে',
        icon: Truck,
      };
    case 'processing':
      return {
        bg: 'bg-purple-100 text-purple-800 border-purple-200',
        label: 'প্যাকিং চলছে',
        icon: Boxes,
      };
    case 'confirmed':
      return {
        bg: 'bg-teal-100 text-teal-800 border-teal-200',
        label: 'অর্ডার নিশ্চিত',
        icon: CheckCircle2,
      };
    case 'cancelled':
      return {
        bg: 'bg-rose-100 text-rose-800 border-rose-200',
        label: 'বাতিল করা হয়েছে',
        icon: AlertCircle,
      };
    default:
      return {
        bg: 'bg-amber-100 text-amber-800 border-amber-200',
        label: 'অপেক্ষমান (Pending)',
        icon: Clock,
      };
  }
};

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [trackSearchQuery, setTrackSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/');
        setOrders(res.data?.results || res.data || []);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (trackSearchQuery.trim()) {
      navigate(`/track-order?query=${encodeURIComponent(trackSearchQuery.trim())}`);
    }
  };

  const handleCopyOrderNumber = (e, orderNumber) => {
    e.stopPropagation();
    navigator.clipboard.writeText(orderNumber);
    setCopiedId(orderNumber);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const pendingCount = orders.filter(
    (o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'processing'
  ).length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Header & Fast Track Search Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/70 text-amber-900 text-xs font-bold mb-2">
            <Package className="w-3.5 h-3.5 text-amber-800" />
            <span>অর্ডার হিস্ট্রি ও ট্র্যাকিং</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            আমার অর্ডারসমূহ
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            আপনার সকল অর্ডারের তালিকা দেখুন অথবা যেকোনো অর্ডারে ক্লিক করে বিস্তারিত লাইভ ট্র্যাকিং দেখুন।
          </p>
        </div>

        {/* Quick Track Input in Header */}
        <form onSubmit={handleTrackSubmit} className="flex gap-2 max-w-sm w-full">
          <div className="relative flex-1">
            <input
              type="text"
              value={trackSearchQuery}
              onChange={(e) => setTrackSearchQuery(e.target.value)}
              placeholder="অর্ডার নাম্বার বা ফোন নম্বর দিন..."
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-white rounded-xl border border-neutral-300 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 shadow-2xs placeholder:text-neutral-400"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3 pointer-events-none" />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#1b3b2b] hover:bg-[#142e22] text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>ট্র্যাক</span>
          </button>
        </form>
      </div>

      {/* Stats Summary Bar */}
      {orders.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-neutral-200/90 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-neutral-100 text-[#1b3b2b]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 font-medium block">মোট অর্ডার</span>
              <span className="text-base sm:text-lg font-black text-neutral-900">{orders.length} টি</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-200/90 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 font-medium block">প্রসেসিংয়ে আছে</span>
              <span className="text-base sm:text-lg font-black text-amber-800">{pendingCount} টি</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-200/90 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 font-medium block">ডেলিভারি সম্পন্ন</span>
              <span className="text-base sm:text-lg font-black text-emerald-800">{deliveredCount} টি</span>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 bg-neutral-200/70 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-neutral-200/80 p-8 space-y-5 shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-neutral-900">আপনার কোনো অর্ডার পাওয়া যায়নি</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              আপনি এখনো কোনো অর্ডার করেননি, অথবা পূর্বে কোনো ফোন নম্বর দিয়ে অর্ডার করে থাকলে সরাসরি ট্র্যাক অপশন ব্যবহার করুন।
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              to="/products"
              className="px-6 py-2.5 bg-[#1b3b2b] text-white rounded-full text-xs font-bold hover:bg-[#142e22] shadow-sm transition active:scale-95"
            >
              কেনাকাটা শুরু করুন
            </Link>
            <Link
              to="/track-order"
              className="px-6 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-full text-xs font-bold transition active:scale-95 flex items-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>গেস্ট অর্ডার ট্র্যাক করুন</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const badge = getStatusBadge(order.status);
            const BadgeIcon = badge.icon;

            return (
              <div
                key={order.id}
                onClick={() => navigate(`/track-order/${order.order_number}`)}
                className="group bg-white rounded-3xl border border-neutral-200/90 shadow-2xs hover:shadow-lg hover:border-amber-400 transition-all duration-300 p-5 sm:p-6 space-y-4 cursor-pointer relative overflow-hidden"
              >
                {/* Top Bar: Order ID, Date, Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-neutral-100">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-base sm:text-lg font-black text-[#1b3b2b] tracking-wider group-hover:text-amber-800 transition">
                      {order.order_number}
                    </span>
                    <button
                      onClick={(e) => handleCopyOrderNumber(e, order.order_number)}
                      className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md hover:bg-neutral-100 transition"
                      title="অর্ডার আইডি কপি করুন"
                    >
                      {copiedId === order.order_number ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-0.5 rounded-full border ${badge.bg}`}
                    >
                      <BadgeIcon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                      <span>
                        {new Date(order.created_at).toLocaleDateString('bn-BD', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInvoiceOrder(order);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
                      title="চালান / মেমো প্রিন্ট করুন"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-700" />
                      <span>মেমো প্রিন্ট</span>
                    </button>
                  </div>
                </div>

                {/* Cancellation Notice if Order is Cancelled */}
                {order.status === 'cancelled' && (
                  <div className="bg-rose-50 border border-rose-200 text-xs rounded-2xl p-3 flex items-start gap-2 text-rose-900 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold text-rose-800">অর্ডারটি বাতিল করা হয়েছে।</strong>
                      {order.cancel_reason && (
                        <p className="text-[11px] text-rose-700 mt-0.5">
                          <strong>বাতিলের কারণ:</strong> {order.cancel_reason}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Items Preview with Images & Variant Badges */}
                <div className="space-y-2.5">
                  {order.items?.map((item) => {
                    const imgUrl = formatImageUrl(item.image);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 bg-neutral-50/70 p-2.5 sm:p-3 rounded-2xl border border-neutral-100"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200/80 overflow-hidden shrink-0 flex items-center justify-center">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={item.product_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <Package className="w-5 h-5 text-neutral-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                              {item.product_name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              {item.attributes && item.attributes.length > 0 && (
                                <VariantBadges
                                  variant={{ attributes: item.attributes, sku: item.variant_sku }}
                                  showSku={false}
                                />
                              )}
                              <span className="text-[11px] text-neutral-500">
                                পরিমাণঃ <strong className="text-neutral-800">{item.quantity}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs sm:text-sm font-bold text-neutral-900">
                            ৳{item.subtotal || item.price * item.quantity}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Delivery Preview */}
                <div className="flex items-center gap-2 text-xs text-neutral-500 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate">
                    প্রাপক: <strong>{order.full_name}</strong> ({order.phone}), {order.address_line}, {order.city}
                  </span>
                </div>

                {/* Bottom Bar: Payment, Total, and Click-to-Track CTA */}
                <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-neutral-500">পেমেন্টঃ</span>
                    <span className="font-bold text-neutral-800 uppercase">
                      {order.payment_method_display || order.payment_method}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded-md uppercase ${
                        order.payment_status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.payment_status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-neutral-400 block font-medium">সর্বমোট মূল্য</span>
                      <span className="text-base sm:text-lg font-black text-[#1b3b2b]">
                        ৳{order.total}
                      </span>
                    </div>

                    <Link
                      to={`/track-order/${order.order_number}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1b3b2b] hover:bg-[#142e22] text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 group-hover:bg-amber-600"
                    >
                      <span>অর্ডার ট্র্যাক করুন</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* INVOICE MODAL */}
      <OrderInvoiceModal
        order={invoiceOrder}
        isOpen={Boolean(invoiceOrder)}
        onClose={() => setInvoiceOrder(null)}
      />
    </div>
  );
};

export default OrderHistoryPage;

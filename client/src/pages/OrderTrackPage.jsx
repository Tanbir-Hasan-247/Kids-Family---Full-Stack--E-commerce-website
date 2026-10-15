import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  MapPin,
  Phone,
  Copy,
  Check,
  Printer,
  ShoppingBag,
  MessageCircle,
  ArrowRight,
  ShieldAlert,
  Boxes,
  User,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import api, { formatImageUrl } from '../api/axios';
import VariantBadges from '../components/common/VariantBadges';
import OrderInvoiceModal from '../components/admin/OrderInvoiceModal';
import { useShopSettings } from '../context/ShopSettingsContext';

const STATUS_STEPS = [
  {
    key: 'pending',
    label: 'অর্ডার প্লেসড',
    sublabel: 'অর্ডারটি সফলভাবে গৃহীত হয়েছে',
    icon: Clock,
  },
  {
    key: 'confirmed',
    label: 'অর্ডার কনফার্ম',
    sublabel: 'তথ্য যাচাই করে অর্ডারটি নিশ্চিত করা হয়েছে',
    icon: CheckCircle2,
  },
  {
    key: 'processing',
    label: 'প্যাকিং ও প্রস্তুত',
    sublabel: 'পণ্য কোয়ালিটি চেক ও প্যাকিং সম্পন্ন হচ্ছে',
    icon: Boxes,
  },
  {
    key: 'shipped',
    label: 'কুরিয়ারে হস্তান্তর',
    sublabel: 'পার্সেলটি আপনার ঠিকানায় প্রেরণের পথে আছে',
    icon: Truck,
  },
  {
    key: 'delivered',
    label: 'ডেলিভারি সম্পন্ন',
    sublabel: 'পণ্যটি আপনার হাতে সফলভাবে পৌঁছে দেওয়া হয়েছে',
    icon: Package,
  },
];

const getStatusIndex = (status) => {
  switch (status) {
    case 'pending':
      return 0;
    case 'confirmed':
      return 1;
    case 'processing':
      return 2;
    case 'shipped':
      return 3;
    case 'delivered':
      return 4;
    case 'cancelled':
      return -1;
    default:
      return 0;
  }
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'delivered':
      return {
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        label: 'ডেলিভারি সম্পন্ন (Delivered)',
        icon: CheckCircle2,
      };
    case 'shipped':
      return {
        bg: 'bg-blue-100 text-blue-800 border-blue-200',
        label: 'কুরিয়ারে হস্তান্তর / পথে (Shipped)',
        icon: Truck,
      };
    case 'processing':
      return {
        bg: 'bg-purple-100 text-purple-800 border-purple-200',
        label: 'প্যাকিং চলছে (Processing)',
        icon: Boxes,
      };
    case 'confirmed':
      return {
        bg: 'bg-teal-100 text-teal-800 border-teal-200',
        label: 'অর্ডার কনফার্ম (Confirmed)',
        icon: CheckCircle2,
      };
    case 'cancelled':
      return {
        bg: 'bg-rose-100 text-rose-800 border-rose-200',
        label: 'অর্ডার বাতিল (Cancelled)',
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

const OrderTrackPage = () => {
  const { orderNumber } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings } = useShopSettings();

  const initialQuery = orderNumber || searchParams.get('query') || '';
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [ordersFound, setOrdersFound] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const fetchTrack = async (query) => {
    if (!query || !query.trim()) {
      setErrorMessage('অনুগ্রহ করে অর্ডার আইডি অথবা মোবাইল নম্বর লিখুন।');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSearched(true);

    try {
      const res = await api.get(`/orders/track/?query=${encodeURIComponent(query.trim())}`);
      const orders = res.data?.orders || [];
      if (orders.length > 0) {
        setOrdersFound(orders);
        // If orderNumber in url matches one, pick that, else pick the first
        const matched = orders.find(
          (o) => o.order_number.toLowerCase() === query.trim().toLowerCase()
        );
        setActiveOrder(matched || orders[0]);
      } else {
        setOrdersFound([]);
        setActiveOrder(null);
        setErrorMessage(res.data?.message || 'কোনো অর্ডার পাওয়া যায়নি।');
      }
    } catch (err) {
      setOrdersFound([]);
      setActiveOrder(null);
      setErrorMessage(
        err.response?.data?.message ||
          'অর্ডারটি খুঁজে পাওয়া যায়নি। অনুগ্রহ করে সঠিক অর্ডার আইডি বা মোবাইল নম্বর দিন।'
      );
    } finally {
      setLoading(false);
    }
  };

  // Auto search on mount or url change
  useEffect(() => {
    const q = orderNumber || searchParams.get('query');
    if (q) {
      setSearchInput(q);
      fetchTrack(q);
    }
  }, [orderNumber, searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSearchParams({ query: searchInput.trim() });
    fetchTrack(searchInput.trim());
  };

  const handleCopyOrderNumber = () => {
    if (!activeOrder) return;
    navigator.clipboard.writeText(activeOrder.order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentStepIdx = activeOrder ? getStatusIndex(activeOrder.status) : 0;
  const isCancelled = activeOrder?.status === 'cancelled';
  const statusBadge = activeOrder ? getStatusBadge(activeOrder.status) : null;
  const supportPhone = settings?.phone || '+8801700000000';
  const whatsappNumber = (settings?.whatsapp_number || settings?.phone || '8801700000000').replace(/[^\d]/g, '');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold tracking-wide">
          <Truck className="w-3.5 h-3.5 text-emerald-700" />
          <span>লাইভ অর্ডার ট্র্যাকিং</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-neutral-900 tracking-tight">
          অর্ডার ট্র্যাক করুন
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-lg mx-auto">
          আপনার অর্ডার নাম্বার (যেমনঃ <span className="font-semibold text-neutral-700">KF2610137748</span>) অথবা যে মোবাইল নম্বর দিয়ে অর্ডার করেছেন তা দিয়ে সহজেই অর্ডারের বর্তমান অবস্থা দেখুন।
        </p>
      </div>

      {/* Search Bar Card */}
      <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-4 sm:p-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="অর্ডার নাম্বার (KF...) বা মোবাইল নম্বর দিন (০১৮৭৬...)"
              className="w-full pl-11 pr-4 py-3.5 bg-neutral-50/90 rounded-2xl border border-neutral-200 text-sm font-medium focus:bg-white focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-neutral-400"
            />
            <Search className="w-5 h-5 text-neutral-400 absolute left-3.5 top-4 pointer-events-none" />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-3.5 top-3.5 text-xs text-neutral-400 hover:text-neutral-700 p-1 rounded-full"
              >
                মুছুন
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 bg-[#1b3b2b] hover:bg-[#142e22] active:scale-98 text-white rounded-2xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>খোঁজা হচ্ছে...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>ট্র্যাক করুন</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Help / Examples */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-500 pt-3 border-t border-neutral-100">
          <span>
            💡 টিপসঃ অর্ডার কনফার্মেশন এসএমএস বা চালানে প্রাপ্ত নম্বরটি ব্যবহার করুন।
          </span>
          <Link to="/orders" className="text-amber-700 font-bold hover:underline flex items-center gap-1">
            <span>সব অর্ডারের ইতিহাস দেখুন</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Error / Not Found Message */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-3 animate-in fade-in">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-rose-900">অর্ডার খুঁজে পাওয়া যায়নি</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{errorMessage}</p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <a
              href={`tel:${supportPhone}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-neutral-800 border border-rose-200 rounded-xl text-xs font-bold shadow-2xs hover:bg-rose-100 transition"
            >
              <Phone className="w-3.5 h-3.5 text-rose-600" />
              <span>সহায়তার জন্য কল করুন</span>
            </a>
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello, I could not track my order with query: ${searchInput}`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-2xs hover:bg-emerald-700 transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp সাপোর্ট</span>
            </a>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 bg-neutral-200 rounded-3xl" />
          <div className="h-44 bg-neutral-200 rounded-3xl" />
          <div className="h-60 bg-neutral-200 rounded-3xl" />
        </div>
      )}

      {/* Multiple Orders Tabs (when searching by Phone Number) */}
      {!loading && ordersFound.length > 1 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-amber-950">
            <span>এই মোবাইল নম্বরে {ordersFound.length} টি অর্ডার পাওয়া গেছে:</span>
            <span className="text-[11px] text-amber-800">যেকোনো একটি নির্বাচন করুন</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {ordersFound.map((ord) => {
              const isSelected = activeOrder?.id === ord.id;
              return (
                <button
                  key={ord.id}
                  onClick={() => setActiveOrder(ord)}
                  type="button"
                  className={`text-left p-3 rounded-xl border transition-all text-xs cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-[#1b3b2b] text-white border-[#1b3b2b] shadow-md ring-2 ring-amber-400'
                      : 'bg-white text-neutral-800 border-amber-200 hover:border-amber-400 hover:bg-amber-100/50'
                  }`}
                >
                  <div className="flex justify-between items-center font-extrabold">
                    <span>{ord.order_number}</span>
                    <span
                      className={`text-[10px] px-2 py-0.2 rounded-full uppercase ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {ord.status_display || ord.status}
                    </span>
                  </div>
                  <div className={`text-[11px] flex justify-between ${isSelected ? 'text-emerald-200' : 'text-neutral-500'}`}>
                    <span>{new Date(ord.created_at).toLocaleDateString()}</span>
                    <span className="font-bold">৳{ord.total}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Order Details */}
      {!loading && activeOrder && (
        <div className="space-y-6">
          {/* Card 1: Order Banner & Status Header */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-neutral-100">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  অর্ডার নাম্বার
                </span>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-[#1b3b2b] tracking-wider">
                    {activeOrder.order_number}
                  </h2>
                  <button
                    onClick={handleCopyOrderNumber}
                    className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 transition active:scale-95"
                    title="কপি করুন"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  {copied && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 animate-in fade-in">
                      কপি হয়েছে!
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {statusBadge && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border ${statusBadge.bg}`}
                  >
                    <statusBadge.icon className="w-3.5 h-3.5" />
                    <span>{statusBadge.label}</span>
                  </span>
                )}
                <button
                  onClick={() => setInvoiceModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
                  title="প্রিন্ট মেমো / চালান"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-700" />
                  <span>চালান / মেমো</span>
                </button>
              </div>
            </div>

            {/* Cancelled Alert Banner */}
            {isCancelled ? (
              <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 sm:p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-black text-rose-900">এই অর্ডারটি বাতিল করা হয়েছে</h3>
                  <p className="text-xs text-rose-600">
                    অর্ডার স্ট্যাটাসঃ <strong className="font-bold">বাতিল (Cancelled)</strong>
                  </p>
                </div>

                {activeOrder.cancel_reason ? (
                  <div className="bg-white border border-rose-200 rounded-2xl p-4 max-w-lg mx-auto text-left shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>বাতিলের কারণ / নোট (Reason for Cancellation):</span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-neutral-800 whitespace-pre-line pl-5.5">
                      {activeOrder.cancel_reason}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-rose-700 max-w-md mx-auto">
                    অর্ডারটি বাতিল সংক্রান্ত কোনো তথ্য জানতে বা পুনরায় অর্ডার করতে আমাদের হেল্পলাইনে যোগাযোগ করুন।
                  </p>
                )}
              </div>
            ) : (
              /* Visual 5-Step Stepper */
              <div className="pt-2">
                <div className="hidden sm:block relative mb-8">
                  {/* Progress Line */}
                  <div className="absolute top-5 left-8 right-8 h-1 bg-neutral-200 -z-0">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, (currentStepIdx / (STATUS_STEPS.length - 1)) * 100))}%`,
                      }}
                    />
                  </div>

                  {/* Desktop Step Circles */}
                  <div className="relative z-10 flex justify-between">
                    {STATUS_STEPS.map((step, idx) => {
                      const isCompleted = idx <= currentStepIdx;
                      const isCurrent = idx === currentStepIdx;
                      const StepIcon = step.icon;

                      return (
                        <div key={step.key} className="flex flex-col items-center text-center max-w-[120px]">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                              isCompleted
                                ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100'
                                : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                            } ${isCurrent ? 'scale-110 ring-4 ring-amber-200 bg-emerald-700' : ''}`}
                          >
                            <StepIcon className="w-4 h-4" />
                          </div>
                          <span
                            className={`text-xs mt-2 font-bold ${
                              isCurrent
                                ? 'text-emerald-800'
                                : isCompleted
                                ? 'text-neutral-800'
                                : 'text-neutral-400'
                            }`}
                          >
                            {step.label}
                          </span>
                          <span className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                            {step.sublabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile Vertical Stepper */}
                <div className="sm:hidden space-y-4 pl-2">
                  {STATUS_STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    const StepIcon = step.icon;

                    return (
                      <div key={step.key} className="flex items-start gap-3 relative">
                        {idx < STATUS_STEPS.length - 1 && (
                          <div
                            className={`absolute left-4 top-8 bottom-0 w-0.5 -ml-[1px] ${
                              idx < currentStepIdx ? 'bg-emerald-600' : 'bg-neutral-200'
                            }`}
                          />
                        )}
                        <div
                          className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold z-10 transition ${
                            isCompleted
                              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-100'
                              : 'bg-neutral-100 text-neutral-400 border'
                          } ${isCurrent ? 'ring-3 ring-amber-300' : ''}`}
                        >
                          <StepIcon className="w-4 h-4" />
                        </div>
                        <div className="pb-3">
                          <h4
                            className={`text-xs font-bold ${
                              isCurrent
                                ? 'text-emerald-800 font-extrabold'
                                : isCompleted
                                ? 'text-neutral-800'
                                : 'text-neutral-400'
                            }`}
                          >
                            {step.label}
                          </h4>
                          <p className="text-[11px] text-neutral-500 mt-0.5">{step.sublabel}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Two Columns Grid - Recipient Details & Payment Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Delivery Details */}
            <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-extrabold text-neutral-900">ডেলিভারির তথ্য (Delivery Details)</h3>
              </div>
              <div className="space-y-2 text-xs text-neutral-700">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="font-bold text-neutral-900">{activeOrder.full_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <a href={`tel:${activeOrder.phone}`} className="text-[#1b3b2b] font-bold hover:underline">
                    {activeOrder.phone}
                  </a>
                </div>
                <div className="flex items-start gap-2 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                  <span className="text-neutral-600">
                    {activeOrder.address_line}, {activeOrder.city}
                  </span>
                </div>
                {activeOrder.notes && (
                  <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-100 text-[11px] text-neutral-600">
                    <strong>কাস্টমার নোট:</strong> {activeOrder.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Payment & Order Summary */}
            <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                <Calendar className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-extrabold text-neutral-900">পেমেন্ট ও অর্ডারের সারসংক্ষেপ</h3>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">অর্ডারের তারিখ:</span>
                  <span className="font-semibold text-neutral-800">
                    {new Date(activeOrder.created_at).toLocaleString('bn-BD', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">পেমেন্ট মেথড:</span>
                  <span className="font-bold text-neutral-900 uppercase">
                    {activeOrder.payment_method_display || activeOrder.payment_method}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">পেমেন্ট স্ট্যাটাস:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-md text-[10px] uppercase ${
                      activeOrder.payment_status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {activeOrder.payment_status === 'paid' ? 'পরিশোধিত (Paid)' : 'পরিশোধযোগ্য (Unpaid)'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
                  <span className="font-bold text-neutral-700">সর্বমোট প্রদেয়:</span>
                  <span className="text-lg font-black text-[#1b3b2b]">৳{activeOrder.total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Ordered Items Table & Calculation */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 bg-neutral-50/60 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#1b3b2b]" />
                <h3 className="text-sm font-extrabold text-neutral-900">
                  অর্ডারকৃত পণ্যের তালিকা ({activeOrder.items?.length || 0} টি আইটেম)
                </h3>
              </div>
            </div>

            <div className="divide-y divide-neutral-100 p-4 sm:p-6 space-y-4">
              {activeOrder.items?.map((item) => {
                const imgUrl = formatImageUrl(item.image);
                return (
                  <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-3 sm:gap-4">
                    {/* Item Image */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200/80 flex items-center justify-center">
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
                        <Package className="w-6 h-6 text-neutral-400" />
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                        {item.product_name}
                      </h4>
                      {/* Variant badges */}
                      {item.attributes && item.attributes.length > 0 && (
                        <VariantBadges
                          variant={{ attributes: item.attributes, sku: item.variant_sku }}
                          showSku={false}
                          className="mt-1"
                        />
                      )}
                      <div className="text-xs text-neutral-500">
                        পরিমাণঃ <strong className="text-neutral-800">{item.quantity}</strong> × ৳{item.price}
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-sm font-extrabold text-[#1b3b2b]">
                        ৳{item.subtotal || item.price * item.quantity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price Breakdown Footer */}
            <div className="bg-neutral-50 p-5 sm:p-6 border-t border-neutral-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>পণ্যের মোট মূল্য (Subtotal):</span>
                <span className="font-semibold text-neutral-900">৳{activeOrder.subtotal}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>ডেলিভারি চার্জ (Shipping Fee):</span>
                <span className="font-semibold text-neutral-900">৳{activeOrder.shipping_fee}</span>
              </div>
              <div className="flex justify-between text-base font-black text-neutral-900 pt-2 border-t border-neutral-200">
                <span>সর্বমোট পরিশোধযোগ্য (Grand Total):</span>
                <span className="text-[#1b3b2b]">৳{activeOrder.total}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Action & Support Hub */}
          <div className="bg-gradient-to-br from-amber-50/60 to-emerald-50/60 rounded-3xl border border-amber-200/70 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-extrabold text-neutral-900">
                অর্ডার নিয়ে কোনো প্রশ্ন বা পরিবর্তন প্রয়োজন?
              </h4>
              <p className="text-xs text-neutral-600">
                আমাদের কাস্টমার কেয়ার টিম সকাল ১০টা থেকে রাত ১০টা পর্যন্ত সক্রিয় আছে।
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello, I have an inquiry about my order ${activeOrder.order_number}`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp মেসেজ</span>
              </a>
              <a
                href={`tel:${supportPhone}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1b3b2b] hover:bg-[#142e22] text-white text-xs font-bold shadow-md transition active:scale-95"
              >
                <Phone className="w-4 h-4" />
                <span>কল করুন</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE MODAL */}
      <OrderInvoiceModal
        order={activeOrder}
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
      />
    </div>
  );
};

export default OrderTrackPage;


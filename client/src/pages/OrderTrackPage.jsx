import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Printer,
  Boxes,
} from 'lucide-react';
import api from '../api/axios';
import OrderInvoiceModal from '../components/admin/OrderInvoiceModal';
import { useShopSettings } from '../context/ShopSettingsContext';
import TrackSearchBar from '../components/track/TrackSearchBar';
import TrackErrorState from '../components/track/TrackErrorState';
import TrackMultiOrdersTabs from '../components/track/TrackMultiOrdersTabs';
import TrackStatusStepper, { getStatusIndex } from '../components/track/TrackStatusStepper';
import TrackRecipientAndPayment from '../components/track/TrackRecipientAndPayment';
import TrackOrderedItemsList from '../components/track/TrackOrderedItemsList';
import TrackSupportHub from '../components/track/TrackSupportHub';

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
  const { settings } = useShopSettings();

  const initialQuery = orderNumber || searchParams.get('query') || '';
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
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

    try {
      const res = await api.get(
        `/orders/track/?query=${encodeURIComponent(query.trim())}`
      );
      const orders = res.data?.orders || [];
      if (orders.length > 0) {
        setOrdersFound(orders);
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
  const whatsappNumber = (
    settings?.whatsapp_number ||
    settings?.phone ||
    '8801700000000'
  ).replace(/[^\d]/g, '');

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
          আপনার অর্ডার নাম্বার (যেমনঃ{' '}
          <span className="font-semibold text-neutral-700">KF2610137748</span>) অথবা যে
          মোবাইল নম্বর দিয়ে অর্ডার করেছেন তা দিয়ে সহজেই অর্ডারের বর্তমান অবস্থা দেখুন।
        </p>
      </div>

      {/* Search Bar Card */}
      <TrackSearchBar
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        handleSearchSubmit={handleSearchSubmit}
        loading={loading}
      />

      {/* Error / Not Found Message */}
      <TrackErrorState
        errorMessage={errorMessage}
        supportPhone={supportPhone}
        whatsappNumber={whatsappNumber}
        searchInput={searchInput}
      />

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 bg-neutral-200 rounded-3xl" />
          <div className="h-44 bg-neutral-200 rounded-3xl" />
          <div className="h-60 bg-neutral-200 rounded-3xl" />
        </div>
      )}

      {/* Multiple Orders Tabs */}
      {!loading && (
        <TrackMultiOrdersTabs
          ordersFound={ordersFound}
          activeOrder={activeOrder}
          setActiveOrder={setActiveOrder}
        />
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
                    className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 transition active:scale-95 cursor-pointer"
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

            {/* Status Stepper / Cancelled Alert */}
            <TrackStatusStepper
              activeOrder={activeOrder}
              isCancelled={isCancelled}
              currentStepIdx={currentStepIdx}
            />
          </div>

          {/* Card 2: Recipient Details & Payment Status */}
          <TrackRecipientAndPayment activeOrder={activeOrder} />

          {/* Card 3: Ordered Items Table & Calculation */}
          <TrackOrderedItemsList activeOrder={activeOrder} />

          {/* Card 4: Action & Support Hub */}
          <TrackSupportHub
            activeOrder={activeOrder}
            whatsappNumber={whatsappNumber}
            supportPhone={supportPhone}
          />
        </div>
      )}

      {/* Invoice Modal */}
      <OrderInvoiceModal
        order={activeOrder}
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
      />
    </div>
  );
};

export default OrderTrackPage;

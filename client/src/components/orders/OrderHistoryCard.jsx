import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Printer,
  Truck,
  CheckCircle2,
  AlertCircle,
  Boxes,
  MapPin,
  ArrowRight,
  Package,
  Copy,
  Check,
  Clock,
} from 'lucide-react';
import { formatImageUrl } from '../../api/axios';
import VariantBadges from '../common/VariantBadges';

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

const OrderHistoryCard = ({
  order,
  copiedId,
  onCopyOrderNumber,
  onPrintInvoice,
}) => {
  const navigate = useNavigate();
  const badge = getStatusBadge(order.status);
  const BadgeIcon = badge.icon;

  return (
    <div
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
            onClick={(e) => onCopyOrderNumber(e, order.order_number)}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md hover:bg-neutral-100 transition cursor-pointer"
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
              onPrintInvoice(order);
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
};

export default OrderHistoryCard;


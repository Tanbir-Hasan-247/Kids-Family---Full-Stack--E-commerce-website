import React from 'react';
import {
  X,
  Printer,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { STATUS_OPTIONS } from './OrderFilterBar';

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
  { value: 'refunded', label: 'Refunded' },
];

const CANCEL_REASON_CHIPS = [
  'গ্রাহকের অনুরোধে বাতিল',
  'পণ্য স্টকে নেই (Stock Out)',
  'ভুল নম্বর / ফোন রিসিভ করেনি',
  'ঠিকানা অস্পষ্ট / সার্ভিসের বাইরে',
  'ডুপ্লিকেট অর্ডার',
];

export default function OrderDetailModal({
  order,
  onClose,
  onOpenInvoice,
  editStatus,
  setEditStatus,
  editPaymentStatus,
  setEditPaymentStatus,
  editCancelReason,
  setEditCancelReason,
  handleStatusUpdate,
  updatingStatus,
  updateSuccess,
}) {
  if (!order) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto backdrop-blur-xs overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative bg-white rounded-3xl p-5 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl my-3 sm:my-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Mobile-Friendly Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md pb-4 pt-1 border-b border-neutral-100 flex items-center justify-between -mt-1">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
              অর্ডার বিস্তারিত ও স্ট্যাটাস
            </span>
            <h3 className="text-base sm:text-xl font-mono font-black text-neutral-900 truncate">
              {order.order_number}
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenInvoice(order)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
              title="Print Invoice / চালান"
            >
              <Printer className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">প্রিন্ট চালান</span>
              <span className="sm:hidden">চালান</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 transition active:scale-90 cursor-pointer shadow-2xs"
              aria-label="Close modal"
              title="বন্ধ করুন (Close)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {updateSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{updateSuccess}</span>
          </div>
        )}

        {/* Cancelled Banner if Order is Cancelled */}
        {order.status === 'cancelled' && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-2 font-black text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>এই অর্ডারটি বাতিল করা হয়েছে (Cancelled Order)</span>
            </div>
            {order.cancel_reason ? (
              <div className="pl-6 text-rose-950 font-medium">
                <span className="font-bold text-rose-700">বাতিলের কারণ / নোট: </span>
                <span>{order.cancel_reason}</span>
              </div>
            ) : (
              <p className="pl-6 text-rose-500 italic">কোনো কারণ উল্লেখ করা হয়নি।</p>
            )}
          </div>
        )}

        {/* Customer & Shipping Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-xs">
          <div>
            <span className="text-neutral-400 font-bold block mb-1">Customer</span>
            <p className="font-bold text-neutral-900">{order.full_name}</p>
            <p className="text-neutral-600 mt-0.5">{order.phone}</p>
            {order.email && <p className="text-neutral-600">{order.email}</p>}
          </div>

          <div>
            <span className="text-neutral-400 font-bold block mb-1">Shipping Address</span>
            <p className="text-neutral-800 font-medium">{order.address_line}</p>
            <p className="text-neutral-600 mt-0.5">{order.city}</p>
            {order.notes && (
              <p className="text-amber-700 italic mt-1 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                Note: {order.notes}
              </p>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
            Purchased Items
          </h4>
          <div className="border border-neutral-100 rounded-2xl overflow-hidden divide-y divide-neutral-100">
            {order.items?.map((item) => (
              <div
                key={item.id}
                className="p-3.5 flex items-center justify-between text-xs hover:bg-neutral-50/60"
              >
                <div>
                  <p className="font-bold text-neutral-900">{item.product_name}</p>
                  <p className="text-neutral-400 text-[11px] mt-0.5">
                    SKU: {item.variant_sku || 'N/A'} &middot; Qty: {item.quantity} &times; ৳
                    {item.price}
                  </p>
                </div>
                <p className="font-black text-neutral-900">
                  ৳{Number(item.subtotal || item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Subtotal & Total */}
          <div className="pt-2 px-2 space-y-1.5 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>৳{Number(order.subtotal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping Fee:</span>
              <span>৳{Number(order.shipping_fee || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-neutral-900 pt-2 border-t border-neutral-100">
              <span>Total Amount:</span>
              <span>৳{Number(order.total).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Order Status Update Controls */}
        <form
          onSubmit={handleStatusUpdate}
          className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-4"
        >
          <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
            Update Status
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Order Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-semibold bg-white focus:outline-none focus:border-[#1b3b2b]"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Payment Status
              </label>
              <select
                value={editPaymentStatus}
                onChange={(e) => setEditPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-semibold bg-white focus:outline-none focus:border-[#1b3b2b]"
              >
                {PAYMENT_STATUS_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cancellation Note input when status is 'cancelled' */}
          {editStatus === 'cancelled' && (
            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-rose-900">
                  অর্ডার বাতিলের কারণ / নোট (Cancellation Note)
                </label>
                <span className="text-[10px] text-rose-600 font-medium">
                  কাস্টমারকে ট্র্যাকিংয়ে দেখানো হবে
                </span>
              </div>

              {/* Quick suggestion chips */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {CANCEL_REASON_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setEditCancelReason(chip)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                      editCancelReason === chip
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : 'bg-white text-neutral-700 border-rose-200 hover:bg-rose-100/60'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                value={editCancelReason}
                onChange={(e) => setEditCancelReason(e.target.value)}
                placeholder="বাতিলের কারণ লিখুন (যেমনঃ গ্রাহকের অনুরোধে অথবা স্টক শেষ)..."
                className="w-full px-3 py-2 text-xs bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 text-neutral-800 placeholder:text-neutral-400"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-200/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 font-bold text-xs transition active:scale-95 cursor-pointer shadow-2xs"
            >
              বন্ধ করুন (Close)
            </button>
            <button
              type="submit"
              disabled={updatingStatus}
              className="px-5 sm:px-6 py-2.5 rounded-xl bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {updatingStatus ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>সেভ হচ্ছে...</span>
                </>
              ) : (
                <span>Save Order Status</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

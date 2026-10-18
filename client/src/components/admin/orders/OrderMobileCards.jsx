import React from 'react';
import { Printer } from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';

export default function OrderMobileCards({
  orders,
  loading,
  onOpenDetail,
  onOpenInvoice,
}) {
  return (
    <div className="md:hidden space-y-3">
      {loading ? (
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-8 text-center text-xs text-neutral-400">
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-8 text-center text-xs text-neutral-400">
          No orders found matching the filter.
        </div>
      ) : (
        orders.map((o) => (
          <div
            key={o.order_number}
            onClick={() => onOpenDetail(o)}
            className="bg-white border border-neutral-200/80 rounded-2xl p-3.5 shadow-xs space-y-3 cursor-pointer hover:border-neutral-300 transition"
          >
            {/* Header: Order #, Date, Status */}
            <div className="flex items-start justify-between gap-2 border-b border-neutral-100 pb-2.5">
              <div>
                <span className="font-mono font-bold text-xs text-neutral-900 block">
                  {o.order_number}
                </span>
                <span className="text-[11px] text-neutral-400 block mt-0.5">
                  {new Date(o.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <OrderStatusBadge status={o.status} className="shrink-0" />
            </div>

            {o.status === 'cancelled' && o.cancel_reason && (
              <div className="text-[11px] text-rose-800 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                <strong className="font-bold">বাতিলের কারণ:</strong> {o.cancel_reason}
              </div>
            )}

            {/* Customer & Payment Info */}
            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-neutral-900">{o.full_name}</p>
                <p className="text-[11px] text-neutral-500">{o.phone}</p>
              </div>
              <div className="text-right">
                <span className="text-xs uppercase font-semibold text-neutral-600 block">
                  {o.payment_method}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase ${
                    o.payment_status === 'paid' ? 'text-emerald-700' : 'text-amber-600'
                  }`}
                >
                  {o.payment_status}
                </span>
              </div>
            </div>

            {/* Total & Action Buttons */}
            <div className="flex items-center justify-between pt-2.5 border-t border-neutral-100">
              <div>
                <span className="text-[10px] text-neutral-400 block font-medium">সর্বমোট:</span>
                <span className="font-black text-sm text-[#1b3b2b]">
                  ৳{Number(o.total).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenInvoice(o);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
                  title="Print Invoice / চালান"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-700" />
                  <span>চালান</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetail(o);
                  }}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-[#1b3b2b] hover:text-white rounded-xl text-xs font-bold text-neutral-700 transition active:scale-95 cursor-pointer"
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

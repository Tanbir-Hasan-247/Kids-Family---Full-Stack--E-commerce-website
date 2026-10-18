import React from 'react';
import { Printer } from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';

export default function OrderTable({
  orders,
  loading,
  onOpenDetail,
  onOpenInvoice,
}) {
  return (
    <div className="hidden md:block bg-white border border-neutral-200/80 rounded-3xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] text-neutral-400 uppercase tracking-wider">
              <th className="py-3.5 px-5 font-bold">Order #</th>
              <th className="py-3.5 px-4 font-bold">Customer</th>
              <th className="py-3.5 px-4 font-bold">Payment</th>
              <th className="py-3.5 px-4 font-bold">Status</th>
              <th className="py-3.5 px-4 font-bold">Date</th>
              <th className="py-3.5 px-4 font-bold text-right">Total</th>
              <th className="py-3.5 px-5 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-neutral-400">
                  Loading orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-neutral-400">
                  No orders found matching the filter.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr
                  key={o.order_number}
                  onClick={() => onOpenDetail(o)}
                  className="hover:bg-neutral-50/70 transition cursor-pointer"
                >
                  <td className="py-3.5 px-5 font-mono font-bold text-xs text-neutral-900">
                    {o.order_number}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-neutral-900 text-xs">{o.full_name}</p>
                    <p className="text-[11px] text-neutral-400">{o.phone}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs uppercase font-medium text-neutral-700">
                      {o.payment_method}
                    </span>
                    <span
                      className={`block text-[11px] font-bold ${
                        o.payment_status === 'paid' ? 'text-emerald-700' : 'text-amber-600'
                      }`}
                    >
                      {o.payment_status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <OrderStatusBadge status={o.status} />
                    {o.status === 'cancelled' && o.cancel_reason && (
                      <span
                        className="block text-[10px] text-rose-700 font-medium truncate max-w-[130px] mt-1"
                        title={o.cancel_reason}
                      >
                        কারণ: {o.cancel_reason}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-neutral-500 whitespace-nowrap">
                    {new Date(o.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-xs sm:text-sm text-neutral-900">
                    ৳{Number(o.total).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenInvoice(o);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/70 rounded-full text-xs font-bold transition active:scale-95 cursor-pointer"
                        title="Print Invoice / চালান"
                      >
                        <Printer className="w-3 h-3 text-amber-700" />
                        <span>চালান</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetail(o);
                        }}
                        className="px-3 py-1 bg-neutral-100 hover:bg-[#1b3b2b] hover:text-white rounded-full text-xs font-bold transition text-neutral-700 cursor-pointer"
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

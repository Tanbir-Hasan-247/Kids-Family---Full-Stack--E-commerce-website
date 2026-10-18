import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';

const DashboardRecentOrders = ({ recentOrders }) => {
  return (
    <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-neutral-900">Recent Orders</h2>
          <p className="text-xs text-neutral-500">গ্রাহকদের সর্বশেষ প্লেস করা অর্ডারসমূহ</p>
        </div>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1b3b2b] hover:text-amber-600 transition"
        >
          <span>View All Orders</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-[11px] text-neutral-400 uppercase tracking-wider">
              <th className="py-3 px-4 font-bold">Order #</th>
              <th className="py-3 px-4 font-bold">Customer</th>
              <th className="py-3 px-4 font-bold">Items</th>
              <th className="py-3 px-4 font-bold">Payment</th>
              <th className="py-3 px-4 font-bold">Status</th>
              <th className="py-3 px-4 font-bold text-right">Total</th>
              <th className="py-3 px-4 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {recentOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-neutral-400">
                  No orders placed yet.
                </td>
              </tr>
            ) : (
              recentOrders.map((order) => (
                <tr key={order.order_number} className="hover:bg-neutral-50/80 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-neutral-900 text-xs">
                    {order.order_number}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-neutral-900 text-xs">{order.full_name}</p>
                    <p className="text-[11px] text-neutral-400">{order.phone}</p>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-neutral-600">
                    {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs uppercase font-medium text-neutral-700">
                      {order.payment_method}
                    </span>
                    <span
                      className={`block text-[11px] font-bold ${
                        order.payment_status === 'paid' ? 'text-emerald-700' : 'text-amber-600'
                      }`}
                    >
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        order.status === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : order.status === 'shipped'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-neutral-900 text-xs">
                    ৳{Number(order.total).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/admin/orders?search=${order.order_number}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#1b3b2b] hover:underline"
                    >
                      <span>Manage</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View: High-density Order Cards */}
      <div className="md:hidden space-y-3">
        {recentOrders.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            No orders placed yet.
          </div>
        ) : (
          recentOrders.map((order) => (
            <div
              key={order.order_number}
              className="bg-neutral-50/70 border border-neutral-200/80 rounded-2xl p-3.5 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2 border-b border-neutral-200/60 pb-2">
                <div>
                  <span className="font-mono font-bold text-xs text-neutral-900 block">
                    {order.order_number}
                  </span>
                  <span className="text-[11px] text-neutral-500 block mt-0.5">
                    {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                    order.status === 'delivered'
                      ? 'bg-emerald-100 text-emerald-800'
                      : order.status === 'cancelled'
                        ? 'bg-rose-100 text-rose-800'
                        : order.status === 'shipped'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {order.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-neutral-900">{order.full_name}</p>
                  <p className="text-[11px] text-neutral-400">{order.phone}</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-sm text-[#1b3b2b] block">
                    ৳{Number(order.total).toLocaleString()}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      order.payment_status === 'paid' ? 'text-emerald-700' : 'text-amber-600'
                    }`}
                  >
                    {order.payment_status}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200/60 flex justify-end">
                <Link
                  to={`/admin/orders?search=${order.order_number}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#1b3b2b] hover:text-amber-700 bg-white px-3 py-1.5 rounded-xl border border-neutral-200 shadow-2xs"
                >
                  <span>Manage Order</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DashboardRecentOrders;

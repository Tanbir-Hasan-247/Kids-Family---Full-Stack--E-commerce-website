import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Calendar, Clock, ChevronRight, Printer } from 'lucide-react';
import api from '../api/axios';
import OrderInvoiceModal from '../components/admin/OrderInvoiceModal';

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Order History</h1>
        <p className="text-xs text-neutral-500 mt-1">Track and review all your placed orders</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-neutral-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-neutral-200/80 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-neutral-800">No Orders Found</h3>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto">
            You haven't placed any orders yet. Start exploring our collection!
          </p>
          <Link
            to="/products"
            className="inline-block px-6 py-2.5 bg-[#1b3b2b] text-white rounded-full text-xs font-bold hover:bg-[#142e22] transition"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs hover:shadow-md transition p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-[#1b3b2b]">
                    {order.order_number}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(
                      order.status
                    )}`}
                  >
                    {order.status_display || order.status}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={() => setInvoiceOrder(order)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-bold transition active:scale-95 cursor-pointer"
                    title="Print Invoice / চালানের কপি"
                  >
                    <Printer className="w-3 h-3 text-amber-700" />
                    <span>চালান / মেমো</span>
                  </button>
                </div>
              </div>

              {/* Items summary */}
              <div className="text-xs text-neutral-700 space-y-1.5">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <span className="truncate pr-4">
                      {item.quantity}x {item.product_name} ({item.variant_sku})
                    </span>
                    <span className="font-semibold text-neutral-900 shrink-0">৳{item.price}</span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs font-bold">
                <span className="text-neutral-500">
                  Payment: {order.payment_method_display || order.payment_method.toUpperCase()} (
                  {order.payment_status})
                </span>
                <span className="text-base text-[#1b3b2b]">Total: ৳{order.total}</span>
              </div>
            </div>
          ))}
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


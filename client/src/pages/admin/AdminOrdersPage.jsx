import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Eye,
  CheckCircle,
  Truck,
  Clock,
  XCircle,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  Printer,
  Download,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import OrderInvoiceModal from '../../components/admin/OrderInvoiceModal';
import api from '../../api/axios';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
  { value: 'refunded', label: 'Refunded' },
];

const AdminOrdersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';
  const initialSearch = searchParams.get('search') || '';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // Detail Modal / Panel state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState('');
  const [editCancelReason, setEditCancelReason] = useState('');

  const handleExportCSV = () => {
    let url = '/api/dashboard/export-orders-csv/?';
    if (statusFilter && statusFilter !== 'all') {
      url += `?status=${statusFilter}`;
    }
    window.open(url, '_blank');
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = '/orders/admin/all/?';
      if (statusFilter && statusFilter !== 'all') {
        url += `status=${statusFilter}&`;
      }
      if (searchQuery) {
        url += `search=${encodeURIComponent(searchQuery)}&`;
      }
      const res = await api.get(url);
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.results)
          ? res.data.results
          : [];
      setOrders(data);

      // If search matches one order specifically, auto-select it
      if (initialSearch && data.length > 0) {
        handleOpenDetail(data[0]);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, searchQuery]);

  const handleOpenDetail = (order) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
    setEditPaymentStatus(order.payment_status);
    setEditCancelReason(order.cancel_reason || '');
    setUpdateSuccess('');
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setUpdatingStatus(true);
    try {
      const res = await api.patch(`/orders/admin/${selectedOrder.order_number}/`, {
        status: editStatus,
        payment_status: editPaymentStatus,
        cancel_reason: editStatus === 'cancelled' ? editCancelReason : (selectedOrder.cancel_reason || ''),
      });

      setSelectedOrder(res.data);
      setUpdateSuccess('Order status updated successfully!');
      fetchOrders();
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert('Could not update order status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-indigo-100 text-indigo-800';
      case 'processing':
        return 'bg-amber-100 text-amber-800';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <AdminLayout title="Orders Management">
      <div className="space-y-6">
        {/* Top Filters & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 no-scrollbar w-full lg:w-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                statusFilter === 'all'
                  ? 'bg-[#1b3b2b] text-white shadow-xs'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              All
            </button>
            {STATUS_OPTIONS.map((st) => (
              <button
                key={st.value}
                onClick={() => setStatusFilter(st.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  statusFilter === st.value
                    ? 'bg-[#1b3b2b] text-white shadow-xs'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order #, phone, customer..."
                className="w-full pl-10 pr-4 py-2 bg-white rounded-full border border-neutral-200 text-xs text-neutral-800 focus:outline-none focus:border-[#1b3b2b]"
              />
            </div>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer shrink-0"
              title="Download orders as Excel/CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </button>
          </div>
        </div>

        {/* Desktop View: Table */}
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
                      onClick={() => handleOpenDetail(o)}
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
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusBadge(
                            o.status
                          )}`}
                        >
                          {o.status}
                        </span>
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
                              setInvoiceOrder(o);
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
                              handleOpenDetail(o);
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

        {/* Mobile View: High-density Order Cards (No horizontal sliding!) */}
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
                onClick={() => handleOpenDetail(o)}
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
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${getStatusBadge(
                      o.status
                    )}`}
                  >
                    {o.status}
                  </span>
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
                        setInvoiceOrder(o);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-xl text-xs font-bold transition active:scale-95"
                      title="Print Invoice / চালান"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-700" />
                      <span>চালান</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(o);
                      }}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-[#1b3b2b] hover:text-white rounded-xl text-xs font-bold text-neutral-700 transition active:scale-95"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ORDER DETAIL MODAL */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl my-8">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div>
                  <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                    Order Details
                  </span>
                  <h3 className="text-xl font-mono font-black text-neutral-900">
                    {selectedOrder.order_number}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInvoiceOrder(selectedOrder)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
                    title="Print Invoice / চালান"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-700" />
                    <span>প্রিন্ট চালান</span>
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-neutral-400 hover:text-neutral-700 p-1"
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
              {selectedOrder.status === 'cancelled' && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-2 font-black text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>এই অর্ডারটি বাতিল করা হয়েছে (Cancelled Order)</span>
                  </div>
                  {selectedOrder.cancel_reason ? (
                    <div className="pl-6 text-rose-950 font-medium">
                      <span className="font-bold text-rose-700">বাতিলের কারণ / নোট: </span>
                      <span>{selectedOrder.cancel_reason}</span>
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
                  <p className="font-bold text-neutral-900">{selectedOrder.full_name}</p>
                  <p className="text-neutral-600 mt-0.5">{selectedOrder.phone}</p>
                  {selectedOrder.email && <p className="text-neutral-600">{selectedOrder.email}</p>}
                </div>

                <div>
                  <span className="text-neutral-400 font-bold block mb-1">Shipping Address</span>
                  <p className="text-neutral-800 font-medium">{selectedOrder.address_line}</p>
                  <p className="text-neutral-600 mt-0.5">{selectedOrder.city}</p>
                  {selectedOrder.notes && (
                    <p className="text-amber-700 italic mt-1 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                      Note: {selectedOrder.notes}
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
                  {selectedOrder.items?.map((item) => (
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
                    <span>৳{Number(selectedOrder.subtotal || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping Fee:</span>
                    <span>৳{Number(selectedOrder.shipping_fee || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-neutral-900 pt-2 border-t border-neutral-100">
                    <span>Total Amount:</span>
                    <span>৳{Number(selectedOrder.total).toLocaleString()}</span>
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
                      <span className="text-[10px] text-rose-600 font-medium">কাস্টমারকে ট্র্যাকিংয়ে দেখানো হবে</span>
                    </div>

                    {/* Quick suggestion chips */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {[
                        'গ্রাহকের অনুরোধে বাতিল',
                        'পণ্য স্টকে নেই (Stock Out)',
                        'ভুল নম্বর / ফোন রিসিভ করেনি',
                        'ঠিকানা অস্পষ্ট / সার্ভিসের বাইরে',
                        'ডুপ্লিকেট অর্ডার',
                      ].map((chip) => (
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

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="px-6 py-2.5 rounded-xl bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-extrabold text-xs shadow-md transition disabled:opacity-50"
                  >
                    {updatingStatus ? 'Saving...' : 'Save Order Status'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* INVOICE MODAL */}
        <OrderInvoiceModal
          order={invoiceOrder}
          isOpen={Boolean(invoiceOrder)}
          onClose={() => setInvoiceOrder(null)}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminOrdersPage;


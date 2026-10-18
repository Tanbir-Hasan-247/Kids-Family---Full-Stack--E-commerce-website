import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import OrderInvoiceModal from '../components/admin/OrderInvoiceModal';
import OrderHistoryHeader from '../components/orders/OrderHistoryHeader';
import OrderHistoryStats from '../components/orders/OrderHistoryStats';
import OrderHistoryEmptyState from '../components/orders/OrderHistoryEmptyState';
import OrderHistoryCard from '../components/orders/OrderHistoryCard';

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
      <OrderHistoryHeader
        trackSearchQuery={trackSearchQuery}
        setTrackSearchQuery={setTrackSearchQuery}
        onTrackSubmit={handleTrackSubmit}
      />

      {/* Stats Summary Bar */}
      <OrderHistoryStats
        totalCount={orders.length}
        pendingCount={pendingCount}
        deliveredCount={deliveredCount}
      />

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 bg-neutral-200/70 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <OrderHistoryEmptyState />
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <OrderHistoryCard
              key={order.id}
              order={order}
              copiedId={copiedId}
              onCopyOrderNumber={handleCopyOrderNumber}
              onPrintInvoice={setInvoiceOrder}
            />
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

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import OrderInvoiceModal from '../../components/admin/OrderInvoiceModal';
import OrderFilterBar from '../../components/admin/orders/OrderFilterBar';
import OrderTable from '../../components/admin/orders/OrderTable';
import OrderMobileCards from '../../components/admin/orders/OrderMobileCards';
import OrderDetailModal from '../../components/admin/orders/OrderDetailModal';
import api from '../../api/axios';

const AdminOrdersPage = () => {
  const [searchParams] = useSearchParams();
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

  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const params = {};
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const res = await api.get('/dashboard/export-orders-csv/', {
        params,
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const statusSuffix = statusFilter && statusFilter !== 'all' ? `_${statusFilter}` : '';
      link.setAttribute(
        'download',
        `kids_family_orders${statusSuffix}_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      const token = localStorage.getItem('kf_access_token');
      const q = statusFilter && statusFilter !== 'all' ? `status=${statusFilter}&` : '';
      if (token) {
        window.open(`/api/dashboard/export-orders-csv/?${q}token=${token}`, '_blank');
      } else {
        alert('রিপোর্ট ডাউনলোড করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার লগইন করুন।');
      }
    } finally {
      setIsExporting(false);
    }
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

  // Lock body scroll and allow ESC key to close modal
  useEffect(() => {
    if (selectedOrder) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setSelectedOrder(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [selectedOrder]);

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
        cancel_reason:
          editStatus === 'cancelled'
            ? editCancelReason
            : selectedOrder.cancel_reason || '',
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

  return (
    <AdminLayout title="Orders Management">
      <div className="space-y-6">
        {/* Top Filters & Search */}
        <OrderFilterBar
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onExportCSV={handleExportCSV}
          isExporting={isExporting}
        />

        {/* Desktop View: Table */}
        <OrderTable
          orders={orders}
          loading={loading}
          onOpenDetail={handleOpenDetail}
          onOpenInvoice={(o) => setInvoiceOrder(o)}
        />

        {/* Mobile View: High-density Order Cards */}
        <OrderMobileCards
          orders={orders}
          loading={loading}
          onOpenDetail={handleOpenDetail}
          onOpenInvoice={(o) => setInvoiceOrder(o)}
        />

        {/* Order Detail Modal */}
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOpenInvoice={(o) => setInvoiceOrder(o)}
          editStatus={editStatus}
          setEditStatus={setEditStatus}
          editPaymentStatus={editPaymentStatus}
          setEditPaymentStatus={setEditPaymentStatus}
          editCancelReason={editCancelReason}
          setEditCancelReason={setEditCancelReason}
          handleStatusUpdate={handleStatusUpdate}
          updatingStatus={updatingStatus}
          updateSuccess={updateSuccess}
        />

        {/* Invoice Modal */}
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

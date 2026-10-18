import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../api/axios';
import DashboardHeaderBar from '../../components/admin/dashboard/DashboardHeaderBar';
import DashboardLowStockAlert from '../../components/admin/dashboard/DashboardLowStockAlert';
import DashboardStatCards from '../../components/admin/dashboard/DashboardStatCards';
import DashboardSalesChart from '../../components/admin/dashboard/DashboardSalesChart';
import DashboardTopProducts from '../../components/admin/dashboard/DashboardTopProducts';
import DashboardSalesAnalytics from '../../components/admin/dashboard/DashboardSalesAnalytics';
import DashboardRecentOrders from '../../components/admin/dashboard/DashboardRecentOrders';

const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [lowStockData, setLowStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLowStockTable, setShowLowStockTable] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, lowStockRes] = await Promise.all([
        api.get('/dashboard/stats/'),
        api.get('/dashboard/low-stock/?threshold=5').catch(() => ({ data: { items: [], count: 0 } })),
      ]);
      setData(statsRes.data);
      setLowStockData(lowStockRes.data);
    } catch (err) {
      console.error('Error fetching admin dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleExportCSV = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const res = await api.get('/dashboard/export-orders-csv/', {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `kids_family_orders_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      const token = localStorage.getItem('kf_access_token');
      if (token) {
        window.open(`/api/dashboard/export-orders-csv/?token=${token}`, '_blank');
      } else {
        alert('রিপোর্ট ডাউনলোড করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার লগইন করুন।');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const metrics = data?.metrics || {
    total_revenue: '0',
    today_revenue: '0',
    total_orders: 0,
    pending_orders: 0,
    low_stock_count: 0,
  };

  const chartData = data?.sales_chart_14_days || [];
  const topProducts = data?.top_products || [];
  const recentOrders = data?.recent_orders || [];
  const monthlySales = data?.monthly_sales || [];
  const categorySales = data?.category_sales || [];
  const lowStockItems = lowStockData?.items || [];
  const lowStockCount = metrics.low_stock_count || lowStockItems.length || 0;

  return (
    <AdminLayout title="Overview">
      <div className="space-y-8">
        {/* HEADER BAR WITH REFRESH & EXPORT BUTTON */}
        <DashboardHeaderBar
          loading={loading}
          isExporting={isExporting}
          onRefresh={fetchDashboardData}
          onExportCSV={handleExportCSV}
        />

        {/* LOW STOCK ALERT BANNER (If any items <= 5) */}
        <DashboardLowStockAlert
          lowStockCount={lowStockCount}
          showLowStockTable={showLowStockTable}
          setShowLowStockTable={setShowLowStockTable}
          lowStockItems={lowStockItems}
        />

        {/* 5 TOP STAT CARDS */}
        <DashboardStatCards
          metrics={metrics}
          lowStockCount={lowStockCount}
        />

        {/* REVENUE CHART & TOP SELLERS */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <DashboardSalesChart chartData={chartData} />
          <DashboardTopProducts topProducts={topProducts} />
        </div>

        {/* MONTHLY SALES REPORT & CATEGORY BREAKDOWN SECTION */}
        <DashboardSalesAnalytics
          monthlySales={monthlySales}
          categorySales={categorySales}
        />

        {/* RECENT ORDERS TABLE & CARDS */}
        <DashboardRecentOrders recentOrders={recentOrders} />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;

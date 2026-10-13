import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Clock,
  ArrowRight,
  Package,
  Award,
  ChevronRight,
  AlertTriangle,
  Download,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../api/axios';

const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [lowStockData, setLowStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [showLowStockTable, setShowLowStockTable] = useState(false);

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

  const handleExportCSV = () => {
    window.open('/api/dashboard/export-orders-csv/', '_blank');
  };

  const metrics = data?.metrics || {
    total_revenue: '0',
    today_revenue: '0',
    total_orders: 0,
    pending_orders: 0,
    low_stock_count: 0,
  };

  const chartData = data?.sales_chart_14_days || [];
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue || 0), 100);
  const topProducts = data?.top_products || [];
  const recentOrders = data?.recent_orders || [];
  const monthlySales = data?.monthly_sales || [];
  const categorySales = data?.category_sales || [];
  const lowStockItems = lowStockData?.items || [];
  const lowStockCount = metrics.low_stock_count || lowStockItems.length || 0;

  const maxMonthRevenue = Math.max(...monthlySales.map((m) => m.revenue || 0), 100);
  const totalCatRevenue = categorySales.reduce((sum, c) => sum + (c.revenue || 0), 0) || 1;

  return (
    <AdminLayout title="Overview">
      <div className="space-y-8">
        {/* HEADER BAR WITH EXPORT BUTTON */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-neutral-200/80 shadow-xs">
          <div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Business Intelligence & Analytics
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              অ্যাডমিন ড্যাশবোর্ড ওভারভিউ
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              className="p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 transition cursor-pointer"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>বিক্রয় রিপোর্ট (CSV / Excel)</span>
            </button>
          </div>
        </div>

        {/* LOW STOCK ALERT BANNER (If any items <= 5) */}
        {lowStockCount > 0 && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-rose-950 flex items-center gap-2">
                    <span>লো স্টক এলার্ট!</span>
                    <span className="px-2 py-0.5 bg-rose-200 text-rose-900 text-xs rounded-full font-bold">
                      {lowStockCount} টি আইটেম স্টক শেষ হওয়ার পথে
                    </span>
                  </h3>
                  <p className="text-xs text-rose-800 mt-0.5">
                    কিছু কাপড়ের ভ্যারিয়েন্টের স্টক ৫ বা তার নিচে নেমে গেছে। অবিলম্বে স্টক রি-স্টক করুন যাতে সেল নষ্ট না হয়।
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowLowStockTable(!showLowStockTable)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-900 border border-rose-300 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                >
                  <span>{showLowStockTable ? 'তালিকা লুকান' : 'স্টক তালিকা দেখুন'}</span>
                  {showLowStockTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <Link
                  to="/admin/products"
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-2xs"
                >
                  স্টক আপডেট
                </Link>
              </div>
            </div>

            {/* EXPANDABLE LOW STOCK TABLE */}
            {showLowStockTable && (
              <div className="bg-white rounded-2xl border border-rose-200 overflow-hidden shadow-inner animate-in fade-in">
                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-rose-100/60 text-rose-900 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-4">প্রোডাক্ট</th>
                        <th className="py-2.5 px-4">সাইজ / কালার ভ্যারিয়েন্ট</th>
                        <th className="py-2.5 px-4">SKU</th>
                        <th className="py-2.5 px-4 text-center">অবশিষ্ট স্টক</th>
                        <th className="py-2.5 px-4 text-right">মূল্য</th>
                        <th className="py-2.5 px-4 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-100">
                      {lowStockItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-neutral-400">
                            কোনো লো স্টক আইটেম পাওয়া যায়নি
                          </td>
                        </tr>
                      ) : (
                        lowStockItems.map((item) => (
                          <tr key={item.id} className="hover:bg-rose-50/50 transition">
                            <td className="py-3 px-4 font-bold text-neutral-900">
                              {item.product_name}
                            </td>
                            <td className="py-3 px-4 text-neutral-600">
                              {item.attributes || 'Standard'}
                            </td>
                            <td className="py-3 px-4 font-mono text-neutral-500">
                              {item.sku}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full font-black text-xs ${
                                  item.stock <= 2
                                    ? 'bg-rose-600 text-white animate-pulse'
                                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                                }`}
                              >
                                {item.stock} টি বাকি
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-neutral-900">
                              ৳{item.price}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Link
                                to="/admin/products"
                                className="text-rose-700 hover:text-rose-900 font-bold hover:underline"
                              >
                                এডিট
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View: High-density Low Stock Cards */}
                <div className="md:hidden divide-y divide-rose-100">
                  {lowStockItems.length === 0 ? (
                    <div className="py-4 text-center text-xs text-neutral-400">
                      কোনো লো স্টক আইটেম পাওয়া যায়নি
                    </div>
                  ) : (
                    lowStockItems.map((item) => (
                      <div key={item.id} className="p-3.5 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-neutral-900 text-xs">
                              {item.product_name}
                            </p>
                            <p className="text-[11px] text-neutral-500 mt-0.5">
                              {item.attributes || 'Standard'} &middot; <span className="font-mono">{item.sku}</span>
                            </p>
                          </div>
                          <span
                            className={`shrink-0 px-2.5 py-0.5 rounded-full font-black text-[11px] ${
                              item.stock <= 2
                                ? 'bg-rose-600 text-white animate-pulse'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            {item.stock} টি বাকি
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="font-bold text-neutral-900">৳{item.price}</span>
                          <Link
                            to="/admin/products"
                            className="text-rose-700 hover:text-rose-900 font-bold text-xs bg-rose-50 px-2.5 py-1 rounded-lg"
                          >
                            স্টক এডিট করুন
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5 TOP STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Revenue */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-[#1b3b2b]/30 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                  Total Revenue
                </p>
                <p className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                  ৳{Number(metrics.total_revenue).toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#1b3b2b]/10 text-[#1b3b2b] flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-neutral-400 mt-2 font-medium">মোট বিক্রয় (নন-ক্যান্সেলড)</p>
          </div>

          {/* Today's Revenue */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-amber-400/40 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                  Today's Revenue
                </p>
                <p className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                  ৳{Number(metrics.today_revenue).toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-neutral-400 mt-2 font-medium">আজকের মোট বিক্রয়</p>
          </div>

          {/* Total Orders */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-[#1b3b2b]/30 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                  Total Orders
                </p>
                <p className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                  {metrics.total_orders}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-neutral-100 text-neutral-700 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-neutral-400 mt-2 font-medium">সর্বমোট অর্ডার সংখ্যা</p>
          </div>

          {/* Pending Orders */}
          <div
            className={`bg-white border rounded-2xl p-5 shadow-xs relative overflow-hidden group transition-all ${
              metrics.pending_orders > 0
                ? 'border-amber-300 ring-2 ring-amber-400/20'
                : 'border-neutral-200/80'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p
                  className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${
                    metrics.pending_orders > 0 ? 'text-amber-700' : 'text-neutral-400'
                  }`}
                >
                  Pending Orders
                </p>
                <p
                  className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    metrics.pending_orders > 0 ? 'text-amber-700' : 'text-neutral-900'
                  }`}
                >
                  {metrics.pending_orders}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                  metrics.pending_orders > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-neutral-400 mt-2 font-medium">ভেরিফিকেশনের অপেক্ষায়</p>
          </div>

          {/* Low Stock Alert Card */}
          <div
            className={`bg-white border rounded-2xl p-5 shadow-xs relative overflow-hidden group transition-all ${
              lowStockCount > 0
                ? 'border-rose-300 ring-2 ring-rose-400/20 bg-rose-50/30'
                : 'border-neutral-200/80'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p
                  className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${
                    lowStockCount > 0 ? 'text-rose-700' : 'text-neutral-400'
                  }`}
                >
                  Low Stock Alert
                </p>
                <p
                  className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    lowStockCount > 0 ? 'text-rose-600' : 'text-neutral-900'
                  }`}
                >
                  {lowStockCount}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                  lowStockCount > 0
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-neutral-400 mt-2 font-medium">স্টক ≤ ৫ টি আইটেম</p>
          </div>
        </div>

        {/* REVENUE CHART & TOP SELLERS */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* 14-Day Sales Trend Bar Chart */}
          <div className="xl:col-span-2 bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Revenue Trend (গত ১৪ দিন)</h2>
                <p className="text-xs text-neutral-500">প্রতিদিনের অর্ডারের মোট বিক্রয় ট্রেন্ড</p>
              </div>
              <span className="text-xs font-bold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full">
                Last 14 Days
              </span>
            </div>

            {/* Visual SVG / HTML Bar Chart */}
            <div className="h-64 sm:h-72 w-full flex items-end gap-1.5 sm:gap-3 pt-6 border-b border-neutral-100 pb-2 relative">
              {chartData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                  No sales recorded in this period yet.
                </div>
              ) : (
                chartData.map((item, index) => {
                  const heightPercent = Math.max(Math.round((item.revenue / maxRevenue) * 100), 4);
                  const isHovered = hoveredBar === index;

                  return (
                    <div
                      key={item.iso_date || index}
                      className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                      onMouseEnter={() => setHoveredBar(index)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {/* Tooltip */}
                      {isHovered && (
                        <div className="absolute -top-10 z-20 bg-neutral-900 text-white text-[11px] font-bold px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
                          ৳{Number(item.revenue).toLocaleString()}
                        </div>
                      )}

                      {/* Bar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                          item.revenue > 0
                            ? isHovered
                              ? 'bg-amber-400'
                              : 'bg-[#1b3b2b]'
                            : 'bg-neutral-200'
                        }`}
                      />
                      {/* Date label */}
                      <span className="text-[10px] text-neutral-400 font-medium mt-2 truncate w-full text-center">
                        {item.date.split(' ')[0]}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex justify-between items-center pt-3 text-[11px] text-neutral-400">
              <span>0 ৳</span>
              <span>Max: ৳{Math.round(maxRevenue).toLocaleString()}</span>
            </div>
          </div>

          {/* Top Sellers Column */}
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-neutral-900">সেরা বিক্রয় পণ্য</h2>
              </div>
              <span className="text-xs text-neutral-400 font-semibold">By Quantity</span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {topProducts.length === 0 ? (
                <div className="text-xs text-neutral-400 py-8 text-center">
                  No products sold yet.
                </div>
              ) : (
                topProducts.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-neutral-50 transition border border-transparent hover:border-neutral-200/60"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800'
                          : idx === 1
                            ? 'bg-neutral-200 text-neutral-800'
                            : idx === 2
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                        {p.product_name}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-[#1b3b2b]">{p.total_qty}</p>
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">
                        Sold
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* MONTHLY SALES REPORT & CATEGORY BREAKDOWN SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Sales Trend */}
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-700" />
                <h2 className="text-base font-bold text-neutral-900">মাসিক বিক্রয় রিপোর্ট (Monthly Sales)</h2>
              </div>
              <span className="text-xs font-bold text-neutral-400">গত ৬ মাস</span>
            </div>

            <div className="space-y-3">
              {monthlySales.length === 0 ? (
                <p className="text-xs text-neutral-400 py-6 text-center">এখনো পর্যাপ্ত তথ্য নেই</p>
              ) : (
                monthlySales.map((m, idx) => {
                  const percent = Math.max(Math.round((m.revenue / maxMonthRevenue) * 100), 5);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-neutral-800">{m.month}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-neutral-500">{m.orders_count} টি অর্ডার</span>
                          <span className="font-mono font-black text-[#1b3b2b]">
                            ৳{Number(m.revenue).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className="h-full bg-gradient-to-r from-[#1b3b2b] to-emerald-600 rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Category Sales Breakdown */}
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-bold text-neutral-900">ক্যাটাগরি শেয়ার (Category Sales)</h2>
              </div>
              <span className="text-xs font-bold text-neutral-400">টপ ক্যাটাগরি</span>
            </div>

            <div className="space-y-3">
              {categorySales.length === 0 ? (
                <p className="text-xs text-neutral-400 py-6 text-center">এখনো কোনো বিক্রয় রেকর্ড নেই</p>
              ) : (
                categorySales.map((cat, idx) => {
                  const percent = Math.min(Math.round((cat.revenue / totalCatRevenue) * 100), 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-neutral-800">{cat.category}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-neutral-500">{cat.quantity} টি আইটেম</span>
                          <span className="font-mono font-black text-amber-900">
                            ৳{Number(cat.revenue).toLocaleString()} ({percent}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RECENT ORDERS TABLE */}
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
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;

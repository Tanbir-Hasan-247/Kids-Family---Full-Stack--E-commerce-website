import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Package, Clock, Heart, User, MapPin, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const DashboardPage = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/auth/dashboard-summary/');
        setSummary(res.data);
      } catch (err) {
        console.error('Failed to load dashboard summary:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Customer Dashboard</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Welcome back, {user?.first_name || user?.email}!
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-3xl border border-neutral-200/80 shadow-xs flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">
              Total Orders
            </span>
            <h3 className="text-2xl font-black text-neutral-900 mt-0.5">
              {summary ? summary.total_orders : 0}
            </h3>
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-neutral-200/80 shadow-xs flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-800 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">
              In Progress
            </span>
            <h3 className="text-2xl font-black text-neutral-900 mt-0.5">
              {summary ? summary.pending_orders : 0}
            </h3>
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-neutral-200/80 shadow-xs flex items-center gap-4">
          <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">
              Wishlist Items
            </span>
            <h3 className="text-2xl font-black text-neutral-900 mt-0.5">
              {summary ? summary.wishlist_count : 0}
            </h3>
          </div>
        </div>
      </div>

      {/* User Information & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider pb-3 border-b border-neutral-100 flex items-center gap-2">
            <User className="w-4 h-4 text-[#1b3b2b]" />
            <span>Profile Details</span>
          </h3>

          <div className="space-y-3 text-xs text-neutral-700">
            <div>
              <span className="text-neutral-400 block text-[11px]">Email</span>
              <span className="font-semibold">{user?.email}</span>
            </div>
            {user?.phone && (
              <div>
                <span className="text-neutral-400 block text-[11px]">Phone</span>
                <span className="font-semibold">{user?.phone}</span>
              </div>
            )}
            {user?.address && (
              <div>
                <span className="text-neutral-400 block text-[11px]">Default Address</span>
                <span className="font-semibold">{user?.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              Recent Orders
            </h3>
            <Link to="/orders" className="text-xs font-bold text-[#1b3b2b] hover:underline">
              View All
            </Link>
          </div>

          {summary?.recent_orders?.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">No recent orders placed.</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {summary?.recent_orders?.map((order) => (
                <div key={order.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-extrabold text-[#1b3b2b] block">
                      {order.order_number}
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      {new Date(order.created_at).toLocaleDateString()} • {order.status}
                    </span>
                  </div>
                  <span className="font-black text-neutral-900">৳{order.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;


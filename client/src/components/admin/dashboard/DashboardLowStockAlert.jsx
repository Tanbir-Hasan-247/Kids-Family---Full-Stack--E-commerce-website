import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';

const DashboardLowStockAlert = ({
  lowStockCount,
  showLowStockTable,
  setShowLowStockTable,
  lowStockItems,
}) => {
  if (lowStockCount <= 0) return null;

  return (
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
  );
};

export default DashboardLowStockAlert;

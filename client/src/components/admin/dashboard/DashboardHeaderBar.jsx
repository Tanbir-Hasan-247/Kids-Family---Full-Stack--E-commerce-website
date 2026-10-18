import React from 'react';
import { RefreshCw, Download } from 'lucide-react';

const DashboardHeaderBar = ({
  loading,
  isExporting,
  onRefresh,
  onExportCSV,
}) => {
  return (
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
          onClick={onRefresh}
          className="p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 transition cursor-pointer"
          title="রিফ্রেশ করুন"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={onExportCSV}
          disabled={isExporting}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer disabled:opacity-60"
        >
          <Download className={`w-4 h-4 text-amber-400 ${isExporting ? 'animate-bounce' : ''}`} />
          <span>{isExporting ? 'রিপোর্ট তৈরি হচ্ছে...' : 'বিক্রয় রিপোর্ট (CSV / Excel)'}</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardHeaderBar;

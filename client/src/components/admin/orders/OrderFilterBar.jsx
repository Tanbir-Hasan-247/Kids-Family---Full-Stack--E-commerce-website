import React from 'react';
import { Search, Download } from 'lucide-react';

export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function OrderFilterBar({
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  onExportCSV,
  isExporting,
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      {/* Status Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 no-scrollbar w-full lg:w-auto">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
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
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              statusFilter === st.value
                ? 'bg-[#1b3b2b] text-white shadow-xs'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Search Input & Export CSV */}
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
          onClick={onExportCSV}
          disabled={isExporting}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer shrink-0 disabled:opacity-60"
          title="Download orders as Excel/CSV"
        >
          <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
          <span className="hidden sm:inline">
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </span>
          <span className="sm:hidden">{isExporting ? '...' : 'CSV'}</span>
        </button>
      </div>
    </div>
  );
}

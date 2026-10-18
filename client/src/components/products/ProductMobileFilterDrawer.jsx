import React from 'react';
import { X, SlidersHorizontal } from 'lucide-react';

export default function ProductMobileFilterDrawer({
  isOpen,
  onClose,
  activeFilterCount,
  totalCount,
  clearAllFilters,
  children,
}) {
  if (!isOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
        <div className="w-screen max-w-xs sm:max-w-sm bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-700" />
              <h3 className="text-sm font-black text-neutral-900">
                পণ্য ফিল্টার (Filters)
              </h3>
              {activeFilterCount > 0 && (
                <span className="bg-[#1b3b2b] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 bg-neutral-50/40">
            {children}
          </div>

          {/* Drawer Sticky Footer */}
          <div className="p-4 border-t border-neutral-200 bg-white flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                clearAllFilters();
                onClose();
              }}
              className="w-1/3 py-3 rounded-xl border border-neutral-300 text-neutral-700 font-bold text-xs hover:bg-neutral-50 cursor-pointer"
            >
              রিসেট
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-[#1b3b2b] hover:bg-[#142e22] text-white rounded-xl font-black text-xs shadow-md cursor-pointer"
            >
              ফিল্টার প্রয়োগ করুন ({totalCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';

export default function ProductCategoryStrip({
  categories,
  selectedCat,
  updateParam,
}) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 pt-0.5 -mx-3 px-3 sm:mx-0 sm:px-0 mb-4">
      <button
        type="button"
        onClick={() => updateParam('cat', '')}
        className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs transition whitespace-nowrap cursor-pointer ${
          !selectedCat
            ? 'bg-[#1b3b2b] text-white shadow-xs font-bold'
            : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
        }`}
      >
        সব পণ্য (All)
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => updateParam('cat', cat.slug)}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs transition whitespace-nowrap cursor-pointer ${
            selectedCat === cat.slug
              ? 'bg-[#1b3b2b] text-white shadow-xs font-bold'
              : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}

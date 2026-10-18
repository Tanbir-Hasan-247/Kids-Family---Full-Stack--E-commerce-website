import React from 'react';

export default function ChatQuickSuggestions({
  suggestions,
  isLoading,
  onSelect,
}) {
  return (
    <div className="p-2 bg-white border-t border-neutral-100 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
      {suggestions.map((item) => (
        <button
          key={item.label}
          onClick={() => onSelect(item.query)}
          disabled={isLoading}
          className="px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-amber-100 hover:text-amber-900 text-neutral-700 text-[11px] font-medium whitespace-nowrap border border-neutral-200/70 transition shrink-0 active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

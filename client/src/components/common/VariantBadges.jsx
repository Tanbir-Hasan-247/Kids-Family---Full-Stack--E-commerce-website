import React from 'react';

// Maps color names to CSS hex color codes for visual color dot indicator
export const getColorDot = (colorName) => {
  if (!colorName || typeof colorName !== 'string') return null;
  const map = {
    teal: '#008080',
    pink: '#ec4899',
    peach: '#ffcba4',
    grey: '#6b7280',
    gray: '#6b7280',
    mustard: '#d97706',
    blue: '#2563eb',
    navy: '#1e3a8a',
    skyblue: '#38bdf8',
    'sky blue': '#38bdf8',
    red: '#dc2626',
    black: '#171717',
    white: '#ffffff',
    green: '#16a34a',
    yellow: '#eab308',
    orange: '#ea580c',
    maroon: '#800000',
    purple: '#9333ea',
    brown: '#78350f',
    olive: '#65a30d',
    beige: '#f5f5dc',
    cream: '#fef08a',
    lavender: '#e9d5ff',
    magenta: '#d946ef',
    cyan: '#06b6d4',
    coral: '#fb7185',
    mint: '#6ee7b7',
    khaki: '#c2b280',
    burgundy: '#800020',
  };
  const key = colorName.trim().toLowerCase();
  return map[key] || null;
};

const VariantBadges = ({ variant, showSku = false, className = '' }) => {
  if (!variant) return null;

  const attributes = variant.attributes || [];

  if (attributes.length === 0) {
    if (variant.sku) {
      return (
        <span className={`text-[10px] text-neutral-400 font-medium ${className}`}>
          SKU: {variant.sku}
        </span>
      );
    }
    return null;
  }

  // Sort: Color first, then Size, then others
  const sortedAttrs = [...attributes].sort((a, b) => {
    const aType = (a.type_name || '').toLowerCase();
    const bType = (b.type_name || '').toLowerCase();
    if (aType === 'color') return -1;
    if (bType === 'color') return 1;
    if (aType === 'size') return -1;
    if (bType === 'size') return 1;
    return 0;
  });

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {sortedAttrs.map((attr) => {
        const isColor = (attr.type_name || '').toLowerCase() === 'color';
        const isSize = (attr.type_name || '').toLowerCase() === 'size';
        const label = isColor ? 'কালার' : isSize ? 'সাইজ' : attr.type_name;
        const colorDot = isColor ? getColorDot(attr.value) : null;

        return (
          <span
            key={attr.id || `${attr.type_name}-${attr.value}`}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide border shadow-2xs ${
              isColor
                ? 'bg-amber-50 text-amber-950 border-amber-200'
                : isSize
                ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                : 'bg-neutral-100 text-neutral-800 border-neutral-200'
            }`}
          >
            {isColor && (
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shrink-0 border border-black/15 shadow-inner"
                style={{ backgroundColor: colorDot || '#e5e7eb' }}
                title={attr.value}
              />
            )}
            <span className="opacity-70 font-normal">{label}:</span>
            <strong className="font-bold text-neutral-900">{attr.value}</strong>
          </span>
        );
      })}

      {showSku && variant.sku && (
        <span className="text-[9px] text-neutral-400 font-mono tracking-tight ml-0.5">
          ({variant.sku})
        </span>
      )}
    </div>
  );
};

export default VariantBadges;


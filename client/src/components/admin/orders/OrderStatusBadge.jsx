import React from 'react';

export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'delivered':
      return 'bg-emerald-100 text-emerald-800';
    case 'shipped':
      return 'bg-blue-100 text-blue-800';
    case 'confirmed':
      return 'bg-indigo-100 text-indigo-800';
    case 'processing':
      return 'bg-amber-100 text-amber-800';
    case 'cancelled':
      return 'bg-rose-100 text-rose-800';
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
};

export default function OrderStatusBadge({ status, className = '' }) {
  return (
    <span
      className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusBadgeClass(
        status
      )} ${className}`}
    >
      {status}
    </span>
  );
}

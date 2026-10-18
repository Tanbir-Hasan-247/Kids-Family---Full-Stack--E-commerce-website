import React from 'react';
import { Truck, RotateCcw, ShieldCheck } from 'lucide-react';

export default function ProductPerksCard() {
  return (
    <div className="p-4 bg-neutral-100/70 rounded-2xl border border-neutral-200/60 space-y-2.5 text-xs text-neutral-700">
      <div className="flex items-center gap-2.5">
        <Truck className="w-4 h-4 text-emerald-700" />
        <span>Standard delivery fee: ৳60 (Dhaka) / ৳120 (Outside Dhaka)</span>
      </div>
      <div className="flex items-center gap-2.5">
        <RotateCcw className="w-4 h-4 text-amber-700" />
        <span>7-Day easy size exchange guarantee</span>
      </div>
      <div className="flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-blue-700" />
        <span>Pay on delivery after inspecting package</span>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Copy, Check, Truck, Receipt, MapPin, Phone, User, PackageCheck } from 'lucide-react';

export default function ChatOrderCreatedCard({ order, onNavigate }) {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const handleCopyOrderNumber = () => {
    if (order.order_number) {
      navigator.clipboard.writeText(order.order_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-gradient-to-b from-emerald-50/90 to-white border border-emerald-300 rounded-3xl p-4 space-y-3.5 text-left shadow-md animate-in zoom-in-95 duration-200">
      {/* Celebration Header */}
      <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black tracking-wider text-emerald-800 uppercase block">
              অর্ডার কনফার্মড
            </span>
            <span className="text-xs font-bold text-neutral-800">
              সরাসরি চ্যাট থেকে গৃহীত
            </span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200 shadow-xs">
          ক্যাশ অন ডেলিভারি
        </span>
      </div>

      {/* Order Number Box with 1-click Copy */}
      <div className="bg-white border border-emerald-200 rounded-2xl p-2.5 flex items-center justify-between shadow-xs">
        <div>
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
            অর্ডার নম্বর
          </span>
          <span className="font-mono font-black text-sm text-[#1b3b2b] tracking-wide">
            {order.order_number}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopyOrderNumber}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold hover:bg-emerald-100 transition active:scale-95 cursor-pointer"
          title="অর্ডার নম্বর কপি করুন"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>কপি হয়েছে!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>কপি</span>
            </>
          )}
        </button>
      </div>

      {/* Ordered Items List */}
      {order.items && order.items.length > 0 && (
        <div className="bg-white/80 border border-neutral-100 rounded-2xl p-2.5 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1b3b2b] border-b border-neutral-100 pb-1.5">
            <PackageCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>অর্ডারকৃত পণ্যসমূহ:</span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px] text-neutral-700">
                <div className="truncate max-w-[200px]">
                  <span className="font-semibold">{item.product_name}</span>
                  {item.variant_sku && (
                    <span className="text-[10px] text-neutral-400 block truncate">
                      {item.variant_sku}
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-neutral-900">
                    ৳{Number(item.price).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-neutral-500 block">
                    x{item.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer & Address Details */}
      <div className="bg-neutral-50/80 border border-neutral-100 rounded-2xl p-2.5 space-y-1.5 text-[11px]">
        <div className="flex items-center gap-1.5 text-neutral-700">
          <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span><strong>প্রাপক:</strong> {order.full_name}</span>
        </div>
        <div className="flex items-center gap-1.5 text-neutral-700">
          <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span><strong>মোবাইল:</strong> {order.phone}</span>
        </div>
        <div className="flex items-start gap-1.5 text-neutral-700">
          <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
          <span><strong>ঠিকানা:</strong> {order.address}</span>
        </div>
      </div>

      {/* Bill Breakdown */}
      <div className="bg-white border border-emerald-100 rounded-2xl p-2.5 space-y-1 text-[11px]">
        <div className="flex justify-between text-neutral-600">
          <span>সাব-টোটাল:</span>
          <span>৳{Number(order.subtotal || (order.total - order.shipping_fee)).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>ডেলিভারি চার্জ:</span>
          <span className="text-emerald-700 font-semibold">৳{Number(order.shipping_fee).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center text-xs font-black text-neutral-900 border-t border-neutral-100 pt-1.5">
          <span className="text-[#1b3b2b]">সর্বমোট প্রদেয় বিল:</span>
          <span className="text-sm font-black text-emerald-800">
            ৳{Number(order.total).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Direct Action Links */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Link
          to={`/track-order/${order.order_number}`}
          onClick={onNavigate}
          className="inline-flex items-center justify-center gap-1.5 py-2.5 px-2 bg-[#1b3b2b] text-white rounded-xl font-bold text-[11px] hover:bg-[#234d38] transition shadow-xs text-center active:scale-95"
        >
          <Truck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>ট্র্যাক করুন</span>
        </Link>
        <Link
          to={`/order-success/${order.order_number}`}
          onClick={onNavigate}
          className="inline-flex items-center justify-center gap-1.5 py-2.5 px-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-[11px] transition shadow-xs text-center active:scale-95"
        >
          <Receipt className="w-3.5 h-3.5 shrink-0" />
          <span>রসিদ দেখুন</span>
        </Link>
      </div>
    </div>
  );
}


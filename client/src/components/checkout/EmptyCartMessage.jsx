import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

export default function EmptyCartMessage() {
  return (
    <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mx-auto shadow-inner">
        <ShoppingBag className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-neutral-900">আপনার শপিং ব্যাগটি খালি</h2>
      <p className="text-xs text-neutral-500">
        অর্ডার সম্পন্ন করতে অনুগ্রহ করে ব্যাগ-এ পণ্য যোগ করুন।
      </p>
      <Link
        to="/products"
        className="inline-block px-6 py-3 rounded-full bg-[#1b3b2b] hover:bg-[#142e22] text-white text-xs font-bold shadow-md transition"
      >
        প্রোডাক্ট কালেকশন দেখুন
      </Link>
    </div>
  );
}

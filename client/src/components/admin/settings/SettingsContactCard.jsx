import React from 'react';
import { Phone, Mail, MapPin, MessageCircle, Clock } from 'lucide-react';

const SettingsContactCard = ({ formData, onChange }) => {
  return (
    <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
      <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center">
          <Phone className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-neutral-900">
            যোগাযোগের তথ্য (Contact Information)
          </h3>
          <p className="text-[11px] text-neutral-500">
            কাস্টমারদের হেল্পলাইন ফোন নম্বর, সাপোর্ট ইমেইল ও ফিজিক্যাল শপের ঠিকানা
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phone */}
        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-neutral-500" />
            <span>ফোন / হেল্পলাইন নম্বর *</span>
          </label>
          <input
            type="text"
            required
            value={formData.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="e.g. +880 1700-000000"
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b] bg-white font-medium"
          />
          <span className="text-[10px] text-neutral-400 mt-1 block">
            ওয়েবসাইটের ফুটার ও ইনভয়েসে গ্রাহকদের জন্য প্রদর্শিত হবে।
          </span>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-neutral-500" />
            <span>অফিসিয়াল ইমেইল এড্রেস *</span>
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="e.g. support@kidsandfamily.com"
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b] bg-white font-medium"
          />
          <span className="text-[10px] text-neutral-400 mt-1 block">
            কাস্টমার সাপোর্ট ও যোগাযোগের মূল ইমেইল।
          </span>
        </div>

        {/* Address (Full width) */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-neutral-500" />
            <span>শপের সম্পূর্ণ ঠিকানা (Physical Address) *</span>
          </label>
          <textarea
            rows={2}
            required
            value={formData.address}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder="e.g. House #14, Road #6, Dhanmondi, Dhaka - 1205, Bangladesh"
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b] bg-white font-medium"
          />
          <span className="text-[10px] text-neutral-400 mt-1 block">
            চালান/কাস্টমার মেমো ও ফুটারের লোকেশন আইকনের সাথে প্রদর্শিত হবে।
          </span>
        </div>

        {/* WhatsApp Number */}
        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>হোয়াটসঅ্যাপ সাপোর্ট নম্বর</span>
          </label>
          <input
            type="text"
            value={formData.whatsapp_number}
            onChange={(e) => onChange('whatsapp_number', e.target.value)}
            placeholder="e.g. +880 1700-000000"
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b] bg-white font-medium"
          />
          <span className="text-[10px] text-neutral-400 mt-1 block">
            হোমপেজের ভাসমান WhatsApp বাটনে ক্লিক করলে এই নম্বরে মেসেজ যাবে।
          </span>
        </div>

        {/* Opening Hours */}
        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-neutral-500" />
            <span>সার্ভিস বা হেল্পলাইন খোলা থাকার সময়</span>
          </label>
          <input
            type="text"
            value={formData.opening_hours}
            onChange={(e) => onChange('opening_hours', e.target.value)}
            placeholder="e.g. 10 AM - 8 PM"
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b] bg-white font-medium"
          />
          <span className="text-[10px] text-neutral-400 mt-1 block">
            যেমন: "10 AM - 8 PM" বা "24/7 Support".
          </span>
        </div>
      </div>
    </div>
  );
};

export default SettingsContactCard;

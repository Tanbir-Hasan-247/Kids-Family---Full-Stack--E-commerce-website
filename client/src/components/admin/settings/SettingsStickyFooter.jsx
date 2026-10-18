import React from 'react';
import { Save } from 'lucide-react';

const SettingsStickyFooter = ({ saving }) => {
  return (
    <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md border border-neutral-200 p-3.5 sm:p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3">
      <span className="text-xs text-neutral-500 hidden sm:inline font-medium">
        পরিবর্তনগুলো সেভ করার পর সাথে সাথে সাইটে আপডেট হয়ে যাবে।
      </span>
      <button
        type="submit"
        disabled={saving}
        className="w-full sm:w-auto ml-auto px-6 py-3 rounded-xl bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-98 disabled:opacity-50 cursor-pointer"
      >
        <Save className="w-4 h-4" />
        <span>{saving ? 'সংরক্ষণ করা হচ্ছে...' : 'সেটিংস সেভ করুন (Save Changes)'}</span>
      </button>
    </div>
  );
};

export default SettingsStickyFooter;

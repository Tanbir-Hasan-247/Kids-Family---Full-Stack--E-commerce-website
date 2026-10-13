import React, { useState, useEffect } from 'react';
import {
  Store,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Truck,
  Check,
  AlertCircle,
  Save,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useShopSettings } from '../../context/ShopSettingsContext';

const FacebookIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const YoutubeIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const AdminSettingsPage = () => {
  const { settings, loading, updateSettings } = useShopSettings();

  const [formData, setFormData] = useState({
    shop_name: '',
    tagline: '',
    address: '',
    phone: '',
    email: '',
    whatsapp_number: '',
    opening_hours: '',
    helpline_note: '',
    facebook_url: '',
    instagram_url: '',
    youtube_url: '',
    delivery_inside_dhaka: 60,
    delivery_outside_dhaka: 120,
    footer_about: '',
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (settings) {
      setFormData({
        shop_name: settings.shop_name || 'Kids & Family',
        tagline: settings.tagline || 'Premium Family Lifestyle & Outfits',
        address: settings.address || 'Dhaka, Bangladesh',
        phone: settings.phone || '+880 1700-000000',
        email: settings.email || 'support@kidsandfamily.com',
        whatsapp_number: settings.whatsapp_number || '+880 1700-000000',
        opening_hours: settings.opening_hours || '10 AM - 8 PM',
        helpline_note: settings.helpline_note || '7 Days a Week (10 AM - 8 PM)',
        facebook_url: settings.facebook_url || '',
        instagram_url: settings.instagram_url || '',
        youtube_url: settings.youtube_url || '',
        delivery_inside_dhaka: settings.delivery_inside_dhaka ?? 60,
        delivery_outside_dhaka: settings.delivery_outside_dhaka ?? 120,
        footer_about:
          settings.footer_about ||
          'Premium clothing & festive collections crafted for kids, men, and women. Celebrating every special family moment with quality, elegance, and comfort.',
      });
    }
  }, [settings]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    const res = await updateSettings(formData);
    setSaving(false);

    if (res.success) {
      setSuccessMsg('শপের ঠিকানা, ইমেইল, ফোন ও সেটিংস সফলভাবে আপডেট হয়েছে!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } else {
      setErrorMsg(res.message || 'সেটিংস সেভ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
  };

  return (
    <AdminLayout title="Shop Contact & Settings">
      <div className="space-y-6 max-w-5xl">
        {/* Intro */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-neutral-900 tracking-tight">
              শপের ঠিকানা, যোগাযোগ ও সেটিংস ম্যানেজমেন্ট
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              এখানে দেয়া ঠিকানা, ফোন ও ইমেইল ওয়েবসাইট ফুটার, ইনভয়েস/চালান এবং WhatsApp সাপোর্টে স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।
            </p>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-in fade-in">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CARD 1: Core Contact Information (Primary Request) */}
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
                  onChange={(e) => handleChange('phone', e.target.value)}
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
                  onChange={(e) => handleChange('email', e.target.value)}
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
                  onChange={(e) => handleChange('address', e.target.value)}
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
                  onChange={(e) => handleChange('whatsapp_number', e.target.value)}
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
                  onChange={(e) => handleChange('opening_hours', e.target.value)}
                  placeholder="e.g. 10 AM - 8 PM"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b] bg-white font-medium"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  যেমন: "10 AM - 8 PM" বা "24/7 Support".
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2: Shop Branding & Identity */}
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  শপের পরিচয় ও ব্র্যান্ডিং (Shop Branding)
                </h3>
                <p className="text-[11px] text-neutral-500">
                  শপের নাম, স্লোগান এবং ফুটার বিবরণ
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  শপের নাম (Shop Name) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.shop_name}
                  onChange={(e) => handleChange('shop_name', e.target.value)}
                  placeholder="e.g. Kids & Family"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b] bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  শপের স্লোগান / ট্যাগলাইন
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  placeholder="e.g. Premium Family Lifestyle & Outfits"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b] bg-white font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  ফুটার এবাউট বিবরণ (About Description in Footer)
                </label>
                <textarea
                  rows={2}
                  value={formData.footer_about}
                  onChange={(e) => handleChange('footer_about', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b] bg-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* CARD 3: Delivery Charges & Social Media Links */}
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-700 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  ডেলিভারি চার্জ ও সোশ্যাল মিডিয়া লিংক
                </h3>
                <p className="text-[11px] text-neutral-500">
                  চেকআউটের ডেলিভারি ফি এবং ফেসবুক/ইনস্টাগ্রাম পেজ লিংক
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-neutral-500" />
                  <span>ঢাকার ভেতরে ডেলিভারি চার্জ (৳) *</span>
                </label>
                <input
                  type="number"
                  required
                  value={formData.delivery_inside_dhaka}
                  onChange={(e) => handleChange('delivery_inside_dhaka', Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b] bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-neutral-500" />
                  <span>ঢাকার বাইরে ডেলিভারি চার্জ (৳) *</span>
                </label>
                <input
                  type="number"
                  required
                  value={formData.delivery_outside_dhaka}
                  onChange={(e) => handleChange('delivery_outside_dhaka', Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b] bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center gap-1.5">
                  <FacebookIcon className="w-3.5 h-3.5 text-[#1877F2]" />
                  <span>Facebook Page Link</span>
                </label>
                <input
                  type="url"
                  value={formData.facebook_url}
                  onChange={(e) => handleChange('facebook_url', e.target.value)}
                  placeholder="https://facebook.com/your-page"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b] bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center gap-1.5">
                  <InstagramIcon className="w-3.5 h-3.5 text-[#E4405F]" />
                  <span>Instagram Page Link</span>
                </label>
                <input
                  type="url"
                  value={formData.instagram_url}
                  onChange={(e) => handleChange('instagram_url', e.target.value)}
                  placeholder="https://instagram.com/your-profile"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b] bg-white font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center gap-1.5">
                  <YoutubeIcon className="w-3.5 h-3.5 text-[#FF0000]" />
                  <span>YouTube Channel Link</span>
                </label>
                <input
                  type="url"
                  value={formData.youtube_url}
                  onChange={(e) => handleChange('youtube_url', e.target.value)}
                  placeholder="https://youtube.com/@your-channel"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b] bg-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* Sticky Submit Bar */}
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
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;

import React, { useState, useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useShopSettings } from '../../context/ShopSettingsContext';
import SettingsContactCard from '../../components/admin/settings/SettingsContactCard';
import SettingsBrandingCard from '../../components/admin/settings/SettingsBrandingCard';
import SettingsDeliverySocialCard from '../../components/admin/settings/SettingsDeliverySocialCard';
import SettingsStickyFooter from '../../components/admin/settings/SettingsStickyFooter';

const AdminSettingsPage = () => {
  const { settings, updateSettings } = useShopSettings();

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
          {/* CARD 1: Core Contact Information */}
          <SettingsContactCard
            formData={formData}
            onChange={handleChange}
          />

          {/* CARD 2: Shop Branding & Identity */}
          <SettingsBrandingCard
            formData={formData}
            onChange={handleChange}
          />

          {/* CARD 3: Delivery Charges & Social Media Links */}
          <SettingsDeliverySocialCard
            formData={formData}
            onChange={handleChange}
          />

          {/* Sticky Submit Bar */}
          <SettingsStickyFooter saving={saving} />
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;

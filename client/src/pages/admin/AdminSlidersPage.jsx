import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  Edit2,
  Check,
  Eye,
  EyeOff,
  X,
  Sparkles,
  ArrowRight,
  Upload,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api, { formatImageUrl } from '../../api/axios';

const formatImg = (url) => formatImageUrl(url);

const AdminSlidersPage = () => {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  // Form inputs
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    badge_text: '',
    cta_text: '',
    link_url: '/products',
    order: 0,
    is_active: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [mobileImageFile, setMobileImageFile] = useState(null);

  const loadSliders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/promotions/sliders/all/');
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.results)
          ? res.data.results
          : [];
      setSliders(data);
    } catch (err) {
      console.error('Failed to load sliders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSliders();
  }, []);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl('');
  }, [imageFile]);

  const handleOpenAdd = () => {
    setEditingSlider(null);
    setFormData({
      title: '',
      subtitle: '',
      badge_text: '',
      cta_text: '',
      link_url: '/products',
      order: sliders.length + 1,
      is_active: true,
    });
    setImageFile(null);
    setMobileImageFile(null);
    setPreviewUrl('');
    setShowAdvanced(false);
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleOpenEdit = (slide) => {
    setEditingSlider(slide);
    setFormData({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      badge_text: slide.badge_text || '',
      cta_text: slide.cta_text || '',
      link_url: slide.link_url || '/products',
      order: slide.order ?? 0,
      is_active: slide.is_active,
    });
    setImageFile(null);
    setMobileImageFile(null);
    setPreviewUrl('');
    setShowAdvanced(Boolean(slide.subtitle || slide.badge_text || slide.mobile_image));
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleToggle = async (id) => {
    try {
      await api.post(`/promotions/sliders/${id}/toggle/`);
      loadSliders();
    } catch (err) {
      console.error('Failed to toggle slider:', err);
      alert('Could not update slide status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hero slider?')) return;
    try {
      await api.delete(`/promotions/sliders/${id}/`);
      loadSliders();
    } catch (err) {
      console.error('Failed to delete slider:', err);
      alert('Could not delete slide.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const form = new FormData();
      if (formData.title.trim()) {
        form.append('title', formData.title.trim());
      }
      if (formData.subtitle) form.append('subtitle', formData.subtitle);
      if (formData.badge_text) form.append('badge_text', formData.badge_text);
      if (formData.cta_text) form.append('cta_text', formData.cta_text);
      form.append('link_url', formData.link_url || '/products');
      form.append('order', formData.order || 0);
      form.append('is_active', formData.is_active);

      if (imageFile) {
        form.append('image', imageFile);
      }
      if (mobileImageFile) {
        form.append('mobile_image', mobileImageFile);
      }

      if (editingSlider) {
        await api.patch(`/promotions/sliders/${editingSlider.id}/`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccessMsg('ব্যানার সফলভাবে আপডেট হয়েছে!');
      } else {
        if (!imageFile) {
          setErrorMsg('ব্যানার ইমেজ আপলোড করা আবশ্যক।');
          setIsSubmitting(false);
          return;
        }
        await api.post('/promotions/sliders/all/', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccessMsg('নতুন হিরো ব্যানার সফলভাবে তৈরি হয়েছে!');
      }

      setModalOpen(false);
      loadSliders();
    } catch (err) {
      console.error('Error saving slider:', err);
      setErrorMsg(
        err.response?.data?.detail ||
          (err.response?.data && JSON.stringify(err.response.data)) ||
          'ব্যানার সেভ করা সম্ভব হয়নি। দয়া করে তথ্য পুনরায় চেক করুন।'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Hero Carousel Sliders">
      <div className="space-y-6">
        {/* Header Intro */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-neutral-500">
              Manage the responsive, touch-friendly homepage hero carousel (inspired by GhorerBazar).
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-extrabold text-xs rounded-full shadow-md transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Slide</span>
          </button>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Sliders Grid / List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-10 text-center text-xs text-neutral-400">
              Loading sliders...
            </div>
          ) : sliders.length === 0 ? (
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-10 text-center text-xs text-neutral-400">
              No hero slides configured. Click "Add Slide" to create the first homepage carousel slide.
            </div>
          ) : (
            sliders.map((slide) => {
              const desktopImg = formatImg(slide.image);
              const mobileImg = slide.mobile_image ? formatImg(slide.mobile_image) : null;

              return (
                <div
                  key={slide.id}
                  className="bg-white border border-neutral-200/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center gap-5 hover:border-neutral-300 transition"
                >
                  {/* Banner Preview Thumbnail */}
                  <div className="relative w-full md:w-56 h-32 rounded-2xl overflow-hidden bg-neutral-900 shrink-0 border border-neutral-200">
                    <img
                      src={desktopImg}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                    {slide.badge_text && (
                      <span className="absolute top-2 left-2 bg-amber-400 text-neutral-950 font-bold text-[10px] px-2 py-0.5 rounded-md shadow-xs">
                        {slide.badge_text}
                      </span>
                    )}
                    {mobileImg && (
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white font-semibold text-[9px] px-1.5 py-0.5 rounded backdrop-blur-xs">
                        +Mobile Img
                      </span>
                    )}
                  </div>

                  {/* Slide Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold text-neutral-400">
                        Order #{slide.order}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          slide.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {slide.is_active ? 'Live' : 'Hidden'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-neutral-900 leading-snug">
                      {slide.title}
                    </h3>

                    {slide.subtitle && (
                      <p className="text-xs text-neutral-500 line-clamp-2">{slide.subtitle}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-neutral-400">
                      <span>CTA: <strong className="text-neutral-700">{slide.cta_text}</strong></span>
                      <span>Link: <strong className="text-neutral-700">{slide.link_url}</strong></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 w-full md:w-auto pt-2 border-t border-neutral-100 md:border-t-0 md:pt-0 shrink-0">
                    <button
                      onClick={() => handleToggle(slide.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition border ${
                        slide.is_active
                          ? 'border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      {slide.is_active ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Show</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenEdit(slide)}
                      className="p-2 rounded-full text-neutral-500 hover:text-[#1b3b2b] hover:bg-neutral-100 transition"
                      title="Edit Slide"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(slide.id)}
                      className="p-2 rounded-full text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete Slide"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add/Edit Slide Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl my-8">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <h3 className="text-lg font-black text-neutral-900">
                  {editingSlider ? 'Edit Hero Slider' : 'Add Hero Slider'}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 rounded-2xl text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>GhorerBazar স্টাইল সিঙ্গেল ব্যানার সিস্টেম:</span>
                </p>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  ব্যানার ইমেজের ভেতরেই আকর্ষণীয় ডিজাইন, অফার ও লেখা যুক্ত করে ১টি ইমেজ আপলোড করুন। সাইটের মোবাইল, ট্যাবলেট ও পিসি সব ডিভাইসে কোনো ক্রপিং বা লেখা কাটা ছাড়াই স্বয়ংক্রিয়ভাবে পারফেক্ট সাইজে অ্যাডজাস্ট হবে।
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* 1. Primary Banner Image Upload */}
                <div className="space-y-2">
                  <label className="block font-bold text-neutral-800">
                    ব্যানার ইমেজ (Banner Image) <span className="text-rose-500">*</span>
                  </label>

                  {/* Image Preview Box */}
                  {(previewUrl || editingSlider?.image) && (
                    <div className="relative w-full aspect-[21/8] max-h-40 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-200 shadow-inner group">
                      <img
                        src={previewUrl || formatImg(editingSlider.image)}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white font-semibold text-[10px] px-2 py-0.5 rounded backdrop-blur-xs">
                        {previewUrl ? 'নতুন সিলেক্ট করা ব্যানার' : 'বর্তমান ব্যানার'}
                      </span>
                    </div>
                  )}

                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      id="banner-file-input"
                      onChange={(e) => setImageFile(e.target.files[0])}
                      className="w-full text-xs text-neutral-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#1b3b2b]/10 file:text-[#1b3b2b] hover:file:bg-[#1b3b2b]/20 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    💡 প্রস্তাবিত সাইজ: <strong>1000 × 400 px</strong> বা <strong>1600 × 640 px</strong> (Ghorer Bazar স্ট্যান্ডার্ড 2.5:1 রেশিও)। মোবাইলের জন্য আলাদা দিতে চাইলে 500 × 280 px (16:9 রেশিও)।
                  </p>
                </div>

                {/* 2. Target Link URL */}
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    ক্লিক করলে কোন পেজে যাবে (Target Link URL)
                  </label>
                  <input
                    type="text"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="/products (বা /products?category=panjabi)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">ডিফল্টভাবে <code>/products</code> পেজে যাবে। ভিজিটর ব্যানারে যেকোনো জায়গায় ক্লিক করলে এই লিংকে চলে যাবে।</p>
                </div>

                {/* 3. Title (Optional) */}
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    ব্যানারের নাম (Title - ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="যেমন: ঈদ স্পেশাল কালেকশন (ফাঁকা রাখলে ব্যানার #১ স্বয়ংক্রিয়ভাবে হবে)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
                  />
                </div>

                {/* 4. Display Order & Status */}
                <div className="grid grid-cols-2 gap-4 items-center pt-1">
                  <div>
                    <label className="block font-bold text-neutral-800 mb-1">প্রদর্শনের ক্রম (Order)</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
                    />
                  </div>
                  <div className="pt-5">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-800">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="rounded text-[#1b3b2b] focus:ring-[#1b3b2b] w-4 h-4"
                      />
                      <span>ওয়েবসাইটে লাইভ দেখাবে</span>
                    </label>
                  </div>
                </div>

                {/* 5. Collapsible Advanced Settings (Optional Subtitle, Badge, Mobile Image) */}
                <div className="border border-neutral-200/80 rounded-2xl overflow-hidden pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full px-4 py-2.5 bg-neutral-50/80 hover:bg-neutral-100 flex items-center justify-between text-neutral-700 font-bold text-xs transition"
                  >
                    <span>অতিরিক্ত সেটিংস (ঐচ্ছিক)</span>
                    {showAdvanced ? (
                      <ChevronUp className="w-4 h-4 text-neutral-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-500" />
                    )}
                  </button>

                  {showAdvanced && (
                    <div className="p-4 space-y-3 bg-white border-t border-neutral-100">
                      <div>
                        <label className="block font-medium text-neutral-700 mb-1">সাবটাইটেল (Subtitle)</label>
                        <input
                          type="text"
                          value={formData.subtitle}
                          onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                          placeholder="ট্যাগলাইন বা অফার ডেসক্রিপশন"
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-medium text-neutral-700 mb-1">ব্যাজ টেক্সট (Badge)</label>
                          <input
                            type="text"
                            value={formData.badge_text}
                            onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                            placeholder="যেমন: ৩০% ছাড়"
                            className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-neutral-700 mb-1">বাটন টেক্সট (CTA)</label>
                          <input
                            type="text"
                            value={formData.cta_text}
                            onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                            placeholder="যেমন: শপ নাও"
                            className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-medium text-neutral-700 mb-1">
                          আলাদা মোবাইল ব্যানার (ঐচ্ছিক)
                        </label>
                        {editingSlider?.mobile_image && (
                          <div className="mb-2 w-16 h-16 rounded-lg overflow-hidden border border-neutral-200">
                            <img src={formatImg(editingSlider.mobile_image)} alt="Current Mobile" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setMobileImageFile(e.target.files[0])}
                          className="w-full text-xs text-neutral-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-amber-100 file:text-amber-900"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Buttons */}
                <div className="flex gap-3 pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-50 transition"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-extrabold shadow-md transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'সেভ হচ্ছে...' : editingSlider ? 'পরিবর্তন সংরক্ষণ করুন' : 'ব্যানার যোগ করুন'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSlidersPage;


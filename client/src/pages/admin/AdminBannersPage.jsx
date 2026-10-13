import React, { useState, useEffect } from 'react';
import {
  Image,
  Plus,
  Trash2,
  Check,
  Eye,
  EyeOff,
  X,
  Upload,
  Calendar,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api, { formatImageUrl } from '../../api/axios';

const formatImg = (url) => formatImageUrl(url);

const COLOR_MAP = {
  pine: 'bg-[#1b3b2b] text-white',
  pinedeep: 'bg-[#142e22] text-white',
  mustard: 'bg-amber-500 text-neutral-950',
  clay: 'bg-orange-700 text-white',
};

const AdminBannersPage = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    badge_text: '',
    background_color: 'pinedeep',
    cta_text: 'Shop now',
    link_url: '/products',
    order: 0,
    is_active: true,
  });
  const [imageFile, setImageFile] = useState(null);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const res = await api.get('/promotions/banners/');
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.results)
          ? res.data.results
          : [];
      setBanners(data);
    } catch (err) {
      console.error('Failed to load banners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      subtitle: '',
      badge_text: '',
      background_color: 'pinedeep',
      cta_text: 'Shop now',
      link_url: '/products',
      order: banners.length + 1,
      is_active: true,
    });
    setImageFile(null);
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleToggle = async (id) => {
    try {
      await api.post(`/promotions/banners/${id}/toggle/`);
      loadBanners();
    } catch (err) {
      console.error('Failed to toggle banner:', err);
      alert('Could not update banner status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this promotional banner?')) return;
    try {
      await api.delete(`/promotions/banners/${id}/`);
      loadBanners();
    } catch (err) {
      console.error('Failed to delete banner:', err);
      alert('Could not delete banner.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const form = new FormData();
      form.append('title', formData.title);
      form.append('subtitle', formData.subtitle);
      form.append('badge_text', formData.badge_text);
      form.append('background_color', formData.background_color);
      form.append('cta_text', formData.cta_text);
      form.append('link_url', formData.link_url);
      form.append('order', formData.order);
      form.append('is_active', formData.is_active);

      if (imageFile) {
        form.append('image', imageFile);
      }

      await api.post('/promotions/banners/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccessMsg('Promo banner created successfully!');
      setModalOpen(false);
      loadBanners();
    } catch (err) {
      console.error('Error creating banner:', err);
      setErrorMsg(
        err.response?.data?.detail ||
          (err.response?.data && JSON.stringify(err.response.data)) ||
          'Failed to create banner.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Promo Banners">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-neutral-500">
            Manage secondary promo strips and marketing banners.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-extrabold text-xs rounded-full shadow-md transition self-stretch sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Banner</span>
          </button>
        </div>

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-10 text-center text-xs text-neutral-400">
              Loading banners...
            </div>
          ) : banners.length === 0 ? (
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-10 text-center text-xs text-neutral-400">
              No promo banners yet. Click "Add Banner" to create one.
            </div>
          ) : (
            banners.map((b) => (
              <div
                key={b.id}
                className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div
                    className={`w-20 h-14 rounded-2xl shrink-0 flex items-center justify-center font-bold text-xs overflow-hidden ${
                      COLOR_MAP[b.background_color] || 'bg-neutral-800 text-white'
                    }`}
                  >
                    {b.image ? (
                      <img
                        src={formatImg(b.image)}
                        alt={b.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{b.badge_text || 'Banner'}</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-neutral-900">{b.title}</span>
                      {b.badge_text && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                          {b.badge_text}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                      Order: {b.order} &middot; Color: {b.background_color} &middot; Link: {b.link_url}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 w-full sm:w-auto pt-2 border-t border-neutral-100 sm:border-t-0 sm:pt-0">
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      b.is_active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {b.is_active ? 'Active' : 'Hidden'}
                  </span>

                  <button
                    onClick={() => handleToggle(b.id)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 transition"
                    title={b.is_active ? 'Turn off' : 'Turn on'}
                  >
                    {b.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleDelete(b.id)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl my-8">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <h3 className="text-lg font-black text-neutral-900">Add Promo Banner</h3>
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

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Banner Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Free Delivery on Orders Over ৳1500"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Badge Text</label>
                    <input
                      type="text"
                      value={formData.badge_text}
                      onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                      placeholder="e.g. SPECIAL OFFER"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Theme Color</label>
                    <select
                      value={formData.background_color}
                      onChange={(e) =>
                        setFormData({ ...formData, background_color: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs bg-white focus:outline-none focus:border-[#1b3b2b]"
                    >
                      <option value="pinedeep">Deep Pine Green</option>
                      <option value="pine">Pine Green</option>
                      <option value="mustard">Mustard Gold</option>
                      <option value="clay">Terracotta Clay</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Target Link</label>
                    <input
                      type="text"
                      value={formData.link_url}
                      onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Order</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Optional Banner Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="w-full text-xs text-neutral-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#1b3b2b]/10 file:text-[#1b3b2b]"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-extrabold shadow-md transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Create Banner'}
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

export default AdminBannersPage;


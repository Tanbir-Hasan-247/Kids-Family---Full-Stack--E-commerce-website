import React, { useState, useEffect } from 'react';
import { Plus, Check } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../api/axios';
import AdminBannerCard from '../../components/admin/banners/AdminBannerCard';
import AdminBannerModal from '../../components/admin/banners/AdminBannerModal';

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
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-extrabold text-xs rounded-full shadow-md transition self-stretch sm:self-auto shrink-0 cursor-pointer"
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
              <AdminBannerCard
                key={b.id}
                banner={b}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Modal */}
        <AdminBannerModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          errorMsg={errorMsg}
          formData={formData}
          setFormData={setFormData}
          setImageFile={setImageFile}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminBannersPage;

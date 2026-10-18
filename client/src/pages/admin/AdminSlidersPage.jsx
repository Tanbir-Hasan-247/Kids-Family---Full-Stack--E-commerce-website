import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../api/axios';
import AdminSliderHeader from '../../components/admin/sliders/AdminSliderHeader';
import AdminSliderCard from '../../components/admin/sliders/AdminSliderCard';
import AdminSliderModal from '../../components/admin/sliders/AdminSliderModal';

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
        <AdminSliderHeader onAddSlide={handleOpenAdd} />

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
            sliders.map((slide) => (
              <AdminSliderCard
                key={slide.id}
                slide={slide}
                onToggle={handleToggle}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Add/Edit Slide Modal */}
        <AdminSliderModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          editingSlider={editingSlider}
          errorMsg={errorMsg}
          formData={formData}
          setFormData={setFormData}
          previewUrl={previewUrl}
          setImageFile={setImageFile}
          setMobileImageFile={setMobileImageFile}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminSlidersPage;

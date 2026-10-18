import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../api/axios';
import AdminCategoryFilterBar from '../../components/admin/categories/AdminCategoryFilterBar';
import AdminCategoryTable from '../../components/admin/categories/AdminCategoryTable';
import AdminCategoryMobileCards from '../../components/admin/categories/AdminCategoryMobileCards';
import AdminCategoryDeleteModal from '../../components/admin/categories/AdminCategoryDeleteModal';
import AdminCategoryModal from '../../components/admin/categories/AdminCategoryModal';

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parent: '',
  });

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories/?all=true');
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.results)
          ? res.data.results
          : [];
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      parent: '',
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCategory(c);
    setFormData({
      name: c.name,
      slug: c.slug || '',
      parent: c.parent || '',
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        parent: formData.parent ? Number(formData.parent) : null,
      };

      if (editingCategory) {
        await api.patch(`/categories/${editingCategory.id}/`, payload);
        setSuccessMsg('Category updated successfully!');
      } else {
        await api.post('/categories/', payload);
        setSuccessMsg('Category created successfully!');
      }

      setModalOpen(false);
      loadCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      setErrorMsg(
        err.response?.data?.detail ||
          (err.response?.data && JSON.stringify(err.response.data)) ||
          'Failed to save category. Please ensure the name and slug are unique.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/categories/${id}/`);
      setDeleteConfirmId(null);
      setSuccessMsg('Category deleted successfully!');
      loadCategories();
    } catch (err) {
      console.error('Failed to delete category:', err);
      alert(err.response?.data?.detail || 'Could not delete category. Make sure no products are assigned to this category.');
    }
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.slug && c.slug.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminLayout title="Categories Management">
      <div className="space-y-6">
        {/* Top Control Bar */}
        <AdminCategoryFilterBar
          search={search}
          onSearchChange={setSearch}
          onAddCategory={handleOpenAdd}
        />

        {/* Alerts */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Desktop View: Table */}
        <AdminCategoryTable
          loading={loading}
          categories={filtered}
          onEdit={handleOpenEdit}
          onDelete={setDeleteConfirmId}
        />

        {/* Mobile View: High-density Category Cards */}
        <AdminCategoryMobileCards
          loading={loading}
          categories={filtered}
          onEdit={handleOpenEdit}
          onDelete={setDeleteConfirmId}
        />

        {/* Delete Confirmation Modal */}
        <AdminCategoryDeleteModal
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={() => handleDelete(deleteConfirmId)}
        />

        {/* Add/Edit Modal */}
        <AdminCategoryModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          editingCategory={editingCategory}
          categories={categories}
          errorMsg={errorMsg}
          formData={formData}
          setFormData={setFormData}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminCategoriesPage;

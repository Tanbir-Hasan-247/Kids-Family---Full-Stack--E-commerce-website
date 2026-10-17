import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Check,
  Eye,
  Sliders,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  Layers,
  Sparkles,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api, { formatImageUrl } from '../../api/axios';

const formatImg = (url) => formatImageUrl(url);

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [attributeTypes, setAttributeTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // Main product form data
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    base_price: '',
    description: '',
    is_active: true,
  });

  // Multiple variants state (like original Django formset)
  const [variantsList, setVariantsList] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, attrRes] = await Promise.all([
        api.get(`/products/?include_inactive=true&q=${encodeURIComponent(search)}`),
        api.get('/categories/?all=true'),
        api.get('/products/attributes/types/'),
      ]);

      const prodData = Array.isArray(prodRes.data)
        ? prodRes.data
        : Array.isArray(prodRes.data?.results)
          ? prodRes.data.results
          : [];

      const catData = Array.isArray(catRes.data)
        ? catRes.data
        : Array.isArray(catRes.data?.results)
          ? catRes.data.results
          : [];

      const attrData = Array.isArray(attrRes.data)
        ? attrRes.data
        : Array.isArray(attrRes.data?.results)
          ? attrRes.data.results
          : [];

      setProducts(prodData);
      setCategories(catData);
      setAttributeTypes(attrData);
    } catch (err) {
      console.error('Error fetching admin products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  // Color & Size helpers from attributeTypes
  const colorType = attributeTypes.find((t) => t.name.toLowerCase() === 'color');
  const sizeType = attributeTypes.find((t) => t.name.toLowerCase() === 'size');

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: categories[0]?.id ? String(categories[0].id) : '',
      base_price: '',
      description: '',
      is_active: true,
    });
    // Start with 1 default variant row
    setVariantsList([
      {
        tempId: Date.now(),
        sku: '',
        price: '',
        compare_at_price: '',
        stock: 50,
        colorId: '',
        sizeId: '',
        imageFile: null,
        imagePreview: '',
      },
    ]);
    setFormError('');
    setFormSuccess('');
    setModalOpen(true);
  };

  const handleOpenEdit = async (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category: String(p.category?.id || p.category || ''),
      base_price: p.base_price || p.starting_price || '',
      description: p.description || '',
      is_active: p.is_active,
    });

    // Fetch full product details including variants
    try {
      const res = await api.get(`/products/${p.id}/`);
      const full = res.data;
      if (full.variants && full.variants.length > 0) {
        setVariantsList(
          full.variants.map((v) => {
            const vColor = v.attributes?.find((a) => a.type_name?.toLowerCase() === 'color');
            const vSize = v.attributes?.find((a) => a.type_name?.toLowerCase() === 'size');

            return {
              id: v.id,
              sku: v.sku,
              price: v.price,
              compare_at_price: v.compare_at_price || '',
              stock: v.stock,
              colorId: vColor?.id ? String(vColor.id) : '',
              sizeId: vSize?.id ? String(vSize.id) : '',
              imageFile: null,
              imagePreview: v.image ? formatImg(v.image) : '',
              existing: true,
            };
          })
        );
      } else {
        setVariantsList([
          {
            tempId: Date.now(),
            sku: `${p.name.slice(0, 3).toUpperCase()}-01`,
            price: p.base_price,
            compare_at_price: '',
            stock: 25,
            colorId: '',
            sizeId: '',
            imageFile: null,
            imagePreview: '',
          },
        ]);
      }
    } catch (err) {
      console.warn('Could not fetch product variants for edit:', err);
      setVariantsList([]);
    }

    setFormError('');
    setFormSuccess('');
    setModalOpen(true);
  };

  const handleAddVariantRow = () => {
    const skuPrefix = formData.name ? formData.name.slice(0, 3).toUpperCase().replace(/\s+/g, '') : 'VAR';
    setVariantsList((prev) => [
      ...prev,
      {
        tempId: Date.now() + Math.random(),
        sku: `${skuPrefix}-${prev.length + 1}`,
        price: formData.base_price || '',
        compare_at_price: '',
        stock: 50,
        colorId: '',
        sizeId: '',
        imageFile: null,
        imagePreview: '',
      },
    ]);
  };

  const handleRemoveVariantRow = async (index, variant) => {
    if (variant.existing && variant.id) {
      if (window.confirm('Delete this saved variant from the database?')) {
        try {
          await api.delete(`/products/variants/${variant.id}/`);
        } catch (e) {
          console.warn('Failed to delete variant from DB:', e);
        }
      } else {
        return;
      }
    }
    setVariantsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index, field, value) => {
    setVariantsList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleVariantImageChange = (index, file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setVariantsList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], imageFile: file, imagePreview: preview };
      return copy;
    });
  };

  const handleGenerateAIDescription = async () => {
    if (!formData.name.trim()) {
      setFormError('অনুগ্রহ করে প্রথমে প্রোডাক্টের নাম (Product Name) লিখুন, তারপর AI বিবরণ তৈরি করবে।');
      return;
    }

    setIsGeneratingDescription(true);
    setFormError('');
    setFormSuccess('');

    try {
      const selectedCat = categories.find((c) => String(c.id) === String(formData.category));
      const res = await api.post('/ai/generate-description/', {
        name: formData.name.trim(),
        category: selectedCat ? selectedCat.name : formData.category,
        base_price: formData.base_price || 0,
      });

      if (res.data?.success && res.data?.description) {
        setFormData((prev) => ({
          ...prev,
          description: res.data.description,
        }));
        setFormSuccess('✨ AI দিয়ে আকর্ষণীয় প্রোডাক্ট বিবরণ তৈরি সম্পন্ন হয়েছে!');
      } else {
        setFormError('বিবরণ তৈরি করা সম্ভব হয়নি। অনুগ্রহ করে ম্যানুয়ালি লিখুন।');
      }
    } catch (err) {
      console.error('Failed to generate AI description:', err);
      setFormError('AI বিবরণ তৈরিতে সমস্যা হয়েছে। সার্ভার সংযোগ পরীক্ষা করুন।');
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const productPayload = {
        name: formData.name.trim(),
        category: Number(formData.category),
        base_price: formData.base_price,
        description: formData.description.trim(),
        is_active: formData.is_active,
      };

      let targetProductId = null;

      if (editingProduct) {
        // Update product info
        const res = await api.patch(`/products/${editingProduct.id}/`, productPayload);
        targetProductId = res.data.id;
      } else {
        // Create new product
        const res = await api.post('/products/', productPayload);
        targetProductId = res.data.id;
      }

      // Now process all variants
      for (const v of variantsList) {
        if (!v.sku || !v.price) continue;

        const attrIds = [];
        if (v.colorId) attrIds.push(Number(v.colorId));
        if (v.sizeId) attrIds.push(Number(v.sizeId));

        const varFormData = new FormData();
        varFormData.append('product', targetProductId);
        varFormData.append('sku', v.sku.trim());
        varFormData.append('price', v.price);
        if (v.compare_at_price) varFormData.append('compare_at_price', v.compare_at_price);
        varFormData.append('stock', v.stock || 0);

        attrIds.forEach((id) => {
          varFormData.append('attribute_ids', id);
        });

        if (v.imageFile) {
          varFormData.append('image', v.imageFile);
        }

        if (v.existing && v.id) {
          // Update existing variant
          try {
            await api.patch(`/products/variants/${v.id}/`, varFormData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          } catch (ve) {
            console.warn('Error updating variant:', ve);
          }
        } else {
          // Create new variant
          try {
            await api.post('/products/variants/', varFormData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          } catch (ve) {
            console.warn('Error creating variant:', ve);
          }
        }
      }

      setFormSuccess('Product and variants saved successfully!');
      setTimeout(() => {
        setModalOpen(false);
        loadData();
      }, 700);
    } catch (err) {
      console.error('Error saving product:', err);
      const detail =
        err.response?.data?.detail ||
        (err.response?.data && JSON.stringify(err.response.data)) ||
        'Error saving product. Please verify all required fields.';
      setFormError(detail);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}/`);
      setDeleteConfirmId(null);
      loadData();
    } catch (err) {
      console.error('Failed to delete product:', err);
      alert('Could not delete product. It may have associated orders.');
    }
  };

  const filteredProducts = products.filter((p) => {
    if (statusFilter === 'active') return p.is_active;
    if (statusFilter === 'inactive') return !p.is_active;
    return true;
  });

  return (
    <AdminLayout title="Products Management">
      <div className="space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            {/* Search */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 bg-white rounded-full border border-neutral-200 text-xs text-neutral-800 focus:outline-none focus:border-[#1b3b2b]"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex bg-neutral-200/70 p-1 rounded-full text-xs font-semibold self-start sm:self-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-full transition ${
                  statusFilter === 'all'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                All ({products.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1 rounded-full transition ${
                  statusFilter === 'active'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-3 py-1 rounded-full transition ${
                  statusFilter === 'inactive'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Inactive
              </button>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-extrabold text-xs rounded-full shadow-md transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block bg-white border border-neutral-200/80 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] text-neutral-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5 font-bold">Product</th>
                  <th className="py-3.5 px-4 font-bold">Category</th>
                  <th className="py-3.5 px-4 font-bold">Base Price</th>
                  <th className="py-3.5 px-4 font-bold">Variants</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-neutral-400">
                      Loading products...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-neutral-400">
                      No products found. Click "Add Product" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const thumb = p.thumbnail ? formatImg(p.thumbnail) : '';

                    return (
                      <tr key={p.id} className="hover:bg-neutral-50/70 transition">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-neutral-400" />
                              )}
                            </div>
                            <div className="min-w-0 max-w-xs">
                              <p className="font-bold text-neutral-900 text-xs sm:text-sm truncate">
                                {p.name}
                              </p>
                              {p.is_featured && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-sm">
                                  FEATURED
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-neutral-700">
                          {p.category_name || p.category?.name || '—'}
                        </td>
                        <td className="py-3.5 px-4 font-black text-xs sm:text-sm text-neutral-900">
                          ৳{Number(p.base_price || p.starting_price || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-neutral-600 font-medium">
                          {p.variants_count || p.variants?.length || 0} variant(s)
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              p.is_active
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-neutral-200 text-neutral-600'
                            }`}
                          >
                            {p.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-[#1b3b2b] hover:bg-neutral-100 transition"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(p.id)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View: High-density Touch Cards (No horizontal sliding needed!) */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-8 text-center text-xs text-neutral-400">
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-8 text-center text-xs text-neutral-400">
              No products found. Click "Add Product" to create one.
            </div>
          ) : (
            filteredProducts.map((p) => {
              const thumb = p.thumbnail ? formatImg(p.thumbnail) : '';

              return (
                <div
                  key={p.id}
                  className="bg-white border border-neutral-200/80 rounded-2xl p-3.5 shadow-xs space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-neutral-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1.5">
                        <p className="font-bold text-neutral-900 text-xs line-clamp-2 leading-snug">
                          {p.name}
                        </p>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            p.is_active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-neutral-500 mt-1">
                        {p.category_name || p.category?.name || '—'}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100">
                        <span className="font-black text-sm text-[#1b3b2b]">
                          ৳{Number(p.base_price || p.starting_price || 0).toLocaleString()}
                        </span>
                        <span className="text-[11px] text-neutral-500 font-medium">
                          {p.variants_count || p.variants?.length || 0} variant(s)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="flex-1 py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#1b3b2b] text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Product</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(p.id)}
                      className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-neutral-900">Delete Product?</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Are you sure you want to delete this product? All variants and images will be removed.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADD / EDIT PRODUCT MODAL (With Multiple Variants & Image Upload) */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4 overflow-y-auto backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-3xl w-full space-y-6 shadow-2xl my-6 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4 sticky top-0 bg-white z-10">
                <div>
                  <h3 className="text-lg font-black text-neutral-900">
                    {editingProduct ? 'Edit Product & Variants' : 'Add New Product'}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Configure details and upload multiple variant images
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-neutral-400 hover:text-neutral-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 text-xs">
                {/* SECTION 1: Product Basics */}
                <div className="bg-neutral-50/80 p-4 sm:p-5 rounded-2xl border border-neutral-200/80 space-y-4">
                  <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
                    1. Product Information
                  </h4>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Royal Maroon Kids Panjabi & Pajama Set"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#1b3b2b] text-xs bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#1b3b2b] text-xs bg-white"
                      >
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">
                        Base Price (৳) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.base_price}
                        onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                        placeholder="e.g. 1450"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#1b3b2b] text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-bold text-neutral-700">
                        Description / পণ্যের বিবরণ
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateAIDescription}
                        disabled={isGeneratingDescription || !formData.name.trim()}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg text-[11px] font-bold shadow-xs hover:shadow transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        title="AI দিয়ে আকর্ষণীয় বাংলা ও ইংরেজি বিবরণ স্বয়ংক্রিয়ভাবে তৈরি করুন"
                      >
                        <Sparkles className={`w-3.5 h-3.5 text-amber-200 ${isGeneratingDescription ? 'animate-spin' : 'animate-pulse'}`} />
                        <span>{isGeneratingDescription ? 'AI বিবরণ লিখছে...' : '✨ AI দিয়ে বিবরণ লিখুন'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={5}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="পোশাকের বিস্তারিত কাপড়ের কোয়ালিটি, সাইজ এবং ওয়াশ কেয়ার..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#1b3b2b] text-xs bg-white leading-relaxed font-normal"
                    />
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-700">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="rounded text-[#1b3b2b] focus:ring-0"
                      />
                      <span>Active (Publicly visible in storefront)</span>
                    </label>
                  </div>
                </div>

                {/* SECTION 2: Variants & Multiple Images */}
                <div className="bg-neutral-50/80 p-4 sm:p-5 rounded-2xl border border-neutral-200/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200/70 pb-3">
                    <div>
                      <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-[#1b3b2b]" />
                        <span>2. Product Variants & Images ({variantsList.length})</span>
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        Add colors, sizes, inventory, and upload high-resolution images for each variant.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddVariantRow}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-bold text-xs rounded-full shadow-xs transition self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Variant</span>
                    </button>
                  </div>

                  {/* List of Variant Cards (Responsive on Mobile) */}
                  <div className="space-y-4">
                    {variantsList.map((variant, index) => (
                      <div
                        key={variant.id || variant.tempId || index}
                        className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                          <span className="font-extrabold text-[#1b3b2b] text-xs">
                            Variant #{index + 1}
                          </span>
                          {variantsList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveVariantRow(index, variant)}
                              className="text-neutral-400 hover:text-rose-600 transition p-1"
                              title="Remove Variant"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Variant fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                              SKU *
                            </label>
                            <input
                              type="text"
                              required
                              value={variant.sku}
                              onChange={(e) =>
                                handleVariantChange(index, 'sku', e.target.value)
                              }
                              placeholder="e.g. KP-RED-M"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                              Selling Price (৳) *
                            </label>
                            <input
                              type="number"
                              required
                              value={variant.price}
                              onChange={(e) =>
                                handleVariantChange(index, 'price', e.target.value)
                              }
                              placeholder="1450"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                              Original Price (৳)
                            </label>
                            <input
                              type="number"
                              value={variant.compare_at_price}
                              onChange={(e) =>
                                handleVariantChange(index, 'compare_at_price', e.target.value)
                              }
                              placeholder="Optional (Sale)"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                              Stock Qty *
                            </label>
                            <input
                              type="number"
                              required
                              value={variant.stock}
                              onChange={(e) =>
                                handleVariantChange(index, 'stock', Number(e.target.value))
                              }
                              placeholder="30"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
                            />
                          </div>
                        </div>

                        {/* Attributes (Color, Size) & Image */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 items-center">
                          {/* Color */}
                          <div>
                            <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                              Color Attribute
                            </label>
                            <select
                              value={variant.colorId}
                              onChange={(e) =>
                                handleVariantChange(index, 'colorId', e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs bg-white focus:outline-none focus:border-[#1b3b2b]"
                            >
                              <option value="">— Select Color —</option>
                              {colorType?.values?.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.value}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Size */}
                          <div>
                            <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                              Size Attribute
                            </label>
                            <select
                              value={variant.sizeId}
                              onChange={(e) =>
                                handleVariantChange(index, 'sizeId', e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs bg-white focus:outline-none focus:border-[#1b3b2b]"
                            >
                              <option value="">— Select Size —</option>
                              {sizeType?.values?.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.value}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Variant Image Upload */}
                          <div>
                            <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                              Variant Image
                            </label>
                            <div className="flex items-center gap-2">
                              {variant.imagePreview ? (
                                <div className="w-9 h-9 rounded-lg overflow-hidden border border-neutral-200 shrink-0">
                                  <img
                                    src={variant.imagePreview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 shrink-0">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  handleVariantImageChange(index, e.target.files[0])
                                }
                                className="w-full text-[11px] text-neutral-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-[#1b3b2b]/10 file:text-[#1b3b2b]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex gap-3 pt-4 border-t border-neutral-100 sticky bottom-0 bg-white py-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-3 rounded-xl border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="flex-1 py-3 rounded-xl bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-extrabold shadow-md transition disabled:opacity-50"
                  >
                    {formSubmitting
                      ? 'Saving Product & Variants...'
                      : editingProduct
                        ? 'Save Changes'
                        : 'Create Product'}
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

export default AdminProductsPage;

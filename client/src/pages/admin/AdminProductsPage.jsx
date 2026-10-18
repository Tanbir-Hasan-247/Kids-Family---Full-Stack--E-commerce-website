import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api, { formatImageUrl } from '../../api/axios';
import AdminProductFilterBar from '../../components/admin/products/AdminProductFilterBar';
import AdminProductTable from '../../components/admin/products/AdminProductTable';
import AdminProductMobileCards from '../../components/admin/products/AdminProductMobileCards';
import AdminProductDeleteModal from '../../components/admin/products/AdminProductDeleteModal';
import AdminProductModal from '../../components/admin/products/AdminProductModal';

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

  // Multiple variants state
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
        <AdminProductFilterBar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          totalCount={products.length}
          onAddProduct={handleOpenAdd}
        />

        {/* Desktop View: Table */}
        <AdminProductTable
          loading={loading}
          products={filteredProducts}
          onEdit={handleOpenEdit}
          onDelete={setDeleteConfirmId}
        />

        {/* Mobile View: High-density Touch Cards */}
        <AdminProductMobileCards
          loading={loading}
          products={filteredProducts}
          onEdit={handleOpenEdit}
          onDelete={setDeleteConfirmId}
        />

        {/* Delete Confirmation Modal */}
        <AdminProductDeleteModal
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={() => handleDelete(deleteConfirmId)}
        />

        {/* ADD / EDIT PRODUCT MODAL (With Multiple Variants & Image Upload) */}
        <AdminProductModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          editingProduct={editingProduct}
          formData={formData}
          setFormData={setFormData}
          categories={categories}
          isGeneratingDescription={isGeneratingDescription}
          handleGenerateAIDescription={handleGenerateAIDescription}
          variantsList={variantsList}
          handleAddVariantRow={handleAddVariantRow}
          handleRemoveVariantRow={handleRemoveVariantRow}
          handleVariantChange={handleVariantChange}
          handleVariantImageChange={handleVariantImageChange}
          colorType={colorType}
          sizeType={sizeType}
          formError={formError}
          formSuccess={formSuccess}
          formSubmitting={formSubmitting}
          onSubmit={handleSubmit}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminProductsPage;

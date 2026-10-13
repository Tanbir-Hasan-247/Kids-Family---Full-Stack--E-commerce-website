import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, X, Check, AlertCircle } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../api/axios';

const AdminAttributesPage = () => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newTypeName, setNewTypeName] = useState('');
  const [submittingValue, setSubmittingValue] = useState(false);
  const [submittingType, setSubmittingType] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadAttributes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products/attributes/types/');
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.results)
          ? res.data.results
          : [];
      setTypes(data);
      if (data.length > 0 && !selectedTypeId) {
        setSelectedTypeId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load attribute types:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttributes();
  }, []);

  const handleAddValue = async (e) => {
    e.preventDefault();
    if (!selectedTypeId || !newValue.trim()) return;

    setSubmittingValue(true);
    setMessage('');
    setErrorMsg('');
    try {
      await api.post('/products/attributes/values/', {
        attribute_type: selectedTypeId,
        value: newValue.trim(),
      });
      setNewValue('');
      setMessage('Attribute value added successfully!');
      loadAttributes();
    } catch (err) {
      console.error('Error adding attribute value:', err);
      setErrorMsg('Failed to add value. It might already exist.');
    } finally {
      setSubmittingValue(false);
    }
  };

  const handleAddType = async (e) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    setSubmittingType(true);
    setMessage('');
    setErrorMsg('');
    try {
      await api.post('/products/attributes/types/', {
        name: newTypeName.trim(),
      });
      setNewTypeName('');
      setMessage('Attribute type created successfully!');
      loadAttributes();
    } catch (err) {
      console.error('Error adding attribute type:', err);
      setErrorMsg('Failed to add type. Make sure the name is unique.');
    } finally {
      setSubmittingType(false);
    }
  };

  const handleDeleteValue = async (valId) => {
    if (!window.confirm('Delete this attribute value? Variants using it may be affected.')) {
      return;
    }

    try {
      await api.delete(`/products/attributes/values/${valId}/`);
      loadAttributes();
    } catch (err) {
      console.error('Failed to delete value:', err);
      alert('Could not delete value. It may be linked to active variants.');
    }
  };

  return (
    <AdminLayout title="Product Attributes">
      <div className="space-y-6">
        {/* Alerts */}
        {message && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Existing types and their values */}
          <div className="lg:col-span-2 space-y-5">
            {loading ? (
              <div className="bg-white border border-neutral-200/80 rounded-3xl p-8 text-center text-xs text-neutral-400">
                Loading attributes...
              </div>
            ) : types.length === 0 ? (
              <div className="bg-white border border-neutral-200/80 rounded-3xl p-8 text-center text-xs text-neutral-400">
                No attribute types found. Create "Color" or "Size" to get started.
              </div>
            ) : (
              types.map((type) => (
                <div
                  key={type.id}
                  className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[#1b3b2b]" />
                      <h3 className="text-base font-bold text-neutral-900">{type.name}</h3>
                    </div>
                    <span className="text-xs font-semibold text-neutral-400">
                      {type.values?.length || 0} option(s)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {type.values && type.values.length > 0 ? (
                      type.values.map((val) => (
                        <div
                          key={val.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50/80 text-xs font-bold text-neutral-800 group hover:border-neutral-300 transition"
                        >
                          <span>{val.value}</span>
                          <button
                            onClick={() => handleDeleteValue(val.id)}
                            className="text-neutral-400 hover:text-rose-600 transition"
                            title={`Delete ${val.value}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-neutral-400 italic">
                        No values added yet for {type.name}. Use the form on the right.
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* RIGHT: Add Forms */}
          <div className="space-y-6">
            {/* Form 1: Add Value */}
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100">
                Add an Attribute Value
              </h3>

              <form onSubmit={handleAddValue} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Select Type</label>
                  <select
                    value={selectedTypeId}
                    onChange={(e) => setSelectedTypeId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-xs bg-white focus:outline-none focus:border-[#1b3b2b]"
                  >
                    <option value="">Select type...</option>
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Value Name</label>
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="e.g. Navy Blue, 5-6Y, Cotton"
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingValue}
                  className="w-full py-2.5 rounded-xl bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-extrabold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{submittingValue ? 'Adding...' : 'Add Value'}</span>
                </button>
              </form>
            </div>

            {/* Form 2: Add Attribute Type */}
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100">
                Add New Attribute Type
              </h3>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Add a new classification beyond Color and Size (e.g. Fabric, Sleeve Type, Age
                Bracket).
              </p>

              <form onSubmit={handleAddType} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Type Name</label>
                  <input
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="e.g. Material"
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingType}
                  className="w-full py-2.5 rounded-xl border border-neutral-300 hover:border-[#1b3b2b] text-neutral-800 hover:text-[#1b3b2b] font-bold text-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{submittingType ? 'Creating...' : 'Create Type'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAttributesPage;


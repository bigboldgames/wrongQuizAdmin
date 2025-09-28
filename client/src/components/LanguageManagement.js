import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Edit, Globe, Check, X, Save } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const LanguageManagement = () => {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm();

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/languages');
      setLanguages(response.data);
    } catch (error) {
      console.error('Failed to fetch languages:', error);
      toast.error('Failed to load languages');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (editingId) {
        await axios.put(`/api/languages/${editingId}`, data);
        toast.success('Language updated successfully');
        setEditingId(null);
      } else {
        await axios.post('/api/languages', data);
        toast.success('Language created successfully');
      }
      setShowAddForm(false);
      reset();
      fetchLanguages();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save language';
      toast.error(message);
    }
  };

  const handleEdit = (language) => {
    setEditingId(language.id);
    setValue('code', language.code);
    setValue('name', language.name);
    setValue('native_name', language.native_name);
    setValue('is_active', language.is_active);
    setValue('is_default', language.is_default);
    setShowAddForm(true);
  };

  const handleDelete = async (languageId) => {
    if (!window.confirm('Are you sure you want to delete this language? This will also delete all associated content.')) {
      return;
    }

    try {
      setDeletingId(languageId);
      await axios.delete(`/api/languages/${languageId}`);
      toast.success('Language deleted successfully');
      fetchLanguages();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete language';
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    reset();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Language Management</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Language
        </button>
      </div>

      {/* Add/Edit Language Form */}
      {showAddForm && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="card-title">
              {editingId ? 'Edit Language' : 'Add New Language'}
            </h3>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Language Code</label>
                <input
                  type="text"
                  className={`form-input ${errors.code ? 'error' : ''}`}
                  placeholder="e.g., en, hi, ur"
                  {...register('code', {
                    required: 'Language code is required',
                    minLength: {
                      value: 2,
                      message: 'Code must be at least 2 characters'
                    },
                    maxLength: {
                      value: 5,
                      message: 'Code must be at most 5 characters'
                    }
                  })}
                />
                {errors.code && (
                  <p className="error-message">{errors.code.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Language Name</label>
                <input
                  type="text"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="e.g., English, Hindi"
                  {...register('name', {
                    required: 'Language name is required'
                  })}
                />
                {errors.name && (
                  <p className="error-message">{errors.name.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Native Name</label>
                <input
                  type="text"
                  className={`form-input ${errors.native_name ? 'error' : ''}`}
                  placeholder="e.g., English, हिन्दी"
                  {...register('native_name', {
                    required: 'Native name is required'
                  })}
                />
                {errors.native_name && (
                  <p className="error-message">{errors.native_name.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      {...register('is_active')}
                    />
                    <span className="ml-2 text-sm">Active</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      {...register('is_default')}
                    />
                    <span className="ml-2 text-sm">Default Language</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button type="submit" className="btn btn-primary">
                <Save className="w-4 h-4" />
                {editingId ? 'Update Language' : 'Create Language'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-outline"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Languages Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Available Languages</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Native Name</th>
                <th>Status</th>
                <th>Default</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {languages.map((language) => (
                <tr key={language.id}>
                  <td>
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {language.code}
                    </span>
                  </td>
                  <td className="font-medium">{language.name}</td>
                  <td className="font-medium">{language.native_name}</td>
                  <td>
                    <span className={`badge ${language.is_active ? 'success' : 'user'}`}>
                      {language.is_active ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        'Inactive'
                      )}
                    </span>
                  </td>
                  <td>
                    {language.is_default && (
                      <span className="badge admin">
                        <Check className="w-3 h-3 mr-1" />
                        Default
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(language)}
                        className="btn btn-outline btn-sm"
                        title="Edit language"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(language.id)}
                        disabled={deletingId === language.id || language.is_default}
                        className="btn btn-danger btn-sm"
                        title="Delete language"
                      >
                        {deletingId === language.id ? (
                          <div className="spinner"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LanguageManagement;



import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Edit, Save, X, Globe, FileText, Languages, ChevronRight } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ContentManagement = () => {
  const [pages, setPages] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [content, setContent] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm();


  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [pagesResponse, languagesResponse] = await Promise.all([
        axios.get('/api/content/pages'),
        axios.get('/api/languages/active')
      ]);
      setPages(pagesResponse.data);
      setLanguages(languagesResponse.data);
      
      // Set default values
      if (pagesResponse.data.length > 0) {
        setSelectedPage(pagesResponse.data[0].slug);
      }
      if (languagesResponse.data.length > 0) {
        setSelectedLanguage(languagesResponse.data[0].code);
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchContent = async () => {
    try {
      const response = await axios.get(`/api/content/${selectedPage}/${selectedLanguage}`);
      setContent(response.data);
    } catch (error) {
      console.error('Failed to fetch content:', error);
      toast.error('Failed to load content');
    }
  };

  useEffect(() => {
    if (selectedPage && selectedLanguage) {
      fetchContent();
    }
  }, [selectedPage, selectedLanguage]);

  const onSubmit = async (data) => {
    try {
      if (editingId) {
        await axios.put(`/api/content/${editingId}`, { content: data.content });
        toast.success('Content updated successfully');
        setEditingId(null);
      } else {
        await axios.post('/api/content', {
          ...data,
          language_code: selectedLanguage
        });
        toast.success('Content created successfully');
      }
      setShowAddForm(false);
      reset();
      fetchContent();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save content';
      toast.error(message);
    }
  };

  const handleEdit = (contentItem) => {
    setEditingId(contentItem.id);
    setValue('page', contentItem.page);
    setValue('section', contentItem.section);
    setValue('key', contentItem.key);
    setValue('content', contentItem.content);
    setShowAddForm(true);
  };

  const handleDelete = async (contentId) => {
    if (!window.confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      await axios.delete(`/api/content/${contentId}`);
      toast.success('Content deleted successfully');
      fetchContent();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete content';
      toast.error(message);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    reset();
  };

  const getLanguageName = (code) => {
    const language = languages.find(lang => lang.code === code);
    return language ? language.native_name : code;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-indigo-600 animate-float" />
          <h2 className="text-2xl font-bold text-gray-900">Content Management</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary animate-bounceGentle"
        >
          <Plus className="w-4 h-4" />
          Add Content
        </button>
      </div>

      {/* Language Selection */}
      <div className="card mb-6 animate-slideUp">
        <div className="card-header">
          <h3 className="card-title flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Select Language
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => setSelectedLanguage(language.code)}
              className={`px-4 py-2 rounded-lg border transition-all duration-300 ${
                selectedLanguage === language.code
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg transform scale-105'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              {language.native_name}
            </button>
          ))}
        </div>
      </div>

      {/* Page Tabs */}
      {selectedLanguage && (
        <div className="card mb-6 animate-slideUp">
          <div className="card-header">
            <h3 className="card-title flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Pages
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {pages.map((page) => (
              <button
                key={page.slug}
                onClick={() => setSelectedPage(page.slug)}
                className={`px-4 py-2 rounded-lg border transition-all duration-300 flex items-center gap-2 ${
                  selectedPage === page.slug
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                {page.title}
                {selectedPage === page.slug && <ChevronRight className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Content Form */}
      {showAddForm && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="card-title">
              {editingId ? 'Edit Content' : 'Add New Content'}
            </h3>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Page</label>
                <select
                  className={`form-input ${errors.page ? 'error' : ''}`}
                  {...register('page', { required: 'Page is required' })}
                >
                  {pages.map((page) => (
                    <option key={page.id} value={page.slug}>
                      {page.title}
                    </option>
                  ))}
                </select>
                {errors.page && (
                  <p className="error-message">{errors.page.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Section</label>
                <input
                  type="text"
                  className={`form-input ${errors.section ? 'error' : ''}`}
                  placeholder="e.g., hero, main, footer"
                  {...register('section', {
                    required: 'Section is required'
                  })}
                />
                {errors.section && (
                  <p className="error-message">{errors.section.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Key</label>
                <input
                  type="text"
                  className={`form-input ${errors.key ? 'error' : ''}`}
                  placeholder="e.g., title, subtitle, description"
                  {...register('key', {
                    required: 'Key is required'
                  })}
                />
                {errors.key && (
                  <p className="error-message">{errors.key.message}</p>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Content</label>
              <textarea
                rows={4}
                className={`form-input ${errors.content ? 'error' : ''}`}
                placeholder="Enter the content text..."
                {...register('content', {
                  required: 'Content is required'
                })}
              />
              {errors.content && (
                <p className="error-message">{errors.content.message}</p>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button type="submit" className="btn btn-primary">
                <Save className="w-4 h-4" />
                {editingId ? 'Update Content' : 'Create Content'}
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

      {/* Content Display */}
      {selectedPage && selectedLanguage && (
        <div className="card animate-slideUp">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="card-title flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {pages.find(p => p.slug === selectedPage)?.title} 
                <span className="text-indigo-600">({getLanguageName(selectedLanguage)})</span>
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Languages className="w-4 h-4" />
                {content.length} items
              </div>
            </div>
          </div>
          
          {/* Group content by sections */}
          {(() => {
            const sections = {};
            content.forEach(item => {
              if (!sections[item.section]) {
                sections[item.section] = [];
              }
              sections[item.section].push(item);
            });

            return Object.keys(sections).length > 0 ? (
              <div className="space-y-6 p-6">
                {Object.entries(sections).map(([sectionName, sectionContent]) => (
                  <div key={sectionName} className="border rounded-lg p-4 bg-gray-50 animate-fadeIn">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                      {sectionName}
                    </h4>
                    <div className="grid gap-4">
                      {sectionContent.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-300">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-gray-900">{item.key}</span>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {new Date(item.updated_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-gray-700">{item.content}</p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleEdit(item)}
                                className="btn btn-outline btn-sm hover:bg-indigo-50"
                                title="Edit content"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="btn btn-danger btn-sm hover:bg-red-50"
                                title="Delete content"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">No content found for this page and language combination.</p>
                <p className="text-sm mt-2">Click "Add Content" to get started.</p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default ContentManagement;

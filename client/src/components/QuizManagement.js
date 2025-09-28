import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Edit, Save, X, BookOpen, Eye, Play } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const QuizManagement = () => {
  const [quizzes, setQuizzes] = useState([]);
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
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/quizzes');
      setQuizzes(response.data);
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (editingId) {
        await axios.put(`/api/quizzes/${editingId}`, data);
        toast.success('Quiz updated successfully');
        setEditingId(null);
      } else {
        await axios.post('/api/quizzes', data);
        toast.success('Quiz created successfully');
      }
      setShowAddForm(false);
      reset();
      fetchQuizzes();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save quiz';
      toast.error(message);
    }
  };

  const handleEdit = (quiz) => {
    setEditingId(quiz.id);
    setValue('title', quiz.title);
    setValue('description', quiz.description);
    setValue('is_active', quiz.is_active);
    setShowAddForm(true);
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz? This will also delete all questions and options.')) {
      return;
    }

    try {
      setDeletingId(quizId);
      await axios.delete(`/api/quizzes/${quizId}`);
      toast.success('Quiz deleted successfully');
      fetchQuizzes();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete quiz';
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <BookOpen className="w-8 h-8 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Quiz Management</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Quiz
        </button>
      </div>

      {/* Add/Edit Quiz Form */}
      {showAddForm && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="card-title">
              {editingId ? 'Edit Quiz' : 'Add New Quiz'}
            </h3>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Quiz Title</label>
                <input
                  type="text"
                  className={`form-input ${errors.title ? 'error' : ''}`}
                  placeholder="Enter quiz title"
                  {...register('title', {
                    required: 'Quiz title is required'
                  })}
                />
                {errors.title && (
                  <p className="error-message">{errors.title.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    {...register('is_active')}
                  />
                  <span className="ml-2 text-sm">Active</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                rows={3}
                className={`form-input ${errors.description ? 'error' : ''}`}
                placeholder="Enter quiz description"
                {...register('description')}
              />
              {errors.description && (
                <p className="error-message">{errors.description.message}</p>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button type="submit" className="btn btn-primary">
                <Save className="w-4 h-4" />
                {editingId ? 'Update Quiz' : 'Create Quiz'}
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

      {/* Quizzes Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Available Quizzes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Created By</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((quiz) => (
                <tr key={quiz.id}>
                  <td>
                    <div className="font-medium">{quiz.title}</div>
                  </td>
                  <td>
                    <div className="max-w-xs truncate" title={quiz.description}>
                      {quiz.description || 'No description'}
                    </div>
                  </td>
                  <td>
                    <span className="text-sm text-gray-600">
                      {quiz.created_by_name || 'Unknown'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${quiz.is_active ? 'success' : 'user'}`}>
                      {quiz.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-gray-600">
                      {formatDate(quiz.created_at)}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-outline btn-sm"
                        title="View quiz"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        title="Edit quiz"
                        onClick={() => handleEdit(quiz)}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        title="Manage questions"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(quiz.id)}
                        disabled={deletingId === quiz.id}
                        className="btn btn-danger btn-sm"
                        title="Delete quiz"
                      >
                        {deletingId === quiz.id ? (
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
          {quizzes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No quizzes found. Create your first quiz to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizManagement;



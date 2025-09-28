import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, RefreshCw, Database, Shield, Bell } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/dashboard/stats');
      setStats(response.data);
      setValue('totalUsers', response.data.totalUsers);
      setValue('totalOrders', response.data.totalOrders);
      setValue('totalRevenue', response.data.totalRevenue);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      await axios.put('/api/dashboard/stats', data);
      toast.success('Settings updated successfully');
      fetchStats();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update settings';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dashboard Stats Settings */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                <h3 className="card-title">Dashboard Statistics</h3>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="form-label">Total Users</label>
                  <input
                    type="number"
                    className={`form-input ${errors.totalUsers ? 'error' : ''}`}
                    {...register('totalUsers', {
                      required: 'Total users is required',
                      min: { value: 0, message: 'Must be a positive number' }
                    })}
                  />
                  {errors.totalUsers && (
                    <p className="error-message">{errors.totalUsers.message}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Total Orders</label>
                  <input
                    type="number"
                    className={`form-input ${errors.totalOrders ? 'error' : ''}`}
                    {...register('totalOrders', {
                      required: 'Total orders is required',
                      min: { value: 0, message: 'Must be a positive number' }
                    })}
                  />
                  {errors.totalOrders && (
                    <p className="error-message">{errors.totalOrders.message}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Total Revenue ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className={`form-input ${errors.totalRevenue ? 'error' : ''}`}
                    {...register('totalRevenue', {
                      required: 'Total revenue is required',
                      min: { value: 0, message: 'Must be a positive number' }
                    })}
                  />
                  {errors.totalRevenue && (
                    <p className="error-message">{errors.totalRevenue.message}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="spinner"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={fetchStats}
                  className="btn btn-outline"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* System Information */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                <h3 className="card-title">System Status</h3>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <span className="text-sm font-medium text-green-600">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Server</span>
                <span className="text-sm font-medium text-green-600">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Authentication</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-600" />
                <h3 className="card-title">Quick Actions</h3>
              </div>
            </div>
            <div className="space-y-2">
              <button className="btn btn-outline w-full justify-start">
                <RefreshCw className="w-4 h-4" />
                Refresh Dashboard
              </button>
              <button className="btn btn-outline w-full justify-start">
                <Database className="w-4 h-4" />
                Backup Database
              </button>
              <button className="btn btn-outline w-full justify-start">
                <Shield className="w-4 h-4" />
                Security Audit
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">System Info</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Version:</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Environment:</span>
                <span className="font-medium">Development</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium">
                  {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;



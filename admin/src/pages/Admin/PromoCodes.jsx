import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Search, Filter, Tag, Calendar, 
  Users, DollarSign, Percent, Eye, MoreHorizontal, Copy,
  RefreshCw, AlertTriangle, CheckCircle, XCircle, X, RotateCcw
} from 'lucide-react';
import {
  getPromoCodesApi,
  getPromoCodeByIdApi,
  createPromoCodeApi,
  updatePromoCodeApi,
  deletePromoCodeApi,
  togglePromoCodeStatusApi,
  getPromoCodeStatsApi,
  getExpiringPromoCodesApi,
  bulkCreatePromoCodesApi,
  validatePromoCodeApi,
  getSubscriptionsApi
} from '../../service/api.service';
import toast from 'react-hot-toast';

const PromoCodes = () => {
  const [promoCodes, setPromoCodes] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    discountType: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Form states
  const [createForm, setCreateForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderValue: '',
    maxDiscount: '',
    usageLimit: '',
    userUsageLimit: '',
    validFrom: '',
    validUntil: '',
    applicableCategories: ['universal'],
    applicableSubscriptions: []
  });

  const [editForm, setEditForm] = useState({});
  
  const [bulkForm, setBulkForm] = useState({
    count: 5,
    description: '',
    discountType: 'flat',
    discountValue: '',
    minOrderValue: '',
    usageLimit: '',
    userUsageLimit: '',
    validFrom: '',
    validUntil: '',
    applicableCategories: ['universal']
  });

  // Stats
  const [stats, setStats] = useState({
    totalCodes: 0,
    activeCodes: 0,
    totalUsage: 0,
    avgDiscount: 0
  });

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      
      if (searchTerm.trim()) {
        cleanFilters.search = searchTerm.trim();
      }

      const data = await getPromoCodesApi(cleanFilters);
      console.log('Promo Codes:', data);
      
      const codes = data.data.promoCodes || [];
      setPromoCodes(codes);
      
      // Calculate stats
      setStats({
        totalCodes: codes.length,
        activeCodes: codes.filter(code => code.status === 'active').length,
        totalUsage: codes.reduce((sum, code) => sum + (code.usedCount || 0), 0),
        avgDiscount: codes.length > 0 ? Math.round(codes.reduce((sum, code) => sum + code.discountValue, 0) / codes.length) : 0
      });
      
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast.error(error.response?.data?.message || 'Error fetching promo codes');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const data = await getSubscriptionsApi({ limit: 100, isActive: true });
      setSubscriptions(data.data.subscriptions || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
    fetchSubscriptions();
  }, [filters]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleCreatePromo = async () => {
    if (!createForm.code || !createForm.description || !createForm.discountValue) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...createForm,
        discountValue: parseFloat(createForm.discountValue),
        minOrderValue: parseFloat(createForm.minOrderValue) || 0,
        maxDiscount: createForm.maxDiscount ? parseFloat(createForm.maxDiscount) : undefined,
        usageLimit: parseInt(createForm.usageLimit) || undefined,
        userUsageLimit: parseInt(createForm.userUsageLimit) || 1
      };

      await createPromoCodeApi(payload);
      toast.success('Promo code created successfully!');
      setShowCreateModal(false);
      resetCreateForm();
      fetchPromoCodes();
    } catch (error) {
      console.error('Error creating promo code:', error);
      toast.error(error.response?.data?.message || 'Error creating promo code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePromo = async () => {
    if (!editForm.description) {
      toast.error('Description is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...editForm };
      if (payload.discountValue) payload.discountValue = parseFloat(payload.discountValue);
      if (payload.minOrderValue) payload.minOrderValue = parseFloat(payload.minOrderValue);
      if (payload.maxDiscount) payload.maxDiscount = parseFloat(payload.maxDiscount);
      if (payload.usageLimit) payload.usageLimit = parseInt(payload.usageLimit);
      if (payload.userUsageLimit) payload.userUsageLimit = parseInt(payload.userUsageLimit);

      await updatePromoCodeApi(selectedPromo._id, payload);
      toast.success('Promo code updated successfully!');
      setShowEditModal(false);
      setSelectedPromo(null);
      fetchPromoCodes();
    } catch (error) {
      console.error('Error updating promo code:', error);
      toast.error(error.response?.data?.message || 'Error updating promo code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePromo = async (promoId) => {
    if (!window.confirm('Are you sure you want to delete this promo code?')) {
      return;
    }

    setDeletingId(promoId);
    try {
      await deletePromoCodeApi(promoId);
      toast.success('Promo code deleted successfully!');
      fetchPromoCodes();
    } catch (error) {
      console.error('Error deleting promo code:', error);
      toast.error(error.response?.data?.message || 'Error deleting promo code');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (promoId) => {
    setTogglingId(promoId);
    try {
      await togglePromoCodeStatusApi(promoId);
      toast.success('Promo code status updated!');
      fetchPromoCodes();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error(error.response?.data?.message || 'Error updating status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleBulkCreate = async () => {
    if (!bulkForm.count || !bulkForm.description || !bulkForm.discountValue) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...bulkForm,
        count: parseInt(bulkForm.count),
        discountValue: parseFloat(bulkForm.discountValue),
        minOrderValue: parseFloat(bulkForm.minOrderValue) || 0,
        usageLimit: parseInt(bulkForm.usageLimit) || 50,
        userUsageLimit: parseInt(bulkForm.userUsageLimit) || 1
      };

      await bulkCreatePromoCodesApi(payload);
      toast.success(`${payload.count} promo codes created successfully!`);
      setShowBulkCreateModal(false);
      resetBulkForm();
      fetchPromoCodes();
    } catch (error) {
      console.error('Error bulk creating promo codes:', error);
      toast.error(error.response?.data?.message || 'Error creating promo codes');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchPromoDetails = async (promoId) => {
    try {
      const data = await getPromoCodeByIdApi(promoId);
      setSelectedPromo(data.data.promoCode || data.promoCode);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching promo details:', error);
      toast.error('Error fetching promo code details');
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderValue: '',
      maxDiscount: '',
      usageLimit: '',
      userUsageLimit: '',
      validFrom: '',
      validUntil: '',
      applicableCategories: ['universal'],
      applicableSubscriptions: []
    });
  };

  const resetBulkForm = () => {
    setBulkForm({
      count: 5,
      description: '',
      discountType: 'flat',
      discountValue: '',
      minOrderValue: '',
      usageLimit: '',
      userUsageLimit: '',
      validFrom: '',
      validUntil: '',
      applicableCategories: ['universal']
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      status: '',
      discountType: '',
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setSearchTerm('');
  };

  const hasActiveFilters = () => {
    return filters.status || filters.discountType || searchTerm;
  };

  const getStatusBadge = (promo) => {
    let status = promo.status || 'inactive';
    
    // Check if expired based on date
    if (promo.validUntil && new Date(promo.validUntil) < new Date()) {
      status = 'expired';
    }
    
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-400' },
      expired: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-400' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-400' }
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const discountTypes = [
    { value: '', label: 'All Types' },
    { value: 'percentage', label: 'Percentage' },
    { value: 'flat', label: 'Fixed Amount' }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'expired', label: 'Expired' }
  ];

  const categories = [
    { value: 'universal', label: 'Universal' },
    { value: 'food_vendor_specific', label: 'Food Vendor' },
    { value: 'home_chef_specific', label: 'Home Chef' }
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
            <div className="text-lg text-gray-400">Loading promo codes...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Promo Code Management</h1>
          <p className="text-gray-400 mt-1">Create and manage discount codes and promotional offers</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBulkCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Tag className="w-4 h-4" />
            Bulk Create
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Promo Code
          </button>
          <button
            onClick={fetchPromoCodes}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Codes</p>
              <p className="text-2xl font-bold text-white">{stats.totalCodes}</p>
            </div>
            <Tag className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Codes</p>
              <p className="text-2xl font-bold text-white">{stats.activeCodes}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Usage</p>
              <p className="text-2xl font-bold text-white">{stats.totalUsage}</p>
            </div>
            <Users className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg. Discount</p>
              <p className="text-2xl font-bold text-white">
                {stats.avgDiscount}{stats.totalCodes > 0 && promoCodes[0]?.discountType === 'percentage' ? '%' : ''}
              </p>
            </div>
            <Percent className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-white">Search & Filters</h2>
          </div>
          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
            >
              <RotateCcw className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>
        
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by code or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full"
            />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
          >
            {statusOptions.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <select
            value={filters.discountType}
            onChange={(e) => handleFilterChange('discountType', e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
          >
            {discountTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
          >
            <option value="desc">Latest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Promo Codes List */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-white">Promo Codes</h3>
          </div>
        </div>

        {promoCodes?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Discount</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Usage</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Validity</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {promoCodes.map((promo) => (
                  <tr key={promo._id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-white">{promo.code}</span>
                        <button
                          onClick={() => copyToClipboard(promo.code)}
                          className="text-gray-400 hover:text-orange-400 transition-colors"
                          title="Copy code"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white">
                        <div className="font-medium">{promo.description}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {promo.applicableCategories?.includes('universal') ? 'Universal' : 
                           promo.applicableCategories?.join(', ') || 'Universal'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-white font-semibold">
                          {promo.discountType === 'percentage' ? `${promo.discountValue}% off` : `₹${promo.discountValue} off`}
                        </div>
                        <div className="text-gray-400 text-xs">
                          Min: ₹{promo.minOrderValue || 0}
                          {promo.maxDiscount && ` • Max: ₹${promo.maxDiscount}`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-white font-semibold">
                          {promo.usedCount || 0}/{promo.usageLimit || '∞'}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {promo.usageLimit ? Math.round(((promo.usedCount || 0) / promo.usageLimit) * 100) : 0}% used
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-white">{formatDate(promo.validFrom)}</div>
                        <div className="text-gray-400 text-xs">to {formatDate(promo.validUntil)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(promo)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => fetchPromoDetails(promo._id)}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPromo(promo);
                            setEditForm({
                              description: promo.description,
                              discountValue: promo.discountValue,
                              minOrderValue: promo.minOrderValue,
                              maxDiscount: promo.maxDiscount,
                              usageLimit: promo.usageLimit,
                              userUsageLimit: promo.userUsageLimit
                            });
                            setShowEditModal(true);
                          }}
                          className="text-orange-400 hover:text-orange-300 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(promo._id)}
                          disabled={togglingId === promo._id}
                          className="text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                          title={promo.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {togglingId === promo._id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : promo.status === 'active' ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeletePromo(promo._id)}
                          disabled={deletingId === promo._id}
                          className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === promo._id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
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
        ) : (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <div className="text-lg text-gray-400 mb-2">No promo codes found</div>
            <div className="text-sm text-gray-500">Create your first promo code to get started</div>
          </div>
        )}
      </div>

      {/* Create Promo Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Create New Promo Code</h3>
              <button
                onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Promo Code *</label>
                  <input
                    type="text"
                    value={createForm.code}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="WELCOME50"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Discount Type *</label>
                  <select
                    value={createForm.discountType}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, discountType: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="flat">Fixed Amount</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Welcome discount for new users"
                  rows={2}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Discount Value *</label>
                  <input
                    type="number"
                    value={createForm.discountValue}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, discountValue: e.target.value }))}
                    placeholder={createForm.discountType === 'percentage' ? '50' : '100'}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Min Order Value</label>
                  <input
                    type="number"
                    value={createForm.minOrderValue}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, minOrderValue: e.target.value }))}
                    placeholder="100"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Discount</label>
                  <input
                    type="number"
                    value={createForm.maxDiscount}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, maxDiscount: e.target.value }))}
                    placeholder="500"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Usage Limit</label>
                  <input
                    type="number"
                    value={createForm.usageLimit}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, usageLimit: e.target.value }))}
                    placeholder="1000"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Per User Limit</label>
                  <input
                    type="number"
                    value={createForm.userUsageLimit}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, userUsageLimit: e.target.value }))}
                    placeholder="1"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Valid From *</label>
                  <input
                    type="datetime-local"
                    value={createForm.validFrom}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, validFrom: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Valid Until *</label>
                  <input
                    type="datetime-local"
                    value={createForm.validUntil}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, validUntil: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Applicable Categories</label>
                <div className="space-y-2">
                  {categories.map(category => (
                    <label key={category.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={createForm.applicableCategories.includes(category.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCreateForm(prev => ({
                              ...prev,
                              applicableCategories: [...prev.applicableCategories, category.value]
                            }));
                          } else {
                            setCreateForm(prev => ({
                              ...prev,
                              applicableCategories: prev.applicableCategories.filter(c => c !== category.value)
                            }));
                          }
                        }}
                        className="rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-gray-300 text-sm">{category.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePromo}
                  disabled={submitting}
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Promo Code'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit Promo Modal */}
      {showEditModal && selectedPromo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Edit Promo Code</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Code</label>
                <input
                  type="text"
                  value={selectedPromo.code}
                  disabled
                  className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Discount Value</label>
                  <input
                    type="number"
                    value={editForm.discountValue || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, discountValue: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Min Order Value</label>
                  <input
                    type="number"
                    value={editForm.minOrderValue || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, minOrderValue: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Discount</label>
                  <input
                    type="number"
                    value={editForm.maxDiscount || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, maxDiscount: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Usage Limit</label>
                  <input
                    type="number"
                    value={editForm.usageLimit || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, usageLimit: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Per User Limit</label>
                  <input
                    type="number"
                    value={editForm.userUsageLimit || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, userUsageLimit: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePromo}
                  disabled={submitting}
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Promo Code'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Create Modal */}
      {showBulkCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Bulk Create Promo Codes</h3>
              <button
                onClick={() => { setShowBulkCreateModal(false); resetBulkForm(); }}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Number of Codes *</label>
                  <input
                    type="number"
                    value={bulkForm.count}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, count: e.target.value }))}
                    min="1"
                    max="100"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Discount Type *</label>
                  <select
                    value={bulkForm.discountType}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, discountType: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="flat">Fixed Amount</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                <input
                  type="text"
                  value={bulkForm.description}
                  onChange={(e) => setBulkForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Bulk created discount codes"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Discount Value *</label>
                  <input
                    type="number"
                    value={bulkForm.discountValue}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, discountValue: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Min Order Value</label>
                  <input
                    type="number"
                    value={bulkForm.minOrderValue}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, minOrderValue: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Usage Limit per Code</label>
                  <input
                    type="number"
                    value={bulkForm.usageLimit}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, usageLimit: e.target.value }))}
                    placeholder="50"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Valid From *</label>
                  <input
                    type="datetime-local"
                    value={bulkForm.validFrom}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, validFrom: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Valid Until *</label>
                  <input
                    type="datetime-local"
                    value={bulkForm.validUntil}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, validUntil: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => { setShowBulkCreateModal(false); resetBulkForm(); }}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkCreate}
                  disabled={submitting}
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : `Create ${bulkForm.count} Codes`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedPromo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-3xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Promo Code Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-400 text-sm">Code</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-white font-mono text-lg font-semibold">{selectedPromo.code}</p>
                    <button
                      onClick={() => copyToClipboard(selectedPromo.code)}
                      className="text-gray-400 hover:text-orange-400"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedPromo)}</div>
                </div>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Description</p>
                <p className="text-white mt-1">{selectedPromo.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-400 text-sm">Discount</p>
                  <p className="text-white font-semibold mt-1">
                    {selectedPromo.discountType === 'percentage' 
                      ? `${selectedPromo.discountValue}% off` 
                      : `₹${selectedPromo.discountValue} off`}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Min Order Value</p>
                  <p className="text-white mt-1">₹{selectedPromo.minOrderValue || 0}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Max Discount</p>
                  <p className="text-white mt-1">
                    {selectedPromo.maxDiscount ? `₹${selectedPromo.maxDiscount}` : 'No limit'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-400 text-sm">Usage</p>
                  <p className="text-white mt-1">
                    {selectedPromo.usedCount || 0} / {selectedPromo.usageLimit || '∞'} 
                    <span className="text-gray-400 text-sm ml-2">
                      ({selectedPromo.usageLimit ? Math.round(((selectedPromo.usedCount || 0) / selectedPromo.usageLimit) * 100) : 0}% used)
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Per User Limit</p>
                  <p className="text-white mt-1">{selectedPromo.userUsageLimit || 1} uses</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-400 text-sm">Valid From</p>
                  <p className="text-white mt-1">{formatDateTime(selectedPromo.validFrom)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Valid Until</p>
                  <p className="text-white mt-1">{formatDateTime(selectedPromo.validUntil)}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Applicable Categories</p>
                <div className="flex gap-2 flex-wrap mt-1">
                  {(selectedPromo.applicableCategories || ['universal']).map(category => (
                    <span key={category} className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs capitalize">
                      {category.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-400 text-sm">Created At</p>
                  <p className="text-white mt-1">{formatDateTime(selectedPromo.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Updated At</p>
                  <p className="text-white mt-1">{formatDateTime(selectedPromo.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoCodes;
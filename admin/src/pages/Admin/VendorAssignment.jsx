import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye,
  RefreshCw,
  Calendar,
  MapPin,
  User,
  Clock,
  TrendingUp,
  ChevronDown,
  Plus,
  ChefHat
} from 'lucide-react';
import {
  getVendorAssignmentsApi,
  getPendingVendorAssignmentsApi,
  getInitialAssignmentRequestsApi,
  getVendorSwitchRequestsApi,
  getUrgentVendorAssignmentsApi,
  getAvailableVendorsApi,
  assignVendorApi,
  rejectVendorAssignmentApi,
  updateVendorAssignmentPriorityApi,
  getVendorAssignmentDetailsApi,
  getVendorAssignmentStatsApi,
  getVendorsApi
} from '../../service/api.service';
import { toast } from 'react-hot-toast';

function VendorAssignment() {
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Filters and Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [requestTypeFilter, setRequestTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('requestedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAssignments, setTotalAssignments] = useState(0);

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [availableVendors, setAvailableVendors] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Vendor modal states
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');
  const [vendorFilters, setVendorFilters] = useState({
    vendorType: '',
    isVerified: 'true',
    isAvailable: 'true'
  });
  const [vendorPagination, setVendorPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalCount: 0
  });
  const [vendorLoading, setVendorLoading] = useState(false);

  // Form states
  const [assignFormData, setAssignFormData] = useState({
    vendorId: '',
    adminNotes: ''
  });
  const [rejectFormData, setRejectFormData] = useState({
    rejectionReason: '',
    adminNotes: ''
  });

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'completed', label: 'Completed' }
  ];

  const requestTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'initial_assignment', label: 'Initial Assignment' },
    { value: 'vendor_switch', label: 'Vendor Switch' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const sortOptions = [
    { value: 'requestedAt', label: 'Request Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' }
  ];

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(requestTypeFilter !== 'all' && { requestType: requestTypeFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder })
      };

      const response = await getVendorAssignmentsApi(params);
      setAssignments(response.data.requests || response.data || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalAssignments(response.data.totalCount || 0);
    } catch (error) {
      toast.error('Failed to fetch vendor assignments');
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      const params = {
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      };

      const response = await getVendorAssignmentStatsApi();
      setStats(response.data.overallStats);
    } catch (error) {
      toast.error('Failed to fetch statistics');
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAvailableVendors = async (requestId) => {
    console.log('🔍 Fetching available vendors for request:', requestId);
    setVendorLoading(true);
    
    try {
      // First try to get request-specific available vendors
      console.log('📡 Trying getAvailableVendorsApi...');
      const response = await getAvailableVendorsApi(requestId);
      console.log('✅ Available vendors API response:', response);
      
      const vendors = response.data?.vendors || response.data || [];
      console.log('🏢 Parsed available vendors:', vendors);
      
      if (vendors.length > 0) {
        // Apply client-side filtering if we have specific available vendors
        const filteredVendors = vendors.filter(vendor => {
          const searchMatch = !vendorSearchTerm || 
            vendor.businessInfo?.businessName?.toLowerCase().includes(vendorSearchTerm.toLowerCase()) ||
            vendor.name?.toLowerCase().includes(vendorSearchTerm.toLowerCase());
          
          const typeMatch = !vendorFilters.vendorType || vendor.vendorType === vendorFilters.vendorType;
          
          return searchMatch && typeMatch;
        });
        
        setAvailableVendors(filteredVendors);
        setVendorPagination(prev => ({ ...prev, totalCount: filteredVendors.length }));
        setVendorLoading(false);
        return;
      }
      
      console.log('⚠️ No specific available vendors found, trying fallback...');
      throw new Error('No available vendors found for this request');
      
    } catch (error) {
      console.error('❌ Error fetching available vendors, falling back to all vendors:', error);
      
      // Fallback to getting all vendors with pagination and search
      try {
        console.log('📡 Trying getVendorsApi fallback with pagination...');
        
        const params = {
          page: vendorPagination.page,
          limit: vendorPagination.limit,
          ...vendorFilters,
          ...(vendorSearchTerm && { search: vendorSearchTerm })
        };
        
        // Clean empty filters
        const cleanParams = Object.fromEntries(
          Object.entries(params).filter(([_, value]) => value !== '')
        );
        
        const fallbackResponse = await getVendorsApi(cleanParams);
        console.log('✅ Fallback vendors API response:', fallbackResponse);
        
        const vendors = Array.isArray(fallbackResponse.data?.vendorProfiles) 
          ? fallbackResponse.data.vendorProfiles 
          : [];
        
        console.log('🏢 Parsed fallback vendors:', vendors);
        console.log('📊 Fallback vendors count:', vendors.length);
        
        setAvailableVendors(vendors);
        setVendorPagination(prev => ({
          ...prev,
          totalPages: fallbackResponse.data?.totalPages || 1,
          totalCount: fallbackResponse.data?.totalCount || vendors.length
        }));
        
        if (vendors.length === 0) {
          toast.error('No vendors available for assignment');
        }
      } catch (fallbackError) {
        toast.error('Failed to fetch vendors');
        console.error('❌ Error fetching fallback vendors:', fallbackError);
        setAvailableVendors([]);
      }
    }
    
    setVendorLoading(false);
  };

  useEffect(() => {
    fetchAssignments();
  }, [currentPage, statusFilter, requestTypeFilter, priorityFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAssignments();
  };

  const handleQuickFilter = async (filterType) => {
    setLoading(true);
    try {
      let response;
      switch (filterType) {
        case 'pending':
          response = await getPendingVendorAssignmentsApi({ page: 1, limit });
          break;
        case 'initial':
          response = await getInitialAssignmentRequestsApi();
          break;
        case 'switches':
          response = await getVendorSwitchRequestsApi();
          break;
        case 'urgent':
          response = await getUrgentVendorAssignmentsApi();
          break;
        default:
          return;
      }
      setAssignments(response.data.requests || response.data || []);
      setCurrentPage(1);
    } catch (error) {
      toast.error(`Failed to fetch ${filterType} assignments`);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignVendor = async () => {
    if (!assignFormData.vendorId) {
      toast.error('Please select a vendor');
      return;
    }

    try {
      await assignVendorApi(selectedRequest._id, assignFormData);
      toast.success('Vendor assigned successfully');
      setShowAssignModal(false);
      setAssignFormData({ vendorId: '', adminNotes: '' });
      fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign vendor');
      console.error('Error assigning vendor:', error);
    }
  };

  const handleRejectAssignment = async () => {
    if (!rejectFormData.rejectionReason) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      await rejectVendorAssignmentApi(selectedRequest._id, rejectFormData);
      toast.success('Assignment rejected successfully');
      setShowRejectModal(false);
      setRejectFormData({ rejectionReason: '', adminNotes: '' });
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to reject assignment');
      console.error('Error rejecting assignment:', error);
    }
  };

  const handleUpdatePriority = async (requestId, newPriority) => {
    try {
      await updateVendorAssignmentPriorityApi(requestId, { priority: newPriority });
      toast.success('Priority updated successfully');
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to update priority');
      console.error('Error updating priority:', error);
    }
  };

  const openAssignModal = (request) => {
    console.log('🚀 Opening assign modal for request:', request);
    setSelectedRequest(request);
    // Reset vendor modal states
    setVendorSearchTerm('');
    setVendorFilters({ vendorType: '', isVerified: 'true', isAvailable: 'true' });
    setVendorPagination({ page: 1, limit: 10, totalPages: 1, totalCount: 0 });
    setAvailableVendors([]);
    fetchAvailableVendors(request._id);
    setShowAssignModal(true);
  };
  
  const handleVendorSearch = () => {
    setVendorPagination(prev => ({ ...prev, page: 1 }));
    fetchAvailableVendors(selectedRequest._id);
  };
  
  const handleVendorPageChange = (newPage) => {
    setVendorPagination(prev => ({ ...prev, page: newPage }));
    fetchAvailableVendors(selectedRequest._id);
  };

  const openRejectModal = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-400' },
      medium: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-400' },
      high: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-400' },
      urgent: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-400' }
    };

    const config = priorityConfig[priority] || priorityConfig.medium;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
        {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-400' },
      assigned: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-400' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-400' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-400' }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vendor Assignment Management</h1>
          <p className="text-gray-400 mt-1">Manage vendor assignment requests and assignments</p>
        </div>
        <button
          onClick={fetchAssignments}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Requests</p>
              <p className="text-2xl font-bold text-white">{totalAssignments}</p>
            </div>
            <Users className="w-8 h-8 text-orange-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-white">{stats?.pendingCount || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Assigned Today</p>
              <p className="text-2xl font-bold text-white">{stats?.assignedToday || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Urgent Requests</p>
              <p className="text-2xl font-bold text-white">{stats?.urgentCount || 0}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div> */}

      {/* Quick Actions */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleQuickFilter('pending')}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <Clock className="w-4 h-4" />
            View Pending
          </button>
          <button
            onClick={() => handleQuickFilter('initial')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Initial Assignments
          </button>
          <button
            onClick={() => handleQuickFilter('switches')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Vendor Switches
          </button>
          <button
            onClick={() => handleQuickFilter('urgent')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            Urgent Requests
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Request Type</label>
              <select
                value={requestTypeFilter}
                onChange={(e) => setRequestTypeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
              >
                {requestTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Sort Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Assignment Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Request Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  User & Subscription
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Type & Reason
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Requested At
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mr-2" />
                      <span className="text-gray-400">Loading assignments...</span>
                    </div>
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No vendor assignments found</p>
                  </td>
                </tr>
              ) : (
                assignments.map((assignment) => (
                  <tr key={assignment._id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        <div className="font-medium">#{assignment._id?.slice(-6)}</div>
                        <div className="text-gray-400 text-xs">
                          {assignment.requestedVendorType?.replace('_', ' ')?.toUpperCase() || 'N/A'}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {assignment.deliveryZone?.name || 'Zone not specified'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {assignment.userId?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-white">
                            {assignment.userId?.name || 'Unknown User'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {assignment.userId?.emailAddress || ''}
                          </div>
                          <div className="text-xs text-gray-500">
                            {assignment.userId?.phoneNumber?.internationalNumber || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        <div className="font-medium capitalize">
                          {assignment.requestType?.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-gray-400 capitalize">
                          {assignment.reason?.replace('_', ' ') || 'N/A'}
                        </div>
                        {assignment.description && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={assignment.description}>
                            {assignment.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(assignment.priority)}
                        <select
                          value={assignment.priority}
                          onChange={(e) => handleUpdatePriority(assignment._id, e.target.value)}
                          className="text-xs bg-gray-700 text-white rounded px-2 py-1 border border-gray-600"
                        >
                          {priorityOptions.slice(1).map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(assignment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(assignment.requestedAt || assignment.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {assignment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => openAssignModal(assignment)}
                              className="text-green-400 hover:text-green-300 transition-colors"
                              title="Assign Vendor"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openRejectModal(assignment)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="Reject Assignment"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedRequest(assignment);
                            setShowDetailsModal(true);
                          }}
                          className="text-orange-400 hover:text-orange-300 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-700 border-t border-gray-600">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalAssignments)} of {totalAssignments} assignments
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assign Vendor Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-4xl mx-4 my-8 border border-gray-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Assign Vendor</h3>
            
            {/* Search and Filter Section */}
            <div className="mb-6 p-4 bg-gray-700 rounded-lg">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search vendors by business name..."
                    value={vendorSearchTerm}
                    onChange={(e) => setVendorSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleVendorSearch()}
                    className="w-full pl-10 pr-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={vendorFilters.vendorType}
                    onChange={(e) => setVendorFilters(prev => ({ ...prev, vendorType: e.target.value }))}
                    className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">All Types</option>
                    <option value="home_chef">Home Chef</option>
                    <option value="food_vendor">Food Vendor</option>
                  </select>
                  
                  <button
                    onClick={handleVendorSearch}
                    disabled={vendorLoading}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                  >
                    {vendorLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Vendor Selection Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Available Vendors ({vendorPagination.totalCount} total)
                </label>
                
                {vendorLoading ? (
                  <div className="flex items-center justify-center py-8 bg-gray-700 rounded-lg">
                    <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mr-2" />
                    <span className="text-gray-400">Loading vendors...</span>
                  </div>
                ) : availableVendors.length === 0 ? (
                  <div className="text-center py-8 bg-gray-700 rounded-lg">
                    <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No vendors found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableVendors.map((vendor) => {
                      console.log(`🏪 Vendor:`, vendor);
                      return (
                        <label
                          key={vendor._id}
                          className={`block p-4 bg-gray-700 rounded-lg border-2 cursor-pointer transition-all ${
                            assignFormData.vendorId === vendor._id
                              ? 'border-orange-500 bg-orange-500/10'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          <input
                            type="radio"
                            name="selectedVendor"
                            value={vendor._id}
                            checked={assignFormData.vendorId === vendor._id}
                            onChange={(e) => setAssignFormData(prev => ({ ...prev, vendorId: e.target.value }))}
                            className="sr-only"
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center">
                                  <span className="text-white text-sm font-semibold">
                                    {(vendor.businessInfo?.businessName || vendor.name || 'U').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="text-white font-medium">
                                    {vendor.businessInfo?.businessName || vendor.name || 'Unknown Business'}
                                  </h4>
                                  <p className="text-gray-400 text-sm">
                                    {vendor.vendorType?.replace('_', ' ').toUpperCase() || 'N/A'} • Rating: {vendor.rating?.average || 0}/5
                                  </p>
                                  <p className="text-gray-500 text-xs">
                                    Capacity: {vendor.capacity?.dailyOrders || 0} orders/day
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {vendor.isVerified && (
                                <span className="px-2 py-1 bg-green-900/50 text-green-300 text-xs rounded-full">
                                  ✓ Verified
                                </span>
                              )}
                              {vendor.isAvailable && (
                                <span className="px-2 py-1 bg-blue-900/50 text-blue-300 text-xs rounded-full">
                                  Available
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
                
                {/* Pagination */}
                {vendorPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-600">
                    <div className="text-sm text-gray-400">
                      Page {vendorPagination.page} of {vendorPagination.totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVendorPageChange(vendorPagination.page - 1)}
                        disabled={vendorPagination.page === 1 || vendorLoading}
                        className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handleVendorPageChange(vendorPagination.page + 1)}
                        disabled={vendorPagination.page === vendorPagination.totalPages || vendorLoading}
                        className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={assignFormData.adminNotes}
                  onChange={(e) => setAssignFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
                  rows="3"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  placeholder="Add any notes about this assignment..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-600">
              <button
                onClick={handleAssignVendor}
                disabled={!assignFormData.vendorId || vendorLoading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign Vendor
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssignFormData({ vendorId: '', adminNotes: '' });
                }}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Assignment Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Reject Assignment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectFormData.rejectionReason}
                  onChange={(e) => setRejectFormData(prev => ({ ...prev, rejectionReason: e.target.value }))}
                  rows="3"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  placeholder="Please provide a reason for rejection..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={rejectFormData.adminNotes}
                  onChange={(e) => setRejectFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
                  rows="2"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  placeholder="Add any additional notes..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleRejectAssignment}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Reject Assignment
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-4xl mx-4 my-8 border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Assignment Request Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Request Information */}
              <div className="space-y-6">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-400" />
                    Request Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Request ID:</span>
                      <span className="text-white font-mono">#{selectedRequest._id?.slice(-8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white capitalize">{selectedRequest.requestType?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Vendor Type:</span>
                      <span className="text-white capitalize">{selectedRequest.requestedVendorType?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Priority:</span>
                      <div>{getPriorityBadge(selectedRequest.priority)}</div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <div>{getStatusBadge(selectedRequest.status)}</div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Requested At:</span>
                      <span className="text-white">{formatDate(selectedRequest.requestedAt || selectedRequest.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* User Information */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-orange-400" />
                    User Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Name:</span>
                      <span className="text-white">{selectedRequest.userId?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="text-white">{selectedRequest.userId?.emailAddress || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Phone:</span>
                      <span className="text-white">{selectedRequest.userId?.phoneNumber?.internationalNumber || 'N/A'}</span>
                    </div>
                    {selectedRequest.userId?.address && (
                      <div className="mt-3">
                        <span className="text-gray-400 block mb-1">Address:</span>
                        <span className="text-white text-xs">
                          {typeof selectedRequest.userId.address === 'string' 
                            ? selectedRequest.userId.address 
                            : JSON.stringify(selectedRequest.userId.address)
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Subscription & Location Information */}
              <div className="space-y-6">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-400" />
                    Subscription Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subscription ID:</span>
                      <span className="text-white font-mono">#{selectedRequest.userSubscriptionId?._id?.slice(-8) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Start Date:</span>
                      <span className="text-white">
                        {selectedRequest.userSubscriptionId?.startDate 
                          ? formatDate(selectedRequest.userSubscriptionId.startDate)
                          : 'N/A'
                        }
                      </span>
                    </div>
                    {selectedRequest.userSubscriptionId?.planName && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Plan:</span>
                        <span className="text-white">{selectedRequest.userSubscriptionId.planName}</span>
                      </div>
                    )}
                    {selectedRequest.userSubscriptionId?.status && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className="text-white capitalize">{selectedRequest.userSubscriptionId.status}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Current Vendor Information */}
                {selectedRequest.userSubscriptionId?.vendorDetails?.currentVendor && (
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                      <ChefHat className="w-5 h-5 text-orange-400" />
                      Current Vendor Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Business Name:</span>
                        <span className="text-white">
                          {selectedRequest.userSubscriptionId.vendorDetails.currentVendor.vendorBusinessName || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Vendor Type:</span>
                        <span className="text-white capitalize">
                          {selectedRequest.userSubscriptionId.vendorDetails.currentVendor.vendorType?.replace('_', ' ') || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Assigned At:</span>
                        <span className="text-white">
                          {selectedRequest.userSubscriptionId.vendorDetails.currentVendor.assignedAt 
                            ? formatDate(selectedRequest.userSubscriptionId.vendorDetails.currentVendor.assignedAt)
                            : 'N/A'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Switch Used:</span>
                        <span className="text-white">
                          {selectedRequest.userSubscriptionId.vendorDetails.vendorSwitchUsed ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery Zone Information */}
                {selectedRequest.deliveryZone && (
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-orange-400" />
                      Delivery Zone
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Zone Name:</span>
                        <span className="text-white">{selectedRequest.deliveryZone.name || 'N/A'}</span>
                      </div>
                      {selectedRequest.deliveryZone.city && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">City:</span>
                          <span className="text-white">{selectedRequest.deliveryZone.city}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Request Details */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                    Request Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedRequest.reason && (
                      <div>
                        <span className="text-gray-400 block mb-1">Reason:</span>
                        <span className="text-white capitalize">{selectedRequest.reason.replace('_', ' ')}</span>
                      </div>
                    )}
                    {selectedRequest.description && (
                      <div>
                        <span className="text-gray-400 block mb-1">Description:</span>
                        <span className="text-white">{selectedRequest.description}</span>
                      </div>
                    )}
                    {selectedRequest.adminNotes && (
                      <div>
                        <span className="text-gray-400 block mb-1">Admin Notes:</span>
                        <span className="text-white">{selectedRequest.adminNotes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vendor Information (if assigned) */}
                {selectedRequest.assignedVendor && (
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      Assigned Vendor
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Vendor Name:</span>
                        <span className="text-white">{selectedRequest.assignedVendor.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Vendor Type:</span>
                        <span className="text-white capitalize">{selectedRequest.assignedVendor.vendorType?.replace('_', ' ') || 'N/A'}</span>
                      </div>
                      {selectedRequest.assignedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Assigned At:</span>
                          <span className="text-white">{formatDate(selectedRequest.assignedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-6 border-t border-gray-600">
              <div className="flex gap-3 justify-end">
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        openAssignModal(selectedRequest);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Assign Vendor
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        openRejectModal(selectedRequest);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Request
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorAssignment;
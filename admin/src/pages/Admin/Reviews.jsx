import { useState, useEffect } from 'react';
import { 
  MessageSquare, Star, Eye, Filter, Search, RefreshCw, RotateCcw,
  EyeOff, Calendar, TrendingUp, Award, Building2,
  ShoppingCart, Package, CheckCircle
} from 'lucide-react';
import {
  getAdminReviewsApi,
  getReviewStatsApi,
  moderateReviewApi,
  getSubscriptionsApi,
  getVendorsApi
} from '../../service/api.service';
import toast from 'react-hot-toast';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [moderatingId, setModeratingId] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    reviewType: '',
    status: '',
    minRating: '',
    maxRating: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Stats
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    activeReviews: 0,
    hiddenReviews: 0,
    subscriptionReviews: 0,
    vendorReviews: 0,
    orderReviews: 0
  });

  const reviewTypes = [
    { value: '', label: 'All Types' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'vendor', label: 'Vendor' },
    { value: 'order', label: 'Order' }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'hidden', label: 'Hidden' }
  ];

  const ratingOptions = [
    { value: '', label: 'All Ratings' },
    { value: '5', label: '5 Stars' },
    { value: '4', label: '4 Stars' },
    { value: '3', label: '3 Stars' },
    { value: '2', label: '2 Stars' },
    { value: '1', label: '1 Star' }
  ];

  const fetchReviewStats = async () => {
    setStatsLoading(true);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([key, value]) => 
          value !== '' && !['page', 'limit', 'sortBy', 'sortOrder'].includes(key)
        )
      );
      
      const data = await getReviewStatsApi(cleanFilters);
      console.log('Review Stats:', data);
    } catch (error) {
      console.error('Error fetching review stats:', error);
      toast.error('Error fetching review statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      
      if (searchTerm.trim()) {
        cleanFilters.search = searchTerm.trim();
      }

      const data = await getAdminReviewsApi(cleanFilters);
      console.log('Reviews:', data);
      
      const reviewsData = data.data?.reviews || data.reviews || [];
      setReviews(reviewsData);
      
      // Calculate local stats from reviews
      const totalReviews = reviewsData.length;
      const activeReviews = reviewsData.filter(review => review.status === 'active').length;
      const hiddenReviews = reviewsData.filter(review => review.status === 'hidden').length;
      const subscriptionReviews = reviewsData.filter(review => review.reviewType === 'subscription').length;
      const vendorReviews = reviewsData.filter(review => review.reviewType === 'vendor').length;
      const orderReviews = reviewsData.filter(review => review.reviewType === 'order').length;
      const averageRating = totalReviews > 0 
        ? (reviewsData.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1)
        : 0;
      
      setStats({
        totalReviews,
        averageRating,
        activeReviews,
        hiddenReviews,
        subscriptionReviews,
        vendorReviews,
        orderReviews
      });
      
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error(error.response?.data?.message || 'Error fetching reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const data = await getSubscriptionsApi({ limit: 100, isActive: true });
      setSubscriptions(data.data?.subscriptions || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const data = await getVendorsApi({ limit: 100 });
      setVendors(data.data?.vendors || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const handleModerateReview = async (reviewId, newStatus) => {
    setModeratingId(reviewId);
    try {
      await moderateReviewApi(reviewId, { status: newStatus });
      toast.success(`Review ${newStatus === 'hidden' ? 'hidden' : 'shown'} successfully!`);
      fetchReviews();
    } catch (error) {
      console.error('Error moderating review:', error);
      toast.error(error.response?.data?.message || 'Error moderating review');
    } finally {
      setModeratingId(null);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      reviewType: '',
      status: '',
      minRating: '',
      maxRating: '',
      startDate: '',
      endDate: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setSearchTerm('');
  };

  const hasActiveFilters = () => {
    const filtersToCheck = { ...filters };
    delete filtersToCheck.page;
    delete filtersToCheck.limit;
    delete filtersToCheck.sortBy;
    delete filtersToCheck.sortOrder;
    
    return Object.values(filtersToCheck).some(value => value !== '') || searchTerm.trim() !== '';
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-400'
            }`}
          />
        ))}
        <span className="text-sm text-gray-300 ml-1">{rating}</span>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-400' },
      hidden: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-400' }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const getReviewTypeIcon = (type) => {
    switch (type) {
      case 'subscription': return <Package className="w-4 h-4 text-blue-400" />;
      case 'vendor': return <Building2 className="w-4 h-4 text-green-400" />;
      case 'order': return <ShoppingCart className="w-4 h-4 text-orange-400" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN');
  };

  useEffect(() => {
    fetchReviews();
    fetchSubscriptions();
    fetchVendors();
  }, [filters]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    fetchReviewStats();
  }, [filters]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
            <div className="text-lg text-gray-400">Loading reviews...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Review Management</h1>
          <p className="text-gray-400 mt-1">Monitor and moderate user reviews and ratings</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchReviewStats}
            disabled={statsLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {statsLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <TrendingUp className="w-4 h-4" />
            )}
            Stats
          </button>
          <button
            onClick={fetchReviews}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
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
              <p className="text-gray-400 text-sm">Total Reviews</p>
              <p className="text-2xl font-bold text-white">{stats.totalReviews}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Average Rating</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-white">{stats.averageRating}</p>
                <Star className="w-6 h-6 text-yellow-400 fill-current" />
              </div>
            </div>
            <Award className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Reviews</p>
              <p className="text-2xl font-bold text-white">{stats.activeReviews}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Hidden Reviews</p>
              <p className="text-2xl font-bold text-white">{stats.hiddenReviews}</p>
            </div>
            <EyeOff className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Review Type Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Subscription Reviews</p>
              <p className="text-xl font-bold text-white">{stats.subscriptionReviews}</p>
            </div>
            <Package className="w-6 h-6 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Vendor Reviews</p>
              <p className="text-xl font-bold text-white">{stats.vendorReviews}</p>
            </div>
            <Building2 className="w-6 h-6 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Order Reviews</p>
              <p className="text-xl font-bold text-white">{stats.orderReviews}</p>
            </div>
            <ShoppingCart className="w-6 h-6 text-orange-400" />
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
              placeholder="Search by review text or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full"
            />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <select
            value={filters.reviewType}
            onChange={(e) => handleFilterChange('reviewType', e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
          >
            {reviewTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

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
            value={filters.minRating}
            onChange={(e) => handleFilterChange('minRating', e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Min Rating</option>
            {ratingOptions.slice(1).map(rating => (
              <option key={rating.value} value={rating.value}>
                {rating.label}
              </option>
            ))}
          </select>

          <select
            value={filters.maxRating}
            onChange={(e) => handleFilterChange('maxRating', e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Max Rating</option>
            {ratingOptions.slice(1).map(rating => (
              <option key={rating.value} value={rating.value}>
                {rating.label}
              </option>
            ))}
          </select>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-white">Reviews</h3>
          </div>
        </div>

        {reviews?.length > 0 ? (
          <div className="divide-y divide-gray-700">
            {reviews.map((review) => (
              <div key={review._id} className="p-6 hover:bg-gray-700/30 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-lg">
                      {review.userId?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-white font-medium">{review.userId?.name || 'Anonymous'}</span>
                        <div className="flex items-center gap-2">
                          {getReviewTypeIcon(review.reviewType)}
                          <span className="text-sm text-gray-400 capitalize">{review.reviewType}</span>
                        </div>
                        {renderStars(review.rating)}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(review.status)}
                        <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                      </div>
                    </div>

                    {/* Review Text */}
                    <p className="text-gray-300 mb-3 leading-relaxed">{review.reviewText}</p>

                    {/* Metadata */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        {review.subscriptionId && (
                          <span>Subscription: {subscriptions.find(s => s._id === review.subscriptionId)?.planName || 'Unknown'}</span>
                        )}
                        {review.vendorId && (
                          <span>Vendor: {vendors.find(v => v._id === review.vendorId)?.businessInfo?.businessName || 'Unknown'}</span>
                        )}
                        {review.orderId && (
                          <span>Order: #{review.orderId.slice(-6)}</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedReview(review);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleModerateReview(review._id, review.status === 'active' ? 'hidden' : 'active')}
                          disabled={moderatingId === review._id}
                          className={`transition-colors disabled:opacity-50 ${
                            review.status === 'active'
                              ? 'text-red-400 hover:text-red-300'
                              : 'text-green-400 hover:text-green-300'
                          }`}
                          title={review.status === 'active' ? 'Hide Review' : 'Show Review'}
                        >
                          {moderatingId === review._id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : review.status === 'active' ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <div className="text-lg text-gray-400 mb-2">No reviews found</div>
            <div className="text-sm text-gray-500">Reviews will appear here as users submit them</div>
          </div>
        )}
      </div>

      {/* Review Details Modal */}
      {showDetailsModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-3xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Review Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Review Header */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {selectedReview.userId?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-white font-semibold text-lg">{selectedReview.userId?.name || 'Anonymous User'}</h4>
                    <div className="flex items-center gap-2">
                      {getReviewTypeIcon(selectedReview.reviewType)}
                      <span className="text-gray-400 capitalize">{selectedReview.reviewType} Review</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {renderStars(selectedReview.rating)}
                    {getStatusBadge(selectedReview.status)}
                  </div>
                </div>
              </div>

              {/* Review Content */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h5 className="text-white font-medium mb-2">Review Text</h5>
                <p className="text-gray-300 leading-relaxed">{selectedReview.reviewText}</p>
              </div>

              {/* Review Details */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h5 className="text-white font-medium mb-3">Review Information</h5>
                  <div className="space-y-2">
                    <div>
                      <p className="text-gray-400 text-sm">Created</p>
                      <p className="text-white">{formatDateTime(selectedReview.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Updated</p>
                      <p className="text-white">{formatDateTime(selectedReview.updatedAt)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Review ID</p>
                      <p className="text-white font-mono text-sm">{selectedReview._id}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-white font-medium mb-3">User Information</h5>
                  <div className="space-y-2">
                    <div>
                      <p className="text-gray-400 text-sm">User</p>
                      <p className="text-white">{selectedReview.userId?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Email</p>
                      <p className="text-white">{selectedReview.userId?.emailAddress || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">User ID</p>
                      <p className="text-white font-mono text-sm">{selectedReview.userId?._id || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Related Information */}
              {selectedReview.subscriptionId && (
                <div>
                  <h5 className="text-white font-medium mb-3">Subscription Details</h5>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">Subscription</p>
                    <p className="text-white">
                      {subscriptions.find(s => s._id === selectedReview.subscriptionId)?.planName || 'Unknown Subscription'}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">ID: {selectedReview.subscriptionId}</p>
                  </div>
                </div>
              )}

              {selectedReview.vendorId && (
                <div>
                  <h5 className="text-white font-medium mb-3">Vendor Details</h5>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">Vendor</p>
                    <p className="text-white">
                      {vendors.find(v => v._id === selectedReview.vendorId)?.businessInfo?.businessName || 'Unknown Vendor'}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">ID: {selectedReview.vendorId}</p>
                  </div>
                </div>
              )}

              {selectedReview.orderId && (
                <div>
                  <h5 className="text-white font-medium mb-3">Order Details</h5>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">Order</p>
                    <p className="text-white">#{selectedReview.orderId.slice(-8)}</p>
                    <p className="text-gray-400 text-xs mt-1">Full ID: {selectedReview.orderId}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleModerateReview(selectedReview._id, selectedReview.status === 'active' ? 'hidden' : 'active');
                    setShowDetailsModal(false);
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    selectedReview.status === 'active'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {selectedReview.status === 'active' ? 'Hide Review' : 'Show Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
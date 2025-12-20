import { useState, useEffect } from 'react';
import { 
  MessageSquare, Star, Eye, Filter, Search, RefreshCw, RotateCcw,
  EyeOff, Calendar, Building2,
  ShoppingCart, Package
} from 'lucide-react';
import {
  getAdminReviewsApi,
  moderateReviewApi
} from '../../service/api.service';
import toast from 'react-hot-toast';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [moderatingId, setModeratingId] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

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

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      
      if (searchTerm.trim()) {
        cleanFilters.search = searchTerm.trim();
      }

      const response = await getAdminReviewsApi(cleanFilters);
      
      const reviewsData = response.data?.reviews || [];
      setReviews(reviewsData);
      
      const pagin = response.data?.pagination || { current: 1, limit: 20, total: 0, pages: 1 };
      setPagination(pagin);
      
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error(error.response?.data?.message || 'Error fetching reviews');
    } finally {
      setLoading(false);
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

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
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
      active: { bg: 'bg-green-100/10', text: 'text-green-500', dot: 'bg-green-500' },
      hidden: { bg: 'bg-red-100/10', text: 'text-red-500', dot: 'bg-red-500' }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} border border-${config.text.split('-')[1]}-500/20`}>
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
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN');
  };

  useEffect(() => {
    fetchReviews();
  }, [filters]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  if (loading && filters.page === 1) {
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Review Management</h1>
            {pagination.total > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-sm font-medium">
                {pagination.total} Total
              </span>
            )}
          </div>
          <p className="text-gray-400 mt-1">Monitor and moderate user reviews and ratings</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchReviews}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
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
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full"
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
                        {review.subscriptionId?.planName && (
                          <span className="flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5" />
                            {review.subscriptionId.planName}
                          </span>
                        )}
                        {review.vendorId?.businessInfo?.businessName && (
                          <span className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            {review.vendorId.businessInfo.businessName}
                          </span>
                        )}
                        {review.orderId?.orderNumber && (
                          <span className="flex items-center gap-1.5">
                            <ShoppingCart className="w-3.5 h-3.5" />
                            #{review.orderId.orderNumber}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedReview(review);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleModerateReview(review._id, review.status === 'active' ? 'hidden' : 'active')}
                          disabled={moderatingId === review._id}
                          className={`p-2 transition-colors disabled:opacity-50 rounded-lg ${
                            review.status === 'active'
                              ? 'text-red-400 hover:bg-red-400/10'
                              : 'text-green-400 hover:bg-green-400/10'
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

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing <span className="text-white font-medium">{reviews.length}</span> of <span className="text-white font-medium">{pagination.total}</span> reviews
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className="px-3 py-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(pagination.pages)].map((_, i) => {
                  const pageNum = i + 1;
                  if (
                    pagination.pages <= 7 ||
                    pageNum === 1 ||
                    pageNum === pagination.pages ||
                    (pageNum >= filters.page - 1 && pageNum <= filters.page + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-all ${
                          filters.page === pageNum
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === filters.page - 2 ||
                    pageNum === filters.page + 2
                  ) {
                    return <span key={pageNum} className="text-gray-500">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === pagination.pages}
                className="px-3 py-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Details Modal */}
      {showDetailsModal && selectedReview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Review Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <RefreshCw className="w-5 h-5 rotate-45" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-2xl shadow-lg">
                  {selectedReview.userId?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-white font-semibold text-lg">{selectedReview.userId?.name || 'Anonymous User'}</h4>
                    {getStatusBadge(selectedReview.status)}
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{selectedReview.userId?.emailAddress || 'No email address'}</p>
                  <div className="flex items-center gap-4">
                    {renderStars(selectedReview.rating)}
                    <span className="text-gray-500 text-sm flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {formatDateTime(selectedReview.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                <h5 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Review Content</h5>
                <p className="text-gray-200 leading-relaxed italic">"{selectedReview.reviewText}"</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedReview.subscriptionId && (
                  <div className="bg-gray-700/30 border border-gray-700 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-blue-400" />
                      <h5 className="text-white font-medium">Subscription</h5>
                    </div>
                    <p className="text-gray-300 text-sm">{selectedReview.subscriptionId.planName}</p>
                    <p className="text-gray-500 text-xs mt-1 capitalize">{selectedReview.subscriptionId.category?.replace('_', ' ')}</p>
                  </div>
                )}

                {selectedReview.vendorId && (
                  <div className="bg-gray-700/30 border border-gray-700 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-green-400" />
                      <h5 className="text-white font-medium">Vendor</h5>
                    </div>
                    <p className="text-gray-300 text-sm">{selectedReview.vendorId.businessInfo?.businessName}</p>
                    <p className="text-gray-500 text-xs mt-1">ID: {selectedReview.vendorId._id?.slice(-8)}</p>
                  </div>
                )}

                {selectedReview.orderId && (
                  <div className="bg-gray-700/30 border border-gray-700 rounded-xl p-4 md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingCart className="w-4 h-4 text-orange-400" />
                      <h5 className="text-white font-medium">Order Details</h5>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Order Number</p>
                        <p className="text-gray-300">#{selectedReview.orderId.orderNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Meal Type</p>
                        <p className="text-gray-300 capitalize">{selectedReview.orderId.mealType}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Delivery Date</p>
                        <p className="text-gray-300">{formatDate(selectedReview.orderId.deliveryDate)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-700 bg-gray-900/30 flex gap-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 bg-gray-700 text-white py-2.5 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium border border-gray-600"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleModerateReview(selectedReview._id, selectedReview.status === 'active' ? 'hidden' : 'active');
                  setShowDetailsModal(false);
                }}
                disabled={moderatingId === selectedReview._id}
                className={`flex-1 py-2.5 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 ${
                  selectedReview.status === 'active'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                } disabled:opacity-50`}
              >
                {moderatingId === selectedReview._id ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : selectedReview.status === 'active' ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Hide Review
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Approve Review
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
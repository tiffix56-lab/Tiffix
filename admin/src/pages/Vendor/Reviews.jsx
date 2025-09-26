import React, { useState, useEffect } from 'react';
import { 
  Star, Filter, Search, MessageSquare, ThumbsUp, ThumbsDown,
  Calendar, User, TrendingUp, Eye, RefreshCw, Loader2,
  ChevronDown, Award, Target
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { getVendorReviewsApi, getVendorReviewsSummaryApi } from '../../service/api.service';
import toast from 'react-hot-toast';

const VendorReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRating, setSelectedRating] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [reviewsSummary, setReviewsSummary] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);

  const fetchReviews = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const params = {
        page: currentPage,
        limit: 12,
      };

      // Apply rating filters based on vendor API structure
      if (selectedRating === 'positive') {
        params.minRating = 4;
      } else if (selectedRating === 'negative') {
        params.maxRating = 2;
      } else if (selectedRating !== 'all') {
        params.minRating = parseInt(selectedRating);
        params.maxRating = parseInt(selectedRating);
      }

      // Apply sorting
      if (selectedSort === 'newest') {
        params.sortBy = 'createdAt';
        params.sortOrder = 'desc';
      } else if (selectedSort === 'oldest') {
        params.sortBy = 'createdAt';
        params.sortOrder = 'asc';
      } else if (selectedSort === 'rating_high') {
        params.sortBy = 'rating';
        params.sortOrder = 'desc';
      } else if (selectedSort === 'rating_low') {
        params.sortBy = 'rating';
        params.sortOrder = 'asc';
      }

      const response = await getVendorReviewsApi(params);
      
      if (response.success) {
        setReviews(response.data.reviews || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalReviews(response.data.totalReviews || 0);
        setCurrentPage(response.data.currentPage || 1);
      } else {
        setError('Failed to fetch reviews');
      }

      if (isRefresh) {
        toast.success('Reviews refreshed successfully');
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Error loading reviews. Please try again.');
      if (isRefresh) {
        toast.error('Failed to refresh reviews');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchReviewsSummary = async () => {
    try {
      const response = await getVendorReviewsSummaryApi();
      if (response.success) {
        setReviewsSummary(response.data || {});
      }
    } catch (err) {
      console.error('Error fetching reviews summary:', err);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [currentPage, selectedRating, selectedSort]);

  useEffect(() => {
    fetchReviewsSummary();
  }, []);

  // Filter reviews by search term locally
  const filteredReviews = reviews.filter(review =>
    searchTerm === '' || 
    review.reviewText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star 
        key={index} 
        size={16} 
        className={index < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} 
      />
    ));
  };

  const getReviewTypeColor = (type) => {
    switch (type) {
      case 'subscription': return 'blue';
      case 'vendor': return 'green'; 
      case 'order': return 'orange';
      default: return 'gray';
    }
  };

  const getRatingBadgeColor = (rating) => {
    if (rating >= 4) return 'green';
    if (rating >= 3) return 'yellow';
    return 'red';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Calculate stats from reviews summary or current reviews
  const stats = {
    averageRating: reviewsSummary?.averageRating || 0,
    totalReviews: reviewsSummary?.totalReviews || totalReviews,
    positiveReviews: reviewsSummary?.ratingsBreakdown?.['5'] + reviewsSummary?.ratingsBreakdown?.['4'] || reviews.filter(r => r.rating >= 4).length,
    negativeReviews: reviewsSummary?.ratingsBreakdown?.['1'] + reviewsSummary?.ratingsBreakdown?.['2'] || reviews.filter(r => r.rating <= 2).length,
    ratingDistribution: reviewsSummary?.ratingsBreakdown ? 
      [5, 4, 3, 2, 1].map(rating => ({
        rating,
        count: reviewsSummary.ratingsBreakdown[rating.toString()] || 0,
        percentage: reviewsSummary.totalReviews > 0 ? 
          ((reviewsSummary.ratingsBreakdown[rating.toString()] || 0) / reviewsSummary.totalReviews * 100).toFixed(1) : 0
      })) :
      [5, 4, 3, 2, 1].map(rating => ({
        rating,
        count: reviews.filter(r => r.rating === rating).length,
        percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === rating).length / reviews.length * 100).toFixed(1) : 0
      }))
  };

  if (loading && !refreshing) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error && !reviews.length) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Unable to Load Reviews</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={() => fetchReviews()} className="mx-auto">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Customer Reviews</h1>
          <p className="text-gray-400 mt-1">Monitor customer feedback and ratings for your services</p>
        </div>
        <Button
          onClick={() => fetchReviews(true)}
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          loading={refreshing}
        >
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/20 rounded-xl">
              <Star className="text-yellow-500" size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Average Rating</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-white">{stats.averageRating.toFixed(1)}</p>
                <div className="flex">{renderStars(Math.round(stats.averageRating))}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <MessageSquare className="text-blue-500" size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Reviews</p>
              <p className="text-2xl font-bold text-white">{stats.totalReviews}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <ThumbsUp className="text-green-500" size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Positive Reviews</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-white">{stats.positiveReviews}</p>
                {stats.totalReviews > 0 && (
                  <p className="text-sm text-green-400">
                    ({((stats.positiveReviews / stats.totalReviews) * 100).toFixed(0)}%)
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl">
              <ThumbsDown className="text-red-500" size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Needs Attention</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-white">{stats.negativeReviews}</p>
                {stats.totalReviews > 0 && (
                  <p className="text-sm text-red-400">
                    ({((stats.negativeReviews / stats.totalReviews) * 100).toFixed(0)}%)
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Rating Distribution & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Rating Distribution
          </h3>
          <div className="space-y-3">
            {stats.ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm text-gray-300">{rating}</span>
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                </div>
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 w-8 text-right">{count}</span>
                  <span className="text-xs text-gray-500 w-10">({percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search reviews by customer name or comment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
              >
                <option value="all">All Ratings</option>
                <option value="positive">Positive (4-5 ⭐)</option>
                <option value="negative">Negative (1-2 ⭐)</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>

              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="rating_high">Highest Rating</option>
                <option value="rating_low">Lowest Rating</option>
              </select>
            </div>
          </div>
        </Card>
      </div>

      {/* Reviews Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">
            Reviews ({filteredReviews.length} of {totalReviews})
          </h3>
          {refreshing && (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Refreshing...</span>
            </div>
          )}
        </div>

        {filteredReviews.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Reviews Found</h3>
              <p className="text-gray-400">
                {searchTerm ? `No reviews match your search "${searchTerm}"` : 'No reviews available yet'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredReviews.map((review) => (
              <Card key={review._id} className="p-6 hover:bg-gray-700/50 transition-colors">
                <div className="space-y-4">
                  {/* Review Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                        <User size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {review.user?.name || review.customerName || 'Anonymous Customer'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {review.user?.email || review.customerEmail || 'No email'}
                        </p>
                      </div>
                    </div>
                    <Badge color={getReviewTypeColor(review.reviewType)} className="text-xs">
                      {review.reviewType || 'Review'}
                    </Badge>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(review.rating)}</div>
                      <Badge color={getRatingBadgeColor(review.rating)} className="text-xs font-bold">
                        {review.rating}/5
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                  </div>

                  {/* Review Text */}
                  {review.reviewText && (
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <p className="text-sm text-gray-300 leading-relaxed">
                        "{review.reviewText}"
                      </p>
                    </div>
                  )}

                  {/* Review Metadata */}
                  <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-700 pt-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(review.createdAt).toLocaleDateString('en-IN')}
                    </span>
                    {review.orderId && (
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        Order
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Page {currentPage} of {totalPages} • {totalReviews} total reviews
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </Button>
              
              {/* Page numbers */}
              <div className="hidden sm:flex gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={loading}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default VendorReviews;
import React, { useState, useEffect } from 'react';
import { 
  Star, Filter, Search, MessageSquare, ThumbsUp, ThumbsDown,
  MoreHorizontal, Calendar, User, TrendingUp
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');

  // Mock data
  const mockReviews = [
    {
      id: 1,
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      rating: 5,
      comment: 'Excellent food quality! The taste was amazing and delivery was on time.',
      orderDate: '2024-01-15',
      reviewDate: '2024-01-16',
      orderValue: 450,
      verified: true
    },
    {
      id: 2,
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      rating: 4,
      comment: 'Good food, but could be a bit more spicy. Overall satisfied with the service.',
      orderDate: '2024-01-10',
      reviewDate: '2024-01-11',
      orderValue: 320,
      verified: true
    },
    {
      id: 3,
      customerName: 'Mike Johnson',
      customerEmail: 'mike@example.com',
      rating: 2,
      comment: 'Food was cold when delivered. Not happy with the experience.',
      orderDate: '2024-01-05',
      reviewDate: '2024-01-06',
      orderValue: 280,
      verified: true
    },
    {
      id: 4,
      customerName: 'Sarah Wilson',
      customerEmail: 'sarah@example.com',
      rating: 5,
      comment: 'Perfect! Best tiffin service in the area. Highly recommended.',
      orderDate: '2024-01-20',
      reviewDate: '2024-01-21',
      orderValue: 500,
      verified: true
    }
  ];

  useEffect(() => {
    setTimeout(() => {
      setReviews(mockReviews);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.comment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = filterRating === 'all' || review.rating === parseInt(filterRating);
    return matchesSearch && matchesRating;
  });

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === rating).length / reviews.length * 100).toFixed(1) : 0
  }));

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star 
        key={index} 
        size={16} 
        className={index < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} 
      />
    ));
  };

  const columns = [
    {
      header: 'Customer',
      accessor: 'customerName',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <div className="text-sm">
            <div className="font-semibold">{value}</div>
            <div className="text-gray-500">{row.customerEmail}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Rating',
      accessor: 'rating',
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="flex">{renderStars(value)}</div>
          <span className="text-sm font-semibold">{value}/5</span>
        </div>
      )
    },
    {
      header: 'Comment',
      accessor: 'comment',
      render: (value) => (
        <div className="max-w-md">
          <p className="text-sm text-gray-300 line-clamp-2">{value}</p>
        </div>
      )
    },
    {
      header: 'Order Value',
      accessor: 'orderValue',
      render: (value) => (
        <span className="font-semibold">₹{value}</span>
      )
    },
    {
      header: 'Date',
      accessor: 'reviewDate',
      render: (value) => (
        <span className="text-sm">{new Date(value).toLocaleDateString()}</span>
      )
    },
    {
      header: 'Status',
      accessor: 'verified',
      render: (value) => (
        <Badge color={value ? 'green' : 'gray'}>
          {value ? 'Verified' : 'Unverified'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: () => (
        <div className="flex items-center gap-2">
          <button className="text-blue-500 hover:text-blue-700">
            <MessageSquare size={16} />
          </button>
          <button className="text-gray-500 hover:text-gray-700">
            <MoreHorizontal size={16} />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Customer Reviews</h1>
          <p className="text-gray-400 mt-1">Monitor and manage customer feedback</p>
        </div>
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
              <p className="text-2xl font-bold text-white">{averageRating}/5</p>
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
              <p className="text-2xl font-bold text-white">{reviews.length}</p>
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
              <p className="text-2xl font-bold text-white">
                {reviews.filter(r => r.rating >= 4).length}
              </p>
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
              <p className="text-2xl font-bold text-white">
                {reviews.filter(r => r.rating <= 2).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Rating Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Rating Distribution</h3>
          <div className="space-y-3">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-sm text-gray-300">{rating}</span>
                  <Star size={12} className="text-yellow-500 fill-yellow-500" />
                </div>
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-400 w-12 text-right">{count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Filters and Search */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>
            <Input.Select
              options={[
                { label: 'All Ratings', value: 'all' },
                { label: '5 Stars', value: '5' },
                { label: '4 Stars', value: '4' },
                { label: '3 Stars', value: '3' },
                { label: '2 Stars', value: '2' },
                { label: '1 Star', value: '1' }
              ]}
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              placeholder="Filter by rating"
              className="w-full sm:w-48"
            />
            <Button variant="secondary" className="flex items-center gap-2">
              <Calendar size={16} />
              Date Range
            </Button>
          </div>
        </Card>
      </div>

      {/* Reviews Table */}
      <Card className="overflow-hidden">
        <Table
          columns={columns}
          data={filteredReviews}
          emptyMessage="No reviews found"
        />
      </Card>
    </div>
  );
};

export default Reviews;
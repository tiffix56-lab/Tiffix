import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Users, 
  Calendar, 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  ChevronDown,
  Eye,
  RefreshCw,
  Clock,
  CreditCard,
  Package,
  Phone
} from 'lucide-react';
import { getVendorCustomersApi, getVendorCustomerAnalyticsApi } from '../../service/api.service';
import { toast } from 'react-hot-toast';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  // Filters and Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [amountRange, setAmountRange] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30d');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  const [showFilters, setShowFilters] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Status', color: 'text-gray-600' },
    { value: 'active', label: 'Active', color: 'text-green-600' },
    { value: 'pending', label: 'Pending', color: 'text-yellow-600' },
    { value: 'expired', label: 'Expired', color: 'text-red-600' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-gray-600' }
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Created Date' },
    { value: 'endDate', label: 'End Date' },
    { value: 'finalPrice', label: 'Amount' }
  ];

  const analyticsOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
    { value: 'all', label: 'All Time' }
  ];

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
        ...(deliveryAddress && { deliveryAddress }),
        ...(amountRange && { amount: amountRange }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo })
      };

      const response = await getVendorCustomersApi(params);
      setCustomers(response.data.customers || response.data || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalCustomers(response.data.totalCount || 0);
    } catch (error) {
      toast.error('Failed to fetch customers');
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const params = { period: analyticsPeriod };
      const response = await getVendorCustomerAnalyticsApi(params);
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Failed to fetch analytics');
      console.error('Error fetching analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchAnalytics();
  }, [analyticsPeriod]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCustomers();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setDeliveryAddress('');
    setAmountRange('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
    fetchCustomers();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400', border: 'border-green-500/20' },
      pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400', border: 'border-yellow-500/20' },
      expired: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400', border: 'border-red-500/20' },
      cancelled: { bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-400', border: 'border-gray-500/20' }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
    return new Date(istDate).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Customer Management</h1>
          <p className="text-gray-400 mt-1">Manage your subscription customers</p>
        </div>
        <button
          onClick={fetchCustomers}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full md:w-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-xs md:text-sm">Total Customers</p>
            <Users className="w-5 h-5 md:w-8 md:h-8 text-green-400" />
          </div>
          <p className="text-xl md:text-2xl font-bold text-white">{totalCustomers}</p>
        </div>

        <div className="bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-xs md:text-sm">Active Subscriptions</p>
            <TrendingUp className="w-5 h-5 md:w-8 md:h-8 text-blue-400" />
          </div>
          <p className="text-xl md:text-2xl font-bold text-white">
            {analytics?.activeSubscriptions || 0}
          </p>
        </div>

        <div className="bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-xs md:text-sm">Total Revenue</p>
            <DollarSign className="w-5 h-5 md:w-8 md:h-8 text-yellow-400" />
          </div>
          <p className="text-xl md:text-2xl font-bold text-white">
            {analytics?.totalRevenue ? formatCurrency(analytics.totalRevenue) : '₹0'}
          </p>
        </div>

        <div className="bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <p className="text-gray-400 text-xs md:text-sm">Period</p>
            <Calendar className="w-5 h-5 md:w-8 md:h-8 text-purple-400" />
          </div>
          <select
            value={analyticsPeriod}
            onChange={(e) => setAnalyticsPeriod(e.target.value)}
            className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm border border-gray-600 focus:ring-1 focus:ring-green-500"
          >
            {analyticsOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 w-full sm:w-auto"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600 transition-colors w-full sm:w-auto"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto"
            >
              Search
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500"
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
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Delivery Address</label>
              <input
                type="text"
                placeholder="e.g., Mumbai"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Amount Range</label>
              <input
                type="text"
                placeholder="e.g., 2000-5000"
                value={amountRange}
                onChange={(e) => setAmountRange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-2 flex justify-end items-end">
              <button
                onClick={clearFilters}
                className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer List */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin text-green-500 mr-2" />
              <span className="text-gray-400 text-lg">Loading customers...</span>
            </div>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-lg text-gray-400 mb-2">No customers found</p>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Customer & Plan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status & Credits
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Amount & Duration
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Delivery Address
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Meal Timing
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Subscription Period
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {customers.map((customer) => (
                    <tr key={customer._id || customer.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center shrink-0">
                            <span className="text-white text-sm font-semibold">
                              {customer.userId?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {customer.userId?.name || 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-400 flex items-center gap-2">
                              {customer.userId?.emailAddress || 'No email'}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Phone className="w-3 h-3" />
                              {customer.userId?.phoneNumber?.internationalNumber || 'No phone'}
                            </div>
                            <div className="text-xs text-blue-400 flex items-center gap-1 mt-1">
                              <Package className="w-3 h-3" />
                              {customer.subscriptionId?.planName || 'No plan'} ({customer.subscriptionId?.category?.replace('_', ' ') || 'N/A'})
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          {getStatusBadge(customer.status)}
                          <div className="flex items-center gap-1 text-xs">
                            <CreditCard className="w-3 h-3 text-yellow-400" />
                            <span className="text-white">{customer.creditsGranted - customer.creditsUsed}</span>
                            <span className="text-gray-400">/ {customer.creditsGranted}</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            {customer.creditsRemainingPercentage}% remaining
                          </div>
                          {customer.skipCreditAvailable > 0 && (
                            <div className="text-xs text-purple-400">
                              {customer.skipCreditAvailable} skip credits
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-white font-medium">
                            {formatCurrency(customer.finalPrice || customer.amount || 0)}
                          </div>
                          {customer.originalPrice !== customer.finalPrice && (
                            <div className="text-xs text-gray-400 line-through">
                              {formatCurrency(customer.originalPrice)}
                            </div>
                          )}
                          <div className="text-xs text-blue-400 mt-1">
                            {customer.subscriptionId?.duration} ({customer.subscriptionId?.durationDays} days)
                          </div>
                          <div className="text-xs text-gray-400">
                            {customer.daysRemaining} days left
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                            <div>
                              <div className="text-white text-xs truncate max-w-[200px]">{customer.deliveryAddress?.street || 'No street'}</div>
                              <div className="text-gray-400 text-xs">
                                {customer.deliveryAddress?.city}, {customer.deliveryAddress?.state}
                              </div>
                              <div className="text-gray-500 text-xs">{customer.deliveryAddress?.zipCode}</div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm space-y-1">
                          {customer.mealTiming?.lunch?.enabled && (
                            <div className="flex items-center gap-1 text-yellow-400">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs">Lunch: {customer.mealTiming.lunch.time}</span>
                            </div>
                          )}
                          {customer.mealTiming?.dinner?.enabled && (
                            <div className="flex items-center gap-1 text-orange-400">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs">Dinner: {customer.mealTiming.dinner.time}</span>
                            </div>
                          )}
                          {(!customer.mealTiming?.lunch?.enabled && !customer.mealTiming?.dinner?.enabled) && (
                            <span className="text-xs text-gray-500">No meals configured</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          <div className="text-white text-xs">
                            <strong>Start:</strong> {formatDate(customer.startDate)}
                          </div>
                          <div className="text-white text-xs">
                            <strong>End:</strong> {formatDate(customer.endDate)}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Created: {formatDate(customer.createdAt)}
                          </div>
                          {customer.vendorDetails?.currentVendor?.assignedAt && (
                            <div className="text-xs text-green-400">
                              Assigned: {formatDate(customer.vendorDetails.currentVendor.assignedAt)}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-700">
              {customers.map((customer) => (
                <div key={customer._id || customer.id} className="p-4 bg-gray-800 hover:bg-gray-750 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center shrink-0">
                        <span className="text-white text-sm font-semibold">
                          {customer.userId?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {customer.userId?.name || 'Unknown User'}
                        </div>
                        <div className="text-xs text-blue-400 flex items-center gap-1 mt-0.5">
                          <Package className="w-3 h-3" />
                          {customer.subscriptionId?.planName || 'No plan'}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(customer.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Credits Info */}
                    <div className="bg-gray-700/30 p-3 rounded-lg border border-gray-700/50">
                      <p className="text-xs text-gray-500 mb-1">Credits</p>
                      <div className="flex items-center gap-1 text-sm font-medium text-white">
                        <CreditCard className="w-3.5 h-3.5 text-yellow-400" />
                        <span>{customer.creditsGranted - customer.creditsUsed}</span>
                        <span className="text-gray-500 text-xs">/ {customer.creditsGranted}</span>
                      </div>
                    </div>

                    {/* Amount Info */}
                    <div className="bg-gray-700/30 p-3 rounded-lg border border-gray-700/50">
                      <p className="text-xs text-gray-500 mb-1">Amount</p>
                      <div className="text-sm font-medium text-white">
                        {formatCurrency(customer.finalPrice || customer.amount || 0)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {customer.daysRemaining} days left
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pl-2 border-l-2 border-gray-700">
                    {/* Contact */}
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Phone className="w-3.5 h-3.5" />
                      {customer.userId?.phoneNumber?.internationalNumber || 'No phone'}
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-2 text-xs text-gray-400">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        {customer.deliveryAddress?.street}, {customer.deliveryAddress?.city}
                      </span>
                    </div>

                    {/* Meal Timings */}
                    <div className="flex items-center gap-3">
                      {customer.mealTiming?.lunch?.enabled && (
                        <div className="flex items-center gap-1 text-yellow-400 text-xs">
                          <Clock className="w-3 h-3" />
                          <span>Lunch: {customer.mealTiming.lunch.time}</span>
                        </div>
                      )}
                      {customer.mealTiming?.dinner?.enabled && (
                        <div className="flex items-center gap-1 text-orange-400 text-xs">
                          <Clock className="w-3 h-3" />
                          <span>Dinner: {customer.mealTiming.dinner.time}</span>
                        </div>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-1 border-t border-gray-700/50">
                      <span>Start: <span className="text-gray-300">{formatDate(customer.startDate)}</span></span>
                      <span>End: <span className="text-gray-300">{formatDate(customer.endDate)}</span></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 md:px-6 py-4 bg-gray-900/50 border-t border-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-400">
                Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalCustomers)} of {totalCustomers} customers
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400 bg-gray-700 px-3 py-1.5 rounded-lg">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Customers;
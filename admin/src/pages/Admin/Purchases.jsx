import React, { useState, useEffect } from 'react'
import { 
  Search, Filter, ShoppingCart, DollarSign, TrendingUp, 
  Eye, Calendar, Package, User, MapPin, RefreshCw,
  BarChart3, Clock
} from 'lucide-react'
import { 
  getSubscriptionPurchasesApi, 
  getSubscriptionPurchaseByIdApi, 
  getSubscriptionPurchaseStatsApi 
} from '../../service/api.service'
import toast from 'react-hot-toast'

function Purchases() {
  const [purchases, setPurchases] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    status: '',
    vendorAssigned: '',
    dateFrom: '',
    dateTo: '',
    priceMin: '',
    priceMax: '',
    category: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    endingSoon: false
  })
  const [pagination, setPagination] = useState({
  currentPage: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
  totalSubscriptions: 0
});


  const fetchPurchases = async () => {
    setLoading(true)
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '' && value !== false)
      )
      const data = await getSubscriptionPurchasesApi(cleanFilters)
      
      setPurchases(data.data.subscriptions || [])
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Error fetching purchases:', error)
      toast.error(error.response?.data?.message || 'Error fetching purchases')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async (period = '30d') => {
    try {
      const data = await getSubscriptionPurchaseStatsApi({ period })
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchPurchaseDetails = async (purchaseId) => {
    setLoadingDetails(true)
    try {
      const data = await getSubscriptionPurchaseByIdApi(purchaseId)
      setSelectedPurchase(data.data.subscription || data)
      setShowDetailsModal(true)
    } catch (error) {
      console.error('Error fetching purchase by ID:', error)
      toast.error('Error fetching purchase details')
    } finally {
      setLoadingDetails(false)
    }
  }

  useEffect(() => {
    fetchPurchases()
    fetchStats()
  }, [filters])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscription Purchases</h1>
          <p className="text-gray-400 mt-1">Manage and monitor subscription purchases</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { fetchPurchases(); fetchStats(); }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-white">Filters</h2>
          </div>
          <button
            onClick={() => handleFilterChange('endingSoon', !filters.endingSoon)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              filters.endingSoon 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600'
            }`}
          >
            <Clock className="w-4 h-4" />
            {filters.endingSoon ? 'Show All' : 'Ending Soon'}
          </button>
        </div>
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filters.vendorAssigned}
            onChange={(e) => handleFilterChange('vendorAssigned', e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Vendor Status</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Categories</option>
            <option value="home_chef">Home Chef</option>
            <option value="food_vendor">Food Vendor</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="date"
              placeholder="From Date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            
            <input
              type="date"
              placeholder="To Date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>


          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
          >
            <option value="createdAt">Created At</option>
            <option value="status">Status</option>
          </select>

          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
              <div className="text-lg text-gray-400">Loading purchases...</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Statistics */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-white">Statistics</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gray-700 rounded-xl border border-gray-600 hover:bg-gray-600 transition-colors">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg mx-auto mb-4">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">{purchases?.length || 0}</div>
                <div className="text-sm text-gray-400">Total Purchases</div>
              </div>
              <div className="text-center p-6 bg-gray-700 rounded-xl border border-gray-600 hover:bg-gray-600 transition-colors">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg mx-auto mb-4">
                  
                </div>
                <div className="text-2xl font-bold text-white mb-1">₹{purchases?.reduce((sum, p) => sum + (p.finalPrice || 0), 0) || 0}</div>
                <div className="text-sm text-gray-400">Total Revenue</div>
              </div>
              <div className="text-center p-6 bg-gray-700 rounded-xl border border-gray-600 hover:bg-gray-600 transition-colors">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">₹{purchases?.length ? Math.round(purchases.reduce((sum, p) => sum + (p.finalPrice || 0), 0) / purchases.length) : 0}</div>
                <div className="text-sm text-gray-400">Average Order Value</div>
              </div>
            </div>
          </div>

          {/* Purchase List */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-white">Purchase List</h3>
              </div>
            </div>
            {purchases?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Plan</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Vendor</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Start Date</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">End Date</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {purchases.map((purchase) => (
                      <tr key={purchase._id} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{purchase.transactionId.transactionId || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-white">{purchase.userId?.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">
                            <div className="font-medium">{purchase.subscriptionId?.planName || 'N/A'}</div>
                            <div className="text-gray-400 text-xs capitalize">{purchase.subscriptionId?.category?.replace('_', ' ') || ''}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            purchase.status === 'active' ? 'bg-green-100 text-green-800' :
                            purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            purchase.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {purchase.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            purchase.vendorDetails?.isVendorAssigned ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {purchase.vendorDetails?.isVendorAssigned ? 'Assigned' : 'Unassigned'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            
                            <span className="text-sm font-medium text-white">₹{purchase.finalPrice}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{purchase.subscriptionId?.durationDays || 0} days</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            
                            <span className="text-sm text-gray-300">
                              {new Date(purchase.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            
                            <span className="text-sm text-gray-300">
                              {new Date(purchase.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => fetchPurchaseDetails(purchase._id)}
                            disabled={loadingDetails}
                            className="text-orange-400 hover:text-orange-300 transition-colors disabled:opacity-50"
                            title="View Details"
                          >
                            {loadingDetails ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <div className="text-lg text-gray-400 mb-2">No purchases found</div>
                <div className="text-sm text-gray-500">Try adjusting your filters to find purchases</div>
              </div>
            )}

            <div className="px-6 py-4 bg-gray-700 border-t border-gray-600">
  <div className="flex items-center justify-between">

    <div className="text-sm text-gray-400">
      Page {pagination.currentPage} of {pagination.totalPages}
    </div>

    <div className="flex items-center gap-2">
      <button
        onClick={() => handlePageChange(pagination.currentPage - 1)}
        disabled={!pagination.hasPrevPage}
        className="px-3 py-1 text-sm bg-gray-600 text-white rounded disabled:opacity-50"
      >
        Previous
      </button>

      <button
        onClick={() => handlePageChange(pagination.currentPage + 1)}
        disabled={!pagination.hasNextPage}
        className="px-3 py-1 text-sm bg-gray-600 text-white rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>

  </div>
</div>

          </div>
        </div>
      )}

      {/* Purchase Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-4xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Purchase Details</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false)
                  setSelectedPurchase(null)
                  setLoadingDetails(false)
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {loadingDetails ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
                  <div className="text-lg text-gray-400">Loading purchase details...</div>
                </div>
              </div>
            ) : selectedPurchase ? (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Purchase ID</p>
                    <p className="text-white font-medium">{selectedPurchase.subscription?._id || selectedPurchase._id}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      (selectedPurchase.subscription?.status || selectedPurchase.status) === 'active' ? 'bg-green-100 text-green-800' :
                      (selectedPurchase.subscription?.status || selectedPurchase.status) === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      (selectedPurchase.subscription?.status || selectedPurchase.status) === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedPurchase.subscription?.status || selectedPurchase.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Final Price</p>
                    <p className="text-white font-medium">₹{selectedPurchase.subscription?.finalPrice || selectedPurchase.finalPrice}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Start Date</p>
                    <p className="text-white">{new Date(selectedPurchase.subscription?.startDate || selectedPurchase.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">End Date</p>
                    <p className="text-white">{new Date(selectedPurchase.subscription?.endDate || selectedPurchase.endDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Created At</p>
                    <p className="text-white">{new Date(selectedPurchase.subscription?.createdAt || selectedPurchase.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Credits Granted</p>
                    <p className="text-white">{selectedPurchase.subscription?.creditsGranted || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Credits Used</p>
                    <p className="text-white">{selectedPurchase.subscription?.creditsUsed || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Skip Credits Available</p>
                    <p className="text-white">{selectedPurchase.subscription?.skipCreditAvailable || 0}</p>
                  </div>
                </div>

              {/* User Information */}
              <div>
                <h4 className="text-white font-medium mb-3">User Information</h4>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Name</p>
                      <p className="text-white">{selectedPurchase.userId?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Email</p>
                      <p className="text-white">{selectedPurchase.userId?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Phone</p>
                      <p className="text-white">
                        {selectedPurchase.userId?.phoneNumber
                          ? `+${selectedPurchase.userId.phoneNumber.countryCode} ${selectedPurchase.userId.phoneNumber.internationalNumber?.replace(`+${selectedPurchase.userId.phoneNumber.countryCode} `, '')}`
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">User ID</p>
                      <p className="text-white text-xs">{selectedPurchase.userId?._id || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Details */}
              <div>
                <h4 className="text-white font-medium mb-3">Subscription Details</h4>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Plan Name</p>
                      <p className="text-white font-medium">{selectedPurchase.subscriptionId?.planName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Category</p>
                      <p className="text-white capitalize">{selectedPurchase.subscriptionId?.category?.replace('_', ' ') || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Duration</p>
                      <p className="text-white">{selectedPurchase.subscriptionId?.durationDays || 0} days</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Original Price</p>
                      <p className="text-white">₹{selectedPurchase.subscriptionId?.price || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Credits Included</p>
                      <p className="text-white">{selectedPurchase.subscriptionId?.creditsIncluded || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Subscription ID</p>
                      <p className="text-white text-xs">{selectedPurchase.subscriptionId?._id || 'N/A'}</p>
                    </div>
                  </div>
                  {selectedPurchase.subscriptionId?.description && (
                    <div className="mt-4">
                      <p className="text-gray-400 text-sm">Description</p>
                      <p className="text-gray-300 text-sm">{selectedPurchase.subscriptionId.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Vendor Details */}
              <div>
                <h4 className="text-white font-medium mb-3">Vendor Information</h4>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Assignment Status</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        (selectedPurchase.subscription?.vendorDetails?.isVendorAssigned || selectedPurchase.vendorDetails?.isVendorAssigned) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {(selectedPurchase.subscription?.vendorDetails?.isVendorAssigned || selectedPurchase.vendorDetails?.isVendorAssigned) ? 'Assigned' : 'Unassigned'}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Vendor ID</p>
                      <p className="text-white text-xs">{selectedPurchase.subscription?.vendorDetails?.currentVendor?.vendorId?._id || selectedPurchase.vendorDetails?.vendorId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Business Name</p>
                      <p className="text-white">{selectedPurchase.subscription?.vendorDetails?.currentVendor?.vendorId?.businessInfo?.businessName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Vendor Type</p>
                      <p className="text-white capitalize">{(selectedPurchase.subscription?.vendorDetails?.currentVendor?.vendorType || selectedPurchase.vendorDetails?.vendorType || 'N/A').replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Verification Status</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedPurchase.subscription?.vendorDetails?.currentVendor?.vendorId?.isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedPurchase.subscription?.vendorDetails?.currentVendor?.vendorId?.isVerified ? 'Verified' : 'Not Verified'}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Rating</p>
                      <div className="flex items-center gap-2">
                        <span className="text-white">{selectedPurchase.subscription?.vendorDetails?.currentVendor?.vendorId?.rating?.average || 0}/5</span>
                        <span className="text-gray-400 text-xs">({selectedPurchase.subscription?.vendorDetails?.currentVendor?.vendorId?.rating?.totalReviews || 0} reviews)</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Current Load</p>
                      <p className="text-white">{selectedPurchase.subscription?.vendorDetails?.currentVendor?.vendorId?.capacity?.currentLoad || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Daily Orders Capacity</p>
                      <p className="text-white">{selectedPurchase.subscription?.vendorDetails?.currentVendor?.vendorId?.capacity?.dailyOrders || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Assigned At</p>
                      <p className="text-white text-sm">{selectedPurchase.subscription?.vendorDetails?.currentVendor?.assignedAt ? new Date(selectedPurchase.subscription.vendorDetails.currentVendor.assignedAt).toLocaleString() : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Switch Used</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedPurchase.subscription?.vendorDetails?.vendorSwitchUsed ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {selectedPurchase.subscription?.vendorDetails?.vendorSwitchUsed ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Service Radius</p>
                      <p className="text-white">{selectedPurchase.subscription?.vendorDetails?.currentVendor?.vendorId?.businessInfo?.serviceArea?.radius || 0} km</p>
                    </div>
                  </div>
                  {selectedPurchase.subscription?.vendorDetails?.currentVendor?.vendorId?.businessInfo?.description && (
                    <div className="mt-4">
                      <p className="text-gray-400 text-sm">Description</p>
                      <p className="text-gray-300 text-sm">{selectedPurchase.subscription.vendorDetails.currentVendor.vendorId.businessInfo.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              {selectedPurchase.paymentDetails && (
                <div>
                  <h4 className="text-white font-medium mb-3">Payment Information</h4>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Payment Method</p>
                        <p className="text-white">{selectedPurchase.paymentDetails.method || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Transaction ID</p>
                        <p className="text-white text-xs">{selectedPurchase.paymentDetails.transactionId || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Payment Status</p>
                        <p className="text-white">{selectedPurchase.paymentDetails.status || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Payment Date</p>
                        <p className="text-white">
                          {selectedPurchase.paymentDetails.paidAt
                            ? new Date(selectedPurchase.paymentDetails.paidAt).toLocaleString()
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Meal Timing */}
              {selectedPurchase.subscription?.mealTiming && (
                <div>
                  <h4 className="text-white font-medium mb-3">Meal Timing Configuration</h4>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedPurchase.subscription.mealTiming.lunch && (
                        <div>
                          <p className="text-gray-400 text-sm">Lunch</p>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              selectedPurchase.subscription.mealTiming.lunch.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {selectedPurchase.subscription.mealTiming.lunch.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                            {selectedPurchase.subscription.mealTiming.lunch.enabled && (
                              <span className="text-white">at {selectedPurchase.subscription.mealTiming.lunch.time}</span>
                            )}
                          </div>
                        </div>
                      )}
                      {selectedPurchase.subscription.mealTiming.dinner && (
                        <div>
                          <p className="text-gray-400 text-sm">Dinner</p>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              selectedPurchase.subscription.mealTiming.dinner.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {selectedPurchase.subscription.mealTiming.dinner.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                            {selectedPurchase.subscription.mealTiming.dinner.enabled && (
                              <span className="text-white">at {selectedPurchase.subscription.mealTiming.dinner.time}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Cancellation Details */}
              {selectedPurchase.subscription?.cancellationDetails && (
                <div>
                  <h4 className="text-white font-medium mb-3">Cancellation Information</h4>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Cancellation Status</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedPurchase.subscription.cancellationDetails.isCancel ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {selectedPurchase.subscription.cancellationDetails.isCancel ? 'Cancelled' : 'Active'}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Refund Amount</p>
                        <p className="text-white">₹{selectedPurchase.subscription.cancellationDetails.refundAmount || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              {selectedPurchase.timeline && (
                <div>
                  <h4 className="text-white font-medium mb-3">Timeline</h4>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-gray-600 rounded">
                        <span className="text-gray-400 text-sm">Purchased</span>
                        <span className="text-white text-sm">{new Date(selectedPurchase.timeline.purchased).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-600 rounded">
                        <span className="text-gray-400 text-sm">Subscription Start</span>
                        <span className="text-white text-sm">{new Date(selectedPurchase.timeline.subscriptionStart).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-600 rounded">
                        <span className="text-gray-400 text-sm">Subscription End</span>
                        <span className="text-white text-sm">{new Date(selectedPurchase.timeline.subscriptionEnd).toLocaleString()}</span>
                      </div>
                      {selectedPurchase.timeline.vendorAssigned && (
                        <div className="flex items-center justify-between p-2 bg-gray-600 rounded">
                          <span className="text-gray-400 text-sm">Vendor Assigned</span>
                          <span className="text-white text-sm">{new Date(selectedPurchase.timeline.vendorAssigned).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between p-2 bg-gray-600 rounded">
                        <span className="text-gray-400 text-sm">Last Updated</span>
                        <span className="text-white text-sm">{new Date(selectedPurchase.timeline.lastUpdated).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Analytics */}
              {selectedPurchase.analytics && (
                <div>
                  <h4 className="text-white font-medium mb-3">Analytics</h4>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Remaining Days</p>
                        <p className="text-white font-medium">{selectedPurchase.analytics.remainingDays}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Daily Meal Count</p>
                        <p className="text-white">{selectedPurchase.analytics.dailyMealCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Total Meals Expected</p>
                        <p className="text-white">{selectedPurchase.analytics.totalMealsExpected}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Credits Used %</p>
                        <p className="text-white">{selectedPurchase.analytics.creditsUsedPercentage}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Remaining Credits</p>
                        <p className="text-white">{selectedPurchase.analytics.remainingCredits}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Is Active</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedPurchase.analytics.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedPurchase.analytics.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vendor Requests */}
              {selectedPurchase.vendorRequests && selectedPurchase.vendorRequests.length > 0 && (
                <div>
                  <h4 className="text-white font-medium mb-3">Vendor Requests History</h4>
                  <div className="bg-gray-700 p-4 rounded-lg space-y-3">
                    {selectedPurchase.vendorRequests.map((request, index) => (
                      <div key={request._id || index} className="bg-gray-600 p-3 rounded">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-400">Type: </span>
                            <span className="text-white capitalize">{request.requestType?.replace('_', ' ')}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Status: </span>
                            <span className={`px-2 py-1 text-xs rounded ${
                              request.status === 'approved' ? 'bg-green-600 text-white' :
                              request.status === 'pending' ? 'bg-yellow-600 text-white' :
                              'bg-red-600 text-white'
                            }`}>
                              {request.status}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Reason: </span>
                            <span className="text-white">{request.reason}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Processed At: </span>
                            <span className="text-white">{new Date(request.processedAt).toLocaleString()}</span>
                          </div>
                        </div>
                        {request.description && (
                          <div className="mt-2">
                            <span className="text-gray-400 text-sm">Description: </span>
                            <span className="text-gray-300 text-sm">{request.description}</span>
                          </div>
                        )}
                        {request.adminNotes && (
                          <div className="mt-2">
                            <span className="text-gray-400 text-sm">Admin Notes: </span>
                            <span className="text-gray-300 text-sm">{request.adminNotes}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              {selectedPurchase.subscription?.deliveryAddress && (
                <div>
                  <h4 className="text-white font-medium mb-3">Delivery Address</h4>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-gray-300">
                      <p>{selectedPurchase.subscription.deliveryAddress.street}</p>
                      <p>{selectedPurchase.subscription.deliveryAddress.city}, {selectedPurchase.subscription.deliveryAddress.state}</p>
                      <p>{selectedPurchase.subscription.deliveryAddress.country} - {selectedPurchase.subscription.deliveryAddress.zipCode}</p>
                      {selectedPurchase.subscription.deliveryAddress.coordinates && (
                        <p className="text-gray-400 text-sm mt-2">
                          Coordinates: {selectedPurchase.subscription.deliveryAddress.coordinates.coordinates.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Details */}
              <div>
                <h4 className="text-white font-medium mb-3">Additional Information</h4>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Skip Credits Used</p>
                      <p className="text-white">{selectedPurchase.subscription?.skipCreditUsed || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Discount Applied</p>
                      <p className="text-white">₹{selectedPurchase.subscription?.discountApplied || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Promo Code Used</p>
                      <p className="text-white">{selectedPurchase.subscription?.promoCodeUsed || 'None'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Is Expired</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedPurchase.subscription?.isExpired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {selectedPurchase.subscription?.isExpired ? 'Expired' : 'Active'}
                      </span>
                    </div>
                    {selectedPurchase.deliveryZone && (
                      <div>
                        <p className="text-gray-400 text-sm">Delivery Zone</p>
                        <p className="text-white">{selectedPurchase.deliveryZone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-lg text-gray-400">Failed to load purchase details</div>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Purchases
import { useState, useEffect } from 'react'
import {
  Calendar, Clock, Package, Filter, Search,
  Eye, RefreshCw, AlertCircle, CheckCircle, XCircle,
  Truck, ChefHat, MapPin, User, Camera, Activity, X, RotateCcw
} from 'lucide-react'
import {
  getAdminOrdersApi,
  confirmOrderDeliveryApi,
  getOrderByIdApi,
  getVendorsApi,
  bulkConfirmOrderDeliveryApi
} from '../../service/api.service'
import toast from 'react-hot-toast'

function Order() {
  const [orders, setOrders] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedOrders, setSelectedOrders] = useState([])
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [confirmingDelivery, setConfirmingDelivery] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    vendorId: '',
    startDate: '',
    endDate: '',
    days: '',
  })

  // Stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    pendingDeliveries: 0,
    completedOrders: 0,
    skippedOrders: 0,
    cancelledOrders: 0
  })

  const orderStatuses = [
    { value: '', label: 'All Statuses' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'skipped', label: 'Skipped' }
  ]

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      )
      
      // Add search term if provided
      if (searchTerm.trim()) {
        cleanFilters.search = searchTerm.trim()
      }

      const data = await getAdminOrdersApi(cleanFilters)
      console.log('Admin Orders:', data)
      
      setOrders(data.data.orders || [])
      
      // Calculate stats
      const orders = data.data.orders || []
      const today = new Date().toDateString()
      
      setStats({
        totalOrders: orders.length,
        todayOrders: orders.filter(order => 
          new Date(order.deliveryDate).toDateString() === today
        ).length,
        pendingDeliveries: orders.filter(order => 
          order.status === 'out_for_delivery'
        ).length,
        completedOrders: orders.filter(order => 
          order.status === 'delivered'
        ).length,
        skippedOrders: orders.filter(order => 
          order.skipDetails?.isSkipped
        ).length,
        cancelledOrders: orders.filter(order => 
          order.cancellationDetails?.isCancelled
        ).length
      })
      
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error(error.response?.data?.message || 'Error fetching orders')
    } finally {
      setLoading(false)
    }
  }

  const fetchVendors = async () => {
    try {
      const data = await getVendorsApi({ limit: 100 })
      setVendors(data.data.vendors || [])
    } catch (error) {
      console.error('Error fetching vendors:', error)
    }
  }

  const fetchOrderDetails = async (orderId) => {
    try {
      const data = await getOrderByIdApi(orderId)
      setSelectedOrder(data.data.order || data.order)
      setShowDetailsModal(true)
    } catch (error) {
      console.error('Error fetching order details:', error)
      toast.error('Error fetching order details')
    }
  }

  const handleConfirmDelivery = async (orderId) => {
    setConfirmingDelivery(true)
    try {
      await confirmOrderDeliveryApi(orderId)
      toast.success('Order delivery confirmed successfully!')
      fetchOrders() // Refresh the orders list
    } catch (error) {
      console.error('Error confirming delivery:', error)
      toast.error(error.response?.data?.message || 'Error confirming delivery')
    } finally {
      setConfirmingDelivery(false)
    }
  }

  const handleBulkConfirmDelivery = async () => {
    setConfirmingDelivery(true)
    try {
      await bulkConfirmOrderDeliveryApi(selectedOrders)
      toast.success('Selected orders confirmed successfully!')
      setSelectedOrders([])
      fetchOrders() // Refresh the orders list
    } catch (error) {
      console.error('Error confirming delivery:', error)
      toast.error(error.response?.data?.message || 'Error confirming delivery')
    } finally {
      setConfirmingDelivery(false)
    }
  }

  const handleSelectOrder = (orderId) => {
    setSelectedOrders((prevSelected) => {
      if (prevSelected.includes(orderId)) {
        return prevSelected.filter((id) => id !== orderId)
      } else {
        return [...prevSelected, orderId]
      }
    })
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(orders.map((order) => order._id))
    } else {
      setSelectedOrders([])
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }))
    fetchOrders()
  }

  const clearAllFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      status: '',
      vendorId: '',
      startDate: '',
      endDate: '',
      days: ''
    })
    setSearchTerm('')
  }

  const hasActiveFilters = () => {
    const filtersToCheck = { ...filters }
    delete filtersToCheck.page
    delete filtersToCheck.limit
    
    return Object.values(filtersToCheck).some(value => value !== '') || searchTerm.trim() !== ''
  }

  const getStatusBadge = (order) => {
    let status = order.status
    let config = {
      upcoming: { bg: 'bg-blue-500/20', text: 'text-blue-300', dot: 'bg-blue-400' },
      confirmed: { bg: 'bg-green-500/20', text: 'text-green-300', dot: 'bg-green-400' },
      preparing: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', dot: 'bg-yellow-400' },
      out_for_delivery: { bg: 'bg-purple-500/20', text: 'text-purple-300', dot: 'bg-purple-400' },
      delivered: { bg: 'bg-green-500/20', text: 'text-green-300', dot: 'bg-green-400' },
      cancelled: { bg: 'bg-red-500/20', text: 'text-red-300', dot: 'bg-red-400' },
      skipped: { bg: 'bg-orange-500/20', text: 'text-orange-300', dot: 'bg-orange-400' }
    }

    // Override status if skipped or cancelled
    if (order.skipDetails?.isSkipped) {
      status = 'skipped'
    } else if (order.cancellationDetails?.isCancelled) {
      status = 'cancelled'
    }

    const statusConfig = config[status] || config.upcoming

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
        {status?.replace('_', ' ')?.charAt(0).toUpperCase() + status?.replace('_', ' ')?.slice(1)}
      </span>
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
    return new Date(istDate).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
    return new Date(istDate).toLocaleString('en-IN')
  }

  useEffect(() => {
    fetchOrders()
    fetchVendors()
  }, [filters])

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Order Management</h1>
          <p className="text-orange-300 mt-1">Manage and monitor all orders across the platform</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors self-start md:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Quick Stats */}
      {/* <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="bg-[#1E2938] p-6 rounded-xl border border-orange-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-300 text-sm">Total Orders</p>
              <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
            </div>
            <Package className="w-8 h-8 text-orange-400" />
          </div>
        </div>

        <div className="bg-[#1E2938] p-6 rounded-xl border border-orange-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-300 text-sm">Today's Orders</p>
              <p className="text-2xl font-bold text-white">{stats.todayOrders}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-[#1E2938] p-6 rounded-xl border border-orange-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-300 text-sm">Pending Deliveries</p>
              <p className="text-2xl font-bold text-white">{stats.pendingDeliveries}</p>
            </div>
            <Truck className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-[#1E2938] p-6 rounded-xl border border-orange-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-300 text-sm">Completed</p>
              <p className="text-2xl font-bold text-white">{stats.completedOrders}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-[#1E2938] p-6 rounded-xl border border-orange-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-300 text-sm">Skipped</p>
              <p className="text-2xl font-bold text-white">{stats.skippedOrders}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-[#1E2938] p-6 rounded-xl border border-orange-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-300 text-sm">Cancelled</p>
              <p className="text-2xl font-bold text-white">{stats.cancelledOrders}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div> */}

      {/* Search and Filters */}
      <div className="bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-white">Search & Filters</h2>
          </div>
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#1E2938] text-white rounded-lg hover:bg-orange-500/20 transition-colors border border-orange-500/30 self-start md:self-auto"
            >
              <RotateCcw className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>
        
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by order number, customer name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 pr-20 py-2 bg-[#1E2938] border border-orange-500/30 rounded-lg text-white placeholder-orange-300/50 focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-20 top-1/2 transform -translate-y-1/2 text-orange-300 hover:text-orange-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
            >
              Search
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 bg-[#1E2938] border border-orange-500/30 rounded-lg text-white focus:ring-2 focus:ring-orange-500 w-full"
          >
            {orderStatuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          {/* <select
            value={filters.vendorId}
            onChange={(e) => handleFilterChange('vendorId', e.target.value)}
            className="px-4 py-2 bg-[#1E2938] border border-orange-500/30 rounded-lg text-white focus:ring-2 focus:ring-orange-500 w-full"
          >
            <option value="">All Vendors</option>
            {vendors.map(vendor => (
              <option key={vendor._id} value={vendor._id}>
                {vendor.name}
              </option>
            ))}
          </select> */}

          {/* <select
            value={filters.days}
            onChange={(e) => handleFilterChange('days', e.target.value)}
            className="px-4 py-2 bg-[#1E2938] border border-orange-500/30 rounded-lg text-white focus:ring-2 focus:ring-orange-500 w-full"
          >
            <option value="">All Days</option>
            <option value="1">Today</option>
            <option value="7">Next 7 Days</option>
            <option value="30">Next 30 Days</option>
          </select> */}

          <div className="relative w-full">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 w-4 h-4" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="pl-10 pr-10 py-2 bg-[#1E2938] border border-orange-500/30 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full"
            />
            {filters.startDate && (
              <button
                onClick={() => handleFilterChange('startDate', '')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-300 hover:text-orange-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative w-full">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 w-4 h-4" />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="pl-10 pr-10 py-2 bg-[#1E2938] border border-orange-500/30 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full"
            />
            {filters.endDate && (
              <button
                onClick={() => handleFilterChange('endDate', '')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-300 hover:text-orange-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            className="px-4 py-2 bg-[#1E2938] border border-orange-500/30 rounded-lg text-white focus:ring-2 focus:ring-orange-500 w-full"
          >
            <option value="desc">Latest First</option>
            <option value="asc">Oldest First</option>
          </select> */}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters() && (
          <div className="mt-4 p-3 bg-[#1E2938] rounded-lg border border-orange-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-orange-300 font-medium">Active Filters:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-white rounded-full text-xs">
                  Search: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="text-orange-300 hover:text-orange-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.status && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-white rounded-full text-xs">
                  Status: {filters.status.replace('_', ' ')}
                  <button onClick={() => handleFilterChange('status', '')} className="text-orange-300 hover:text-orange-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.vendorId && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-white rounded-full text-xs">
                  Vendor: {vendors.find(v => v._id === filters.vendorId)?.name || 'Selected'}
                  <button onClick={() => handleFilterChange('vendorId', '')} className="text-orange-300 hover:text-orange-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.days && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-white rounded-full text-xs">
                  Days: {filters.days === '1' ? 'Today' : filters.days === '7' ? 'Next 7 Days' : filters.days === '30' ? 'Next 30 Days' : filters.days}
                  <button onClick={() => handleFilterChange('days', '')} className="text-orange-300 hover:text-orange-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.startDate && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-white rounded-full text-xs">
                  From: {new Date(filters.startDate).toLocaleDateString()}
                  <button onClick={() => handleFilterChange('startDate', '')} className="text-orange-300 hover:text-orange-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.endDate && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-white rounded-full text-xs">
                  To: {new Date(filters.endDate).toLocaleDateString()}
                  <button onClick={() => handleFilterChange('endDate', '')} className="text-orange-300 hover:text-orange-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Orders List */}
      <div className="bg-[#1E2938] rounded-xl border border-orange-500/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-orange-500/30 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Orders List</h3>
          </div>
          {selectedOrders.length > 0 && (
            <button
              onClick={handleBulkConfirmDelivery}
              disabled={confirmingDelivery}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {confirmingDelivery ? 'Confirming...' : `Confirm ${selectedOrders.length} Orders`}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
              <div className="text-lg text-orange-300">Loading orders...</div>
            </div>
          </div>
        ) : orders?.length > 0 ? (
          <>
            <div className="overflow-x-auto scrollbar-hide hidden md:block">
              <table className="w-full">
                <thead className="bg-orange-500/10">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={selectedOrders.length === orders.length && orders.length > 0}
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Order Details</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Menu Items</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Delivery</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-[#1E2938] divide-y divide-orange-500/20">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-orange-500/10">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order._id)}
                          onChange={() => handleSelectOrder(order._id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-orange-400" />
                          <div>
                            <div>
                              {order.orderNumber }
                            </div>
                            <div className="text-sm text-white font-medium">
                              {order.userId?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-orange-300">
                              {order.userId?.phoneNumber?.internationalNumber || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {order.selectedMenus?.length > 0 ? (
                            <div>
                              <div className="text-white font-medium">
                                {order.selectedMenus[0].foodTitle}
                              </div>
                              {order.selectedMenus.length > 1 && (
                                <div className="text-xs text-orange-300">
                                  +{order.selectedMenus.length - 1} more items
                                </div>
                              )}
                              <div className="text-xs text-orange-300 capitalize mt-1">
                                {order.mealType?.replace('_', ' ')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-orange-300">No items</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-white font-medium">
                            {order.vendorDetails?.vendorId?.businessInfo?.businessName || 'N/A'}
                          </div>
                          <div className="text-xs text-orange-300 capitalize">
                            {order.vendorDetails?.vendorType?.replace('_', ' ') || ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-white">
                            <Calendar className="w-4 h-4 text-orange-400" />
                            {formatDate(order.deliveryDate)}
                          </div>
                          <div className="flex items-center gap-1 text-orange-300 mt-1">
                            <Clock className="w-4 h-4" />
                            {order.deliveryTime || 'N/A'}
                          </div>
                          <div className="text-xs text-orange-300/70 mt-1">
                            {order.deliveryAddress?.city}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {getStatusBadge(order)}
                          {order.cancellationDetails?.isCancelled && (
                            <div className="text-xs text-red-400">Cancelled</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => fetchOrderDetails(order._id)}
                            className="text-orange-400 hover:text-orange-300 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {order.status === 'out_for_delivery' && !order.skipDetails?.isSkipped && !order.cancellationDetails?.isCancelled && (
                            <button
                              onClick={() => handleConfirmDelivery(order._id)}
                              disabled={confirmingDelivery}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle className="w-3 h-3" />
                              {confirmingDelivery ? 'Confirming...' : 'Confirm Delivery'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-4 p-4">
              {orders.map((order) => (
                <div key={order._id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                      <span className="text-white font-medium">
                        {order.orderNumber}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(order.deliveryDate)}
                      </span>
                    </div>
                    {getStatusBadge(order)}
                  </div>

                  <div className="mb-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <User className="w-4 h-4 text-orange-400" />
                      <span>{order.userId?.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <ChefHat className="w-4 h-4 text-orange-400" />
                      <span>{order.vendorDetails?.vendorId?.businessInfo?.businessName || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Package className="w-4 h-4 text-orange-400" />
                      <span>
                        {order.selectedMenus?.length > 0 ? order.selectedMenus[0].foodTitle : 'No items'}
                        {order.selectedMenus?.length > 1 && ` +${order.selectedMenus.length - 1} more`}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-gray-700 gap-3">
                    <button
                      onClick={() => fetchOrderDetails(order._id)}
                      className="flex items-center gap-1 text-orange-400 hover:text-orange-300 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Details
                    </button>
                    {order.status === 'out_for_delivery' && !order.skipDetails?.isSkipped && !order.cancellationDetails?.isCancelled && (
                      <button
                        onClick={() => handleConfirmDelivery(order._id)}
                        disabled={confirmingDelivery}
                        className="flex items-center gap-1 text-green-400 hover:text-green-300 text-sm disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirm
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <div className="text-lg text-white mb-2">No orders found</div>
            <div className="text-sm text-orange-300">Orders will appear here when customers place them</div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2938] rounded-xl w-full max-w-4xl border border-orange-500/30 max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="sticky top-0 bg-[#1E2938] px-6 py-4 border-b border-orange-500/30 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-white">Order Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-orange-500/10 rounded-full text-orange-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Order Header */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-[#1E2938] p-4 rounded-lg border border-orange-500/10">
                  <p className="text-orange-300 text-xs uppercase tracking-wider font-semibold mb-1">Order Number</p>
                  <p className="text-white font-mono font-medium">
                    {selectedOrder.orderNumber || `#${selectedOrder._id?.slice(-8)}`}
                  </p>
                </div>
                <div className="bg-[#1E2938] p-4 rounded-lg border border-orange-500/10">
                  <p className="text-orange-300 text-xs uppercase tracking-wider font-semibold mb-2">Status</p>
                  {getStatusBadge(selectedOrder)}
                </div>
                <div className="bg-[#1E2938] p-4 rounded-lg border border-orange-500/10">
                  <p className="text-orange-300 text-xs uppercase tracking-wider font-semibold mb-1">Credits Used</p>
                  <p className="text-white font-medium text-lg">{selectedOrder.creditsUsed || 0}</p>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h4 className="text-white font-medium mb-4 flex items-center gap-2 text-lg">
                  <User className="w-5 h-5 text-orange-400" />
                  Customer Information
                </h4>
                <div className="bg-[#1E2938] border border-orange-500/20 p-5 rounded-lg">
                  <div className="mb-6">
                    <p className="text-orange-300 text-sm mb-1">User ID</p>
                    <p className="text-white font-mono text-sm bg-black/20 p-2 rounded">{selectedOrder.userId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-orange-300 text-sm mb-2">Delivery Address</p>
                    <div className="text-white space-y-1">
                      <p className="font-medium">{selectedOrder.deliveryAddress?.street}</p>
                      <p>{selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.state}</p>
                      <p className="text-gray-400">{selectedOrder.deliveryAddress?.zipCode}</p>
                      {selectedOrder.deliveryAddress?.landmark && (
                        <div className="mt-2 p-2 bg-orange-500/5 border-l-2 border-orange-500 rounded">
                          <p className="text-orange-300 text-xs uppercase font-semibold">Landmark</p>
                          <p className="text-white text-sm">{selectedOrder.deliveryAddress.landmark}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              {selectedOrder.selectedMenus?.length > 0 && (
                <div>
                  <h4 className="text-white font-medium mb-4 flex items-center gap-2 text-lg">
                    <ChefHat className="w-5 h-5 text-orange-400" />
                    Menu Items ({selectedOrder.mealType?.replace('_', ' ')?.toUpperCase()})
                  </h4>
                  <div className="space-y-3">
                    {selectedOrder.selectedMenus.map((menu, index) => (
                      <div key={menu._id || index} className="flex flex-col sm:flex-row items-start gap-4 p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                        {menu.foodImage && (
                          <img 
                            src={menu.foodImage} 
                            alt={menu.foodTitle}
                            className="w-full sm:w-24 h-48 sm:h-24 rounded-lg object-cover border border-orange-500/20"
                            onError={(e) => {
                              e.target.style.display = 'none'
                            }}
                          />
                        )}
                        <div className="flex-1 w-full">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div>
                              <p className="text-white font-semibold text-lg">{menu.foodTitle}</p>
                              <p className="text-orange-400 font-bold">₹{menu.price}</p>
                            </div>
                            <span className="text-orange-300/50 text-xs font-mono bg-black/20 px-2 py-1 rounded">ID: {menu._id}</span>
                          </div>
                          <p className="text-gray-300 text-sm mb-3 leading-relaxed">{menu.description?.short}</p>
                          {menu.detailedItemList && (
                            <div className="bg-black/20 p-2 rounded text-xs">
                              <span className="text-orange-300 font-semibold mr-2">ITEMS:</span>
                              <span className="text-gray-400">{menu.detailedItemList}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Daily Meal Information */}
              {selectedOrder.dailyMealId && (
                <div>
                  <h4 className="text-white font-medium mb-4 flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5 text-orange-400" />
                    Daily Meal Information
                  </h4>
                  <div className="bg-[#1E2938] border border-orange-500/20 p-5 rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <p className="text-orange-300 text-xs uppercase tracking-wider font-semibold mb-1">Meal Date</p>
                        <p className="text-white font-medium">{formatDate(selectedOrder.dailyMealId.mealDate)}</p>
                      </div>
                      <div>
                        <p className="text-orange-300 text-xs uppercase tracking-wider font-semibold mb-1">Daily Meal ID</p>
                        <p className="text-white font-mono text-xs bg-black/20 p-1.5 rounded inline-block">{selectedOrder.dailyMealId._id}</p>
                      </div>
                    </div>
                    {selectedOrder.dailyMealId.notes && (
                      <div className="mt-4">
                        <p className="text-orange-300 text-xs uppercase tracking-wider font-semibold mb-2">Notes</p>
                        <p className="text-white text-sm bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg italic">
                          "{selectedOrder.dailyMealId.notes}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* User Subscription Information */}
              {selectedOrder.userSubscriptionId && (
                <div>
                  <h4 className="text-white font-medium mb-4 flex items-center gap-2 text-lg">
                    <Package className="w-5 h-5 text-orange-400" />
                    Subscription Details
                  </h4>
                  <div className="bg-[#1E2938] border border-orange-500/20 p-5 rounded-lg space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-black/20 p-3 rounded-lg">
                        <p className="text-orange-300 text-[10px] uppercase tracking-wider font-bold mb-1">Plan Name</p>
                        <p className="text-white text-sm font-medium">{selectedOrder.userSubscriptionId.subscriptionId?.planName || 'N/A'}</p>
                      </div>
                      <div className="bg-black/20 p-3 rounded-lg">
                        <p className="text-orange-300 text-[10px] uppercase tracking-wider font-bold mb-1">Category</p>
                        <p className="text-white text-sm font-medium capitalize">{selectedOrder.userSubscriptionId.subscriptionId?.category || 'N/A'}</p>
                      </div>
                      <div className="bg-black/20 p-3 rounded-lg">
                        <p className="text-orange-300 text-[10px] uppercase tracking-wider font-bold mb-1">Status</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          selectedOrder.userSubscriptionId.status === 'active' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {selectedOrder.userSubscriptionId.status}
                        </span>
                      </div>
                      <div className="bg-black/20 p-3 rounded-lg">
                        <p className="text-orange-300 text-[10px] uppercase tracking-wider font-bold mb-1">Credits</p>
                        <p className="text-white text-sm font-medium">{selectedOrder.userSubscriptionId.creditsUsed || 0}/{selectedOrder.userSubscriptionId.creditsGranted || 0}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="border border-orange-500/10 p-3 rounded-lg">
                        <p className="text-orange-300 text-[10px] uppercase tracking-wider font-bold mb-1">Original Price</p>
                        <p className="text-white text-sm">₹{selectedOrder.userSubscriptionId.originalPrice || 0}</p>
                      </div>
                      <div className="border border-orange-500/10 p-3 rounded-lg">
                        <p className="text-orange-300 text-[10px] uppercase tracking-wider font-bold mb-1">Final Price</p>
                        <p className="text-orange-400 font-bold text-base">₹{selectedOrder.userSubscriptionId.finalPrice || 0}</p>
                      </div>
                      <div className="border border-orange-500/10 p-3 rounded-lg">
                        <p className="text-orange-300 text-[10px] uppercase tracking-wider font-bold mb-1">Discount</p>
                        <p className="text-green-400 text-sm font-medium">₹{selectedOrder.userSubscriptionId.discountApplied || 0}</p>
                      </div>
                      <div className="border border-orange-500/10 p-3 rounded-lg">
                        <p className="text-orange-300 text-[10px] uppercase tracking-wider font-bold mb-1">Skip Credits</p>
                        <p className="text-white text-sm font-medium">{selectedOrder.userSubscriptionId.skipCreditUsed || 0}/{selectedOrder.userSubscriptionId.skipCreditAvailable || 0}</p>
                      </div>
                    </div>

                    {selectedOrder.userSubscriptionId.subscriptionId?.description && (
                      <div className="bg-black/20 p-4 rounded-lg">
                        <p className="text-orange-300 text-xs uppercase tracking-wider font-bold mb-2">Description</p>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {selectedOrder.userSubscriptionId.subscriptionId.description}
                        </p>
                      </div>
                    )}

                    {/* Meal Timing */}
                    {selectedOrder.userSubscriptionId.mealTiming && (
                      <div>
                        <p className="text-orange-300 text-xs uppercase tracking-wider font-bold mb-3">Meal Timing</p>
                        <div className="flex flex-wrap gap-3">
                          {selectedOrder.userSubscriptionId.mealTiming.lunch?.enabled && (
                            <div className="bg-orange-600/20 border border-orange-500/30 px-4 py-2 rounded-full flex items-center gap-2">
                              <Clock className="w-3 h-3 text-orange-400" />
                              <span className="text-white text-xs font-medium">Lunch: {selectedOrder.userSubscriptionId.mealTiming.lunch.time}</span>
                            </div>
                          )}
                          {selectedOrder.userSubscriptionId.mealTiming.dinner?.enabled && (
                            <div className="bg-orange-600/20 border border-orange-500/30 px-4 py-2 rounded-full flex items-center gap-2">
                              <Clock className="w-3 h-3 text-orange-400" />
                              <span className="text-white text-xs font-medium">Dinner: {selectedOrder.userSubscriptionId.mealTiming.dinner.time}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Subscription Period */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-orange-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-green-500/10 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                          <p className="text-orange-300 text-[10px] uppercase font-bold">Start Date</p>
                          <p className="text-white text-sm">{formatDate(selectedOrder.userSubscriptionId.startDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-red-400" />
                        </div>
                        <div>
                          <p className="text-orange-300 text-[10px] uppercase font-bold">End Date</p>
                          <p className="text-white text-sm">{formatDate(selectedOrder.userSubscriptionId.endDate)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vendor Information */}
              <div>
                <h4 className="text-white font-medium mb-4 flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5 text-orange-400" />
                  Vendor Information
                </h4>
                <div className="bg-[#1E2938] border border-orange-500/20 p-5 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                    <div>
                      <p className="text-orange-300 text-xs uppercase tracking-wider font-bold mb-1">Business Name</p>
                      <p className="text-white font-semibold">{selectedOrder.vendorDetails?.vendorId?.businessInfo?.businessName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-orange-300 text-xs uppercase tracking-wider font-bold mb-1">Type</p>
                      <p className="text-white capitalize font-medium">
                        {selectedOrder.vendorDetails?.vendorType?.replace('_', ' ') || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-orange-300 text-xs uppercase tracking-wider font-bold mb-1">Vendor ID</p>
                      <p className="text-white font-mono text-xs bg-black/20 p-1.5 rounded inline-block">{selectedOrder.vendorDetails?.vendorId?._id || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {/* Vendor Assignment Info */}
                  {selectedOrder.userSubscriptionId?.vendorDetails && (
                    <div className="border-t border-orange-500/20 pt-5">
                      <p className="text-orange-300 text-xs uppercase tracking-wider font-bold mb-4">Vendor Assignment</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-black/20 p-3 rounded-lg">
                          <p className="text-gray-400 text-[10px] uppercase mb-1">Assigned</p>
                          <p className="text-white text-sm font-medium">
                            {selectedOrder.userSubscriptionId.vendorDetails.isVendorAssigned ? 'YES' : 'NO'}
                          </p>
                        </div>
                        <div className="bg-black/20 p-3 rounded-lg">
                          <p className="text-gray-400 text-[10px] uppercase mb-1">Assigned At</p>
                          <p className="text-white text-sm font-medium">
                            {selectedOrder.userSubscriptionId.vendorDetails.currentVendor?.assignedAt 
                              ? formatDate(selectedOrder.userSubscriptionId.vendorDetails.currentVendor.assignedAt)
                              : 'N/A'
                            }
                          </p>
                        </div>
                        <div className="bg-black/20 p-3 rounded-lg">
                          <p className="text-gray-400 text-[10px] uppercase mb-1">Switch Used</p>
                          <p className="text-white text-sm font-medium">
                            {selectedOrder.userSubscriptionId.vendorDetails.vendorSwitchUsed ? 'YES' : 'NO'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Information */}
              <div>
                <h4 className="text-white font-medium mb-4 flex items-center gap-2 text-lg">
                  <Truck className="w-5 h-5 text-orange-400" />
                  Delivery Information
                </h4>
                <div className="bg-[#1E2938] border border-orange-500/20 p-5 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-orange-500/50" />
                      <div>
                        <p className="text-orange-300 text-xs uppercase font-bold">Delivery Date</p>
                        <p className="text-white font-medium">{formatDate(selectedOrder.deliveryDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-orange-500/50" />
                      <div>
                        <p className="text-orange-300 text-xs uppercase font-bold">Delivery Time</p>
                        <p className="text-white font-medium">{selectedOrder.deliveryTime || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-orange-500/50" />
                      <div>
                        <p className="text-orange-300 text-xs uppercase font-bold">Created At</p>
                        <p className="text-white font-medium">{formatDateTime(selectedOrder.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Delivery Photos */}
                  {selectedOrder.deliveryConfirmation?.deliveryPhotos?.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-orange-500/20">
                      <p className="text-orange-300 text-xs uppercase tracking-wider font-bold mb-4 flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        Delivery Evidence
                      </p>
                      <div className="flex flex-wrap gap-4">
                        {selectedOrder.deliveryConfirmation.deliveryPhotos.map((photo, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={photo} 
                              alt={`Delivery evidence ${index + 1}`}
                              className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover border-2 border-orange-500/20 hover:border-orange-500 transition-all cursor-zoom-in"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                              <Eye className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Skip/Cancel Details */}
              {(selectedOrder.skipDetails?.isSkipped || selectedOrder.cancellationDetails?.isCancelled) && (
                <div>
                  <h4 className="text-white font-medium mb-4 flex items-center gap-2 text-lg">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    Special Status Details
                  </h4>
                  <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-xl">
                    {selectedOrder.skipDetails?.isSkipped && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-orange-400 font-bold">
                          <RefreshCw className="w-5 h-5" />
                          ORDER SKIPPED
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-black/20 p-3 rounded-lg">
                            <p className="text-gray-400 text-[10px] uppercase mb-1">Reason</p>
                            <p className="text-white text-sm">{selectedOrder.skipDetails.skipReason}</p>
                          </div>
                          <div className="bg-black/20 p-3 rounded-lg">
                            <p className="text-gray-400 text-[10px] uppercase mb-1">Skipped At</p>
                            <p className="text-white text-sm">{formatDateTime(selectedOrder.skipDetails.skippedAt)}</p>
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-bold">
                          {selectedOrder.skipDetails.creditsRefunded ? '✓ CREDITS REFUNDED' : '✗ CREDITS NOT REFUNDED'}
                        </div>
                      </div>
                    )}
                    {selectedOrder.cancellationDetails?.isCancelled && (
                      <div className="flex items-center gap-2 text-red-500 font-bold text-lg">
                        <XCircle className="w-6 h-6" />
                        ORDER CANCELLED
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status History */}
              {selectedOrder.statusHistory?.length > 0 && (
                <div>
                  <h4 className="text-white font-medium mb-4 flex items-center gap-2 text-lg">
                    <Activity className="w-5 h-5 text-orange-400" />
                    Status Timeline
                  </h4>
                  <div className="bg-[#1E2938] border border-orange-500/20 p-6 rounded-lg space-y-6 relative before:absolute before:left-8 before:top-8 before:bottom-8 before:w-0.5 before:bg-orange-500/20">
                    {selectedOrder.statusHistory.map((history, index) => (
                      <div key={index} className="relative pl-10">
                        <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-orange-500 bg-[#1E2938] z-10"></div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                          <span className="text-orange-400 font-bold uppercase text-sm tracking-wide">
                            {history.status?.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            {formatDateTime(history.updatedAt)}
                          </span>
                        </div>
                        {history.notes && (
                          <p className="text-gray-300 text-sm bg-black/20 p-3 rounded-lg border border-orange-500/5 leading-relaxed">
                            {history.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Order
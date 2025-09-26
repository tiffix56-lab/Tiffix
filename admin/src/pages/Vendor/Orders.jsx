import React, { useState, useEffect } from 'react'
import {
  Search, Filter, Package, Clock, CheckCircle, Truck, 
  Eye, Calendar, User, MapPin, RefreshCw, ChefHat,
  BarChart3, AlertCircle, Play, Send
} from 'lucide-react'
import {
  getVendorOrdersApi,
  updateOrderStatusApi,
  getOrderByIdApi
} from '../../service/api.service'
import toast from 'react-hot-toast'

function Orders() {
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(null)
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    days: '',
    startDate: '',
    endDate: ''
  })

  // Order statuses that vendor can update
  const vendorStatuses = [
    { value: 'preparing', label: 'Preparing', color: 'yellow', icon: ChefHat },
    { value: 'out_for_delivery', label: 'Out for Delivery', color: 'purple', icon: Truck }
  ]

  const allStatuses = [
    { value: '', label: 'All Orders' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'confirmed', label: 'Confirmed' },
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
      const data = await getVendorOrdersApi(cleanFilters)
      console.log(data, "Vendor Orders")
      
      setOrders(data.data.orders || [])
      
      // Calculate stats from orders
      const ordersArray = data.data.orders || []
      const stats = {
        totalOrders: ordersArray.length || 0,
        todayOrders: ordersArray.filter(order => {
          const orderDate = new Date(order.deliveryDate).toDateString()
          const today = new Date().toDateString()
          return orderDate === today
        }).length || 0,
        pendingOrders: ordersArray.filter(order =>
          ['upcoming', 'confirmed', 'preparing'].includes(order.status)
        ).length || 0,
        completedOrders: ordersArray.filter(order =>
          order.status === 'delivered'
        ).length || 0
      }
      setStats(stats)
      
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error(error.response?.data?.message || 'Error fetching orders')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderDetails = async (orderId) => {
    try {
      const data = await getOrderByIdApi(orderId)
      setSelectedOrder(data.order)
      setShowDetailsModal(true)
    } catch (error) {
      console.error('Error fetching order details:', error)
      toast.error('Error fetching order details')
    }
  }

  const updateOrderStatus = async (orderId, status, notes = '') => {
    setUpdatingStatus(orderId)
    try {
      await updateOrderStatusApi(orderId, { status })
      toast.success(`Order status updated to ${status.replace('_', ' ')}`)
      fetchOrders() // Refresh the orders list
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error(error.response?.data?.message || 'Error updating order status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [filters])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      upcoming: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-400' },
      confirmed: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-400' },
      preparing: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-400' },
      out_for_delivery: { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-400' },
      delivered: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-400' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-400' },
      skipped: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-400' }
    }

    const config = statusConfig[status] || statusConfig.upcoming

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
        {status?.replace('_', ' ')?.charAt(0).toUpperCase() + status?.replace('_', ' ')?.slice(1)}
      </span>
    )
  }

  const canUpdateStatus = (currentStatus) => {
    // Vendors can only update to 'preparing' and 'out_for_delivery'
    const updateFlow = {
      upcoming: ['preparing'],
      confirmed: ['preparing'],
      preparing: ['out_for_delivery'],
      out_for_delivery: [] // Can't update further, admin handles delivery
    }

    return updateFlow[currentStatus] || []
  }

  const getNextStatus = (currentStatus) => {
    const nextStatuses = canUpdateStatus(currentStatus)
    return nextStatuses[0] || null
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Orders</h1>
          <p className="text-gray-400 mt-1">Manage your assigned orders and deliveries</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Orders</p>
              <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
            </div>
            <Package className="w-8 h-8 text-orange-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Today's Orders</p>
              <p className="text-2xl font-bold text-white">{stats.todayOrders}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-white">{stats.pendingOrders}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-white">{stats.completedOrders}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-white">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
          >
            {allStatuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <select
            value={filters.days}
            onChange={(e) => handleFilterChange('days', e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Days</option>
            <option value="1">Today</option>
            <option value="7">Next 7 Days</option>
            <option value="30">Next 30 Days</option>
          </select>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="date"
              placeholder="Start Date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="date"
              placeholder="End Date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-white">Orders List</h3>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
              <div className="text-lg text-gray-400">Loading orders...</div>
            </div>
          </div>
        ) : orders?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Meal</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Delivery Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {order.orderNumber || `#${order._id?.slice(-6)}` || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-white">{order.userId?.name || 'N/A'}</div>
                          <div className="text-xs text-gray-400">{order.deliveryAddress?.city || ''}</div>
                          <div className="text-xs text-gray-400">{order.userId?.phoneNumber ? `+${order.userId.phoneNumber.countryCode} ${order.userId.phoneNumber.internationalNumber?.replace(`+${order.userId.phoneNumber.countryCode} `, '')}` : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        <div className="font-medium">
                          {order.selectedMenus?.length > 0
                            ? order.selectedMenus.map(menu => menu.foodTitle).join(', ')
                            : 'N/A'
                          }
                        </div>
                        <div className="text-xs text-gray-400 capitalize">{order.mealType?.replace('_', ' ') || ''}</div>
                        {order.selectedMenus?.length > 1 && (
                          <div className="text-xs text-blue-400">+{order.selectedMenus.length - 1} more items</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">
                          {formatDate(order.deliveryDate)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">
                          {order.deliveryTime || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {/* <button 
                          onClick={() => fetchOrderDetails(order._id)}
                          className="text-orange-400 hover:text-orange-300 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button> */}
                        
                        {getNextStatus(order.status) && (
                          <button
                            onClick={() => updateOrderStatus(order._id, getNextStatus(order.status))}
                            disabled={updatingStatus === order._id}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {updatingStatus === order._id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                            {getNextStatus(order.status)?.replace('_', ' ')?.charAt(0).toUpperCase() + getNextStatus(order.status)?.replace('_', ' ')?.slice(1)}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <div className="text-lg text-gray-400 mb-2">No orders found</div>
            <div className="text-sm text-gray-500">Orders will appear here when customers place them</div>
          </div>
        )}

        {orders?.length >= filters.limit && (
          <div className="px-6 py-4 bg-gray-700 border-t border-gray-600">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, orders.length)} of {orders.length}+ orders
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page <= 1}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400">
                  Page {filters.page}
                </span>
                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={orders.length < filters.limit}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Order Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Order Number</p>
                  <p className="text-white font-medium">{selectedOrder.orderNumber || `#${selectedOrder._id?.slice(-8)}` || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Delivery Date</p>
                  <p className="text-white">{formatDate(selectedOrder.deliveryDate)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Delivery Time</p>
                  <p className="text-white">{selectedOrder.deliveryTime || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Credits Used</p>
                  <p className="text-white">{selectedOrder.creditsUsed || 0}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Meal Type</p>
                  <p className="text-white capitalize">{selectedOrder.mealType?.replace('_', ' ') || 'N/A'}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h4 className="text-white font-medium mb-3">Customer Information</h4>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-white mb-2">{selectedOrder.userId?.name || 'N/A'}</p>
                  {selectedOrder.userId?.phoneNumber && (
                    <p className="text-gray-300 text-sm mb-2">
                      +{selectedOrder.userId.phoneNumber.countryCode} {selectedOrder.userId.phoneNumber.internationalNumber?.replace(`+${selectedOrder.userId.phoneNumber.countryCode} `, '')}
                    </p>
                  )}
                  <div className="text-gray-300 text-sm">
                    <p>{selectedOrder.deliveryAddress?.street}</p>
                    <p>{selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.state}</p>
                    <p>{selectedOrder.deliveryAddress?.country} - {selectedOrder.deliveryAddress?.zipCode}</p>
                    {selectedOrder.deliveryAddress?.landmark && (
                      <p className="text-gray-400 text-xs mt-1">Landmark: {selectedOrder.deliveryAddress.landmark}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Menu Details */}
              <div>
                <h4 className="text-white font-medium mb-3">Menu Details</h4>
                <div className="bg-gray-700 p-4 rounded-lg space-y-3">
                  {selectedOrder.selectedMenus?.length > 0 ? (
                    selectedOrder.selectedMenus.map((menu, index) => (
                      <div key={menu._id || index} className="flex items-center gap-3 p-2 bg-gray-600 rounded">
                        {menu.foodImage && (
                          <img
                            src={menu.foodImage}
                            alt={menu.foodTitle}
                            className="w-12 h-12 rounded object-cover"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        )}
                        <div>
                          <p className="text-white font-medium">{menu.foodTitle}</p>
                          <p className="text-gray-400 text-xs">Item {index + 1}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No menu items selected</p>
                  )}
                  <p className="text-gray-400 text-sm mt-2">Meal Type: {selectedOrder.mealType?.replace('_', ' ').charAt(0).toUpperCase() + selectedOrder.mealType?.replace('_', ' ').slice(1)}</p>
                </div>
              </div>

              {/* Skip Details */}
              {selectedOrder.skipDetails?.isSkipped && (
                <div>
                  <h4 className="text-white font-medium mb-3">Skip Information</h4>
                  <div className="bg-orange-900/30 border border-orange-700 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-orange-400" />
                      <span className="text-orange-400 font-medium">Order Skipped</span>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{selectedOrder.skipDetails.skipReason}</p>
                    <p className="text-gray-400 text-xs">
                      Skipped at: {formatDate(selectedOrder.skipDetails.skippedAt)} {formatTime(selectedOrder.skipDetails.skippedAt)}
                    </p>
                    {selectedOrder.skipDetails.creditsRefunded && (
                      <p className="text-green-400 text-xs mt-1">✓ Credits refunded</p>
                    )}
                  </div>
                </div>
              )}

              {/* Status History */}
              {selectedOrder.statusHistory?.length > 0 && (
                <div>
                  <h4 className="text-white font-medium mb-3">Status History</h4>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="space-y-3">
                      {selectedOrder.statusHistory.map((history, index) => (
                        <div key={index} className="flex items-start gap-3 p-2 bg-gray-600 rounded">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusBadge(history.status)}
                              <span className="text-gray-400 text-xs">
                                {formatDate(history.updatedAt)} {formatTime(history.updatedAt)}
                              </span>
                            </div>
                            {history.notes && (
                              <p className="text-gray-300 text-sm">{history.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {getNextStatus(selectedOrder.status) && (
                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder._id, getNextStatus(selectedOrder.status))
                      setShowDetailsModal(false)
                    }}
                    disabled={updatingStatus === selectedOrder._id}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {updatingStatus === selectedOrder._id ? 'Updating...' : `Mark as ${getNextStatus(selectedOrder.status)?.replace('_', ' ')?.charAt(0).toUpperCase() + getNextStatus(selectedOrder.status)?.replace('_', ' ')?.slice(1)}`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders
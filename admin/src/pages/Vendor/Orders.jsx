import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Package, Clock, CheckCircle, Truck, 
  Eye, Calendar, User, MapPin, RefreshCw, ChefHat,
  BarChart3, AlertCircle, Play, Send, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  getVendorOrdersApi,
  updateOrderStatusApi,
  getOrderByIdApi
} from '../../service/api.service';
import toast from 'react-hot-toast';

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between mt-8 text-gray-400">
      <div>
        <p>Showing <span className="font-semibold text-white">{startItem}</span> to <span className="font-semibold text-white">{endItem}</span> of <span className="font-semibold text-white">{totalItems}</span> results</p>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-700 text-white"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>
        <span className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-700 text-white"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


function Orders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    days: '',
    startDate: '',
    endDate: ''
  });

  const vendorStatuses = [
    { value: 'preparing', label: 'Preparing', color: 'yellow', icon: ChefHat },
    { value: 'out_for_delivery', label: 'Out for Delivery', color: 'purple', icon: Truck }
  ];

  const allStatuses = [
    { value: '', label: 'All Orders' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'skipped', label: 'Skipped' }
  ];

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      const response = await getVendorOrdersApi(cleanFilters);
      
      setOrders(response.data.orders || []);
      setPagination(response.data.pagination);
      
      const ordersArray = response.data.orders || [];
      const stats = {
        totalOrders: response.data.pagination?.total || 0,
        todayOrders: ordersArray.filter(order => {
          const orderDate = new Date(order.deliveryDate).toDateString();
          const today = new Date().toDateString();
          return orderDate === today;
        }).length || 0,
        pendingOrders: ordersArray.filter(order =>
          ['upcoming', 'confirmed', 'preparing'].includes(order.status)
        ).length || 0,
        completedOrders: ordersArray.filter(order =>
          order.status === 'delivered'
        ).length || 0
      };
      setStats(stats);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error(error.response?.data?.message || 'Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const data = await getOrderByIdApi(orderId);
      setSelectedOrder(data.order);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Error fetching order details');
    }
  };

  const updateOrderStatus = async (orderId, status, notes = '') => {
    setUpdatingStatus(orderId);
    try {
      await updateOrderStatusApi(orderId, { status });
      toast.success(`Order status updated to ${status.replace('_', ' ')}`);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error.response?.data?.message || 'Error updating order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };
  
  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      upcoming: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-400' },
      confirmed: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-400' },
      preparing: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-400' },
      out_for_delivery: { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-400' },
      delivered: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-400' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-400' },
      skipped: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-400' }
    };

    const config = statusConfig[status] || statusConfig.upcoming;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
        {status?.replace('_', ' ')?.charAt(0).toUpperCase() + status?.replace('_', ' ')?.slice(1)}
      </span>
    );
  };

  const canUpdateStatus = (currentStatus) => {
    const updateFlow = {
      upcoming: ['preparing'],
      confirmed: ['preparing'],
      preparing: ['out_for_delivery'],
      out_for_delivery: []
    };

    return updateFlow[currentStatus] || [];
  };

  const getNextStatus = (currentStatus) => {
    const nextStatuses = canUpdateStatus(currentStatus);
    return nextStatuses[0] || null;
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-6">
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
            {/* <option value="7">Next 7 Days</option>
            <option value="30">Next 30 Days</option> */}
          </select>
          {/* <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="date"
              placeholder="Start Date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div> */}
          {/* <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="date"
              placeholder="End Date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div> */}
        </div>
      </div>

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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{order.orderNumber || `#${order._id?.slice(-6)}`}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-white">{order.userId?.name || 'N/A'}</div>
                          <div className="text-xs text-gray-400">{order.deliveryAddress?.city || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        <div className="font-medium">
                          {order.selectedMenus?.map(menu => menu.foodTitle).join(', ')}
                        </div>
                        <div className="text-xs text-gray-400 capitalize">{order.mealType?.replace('_', ' ')}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">{formatDate(order.deliveryDate)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">{order.deliveryTime}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {getNextStatus(order.status) && (
                          <button
                            onClick={() => updateOrderStatus(order._id, getNextStatus(order.status))}
                            disabled={updatingStatus === order._id}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {updatingStatus === order._id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                            {getNextStatus(order.status)?.replace('_', ' ')?.charAt(0).toUpperCase() + getNextStatus(order.status)?.replace('_', ' ')?.slice(1)}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagination && pagination.pages > 1 && (
              <Pagination
                currentPage={pagination.current}
                totalPages={pagination.pages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <div className="text-lg text-gray-400 mb-2">No orders found</div>
            <div className="text-sm text-gray-500">Orders will appear here when customers place them</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;

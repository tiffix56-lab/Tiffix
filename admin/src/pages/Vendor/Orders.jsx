import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Package, Clock, CheckCircle, Truck, 
  Eye, Calendar, User, MapPin, RefreshCw, ChefHat,
  BarChart3, AlertCircle, Play, Send, ChevronLeft, ChevronRight,
  MoreVertical, Copy, ExternalLink, X, Activity
} from 'lucide-react';
import {
  getVendorOrdersApi,
  updateOrderStatusApi,
  bulkUpdateOrderStatusApi,
  getOrderByIdApi
} from '../../service/api.service';
import toast from 'react-hot-toast';

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 text-gray-400 gap-4 px-4 sm:px-6 py-4 border-t border-gray-700">
      <div className="text-sm text-center sm:text-left">
        <p>Showing <span className="font-semibold text-white">{startItem}</span> to <span className="font-semibold text-white">{endItem}</span> of <span className="font-semibold text-white">{totalItems}</span> results</p>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-700 text-white text-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        <span className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm min-w-[3rem] text-center">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-700 text-white text-sm transition-colors"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


function Orders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
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

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

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

  const fetchOrderDetails = (orderId) => {
    const order = orders.find(o => o._id === orderId);
    if (order) {
      setSelectedOrder(order);
      setShowDetailsModal(true);
    } else {
      toast.error('Order details not found');
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
      upcoming: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400', border: 'border-blue-500/20' },
      confirmed: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400', border: 'border-green-500/20' },
      preparing: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400', border: 'border-yellow-500/20' },
      out_for_delivery: { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400', border: 'border-purple-500/20' },
      delivered: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400', border: 'border-green-500/20' },
      cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400', border: 'border-red-500/20' },
      skipped: { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400', border: 'border-orange-500/20' }
    };

    const config = statusConfig[status] || statusConfig.upcoming;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
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

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => 
        prev.includes(orderId) 
            ? prev.filter(id => id !== orderId) 
            : [...prev, orderId]
    );
  };

  const handleSelectAll = (e) => {
      if (e.target.checked) {
          setSelectedOrders(orders.map(o => o._id));
      } else {
          setSelectedOrders([]);
      }
  };

  const handleBulkStatusChange = async (e) => {
    const newStatus = e.target.value;
    if (!newStatus) return;

    if (window.confirm(`Are you sure you want to change status of ${selectedOrders.length} orders to "${newStatus}"?`)) {
        try {
            await bulkUpdateOrderStatusApi({ orderIds: selectedOrders, status: newStatus });
            toast.success('Orders updated successfully');
            setSelectedOrders([]);
            fetchOrders();
        } catch (error) {
            toast.error('Failed to update orders');
        }
    }
    e.target.value = "";
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <h1 className="text-2xl font-bold text-white">My Orders</h1>
          <p className="text-gray-400 mt-1">Manage your assigned orders and deliveries</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors w-full md:w-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-xs md:text-sm">Total Orders</p>
            <Package className="w-5 h-5 md:w-8 md:h-8 text-orange-400" />
          </div>
          <p className="text-xl md:text-2xl font-bold text-white">{stats.totalOrders}</p>
        </div>
        <div className="bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-xs md:text-sm">Today's Orders</p>
            <Calendar className="w-5 h-5 md:w-8 md:h-8 text-blue-400" />
          </div>
          <p className="text-xl md:text-2xl font-bold text-white">{stats.todayOrders}</p>
        </div>
        <div className="bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-xs md:text-sm">Pending</p>
            <Clock className="w-5 h-5 md:w-8 md:h-8 text-yellow-400" />
          </div>
          <p className="text-xl md:text-2xl font-bold text-white">{stats.pendingOrders}</p>
        </div>
        <div className="bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-xs md:text-sm">Completed</p>
            <CheckCircle className="w-5 h-5 md:w-8 md:h-8 text-green-400" />
          </div>
          <p className="text-xl md:text-2xl font-bold text-white">{stats.completedOrders}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-orange-400" />
          <h2 className="text-lg font-semibold text-white">Filters</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
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
            className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Days</option>
            <option value="1">Today</option>
            {/* <option value="7">Next 7 Days</option>
            <option value="30">Next 30 Days</option> */}
          </select>
        </div>
      </div>

      {/* Orders List / Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Orders List</h3>
          </div>
          {selectedOrders.length > 0 && (
            <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto'>
              <span className='text-sm text-gray-300 whitespace-nowrap'>{selectedOrders.length} selected</span>
              <select onChange={handleBulkStatusChange} className="w-full sm:w-auto px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 text-sm">
                  <option value="">Bulk Actions</option>
                  <option value="preparing">Mark as Preparing</option>
                  <option value="out_for_delivery">Mark Out for Delivery</option>
              </select>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
              <div className="text-lg text-gray-400">Loading orders...</div>
            </div>
          </div>
        ) : orders?.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left w-12">
                      <input 
                        type="checkbox" 
                        onChange={handleSelectAll} 
                        checked={orders.length > 0 && selectedOrders.length === orders.length}
                        className='w-4 h-4 rounded border-gray-600 bg-gray-800 text-orange-600 focus:ring-orange-500 focus:ring-offset-gray-900' 
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Order Details</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Menu Items</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Delivery Info</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <input 
                            type="checkbox" 
                            checked={selectedOrders.includes(order._id)}
                            onChange={() => handleSelectOrder(order._id)}
                            className='w-4 h-4 rounded border-gray-600 bg-gray-800 text-orange-600 focus:ring-orange-500 focus:ring-offset-gray-900'
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white">{order.orderNumber || `#${order._id?.slice(-6)}`}</div>
                        <div className="text-xs text-gray-500 mt-1 font-mono">{order._id?.slice(-6)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{order.userId?.name || 'N/A'}</div>
                            <div className="text-xs text-gray-400">{order.deliveryAddress?.city || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">
                          <div className="font-medium truncate max-w-[200px]" title={order.selectedMenus?.map(menu => menu.foodTitle).join(', ')}>
                            {order.selectedMenus?.map(menu => menu.foodTitle).join(', ')}
                          </div>
                          <div className="text-xs text-orange-400 capitalize mt-1 inline-block px-2 py-0.5 rounded bg-orange-400/10 border border-orange-400/20">
                            {order.mealType?.replace('_', ' ')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Calendar className="w-3.5 h-3.5 text-gray-500" />
                            <span>{formatDate(order.deliveryDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                            <span>{order.deliveryTime}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => fetchOrderDetails(order._id)}
                            className="p-1.5 text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {getNextStatus(order.status) && (
                            <button
                              onClick={() => updateOrderStatus(order._id, getNextStatus(order.status))}
                              disabled={updatingStatus === order._id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updatingStatus === order._id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                              Mark as {getNextStatus(order.status)?.replace('_', ' ')}
                            </button>
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
              <div className="px-4 py-3 bg-gray-900/50 flex items-center gap-3">
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll} 
                  checked={orders.length > 0 && selectedOrders.length === orders.length}
                  className='w-5 h-5 rounded border-gray-600 bg-gray-800 text-orange-600 focus:ring-orange-500 focus:ring-offset-gray-900' 
                />
                <span className="text-sm text-gray-400">Select All</span>
              </div>
              {orders.map((order) => (
                <div key={order._id} className="p-4 bg-gray-800 hover:bg-gray-750 transition-colors">
                  {/* Card Header: Checkbox, ID, Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={selectedOrders.includes(order._id)}
                        onChange={() => handleSelectOrder(order._id)}
                        className='w-5 h-5 rounded border-gray-600 bg-gray-800 text-orange-600 focus:ring-orange-500 focus:ring-offset-gray-900 mt-0.5'
                      />
                      <div>
                        <div className="font-medium text-white">{order.orderNumber || `#${order._id?.slice(-6)}`}</div>
                        <div className="text-xs text-gray-500 font-mono">{order._id?.slice(-6)}</div>
                      </div>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  {/* Card Body: Details Grid */}
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4 pl-8">
                    {/* Customer */}
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-xs text-gray-500 mb-1">Customer</p>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 shrink-0">
                          <User className="w-3 h-3" />
                        </div>
                        <span className="text-sm text-gray-200 truncate">{order.userId?.name || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-xs text-gray-500 mb-1">Delivery</p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-sm text-gray-300">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          <span>{formatDate(order.deliveryDate)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-300">
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                          <span>{order.deliveryTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="col-span-2 bg-gray-700/30 p-3 rounded-lg border border-gray-700/50">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs text-gray-500">Menu Items</p>
                        <span className="text-[10px] uppercase font-bold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded border border-orange-400/20">
                          {order.mealType?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-white font-medium leading-relaxed">
                        {order.selectedMenus?.map(menu => menu.foodTitle).join(', ')}
                      </p>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pl-8 flex justify-end gap-3 mt-4 pt-3 border-t border-gray-700/50">
                    <button
                      onClick={() => fetchOrderDetails(order._id)}
                      className="flex-1 sm:flex-none inline-flex justify-center items-center gap-2 px-4 py-2.5 text-sm font-medium bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Details
                    </button>
                    {getNextStatus(order.status) && (
                      <button
                        onClick={() => updateOrderStatus(order._id, getNextStatus(order.status))}
                        disabled={updatingStatus === order._id}
                        className="flex-1 sm:flex-none inline-flex justify-center items-center gap-2 px-4 py-2.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        {updatingStatus === order._id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Mark as {getNextStatus(order.status)?.replace('_', ' ')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <Pagination
                currentPage={pagination.current}
                totalPages={pagination.pages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={handlePageChange}
              />
            )}
          </>
        ) : (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-500" />
            </div>
            <div className="text-lg font-medium text-white mb-2">No orders found</div>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">Orders will appear here when customers place them. Try adjusting filters if you're looking for specific orders.</p>
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
                  {getStatusBadge(selectedOrder.status)}
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
                <div className="bg-[#1E2938] border border-orange-500/20 p-5 rounded-lg space-y-4">
                  
                  {/* User Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-orange-300 text-xs uppercase tracking-wider font-semibold">User ID</p>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono text-sm bg-black/20 px-2 py-1 rounded">
                          {selectedOrder.userId?._id || selectedOrder.userId || 'N/A'}
                        </span>
                        <button
                          onClick={() => handleCopy(selectedOrder.userId?._id || selectedOrder.userId, 'User ID')}
                          className="p-1 hover:bg-orange-500/10 rounded-md text-orange-300/70 hover:text-orange-300 transition-colors"
                          title="Copy User ID"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-orange-300 text-xs uppercase tracking-wider font-semibold">Full Name</p>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">
                          {selectedOrder.userId?.name || 'N/A'}
                        </span>
                        {selectedOrder.userId?.name && (
                          <button
                            onClick={() => handleCopy(selectedOrder.userId.name, 'Name')}
                            className="p-1 hover:bg-orange-500/10 rounded-md text-orange-300/70 hover:text-orange-300 transition-colors"
                            title="Copy Name"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-orange-300 text-xs uppercase tracking-wider font-semibold">Phone Number</p>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono text-sm">
                          {selectedOrder.userId?.phoneNumber?.internationalNumber || 'N/A'}
                        </span>
                        {selectedOrder.userId?.phoneNumber?.internationalNumber && (
                          <button
                            onClick={() => handleCopy(selectedOrder.userId.phoneNumber.internationalNumber, 'Phone Number')}
                            className="p-1 hover:bg-orange-500/10 rounded-md text-orange-300/70 hover:text-orange-300 transition-colors"
                            title="Copy Phone"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-orange-300 text-xs uppercase tracking-wider font-semibold">Email Address</p>
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm">
                          {selectedOrder.userId?.emailAddress || 'N/A'}
                        </span>
                        {selectedOrder.userId?.emailAddress && (
                          <button
                            onClick={() => handleCopy(selectedOrder.userId.emailAddress, 'Email')}
                            className="p-1 hover:bg-orange-500/10 rounded-md text-orange-300/70 hover:text-orange-300 transition-colors"
                            title="Copy Email"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address Section */}
                  <div className="pt-4 border-t border-orange-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-orange-300 text-xs uppercase tracking-wider font-semibold flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" />
                        Delivery Address
                      </p>
                      <button
                        onClick={() => {
                          const addr = selectedOrder.deliveryAddress;
                          if (addr) handleCopy(`${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}`, 'Address');
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        Copy Address
                      </button>
                    </div>
                    
                    <div className="text-white space-y-1 bg-black/20 p-3 rounded-lg border border-orange-500/10">
                      <p className="font-medium leading-relaxed">{selectedOrder.deliveryAddress?.street}</p>
                      <p className="text-sm text-gray-300">{selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.state}</p>
                      <p className="text-sm text-gray-400">{selectedOrder.deliveryAddress?.zipCode}</p>
                      
                      {selectedOrder.deliveryAddress?.landmark && (
                        <div className="mt-2 pt-2 border-t border-white/10">
                          <span className="text-orange-300 text-xs font-semibold mr-2">LANDMARK:</span>
                          <span className="text-white text-sm">{selectedOrder.deliveryAddress.landmark}</span>
                        </div>
                      )}

                      {/* Map Coordinates Integration */}
                      {selectedOrder.deliveryAddress?.coordinates?.coordinates && (
                        <div className="flex flex-wrap gap-2 pt-3 mt-1">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${selectedOrder.deliveryAddress.coordinates.coordinates[1]},${selectedOrder.deliveryAddress.coordinates.coordinates[0]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-md hover:bg-blue-600/30 transition-colors text-xs font-medium"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View on Map
                          </a>
                          <button
                            onClick={() => {
                              const coords = selectedOrder.deliveryAddress.coordinates.coordinates;
                              handleCopy(`https://www.google.com/maps/search/?api=1&query=${coords[1]},${coords[0]}`, 'Map Link');
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-700 transition-colors text-xs font-medium"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copy Map Link
                          </button>
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
                        <p className="text-white font-medium">{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString('en-IN') : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Delivery Photos */}
                  {selectedOrder.deliveryConfirmation?.deliveryPhotos?.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-orange-500/20">
                      <p className="text-orange-300 text-xs uppercase tracking-wider font-bold mb-4 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
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
                            {history.updatedAt ? new Date(history.updatedAt).toLocaleString('en-IN') : 'N/A'}
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
  );
}

export default Orders;

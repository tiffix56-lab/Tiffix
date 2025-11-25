import { useState, useEffect } from 'react'
import {
  Calendar, Clock, ChefHat, Users, Filter,
  Eye, Plus, RefreshCw, AlertCircle, Utensils,
  RotateCcw, FileText, Activity, Leaf, ChevronLeft, ChevronRight, CheckCircle, XCircle
} from 'lucide-react'
import {
  getDailyMealsApi,
  setTodayMealApi,
  getAvailableMenusForSubscriptionApi,
  getOrderCreationLogsApi,
  retryFailedOrderCreationApi,
  getSubscriptionsApi,
  getMenusApi
} from '../../service/api.service'
import toast from 'react-hot-toast'

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

function DailyMeal() {
  const [dailyMeals, setDailyMeals] = useState([])
  const [orderLogs, setOrderLogs] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [logsLoading, setLogsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('meals') // 'meals' or 'logs'
  const [showSetMealModal, setShowSetMealModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [retryingLog, setRetryingLog] = useState(null)

  // Filters
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    subscriptionId: '',
    vendorType: '',
    page: 1,
    limit: 20,
    sortBy: 'mealDate',
    sortOrder: 'desc'
  })

  const [logFilters, setLogFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    subscriptionId: '',
    page: 1,
    limit: 20
  })

  const [mealPagination, setMealPagination] = useState(null);
  const [logPagination, setLogPagination] = useState(null)

  // Set meal form state
  const [mealForm, setMealForm] = useState({
    subscriptionId: '',
    lunchMenuIds: [],
    dinnerMenuIds: [],
    notes: ''
  })

  const [availableMenus, setAvailableMenus] = useState([])
  const [loadingMenus, setLoadingMenus] = useState(false)
  
  // Search states
  const [subscriptionSearch, setSubscriptionSearch] = useState('')
  const [menuSearch, setMenuSearch] = useState('')
  const [allMenus, setAllMenus] = useState([])
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([])
  const [filteredMenus, setFilteredMenus] = useState([])

  // Stats
  const [stats, setStats] = useState({
    totalMeals: 0,
    todayMeals: 0,
    activeMeals: 0,
    failedOrders: 0
  })

  const vendorTypes = [
    { value: '', label: 'All Vendor Types' },
    { value: 'home_chef', label: 'Home Chef' },
    { value: 'food_vendor', label: 'Food Vendor' },
  ]

  const logStatuses = [
    { value: '', label: 'All Statuses' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'pending', label: 'Pending' }
  ]

  const fetchDailyMeals = async () => {
    setLoading(true)
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      )
      const data = await getDailyMealsApi(cleanFilters)
      const responseData = data.data
      
      setDailyMeals(responseData.meals || [])
      setMealPagination(responseData.pagination)
      
      const meals = responseData.meals || []
      const today = new Date().toDateString()
      
      setStats(prevStats => ({
        ...prevStats,
        totalMeals: responseData.pagination?.total || meals.length,
        todayMeals: meals.filter(meal => 
          new Date(meal.mealDate).toDateString() === today
        ).length,
        activeMeals: meals.filter(meal => meal.isActive).length,
      }))
      
    } catch (error) {
      console.error('Error fetching daily meals:', error)
      toast.error(error.response?.data?.message || 'Error fetching daily meals')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderLogs = async () => {
    setLogsLoading(true)
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(logFilters).filter(([_, value]) => value !== '')
      )
      const data = await getOrderCreationLogsApi(cleanFilters)
      
      setOrderLogs(data.data.logs || [])
      setLogPagination(data.data.pagination)
      
      // Update failed orders count
      const failedCount = (data.data.logs || []).filter(log => 
        log.status === 'failed'
      ).length
      
      setStats(prev => ({ ...prev, failedOrders: failedCount }))
      
    } catch (error) {
      console.error('Error fetching order logs:', error)
      toast.error(error.response?.data?.message || 'Error fetching order logs')
    } finally {
      setLogsLoading(false)
    }
  }

  const fetchSubscriptions = async () => {
    try {
      const data = await getSubscriptionsApi({ limit: 100, isActive: true })
      const subs = data.data.subscriptions || []
      setSubscriptions(subs)
      setFilteredSubscriptions(subs)
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    }
  }

  const fetchAllMenus = async () => {
    try {
      const data = await getMenusApi({ limit: 100, isAvailable: true })
      const menus = data.data.menus || []
      setAllMenus(menus)
      setFilteredMenus(menus)
    } catch (error) {
      console.error('Error fetching menus:', error)
    }
  }

  const fetchAvailableMenus = async (subscriptionId) => {
    if (!subscriptionId) {
      setAvailableMenus([])
      return
    }

    setLoadingMenus(true)
    try {
      const data = await getAvailableMenusForSubscriptionApi(subscriptionId)
      setAvailableMenus(data.data || [])
    } catch (error) {
      console.error('Error fetching available menus:', error)
      toast.error('Error fetching available menus')
      setAvailableMenus([])
    } finally {
      setLoadingMenus(false)
    }
  }

  // Search functions
  const handleSubscriptionSearch = (searchTerm) => {
    setSubscriptionSearch(searchTerm)
    if (!searchTerm.trim()) {
      setFilteredSubscriptions(subscriptions)
    } else {
      const filtered = subscriptions.filter(sub => 
        sub.planName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.vendorType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredSubscriptions(filtered)
    }
  }

  const handleMenuSearch = (searchTerm) => {
    setMenuSearch(searchTerm)
    const menusToFilter = availableMenus.length > 0 ? availableMenus : allMenus
    
    if (!searchTerm.trim()) {
      setFilteredMenus(menusToFilter)
    } else {
      const filtered = menusToFilter.filter(menu => 
        menu.foodTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        menu.description?.short?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        menu.description?.long?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        menu.cuisine?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        menu.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        menu.dietaryOptions?.some(option => option.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredMenus(filtered)
    }
  }

  const handleSetTodayMeal = async () => {
    if (!mealForm.subscriptionId) {
      toast.error('Please select a subscription')
      return
    }

    if (mealForm.lunchMenuIds.length === 0 && mealForm.dinnerMenuIds.length === 0) {
      toast.error('Please select at least one menu for lunch or dinner')
      return
    }

    if (!mealForm.notes || !mealForm.notes.trim()) {
      toast.error('Please add notes for today\'s meal')
      return
    }

    setSubmitting(true)
    try {
      await setTodayMealApi(mealForm)
      toast.success('Today\'s meal set successfully!')
      setShowSetMealModal(false)
      setMealForm({
        subscriptionId: '',
        lunchMenuIds: [],
        dinnerMenuIds: [],
        notes: ''
      })
      setSubscriptionSearch('')
      setMenuSearch('')
      setFilteredSubscriptions(subscriptions)
      setFilteredMenus(availableMenus.length > 0 ? availableMenus : allMenus)
      fetchDailyMeals()
    } catch (error) {
      console.error('Error setting today\'s meal:', error)
      toast.error(error.response?.data?.message || 'Error setting today\'s meal')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetryFailedOrder = async (logId, attemptIndex) => {
    setRetryingLog(logId)
    try {
      await retryFailedOrderCreationApi(logId, attemptIndex)
      toast.success('Order creation retry initiated!')
      fetchOrderLogs()
    } catch (error) {
      console.error('Error retrying order creation:', error)
      toast.error(error.response?.data?.message || 'Error retrying order creation')
    } finally {
      setRetryingLog(null)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handleLogFilterChange = (key, value) => {
    setLogFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN')
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-400' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-400' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-400' }
    }

    const config = statusConfig[status] || statusConfig.pending

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    )
  }

  useEffect(() => {
    fetchDailyMeals()
    fetchSubscriptions()
    fetchAllMenus()
  }, [filters])

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchOrderLogs()
    }
  }, [activeTab, logFilters])

  useEffect(() => {
    if (mealForm.subscriptionId) {
      fetchAvailableMenus(mealForm.subscriptionId)
    }
  }, [mealForm.subscriptionId])

  useEffect(() => {
    handleMenuSearch(menuSearch)
  }, [availableMenus, allMenus])

  useEffect(() => {
    handleSubscriptionSearch(subscriptionSearch)
  }, [subscriptions])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Daily Meal Management</h1>
          <p className="text-gray-400 mt-1">Manage daily meals and monitor order creation</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSetMealModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Set Today's Meal
          </button>
          <button
            onClick={activeTab === 'meals' ? fetchDailyMeals : fetchOrderLogs}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
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
              <p className="text-gray-400 text-sm">Total Meals</p>
              <p className="text-2xl font-bold text-white">{stats.totalMeals}</p>
            </div>
            <ChefHat className="w-8 h-8 text-orange-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Today's Meals</p>
              <p className="text-2xl font-bold text-white">{stats.todayMeals}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Meals</p>
              <p className="text-2xl font-bold text-white">{stats.activeMeals}</p>
            </div>
            <Activity className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Failed Orders</p>
              <p className="text-2xl font-bold text-white">{stats.failedOrders}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('meals')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'meals'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <ChefHat className="w-4 h-4" />
              Daily Meals
            </div>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'logs'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Order Creation Logs
            </div>
          </button>
        </div>

        {/* Daily Meals Tab */}
        {activeTab === 'meals' && (
          <div className="p-6">
            {/* Filters */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-white">Filters</h3>
              </div>
              
              <div className="flex gap-4">
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


                <select
                  value={filters.vendorType}
                  onChange={(e) => handleFilterChange('vendorType', e.target.value)}
                  className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                >
                  {vendorTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="desc">Latest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>

            {/* Stats Overview */}
            {dailyMeals.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      <span className="text-sm text-gray-400">Total Meals</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{mealPagination?.total || dailyMeals.length}</div>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <ChefHat className="w-5 h-5 text-green-400" />
                      <span className="text-sm text-gray-400">Avg Rating</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {(dailyMeals.reduce((acc, meal) => {
                        const lunchAvg = meal.selectedMenus?.lunchMenus?.reduce((sum, menu) => sum + (menu.rating?.average || 0), 0) / (meal.selectedMenus?.lunchMenus?.length || 1) || 0;
                        const dinnerAvg = meal.selectedMenus?.dinnerMenus?.reduce((sum, menu) => sum + (menu.rating?.average || 0), 0) / (meal.selectedMenus?.dinnerMenus?.length || 1) || 0;
                        return acc + ((lunchAvg + dinnerAvg) / 2);
                      }, 0) / dailyMeals.length || 0).toFixed(1)}★
                    </div>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Utensils className="w-5 h-5 text-orange-400" />
                      <span className="text-sm text-gray-400">Vegetarian</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {dailyMeals.reduce((count, meal) => {
                        const hasVeg = meal.selectedMenus?.lunchMenus?.some(menu => menu.dietaryOptions?.includes('vegetarian')) ||
                                      meal.selectedMenus?.dinnerMenus?.some(menu => menu.dietaryOptions?.includes('vegetarian'));
                        return count + (hasVeg ? 1 : 0);
                      }, 0)}
                    </div>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Leaf className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm text-gray-400">Vegan</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {dailyMeals.reduce((count, meal) => {
                        const hasVegan = meal.selectedMenus?.lunchMenus?.some(menu => menu.dietaryOptions?.includes('vegan')) ||
                                        meal.selectedMenus?.dinnerMenus?.some(menu => menu.dietaryOptions?.includes('vegan'));
                        return count + (hasVegan ? 1 : 0);
                      }, 0)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Daily Meals List */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
                  <div className="text-lg text-gray-400">Loading daily meals...</div>
                </div>
              </div>
            ) : dailyMeals.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Subscription</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Vendor</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Lunch Menus</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Dinner Menus</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {dailyMeals.map((meal) => (
                        <tr key={meal._id} className="hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-white">
                                {formatDate(meal.mealDate)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-white">
                              <div className="font-medium">{meal.subscriptionId?.planName || meal.subscriptionId?.title || 'N/A'}</div>
                              <div className="text-xs text-gray-400 capitalize">
                                {meal.subscriptionId?.category?.replace('_', ' ') || ''}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-white">
                              <div className="font-medium capitalize">
                                {meal.vendorType?.replace('_', ' ') || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-400">
                                Created by: {meal.createdBy?.name || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-white">
                              {meal.selectedMenus?.lunchMenus?.length > 0 ? (
                                <div>
                                  <div className="font-medium">{meal.selectedMenus.lunchMenus[0].foodTitle}</div>
                                  <div className="text-xs text-orange-400">₹{meal.selectedMenus.lunchMenus[0].price} • {meal.selectedMenus.lunchMenus[0].cuisine}</div>
                                  {meal.selectedMenus.lunchMenus.length > 1 && (
                                    <div className="text-xs text-gray-400">+{meal.selectedMenus.lunchMenus.length - 1} more</div>
                                  )}
                                </div>
                              ) : meal.lunchMenus?.length > 0 ? (
                                <div>
                                  <div className="font-medium">{meal.lunchMenus[0].title}</div>
                                  {meal.lunchMenus.length > 1 && (
                                    <div className="text-xs text-gray-400">+{meal.lunchMenus.length - 1} more</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">Not set</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-white">
                              {meal.selectedMenus?.dinnerMenus?.length > 0 ? (
                                <div>
                                  <div className="font-medium">{meal.selectedMenus.dinnerMenus[0].foodTitle}</div>
                                  <div className="text-xs text-orange-400">₹{meal.selectedMenus.dinnerMenus[0].price} • {meal.selectedMenus.dinnerMenus[0].cuisine}</div>
                                  {meal.selectedMenus.dinnerMenus.length > 1 && (
                                    <div className="text-xs text-gray-400">+{meal.selectedMenus.dinnerMenus.length - 1} more</div>
                                  )}
                                </div>
                              ) : meal.dinnerMenus?.length > 0 ? (
                                <div>
                                  <div className="font-medium">{meal.dinnerMenus[0].title}</div>
                                  {meal.dinnerMenus.length > 1 && (
                                    <div className="text-xs text-gray-400">+{meal.dinnerMenus.length - 1} more</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">Not set</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${meal.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${meal.isActive ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                              {meal.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button 
                              onClick={() => {
                                setSelectedMeal(meal)
                                setShowDetailsModal(true)
                              }}
                              className="text-orange-400 hover:text-orange-300 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {mealPagination && mealPagination.pages > 1 && (
                    <Pagination
                        currentPage={mealPagination.current}
                        totalPages={mealPagination.pages}
                        totalItems={mealPagination.total}
                        itemsPerPage={mealPagination.limit}
                        onPageChange={(page) => handleFilterChange('page', page)}
                    />
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <ChefHat className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <div className="text-lg text-gray-400 mb-2">No daily meals found</div>
                <div className="text-sm text-gray-500">Set today's meals to get started</div>
              </div>
            )}
          </div>
        )}

        {/* Order Creation Logs Tab */}
        {activeTab === 'logs' && (
          <div className="p-6">
            {/* Log Filters */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-white">Log Filters</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={logFilters.status}
                  onChange={(e) => handleLogFilterChange('status', e.target.value)}
                  className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                >
                  {logStatuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type="date"
                    value={logFilters.startDate}
                    onChange={(e) => handleLogFilterChange('startDate', e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type="date"
                    value={logFilters.endDate}
                    onChange={(e) => handleLogFilterChange('endDate', e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <select
                  value={logFilters.subscriptionId}
                  onChange={(e) => handleLogFilterChange('subscriptionId', e.target.value)}
                  className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">All Subscriptions</option>
                  {subscriptions.map(sub => (
                    <option key={sub._id} value={sub._id}>
                      {sub.planName} - {sub.category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Order Logs List */}
            {logsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
                  <div className="text-lg text-gray-400">Loading order creation logs...</div>
                </div>
              </div>
            ) : orderLogs.length > 0 ? (
              <div className="space-y-4">
                {orderLogs.map((log) => (
                  <div key={log._id} className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-medium text-white">
                            {log.subscriptionId?.planName || 'System Triggered'}
                          </h4>
                          {getStatusBadge(log.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(log.triggerDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDateTime(log.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {log.totalUsersFound || 0} users found
                          </span>
                        </div>
                      </div>
                    </div>

                    {(log.successfulOrders?.length > 0 || log.failedOrders?.length > 0) && (
                        <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-300 mb-2">Order Creation Details:</h5>
                            <div className="space-y-2 text-sm">
                                {log.totalOrdersCreated > 0 && (
                                    <div className="flex items-center gap-2 text-green-400">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>{log.totalOrdersCreated} orders created successfully.</span>
                                    </div>
                                )}
                                {log.totalOrdersFailed > 0 && (
                                     <div className="flex items-center gap-2 text-red-400">
                                        <XCircle className="w-4 h-4" />
                                        <span>{log.totalOrdersFailed} orders failed.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                  </div>
                ))}
                {logPagination && logPagination.pages > 1 && (
                    <Pagination
                        currentPage={logPagination.current}
                        totalPages={logPagination.pages}
                        totalItems={logPagination.total}
                        itemsPerPage={logPagination.limit}
                        onPageChange={(page) => setLogFilters(prev => ({ ...prev, page }))}
                    />
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <div className="text-lg text-gray-400 mb-2">No order creation logs found</div>
                <div className="text-sm text-gray-500">Logs will appear here when orders are processed</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Set Today's Meal Modal */}
      {showSetMealModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Set Today's Meal</h3>
              <button
                onClick={() => setShowSetMealModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Subscription Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subscription *
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search subscriptions..."
                      value={subscriptionSearch}
                      onChange={(e) => handleSubscriptionSearch(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <select
                    value={mealForm.subscriptionId}
                    onChange={(e) => setMealForm(prev => ({ ...prev, subscriptionId: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select a subscription</option>
                    {filteredSubscriptions.map(sub => (
                      <option key={sub._id} value={sub._id}>
                        {sub.planName || sub.title} - {sub.vendorType} ({sub.category})
                      </option>
                    ))}
                  </select>
                  {subscriptionSearch && filteredSubscriptions.length === 0 && (
                    <p className="text-gray-400 text-sm">No subscriptions found matching your search.</p>
                  )}
                </div>
              </div>

              {/* Menu Selection */}
              {mealForm.subscriptionId && (
                <>
                  {loadingMenus ? (
                    <div className="text-center py-8">
                      <RefreshCw className="w-6 h-6 text-orange-500 animate-spin mx-auto mb-2" />
                      <div className="text-gray-400">Loading available menus...</div>
                    </div>
                  ) : (
                    <>
                      {/* Menu Search */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Search Menus
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search by name, cuisine, dietary options..."
                            value={menuSearch}
                            onChange={(e) => handleMenuSearch(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        {menuSearch && filteredMenus.length === 0 && (
                          <p className="text-gray-400 text-sm mt-2">No menus found matching your search.</p>
                        )}
                      </div>

                      {/* Lunch Menus */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Lunch Menus ({filteredMenus.length} available)
                        </label>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {filteredMenus.map(menu => (
                            <label key={`lunch-${menu._id}`} className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                              <input
                                type="checkbox"
                                checked={mealForm.lunchMenuIds.includes(menu._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setMealForm(prev => ({
                                      ...prev,
                                      lunchMenuIds: [...prev.lunchMenuIds, menu._id]
                                    }))
                                  } else {
                                    setMealForm(prev => ({
                                      ...prev,
                                      lunchMenuIds: prev.lunchMenuIds.filter(id => id !== menu._id)
                                    }))
                                  }
                                }}
                                className="rounded text-orange-600 focus:ring-orange-500 focus:ring-2 mt-1"
                              />
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="text-white font-medium text-lg">{menu.foodTitle}</div>
                                    <div className="text-orange-400 font-bold text-lg">₹{menu.price}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-orange-400 text-sm capitalize">{menu.cuisine}</div>
                                    <div className="text-gray-400 text-xs">{menu.prepTime}min • {menu.calories}cal</div>
                                  </div>
                                </div>
                                {menu.description?.short && (
                                  <div className="text-gray-300 text-sm mt-1">{menu.description.short}</div>
                                )}
                                {menu.dietaryOptions && menu.dietaryOptions.length > 0 && (
                                  <div className="flex gap-1 flex-wrap mt-2">
                                    {menu.dietaryOptions.map((option, idx) => (
                                      <span key={idx} className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium capitalize">
                                        {option}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {menu.tags && menu.tags.length > 0 && (
                                  <div className="flex gap-1 flex-wrap mt-1">
                                    {menu.tags.slice(0, 3).map((tag, idx) => (
                                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                        #{tag}
                                      </span>
                                    ))}
                                    {menu.tags.length > 3 && (
                                      <span className="text-gray-400 text-xs">+{menu.tags.length - 3} more</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Dinner Menus */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Dinner Menus ({filteredMenus.length} available)
                        </label>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {filteredMenus.map(menu => (
                            <label key={`dinner-${menu._id}`} className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                              <input
                                type="checkbox"
                                checked={mealForm.dinnerMenuIds.includes(menu._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setMealForm(prev => ({
                                      ...prev,
                                      dinnerMenuIds: [...prev.dinnerMenuIds, menu._id]
                                    }))
                                  } else {
                                    setMealForm(prev => ({
                                      ...prev,
                                      dinnerMenuIds: prev.dinnerMenuIds.filter(id => id !== menu._id)
                                    }))
                                  }
                                }}
                                className="rounded text-orange-600 focus:ring-orange-500 focus:ring-2 mt-1"
                              />
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="text-white font-medium text-lg">{menu.foodTitle}</div>
                                    <div className="text-orange-400 font-bold text-lg">₹{menu.price}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-orange-400 text-sm capitalize">{menu.cuisine}</div>
                                    <div className="text-gray-400 text-xs">{menu.prepTime}min • {menu.calories}cal</div>
                                  </div>
                                </div>
                                {menu.description?.short && (
                                  <div className="text-gray-300 text-sm mt-1">{menu.description.short}</div>
                                )}
                                {menu.dietaryOptions && menu.dietaryOptions.length > 0 && (
                                  <div className="flex gap-1 flex-wrap mt-2">
                                    {menu.dietaryOptions.map((option, idx) => (
                                      <span key={idx} className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium capitalize">
                                        {option}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {menu.tags && menu.tags.length > 0 && (
                                  <div className="flex gap-1 flex-wrap mt-1">
                                    {menu.tags.slice(0, 3).map((tag, idx) => (
                                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                        #{tag}
                                      </span>
                                    ))}
                                    {menu.tags.length > 3 && (
                                      <span className="text-gray-400 text-xs">+{menu.tags.length - 3} more</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes *
                </label>
                <textarea
                  value={mealForm.notes}
                  onChange={(e) => setMealForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Add any special notes for today's meal..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowSetMealModal(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetTodayMeal}
                  disabled={submitting}
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Setting...' : 'Set Today\'s Meal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meal Details Modal */}
      {showDetailsModal && selectedMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-3xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Daily Meal Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Date</p>
                  <p className="text-white font-medium">{formatDate(selectedMeal.mealDate)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${selectedMeal.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedMeal.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Subscription Info */}
              <div>
                <h4 className="text-white font-medium mb-3">Subscription Details</h4>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-white font-medium mb-2">{selectedMeal.subscriptionId?.planName || selectedMeal.subscriptionId?.title || 'N/A'}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Category</p>
                      <p className="text-gray-300 capitalize">
                        {selectedMeal.subscriptionId?.category?.replace('_', ' ') || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Vendor Type</p>
                      <p className="text-gray-300 capitalize">
                        {selectedMeal.vendorType?.replace('_', ' ') || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                    <div>
                      <p className="text-gray-400">Created By</p>
                      <p className="text-gray-300">{selectedMeal.createdBy?.name || 'N/A'}</p>
                      <p className="text-gray-400 text-xs">{selectedMeal.createdBy?.emailAddress || ''}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Created At</p>
                      <p className="text-gray-300">{formatDateTime(selectedMeal.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lunch Menus */}
              {(selectedMeal.selectedMenus?.lunchMenus?.length > 0 || selectedMeal.lunchMenus?.length > 0) && (
                <div>
                  <h4 className="text-white font-medium mb-3">Lunch Menus</h4>
                  <div className="bg-gray-700 p-4 rounded-lg space-y-4">
                    {selectedMeal.selectedMenus?.lunchMenus?.map((menu, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-gray-600 rounded-lg">
                        {menu.foodImage && (
                          <img 
                            src={menu.foodImage} 
                            alt={menu.foodTitle} 
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-white font-semibold text-lg">{menu.foodTitle}</p>
                              <p className="text-orange-400 font-bold text-lg">₹{menu.price}</p>
                              {menu.description?.short && (
                                <p className="text-gray-300 text-sm mt-1">{menu.description.short}</p>
                              )}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${menu.isAvailable 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {menu.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                          
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-400">★</span>
                                <span className="text-white text-sm">{menu.rating?.average || 0}</span>
                                <span className="text-gray-400 text-xs">({menu.rating?.totalReviews || 0} reviews)</span>
                              </div>
                              <span className="text-orange-400 text-sm">{menu.cuisine}</span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1 text-gray-300">
                                <Clock className="w-4 h-4" />
                                <span>{menu.prepTime}min</span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-300">
                                <Activity className="w-4 h-4" />
                                <span>{menu.calories}cal</span>
                              </div>
                            </div>

                            {menu.dietaryOptions?.length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap">
                                {menu.dietaryOptions.map((option, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium capitalize">
                                    {option}
                                  </span>
                                ))}
                              </div>
                            )}

                            {menu.tags?.length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap">
                                {menu.tags.map((tag, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {menu.description?.long && (
                              <div className="bg-gray-500 p-3 rounded-lg">
                                <p className="text-gray-400 text-xs font-medium mb-1">Description</p>
                                <p className="text-gray-200 text-sm">{menu.description.long}</p>
                              </div>
                            )}

                            {menu.detailedItemList && (
                              <div className="bg-gray-500 p-3 rounded-lg">
                                <p className="text-gray-400 text-xs font-medium mb-1">Ingredients</p>
                                <p className="text-gray-200 text-sm">{menu.detailedItemList}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )) || selectedMeal.lunchMenus?.map((menu, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-600 rounded-lg">
                        <Utensils className="w-5 h-5 text-orange-400" />
                        <div>
                          <p className="text-white font-medium">{menu.title}</p>
                          <p className="text-gray-300 text-sm">{menu.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dinner Menus */}
              {(selectedMeal.selectedMenus?.dinnerMenus?.length > 0 || selectedMeal.dinnerMenus?.length > 0) && (
                <div>
                  <h4 className="text-white font-medium mb-3">Dinner Menus</h4>
                  <div className="bg-gray-700 p-4 rounded-lg space-y-4">
                    {selectedMeal.selectedMenus?.dinnerMenus?.map((menu, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-gray-600 rounded-lg">
                        {menu.foodImage && (
                          <img 
                            src={menu.foodImage} 
                            alt={menu.foodTitle} 
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-white font-semibold text-lg">{menu.foodTitle}</p>
                              <p className="text-orange-400 font-bold text-lg">₹{menu.price}</p>
                              {menu.description?.short && (
                                <p className="text-gray-300 text-sm mt-1">{menu.description.short}</p>
                              )}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${menu.isAvailable 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {menu.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                          
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-400">★</span>
                                <span className="text-white text-sm">{menu.rating?.average || 0}</span>
                                <span className="text-gray-400 text-xs">({menu.rating?.totalReviews || 0} reviews)</span>
                              </div>
                              <span className="text-orange-400 text-sm">{menu.cuisine}</span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1 text-gray-300">
                                <Clock className="w-4 h-4" />
                                <span>{menu.prepTime}min</span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-300">
                                <Activity className="w-4 h-4" />
                                <span>{menu.calories}cal</span>
                              </div>
                            </div>

                            {menu.dietaryOptions?.length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap">
                                {menu.dietaryOptions.map((option, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium capitalize">
                                    {option}
                                  </span>
                                ))}
                              </div>
                            )}

                            {menu.tags?.length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap">
                                {menu.tags.map((tag, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {menu.description?.long && (
                              <div className="bg-gray-500 p-3 rounded-lg">
                                <p className="text-gray-400 text-xs font-medium mb-1">Description</p>
                                <p className="text-gray-200 text-sm">{menu.description.long}</p>
                              </div>
                            )}

                            {menu.detailedItemList && (
                              <div className="bg-gray-500 p-3 rounded-lg">
                                <p className="text-gray-400 text-xs font-medium mb-1">Ingredients</p>
                                <p className="text-gray-200 text-sm">{menu.detailedItemList}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )) || selectedMeal.dinnerMenus?.map((menu, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-600 rounded-lg">
                        <Utensils className="w-5 h-5 text-orange-400" />
                        <div>
                          <p className="text-white font-medium">{menu.title}</p>
                          <p className="text-gray-300 text-sm">{menu.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedMeal.notes && (
                <div>
                  <h4 className="text-white font-medium mb-3">Notes</h4>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-300">{selectedMeal.notes}</p>
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

export default DailyMeal

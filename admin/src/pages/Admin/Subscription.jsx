import React, { useState, useEffect } from 'react'
import { 
  Plus, Edit, Trash2, Search, Filter, Crown, Clock, 
  DollarSign, Calendar, Package, Eye, EyeOff, Star,
  RefreshCw, ChefHat, Utensils, CheckCircle, XCircle,
  TrendingUp, TrendingDown, BarChart3
} from 'lucide-react'
import {
  createSubscriptionApi,
  getSubscriptionsApi,
  getSubscriptionByIdApi,
  updateSubscriptionApi,
  deleteSubscriptionApi,
  toggleSubscriptionStatusApi,
  getSubscriptionStatsApi,
  getMenusApi
} from '../../service/api.service'
import toast from 'react-hot-toast'

function Subscription() {
  const [subscriptions, setSubscriptions] = useState([])
  const [stats, setStats] = useState(null)
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState(null)
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    category: '',
    isActive: '',
    duration: '',
    minPrice: '',
    maxPrice: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [formData, setFormData] = useState({
    planName: '',
    duration: 'monthly',
    durationDays: 30,
    mealTimings: {
      isLunchAvailable: true,
      isDinnerAvailable: true,
      lunchOrderWindow: {
        startTime: '11:00',
        endTime: '16:00'
      },
      dinnerOrderWindow: {
        startTime: '19:00',
        endTime: '23:00'
      }
    },
    mealsPerPlan: 60,
    userSkipMealPerPlan: 6,
    originalPrice: '',
    discountedPrice: '',
    category: 'home_chef',
    freeDelivery: true,
    description: '',
    features: [],
    terms: '',
    tags: [],
    planMenus: []
  })

  const [menuSearchTerm, setMenuSearchTerm] = useState('')

  useEffect(() => {
    fetchSubscriptions()
    fetchStats()
    fetchMenus()
  }, [filters])

  const fetchSubscriptions = async () => {
    setLoading(true)
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      )
      const response = await getSubscriptionsApi(cleanFilters)
      setSubscriptions(response.data.subscriptions || [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error fetching subscriptions')
      console.error('Error fetching subscriptions:', error)
    }
    setLoading(false)
  }

  const fetchStats = async () => {
    try {
      const response = await getSubscriptionStatsApi()
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchMenus = async () => {
    try {
      const response = await getMenusApi({ limit: 100 })
      setMenus(response.data.menus || [])
    } catch (error) {
      console.error('Error fetching menus:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name.includes('.')) {
      const [parent, child, grandchild] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: grandchild ? {
            ...prev[parent][child],
            [grandchild]: type === 'checkbox' ? checked : value
          } : type === 'checkbox' ? checked : value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const handleArrayInput = (field, value) => {
    // Store the raw string value instead of processing it immediately
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const processArrayField = (field) => {
    // Process the array field only when needed (on submit)
    if (typeof formData[field] === 'string') {
      return formData[field].split(',').map(item => item.trim()).filter(item => item)
    }
    return formData[field] || []
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...formData,
        originalPrice: Number(formData.originalPrice),
        discountedPrice: Number(formData.discountedPrice),
        features: processArrayField('features'),
        tags: processArrayField('tags'),
        planMenus: Array.isArray(formData.planMenus) ? formData.planMenus : []
      }

      if (editingSubscription) {
        await updateSubscriptionApi(editingSubscription._id, payload)
        toast.success('Subscription updated successfully')
      } else {
        await createSubscriptionApi(payload)
        toast.success('Subscription created successfully')
      }
      
      setShowModal(false)
      setEditingSubscription(null)
      resetForm()
      fetchSubscriptions()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving subscription')
      console.error('Error saving subscription:', error)
    }
    setLoading(false)
  }

  const handleEdit = (subscription) => {
    setEditingSubscription(subscription)
    // Only extract the fields we need, excluding MongoDB metadata
    setFormData({
      planName: subscription.planName || '',
      duration: subscription.duration || 'monthly',
      durationDays: subscription.durationDays || 30,
      mealTimings: subscription.mealTimings || {
        isLunchAvailable: true,
        isDinnerAvailable: true,
        lunchOrderWindow: {
          startTime: '11:00',
          endTime: '16:00'
        },
        dinnerOrderWindow: {
          startTime: '19:00',
          endTime: '23:00'
        }
      },
      mealsPerPlan: subscription.mealsPerPlan || 60,
      userSkipMealPerPlan: subscription.userSkipMealPerPlan || 6,
      originalPrice: subscription.originalPrice || '',
      discountedPrice: subscription.discountedPrice || '',
      category: subscription.category || 'home_chef',
      freeDelivery: subscription.freeDelivery !== undefined ? subscription.freeDelivery : true,
      description: subscription.description || '',
      features: Array.isArray(subscription.features) ? subscription.features.join(', ') : (subscription.features || ''),
      terms: subscription.terms || '',
      tags: Array.isArray(subscription.tags) ? subscription.tags.join(', ') : (subscription.tags || ''),
      planMenus: subscription.planMenus || []
    })
    setShowModal(true)
  }

  const handleDelete = async (subscriptionId) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      try {
        await deleteSubscriptionApi(subscriptionId)
        toast.success('Subscription deleted successfully')
        fetchSubscriptions()
      } catch (error) {
        console.error('Error deleting subscription:', error)
        toast.error(error.response?.data?.message || 'Error deleting subscription')
      }
    }
  }

  const handleToggleStatus = async (subscriptionId) => {
    try {
      await toggleSubscriptionStatusApi(subscriptionId)
      toast.success('Subscription status updated successfully')
      fetchSubscriptions()
    } catch (error) {
      console.error('Error toggling subscription status:', error)
      toast.error(error.response?.data?.message || 'Error updating subscription status')
    }
  }

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      category: '',
      isActive: '',
      duration: '',
      minPrice: '',
      maxPrice: '',
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
  }

  const resetForm = () => {
    setFormData({
      planName: '',
      duration: 'monthly',
      durationDays: 30,
      mealTimings: {
        isLunchAvailable: true,
        isDinnerAvailable: true,
        lunchOrderWindow: {
          startTime: '11:00',
          endTime: '16:00'
        },
        dinnerOrderWindow: {
          startTime: '19:00',
          endTime: '23:00'
        }
      },
      mealsPerPlan: 60,
      userSkipMealPerPlan: 6,
      originalPrice: '',
      discountedPrice: '',
      category: 'home_chef',
      freeDelivery: true,
      description: '',
      features: '',
      terms: '',
      tags: '',
      planMenus: []
    })
    setMenuSearchTerm('')
  }

  return (
    <div className="min-h-screen p-6">
      <div className="">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Subscription Management</h1>
          <p className="text-gray-400">Create, manage, and organize your subscription plans</p>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Plans</p>
                  <p className="text-2xl font-bold text-white">{stats.totalPlans || 0}</p>
                </div>
                <Package className="w-8 h-8 text-blue-400" />
              </div>
              <div className="mt-2 flex items-center text-xs">
                <TrendingUp className="w-3 h-3 text-green-400 mr-1" />
                <span className="text-green-400">+2.1%</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Plans</p>
                  <p className="text-2xl font-bold text-white">{stats.activePlans || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div className="mt-2 flex items-center text-xs">
                <TrendingUp className="w-3 h-3 text-green-400 mr-1" />
                <span className="text-green-400">Active rate: 85%</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">₹{stats.totalRevenue || 0}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
              <div className="mt-2 flex items-center text-xs">
                <TrendingUp className="w-3 h-3 text-green-400 mr-1" />
                <span className="text-green-400">+12.5% this month</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Price</p>
                  <p className="text-2xl font-bold text-white">₹{stats.averagePrice || 0}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-400" />
              </div>
              <div className="mt-2 flex items-center text-xs">
                <TrendingDown className="w-3 h-3 text-red-400 mr-1" />
                <span className="text-red-400">-3.2% vs last month</span>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl shadow-xl p-6 mb-6 border border-gray-600">
          <div className="space-y-4">
            {/* Top Row - Search, Basic Filters, Add Button */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search subscriptions..."
                    className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-orange-400" />
                  <select
                    className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="" className="bg-gray-800">All Categories</option>
                    <option value="home_chef" className="bg-gray-800">Home Chef</option>
                    <option value="restaurant" className="bg-gray-800">Restaurant</option>
                  </select>
                </div>

                {/* Duration Filter */}
                <select
                  className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                  value={filters.duration}
                  onChange={(e) => setFilters(prev => ({ ...prev, duration: e.target.value }))}
                >
                  <option value="" className="bg-gray-800">All Durations</option>
                  <option value="monthly" className="bg-gray-800">Monthly</option>
                  <option value="weekly" className="bg-gray-800">Weekly</option>
                  <option value="yearly" className="bg-gray-800">Yearly</option>
                </select>

                {/* Status Filter */}
                <select
                  className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                  value={filters.isActive}
                  onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
                >
                  <option value="" className="bg-gray-800">All Status</option>
                  <option value="true" className="bg-gray-800">Active</option>
                  <option value="false" className="bg-gray-800">Inactive</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={clearFilters}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 border border-gray-600 hover:border-gray-500"
                >
                  <RefreshCw className="w-4 h-4" />
                  Clear Filters
                </button>
                <button
                  onClick={() => {
                    resetForm()
                    setEditingSubscription(null)
                    setShowModal(true)
                  }}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg shadow-orange-500/25"
                >
                  <Plus className="w-4 h-4" />
                  Create Subscription
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-600">
              <input
                type="number"
                placeholder="Min Price (₹)"
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                value={filters.minPrice}
                onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
              />
              <input
                type="number"
                placeholder="Max Price (₹)"
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                value={filters.maxPrice}
                onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
              />
              <select
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              >
                <option value="createdAt" className="bg-gray-800">Sort by Created Date</option>
                <option value="planName" className="bg-gray-800">Sort by Plan Name</option>
                <option value="discountedPrice" className="bg-gray-800">Sort by Price</option>
                <option value="duration" className="bg-gray-800">Sort by Duration</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subscriptions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {subscriptions && subscriptions.length > 0 ? subscriptions.map((subscription) => (
            <div key={subscription._id} className="rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-lg overflow-hidden hover:shadow-xl hover:border-orange-500/50 transition-all duration-300">
              {/* Header */}
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {subscription.planName}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {subscription.description || 'No description available'}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      subscription.category === 'home_chef' 
                        ? 'bg-green-900/50 text-green-300' 
                        : 'bg-blue-900/50 text-blue-300'
                    }`}>
                      {subscription.category === 'home_chef' ? 'Home Chef' : 'Restaurant'}
                    </span>
                  </div>
                </div>

                {/* Price Display */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl font-bold text-white">
                    ₹{subscription.discountedPrice}
                  </div>
                  {subscription.originalPrice !== subscription.discountedPrice && (
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500 line-through">
                        ₹{subscription.originalPrice}
                      </span>
                      <span className="text-xs text-green-400">
                        Save ₹{subscription.originalPrice - subscription.discountedPrice}
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                    subscription.isActive 
                      ? 'bg-green-900/50 text-green-300' 
                      : 'bg-red-900/50 text-red-300'
                  }`}>
                    {subscription.isActive ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        Inactive
                      </>
                    )}
                  </span>
                  {subscription.freeDelivery && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-900/50 text-orange-300">
                      <Crown className="w-3 h-3" />
                      Free Delivery
                    </span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="p-6 border-b border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-400" />
                    <span className="text-gray-300">
                      {subscription.duration} ({subscription.durationDays || 30} days)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-orange-400" />
                    <span className="text-gray-300">
                      {subscription.mealsPerPlan || 0} meals
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-400" />
                    <span className="text-gray-300">
                      Skip: {subscription.userSkipMealPerPlan || 0} meals
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-orange-400" />
                    <span className="text-gray-300">
                      {subscription.planMenus?.length || 0} menus
                    </span>
                  </div>
                </div>

                {/* Meal Timings */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex flex-wrap gap-2">
                    {subscription.mealTimings?.isLunchAvailable && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300">
                        ☀️ Lunch ({subscription.mealTimings.lunchOrderWindow?.startTime || '11:00'} - {subscription.mealTimings.lunchOrderWindow?.endTime || '16:00'})
                      </span>
                    )}
                    {subscription.mealTimings?.isDinnerAvailable && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-900/50 text-purple-300">
                        🌙 Dinner ({subscription.mealTimings.dinnerOrderWindow?.startTime || '19:00'} - {subscription.mealTimings.dinnerOrderWindow?.endTime || '23:00'})
                      </span>
                    )}
                  </div>
                </div>

                {/* Features & Tags */}
                {subscription.features && subscription.features.length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-1">
                      {subscription.features.slice(0, 3).map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-300"
                        >
                          ✓ {feature}
                        </span>
                      ))}
                      {subscription.features.length > 3 && (
                        <span className="text-xs text-gray-400">+{subscription.features.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {subscription.tags && subscription.tags.length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1">
                      {subscription.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-700/50 text-gray-300"
                        >
                          #{tag}
                        </span>
                      ))}
                      {subscription.tags.length > 3 && (
                        <span className="text-xs text-gray-400">+{subscription.tags.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleEdit(subscription)}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg transition-colors text-sm"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => handleToggleStatus(subscription._id)}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 rounded-lg transition-colors text-sm"
                >
                  {subscription.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {subscription.isActive ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleDelete(subscription._id)}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg transition-colors text-sm col-span-2"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete Plan
                </button>
              </div>
            </div>
          )) : (
            <div className="col-span-full">
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 text-gray-500">
                  <Package className="w-full h-full" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No subscription plans found</h3>
                <p className="text-gray-400 mb-4">
                  {loading ? 'Loading plans...' : 'Create your first subscription plan to get started'}
                </p>
                {!loading && (
                  <button
                    onClick={() => {
                      resetForm()
                      setEditingSubscription(null)
                      setShowModal(true)
                    }}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/25"
                  >
                    Create First Plan
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-600 px-6 py-4 rounded-t-xl">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-400" />
                {editingSubscription ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-gray-800">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-orange-400" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="planName" className="block text-sm font-medium text-gray-300 mb-2">Plan Name *</label>
                    <input
                      type="text"
                      id="planName"
                      name="planName"
                      placeholder="Enter plan name"
                      value={formData.planName}
                      onChange={handleInputChange}
                      className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400 w-full"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                    <select
                      id="duration"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white w-full"
                    >
                      <option value="monthly" className="bg-gray-800">Monthly</option>
                      <option value="weekly" className="bg-gray-800">Weekly</option>
                      <option value="yearly" className="bg-gray-800">Yearly</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label htmlFor="durationDays" className="block text-sm font-medium text-gray-300 mb-2">Duration (Days)</label>
                    <input
                      type="number"
                      id="durationDays"
                      name="durationDays"
                      placeholder="30"
                      value={formData.durationDays}
                      onChange={handleInputChange}
                      className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400 w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="mealsPerPlan" className="block text-sm font-medium text-gray-300 mb-2">Total Meals</label>
                    <input
                      type="number"
                      id="mealsPerPlan"
                      name="mealsPerPlan"
                      placeholder="60"
                      value={formData.mealsPerPlan}
                      onChange={handleInputChange}
                      className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400 w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="userSkipMealPerPlan" className="block text-sm font-medium text-gray-300 mb-2">Skip Meals Allowed</label>
                    <input
                      type="number"
                      id="userSkipMealPerPlan"
                      name="userSkipMealPerPlan"
                      placeholder="6"
                      value={formData.userSkipMealPerPlan}
                      onChange={handleInputChange}
                      className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400 w-full"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                  >
                    <option value="home_chef" className="bg-gray-800">Home Chef</option>
                    <option value="restaurant" className="bg-gray-800">Restaurant</option>
                  </select>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-orange-400" />
                  Pricing
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="originalPrice" className="block text-sm font-medium text-gray-300 mb-2">Original Price (₹) *</label>
                    <input
                      type="number"
                      id="originalPrice"
                      name="originalPrice"
                      placeholder="2500"
                      value={formData.originalPrice}
                      onChange={handleInputChange}
                      className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400 w-full"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="discountedPrice" className="block text-sm font-medium text-gray-300 mb-2">Discounted Price (₹) *</label>
                    <input
                      type="number"
                      id="discountedPrice"
                      name="discountedPrice"
                      placeholder="2000"
                      value={formData.discountedPrice}
                      onChange={handleInputChange}
                      className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400 w-full"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Description & Details</h3>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">Plan Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Describe your subscription plan features and benefits..."
                    value={formData.description}
                    onChange={handleInputChange}
                    className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 w-full h-24 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Features & Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="features" className="block text-md font-medium text-white mb-3">Features</label>
                  <input
                    type="text"
                    id="features"
                    placeholder="Customizable meals, Priority delivery, Free snacks"
                    value={formData.features}
                    onChange={(e) => handleArrayInput('features', e.target.value)}
                    className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple features with commas</p>
                </div>

                <div>
                  <label htmlFor="tags" className="block text-md font-medium text-white mb-3">Tags</label>
                  <input
                    type="text"
                    id="tags"
                    placeholder="premium, monthly, healthy, organic"
                    value={formData.tags}
                    onChange={(e) => handleArrayInput('tags', e.target.value)}
                    className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple tags with commas</p>
                </div>
              </div>

              {/* Meal Timings */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-400" />
                  Meal Timings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <label className="flex items-center text-gray-300 hover:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      name="freeDelivery"
                      checked={formData.freeDelivery}
                      onChange={handleInputChange}
                      className="mr-2 text-orange-500 rounded focus:ring-orange-500"
                    />
                    Free Delivery
                  </label>
                  <label className="flex items-center text-gray-300 hover:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      name="mealTimings.isLunchAvailable"
                      checked={formData.mealTimings.isLunchAvailable}
                      onChange={handleInputChange}
                      className="mr-2 text-orange-500 rounded focus:ring-orange-500"
                    />
                    Lunch Available
                  </label>
                  <label className="flex items-center text-gray-300 hover:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      name="mealTimings.isDinnerAvailable"
                      checked={formData.mealTimings.isDinnerAvailable}
                      onChange={handleInputChange}
                      className="mr-2 text-orange-500 rounded focus:ring-orange-500"
                    />
                    Dinner Available
                  </label>
                </div>

                {/* Time Windows */}
                <div className="grid grid-cols-2 gap-6">
                  {formData.mealTimings.isLunchAvailable && (
                    <div>
                      <h4 className="text-md font-medium text-white mb-2">Lunch Time Window</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="time"
                          name="mealTimings.lunchOrderWindow.startTime"
                          value={formData.mealTimings.lunchOrderWindow.startTime}
                          onChange={handleInputChange}
                          className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                        />
                        <input
                          type="time"
                          name="mealTimings.lunchOrderWindow.endTime"
                          value={formData.mealTimings.lunchOrderWindow.endTime}
                          onChange={handleInputChange}
                          className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                        />
                      </div>
                    </div>
                  )}

                  {formData.mealTimings.isDinnerAvailable && (
                    <div>
                      <h4 className="text-md font-medium text-white mb-2">Dinner Time Window</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="time"
                          name="mealTimings.dinnerOrderWindow.startTime"
                          value={formData.mealTimings.dinnerOrderWindow.startTime}
                          onChange={handleInputChange}
                          className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                        />
                        <input
                          type="time"
                          name="mealTimings.dinnerOrderWindow.endTime"
                          value={formData.mealTimings.dinnerOrderWindow.endTime}
                          onChange={handleInputChange}
                          className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Plan Menus Selection */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-orange-400" />
                  Plan Menus
                </h3>
                <div className="bg-gray-900 border border-gray-600 rounded-lg p-4">
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-gray-400 text-sm">Select menus to include in this subscription plan:</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const filteredMenus = menus.filter(menu => 
                              menu.foodTitle.toLowerCase().includes(menuSearchTerm.toLowerCase()) ||
                              menu.cuisine.toLowerCase().includes(menuSearchTerm.toLowerCase()) ||
                              (menu.description?.short || menu.description || '').toLowerCase().includes(menuSearchTerm.toLowerCase())
                            );
                            const filteredMenuIds = filteredMenus.map(menu => menu._id);
                            const allSelected = filteredMenuIds.every(id => formData.planMenus.includes(id));
                            
                            setFormData(prev => ({
                              ...prev,
                              planMenus: allSelected 
                                ? prev.planMenus.filter(id => !filteredMenuIds.includes(id))
                                : [...new Set([...prev.planMenus, ...filteredMenuIds])]
                            }));
                          }}
                          className="text-xs px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
                        >
                          {menus.filter(menu => 
                            menu.foodTitle.toLowerCase().includes(menuSearchTerm.toLowerCase()) ||
                            menu.cuisine.toLowerCase().includes(menuSearchTerm.toLowerCase()) ||
                            (menu.description?.short || menu.description || '').toLowerCase().includes(menuSearchTerm.toLowerCase())
                          ).every(menu => formData.planMenus.includes(menu._id)) ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search menus..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                        value={menuSearchTerm}
                        onChange={(e) => setMenuSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  {menus && menus.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {menus
                        .filter(menu => 
                          menu.foodTitle.toLowerCase().includes(menuSearchTerm.toLowerCase()) ||
                          menu.cuisine.toLowerCase().includes(menuSearchTerm.toLowerCase()) ||
                          (menu.description?.short || menu.description || '').toLowerCase().includes(menuSearchTerm.toLowerCase())
                        )
                        .map((menu) => (
                        <label
                          key={menu._id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 cursor-pointer border border-gray-700 hover:border-gray-600 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.planMenus.includes(menu._id)}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                planMenus: isChecked
                                  ? [...prev.planMenus, menu._id]
                                  : prev.planMenus.filter(id => id !== menu._id)
                              }));
                            }}
                            className="w-4 h-4 text-orange-500 bg-gray-800 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-white font-medium">{menu.foodTitle}</h4>
                              <span className="text-sm text-orange-400 font-semibold">₹{menu.price}</span>
                            </div>
                            <p className="text-gray-400 text-sm line-clamp-1">
                              {menu.description?.short || menu.description || 'No description available'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">
                                {menu.cuisine}
                              </span>
                              <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">
                                {menu.vendorCategory?.replace('_', ' ')}
                              </span>
                              {menu.calories && (
                                <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">
                                  {menu.calories} cal
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ChefHat className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-400">No menus available</p>
                      <p className="text-gray-500 text-sm">Create some menus first to add them to subscription plans</p>
                    </div>
                  )}
                </div>
                {formData.planMenus.length > 0 && (
                  <div className="mt-3 p-3 bg-orange-900/20 border border-orange-600/20 rounded-lg">
                    <p className="text-orange-300 text-sm">
                      <span className="font-medium">{formData.planMenus.length}</span> menu{formData.planMenus.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                )}
              </div>

              {/* Terms & Conditions */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Terms & Conditions</h3>
                <div>
                  <label htmlFor="terms" className="block text-sm font-medium text-gray-300 mb-2">Terms & Conditions</label>
                  <textarea
                    id="terms"
                    name="terms"
                    placeholder="Enter terms and conditions for this subscription plan..."
                    value={formData.terms}
                    onChange={handleInputChange}
                    className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 w-full h-24 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-600">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingSubscription(null)
                    resetForm()
                  }}
                  disabled={loading}
                  className="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 shadow-lg shadow-orange-500/25"
                >
                  {loading ? 'Saving...' : editingSubscription ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Subscription
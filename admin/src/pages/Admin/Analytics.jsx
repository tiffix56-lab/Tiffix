import { useState, useEffect } from 'react'
import {
  Users, Package, DollarSign, MapPin, RefreshCw, Building2
} from 'lucide-react'
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ComposedChart,
  ScatterChart, Scatter
} from 'recharts'
import toast from 'react-hot-toast'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import {
  getAdminUserAnalyticsApi,
  getAdminOrderAnalyticsApi,
  getAdminRevenueAnalyticsApi,
  getAdminVendorAnalyticsApi,
  getAdminZoneAnalyticsApi
} from '../../service/api.service'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16']

function Analytics() {
  const [userAnalytics, setUserAnalytics] = useState({})
  const [orderAnalytics, setOrderAnalytics] = useState({})
  const [revenueAnalytics, setRevenueAnalytics] = useState({})
  const [vendorAnalytics, setVendorAnalytics] = useState({})
  const [zoneAnalytics, setZoneAnalytics] = useState({})
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [selectedBreakdown, setSelectedBreakdown] = useState('daily')

  const fetchAllAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const params = { 
        period: selectedPeriod, 
        breakdown: selectedBreakdown 
      }

      const [users, orders, revenue, vendors, zones] = await Promise.allSettled([
        getAdminUserAnalyticsApi(params),
        getAdminOrderAnalyticsApi(params),
        getAdminRevenueAnalyticsApi(params),
        getAdminVendorAnalyticsApi({ period: selectedPeriod }),
        getAdminZoneAnalyticsApi({ period: selectedPeriod })
      ])

      if (users.status === 'fulfilled') setUserAnalytics(users.value?.data || {})
      if (orders.status === 'fulfilled') setOrderAnalytics(orders.value?.data || {})
      if (revenue.status === 'fulfilled') setRevenueAnalytics(revenue.value?.data || {})
      if (vendors.status === 'fulfilled') setVendorAnalytics(vendors.value?.data || {})
      if (zones.status === 'fulfilled') setZoneAnalytics(zones.value?.data || {})

      if (isRefresh) {
        toast.success('Analytics data refreshed')
      }

    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAllAnalytics()
  }, [selectedPeriod, selectedBreakdown])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-IN').format(number || 0)
  }

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
            <div className="text-lg text-gray-400">Loading analytics...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Advanced Analytics</h1>
          <p className="text-gray-400 mt-1">Comprehensive business insights and performance metrics</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-orange-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>

          {/* Breakdown Selector */}
          {/* <select
            value={selectedBreakdown}
            onChange={(e) => setSelectedBreakdown(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-orange-500"
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select> */}

          <Button
            onClick={() => fetchAllAnalytics(true)}
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={refreshing}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* User Analytics */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">User Analytics</h2>
        </div>

        {/* User Growth */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <Card.Header>
              <Card.Title>User Growth Trends</Card.Title>
            </Card.Header>
            <Card.Content>
              {userAnalytics.userGrowth?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={userAnalytics.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="_id" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      formatter={(value, name) => [formatNumber(value), name]}
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    />
                    <Area type="monotone" dataKey="users" fill="#3b82f6" fillOpacity={0.3} />
                    <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} />
                    <Line type="monotone" dataKey="activeUsers" stroke="#10b981" strokeWidth={2} />
                    <Bar dataKey="vendors" fill="#f59e0b" fillOpacity={0.7} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-16 text-gray-400">No user growth data available</div>
              )}
            </Card.Content>
          </Card>

          <Card className="p-6">
            <Card.Header>
              <Card.Title>User Role Distribution</Card.Title>
            </Card.Header>
            <Card.Content>
              {userAnalytics.roleDistribution?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userAnalytics.roleDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="count"
                      nameKey="_id"
                      label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}
                    >
                      {userAnalytics.roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [formatNumber(value), 'Users']}
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-16 text-gray-400">No role distribution data available</div>
              )}
            </Card.Content>
          </Card>
        </div>

        {/* User Location & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <Card.Header>
              <Card.Title>Top User Locations</Card.Title>
            </Card.Header>
            <Card.Content>
              {userAnalytics.locationAnalytics?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userAnalytics.locationAnalytics.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="_id" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      formatter={(value) => [formatNumber(value), 'Users']}
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" />
                    <Bar dataKey="activeUsers" fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-16 text-gray-400">No location data available</div>
              )}
            </Card.Content>
          </Card>

          <Card className="p-6">
            <Card.Header>
              <Card.Title>User Engagement Stats</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-6">
                {userAnalytics.userEngagement && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-400">
                          {formatNumber(userAnalytics.userEngagement.orderEngagement?.totalUsers || 0)}
                        </div>
                        <div className="text-sm text-gray-400">Active Order Users</div>
                      </div>
                      <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-green-400">
                          {userAnalytics.userEngagement.orderEngagement?.avgOrdersPerUser?.toFixed(1) || '0.0'}
                        </div>
                        <div className="text-sm text-gray-400">Avg Orders/User</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-400">
                          {formatNumber(userAnalytics.userEngagement.subscriptionEngagement?.totalUsers || 0)}
                        </div>
                        <div className="text-sm text-gray-400">Subscription Users</div>
                      </div>
                      <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-400">
                          {userAnalytics.userEngagement.subscriptionEngagement?.avgSubscriptionsPerUser?.toFixed(1) || '0.0'}
                        </div>
                        <div className="text-sm text-gray-400">Avg Subs/User</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* Order Analytics */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-bold text-white">Order Analytics</h2>
        </div>

        {/* Order Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <Card.Header>
              <Card.Title>Order Trends Over Time</Card.Title>
            </Card.Header>
            <Card.Content>
              {orderAnalytics.orderTrends?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={orderAnalytics.orderTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="_id" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      formatter={(value, name) => [formatNumber(value), name]}
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    />
                    <Area type="monotone" dataKey="orders" fill="#10b981" fillOpacity={0.3} />
                    <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={3} />
                    <Bar dataKey="delivered" fill="#3b82f6" fillOpacity={0.7} />
                    <Bar dataKey="cancelled" fill="#ef4444" fillOpacity={0.7} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-16 text-gray-400">No order trends data available</div>
              )}
            </Card.Content>
          </Card>

          <Card className="p-6">
            <Card.Header>
              <Card.Title>Order Status Distribution</Card.Title>
            </Card.Header>
            <Card.Content>
              {orderAnalytics.statusDistribution?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderAnalytics.statusDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {orderAnalytics.statusDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color || COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [formatNumber(value), 'Orders']}
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-16 text-gray-400">No status distribution data available</div>
              )}
            </Card.Content>
          </Card>
        </div>

        {/* Meal Types & Delivery Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <Card.Header>
              <Card.Title>Meal Type Analytics</Card.Title>
            </Card.Header>
            <Card.Content>
              {orderAnalytics.mealTypeStats?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={orderAnalytics.mealTypeStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="_id" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'successRate' ? formatPercentage(value) : formatNumber(value),
                        name === 'successRate' ? 'Success Rate' : 'Count'
                      ]}
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    />
                    <Bar dataKey="count" fill="#f59e0b" />
                    <Line type="monotone" dataKey="successRate" stroke="#10b981" strokeWidth={3} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-16 text-gray-400">No meal type data available</div>
              )}
            </Card.Content>
          </Card>

          <Card className="p-6">
            <Card.Header>
              <Card.Title>Delivery Performance</Card.Title>
            </Card.Header>
            <Card.Content>
              {orderAnalytics.deliveryAnalytics?.length > 0 ? (
                <div className="space-y-4">
                  {orderAnalytics.deliveryAnalytics.map((metric, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-400">
                          {Math.round((metric.avgDeliveryTime || 0) / 60000)}m
                        </div>
                        <div className="text-sm text-gray-400">Avg Delivery Time</div>
                      </div>
                      <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-green-400">
                          {formatNumber(metric.totalDelivered || 0)}
                        </div>
                        <div className="text-sm text-gray-400">Total Delivered</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400">No delivery analytics available</div>
              )}
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* Revenue Analytics */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-bold text-white">Revenue Analytics</h2>
        </div>

        {/* Revenue Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <Card.Header>
              <Card.Title>Revenue Trends</Card.Title>
            </Card.Header>
            <Card.Content>
              {revenueAnalytics.revenueTrends?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueAnalytics.revenueTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="_id" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" tickFormatter={(value) => `₹${(value / 1000)}K`} />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), 'Revenue']}
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    <Line type="monotone" dataKey="avgTransaction" stroke="#3b82f6" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-16 text-gray-400">No revenue trends data available</div>
              )}
            </Card.Content>
          </Card>

          <Card className="p-6">
            <Card.Header>
              <Card.Title>Payment Methods</Card.Title>
            </Card.Header>
            <Card.Content>
              {revenueAnalytics.paymentMethodStats?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueAnalytics.paymentMethodStats}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="revenue"
                      nameKey="_id"
                      label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}
                    >
                      {revenueAnalytics.paymentMethodStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), 'Revenue']}
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-16 text-gray-400">No payment method data available</div>
              )}
            </Card.Content>
          </Card>
        </div>

        {/* Subscription Revenue & Promo Impact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <Card.Header>
              <Card.Title>Subscription Revenue</Card.Title>
            </Card.Header>
            <Card.Content>
              {revenueAnalytics.subscriptionRevenue?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueAnalytics.subscriptionRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="_id" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" tickFormatter={(value) => `₹${(value / 1000)}K`} />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'avgPrice' ? formatCurrency(value) : 
                        name === 'revenue' ? formatCurrency(value) : formatNumber(value),
                        name === 'avgPrice' ? 'Avg Price' :
                        name === 'revenue' ? 'Revenue' : 'Count'
                      ]}
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    />
                    <Bar dataKey="revenue" fill="#8b5cf6" />
                    <Line type="monotone" dataKey="avgPrice" stroke="#f59e0b" strokeWidth={2} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-16 text-gray-400">No subscription revenue data available</div>
              )}
            </Card.Content>
          </Card>

          <Card className="p-6">
            <Card.Header>
              <Card.Title>Promo Code Impact</Card.Title>
            </Card.Header>
            <Card.Content>
              {revenueAnalytics.promoCodeImpact ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-400">
                        {formatCurrency(revenueAnalytics.promoCodeImpact.totalDiscount || 0)}
                      </div>
                      <div className="text-sm text-gray-400">Total Discount</div>
                    </div>
                    <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-400">
                        {revenueAnalytics.promoCodeImpact.promoUsageRate || '0.0'}%
                      </div>
                      <div className="text-sm text-gray-400">Usage Rate</div>
                    </div>
                  </div>
                  {revenueAnalytics.promoCodeImpact.topPromoCodes?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-white font-medium">Top Promo Codes:</h4>
                      {revenueAnalytics.promoCodeImpact.topPromoCodes.slice(0, 5).map((promo, index) => (
                        <div key={promo._id} className="flex justify-between items-center p-2 bg-gray-700/30 rounded">
                          <span className="text-gray-300">{promo._id}</span>
                          <span className="text-green-400">{formatNumber(promo.usage)} uses</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400">No promo code data available</div>
              )}
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* Vendor Analytics */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-orange-400" />
          <h2 className="text-xl font-bold text-white">Vendor Analytics</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <Card.Header>
              <Card.Title>Vendor Performance</Card.Title>
            </Card.Header>
            <Card.Content>
              {vendorAnalytics.vendorPerformance?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={vendorAnalytics.vendorPerformance.slice(0, 20)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      type="number" 
                      dataKey="totalOrders" 
                      stroke="#9ca3af" 
                      name="Total Orders"
                    />
                    <YAxis 
                      type="number" 
                      dataKey="successRate" 
                      stroke="#9ca3af" 
                      name="Success Rate"
                      tickFormatter={formatPercentage}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      formatter={(value, name) => [
                        name === 'successRate' ? formatPercentage(value) : formatNumber(value),
                        name === 'successRate' ? 'Success Rate' : 'Total Orders'
                      ]}
                      labelFormatter={(value) => `Vendor: ${value}`}
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    />
                    <Scatter name="Vendors" dataKey="successRate" fill="#f59e0b" />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-16 text-gray-400">No vendor performance data available</div>
              )}
            </Card.Content>
          </Card>

          <Card className="p-6">
            <Card.Header>
              <Card.Title>Vendor Type Distribution</Card.Title>
            </Card.Header>
            <Card.Content>
              {vendorAnalytics.vendorTypeDistribution?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={vendorAnalytics.vendorTypeDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="count"
                      nameKey="_id"
                      label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}
                    >
                      {vendorAnalytics.vendorTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [formatNumber(value), 'Count']}
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-16 text-gray-400">No vendor type data available</div>
              )}
            </Card.Content>
          </Card>
        </div>

        {/* Vendor Capacity & Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <Card.Header>
              <Card.Title>Vendor Capacity Utilization</Card.Title>
            </Card.Header>
            <Card.Content>
              {vendorAnalytics.capacityUtilization?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={vendorAnalytics.capacityUtilization.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="businessName" 
                      stroke="#9ca3af" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                    />
                    <YAxis stroke="#9ca3af" tickFormatter={(value) => `${value}%`} />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'utilization' ? `${value.toFixed(1)}%` : formatNumber(value),
                        name === 'utilization' ? 'Utilization' :
                        name === 'dailyCapacity' ? 'Daily Capacity' : 'Current Load'
                      ]}
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    />
                    <Bar dataKey="utilization" fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-16 text-gray-400">No capacity data available</div>
              )}
            </Card.Content>
          </Card>

          <Card className="p-6">
            <Card.Header>
              <Card.Title>Top Performing Vendors</Card.Title>
            </Card.Header>
            <Card.Content>
              {vendorAnalytics.topPerformers?.length > 0 ? (
                <div className="space-y-3">
                  {vendorAnalytics.topPerformers.slice(0, 8).map((vendor, index) => (
                    <div key={vendor._id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-600' : 'bg-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white font-medium">{vendor.name}</p>
                          <p className="text-xs text-gray-400">
                            Rating: {vendor.rating?.toFixed(1) || '0.0'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-medium">{formatNumber(vendor.orders)}</div>
                        <div className="text-xs text-gray-400">orders</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400">No top performers data available</div>
              )}
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* Zone Analytics */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <MapPin className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-white">Zone Analytics</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <Card.Header>
              <Card.Title>Zone Performance Overview</Card.Title>
            </Card.Header>
            <Card.Content>
              {zoneAnalytics.zonePerformance?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={zoneAnalytics.zonePerformance.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="zone" 
                      stroke="#9ca3af" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                    />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(value) : formatNumber(value),
                        name === 'revenue' ? 'Revenue' : name
                      ]}
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    />
                    <Bar dataKey="orders" fill="#3b82f6" name="orders" />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} name="revenue" />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-16 text-gray-400">No zone performance data available</div>
              )}
            </Card.Content>
          </Card>

          <Card className="p-6">
            <Card.Header>
              <Card.Title>Zone Order Statistics</Card.Title>
            </Card.Header>
            <Card.Content>
              {zoneAnalytics.zoneOrderStats?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={zoneAnalytics.zoneOrderStats.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="_id" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      formatter={(value, name) => [
                        name.includes('Rate') ? formatPercentage(value) : formatNumber(value),
                        name
                      ]}
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="totalOrders" 
                      stackId="1" 
                      stroke="#8b5cf6" 
                      fill="#8b5cf6" 
                      fillOpacity={0.7}
                      name="Total Orders"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="delivered" 
                      stackId="2" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.7}
                      name="Delivered"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-16 text-gray-400">No zone order data available</div>
              )}
            </Card.Content>
          </Card>
        </div>

        {/* Zone Revenue & Delivery Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <Card.Header>
              <Card.Title>Zone Revenue Analysis</Card.Title>
            </Card.Header>
            <Card.Content>
              {zoneAnalytics.zoneRevenueStats?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={zoneAnalytics.zoneRevenueStats.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="_id" 
                      stroke="#9ca3af" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                    />
                    <YAxis stroke="#9ca3af" tickFormatter={(value) => `₹${(value / 1000)}K`} />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'avgSubscriptionValue' ? formatCurrency(value) :
                        name === 'totalRevenue' ? formatCurrency(value) : 
                        formatNumber(value),
                        name === 'avgSubscriptionValue' ? 'Avg Subscription Value' :
                        name === 'totalRevenue' ? 'Total Revenue' : 'Subscriptions'
                      ]}
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    />
                    <Bar dataKey="totalRevenue" fill="#f59e0b" name="totalRevenue" />
                    <Line 
                      type="monotone" 
                      dataKey="avgSubscriptionValue" 
                      stroke="#ef4444" 
                      strokeWidth={2} 
                      name="avgSubscriptionValue"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-16 text-gray-400">No zone revenue data available</div>
              )}
            </Card.Content>
          </Card>

          <Card className="p-6">
            <Card.Header>
              <Card.Title>Zone Delivery Performance</Card.Title>
            </Card.Header>
            <Card.Content>
              {zoneAnalytics.deliveryStats?.length > 0 ? (
                <div className="space-y-4">
                  {zoneAnalytics.deliveryStats.slice(0, 6).map((zone, index) => (
                    <div key={zone._id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{zone._id}</p>
                        <p className="text-xs text-gray-400">
                          {formatNumber(zone.totalDeliveries)} deliveries
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-cyan-400 font-medium">
                          {Math.round((zone.avgDeliveryTime || 0) / 60000)}m
                        </div>
                        <div className="text-xs text-gray-400">avg time</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400">No delivery stats available</div>
              )}
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Analytics
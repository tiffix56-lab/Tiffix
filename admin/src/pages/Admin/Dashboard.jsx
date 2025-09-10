import React, { useState, useEffect } from 'react'
import {
  Users, Package, DollarSign, TrendingUp, TrendingDown,
  MapPin, Star, RefreshCw, BarChart3, Activity, 
  ShoppingCart, Building2
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import toast from 'react-hot-toast'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import {
  getAdminDashboardStatsApi
} from '../../service/api.service'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function Dashboard() {
  const [dashboardStats, setDashboardStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const response = await getAdminDashboardStatsApi()
      setDashboardStats(response?.data || {})

      if (isRefresh) {
        toast.success('Dashboard data refreshed')
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

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

  const getGrowthIndicator = (growth) => {
    const growthNum = parseFloat(growth) || 0
    const isPositive = growthNum >= 0
    
    return (
      <div className={`flex items-center gap-1 text-xs ${
        isPositive ? 'text-green-400' : 'text-red-400'
      }`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>{Math.abs(growthNum)}%</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
            <div className="text-lg text-gray-400">Loading dashboard...</div>
          </div>
        </div>
      </div>
    )
  }

  const { overallStats, revenueData, orderStatusData, topProviders, zonePerformance, monthlyTrends, overview } = dashboardStats

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Period: {overview?.period || '30d'} | 
            Last Updated: {overview?.lastUpdated || 'N/A'}
          </p>
        </div>
        <Button
          onClick={() => fetchDashboardData(true)}
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          loading={refreshing}
        >
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(overallStats?.totalRevenue?.value)}</p>
              {getGrowthIndicator(overallStats?.totalRevenue?.growth)}
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Orders</p>
              <p className="text-2xl font-bold text-white">{formatNumber(overallStats?.totalOrders?.value)}</p>
              {getGrowthIndicator(overallStats?.totalOrders?.growth)}
            </div>
            <Package className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Users</p>
              <p className="text-2xl font-bold text-white">{formatNumber(overallStats?.activeUsers?.value)}</p>
              {getGrowthIndicator(overallStats?.activeUsers?.growth)}
            </div>
            <Users className="w-8 h-8 text-purple-400" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Rating</p>
              <p className="text-2xl font-bold text-white">{overallStats?.avgRating?.value || '0.0'}</p>
              {getGrowthIndicator(overallStats?.avgRating?.growth)}
            </div>
            <Star className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>
      </div>

      {/* Revenue & Order Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <Card className="p-6">
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>Monthly Revenue Trend</Card.Title>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
          </Card.Header>
          <Card.Content>
            {monthlyTrends?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" tickFormatter={(value) => `₹${(value / 1000)}K`} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-16 text-gray-400">No revenue data available</div>
            )}
          </Card.Content>
        </Card>

        {/* Monthly Orders Trend */}
        <Card className="p-6">
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>Monthly Orders Trend</Card.Title>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
          </Card.Header>
          <Card.Content>
            {monthlyTrends?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    formatter={(value) => [formatNumber(value), 'Orders']}
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-16 text-gray-400">No order data available</div>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Order Status Distribution & Zone Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        <Card className="p-6">
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>Order Status Distribution</Card.Title>
              <ShoppingCart className="w-5 h-5 text-gray-400" />
            </div>
          </Card.Header>
          <Card.Content>
            {orderStatusData?.length > 0 ? (
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {orderStatusData.map((entry, index) => (
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
                <div className="space-y-2">
                  {orderStatusData.map((status, index) => (
                    <div key={status.name} className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: status.color || COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-gray-300 text-sm">{status.name}</span>
                      <span className="text-white font-medium">{formatNumber(status.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">No order status data available</div>
            )}
          </Card.Content>
        </Card>

        {/* Zone Performance */}
        <Card className="p-6">
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>Zone Performance</Card.Title>
              <MapPin className="w-5 h-5 text-gray-400" />
            </div>
          </Card.Header>
          <Card.Content>
            {zonePerformance?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={zonePerformance.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="zone" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'orders' ? formatNumber(value) : formatCurrency(value),
                      name === 'orders' ? 'Orders' : 'Revenue'
                    ]}
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  />
                  <Bar dataKey="orders" fill="#3b82f6" name="orders" />
                  <Bar dataKey="revenue" fill="#10b981" name="revenue" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-16 text-gray-400">No zone data available</div>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Top Providers & Revenue Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Providers */}
        <Card className="p-6">
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>Top Providers</Card.Title>
              <Building2 className="w-5 h-5 text-gray-400" />
            </div>
          </Card.Header>
          <Card.Content>
            {topProviders?.length > 0 ? (
              <div className="space-y-4">
                {topProviders.map((provider, index) => (
                  <div key={provider._id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-600' : 'bg-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-white font-medium">{provider.name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>{formatNumber(provider.orders)} orders</span>
                          <span>Rating: {provider.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-green-400 font-medium">
                      {formatCurrency(provider.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">No provider data available</div>
            )}
          </Card.Content>
        </Card>

        {/* Revenue Data Details */}
        <Card className="p-6">
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>Revenue Details</Card.Title>
              <DollarSign className="w-5 h-5 text-gray-400" />
            </div>
          </Card.Header>
          <Card.Content>
            {revenueData?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" tickFormatter={(value) => `₹${(value / 1000)}K`} />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(value) : 
                      name === 'orders' ? formatNumber(value) :
                      formatNumber(value),
                      name === 'revenue' ? 'Revenue' :
                      name === 'orders' ? 'Orders' : 'Users'
                    ]}
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  />
                  <Bar dataKey="revenue" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-16 text-gray-400">No detailed revenue data available</div>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card className="p-6">
        <Card.Header>
          <Card.Title>Summary Statistics</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{formatCurrency(overallStats?.totalRevenue?.value || 0)}</div>
              <div className="text-sm text-gray-400">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{formatNumber(overallStats?.totalOrders?.value || 0)}</div>
              <div className="text-sm text-gray-400">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{formatNumber(overallStats?.activeUsers?.value || 0)}</div>
              <div className="text-sm text-gray-400">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{overallStats?.avgRating?.value || '0.0'}</div>
              <div className="text-sm text-gray-400">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{formatNumber(topProviders?.length || 0)}</div>
              <div className="text-sm text-gray-400">Active Providers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{formatNumber(zonePerformance?.length || 0)}</div>
              <div className="text-sm text-gray-400">Active Zones</div>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}

export default Dashboard
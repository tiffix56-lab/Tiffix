import React, { useState, useEffect } from 'react';
import { 
  Users, ShoppingCart, DollarSign, TrendingUp, 
  Clock, ChefHat, MapPin, Star, Activity, Calendar,
  Package, UserCheck, AlertCircle, BarChart3
} from 'lucide-react';
import Card from '../../components/ui/Card';
import StatsCard from '../../components/Dashboard/StatsCard';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    revenue: 0,
    activeVendors: 0
  });

  // Mock data loading
  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalUsers: 1234,
        totalOrders: 567,
        revenue: 89450,
        activeVendors: 45
      });
      setLoading(false);
    }, 1500);
  }, []);

  const recentOrders = [
    { id: '#12345', customer: 'John Doe', amount: '$45.50', status: 'delivered', time: '2 min ago' },
    { id: '#12344', customer: 'Jane Smith', amount: '$32.20', status: 'preparing', time: '5 min ago' },
    { id: '#12343', customer: 'Mike Johnson', amount: '$67.80', status: 'pending', time: '8 min ago' },
    { id: '#12342', customer: 'Sarah Wilson', amount: '$28.90', status: 'delivered', time: '12 min ago' },
  ];

  const topVendors = [
    { name: 'Spice Kitchen', orders: 234, rating: 4.8, revenue: '$12,450' },
    { name: 'Mama\'s Place', orders: 187, rating: 4.7, revenue: '$9,680' },
    { name: 'Street Food Co.', orders: 156, rating: 4.6, revenue: '$8,920' },
    { name: 'Garden Fresh', orders: 143, rating: 4.9, revenue: '$7,540' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-400">
            Welcome back! Here's what's happening with Tiffix today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={Calendar}>
            Last 30 days
          </Button>
          <Button variant="primary" size="sm" icon={BarChart3}>
            View Reports
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Total Users"
          value={loading ? null : stats.totalUsers.toLocaleString()}
          change="+12.3%"
          changeType="increase"
          icon={Users}
          color="primary"
          loading={loading}
        />
        <StatsCard
          title="Total Orders"
          value={loading ? null : stats.totalOrders.toLocaleString()}
          change="+8.7%"
          changeType="increase"
          icon={ShoppingCart}
          color="secondary"
          loading={loading}
        />
        <StatsCard
          title="Revenue"
          value={loading ? null : `$${(stats.revenue / 1000).toFixed(1)}k`}
          change="+15.2%"
          changeType="increase"
          icon={DollarSign}
          color="success"
          loading={loading}
        />
        <StatsCard
          title="Active Vendors"
          value={loading ? null : stats.activeVendors}
          change="-2.1%"
          changeType="decrease"
          icon={ChefHat}
          color="warning"
          loading={loading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Recent Orders */}
        <div className="xl:col-span-2">
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <Card.Title>Recent Orders</Card.Title>
                <Badge variant="primary" size="sm">{recentOrders.length} new</Badge>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div 
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-700/20 hover:bg-gray-700/30 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {order.customer.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{order.customer}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span>{order.id}</span>
                          <span>•</span>
                          <span>{order.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white">{order.amount}</span>
                      <Badge 
                        variant={
                          order.status === 'delivered' ? 'success' :
                          order.status === 'preparing' ? 'warning' : 'default'
                        }
                        size="sm"
                        dot
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Content>
            <Card.Footer>
              <Button variant="outline" fullWidth>
                View All Orders
              </Button>
            </Card.Footer>
          </Card>
        </div>

        {/* Top Vendors */}
        <div>
          <Card>
            <Card.Header>
              <Card.Title>Top Vendors</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {topVendors.map((vendor, index) => (
                  <div key={vendor.name} className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center text-white text-sm font-bold">
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{vendor.name}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span>{vendor.rating}</span>
                        </div>
                        <span>•</span>
                        <span>{vendor.orders} orders</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{vendor.revenue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Content>
            <Card.Footer>
              <Button variant="outline" fullWidth>
                View All Vendors
              </Button>
            </Card.Footer>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <Card.Header>
          <Card.Title>Quick Actions</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { icon: Users, label: 'Manage Users', color: 'primary' },
              { icon: ChefHat, label: 'Add Menu Item', color: 'secondary' },
              { icon: MapPin, label: 'Location Zones', color: 'success' },
              { icon: UserCheck, label: 'Vendor Assignment', color: 'warning' },
              { icon: Package, label: 'Orders', color: 'danger' },
              { icon: Activity, label: 'Analytics', color: 'primary' }
            ].map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="flex flex-col items-center gap-2 h-20 text-xs"
              >
                <action.icon className="w-5 h-5" />
                {action.label}
              </Button>
            ))}
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default Dashboard;
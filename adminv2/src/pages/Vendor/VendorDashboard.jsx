import React, { useState, useEffect } from 'react';
import { 
  Package, TrendingUp, Users, Star, Clock, DollarSign,
  ShoppingCart, Calendar, Activity, MapPin, Bell,
  ChefHat, Award, BarChart3, Eye
} from 'lucide-react';
import Card from '../../components/ui/Card';
import StatsCard from '../../components/Dashboard/StatsCard';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const VendorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    rating: 0,
    activeMenuItems: 0
  });

  // Mock data loading
  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalOrders: 234,
        revenue: 12450,
        rating: 4.8,
        activeMenuItems: 24
      });
      setLoading(false);
    }, 1000);
  }, []);

  const recentOrders = [
    { id: '#V2345', customer: 'Alice Johnson', items: ['Biryani', 'Raita'], amount: '$28.50', status: 'preparing', time: '2 min ago' },
    { id: '#V2344', customer: 'Bob Wilson', items: ['Dal Makhani'], amount: '$15.20', status: 'ready', time: '5 min ago' },
    { id: '#V2343', customer: 'Carol Davis', items: ['Butter Chicken', 'Naan'], amount: '$34.80', status: 'delivered', time: '12 min ago' },
    { id: '#V2342', customer: 'David Lee', items: ['Palak Paneer'], amount: '$18.90', status: 'cancelled', time: '25 min ago' },
  ];

  const topMenuItems = [
    { name: 'Chicken Biryani', orders: 45, rating: 4.9, revenue: '$1,350' },
    { name: 'Dal Makhani', orders: 38, rating: 4.8, revenue: '$760' },
    { name: 'Butter Chicken', orders: 32, rating: 4.7, revenue: '$1,120' },
    { name: 'Palak Paneer', orders: 28, rating: 4.6, revenue: '$560' },
  ];

  const upcomingOrders = [
    { id: '#V2350', customer: 'Emma Brown', deliveryTime: '12:30 PM', items: 2 },
    { id: '#V2351', customer: 'Frank Miller', deliveryTime: '1:15 PM', items: 1 },
    { id: '#V2352', customer: 'Grace Chen', deliveryTime: '2:00 PM', items: 3 },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Vendor Dashboard
          </h1>
          <p className="text-gray-400">
            Welcome back! Here's how your restaurant is performing today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={Calendar}>
            Today
          </Button>
          <Button variant="secondary" size="sm" icon={BarChart3}>
            View Analytics
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Total Orders"
          value={loading ? null : stats.totalOrders.toLocaleString()}
          change="+18.3%"
          changeType="increase"
          icon={Package}
          color="secondary"
          loading={loading}
        />
        <StatsCard
          title="Revenue"
          value={loading ? null : `$${(stats.revenue / 1000).toFixed(1)}k`}
          change="+22.5%"
          changeType="increase"
          icon={DollarSign}
          color="success"
          loading={loading}
        />
        <StatsCard
          title="Average Rating"
          value={loading ? null : stats.rating}
          change="+0.2"
          changeType="increase"
          icon={Star}
          color="warning"
          loading={loading}
        />
        <StatsCard
          title="Active Items"
          value={loading ? null : stats.activeMenuItems}
          change="+3"
          changeType="increase"
          icon={ChefHat}
          color="primary"
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
                <Badge variant="secondary" size="sm">{recentOrders.filter(o => o.status === 'preparing').length} preparing</Badge>
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
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {order.customer.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{order.customer}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span>{order.id}</span>
                          <span>•</span>
                          <span>{order.items.join(', ')}</span>
                        </div>
                        <p className="text-xs text-gray-500">{order.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white">{order.amount}</span>
                      <Badge 
                        variant={
                          order.status === 'delivered' ? 'success' :
                          order.status === 'preparing' ? 'warning' :
                          order.status === 'ready' ? 'secondary' : 'danger'
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

        {/* Upcoming Orders */}
        <div>
          <Card>
            <Card.Header>
              <Card.Title>Upcoming Orders</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {upcomingOrders.map((order, index) => (
                  <div key={order.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-700/20">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white">{order.customer}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{order.deliveryTime}</span>
                        </div>
                        <span>•</span>
                        <span>{order.items} items</span>
                      </div>
                    </div>
                    <Button size="xs" variant="outline">
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card.Content>
            <Card.Footer>
              <Button variant="outline" fullWidth>
                View Schedule
              </Button>
            </Card.Footer>
          </Card>

          {/* Top Menu Items */}
          <Card className="mt-6">
            <Card.Header>
              <Card.Title>Top Menu Items</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {topMenuItems.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{item.name}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span>{item.rating}</span>
                        </div>
                        <span>•</span>
                        <span>{item.orders} orders</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{item.revenue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Content>
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
              { icon: Package, label: 'View Orders', color: 'secondary' },
              { icon: ChefHat, label: 'Manage Menu', color: 'primary' },
              { icon: Users, label: 'Customers', color: 'success' },
              { icon: Star, label: 'Reviews', color: 'warning' },
              { icon: Clock, label: 'Availability', color: 'danger' },
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

export default VendorDashboard;
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  Users, 
  ShoppingCart, 
  Star,
  Calendar as CalendarIcon,
  Download,
  RefreshCw,
  Target,
  Clock,
  MapPin,
  ChefHat
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Mock data
const revenueData = [
  { month: 'Jan', revenue: 65000, orders: 450, users: 120 },
  { month: 'Feb', revenue: 72000, orders: 520, users: 135 },
  { month: 'Mar', revenue: 68000, orders: 480, users: 140 },
  { month: 'Apr', revenue: 81000, orders: 610, users: 165 },
  { month: 'May', revenue: 89000, orders: 680, users: 180 },
  { month: 'Jun', revenue: 95000, orders: 720, users: 195 },
  { month: 'Jul', revenue: 102000, orders: 780, users: 210 },
  { month: 'Aug', revenue: 98000, orders: 750, users: 205 },
  { month: 'Sep', revenue: 105000, orders: 820, users: 225 },
  { month: 'Oct', revenue: 112000, orders: 890, users: 240 },
  { month: 'Nov', revenue: 118000, orders: 920, users: 255 },
  { month: 'Dec', revenue: 125000, orders: 980, users: 270 }
];

const orderStatusData = [
  { name: 'Completed', value: 65, color: '#22c55e' },
  { name: 'In Progress', value: 20, color: '#3b82f6' },
  { name: 'Pending', value: 10, color: '#f59e0b' },
  { name: 'Cancelled', value: 5, color: '#ef4444' }
];

const topProviders = [
  { name: 'Chef Marco', orders: 156, rating: 4.9, revenue: 28450 },
  { name: 'Mama Rosa Kitchen', orders: 134, rating: 4.8, revenue: 24680 },
  { name: 'Urban Spice', orders: 128, rating: 4.7, revenue: 23120 },
  { name: 'Fresh Bowl Co.', orders: 112, rating: 4.6, revenue: 20890 },
  { name: 'Green Garden', orders: 98, rating: 4.5, revenue: 18560 }
];

const zonePerformance = [
  { zone: 'Downtown', orders: 450, revenue: 67500, growth: 12.5 },
  { zone: 'Midtown', orders: 380, revenue: 56200, growth: 8.3 },
  { zone: 'Uptown', orders: 320, revenue: 48900, growth: 15.2 },
  { zone: 'Eastside', orders: 290, revenue: 42800, growth: -2.1 },
  { zone: 'Westside', orders: 260, revenue: 38700, growth: 6.8 }
];

const hourlyOrderData = [
  { hour: '6AM', orders: 12 },
  { hour: '7AM', orders: 28 },
  { hour: '8AM', orders: 45 },
  { hour: '9AM', orders: 32 },
  { hour: '10AM', orders: 18 },
  { hour: '11AM', orders: 24 },
  { hour: '12PM', orders: 65 },
  { hour: '1PM', orders: 72 },
  { hour: '2PM', orders: 48 },
  { hour: '3PM', orders: 25 },
  { hour: '4PM', orders: 31 },
  { hour: '5PM', orders: 42 },
  { hour: '6PM', orders: 85 },
  { hour: '7PM', orders: 92 },
  { hour: '8PM', orders: 68 },
  { hour: '9PM', orders: 45 },
  { hour: '10PM', orders: 28 },
  { hour: '11PM', orders: 15 }
];

const Analytics: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ 
    from: new Date(2024, 0, 1), 
    to: new Date() 
  });
  const [timeFilter, setTimeFilter] = useState('30d');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [totalExpense, setTotalExpense] = useState<number>(0);
  
  const totalRevenue = 125430;
  const netRevenue = totalRevenue - totalExpense;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track performance, revenue, and growth metrics</p>
        </div>
        <div className="flex gap-2">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Expense Input & Net Revenue */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Total Expense Input</CardTitle>
            <CardDescription>Enter your total expenses to calculate net revenue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense">Total Expense (₹)</Label>
              <Input
                id="expense"
                type="number"
                placeholder="Enter total expense"
                value={totalExpense || ''}
                onChange={(e) => setTotalExpense(Number(e.target.value) || 0)}
                className="text-lg"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Net Revenue</CardTitle>
            <IndianRupee className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">₹{netRevenue.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-2">
              Total Revenue (₹{totalRevenue.toLocaleString()}) - Total Expense (₹{totalExpense.toLocaleString()})
            </div>
            <div className="flex items-center text-xs text-success mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              Net profit calculation
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹1,25,430</div>
            <div className="flex items-center text-xs text-success">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.5% from last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,850</div>
            <div className="flex items-center text-xs text-success">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8.3% from last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,284</div>
            <div className="flex items-center text-xs text-success">
              <TrendingUp className="h-3 w-3 mr-1" />
              +15.2% from last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.7</div>
            <div className="flex items-center text-xs text-success">
              <TrendingUp className="h-3 w-3 mr-1" />
              +0.2 from last month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="zones">Zones</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue over the past year</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Order Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
                <CardDescription>Distribution of order statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Hourly Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Hourly Order Pattern</CardTitle>
              <CardDescription>Average orders per hour throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyOrderData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹1,25,430</div>
                <div className="text-xs text-success">+12.5% vs last month</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">This Quarter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹3,48,920</div>
                <div className="text-xs text-success">+8.7% vs last quarter</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">This Year</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹11,25,000</div>
                <div className="text-xs text-success">+25.3% vs last year</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Detailed revenue breakdown and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Analytics</CardTitle>
              <CardDescription>Order volume and trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="orders" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Providers</CardTitle>
              <CardDescription>Providers ranked by orders and revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProviders.map((provider, index) => (
                  <div key={provider.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{provider.name}</div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{provider.orders} orders</span>
                          <span>•</span>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                            {provider.rating}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₹{provider.revenue.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Zone Performance</CardTitle>
              <CardDescription>Performance metrics by service zone</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {zonePerformance.map((zone) => (
                  <div key={zone.zone} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{zone.zone}</span>
                      </div>
                      <Badge variant={zone.growth > 0 ? "default" : "destructive"}>
                        {zone.growth > 0 ? '+' : ''}{zone.growth}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Orders</div>
                        <div className="font-medium">{zone.orders}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Revenue</div>
                        <div className="font-medium">₹{zone.revenue.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
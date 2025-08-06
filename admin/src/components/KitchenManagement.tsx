import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  ChefHat, 
  Store, 
  Clock, 
  Package, 
  Truck, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Eye,
  MapPin,
  User,
  Calendar
} from "lucide-react";

interface KitchenOrder {
  id: string;
  mealName: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  providerId: string;
  providerName: string;
  providerType: 'vendor' | 'chef';
  providerPhone: string;
  quantity: number;
  orderValue: number;
  orderTime: string;
  expectedDeliveryTime: string;
  specialInstructions?: string;
  status: 'preparing' | 'in_process' | 'ready' | 'picked_up' | 'delivered' | 'cancelled' | 'failed';
  estimatedPrepTime: number; // in minutes
  actualPrepTime?: number;
  zone: string;
  priority: 'normal' | 'high' | 'urgent';
}

const mockKitchenOrders: KitchenOrder[] = [
  {
    id: "KO001",
    mealName: "Chicken Biryani",
    customerName: "Sarah K.",
    customerPhone: "+91 98765 43210",
    customerAddress: "123 Tech Park, Bangalore, KA 560001",
    providerId: "V001",
    providerName: "Spice Palace",
    providerType: "vendor",
    providerPhone: "+91 99887 76655",
    quantity: 1,
    orderValue: 150,
    orderTime: "2024-01-25T10:30:00Z",
    expectedDeliveryTime: "12:30 PM",
    specialInstructions: "Less spicy, extra raita",
    status: "preparing",
    estimatedPrepTime: 45,
    zone: "Bangalore Central",
    priority: "normal"
  },
  {
    id: "KO002",
    mealName: "Mediterranean Quinoa Bowl",
    customerName: "John D.",
    customerPhone: "+91 87654 32109",
    customerAddress: "456 Business District, Mumbai, MH 400001",
    providerId: "C001",
    providerName: "Chef Maria",
    providerType: "chef",
    providerPhone: "+91 88776 65544",
    quantity: 2,
    orderValue: 360,
    orderTime: "2024-01-25T11:00:00Z",
    expectedDeliveryTime: "1:00 PM",
    status: "in_process",
    estimatedPrepTime: 30,
    actualPrepTime: 25,
    zone: "Mumbai South",
    priority: "high"
  },
  {
    id: "KO003",
    mealName: "Margherita Pizza",
    customerName: "Mike R.",
    customerPhone: "+91 76543 21098",
    customerAddress: "789 Residential Area, Delhi, DL 110001",
    providerId: "V002",
    providerName: "Taste Hub",
    providerType: "vendor",
    providerPhone: "+91 77665 54433",
    quantity: 1,
    orderValue: 120,
    orderTime: "2024-01-25T11:30:00Z",
    expectedDeliveryTime: "1:30 PM",
    status: "ready",
    estimatedPrepTime: 20,
    actualPrepTime: 18,
    zone: "Delhi NCR",
    priority: "urgent"
  },
  {
    id: "KO004",
    mealName: "South Indian Thali",
    customerName: "Priya S.",
    customerPhone: "+91 65432 10987",
    customerAddress: "321 Green Valley, Pune, MH 411001",
    providerId: "C002",
    providerName: "Chef Ravi",
    providerType: "chef",
    providerPhone: "+91 66554 43322",
    quantity: 1,
    orderValue: 200,
    orderTime: "2024-01-25T12:00:00Z",
    expectedDeliveryTime: "2:00 PM",
    status: "delivered",
    estimatedPrepTime: 35,
    actualPrepTime: 32,
    zone: "Pune Central",
    priority: "normal"
  }
];

export function KitchenManagement() {
  const [orders, setOrders] = useState(mockKitchenOrders);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedZone, setSelectedZone] = useState("all");
  const [selectedProvider, setSelectedProvider] = useState("all");
  const { toast } = useToast();

  const getStatusColor = (status: KitchenOrder['status']) => {
    switch (status) {
      case 'preparing': return 'bg-yellow-100 text-yellow-800';
      case 'in_process': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'picked_up': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: KitchenOrder['status']) => {
    switch (status) {
      case 'preparing': return ChefHat;
      case 'in_process': return Package;
      case 'ready': return CheckCircle;
      case 'picked_up': return Truck;
      case 'delivered': return CheckCircle;
      case 'cancelled': return AlertTriangle;
      case 'failed': return AlertTriangle;
      default: return Clock;
    }
  };

  const getPriorityColor = (priority: KitchenOrder['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const updateOrderStatus = (orderId: string, newStatus: KitchenOrder['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus }
        : order
    ));

    toast({
      title: "Order Status Updated",
      description: `Order ${orderId} status changed to ${newStatus}`,
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.mealName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.providerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = selectedZone === "all" || order.zone === selectedZone;
    const matchesProvider = selectedProvider === "all" || order.providerName === selectedProvider;
    const matchesTab = activeTab === "all" || order.status === activeTab;
    
    return matchesSearch && matchesZone && matchesProvider && matchesTab;
  });

  const preparingCount = orders.filter(o => o.status === 'preparing').length;
  const inProcessCount = orders.filter(o => o.status === 'in_process').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;
  const deliveredTodayCount = orders.filter(o => o.status === 'delivered').length;

  const getNextStatusActions = (currentStatus: KitchenOrder['status']) => {
    switch (currentStatus) {
      case 'preparing':
        return [{ status: 'in_process', label: 'Mark In Process', icon: Package }];
      case 'in_process':
        return [{ status: 'ready', label: 'Mark Ready', icon: CheckCircle }];
      case 'ready':
        return [{ status: 'picked_up', label: 'Mark Picked Up', icon: Truck }];
      case 'picked_up':
        return [{ status: 'delivered', label: 'Mark Delivered', icon: CheckCircle }];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kitchen Management</h1>
          <p className="text-muted-foreground mt-1">
            Live status tracking for all meal preparations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <ChefHat className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Preparing</p>
              <p className="text-2xl font-bold text-foreground">{preparingCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">In Process</p>
              <p className="text-2xl font-bold text-foreground">{inProcessCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ready</p>
              <p className="text-2xl font-bold text-foreground">{readyCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Delivered Today</p>
              <p className="text-2xl font-bold text-foreground">{deliveredTodayCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by order ID, meal name, customer, or provider..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedZone} onValueChange={setSelectedZone}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              <SelectItem value="Bangalore Central">Bangalore Central</SelectItem>
              <SelectItem value="Mumbai South">Mumbai South</SelectItem>
              <SelectItem value="Delhi NCR">Delhi NCR</SelectItem>
              <SelectItem value="Pune Central">Pune Central</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {Array.from(new Set(orders.map(o => o.providerName))).map(provider => (
                <SelectItem key={provider} value={provider}>{provider}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Order Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="preparing">Preparing ({preparingCount})</TabsTrigger>
          <TabsTrigger value="in_process">In Process ({inProcessCount})</TabsTrigger>
          <TabsTrigger value="ready">Ready ({readyCount})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const StatusIcon = getStatusIcon(order.status);
              const nextActions = getNextStatusActions(order.status);
              
              return (
                <Card key={order.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                        {order.providerType === 'vendor' ? (
                          <Store className="w-6 h-6 text-white" />
                        ) : (
                          <ChefHat className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{order.mealName}</h3>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={getPriorityColor(order.priority)} variant="outline">
                            {order.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>Order #{order.id}</span>
                          <span>{order.providerName}</span>
                          <span>Qty: {order.quantity}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold">₹{order.orderValue}</p>
                      <p className="text-sm text-muted-foreground">
                        ETA: {order.expectedDeliveryTime}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
                    {/* Customer Info */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Customer</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{order.customerName}</span>
                        </div>
                        <p>{order.customerPhone}</p>
                        <div className="flex items-start gap-1">
                          <MapPin className="w-3 h-3 mt-0.5" />
                          <p className="text-xs">{order.customerAddress}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Provider Info */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Provider</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">{order.providerName}</p>
                        <p>{order.providerPhone}</p>
                        <Badge variant="outline" className="text-xs">
                          {order.providerType === 'vendor' ? 'Vendor' : 'Home Chef'}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Timing Info */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Timing</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(order.orderTime).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Est. {order.estimatedPrepTime} min</span>
                        </div>
                        {order.actualPrepTime && (
                          <p>Actual: {order.actualPrepTime} min</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Special Instructions */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Instructions</h4>
                      <div className="text-sm text-muted-foreground">
                        {order.specialInstructions ? (
                          <p className="text-xs bg-secondary p-2 rounded">
                            {order.specialInstructions}
                          </p>
                        ) : (
                          <p>No special instructions</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {nextActions.map((action) => {
                      const ActionIcon = action.icon;
                      return (
                        <Button 
                          key={action.status}
                          size="sm" 
                          onClick={() => updateOrderStatus(order.id, action.status as KitchenOrder['status'])}
                        >
                          <ActionIcon className="w-4 h-4 mr-2" />
                          {action.label}
                        </Button>
                      );
                    })}
                    
                    {(order.status === 'preparing' || order.status === 'in_process') && (
                      <>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateOrderStatus(order.id, 'failed')}
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Mark Failed
                        </Button>
                      </>
                    )}
                    
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </Card>
              );
            })}
            
            {filteredOrders.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <ChefHat className="w-12 h-12 mx-auto mb-4" />
                <p>No orders found matching your criteria</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
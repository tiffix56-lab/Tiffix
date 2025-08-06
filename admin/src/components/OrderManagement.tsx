import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  MapPin,
  Calendar,
  DollarSign,
  User
} from "lucide-react";

interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userAddress: string;
  items: {
    menuItemId: string;
    menuItemName: string;
    providerId: string;
    providerName: string;
    providerType: 'vendor' | 'chef';
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  orderDate: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryAddress: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'online' | 'cod';
  specialInstructions?: string;
  assignedDeliveryAgent?: string;
  trackingInfo?: {
    currentLocation: string;
    estimatedDelivery: string;
  };
}

const mockOrders: Order[] = [
  {
    id: "ORD001",
    userId: "U247",
    userName: "Sarah K.",
    userEmail: "sarah.k@email.com",
    userPhone: "+91 98765 43210",
    userAddress: "123 Tech Park, Bangalore, KA 560001",
    items: [
      {
        menuItemId: "M001",
        menuItemName: "Chicken Biryani",
        providerId: "V001",
        providerName: "Spice Palace",
        providerType: "vendor",
        quantity: 1,
        price: 150
      }
    ],
    totalAmount: 150,
    status: "preparing",
    orderDate: "2024-01-25T10:30:00Z",
    deliveryDate: "2024-01-25",
    deliveryTime: "12:30 PM",
    deliveryAddress: "123 Tech Park, Bangalore, KA 560001",
    paymentStatus: "paid",
    paymentMethod: "online",
    specialInstructions: "Please avoid too much spice",
    assignedDeliveryAgent: "Agent A001",
    trackingInfo: {
      currentLocation: "Spice Palace Kitchen",
      estimatedDelivery: "12:30 PM"
    }
  },
  {
    id: "ORD002",
    userId: "U156",
    userName: "John D.",
    userEmail: "john.d@email.com",
    userPhone: "+91 87654 32109",
    userAddress: "456 Business District, Mumbai, MH 400001",
    items: [
      {
        menuItemId: "M002",
        menuItemName: "Mediterranean Quinoa Bowl",
        providerId: "C001",
        providerName: "Chef Maria",
        providerType: "chef",
        quantity: 1,
        price: 180
      }
    ],
    totalAmount: 180,
    status: "ready",
    orderDate: "2024-01-25T11:15:00Z",
    deliveryDate: "2024-01-25",
    deliveryTime: "1:00 PM",
    deliveryAddress: "456 Business District, Mumbai, MH 400001",
    paymentStatus: "paid",
    paymentMethod: "online",
    assignedDeliveryAgent: "Agent B002",
    trackingInfo: {
      currentLocation: "Out for Delivery",
      estimatedDelivery: "1:00 PM"
    }
  },
  {
    id: "ORD003",
    userId: "U89",
    userName: "Mike R.",
    userEmail: "mike.r@email.com",
    userPhone: "+91 76543 21098",
    userAddress: "789 Residential Area, Delhi, DL 110001",
    items: [
      {
        menuItemId: "M003",
        menuItemName: "Margherita Pizza",
        providerId: "V002",
        providerName: "Taste Hub",
        providerType: "vendor",
        quantity: 2,
        price: 120
      }
    ],
    totalAmount: 240,
    status: "delivered",
    orderDate: "2024-01-24T19:20:00Z",
    deliveryDate: "2024-01-24",
    deliveryTime: "8:30 PM",
    deliveryAddress: "789 Residential Area, Delhi, DL 110001",
    paymentStatus: "paid",
    paymentMethod: "cod"
  },
  {
    id: "ORD004",
    userId: "U203",
    userName: "Sarah M.",
    userEmail: "sarah.m@email.com",
    userPhone: "+91 65432 10987",
    userAddress: "321 Green Valley, Pune, MH 411001",
    items: [
      {
        menuItemId: "M001",
        menuItemName: "Chicken Biryani",
        providerId: "V001",
        providerName: "Spice Palace",
        providerType: "vendor",
        quantity: 1,
        price: 150
      }
    ],
    totalAmount: 150,
    status: "pending",
    orderDate: "2024-01-25T12:45:00Z",
    deliveryDate: "2024-01-25",
    deliveryTime: "2:30 PM",
    deliveryAddress: "321 Green Valley, Pune, MH 411001",
    paymentStatus: "pending",
    paymentMethod: "online"
  }
];

export function OrderManagement() {
  const [orders, setOrders] = useState(mockOrders);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return Clock;
      case 'confirmed': return CheckCircle;
      case 'preparing': return Package;
      case 'ready': return Truck;
      case 'delivered': return CheckCircle;
      case 'cancelled': return AlertTriangle;
      default: return Clock;
    }
  };

  const getPaymentStatusColor = (status: Order['paymentStatus']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingOrders = orders.filter(order => order.status === 'pending');
  const activeOrders = orders.filter(order => ['confirmed', 'preparing', 'ready'].includes(order.status));
  const deliveredOrders = orders.filter(order => order.status === 'delivered');
  const todayOrders = orders.filter(order => 
    new Date(order.orderDate).toDateString() === new Date().toDateString()
  );

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.items.some(item => item.menuItemName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Order Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage all customer orders
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
              <p className="text-2xl font-bold text-foreground">{pendingOrders.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
              <p className="text-2xl font-bold text-foreground">{activeOrders.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Delivered Today</p>
              <p className="text-2xl font-bold text-foreground">{deliveredOrders.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today's Revenue</p>
              <p className="text-2xl font-bold text-foreground">
                ₹{todayOrders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by order ID, customer name, or menu item..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Orders Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingOrders.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeOrders.length})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered ({deliveredOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const StatusIcon = getStatusIcon(order.status);
              
              return (
                <Card key={order.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                        <StatusIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">Order #{order.id}</h3>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                            {order.paymentStatus}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {order.userName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(order.orderDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {order.deliveryTime}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold">₹{order.totalAmount}</p>
                      <p className="text-sm text-muted-foreground">{order.paymentMethod.toUpperCase()}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                    {/* Order Items */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Order Items</h4>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded text-sm">
                            <div>
                              <p className="font-medium">{item.menuItemName}</p>
                              <p className="text-xs text-muted-foreground">{item.providerName}</p>
                            </div>
                            <div className="text-right">
                              <p>₹{item.price} x {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Customer Info */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Customer Details</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>{order.userName}</p>
                        <p>{order.userEmail}</p>
                        <p>{order.userPhone}</p>
                        <div className="flex items-start gap-1">
                          <MapPin className="w-3 h-3 mt-0.5" />
                          <p className="text-xs">{order.deliveryAddress}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tracking Info */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Delivery Status</h4>
                      {order.trackingInfo ? (
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>Current: {order.trackingInfo.currentLocation}</p>
                          <p>ETA: {order.trackingInfo.estimatedDelivery}</p>
                          {order.assignedDeliveryAgent && (
                            <p>Agent: {order.assignedDeliveryAgent}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No tracking info available</p>
                      )}
                      {order.specialInstructions && (
                        <div className="mt-2">
                          <p className="text-xs font-medium">Special Instructions:</p>
                          <p className="text-xs text-muted-foreground">{order.specialInstructions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    
                    {order.status === 'pending' && (
                      <Button size="sm">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm Order
                      </Button>
                    )}
                    
                    {order.status === 'confirmed' && (
                      <Button size="sm">
                        <Package className="w-4 h-4 mr-2" />
                        Mark Preparing
                      </Button>
                    )}
                    
                    {order.status === 'preparing' && (
                      <Button size="sm">
                        <Truck className="w-4 h-4 mr-2" />
                        Ready for Pickup
                      </Button>
                    )}
                    
                    {order.status === 'ready' && (
                      <Button size="sm">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Delivered
                      </Button>
                    )}
                    
                    <Button size="sm" variant="outline">
                      <Truck className="w-4 h-4 mr-2" />
                      Track Order
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="space-y-4">
            {pendingOrders.map((order) => (
              <Card key={order.id} className="p-6">
                {/* Same card structure for pending orders */}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active">
          <div className="space-y-4">
            {activeOrders.map((order) => (
              <Card key={order.id} className="p-6">
                {/* Same card structure for active orders */}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="delivered">
          <div className="space-y-4">
            {deliveredOrders.map((order) => (
              <Card key={order.id} className="p-6">
                {/* Same card structure for delivered orders */}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  UserCheck, 
  ChefHat, 
  Store, 
  MapPin, 
  Clock, 
  Star,
  Users,
  Filter,
  CheckCircle,
  AlertTriangle,
  Package
} from "lucide-react";

interface OrderAssignment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userAddress: string;
  userPreference: 'vendor' | 'chef';
  orderItems: {
    menuItemId: string;
    menuItemName: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  deliveryDate: string;
  deliveryTime: string;
  zone: string;
  status: 'unassigned' | 'assigned' | 'confirmed';
  assignedProviderId?: string;
  assignedProviderName?: string;
  orderDate: string;
}

interface Provider {
  id: string;
  name: string;
  type: 'vendor' | 'chef';
  rating: number;
  availability: boolean;
  currentOrders: number;
  maxCapacity: number;
  zone: string;
  address: string;
  specialties: string[];
  completedOrders: number;
  performance: 'bronze' | 'silver' | 'gold';
}

const mockOrderAssignments: OrderAssignment[] = [
  {
    id: "OA001",
    userId: "U247",
    userName: "Sarah K.",
    userEmail: "sarah.k@email.com",
    userPhone: "+91 98765 43210",
    userAddress: "123 Tech Park, Bangalore, KA 560001",
    userPreference: "vendor",
    orderItems: [
      { menuItemId: "M001", menuItemName: "Chicken Biryani", quantity: 1, price: 150 }
    ],
    totalAmount: 150,
    deliveryDate: "2024-01-25",
    deliveryTime: "12:30 PM",
    zone: "Bangalore Central",
    status: "unassigned",
    orderDate: "2024-01-25T10:30:00Z"
  },
  {
    id: "OA002",
    userId: "U156",
    userName: "John D.",
    userEmail: "john.d@email.com",
    userPhone: "+91 87654 32109",
    userAddress: "456 Business District, Mumbai, MH 400001",
    userPreference: "chef",
    orderItems: [
      { menuItemId: "M002", menuItemName: "Mediterranean Quinoa Bowl", quantity: 1, price: 180 }
    ],
    totalAmount: 180,
    deliveryDate: "2024-01-25",
    deliveryTime: "1:00 PM",
    zone: "Mumbai South",
    status: "assigned",
    assignedProviderId: "C001",
    assignedProviderName: "Chef Maria",
    orderDate: "2024-01-25T11:15:00Z"
  }
];

const mockProviders: Provider[] = [
  {
    id: "V001",
    name: "Spice Palace",
    type: "vendor",
    rating: 4.8,
    availability: true,
    currentOrders: 5,
    maxCapacity: 15,
    zone: "Bangalore Central",
    address: "MG Road, Bangalore",
    specialties: ["Biryani", "North Indian", "Tandoor"],
    completedOrders: 1250,
    performance: "gold"
  },
  {
    id: "V002",
    name: "Taste Hub",
    type: "vendor",
    rating: 4.5,
    availability: true,
    currentOrders: 8,
    maxCapacity: 12,
    zone: "Mumbai South",
    address: "Colaba, Mumbai",
    specialties: ["Pizza", "Italian", "Continental"],
    completedOrders: 890,
    performance: "silver"
  },
  {
    id: "C001",
    name: "Chef Maria",
    type: "chef",
    rating: 4.9,
    availability: true,
    currentOrders: 2,
    maxCapacity: 8,
    zone: "Mumbai South",
    address: "Bandra West, Mumbai",
    specialties: ["Mediterranean", "Healthy", "Organic"],
    completedOrders: 450,
    performance: "gold"
  },
  {
    id: "C002",
    name: "Chef Ravi",
    type: "chef",
    rating: 4.6,
    availability: false,
    currentOrders: 6,
    maxCapacity: 6,
    zone: "Bangalore Central",
    address: "Koramangala, Bangalore",
    specialties: ["South Indian", "Traditional", "Authentic"],
    completedOrders: 320,
    performance: "bronze"
  }
];

export function OrderAssignmentSystem() {
  const [assignments, setAssignments] = useState(mockOrderAssignments);
  const [providers, setProviders] = useState(mockProviders);
  const [activeTab, setActiveTab] = useState("unassigned");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedZone, setSelectedZone] = useState("all");
  const [selectedAssignment, setSelectedAssignment] = useState<OrderAssignment | null>(null);
  const { toast } = useToast();

  const getStatusColor = (status: OrderAssignment['status']) => {
    switch (status) {
      case 'unassigned': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (performance: Provider['performance']) => {
    switch (performance) {
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'bronze': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCapacityColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = selectedZone === "all" || assignment.zone === selectedZone;
    const matchesTab = activeTab === "all" || assignment.status === activeTab;
    
    return matchesSearch && matchesZone && matchesTab;
  });

  const getAvailableProviders = (assignment: OrderAssignment) => {
    return providers.filter(provider => 
      provider.type === assignment.userPreference &&
      provider.zone === assignment.zone &&
      provider.availability &&
      provider.currentOrders < provider.maxCapacity
    );
  };

  const assignProvider = (assignmentId: string, providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (!provider) return;

    setAssignments(prev => prev.map(assignment => 
      assignment.id === assignmentId 
        ? { 
            ...assignment, 
            status: 'assigned',
            assignedProviderId: providerId,
            assignedProviderName: provider.name
          }
        : assignment
    ));

    setProviders(prev => prev.map(p => 
      p.id === providerId 
        ? { ...p, currentOrders: p.currentOrders + 1 }
        : p
    ));

    toast({
      title: "Provider Assigned",
      description: `${provider.name} has been assigned to order ${assignmentId}`,
    });
  };

  const unassignedCount = assignments.filter(a => a.status === 'unassigned').length;
  const assignedCount = assignments.filter(a => a.status === 'assigned').length;
  const confirmedCount = assignments.filter(a => a.status === 'confirmed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Order Assignment System</h1>
          <p className="text-muted-foreground mt-1">
            Assign orders to providers based on user preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedZone} onValueChange={setSelectedZone}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              <SelectItem value="Bangalore Central">Bangalore Central</SelectItem>
              <SelectItem value="Mumbai South">Mumbai South</SelectItem>
              <SelectItem value="Delhi NCR">Delhi NCR</SelectItem>
            </SelectContent>
          </Select>
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
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Unassigned</p>
              <p className="text-2xl font-bold text-foreground">{unassignedCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Assigned</p>
              <p className="text-2xl font-bold text-foreground">{assignedCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
              <p className="text-2xl font-bold text-foreground">{confirmedCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Available Providers</p>
              <p className="text-2xl font-bold text-foreground">
                {providers.filter(p => p.availability).length}
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
              placeholder="Search by order ID or customer name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Assignment Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Orders ({assignments.length})</TabsTrigger>
          <TabsTrigger value="unassigned">Unassigned ({unassignedCount})</TabsTrigger>
          <TabsTrigger value="assigned">Assigned ({assignedCount})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({confirmedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => (
              <Card key={assignment.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                      {assignment.userPreference === 'vendor' ? (
                        <Store className="w-6 h-6 text-white" />
                      ) : (
                        <ChefHat className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Order #{assignment.id}</h3>
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status}
                        </Badge>
                        <Badge variant="outline">
                          {assignment.userPreference === 'vendor' ? 'Vendor Food' : 'Home Chef Food'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{assignment.userName}</span>
                        <span>{assignment.zone}</span>
                        <span>{assignment.deliveryTime}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold">₹{assignment.totalAmount}</p>
                    <p className="text-sm text-muted-foreground">
                      {assignment.orderItems.length} item(s)
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                  {/* Order Items */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Order Items</h4>
                    <div className="space-y-2">
                      {assignment.orderItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded text-sm">
                          <div>
                            <p className="font-medium">{item.menuItemName}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p>₹{item.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Customer Info */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Customer Details</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>{assignment.userName}</p>
                      <p>{assignment.userEmail}</p>
                      <p>{assignment.userPhone}</p>
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3 h-3 mt-0.5" />
                        <p className="text-xs">{assignment.userAddress}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Assignment Info */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Assignment Status</h4>
                    {assignment.assignedProviderName ? (
                      <div className="space-y-1 text-sm">
                        <p className="font-medium text-foreground">
                          Assigned to: {assignment.assignedProviderName}
                        </p>
                        <p className="text-muted-foreground">
                          Provider Type: {assignment.userPreference === 'vendor' ? 'Vendor' : 'Home Chef'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not assigned yet</p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {assignment.status === 'unassigned' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setSelectedAssignment(assignment)}>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Assign Provider
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>
                            Assign Provider for Order #{assignment.id}
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="p-4 bg-secondary rounded-lg">
                            <h4 className="font-medium mb-2">Order Requirements</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p><strong>Customer Preference:</strong> {assignment.userPreference === 'vendor' ? 'Vendor Food' : 'Home Chef Food'}</p>
                                <p><strong>Zone:</strong> {assignment.zone}</p>
                              </div>
                              <div>
                                <p><strong>Delivery Time:</strong> {assignment.deliveryTime}</p>
                                <p><strong>Order Value:</strong> ₹{assignment.totalAmount}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-3">
                              Available {assignment.userPreference === 'vendor' ? 'Vendors' : 'Home Chefs'}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {getAvailableProviders(assignment).map((provider) => (
                                <Card key={provider.id} className="p-4 hover:shadow-md transition-shadow">
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <h5 className="font-medium">{provider.name}</h5>
                                      <div className="flex items-center gap-2 mt-1">
                                        <div className="flex items-center gap-1">
                                          <Star className="w-3 h-3 text-yellow-500" />
                                          <span className="text-sm">{provider.rating}</span>
                                        </div>
                                        <Badge className={getPerformanceColor(provider.performance)} variant="outline">
                                          {provider.performance}
                                        </Badge>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        assignProvider(assignment.id, provider.id);
                                        setSelectedAssignment(null);
                                      }}
                                    >
                                      Assign
                                    </Button>
                                  </div>
                                  
                                  <div className="space-y-2 text-sm text-muted-foreground">
                                    <div className="flex items-center justify-between">
                                      <span>Capacity:</span>
                                      <span className={getCapacityColor(provider.currentOrders, provider.maxCapacity)}>
                                        {provider.currentOrders}/{provider.maxCapacity}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      <span className="text-xs">{provider.address}</span>
                                    </div>
                                    <div>
                                      <p className="text-xs">Specialties: {provider.specialties.join(', ')}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs">Completed Orders: {provider.completedOrders}</p>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                            
                            {getAvailableProviders(assignment).length === 0 && (
                              <div className="text-center py-8 text-muted-foreground">
                                <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                                <p>No available {assignment.userPreference === 'vendor' ? 'vendors' : 'home chefs'} in {assignment.zone}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  {assignment.status === 'assigned' && (
                    <Button size="sm" variant="outline">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Confirmed
                    </Button>
                  )}
                  
                  <Button size="sm" variant="outline">
                    <Package className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
            
            {filteredAssignments.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4" />
                <p>No orders found matching your criteria</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
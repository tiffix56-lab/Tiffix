import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Building2,
  ChefHat,
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  FileText,
  Award,
  Clock,
  Users,
  Package
} from "lucide-react";

interface Provider {
  id: string;
  name: string;
  type: 'vendor' | 'homechef';
  phone: string;
  email: string;
  address: string;
  avatar?: string;
  rating: number;
  totalOrders: number;
  completedOrders: number;
  joinDate: string;
  performance: 'Bronze' | 'Silver' | 'Gold';
  documents: {
    pan: { uploaded: boolean; verified: boolean; url?: string };
    aadhaar: { uploaded: boolean; verified: boolean; url?: string };
    fssai: { uploaded: boolean; verified: boolean; url?: string };
    bankDetails: { uploaded: boolean; verified: boolean; url?: string };
  };
  statistics: {
    avgRating: number;
    totalEarnings: number;
    avgDeliveryTime: number;
    cancelledOrders: number;
    repeatCustomers: number;
  };
  recentOrders: {
    id: string;
    customer: string;
    items: string;
    amount: number;
    date: string;
    status: string;
  }[];
}

const mockProviders: Provider[] = [
  {
    id: "V001",
    name: "Spice Palace Restaurant",
    type: "vendor",
    phone: "+91 9876543210",
    email: "contact@spicepalace.com",
    address: "123 Main Street, Food Court, New Delhi - 110001",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
    rating: 4.5,
    totalOrders: 2847,
    completedOrders: 2756,
    joinDate: "2023-01-15",
    performance: "Gold",
    documents: {
      pan: { uploaded: true, verified: true, url: "#" },
      aadhaar: { uploaded: true, verified: true, url: "#" },
      fssai: { uploaded: true, verified: true, url: "#" },
      bankDetails: { uploaded: true, verified: true, url: "#" }
    },
    statistics: {
      avgRating: 4.5,
      totalEarnings: 284700,
      avgDeliveryTime: 32,
      cancelledOrders: 91,
      repeatCustomers: 234
    },
    recentOrders: [
      {
        id: "ORD001",
        customer: "Rahul Sharma",
        items: "Chicken Biryani, Raita",
        amount: 180,
        date: "2024-01-25",
        status: "Delivered"
      },
      {
        id: "ORD002",
        customer: "Priya Singh",
        items: "Paneer Thali",
        amount: 150,
        date: "2024-01-25",
        status: "Preparing"
      }
    ]
  },
  {
    id: "C001",
    name: "Chef Sunita",
    type: "homechef",
    phone: "+91 9876543211",
    email: "sunita.chef@gmail.com",
    address: "45 Rose Garden, Sector 12, Gurugram - 122001",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b766?w=100",
    rating: 4.8,
    totalOrders: 1456,
    completedOrders: 1432,
    joinDate: "2023-03-20",
    performance: "Gold",
    documents: {
      pan: { uploaded: true, verified: true, url: "#" },
      aadhaar: { uploaded: true, verified: true, url: "#" },
      fssai: { uploaded: true, verified: false, url: "#" },
      bankDetails: { uploaded: true, verified: true, url: "#" }
    },
    statistics: {
      avgRating: 4.8,
      totalEarnings: 145600,
      avgDeliveryTime: 28,
      cancelledOrders: 24,
      repeatCustomers: 156
    },
    recentOrders: [
      {
        id: "ORD003",
        customer: "Amit Kumar",
        items: "Home Style Dal Chawal",
        amount: 120,
        date: "2024-01-25",
        status: "Delivered"
      }
    ]
  }
];

export function ProviderDetails() {
  const [providers] = useState(mockProviders);
  const [selectedProvider, setSelectedProvider] = useState(providers[0]);
  const [activeTab, setActiveTab] = useState("overview");

  const getPerformanceBadgeColor = (performance: string) => {
    switch (performance) {
      case 'Gold': return 'bg-yellow-500';
      case 'Silver': return 'bg-gray-400';
      case 'Bronze': return 'bg-amber-600';
      default: return 'bg-gray-400';
    }
  };

  const getDocumentStatus = (doc: { uploaded: boolean; verified: boolean }) => {
    if (!doc.uploaded) return { text: 'Not Uploaded', color: 'bg-red-100 text-red-800' };
    if (!doc.verified) return { text: 'Pending Verification', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Verified', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Provider Details</h1>
          <p className="text-muted-foreground mt-1">
            View detailed profiles of vendors and home chefs
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Provider List Sidebar */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">All Providers</h3>
          <div className="space-y-3">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedProvider.id === provider.id 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'hover:bg-secondary'
                }`}
                onClick={() => setSelectedProvider(provider)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${
                    provider.type === 'vendor' ? 'bg-blue-500' : 'bg-orange-500'
                  } flex items-center justify-center`}>
                    {provider.type === 'vendor' ? (
                      <Building2 className="w-4 h-4 text-white" />
                    ) : (
                      <ChefHat className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{provider.name}</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-muted-foreground">{provider.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Provider Details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Provider Header */}
          <Card className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="w-20 h-20">
                <AvatarImage src={selectedProvider.avatar} alt={selectedProvider.name} />
                <AvatarFallback>
                  {selectedProvider.type === 'vendor' ? (
                    <Building2 className="w-8 h-8" />
                  ) : (
                    <ChefHat className="w-8 h-8" />
                  )}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">{selectedProvider.name}</h2>
                  <Badge 
                    className={`${getPerformanceBadgeColor(selectedProvider.performance)} text-white`}
                  >
                    <Award className="w-3 h-3 mr-1" />
                    {selectedProvider.performance}
                  </Badge>
                  <Badge variant={selectedProvider.type === 'vendor' ? 'default' : 'secondary'}>
                    {selectedProvider.type === 'vendor' ? 'Vendor' : 'Home Chef'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {selectedProvider.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {selectedProvider.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Joined {selectedProvider.joinDate}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {selectedProvider.address}
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-1 mb-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-2xl font-bold">{selectedProvider.rating}</span>
                </div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-lg font-semibold mt-2">{selectedProvider.totalOrders} orders</p>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="orders">Recent Orders</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                      <p className="text-2xl font-bold">{selectedProvider.totalOrders}</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                      <p className="text-2xl font-bold">
                        {Math.round((selectedProvider.completedOrders / selectedProvider.totalOrders) * 100)}%
                      </p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Delivery</p>
                      <p className="text-2xl font-bold">{selectedProvider.statistics.avgDeliveryTime}min</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Repeat Customers</p>
                      <p className="text-2xl font-bold">{selectedProvider.statistics.repeatCustomers}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Performance Overview */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Performance Overview</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Order Completion Rate</span>
                      <span>{Math.round((selectedProvider.completedOrders / selectedProvider.totalOrders) * 100)}%</span>
                    </div>
                    <Progress value={(selectedProvider.completedOrders / selectedProvider.totalOrders) * 100} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Customer Rating</span>
                      <span>{selectedProvider.statistics.avgRating}/5.0</span>
                    </div>
                    <Progress value={(selectedProvider.statistics.avgRating / 5) * 100} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>On-Time Delivery</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Document Verification Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(selectedProvider.documents).map(([docType, doc]) => {
                    const status = getDocumentStatus(doc);
                    const docNames = {
                      pan: 'PAN Card',
                      aadhaar: 'Aadhaar Card',
                      fssai: 'FSSAI License',
                      bankDetails: 'Bank Details'
                    };
                    
                    return (
                      <Card key={docType} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="font-medium">{docNames[docType as keyof typeof docNames]}</span>
                          </div>
                          <Badge className={status.color}>
                            {status.text}
                          </Badge>
                        </div>
                        
                        {doc.uploaded && (
                          <div className="space-y-2">
                            <Button variant="outline" size="sm" className="w-full">
                              View Document
                            </Button>
                            {!doc.verified && (
                              <Button size="sm" className="w-full">
                                Verify Document
                              </Button>
                            )}
                          </div>
                        )}
                        
                        {!doc.uploaded && (
                          <p className="text-sm text-muted-foreground">
                            Document not uploaded yet
                          </p>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Recent Orders</h3>
                <div className="space-y-4">
                  {selectedProvider.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{order.customer}</p>
                        <p className="text-sm text-muted-foreground">{order.items}</p>
                        <p className="text-sm text-muted-foreground">{order.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{order.amount}</p>
                        <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Earnings Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Earnings</span>
                      <span className="font-semibold">₹{selectedProvider.statistics.totalEarnings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">This Month</span>
                      <span className="font-semibold">₹{Math.round(selectedProvider.statistics.totalEarnings * 0.15).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average per Order</span>
                      <span className="font-semibold">₹{Math.round(selectedProvider.statistics.totalEarnings / selectedProvider.totalOrders)}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Order Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed Orders</span>
                      <span className="font-semibold">{selectedProvider.completedOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cancelled Orders</span>
                      <span className="font-semibold text-red-600">{selectedProvider.statistics.cancelledOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-semibold text-green-600">
                        {Math.round((selectedProvider.completedOrders / selectedProvider.totalOrders) * 100)}%
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
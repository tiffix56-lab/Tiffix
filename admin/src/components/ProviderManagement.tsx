import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  ChefHat, 
  Plus, 
  Star, 
  MapPin, 
  Phone, 
  Mail,
  Edit,
  Trash2,
  MoreVertical,
  TrendingUp,
  Users,
  Calendar,
  DollarSign
} from "lucide-react";

interface Provider {
  id: string;
  name: string;
  type: 'vendor' | 'chef';
  email: string;
  phone: string;
  address: string;
  rating: number;
  totalOrders: number;
  monthlyRevenue: number;
  specialties: string[];
  availability: string[];
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  documents: {
    license: boolean;
    insurance: boolean;
    certification: boolean;
  };
  pricing: {
    basePrice: number;
    priceRange: string;
  };
}

const mockProviders: Provider[] = [
  {
    id: "V001",
    name: "Spice Palace Restaurant",
    type: "vendor",
    email: "contact@spicepalace.com",
    phone: "+91 98765 43210",
    address: "123 Food Street, Mumbai, MH 400001",
    rating: 4.8,
    totalOrders: 1247,
    monthlyRevenue: 45000,
    specialties: ["Indian", "Biryani", "Curry", "Vegetarian"],
    availability: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    status: "active",
    joinDate: "2023-08-15",
    documents: {
      license: true,
      insurance: true,
      certification: true
    },
    pricing: {
      basePrice: 100,
      priceRange: "₹80-120"
    }
  },
  {
    id: "C001",
    name: "Chef Maria Gonzalez",
    type: "chef",
    email: "maria.chef@gmail.com", 
    phone: "+91 87654 32109",
    address: "456 Home Cook Lane, Delhi, DL 110001",
    rating: 4.9,
    totalOrders: 567,
    monthlyRevenue: 28000,
    specialties: ["Mediterranean", "Healthy", "Salads", "Vegan"],
    availability: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    status: "active",
    joinDate: "2023-09-20",
    documents: {
      license: true,
      insurance: false,
      certification: true
    },
    pricing: {
      basePrice: 150,
      priceRange: "₹120-180"
    }
  },
  {
    id: "V002",
    name: "Taste Hub Kitchen",
    type: "vendor",
    email: "orders@tastehub.in",
    phone: "+91 76543 21098",
    address: "789 Culinary Avenue, Bangalore, KA 560001",
    rating: 4.6,
    totalOrders: 892,
    monthlyRevenue: 38000,
    specialties: ["Continental", "Italian", "Chinese", "Fast Food"],
    availability: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    status: "active",
    joinDate: "2023-07-10",
    documents: {
      license: true,
      insurance: true,
      certification: false
    },
    pricing: {
      basePrice: 120,
      priceRange: "₹100-150"
    }
  }
];

export function ProviderManagement() {
  const [providers, setProviders] = useState(mockProviders);
  const [activeTab, setActiveTab] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const vendors = providers.filter(p => p.type === 'vendor');
  const chefs = providers.filter(p => p.type === 'chef');
  const activeProviders = providers.filter(p => p.status === 'active');
  const pendingProviders = providers.filter(p => p.status === 'pending');

  const getStatusColor = (status: Provider['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocumentStatus = (documents: Provider['documents']) => {
    const total = Object.keys(documents).length;
    const completed = Object.values(documents).filter(Boolean).length;
    return { completed, total, percentage: (completed / total) * 100 };
  };

  const AddProviderDialog = () => (
    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Provider</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Provider Type</label>
              <select className="w-full p-2 border rounded">
                <option value="vendor">Vendor Restaurant</option>
                <option value="chef">Home Chef</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input placeholder="Provider name" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="Email address" />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input placeholder="Phone number" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Address</label>
            <Textarea placeholder="Full address" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Base Price (₹)</label>
              <Input type="number" placeholder="100" />
            </div>
            <div>
              <label className="text-sm font-medium">Specialties</label>
              <Input placeholder="e.g. Indian, Italian, Chinese" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button>Add Provider</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Provider Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage vendors and home chefs
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Provider
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Vendors</p>
              <p className="text-2xl font-bold text-foreground">{vendors.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <ChefHat className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Home Chefs</p>
              <p className="text-2xl font-bold text-foreground">{chefs.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Providers</p>
              <p className="text-2xl font-bold text-foreground">{activeProviders.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-foreground">
                ₹{providers.reduce((sum, p) => sum + p.monthlyRevenue, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Provider Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Providers ({providers.length})</TabsTrigger>
          <TabsTrigger value="vendors">Vendors ({vendors.length})</TabsTrigger>
          <TabsTrigger value="chefs">Chefs ({chefs.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingProviders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {providers.map((provider) => (
              <Card key={provider.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg ${
                      provider.type === 'vendor' ? 'bg-gradient-vendor' : 'bg-gradient-chef'
                    } flex items-center justify-center`}>
                      {provider.type === 'vendor' ? (
                        <Building2 className="w-6 h-6 text-white" />
                      ) : (
                        <ChefHat className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{provider.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{provider.type}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="text-xs">{provider.rating}</span>
                        <span className="text-xs text-muted-foreground">• {provider.totalOrders} orders</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(provider.status)}>
                      {provider.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {provider.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {provider.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {provider.address}
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Specialties</p>
                    <div className="flex flex-wrap gap-1">
                      {provider.specialties.slice(0, 3).map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {provider.specialties.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{provider.specialties.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Monthly Revenue</p>
                      <p className="font-semibold">₹{provider.monthlyRevenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Price Range</p>
                      <p className="font-semibold">{provider.pricing.priceRange}</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Documents</span>
                      <span>{getDocumentStatus(provider.documents).completed}/{getDocumentStatus(provider.documents).total}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${getDocumentStatus(provider.documents).percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analytics
                  </Button>
                  <Button size="sm" variant="outline">
                    <Calendar className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="vendors">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {vendors.map((provider) => (
              <Card key={provider.id} className="p-6">
                {/* Same card structure as above */}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="chefs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {chefs.map((provider) => (
              <Card key={provider.id} className="p-6">
                {/* Same card structure as above */}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingProviders.map((provider) => (
              <Card key={provider.id} className="p-6">
                {/* Same card structure as above */}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <AddProviderDialog />
    </div>
  );
}
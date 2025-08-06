import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ChefHat, 
  Building2,
  Users,
  Star,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle
} from "lucide-react";

interface Provider {
  id: string;
  name: string;
  type: 'vendor' | 'chef';
  rating: number;
  totalOrders: number;
  weeklyCapacity: number;
  currentAssignments: number;
  availableDays: string[];
  specialties: string[];
  priceRange: string;
  performance: number;
  status: 'active' | 'busy' | 'unavailable';
}

const mockProviders: Provider[] = [
  {
    id: "V001",
    name: "Spice Palace",
    type: "vendor",
    rating: 4.8,
    totalOrders: 1247,
    weeklyCapacity: 50,
    currentAssignments: 32,
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    specialties: ["Indian", "Biryani", "Curry"],
    priceRange: "₹80-120",
    performance: 95,
    status: "active"
  },
  {
    id: "V002", 
    name: "Taste Hub",
    type: "vendor",
    rating: 4.6,
    totalOrders: 892,
    weeklyCapacity: 40,
    currentAssignments: 38,
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    specialties: ["Continental", "Italian", "Chinese"],
    priceRange: "₹100-150",
    performance: 88,
    status: "busy"
  },
  {
    id: "C001",
    name: "Chef Maria",
    type: "chef",
    rating: 4.9,
    totalOrders: 567,
    weeklyCapacity: 25,
    currentAssignments: 15,
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    specialties: ["Healthy", "Mediterranean", "Salads"],
    priceRange: "₹120-180",
    performance: 98,
    status: "active"
  },
  {
    id: "C002",
    name: "Chef Kumar",
    type: "chef", 
    rating: 4.7,
    totalOrders: 423,
    weeklyCapacity: 20,
    currentAssignments: 12,
    availableDays: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    specialties: ["South Indian", "Traditional", "Vegetarian"],
    priceRange: "₹90-140",
    performance: 92,
    status: "active"
  },
  {
    id: "V003",
    name: "Food Corner",
    type: "vendor",
    rating: 4.4,
    totalOrders: 634,
    weeklyCapacity: 35,
    currentAssignments: 28,
    availableDays: ["Monday", "Wednesday", "Friday", "Saturday", "Sunday"],
    specialties: ["Fast Food", "Snacks", "Street Food"],
    priceRange: "₹60-100",
    performance: 85,
    status: "active"
  }
];

export function ProviderAssignmentSystem() {
  const getStatusColor = (status: Provider['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'unavailable': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCapacityColor = (current: number, total: number) => {
    const percentage = (current / total) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const vendors = mockProviders.filter(p => p.type === 'vendor');
  const chefs = mockProviders.filter(p => p.type === 'chef');

  return (
    <div className="space-y-6">
      {/* Provider Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Vendors</p>
              <p className="text-2xl font-bold text-foreground">{vendors.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <ChefHat className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Chefs</p>
              <p className="text-2xl font-bold text-foreground">{chefs.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Capacity</p>
              <p className="text-2xl font-bold text-foreground">
                {mockProviders.reduce((acc, p) => acc + p.weeklyCapacity, 0)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Utilization</p>
              <p className="text-2xl font-bold text-foreground">
                {Math.round((mockProviders.reduce((acc, p) => acc + p.currentAssignments, 0) / 
                  mockProviders.reduce((acc, p) => acc + p.weeklyCapacity, 0)) * 100)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Vendor Food Providers */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Vendor Food Providers</h3>
          </div>
          <Button variant="outline" size="sm">
            Add New Vendor
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {vendors.map((provider) => (
            <div key={provider.id} className="p-4 bg-secondary rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-vendor flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{provider.name}</span>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(provider.status)}`} />
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-muted-foreground">{provider.rating}</span>
                      <span className="text-xs text-muted-foreground">• {provider.totalOrders} orders</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">ID: {provider.id}</Badge>
              </div>
              
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Weekly Capacity</span>
                  <span className={getCapacityColor(provider.currentAssignments, provider.weeklyCapacity)}>
                    {provider.currentAssignments}/{provider.weeklyCapacity}
                  </span>
                </div>
                <Progress 
                  value={(provider.currentAssignments / provider.weeklyCapacity) * 100} 
                  className="h-2"
                />
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Performance</span>
                  <span className="text-green-600">{provider.performance}%</span>
                </div>
                
                <div className="text-sm">
                  <span className="text-muted-foreground">Price Range: </span>
                  <span className="font-medium">{provider.priceRange}</span>
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-1">Specialties</p>
                <div className="flex flex-wrap gap-1">
                  {provider.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
                <Button size="sm" className="flex-1">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Assign Meals
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Home Chef Providers */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Home Chef Providers</h3>
          </div>
          <Button variant="outline" size="sm">
            Add New Chef
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {chefs.map((provider) => (
            <div key={provider.id} className="p-4 bg-secondary rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-chef flex items-center justify-center">
                    <ChefHat className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{provider.name}</span>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(provider.status)}`} />
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-muted-foreground">{provider.rating}</span>
                      <span className="text-xs text-muted-foreground">• {provider.totalOrders} orders</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">ID: {provider.id}</Badge>
              </div>
              
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Weekly Capacity</span>
                  <span className={getCapacityColor(provider.currentAssignments, provider.weeklyCapacity)}>
                    {provider.currentAssignments}/{provider.weeklyCapacity}
                  </span>
                </div>
                <Progress 
                  value={(provider.currentAssignments / provider.weeklyCapacity) * 100} 
                  className="h-2"
                />
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Performance</span>
                  <span className="text-green-600">{provider.performance}%</span>
                </div>
                
                <div className="text-sm">
                  <span className="text-muted-foreground">Price Range: </span>
                  <span className="font-medium">{provider.priceRange}</span>
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-1">Specialties</p>
                <div className="flex flex-wrap gap-1">
                  {provider.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
                <Button size="sm" className="flex-1">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Assign Meals
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Assignment Suggestions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Smart Assignment Suggestions</h3>
        <div className="space-y-3">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">High-Performing Providers Available</p>
                <p className="text-xs text-muted-foreground">
                  Chef Maria (98% performance) and Spice Palace (95% performance) have capacity for 10+ more assignments this week
                </p>
              </div>
              <Button size="sm" variant="outline">
                Auto-Assign
              </Button>
            </div>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-yellow-500 flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Capacity Alert</p>
                <p className="text-xs text-muted-foreground">
                  Taste Hub is at 95% capacity. Consider redistributing assignments to other vendors.
                </p>
              </div>
              <Button size="sm" variant="outline">
                Redistribute
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
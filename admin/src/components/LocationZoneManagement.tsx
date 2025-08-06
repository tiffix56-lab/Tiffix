import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  ChefHat, 
  Store, 
  BarChart3,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Info
} from "lucide-react";

interface Zone {
  id: string;
  name: string;
  city: string;
  pincodes: string[];
  status: 'active' | 'inactive';
  serviceType: 'vendor_only' | 'chef_only' | 'both';
  totalUsers: number;
  activeUsers: number;
  totalProviders: number;
  vendorCount: number;
  chefCount: number;
  orderVolume: number;
  population: number;
  avgDeliveryTime: number;
  lastUpdated: string;
}

const mockZones: Zone[] = [
  {
    id: "Z001",
    name: "Bangalore Central",
    city: "Bangalore",
    pincodes: ["560001", "560002", "560003", "560004"],
    status: "active",
    serviceType: "both",
    totalUsers: 2450,
    activeUsers: 1850,
    totalProviders: 45,
    vendorCount: 28,
    chefCount: 17,
    orderVolume: 1250,
    population: 125000,
    avgDeliveryTime: 32,
    lastUpdated: "2024-01-25T10:30:00Z"
  },
  {
    id: "Z002",
    name: "Mumbai South",
    city: "Mumbai",
    pincodes: ["400001", "400002", "400005", "400020"],
    status: "active",
    serviceType: "both",
    totalUsers: 3200,
    activeUsers: 2400,
    totalProviders: 62,
    vendorCount: 35,
    chefCount: 27,
    orderVolume: 1800,
    population: 180000,
    avgDeliveryTime: 28,
    lastUpdated: "2024-01-25T09:15:00Z"
  },
  {
    id: "Z003",
    name: "Delhi NCR",
    city: "Delhi",
    pincodes: ["110001", "110003", "110005", "110011"],
    status: "active",
    serviceType: "vendor_only",
    totalUsers: 2800,
    activeUsers: 2100,
    totalProviders: 38,
    vendorCount: 38,
    chefCount: 0,
    orderVolume: 1450,
    population: 165000,
    avgDeliveryTime: 35,
    lastUpdated: "2024-01-25T11:45:00Z"
  },
  {
    id: "Z004",
    name: "Pune Central",
    city: "Pune",
    pincodes: ["411001", "411002", "411003"],
    status: "inactive",
    serviceType: "chef_only",
    totalUsers: 1200,
    activeUsers: 850,
    totalProviders: 15,
    vendorCount: 0,
    chefCount: 15,
    orderVolume: 520,
    population: 85000,
    avgDeliveryTime: 30,
    lastUpdated: "2024-01-24T16:20:00Z"
  }
];

export function LocationZoneManagement() {
  const [zones, setZones] = useState(mockZones);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [isAddingZone, setIsAddingZone] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [newZone, setNewZone] = useState({
    name: "",
    city: "",
    pincodes: "",
    serviceType: "both" as Zone['serviceType']
  });
  const { toast } = useToast();

  const getStatusColor = (status: Zone['status']) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getServiceTypeColor = (serviceType: Zone['serviceType']) => {
    switch (serviceType) {
      case 'both': return 'bg-blue-100 text-blue-800';
      case 'vendor_only': return 'bg-purple-100 text-purple-800';
      case 'chef_only': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getServiceTypeIcon = (serviceType: Zone['serviceType']) => {
    switch (serviceType) {
      case 'vendor_only': return Store;
      case 'chef_only': return ChefHat;
      case 'both': return Users;
      default: return Users;
    }
  };

  const filteredZones = zones.filter(zone => {
    const matchesSearch = zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         zone.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         zone.pincodes.some(pincode => pincode.includes(searchTerm));
    const matchesStatus = statusFilter === "all" || zone.status === statusFilter;
    const matchesServiceType = serviceTypeFilter === "all" || zone.serviceType === serviceTypeFilter;
    
    return matchesSearch && matchesStatus && matchesServiceType;
  });

  const toggleZoneStatus = (zoneId: string) => {
    setZones(prev => prev.map(zone => 
      zone.id === zoneId 
        ? { ...zone, status: zone.status === 'active' ? 'inactive' : 'active' }
        : zone
    ));

    const zone = zones.find(z => z.id === zoneId);
    toast({
      title: "Zone Status Updated",
      description: `${zone?.name} is now ${zone?.status === 'active' ? 'inactive' : 'active'}`,
    });
  };

  const deleteZone = (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId);
    setZones(prev => prev.filter(zone => zone.id !== zoneId));
    
    toast({
      title: "Zone Deleted",
      description: `${zone?.name} has been deleted successfully`,
    });
  };

  const addZone = () => {
    const zone: Zone = {
      id: `Z${String(zones.length + 1).padStart(3, '0')}`,
      name: newZone.name,
      city: newZone.city,
      pincodes: newZone.pincodes.split(',').map(p => p.trim()),
      status: 'active',
      serviceType: newZone.serviceType,
      totalUsers: 0,
      activeUsers: 0,
      totalProviders: 0,
      vendorCount: 0,
      chefCount: 0,
      orderVolume: 0,
      population: 0,
      avgDeliveryTime: 0,
      lastUpdated: new Date().toISOString()
    };

    setZones(prev => [...prev, zone]);
    setNewZone({ name: "", city: "", pincodes: "", serviceType: "both" });
    setIsAddingZone(false);

    toast({
      title: "Zone Added",
      description: `${zone.name} has been added successfully`,
    });
  };

  const activeZones = zones.filter(z => z.status === 'active').length;
  const totalUsers = zones.reduce((sum, zone) => sum + zone.totalUsers, 0);
  const totalProviders = zones.reduce((sum, zone) => sum + zone.totalProviders, 0);
  const totalOrderVolume = zones.reduce((sum, zone) => sum + zone.orderVolume, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Location Zone Management</h1>
          <p className="text-muted-foreground mt-1">
            Control service availability and manage zones
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddingZone} onOpenChange={setIsAddingZone}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Zone
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Zone</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="zoneName">Zone Name</Label>
                  <Input
                    id="zoneName"
                    placeholder="e.g. Mumbai North"
                    value={newZone.name}
                    onChange={(e) => setNewZone(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="e.g. Mumbai"
                    value={newZone.city}
                    onChange={(e) => setNewZone(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="pincodes">Pincodes (comma separated)</Label>
                  <Textarea
                    id="pincodes"
                    placeholder="e.g. 400001, 400002, 400003"
                    value={newZone.pincodes}
                    onChange={(e) => setNewZone(prev => ({ ...prev, pincodes: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="serviceType">Service Type</Label>
                  <Select value={newZone.serviceType} onValueChange={(value: Zone['serviceType']) => 
                    setNewZone(prev => ({ ...prev, serviceType: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Both Vendor & Home Chef</SelectItem>
                      <SelectItem value="vendor_only">Vendor Only</SelectItem>
                      <SelectItem value="chef_only">Home Chef Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={addZone}
                    disabled={!newZone.name || !newZone.city || !newZone.pincodes}
                  >
                    Add Zone
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingZone(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Zones</p>
              <p className="text-2xl font-bold text-foreground">{activeZones}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold text-foreground">{totalUsers.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <ChefHat className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Providers</p>
              <p className="text-2xl font-bold text-foreground">{totalProviders}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Monthly Orders</p>
              <p className="text-2xl font-bold text-foreground">{totalOrderVolume.toLocaleString()}</p>
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
              placeholder="Search by zone name, city, or pincode..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Service Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="both">Both</SelectItem>
              <SelectItem value="vendor_only">Vendor Only</SelectItem>
              <SelectItem value="chef_only">Chef Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredZones.map((zone) => {
          const ServiceIcon = getServiceTypeIcon(zone.serviceType);
          
          return (
            <Card key={zone.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{zone.name}</h3>
                      <Badge className={getStatusColor(zone.status)}>
                        {zone.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{zone.city}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={zone.status === 'active'}
                    onCheckedChange={() => toggleZoneStatus(zone.id)}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Service Type */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Service Type:</span>
                  <div className="flex items-center gap-2">
                    <ServiceIcon className="w-4 h-4" />
                    <Badge className={getServiceTypeColor(zone.serviceType)} variant="outline">
                      {zone.serviceType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                </div>
                
                {/* Pincodes */}
                <div>
                  <span className="text-sm text-muted-foreground">Pincodes:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {zone.pincodes.map((pincode) => (
                      <Badge key={pincode} variant="secondary" className="text-xs">
                        {pincode}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Users:</span>
                      <span className="font-medium">{zone.totalUsers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Active Users:</span>
                      <span className="font-medium text-green-600">{zone.activeUsers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Population:</span>
                      <span className="font-medium">{zone.population.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Vendors:</span>
                      <span className="font-medium">{zone.vendorCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Home Chefs:</span>
                      <span className="font-medium">{zone.chefCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg Delivery:</span>
                      <span className="font-medium">{zone.avgDeliveryTime} min</span>
                    </div>
                  </div>
                </div>
                
                {/* Order Volume */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Monthly Orders:</span>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{zone.orderVolume.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button size="sm" variant="outline">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button size="sm" variant="outline">
                  <Info className="w-4 h-4 mr-2" />
                  Details
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => deleteZone(zone.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      
      {filteredZones.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-4" />
          <p>No zones found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
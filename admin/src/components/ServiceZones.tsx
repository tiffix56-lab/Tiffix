import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  MapPin, 
  Edit, 
  Trash2, 
  Truck, 
  Clock,
  Users,
  DollarSign,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface ServiceZone {
  id: string;
  name: string;
  area: string;
  pinCodes: string[];
  deliveryFee: number;
  deliveryTime: {
    min: number;
    max: number;
  };
  isActive: boolean;
  deliveryAgents: number;
  totalOrders: number;
  averageRating: number;
  coverage: {
    vendors: number;
    chefs: number;
  };
  boundaries?: {
    coordinates: Array<[number, number]>;
  };
  operatingHours: {
    start: string;
    end: string;
  };
  restrictions?: string[];
}

const mockServiceZones: ServiceZone[] = [
  {
    id: "SZ001",
    name: "Bangalore Tech Corridor",
    area: "Electronic City, Koramangala, BTM Layout",
    pinCodes: ["560029", "560034", "560068", "560076"],
    deliveryFee: 15,
    deliveryTime: { min: 25, max: 40 },
    isActive: true,
    deliveryAgents: 12,
    totalOrders: 1247,
    averageRating: 4.8,
    coverage: { vendors: 8, chefs: 5 },
    operatingHours: { start: "08:00", end: "22:00" }
  },
  {
    id: "SZ002", 
    name: "Mumbai Business District",
    area: "Bandra, Andheri, Powai, Goregaon",
    pinCodes: ["400050", "400053", "400076", "400062"],
    deliveryFee: 20,
    deliveryTime: { min: 30, max: 50 },
    isActive: true,
    deliveryAgents: 15,
    totalOrders: 1856,
    averageRating: 4.6,
    coverage: { vendors: 12, chefs: 8 },
    operatingHours: { start: "07:30", end: "23:00" }
  },
  {
    id: "SZ003",
    name: "Delhi NCR Central",
    area: "Connaught Place, Karol Bagh, Lajpat Nagar",
    pinCodes: ["110001", "110005", "110024", "110027"],
    deliveryFee: 18,
    deliveryTime: { min: 35, max: 55 },
    isActive: true,
    deliveryAgents: 10,
    totalOrders: 923,
    averageRating: 4.7,
    coverage: { vendors: 6, chefs: 4 },
    operatingHours: { start: "08:00", end: "21:30" }
  },
  {
    id: "SZ004",
    name: "Pune IT Hub",
    area: "Hinjewadi, Wakad, Baner, Aundh",
    pinCodes: ["411057", "411014", "411045", "411007"],
    deliveryFee: 12,
    deliveryTime: { min: 20, max: 35 },
    isActive: false,
    deliveryAgents: 0,
    totalOrders: 0,
    averageRating: 0,
    coverage: { vendors: 0, chefs: 0 },
    operatingHours: { start: "09:00", end: "20:00" },
    restrictions: ["Under development", "Limited provider coverage"]
  },
  {
    id: "SZ005",
    name: "Hyderabad HITEC City",
    area: "HITEC City, Gachibowli, Madhapur, Kondapur",
    pinCodes: ["500081", "500032", "500084", "500033"],
    deliveryFee: 16,
    deliveryTime: { min: 28, max: 45 },
    isActive: true,
    deliveryAgents: 8,
    totalOrders: 567,
    averageRating: 4.5,
    coverage: { vendors: 5, chefs: 3 },
    operatingHours: { start: "08:30", end: "21:00" }
  }
];

export function ServiceZones() {
  const [zones, setZones] = useState(mockServiceZones);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const activeZones = zones.filter(zone => zone.isActive);
  const inactiveZones = zones.filter(zone => !zone.isActive);
  const totalOrders = zones.reduce((sum, zone) => sum + zone.totalOrders, 0);
  const totalAgents = zones.reduce((sum, zone) => sum + zone.deliveryAgents, 0);

  const AddZoneDialog = () => (
    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Service Zone</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Zone Name</label>
              <Input placeholder="e.g. Bangalore Tech Corridor" />
            </div>
            <div>
              <label className="text-sm font-medium">Delivery Fee (₹)</label>
              <Input type="number" placeholder="15" />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Area Description</label>
            <Input placeholder="e.g. Electronic City, Koramangala, BTM Layout" />
          </div>
          
          <div>
            <label className="text-sm font-medium">PIN Codes (comma separated)</label>
            <Input placeholder="e.g. 560029, 560034, 560068" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Min Delivery Time (mins)</label>
              <Input type="number" placeholder="25" />
            </div>
            <div>
              <label className="text-sm font-medium">Max Delivery Time (mins)</label>
              <Input type="number" placeholder="40" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Operating Hours Start</label>
              <Input type="time" defaultValue="08:00" />
            </div>
            <div>
              <label className="text-sm font-medium">Operating Hours End</label>
              <Input type="time" defaultValue="22:00" />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button>Add Service Zone</Button>
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
          <h1 className="text-3xl font-bold text-foreground">Service Zones</h1>
          <p className="text-muted-foreground mt-1">
            Manage delivery areas and coverage zones
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Service Zone
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Zones</p>
              <p className="text-2xl font-bold text-foreground">{activeZones.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Delivery Agents</p>
              <p className="text-2xl font-bold text-foreground">{totalAgents}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold text-foreground">{totalOrders.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Delivery Fee</p>
              <p className="text-2xl font-bold text-foreground">
                ₹{Math.round(activeZones.reduce((sum, zone) => sum + zone.deliveryFee, 0) / activeZones.length)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Service Zones Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {zones.map((zone) => (
          <Card key={zone.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg ${
                  zone.isActive ? 'bg-gradient-primary' : 'bg-gray-400'
                } flex items-center justify-center`}>
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{zone.name}</h3>
                    <Badge className={zone.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {zone.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Zone #{zone.id}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-3 mb-4">
              <div>
                <p className="text-sm font-medium mb-1">Coverage Area</p>
                <p className="text-sm text-muted-foreground">{zone.area}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-1">PIN Codes</p>
                <div className="flex flex-wrap gap-1">
                  {zone.pinCodes.map((pinCode, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {pinCode}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Delivery Fee</p>
                  <p className="text-lg font-bold text-green-600">₹{zone.deliveryFee}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Delivery Time</p>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{zone.deliveryTime.min}-{zone.deliveryTime.max} mins</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Operating Hours</p>
                  <p className="text-sm text-muted-foreground">
                    {zone.operatingHours.start} - {zone.operatingHours.end}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Delivery Agents</p>
                  <div className="flex items-center gap-1">
                    <Truck className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{zone.deliveryAgents} agents</span>
                  </div>
                </div>
              </div>
            </div>
            
            {zone.isActive ? (
              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="font-semibold">{zone.totalOrders}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Rating</p>
                    <p className="font-semibold">{zone.averageRating}/5</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Providers</p>
                    <p className="font-semibold">{zone.coverage.vendors + zone.coverage.chefs}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Provider Coverage</p>
                  <div className="flex gap-2">
                    <div className="flex-1 p-2 bg-blue-50 rounded text-center">
                      <p className="text-xs text-muted-foreground">Vendors</p>
                      <p className="font-semibold">{zone.coverage.vendors}</p>
                    </div>
                    <div className="flex-1 p-2 bg-orange-50 rounded text-center">
                      <p className="text-xs text-muted-foreground">Chefs</p>
                      <p className="font-semibold">{zone.coverage.chefs}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              zone.restrictions && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    Restrictions
                  </p>
                  <div className="space-y-1">
                    {zone.restrictions.map((restriction, index) => (
                      <p key={index} className="text-xs text-yellow-600">{restriction}</p>
                    ))}
                  </div>
                </div>
              )
            )}
            
            <div className="flex gap-2">
              {zone.isActive ? (
                <>
                  <Button size="sm" variant="outline" className="flex-1">
                    <MapPin className="w-4 h-4 mr-2" />
                    View Map
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Users className="w-4 h-4 mr-2" />
                    Manage Agents
                  </Button>
                </>
              ) : (
                <Button size="sm" className="flex-1">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Activate Zone
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Coverage Map Placeholder */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Service Coverage Map</h3>
        <div className="h-64 bg-secondary rounded-lg flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Interactive map would be displayed here</p>
            <p className="text-sm text-muted-foreground">Showing all active service zones and coverage areas</p>
          </div>
        </div>
      </Card>

      <AddZoneDialog />
    </div>
  );
}
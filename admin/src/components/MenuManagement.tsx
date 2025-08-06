import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { 
  Plus, 
  UtensilsCrossed, 
  Edit, 
  Trash2,
  Eye,
  Building2,
  ChefHat,
  Clock,
  DollarSign,
  Upload,
  Star,
  Filter,
  Search
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  detailedItems: string;
  price: number;
  category: 'vendor' | 'homechef';
  cuisine: string;
  dietary: string[];
  preparationTime: number;
  calories: number;
  providerId: string;
  providerName: string;
  image: string;
  status: 'active' | 'inactive';
  rating: number;
  orders: number;
}

const mockMenuItems: MenuItem[] = [
  {
    id: "M001",
    name: "Traditional Thali",
    description: "Complete traditional meal with variety of authentic dishes",
    detailedItems: "4 roti, dal, sabji, salad, rice, pickle, papad",
    price: 150,
    category: "vendor",
    cuisine: "Indian",
    dietary: ["Vegetarian"],
    preparationTime: 45,
    calories: 650,
    providerId: "V001",
    providerName: "Spice Palace Restaurant",
    image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400",
    status: "active",
    rating: 4.5,
    orders: 124
  },
  {
    id: "M002",
    name: "Home Style Dal Chawal",
    description: "Comfort food prepared with love in home kitchen",
    detailedItems: "Dal, chawal, ghee, pickle, papad",
    price: 120,
    category: "homechef",
    cuisine: "Indian",
    dietary: ["Vegetarian", "Gluten-Free"],
    preparationTime: 30,
    calories: 480,
    providerId: "C001",
    providerName: "Chef Sunita",
    image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400",
    status: "active",
    rating: 4.8,
    orders: 89
  },
  {
    id: "M003",
    name: "Chicken Biryani Special",
    description: "Aromatic basmati rice with succulent chicken pieces",
    detailedItems: "Basmati rice, chicken, raita, shorba, boiled egg",
    price: 180,
    category: "vendor",
    cuisine: "Mughlai",
    dietary: ["Non-Vegetarian"],
    preparationTime: 60,
    calories: 720,
    providerId: "V002",
    providerName: "Biryani House",
    image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400",
    status: "active",
    rating: 4.6,
    orders: 156
  }
];

export function MenuManagement() {
  const [menuItems, setMenuItems] = useState(mockMenuItems);
  const [activeTab, setActiveTab] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    detailedItems: "",
    price: 0,
    category: "vendor" as 'vendor' | 'homechef',
    cuisine: "",
    dietary: [] as string[],
    preparationTime: 0,
    calories: 0,
    providerId: "",
    providerName: "",
    image: ""
  });

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    const matchesTab = activeTab === "all" || item.category === activeTab;
    
    return matchesSearch && matchesCategory && matchesTab;
  });

  const handleAddItem = () => {
    if (!newItem.name || !newItem.description || !newItem.detailedItems || newItem.price <= 0) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const item: MenuItem = {
      ...newItem,
      id: `M${String(menuItems.length + 1).padStart(3, '0')}`,
      status: 'active',
      rating: 0,
      orders: 0
    };

    setMenuItems([...menuItems, item]);
    setShowAddDialog(false);
    setNewItem({
      name: "",
      description: "",
      detailedItems: "",
      price: 0,
      category: "vendor",
      cuisine: "",
      dietary: [],
      preparationTime: 0,
      calories: 0,
      providerId: "",
      providerName: "",
      image: ""
    });

    toast({
      title: "Menu Item Added",
      description: `${item.name} has been added successfully`
    });
  };

  const handleDeleteItem = (id: string) => {
    setMenuItems(menuItems.filter(item => item.id !== id));
    toast({
      title: "Menu Item Deleted",
      description: "Item has been removed from the menu"
    });
  };

  const handleToggleStatus = (id: string) => {
    setMenuItems(menuItems.map(item => 
      item.id === id 
        ? { ...item, status: item.status === 'active' ? 'inactive' : 'active' }
        : item
    ));
  };

  const AddMenuItemDialog = () => (
    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Menu Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Image Upload */}
          <div>
            <Label htmlFor="image">Food Image</Label>
            <div className="mt-2 border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to upload high-resolution food image</p>
              <Input 
                id="image" 
                type="file" 
                accept="image/*" 
                className="mt-2"
                onChange={(e) => setNewItem({...newItem, image: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Food Title (max 60 chars)</Label>
              <Input 
                id="name"
                maxLength={60}
                placeholder="e.g. Traditional Thali"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              />
              <p className="text-xs text-muted-foreground mt-1">{newItem.name.length}/60 characters</p>
            </div>
            <div>
              <Label htmlFor="price">Price (₹/meal)</Label>
              <Input 
                id="price"
                type="number" 
                placeholder="150"
                value={newItem.price || ""}
                onChange={(e) => setNewItem({...newItem, price: Number(e.target.value)})}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Short Description (max 160 chars)</Label>
            <Textarea 
              id="description"
              maxLength={160}
              placeholder="Brief description of the dish"
              value={newItem.description}
              onChange={(e) => setNewItem({...newItem, description: e.target.value})}
            />
            <p className="text-xs text-muted-foreground mt-1">{newItem.description.length}/160 characters</p>
          </div>

          <div>
            <Label htmlFor="detailedItems">Detailed Item List</Label>
            <Textarea 
              id="detailedItems"
              placeholder="e.g. 4 roti, sabji, salad, rice, dal, pickle"
              value={newItem.detailedItems}
              onChange={(e) => setNewItem({...newItem, detailedItems: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                value={newItem.category} 
                onValueChange={(value: 'vendor' | 'homechef') => setNewItem({...newItem, category: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendor">Vendor Food</SelectItem>
                  <SelectItem value="homechef">Home Chef Food</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cuisine">Cuisine</Label>
              <Select 
                value={newItem.cuisine} 
                onValueChange={(value) => setNewItem({...newItem, cuisine: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cuisine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Indian">Indian</SelectItem>
                  <SelectItem value="Chinese">Chinese</SelectItem>
                  <SelectItem value="Italian">Italian</SelectItem>
                  <SelectItem value="Mediterranean">Mediterranean</SelectItem>
                  <SelectItem value="Continental">Continental</SelectItem>
                  <SelectItem value="Mughlai">Mughlai</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="prepTime">Prep Time (mins)</Label>
              <Input 
                id="prepTime"
                type="number" 
                placeholder="30"
                value={newItem.preparationTime || ""}
                onChange={(e) => setNewItem({...newItem, preparationTime: Number(e.target.value)})}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="calories">Calories</Label>
              <Input 
                id="calories"
                type="number" 
                placeholder="450"
                value={newItem.calories || ""}
                onChange={(e) => setNewItem({...newItem, calories: Number(e.target.value)})}
              />
            </div>
            <div>
              <Label htmlFor="provider">Provider</Label>
              <Select 
                value={newItem.providerId} 
                onValueChange={(value) => {
                  const providerNames = {
                    "V001": "Spice Palace Restaurant",
                    "V002": "Biryani House",
                    "C001": "Chef Sunita",
                    "C002": "Chef Maria"
                  };
                  setNewItem({
                    ...newItem, 
                    providerId: value,
                    providerName: providerNames[value as keyof typeof providerNames] || ""
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {newItem.category === 'vendor' && (
                    <>
                      <SelectItem value="V001">Spice Palace Restaurant</SelectItem>
                      <SelectItem value="V002">Biryani House</SelectItem>
                    </>
                  )}
                  {newItem.category === 'homechef' && (
                    <>
                      <SelectItem value="C001">Chef Sunita</SelectItem>
                      <SelectItem value="C002">Chef Maria</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label>Dietary Options</Label>
            <div className="flex gap-4 mt-2">
              {['Vegetarian', 'Vegan', 'Gluten-Free', 'Non-Vegetarian', 'Dairy-Free'].map((diet) => (
                <label key={diet} className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={newItem.dietary.includes(diet)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewItem({...newItem, dietary: [...newItem.dietary, diet]});
                      } else {
                        setNewItem({...newItem, dietary: newItem.dietary.filter(d => d !== diet)});
                      }
                    }}
                  />
                  <span className="text-sm">{diet}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem}>Add Menu Item</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const MenuItemCard = ({ item }: { item: MenuItem }) => (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex gap-4">
        {/* Food Image */}
        <div className="w-24 h-24 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
          <img 
            src={item.image || "/placeholder.svg"} 
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded ${
                item.category === 'vendor' ? 'bg-blue-500' : 'bg-orange-500'
              } flex items-center justify-center`}>
                {item.category === 'vendor' ? (
                  <Building2 className="w-4 h-4 text-white" />
                ) : (
                  <ChefHat className="w-4 h-4 text-white" />
                )}
              </div>
              <h3 className="font-semibold text-sm">{item.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">₹{item.price}</Badge>
              <Switch 
                checked={item.status === 'active'}
                onCheckedChange={() => handleToggleStatus(item.id)}
              />
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mb-2">{item.providerName}</p>
          <p className="text-xs text-foreground mb-2">{item.description}</p>
          <p className="text-xs text-blue-600 mb-3 font-medium">{item.detailedItems}</p>
          
          <div className="flex items-center justify-between text-xs mb-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {item.preparationTime}min
              </span>
              <span>{item.calories} cal</span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {item.rating}
              </span>
            </div>
            <span className="text-muted-foreground">{item.orders} orders</span>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {item.dietary.map((diet, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {diet}
              </Badge>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1">
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleDeleteItem(item.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Menu Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage Vendor Food and Home Chef menus separately
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Menu Item
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold text-foreground">{menuItems.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Vendor Items</p>
              <p className="text-2xl font-bold text-foreground">
                {menuItems.filter(item => item.category === 'vendor').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <ChefHat className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Home Chef Items</p>
              <p className="text-2xl font-bold text-foreground">
                {menuItems.filter(item => item.category === 'homechef').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Price</p>
              <p className="text-2xl font-bold text-foreground">
                ₹{Math.round(menuItems.reduce((sum, item) => sum + item.price, 0) / menuItems.length)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="vendor">Vendor Food</SelectItem>
              <SelectItem value="homechef">Home Chef Food</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="orders">Orders</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Menu Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All Items ({menuItems.length})
          </TabsTrigger>
          <TabsTrigger value="vendor">
            <Building2 className="w-4 h-4 mr-2" />
            Vendor Food ({menuItems.filter(item => item.category === 'vendor').length})
          </TabsTrigger>
          <TabsTrigger value="homechef">
            <ChefHat className="w-4 h-4 mr-2" />
            Home Chef ({menuItems.filter(item => item.category === 'homechef').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="vendor" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredItems.filter(item => item.category === 'vendor').map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="homechef" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredItems.filter(item => item.category === 'homechef').map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <AddMenuItemDialog />
    </div>
  );
}
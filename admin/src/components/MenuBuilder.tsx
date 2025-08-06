import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Calendar as CalendarIcon, 
  UtensilsCrossed, 
  Edit, 
  Trash2,
  Eye,
  Building2,
  ChefHat,
  Clock,
  DollarSign
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  cuisine: string;
  dietary: string[];
  ingredients: string[];
  preparationTime: number;
  calories: number;
  providerType: 'vendor' | 'chef';
  providerId: string;
  providerName: string;
  availability: {
    days: string[];
    dateRange: {
      start: string;
      end: string;
    };
  };
  image?: string;
  status: 'active' | 'inactive';
}

const mockMenuItems: MenuItem[] = [
  {
    id: "M001",
    name: "Chicken Biryani",
    description: "Aromatic basmati rice with tender chicken pieces, cooked with traditional spices",
    price: 150,
    category: "Main Course",
    cuisine: "Indian",
    dietary: ["Non-Vegetarian"],
    ingredients: ["Basmati Rice", "Chicken", "Onions", "Spices", "Yogurt"],
    preparationTime: 45,
    calories: 520,
    providerType: "vendor",
    providerId: "V001",
    providerName: "Spice Palace",
    availability: {
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      dateRange: {
        start: "2024-01-25",
        end: "2024-02-25"
      }
    },
    status: "active"
  },
  {
    id: "M002",
    name: "Mediterranean Quinoa Bowl",
    description: "Healthy quinoa bowl with grilled vegetables, feta cheese and olive oil dressing",
    price: 180,
    category: "Healthy",
    cuisine: "Mediterranean",
    dietary: ["Vegetarian", "Gluten-Free"],
    ingredients: ["Quinoa", "Bell Peppers", "Zucchini", "Feta Cheese", "Olive Oil"],
    preparationTime: 25,
    calories: 380,
    providerType: "chef",
    providerId: "C001",
    providerName: "Chef Maria",
    availability: {
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      dateRange: {
        start: "2024-01-25",
        end: "2024-03-25"
      }
    },
    status: "active"
  },
  {
    id: "M003",
    name: "Margherita Pizza",
    description: "Classic Italian pizza with fresh mozzarella, tomato sauce and basil",
    price: 120,
    category: "Main Course",
    cuisine: "Italian",
    dietary: ["Vegetarian"],
    ingredients: ["Pizza Dough", "Mozzarella", "Tomato Sauce", "Fresh Basil"],
    preparationTime: 30,
    calories: 450,
    providerType: "vendor",
    providerId: "V002",
    providerName: "Taste Hub",
    availability: {
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      dateRange: {
        start: "2024-01-25",
        end: "2024-02-29"
      }
    },
    status: "active"
  }
];

export function MenuBuilder() {
  const [menuItems, setMenuItems] = useState(mockMenuItems);
  const [activeTab, setActiveTab] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const vendorItems = menuItems.filter(item => item.providerType === 'vendor');
  const chefItems = menuItems.filter(item => item.providerType === 'chef');
  const activeItems = menuItems.filter(item => item.status === 'active');

  const AddMenuItemDialog = () => (
    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Menu Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Menu Item Name</label>
              <Input placeholder="e.g. Chicken Biryani" />
            </div>
            <div>
              <label className="text-sm font-medium">Price (₹)</label>
              <Input type="number" placeholder="150" />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea placeholder="Describe the dish, ingredients, and preparation style" />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <select className="w-full p-2 border rounded">
                <option value="">Select Category</option>
                <option value="Main Course">Main Course</option>
                <option value="Appetizer">Appetizer</option>
                <option value="Dessert">Dessert</option>
                <option value="Beverage">Beverage</option>
                <option value="Healthy">Healthy</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Cuisine</label>
              <select className="w-full p-2 border rounded">
                <option value="">Select Cuisine</option>
                <option value="Indian">Indian</option>
                <option value="Chinese">Chinese</option>
                <option value="Italian">Italian</option>
                <option value="Mediterranean">Mediterranean</option>
                <option value="Continental">Continental</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Provider Type</label>
              <select className="w-full p-2 border rounded">
                <option value="vendor">Vendor Restaurant</option>
                <option value="chef">Home Chef</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Provider</label>
              <select className="w-full p-2 border rounded">
                <option value="">Select Provider</option>
                <option value="V001">Spice Palace</option>
                <option value="V002">Taste Hub</option>
                <option value="C001">Chef Maria</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Preparation Time (mins)</label>
              <Input type="number" placeholder="30" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Calories</label>
              <Input type="number" placeholder="450" />
            </div>
            <div>
              <label className="text-sm font-medium">Dietary Options</label>
              <div className="flex gap-2 mt-1">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-1" />
                  <span className="text-xs">Vegetarian</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-1" />
                  <span className="text-xs">Vegan</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-1" />
                  <span className="text-xs">Gluten-Free</span>
                </label>
              </div>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Ingredients</label>
            <Input placeholder="e.g. Rice, Chicken, Spices, Onions (comma separated)" />
          </div>
          
          <div>
            <label className="text-sm font-medium">Available Days</label>
            <div className="grid grid-cols-7 gap-2 mt-1">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <label key={day} className="flex items-center justify-center p-2 border rounded text-xs">
                  <input type="checkbox" className="mr-1" />
                  {day}
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button>Add Menu Item</Button>
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
          <h1 className="text-3xl font-bold text-foreground">Menu Builder</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage menu items for all providers
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
              <p className="text-2xl font-bold text-foreground">{vendorItems.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <ChefHat className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Chef Items</p>
              <p className="text-2xl font-bold text-foreground">{chefItems.length}</p>
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

      {/* Menu Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Items ({menuItems.length})</TabsTrigger>
          <TabsTrigger value="vendor">Vendor Food ({vendorItems.length})</TabsTrigger>
          <TabsTrigger value="chef">Home Chef ({chefItems.length})</TabsTrigger>
          <TabsTrigger value="calendar">Meal Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${
                      item.providerType === 'vendor' ? 'bg-gradient-vendor' : 'bg-gradient-chef'
                    } flex items-center justify-center`}>
                      {item.providerType === 'vendor' ? (
                        <Building2 className="w-5 h-5 text-white" />
                      ) : (
                        <ChefHat className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">{item.providerName}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">₹{item.price}</Badge>
                </div>
                
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {item.description}
                </p>
                
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Category</span>
                    <span>{item.category}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Cuisine</span>
                    <span>{item.cuisine}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Prep Time</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.preparationTime}min
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Calories</span>
                    <span>{item.calories} cal</span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">Dietary</p>
                  <div className="flex flex-wrap gap-1">
                    {item.dietary.map((diet, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {diet}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button size="sm" variant="outline">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="vendor">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {vendorItems.map((item) => (
              <Card key={item.id} className="p-4">
                {/* Same card structure as above */}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="chef">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {chefItems.map((item) => (
              <Card key={item.id} className="p-4">
                {/* Same card structure as above */}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Meal Calendar</h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </Card>
            
            <div className="lg:col-span-2 space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">
                  Scheduled Meals for {selectedDate?.toDateString()}
                </h3>
                <div className="space-y-3">
                  {menuItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-secondary rounded">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded ${
                          item.providerType === 'vendor' ? 'bg-gradient-vendor' : 'bg-gradient-chef'
                        } flex items-center justify-center`}>
                          {item.providerType === 'vendor' ? (
                            <Building2 className="w-4 h-4 text-white" />
                          ) : (
                            <ChefHat className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.providerName}</p>
                        </div>
                      </div>
                      <Badge variant="outline">₹{item.price}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AddMenuItemDialog />
    </div>
  );
}
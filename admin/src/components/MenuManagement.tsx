import { useEffect, useState } from "react";
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
import { toast

 } from "react-hot-toast";
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
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X
} from "lucide-react";
import { getMenusApi } from "@/services/api.service";
import { Menu, Pagination } from "@/lib/types";

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



export function MenuManagement() {
  const [menuItems, setMenuItems] = useState<Menu[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState("name");

  const [newItem, setNewItem] = useState({
  foodImage: "",
  foodImageFile: null as File | null,
  foodSubImages: [] as string[],
  foodSubImageFiles: [] as File[],
  foodTitle: "",
  price: 0,
  creditsRequired: 0,
  description: {
    short: "",
    long: "",
  },
  detailedItemList: "",
  vendorCategory: "vendor_food" as "vendor_food" | "home_chef",
  cuisine: "",
  prepTime: 0,
  calories: 0,
  dietaryOptions: [] as string[],
  tags: [] as string[],
  allergens: [] as string[],
  nutritionalInfo: {
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
  },
  servingSize: "",
  availableQuantity: 0,
  maxOrdersPerDay: 0,
});

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const response = await getMenusApi({page: pagination?.currentPage || 1, ...(searchTerm && {search: searchTerm})});
        setMenuItems(response.data.menus);
        setPagination(response.data.pagination);
        
      } catch (error) {
        toast.error(error.response.data.message || 'Error fetching menu items');
      } finally {
        setIsLoading(false);
      }
      
    })()
  }, [pagination?.currentPage]);

  useEffect(() => {
    if(!searchTerm || searchTerm === "" || searchTerm.length < 2) return
    const timeout = setTimeout(async() => {
      try {
        setIsLoading(true);
        await getMenusApi({page: pagination?.currentPage || 1, search: searchTerm});
        
      } catch (error) {
        toast.error(error.response.data.message || 'Error fetching menu items');
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchTerm]);
  


  const handleAddItem = () => {
    if (!newItem.foodTitle || !newItem.description || !newItem.detailedItemList || newItem.price <= 0) {
      toast.error("Please fill in all the required fields");
      return;
    }

    // const item: Menu = {
    //   ...newItem,
    //   id: `M${String(menuItems.length + 1).padStart(3, '0')}`,
    //   status: 'active',
    //   : 0,
    //   orders: 0
    // };

    // setMenuItems([...menuItems, item]);
    // setShowAddDialog(false);
    // setNewItem({
    //   name: "",
    //   description: "",
    //   detailedItems: "",
    //   price: 0,
    //   category: "vendor",
    //   cuisine: "",
    //   dietary: [],
    //   preparationTime: 0,
    //   calories: 0,
    //   providerId: "",
    //   providerName: "",
    //   image: ""
    // });

    toast.success("Menu item added successfully");
  };

  const AddMenuItemDialog = () => (
    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Menu Item</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
            
            {/* Main Food Image */}
            <div>
              <Label htmlFor="foodImage">Main Food Image *</Label>
              <Input
                id="foodImage"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setNewItem({
                      ...newItem,
                      foodImage: URL.createObjectURL(file),
                      foodImageFile: file,
                    });
                  }
                }}
              />
              {newItem.foodImage && (
                <div className="mt-2">
                  <img
                    src={newItem.foodImage}
                    alt="Preview"
                    className="h-32 w-32 rounded-md object-cover border"
                  />
                </div>
              )}
            </div>

            {/* Sub Images */}
            <div>
              <Label>Sub Images</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const previews = files.map((f) => URL.createObjectURL(f));
                  setNewItem({
                    ...newItem,
                    foodSubImages: [...newItem.foodSubImages, ...previews],
                    foodSubImageFiles: [...newItem.foodSubImageFiles, ...files],
                  });
                }}
              />
              <div className="flex gap-2 mt-2 flex-wrap">
                {newItem.foodSubImages.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img src={img} alt={`Sub ${idx}`} className="h-20 w-20 rounded-md object-cover border" />
                    <button
                      type="button"
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      onClick={() => {
                        const updatedImages = [...newItem.foodSubImages];
                        updatedImages.splice(idx, 1);
                        const updatedFiles = [...newItem.foodSubImageFiles];
                        updatedFiles.splice(idx, 1);
                        setNewItem({ 
                          ...newItem, 
                          foodSubImages: updatedImages, 
                          foodSubImageFiles: updatedFiles 
                        });
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Food Title */}
            <div>
              <Label htmlFor="foodTitle">Food Title *</Label>
              <Input
                id="foodTitle"
                value={newItem.foodTitle}
                onChange={(e) => setNewItem({...newItem, foodTitle: e.target.value})}
                placeholder="e.g., Delicious Chicken Biryani Premium"
              />
            </div>

            {/* Price and Credits */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({...newItem, price: Number(e.target.value)})}
                  placeholder="299"
                />
              </div>
              <div>
                <Label htmlFor="credits">Credits Required</Label>
                <Input
                  id="credits"
                  type="number"
                  value={newItem.creditsRequired}
                  onChange={(e) => setNewItem({...newItem, creditsRequired: Number(e.target.value)})}
                  placeholder="10"
                />
              </div>
            </div>

            {/* Category and Cuisine */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select 
                  value={newItem.vendorCategory} 
                  onValueChange={(value: "vendor_food" | "home_chef") => 
                    setNewItem({...newItem, vendorCategory: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendor_food">Vendor Food</SelectItem>
                    <SelectItem value="home_chef">Home Chef</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cuisine">Cuisine</Label>
                <Input
                  id="cuisine"
                  value={newItem.cuisine}
                  onChange={(e) => setNewItem({...newItem, cuisine: e.target.value})}
                  placeholder="e.g., Indian, Italian, Chinese"
                />
              </div>
            </div>

            {/* Prep Time and Calories */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prepTime">Preparation Time (minutes)</Label>
                <Input
                  id="prepTime"
                  type="number"
                  value={newItem.prepTime}
                  onChange={(e) => setNewItem({...newItem, prepTime: Number(e.target.value)})}
                  placeholder="45"
                />
              </div>
              <div>
                <Label htmlFor="calories">Calories per serving</Label>
                <Input
                  id="calories"
                  type="number"
                  value={newItem.calories}
                  onChange={(e) => setNewItem({...newItem, calories: Number(e.target.value)})}
                  placeholder="650"
                />
              </div>
            </div>

            {/* Serving Size and Quantities */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="servingSize">Serving Size</Label>
                <Input
                  id="servingSize"
                  value={newItem.servingSize}
                  onChange={(e) => setNewItem({...newItem, servingSize: e.target.value})}
                  placeholder="1 full plate"
                />
              </div>
              <div>
                <Label htmlFor="availableQty">Available Quantity</Label>
                <Input
                  id="availableQty"
                  type="number"
                  value={newItem.availableQuantity}
                  onChange={(e) => setNewItem({...newItem, availableQuantity: Number(e.target.value)})}
                  placeholder="20"
                />
              </div>
              <div>
                <Label htmlFor="maxOrders">Max Orders/Day</Label>
                <Input
                  id="maxOrders"
                  type="number"
                  value={newItem.maxOrdersPerDay}
                  onChange={(e) => setNewItem({...newItem, maxOrdersPerDay: Number(e.target.value)})}
                  placeholder="25"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Detailed Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Detailed Information</h3>

            {/* Descriptions */}
            <div>
              <Label htmlFor="shortDesc">Short Description</Label>
              <Input
                id="shortDesc"
                value={newItem.description.short}
                onChange={(e) => setNewItem({
                  ...newItem, 
                  description: {...newItem.description, short: e.target.value}
                })}
                placeholder="Aromatic basmati rice cooked with tender chicken pieces..."
              />
            </div>

            <div>
              <Label htmlFor="longDesc">Long Description *</Label>
              <Textarea
                id="longDesc"
                value={newItem.description.long}
                onChange={(e) => setNewItem({
                  ...newItem, 
                  description: {...newItem.description, long: e.target.value}
                })}
                placeholder="A traditional recipe passed down through generations..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="detailedItems">Detailed Item List *</Label>
              <Textarea
                id="detailedItems"
                value={newItem.detailedItemList}
                onChange={(e) => setNewItem({...newItem, detailedItemList: e.target.value})}
                placeholder="Basmati Rice, Chicken (500g), Yogurt, Onions..."
                rows={3}
              />
            </div>

            {/* Dietary Options */}
            <div>
              <Label>Dietary Options</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["vegetarian", "non-vegetarian", "vegan", "gluten-free", "dairy-free", "nut-free"].map((option) => (
                  <Badge
                    key={option}
                    variant={newItem.dietaryOptions.includes(option) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setNewItem({
                      ...newItem,
                      // dietaryOptions: toggleArrayItem(newItem.dietaryOptions, option)
                    })}
                  >
                    {option}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["spicy", "mild", "sweet", "traditional", "aromatic", "healthy", "comfort-food"].map((tag) => (
                  <Badge
                    key={tag}
                    variant={newItem.tags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setNewItem({
                      ...newItem,
                      // tags: toggleArrayItem(newItem.tags, tag)
                    })}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Allergens */}
            <div>
              <Label>Allergens</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["dairy", "nuts", "gluten", "eggs", "soy", "shellfish", "fish"].map((allergen) => (
                  <Badge
                    key={allergen}
                    variant={newItem.allergens.includes(allergen) ? "destructive" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setNewItem({
                      ...newItem,
                      // allergens: toggleArrayItem(newItem.allergens, allergen)
                    })}
                  >
                    {allergen}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Nutritional Information */}
            <div>
              <Label className="text-base font-medium">Nutritional Information (per serving)</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <div>
                  <Label htmlFor="protein" className="text-xs">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={newItem.nutritionalInfo.protein}
                    onChange={(e) => setNewItem({
                      ...newItem,
                      nutritionalInfo: {...newItem.nutritionalInfo, protein: Number(e.target.value)}
                    })}
                    placeholder="35"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="carbs" className="text-xs">Carbs (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={newItem.nutritionalInfo.carbs}
                    onChange={(e) => setNewItem({
                      ...newItem,
                      nutritionalInfo: {...newItem.nutritionalInfo, carbs: Number(e.target.value)}
                    })}
                    placeholder="75"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="fat" className="text-xs">Fat (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    value={newItem.nutritionalInfo.fat}
                    onChange={(e) => setNewItem({
                      ...newItem,
                      nutritionalInfo: {...newItem.nutritionalInfo, fat: Number(e.target.value)}
                    })}
                    placeholder="20"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="fiber" className="text-xs">Fiber (g)</Label>
                  <Input
                    id="fiber"
                    type="number"
                    value={newItem.nutritionalInfo.fiber}
                    onChange={(e) => setNewItem({
                      ...newItem,
                      nutritionalInfo: {...newItem.nutritionalInfo, fiber: Number(e.target.value)}
                    })}
                    placeholder="3"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="sugar" className="text-xs">Sugar (g)</Label>
                  <Input
                    id="sugar"
                    type="number"
                    value={newItem.nutritionalInfo.sugar}
                    onChange={(e) => setNewItem({
                      ...newItem,
                      nutritionalInfo: {...newItem.nutritionalInfo, sugar: Number(e.target.value)}
                    })}
                    placeholder="8"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="sodium" className="text-xs">Sodium (mg)</Label>
                  <Input
                    id="sodium"
                    type="number"
                    value={newItem.nutritionalInfo.sodium}
                    onChange={(e) => setNewItem({
                      ...newItem,
                      nutritionalInfo: {...newItem.nutritionalInfo, sodium: Number(e.target.value)}
                    })}
                    placeholder="890"
                    className="h-8"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t">
          <Button onClick={handleAddItem} className="flex-1">
            <Plus className="w-4 h-4 mr-2" />
            Add Menu Item
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setShowAddDialog(false);
              // resetNewItem();
            }}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const handleDeleteItem = (id: string) => {
    // setMenuItems(menuItems.filter(item => item.id !== id));
    toast.success("Menu item deleted successfully");
  };

  const handleToggleStatus = (id: string) => {
    // setMenuItems(menuItems.map(item => 
    //   item.id === id 
    //     ? { ...item, status: item.status === 'active' ? 'inactive' : 'active' }
    //     : item
    // ));
  };

  {/* Main Food Image */}
<div>
  <Label htmlFor="foodImage">Main Food Image</Label>
  <Input
    id="foodImage"
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) {
        setNewItem({
          ...newItem,
          foodImage: URL.createObjectURL(file), // for preview
          foodImageFile: file, // keep actual file if you’ll upload to server
        });
      }
    }}
  />
  {newItem.foodImage && (
    <img
      src={newItem.foodImage}
      alt="Preview"
      className="mt-2 h-24 rounded-md object-cover"
    />
  )}
</div>

{/* Sub Images */}
<div>
  <Label>Sub Images</Label>
  <Input
    type="file"
    accept="image/*"
    multiple
    onChange={(e) => {
      const files = Array.from(e.target.files || []);
      const previews = files.map((f) => URL.createObjectURL(f));
      setNewItem({
        ...newItem,
        foodSubImages: [...newItem.foodSubImages, ...previews],
        foodSubImageFiles: [...(newItem.foodSubImageFiles || []), ...files],
      });
    }}
  />
  <div className="flex gap-2 mt-2 flex-wrap">
    {newItem.foodSubImages.map((img, idx) => (
      <div key={idx} className="relative">
        <img src={img} alt={`Sub ${idx}`} className="h-20 w-20 rounded-md object-cover" />
        <button
          type="button"
          className="absolute top-0 right-0 bg-red-500 text-white rounded-full px-1"
          onClick={() => {
            const updated = [...newItem.foodSubImages];
            updated.splice(idx, 1);
            const updatedFiles = [...(newItem.foodSubImageFiles || [])];
            updatedFiles.splice(idx, 1);
            setNewItem({ ...newItem, foodSubImages: updated, foodSubImageFiles: updatedFiles });
          }}
        >
          ✕
        </button>
      </div>
    ))}
  </div>
</div>



  const MenuItemCard = ({ item }: { item: Menu }) => (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex gap-4">
        {/* Food Image */}
        <div className="w-24 h-24 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
          <img 
            src={item.foodImage || "/placeholder.svg"} 
            alt={item.foodTitle}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded ${
                item.vendorCategory === 'vendor' ? 'bg-blue-500' : 'bg-orange-500'
              } flex items-center justify-center`}>
                {item.vendorCategory === 'vendor' ? (
                  <Building2 className="w-4 h-4 text-white" />
                ) : (
                  <ChefHat className="w-4 h-4 text-white" />
                )}
              </div>
              <h3 className="font-semibold text-sm">{item.foodTitle}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">₹{item.price}</Badge>
              {/* <Switch 
                checked={item.status === 'active'}
                onCheckedChange={() => handleToggleStatus(item._id)}
              /> */}
            </div>
          </div>
          
          {/* <p className="text-xs text-muted-foreground mb-2">{item.providerName}</p> */}
          <p className="text-xs text-foreground mb-2">{item.description.long}</p>
          <p className="text-xs text-blue-600 mb-3 font-medium">{item.detailedItemList}</p>
          
          <div className="flex items-center justify-between text-xs mb-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {item.prepTime}min
              </span>
              <span>{item.calories} cal</span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {item.rating.average}
              </span>
            </div>
            {/* <span className="text-muted-foreground">{item.orders} orders</span> */}
          </div>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {item.dietaryOptions.map((diet, index) => (
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
            {/* <Button size="sm" variant="outline" className="flex-1">
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button> */}
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleDeleteItem(item._id)}
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

      <Card className="p-4 flex items-center gap-5">
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
          
        </div>
        <div>Total Items: {pagination?.totalItems || 0}</div>
      </Card>

      {/* Menu Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All Items
          </TabsTrigger>
          <TabsTrigger value="vendor">
            <Building2 className="w-4 h-4 mr-2" />
            Vendor Food 
          </TabsTrigger>
          <TabsTrigger value="homechef">
            <ChefHat className="w-4 h-4 mr-2" />
            Home Chef 
          </TabsTrigger>
        </TabsList>
        { isLoading ? <Loader2 className="mx-auto animate-spin" /> : <>
        
          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {menuItems.map((item) => (
                <MenuItemCard key={item._id} item={item} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="vendor" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {menuItems.filter(item => item.vendorCategory === 'vendor').map((item) => (
                <MenuItemCard key={item._id} item={item} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="homechef" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {menuItems.filter(item => item.vendorCategory === 'home_chef').map((item) => (
                <MenuItemCard key={item._id} item={item} />
              ))}
            </div>
          </TabsContent>
        </>}
      </Tabs>

      {
        pagination && (
          <div className="flex items-center justify-center gap-5">
            <button
              disabled={pagination.currentPage === 1}
              className="p-2 rounded-xl border hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed"
              onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
            >
              <ChevronLeft size={20} />
            </button>

            <div className="text-sm font-medium">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>

            <button
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-2 rounded-xl border hover:bg-gray-500 disabled:opacity-20 disabled:cursor-not-allowed"
              onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )
      }

      <AddMenuItemDialog/>
    </div>
  );
}
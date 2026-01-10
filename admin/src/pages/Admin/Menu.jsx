import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, ChefHat, Clock, Zap, Loader2, Eye, EyeOff, Star } from 'lucide-react';
import { createMenuApi, updateMenuApi, deleteMenuApi, toggleMenuAvailabilityApi, getMenusApi } from '../../service/api.service';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [selectedDietaryOptions, setSelectedDietaryOptions] = useState('');
  const [selectedTags, setSelectedTags] = useState('');
  const [isAvailable, setIsAvailable] = useState('all');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory !== 'all' && { vendorCategory: selectedCategory }),
        ...(selectedCuisine !== 'all' && { cuisine: selectedCuisine }),
        ...(selectedDietaryOptions && { dietaryOptions: selectedDietaryOptions }),
        ...(selectedTags && { tags: selectedTags }),
        ...(isAvailable !== 'all' && { isAvailable: isAvailable === 'true' }),
        ...(sortBy && { sortBy: sortBy }),
        ...(sortBy && { sortOrder: sortOrder }),
      };

      const res = await getMenusApi(params);
      setMenuItems(res.data.menus);
      setFilteredItems(res.data.menus);
      setTotalPages(res.data.pagination.totalPages);

    } catch (error) {
      toast.error(error.response?.data?.message || 'Error fetching menus');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, [
    searchTerm, selectedCategory, selectedCuisine, currentPage,
    selectedDietaryOptions, selectedTags, isAvailable, sortBy, sortOrder
  ]);

  const [formData, setFormData] = useState({
    foodImage: '',
    foodSubImages: [],
    foodTitle: '',
    price: '150',
    description: { short: '', long: 'Delicious home-cooked meal prepared with fresh ingredients and authentic spices.' },
    detailedItemList: 'Rice, Dal, Seasonal Vegetable, 2 Rotis, Salad',
    vendorCategory: 'home_chef',
    cuisine: 'Indian',
    prepTime: '45',
    calories: '500',
    dietaryOptions: '',
    tags: ''
  });

  const categories = ['all', 'home_chef', 'food_vendor'];
  const cuisines = ['all', 'Indian', 'Italian', 'Chinese', 'Mexican', 'Thai', 'American'];
  const sortOptions = [
    { value: 'price', label: 'Price' },
    { value: 'rating.average', label: 'Rating' },
    { value: 'prepTime', label: 'Prep Time' },
    { value: 'calories', label: 'Calories' },
    { value: 'createdAt', label: 'Date Created' }
  ];

  const currentItems = filteredItems;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      foodImage: '',
      foodSubImages: [],
      foodTitle: '',
      price: '150',
      description: { short: '', long: 'Delicious home-cooked meal prepared with fresh ingredients and authentic spices.' },
      detailedItemList: 'Rice, Dal, Seasonal Vegetable, 2 Rotis, Salad',
      vendorCategory: 'home_chef',
      cuisine: 'Indian',
      prepTime: '45',
      calories: '500',
      dietaryOptions: '',
      tags: ''
    });
    setShowCreateForm(false);
    setEditingItem(null);
  };

  const handleSubmit = async(e) => {
    e.preventDefault();

    const newItem = {
      ...formData,
      price: Number(formData.price),
      prepTime: Number(formData.prepTime),
      calories: Number(formData.calories),
      foodSubImages: formData.foodSubImages.filter(img => img.trim()),
      tags: typeof formData.tags === 'string'
        ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : formData.tags,
      dietaryOptions: typeof formData.dietaryOptions === 'string'
        ? formData.dietaryOptions.split(",").map((d) => d.trim()).filter(Boolean)
        : formData.dietaryOptions,
    };

    try {
      setIsCreating(true);

      if (editingItem) {
        await updateMenuApi(editingItem._id, newItem);
        toast.success("Menu item updated successfully");
      } else {
        await createMenuApi(newItem);
        toast.success("Menu item created successfully");
      }

      resetForm();
      await fetchMenus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error in processing menu item.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (item) => {
    // Only extract the fields we need, excluding MongoDB metadata
    setFormData({
      foodImage: item.foodImage || '',
      foodSubImages: item.foodSubImages || [''],
      foodTitle: item.foodTitle || '',
      price: item.price || '',
      description: item.description || { short: '', long: '' },
      detailedItemList: item.detailedItemList || '',
      vendorCategory: item.vendorCategory || 'home_chef',
      cuisine: item.cuisine || '',
      prepTime: item.prepTime || '',
      calories: item.calories || '',
      dietaryOptions: Array.isArray(item.dietaryOptions) ? item.dietaryOptions.join(', ') : (item.dietaryOptions || ''),
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || '')
    });
    setEditingItem(item);
    setShowCreateForm(true);
  };

  const handleDelete = async (item) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteMenuApi(item._id);
        toast.success("Menu item deleted successfully");
        await fetchMenus();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error deleting menu item');
      }
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await toggleMenuAvailabilityApi(item._id);
      toast.success(`Menu item ${item.isAvailable ? 'disabled' : 'enabled'} successfully`);
      await fetchMenus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error toggling availability');
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedCuisine('all');
    setSelectedDietaryOptions('');
    setSelectedTags('');
    setIsAvailable('all');
    setSortBy('');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-6 scrollbar-hide">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Food Menu</h1>
          <p className="text-orange-300 text-sm mt-1">Manage your food menu items</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          icon={Plus}
          className="shadow-lg"
        >
          Add New Item
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          
          {/* Quick Filters */}
          <div className="flex flex-wrap gap-3">
            <Input.Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={categories.map(cat => ({
                value: cat,
                label: cat === 'all' ? 'All Categories' : cat.replace('_', ' ').toUpperCase()
              }))}
              containerClassName="min-w-[150px]"
            />
            
            <Input.Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={sortOptions}
              containerClassName="min-w-[130px]"
            />
            
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              icon={Filter}
              size="sm"
            >
              {showAdvancedFilters ? 'Hide' : 'More'} Filters
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-orange-500/30">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Input.Select
                label="Cuisine"
                value={selectedCuisine}
                onChange={(e) => setSelectedCuisine(e.target.value)}
                options={cuisines.map(cuisine => ({
                  value: cuisine,
                  label: cuisine === 'all' ? 'All Cuisines' : cuisine
                }))}
              />
              
              <Input
                label="Dietary Options"
                placeholder="vegetarian,vegan"
                value={selectedDietaryOptions}
                onChange={(e) => setSelectedDietaryOptions(e.target.value)}
              />
              
              <Input
                label="Tags"
                placeholder="spicy,healthy"
                value={selectedTags}
                onChange={(e) => setSelectedTags(e.target.value)}
              />
              
              <Input.Select
                label="Availability"
                value={isAvailable}
                onChange={(e) => setIsAvailable(e.target.value)}
                options={[
                  { value: 'all', label: 'All Items' },
                  { value: 'true', label: 'Available Only' },
                  { value: 'false', label: 'Unavailable Only' }
                ]}
              />
            </div>
            
            <div className="flex justify-center mt-4">
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Menu Items Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentItems.map((item) => (
            <Card key={item._id} hover className="overflow-hidden">
              {/* Image */}
              <div className="relative h-48 bg-[#1E2938]">
                <img
                  src={item.foodImage}
                  alt={item.foodTitle}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
                  }}
                />
                <div className="absolute top-3 right-3 bg-orange-500 text-white rounded-lg px-2 py-1 text-sm font-semibold shadow-lg">
                  ₹{item.price}
                </div>
                <div className={`absolute top-3 left-3 text-white rounded-lg px-2 py-1 text-xs font-medium shadow-lg ${
                  item.isAvailable ? 'bg-green-600' : 'bg-red-600'
                }`}>
                  {item.isAvailable ? 'Available' : 'Unavailable'}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {item.foodTitle}
                    </h3>
                    
                      {/* <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-white">
                          {item.rating.average.toFixed(1)} ({item.rating.totalReviews || 0})
                        </span>
                      </div> */}
                  </div>
                  
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className={`p-1.5 rounded-md transition-colors ${
                        item.isAvailable 
                          ? 'text-green-400 hover:bg-green-900/30' 
                          : 'text-orange-300 hover:bg-orange-500/20'
                      }`}
                      title={item.isAvailable ? 'Disable item' : 'Enable item'}
                    >
                      {item.isAvailable ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded-md transition-colors"
                      title="Edit item"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-md transition-colors"
                      title="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-white text-sm mb-3 line-clamp-2">
                  {item.description.short}
                </p>

                <div className="flex items-center gap-4 text-xs text-orange-300 mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.prepTime}m
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {item.calories} cal
                  </div>
                  <div className="flex items-center gap-1">
                    <ChefHat className="w-3 h-3" />
                    {item.cuisine}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-white">
                    {item.vendorCategory.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.tags.slice(0, 2).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300"
                    >
                      {tag}
                    </span>
                  ))}
                  {item.tags.length > 2 && (
                    <span className="text-xs text-orange-300">+{item.tags.length - 2}</span>
                  )}
                </div>

                {/* Dietary Options */}
                <div className="flex flex-wrap gap-1">
                  {item.dietaryOptions.slice(0, 2).map((option, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300"
                    >
                      {option}
                    </span>
                  ))}
                  {item.dietaryOptions.length > 2 && (
                    <span className="text-xs text-orange-300">+{item.dietaryOptions.length - 2}</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredItems.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 text-orange-400">
            <ChefHat className="w-full h-full" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No menu items found</h3>
          <p className="text-orange-300 mb-4">
            {searchTerm || selectedCategory !== 'all' || selectedCuisine !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first menu item to get started'
            }
          </p>
          {!searchTerm && selectedCategory === 'all' && selectedCuisine === 'all' && (
            <Button onClick={() => setShowCreateForm(true)} icon={Plus}>
              Create First Item
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>

            <span className="text-white text-sm px-3">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>

          </div>
        )}


      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={resetForm}
        title={editingItem ? 'Edit Menu Item' : 'Create New Menu Item'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6 scrollbar-hide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white mb-4">Basic Information</h3>
              
              <Input
                label="Food Title"
                name="foodTitle"
                value={formData.foodTitle}
                onChange={handleInputChange}
                required
              />

              <Input
                label="Main Image URL"
                type="url"
                name="foodImage"
                value={formData.foodImage}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                required
              />
            </div>

            {/* Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white mb-4">Details</h3>
              
              <Input.TextArea
                label="Short Description"
                name="description.short"
                value={formData.description.short}
                onChange={handleInputChange}
                rows={2}
                required
              />

              <div>
                <Input.Select
                  label="Vendor Category"
                  name="vendorCategory"
                  value={formData.vendorCategory}
                  onChange={handleInputChange}
                  options={[
                    { value: 'home_chef', label: 'Home Chef' },
                    { value: 'food_vendor', label: 'Vendor' }
                  ]}
                  required
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <Modal.Footer>
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isCreating}
              disabled={isCreating}
            >
              {editingItem ? 'Update Item' : 'Create Item'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
};

export default Menu;
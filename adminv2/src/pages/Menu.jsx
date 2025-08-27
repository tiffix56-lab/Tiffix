import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, ChefHat, Clock, Zap, Loader2, Eye, EyeOff, Star } from 'lucide-react';
import { createMenuApi, updateMenuApi, deleteMenuApi, toggleMenuAvailabilityApi, getMenusApi } from '../service/api.service';
import toast from 'react-hot-toast';

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [caloriesRange, setCaloriesRange] = useState({ min: '', max: '' });
  const [prepTimeRange, setPrepTimeRange] = useState({ min: '', max: '' });
  const [creditsRange, setCreditsRange] = useState({ min: '', max: '' });
  const [minRating, setMinRating] = useState('');
  const [selectedDietaryOptions, setSelectedDietaryOptions] = useState('');
  const [selectedTags, setSelectedTags] = useState('');
  const [excludeAllergens, setExcludeAllergens] = useState('');
  const [isAvailable, setIsAvailable] = useState('all');
  const [hasCreditsRequired, setHasCreditsRequired] = useState('all');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const params = {
          page: currentPage,
          limit: itemsPerPage,
          ...(searchTerm && { search: searchTerm }),
          ...(selectedCategory !== 'all' && { vendorCategory: selectedCategory }),
          ...(selectedCuisine !== 'all' && { cuisine: selectedCuisine }),
          ...(priceRange.min && { minPrice: priceRange.min }),
          ...(priceRange.max && { maxPrice: priceRange.max }),
          ...(caloriesRange.min && { minCalories: caloriesRange.min }),
          ...(caloriesRange.max && { maxCalories: caloriesRange.max }),
          ...(prepTimeRange.min && { minPrepTime: prepTimeRange.min }),
          ...(prepTimeRange.max && { maxPrepTime: prepTimeRange.max }),
          ...(creditsRange.min && { minCredits: creditsRange.min }),
          ...(creditsRange.max && { maxCredits: creditsRange.max }),
          ...(minRating && { minRating: minRating }),
          ...(selectedDietaryOptions && { dietaryOptions: selectedDietaryOptions }),
          ...(selectedTags && { tags: selectedTags }),
          ...(excludeAllergens && { allergens: excludeAllergens }),
          ...(isAvailable !== 'all' && { isAvailable: isAvailable === 'true' }),
          ...(hasCreditsRequired !== 'all' && { hasCreditsRequired: hasCreditsRequired === 'true' }),
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
    })()
  }, [
    searchTerm, selectedCategory, selectedCuisine, currentPage, priceRange, 
    caloriesRange, prepTimeRange, creditsRange, minRating, selectedDietaryOptions, 
    selectedTags, excludeAllergens, isAvailable, hasCreditsRequired, sortBy, sortOrder
  ]);

  const [formData, setFormData] = useState({
    foodImage: '',
    foodSubImages: [''],
    foodTitle: '',
    price: '',
    creditsRequired: '',
    description: { short: '', long: '' },
    detailedItemList: '',
    vendorCategory: 'home_chef',
    cuisine: '',
    prepTime: '',
    calories: '',
    dietaryOptions: '',
    tags: '',
    allergens: '',
    nutritionalInfo: {
      protein: '',
      carbs: '',
      fat: '',
      fiber: '',
      sugar: '',
      sodium: ''
    },
    servingSize: '',
    availableQuantity: '',
    maxOrdersPerDay: ''
  });

  const categories = ['all', 'home_chef', 'vendor'];
  const cuisines = ['all', 'Indian', 'Italian', 'Chinese', 'Mexican', 'Thai', 'American'];
  const sortOptions = [
    { value: '', label: 'Default' },
    { value: 'price', label: 'Price' },
    { value: 'rating.average', label: 'Rating' },
    { value: 'prepTime', label: 'Prep Time' },
    { value: 'calories', label: 'Calories' },
    { value: 'availableQuantity', label: 'Available Quantity' },
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

  const handleArrayInput = (name, value) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({ ...prev, [name]: array }));
  };

  const handleSubImagesChange = (index, value) => {
    const newSubImages = [...formData.foodSubImages];
    newSubImages[index] = value;
    setFormData(prev => ({ ...prev, foodSubImages: newSubImages }));
  };

  const addSubImageField = () => {
    setFormData(prev => ({
      ...prev,
      foodSubImages: [...prev.foodSubImages, '']
    }));
  };

  const removeSubImageField = (index) => {
    const newSubImages = formData.foodSubImages.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, foodSubImages: newSubImages }));
  };

  const resetForm = () => {
    setFormData({
      foodImage: '',
      foodSubImages: [''],
      foodTitle: '',
      price: '',
      creditsRequired: '',
      description: { short: '', long: '' },
      detailedItemList: '',
      vendorCategory: 'home_chef',
      cuisine: '',
      prepTime: '',
      calories: '',
      dietaryOptions: '',
      tags: '',
      allergens: '',
      nutritionalInfo: {
        protein: '',
        carbs: '',
        fat: '',
        fiber: '',
        sugar: '',
        sodium: ''
      },
      servingSize: '',
      availableQuantity: '',
      maxOrdersPerDay: ''
    });
    setShowCreateForm(false);
    setEditingItem(null);
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    
    const newItem = {
      ...formData,
      id: editingItem ? editingItem.id : Date.now(),
      price: Number(formData.price),
      creditsRequired: Number(formData.creditsRequired),
      prepTime: Number(formData.prepTime),
      calories: Number(formData.calories),
      availableQuantity: Number(formData.availableQuantity),
      maxOrdersPerDay: Number(formData.maxOrdersPerDay),
      nutritionalInfo: {
        protein: Number(formData.nutritionalInfo.protein),
        carbs: Number(formData.nutritionalInfo.carbs),
        fat: Number(formData.nutritionalInfo.fat),
        fiber: Number(formData.nutritionalInfo.fiber),
        sugar: Number(formData.nutritionalInfo.sugar),
        sodium: Number(formData.nutritionalInfo.sodium)
      },
      foodSubImages: formData.foodSubImages.filter(img => img.trim()),
      allergens: typeof formData.allergens === 'string' 
        ? formData.allergens.split(",").map((a) => a.trim()).filter(Boolean)
        : formData.allergens,
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
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error in processing menu item.');
    } finally {
      setIsCreating(false);  
    }
  };

  const handleEdit = (item) => {
    setFormData({
      ...item,
      dietaryOptions: Array.isArray(item.dietaryOptions) ? item.dietaryOptions.join(', ') : (item.dietaryOptions || ''),
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''),
      allergens: Array.isArray(item.allergens) ? item.allergens.join(', ') : (item.allergens || ''),
      nutritionalInfo: {
        protein: item.nutritionalInfo?.protein || '',
        carbs: item.nutritionalInfo?.carbs || '',
        fat: item.nutritionalInfo?.fat || '',
        fiber: item.nutritionalInfo?.fiber || '',
        sugar: item.nutritionalInfo?.sugar || '',
        sodium: item.nutritionalInfo?.sodium || ''
      }
    });
    setEditingItem(item);
    setShowCreateForm(true);
  };

  const handleDelete = async (item) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteMenuApi(item._id);
        toast.success("Menu item deleted successfully");
        // Refresh the menu list
        window.location.reload();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error deleting menu item');
      }
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await toggleMenuAvailabilityApi(item._id);
      toast.success(`Menu item ${item.isAvailable ? 'disabled' : 'enabled'} successfully`);
      // Refresh the menu list
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error toggling availability');
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedCuisine('all');
    setPriceRange({ min: '', max: '' });
    setCaloriesRange({ min: '', max: '' });
    setPrepTimeRange({ min: '', max: '' });
    setCreditsRange({ min: '', max: '' });
    setMinRating('');
    setSelectedDietaryOptions('');
    setSelectedTags('');
    setExcludeAllergens('');
    setIsAvailable('all');
    setHasCreditsRequired('all');
    setSortBy('');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="">
        <div className="mb-8">
          <h1 className="text-3xl font-bold  mb-2">Food Menu Management</h1>
          <p className="">Create, manage, and organize your food menu items</p>
        </div>

        {/* Controls */}
        <div className="bg-gray-700 rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-4">
            {/* Top Row - Search, Basic Filters, Add Button */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <select
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      Sort by {option.label}
                    </option>
                  ))}
                </select>

                {sortBy && (
                  <select
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  {showAdvancedFilters ? 'Hide' : 'Show'} Filters
                </button>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add New Item
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {/* Cuisine Filter */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Cuisine</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black"
                      value={selectedCuisine}
                      onChange={(e) => setSelectedCuisine(e.target.value)}
                    >
                      {cuisines.map(cuisine => (
                        <option key={cuisine} value={cuisine}>
                          {cuisine === 'all' ? 'All Cuisines' : cuisine}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Price Range (₹)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        className="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        className="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Calories Range */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Calories Range</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        className="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black"
                        value={caloriesRange.min}
                        onChange={(e) => setCaloriesRange(prev => ({ ...prev, min: e.target.value }))}
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        className="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black"
                        value={caloriesRange.max}
                        onChange={(e) => setCaloriesRange(prev => ({ ...prev, max: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Prep Time Range */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Prep Time (min)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        className="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black"
                        value={prepTimeRange.min}
                        onChange={(e) => setPrepTimeRange(prev => ({ ...prev, min: e.target.value }))}
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        className="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black"
                        value={prepTimeRange.max}
                        onChange={(e) => setPrepTimeRange(prev => ({ ...prev, max: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Credits Range */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Credits Range</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        className="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black"
                        value={creditsRange.min}
                        onChange={(e) => setCreditsRange(prev => ({ ...prev, min: e.target.value }))}
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        className="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black"
                        value={creditsRange.max}
                        onChange={(e) => setCreditsRange(prev => ({ ...prev, max: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Min Rating */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Minimum Rating</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      placeholder="4.0"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black"
                      value={minRating}
                      onChange={(e) => setMinRating(e.target.value)}
                    />
                  </div>

                  {/* Dietary Options */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Dietary Options</label>
                    <input
                      type="text"
                      placeholder="vegetarian,vegan"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black"
                      value={selectedDietaryOptions}
                      onChange={(e) => setSelectedDietaryOptions(e.target.value)}
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Tags</label>
                    <input
                      type="text"
                      placeholder="spicy,healthy"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black"
                      value={selectedTags}
                      onChange={(e) => setSelectedTags(e.target.value)}
                    />
                  </div>

                  {/* Availability */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Availability</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black"
                      value={isAvailable}
                      onChange={(e) => setIsAvailable(e.target.value)}
                    >
                      <option value="all">All Items</option>
                      <option value="true">Available Only</option>
                      <option value="false">Unavailable Only</option>
                    </select>
                  </div>

                  {/* Credits Required */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Credits Required</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black"
                      value={hasCreditsRequired}
                      onChange={(e) => setHasCreditsRequired(e.target.value)}
                    >
                      <option value="all">All Items</option>
                      <option value="true">With Credits</option>
                      <option value="false">No Credits</option>
                    </select>
                  </div>

                  {/* Exclude Allergens */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Exclude Allergens</label>
                    <input
                      type="text"
                      placeholder="nuts,dairy"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black"
                      value={excludeAllergens}
                      onChange={(e) => setExcludeAllergens(e.target.value)}
                    />
                  </div>
                </div>

                {/* Clear Filters Button */}
                <div className="flex justify-center">
                  <button
                    onClick={clearAllFilters}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-2xl bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-neutral-500 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gray-600 border-b px-6 py-4">
                <h2 className="text-xl font-semibold">
                  {editingItem ? 'Edit Menu Item' : 'Create New Menu Item'}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Food Title</label>
                      <input
                        type="text"
                        name="foodTitle"
                        value={formData.foodTitle}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Credits Required</label>
                        <input
                          type="number"
                          name="creditsRequired"
                          value={formData.creditsRequired}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Main Image URL</label>
                      <input
                        type="url"
                        name="foodImage"
                        value={formData.foodImage}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com/image.jpg"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sub Images</label>
                      {formData.foodSubImages.map((url, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => handleSubImagesChange(index, e.target.value)}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com/sub-image.jpg"
                          />
                          {formData.foodSubImages.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSubImageField(index)}
                              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addSubImageField}
                        className="text-white text-sm hover:cursor-pointer"
                      >
                        + Add another sub image
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Details</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                      <textarea
                        name="description.short"
                        value={formData.description.short}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Long Description</label>
                      <textarea
                        name="description.long"
                        value={formData.description.long}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Item List</label>
                      <textarea
                        name="detailedItemList"
                        value={formData.detailedItemList}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="Ingredient 1, Ingredient 2, Ingredient 3..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Category</label>
                        <select
                          name="vendorCategory"
                          value={formData.vendorCategory}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="home_chef" className='bg-black'>Home Chef</option>
                          <option value="food_vendor" className='bg-black'>Vendor</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine</label>
                        <input
                          type="text"
                          name="cuisine"
                          value={formData.cuisine}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Food Info</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (min)</label>
                        <input
                          type="number"
                          name="prepTime"
                          value={formData.prepTime}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
                        <input
                          type="number"
                          name="calories"
                          value={formData.calories}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Serving Size</label>
                      <input
                        type="text"
                        name="servingSize"
                        value={formData.servingSize}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Available Quantity</label>
                        <input
                          type="number"
                          name="availableQuantity"
                          value={formData.availableQuantity}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Orders/Day</label>
                        <input
                          type="number"
                          name="maxOrdersPerDay"
                          value={formData.maxOrdersPerDay}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Nutritional Info (per serving)</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
                        <input
                          type="number"
                          name="nutritionalInfo.protein"
                          value={formData.nutritionalInfo.protein}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Carbs (g)</label>
                        <input
                          type="number"
                          name="nutritionalInfo.carbs"
                          value={formData.nutritionalInfo.carbs}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fat (g)</label>
                        <input
                          type="number"
                          name="nutritionalInfo.fat"
                          value={formData.nutritionalInfo.fat}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fiber (g)</label>
                        <input
                          type="number"
                          name="nutritionalInfo.fiber"
                          value={formData.nutritionalInfo.fiber}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sugar (g)</label>
                        <input
                          type="number"
                          name="nutritionalInfo.sugar"
                          value={formData.nutritionalInfo.sugar}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sodium (mg)</label>
                        <input
                          type="number"
                          name="nutritionalInfo.sodium"
                          value={formData.nutritionalInfo.sodium}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Tags & Options</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Options</label>
                      <input
                        type="text"
                        value={formData.dietaryOptions}
                        onChange={(e) => setFormData({ ...formData, dietaryOptions: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="vegetarian, vegan, gluten-free..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="spicy, traditional, aromatic..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Allergens</label>
                      <input
                        type="text"
                        value={formData.allergens}
                        onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="dairy, nuts, gluten..."
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={isCreating}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
                  >
                    {editingItem ? 'Update Item' : 'Create Item'}
                  </button>
                  {isCreating && (
                    <Loader2 className="animate-spin m-2" />
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {currentItems.map((item) => (
            <div key={item.id} className=" rounded-lg bg-neutral-800 border-1 shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              <div className="relative h-48 bg-gray-200">
                <img
                  src={item.foodImage}
                  alt={item.foodTitle}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
                  }}
                />
                <div className="absolute top-4 right-4 bg-white rounded-full px-2 py-1 text-sm font-semibold text-green-600">
                  ₹{item.price}
                </div>
                <div className="absolute top-4 left-4 flex flex-col gap-1">
                  <div className="bg-blue-500 text-white rounded-full px-2 py-1 text-xs font-medium">
                    {item.creditsRequired} credits
                  </div>
                  <div className={`text-white rounded-full px-2 py-1 text-xs font-medium ${
                    item.isAvailable ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold truncate">
                      {item.foodTitle}
                    </h3>
                    {item.rating && item.rating.average && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-600">
                          {item.rating.average.toFixed(1)} ({item.rating.count} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className={`p-1 rounded ${
                        item.isAvailable 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      title={item.isAvailable ? 'Disable item' : 'Enable item'}
                    >
                      {item.isAvailable ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit item"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className=" text-sm mb-3 line-clamp-2">
                  {item.description.short}
                </p>

                <div className="flex items-center gap-4 text-sm  mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {item.prepTime}m
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    {item.calories} cal
                  </div>
                  <div className="flex items-center gap-1">
                    <ChefHat className="w-4 h-4" />
                    {item.cuisine}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {item.vendorCategory.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-xs ">
                    {item.availableQuantity} available
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                    >
                      {tag}
                    </span>
                  ))}
                  {item.tags.length > 3 && (
                    <span className="text-xs text-gray-500">+{item.tags.length - 3} more</span>
                  )}
                </div>

                {/* Dietary Options */}
                <div className="flex flex-wrap gap-1">
                  {item.dietaryOptions.map((option, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700"
                    >
                      {option}
                    </span>
                  ))}
                </div>

                {/* Nutritional Info Preview */}
                {item.nutritionalInfo && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2 text-xs ">
                      <div>Protein: {item.nutritionalInfo.protein}g</div>
                      <div>Carbs: {item.nutritionalInfo.carbs}g</div>
                      <div>Fat: {item.nutritionalInfo.fat}g</div>
                      <div>Fiber: {item.nutritionalInfo.fiber}g</div>
                      <div>Sugar: {item.nutritionalInfo.sugar}g</div>
                      <div>Sodium: {item.nutritionalInfo.sodium}g</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
              <ChefHat className="w-full h-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== 'all' || selectedCuisine !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first menu item to get started'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && selectedCuisine === 'all' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Create First Item
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  const start = Math.max(1, currentPage - 2);
                  const end = Math.min(totalPages, currentPage + 2);
                  return page >= start && page <= end;
                })
                .map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border border-gray-300 rounded-md ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Summary Stats */}
        {/* <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Menu Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{menuItems.length}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {new Set(menuItems.map(item => item.cuisine)).size}
              </div>
              <div className="text-sm text-gray-600">Cuisines</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(menuItems.map(item => item.vendorCategory)).size}
              </div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                ₹{menuItems.length > 0 ? Math.round(menuItems.reduce((sum, item) => sum + item.price, 0) / menuItems.length) : 0}
              </div>
              <div className="text-sm text-gray-600">Avg Price</div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Menu;
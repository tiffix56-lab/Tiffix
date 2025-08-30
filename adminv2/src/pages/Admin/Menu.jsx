import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, ChefHat, Clock, Zap, Loader2, Eye, EyeOff, Star } from 'lucide-react';
import { createMenuApi, updateMenuApi, deleteMenuApi, toggleMenuAvailabilityApi, getMenusApi } from '../../service/api.service';
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
  const [selectedDietaryOptions, setSelectedDietaryOptions] = useState('');
  const [selectedTags, setSelectedTags] = useState('');
  const [isAvailable, setIsAvailable] = useState('all');
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
    })()
  }, [
    searchTerm, selectedCategory, selectedCuisine, currentPage, 
    selectedDietaryOptions, selectedTags, isAvailable, sortBy, sortOrder
  ]);

  const [formData, setFormData] = useState({
    foodImage: '',
    foodSubImages: [''],
    foodTitle: '',
    price: '',
    description: { short: '', long: '' },
    detailedItemList: '',
    vendorCategory: 'home_chef',
    cuisine: '',
    prepTime: '',
    calories: '',
    dietaryOptions: '',
    tags: ''
  });

  const categories = ['all', 'home_chef', 'food_vendor'];
  const cuisines = ['all', 'Indian', 'Italian', 'Chinese', 'Mexican', 'Thai', 'American'];
  const sortOptions = [
    { value: '', label: 'Default' },
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
      description: { short: '', long: '' },
      detailedItemList: '',
      vendorCategory: 'home_chef',
      cuisine: '',
      prepTime: '',
      calories: '',
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
    setSelectedDietaryOptions('');
    setSelectedTags('');
    setIsAvailable('all');
    setSortBy('');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Food Menu Management</h1>
          <p className="text-gray-400">Create, manage, and organize your food menu items</p>
        </div>

        {/* Controls */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl shadow-xl p-6 mb-6 border border-gray-600">
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
                    className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-orange-400" />
                  <select
                    className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map(category => (
                      <option key={category} value={category} className="bg-gray-800">
                        {category === 'all' ? 'All Categories' : category.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <select
                  className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value} className="bg-gray-800">
                      Sort by {option.label}
                    </option>
                  ))}
                </select>

                {sortBy && (
                  <select
                    className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    <option value="asc" className="bg-gray-800">Ascending</option>
                    <option value="desc" className="bg-gray-800">Descending</option>
                  </select>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 border border-gray-600 hover:border-gray-500"
                >
                  <Filter className="w-4 h-4" />
                  {showAdvancedFilters ? 'Hide' : 'Show'} Filters
                </button>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg shadow-orange-500/25"
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
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                      value={selectedCuisine}
                      onChange={(e) => setSelectedCuisine(e.target.value)}
                    >
                      {cuisines.map(cuisine => (
                        <option key={cuisine} value={cuisine} className="bg-gray-800">
                          {cuisine === 'all' ? 'All Cuisines' : cuisine}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dietary Options */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Dietary Options</label>
                    <input
                      type="text"
                      placeholder="vegetarian,vegan"
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
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
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                      value={selectedTags}
                      onChange={(e) => setSelectedTags(e.target.value)}
                    />
                  </div>

                  {/* Availability */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Availability</label>
                    <select
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                      value={isAvailable}
                      onChange={(e) => setIsAvailable(e.target.value)}
                    >
                      <option value="all" className="bg-gray-800">All Items</option>
                      <option value="true" className="bg-gray-800">Available Only</option>
                      <option value="false" className="bg-gray-800">Unavailable Only</option>
                    </select>
                  </div>
                </div>

                {/* Clear Filters Button */}
                <div className="flex justify-center">
                  <button
                    onClick={clearAllFilters}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-red-500/25"
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-600 px-6 py-4 rounded-t-xl">
                <h2 className="text-xl font-semibold text-white">
                  {editingItem ? 'Edit Menu Item' : 'Create New Menu Item'}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white mb-4">Basic Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Food Title</label>
                      <input
                        type="text"
                        name="foodTitle"
                        value={formData.foodTitle}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Price (₹)</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Main Image URL</label>
                      <input
                        type="url"
                        name="foodImage"
                        value={formData.foodImage}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                        placeholder="https://example.com/image.jpg"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Sub Images</label>
                      {formData.foodSubImages.map((url, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => handleSubImagesChange(index, e.target.value)}
                            className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                            placeholder="https://example.com/sub-image.jpg"
                          />
                          {formData.foodSubImages.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSubImageField(index)}
                              className="px-3 py-2 text-red-400 hover:bg-red-900/50 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addSubImageField}
                        className="text-orange-400 hover:text-orange-300 text-sm hover:cursor-pointer transition-colors"
                      >
                        + Add another sub image
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white mb-4">Details</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Short Description</label>
                      <textarea
                        name="description.short"
                        value={formData.description.short}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Long Description</label>
                      <textarea
                        name="description.long"
                        value={formData.description.long}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Detailed Item List</label>
                      <textarea
                        name="detailedItemList"
                        value={formData.detailedItemList}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                        placeholder="Ingredient 1, Ingredient 2, Ingredient 3..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Vendor Category</label>
                        <select
                          name="vendorCategory"
                          value={formData.vendorCategory}
                          onChange={handleInputChange}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                          required
                        >
                          <option value="home_chef" className="bg-gray-800">Home Chef</option>
                          <option value="food_vendor" className="bg-gray-800">Vendor</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Cuisine</label>
                        <input
                          type="text"
                          name="cuisine"
                          value={formData.cuisine}
                          onChange={handleInputChange}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white mb-4">Food Info</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Prep Time (min)</label>
                        <input
                          type="number"
                          name="prepTime"
                          value={formData.prepTime}
                          onChange={handleInputChange}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Calories</label>
                        <input
                          type="number"
                          name="calories"
                          value={formData.calories}
                          onChange={handleInputChange}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white mb-4">Tags & Options</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Dietary Options</label>
                      <input
                        type="text"
                        value={formData.dietaryOptions}
                        onChange={(e) => setFormData({ ...formData, dietaryOptions: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                        placeholder="vegetarian, vegan, gluten-free..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Tags</label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                        placeholder="spicy, traditional, aromatic..."
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
                    className="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 shadow-lg shadow-orange-500/25"
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
            <div key={item.id} className="rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-lg overflow-hidden hover:shadow-xl hover:border-orange-500/50 transition-all duration-300">
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
                <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full px-3 py-1 text-sm font-semibold shadow-lg">
                  ₹{item.price}
                </div>
                <div className={`absolute top-4 left-4 text-white rounded-full px-3 py-1 text-xs font-medium shadow-lg ${
                  item.isAvailable ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'
                }`}>
                  {item.isAvailable ? 'Available' : 'Unavailable'}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {item.foodTitle}
                    </h3>
                    {item.rating && item.rating.average && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-300">
                          {item.rating.average.toFixed(1)} ({item.rating.count} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className={`p-1 rounded-lg transition-colors ${
                        item.isAvailable 
                          ? 'text-green-400 hover:bg-green-900/50' 
                          : 'text-gray-400 hover:bg-gray-700/50'
                      }`}
                      title={item.isAvailable ? 'Disable item' : 'Enable item'}
                    >
                      {item.isAvailable ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1 text-blue-400 hover:bg-blue-900/50 rounded-lg transition-colors"
                      title="Edit item"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1 text-red-400 hover:bg-red-900/50 rounded-lg transition-colors"
                      title="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                  {item.description.short}
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
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
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-200">
                    {item.vendorCategory.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300"
                    >
                      {tag}
                    </span>
                  ))}
                  {item.tags.length > 3 && (
                    <span className="text-xs text-gray-400">+{item.tags.length - 3} more</span>
                  )}
                </div>

                {/* Dietary Options */}
                <div className="flex flex-wrap gap-1">
                  {item.dietaryOptions.map((option, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-300"
                    >
                      {option}
                    </span>
                  ))}
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-500">
              <ChefHat className="w-full h-full" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No menu items found</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm || selectedCategory !== 'all' || selectedCuisine !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first menu item to get started'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && selectedCuisine === 'all' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/25"
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
              className="px-3 py-1 bg-gray-700 border border-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
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
                    className={`px-3 py-1 border border-gray-600 rounded-lg transition-all duration-200 ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-500 shadow-lg shadow-orange-500/25'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-700 border border-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
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
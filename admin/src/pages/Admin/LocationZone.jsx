import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, MapPin, Eye, EyeOff, Loader2 } from 'lucide-react';
import {
  createZoneApi,
  getZonesApi,
  updateZoneApi,
  deleteZoneApi,
  toggleZoneStatusApi,
  checkServiceByPincodeApi
} from '../../service/api.service';
import toast from 'react-hot-toast';
import MapPicker from '../../components/MapPicker';

const LocationZone = () => {
  const [zones, setZones] = useState([]);
  const [filteredZones, setFilteredZones] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Service check states
  const [serviceCheckPincode, setServiceCheckPincode] = useState('');
  const [serviceCheckResult, setServiceCheckResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const params = {
          page: currentPage,
          limit: itemsPerPage,
          ...(selectedCity !== 'all' && { city: selectedCity }),
          ...(selectedStatus !== 'all' && { isActive: selectedStatus === 'true' }),
        };
        
        const res = await getZonesApi(params);
        setZones(res.data.zones);
        setFilteredZones(res.data.zones);
        setTotalPages(res.data.pagination.totalPages);
        
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error fetching zones');
      } finally {
        setLoading(false);
      }
    })()
  }, [currentPage, selectedCity, selectedStatus]);

  const [formData, setFormData] = useState({
    zoneName: '',
    city: '',
    state: '',
    country: 'India',
    pincodes: [''],
    serviceRadius: '',
    coordinates: {
      lat: '',
      lng: ''
    }
  });

  const cities = ['all', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata'];

  const currentItems = filteredZones;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        return newData;
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePincodesChange = (index, value) => {
    const newPincodes = [...formData.pincodes];
    newPincodes[index] = value;
    setFormData(prev => ({ ...prev, pincodes: newPincodes }));
  };

  const addPincodeField = () => {
    setFormData(prev => ({
      ...prev,
      pincodes: [...prev.pincodes, '']
    }));
  };

  const removePincodeField = (index) => {
    const newPincodes = formData.pincodes.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, pincodes: newPincodes }));
  };

  const resetForm = () => {
    setFormData({
      zoneName: '',
      city: '',
      state: '',
      country: 'India',
      pincodes: [''],
      serviceRadius: '',
      coordinates: {
        lat: '',
        lng: ''
      }
    });
    setShowCreateForm(false);
    setEditingZone(null);
    setShowMapPicker(false);
  };

  const handleMapLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      coordinates: {
        lat: location.lat,
        lng: location.lng
      }
    }));
  };

  const handleSubmit = async(e) => {
    e.preventDefault();

    const submitData = {
      zoneName: formData.zoneName,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      pincodes: formData.pincodes.filter(pc => pc.trim()),
      serviceRadius: Number(formData.serviceRadius),
      coordinates: {
        lat: Number(formData.coordinates.lat),
        lng: Number(formData.coordinates.lng)
      }
    };

    try {
      setIsCreating(true);

      if (editingZone) {
        console.log("Data to be submitted for update:", submitData);

        await updateZoneApi(editingZone._id, submitData);
        toast.success("Zone updated successfully");
      } else {
        await createZoneApi(submitData);
        toast.success("Zone created successfully");
      }

      resetForm();
      // Refresh zones list
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error in processing zone.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (zone) => {
    setFormData({
      ...zone,
      pincodes: zone.pincodes || [''],
      coordinates: zone.coordinates || { lat: '', lng: '' }
    });
    setEditingZone(zone);
    setShowCreateForm(true);
  };

  const handleDelete = async (zone) => {
    if (window.confirm('Are you sure you want to delete this zone?')) {
      try {
        await deleteZoneApi(zone._id);
        toast.success("Zone deleted successfully");
        window.location.reload();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error deleting zone');
      }
    }
  };

  const handleToggleStatus = async (zone) => {
    try {
      await toggleZoneStatusApi(zone._id);
      toast.success(`Zone ${zone.isActive ? 'disabled' : 'enabled'} successfully`);
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error toggling status');
    }
  };

  const handleServiceCheck = async () => {
    if (!serviceCheckPincode) {
      toast.error('Please enter a pincode');
      return;
    }
    try {
      const result = await checkServiceByPincodeApi(serviceCheckPincode);
      setServiceCheckResult(result);
      toast.success('Service check completed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error checking service');
      setServiceCheckResult(null);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCity('all');
    setSelectedStatus('all');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Location Zone Management</h1>
          <p className="text-gray-400">Create, manage, and organize delivery zones</p>
        </div>

        {/* Controls */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl shadow-xl p-4 md:p-6 mb-6 border border-gray-600">
          <div className="space-y-4">
            {/* Top Row - Search, Basic Filters, Add Button */}
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
              <div className="flex flex-col md:flex-row flex-wrap gap-4 items-stretch md:items-center">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search zones..."
                    className="w-full md:w-auto pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* City Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-orange-400" />
                  <select
                    className="flex-1 md:flex-none bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                  >
                    {cities.map(city => (
                      <option key={city} value={city} className="bg-gray-800">
                        {city === 'all' ? 'All Cities' : city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <select
                  className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all" className="bg-gray-800">All Status</option>
                  <option value="true" className="bg-gray-800">Active Only</option>
                  <option value="false" className="bg-gray-800">Inactive Only</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 border border-gray-600 hover:border-gray-500"
                >
                  <Search className="w-4 h-4" />
                  {showAdvancedFilters ? 'Hide' : 'Show'} Tools
                </button>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-orange-500/25"
                >
                  <Plus className="w-4 h-4" />
                  Add New Zone
                </button>
              </div>
            </div>

            {/* Advanced Tools */}
            {showAdvancedFilters && (
              <div className="border-t border-gray-600 pt-4 space-y-4">
                {/* Service Availability Checker */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <h3 className="text-white font-medium mb-3">Check Service Availability</h3>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter pincode"
                        className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                        value={serviceCheckPincode}
                        onChange={(e) => setServiceCheckPincode(e.target.value)}
                      />
                      <button
                        onClick={handleServiceCheck}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-green-500/25"
                      >
                        Check
                      </button>
                    </div>
                    {serviceCheckResult && (
                      <div className="text-white text-sm bg-gray-800 p-2 rounded">
                        <pre>{JSON.stringify(serviceCheckResult, null, 2)}</pre>
                      </div>
                    )}
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
            <div className="bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-600 px-6 py-4 rounded-t-xl">
                <h2 className="text-xl font-semibold text-white">
                  {editingZone ? 'Edit Zone' : 'Create New Zone'}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white mb-4">Basic Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Zone Name</label>
                      <input
                        type="text"
                        name="zoneName"
                        value={formData.zoneName}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">State</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Service Radius (km)</label>
                      <input
                        type="number"
                        name="serviceRadius"
                        value={formData.serviceRadius}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                        required
                      />
                    </div>
                  </div>

                  {/* Pincodes and Coordinates */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white mb-4">Location Details</h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Pincodes</label>
                      {formData.pincodes.map((pincode, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={pincode}
                            onChange={(e) => handlePincodesChange(index, e.target.value)}
                            className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                            placeholder="Enter pincode"
                          />
                          {formData.pincodes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePincodeField(index)}
                              className="px-3 py-2 text-red-400 hover:bg-red-900/50 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addPincodeField}
                        className="text-orange-400 text-sm hover:text-orange-300 hover:cursor-pointer"
                      >
                        + Add another pincode
                      </button>
                    </div>

                    {/* Coordinates */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Coordinates</label>

                      {/* Toggle between manual input and map picker */}
                      <div className="mb-3">
                        <button
                          type="button"
                          onClick={() => setShowMapPicker(!showMapPicker)}
                          className="text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1"
                        >
                          <MapPin className="w-4 h-4" />
                          {showMapPicker ? 'Enter manually' : 'Pick from map'}
                        </button>
                      </div>

                      {showMapPicker ? (
                        <MapPicker
                          onLocationSelect={handleMapLocationSelect}
                          initialLat={formData.coordinates.lat || 20.5937}
                          initialLng={formData.coordinates.lng || 78.9629}
                        />
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            step="any"
                            name="coordinates.lat"
                            value={formData.coordinates.lat}
                            onChange={handleInputChange}
                            className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                            placeholder="Latitude"
                            required
                          />
                          <input
                            type="number"
                            step="any"
                            name="coordinates.lng"
                            value={formData.coordinates.lng}
                            onChange={handleInputChange}
                            className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                            placeholder="Longitude"
                            required
                          />
                        </div>
                      )}
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
                    {editingZone ? 'Update Zone' : 'Create Zone'}
                  </button>
                  {isCreating && (
                    <Loader2 className="animate-spin m-2" />
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Zones Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {currentItems.map((zone) => (
            <div key={zone._id} className="rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-lg overflow-hidden hover:shadow-xl hover:border-orange-500/50 transition-all duration-300">
              {/* Header */}
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold truncate text-white">
                      {zone.zoneName}
                    </h3>
                    <p className="text-sm text-gray-300">
                      {zone.city}, {zone.state}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleToggleStatus(zone)}
                      className={`p-1 rounded-lg transition-colors ${
                        zone.isActive 
                          ? 'text-green-400 hover:bg-green-900/50' 
                          : 'text-gray-400 hover:bg-gray-700/50'
                      }`}
                      title={zone.isActive ? 'Disable zone' : 'Enable zone'}
                    >
                      {zone.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(zone)}
                      className="p-1 text-blue-400 hover:bg-blue-900/50 rounded-lg transition-colors"
                      title="Edit zone"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(zone)}
                      className="p-1 text-red-400 hover:bg-red-900/50 rounded-lg transition-colors"
                      title="Delete zone"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium shadow-lg ${
                    zone.isActive ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                  }`}>
                    {zone.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Service Info */}
                <div className="flex items-center gap-4 text-sm text-gray-300">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {zone.serviceRadius}km radius
                  </div>
                </div>

                {/* Pincodes */}
                <div>
                  <p className="text-xs text-gray-400 mb-1">Pincodes:</p>
                  <div className="flex flex-wrap gap-1">
                    {zone.pincodes?.slice(0, 3).map((pincode, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300"
                      >
                        {pincode}
                      </span>
                    ))}
                    {zone.pincodes?.length > 3 && (
                      <span className="text-xs text-gray-400">+{zone.pincodes.length - 3} more</span>
                    )}
                  </div>
                </div>

                {/* Coordinates */}
                <div className="pt-3 border-t border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">Coordinates:</p>
                  <div className="text-xs text-gray-300">
                    Lat: {zone.coordinates?.lat?.toFixed(6)}, Lng: {zone.coordinates?.lng?.toFixed(6)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredZones.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-500">
              <MapPin className="w-full h-full" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No zones found</h3>
            <p className="text-gray-400 mb-4">
              {selectedCity !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first delivery zone to get started'
              }
            </p>
            {selectedCity === 'all' && selectedStatus === 'all' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/25"
              >
                Create First Zone
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-700 border border-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors w-full sm:w-auto"
            >
              Previous
            </button>
            
            <div className="flex gap-1 overflow-x-auto max-w-full pb-2 sm:pb-0">
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
                    className={`px-3 py-1 border border-gray-600 rounded-lg transition-all duration-200 min-w-[2rem] ${
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
              className="px-3 py-1 bg-gray-700 border border-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors w-full sm:w-auto"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationZone;
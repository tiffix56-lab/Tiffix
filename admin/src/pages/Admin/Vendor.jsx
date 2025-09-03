import React, { useState, useEffect } from 'react'
import { 
  Plus, Edit, Trash2, Search, Filter, Users, MapPin, Star, 
  Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Shield,
  User, Building, Phone, Mail, Eye, EyeOff
} from 'lucide-react'
import {
  getVendorsApi,
  createVendorApi,
  updateVendorApi,
  deleteVendorApi,
  verifyVendorApi,
  updateVendorRatingApi,
  resetVendorCapacityApi,
  updateVendorAddressApi
} from '../../service/api.service'
import toast from 'react-hot-toast'

function Vendor() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingVendor, setEditingVendor] = useState(null)
  const [addressVendor, setAddressVendor] = useState(null)
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    vendorType: '',
    isVerified: '',
    isAvailable: '',
    cuisineTypes: '',
    minRating: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  const [formData, setFormData] = useState({
    user: {
      name: '',
      emailAddress: '',
      phoneNumber: '',
      password: '',
      timezone: 'Asia/Kolkata'
    },
    vendorProfile: {
      vendorType: 'home_chef',
      businessInfo: {
        businessName: '',
        description: '',
        cuisineTypes: [],
        serviceArea: {
          radius: 5,
          coordinates: {
            lat: 28.6139,
            lng: 77.2090
          }
        }
      },
      operatingHours: [
        { day: 'monday', isOpen: true, openTime: '10:00', closeTime: '20:00' },
        { day: 'tuesday', isOpen: true, openTime: '10:00', closeTime: '20:00' },
        { day: 'wednesday', isOpen: true, openTime: '10:00', closeTime: '20:00' },
        { day: 'thursday', isOpen: true, openTime: '10:00', closeTime: '20:00' },
        { day: 'friday', isOpen: true, openTime: '10:00', closeTime: '21:00' },
        { day: 'saturday', isOpen: true, openTime: '09:00', closeTime: '21:00' },
        { day: 'sunday', isOpen: false, openTime: '', closeTime: '' }
      ],
      capacity: {
        dailyOrders: 20
      },
      documents: {
        businessLicense: '',
        foodSafetyLicense: '',
        taxId: ''
      }
    }
  })

  const [addressData, setAddressData] = useState({
    street: '',
    city: '',
    state: '',
    country: 'India',
    zipCode: '',
    latitude: '',
    longitude: ''
  })

  const cuisineOptions = [
    'indian', 'chinese', 'continental', 'italian', 'punjabi', 'south_indian',
    'mexican', 'thai', 'japanese', 'mediterranean', 'american'
  ]

  useEffect(() => {
    fetchVendors()
  }, [filters])

  const fetchVendors = async () => {
    setLoading(true)
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      )
      const response = await getVendorsApi(cleanFilters);
      console.log(response, "Vendors");
      
      setVendors(Array.isArray(response.data.vendorProfiles) ? response.data.vendorProfiles : [])
    } catch (error) {
      console.error('Error fetching vendors:', error)
      setVendors([])
    }
    setLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    const keys = name.split('.')
    
    if (keys.length === 1) {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    } else if (keys.length === 2) {
      setFormData(prev => ({
        ...prev,
        [keys[0]]: {
          ...prev[keys[0]],
          [keys[1]]: type === 'checkbox' ? checked : value
        }
      }))
    } else if (keys.length === 3) {
      setFormData(prev => ({
        ...prev,
        [keys[0]]: {
          ...prev[keys[0]],
          [keys[1]]: {
            ...prev[keys[0]][keys[1]],
            [keys[2]]: type === 'checkbox' ? checked : value
          }
        }
      }))
    } else if (keys.length === 4) {
      setFormData(prev => ({
        ...prev,
        [keys[0]]: {
          ...prev[keys[0]],
          [keys[1]]: {
            ...prev[keys[0]][keys[1]],
            [keys[2]]: {
              ...prev[keys[0]][keys[1]][keys[2]],
              [keys[3]]: type === 'checkbox' ? checked : value
            }
          }
        }
      }))
    }
  }

  const handleCuisineChange = (cuisine) => {
    setFormData(prev => {
      const currentCuisines = prev.vendorProfile.businessInfo.cuisineTypes
      const updatedCuisines = currentCuisines.includes(cuisine)
        ? currentCuisines.filter(c => c !== cuisine)
        : [...currentCuisines, cuisine]
      
      return {
        ...prev,
        vendorProfile: {
          ...prev.vendorProfile,
          businessInfo: {
            ...prev.vendorProfile.businessInfo,
            cuisineTypes: updatedCuisines
          }
        }
      }
    })
  }

  const handleOperatingHourChange = (index, field, value) => {
    setFormData(prev => {
      const updatedHours = [...prev.vendorProfile.operatingHours]
      updatedHours[index] = {
        ...updatedHours[index],
        [field]: field === 'isOpen' ? value : value
      }
      return {
        ...prev,
        vendorProfile: {
          ...prev.vendorProfile,
          operatingHours: updatedHours
        }
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...formData,
        vendorProfile: {
          ...formData.vendorProfile,
          capacity: {
            dailyOrders: Number(formData.vendorProfile.capacity.dailyOrders)
          }
        }
      }

      if (editingVendor) {
        await updateVendorApi(editingVendor._id, payload.vendorProfile)
        toast.success('Vendor updated successfully')
      } else {
        await createVendorApi(payload)
        toast.success('Vendor created successfully')
      }
      
      setShowModal(false)
      setEditingVendor(null)
      resetForm()
      fetchVendors()
    } catch (error) {
      console.error('Error saving vendor:', error)
      toast.error(error.response?.data?.message || 'Error saving vendor')
    }
    setLoading(false)
  }

  const handleAddressSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...addressData,
        latitude: Number(addressData.latitude),
        longitude: Number(addressData.longitude)
      }
      await updateVendorAddressApi(addressVendor._id, payload)
      toast.success('Address updated successfully')
      setShowAddressModal(false)
      setAddressVendor(null)
      fetchVendors()
    } catch (error) {
      console.error('Error updating address:', error)
      toast.error(error.response?.data?.message || 'Error updating address')
    }
    setLoading(false)
  }

  const handleEdit = (vendor) => {
    setEditingVendor(vendor)
    setFormData({
      user: vendor.user || {
        name: '',
        emailAddress: '',
        phoneNumber: '',
        password: '',
        timezone: 'Asia/Kolkata'
      },
      vendorProfile: {
        ...vendor,
        businessInfo: vendor.businessInfo || {},
        operatingHours: vendor.operatingHours || [],
        capacity: vendor.capacity || { dailyOrders: 20 },
        documents: vendor.documents || {}
      }
    })
    setShowModal(true)
  }

  const handleDelete = async (vendorId) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await deleteVendorApi(vendorId)
        toast.success('Vendor deleted successfully')
        fetchVendors()
      } catch (error) {
        console.error('Error deleting vendor:', error)
        toast.error(error.response?.data?.message || 'Error deleting vendor')
      }
    }
  }

  const handleVerify = async (vendorId, isVerified) => {
    try {
      await verifyVendorApi(vendorId, !isVerified)
      toast.success(`Vendor ${isVerified ? 'unverified' : 'verified'} successfully`)
      fetchVendors()
    } catch (error) {
      console.error('Error updating verification:', error)
      toast.error(error.response?.data?.message || 'Error updating verification')
    }
  }

  const handleRatingUpdate = async (vendorId) => {
    const rating = prompt('Enter new rating (1-5):')
    if (rating && rating >= 1 && rating <= 5) {
      try {
        await updateVendorRatingApi(vendorId, Number(rating))
        toast.success('Rating updated successfully')
        fetchVendors()
      } catch (error) {
        console.error('Error updating rating:', error)
        toast.error(error.response?.data?.message || 'Error updating rating')
      }
    }
  }

  const handleResetCapacity = async (vendorId) => {
    try {
      await resetVendorCapacityApi(vendorId)
      toast.success('Capacity reset successfully')
      fetchVendors()
    } catch (error) {
      console.error('Error resetting capacity:', error)
      toast.error(error.response?.data?.message || 'Error resetting capacity')
    }
  }

  const handleEditAddress = (vendor) => {
    setAddressVendor(vendor)
    setAddressData(vendor.address || {
      street: '',
      city: '',
      state: '',
      country: 'India',
      zipCode: '',
      latitude: '',
      longitude: ''
    })
    setShowAddressModal(true)
  }

  const resetForm = () => {
    setFormData({
      user: {
        name: '',
        emailAddress: '',
        phoneNumber: '',
        password: '',
        timezone: 'Asia/Kolkata'
      },
      vendorProfile: {
        vendorType: 'home_chef',
        businessInfo: {
          businessName: '',
          description: '',
          cuisineTypes: [],
          serviceArea: {
            radius: 5,
            coordinates: {
              lat: 28.6139,
              lng: 77.2090
            }
          }
        },
        operatingHours: [
          { day: 'monday', isOpen: true, openTime: '10:00', closeTime: '20:00' },
          { day: 'tuesday', isOpen: true, openTime: '10:00', closeTime: '20:00' },
          { day: 'wednesday', isOpen: true, openTime: '10:00', closeTime: '20:00' },
          { day: 'thursday', isOpen: true, openTime: '10:00', closeTime: '20:00' },
          { day: 'friday', isOpen: true, openTime: '10:00', closeTime: '21:00' },
          { day: 'saturday', isOpen: true, openTime: '09:00', closeTime: '21:00' },
          { day: 'sunday', isOpen: false, openTime: '', closeTime: '' }
        ],
        capacity: {
          dailyOrders: 20
        },
        documents: {
          businessLicense: '',
          foodSafetyLicense: '',
          taxId: ''
        }
      }
    })
  }

  return (
    <div className="min-h-screen p-6">
      <div className="">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Vendor Management</h1>
          <p className="text-gray-400">Manage vendors, home chefs, and food service providers</p>
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
                    placeholder="Search vendors..."
                    className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>

                {/* Vendor Type Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-orange-400" />
                  <select
                    className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                    value={filters.vendorType}
                    onChange={(e) => setFilters(prev => ({ ...prev, vendorType: e.target.value }))}
                  >
                    <option value="" className="bg-gray-800">All Types</option>
                    <option value="home_chef" className="bg-gray-800">Home Chef</option>
                    <option value="food_vendor" className="bg-gray-800">Food Vendor</option>
                  </select>
                </div>

                {/* Verification Filter */}
                <select
                  className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                  value={filters.isVerified}
                  onChange={(e) => setFilters(prev => ({ ...prev, isVerified: e.target.value }))}
                >
                  <option value="" className="bg-gray-800">All Verification</option>
                  <option value="true" className="bg-gray-800">Verified</option>
                  <option value="false" className="bg-gray-800">Unverified</option>
                </select>

                {/* Availability Filter */}
                <select
                  className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                  value={filters.isAvailable}
                  onChange={(e) => setFilters(prev => ({ ...prev, isAvailable: e.target.value }))}
                >
                  <option value="" className="bg-gray-800">All Availability</option>
                  <option value="true" className="bg-gray-800">Available</option>
                  <option value="false" className="bg-gray-800">Unavailable</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, search: '', vendorType: '', isVerified: '', isAvailable: '', cuisineTypes: '', minRating: '' }))}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 border border-gray-600 hover:border-gray-500"
                >
                  <RefreshCw className="w-4 h-4" />
                  Clear Filters
                </button>
                <button
                  onClick={() => {
                    resetForm()
                    setEditingVendor(null)
                    setShowModal(true)
                  }}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg shadow-orange-500/25"
                >
                  <Plus className="w-4 h-4" />
                  Create Vendor
                </button>
              </div>
            </div>

            {/* Advanced Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-600">
              <input
                type="text"
                placeholder="Cuisine Types (comma separated)"
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                value={filters.cuisineTypes}
                onChange={(e) => setFilters(prev => ({ ...prev, cuisineTypes: e.target.value }))}
              />
              <input
                type="number"
                placeholder="Min Rating"
                step="0.1"
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                value={filters.minRating}
                onChange={(e) => setFilters(prev => ({ ...prev, minRating: e.target.value }))}
              />
              <select
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              >
                <option value="createdAt" className="bg-gray-800">Sort by Created Date</option>
                <option value="rating.average" className="bg-gray-800">Sort by Rating</option>
                <option value="businessInfo.businessName" className="bg-gray-800">Sort by Business Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vendors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {vendors && vendors.length > 0 ? vendors.map((vendor) => (
            <div key={vendor._id} className="rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-lg overflow-hidden hover:shadow-xl hover:border-orange-500/50 transition-all duration-300">
              {/* Header */}
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {vendor.businessInfo?.businessName || 'N/A'}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {vendor.businessInfo?.description || 'No description available'}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      vendor.vendorType === 'home_chef' 
                        ? 'bg-green-900/50 text-green-300' 
                        : 'bg-blue-900/50 text-blue-300'
                    }`}>
                      {vendor.vendorType === 'home_chef' ? 'Home Chef' : 'Food Vendor'}
                    </span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    vendor.isVerified 
                      ? 'bg-green-900/50 text-green-300' 
                      : 'bg-red-900/50 text-red-300'
                  }`}>
                    {vendor.isVerified ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {vendor.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    vendor.isAvailable 
                      ? 'bg-green-900/50 text-green-300' 
                      : 'bg-gray-700/50 text-gray-400'
                  }`}>
                    {vendor.isAvailable ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {vendor.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-white ml-1 font-medium">
                      {vendor.rating?.average || 0}
                    </span>
                  </div>
                  <span className="text-gray-400 text-sm">
                    ({vendor.rating?.count || 0} reviews)
                  </span>
                </div>

                {/* Cuisine Types */}
                {vendor.businessInfo?.cuisineTypes && vendor.businessInfo.cuisineTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {vendor.businessInfo.cuisineTypes.slice(0, 3).map((cuisine, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-900/50 text-purple-300"
                      >
                        {cuisine}
                      </span>
                    ))}
                    {vendor.businessInfo.cuisineTypes.length > 3 && (
                      <span className="text-xs text-gray-400">+{vendor.businessInfo.cuisineTypes.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="p-4 border-b border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-orange-400 font-semibold">{vendor.capacity?.dailyOrders || 0}</div>
                    <div className="text-gray-400 text-xs">Daily Capacity</div>
                  </div>
                  <div>
                    <div className="text-blue-400 font-semibold">{vendor.capacity?.currentOrders || 0}</div>
                    <div className="text-gray-400 text-xs">Current Orders</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleEdit(vendor)}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg transition-colors text-sm"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => handleVerify(vendor._id, vendor.isVerified)}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 rounded-lg transition-colors text-sm"
                >
                  <Shield className="w-3 h-3" />
                  {vendor.isVerified ? 'Unverify' : 'Verify'}
                </button>
                {/* <button
                  onClick={() => handleRatingUpdate(vendor._id)}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg transition-colors text-sm"
                >
                  <Star className="w-3 h-3" />
                  Rating
                </button> */}
                <button
                  onClick={() => handleEditAddress(vendor)}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded-lg transition-colors text-sm"
                >
                  <MapPin className="w-3 h-3" />
                  Address
                </button>
                {/* <button
                  onClick={() => handleResetCapacity(vendor._id)}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 rounded-lg transition-colors text-sm"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset
                </button> */}
                <button
                  onClick={() => handleDelete(vendor._id)}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg transition-colors text-sm"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          )) : (
            <div className="col-span-full">
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 text-gray-500">
                  <Users className="w-full h-full" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No vendors found</h3>
                <p className="text-gray-400 mb-4">
                  {loading ? 'Loading vendors...' : 'Create your first vendor to get started'}
                </p>
                {!loading && (
                  <button
                    onClick={() => {
                      resetForm()
                      setEditingVendor(null)
                      setShowModal(true)
                    }}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/25"
                  >
                    Create First Vendor
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Vendor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-600 px-6 py-4 rounded-t-xl">
              <h2 className="text-xl font-semibold text-white">
                {editingVendor ? 'Edit Vendor' : 'Create Vendor'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-gray-800">
              {/* User Information */}
              {!editingVendor && (
                <div>
                  <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-orange-400" />
                    User Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="user.name"
                      placeholder="Full Name"
                      value={formData.user.name}
                      onChange={handleInputChange}
                      className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                      required
                    />
                    <input
                      type="email"
                      name="user.emailAddress"
                      placeholder="Email Address"
                      value={formData.user.emailAddress}
                      onChange={handleInputChange}
                      className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                      required
                    />
                    <input
                      type="tel"
                      name="user.phoneNumber"
                      placeholder="Phone Number"
                      value={formData.user.phoneNumber}
                      onChange={handleInputChange}
                      className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                      required
                    />
                    <input
                      type="password"
                      name="user.password"
                      placeholder="Password"
                      value={formData.user.password}
                      onChange={handleInputChange}
                      className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Business Information */}
              <div>
                <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5 text-orange-400" />
                  Business Information
                </h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <select
                    name="vendorProfile.vendorType"
                    value={formData.vendorProfile.vendorType}
                    onChange={handleInputChange}
                    className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                  >
                    <option value="home_chef" className="bg-gray-800">Home Chef</option>
                    <option value="food_vendor" className="bg-gray-800">Food Vendor</option>
                  </select>
                  <input
                    type="text"
                    name="vendorProfile.businessInfo.businessName"
                    placeholder="Business Name"
                    value={formData.vendorProfile.businessInfo.businessName}
                    onChange={handleInputChange}
                    className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                    required
                  />
                </div>
                <textarea
                  name="vendorProfile.businessInfo.description"
                  placeholder="Business Description"
                  value={formData.vendorProfile.businessInfo.description}
                  onChange={handleInputChange}
                  className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 w-full h-24 mb-4 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                />
                
                {/* Cuisine Types */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-white mb-2">Cuisine Types</label>
                  <div className="grid grid-cols-4 gap-2">
                    {cuisineOptions.map((cuisine) => (
                      <label key={cuisine} className="flex items-center text-gray-300 hover:text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.vendorProfile.businessInfo.cuisineTypes.includes(cuisine)}
                          onChange={() => handleCuisineChange(cuisine)}
                          className="mr-2 text-orange-500 rounded focus:ring-orange-500"
                        />
                        {cuisine}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Service Area */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <input
                    type="number"
                    name="vendorProfile.businessInfo.serviceArea.radius"
                    placeholder="Service Radius (km)"
                    value={formData.vendorProfile.businessInfo.serviceArea.radius}
                    onChange={handleInputChange}
                    className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                  />
                  <input
                    type="number"
                    name="vendorProfile.businessInfo.serviceArea.coordinates.lat"
                    placeholder="Latitude"
                    step="any"
                    value={formData.vendorProfile.businessInfo.serviceArea.coordinates.lat}
                    onChange={handleInputChange}
                    className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                  />
                  <input
                    type="number"
                    name="vendorProfile.businessInfo.serviceArea.coordinates.lng"
                    placeholder="Longitude"
                    step="any"
                    value={formData.vendorProfile.businessInfo.serviceArea.coordinates.lng}
                    onChange={handleInputChange}
                    className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Operating Hours */}
              <div>
                <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-400" />
                  Operating Hours
                </h4>
                <div className="space-y-2">
                  {formData.vendorProfile.operatingHours.map((hour, index) => (
                    <div key={hour.day} className="grid grid-cols-4 gap-4 items-center">
                      <span className="capitalize font-medium text-gray-300">{hour.day}</span>
                      <label className="flex items-center text-gray-300 hover:text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hour.isOpen}
                          onChange={(e) => handleOperatingHourChange(index, 'isOpen', e.target.checked)}
                          className="mr-2 text-orange-500 rounded focus:ring-orange-500"
                        />
                        Open
                      </label>
                      <input
                        type="time"
                        value={hour.openTime}
                        onChange={(e) => handleOperatingHourChange(index, 'openTime', e.target.value)}
                        disabled={!hour.isOpen}
                        className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white disabled:bg-gray-700 disabled:text-gray-400"
                      />
                      <input
                        type="time"
                        value={hour.closeTime}
                        onChange={(e) => handleOperatingHourChange(index, 'closeTime', e.target.value)}
                        disabled={!hour.isOpen}
                        className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white disabled:bg-gray-700 disabled:text-gray-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Capacity & Documents */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-400" />
                    Capacity
                  </h4>
                  <input
                    type="number"
                    name="vendorProfile.capacity.dailyOrders"
                    placeholder="Daily Orders Capacity"
                    value={formData.vendorProfile.capacity.dailyOrders}
                    onChange={handleInputChange}
                    className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-400" />
                    Documents
                  </h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      name="vendorProfile.documents.businessLicense"
                      placeholder="Business License"
                      value={formData.vendorProfile.documents.businessLicense}
                      onChange={handleInputChange}
                      className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                    />
                    <input
                      type="text"
                      name="vendorProfile.documents.foodSafetyLicense"
                      placeholder="Food Safety License"
                      value={formData.vendorProfile.documents.foodSafetyLicense}
                      onChange={handleInputChange}
                      className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                    />
                    <input
                      type="text"
                      name="vendorProfile.documents.taxId"
                      placeholder="Tax ID"
                      value={formData.vendorProfile.documents.taxId}
                      onChange={handleInputChange}
                      className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-600">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingVendor(null)
                    resetForm()
                  }}
                  disabled={loading}
                  className="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 shadow-lg shadow-orange-500/25"
                >
                  {loading ? 'Saving...' : editingVendor ? 'Update Vendor' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full border border-gray-700 shadow-2xl">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-600 px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-400" />
                Update Address
              </h3>
            </div>
            <form onSubmit={handleAddressSubmit} className="p-6 space-y-4">
              <input
                type="text"
                value={addressData.street}
                onChange={(e) => setAddressData(prev => ({ ...prev, street: e.target.value }))}
                placeholder="Street Address"
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={addressData.city}
                  onChange={(e) => setAddressData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                  className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                  required
                />
                <input
                  type="text"
                  value={addressData.state}
                  onChange={(e) => setAddressData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="State"
                  className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={addressData.country}
                  onChange={(e) => setAddressData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="Country"
                  className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                  required
                />
                <input
                  type="text"
                  value={addressData.zipCode}
                  onChange={(e) => setAddressData(prev => ({ ...prev, zipCode: e.target.value }))}
                  placeholder="Zip Code"
                  className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  step="any"
                  value={addressData.latitude}
                  onChange={(e) => setAddressData(prev => ({ ...prev, latitude: e.target.value }))}
                  placeholder="Latitude"
                  className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                />
                <input
                  type="number"
                  step="any"
                  value={addressData.longitude}
                  onChange={(e) => setAddressData(prev => ({ ...prev, longitude: e.target.value }))}
                  placeholder="Longitude"
                  className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                />
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t border-gray-600">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  disabled={loading}
                  className="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 shadow-lg shadow-orange-500/25"
                >
                  {loading ? 'Updating...' : 'Update Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Vendor
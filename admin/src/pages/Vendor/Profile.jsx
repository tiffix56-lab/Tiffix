import React, { useState, useEffect } from 'react'
import {
  User, Mail, Phone, MapPin, Building2, Clock, Star, 
  Camera, Save, Edit3, Shield, Settings, FileText,
  CreditCard, Briefcase, Calendar, Globe, ChefHat,
  Users, Package, BarChart3, RefreshCw, Eye, EyeOff
} from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import {
  getVendorMeApi,
  updateVendorMeProfileApi,
  updateVendorMeAddressApi,
  updateVendorDocumentsApi,
  updateVendorPreferencesApi,
  changeVendorPasswordApi,
  uploadVendorProfileImageApi
} from '../../service/api.service'

function Profile() {
  const [vendorData, setVendorData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [editMode, setEditMode] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Form states
  const [profileForm, setProfileForm] = useState({})
  const [addressForm, setAddressForm] = useState({})
  const [documentsForm, setDocumentsForm] = useState({})
  const [preferencesForm, setPreferencesForm] = useState({})
  const [operatingHoursForm, setOperatingHoursForm] = useState([])
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const tabs = [
    { id: 'profile', label: 'Profile Info', icon: User },
    { id: 'business', label: 'Business Details', icon: Building2 },
    { id: 'operating', label: 'Operating Hours', icon: Clock },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield }
  ]

  const cuisineOptions = [
    'indian', 'chinese', 'continental', 'italian', 'mexican',
    'thai', 'japanese', 'american', 'mediterranean', 'punjabi',
    'south_indian', 'bengali', 'gujarati', 'rajasthani'
  ]

  const daysOfWeek = [
    'monday', 'tuesday', 'wednesday', 'thursday', 
    'friday', 'saturday', 'sunday'
  ]

  const fetchVendorProfile = async () => {
    try {
      setLoading(true)
      const profileData = await getVendorMeApi()
      console.log(profileData);
      
      const vendor = profileData.data.vendorProfile
      const user = vendor.userId
      
      setVendorData(vendor)
      
      // Initialize forms
      setProfileForm({
        name: user?.name || '',
        emailAddress: user?.emailAddress || '',
        phoneNumber: user?.phoneNumber?.internationalNumber || '',
        gender: user?.gender || '',
        businessName: vendor.businessInfo?.businessName || '',
        description: vendor.businessInfo?.description || '',
        cuisineTypes: vendor.businessInfo?.cuisineTypes || [],
        dailyOrders: vendor.capacity?.dailyOrders || 0
      })

      setAddressForm({
        street: vendor.businessInfo?.address?.street || '',
        city: vendor.businessInfo?.address?.city || '',
        state: vendor.businessInfo?.address?.state || '',
        country: vendor.businessInfo?.address?.country || '',
        zipCode: vendor.businessInfo?.address?.zipCode || '',
        latitude: vendor.businessInfo?.address?.coordinates?.coordinates?.[1] || '',
        longitude: vendor.businessInfo?.address?.coordinates?.coordinates?.[0] || ''
      })

      setDocumentsForm({
        businessLicense: vendor.documents?.businessLicense || '',
        foodSafetyLicense: vendor.documents?.foodSafetyLicense || '',
        taxId: vendor.documents?.taxId || '',
        bankAccount: {
          accountNumber: vendor.documents?.bankAccount?.accountNumber || '',
          ifscCode: vendor.documents?.bankAccount?.ifscCode || '',
          accountHolderName: vendor.documents?.bankAccount?.accountHolderName || '',
          bankName: vendor.documents?.bankAccount?.bankName || ''
        }
      })

      setPreferencesForm({
        notifications: {
          email: vendor.preferences?.notifications?.email !== false,
          sms: vendor.preferences?.notifications?.sms !== false,
          push: vendor.preferences?.notifications?.push !== false,
          orderAlerts: vendor.preferences?.notifications?.orderAlerts !== false,
          reviewAlerts: vendor.preferences?.notifications?.reviewAlerts !== false,
          paymentAlerts: vendor.preferences?.notifications?.paymentAlerts !== false
        },
        privacy: {
          showPhoneNumber: vendor.preferences?.privacy?.showPhoneNumber !== false,
          showEmailAddress: vendor.preferences?.privacy?.showEmailAddress !== false,
          allowDirectContact: vendor.preferences?.privacy?.allowDirectContact !== false
        },
        language: vendor.preferences?.language || user?.timezone?.includes('Kolkata') ? 'hi' : 'en',
        currency: vendor.preferences?.currency || 'INR',
        timezone: user?.timezone || 'Asia/Kolkata'
      })

      // Initialize operating hours form
      const defaultOperatingHours = daysOfWeek.map(day => {
        const existingDay = vendor.operatingHours?.find(oh => oh.day === day)
        return existingDay || {
          day,
          isOpen: false,
          openTime: '09:00',
          closeTime: '17:00'
        }
      })
      setOperatingHoursForm(defaultOperatingHours)
      
    } catch (error) {
      console.error('Error fetching vendor profile:', error)
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      await updateVendorMeProfileApi({
        user: {
          name: profileForm.name,
          gender: profileForm.gender,
          emailAddress: profileForm.emailAddress
        },
        vendorProfile: {
          businessInfo: {
            businessName: profileForm.businessName,
            description: profileForm.description,
            cuisineTypes: profileForm.cuisineTypes
          },
          capacity: {
            dailyOrders: parseInt(profileForm.dailyOrders)
          }
        }
      })
      toast.success('Profile updated successfully')
      setEditMode(false)
      fetchVendorProfile()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAddress = async () => {
    try {
      setSaving(true)
      await updateVendorMeAddressApi(addressForm)
      toast.success('Address updated successfully')
      fetchVendorProfile()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update address')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDocuments = async () => {
    try {
      setSaving(true)
      await updateVendorDocumentsApi(documentsForm)
      toast.success('Documents updated successfully')
      fetchVendorProfile()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update documents')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    try {
      setSaving(true)
      await updateVendorPreferencesApi(preferencesForm)
      toast.success('Preferences updated successfully')
      fetchVendorProfile()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update preferences')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveOperatingHours = async () => {
    try {
      setSaving(true)
      await updateVendorMeProfileApi({
        vendorProfile: {
          operatingHours: operatingHoursForm
        }
      })
      toast.success('Operating hours updated successfully')
      fetchVendorProfile()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update operating hours')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    
    try {
      setSaving(true)
      await changeVendorPasswordApi(passwordForm)
      toast.success('Password changed successfully')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    fetchVendorProfile()
  }, [])

  const handleCuisineToggle = (cuisine) => {
    setProfileForm(prev => ({
      ...prev,
      cuisineTypes: prev.cuisineTypes.includes(cuisine)
        ? prev.cuisineTypes.filter(c => c !== cuisine)
        : [...prev.cuisineTypes, cuisine]
    }))
  }

  const handleOperatingHoursChange = (dayIndex, field, value) => {
    setOperatingHoursForm(prev => {
      const updated = [...prev]
      updated[dayIndex] = { ...updated[dayIndex], [field]: value }
      return updated
    })
  }

  const toggleDayOpen = (dayIndex) => {
    setOperatingHoursForm(prev => {
      const updated = [...prev]
      updated[dayIndex] = { ...updated[dayIndex], isOpen: !updated[dayIndex].isOpen }
      return updated
    })
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
            <div className="text-lg text-gray-400">Loading profile...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vendor Profile</h1>
          <p className="text-gray-400 mt-1">Manage your vendor account and business information</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchVendorProfile}
            variant="secondary"
            size="sm"
            icon={RefreshCw}
          >
            Refresh
          </Button>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1 p-4">
          <div className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Info Tab */}
          {activeTab === 'profile' && (
            <Card className="p-6">
              <Card.Header>
                <div className="flex items-center justify-between">
                  <Card.Title>Profile Information</Card.Title>
                  <Button
                    onClick={() => setEditMode(!editMode)}
                    variant="outline"
                    size="sm"
                    icon={editMode ? Save : Edit3}
                  >
                    {editMode ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
              </Card.Header>

              <Card.Content className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    icon={User}
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!editMode}
                    placeholder="Enter your full name"
                  />
                  
                  <Input
                    label="Email Address"
                    icon={Mail}
                    type="email"
                    value={profileForm.emailAddress}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, emailAddress: e.target.value }))}
                    disabled={!editMode}
                    placeholder="Enter your email"
                  />
                  
                  <Input
                    label="Phone Number"
                    icon={Phone}
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    disabled={!editMode}
                    placeholder="Enter your phone number"
                  />
                  
                  <Input.Select
                    label="Gender"
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, gender: e.target.value }))}
                    disabled={!editMode}
                    options={[
                      { label: 'Male', value: 'male' },
                      { label: 'Female', value: 'female' },
                      { label: 'Other', value: 'other' }
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Business Name"
                    icon={Building2}
                    value={profileForm.businessName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, businessName: e.target.value }))}
                    disabled={!editMode}
                    placeholder="Enter your business name"
                  />
                  
                  <Input
                    label="Daily Order Capacity"
                    icon={Package}
                    type="number"
                    value={profileForm.dailyOrders}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, dailyOrders: e.target.value }))}
                    disabled={!editMode}
                    placeholder="Enter daily capacity"
                  />
                </div>

                <Input.TextArea
                  label="Business Description"
                  value={profileForm.description}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, description: e.target.value }))}
                  disabled={!editMode}
                  placeholder="Describe your business and cuisine specialties"
                  rows={4}
                />

                {/* Cuisine Types */}
                <div>
                  <label className="block text-sm font-medium text-white mb-3">Cuisine Types</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {cuisineOptions.map((cuisine) => (
                      <button
                        key={cuisine}
                        type="button"
                        onClick={() => editMode && handleCuisineToggle(cuisine)}
                        disabled={!editMode}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          profileForm.cuisineTypes?.includes(cuisine)
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        } ${!editMode ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                      >
                        {cuisine.replace('_', ' ').charAt(0).toUpperCase() + cuisine.replace('_', ' ').slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {editMode && (
                  <Card.Footer>
                    <Button
                      onClick={handleSaveProfile}
                      loading={saving}
                      icon={Save}
                      fullWidth
                    >
                      Save Profile Changes
                    </Button>
                  </Card.Footer>
                )}
              </Card.Content>
            </Card>
          )}

          {/* Business Details Tab */}
          {activeTab === 'business' && (
            <Card className="p-6">
              <Card.Header>
                <Card.Title>Business Address</Card.Title>
              </Card.Header>

              <Card.Content className="space-y-4">
                <Input.TextArea
                  label="Street Address"
                  icon={MapPin}
                  value={addressForm.street}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, street: e.target.value }))}
                  placeholder="Enter street address"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="City"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Enter city"
                  />
                  
                  <Input
                    label="State"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="Enter state"
                  />
                  
                  <Input
                    label="Country"
                    value={addressForm.country}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="Enter country"
                  />
                  
                  <Input
                    label="ZIP Code"
                    value={addressForm.zipCode}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="Enter ZIP code"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Latitude"
                    type="number"
                    step="any"
                    value={addressForm.latitude}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                    placeholder="Enter latitude"
                  />
                  
                  <Input
                    label="Longitude"
                    type="number"
                    step="any"
                    value={addressForm.longitude}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                    placeholder="Enter longitude"
                  />
                </div>

                <Card.Footer>
                  <Button
                    onClick={handleSaveAddress}
                    loading={saving}
                    icon={Save}
                    fullWidth
                  >
                    Save Address
                  </Button>
                </Card.Footer>
              </Card.Content>
            </Card>
          )}

          {/* Operating Hours Tab */}
          {activeTab === 'operating' && (
            <Card className="p-6">
              <Card.Header>
                <Card.Title>Operating Hours</Card.Title>
              </Card.Header>

              <Card.Content className="space-y-4">
                <div className="space-y-4">
                  {operatingHoursForm.map((dayData, index) => (
                    <div key={dayData.day} className="p-4 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <div className="w-20">
                            <span className="text-white font-medium capitalize">{dayData.day}</span>
                          </div>
                          <button
                            onClick={() => toggleDayOpen(index)}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              dayData.isOpen ? 'bg-green-500' : 'bg-gray-600'
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                              dayData.isOpen ? 'translate-x-7' : 'translate-x-1'
                            }`} />
                          </button>
                          <span className={`px-3 py-1 rounded-full text-xs ${
                            dayData.isOpen ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {dayData.isOpen ? 'Open' : 'Closed'}
                          </span>
                        </div>
                      </div>
                      
                      {dayData.isOpen && (
                        <div className="flex items-center gap-4 ml-24">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <Input
                              type="time"
                              value={dayData.openTime}
                              onChange={(e) => handleOperatingHoursChange(index, 'openTime', e.target.value)}
                              className="w-32"
                            />
                          </div>
                          <span className="text-gray-400">to</span>
                          <Input
                            type="time"
                            value={dayData.closeTime}
                            onChange={(e) => handleOperatingHoursChange(index, 'closeTime', e.target.value)}
                            className="w-32"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Card.Footer>
                  <Button
                    onClick={handleSaveOperatingHours}
                    loading={saving}
                    icon={Save}
                    fullWidth
                  >
                    Save Operating Hours
                  </Button>
                </Card.Footer>
              </Card.Content>
            </Card>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <Card className="p-6">
              <Card.Header>
                <Card.Title>Business Documents</Card.Title>
              </Card.Header>

              <Card.Content className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Business License"
                    icon={FileText}
                    value={documentsForm.businessLicense}
                    onChange={(e) => setDocumentsForm(prev => ({ ...prev, businessLicense: e.target.value }))}
                    placeholder="Enter business license number"
                  />
                  
                  <Input
                    label="Food Safety License"
                    icon={Shield}
                    value={documentsForm.foodSafetyLicense}
                    onChange={(e) => setDocumentsForm(prev => ({ ...prev, foodSafetyLicense: e.target.value }))}
                    placeholder="Enter food safety license"
                  />
                  
                  <Input
                    label="Tax ID"
                    icon={CreditCard}
                    value={documentsForm.taxId}
                    onChange={(e) => setDocumentsForm(prev => ({ ...prev, taxId: e.target.value }))}
                    placeholder="Enter tax identification number"
                  />
                </div>

                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Bank Account Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Account Number"
                      value={documentsForm.bankAccount?.accountNumber}
                      onChange={(e) => setDocumentsForm(prev => ({ 
                        ...prev, 
                        bankAccount: { ...prev.bankAccount, accountNumber: e.target.value }
                      }))}
                      placeholder="Enter account number"
                    />
                    
                    <Input
                      label="IFSC Code"
                      value={documentsForm.bankAccount?.ifscCode}
                      onChange={(e) => setDocumentsForm(prev => ({ 
                        ...prev, 
                        bankAccount: { ...prev.bankAccount, ifscCode: e.target.value }
                      }))}
                      placeholder="Enter IFSC code"
                    />
                    
                    <Input
                      label="Account Holder Name"
                      value={documentsForm.bankAccount?.accountHolderName}
                      onChange={(e) => setDocumentsForm(prev => ({ 
                        ...prev, 
                        bankAccount: { ...prev.bankAccount, accountHolderName: e.target.value }
                      }))}
                      placeholder="Enter account holder name"
                    />
                    
                    <Input
                      label="Bank Name"
                      value={documentsForm.bankAccount?.bankName}
                      onChange={(e) => setDocumentsForm(prev => ({ 
                        ...prev, 
                        bankAccount: { ...prev.bankAccount, bankName: e.target.value }
                      }))}
                      placeholder="Enter bank name"
                    />
                  </div>
                </div>

                <Card.Footer>
                  <Button
                    onClick={handleSaveDocuments}
                    loading={saving}
                    icon={Save}
                    fullWidth
                  >
                    Save Documents
                  </Button>
                </Card.Footer>
              </Card.Content>
            </Card>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <Card className="p-6">
              <Card.Header>
                <Card.Title>Account Preferences</Card.Title>
              </Card.Header>

              <Card.Content className="space-y-6">
                {/* Notification Preferences */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Notification Settings</h4>
                  <div className="space-y-3">
                    {Object.entries(preferencesForm.notifications || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <label className="text-gray-300 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <button
                          onClick={() => setPreferencesForm(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, [key]: !value }
                          }))}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            value ? 'bg-orange-500' : 'bg-gray-600'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                            value ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Privacy Preferences */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Privacy Settings</h4>
                  <div className="space-y-3">
                    {Object.entries(preferencesForm.privacy || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <label className="text-gray-300 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <button
                          onClick={() => setPreferencesForm(prev => ({
                            ...prev,
                            privacy: { ...prev.privacy, [key]: !value }
                          }))}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            value ? 'bg-orange-500' : 'bg-gray-600'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                            value ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* General Preferences */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input.Select
                    label="Language"
                    icon={Globe}
                    value={preferencesForm.language}
                    onChange={(e) => setPreferencesForm(prev => ({ ...prev, language: e.target.value }))}
                    options={[
                      { label: 'English', value: 'en' },
                      { label: 'Hindi', value: 'hi' }
                    ]}
                  />
                  
                  <Input.Select
                    label="Currency"
                    value={preferencesForm.currency}
                    onChange={(e) => setPreferencesForm(prev => ({ ...prev, currency: e.target.value }))}
                    options={[
                      { label: 'INR (₹)', value: 'INR' },
                      { label: 'USD ($)', value: 'USD' }
                    ]}
                  />
                  
                  <Input.Select
                    label="Timezone"
                    value={preferencesForm.timezone}
                    onChange={(e) => setPreferencesForm(prev => ({ ...prev, timezone: e.target.value }))}
                    options={[
                      { label: 'Asia/Kolkata', value: 'Asia/Kolkata' },
                      { label: 'Asia/Mumbai', value: 'Asia/Mumbai' }
                    ]}
                  />
                </div>

                <Card.Footer>
                  <Button
                    onClick={handleSavePreferences}
                    loading={saving}
                    icon={Save}
                    fullWidth
                  >
                    Save Preferences
                  </Button>
                </Card.Footer>
              </Card.Content>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Card className="p-6">
              <Card.Header>
                <Card.Title>Change Password</Card.Title>
              </Card.Header>

              <Card.Content className="space-y-4">
                <Input
                  label="Current Password"
                  icon={Shield}
                  type={showPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                />
                
                <Input
                  label="New Password"
                  icon={Shield}
                  type={showPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                />
                
                <Input
                  label="Confirm New Password"
                  icon={Shield}
                  type={showPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                />

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showPassword ? 'Hide' : 'Show'} Password
                  </button>
                </div>

                <Card.Footer>
                  <Button
                    onClick={handleChangePassword}
                    loading={saving}
                    icon={Save}
                    fullWidth
                    disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  >
                    Change Password
                  </Button>
                </Card.Footer>
              </Card.Content>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
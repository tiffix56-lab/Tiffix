import React, { useState, useEffect } from 'react'
import { 
  Search, Filter, Users, Ban, UserCheck, UserX, Trash2, 
  Eye, Activity, Calendar, Crown, Shield, RefreshCw,
  TrendingUp, TrendingDown, BarChart3, PieChart, ChevronLeft, ChevronRight
} from 'lucide-react'
import {
  getUserOverviewApi,
  getAllUsersApi,
  getUserByIdApi,
  banUserApi,
  unbanUserApi,
  toggleUserStatusApi,
  deleteUserApi,
  getUserActivityStatsApi,
  searchUsersApi
} from '../../service/api.service'
import toast from 'react-hot-toast'

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 text-gray-400">
          <div className="text-sm text-center md:text-left">
              <p>Showing <span className="font-semibold text-white">{startItem}</span> to <span className="font-semibold text-white">{endItem}</span> of <span className="font-semibold text-white">{totalItems}</span> results</p>
          </div>
          <div className="flex items-center space-x-2">
              <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-700 text-white"
              >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
              </button>
              <span className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                  {currentPage} / {totalPages}
              </span>
              <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-700 text-white"
              >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
              </button>
          </div>
      </div>
  );
};

function UserManagement() {
  const [users, setUsers] = useState([])
  const [overview, setOverview] = useState(null)
  const [activityStats, setActivityStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showBanModal, setShowBanModal] = useState(false)
  const [banningUser, setBanningUser] = useState(null)
  const [banReason, setBanReason] = useState('')
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    role: '',
    status: '',
    hasSubscription: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  useEffect(() => {
    fetchUsers()
    fetchOverview()
    fetchActivityStats()
  }, [filters])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      )
      const response = await getAllUsersApi(cleanFilters)
      setUsers(Array.isArray(response.data.users) ? response.data.users : [])
      setPagination(response.data.pagination)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error fetching users')
      console.error('Error fetching users:', error)
      setUsers([])
      setPagination(null)
    }
    setLoading(false)
  }

  const fetchOverview = async () => {
    try {
      const response = await getUserOverviewApi()
      setOverview(response.data.overview)
    } catch (error) {
      console.error('Error fetching overview:', error)
    }
  }

  const fetchActivityStats = async () => {
    try {
      const response = await getUserActivityStatsApi()
      setActivityStats(response.data.activityStats)
    } catch (error) {
      console.error('Error fetching activity stats:', error)
    }
  }

  const handleBanUser = async () => {
    if (!banReason.trim()) {
      toast.error('Please provide a reason for banning')
      return
    }
    
    try {
      await banUserApi(banningUser.id, banReason)
      toast.success('User banned successfully')
      setShowBanModal(false)
      setBanningUser(null)
      setBanReason('')
      fetchUsers()
      fetchOverview()
    } catch (error) {
      console.error('Error banning user:', error)
      toast.error(error.response?.data?.message || 'Error banning user')
    }
  }

  const handleUnbanUser = async (user) => {
    try {
      await unbanUserApi(user.id)
      toast.success('User unbanned successfully')
      fetchUsers()
      fetchOverview()
    } catch (error) {
      console.error('Error unbanning user:', error)
      toast.error(error.response?.data?.message || 'Error unbanning user')
    }
  }

  const handleToggleStatus = async (user) => {
    try {
      await toggleUserStatusApi(user.id)
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`)
      fetchUsers()
      fetchOverview()
    } catch (error) {
      console.error('Error toggling user status:', error)
      toast.error(error.response?.data?.message || 'Error updating user status')
    }
  }

  const handleDeleteUser = async (user) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteUserApi(user.id)
        toast.success('User deleted successfully')
        fetchUsers()
        fetchOverview()
      } catch (error) {
        console.error('Error deleting user:', error)
        toast.error(error.response?.data?.message || 'Error deleting user')
      }
    }
  }

  const handleViewUserDetails = async (user) => {
    try {
      const response = await getUserByIdApi(user.id)
      setSelectedUser(response.data.user)
      setShowUserDetails(true)
    } catch (error) {
      console.error('Error fetching user details:', error)
      toast.error('Error loading user details')
    }
  }

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 12,
      role: '',
      status: '',
      hasSubscription: '',
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
  }

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-red-900/50 text-red-300'
      case 'vendor': return 'bg-blue-900/50 text-blue-300'
      case 'user': return 'bg-green-900/50 text-green-300'
      default: return 'bg-gray-700/50 text-gray-300'
    }
  }

  const getStatusColor = (status, isBanned) => {
    if (isBanned) return 'bg-red-900/50 text-red-300'
    if (status === 'active') return 'bg-green-900/50 text-green-300'
    return 'bg-gray-700/50 text-gray-400'
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-gray-400">Manage users, vendors, and administrators</p>
        </div>

        {/* Overview Statistics */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white">{overview.totalUsers || 0}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Users</p>
                  <p className="text-2xl font-bold text-white">{overview.totalActiveUsers || 0}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Premium Users</p>
                  <p className="text-2xl font-bold text-white">{overview.totalPremiumUsers || 0}</p>
                </div>
                <Crown className="w-8 h-8 text-orange-400" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Banned Users</p>
                  <p className="text-2xl font-bold text-white">{overview.totalBannedUsers || 0}</p>
                </div>
                <Ban className="w-8 h-8 text-red-400" />
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl shadow-xl p-4 md:p-6 mb-6 border border-gray-600">
          <div className="space-y-4">
            {/* Top Row - Search, Basic Filters */}
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
              <div className="flex flex-col md:flex-row flex-wrap gap-4 items-stretch md:items-center">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="w-full md:w-auto pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>

                {/* Role Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-orange-400" />
                  <select
                    className="flex-1 md:flex-none bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                    value={filters.role}
                    onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="" className="bg-gray-800">All Roles</option>
                    <option value="user" className="bg-gray-800">Users</option>
                    <option value="vendor" className="bg-gray-800">Vendors</option>
                    <option value="admin" className="bg-gray-800">Admins</option>
                  </select>
                </div>

                {/* Status Filter */}
                <select
                  className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="" className="bg-gray-800">All Status</option>
                  <option value="active" className="bg-gray-800">Active</option>
                  <option value="banned" className="bg-gray-800">Banned</option>
                </select>

                {/* Subscription Filter */}
                <select
                  className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                  value={filters.hasSubscription}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasSubscription: e.target.value }))}
                >
                  <option value="" className="bg-gray-800">All Subscriptions</option>
                  <option value="true" className="bg-gray-800">Premium</option>
                  <option value="false" className="bg-gray-800">Free</option>
                </select>
              </div>

              <button
                onClick={clearFilters}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 border border-gray-600 hover:border-gray-500"
              >
                <RefreshCw className="w-4 h-4" />
                Clear Filters
              </button>
            </div>

            {/* Sort Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-600">
              <select
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              >
                <option value="createdAt" className="bg-gray-800">Sort by Created Date</option>
                <option value="name" className="bg-gray-800">Sort by Name</option>
                <option value="emailAddress" className="bg-gray-800">Sort by Email</option>
                <option value="lastLogin" className="bg-gray-800">Sort by Last Login</option>
              </select>
              <select
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                value={filters.sortOrder}
                onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
              >
                <option value="desc" className="bg-gray-800">Descending</option>
                <option value="asc" className="bg-gray-800">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {users && users.length > 0 ? users.map((user) => (
            <div key={user._id} className="rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-lg overflow-hidden hover:shadow-xl hover:border-orange-500/50 transition-all duration-300">
              {/* Header */}
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {user.name || 'N/A'}
                    </h3>
                    <p className="text-sm text-gray-400 truncate">
                      {user.emailAddress || 'N/A'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                    {user.role || 'USER'}
                  </span>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status, user.isBanned)}`}>
                    {user.isBanned ? (
                      <>
                        <Ban className="w-3 h-3" />
                        Banned
                      </>
                    ) : user.isActive ? (
                      <>
                        <UserCheck className="w-3 h-3" />
                        Active
                      </>
                    ) : (
                      <>
                        <UserX className="w-3 h-3" />
                        Inactive
                      </>
                    )}
                  </span>
                </div>

                {/* User Info */}
                <div className="text-sm text-gray-400 space-y-1">
                  {user.createdAt && (
                    <p>📅 Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleViewUserDetails(user)}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg transition-colors text-sm"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
                <button
                  onClick={() => handleToggleStatus(user)}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 rounded-lg transition-colors text-sm"
                >
                  <Activity className="w-3 h-3" />
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </button>
                {user.isBanned ? (
                  <button
                    onClick={() => handleUnbanUser(user)}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded-lg transition-colors text-sm"
                  >
                    <UserCheck className="w-3 h-3" />
                    Unban
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setBanningUser(user)
                      setShowBanModal(true)
                    }}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg transition-colors text-sm"
                  >
                    <Ban className="w-3 h-3" />
                    Ban
                  </button>
                )}
                <button
                  onClick={() => handleDeleteUser(user)}
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
                <h3 className="text-lg font-medium text-white mb-2">No users found</h3>
                <p className="text-gray-400 mb-4">
                  {loading ? 'Loading users...' : 'No users match your current filters'}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {pagination && pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
          />
        )}
      </div>

      {/* Ban User Modal */}
      {showBanModal && banningUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full border border-gray-700 shadow-2xl">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-600 px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-400" />
                Ban User
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-300 mb-4">
                Are you sure you want to ban <strong>{banningUser.name}</strong>?
              </p>
              <textarea
                placeholder="Reason for banning (required)"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400 h-24"
                required
              />
              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowBanModal(false)
                    setBanningUser(null)
                    setBanReason('')
                  }}
                  className="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanUser}
                  className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 shadow-lg shadow-red-500/25"
                >
                  Ban User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-600 px-6 py-4 rounded-t-xl">
              <h2 className="text-xl font-semibold text-white">User Details</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Name</p>
                    <p className="text-white">{selectedUser.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="text-white">{selectedUser.emailAddress || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Phone</p>
                    <p className="text-white">
                      {selectedUser.phoneNumber?.internationalNumber || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Role</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                      {selectedUser.role || 'USER'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Joined</p>
                    <p className="text-white">
                      {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              {selectedUser.profile && (
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Profile Information</h3>
                  <div className="space-y-2">
                    {selectedUser.profile.address && (
                      <div>
                        <p className="text-sm text-gray-400">Address</p>
                        <p className="text-white">{selectedUser.profile.address}</p>
                      </div>
                    )}
                    {selectedUser.profile.preferences && (
                      <div>
                        <p className="text-sm text-gray-400">Preferences</p>
                        <p className="text-white">{JSON.stringify(selectedUser.profile.preferences)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/25"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
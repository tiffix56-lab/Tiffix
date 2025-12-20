import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Users, Eye, RefreshCw, ChevronLeft, ChevronRight,
  Gift, Crown, UserCheck, UserX, Package, Calendar
} from 'lucide-react';
import { getReferralUsersApi, getReferralUserByIdApi } from '../../service/api.service';
import toast from 'react-hot-toast';

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between mt-8 text-gray-400">
      <div>
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

function Referals() {
  const [referralUsers, setReferralUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    search: '',
    sortBy: 'referralUsedAt',
    sortOrder: 'desc',
    hasActiveSubscription: '',
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchReferralUsers = async () => {
    setLoading(true);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== '')
      );
      const response = await getReferralUsersApi(cleanFilters);
      setReferralUsers(response.data.users || []);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error fetching referral users');
      console.error('Error fetching referral users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralUsers();
  }, [filters]);

  const handleViewDetails = async (userId) => {
    setDetailsLoading(true);
    setShowDetailsModal(true);
    // The list already contains all the needed info. We can just find the user.
    const user = referralUsers.find(u => u._id === userId);
    if(user) {
        setSelectedUser(user);
        setDetailsLoading(false);
    } else {
        // As a fallback, if not in the list, fetch it.
        try {
            const response = await getReferralUserByIdApi(userId);
            setSelectedUser(response.data);
          } catch (error) {
            toast.error(error.response?.data?.message || 'Error fetching user details');
            setShowDetailsModal(false);
          } finally {
            setDetailsLoading(false);
          }
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, page: 1, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 12,
      search: '',
      sortBy: 'referralUsedAt',
      sortOrder: 'desc',
      hasActiveSubscription: '',
    });
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
    return new Date(istDate).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Referral Management</h1>
        <p className="text-gray-400">View users who have joined through a referral.</p>
      </div>

      <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl shadow-xl p-6 mb-6 border border-gray-600">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, email, code..."
                className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-orange-400" />
              <select
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                value={filters.hasActiveSubscription}
                onChange={(e) => handleFilterChange('hasActiveSubscription', e.target.value)}
              >
                <option value="">All Subscriptions</option>
                <option value="true">Has Active Subscription</option>
                <option value="false">No Active Subscription</option>
              </select>
            </div>
            <select
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="referralUsedAt">Sort by Referral Date</option>
                <option value="name">Sort by Name</option>
                <option value="createdAt">Sort by Join Date</option>
              </select>
              <select
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
          </div>
          <button
            onClick={clearFilters}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 border border-gray-600 hover:border-gray-500"
          >
            <RefreshCw className="w-4 h-4" />
            Clear Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {loading ? (
          <p className='text-white col-span-full text-center'>Loading...</p>
        ) : referralUsers.length > 0 ? referralUsers.map((user) => (
          <div key={user._id} className="rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-lg overflow-hidden hover:shadow-xl hover:border-orange-500/50 transition-all duration-300">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white truncate">{user.name}</h3>
                  <p className="text-sm text-gray-400 truncate">{user.emailAddress}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.subscriptionDetails?.status === 'active' ? 'bg-green-900/50 text-green-300' : 'bg-gray-700/50 text-gray-300'}`}>
                  {user.subscriptionDetails?.status === 'active' ? 'Subscribed' : 'Not Subscribed'}
                </span>
              </div>
              <div className="text-sm text-gray-400 space-y-1">
                <p>🔑 Joined with code: <span className='font-bold text-orange-400'>{user.referral.usedReferralDetails.referralCode}</span></p>
                <p>📅 Referral on: {user.referral.referralUsedAt}</p>
                <p>👤 Referred by: {user.referrerDetails?.name || 'Account deleted'}</p>
              </div>
            </div>
            <div className="p-4">
              <button
                onClick={() => handleViewDetails(user._id)}
                className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg transition-colors text-sm"
              >
                <Eye className="w-3 h-3" />
                View Details
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full text-center py-12">
            <Users className="w-24 h-24 mx-auto mb-4 text-gray-500" />
            <h3 className="text-lg font-medium text-white mb-2">No referral users found</h3>
            <p className="text-gray-400">No users match your current filters.</p>
          </div>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalUsers}
          itemsPerPage={pagination.limit}
          onPageChange={(page) => handleFilterChange('page', page)}
        />
      )}

      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-600 px-6 py-4 rounded-t-xl">
              <h2 className="text-xl font-semibold text-white">Referral Details</h2>
            </div>
            {detailsLoading ? (
              <div className='p-6 text-white'>Loading details...</div>
            ) : selectedUser && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">User Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-sm text-gray-400">Name</p><p className="text-white">{selectedUser.name}</p></div>
                    <div><p className="text-sm text-gray-400">Email</p><p className="text-white">{selectedUser.emailAddress}</p></div>
                    <div><p className="text-sm text-gray-400">Phone</p><p className="text-white">{selectedUser.phoneNumber.internationalNumber}</p></div>
                    <div><p className="text-sm text-gray-400">Joined</p><p className="text-white">{formatDate(selectedUser.createdAt)}</p></div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Referral Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-sm text-gray-400">Used Code</p><p className="text-white">{selectedUser.referral.usedReferralDetails.referralCode}</p></div>
                    <div><p className="text-sm text-gray-400">Referred On</p><p className="text-white">{selectedUser.referral.referralUsedAt}</p></div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Referred By</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-sm text-gray-400">Name</p><p className="text-white">{selectedUser.referrerDetails?.name || 'Account deleted'}</p></div>
                    <div><p className="text-sm text-gray-400">Email</p><p className="text-white">{selectedUser.referrerDetails?.emailAddress || 'Account deleted'}</p></div>
                  </div>
                </div>
                
                {selectedUser.subscriptionDetails ? (
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Active Subscription</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-sm text-gray-400">Plan</p><p className="text-white">{selectedUser.planDetails.planName}</p></div>
                        <div><p className="text-sm text-gray-400">Start Date</p><p className="text-white">{selectedUser.subscriptionDetails.startDate}</p></div>
                        <div><p className="text-sm text-gray-400">End Date</p><p className="text-white">{selectedUser.subscriptionDetails.endDate}</p></div>
                        <div><p className="text-sm text-gray-400">Status</p><p className="text-white capitalize">{selectedUser.subscriptionDetails.status}</p></div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Subscription Status</h3>
                    <p className="text-gray-400">This user does not have an active subscription.</p>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button onClick={() => setShowDetailsModal(false)} className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/25">
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Referals;
import { useState, useEffect } from 'react';
import { 
  Users, Gift, TrendingUp, Eye, Search, Filter, Calendar, 
  UserCheck, Award, RefreshCw, RotateCcw, Trophy, ShieldCheck, Ban
} from 'lucide-react';
import {
  getReferralSystemStatsApi,
  getReferralAnalyticsApi,
  disableUserReferralApi,
  enableUserReferralApi,
  processReferralRewardApi,
  getReferralLeaderboardApi
} from '../../service/api.service';
import toast from 'react-hot-toast';

const Referals = () => {
  const [referralData, setReferralData] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [systemStats, setSystemStats] = useState({
    overall: {
      totalUsers: 0,
      totalReferrers: 0,
      totalReferralUsers: 0,
      totalCreditsAwarded: 0,
      activeReferrers: 0
    },
    conversionRate: '0.00%',
    avgCreditsPerReferrer: 0
  });
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showProcessRewardModal, setShowProcessRewardModal] = useState(false);
  const [processingUserId, setProcessingUserId] = useState(null);
  const [togglingUserId, setTogglingUserId] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    sortBy: 'totalreferralCredits',
    sortOrder: 'desc',
    startDate: '',
    endDate: ''
  });

  // Process reward form
  const [rewardForm, setRewardForm] = useState({
    subscriptionAmount: ''
  });

  // Stats from system and calculated
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeReferrers: 0,
    totalRewards: 0,
    pendingRewards: 0,
    completedReferrals: 0,
    conversionRate: 0
  });

  const fetchSystemStats = async () => {
    try {
      const data = await getReferralSystemStatsApi();
      console.log('System Stats:', data);
      if (data.systemStats) {
        setSystemStats(data.systemStats);
        
        // Update local stats with system stats
        setStats(prev => ({
          ...prev,
          totalUsers: data.systemStats.overall.totalUsers || 0,
          activeReferrers: data.systemStats.overall.activeReferrers || 0,
          totalRewards: data.systemStats.overall.totalCreditsAwarded || 0,
          conversionRate: parseFloat(data.systemStats.conversionRate) || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching system stats:', error);
      toast.error('Error fetching system statistics');
    }
  };

  const fetchReferralAnalytics = async () => {
    setLoading(true);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      
      if (searchTerm.trim()) {
        cleanFilters.search = searchTerm.trim();
      }

      const data = await getReferralAnalyticsApi(cleanFilters);
      console.log('Referral Analytics:', data);
      
      // Handle different possible response structures for analytics
      const users = data.analytics || data.data?.analytics || data.data?.users || data.data || [];
      setReferralData(users);
      
      // Update stats with analytics data while preserving system stats
      const totalRewards = users.reduce((sum, user) => sum + (user.totalReferralCredits || 0), 0);
      const activeReferrers = users.filter(user => (user.totalReferrals || 0) > 0).length;
      const totalReferrals = users.reduce((sum, user) => sum + (user.totalReferrals || 0), 0);
      
      setStats(prev => ({
        ...prev,
        // Use system stats if available, fallback to calculated stats
        totalUsers: systemStats.overall?.totalUsers || users.length,
        activeReferrers: systemStats.overall?.activeReferrers || activeReferrers,
        totalRewards: systemStats.overall?.totalCreditsAwarded || totalRewards,
        completedReferrals: totalReferrals,
        conversionRate: parseFloat(systemStats.conversionRate) || (users.length > 0 ? Math.round((activeReferrers / users.length) * 100) : 0)
      }));
      
    } catch (error) {
      console.error('Error fetching referral analytics:', error);
      toast.error(error.response?.data?.message || 'Error fetching referral analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const data = await getReferralLeaderboardApi({ limit: 20 });
      console.log('Leaderboard:', data);
      // Handle different possible response structures
      const leaderboardData = data.leaderboard || data.data?.leaderboard || data.data || [];
      setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Error fetching leaderboard');
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const handleToggleUserReferral = async (userId, isEnabled) => {
    setTogglingUserId(userId);
    try {
      if (isEnabled) {
        await disableUserReferralApi(userId, { reason: 'Disabled by admin' });
        toast.success('User referral capability disabled');
      } else {
        await enableUserReferralApi(userId);
        toast.success('User referral capability enabled');
      }
      fetchReferralAnalytics();
    } catch (error) {
      console.error('Error toggling user referral:', error);
      toast.error(error.response?.data?.message || 'Error updating user referral status');
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleProcessReward = async () => {
    if (!rewardForm.subscriptionAmount || !selectedReferral) {
      toast.error('Please enter subscription amount');
      return;
    }

    setProcessingUserId(selectedReferral.userId._id);
    try {
      await processReferralRewardApi(selectedReferral.userId._id, {
        subscriptionAmount: parseFloat(rewardForm.subscriptionAmount)
      });
      toast.success('Referral reward processed successfully!');
      setShowProcessRewardModal(false);
      setRewardForm({ subscriptionAmount: '' });
      fetchReferralAnalytics();
    } catch (error) {
      console.error('Error processing referral reward:', error);
      toast.error(error.response?.data?.message || 'Error processing referral reward');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: 'totalreferralCredits',
      sortOrder: 'desc',
      startDate: '',
      endDate: ''
    });
    setSearchTerm('');
  };

  const hasActiveFilters = () => {
    return filters.startDate || filters.endDate || searchTerm;
  };

  useEffect(() => {
    fetchSystemStats();
    fetchReferralAnalytics();
  }, [filters]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };


  const getStatusBadge = (isActive) => {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${
          isActive ? 'bg-green-400' : 'bg-red-400'
        }`}></span>
        {isActive ? 'Active' : 'Disabled'}
      </span>
    );
  };

  const sortOptions = [
    { value: 'totalreferralCredits', label: 'Total Referral Credits' },
    { value: 'totalReferrals', label: 'Total Referrals' },
    { value: 'createdAt', label: 'Registration Date' }
  ];


  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
            <div className="text-lg text-gray-400">Loading referral data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Referral Management</h1>
          <p className="text-gray-400 mt-1">Track and manage user referrals and rewards system</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchLeaderboard();
              setShowLeaderboardModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </button>
          <button
            onClick={() => {
              fetchSystemStats();
              fetchReferralAnalytics();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-white">{systemStats.overall?.totalUsers || 0}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Referrers</p>
              <p className="text-2xl font-bold text-white">{systemStats.overall?.activeReferrers || 0}</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Credits Awarded</p>
              <p className="text-2xl font-bold text-white">₹{systemStats.overall?.totalCreditsAwarded || 0}</p>
            </div>
            <Award className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Conversion Rate</p>
              <p className="text-2xl font-bold text-white">{systemStats.conversionRate || '0.00%'}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-white">Search & Filters</h2>
          </div>
          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
            >
              <RotateCcw className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>
        
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by user name, email, or referral code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full"
            />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
          >
            <option value="desc">Highest First</option>
            <option value="asc">Lowest First</option>
          </select>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Referral Data List */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-white">User Referral Analytics</h3>
          </div>
        </div>

        {referralData?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Referral Code</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Referrals</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Credits Earned</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {referralData.map((user) => (
                  <tr key={user.userId._id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {user.userId.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm text-white font-medium">{user.userId.name}</div>
                          <div className="text-xs text-gray-400">{user.userId.emailAddress}</div>
                          {user.userId.phoneNumber && (
                            <div className="text-xs text-gray-500">{user.userId.phoneNumber.internationalNumber}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm bg-gray-700 px-2 py-1 rounded text-orange-400">
                        {user.referralCode || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-white font-semibold">{user.totalReferrals || 0}</div>
                        <div className="text-gray-400 text-xs">successful referrals</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-orange-400 font-semibold">₹{user.totalReferralCredits || 0}</div>
                        <div className="text-gray-400 text-xs">total earned</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user.userId.isActive !== false)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white">{formatDate(user.userId.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedReferral(user);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleToggleUserReferral(user.userId._id, user.userId.isActive !== false)}
                          disabled={togglingUserId === user.userId._id}
                          className={`transition-colors disabled:opacity-50 ${
                            user.userId.isActive !== false 
                              ? 'text-red-400 hover:text-red-300' 
                              : 'text-green-400 hover:text-green-300'
                          }`}
                          title={user.userId.isActive !== false ? 'Disable Referrals' : 'Enable Referrals'}
                        >
                          {togglingUserId === user.userId._id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : user.userId.isActive !== false ? (
                            <Ban className="w-4 h-4" />
                          ) : (
                            <ShieldCheck className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setSelectedReferral(user);
                            setShowProcessRewardModal(true);
                          }}
                          className="text-purple-400 hover:text-purple-300 transition-colors"
                          title="Process Reward"
                        >
                          <Gift className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <div className="text-lg text-gray-400 mb-2">No referral data found</div>
            <div className="text-sm text-gray-500">Referral analytics will appear here as users join</div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showDetailsModal && selectedReferral && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-4xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">User Referral Details</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedReferral(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* User Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-400 text-sm">User Name</p>
                  <p className="text-white font-medium mt-1">{selectedReferral.userId.name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white mt-1">{selectedReferral.userId.emailAddress}</p>
                </div>
              </div>

              {selectedReferral.userId.phoneNumber && (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-400 text-sm">Phone Number</p>
                    <p className="text-white mt-1">{selectedReferral.userId.phoneNumber.internationalNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedReferral.userId.isActive !== false)}</div>
                  </div>
                </div>
              )}

              {/* Referral Statistics */}
              <div>
                <h4 className="text-white font-medium mb-3">Referral Statistics</h4>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-gray-400 text-sm">Referral Code</p>
                      <p className="text-orange-400 font-mono text-lg mt-1">{selectedReferral.referralCode || 'Not Generated'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Total Referrals</p>
                      <p className="text-white font-semibold text-xl mt-1">{selectedReferral.totalReferrals || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Credits Earned</p>
                      <p className="text-orange-400 font-semibold text-xl mt-1">₹{selectedReferral.totalReferralCredits || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedReferral(null);
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowProcessRewardModal(true);
                  }}
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Process Reward
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLeaderboardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-3xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">Referral Leaderboard</h3>
              </div>
              <button
                onClick={() => setShowLeaderboardModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            {leaderboardLoading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            ) : leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.map((user, index) => (
                  <div key={user._id || index} className="flex items-center gap-4 p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 font-bold text-white">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{user.name || 'Unknown User'}</div>
                      <div className="text-gray-400 text-sm">{user.emailAddress || user.email || 'No email'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-orange-400 font-semibold">{user.totalReferrals || 0} referrals</div>
                      <div className="text-gray-400 text-sm">₹{user.totalReferralCredits || 0} earned</div>
                    </div>
                    {index < 3 && (
                      <div className="text-yellow-400">
                        <Trophy className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <div className="text-lg text-gray-400 mb-2">No leaderboard data</div>
                <div className="text-sm text-gray-500">Leaderboard will show when users make referrals</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Process Reward Modal */}
      {showProcessRewardModal && selectedReferral && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Process Referral Reward</h3>
              <button
                onClick={() => {
                  setShowProcessRewardModal(false);
                  setRewardForm({ subscriptionAmount: '' });
                }}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-300 mb-2">User: <span className="text-white font-medium">{selectedReferral.userId.name}</span></p>
                <p className="text-gray-300 mb-2">Current Credits: <span className="text-orange-400 font-semibold">₹{selectedReferral.totalReferralCredits || 0}</span></p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subscription Amount *
                </label>
                <input
                  type="number"
                  value={rewardForm.subscriptionAmount}
                  onChange={(e) => setRewardForm(prev => ({ ...prev, subscriptionAmount: e.target.value }))}
                  placeholder="Enter subscription amount"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-gray-400 text-xs mt-1">This will trigger referral reward calculation based on subscription amount</p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    setShowProcessRewardModal(false);
                    setRewardForm({ subscriptionAmount: '' });
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessReward}
                  disabled={processingUserId === selectedReferral.userId._id}
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {processingUserId === selectedReferral.userId._id ? 'Processing...' : 'Process Reward'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Referals;
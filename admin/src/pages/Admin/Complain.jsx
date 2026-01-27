import React, { useState, useEffect } from 'react'
import { 
  Trash2, RefreshCw, Search, Calendar, Phone, User, MessageSquare, AlertCircle,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import {
  getComplainsApi,
  deleteComplainApi
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

function Complain() {
  const [complains, setComplains] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState(null)
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    phoneNumber: '',
    startDate: '',
    endDate: ''
  })

  const fetchComplains = async () => {
    setLoading(true)
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      )
      
      const response = await getComplainsApi(cleanFilters)
      setComplains(response.data.complains || [])
      setPagination(response.data.pagination)
      
    } catch (error) {
      console.error('Error fetching complains:', error)
      toast.error(error.response?.data?.message || 'Error fetching complains')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComplains()
  }, [filters])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      phoneNumber: '',
      startDate: '',
      endDate: ''
    })
  }

  const handleDelete = async (complainId) => {
    if (!window.confirm('Are you sure you want to delete this complaint?')) {
      return
    }

    try {
      await deleteComplainApi(complainId)
      toast.success('Complaint deleted successfully')
      fetchComplains()
    } catch (error) {
      console.error('Error deleting complaint:', error)
      toast.error(error.response?.data?.message || 'Error deleting complaint')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Complaints</h1>
          <p className="text-gray-400 mt-1">Manage user complaints and feedback</p>
        </div>
        <button
          onClick={fetchComplains}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Filter by Phone Number"
              value={filters.phoneNumber}
              onChange={(e) => handleFilterChange('phoneNumber', e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#1E2938] border border-gray-600 rounded-lg text-white w-full focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#1E2938] border border-gray-600 rounded-lg text-white w-full focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#1E2938] border border-gray-600 rounded-lg text-white w-full focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1E2938] rounded-xl border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
              <div className="text-lg text-gray-400">Loading complaints...</div>
            </div>
          </div>
                ) : complains.length > 0 ? (
                  <>
                    <div className="overflow-x-auto hidden md:block">
                      <table className="w-full">
                        <thead className="bg-gray-800/50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User Info</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Reason</th>
                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {complains.map((complain) => (
                            <tr key={complain._id} className="hover:bg-gray-700/30 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {formatDate(complain.createdAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="text-white font-medium flex items-center gap-2">
                                    <User className="w-4 h-4 text-orange-400" />
                                    {complain.name}
                                  </span>
                                  <span className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                                    <Phone className="w-3 h-3" />
                                    {complain.phoneNumber}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 text-orange-400" />
                                  {complain.title}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-300">
                                <div className="flex items-start gap-2 max-w-md">
                                  <MessageSquare className="w-4 h-4 text-gray-500 mt-1 shrink-0" />
                                  <span className="whitespace-pre-wrap" title={complain.reason}>
                                    {complain.reason}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleDelete(complain._id)}
                                  className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-400/10 rounded-lg"
                                  title="Delete Complaint"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
        
                    <div className="md:hidden space-y-4 p-4">
                      {complains.map((complain) => (
                        <div key={complain._id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex flex-col">
                              <span className="text-white font-medium flex items-center gap-2">
                                <User className="w-4 h-4 text-orange-400" />
                                {complain.name}
                              </span>
                              <span className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                                <Phone className="w-3 h-3" />
                                {complain.phoneNumber}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatDate(complain.createdAt)}
                            </div>
                          </div>
        
                          <div className="mb-3">
                            <div className="flex items-center gap-2 text-sm text-white font-medium mb-1">
                              <AlertCircle className="w-4 h-4 text-orange-400" />
                              {complain.title}
                            </div>
                            <div className="text-sm text-gray-300 ml-6">
                              {complain.reason}
                            </div>
                          </div>
        
                          <div className="flex justify-end pt-3 border-t border-gray-700">
                            <button
                              onClick={() => handleDelete(complain._id)}
                              className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 hover:bg-red-400/10 rounded-lg text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No complaints found</h3>
            <p className="text-gray-400">
              No complaints match your current filters
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <Pagination
          currentPage={pagination.current}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={(page) => handleFilterChange('page', page)}
        />
      )}
    </div>
  )
}

export default Complain

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  XCircle, Plus, Edit2, Power, X, Check, Clock, User,
  AlertCircle, Search, ChevronRight, ChevronLeft
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const CancelReasonsManagement = () => {
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchReasons();
  }, []);

  const fetchReasons = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/cancel-reasons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReasons(response.data || []);
    } catch (error) {
      console.error('Error fetching cancel reasons:', error);
      toast.error('فشل تحميل أسباب الإلغاء');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReason = async () => {
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم السبب');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/cancel-reasons`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('تم إضافة سبب الإلغاء بنجاح');
      setShowAddModal(false);
      setFormData({ name: '', description: '' });
      fetchReasons();
    } catch (error) {
      console.error('Error adding cancel reason:', error);
      toast.error(error.response?.data?.detail || 'فشل إضافة سبب الإلغاء');
    }
  };

  const handleEditReason = async () => {
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم السبب');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/cancel-reasons/${selectedReason.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('تم تحديث سبب الإلغاء بنجاح');
      setShowEditModal(false);
      setSelectedReason(null);
      setFormData({ name: '', description: '' });
      fetchReasons();
    } catch (error) {
      console.error('Error updating cancel reason:', error);
      toast.error(error.response?.data?.detail || 'فشل تحديث سبب الإلغاء');
    }
  };

  const handleToggleStatus = async (reason) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_URL}/cancel-reasons/${reason.id}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message);
      fetchReasons();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('فشل تغيير حالة سبب الإلغاء');
    }
  };

  const openEditModal = (reason) => {
    setSelectedReason(reason);
    setFormData({
      name: reason.name,
      description: reason.description || ''
    });
    setShowEditModal(true);
  };

  // فلترة الأسباب
  const getFilteredReasons = () => {
    if (!searchQuery.trim()) return reasons;
    const query = searchQuery.trim().toLowerCase();
    return reasons.filter(reason => 
      reason.name?.toLowerCase().includes(query) ||
      reason.description?.toLowerCase().includes(query)
    );
  };

  const filteredReasons = getFilteredReasons();
  const totalPages = Math.ceil(filteredReasons.length / itemsPerPage);
  const paginatedReasons = filteredReasons.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // إحصائيات
  const stats = {
    total: reasons.length,
    active: reasons.filter(r => r.is_active).length,
    inactive: reasons.filter(r => !r.is_active).length
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <XCircle className="w-7 h-7 text-red-600" />
            إدارة أسباب الإلغاء
          </h2>
          <p className="text-gray-500 text-sm mt-1">إضافة وتعديل أسباب إلغاء الاستفادات</p>
        </div>
        <Button
          onClick={() => {
            setFormData({ name: '', description: '' });
            setShowAddModal(true);
          }}
          className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          إضافة سبب جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">إجمالي الأسباب</p>
              <p className="text-2xl font-bold text-gray-700 mt-1">{stats.total}</p>
            </div>
            <div className="bg-gray-200 p-2 rounded-lg">
              <XCircle className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 font-medium">نشط</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{stats.active}</p>
            </div>
            <div className="bg-green-200 p-2 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-600 font-medium">متوقف</p>
              <p className="text-2xl font-bold text-red-700 mt-1">{stats.inactive}</p>
            </div>
            <div className="bg-red-200 p-2 rounded-lg">
              <Power className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="ابحث في أسباب الإلغاء..."
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-gray-500 mt-2">
            تم العثور على <span className="font-bold text-red-600">{filteredReasons.length}</span> نتيجة
          </p>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">#</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الاسم</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الوصف</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الحالة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">تاريخ الإنشاء</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">أنشئ بواسطة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">آخر تعديل</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-500">جاري التحميل...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedReasons.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    <XCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>لا توجد أسباب إلغاء</p>
                  </td>
                </tr>
              ) : (
                paginatedReasons.map((reason, index) => {
                  const actualIndex = (currentPage - 1) * itemsPerPage + index;
                  return (
                    <tr key={reason.id} className={`hover:bg-gray-50 ${!reason.is_active ? 'bg-gray-50 opacity-60' : ''}`}>
                      <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                        {actualIndex + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{reason.name}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                        {reason.description || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {reason.is_active ? (
                          <span className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium w-fit">
                            <Check className="w-3 h-3" />
                            نشط
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium w-fit">
                            <Power className="w-3 h-3" />
                            متوقف
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {reason.created_at ? new Date(reason.created_at).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {reason.created_by_user_name || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {reason.updated_at ? (
                          <div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(reason.updated_at).toLocaleDateString('ar-SA', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            {reason.updated_by_user_name && (
                              <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                <User className="w-3 h-3" />
                                {reason.updated_by_user_name}
                              </div>
                            )}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(reason)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="تعديل"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(reason)}
                            className={`p-2 rounded-lg transition-colors ${
                              reason.is_active 
                                ? 'text-red-600 hover:bg-red-50' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={reason.is_active ? 'إيقاف' : 'تفعيل'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filteredReasons.length > 0 && (
          <div className="bg-gray-50 px-4 py-3 border-t flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>عرض</span>
              <span className="font-bold text-gray-800">
                {Math.min((currentPage - 1) * itemsPerPage + 1, filteredReasons.length)}
              </span>
              <span>إلى</span>
              <span className="font-bold text-gray-800">
                {Math.min(currentPage * itemsPerPage, filteredReasons.length)}
              </span>
              <span>من</span>
              <span className="font-bold text-gray-800">{filteredReasons.length}</span>
              <span>سبب</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1"
              >
                <ChevronRight className="w-4 h-4" />
                السابق
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (totalPages <= 5) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, idx, arr) => (
                    <React.Fragment key={page}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <span className="text-gray-400 px-1">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-red-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1"
              >
                التالي
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-5 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Plus className="w-6 h-6" />
                <h3 className="text-lg font-bold">إضافة سبب إلغاء جديد</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  اسم السبب <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: عدم الحاجة"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  الوصف (اختياري)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف مختصر للسبب..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-2xl">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleAddReason}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Check className="w-4 h-4 ml-2" />
                إضافة
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit2 className="w-6 h-6" />
                <h3 className="text-lg font-bold">تعديل سبب الإلغاء</h3>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedReason(null);
                }}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  اسم السبب <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: عدم الحاجة"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  الوصف (اختياري)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف مختصر للسبب..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              {/* Info */}
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>تاريخ الإنشاء: {selectedReason.created_at ? new Date(selectedReason.created_at).toLocaleString('ar-SA') : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3" />
                  <span>أنشئ بواسطة: {selectedReason.created_by_user_name || '-'}</span>
                </div>
                {selectedReason.updated_at && (
                  <>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>آخر تعديل: {new Date(selectedReason.updated_at).toLocaleString('ar-SA')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3" />
                      <span>عدّل بواسطة: {selectedReason.updated_by_user_name || '-'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-2xl">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedReason(null);
                }}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleEditReason}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Check className="w-4 h-4 ml-2" />
                حفظ التعديلات
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CancelReasonsManagement;

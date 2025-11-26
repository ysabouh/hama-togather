import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  DollarSign, Users, TrendingUp, Calendar, Search, 
  Filter, Eye, Edit, Check, Clock, AlertCircle, X,
  Gift, Phone, Mail, Package, MapPin, Download, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DonationsManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [donations, setDonations] = useState([]);
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    uniqueDonors: 0
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [donationsRes, familiesRes] = await Promise.all([
        axios.get(`${API_URL}/donations`),
        axios.get(`${API_URL}/families`)
      ]);

      setDonations(donationsRes.data || []);
      setFamilies(familiesRes.data || []);
      calculateStats(donationsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (donationsData) => {
    const total = donationsData.length;
    const totalAmount = donationsData.reduce((sum, d) => {
      const amount = parseFloat(d.amount) || 0;
      return sum + amount;
    }, 0);
    
    const pending = donationsData.filter(d => d.status === 'معلق' || !d.status).length;
    const inProgress = donationsData.filter(d => d.status === 'قيد التنفيذ').length;
    const completed = donationsData.filter(d => d.status === 'مكتمل').length;
    const cancelled = donationsData.filter(d => d.status === 'ملغي').length;
    
    const uniqueDonors = new Set(donationsData.map(d => d.donor_email || d.donor_name)).size;

    setStats({
      total,
      totalAmount,
      pending,
      inProgress,
      completed,
      cancelled,
      uniqueDonors
    });
  };

  const getFamilyById = (familyId) => {
    return families.find(f => f.id === familyId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    try {
      const date = new Date(dateString);
      // التاريخ الميلادي بصيغة DD/MM/YYYY
      const dateStr = date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      // الوقت بنظام 24 ساعة
      const timeStr = date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      return `${dateStr} ${timeStr}`;
    } catch {
      return 'غير محدد';
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return '0';
    return new Intl.NumberFormat('ar-SY').format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'مكتمل':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'قيد التنفيذ':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ملغي':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'معلق':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'مكتمل':
        return <Check className="w-4 h-4" />;
      case 'قيد التنفيذ':
        return <Clock className="w-4 h-4" />;
      case 'ملغي':
        return <X className="w-4 h-4" />;
      case 'معلق':
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedDonation || !newStatus) return;

    try {
      await axios.put(`${API_URL}/donations/${selectedDonation.id}`, {
        status: newStatus
      });

      toast.success('تم تحديث حالة التبرع بنجاح');
      setShowStatusModal(false);
      setSelectedDonation(null);
      setNewStatus('');
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('حدث خطأ في تحديث الحالة');
    }
  };

  const filteredDonations = donations.filter(donation => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      donation.donor_name?.toLowerCase().includes(searchLower) ||
      donation.donor_email?.toLowerCase().includes(searchLower) ||
      donation.donor_phone?.includes(searchTerm) ||
      donation.description?.toLowerCase().includes(searchLower);

    if (searchTerm && !matchesSearch) return false;

    // Status filter
    if (statusFilter !== 'all') {
      const donationStatus = donation.status || 'معلق';
      if (donationStatus !== statusFilter) return false;
    }

    // Date filter
    if (dateFilter !== 'all') {
      const donationDate = new Date(donation.created_at);
      const now = new Date();
      
      if (dateFilter === 'today') {
        const isToday = donationDate.toDateString() === now.toDateString();
        if (!isToday) return false;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (donationDate < weekAgo) return false;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (donationDate < monthAgo) return false;
      }
    }

    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl p-8 animate-pulse">
              <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">إدارة التبرعات</h1>
                <p className="text-emerald-100">متابعة وإدارة جميع التبرعات والمساعدات المقدمة</p>
              </div>
              <button
                onClick={fetchData}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-xl font-bold transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span>تحديث</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Cards */}
      <section className="py-8 -mt-8 relative z-10">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Donations */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-emerald-500">
                <div className="flex items-center justify-between mb-3">
                  <Gift className="w-10 h-10 text-emerald-600" />
                  <span className="text-4xl font-bold text-gray-900">{stats.total}</span>
                </div>
                <p className="text-gray-600 font-semibold">إجمالي التبرعات</p>
              </div>

              {/* Total Amount */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
                <div className="flex items-center justify-between mb-3">
                  <DollarSign className="w-10 h-10 text-blue-600" />
                  <span className="text-3xl font-bold text-gray-900">{formatAmount(stats.totalAmount)}</span>
                </div>
                <p className="text-gray-600 font-semibold">إجمالي المبلغ (ل.س)</p>
              </div>

              {/* Unique Donors */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-purple-500">
                <div className="flex items-center justify-between mb-3">
                  <Users className="w-10 h-10 text-purple-600" />
                  <span className="text-4xl font-bold text-gray-900">{stats.uniqueDonors}</span>
                </div>
                <p className="text-gray-600 font-semibold">عدد المتبرعين</p>
              </div>

              {/* Status Summary */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-amber-500">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">معلقة:</span>
                    <span className="font-bold text-yellow-600">{stats.pending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">قيد التنفيذ:</span>
                    <span className="font-bold text-blue-600">{stats.inProgress}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">مكتملة:</span>
                    <span className="font-bold text-green-600">{stats.completed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ملغية:</span>
                    <span className="font-bold text-red-600">{stats.cancelled}</span>
                  </div>
                </div>
                <p className="text-gray-600 font-semibold mt-3 pt-3 border-t">ملخص الحالات</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    بحث
                  </label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="ابحث بالاسم، البريد، الهاتف..."
                      className="w-full pr-10 pl-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    الحالة
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="معلق">معلق</option>
                    <option value="قيد التنفيذ">قيد التنفيذ</option>
                    <option value="مكتمل">مكتمل</option>
                    <option value="ملغي">ملغي</option>
                  </select>
                </div>

                {/* Date Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    الفترة الزمنية
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="all">كل الفترات</option>
                    <option value="today">اليوم</option>
                    <option value="week">آخر أسبوع</option>
                    <option value="month">آخر شهر</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  عرض <span className="font-bold text-emerald-600">{filteredDonations.length}</span> من أصل <span className="font-bold">{donations.length}</span> تبرع
                </p>
                {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setDateFilter('all');
                    }}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    إلغاء الفلاتر
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Donations Table */}
      <section className="py-6 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {filteredDonations.length === 0 ? (
                <div className="text-center py-16">
                  <Gift className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-700 mb-2">لا توجد تبرعات</h3>
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                      ? 'لم يتم العثور على نتائج مطابقة للفلاتر'
                      : 'لم يتم تسجيل أي تبرعات حتى الآن'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          المتبرع
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          العائلة
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          المبلغ
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          التاريخ
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          الحالة
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredDonations.map((donation, index) => {
                        const family = getFamilyById(donation.family_id);
                        const status = donation.status || 'معلق';

                        return (
                          <tr key={donation.id || index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-bold text-gray-900">{donation.donor_name}</p>
                                {donation.donor_phone && (
                                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                    <Phone className="w-3 h-3" />
                                    {donation.donor_phone}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {family ? (
                                <div>
                                  <p className="font-semibold text-gray-900">{family.name}</p>
                                  <p className="text-xs text-gray-500 font-mono">{family.family_number}</p>
                                </div>
                              ) : (
                                <span className="text-gray-400">غير محدد</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-emerald-600 text-lg">
                                {formatAmount(donation.amount)} ل.س
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm">{formatDate(donation.created_at)}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(status)}`}>
                                {getStatusIcon(status)}
                                {status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedDonation(donation);
                                    setShowDetailsModal(true);
                                  }}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="عرض التفاصيل"
                                >
                                  <Eye className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedDonation(donation);
                                    setNewStatus(status);
                                    setShowStatusModal(true);
                                  }}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="تحديث الحالة"
                                >
                                  <Edit className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Details Modal */}
      {showDetailsModal && selectedDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailsModal(false)}>
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Gift className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">تفاصيل التبرع</h2>
                    <p className="text-emerald-100 text-sm">معلومات كاملة عن التبرع</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Donor Info */}
              <div className="bg-blue-50 rounded-xl p-5 border-2 border-blue-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  معلومات المتبرع
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">الاسم</p>
                    <p className="font-bold text-gray-900">{selectedDonation.donor_name}</p>
                  </div>
                  {selectedDonation.donor_phone && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">رقم الهاتف</p>
                      <p className="font-semibold text-gray-900 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-600" />
                        {selectedDonation.donor_phone}
                      </p>
                    </div>
                  )}
                  {selectedDonation.donor_email && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">البريد الإلكتروني</p>
                      <p className="font-semibold text-gray-900 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        {selectedDonation.donor_email}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Family Info */}
              {getFamilyById(selectedDonation.family_id) && (
                <div className="bg-emerald-50 rounded-xl p-5 border-2 border-emerald-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-600" />
                    العائلة المستفيدة
                  </h3>
                  <div className="space-y-2">
                    <p className="font-bold text-gray-900">{getFamilyById(selectedDonation.family_id).name}</p>
                    <p className="text-sm text-gray-600">رقم العائلة: {getFamilyById(selectedDonation.family_id).family_number}</p>
                  </div>
                </div>
              )}

              {/* Donation Details */}
              <div className="bg-amber-50 rounded-xl p-5 border-2 border-amber-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                  تفاصيل التبرع
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">المبلغ</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatAmount(selectedDonation.amount)} ل.س</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">الوصف</p>
                    <p className="text-gray-900">{selectedDonation.description || 'لا يوجد وصف'}</p>
                  </div>
                  {selectedDonation.notes && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">ملاحظات</p>
                      <p className="text-gray-900">{selectedDonation.notes}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">التاريخ</p>
                    <p className="font-semibold text-gray-900">{formatDate(selectedDonation.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">الحالة</p>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(selectedDonation.status || 'معلق')}`}>
                      {getStatusIcon(selectedDonation.status || 'معلق')}
                      {selectedDonation.status || 'معلق'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowStatusModal(false)}>
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Edit className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">تحديث حالة التبرع</h2>
                  <p className="text-emerald-100 text-sm">اختر الحالة الجديدة للتبرع</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  الحالة الجديدة
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-yellow-50 transition-colors">
                    <input
                      type="radio"
                      name="status"
                      value="معلق"
                      checked={newStatus === 'معلق'}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-5 h-5 text-yellow-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-bold text-gray-900">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        معلق
                      </div>
                      <p className="text-sm text-gray-600 mt-1">التبرع في انتظار المعالجة</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                    <input
                      type="radio"
                      name="status"
                      value="قيد التنفيذ"
                      checked={newStatus === 'قيد التنفيذ'}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-5 h-5 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-bold text-gray-900">
                        <Clock className="w-5 h-5 text-blue-600" />
                        قيد التنفيذ
                      </div>
                      <p className="text-sm text-gray-600 mt-1">جاري العمل على تقديم المساعدة</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-green-50 transition-colors">
                    <input
                      type="radio"
                      name="status"
                      value="مكتمل"
                      checked={newStatus === 'مكتمل'}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-5 h-5 text-green-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-bold text-gray-900">
                        <Check className="w-5 h-5 text-green-600" />
                        مكتمل
                      </div>
                      <p className="text-sm text-gray-600 mt-1">تم تقديم المساعدة بنجاح</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
                    <input
                      type="radio"
                      name="status"
                      value="ملغي"
                      checked={newStatus === 'ملغي'}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-5 h-5 text-red-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-bold text-gray-900">
                        <X className="w-5 h-5 text-red-600" />
                        ملغي
                      </div>
                      <p className="text-sm text-gray-600 mt-1">تم إلغاء التبرع لعدم الدفع</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <div className="flex gap-3">
                <button
                  onClick={handleUpdateStatus}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-bold hover:from-emerald-700 hover:to-teal-700 transition-all"
                >
                  تحديث الحالة
                </button>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default DonationsManagement;

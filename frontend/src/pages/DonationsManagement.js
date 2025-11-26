import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  DollarSign, Users, TrendingUp, Calendar, Search, 
  Filter, Eye, Edit, Check, Clock, AlertCircle, X,
  Gift, Phone, Mail, Package, MapPin, Download, RefreshCw, History
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
  const [completionImages, setCompletionImages] = useState([]);
  const [cancellationReason, setCancellationReason] = useState('');
  const [customCancellationText, setCustomCancellationText] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [currentImages, setCurrentImages] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [donationHistory, setDonationHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
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
    
    // حساب المبالغ حسب الحالة
    let totalAmount = 0;
    let completedAmount = 0;
    let approvedAmount = 0;
    let pendingAmount = 0;
    let cancelledAmount = 0;
    let rejectedAmount = 0;
    
    let completedCount = 0;
    let inprogressCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;
    let rejectedCount = 0;
    
    donationsData.forEach(d => {
      // استخراج المبلغ الرقمي
      const amountStr = String(d.amount || '0').replace(/,/g, '').replace(/\s/g, '');
      const amount = parseFloat(amountStr.match(/\d+(\.\d+)?/)?.[0] || 0);
      totalAmount += amount;
      
      const status = d.status || 'pending';
      
      if (status === 'completed') {
        completedAmount += amount;
        completedCount++;
      } else if (status === 'inprogress') {
        approvedAmount += amount;
        inprogressCount++;
      } else if (status === 'pending') {
        pendingAmount += amount;
        pendingCount++;
      } else if (status === 'cancelled') {
        cancelledAmount += amount;
        cancelledCount++;
      } else if (status === 'rejected') {
        rejectedAmount += amount;
        rejectedCount++;
      }
    });
    
    const uniqueDonors = new Set(donationsData.map(d => d.donor_email || d.donor_name)).size;

    setStats({
      total,
      totalAmount,
      completedAmount,
      approvedAmount,
      pendingAmount,
      cancelledAmount,
      rejectedAmount,
      completed: completedCount,
      inprogress: inprogressCount,
      pending: pendingCount,
      cancelled: cancelledCount,
      rejected: rejectedCount,
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
    // دعم العربي والإنجليزي
    switch (status) {
      case 'completed':
      case 'مكتمل':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'inprogress':
      case 'قيد التنفيذ':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'pending':
      case 'معلق':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'cancelled':
      case 'ملغي':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'rejected':
      case 'مرفوض':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-amber-100 text-amber-700 border-amber-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'مكتمل':
        return <Check className="w-4 h-4" />;
      case 'inprogress':
      case 'قيد التنفيذ':
        return <Clock className="w-4 h-4" />;
      case 'pending':
      case 'معلق':
        return <AlertCircle className="w-4 h-4" />;
      case 'cancelled':
      case 'ملغي':
        return <X className="w-4 h-4" />;
      case 'rejected':
      case 'مرفوض':
        return <X className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'completed': 'مكتمل',
      'inprogress': 'قيد التنفيذ',
      'pending': 'معلق',
      'cancelled': 'ملغي',
      'rejected': 'مرفوض'
    };
    return labels[status] || status;
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + completionImages.length > 5) {
      toast.error('يمكنك رفع 5 صور كحد أقصى');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompletionImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setCompletionImages(prev => prev.filter((_, i) => i !== index));
  };

  const openImageModal = (images, index) => {
    setCurrentImages(images);
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % currentImages.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length);
  };

  const fetchDonationHistory = async (donationId) => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/donations/${donationId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDonationHistory(response.data);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('حدث خطأ في جلب السجل التاريخي');
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '--';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(',', '');
    } catch {
      return dateString;
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedDonation || !newStatus) return;

    try {
      // تحويل من العربية إلى الإنجليزية
      const statusMap = {
        'معلق': 'pending',
        'قيد التنفيذ': 'inprogress',
        'مكتمل': 'completed',
        'ملغي': 'cancelled',
        'مرفوض': 'rejected'
      };
      
      const statusEn = statusMap[newStatus] || newStatus;
      
      // التحقق من سبب الإلغاء
      if (statusEn === 'cancelled' && !cancellationReason) {
        toast.error('يجب تحديد سبب الإلغاء');
        return;
      }
      
      // التحقق من النص المخصص عند اختيار "أخرى"
      if (statusEn === 'cancelled' && cancellationReason === 'أخرى' && !customCancellationText.trim()) {
        toast.error('يرجى كتابة سبب الإلغاء');
        return;
      }
      
      // استخدام النص المخصص إذا كان السبب "أخرى"
      const finalCancellationReason = cancellationReason === 'أخرى' ? customCancellationText : cancellationReason;
      
      const token = localStorage.getItem('token');
      const payload = {
        status: statusEn,
        completion_images: statusEn === 'completed' ? completionImages : [],
        cancellation_reason: statusEn === 'cancelled' ? finalCancellationReason : null
      };

      const response = await axios.put(
        `${API_URL}/donations/${selectedDonation.id}/status`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('تم تحديث حالة التبرع بنجاح');
      setShowStatusModal(false);
      setSelectedDonation(null);
      setNewStatus('');
      setCompletionImages([]);
      setCancellationReason('');
      setCustomCancellationText('');
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.detail || 'حدث خطأ في تحديث الحالة');
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
      // تحويل من العربية إلى الإنجليزية للمقارنة
      const statusMapArToEn = {
        'معلق': 'pending',
        'قيد التنفيذ': 'inprogress',
        'مكتمل': 'completed',
        'ملغي': 'cancelled',
        'مرفوض': 'rejected'
      };
      
      const statusEnglish = statusMapArToEn[statusFilter] || statusFilter;
      const donationStatus = donation.status || 'pending';
      
      if (donationStatus !== statusEnglish) return false;
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

              {/* Total Amount with Breakdown */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg p-6 border-t-4 border-emerald-700">
                <div className="flex items-center justify-between mb-3">
                  <DollarSign className="w-10 h-10 opacity-80" />
                  <span className="text-3xl font-bold">{formatAmount(stats.completedAmount)}</span>
                </div>
                <p className="text-sm opacity-90 mb-1">المكتملة (المعتمد)</p>
                <p className="text-xs opacity-80 mb-3">ليرة سورية</p>
                
                {/* تفصيل الحالات */}
                <div className="border-t border-white/20 pt-3 space-y-1">
                  <div className="flex justify-between text-xs opacity-90">
                    <span>⏱ قيد التنفيذ:</span>
                    <span className="font-semibold">{formatAmount(stats.approvedAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs opacity-90">
                    <span>⏳ معلقة:</span>
                    <span className="font-semibold">{formatAmount(stats.pendingAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs opacity-90">
                    <span>✕ ملغاة:</span>
                    <span className="font-semibold">{formatAmount(stats.cancelledAmount)}</span>
                  </div>
                </div>
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
                    <span className="font-bold text-blue-600">{stats.inprogress}</span>
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
              {(() => {
                // Pagination logic
                const indexOfLastItem = currentPage * itemsPerPage;
                const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                const currentItems = filteredDonations.slice(indexOfFirstItem, indexOfLastItem);
                const totalPages = Math.ceil(filteredDonations.length / itemsPerPage);
                
                return filteredDonations.length === 0 ? (
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
                        <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                          #
                        </th>
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
                      {currentItems.map((donation, index) => {
                        const rowNumber = indexOfFirstItem + index + 1;
                        const family = getFamilyById(donation.family_id);
                        const status = donation.status || 'معلق';

                        return (
                          <tr key={donation.id || index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4 text-center">
                              <span className="font-bold text-gray-700">{rowNumber}</span>
                            </td>
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
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(donation.status)}`}>
                                {getStatusIcon(donation.status)}
                                {getStatusLabel(donation.status)}
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
                                  onClick={() => fetchDonationHistory(donation.id)}
                                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                  title="السجل التاريخي"
                                >
                                  <History className="w-5 h-5" />
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
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        عرض {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredDonations.length)} من {filteredDonations.length}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                            currentPage === 1
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          السابق
                        </button>
                        <div className="flex items-center gap-2 px-4">
                          <span className="text-sm text-gray-600">
                            صفحة {currentPage} من {totalPages}
                          </span>
                        </div>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                            currentPage === totalPages
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          التالي
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
              })()}
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

              {/* صور وصل الاستلام */}
              {selectedDonation.completion_images && selectedDonation.completion_images.length > 0 && (
                <div className="bg-green-50 rounded-xl p-5 border-2 border-green-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-green-600" />
                    صور وصل الاستلام ({selectedDonation.completion_images.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedDonation.completion_images.map((img, idx) => (
                      <div 
                        key={idx} 
                        className="relative group cursor-pointer"
                        onClick={() => openImageModal(selectedDonation.completion_images, idx)}
                      >
                        <img
                          src={img}
                          alt={`وصل ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-green-300 hover:border-green-500 transition-colors"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-opacity flex items-center justify-center pointer-events-none">
                          <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs font-bold pointer-events-none">
                          {idx + 1}/{selectedDonation.completion_images.length}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* سبب الإلغاء */}
              {selectedDonation.cancellation_reason && (
                <div className="bg-red-50 rounded-xl p-5 border-2 border-red-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    سبب الإلغاء
                  </h3>
                  <p className="text-gray-900 font-semibold">{selectedDonation.cancellation_reason}</p>
                </div>
              )}

              {/* Update Info */}
              {(selectedDonation.updated_by_user_name || selectedDonation.updated_at) && (
                <div className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-600" />
                    معلومات آخر تحديث
                  </h3>
                  <div className="space-y-3">
                    {selectedDonation.updated_by_user_name && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">تم التحديث بواسطة</p>
                        <p className="font-bold text-gray-900 flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          {selectedDonation.updated_by_user_name}
                        </p>
                      </div>
                    )}
                    {selectedDonation.updated_at && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">تاريخ ووقت التحديث (ميلادي)</p>
                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                          {formatDate(selectedDonation.updated_at)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-2xl flex-shrink-0">
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
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
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
                      onChange={(e) => {
                        setNewStatus(e.target.value);
                        setCompletionImages([]);
                        setCancellationReason('');
                        setCustomCancellationText('');
                      }}
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
                      onChange={(e) => {
                        setNewStatus(e.target.value);
                        setCompletionImages([]);
                        setCancellationReason('');
                        setCustomCancellationText('');
                      }}
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
                      onChange={(e) => {
                        setNewStatus(e.target.value);
                        setCancellationReason('');
                        setCustomCancellationText('');
                      }}
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
                      onChange={(e) => {
                        setNewStatus(e.target.value);
                        setCompletionImages([]);
                        setCustomCancellationText('');
                      }}
                      className="w-5 h-5 text-red-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-bold text-gray-900">
                        <X className="w-5 h-5 text-red-600" />
                        ملغي
                      </div>
                      <p className="text-sm text-gray-600 mt-1">تم إلغاء التبرع</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* صور وصل الاستلام - يظهر عند اختيار مكتمل */}
              {newStatus === 'مكتمل' && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    صور وصل الاستلام (اختياري)
                  </label>
                  <p className="text-xs text-gray-600 mb-3">يمكنك رفع حتى 5 صور</p>
                  
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="completion-images"
                  />
                  
                  <label
                    htmlFor="completion-images"
                    className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                  >
                    <Package className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">اختر الصور</span>
                  </label>

                  {/* معاينة الصور */}
                  {completionImages.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {completionImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={img}
                            alt={`صورة ${idx + 1}`}
                            className="w-full h-20 object-cover rounded-lg border-2 border-green-200"
                          />
                          <button
                            onClick={() => removeImage(idx)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* سبب الإلغاء - يظهر عند اختيار ملغي */}
              {newStatus === 'ملغي' && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    سبب الإلغاء <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-red-300 rounded-lg focus:border-red-500 focus:outline-none mb-3"
                    required
                  >
                    <option value="">-- اختر السبب --</option>
                    <option value="المتبرع لم يدفع">المتبرع لم يدفع</option>
                    <option value="الأسرة رفضت المساعدة">الأسرة رفضت المساعدة</option>
                    <option value="خطأ في البيانات">خطأ في البيانات</option>
                    <option value="تم التبرع من جهة أخرى">تم التبرع من جهة أخرى</option>
                    <option value="تغيير في احتياجات الأسرة">تغيير في احتياجات الأسرة</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                  
                  {cancellationReason === 'أخرى' && (
                    <textarea
                      placeholder="يرجى توضيح السبب..."
                      value={customCancellationText}
                      onChange={(e) => setCustomCancellationText(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-red-300 rounded-lg focus:border-red-500 focus:outline-none resize-none"
                      rows="3"
                      required
                    />
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-4 border-t border-gray-200 flex-shrink-0">
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

      {/* Image Viewer Modal */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center p-8">
            {/* Close Button */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-6 right-6 w-14 h-14 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors z-10"
            >
              <X className="w-8 h-8 text-white" />
            </button>

            {/* Previous Button */}
            {currentImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-6 w-14 h-14 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors z-10"
              >
                <span className="text-white text-4xl font-bold">‹</span>
              </button>
            )}

            {/* Image Container */}
            <div 
              className="flex items-center justify-center w-full h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentImages[selectedImageIndex]}
                alt={`صورة ${selectedImageIndex + 1}`}
                style={{
                  maxWidth: '95vw',
                  maxHeight: '95vh',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain'
                }}
                className="rounded-lg shadow-2xl"
              />
            </div>

            {/* Next Button */}
            {currentImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-6 w-14 h-14 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors z-10"
              >
                <span className="text-white text-4xl font-bold">›</span>
              </button>
            )}

            {/* Image Counter */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-6 py-3 rounded-xl">
              <span className="font-bold text-lg">
                {selectedImageIndex + 1} / {currentImages.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowHistoryModal(false)}>
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">السجل التاريخي</h2>
                    <p className="text-purple-100 text-sm">جميع التغييرات على التبرع</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
              ) : donationHistory.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">لا يوجد سجل تاريخي بعد</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {donationHistory.map((log, idx) => (
                    <div key={log.id || idx} className="border-r-4 border-purple-500 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {log.action_type === 'created' && <Gift className="w-5 h-5 text-green-600" />}
                          {log.action_type === 'status_changed' && <Edit className="w-5 h-5 text-blue-600" />}
                          {log.action_type === 'updated' && <RefreshCw className="w-5 h-5 text-orange-600" />}
                          <span className="font-bold text-gray-900">
                            {log.action_type === 'created' && 'إنشاء تبرع'}
                            {log.action_type === 'status_changed' && 'تغيير الحالة'}
                            {log.action_type === 'updated' && 'تحديث بيانات'}
                            {log.action_type === 'deleted' && 'حذف'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">{formatDateTime(log.timestamp)}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">بواسطة: <span className="font-semibold">{log.user_name}</span></span>
                        </div>
                        
                        {log.old_status && log.new_status && (
                          <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-sm text-gray-600">من:</span>
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                getStatusColor(log.old_status).replace('text-', 'bg-').replace('600', '100') + ' ' + getStatusColor(log.old_status)
                              }`}>
                                {getStatusLabel(log.old_status)}
                              </span>
                            </div>
                            <span className="text-gray-400">←</span>
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-sm text-gray-600">إلى:</span>
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                getStatusColor(log.new_status).replace('text-', 'bg-').replace('600', '100') + ' ' + getStatusColor(log.new_status)
                              }`}>
                                {getStatusLabel(log.new_status)}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {log.changes && Object.keys(log.changes).length > 0 && (
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <p className="text-sm font-semibold text-gray-700 mb-2">تفاصيل التغييرات:</p>
                            <div className="space-y-1 text-sm text-gray-600">
                              {log.changes.completion_images && (
                                <div>• تم إضافة {log.changes.completion_images.count} صورة لوصل الاستلام</div>
                              )}
                              {log.changes.cancellation_reason && (
                                <div>• سبب الإلغاء: {log.changes.cancellation_reason}</div>
                              )}
                              {log.changes.donor_name && (
                                <div>• المتبرع: {log.changes.donor_name}</div>
                              )}
                              {log.changes.amount && (
                                <div>• المبلغ: {log.changes.amount}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-4 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default DonationsManagement;

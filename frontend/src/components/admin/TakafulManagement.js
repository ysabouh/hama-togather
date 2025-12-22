import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import Select from 'react-select';
import {
  Heart,
  Plus,
  Trash2,
  Calendar,
  Gift,
  Percent,
  Users,
  Search,
  Stethoscope,
  Building2,
  FlaskConical,
  X,
  Link2,
  Check,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TakafulManagement = ({ userRole, userNeighborhoodId }) => {
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBenefitForDetails, setSelectedBenefitForDetails] = useState(null);
  const [selectedBenefitForLink, setSelectedBenefitForLink] = useState(null);
  const [selectedFamilyForLink, setSelectedFamilyForLink] = useState(null);
  const [selectedBenefitForStatus, setSelectedBenefitForStatus] = useState(null);
  const [statusAction, setStatusAction] = useState(null); // 'close' or 'cancel'
  const [statusNote, setStatusNote] = useState('');
  const [cancelReason, setCancelReason] = useState(null);
  const [cancelReasons, setCancelReasons] = useState([]); // أسباب الإلغاء من قاعدة البيانات
  const [linkLoading, setLinkLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Statistics
  const [statusStats, setStatusStats] = useState({
    open: 0,
    inprogress: 0,
    closed: 0,
    cancelled: 0,
    total: 0
  });
  
  // Data for dropdowns
  const [doctors, setDoctors] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [laboratories, setLaboratories] = useState([]);
  const [families, setFamilies] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  
  // Form data
  const [formData, setFormData] = useState({
    provider_type: 'doctor',
    provider_id: '',
    family_id: '',
    benefit_date: new Date().toISOString().split('T')[0],
    benefit_type: 'free',
    discount_percentage: '',
    notes: ''
  });
  
  // Filters
  const [filterProviderType, setFilterProviderType] = useState('all');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (dataLoaded) {
      fetchBenefits();
    }
  }, [filterProviderType, filterMonth, filterYear, dataLoaded]);

  const fetchData = async () => {
    try {
      const [doctorsRes, pharmaciesRes, laboratoriesRes, familiesRes, neighborhoodsRes] = await Promise.all([
        axios.get(`${API_URL}/doctors`),
        axios.get(`${API_URL}/pharmacies`),
        axios.get(`${API_URL}/laboratories`),
        axios.get(`${API_URL}/families`),
        axios.get(`${API_URL}/neighborhoods`)
      ]);
      
      // Filter providers that participate in solidarity
      setDoctors((doctorsRes.data || []).filter(d => d.participates_in_solidarity));
      setPharmacies((pharmaciesRes.data || []).filter(p => p.participates_in_solidarity));
      setLaboratories((laboratoriesRes.data || []).filter(l => l.participates_in_solidarity));
      setFamilies(familiesRes.data || []);
      setNeighborhoods(neighborhoodsRes.data || []);
      setDataLoaded(true);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('فشل تحميل البيانات');
    }
  };

  const fetchBenefits = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = {
        month: filterMonth,
        year: filterYear
      };
      if (filterProviderType !== 'all') {
        params.provider_type = filterProviderType;
      }
      
      const response = await axios.get(
        `${API_URL}/takaful-benefits/all`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          params 
        }
      );
      
      const benefitsData = response.data || [];
      setBenefits(benefitsData);
      
      // حساب الإحصائيات
      const stats = {
        open: 0,
        inprogress: 0,
        closed: 0,
        cancelled: 0,
        total: benefitsData.length
      };
      benefitsData.forEach(b => {
        const status = b.status || 'open';
        if (stats.hasOwnProperty(status)) {
          stats[status]++;
        }
      });
      setStatusStats(stats);
      setCurrentPage(1); // إعادة تعيين الصفحة عند تحميل بيانات جديدة
    } catch (error) {
      console.error('Error fetching benefits:', error);
      if (error.response?.status === 401) {
        toast.error('يرجى تسجيل الدخول مرة أخرى');
      } else {
        toast.error('فشل تحميل سجلات الاستفادة');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.provider_id) {
      toast.error('يرجى اختيار مقدم الخدمة');
      return;
    }
    if (!formData.family_id) {
      toast.error('يرجى اختيار الأسرة');
      return;
    }
    if (formData.benefit_type === 'discount' && !formData.discount_percentage) {
      toast.error('يرجى إدخال نسبة الخصم');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/takaful-benefits`,
        {
          ...formData,
          discount_percentage: formData.benefit_type === 'discount' 
            ? parseFloat(formData.discount_percentage) 
            : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('تم إضافة سجل الاستفادة بنجاح');
      setShowAddModal(false);
      resetForm();
      fetchBenefits();
    } catch (error) {
      console.error('Error adding benefit:', error);
      toast.error(error.response?.data?.detail || 'فشل إضافة سجل الاستفادة');
    }
  };

  const handleDelete = async (benefitId) => {
    if (!window.confirm('هل أنت متأكد من حذف سجل الاستفادة؟')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/takaful-benefits/${benefitId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('تم حذف سجل الاستفادة');
      fetchBenefits();
    } catch (error) {
      console.error('Error deleting benefit:', error);
      toast.error('فشل حذف سجل الاستفادة');
    }
  };

  // فتح نافذة الربط بالعائلة
  const openLinkModal = (benefit) => {
    setSelectedBenefitForLink(benefit);
    setSelectedFamilyForLink(null);
    setShowLinkModal(true);
  };

  // الحصول على حي مقدم الخدمة
  const getProviderNeighborhoodId = (benefit) => {
    let provider = null;
    if (benefit.provider_type === 'doctor') {
      provider = doctors.find(d => d.id === benefit.provider_id);
    } else if (benefit.provider_type === 'pharmacy') {
      provider = pharmacies.find(p => p.id === benefit.provider_id);
    } else if (benefit.provider_type === 'laboratory') {
      provider = laboratories.find(l => l.id === benefit.provider_id);
    }
    return provider?.neighborhood_id || null;
  };

  // الحصول على العائلات في حي مقدم الخدمة
  const getFamiliesForProvider = () => {
    if (!selectedBenefitForLink) return [];
    const neighborhoodId = getProviderNeighborhoodId(selectedBenefitForLink);
    if (!neighborhoodId) return families; // إذا لم يكن هناك حي، اعرض كل العائلات
    return families.filter(f => f.neighborhood_id === neighborhoodId);
  };

  // الحصول على اسم الحي
  const getNeighborhoodName = (neighborhoodId) => {
    if (!neighborhoodId || !neighborhoods || !Array.isArray(neighborhoods)) return 'غير محدد';
    const neighborhood = neighborhoods.find(n => n.id === neighborhoodId);
    return neighborhood?.name || 'غير محدد';
  };

  // ربط الاستفادة بالعائلة
  const handleLinkFamily = async () => {
    if (!selectedBenefitForLink || !selectedFamilyForLink) {
      toast.error('يرجى اختيار عائلة');
      return;
    }

    setLinkLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/takaful-benefits/${selectedBenefitForLink.id}`,
        { family_id: selectedFamilyForLink.value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('تم ربط الاستفادة بالعائلة بنجاح');
      setShowLinkModal(false);
      setSelectedBenefitForLink(null);
      setSelectedFamilyForLink(null);
      fetchBenefits();
    } catch (error) {
      console.error('Error linking family:', error);
      toast.error('فشل ربط الاستفادة بالعائلة');
    } finally {
      setLinkLoading(false);
    }
  };

  // فتح نافذة تغيير الحالة
  const openStatusModal = (benefit, action) => {
    setSelectedBenefitForStatus(benefit);
    setStatusAction(action);
    setStatusNote('');
    setCancelReason(null);
    setShowStatusModal(true);
  };

  // تغيير حالة الاستفادة
  const handleStatusChange = async () => {
    if (!selectedBenefitForStatus) return;

    if (statusAction === 'cancel' && !cancelReason) {
      toast.error('يرجى اختيار سبب الإلغاء');
      return;
    }

    setStatusLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = {
        status: statusAction === 'close' ? 'closed' : 'cancelled',
        status_note: statusAction === 'close' ? statusNote : null,
        cancel_reason: statusAction === 'cancel' ? cancelReason?.value : null
      };

      await axios.put(
        `${API_URL}/takaful-benefits/${selectedBenefitForStatus.id}/status`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(statusAction === 'close' ? 'تم إغلاق الاستفادة بنجاح' : 'تم إلغاء الاستفادة');
      setShowStatusModal(false);
      setSelectedBenefitForStatus(null);
      setStatusAction(null);
      setStatusNote('');
      setCancelReason(null);
      fetchBenefits();
    } catch (error) {
      console.error('Error changing status:', error);
      toast.error('فشل تغيير الحالة');
    } finally {
      setStatusLoading(false);
    }
  };

  // الحصول على لون وأيقونة الحالة
  const getStatusInfo = (status) => {
    switch (status) {
      case 'open':
        return { label: 'مفتوح', color: 'bg-blue-100 text-blue-700', icon: Clock };
      case 'inprogress':
        return { label: 'قيد التنفيذ', color: 'bg-amber-100 text-amber-700', icon: AlertCircle };
      case 'closed':
        return { label: 'مغلق', color: 'bg-green-100 text-green-700', icon: CheckCircle };
      case 'cancelled':
        return { label: 'ملغي', color: 'bg-red-100 text-red-700', icon: XCircle };
      default:
        return { label: 'مفتوح', color: 'bg-blue-100 text-blue-700', icon: Clock };
    }
  };

  // الحصول على تسمية سبب الإلغاء
  const getCancelReasonLabel = (reason) => {
    const found = CANCEL_REASONS.find(r => r.value === reason);
    return found ? found.label : reason;
  };

  // فلترة السجلات حسب البحث
  const getFilteredBenefits = () => {
    if (!searchQuery.trim()) return benefits;
    
    const query = searchQuery.trim().toLowerCase();
    return benefits.filter(benefit => {
      // البحث في الكود
      if (benefit.benefit_code?.toLowerCase().includes(query)) return true;
      // البحث في اسم مقدم الخدمة
      if (benefit.provider_name?.toLowerCase().includes(query)) return true;
      // البحث في رقم الأسرة
      if (benefit.family_number?.toLowerCase().includes(query)) return true;
      // البحث في الملاحظات
      if (benefit.notes?.toLowerCase().includes(query)) return true;
      // البحث في ملاحظة الإغلاق
      if (benefit.status_note?.toLowerCase().includes(query)) return true;
      // البحث في سبب الإلغاء (القيمة والتسمية)
      if (benefit.cancel_reason) {
        if (benefit.cancel_reason.toLowerCase().includes(query)) return true;
        const cancelLabel = getCancelReasonLabel(benefit.cancel_reason);
        if (cancelLabel.toLowerCase().includes(query)) return true;
      }
      // البحث في الحالة (بالعربية)
      const statusInfo = getStatusInfo(benefit.status);
      if (statusInfo.label.includes(query)) return true;
      
      return false;
    });
  };

  const resetForm = () => {
    setFormData({
      provider_type: 'doctor',
      provider_id: '',
      family_id: '',
      benefit_date: new Date().toISOString().split('T')[0],
      benefit_type: 'free',
      discount_percentage: '',
      notes: ''
    });
  };

  const getProviderOptions = () => {
    const providers = formData.provider_type === 'doctor' 
      ? doctors 
      : formData.provider_type === 'pharmacy' 
        ? pharmacies 
        : laboratories;
    
    return providers.map(p => ({
      value: p.id,
      label: p.full_name || p.name
    }));
  };

  const getFamilyOptions = () => {
    return families.map(f => ({
      value: f.id,
      label: `${f.family_number || f.family_code || f.id} - ${f.name}`
    }));
  };

  const getProviderTypeIcon = (type) => {
    switch (type) {
      case 'doctor': return <Stethoscope className="w-4 h-4" />;
      case 'pharmacy': return <Building2 className="w-4 h-4" />;
      case 'laboratory': return <FlaskConical className="w-4 h-4" />;
      default: return null;
    }
  };

  const getProviderTypeLabel = (type) => {
    switch (type) {
      case 'doctor': return 'طبيب';
      case 'pharmacy': return 'صيدلية';
      case 'laboratory': return 'مخبر';
      default: return type;
    }
  };

  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 p-3 rounded-xl">
            <Heart className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">إدارة سجلات التكافل</h2>
            <p className="text-sm text-gray-500">تسجيل استفادات الأسر من برنامج التكافل الصحي</p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          إضافة استفادة جديدة
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">نوع مقدم الخدمة:</label>
            <select
              value={filterProviderType}
              onChange={(e) => setFilterProviderType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
            >
              <option value="all">الكل</option>
              <option value="doctor">أطباء</option>
              <option value="pharmacy">صيدليات</option>
              <option value="laboratory">مخابر</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">الشهر:</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
            >
              {monthNames.map((month, idx) => (
                <option key={idx} value={idx + 1}>{month}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">السنة:</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <Button
            variant="outline"
            onClick={fetchBenefits}
            className="flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            تحديث
          </Button>
        </div>
        
        {/* Search Box */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // إعادة تعيين الصفحة عند البحث
              }}
              placeholder="ابحث بالكود، مقدم الخدمة، رقم الأسرة، الحالة، الملاحظات، سبب الإلغاء..."
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
              تم العثور على <span className="font-bold text-red-600">{getFilteredBenefits().length}</span> نتيجة من أصل {benefits.length} سجل
            </p>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">إجمالي السجلات</p>
              <p className="text-2xl font-bold text-gray-700 mt-1">{statusStats.total}</p>
            </div>
            <div className="bg-gray-200 p-2 rounded-lg">
              <Heart className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium">مفتوح</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{statusStats.open}</p>
            </div>
            <div className="bg-blue-200 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-600 font-medium">قيد التنفيذ</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">{statusStats.inprogress}</p>
            </div>
            <div className="bg-amber-200 p-2 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 font-medium">مغلق</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{statusStats.closed}</p>
            </div>
            <div className="bg-green-200 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-600 font-medium">ملغي</p>
              <p className="text-2xl font-bold text-red-700 mt-1">{statusStats.cancelled}</p>
            </div>
            <div className="bg-red-200 p-2 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Benefits List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">#</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الكود</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الحالة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">التاريخ</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">مقدم الخدمة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">النوع</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">رقم الأسرة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">نوع الاستفادة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الملاحظات</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-4 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">جاري التحميل...</p>
                  </td>
                </tr>
              ) : benefits.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>لا توجد سجلات استفادة في هذه الفترة</p>
                  </td>
                </tr>
              ) : getFilteredBenefits().length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>لا توجد نتائج تطابق البحث &ldquo;{searchQuery}&rdquo;</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-red-600 hover:text-red-700 text-sm mt-2 underline"
                    >
                      مسح البحث
                    </button>
                  </td>
                </tr>
              ) : (
                getFilteredBenefits()
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((benefit, index) => {
                  const statusInfo = getStatusInfo(benefit.status);
                  const StatusIcon = statusInfo.icon;
                  const actualIndex = (currentPage - 1) * itemsPerPage + index;
                  return (
                  <tr key={benefit.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                      {actualIndex + 1}
                    </td>
                    <td className="px-4 py-3">
                      {benefit.benefit_code ? (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono" dir="ltr">
                          {benefit.benefit_code}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                        {benefit.status === 'cancelled' && benefit.cancel_reason && (
                          <span className="text-xs text-red-600">
                            {getCancelReasonLabel(benefit.cancel_reason)}
                          </span>
                        )}
                        {benefit.status === 'closed' && benefit.status_note && (
                          <span className="text-xs text-green-600 truncate max-w-[100px]" title={benefit.status_note}>
                            {benefit.status_note}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(benefit.benefit_date).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {benefit.provider_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        {getProviderTypeIcon(benefit.provider_type)}
                        {getProviderTypeLabel(benefit.provider_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {benefit.family_number && benefit.family_number !== 'غير معروف' && benefit.family_id ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-mono">
                          {benefit.family_number}
                        </span>
                      ) : (
                        <button
                          onClick={() => openLinkModal(benefit)}
                          className="flex items-center gap-1 bg-amber-100 text-amber-700 hover:bg-amber-200 px-2 py-1 rounded text-xs font-medium transition-colors"
                          title="ربط بعائلة"
                        >
                          <Link2 className="w-3 h-3" />
                          ربط بعائلة
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {benefit.benefit_type === 'free' ? (
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium w-fit">
                            <Gift className="w-3 h-3" />
                            مجاني
                          </span>
                          {benefit.free_amount > 0 && (
                            <span className="text-green-700 text-xs font-bold">
                              {benefit.free_amount?.toLocaleString('ar-SY')} ل.س
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium w-fit">
                            <Percent className="w-3 h-3" />
                            خصم {benefit.discount_percentage}%
                          </span>
                          {benefit.original_amount > 0 && (
                            <span className="text-gray-500 text-xs line-through">
                              {benefit.original_amount?.toLocaleString('ar-SY')} ل.س
                            </span>
                          )}
                          {benefit.final_amount > 0 && (
                            <span className="text-green-600 text-xs font-bold">
                              {benefit.final_amount?.toLocaleString('ar-SY')} ل.س
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {benefit.notes || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* زر عرض التفاصيل */}
                        <button
                          onClick={() => {
                            setSelectedBenefitForDetails(benefit);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {/* زر الربط بعائلة */}
                        {benefit.family_number && benefit.family_number !== 'غير معروف' && benefit.family_id && benefit.status !== 'closed' && benefit.status !== 'cancelled' && (
                          <button
                            onClick={() => openLinkModal(benefit)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="تغيير العائلة"
                          >
                            <Link2 className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* زر الإغلاق - يظهر فقط للحالات inprogress */}
                        {benefit.status === 'inprogress' && (
                          <button
                            onClick={() => openStatusModal(benefit, 'close')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="إغلاق الاستفادة"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* زر الإلغاء - يظهر للحالات open و inprogress */}
                        {(benefit.status === 'open' || benefit.status === 'inprogress') && (
                          <button
                            onClick={() => openStatusModal(benefit, 'cancel')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="إلغاء الاستفادة"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* زر الحذف - فقط للحالات المفتوحة غير المرتبطة */}
                        {benefit.status === 'open' && !benefit.family_id && (
                          <button
                            onClick={() => handleDelete(benefit.id)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );})
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && getFilteredBenefits().length > 0 && (
          <div className="bg-gray-50 px-4 py-3 border-t flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>عرض</span>
              <span className="font-bold text-gray-800">
                {Math.min((currentPage - 1) * itemsPerPage + 1, getFilteredBenefits().length)}
              </span>
              <span>إلى</span>
              <span className="font-bold text-gray-800">
                {Math.min(currentPage * itemsPerPage, getFilteredBenefits().length)}
              </span>
              <span>من</span>
              <span className="font-bold text-gray-800">{getFilteredBenefits().length}</span>
              <span>سجل</span>
              {searchQuery && (
                <span className="text-gray-400">(مصفّى)</span>
              )}
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
                {Array.from({ length: Math.ceil(getFilteredBenefits().length / itemsPerPage) }, (_, i) => i + 1)
                  .filter(page => {
                    const totalPages = Math.ceil(getFilteredBenefits().length / itemsPerPage);
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
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(getFilteredBenefits().length / itemsPerPage), p + 1))}
                disabled={currentPage >= Math.ceil(getFilteredBenefits().length / itemsPerPage)}
                className="flex items-center gap-1"
              >
                التالي
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Status Change Modal */}
      {showStatusModal && selectedBenefitForStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Modal Header */}
            <div className={`${statusAction === 'close' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'} text-white p-5 rounded-t-2xl flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                {statusAction === 'close' ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                <h3 className="text-lg font-bold">
                  {statusAction === 'close' ? 'إغلاق الاستفادة' : 'إلغاء الاستفادة'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedBenefitForStatus(null);
                  setStatusAction(null);
                }}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Benefit Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">كود الاستفادة:</span>
                  <span className="font-mono font-bold text-blue-700" dir="ltr">
                    {selectedBenefitForStatus.benefit_code || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">مقدم الخدمة:</span>
                  <span className="font-medium">{selectedBenefitForStatus.provider_name}</span>
                </div>
                {selectedBenefitForStatus.family_number && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">العائلة:</span>
                    <span className="font-medium">{selectedBenefitForStatus.family_number}</span>
                  </div>
                )}
              </div>

              {/* Close: Status Note */}
              {statusAction === 'close' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ملاحظة الإغلاق (اختياري)
                  </label>
                  <Input
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="أدخل ملاحظة..."
                    className="w-full"
                  />
                </div>
              )}

              {/* Cancel: Reason Selection */}
              {statusAction === 'cancel' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    سبب الإلغاء <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={CANCEL_REASONS}
                    value={cancelReason}
                    onChange={setCancelReason}
                    placeholder="اختر سبب الإلغاء..."
                    isClearable
                    className="text-sm"
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: '#e5e7eb',
                        '&:hover': { borderColor: '#ef4444' }
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected ? '#ef4444' : state.isFocused ? '#fee2e2' : 'white',
                        color: state.isSelected ? 'white' : '#374151'
                      })
                    }}
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-2xl">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedBenefitForStatus(null);
                  setStatusAction(null);
                }}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleStatusChange}
                disabled={statusLoading || (statusAction === 'cancel' && !cancelReason)}
                className={statusAction === 'close' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
              >
                {statusLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    جاري المعالجة...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {statusAction === 'close' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {statusAction === 'close' ? 'تأكيد الإغلاق' : 'تأكيد الإلغاء'}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Link Family Modal */}
      {showLinkModal && selectedBenefitForLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-5 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link2 className="w-6 h-6" />
                <h3 className="text-lg font-bold">ربط الاستفادة بعائلة</h3>
              </div>
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setSelectedBenefitForLink(null);
                  setSelectedFamilyForLink(null);
                }}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Benefit Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">كود الاستفادة:</span>
                  <span className="font-mono font-bold text-blue-700" dir="ltr">
                    {selectedBenefitForLink.benefit_code || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">مقدم الخدمة:</span>
                  <span className="font-medium">{selectedBenefitForLink.provider_name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">الحي:</span>
                  <span className="font-medium text-emerald-700">
                    {getNeighborhoodName(getProviderNeighborhoodId(selectedBenefitForLink))}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">نوع الاستفادة:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    selectedBenefitForLink.benefit_type === 'free' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {selectedBenefitForLink.benefit_type === 'free' 
                      ? `مجاني - ${selectedBenefitForLink.free_amount?.toLocaleString('ar-SY')} ل.س`
                      : `خصم ${selectedBenefitForLink.discount_percentage}%`
                    }
                  </span>
                </div>
              </div>

              {/* Family Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اختر العائلة <span className="text-red-500">*</span>
                </label>
                <Select
                  options={getFamiliesForProvider().map(f => ({
                    value: f.id,
                    label: `${f.family_number} - ${f.name || 'بدون اسم'}`,
                    familyNumber: f.family_number
                  }))}
                  value={selectedFamilyForLink}
                  onChange={setSelectedFamilyForLink}
                  placeholder="ابحث عن العائلة..."
                  isClearable
                  isSearchable
                  noOptionsMessage={() => 'لا توجد عائلات في هذا الحي'}
                  className="text-sm"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: '#e5e7eb',
                      '&:hover': { borderColor: '#f59e0b' }
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected ? '#f59e0b' : state.isFocused ? '#fef3c7' : 'white',
                      color: state.isSelected ? 'white' : '#374151'
                    })
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  يتم عرض العائلات في حي مقدم الخدمة فقط ({getFamiliesForProvider().length} عائلة)
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-2xl">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowLinkModal(false);
                  setSelectedBenefitForLink(null);
                  setSelectedFamilyForLink(null);
                }}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleLinkFamily}
                disabled={!selectedFamilyForLink || linkLoading}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {linkLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    جاري الربط...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    تأكيد الربط
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-5 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 fill-white" />
                <h3 className="text-lg font-bold">إضافة سجل استفادة جديد</h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Provider Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع مقدم الخدمة <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'doctor', label: 'طبيب', icon: Stethoscope },
                    { value: 'pharmacy', label: 'صيدلية', icon: Building2 },
                    { value: 'laboratory', label: 'مخبر', icon: FlaskConical }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData({ ...formData, provider_type: value, provider_id: '' })}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                        formData.provider_type === value
                          ? 'bg-red-50 border-red-500 text-red-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  مقدم الخدمة <span className="text-red-500">*</span>
                </label>
                <Select
                  options={getProviderOptions()}
                  value={getProviderOptions().find(o => o.value === formData.provider_id)}
                  onChange={(option) => setFormData({ ...formData, provider_id: option?.value || '' })}
                  placeholder="اختر مقدم الخدمة..."
                  isClearable
                  isSearchable
                  noOptionsMessage={() => 'لا يوجد مقدمي خدمات مشاركين في التكافل'}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>

              {/* Family Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الأسرة المستفيدة <span className="text-red-500">*</span>
                </label>
                <Select
                  options={getFamilyOptions()}
                  value={getFamilyOptions().find(o => o.value === formData.family_id)}
                  onChange={(option) => setFormData({ ...formData, family_id: option?.value || '' })}
                  placeholder="ابحث واختر الأسرة..."
                  isClearable
                  isSearchable
                  noOptionsMessage={() => 'لا توجد أسر'}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>

              {/* Benefit Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ الاستفادة <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.benefit_date}
                  onChange={(e) => setFormData({ ...formData, benefit_date: e.target.value })}
                  required
                />
              </div>

              {/* Benefit Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع الاستفادة <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, benefit_type: 'free', discount_percentage: '' })}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      formData.benefit_type === 'free'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Gift className="w-4 h-4" />
                    مجاني
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, benefit_type: 'discount' })}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      formData.benefit_type === 'discount'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Percent className="w-4 h-4" />
                    خصم
                  </button>
                </div>
              </div>

              {/* Discount Percentage */}
              {formData.benefit_type === 'discount' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نسبة الخصم (%) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                    placeholder="مثال: 50"
                    required
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ملاحظات إضافية (اختياري)"
                  rows="2"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة السجل
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Benefit Details Modal */}
      {showDetailsModal && selectedBenefitForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-5 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-6 h-6" />
                <h3 className="text-lg font-bold">تفاصيل الاستفادة</h3>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedBenefitForDetails(null);
                }}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[calc(90vh-140px)] overflow-y-auto">
              {/* Benefit Code & Status */}
              <div className="flex items-center justify-between gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500 mb-1">كود الاستفادة</p>
                  <p className="font-mono font-bold text-blue-700 text-lg" dir="ltr">
                    {selectedBenefitForDetails.benefit_code || '-'}
                  </p>
                </div>
                <div>
                  {(() => {
                    const statusInfo = getStatusInfo(selectedBenefitForDetails.status);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <span className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${statusInfo.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {statusInfo.label}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Benefit Type */}
              <div className="p-4 bg-white border border-gray-200 rounded-xl">
                <p className="text-xs text-gray-500 mb-2">نوع الاستفادة</p>
                {selectedBenefitForDetails.benefit_type === 'free' ? (
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Gift className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-green-700">مجاني</p>
                      {selectedBenefitForDetails.free_amount > 0 && (
                        <p className="text-green-600 text-sm">
                          المبلغ: {selectedBenefitForDetails.free_amount?.toLocaleString('ar-SY')} ل.س
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-100 p-2 rounded-lg">
                        <Percent className="w-5 h-5 text-amber-600" />
                      </div>
                      <p className="font-bold text-amber-700">خصم</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 space-y-2 text-sm">
                      {selectedBenefitForDetails.original_amount > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">المبلغ الأصلي:</span>
                          <span className="font-bold text-gray-700">
                            {selectedBenefitForDetails.original_amount?.toLocaleString('ar-SY')} ل.س
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">نسبة الخصم:</span>
                        <span className="font-bold text-amber-600">
                          {selectedBenefitForDetails.discount_percentage}%
                        </span>
                      </div>
                      {selectedBenefitForDetails.final_amount > 0 && (
                        <div className="flex items-center justify-between border-t border-amber-200 pt-2">
                          <span className="text-gray-600">المبلغ النهائي:</span>
                          <span className="font-bold text-green-600">
                            {selectedBenefitForDetails.final_amount?.toLocaleString('ar-SY')} ل.س
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Provider & Family Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-gray-200 rounded-xl">
                  <p className="text-xs text-gray-500 mb-2">مقدم الخدمة</p>
                  <div className="flex items-center gap-2">
                    {getProviderTypeIcon(selectedBenefitForDetails.provider_type)}
                    <div>
                      <p className="font-medium text-gray-900">{selectedBenefitForDetails.provider_name}</p>
                      <p className="text-xs text-gray-500">{getProviderTypeLabel(selectedBenefitForDetails.provider_type)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-white border border-gray-200 rounded-xl">
                  <p className="text-xs text-gray-500 mb-2">العائلة</p>
                  {selectedBenefitForDetails.family_id && selectedBenefitForDetails.family_number && selectedBenefitForDetails.family_number !== 'غير معروف' ? (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-600" />
                      <span className="font-mono font-bold text-green-700">
                        {selectedBenefitForDetails.family_number}
                      </span>
                    </div>
                  ) : (
                    <span className="text-amber-600 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      غير مرتبطة
                    </span>
                  )}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-gray-200 rounded-xl">
                  <p className="text-xs text-gray-500 mb-2">تاريخ الاستفادة</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <p className="font-medium text-gray-900">
                      {new Date(selectedBenefitForDetails.benefit_date).toLocaleDateString('ar-SA', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                {(selectedBenefitForDetails.time_from || selectedBenefitForDetails.time_to) && (
                  <div className="p-4 bg-white border border-gray-200 rounded-xl">
                    <p className="text-xs text-gray-500 mb-2">الوقت</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <p className="font-medium text-gray-900" dir="ltr">
                        {selectedBenefitForDetails.time_from || '--:--'} - {selectedBenefitForDetails.time_to || '--:--'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedBenefitForDetails.notes && (
                <div className="p-4 bg-white border border-gray-200 rounded-xl">
                  <p className="text-xs text-gray-500 mb-2">ملاحظات</p>
                  <p className="text-gray-700">{selectedBenefitForDetails.notes}</p>
                </div>
              )}

              {/* Cancellation Reason */}
              {selectedBenefitForDetails.status === 'cancelled' && selectedBenefitForDetails.cancel_reason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs text-red-600 mb-2">سبب الإلغاء</p>
                  <p className="font-medium text-red-700">{getCancelReasonLabel(selectedBenefitForDetails.cancel_reason)}</p>
                </div>
              )}

              {/* Closure Notes */}
              {selectedBenefitForDetails.status === 'closed' && selectedBenefitForDetails.status_note && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-xs text-green-600 mb-2">ملاحظة الإغلاق</p>
                  <p className="font-medium text-green-700">{selectedBenefitForDetails.status_note}</p>
                </div>
              )}

              {/* Creation & Update Info */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                <p className="text-xs text-gray-500 font-medium border-b border-gray-200 pb-2">معلومات السجل</p>
                
                {selectedBenefitForDetails.created_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">تاريخ الإنشاء:</span>
                    <span className="text-gray-700">
                      {new Date(selectedBenefitForDetails.created_at).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                
                {selectedBenefitForDetails.created_by_user_name && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">أنشئ بواسطة:</span>
                    <span className="text-gray-700 font-medium">{selectedBenefitForDetails.created_by_user_name}</span>
                  </div>
                )}
                
                {selectedBenefitForDetails.updated_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">آخر تعديل:</span>
                    <span className="text-gray-700">
                      {new Date(selectedBenefitForDetails.updated_at).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                
                {selectedBenefitForDetails.updated_by_user_name && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">عدّل بواسطة:</span>
                    <span className="text-gray-700 font-medium">{selectedBenefitForDetails.updated_by_user_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-2xl">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedBenefitForDetails(null);
                }}
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakafulManagement;

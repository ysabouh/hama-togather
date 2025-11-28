import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  Users, Heart, MapPin, DollarSign, TrendingUp, Calendar, 
  ArrowRight, Phone, Mail, Home, User, Baby, CheckCircle,
  Clock, Package, X, Image as ImageIcon, History, Gift, Plus,
  Eye, ChevronLeft, ChevronRight, AlertCircle, Edit, Check, Trash2, Tag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FamilyDetails = () => {
  const { familyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [family, setFamily] = useState(null);
  const [familyNeeds, setFamilyNeeds] = useState([]);
  const [category, setCategory] = useState(null);
  const [neighborhood, setNeighborhood] = useState(null);
  const [incomeLevel, setIncomeLevel] = useState(null);
  const [needAssessment, setNeedAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showConfirmDonation, setShowConfirmDonation] = useState(false);
  const [showAddNeedModal, setShowAddNeedModal] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [donationForm, setDonationForm] = useState({
    donor_name: user?.name || '',
    donor_phone: '',
    donor_email: user?.email || '',
    donation_type: 'مالية',
    amount: '',
    description: '',
    notes: '',
    donation_date: '',
    delivery_status: 'scheduled'
  });
  const [needForm, setNeedForm] = useState({
    need_id: '',
    amount: '',
    duration_type: 'مرة واحدة',
    month: '',
    notes: ''
  });
  const [editingNeed, setEditingNeed] = useState(null);
  const [showEditNeedModal, setShowEditNeedModal] = useState(false);
  const [activeNeedsTab, setActiveNeedsTab] = useState('active'); // 'active' or 'inactive'
  const [allNeeds, setAllNeeds] = useState([]);
  const [donationHistory, setDonationHistory] = useState([]);
  const [activeDonationsTab, setActiveDonationsTab] = useState('active'); // 'active' or 'inactive'
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showDonationDetailsModal, setShowDonationDetailsModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [currentImages, setCurrentImages] = useState([]);
  
  // Audit Log States
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsPagination, setAuditLogsPagination] = useState({
    current_page: 1,
    per_page: 10,
    total_count: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  });
  const [auditLogsFilters, setAuditLogsFilters] = useState({
    action_type: '',
    search: ''
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLogDetails, setSelectedLogDetails] = useState(null);

  // تحديث بيانات المتبرع من المستخدم الحالي
  useEffect(() => {
    if (user) {
      setDonationForm(prev => ({
        ...prev,
        donor_name: user.name || user.full_name || '',
        donor_phone: user.phone || '',
        donor_email: user.email || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/families-public');
      return;
    }
    fetchFamilyDetails();
  }, [familyId, user]);

  const fetchFamilyDetails = async () => {
    setLoading(true);
    try {
      // جلب بيانات العائلة
      const familyRes = await axios.get(`${API_URL}/families/${familyId}`);
      setFamily(familyRes.data);

      // جلب احتياجات العائلة
      try {
        const needsRes = await axios.get(`${API_URL}/families/${familyId}/needs`);
        setFamilyNeeds(needsRes.data || []);
      } catch (error) {
        console.error('Error fetching family needs:', error);
        setFamilyNeeds([]);
      }

      // جلب تاريخ التبرعات
      try {
        const donationsRes = await axios.get(`${API_URL}/families/${familyId}/donations`);
        setDonationHistory(donationsRes.data || []);
      } catch (error) {
        console.error('Error fetching donations:', error);
        setDonationHistory([]);
      }

      // جلب البيانات المساعدة
      const [categoriesRes, neighborhoodsRes, incomeLevelsRes, needAssessmentsRes, needsRes] = await Promise.all([
        axios.get(`${API_URL}/family-categories`),
        axios.get(`${API_URL}/public/neighborhoods`),
        axios.get(`${API_URL}/income-levels`),
        axios.get(`${API_URL}/need-assessments`),
        axios.get(`${API_URL}/needs`)
      ]);

      // ربط البيانات
      const familyData = familyRes.data;
      setCategory(categoriesRes.data.find(c => c.id === familyData.category_id));
      setNeighborhood(neighborhoodsRes.data.find(n => n.id === familyData.neighborhood_id));
      setIncomeLevel(incomeLevelsRes.data.find(i => i.id === familyData.income_level_id));
      setNeedAssessment(needAssessmentsRes.data.find(n => n.id === familyData.need_assessment_id));
      setAllNeeds(needsRes.data.filter(n => n.is_active !== false));

    } catch (error) {
      console.error('Error fetching family details:', error);
      if (error.response?.status === 401) {
        navigate('/login?redirect=/families-public');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async (page = 1) => {
    setAuditLogsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: auditLogsPagination.per_page.toString()
      });
      
      if (auditLogsFilters.action_type) {
        params.append('action_type', auditLogsFilters.action_type);
      }
      
      if (auditLogsFilters.search) {
        params.append('search', auditLogsFilters.search);
      }
      
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/families/${familyId}/needs-audit-log?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setAuditLogs(response.data.logs || []);
      setAuditLogsPagination(response.data.pagination || {
        current_page: 1,
        per_page: 10,
        total_count: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('خطأ في جلب سجل الحركات');
    } finally {
      setAuditLogsLoading(false);
    }
  };

  // جلب السجلات عند تحميل الصفحة أو تغيير الفلاتر
  useEffect(() => {
    if (user && familyId) {
      fetchAuditLogs(1);
    }
  }, [familyId, user, auditLogsFilters]);

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

  const openDonationImageModal = (images, index) => {
    setCurrentImages(images);
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  const nextDonationImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % currentImages.length);
  };

  const prevDonationImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length);
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'معلق',
      'inprogress': 'قيد التنفيذ',
      'completed': 'مكتمل',
      'cancelled': 'ملغي',
      'rejected': 'مرفوض'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'text-yellow-600',
      'inprogress': 'text-blue-600',
      'completed': 'text-green-600',
      'cancelled': 'text-gray-600',
      'rejected': 'text-red-600'
    };
    return colors[status] || 'text-gray-600';
  };

  const formatDateWithTime = (dateString) => {
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

  const formatDateTime = (dateString) => {
    if (!dateString) return 'غير محدد';
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('en-GB', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }),
        time: date.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      };
    } catch {
      return { date: 'غير محدد', time: '' };
    }
  };

  const getActionTypeLabel = (actionType) => {
    const labels = {
      'created': { label: 'إضافة', icon: Plus, color: 'bg-green-100 text-green-700 border-green-300' },
      'updated': { label: 'تعديل', icon: Edit, color: 'bg-blue-100 text-blue-700 border-blue-300' },
      'deleted': { label: 'حذف', icon: Trash2, color: 'bg-red-100 text-red-700 border-red-300' },
      'activated': { label: 'تفعيل', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
      'deactivated': { label: 'تعطيل', icon: X, color: 'bg-gray-100 text-gray-700 border-gray-300' }
    };
    return labels[actionType] || { label: actionType, icon: Tag, color: 'bg-gray-100 text-gray-700 border-gray-300' };
  };

  const handleShowDetails = (log) => {
    setSelectedLogDetails(log);
    setShowDetailsModal(true);
  };

  const handleDonationSubmit = (e) => {
    e.preventDefault();
    // عرض نافذة التأكيد بدلاً من الإرسال مباشرة
    setShowConfirmDonation(true);
  };

  const handleConfirmDonation = async () => {
    try {
      await axios.post(`${API_URL}/donations`, {
        ...donationForm,
        family_id: familyId,
        donation_type: 'مالية' // نوع ثابت
      });
      
      toast.success('تم تسجيل التبرع بنجاح! شكراً لكرمك 💚');
      setShowConfirmDonation(false);
      setShowDonationModal(false);
      setDonationForm({
        donor_name: user?.name || '',
        donor_phone: '',
        donor_email: user?.email || '',
        donation_type: 'مالية',
        amount: '',
        description: '',
        notes: ''
      });
      
      // إعادة جلب التبرعات
      fetchFamilyDetails();
    } catch (error) {
      console.error('Error submitting donation:', error);
      toast.error('حدث خطأ في تسجيل التبرع');
    }
  };

  const handleAddNeedSubmit = async (e) => {
    e.preventDefault();
    
    if (!needForm.need_id) {
      toast.error('يرجى اختيار نوع الاحتياج');
      return;
    }
    
    try {
      console.log('Sending need data:', needForm);
      await axios.post(`${API_URL}/families/${familyId}/needs`, needForm);
      
      toast.success('تم إضافة الاحتياج بنجاح! ✅');
      setShowAddNeedModal(false);
      setNeedForm({
        need_id: '',
        amount: '',
        duration_type: 'مرة واحدة',
        month: '',
        notes: ''
      });
      
      // إعادة تحميل البيانات
      fetchFamilyDetails();
      fetchAuditLogs(auditLogsPagination.current_page);
    } catch (error) {
      console.error('Error adding need:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.detail || 'حدث خطأ في إضافة الاحتياج');
    }
  };

  const handleEditNeed = (need) => {
    setEditingNeed(need);
    setNeedForm({
      need_id: need.need_id,
      amount: need.amount || '',
      duration_type: need.duration_type || 'مرة واحدة',
      month: need.month || '',
      notes: need.notes || ''
    });
    setShowEditNeedModal(true);
  };

  const handleUpdateNeedSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.put(`${API_URL}/families/${familyId}/needs/${editingNeed.id}`, needForm);
      
      toast.success('تم تحديث الاحتياج بنجاح! ✅');
      setShowEditNeedModal(false);
      setEditingNeed(null);
      setNeedForm({
        need_id: '',
        amount: '',
        duration_type: 'مرة واحدة',
        notes: ''
      });
      
      fetchFamilyDetails();
      fetchAuditLogs(auditLogsPagination.current_page);
    } catch (error) {
      console.error('Error updating need:', error);
      toast.error('حدث خطأ في تحديث الاحتياج');
    }
  };

  const handleToggleNeedStatus = async (need) => {
    try {
      // إذا كانت is_active غير محددة، اعتبرها true (نشط)
      const currentStatus = need.is_active !== false;
      const newStatus = !currentStatus;
      
      await axios.put(`${API_URL}/families/${familyId}/needs/${need.id}`, {
        need_id: need.need_id,
        amount: need.amount || '',
        notes: need.notes || '',
        is_active: newStatus
      });
      
      toast.success(newStatus ? 'تم تفعيل الاحتياج ✅' : 'تم تعطيل الاحتياج ⭕');
      fetchFamilyDetails();
      fetchAuditLogs(auditLogsPagination.current_page);
    } catch (error) {
      console.error('Error toggling need status:', error);
      toast.error('حدث خطأ في تغيير حالة الاحتياج');
    }
  };

  const handleDeleteNeed = async (need) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الاحتياج؟')) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/families/${familyId}/needs/${need.id}`);
      toast.success('تم حذف الاحتياج بنجاح');
      fetchFamilyDetails();
      fetchAuditLogs(auditLogsPagination.current_page);
    } catch (error) {
      console.error('Error deleting need:', error);
      toast.error('حدث خطأ في حذف الاحتياج');
    }
  };

  // استخدام الصور الحقيقية من family model
  const familyImages = family?.images || [];

  // وظائف عرض الصور
  const openImageViewer = (index) => {
    setCurrentImageIndex(index);
    setShowImageViewer(true);
  };

  const closeImageViewer = () => {
    setShowImageViewer(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % familyImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + familyImages.length) % familyImages.length);
  };

  // معالجة مفاتيح لوحة المفاتيح للـ image viewer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showImageViewer) return;
      
      if (e.key === 'Escape') closeImageViewer();
      else if (e.key === 'ArrowRight') prevImage();
      else if (e.key === 'ArrowLeft') nextImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showImageViewer, familyImages.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl p-8 animate-pulse">
              <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!family) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto text-center">
            <Users className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-700 mb-4">العائلة غير موجودة</h2>
            <button
              onClick={() => navigate('/families-public')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              العودة للعائلات
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const totalMembers = family.members_count || 
    ((family.male_children_count || 0) + (family.female_children_count || 0) + 2);

  // حساب مبالغ الاحتياجات النشطة وغير النشطة
  const activeNeedsAmount = familyNeeds
    .filter(n => n.is_active !== false)
    .reduce((sum, need) => sum + (need.estimated_amount || 0), 0);
  
  const inactiveNeedsAmount = familyNeeds
    .filter(n => n.is_active === false)
    .reduce((sum, need) => sum + (need.estimated_amount || 0), 0);
  
  // إذا لم تكن الاحتياجات تحتوي على مبالغ، استخدم البيانات من family
  // family.total_needs_amount قد يحتوي على فقط النشطة أو الكل حسب حساب البكند
  const totalNeedsDisplay = (activeNeedsAmount + inactiveNeedsAmount) > 0 
    ? (activeNeedsAmount + inactiveNeedsAmount) 
    : (family?.total_needs_amount || 0);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
        }}></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="mb-6 flex items-center gap-2 text-white hover:text-emerald-100 transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
              <span className="font-semibold">العودة للعائلات</span>
            </button>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                {/* Family Number Badge */}
                <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                  <span className="text-sm font-bold font-mono">رقم العائلة: {family.family_number}</span>
                </div>

                {/* Family Name */}
                <h1 className="text-5xl font-bold mb-4">{family.name}</h1>

                {/* Quick Info */}
                <div className="flex flex-wrap gap-4 text-emerald-100">
                  {neighborhood && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      <span>{neighborhood.name}</span>
                    </div>
                  )}
                  {category && (
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      <span>{category.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Need Assessment Badge */}
              {needAssessment && (
                <div
                  className="px-6 py-3 rounded-xl text-lg font-bold shadow-2xl"
                  style={{
                    backgroundColor: needAssessment.color,
                    color: 'white'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    <span>{needAssessment.name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 -mt-8 relative z-10">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Main Info - 2 columns */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Family Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Members */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-emerald-500">
                    <div className="flex items-center justify-between mb-3">
                      <Users className="w-8 h-8 text-emerald-600" />
                      <span className="text-3xl font-bold text-gray-900">{totalMembers}</span>
                    </div>
                    <p className="text-sm text-gray-600 font-semibold">إجمالي أفراد العائلة</p>
                  </div>

                  {/* Male Children */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
                    <div className="flex items-center justify-between mb-3">
                      <User className="w-8 h-8 text-blue-600" />
                      <span className="text-3xl font-bold text-gray-900">{family.male_children_count || 0}</span>
                    </div>
                    <p className="text-sm text-gray-600 font-semibold">الأطفال الذكور</p>
                  </div>

                  {/* Female Children */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-pink-500">
                    <div className="flex items-center justify-between mb-3">
                      <Baby className="w-8 h-8 text-pink-600" />
                      <span className="text-3xl font-bold text-gray-900">{family.female_children_count || 0}</span>
                    </div>
                    <p className="text-sm text-gray-600 font-semibold">الأطفال الإناث</p>
                  </div>
                </div>

                {/* Description */}
                {family.description && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Heart className="w-6 h-6 text-emerald-600" />
                      وصف العائلة
                    </h2>
                    <p className="text-gray-700 leading-relaxed text-lg">{family.description}</p>
                  </div>
                )}

                {/* Family Financial Summary */}
                {(family?.total_needs_amount > 0 || family?.total_donations_amount > 0 || familyNeeds.length > 0) && (
                  <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-6 mb-6 border-2 border-gray-200 shadow-xl">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-emerald-600" />
                      الملخص المالي للعائلة
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Total Needs */}
                      <div className="bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <Package className="w-8 h-8 opacity-80" />
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📦</span>
                          </div>
                        </div>
                        <p className="text-sm opacity-90 mb-1">إجمالي الاحتياجات</p>
                        <p className="text-3xl font-bold">
                          {new Intl.NumberFormat('ar-SY').format(totalNeedsDisplay)}
                        </p>
                        <p className="text-xs opacity-80 mt-1">ليرة سورية (كل الاحتياجات)</p>
                        
                        {/* تفصيل الاحتياجات */}
                        <div className="border-t border-white/20 pt-2 mt-3 space-y-1">
                          <div className="flex justify-between text-xs opacity-90">
                            <span>✅ احتياجات نشطة:</span>
                            <span className="font-semibold">
                              {familyNeeds.filter(n => n.is_active !== false).length} احتياج
                              {activeNeedsAmount > 0 && ` (${new Intl.NumberFormat('ar-SY').format(activeNeedsAmount)} ل.س)`}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs opacity-90">
                            <span>❌ احتياجات متوقفة:</span>
                            <span className="font-semibold">
                              {familyNeeds.filter(n => n.is_active === false).length} احتياج
                              {inactiveNeedsAmount > 0 && ` (${new Intl.NumberFormat('ar-SY').format(inactiveNeedsAmount)} ل.س)`}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs opacity-90 font-bold border-t border-white/20 pt-1 mt-1">
                            <span>📊 الإجمالي:</span>
                            <span>
                              {familyNeeds.length} احتياج
                              {(activeNeedsAmount + inactiveNeedsAmount) > 0 && ` (${new Intl.NumberFormat('ar-SY').format(activeNeedsAmount + inactiveNeedsAmount)} ل.س)`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Total Donations */}
                      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <Gift className="w-8 h-8 opacity-80" />
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-2xl">💰</span>
                          </div>
                        </div>
                        <p className="text-sm opacity-90 mb-1">إجمالي التبرعات النشطة</p>
                        <p className="text-3xl font-bold mb-2">
                          {new Intl.NumberFormat('ar-SY').format(family?.donations_by_status?.completed || 0)}
                        </p>
                        <p className="text-xs opacity-80 mb-3">المكتملة (المعتمد) - ليرة سورية</p>
                        
                        {/* تفصيل الحالات الأخرى النشطة */}
                        <div className="border-t border-white/20 pt-2 mt-2 space-y-1">
                          <div className="flex justify-between text-xs opacity-90">
                            <span>⏱ قيد التنفيذ:</span>
                            <span className="font-semibold">{new Intl.NumberFormat('ar-SY').format(family?.donations_by_status?.inprogress || 0)}</span>
                          </div>
                          <div className="flex justify-between text-xs opacity-90">
                            <span>⏳ معلقة:</span>
                            <span className="font-semibold">{new Intl.NumberFormat('ar-SY').format(family?.donations_by_status?.pending || 0)}</span>
                          </div>
                          <div className="flex justify-between text-xs opacity-90">
                            <span>✕ ملغاة:</span>
                            <span className="font-semibold">{new Intl.NumberFormat('ar-SY').format(family?.donations_by_status?.cancelled || 0)}</span>
                          </div>
                        </div>
                        
                        {/* التبرعات غير النشطة */}
                        {family?.inactive_donations_by_status && (
                          <div className="border-t-2 border-white/30 pt-3 mt-3">
                            <p className="text-xs opacity-80 mb-2 font-bold">التبرعات المعطلة (قابلة للنقل):</p>
                            <div className="space-y-1">
                              {family.inactive_donations_by_status.completed > 0 && (
                                <div className="flex justify-between text-xs opacity-90">
                                  <span>✓ مكتملة:</span>
                                  <span className="font-semibold">{new Intl.NumberFormat('ar-SY').format(family.inactive_donations_by_status.completed)}</span>
                                </div>
                              )}
                              {family.inactive_donations_by_status.inprogress > 0 && (
                                <div className="flex justify-between text-xs opacity-90">
                                  <span>⏱ قيد التنفيذ:</span>
                                  <span className="font-semibold">{new Intl.NumberFormat('ar-SY').format(family.inactive_donations_by_status.inprogress)}</span>
                                </div>
                              )}
                              {family.inactive_donations_by_status.pending > 0 && (
                                <div className="flex justify-between text-xs opacity-90">
                                  <span>⏳ معلقة:</span>
                                  <span className="font-semibold">{new Intl.NumberFormat('ar-SY').format(family.inactive_donations_by_status.pending)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Remaining */}
                      <div className={`rounded-xl p-5 shadow-lg hover:shadow-xl transition-shadow ${
                        totalNeedsDisplay > (family?.donations_by_status?.completed || 0)
                          ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                          : 'bg-gradient-to-br from-green-500 to-emerald-600'
                      } text-white`}>
                        <div className="flex items-center justify-between mb-3">
                          <DollarSign className="w-8 h-8 opacity-80" />
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-2xl">
                              {totalNeedsDisplay > (family?.donations_by_status?.completed || 0) ? '⚠️' : '✅'}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm opacity-90 mb-1">
                          {totalNeedsDisplay > (family?.donations_by_status?.completed || 0) 
                            ? 'المبلغ المتبقي' 
                            : 'المبلغ الزائد'}
                        </p>
                        <p className="text-3xl font-bold">
                          {new Intl.NumberFormat('ar-SY').format(
                            Math.abs(totalNeedsDisplay - (family?.donations_by_status?.completed || 0))
                          )}
                        </p>
                        <p className="text-xs opacity-80 mt-1">ليرة سورية (بناءً على المكتملة)</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {totalNeedsDisplay > 0 && (
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">نسبة التغطية (بناءً على المكتملة)</span>
                          <span className="text-sm font-bold text-emerald-600">
                            {Math.min(100, Math.round(((family?.donations_by_status?.completed || 0) / totalNeedsDisplay) * 100))}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                            style={{ 
                              width: `${Math.min(100, ((family?.donations_by_status?.completed || 0) / totalNeedsDisplay) * 100)}%` 
                            }}
                          >
                            {((family?.donations_by_status?.completed || 0) / totalNeedsDisplay) * 100 >= 10 && (
                              <span className="text-xs font-bold text-white">
                                {Math.round(((family?.donations_by_status?.completed || 0) / totalNeedsDisplay) * 100)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Family Needs */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-6 h-6 text-emerald-600" />
                      <h2 className="text-2xl font-bold text-gray-900">احتياجات العائلة</h2>
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => setShowAddNeedModal(true)}
                          className="mr-3 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold shadow-md hover:shadow-lg"
                        >
                          <Plus className="w-4 h-4" />
                          <span>إضافة احتياج</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 mb-6 bg-gray-100 p-1.5 rounded-xl">
                    <button
                      onClick={() => setActiveNeedsTab('active')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold transition-all ${
                        activeNeedsTab === 'active'
                          ? 'bg-emerald-600 text-white shadow-lg transform scale-105'
                          : 'bg-transparent text-gray-600 hover:bg-white hover:text-emerald-600'
                      }`}
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>الاحتياجات النشطة</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-sm font-bold ${
                        activeNeedsTab === 'active'
                          ? 'bg-white/20 text-white'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {familyNeeds.filter(n => n.is_active !== false).length}
                      </span>
                    </button>
                    
                    <button
                      onClick={() => setActiveNeedsTab('inactive')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold transition-all ${
                        activeNeedsTab === 'inactive'
                          ? 'bg-gray-600 text-white shadow-lg transform scale-105'
                          : 'bg-transparent text-gray-600 hover:bg-white hover:text-gray-700'
                      }`}
                    >
                      <X className="w-5 h-5" />
                      <span>الاحتياجات المتوقفة</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-sm font-bold ${
                        activeNeedsTab === 'inactive'
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {familyNeeds.filter(n => n.is_active === false).length}
                      </span>
                    </button>
                  </div>
                  
                  {(() => {
                    const filteredNeeds = familyNeeds.filter(n => 
                      activeNeedsTab === 'active' ? n.is_active !== false : n.is_active === false
                    );
                    
                    return filteredNeeds.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600 font-semibold mb-2">لا توجد احتياجات مسجلة</p>
                      <p className="text-sm text-gray-400">
                        {user?.role === 'admin' 
                          ? 'استخدم الزر أعلاه لإضافة احتياجات العائلة'
                          : 'لم يتم تسجيل احتياجات لهذه العائلة حتى الآن'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredNeeds.map((need, index) => (
                        <div
                          key={index}
                          className={`border-2 rounded-xl p-5 transition-all ${
                            need.is_active !== false 
                              ? 'bg-white border-emerald-200 hover:shadow-md' 
                              : 'bg-gray-50 border-gray-300 opacity-70'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            {/* Main Content */}
                            <div className="flex-1">
                              {/* Need Name (Title) */}
                              <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  need.is_active !== false 
                                    ? 'bg-emerald-100' 
                                    : 'bg-gray-300'
                                }`}>
                                  <Package className={`w-5 h-5 ${
                                    need.is_active !== false 
                                      ? 'text-emerald-600' 
                                      : 'text-gray-500'
                                  }`} />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                                    {need.need_name || 'احتياج'}
                                  </h3>
                                  <div className="flex items-center gap-3 flex-wrap">
                                    {/* Status Badge */}
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                                      need.is_active !== false
                                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                        : 'bg-gray-200 text-gray-600 border border-gray-300'
                                    }`}>
                                      {need.is_active !== false ? '🟢 نشط' : '⭕ متوقف'}
                                    </span>
                                    
                                    {/* Date and Time in Gregorian */}
                                    {need.created_at && (
                                      <span className="flex items-center gap-1 text-xs text-gray-500">
                                        <Calendar className="w-3 h-3" />
                                        {(() => {
                                          const date = new Date(need.created_at);
                                          const dateStr = date.toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                          });
                                          const timeStr = date.toLocaleTimeString('en-GB', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: false
                                          });
                                          return `${dateStr} ${timeStr}`;
                                        })()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Amount */}
                              {need.amount && (
                                <div className="mb-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-3">
                                  <p className="text-sm font-semibold text-blue-900">
                                    💰 المبلغ/الكمية: <span className="text-blue-700 font-bold text-base">{need.amount}</span>
                                  </p>
                                </div>
                              )}

                              {/* Duration Type */}
                              <div className="mb-3 bg-purple-50 border-l-4 border-purple-400 rounded-r-lg p-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <p className="text-sm font-semibold text-purple-900">
                                    ⏰ مدة الاحتياج: <span className="text-purple-700 font-bold text-base">{need.duration_type || 'مرة واحدة'}</span>
                                  </p>
                                  {need.duration_type === 'شهري' && need.month && (
                                    <span className="text-xs bg-purple-200 text-purple-800 px-3 py-1 rounded-full font-bold">
                                      📅 {(() => {
                                        const monthNames = {
                                          'JAN': 'يناير',
                                          'FEB': 'فبراير',
                                          'MAR': 'مارس',
                                          'APR': 'أبريل',
                                          'MAY': 'مايو',
                                          'JUN': 'يونيو',
                                          'JUL': 'يوليو',
                                          'AUG': 'أغسطس',
                                          'SEP': 'سبتمبر',
                                          'OCT': 'أكتوبر',
                                          'NOV': 'نوفمبر',
                                          'DEC': 'ديسمبر'
                                        };
                                        const [month, year] = need.month.split('-');
                                        return `${monthNames[month] || month} ${year}`;
                                      })()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Notes */}
                              {need.notes && (
                                <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-3">
                                  <p className="text-sm text-gray-700 leading-relaxed">
                                    <span className="font-semibold text-amber-900">📝 ملاحظات:</span>
                                    <br />
                                    <span className="text-gray-800">{need.notes}</span>
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Admin Actions */}
                            {user?.role === 'admin' && (
                              <div className="flex flex-col gap-2 flex-shrink-0">
                                {/* Edit Button */}
                                <button
                                  onClick={() => handleEditNeed(need)}
                                  className="p-2.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-all hover:scale-105 shadow-sm"
                                  title="تعديل"
                                >
                                  <Edit className="w-5 h-5" />
                                </button>

                                {/* Toggle Active Button */}
                                <button
                                  onClick={() => handleToggleNeedStatus(need)}
                                  className={`p-2.5 rounded-lg transition-all hover:scale-105 shadow-sm ${
                                    need.is_active !== false
                                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  }`}
                                  title={need.is_active !== false ? 'تعطيل' : 'تفعيل'}
                                >
                                  {need.is_active !== false ? (
                                    <X className="w-5 h-5" />
                                  ) : (
                                    <Check className="w-5 h-5" />
                                  )}
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => handleDeleteNeed(need)}
                                  className="p-2.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-all hover:scale-105 shadow-sm"
                                  title="حذف"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                  })()}
                </div>

                {/* Family Images */}
                {familyImages.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <ImageIcon className="w-6 h-6 text-emerald-600" />
                      صور العائلة ({familyImages.length})
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {familyImages.map((image, index) => (
                        <div
                          key={index}
                          onClick={() => openImageViewer(index)}
                          className="relative aspect-video rounded-lg overflow-hidden group cursor-pointer shadow-md hover:shadow-xl transition-all"
                        >
                          <img
                            src={image}
                            alt={`صورة ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3">
                              <Eye className="w-6 h-6 text-emerald-600" />
                            </div>
                          </div>
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                            {index + 1} / {familyImages.length}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Donation History */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <History className="w-6 h-6 text-emerald-600" />
                    تاريخ المساعدات السابقة
                    <span className="text-sm font-normal text-gray-500">({donationHistory.length})</span>
                  </h2>
                  
                  {/* Tabs */}
                  <div className="flex gap-2 mb-4 border-b">
                    <button
                      onClick={() => setActiveDonationsTab('active')}
                      className={`px-4 py-2 font-semibold transition-colors ${
                        activeDonationsTab === 'active'
                          ? 'text-emerald-600 border-b-2 border-emerald-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      التبرعات النشطة ({donationHistory.filter(d => d.is_active !== false).length})
                    </button>
                    <button
                      onClick={() => setActiveDonationsTab('inactive')}
                      className={`px-4 py-2 font-semibold transition-colors ${
                        activeDonationsTab === 'inactive'
                          ? 'text-gray-600 border-b-2 border-gray-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      التبرعات المعطلة ({donationHistory.filter(d => d.is_active === false).length})
                    </button>
                  </div>
                  
                  {(() => {
                    const filteredDonations = donationHistory.filter(d => 
                      activeDonationsTab === 'active' ? d.is_active !== false : d.is_active === false
                    );
                    
                    if (filteredDonations.length === 0) {
                      return (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                          <Gift className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-600 font-semibold mb-1">
                            {activeDonationsTab === 'active' ? 'لا توجد مساعدات نشطة' : 'لا توجد مساعدات معطلة'}
                          </p>
                        </div>
                      );
                    }
                    
                    return (
                    <div className="space-y-4">
                      {filteredDonations.map((donation, idx) => (
                        <div
                          key={donation.id || idx}
                          className={`relative border-r-4 ${donation.is_active === false ? 'border-gray-400' : 'border-emerald-500'} pr-6 pb-4 last:pb-0`}
                        >
                          {/* Timeline Dot */}
                          <div className={`absolute right-0 top-0 w-4 h-4 ${donation.is_active === false ? 'bg-gray-400' : 'bg-emerald-500'} rounded-full transform translate-x-1/2 ring-4 ring-white`}></div>
                          
                          <div className={`rounded-lg p-4 ${donation.is_active === false ? 'bg-gray-100 opacity-75' : 'bg-gray-50 hover:bg-emerald-50'} transition-colors`}>
                            {/* شارة غير نشط */}
                            {donation.is_active === false && (
                              <div className="mb-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-gray-500 text-white">
                                  ⚠️ معطل - قابل للنقل
                                </span>
                              </div>
                            )}
                            <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                              <div className="flex-1">
                                {/* رقم التبرع */}
                                <div className="mb-2">
                                  <span className="text-xs text-gray-500">رقم التبرع: </span>
                                  <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                    {donation.id ? donation.id.substring(0, 8) : 'N/A'}
                                  </span>
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg">{donation.donor_name}</h3>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                    {donation.donation_type}
                                  </span>
                                  {/* Delivery Status Badge */}
                                  {donation.delivery_status && (
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                      donation.delivery_status === 'delivered' ? 'bg-green-100 text-green-700 border-green-300' :
                                      donation.delivery_status === 'cancelled' ? 'bg-red-100 text-red-700 border-red-300' :
                                      'bg-blue-100 text-blue-700 border-blue-300'
                                    }`}>
                                      {donation.delivery_status === 'delivered' ? '✓ تم التسليم' :
                                       donation.delivery_status === 'cancelled' ? '✕ ملغية' :
                                       '⏱ مجدولة'}
                                    </span>
                                  )}
                                </div>
                                {/* المبلغ المالي مع العملة السورية */}
                                <div className="mt-2">
                                  <span className="text-sm text-gray-600">المالية: </span>
                                  <span className="text-sm font-bold text-gray-900">{donation.amount} ل.س</span>
                                </div>
                                {/* Transfer Type Badge - أسفل المبلغ المالي */}
                                <div className="mt-1">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                    donation.transfer_type === 'fixed' 
                                      ? 'bg-blue-100 text-blue-700 border-blue-300' 
                                      : 'bg-purple-100 text-purple-700 border-purple-300'
                                  }`}>
                                    {donation.transfer_type === 'fixed' ? '🔒 ثابت' : '🔄 قابل للنقل'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-xs text-left space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Status Badge - نقلناها قبل التاريخ */}
                                  {donation.status && (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                                      donation.status === 'completed' ? 'bg-green-100 text-green-700 border-green-300' :
                                      donation.status === 'inprogress' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                      donation.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                      donation.status === 'cancelled' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                                      donation.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-300' :
                                      'bg-amber-100 text-amber-700 border-amber-300'
                                    }`}>
                                      {donation.status === 'completed' ? '✓ مكتمل' :
                                       donation.status === 'inprogress' ? '⏱ قيد التنفيذ' :
                                       donation.status === 'pending' ? '⏳ معلق' :
                                       donation.status === 'cancelled' ? '✕ ملغي' :
                                       donation.status === 'rejected' ? '✕ مرفوض' :
                                       '⏳ معلق'}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-1 whitespace-nowrap text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    <span>تسجيل:</span>
                                    <span className="font-semibold">{formatDate(donation.created_at)}</span>
                                  </div>
                                </div>
                                {donation.donation_date && (
                                  <div className="flex items-center gap-1 whitespace-nowrap text-gray-500">
                                    <Calendar className="w-3 h-3" />
                                    <span>موعد:</span>
                                    <span className="font-semibold">{(() => {
                                      const dt = formatDateTime(donation.donation_date);
                                      return `${dt.date} ${dt.time}`;
                                    })()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{donation.description}</p>
                            {donation.notes && (
                              <p className="text-xs text-gray-500 mt-2 italic">ملاحظات: {donation.notes}</p>
                            )}
                            {donation.donor_phone && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-600">
                                  <Phone className="w-3 h-3 inline ml-1" />
                                  {donation.donor_phone}
                                </p>
                              </div>
                            )}
                            
                            {/* زر التفاصيل */}
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <button
                                onClick={() => {
                                  console.log('Donation clicked:', donation);
                                  setSelectedDonation(donation);
                                  setShowDonationDetailsModal(true);
                                  console.log('Modal should show now');
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-semibold"
                              >
                                <Eye className="w-4 h-4" />
                                عرض التفاصيل الكاملة
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    );
                  })()}
                </div>

                {/* Audit Log Section - Admin and Super Admin Only */}
                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <History className="w-6 h-6 text-blue-600" />
                      سجل الحركات على الاحتياجات
                      <span className="text-sm font-normal text-gray-500">
                        ({auditLogsPagination.total_count})
                      </span>
                    </h2>
                  </div>

                  {/* Filters */}
                  <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Filter by Action Type */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        تصفية حسب نوع العملية
                      </label>
                      <select
                        value={auditLogsFilters.action_type}
                        onChange={(e) => setAuditLogsFilters(prev => ({ ...prev, action_type: e.target.value }))}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">جميع العمليات</option>
                        <option value="created">إضافة</option>
                        <option value="updated">تعديل</option>
                        <option value="activated">تفعيل</option>
                        <option value="deactivated">تعطيل</option>
                        <option value="deleted">حذف</option>
                      </select>
                    </div>

                    {/* Search */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        بحث (اسم الاحتياج أو المستخدم)
                      </label>
                      <input
                        type="text"
                        value={auditLogsFilters.search}
                        onChange={(e) => setAuditLogsFilters(prev => ({ ...prev, search: e.target.value }))}
                        placeholder="ابحث..."
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Logs Table */}
                  {auditLogsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 mt-4">جاري التحميل...</p>
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <History className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600 font-semibold mb-1">لا توجد حركات مسجلة</p>
                      <p className="text-sm text-gray-400">لم يتم تسجيل أي حركات على الاحتياجات حتى الآن</p>
                    </div>
                  ) : (
                    <>
                      {/* Table for larger screens */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gradient-to-l from-blue-50 to-blue-100 border-b-2 border-blue-200">
                              <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">#</th>
                              <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">التاريخ والوقت</th>
                              <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">المستخدم</th>
                              <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">العملية</th>
                              <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">الاحتياج</th>
                              <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">التفاصيل</th>
                            </tr>
                          </thead>
                          <tbody>
                            {auditLogs.map((log, index) => {
                              const actionInfo = getActionTypeLabel(log.action_type);
                              const ActionIcon = actionInfo.icon;
                              const dateTime = formatDateTime(log.timestamp);
                              const rowNumber = (auditLogsPagination.current_page - 1) * auditLogsPagination.per_page + index + 1;
                              
                              return (
                                <tr key={log.id || index} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                                  <td className="px-4 py-4 text-center text-sm font-bold text-gray-700">
                                    {rowNumber}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-900">
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <span className="font-semibold">{dateTime.date}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-600">{dateTime.time}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-sm">
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4 text-blue-600" />
                                      <span className="font-semibold text-gray-900">{log.user_name}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-sm">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${actionInfo.color}`}>
                                      <ActionIcon className="w-3.5 h-3.5" />
                                      {actionInfo.label}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 text-sm">
                                    <div className="flex items-center gap-2">
                                      <Package className="w-4 h-4 text-emerald-600" />
                                      <span className="font-semibold text-gray-900">{log.need_name}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-sm">
                                    {log.changes && Object.keys(log.changes).length > 0 ? (
                                      <button
                                        onClick={() => handleShowDetails(log)}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors border border-blue-200"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        عرض التفاصيل ({Object.keys(log.changes).length})
                                      </button>
                                    ) : (
                                      <span className="text-gray-400 text-xs">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Cards for mobile */}
                      <div className="md:hidden space-y-4">
                        {auditLogs.map((log, index) => {
                          const actionInfo = getActionTypeLabel(log.action_type);
                          const ActionIcon = actionInfo.icon;
                          const dateTime = formatDateTime(log.timestamp);
                          const rowNumber = (auditLogsPagination.current_page - 1) * auditLogsPagination.per_page + index + 1;
                          
                          return (
                            <div key={log.id || index} className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200 relative">
                              {/* Row Number Badge */}
                              <div className="absolute top-3 left-3 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                {rowNumber}
                              </div>
                              
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-blue-600" />
                                  <span className="font-bold text-gray-900">{log.user_name}</span>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border ${actionInfo.color}`}>
                                  <ActionIcon className="w-3 h-3" />
                                  {actionInfo.label}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 mb-2">
                                <Package className="w-4 h-4 text-emerald-600" />
                                <span className="font-semibold text-gray-900">{log.need_name}</span>
                              </div>
                              
                              <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {dateTime.date}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {dateTime.time}
                                </span>
                              </div>
                              
                              {log.changes && Object.keys(log.changes).length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-300">
                                  <button
                                    onClick={() => handleShowDetails(log)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold transition-colors border border-blue-200"
                                  >
                                    <Eye className="w-4 h-4" />
                                    عرض التفاصيل الكاملة ({Object.keys(log.changes).length} تغيير)
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination */}
                      {auditLogsPagination.total_pages > 1 && (
                        <div className="mt-6 flex items-center justify-between border-t pt-4">
                          <div className="text-sm text-gray-600">
                            صفحة {auditLogsPagination.current_page} من {auditLogsPagination.total_pages}
                            {' '}({auditLogsPagination.total_count} سجل)
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => fetchAuditLogs(auditLogsPagination.current_page - 1)}
                              disabled={!auditLogsPagination.has_prev}
                              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                auditLogsPagination.has_prev
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              السابق
                            </button>
                            <button
                              onClick={() => fetchAuditLogs(auditLogsPagination.current_page + 1)}
                              disabled={!auditLogsPagination.has_next}
                              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                auditLogsPagination.has_next
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              التالي
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                )}
              </div>

              {/* Sidebar - 1 column */}
              <div className="space-y-6">
                
                {/* Income Level */}
                {incomeLevel && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-amber-600" />
                      مستوى الدخل
                    </h3>
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 space-y-2">
                      <p className="text-center text-lg font-bold text-amber-900">{incomeLevel.name}</p>
                      {incomeLevel.description && (
                        <p className="text-center text-sm text-amber-700 leading-relaxed">{incomeLevel.description}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Need Assessment - نفس الأسلوب تماماً */}
                {needAssessment && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      تقييم الاحتياج
                    </h3>
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 space-y-2">
                      <p className="text-center text-lg font-bold text-purple-900">{needAssessment.name}</p>
                      {needAssessment.description && (
                        <p className="text-center text-sm text-purple-700 leading-relaxed">{needAssessment.description}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                {(family.contact_phone || family.contact_email) && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">معلومات التواصل</h3>
                    <div className="space-y-3">
                      {family.contact_phone && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <Phone className="w-5 h-5 text-emerald-600" />
                          <span className="text-sm" dir="ltr">{family.contact_phone}</span>
                        </div>
                      )}
                      {family.contact_email && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <Mail className="w-5 h-5 text-emerald-600" />
                          <span className="text-sm">{family.contact_email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    التواريخ
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">تاريخ التسجيل</p>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-semibold">{formatDate(family.created_at)}</span>
                      </div>
                    </div>
                    {family.updated_at && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">آخر تحديث</p>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-semibold">{formatDate(family.updated_at)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl shadow-xl p-6 text-white">
                  <h3 className="text-xl font-bold mb-3">ساعد هذه العائلة</h3>
                  <p className="text-emerald-100 text-sm mb-4">
                    كل مساهمة تحدث فرقاً كبيراً في حياة هذه العائلة
                  </p>
                  <button 
                    onClick={() => setShowDonationModal(true)}
                    className="w-full bg-white text-emerald-600 py-3 rounded-lg font-bold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Heart className="w-5 h-5" />
                    <span>تقديم المساعدة</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Image Viewer Modal */}
      {showImageViewer && familyImages.length > 0 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50"
          onClick={closeImageViewer}
        >
          {/* Close Button */}
          <button
            onClick={closeImageViewer}
            className="absolute top-4 left-4 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 right-4 z-50 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-semibold">
            {currentImageIndex + 1} / {familyImages.length}
          </div>

          {/* Previous Button */}
          {familyImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </button>
          )}

          {/* Next Button */}
          {familyImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>
          )}

          {/* Main Image */}
          <div 
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={familyImages[currentImageIndex]}
              alt={`صورة ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Thumbnails */}
          {familyImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-black/50 p-3 rounded-full max-w-[90vw] overflow-x-auto">
              {familyImages.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentImageIndex 
                      ? 'border-emerald-500 scale-110' 
                      : 'border-white/30 hover:border-white/60'
                  }`}
                >
                  <img
                    src={image}
                    alt={`صورة مصغرة ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 overflow-y-auto" onClick={() => setShowConfirmDonation(false)}>
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Fixed */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">تأكيد المساعدة</h2>
                  <p className="text-emerald-100 text-sm">يرجى التأكد من صحة المعلومات</p>
                </div>
              </div>
            </div>

            {/* Body - Scrollable */}
            <div className="max-h-[calc(90vh-12rem)] overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Family Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">معلومات العائلة</h3>
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <span className="font-semibold">اسم العائلة:</span> {family?.name}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">رقم العائلة:</span> {family?.family_number}
                    </p>
                  </div>
                </div>

                {/* Donor Info */}
                <div className="bg-emerald-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">معلومات المتبرع</h3>
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <span className="font-semibold">الاسم:</span> {donationForm.donor_name}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">رقم الهاتف:</span> {donationForm.donor_phone || 'غير متوفر'}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">البريد الإلكتروني:</span> {donationForm.donor_email || 'غير متوفر'}
                    </p>
                  </div>
                </div>

                {/* Donation Details */}
                <div className="bg-amber-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">تفاصيل المساعدة</h3>
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <span className="font-semibold">المبلغ:</span> {donationForm.amount} ليرة سورية
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">الوصف:</span> {donationForm.description}
                    </p>
                    {donationForm.notes && (
                      <p className="text-gray-700">
                        <span className="font-semibold">ملاحظات:</span> {donationForm.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Important Notice */}
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-red-900 mb-1">معلومات هامة</h4>
                      <p className="text-sm text-red-800 leading-relaxed">
                        سيتم إرسال معلومات التبرع إلى لجنة الحي المسؤولة عن هذه العائلة. سيقوم أحد أعضاء اللجنة بالتواصل معك لتنسيق عملية تقديم المساعدة وتحديد الطريقة والوقت المناسبين.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Sticky at bottom */}
            <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 px-6 py-4 rounded-b-2xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleConfirmDonation}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-xl font-bold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg"
                >
                  <CheckCircle className="w-6 h-6" />
                  <span>تأكيد وإرسال المساعدة</span>
                </button>
                
                <button
                  onClick={() => setShowConfirmDonation(false)}
                  className="sm:w-auto bg-gray-100 text-gray-700 py-4 px-8 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  رجوع
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Need Modal */}
      {/* Add Need Modal */}
      {showAddNeedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddNeedModal(false)}>
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">إضافة احتياج جديد</h2>
                    <p className="text-emerald-100 text-sm">لعائلة {family?.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddNeedModal(false)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddNeedSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  نوع الاحتياج <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={needForm.need_id}
                  onChange={(e) => setNeedForm({...needForm, need_id: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors"
                >
                  <option value="">-- اختر نوع الاحتياج --</option>
                  {allNeeds.map((need) => (
                    <option key={need.id} value={need.id}>
                      {need.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  الكمية/المقدار
                </label>
                <input
                  type="text"
                  value={needForm.amount}
                  onChange={(e) => setNeedForm({...needForm, amount: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors"
                  placeholder="مثال: 500 كجم، 10 قطع، إلخ"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  مدة الاحتياج <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={needForm.duration_type}
                  onChange={(e) => setNeedForm({...needForm, duration_type: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors"
                >
                  <option value="مرة واحدة">مرة واحدة</option>
                  <option value="شهري">شهري</option>
                </select>
              </div>

              {/* حقل الشهر - يظهر فقط للاحتياجات الشهرية */}
              {needForm.duration_type === 'شهري' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    الشهر <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={needForm.month}
                    onChange={(e) => setNeedForm({...needForm, month: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors"
                  >
                    <option value="">اختر الشهر</option>
                    <option value="JAN-2025">يناير 2025</option>
                    <option value="FEB-2025">فبراير 2025</option>
                    <option value="MAR-2025">مارس 2025</option>
                    <option value="APR-2025">أبريل 2025</option>
                    <option value="MAY-2025">مايو 2025</option>
                    <option value="JUN-2025">يونيو 2025</option>
                    <option value="JUL-2025">يوليو 2025</option>
                    <option value="AUG-2025">أغسطس 2025</option>
                    <option value="SEP-2025">سبتمبر 2025</option>
                    <option value="OCT-2025">أكتوبر 2025</option>
                    <option value="NOV-2025">نوفمبر 2025</option>
                    <option value="DEC-2025">ديسمبر 2025</option>
                    <option value="JAN-2026">يناير 2026</option>
                    <option value="FEB-2026">فبراير 2026</option>
                    <option value="MAR-2026">مارس 2026</option>
                    <option value="APR-2026">أبريل 2026</option>
                    <option value="MAY-2026">مايو 2026</option>
                    <option value="JUN-2026">يونيو 2026</option>
                    <option value="JUL-2026">يوليو 2026</option>
                    <option value="AUG-2026">أغسطس 2026</option>
                    <option value="SEP-2026">سبتمبر 2026</option>
                    <option value="OCT-2026">أكتوبر 2026</option>
                    <option value="NOV-2026">نوفمبر 2026</option>
                    <option value="DEC-2026">ديسمبر 2026</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ملاحظات
                </label>
                <textarea
                  value={needForm.notes}
                  onChange={(e) => setNeedForm({...needForm, notes: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors resize-none"
                  rows="3"
                  placeholder="أي ملاحظات إضافية عن الاحتياج..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-bold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>إضافة الاحتياج</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowAddNeedModal(false)}
                  className="flex-1 sm:flex-initial bg-gray-100 text-gray-700 py-3 px-8 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Need Modal */}
      {showEditNeedModal && editingNeed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditNeedModal(false)}>
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Edit className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">تعديل الاحتياج</h2>
                    <p className="text-blue-100 text-sm">{editingNeed.need_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEditNeedModal(false);
                    setEditingNeed(null);
                  }}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdateNeedSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  نوع الاحتياج <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={needForm.need_id}
                  onChange={(e) => setNeedForm({...needForm, need_id: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="">-- اختر نوع الاحتياج --</option>
                  {allNeeds.map((need) => (
                    <option key={need.id} value={need.id}>
                      {need.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  الكمية/المقدار
                </label>
                <input
                  type="text"
                  value={needForm.amount}
                  onChange={(e) => setNeedForm({...needForm, amount: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="مثال: 500 كجم، 10 قطع، إلخ"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  مدة الاحتياج <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={needForm.duration_type}
                  onChange={(e) => setNeedForm({...needForm, duration_type: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="مرة واحدة">مرة واحدة</option>
                  <option value="شهري">شهري</option>
                </select>
              </div>

              {/* حقل الشهر في التعديل - يظهر فقط للاحتياجات الشهرية */}
              {needForm.duration_type === 'شهري' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    الشهر <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={needForm.month}
                    onChange={(e) => setNeedForm({...needForm, month: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="">اختر الشهر</option>
                    <option value="JAN-2025">يناير 2025</option>
                    <option value="FEB-2025">فبراير 2025</option>
                    <option value="MAR-2025">مارس 2025</option>
                    <option value="APR-2025">أبريل 2025</option>
                    <option value="MAY-2025">مايو 2025</option>
                    <option value="JUN-2025">يونيو 2025</option>
                    <option value="JUL-2025">يوليو 2025</option>
                    <option value="AUG-2025">أغسطس 2025</option>
                    <option value="SEP-2025">سبتمبر 2025</option>
                    <option value="OCT-2025">أكتوبر 2025</option>
                    <option value="NOV-2025">نوفمبر 2025</option>
                    <option value="DEC-2025">ديسمبر 2025</option>
                    <option value="JAN-2026">يناير 2026</option>
                    <option value="FEB-2026">فبراير 2026</option>
                    <option value="MAR-2026">مارس 2026</option>
                    <option value="APR-2026">أبريل 2026</option>
                    <option value="MAY-2026">مايو 2026</option>
                    <option value="JUN-2026">يونيو 2026</option>
                    <option value="JUL-2026">يوليو 2026</option>
                    <option value="AUG-2026">أغسطس 2026</option>
                    <option value="SEP-2026">سبتمبر 2026</option>
                    <option value="OCT-2026">أكتوبر 2026</option>
                    <option value="NOV-2026">نوفمبر 2026</option>
                    <option value="DEC-2026">ديسمبر 2026</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ملاحظات
                </label>
                <textarea
                  value={needForm.notes}
                  onChange={(e) => setNeedForm({...needForm, notes: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-none"
                  rows="3"
                  placeholder="أي ملاحظات إضافية عن الاحتياج..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-bold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  <span>حفظ التعديلات</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowEditNeedModal(false);
                    setEditingNeed(null);
                  }}
                  className="flex-1 sm:flex-initial bg-gray-100 text-gray-700 py-3 px-8 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Donation Modal */}
      {showDonationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowDonationModal(false)}>
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Fixed */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">تقديم المساعدة</h2>
                    <p className="text-emerald-100 text-sm">لعائلة {family.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDonationModal(false)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="max-h-[calc(90vh-8rem)] overflow-y-auto">
              <form onSubmit={handleDonationSubmit} className="p-6 space-y-6">
                {/* Family Info Section - NEW */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    معلومات العائلة المستفيدة
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-500 mb-1">اسم العائلة</p>
                      <p className="font-bold text-gray-900">{family?.name}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-500 mb-1">رقم العائلة</p>
                      <p className="font-bold text-gray-900 font-mono">{family?.family_number}</p>
                    </div>
                    {neighborhood && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">الحي</p>
                        <p className="font-bold text-gray-900 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          {neighborhood.name}
                        </p>
                      </div>
                    )}
                    {category && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">الفئة</p>
                        <p className="font-bold text-gray-900 flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-600" />
                          {category.name}
                        </p>
                      </div>
                    )}
                    {incomeLevel && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">مستوى الدخل</p>
                        <p className="font-bold text-gray-900 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-amber-600" />
                          {incomeLevel.name}
                        </p>
                      </div>
                    )}
                    {needAssessment && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">تقييم الاحتياج</p>
                        <p 
                          className="font-bold flex items-center gap-2"
                          style={{ color: needAssessment.color }}
                        >
                          <TrendingUp className="w-4 h-4" />
                          {needAssessment.name}
                        </p>
                      </div>
                    )}
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-500 mb-1">عدد أفراد الأسرة</p>
                      <p className="font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        {totalMembers} فرد
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-500 mb-1">عدد الأطفال</p>
                      <p className="font-bold text-gray-900">
                        {(family?.male_children_count || 0) + (family?.female_children_count || 0)} طفل
                        <span className="text-xs text-gray-500 mr-2">
                          ({family?.male_children_count || 0} ذكور، {family?.female_children_count || 0} إناث)
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Donor Info - Read Only */}
                <div className="space-y-4 bg-gray-50 rounded-xl p-5 border-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-600" />
                    معلومات المتبرع
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        الاسم الكامل
                      </label>
                      <input
                        type="text"
                        value={donationForm.donor_name}
                        readOnly
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-200 text-gray-700 cursor-not-allowed font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        رقم الهاتف
                      </label>
                      <input
                        type="tel"
                        value={donationForm.donor_phone || 'غير متوفر'}
                        readOnly
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-200 text-gray-700 cursor-not-allowed font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      value={donationForm.donor_email || 'غير متوفر'}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-200 text-gray-700 cursor-not-allowed font-semibold"
                    />
                  </div>
                </div>

                {/* Donation Details */}
                <div className="space-y-4 bg-amber-50 rounded-xl p-5 border-2 border-amber-200">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-amber-600" />
                    تفاصيل المساعدة
                  </h3>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      المبلغ (بالليرة السورية) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="0"
                        value={donationForm.amount}
                        onChange={(e) => setDonationForm({...donationForm, amount: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition-all text-lg font-bold"
                        placeholder="مثال: 100000"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-lg">
                        ل.س
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      أدخل المبلغ الذي تريد التبرع به
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      وصف المساعدة <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={donationForm.description}
                      onChange={(e) => setDonationForm({...donationForm, description: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition-all resize-none"
                      rows="3"
                      placeholder="اكتب تفاصيل المساعدة التي تريد تقديمها..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ملاحظات إضافية
                    </label>
                    <textarea
                      value={donationForm.notes}
                      onChange={(e) => setDonationForm({...donationForm, notes: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition-all resize-none"
                      rows="2"
                      placeholder="أي ملاحظات أخرى..."
                    />
                  </div>

                  {/* Donation Date and Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t-2 border-amber-300">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline ml-1" />
                        تاريخ ووقت تقديم المساعدة (ميلادي)
                      </label>
                      <input
                        type="datetime-local"
                        value={donationForm.donation_date}
                        onChange={(e) => setDonationForm({...donationForm, donation_date: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition-all"
                      />
                      <p className="text-xs text-gray-600 mt-1">اختياري - حدد موعد تقديم المساعدة</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <CheckCircle className="w-4 h-4 inline ml-1" />
                        حالة التسليم
                      </label>
                      <select
                        value={donationForm.delivery_status}
                        onChange={(e) => setDonationForm({...donationForm, delivery_status: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition-all font-semibold"
                      >
                        <option value="scheduled">مجدولة</option>
                        <option value="delivered">تم التسليم</option>
                        <option value="cancelled">ملغية</option>
                      </select>
                      <p className="text-xs text-gray-600 mt-1">الحالة الافتراضية: مجدولة</p>
                    </div>
                  </div>
                </div>

                {/* Info Message */}
                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-red-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-red-900 mb-1">معلومة هامة</h4>
                      <p className="text-sm text-red-800 leading-relaxed">
                        سيتم التواصل معك من قبل لجنة الحي المسؤولة لتنسيق تقديم المساعدة وتحديد الطريقة والوقت المناسبين.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Buttons - Sticky at bottom */}
                <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t-2 border-gray-200 -mx-6 px-6">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-xl font-bold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg"
                    >
                      <Heart className="w-6 h-6" />
                      <span>متابعة وتأكيد المساعدة</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowDonationModal(false)}
                      className="sm:w-auto bg-gray-100 text-gray-700 py-4 px-8 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Details Modal */}
      {showDetailsModal && selectedLogDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-l from-blue-600 to-blue-500 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <History className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">تفاصيل الحركة</h3>
                  <p className="text-sm text-blue-100">معلومات التغييرات المسجلة</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-gray-600 font-semibold">المستخدم</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{selectedLogDetails.user_name}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs text-gray-600 font-semibold">الاحتياج</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{selectedLogDetails.need_name}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-xs text-gray-600 font-semibold">التاريخ</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {formatDateTime(selectedLogDetails.timestamp).date}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-xs text-gray-600 font-semibold">الوقت</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {formatDateTime(selectedLogDetails.timestamp).time}
                  </p>
                </div>
              </div>

              {/* Action Type Badge */}
              <div className="mb-6">
                <label className="block text-xs text-gray-600 font-semibold mb-2">نوع العملية</label>
                {(() => {
                  const actionInfo = getActionTypeLabel(selectedLogDetails.action_type);
                  const ActionIcon = actionInfo.icon;
                  return (
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border ${actionInfo.color}`}>
                      <ActionIcon className="w-4 h-4" />
                      {actionInfo.label}
                    </span>
                  );
                })()}
              </div>

              {/* Changes Details */}
              {selectedLogDetails.changes && Object.keys(selectedLogDetails.changes).length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Edit className="w-4 h-4 text-blue-600" />
                    التفاصيل والتغييرات
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(selectedLogDetails.changes).map(([field, value]) => (
                      <div key={field} className="bg-gradient-to-l from-gray-50 to-white border-2 border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <span className="font-bold text-gray-900">{field}</span>
                        </div>
                        {value.old !== undefined && value.new !== undefined ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <p className="text-xs text-red-600 font-semibold mb-1">القيمة القديمة</p>
                              <p className="text-sm text-red-900 font-medium break-words">
                                {value.old || 'فارغ'}
                              </p>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-xs text-green-600 font-semibold mb-1">القيمة الجديدة</p>
                              <p className="text-sm text-green-900 font-medium break-words">
                                {value.new || 'فارغ'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-900 font-medium break-words">
                              {JSON.stringify(value, null, 2)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Changes Message */}
              {(!selectedLogDetails.changes || Object.keys(selectedLogDetails.changes).length === 0) && (
                <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">لا توجد تفاصيل تغييرات لهذه العملية</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donation Details Modal */}
      {showDonationDetailsModal && selectedDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowDonationDetailsModal(false)}>
          <div 
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-emerald-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gift className="w-6 h-6" />
                <h2 className="text-xl font-bold">تفاصيل التبرع</h2>
              </div>
              <button
                onClick={() => setShowDonationDetailsModal(false)}
                className="w-8 h-8 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {/* الحالة */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">الحالة:</p>
                  <span className={`inline-flex px-4 py-2 rounded-lg text-sm font-bold ${
                    selectedDonation.status === 'completed' ? 'bg-green-100 text-green-700' :
                    selectedDonation.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    selectedDonation.status === 'inprogress' ? 'bg-blue-100 text-blue-700' :
                    selectedDonation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {getStatusLabel(selectedDonation.status)}
                  </span>
                </div>

                {/* تاريخ آخر تحديث */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Calendar className="w-4 h-4" />
                    <p className="text-sm">تاريخ آخر تحديث:</p>
                  </div>
                  <p className="font-bold text-gray-900">{formatDate(selectedDonation.updated_at || selectedDonation.created_at)}</p>
                </div>

                {/* من قام بالتحديث */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Users className="w-4 h-4" />
                    <p className="text-sm">تم التحديث بواسطة:</p>
                  </div>
                  <p className="font-bold text-gray-900">{selectedDonation.updated_by_user_name || 'النظام'}</p>
                </div>

                {/* صور وصل الاستلام - للمكتمل */}
                {selectedDonation.status === 'completed' && selectedDonation.completion_images && selectedDonation.completion_images.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2 text-green-700 mb-3">
                      <Package className="w-4 h-4" />
                      <p className="text-sm font-bold">صور وصل الاستلام ({selectedDonation.completion_images.length})</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedDonation.completion_images.map((img, idx) => (
                        <div 
                          key={idx} 
                          className="relative cursor-pointer group"
                          onClick={() => openDonationImageModal(selectedDonation.completion_images, idx)}
                        >
                          <img
                            src={img}
                            alt={`وصل ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-white shadow"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* سبب الإلغاء - للملغي */}
                {selectedDonation.status === 'cancelled' && selectedDonation.cancellation_reason && (
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center gap-2 text-red-700 mb-3">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-sm font-bold">سبب الإلغاء:</p>
                    </div>
                    <p className="text-gray-900 leading-relaxed">{selectedDonation.cancellation_reason}</p>
                  </div>
                )}

                {/* رسالة في حالة عدم وجود معلومات إضافية */}
                {selectedDonation.status !== 'completed' && selectedDonation.status !== 'cancelled' && (
                  <div className="bg-blue-50 rounded-lg p-6 text-center border border-blue-200">
                    <Gift className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                    <p className="text-gray-700 font-medium">التبرع قيد المعالجة</p>
                    <p className="text-gray-500 text-sm mt-1">سيتم تحديث التفاصيل لاحقاً</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t">
              <button
                onClick={() => setShowDonationDetailsModal(false)}
                className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-bold hover:bg-emerald-700 transition-colors"
              >
                إغلاق
              </button>
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
                  prevDonationImage();
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
                  nextDonationImage();
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

      <Footer />
    </div>
  );
};

export default FamilyDetails;

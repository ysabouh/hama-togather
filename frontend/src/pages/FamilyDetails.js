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
    notes: ''
  });
  const [needForm, setNeedForm] = useState({
    need_id: '',
    amount: '',
    duration_type: 'مرة واحدة',
    notes: ''
  });
  const [editingNeed, setEditingNeed] = useState(null);
  const [showEditNeedModal, setShowEditNeedModal] = useState(false);
  const [activeNeedsTab, setActiveNeedsTab] = useState('active'); // 'active' or 'inactive'
  const [allNeeds, setAllNeeds] = useState([]);
  const [donationHistory, setDonationHistory] = useState([]);
  
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
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'غير محدد';
    }
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
        notes: ''
      });
      
      // إعادة تحميل البيانات
      fetchFamilyDetails();
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
                {(family?.total_needs_amount > 0 || family?.total_donations_amount > 0) && (
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
                          {new Intl.NumberFormat('ar-SY').format(family?.total_needs_amount || 0)}
                        </p>
                        <p className="text-xs opacity-80 mt-1">ليرة سورية</p>
                      </div>

                      {/* Total Donations */}
                      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <Gift className="w-8 h-8 opacity-80" />
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-2xl">💰</span>
                          </div>
                        </div>
                        <p className="text-sm opacity-90 mb-1">إجمالي التبرعات</p>
                        <p className="text-3xl font-bold">
                          {new Intl.NumberFormat('ar-SY').format(family?.total_donations_amount || 0)}
                        </p>
                        <p className="text-xs opacity-80 mt-1">ليرة سورية</p>
                      </div>

                      {/* Remaining */}
                      <div className={`rounded-xl p-5 shadow-lg hover:shadow-xl transition-shadow ${
                        (family?.total_needs_amount || 0) > (family?.total_donations_amount || 0)
                          ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                          : 'bg-gradient-to-br from-green-500 to-emerald-600'
                      } text-white`}>
                        <div className="flex items-center justify-between mb-3">
                          <DollarSign className="w-8 h-8 opacity-80" />
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-2xl">
                              {(family?.total_needs_amount || 0) > (family?.total_donations_amount || 0) ? '⚠️' : '✅'}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm opacity-90 mb-1">
                          {(family?.total_needs_amount || 0) > (family?.total_donations_amount || 0) 
                            ? 'المبلغ المتبقي' 
                            : 'المبلغ الزائد'}
                        </p>
                        <p className="text-3xl font-bold">
                          {new Intl.NumberFormat('ar-SY').format(
                            Math.abs((family?.total_needs_amount || 0) - (family?.total_donations_amount || 0))
                          )}
                        </p>
                        <p className="text-xs opacity-80 mt-1">ليرة سورية</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {family?.total_needs_amount > 0 && (
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">نسبة التغطية</span>
                          <span className="text-sm font-bold text-emerald-600">
                            {Math.min(100, Math.round(((family?.total_donations_amount || 0) / family.total_needs_amount) * 100))}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                            style={{ 
                              width: `${Math.min(100, ((family?.total_donations_amount || 0) / family.total_needs_amount) * 100)}%` 
                            }}
                          >
                            {((family?.total_donations_amount || 0) / family.total_needs_amount) * 100 >= 10 && (
                              <span className="text-xs font-bold text-white">
                                {Math.round(((family?.total_donations_amount || 0) / family.total_needs_amount) * 100)}%
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
                                    
                                    {/* Date in Gregorian */}
                                    {need.created_at && (
                                      <span className="flex items-center gap-1 text-xs text-gray-500">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(need.created_at).toLocaleDateString('en-GB', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric'
                                        })}
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
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-semibold text-purple-900">
                                    ⏰ مدة الاحتياج: <span className="text-purple-700 font-bold text-base">{need.duration_type || 'مرة واحدة'}</span>
                                  </p>
                                  {need.duration_type === 'شهري' && need.created_at && (
                                    <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full font-bold">
                                      {(() => {
                                        const createdDate = new Date(need.created_at);
                                        const today = new Date();
                                        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                                        const daysLeft = Math.ceil((endOfMonth - today) / (1000 * 60 * 60 * 24));
                                        return daysLeft > 0 ? `${daysLeft} يوم متبقي` : 'انتهى الشهر';
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
                  
                  {donationHistory.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Gift className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600 font-semibold mb-1">لا توجد مساعدات مسجلة حتى الآن</p>
                      <p className="text-sm text-gray-400">كن أول من يساعد هذه العائلة!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {donationHistory.map((donation, idx) => (
                        <div
                          key={donation.id || idx}
                          className="relative border-r-4 border-emerald-500 pr-6 pb-4 last:pb-0"
                        >
                          {/* Timeline Dot */}
                          <div className="absolute right-0 top-0 w-4 h-4 bg-emerald-500 rounded-full transform translate-x-1/2 ring-4 ring-white"></div>
                          
                          <div className="bg-gray-50 rounded-lg p-4 hover:bg-emerald-50 transition-colors">
                            <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                              <div className="flex-1">
                                <h3 className="font-bold text-gray-900 text-lg">{donation.donor_name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                    {donation.donation_type}
                                  </span>
                                  <span className="text-sm font-bold text-gray-900">{donation.amount}</span>
                                </div>
                              </div>
                              <span className="text-xs text-gray-500 flex items-center gap-1 whitespace-nowrap">
                                <Clock className="w-3 h-3" />
                                {formatDate(donation.created_at)}
                              </span>
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
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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

      <Footer />
    </div>
  );
};

export default FamilyDetails;

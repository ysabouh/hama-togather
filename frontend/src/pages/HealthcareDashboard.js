import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { toast } from 'sonner';
import Select from 'react-select';
import {
  Stethoscope,
  Building2,
  FlaskConical,
  Heart,
  Calendar,
  Gift,
  Percent,
  Plus,
  Trash2,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  Users,
  TrendingUp,
  Award,
  Sparkles,
  Activity,
  Star,
  HeartHandshake,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Custom styles for react-select with modern theme
const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: '1rem',
    borderColor: state.isFocused ? '#ef4444' : '#e2e8f0',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none',
    '&:hover': { borderColor: '#ef4444' },
    minHeight: '48px',
    direction: 'rtl',
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(8px)'
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '1rem',
    overflow: 'hidden',
    zIndex: 50,
    direction: 'rtl',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#ef4444' : state.isFocused ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
    color: state.isSelected ? 'white' : '#374151',
    cursor: 'pointer',
    textAlign: 'right',
    padding: '12px 16px'
  }),
  placeholder: (base) => ({
    ...base,
    color: '#94a3b8',
    textAlign: 'right'
  }),
  singleValue: (base) => ({
    ...base,
    textAlign: 'right'
  })
};

const HealthcareDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [providerData, setProviderData] = useState(null);
  const [providerType, setProviderType] = useState(null);
  const [families, setFamilies] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBenefitsList, setShowBenefitsList] = useState(false);
  const [selectedDayBenefits, setSelectedDayBenefits] = useState([]);
  const [editingBenefit, setEditingBenefit] = useState(null);
  const [newBenefit, setNewBenefit] = useState({
    benefit_type: 'free',
    discount_percentage: 0,
    free_amount: 0,
    time_from: '08:00',
    time_to: '12:00',
    notes: ''
  });
  const [stats, setStats] = useState({ total: 0, free: 0, discount: 0 });

  const daysOfWeek = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  useEffect(() => {
    if (!user || !['doctor', 'pharmacist', 'laboratory'].includes(user.role)) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate]);

  useEffect(() => {
    if (providerData) {
      fetchBenefits();
    }
  }, [currentDate, providerData]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      let type = user.role;
      if (type === 'pharmacist') type = 'pharmacy';
      setProviderType(type);
      
      const providersRes = await axios.get(`${API_URL}/${type === 'pharmacy' ? 'pharmacies' : type + 's'}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const providers = providersRes.data || [];
      const myProvider = providers.find(p => 
        p.mobile === user.phone || 
        p.email === user.email ||
        p.user_id === user.id
      );
      
      if (myProvider) {
        setProviderData(myProvider);
        
        const statsRes = await axios.get(
          `${API_URL}/takaful-benefits/stats/${type}/${myProvider.id}`
        );
        setStats({
          total: statsRes.data.total_benefits || 0,
          free: statsRes.data.free_benefits || 0,
          discount: statsRes.data.discount_benefits || 0
        });
      }
      
      const familiesRes = await axios.get(`${API_URL}/families`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFamilies(familiesRes.data || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const fetchBenefits = async () => {
    if (!providerData) return;
    
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      const res = await axios.get(
        `${API_URL}/takaful-benefits/${providerType}/${providerData.id}?month=${month}&year=${year}`
      );
      setBenefits(res.data || []);
    } catch (error) {
      console.error('Error fetching benefits:', error);
    }
  };

  const handleAddBenefit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate) {
      toast.error('يرجى اختيار تاريخ');
      return;
    }
    
    if (!newBenefit.time_from || !newBenefit.time_to) {
      toast.error('يرجى تحديد وقت الاستفادة');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/takaful-benefits`, {
        provider_type: providerType,
        provider_id: providerData.id,
        benefit_type: newBenefit.benefit_type,
        discount_percentage: newBenefit.benefit_type === 'discount' ? newBenefit.discount_percentage : null,
        free_amount: newBenefit.benefit_type === 'free' ? newBenefit.free_amount : null,
        benefit_date: selectedDate,
        time_from: newBenefit.time_from,
        time_to: newBenefit.time_to,
        notes: newBenefit.notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('تم إضافة الاستفادة بنجاح');
      setShowAddForm(false);
      setSelectedDate(null);
      setNewBenefit({ benefit_type: 'free', discount_percentage: 0, free_amount: 0, time_from: '08:00', time_to: '12:00', notes: '' });
      fetchBenefits();
      
      const statsRes = await axios.get(
        `${API_URL}/takaful-benefits/stats/${providerType}/${providerData.id}`
      );
      setStats({
        total: statsRes.data.total_benefits || 0,
        free: statsRes.data.free_benefits || 0,
        discount: statsRes.data.discount_benefits || 0
      });
    } catch (error) {
      console.error('Error adding benefit:', error);
      toast.error('فشل إضافة الاستفادة');
    }
  };

  const handleDeleteBenefit = async (benefitId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الاستفادة؟')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/takaful-benefits/${benefitId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('تم حذف الاستفادة بنجاح');
      fetchBenefits();
      
      // تحديث قائمة الاستفادات المعروضة
      setSelectedDayBenefits(prev => prev.filter(b => b.id !== benefitId));
      
      const statsRes = await axios.get(
        `${API_URL}/takaful-benefits/stats/${providerType}/${providerData.id}`
      );
      setStats({
        total: statsRes.data.total_benefits || 0,
        free: statsRes.data.free_benefits || 0,
        discount: statsRes.data.discount_benefits || 0
      });
      
      // إغلاق النافذة إذا لم يتبق استفادات
      if (selectedDayBenefits.length <= 1) {
        setShowBenefitsList(false);
      }
    } catch (error) {
      console.error('Error deleting benefit:', error);
      toast.error('فشل حذف الاستفادة');
    }
  };

  const handleUpdateBenefit = async (e) => {
    e.preventDefault();
    if (!editingBenefit) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/takaful-benefits/${editingBenefit.id}`, {
        benefit_type: editingBenefit.benefit_type,
        discount_percentage: editingBenefit.benefit_type === 'discount' ? editingBenefit.discount_percentage : null,
        time_from: editingBenefit.time_from,
        time_to: editingBenefit.time_to,
        notes: editingBenefit.notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('تم تحديث الاستفادة بنجاح');
      setEditingBenefit(null);
      fetchBenefits();
      
      // تحديث قائمة الاستفادات المعروضة
      setSelectedDayBenefits(prev => 
        prev.map(b => b.id === editingBenefit.id ? editingBenefit : b)
      );
      
      const statsRes = await axios.get(
        `${API_URL}/takaful-benefits/stats/${providerType}/${providerData.id}`
      );
      setStats({
        total: statsRes.data.total_benefits || 0,
        free: statsRes.data.free_benefits || 0,
        discount: statsRes.data.discount_benefits || 0
      });
    } catch (error) {
      console.error('Error updating benefit:', error);
      toast.error('فشل تحديث الاستفادة');
    }
  };

  // التحقق إذا كان التاريخ في الماضي
  const isPastDate = (day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return checkDate < today;
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const getBenefitsForDay = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return benefits.filter(b => b.benefit_date?.split('T')[0] === dateStr);
  };

  const getFamilyName = (familyId) => {
    const family = families.find(f => f.id === familyId);
    return family?.name || family?.family_number || 'أسرة';
  };

  // تحويل الوقت إلى صيغة 12 ساعة مع صباحاً/مساءً
  const formatTime12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'م' : 'ص';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  // عرض نطاق الوقت بصيغة 12 ساعة
  const formatTimeRange = (timeFrom, timeTo) => {
    const from = formatTime12Hour(timeFrom || '08:00');
    const to = formatTime12Hour(timeTo || '12:00');
    return `${from} - ${to}`;
  };

  const getProviderIcon = () => {
    switch (providerType) {
      case 'doctor': return <Stethoscope className="w-8 h-8" />;
      case 'pharmacy': return <Building2 className="w-8 h-8" />;
      case 'laboratory': return <FlaskConical className="w-8 h-8" />;
      default: return <Heart className="w-8 h-8" />;
    }
  };

  const getProviderTypeLabel = () => {
    switch (providerType) {
      case 'doctor': return 'طبيب';
      case 'pharmacy': return 'صيدلية';
      case 'laboratory': return 'مخبر';
      default: return 'مقدم خدمة';
    }
  };

  const familyOptions = families.map(f => ({
    value: f.id,
    label: `${f.family_number || f.family_code || f.id} - ${f.name}`
  }));

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 md:h-28 rounded-2xl"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayBenefits = getBenefitsForDay(day);
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = day === new Date().getDate() && 
                      currentDate.getMonth() === new Date().getMonth() && 
                      currentDate.getFullYear() === new Date().getFullYear();
      const isSelected = selectedDate === dateStr;
      const isPast = isPastDate(day);
      
      // حساب عدد الاستفادات المجانية والخصومات
      const freeCount = dayBenefits.filter(b => b.benefit_type === 'free').length;
      const discountCount = dayBenefits.filter(b => b.benefit_type === 'discount').length;
      const hasBenefits = dayBenefits.length > 0;

      // دالة فتح نموذج الإضافة
      const handleAddClick = (e) => {
        e.stopPropagation();
        if (isPast) return;
        setSelectedDate(dateStr);
        setShowAddForm(true);
      };

      // دالة فتح قائمة الاستفادات
      const handleBenefitsClick = (e) => {
        e.stopPropagation();
        setSelectedDate(dateStr);
        setSelectedDayBenefits(dayBenefits);
        setShowBenefitsList(true);
      };

      days.push(
        <div
          key={day}
          className={`relative h-24 md:h-28 p-2 rounded-2xl border-2 transition-all duration-300 ${
            isPast
              ? 'border-slate-100 bg-slate-50/50 cursor-not-allowed opacity-60'
              : isSelected
              ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg shadow-emerald-200/50 ring-2 ring-emerald-300'
              : isToday
              ? 'border-emerald-300 bg-gradient-to-br from-emerald-50/50 to-white ring-2 ring-emerald-200/50'
              : hasBenefits
              ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white'
              : 'border-slate-100 bg-white/80'
          }`}
        >
          {/* رقم اليوم */}
          <div className={`text-sm font-bold ${
            isPast ? 'text-slate-400' : isToday ? 'text-emerald-600' : hasBenefits ? 'text-emerald-500' : 'text-slate-600'
          }`}>
            {day}
          </div>
          
          {/* شارة الاستفادات - قابلة للنقر */}
          {hasBenefits && (
            <div 
              className="absolute top-1 left-1 cursor-pointer z-10"
              onClick={handleBenefitsClick}
            >
              <div className="relative group/badge">
                {/* الدائرة الخضراء مع العدد */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg shadow-emerald-300/50 ring-2 ring-white hover:scale-110 transition-transform">
                  <span className="text-[10px] font-bold">{dayBenefits.length}</span>
                </div>
                {/* تأثير النبض */}
                <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-30"></div>
                {/* tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-slate-800 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/badge:opacity-100 transition-opacity z-20">
                  انقر لعرض التفاصيل
                </div>
              </div>
            </div>
          )}
          
          {/* أيقونات نوع الاستفادة - قابلة للنقر */}
          {hasBenefits && (
            <div 
              className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1 cursor-pointer"
              onClick={handleBenefitsClick}
            >
              {freeCount > 0 && (
                <div className="flex items-center gap-0.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-1.5 py-0.5 rounded-md shadow-sm shadow-emerald-200/50 hover:scale-105 transition-transform">
                  <Gift className="w-2.5 h-2.5" />
                  <span className="text-[10px] font-bold">{freeCount}</span>
                </div>
              )}
              {discountCount > 0 && (
                <div className="flex items-center gap-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.5 rounded-md shadow-sm shadow-amber-200/50 hover:scale-105 transition-transform">
                  <Percent className="w-2.5 h-2.5" />
                  <span className="text-[10px] font-bold">{discountCount}</span>
                </div>
              )}
            </div>
          )}
          
          {/* زر الإضافة - فقط لليوم وما بعده */}
          {!isPast && (
            <div 
              className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
              onClick={handleAddClick}
            >
              <div className="bg-emerald-600/90 backdrop-blur-sm text-white w-8 h-8 rounded-lg flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                <Plus className="w-4 h-4" />
              </div>
            </div>
          )}
          
          {/* علامة قفل للأيام السابقة */}
          {isPast && !hasBenefits && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-slate-300">
                <Clock className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50/30 to-green-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-emerald-200 border-t-emerald-600 mx-auto"></div>
            <Heart className="w-8 h-8 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="mt-6 text-slate-600 font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!providerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50/30 to-green-50/20">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-emerald-100/50 p-12 max-w-lg mx-auto border border-emerald-100">
            <div className="bg-gradient-to-br from-emerald-100 to-teal-100 p-5 rounded-2xl w-24 h-24 mx-auto mb-6 flex items-center justify-center text-emerald-600">
              {getProviderIcon()}
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">لا يوجد ملف مرتبط</h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              لم يتم ربط حسابك بملف {getProviderTypeLabel()} بعد. يرجى التواصل مع المسؤول لربط حسابك.
            </p>
            <Button 
              onClick={() => navigate('/')} 
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-3 rounded-xl shadow-lg shadow-emerald-200/50"
            >
              العودة للرئيسية
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/10">
      <Navbar />
      
      {/* Hero Section - Green Theme */}
      <div className="relative overflow-hidden">
        {/* Background Gradient - Green Theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900"></div>
        
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -left-20 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 right-1/4 w-48 h-48 bg-teal-400/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-6 md:py-8">
          {/* Top Badge */}
          <div className="flex justify-center mb-3">
            <div className="bg-white/15 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-2 text-xs">
              <HeartHandshake className="w-3.5 h-3.5 text-white" />
              <span className="text-white/90 font-medium">برنامج التكافل الصحي المجتمعي</span>
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            {/* Welcome Section */}
            <div className="flex items-center gap-3 text-center md:text-right">
              <div className="bg-white/15 backdrop-blur-md p-3 rounded-xl border border-white/20 shadow-lg relative">
                <div className="text-white">
                  {getProviderIcon()}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-900 p-0.5 rounded">
                  <Star className="w-2.5 h-2.5 fill-current" />
                </div>
              </div>
              <div className="text-white">
                <h1 className="text-xl md:text-2xl font-bold">
                  مرحباً، {providerData.full_name || providerData.name}
                </h1>
                <p className="text-white/70 text-xs flex items-center gap-1.5 justify-center md:justify-start">
                  <Award className="w-3.5 h-3.5" />
                  {getProviderTypeLabel()} مشارك في برنامج التكافل
                </p>
              </div>
            </div>
          
            {/* Stats Cards - More Compact */}
            <div className="flex flex-wrap justify-center gap-2">
              <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2.5 text-center border border-white/15 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white block leading-none">{stats.total}</span>
                    <span className="text-white/60 text-[10px]">إجمالي</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2.5 text-center border border-white/15 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-400/30 w-8 h-8 rounded-lg flex items-center justify-center">
                    <Gift className="w-4 h-4 text-emerald-200" />
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white block leading-none">{stats.free}</span>
                    <span className="text-white/60 text-[10px]">مجانية</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2.5 text-center border border-white/15 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center gap-2">
                  <div className="bg-amber-400/30 w-8 h-8 rounded-lg flex items-center justify-center">
                    <Percent className="w-4 h-4 text-amber-200" />
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white block leading-none">{stats.discount}</span>
                    <span className="text-white/60 text-[10px]">خصومات</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 40L60 37C120 34 240 28 360 25C480 22 600 22 720 23.5C840 25 960 28 1080 29.5C1200 31 1320 31 1380 31L1440 31V40H1380C1320 40 1200 40 1080 40C960 40 840 40 720 40C600 40 480 40 360 40C240 40 120 40 60 40H0Z" fill="url(#gradient)"/>
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(248 250 252)" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="rgb(248 250 252)"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Provider Card - Green Theme */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-emerald-100/30 overflow-hidden sticky top-4 border border-emerald-100/50">
              {/* Card Header */}
              <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 p-5 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5"></div>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                
                <div className="relative flex items-center gap-3">
                  <div className="bg-white/15 backdrop-blur-sm p-3 rounded-xl border border-white/20">
                    {getProviderIcon()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{providerData.full_name || providerData.name}</h3>
                    <p className="text-white/70 text-sm">{getProviderTypeLabel()}</p>
                  </div>
                </div>
                
                {providerData.participates_in_solidarity && (
                  <div className="relative mt-4 flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-2 rounded-lg w-fit border border-white/20 text-sm">
                    <Heart className="w-3.5 h-3.5 fill-white" />
                    <span className="font-medium">مشارك في التكافل</span>
                  </div>
                )}
              </div>
              
              {/* Card Body */}
              <div className="p-5 space-y-4">
                {providerData.address && (
                  <div className="flex items-start gap-3 group">
                    <div className="bg-emerald-50 p-2 rounded-lg group-hover:bg-emerald-100 transition-colors">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">العنوان</span>
                      <span className="text-slate-700 text-sm">{providerData.address}</span>
                    </div>
                  </div>
                )}
                
                {providerData.mobile && (
                  <div className="flex items-start gap-3 group">
                    <div className="bg-emerald-50 p-2 rounded-lg group-hover:bg-emerald-100 transition-colors">
                      <Phone className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">رقم الهاتف</span>
                      <span className="text-slate-700 text-sm" dir="ltr">{providerData.mobile}</span>
                    </div>
                  </div>
                )}
                
                {providerData.whatsapp && (
                  <a
                    href={`https://wa.me/${providerData.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 group"
                  >
                    <div className="bg-green-50 p-2 rounded-lg group-hover:bg-green-100 transition-colors">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">واتساب</span>
                      <span className="text-green-600 hover:text-green-700 text-sm" dir="ltr">{providerData.whatsapp}</span>
                    </div>
                  </a>
                )}
                
                <div className="pt-3 border-t border-emerald-100">
                  {providerData.is_active ? (
                    <span className="flex items-center gap-2 text-emerald-600 font-medium text-xs bg-gradient-to-r from-emerald-50 to-green-50 px-3 py-2 rounded-lg border border-emerald-100">
                      <CheckCircle className="w-3.5 h-3.5" />
                      نشط ومتاح
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-red-600 font-medium text-xs bg-gradient-to-r from-red-50 to-rose-50 px-3 py-2 rounded-lg border border-red-100">
                      <XCircle className="w-3.5 h-3.5" />
                      غير نشط
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Section - Green Theme */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-emerald-100/30 overflow-hidden border border-emerald-100/50">
              {/* Calendar Header */}
              <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 text-white p-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5"></div>
                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                
                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/15 backdrop-blur-sm p-2.5 rounded-lg border border-white/20">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">رزنامة التكافل</h2>
                      <p className="text-white/60 text-xs">انقر على أي يوم لإضافة استفادة</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-1.5 border border-white/15">
                    <button
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                      className="p-1.5 hover:bg-white/15 rounded-md transition-all duration-200"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <span className="font-bold px-3 min-w-[120px] text-center text-sm">
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <button
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                      className="p-1.5 hover:bg-white/15 rounded-md transition-all duration-200"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 gap-2 p-3 bg-gradient-to-b from-emerald-50/80 to-white border-b border-emerald-100">
                {daysOfWeek.map((day) => (
                  <div key={day} className="text-center text-xs font-bold text-emerald-700 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="p-3 bg-gradient-to-b from-white to-emerald-50/20">
                <div className="grid grid-cols-7 gap-2">
                  {renderCalendar()}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 p-4 border-t border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-white">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-[9px] font-bold shadow-sm">
                    {stats.total}
                  </div>
                  <span>عدد الاستفادات</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-0.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-1.5 py-0.5 rounded-md shadow-sm">
                    <Gift className="w-2.5 h-2.5" />
                    <span className="text-[9px] font-bold">{stats.free}</span>
                  </div>
                  <span>مجانية</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.5 rounded-md shadow-sm">
                    <Percent className="w-2.5 h-2.5" />
                    <span className="text-[9px] font-bold">{stats.discount}</span>
                  </div>
                  <span>خصم</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Benefit Modal - Green Theme */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md border border-emerald-100 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 text-white p-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/5"></div>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/15 backdrop-blur-sm p-2.5 rounded-lg border border-white/20">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">إضافة استفادة جديدة</h3>
                    <p className="text-white/60 text-xs">
                      {selectedDate && new Date(selectedDate).toLocaleDateString('ar-SA', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedDate(null);
                  }}
                  className="p-1.5 hover:bg-white/15 rounded-lg transition-all duration-200 border border-white/15"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddBenefit} className="p-5 space-y-4">
              {/* Time Range */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  وقت الاستفادة <span className="text-emerald-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">من</label>
                    <Input
                      type="time"
                      value={newBenefit.time_from}
                      onChange={(e) => setNewBenefit({ ...newBenefit, time_from: e.target.value })}
                      className="bg-white/80 border-slate-200 rounded-lg h-10 text-center"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">إلى</label>
                    <Input
                      type="time"
                      value={newBenefit.time_to}
                      onChange={(e) => setNewBenefit({ ...newBenefit, time_to: e.target.value })}
                      className="bg-white/80 border-slate-200 rounded-lg h-10 text-center"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Benefit Type */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  نوع الاستفادة
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewBenefit({ ...newBenefit, benefit_type: 'free' })}
                    className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                      newBenefit.benefit_type === 'free'
                        ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50 shadow-md shadow-emerald-100'
                        : 'border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/30'
                    }`}
                  >
                    <Gift className={`w-5 h-5 mx-auto mb-1 ${
                      newBenefit.benefit_type === 'free' ? 'text-emerald-500' : 'text-slate-400'
                    }`} />
                    <span className={`text-xs font-bold ${
                      newBenefit.benefit_type === 'free' ? 'text-emerald-700' : 'text-slate-600'
                    }`}>مجاني</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewBenefit({ ...newBenefit, benefit_type: 'discount' })}
                    className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                      newBenefit.benefit_type === 'discount'
                        ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md shadow-amber-100'
                        : 'border-slate-200 hover:border-amber-200 hover:bg-amber-50/30'
                    }`}
                  >
                    <Percent className={`w-5 h-5 mx-auto mb-1 ${
                      newBenefit.benefit_type === 'discount' ? 'text-amber-500' : 'text-slate-400'
                    }`} />
                    <span className={`text-xs font-bold ${
                      newBenefit.benefit_type === 'discount' ? 'text-amber-700' : 'text-slate-600'
                    }`}>خصم %</span>
                  </button>
                </div>
              </div>

              {/* Discount Percentage */}
              {newBenefit.benefit_type === 'discount' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    نسبة الخصم %
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={newBenefit.discount_percentage}
                    onChange={(e) => setNewBenefit({ ...newBenefit, discount_percentage: parseInt(e.target.value) || 0 })}
                    placeholder="مثال: 50"
                    className="bg-white/80 border-amber-200 rounded-lg h-10 text-center text-lg font-bold focus:ring-2 focus:ring-amber-200 focus:border-amber-400"
                    dir="ltr"
                  />
                </div>
              )}

              {/* Free Amount */}
              {newBenefit.benefit_type === 'free' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    المبلغ المجاني (ل.س)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={newBenefit.free_amount}
                    onChange={(e) => setNewBenefit({ ...newBenefit, free_amount: parseInt(e.target.value) || 0 })}
                    placeholder="مثال: 50000"
                    className="bg-white/80 border-emerald-200 rounded-lg h-10 text-center text-lg font-bold focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                    dir="ltr"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  ملاحظات (اختياري)
                </label>
                <Input
                  value={newBenefit.notes}
                  onChange={(e) => setNewBenefit({ ...newBenefit, notes: e.target.value })}
                  placeholder="أضف ملاحظات إن وجدت..."
                  className="bg-white/80 border-slate-200 rounded-lg h-10"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedDate(null);
                  }}
                  className="flex-1 h-10 rounded-lg border-2 border-slate-200 hover:bg-slate-50 text-sm"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-10 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-200/50 text-sm"
                >
                  <Plus className="w-4 h-4 ml-1.5" />
                  إضافة الاستفادة
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Benefits List Modal - عرض تفاصيل الاستفادات */}
      {showBenefitsList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-lg border border-emerald-100 overflow-hidden max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 text-white p-5 relative overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 bg-white/5"></div>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/15 backdrop-blur-sm p-2.5 rounded-lg border border-white/20">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">تفاصيل الاستفادات</h3>
                    <p className="text-white/60 text-xs">
                      {selectedDate && new Date(selectedDate).toLocaleDateString('ar-SA', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowBenefitsList(false);
                    setSelectedDate(null);
                    setEditingBenefit(null);
                  }}
                  className="p-1.5 hover:bg-white/15 rounded-lg transition-all duration-200 border border-white/15"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Benefits List */}
            <div className="p-4 overflow-y-auto flex-1">
              {selectedDayBenefits.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>لا توجد استفادات في هذا اليوم</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayBenefits.map((benefit, index) => (
                    <div 
                      key={benefit.id} 
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        editingBenefit?.id === benefit.id 
                          ? 'border-emerald-400 bg-emerald-50' 
                          : 'border-slate-100 bg-white hover:border-emerald-200'
                      }`}
                    >
                      {editingBenefit?.id === benefit.id ? (
                        // نموذج التعديل
                        <form onSubmit={handleUpdateBenefit} className="space-y-3">
                          {/* Time Range */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">من</label>
                              <Input
                                type="time"
                                value={editingBenefit.time_from || '08:00'}
                                onChange={(e) => setEditingBenefit({ ...editingBenefit, time_from: e.target.value })}
                                className="h-9 text-center"
                                dir="ltr"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">إلى</label>
                              <Input
                                type="time"
                                value={editingBenefit.time_to || '12:00'}
                                onChange={(e) => setEditingBenefit({ ...editingBenefit, time_to: e.target.value })}
                                className="h-9 text-center"
                                dir="ltr"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingBenefit({ ...editingBenefit, benefit_type: 'free' })}
                              className={`p-2 rounded-lg border text-xs font-bold transition-all ${
                                editingBenefit.benefit_type === 'free'
                                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                                  : 'border-slate-200 text-slate-600'
                              }`}
                            >
                              <Gift className="w-4 h-4 mx-auto mb-1" />
                              مجاني
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingBenefit({ ...editingBenefit, benefit_type: 'discount' })}
                              className={`p-2 rounded-lg border text-xs font-bold transition-all ${
                                editingBenefit.benefit_type === 'discount'
                                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                                  : 'border-slate-200 text-slate-600'
                              }`}
                            >
                              <Percent className="w-4 h-4 mx-auto mb-1" />
                              خصم
                            </button>
                          </div>
                          
                          {editingBenefit.benefit_type === 'discount' && (
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              value={editingBenefit.discount_percentage || 0}
                              onChange={(e) => setEditingBenefit({ ...editingBenefit, discount_percentage: parseInt(e.target.value) || 0 })}
                              placeholder="نسبة الخصم %"
                              className="h-9 text-center"
                              dir="ltr"
                            />
                          )}
                          
                          <Input
                            value={editingBenefit.notes || ''}
                            onChange={(e) => setEditingBenefit({ ...editingBenefit, notes: e.target.value })}
                            placeholder="ملاحظات..."
                            className="h-9 text-sm"
                          />
                          
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingBenefit(null)}
                              className="flex-1"
                            >
                              إلغاء
                            </Button>
                            <Button
                              type="submit"
                              size="sm"
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              حفظ التعديلات
                            </Button>
                          </div>
                        </form>
                      ) : (
                        // عرض البيانات
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">
                                #{index + 1}
                              </span>
                              <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                benefit.benefit_type === 'free' 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {benefit.benefit_type === 'free' ? (
                                  <span className="flex items-center gap-1">
                                    <Gift className="w-3 h-3" />
                                    مجاني
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <Percent className="w-3 h-3" />
                                    خصم {benefit.discount_percentage}%
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setEditingBenefit({...benefit})}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="تعديل"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteBenefit(benefit.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-600">الوقت:</span>
                              <span className="font-medium text-slate-800">
                                {formatTimeRange(benefit.time_from, benefit.time_to)}
                              </span>
                            </div>
                            
                            {benefit.benefit_type === 'free' && benefit.free_amount > 0 && (
                              <div className="flex items-center gap-2 text-sm">
                                <Gift className="w-4 h-4 text-emerald-500" />
                                <span className="text-slate-600">المبلغ المجاني:</span>
                                <span className="font-bold text-emerald-600">
                                  {benefit.free_amount?.toLocaleString('ar-SY')} ل.س
                                </span>
                              </div>
                            )}
                            
                            {benefit.notes && (
                              <div className="flex items-start gap-2 text-sm">
                                <MessageCircle className="w-4 h-4 text-slate-400 mt-0.5" />
                                <span className="text-slate-600">ملاحظات:</span>
                                <span className="text-slate-700">{benefit.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-emerald-100 bg-emerald-50/50 flex-shrink-0">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBenefitsList(false);
                    setSelectedDate(null);
                    setEditingBenefit(null);
                  }}
                  className="flex-1"
                >
                  إغلاق
                </Button>
                {!isPastDate(parseInt(selectedDate?.split('-')[2] || 0)) && (
                  <Button
                    onClick={() => {
                      setShowBenefitsList(false);
                      setShowAddForm(true);
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    إضافة استفادة
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default HealthcareDashboard;

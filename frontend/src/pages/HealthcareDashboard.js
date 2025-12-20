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
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Custom styles for react-select with modern theme
const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: '1rem',
    borderColor: state.isFocused ? '#06b6d4' : '#e2e8f0',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(6, 182, 212, 0.15)' : 'none',
    '&:hover': { borderColor: '#06b6d4' },
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
    backgroundColor: state.isSelected ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : state.isFocused ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
    background: state.isSelected ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : state.isFocused ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
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
  const [newBenefit, setNewBenefit] = useState({
    family_id: '',
    benefit_type: 'free',
    discount_percentage: 0,
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
    
    if (!newBenefit.family_id || !selectedDate) {
      toast.error('يرجى اختيار الأسرة المستفيدة');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/takaful-benefits`, {
        provider_type: providerType,
        provider_id: providerData.id,
        family_id: newBenefit.family_id,
        benefit_type: newBenefit.benefit_type,
        discount_percentage: newBenefit.benefit_type === 'discount' ? newBenefit.discount_percentage : null,
        benefit_date: selectedDate,
        notes: newBenefit.notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('تم إضافة الاستفادة بنجاح');
      setShowAddForm(false);
      setSelectedDate(null);
      setNewBenefit({ family_id: '', benefit_type: 'free', discount_percentage: 0, notes: '' });
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
      
      const statsRes = await axios.get(
        `${API_URL}/takaful-benefits/stats/${providerType}/${providerData.id}`
      );
      setStats({
        total: statsRes.data.total_benefits || 0,
        free: statsRes.data.free_benefits || 0,
        discount: statsRes.data.discount_benefits || 0
      });
    } catch (error) {
      console.error('Error deleting benefit:', error);
      toast.error('فشل حذف الاستفادة');
    }
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

  const getProviderGradient = () => {
    switch (providerType) {
      case 'doctor': return 'from-cyan-400 via-teal-500 to-emerald-500';
      case 'pharmacy': return 'from-emerald-400 via-green-500 to-teal-500';
      case 'laboratory': return 'from-violet-400 via-purple-500 to-indigo-500';
      default: return 'from-rose-400 via-pink-500 to-red-500';
    }
  };

  const getProviderAccent = () => {
    switch (providerType) {
      case 'doctor': return 'cyan';
      case 'pharmacy': return 'emerald';
      case 'laboratory': return 'violet';
      default: return 'rose';
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
      days.push(<div key={`empty-${i}`} className="h-24 md:h-28 rounded-xl"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayBenefits = getBenefitsForDay(day);
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = day === new Date().getDate() && 
                      currentDate.getMonth() === new Date().getMonth() && 
                      currentDate.getFullYear() === new Date().getFullYear();
      const isSelected = selectedDate === dateStr;

      days.push(
        <div
          key={day}
          onClick={() => {
            setSelectedDate(dateStr);
            setShowAddForm(true);
          }}
          className={`h-24 md:h-28 p-2 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
            isSelected
              ? 'border-cyan-400 bg-gradient-to-br from-cyan-50 to-teal-50 shadow-lg shadow-cyan-100'
              : isToday
              ? 'border-cyan-300 bg-gradient-to-br from-cyan-50/50 to-white ring-2 ring-cyan-200'
              : dayBenefits.length > 0
              ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white'
              : 'border-slate-100 bg-white/60 hover:border-slate-200 hover:bg-white'
          }`}
        >
          <div className={`text-sm font-bold mb-1 ${
            isToday ? 'text-cyan-600' : 'text-slate-600'
          }`}>
            {day}
          </div>
          <div className="space-y-1 overflow-y-auto max-h-16">
            {dayBenefits.map(benefit => (
              <div
                key={benefit.id}
                className={`text-xs px-2 py-1 rounded-lg flex items-center justify-between gap-1 backdrop-blur-sm ${
                  benefit.benefit_type === 'free'
                    ? 'bg-gradient-to-r from-emerald-100/90 to-green-100/90 text-emerald-700 border border-emerald-200/50'
                    : 'bg-gradient-to-r from-blue-100/90 to-cyan-100/90 text-blue-700 border border-blue-200/50'
                }`}
              >
                <span className="flex items-center gap-1 truncate">
                  {benefit.benefit_type === 'free' 
                    ? <Gift className="w-3 h-3 flex-shrink-0" /> 
                    : <span className="font-medium">{benefit.discount_percentage}%</span>
                  }
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBenefit(benefit.id);
                  }}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-teal-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-cyan-200 border-t-cyan-500 mx-auto"></div>
            <Activity className="w-8 h-8 text-cyan-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-6 text-slate-600 font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!providerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-teal-50/30">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 p-12 max-w-lg mx-auto border border-white/50">
            <div className="bg-gradient-to-br from-cyan-100 to-teal-100 p-5 rounded-2xl w-24 h-24 mx-auto mb-6 flex items-center justify-center text-cyan-600">
              {getProviderIcon()}
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">لا يوجد ملف مرتبط</h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              لم يتم ربط حسابك بملف {getProviderTypeLabel()} بعد. يرجى التواصل مع المسؤول لربط حسابك.
            </p>
            <Button 
              onClick={() => navigate('/')} 
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-8 py-3 rounded-xl shadow-lg shadow-cyan-200/50"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/20 to-teal-50/20">
      <Navbar />
      
      {/* Hero Section - Glassmorphism Design */}
      <div className={`relative overflow-hidden`}>
        {/* Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-r ${getProviderGradient()} opacity-90`}></div>
        
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Welcome Section */}
            <div className="flex items-center gap-5">
              <div className="bg-white/20 backdrop-blur-md p-5 rounded-2xl border border-white/30 shadow-xl">
                {getProviderIcon()}
              </div>
              <div className="text-white">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                  <span className="text-white/80 text-sm font-medium">برنامج التكافل الصحي</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-1">مرحباً، {providerData.full_name || providerData.name}</h1>
                <p className="text-white/70 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  {getProviderTypeLabel()}
                </p>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-white/15 backdrop-blur-md rounded-2xl px-6 py-5 text-center border border-white/20 min-w-[130px] hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                </div>
                <span className="text-3xl font-bold text-white block">{stats.total}</span>
                <span className="text-sm text-white/70">إجمالي الاستفادات</span>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-2xl px-6 py-5 text-center border border-white/20 min-w-[130px] hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Gift className="w-5 h-5 text-white" />
                  </div>
                </div>
                <span className="text-3xl font-bold text-white block">{stats.free}</span>
                <span className="text-sm text-white/70">مجانية</span>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-2xl px-6 py-5 text-center border border-white/20 min-w-[130px] hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Percent className="w-5 h-5 text-white" />
                  </div>
                </div>
                <span className="text-3xl font-bold text-white block">{stats.discount}</span>
                <span className="text-sm text-white/70">خصومات</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Provider Card - Modern Glass Effect */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden sticky top-4 border border-white/50">
              {/* Card Header */}
              <div className={`bg-gradient-to-r ${getProviderGradient()} p-6 text-white relative overflow-hidden`}>
                <div className="absolute inset-0 bg-white/5"></div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                
                <div className="relative flex items-center gap-4">
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl border border-white/30">
                    {getProviderIcon()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{providerData.full_name || providerData.name}</h3>
                    <p className="text-white/80 text-sm">{getProviderTypeLabel()}</p>
                  </div>
                </div>
                
                {providerData.participates_in_solidarity && (
                  <div className="relative mt-5 flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2.5 rounded-xl w-fit border border-white/30">
                    <Heart className="w-4 h-4 fill-white" />
                    <span className="text-sm font-medium">مشارك في التكافل</span>
                  </div>
                )}
              </div>
              
              {/* Card Body */}
              <div className="p-6 space-y-5">
                {providerData.address && (
                  <div className="flex items-start gap-4 group">
                    <div className="bg-slate-100 p-2.5 rounded-xl group-hover:bg-cyan-100 transition-colors">
                      <MapPin className="w-5 h-5 text-slate-500 group-hover:text-cyan-600" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block mb-0.5">العنوان</span>
                      <span className="text-slate-700">{providerData.address}</span>
                    </div>
                  </div>
                )}
                
                {providerData.mobile && (
                  <div className="flex items-start gap-4 group">
                    <div className="bg-slate-100 p-2.5 rounded-xl group-hover:bg-cyan-100 transition-colors">
                      <Phone className="w-5 h-5 text-slate-500 group-hover:text-cyan-600" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block mb-0.5">رقم الهاتف</span>
                      <span className="text-slate-700" dir="ltr">{providerData.mobile}</span>
                    </div>
                  </div>
                )}
                
                {providerData.whatsapp && (
                  <a
                    href={`https://wa.me/${providerData.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 group"
                  >
                    <div className="bg-green-100 p-2.5 rounded-xl group-hover:bg-green-200 transition-colors">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block mb-0.5">واتساب</span>
                      <span className="text-green-600 hover:text-green-700" dir="ltr">{providerData.whatsapp}</span>
                    </div>
                  </a>
                )}
                
                <div className="pt-4 border-t border-slate-100">
                  {providerData.is_active ? (
                    <span className="flex items-center gap-2 text-emerald-600 font-medium text-sm bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-2.5 rounded-xl border border-emerald-100">
                      <CheckCircle className="w-4 h-4" />
                      نشط ومتاح
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-red-600 font-medium text-sm bg-gradient-to-r from-red-50 to-rose-50 px-4 py-2.5 rounded-xl border border-red-100">
                      <XCircle className="w-4 h-4" />
                      غير نشط
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Section - Modern Design */}
          <div className="lg:col-span-2">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-white/50">
              {/* Calendar Header */}
              <div className={`bg-gradient-to-r ${getProviderGradient()} text-white p-6 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-white/5"></div>
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
                
                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/30">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">رزنامة التكافل</h2>
                      <p className="text-white/70 text-sm mt-0.5">انقر على أي يوم لإضافة استفادة جديدة</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-xl p-2 border border-white/20">
                    <button
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                      className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <span className="font-bold px-4 min-w-[140px] text-center">
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <button
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                      className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 gap-2 p-4 bg-gradient-to-b from-slate-50/80 to-white border-b border-slate-100">
                {daysOfWeek.map((day) => (
                  <div key={day} className="text-center text-sm font-bold text-slate-500 py-3">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="p-4 bg-gradient-to-b from-white to-slate-50/30">
                <div className="grid grid-cols-7 gap-2">
                  {renderCalendar()}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-6 p-5 border-t border-slate-100 bg-gradient-to-r from-slate-50/50 to-white">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-5 h-5 bg-gradient-to-r from-emerald-100 to-green-100 rounded-lg border border-emerald-200 flex items-center justify-center">
                    <Gift className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span>معاينة مجانية</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-5 h-5 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg border border-blue-200 flex items-center justify-center">
                    <Percent className="w-3 h-3 text-blue-600" />
                  </div>
                  <span>خصم</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-5 h-5 bg-cyan-50 rounded-lg ring-2 ring-cyan-300"></div>
                  <span>اليوم</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Benefit Modal - Modern Glass Effect */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md border border-white/50 overflow-hidden">
            {/* Modal Header */}
            <div className={`bg-gradient-to-r ${getProviderGradient()} text-white p-6 relative overflow-hidden`}>
              <div className="absolute inset-0 bg-white/5"></div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/30">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">إضافة استفادة جديدة</h3>
                    <p className="text-white/70 text-sm">
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
                  className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 border border-white/20"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddBenefit} className="p-6 space-y-5">
              {/* Family Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  الأسرة المستفيدة <span className="text-rose-500">*</span>
                </label>
                <Select
                  options={familyOptions}
                  value={familyOptions.find(f => f.value === newBenefit.family_id)}
                  onChange={(option) => setNewBenefit({ ...newBenefit, family_id: option?.value || '' })}
                  placeholder="ابحث واختر الأسرة..."
                  isClearable
                  isSearchable
                  noOptionsMessage={() => 'لا توجد نتائج'}
                  styles={selectStyles}
                />
              </div>

              {/* Benefit Type */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  نوع الاستفادة
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewBenefit({ ...newBenefit, benefit_type: 'free' })}
                    className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                      newBenefit.benefit_type === 'free'
                        ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg shadow-emerald-100'
                        : 'border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/30'
                    }`}
                  >
                    <Gift className={`w-6 h-6 mx-auto mb-2 ${
                      newBenefit.benefit_type === 'free' ? 'text-emerald-500' : 'text-slate-400'
                    }`} />
                    <span className={`text-sm font-bold ${
                      newBenefit.benefit_type === 'free' ? 'text-emerald-700' : 'text-slate-600'
                    }`}>مجاني</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewBenefit({ ...newBenefit, benefit_type: 'discount' })}
                    className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                      newBenefit.benefit_type === 'discount'
                        ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg shadow-blue-100'
                        : 'border-slate-200 hover:border-blue-200 hover:bg-blue-50/30'
                    }`}
                  >
                    <Percent className={`w-6 h-6 mx-auto mb-2 ${
                      newBenefit.benefit_type === 'discount' ? 'text-blue-500' : 'text-slate-400'
                    }`} />
                    <span className={`text-sm font-bold ${
                      newBenefit.benefit_type === 'discount' ? 'text-blue-700' : 'text-slate-600'
                    }`}>خصم %</span>
                  </button>
                </div>
              </div>

              {/* Discount Percentage */}
              {newBenefit.benefit_type === 'discount' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    نسبة الخصم %
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={newBenefit.discount_percentage}
                    onChange={(e) => setNewBenefit({ ...newBenefit, discount_percentage: parseInt(e.target.value) || 0 })}
                    placeholder="مثال: 50"
                    className="bg-white/80 border-slate-200 rounded-xl h-12 text-center text-lg font-bold focus:ring-2 focus:ring-blue-200"
                    dir="ltr"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  ملاحظات (اختياري)
                </label>
                <Input
                  value={newBenefit.notes}
                  onChange={(e) => setNewBenefit({ ...newBenefit, notes: e.target.value })}
                  placeholder="أضف ملاحظات إن وجدت..."
                  className="bg-white/80 border-slate-200 rounded-xl h-12"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedDate(null);
                  }}
                  className="flex-1 h-12 rounded-xl border-2 border-slate-200 hover:bg-slate-50"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  className={`flex-1 h-12 rounded-xl bg-gradient-to-r ${getProviderGradient()} hover:opacity-90 text-white shadow-lg`}
                >
                  <Plus className="w-5 h-5 ml-2" />
                  إضافة الاستفادة
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default HealthcareDashboard;

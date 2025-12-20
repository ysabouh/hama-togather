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
  HeartHandshake
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
      
      // حساب عدد الاستفادات المجانية والخصومات
      const freeCount = dayBenefits.filter(b => b.benefit_type === 'free').length;
      const discountCount = dayBenefits.filter(b => b.benefit_type === 'discount').length;
      const hasBenefits = dayBenefits.length > 0;

      days.push(
        <div
          key={day}
          onClick={() => {
            setSelectedDate(dateStr);
            setShowAddForm(true);
          }}
          className={`relative h-24 md:h-28 p-2 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.03] group ${
            isSelected
              ? 'border-rose-400 bg-gradient-to-br from-rose-50 to-red-50 shadow-lg shadow-rose-200/50 ring-2 ring-rose-300'
              : isToday
              ? 'border-rose-300 bg-gradient-to-br from-rose-50/50 to-white ring-2 ring-rose-200/50'
              : hasBenefits
              ? 'border-rose-200 bg-gradient-to-br from-rose-50/60 to-white hover:border-rose-300'
              : 'border-slate-100 bg-white/80 hover:border-rose-200 hover:bg-rose-50/30'
          }`}
        >
          {/* رقم اليوم */}
          <div className={`text-sm font-bold ${
            isToday ? 'text-rose-600' : hasBenefits ? 'text-rose-500' : 'text-slate-600'
          }`}>
            {day}
          </div>
          
          {/* شارة الاستفادات */}
          {hasBenefits && (
            <div className="absolute top-1 left-1">
              <div className="relative">
                {/* الدائرة الحمراء مع العدد */}
                <div className="bg-gradient-to-br from-rose-500 to-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg shadow-rose-300/50 ring-2 ring-white">
                  <span className="text-xs font-bold">{dayBenefits.length}</span>
                </div>
                {/* تأثير النبض */}
                <div className="absolute inset-0 bg-rose-400 rounded-full animate-ping opacity-30"></div>
              </div>
            </div>
          )}
          
          {/* أيقونات نوع الاستفادة */}
          {hasBenefits && (
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5">
              {freeCount > 0 && (
                <div className="flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-2 py-1 rounded-lg shadow-md shadow-emerald-200/50">
                  <Gift className="w-3 h-3" />
                  <span className="text-xs font-bold">{freeCount}</span>
                </div>
              )}
              {discountCount > 0 && (
                <div className="flex items-center gap-1 bg-gradient-to-r from-rose-500 to-red-500 text-white px-2 py-1 rounded-lg shadow-md shadow-rose-200/50">
                  <Percent className="w-3 h-3" />
                  <span className="text-xs font-bold">{discountCount}</span>
                </div>
              )}
            </div>
          )}
          
          {/* علامة + عند التحويم */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-rose-500/90 backdrop-blur-sm text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
              <Plus className="w-5 h-5" />
            </div>
          </div>
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
          
          {/* Provider Card - Red Theme */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-rose-100/30 overflow-hidden sticky top-4 border border-rose-100/50">
              {/* Card Header */}
              <div className="bg-gradient-to-br from-rose-500 via-red-500 to-rose-600 p-6 text-white relative overflow-hidden">
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
                    <div className="bg-rose-50 p-2.5 rounded-xl group-hover:bg-rose-100 transition-colors">
                      <MapPin className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block mb-0.5">العنوان</span>
                      <span className="text-slate-700">{providerData.address}</span>
                    </div>
                  </div>
                )}
                
                {providerData.mobile && (
                  <div className="flex items-start gap-4 group">
                    <div className="bg-rose-50 p-2.5 rounded-xl group-hover:bg-rose-100 transition-colors">
                      <Phone className="w-5 h-5 text-rose-500" />
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
                    <div className="bg-green-50 p-2.5 rounded-xl group-hover:bg-green-100 transition-colors">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block mb-0.5">واتساب</span>
                      <span className="text-green-600 hover:text-green-700" dir="ltr">{providerData.whatsapp}</span>
                    </div>
                  </a>
                )}
                
                <div className="pt-4 border-t border-rose-100">
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

          {/* Calendar Section - Red Theme */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-rose-100/30 overflow-hidden border border-rose-100/50">
              {/* Calendar Header */}
              <div className="bg-gradient-to-br from-rose-500 via-red-500 to-rose-600 text-white p-6 relative overflow-hidden">
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
              <div className="grid grid-cols-7 gap-2 p-4 bg-gradient-to-b from-rose-50/80 to-white border-b border-rose-100">
                {daysOfWeek.map((day) => (
                  <div key={day} className="text-center text-sm font-bold text-rose-600 py-3">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="p-4 bg-gradient-to-b from-white to-rose-50/20">
                <div className="grid grid-cols-7 gap-2">
                  {renderCalendar()}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-6 p-5 border-t border-rose-100 bg-gradient-to-r from-rose-50/50 to-white">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-7 h-7 bg-gradient-to-br from-rose-500 to-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                    3
                  </div>
                  <span>عدد الاستفادات</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-2 py-1 rounded-lg shadow-sm">
                    <Gift className="w-3 h-3" />
                    <span className="text-xs font-bold">2</span>
                  </div>
                  <span>مجانية</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="flex items-center gap-1 bg-gradient-to-r from-rose-500 to-red-500 text-white px-2 py-1 rounded-lg shadow-sm">
                    <Percent className="w-3 h-3" />
                    <span className="text-xs font-bold">1</span>
                  </div>
                  <span>خصم</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Benefit Modal - Red Theme */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md border border-rose-100 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-rose-500 via-red-500 to-rose-600 text-white p-6 relative overflow-hidden">
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
                        ? 'border-rose-400 bg-gradient-to-br from-rose-50 to-red-50 shadow-lg shadow-rose-100'
                        : 'border-slate-200 hover:border-rose-200 hover:bg-rose-50/30'
                    }`}
                  >
                    <Percent className={`w-6 h-6 mx-auto mb-2 ${
                      newBenefit.benefit_type === 'discount' ? 'text-rose-500' : 'text-slate-400'
                    }`} />
                    <span className={`text-sm font-bold ${
                      newBenefit.benefit_type === 'discount' ? 'text-rose-700' : 'text-slate-600'
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
                    className="bg-white/80 border-rose-200 rounded-xl h-12 text-center text-lg font-bold focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
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
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white shadow-lg shadow-rose-200/50"
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

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
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Custom styles for react-select
const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: '0.75rem',
    borderColor: state.isFocused ? '#ef4444' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(239, 68, 68, 0.2)' : 'none',
    '&:hover': { borderColor: '#ef4444' },
    minHeight: '42px',
    direction: 'rtl'
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '0.75rem',
    overflow: 'hidden',
    zIndex: 50,
    direction: 'rtl'
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#ef4444' : state.isFocused ? '#fef2f2' : 'white',
    color: state.isSelected ? 'white' : '#374151',
    cursor: 'pointer',
    textAlign: 'right'
  }),
  placeholder: (base) => ({
    ...base,
    color: '#9ca3af',
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
  const [stats, setStats] = useState({ total: 0, free: 0, discount: 0 });
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    family_id: '',
    benefit_type: 'free',
    discount_percentage: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const daysOfWeek = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Check if user is a healthcare provider
    if (!['doctor', 'pharmacist', 'laboratory'].includes(user.role)) {
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
      
      // Determine provider type based on user role
      let type = user.role;
      if (type === 'pharmacist') type = 'pharmacy';
      setProviderType(type);
      
      // Fetch provider data linked to this user
      const providersRes = await axios.get(`${API_URL}/${type === 'pharmacy' ? 'pharmacies' : type + 's'}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Find provider linked to current user (by phone or email)
      const providers = providersRes.data || [];
      const myProvider = providers.find(p => 
        p.mobile === user.phone || 
        p.email === user.email ||
        p.user_id === user.id
      );
      
      if (myProvider) {
        setProviderData(myProvider);
        
        // Fetch stats
        const statsRes = await axios.get(
          `${API_URL}/takaful-benefits/stats/${type}/${myProvider.id}`
        );
        setStats({
          total: statsRes.data.total_benefits || 0,
          free: statsRes.data.free_benefits || 0,
          discount: statsRes.data.discount_benefits || 0
        });
      }
      
      // Fetch families
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
      
      const response = await axios.get(
        `${API_URL}/takaful-benefits/${providerType}/${providerData.id}`,
        { params: { month, year } }
      );
      setBenefits(response.data || []);
    } catch (error) {
      console.error('Error fetching benefits:', error);
    }
  };

  const handleAddBenefit = async (e) => {
    e.preventDefault();
    
    if (!formData.family_id) {
      toast.error('يرجى اختيار الأسرة');
      return;
    }
    if (!selectedDate) {
      toast.error('يرجى اختيار التاريخ');
      return;
    }
    if (formData.benefit_type === 'discount' && !formData.discount_percentage) {
      toast.error('يرجى إدخال نسبة الخصم');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/takaful-benefits`,
        {
          provider_type: providerType,
          provider_id: providerData.id,
          family_id: formData.family_id,
          benefit_date: selectedDate,
          benefit_type: formData.benefit_type,
          discount_percentage: formData.benefit_type === 'discount' 
            ? parseFloat(formData.discount_percentage) 
            : null,
          notes: formData.notes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('تم إضافة الاستفادة بنجاح');
      setShowAddForm(false);
      setFormData({
        family_id: '',
        benefit_type: 'free',
        discount_percentage: '',
        notes: ''
      });
      setSelectedDate(null);
      fetchBenefits();
      fetchData(); // Refresh stats
    } catch (error) {
      console.error('Error adding benefit:', error);
      toast.error(error.response?.data?.detail || 'فشل إضافة الاستفادة');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBenefit = async (benefitId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/takaful-benefits/${benefitId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('تم حذف السجل');
      fetchBenefits();
      fetchData();
    } catch (error) {
      console.error('Error deleting benefit:', error);
      toast.error('فشل حذف السجل');
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getBenefitsForDay = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return benefits.filter(b => b.benefit_date === dateStr);
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

  const getProviderColor = () => {
    switch (providerType) {
      case 'doctor': return 'from-blue-500 to-blue-600';
      case 'pharmacy': return 'from-green-500 to-green-600';
      case 'laboratory': return 'from-purple-500 to-purple-600';
      default: return 'from-red-500 to-red-600';
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

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-28 bg-gray-50 rounded-lg"></div>);
    }

    // Days
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
          className={`h-28 p-2 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
            isSelected
              ? 'border-red-500 bg-red-50 shadow-md'
              : isToday
              ? 'border-blue-500 bg-blue-50'
              : dayBenefits.length > 0
              ? 'border-green-300 bg-green-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className={`text-sm font-bold mb-1 flex items-center justify-between ${
            isToday ? 'text-blue-600' : isSelected ? 'text-red-600' : 'text-gray-700'
          }`}>
            <span>{day}</span>
            {dayBenefits.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {dayBenefits.length}
              </span>
            )}
          </div>
          <div className="space-y-1 overflow-y-auto max-h-16">
            {dayBenefits.map((benefit, idx) => (
              <div
                key={idx}
                className={`text-[10px] px-1.5 py-1 rounded flex items-center justify-between gap-1 ${
                  benefit.benefit_type === 'free'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1">
                  {benefit.benefit_type === 'free' ? (
                    <Gift className="w-3 h-3" />
                  ) : (
                    <Percent className="w-3 h-3" />
                  )}
                  <span className="truncate font-medium">
                    {benefit.family_number}
                    {benefit.benefit_type === 'discount' && ` (${benefit.discount_percentage}%)`}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBenefit(benefit.id);
                  }}
                  className="text-red-500 hover:text-red-700"
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!providerData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-2xl shadow-xl p-12 max-w-lg mx-auto">
            <div className="bg-red-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              {getProviderIcon()}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">لا يوجد ملف مرتبط</h2>
            <p className="text-gray-600 mb-6">
              لم يتم ربط حسابك بملف {getProviderTypeLabel()} بعد. يرجى التواصل مع المسؤول لربط حسابك.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              العودة للرئيسية
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className={`bg-gradient-to-r ${getProviderColor()} text-white py-12`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-2xl">
                {getProviderIcon()}
              </div>
              <div>
                <h1 className="text-3xl font-bold">مرحباً، {providerData.full_name || providerData.name}</h1>
                <p className="text-white/80">{getProviderTypeLabel()} - برنامج التكافل الصحي</p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Users className="w-5 h-5" />
                  <span className="text-2xl font-bold">{stats.total}</span>
                </div>
                <span className="text-sm text-white/80">إجمالي الاستفادات</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Gift className="w-5 h-5" />
                  <span className="text-2xl font-bold">{stats.free}</span>
                </div>
                <span className="text-sm text-white/80">مجانية</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Percent className="w-5 h-5" />
                  <span className="text-2xl font-bold">{stats.discount}</span>
                </div>
                <span className="text-sm text-white/80">خصومات</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Provider Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-4">
              <div className={`bg-gradient-to-r ${getProviderColor()} p-6 text-white`}>
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    {getProviderIcon()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{providerData.full_name || providerData.name}</h3>
                    <p className="text-white/80 text-sm">{getProviderTypeLabel()}</p>
                  </div>
                </div>
                {providerData.participates_in_solidarity && (
                  <div className="mt-4 flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg w-fit">
                    <Heart className="w-4 h-4 fill-white" />
                    <span className="text-sm font-medium">مشارك في التكافل</span>
                  </div>
                )}
              </div>
              
              <div className="p-6 space-y-4">
                {providerData.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{providerData.address}</span>
                  </div>
                )}
                
                {providerData.mobile && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700" dir="ltr">{providerData.mobile}</span>
                  </div>
                )}
                
                {providerData.whatsapp && (
                  <a
                    href={`https://wa.me/${providerData.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-green-600 hover:text-green-700"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span dir="ltr">{providerData.whatsapp}</span>
                  </a>
                )}
                
                <div className="flex items-center gap-3 pt-2 border-t">
                  {providerData.is_active ? (
                    <span className="flex items-center gap-1.5 text-green-600 font-medium text-sm bg-green-50 px-3 py-1.5 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      نشط
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-red-600 font-medium text-sm bg-red-50 px-3 py-1.5 rounded-lg">
                      <XCircle className="w-4 h-4" />
                      غير نشط
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Calendar Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-6 h-6" />
                    <div>
                      <h2 className="text-xl font-bold">رزنامة التكافل</h2>
                      <p className="text-red-100 text-sm">انقر على أي يوم لإضافة استفادة جديدة</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <span className="font-bold px-4">
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <button
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 gap-2 p-4 bg-gray-50 border-b">
                {daysOfWeek.map((day) => (
                  <div key={day} className="text-center text-sm font-bold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="p-4">
                <div className="grid grid-cols-7 gap-2">
                  {renderCalendar()}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 p-4 border-t bg-gray-50">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-4 h-4 bg-green-100 rounded border border-green-300"></div>
                  <Gift className="w-4 h-4 text-green-600" />
                  <span>معاينة مجانية</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-4 h-4 bg-blue-100 rounded border border-blue-300"></div>
                  <Percent className="w-4 h-4 text-blue-600" />
                  <span>خصم</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-4 h-4 bg-blue-50 rounded border-2 border-blue-500"></div>
                  <span>اليوم</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Benefit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Plus className="w-6 h-6" />
                  <div>
                    <h3 className="text-lg font-bold">إضافة استفادة جديدة</h3>
                    <p className="text-red-100 text-sm">
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
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleAddBenefit} className="p-6 space-y-4">
              {/* Family Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الأسرة المستفيدة <span className="text-red-500">*</span>
                </label>
                <Select
                  options={familyOptions}
                  value={familyOptions.find(o => o.value === formData.family_id)}
                  onChange={(option) => setFormData({ ...formData, family_id: option?.value || '' })}
                  placeholder="ابحث واختر الأسرة..."
                  isClearable
                  isSearchable
                  noOptionsMessage={() => 'لا توجد أسر'}
                  styles={selectStyles}
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
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                      formData.benefit_type === 'free'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Gift className="w-5 h-5" />
                    <span className="font-medium">مجاني</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, benefit_type: 'discount' })}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                      formData.benefit_type === 'discount'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Percent className="w-5 h-5" />
                    <span className="font-medium">خصم</span>
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
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3"
                >
                  {saving ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 ml-2" />
                      إضافة الاستفادة
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedDate(null);
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

      <Footer />
    </div>
  );
};

export default HealthcareDashboard;

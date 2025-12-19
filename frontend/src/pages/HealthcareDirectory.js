import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import TakafulCalendarModal from '../components/TakafulCalendarModal';
import {
  Search,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  Stethoscope,
  Building2,
  FlaskConical,
  Heart,
  Filter,
  MessageCircle
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HealthcareDirectory = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('doctors'); // doctors, pharmacies, laboratories
  const [loading, setLoading] = useState(true);
  
  // Takaful Calendar Modal state
  const [showTakafulModal, setShowTakafulModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedProviderType, setSelectedProviderType] = useState(null);
  
  // Takaful stats for each provider
  const [takafulStats, setTakafulStats] = useState({});
  
  // Data
  const [doctors, setDoctors] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [laboratories, setLaboratories] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [showSolidarityOnly, setShowSolidarityOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch takaful stats for solidarity providers
  const fetchTakafulStats = async (providers, providerType) => {
    const solidarityProviders = providers.filter(p => p.participates_in_solidarity);
    const statsPromises = solidarityProviders.map(async (provider) => {
      try {
        const response = await axios.get(`${API_URL}/takaful-benefits/stats/${providerType}/${provider.id}`);
        return { id: provider.id, stats: response.data };
      } catch (error) {
        return { id: provider.id, stats: { total_benefits: 0 } };
      }
    });
    
    const results = await Promise.all(statsPromises);
    const statsMap = {};
    results.forEach(r => {
      statsMap[r.id] = r.stats;
    });
    return statsMap;
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // جلب البيانات الأساسية
      const [specialtiesRes, neighborhoodsRes] = await Promise.all([
        axios.get(`${API_URL}/medical-specialties`),
        axios.get(`${API_URL}/neighborhoods`)
      ]);

      setSpecialties(specialtiesRes.data || []);
      // neighborhoods API returns paginated response
      const neighborhoodsData = neighborhoodsRes.data?.items || neighborhoodsRes.data || [];
      setNeighborhoods(neighborhoodsData);

      // إذا كان المستخدم مسجل دخول، فلترة حسب حيه
      const neighborhoodFilter = user?.neighborhood_id || '';
      setSelectedNeighborhood(neighborhoodFilter);

      // جلب جميع أنواع البيانات للحصول على العداد الصحيح
      const params = neighborhoodFilter ? { neighborhood_id: neighborhoodFilter } : {};
      
      const [doctorsRes, pharmaciesRes, laboratoriesRes] = await Promise.all([
        axios.get(`${API_URL}/doctors`, { params }),
        axios.get(`${API_URL}/pharmacies`, { params }),
        axios.get(`${API_URL}/laboratories`, { params })
      ]);
      
      const doctorsData = doctorsRes.data || [];
      const pharmaciesData = pharmaciesRes.data || [];
      const laboratoriesData = laboratoriesRes.data || [];
      
      setDoctors(doctorsData);
      setPharmacies(pharmaciesData);
      setLaboratories(laboratoriesData);

      // جلب إحصائيات التكافل لمقدمي الخدمات المشاركين
      const [doctorStats, pharmacyStats, labStats] = await Promise.all([
        fetchTakafulStats(doctorsData, 'doctor'),
        fetchTakafulStats(pharmaciesData, 'pharmacy'),
        fetchTakafulStats(laboratoriesData, 'laboratory')
      ]);
      
      setTakafulStats({
        ...doctorStats,
        ...pharmacyStats,
        ...labStats
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async (neighborhoodFilter = selectedNeighborhood) => {
    try {
      const params = {};
      
      // إضافة المعاملات فقط إذا كانت محددة
      if (neighborhoodFilter) {
        params.neighborhood_id = neighborhoodFilter;
      }
      if (showActiveOnly === true) {
        params.is_active = true;
      }
      if (showSolidarityOnly === true) {
        params.participates_in_solidarity = true;
      }
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      if (activeTab === 'doctors') {
        if (selectedSpecialty) {
          params.specialty_id = selectedSpecialty;
        }
        const res = await axios.get(`${API_URL}/doctors`, { params });
        setDoctors(res.data);
      } else if (activeTab === 'pharmacies') {
        const res = await axios.get(`${API_URL}/pharmacies`, { params });
        setPharmacies(res.data);
      } else if (activeTab === 'laboratories') {
        const res = await axios.get(`${API_URL}/laboratories`, { params });
        setLaboratories(res.data);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast.error('فشل تحميل مقدمي الخدمة');
    }
  };

  useEffect(() => {
    // تجنب التحميل المزدوج عند التحميل الأولي
    if (!loading && (specialties.length > 0 || neighborhoods.length > 0)) {
      const timer = setTimeout(() => {
        fetchProviders();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, selectedNeighborhood, selectedSpecialty, showActiveOnly, showSolidarityOnly, searchQuery]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const getSpecialtyName = (specialtyId) => {
    if (!specialties || !Array.isArray(specialties)) return 'غير محدد';
    const specialty = specialties.find(s => s.id === specialtyId);
    return specialty?.name_ar || 'غير محدد';
  };

  const getNeighborhoodName = (neighborhoodId) => {
    if (!neighborhoods || !Array.isArray(neighborhoods)) return 'غير محدد';
    const neighborhood = neighborhoods.find(n => n.id === neighborhoodId);
    return neighborhood?.name || 'غير محدد';
  };

  const formatWorkingHours = (workingHours) => {
    if (!workingHours || Object.keys(workingHours).length === 0) return 'غير محدد';
    
    const days = {
      saturday: 'السبت',
      sunday: 'الأحد',
      monday: 'الاثنين',
      tuesday: 'الثلاثاء',
      wednesday: 'الأربعاء',
      thursday: 'الخميس',
      friday: 'الجمعة'
    };

    const openDays = Object.entries(workingHours)
      .filter(([_, schedule]) => schedule?.is_working)
      .map(([day]) => days[day]);

    if (openDays.length === 0) return 'مغلق';
    if (openDays.length === 7) return 'يومياً';
    
    return openDays.slice(0, 3).join('، ') + 
           (openDays.length > 3 ? ` +${openDays.length - 3}` : '');
  };

  // تحويل الوقت من 24 ساعة إلى 12 ساعة
  const formatTime12 = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'م' : 'ص';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')}${period}`;
  };

  // Detailed working hours component
  const WorkingHoursDetail = ({ workingHours }) => {
    if (!workingHours || Object.keys(workingHours).length === 0) {
      return <span className="text-gray-500 text-xs">غير محدد</span>;
    }
    
    const days = {
      saturday: 'السبت',
      sunday: 'الأحد',
      monday: 'الاثنين',
      tuesday: 'الثلاثاء',
      wednesday: 'الأربعاء',
      thursday: 'الخميس',
      friday: 'الجمعة'
    };

    const workingDays = Object.entries(workingHours).filter(([_, schedule]) => schedule?.is_working);
    
    if (workingDays.length === 0) {
      return <span className="text-red-500 text-xs">مغلق</span>;
    }

    return (
      <div className="space-y-1">
        {workingDays.map(([day, schedule]) => (
          <div key={day} className="flex items-center text-[11px]">
            <span className="font-bold text-gray-700 w-14 flex-shrink-0">{days[day]}</span>
            <div className="flex items-center gap-1 flex-wrap">
              {schedule.morning?.from && schedule.morning?.to && (
                <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-medium">
                  ☀️{formatTime12(schedule.morning.from)}-{formatTime12(schedule.morning.to)}
                </span>
              )}
              {schedule.evening?.from && schedule.evening?.to && (
                <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-medium">
                  🌙{formatTime12(schedule.evening.from)}-{formatTime12(schedule.evening.to)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const openTakafulCalendar = (provider, type) => {
    setSelectedProvider(provider);
    setSelectedProviderType(type);
    setShowTakafulModal(true);
  };

  const DoctorCard = ({ doctor }) => {
    const stats = takafulStats[doctor.id];
    const benefitCount = stats?.total_benefits || 0;
    
    return (
    <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-blue-100 hover:border-blue-300 flex flex-col h-full">
      {/* Solidarity Badge - Clickable with count */}
      {doctor.participates_in_solidarity && (
        <div className="absolute top-2 left-2 z-10">
          <button
            onClick={() => openTakafulCalendar(doctor, 'doctor')}
            className="bg-red-500 text-white pl-3 pr-2 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 hover:bg-red-600 hover:scale-105 transition-all cursor-pointer"
            title="عرض رزنامة التكافل"
          >
            <Heart className="w-3.5 h-3.5 fill-white" />
            <span className="text-xs font-bold">تكافل</span>
            {benefitCount > 0 && (
              <span className="min-w-[20px] h-[20px] bg-white text-red-600 text-[11px] font-bold rounded-full flex items-center justify-center shadow-inner border border-red-300">
                {benefitCount}
              </span>
            )}
          </button>
        </div>
      )}
      
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-50 p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{doctor.full_name}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  {getSpecialtyName(doctor.specialty_id)}
                </span>
                <span className="flex items-center gap-1 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                  <MapPin className="w-3 h-3" />
                  {getNeighborhoodName(doctor.neighborhood_id)}
                </span>
              </div>
            </div>
          </div>
        </div>
        {doctor.specialty_description && (
          <p className="text-gray-700 text-sm leading-relaxed line-clamp-2 mt-2">{doctor.specialty_description}</p>
        )}
      </div>

      {/* Body with info */}
      <div className="p-6 pt-4 space-y-3 flex-1">
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-gray-700 leading-relaxed">{doctor.address}</span>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <Phone className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-semibold text-gray-900">{doctor.mobile}</span>
            {doctor.landline && <span className="text-gray-500 mr-2">• {doctor.landline}</span>}
          </div>
        </div>

        {doctor.whatsapp && (
          <a 
            href={`https://wa.me/${doctor.whatsapp.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-green-700">واتساب: </span>
              <span className="text-green-600" dir="ltr">{doctor.whatsapp}</span>
            </div>
          </a>
        )}

        <div className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-sm font-semibold text-gray-700 block mb-2">أوقات الدوام:</span>
              <WorkingHoursDetail workingHours={doctor.working_hours} />
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          {doctor.is_active ? (
            <span className="flex items-center gap-1.5 text-green-600 font-medium text-sm bg-green-50 px-3 py-1.5 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              متاح حالياً
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-red-600 font-medium text-sm bg-red-50 px-3 py-1.5 rounded-lg">
              <XCircle className="w-4 h-4" />
              غير متاح
            </span>
          )}
        </div>
      </div>

      {/* Bottom accent line - positioned at absolute bottom */}
      <div className="h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 mt-auto"></div>
    </div>
  );
  };

  const PharmacyCard = ({ pharmacy }) => {
    const stats = takafulStats[pharmacy.id];
    const benefitCount = stats?.total_benefits || 0;
    
    return (
    <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-green-100 hover:border-green-300 flex flex-col h-full">
      {/* Solidarity Badge - Clickable with count */}
      {pharmacy.participates_in_solidarity && (
        <div className="absolute top-2 left-2 z-10">
          <button
            onClick={() => openTakafulCalendar(pharmacy, 'pharmacy')}
            className="relative bg-red-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 hover:bg-red-600 hover:scale-105 transition-all cursor-pointer"
            title="عرض رزنامة التكافل"
          >
            <div className="relative">
              <Heart className="w-3.5 h-3.5 fill-white" />
              {benefitCount > 0 && (
                <span className="absolute -bottom-3 -right-2 min-w-[18px] h-[18px] bg-white text-red-600 text-[10px] font-bold rounded-full flex items-center justify-center shadow-md border border-red-200">
                  {benefitCount}
                </span>
              )}
            </div>
            <span className="text-xs font-bold">تكافل</span>
          </button>
        </div>
      )}
      
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{pharmacy.name}</h3>
              <p className="text-sm text-gray-600 mb-2">صاحب الصيدلية: {pharmacy.owner_full_name}</p>
              <span className="flex items-center gap-1 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm inline-flex">
                <MapPin className="w-3 h-3" />
                {getNeighborhoodName(pharmacy.neighborhood_id)}
              </span>
            </div>
          </div>
        </div>
        {pharmacy.description && (
          <p className="text-gray-700 text-sm leading-relaxed line-clamp-2 mt-2">{pharmacy.description}</p>
        )}
      </div>

      {/* Body with info */}
      <div className="p-6 pt-4 space-y-3 flex-1">
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <MapPin className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-gray-700 leading-relaxed">{pharmacy.address}</span>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <Phone className="w-5 h-5 text-green-500 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-semibold text-gray-900">{pharmacy.mobile}</span>
            {pharmacy.landline && <span className="text-gray-500 mr-2">• {pharmacy.landline}</span>}
          </div>
        </div>

        {pharmacy.whatsapp && (
          <a 
            href={`https://wa.me/${pharmacy.whatsapp.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-green-700">واتساب: </span>
              <span className="text-green-600" dir="ltr">{pharmacy.whatsapp}</span>
            </div>
          </a>
        )}

        <div className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-sm font-semibold text-gray-700 block mb-2">أوقات الدوام:</span>
              <WorkingHoursDetail workingHours={pharmacy.working_hours} />
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          {pharmacy.is_active ? (
            <span className="flex items-center gap-1.5 text-green-600 font-medium text-sm bg-green-50 px-3 py-1.5 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              متاح حالياً
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-red-600 font-medium text-sm bg-red-50 px-3 py-1.5 rounded-lg">
              <XCircle className="w-4 h-4" />
              غير متاح
            </span>
          )}
        </div>
      </div>

      {/* Bottom accent line - positioned at absolute bottom */}
      <div className="h-1.5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 mt-auto"></div>
    </div>
  );
  };

  const LaboratoryCard = ({ laboratory }) => {
    const stats = takafulStats[laboratory.id];
    const benefitCount = stats?.total_benefits || 0;
    
    return (
    <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-purple-100 hover:border-purple-300 flex flex-col h-full">
      {/* Solidarity Badge - Clickable with count */}
      {laboratory.participates_in_solidarity && (
        <div className="absolute top-2 left-2 z-10">
          <button
            onClick={() => openTakafulCalendar(laboratory, 'laboratory')}
            className="relative bg-red-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 hover:bg-red-600 hover:scale-105 transition-all cursor-pointer"
            title="عرض رزنامة التكافل"
          >
            <div className="relative">
              <Heart className="w-3.5 h-3.5 fill-white" />
              {benefitCount > 0 && (
                <span className="absolute -bottom-3 -right-2 min-w-[18px] h-[18px] bg-white text-red-600 text-[10px] font-bold rounded-full flex items-center justify-center shadow-md border border-red-200">
                  {benefitCount}
                </span>
              )}
            </div>
            <span className="text-xs font-bold">تكافل</span>
          </button>
        </div>
      )}
      
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
              <FlaskConical className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{laboratory.name}</h3>
              <p className="text-sm text-gray-600 mb-2">صاحب المخبر: {laboratory.owner_full_name}</p>
              <span className="flex items-center gap-1 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm inline-flex">
                <MapPin className="w-3 h-3" />
                {getNeighborhoodName(laboratory.neighborhood_id)}
              </span>
            </div>
          </div>
        </div>
        {laboratory.description && (
          <p className="text-gray-700 text-sm leading-relaxed line-clamp-2 mt-2">{laboratory.description}</p>
        )}
      </div>

      {/* Body with info */}
      <div className="p-6 pt-4 space-y-3 flex-1">
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <MapPin className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-gray-700 leading-relaxed">{laboratory.address}</span>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <Phone className="w-5 h-5 text-purple-500 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-semibold text-gray-900">{laboratory.mobile}</span>
            {laboratory.landline && <span className="text-gray-500 mr-2">• {laboratory.landline}</span>}
          </div>
        </div>

        {laboratory.whatsapp && (
          <a 
            href={`https://wa.me/${laboratory.whatsapp.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-green-700">واتساب: </span>
              <span className="text-green-600" dir="ltr">{laboratory.whatsapp}</span>
            </div>
          </a>
        )}

        <div className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-sm font-semibold text-gray-700 block mb-2">أوقات الدوام:</span>
              <WorkingHoursDetail workingHours={laboratory.working_hours} />
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          {laboratory.is_active ? (
            <span className="flex items-center gap-1.5 text-green-600 font-medium text-sm bg-green-50 px-3 py-1.5 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              متاح حالياً
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-red-600 font-medium text-sm bg-red-50 px-3 py-1.5 rounded-lg">
              <XCircle className="w-4 h-4" />
              غير متاح
            </span>
          )}
        </div>
      </div>

      {/* Bottom accent line - positioned at absolute bottom */}
      <div className="h-1.5 bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500 mt-auto"></div>
    </div>
  );
  };

  const currentData = activeTab === 'doctors' ? doctors : 
                       activeTab === 'pharmacies' ? pharmacies : 
                       laboratories;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-800 via-teal-700 to-cyan-800 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        
        {/* Medical Icons Background */}
        <div className="absolute inset-0 opacity-5">
          <Stethoscope className="absolute top-10 left-10 w-24 h-24" />
          <Building2 className="absolute top-20 right-20 w-20 h-20" />
          <FlaskConical className="absolute bottom-10 left-1/4 w-16 h-16" />
          <Heart className="absolute bottom-20 right-1/3 w-12 h-12" />
        </div>

        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 border border-white/20">
              <Stethoscope className="w-10 h-10 text-white" />
            </div>
            
            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              دليل الرعاية الصحية
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-emerald-100 mb-8 max-w-2xl mx-auto leading-relaxed">
              دليل شامل للأطباء والصيدليات والمخابر المشاركة في برنامج التكافل الصحي في مدينة حماة
            </p>
            
            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-12 mb-8">
              <div className="text-center">
                <div className="relative">
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-xl mb-2 mx-auto border border-blue-400/30">
                    <Stethoscope className="w-8 h-8 text-blue-300" />
                  </div>
                  {/* Solidarity count badge */}
                  <div className="absolute -top-2 -right-2 flex items-center justify-center min-w-[28px] h-7 bg-red-500 rounded-full shadow-lg px-1" title="مشاركون في التكافل">
                    <Heart className="w-3 h-3 text-white fill-white mr-0.5" />
                    <span className="text-white text-xs font-bold">{doctors.filter(d => d.participates_in_solidarity).length}</span>
                  </div>
                </div>
                <div className="text-3xl font-bold">{doctors.length}</div>
                <div className="text-emerald-200 text-sm">طبيب</div>
              </div>
              <div className="text-center">
                <div className="relative">
                  <div className="flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-xl mb-2 mx-auto border border-green-400/30">
                    <Building2 className="w-8 h-8 text-green-300" />
                  </div>
                  {/* Solidarity count badge */}
                  <div className="absolute -top-2 -right-2 flex items-center justify-center min-w-[28px] h-7 bg-red-500 rounded-full shadow-lg px-1" title="مشاركون في التكافل">
                    <Heart className="w-3 h-3 text-white fill-white mr-0.5" />
                    <span className="text-white text-xs font-bold">{pharmacies.filter(p => p.participates_in_solidarity).length}</span>
                  </div>
                </div>
                <div className="text-3xl font-bold">{pharmacies.length}</div>
                <div className="text-emerald-200 text-sm">صيدلية</div>
              </div>
              <div className="text-center">
                <div className="relative">
                  <div className="flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-xl mb-2 mx-auto border border-purple-400/30">
                    <FlaskConical className="w-8 h-8 text-purple-300" />
                  </div>
                  {/* Solidarity count badge */}
                  <div className="absolute -top-2 -right-2 flex items-center justify-center min-w-[28px] h-7 bg-red-500 rounded-full shadow-lg px-1" title="مشاركون في التكافل">
                    <Heart className="w-3 h-3 text-white fill-white mr-0.5" />
                    <span className="text-white text-xs font-bold">{laboratories.filter(l => l.participates_in_solidarity).length}</span>
                  </div>
                </div>
                <div className="text-3xl font-bold">{laboratories.length}</div>
                <div className="text-emerald-200 text-sm">مخبر</div>
              </div>
            </div>

            {/* Solidarity Badge */}
            <div className="inline-flex items-center gap-2 bg-red-600/50 backdrop-blur-sm px-4 py-2 rounded-full border border-red-400/50">
              <Heart className="w-5 h-5 text-white fill-white" />
              <span className="text-white font-medium">مقدمو خدمات صحية مشاركون في برنامج التكافل</span>
            </div>
          </div>
        </div>
        
        {/* Wave Bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f9fafb"/>
          </svg>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Button
            onClick={() => setActiveTab('doctors')}
            className={`flex items-center gap-2 ${
              activeTab === 'doctors'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Stethoscope className="w-5 h-5" />
            الأطباء ({doctors.length})
          </Button>

          <Button
            onClick={() => setActiveTab('pharmacies')}
            className={`flex items-center gap-2 ${
              activeTab === 'pharmacies'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Building2 className="w-5 h-5" />
            الصيدليات ({pharmacies.length})
          </Button>

          <Button
            onClick={() => setActiveTab('laboratories')}
            className={`flex items-center gap-2 ${
              activeTab === 'laboratories'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FlaskConical className="w-5 h-5" />
            المخابر ({laboratories.length})
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="ابحث بالاسم، العنوان، الهاتف، الجوال، الواتس..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pr-10"
                />
              </div>
            </div>

            {/* Toggle Filters Button */}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              {showFilters ? 'إخفاء الفلاتر' : 'إظهار الفلاتر'}
            </Button>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              {/* Neighborhood Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الحي
                </label>
                <select
                  value={selectedNeighborhood}
                  onChange={(e) => setSelectedNeighborhood(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  disabled={!!user?.neighborhood_id}
                >
                  <option value="">جميع الأحياء</option>
                  {neighborhoods.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Specialty Filter (Doctors only) */}
              {activeTab === 'doctors' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الاختصاص
                  </label>
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">جميع الاختصاصات</option>
                    {specialties.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name_ar}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Active Only Checkbox */}
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showActiveOnly}
                    onChange={(e) => setShowActiveOnly(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    النشطة فقط
                  </span>
                </label>
              </div>

              {/* Solidarity Only Checkbox */}
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSolidarityOnly}
                    onChange={(e) => setShowSolidarityOnly(e.target.checked)}
                    className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    المشتركة في التكافل فقط
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري التحميل...</p>
          </div>
        ) : currentData.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-gray-400 mb-4">
              {activeTab === 'doctors' && <Stethoscope className="w-16 h-16 mx-auto" />}
              {activeTab === 'pharmacies' && <Building2 className="w-16 h-16 mx-auto" />}
              {activeTab === 'laboratories' && <FlaskConical className="w-16 h-16 mx-auto" />}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد نتائج</h3>
            <p className="text-gray-600">
              لم يتم العثور على {activeTab === 'doctors' ? 'أطباء' : activeTab === 'pharmacies' ? 'صيدليات' : 'مخابر'} بناءً على الفلاتر المحددة
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {activeTab === 'doctors' && doctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
            {activeTab === 'pharmacies' && pharmacies.map((pharmacy) => (
              <PharmacyCard key={pharmacy.id} pharmacy={pharmacy} />
            ))}
            {activeTab === 'laboratories' && laboratories.map((laboratory) => (
              <LaboratoryCard key={laboratory.id} laboratory={laboratory} />
            ))}
          </div>
        )}
      </div>

      {/* Takaful Calendar Modal */}
      <TakafulCalendarModal
        isOpen={showTakafulModal}
        onClose={() => {
          setShowTakafulModal(false);
          setSelectedProvider(null);
          setSelectedProviderType(null);
        }}
        provider={selectedProvider}
        providerType={selectedProviderType}
      />

      <Footer />
    </div>
  );
};

export default HealthcareDirectory;

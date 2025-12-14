import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
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
  Filter
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HealthcareDirectory = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('doctors'); // doctors, pharmacies, laboratories
  const [loading, setLoading] = useState(true);
  
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
      
      setDoctors(doctorsRes.data || []);
      setPharmacies(pharmaciesRes.data || []);
      setLaboratories(laboratoriesRes.data || []);

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
    if (!workingHours) return 'غير محدد';
    
    const days = {
      saturday: 'السبت',
      sunday: 'الأحد',
      monday: 'الإثنين',
      tuesday: 'الثلاثاء',
      wednesday: 'الأربعاء',
      thursday: 'الخميس',
      friday: 'الجمعة'
    };

    const openDays = Object.entries(workingHours)
      .filter(([_, schedule]) => schedule.is_open)
      .map(([day, schedule]) => ({
        day: days[day],
        time: `${schedule.opening_time || ''} - ${schedule.closing_time || ''}`
      }));

    if (openDays.length === 0) return 'مغلق';
    if (openDays.length === 7) return 'يومياً';
    
    return openDays.slice(0, 2).map(d => `${d.day}`).join(', ') + 
           (openDays.length > 2 ? ` +${openDays.length - 2}` : '');
  };

  const DoctorCard = ({ doctor }) => (
    <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-blue-100 hover:border-blue-300">
      {/* Solidarity Badge - Simple & Beautiful */}
      {doctor.participates_in_solidarity && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-red-600 transition-colors">
            <Heart className="w-4 h-4 fill-white" />
            <span className="text-sm font-bold">تكافل</span>
          </div>
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
      <div className="p-6 pt-4 space-y-3">
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

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <span className="text-sm text-gray-700">{formatWorkingHours(doctor.working_hours)}</span>
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

      {/* Bottom accent line */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500"></div>
    </div>
  );

  const PharmacyCard = ({ pharmacy }) => (
    <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-green-100 hover:border-green-300">
      {/* Solidarity Badge - Simple & Beautiful */}
      {pharmacy.participates_in_solidarity && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-red-600 transition-colors">
            <Heart className="w-4 h-4 fill-white" />
            <span className="text-sm font-bold">تكافل</span>
          </div>
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
      <div className="p-6 pt-4 space-y-3">
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

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <Clock className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-sm text-gray-700">{formatWorkingHours(pharmacy.working_hours)}</span>
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

      {/* Bottom accent line */}
      <div className="h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
    </div>
  );

  const LaboratoryCard = ({ laboratory }) => (
    <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-purple-100 hover:border-purple-300">
      {/* Solidarity Badge - Pointed Tag Style */}
      {laboratory.participates_in_solidarity && (
        <div className="absolute top-3 left-3 z-10">
          <div className="relative">
            {/* Main badge with gradient */}
            <div className="bg-gradient-to-l from-pink-500 via-rose-500 to-red-500 text-white pl-3 pr-4 py-2 rounded-l-full shadow-lg flex items-center gap-2">
              <div className="bg-amber-400 rounded-full p-1">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-bold whitespace-nowrap">تكافل</span>
            </div>
            {/* Pointed triangle on the right */}
            <div className="absolute top-0 right-0 w-0 h-0 border-t-[18px] border-t-transparent border-l-[12px] border-l-red-600 border-b-[18px] border-b-transparent transform translate-x-full"></div>
          </div>
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
      <div className="p-6 pt-4 space-y-3">
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

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <Clock className="w-5 h-5 text-purple-500 flex-shrink-0" />
          <span className="text-sm text-gray-700">{formatWorkingHours(laboratory.working_hours)}</span>
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

      {/* Bottom accent line */}
      <div className="h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500"></div>
    </div>
  );

  const currentData = activeTab === 'doctors' ? doctors : 
                       activeTab === 'pharmacies' ? pharmacies : 
                       laboratories;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            دليل الرعاية الصحية
          </h1>
          <p className="text-gray-600 text-lg">
            دليل شامل للأطباء والصيدليات والمخابر في حماة
          </p>
        </div>

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
                  placeholder="ابحث بالاسم أو العنوان..."
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      <Footer />
    </div>
  );
};

export default HealthcareDirectory;

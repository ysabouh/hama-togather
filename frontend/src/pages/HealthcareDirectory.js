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
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-full">
            <Stethoscope className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{doctor.full_name}</h3>
            <p className="text-sm text-blue-600 font-medium">{getSpecialtyName(doctor.specialty_id)}</p>
            <div className="mt-1 inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
              <MapPin className="w-3 h-3 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">{getNeighborhoodName(doctor.neighborhood_id)}</span>
            </div>
          </div>
        </div>
        {doctor.participates_in_solidarity && (
          <div className="bg-green-100 px-3 py-1 rounded-full flex items-center gap-1">
            <Heart className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">تكافل</span>
          </div>
        )}
      </div>

      {doctor.specialty_description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{doctor.specialty_description}</p>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-700">
          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm">{doctor.address}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-700">
          <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm">{getNeighborhoodName(doctor.neighborhood_id)}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-700">
          <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-medium">{doctor.mobile}</span>
            {doctor.landline && <span className="text-gray-500 mr-2">• {doctor.landline}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm">{formatWorkingHours(doctor.working_hours)}</span>
        </div>

        <div className="flex items-center gap-2 mt-4">
          {doctor.is_active ? (
            <span className="flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              نشط
            </span>
          ) : (
            <span className="flex items-center gap-1 text-red-600 text-sm">
              <XCircle className="w-4 h-4" />
              غير نشط
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const PharmacyCard = ({ pharmacy }) => (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-3 rounded-full">
            <Building2 className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{pharmacy.name}</h3>
            <p className="text-sm text-gray-600">صاحب الصيدلية: {pharmacy.owner_full_name}</p>
          </div>
        </div>
        {pharmacy.participates_in_solidarity && (
          <div className="bg-green-100 px-3 py-1 rounded-full flex items-center gap-1">
            <Heart className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">تكافل</span>
          </div>
        )}
      </div>

      {pharmacy.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{pharmacy.description}</p>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-700">
          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm">{pharmacy.address}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-700">
          <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm">{getNeighborhoodName(pharmacy.neighborhood_id)}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-700">
          <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-medium">{pharmacy.mobile}</span>
            {pharmacy.landline && <span className="text-gray-500 mr-2">• {pharmacy.landline}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm">{formatWorkingHours(pharmacy.working_hours)}</span>
        </div>

        <div className="flex items-center gap-2 mt-4">
          {pharmacy.is_active ? (
            <span className="flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              نشط
            </span>
          ) : (
            <span className="flex items-center gap-1 text-red-600 text-sm">
              <XCircle className="w-4 h-4" />
              غير نشط
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const LaboratoryCard = ({ laboratory }) => (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-3 rounded-full">
            <FlaskConical className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{laboratory.name}</h3>
            <p className="text-sm text-gray-600">صاحب المخبر: {laboratory.owner_full_name}</p>
          </div>
        </div>
        {laboratory.participates_in_solidarity && (
          <div className="bg-green-100 px-3 py-1 rounded-full flex items-center gap-1">
            <Heart className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">تكافل</span>
          </div>
        )}
      </div>

      {laboratory.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{laboratory.description}</p>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-700">
          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm">{laboratory.address}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-700">
          <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm">{getNeighborhoodName(laboratory.neighborhood_id)}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-700">
          <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-medium">{laboratory.mobile}</span>
            {laboratory.landline && <span className="text-gray-500 mr-2">• {laboratory.landline}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm">{formatWorkingHours(laboratory.working_hours)}</span>
        </div>

        <div className="flex items-center gap-2 mt-4">
          {laboratory.is_active ? (
            <span className="flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              نشط
            </span>
          ) : (
            <span className="flex items-center gap-1 text-red-600 text-sm">
              <XCircle className="w-4 h-4" />
              غير نشط
            </span>
          )}
        </div>
      </div>
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

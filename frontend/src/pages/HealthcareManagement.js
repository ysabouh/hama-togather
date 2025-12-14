import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Plus, Search, Edit2, Trash2, Phone, MapPin, Clock, 
  Stethoscope, Package, TestTube, Check, X, AlertCircle,
  ChevronDown, ChevronUp
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HealthcareManagement = () => {
  const { user } = useAuth();
  const [providers, setProviders] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [stats, setStats] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    type: 'doctor',
    full_name: '',
    main_specialty: '',
    specialty_details: '',
    landline_phone: '',
    mobile_phone: '',
    address: '',
    neighborhood_id: '',
    image: '',
    working_hours: [],
    notes: '',
    is_active: true,
    is_partner: false,
    discount_percentage: null,
    discount_count: null,
    free_consultations: null,
    allocated_amount: null
  });

  const daysOfWeek = [
    'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
  ];

  const specialties = {
    doctor: [
      'طب عام', 'طب أطفال', 'جراحة عامة', 'جراحة عظام',
      'أمراض قلبية', 'أمراض جلدية', 'طب نسائية وتوليد',
      'طب عيون', 'طب أسنان', 'طب نفسي', 'طب باطني', 'أخرى'
    ],
    pharmacy: ['صيدلية عامة', 'صيدلية متخصصة'],
    laboratory: ['مخبر عام', 'مخبر متخصص']
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [providersRes, neighborhoodsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/healthcare-providers`, { headers }),
        axios.get(`${API_URL}/neighborhoods`, { headers }),
        axios.get(`${API_URL}/healthcare-stats`, { headers })
      ]);

      setProviders(providersRes.data);
      setNeighborhoods(neighborhoodsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (selectedProvider) {
        await axios.put(
          `${API_URL}/healthcare-providers/${selectedProvider.id}`,
          formData,
          { headers }
        );
      } else {
        await axios.post(
          `${API_URL}/healthcare-providers`,
          formData,
          { headers }
        );
      }

      await fetchData();
      setShowAddDialog(false);
      setShowEditDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error saving provider:', error);
      alert(error.response?.data?.detail || 'حدث خطأ');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/healthcare-providers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchData();
    } catch (error) {
      console.error('Error deleting provider:', error);
      alert(error.response?.data?.detail || 'حدث خطأ');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'doctor',
      full_name: '',
      main_specialty: '',
      specialty_details: '',
      landline_phone: '',
      mobile_phone: '',
      address: '',
      neighborhood_id: user?.neighborhood_id || '',
      image: '',
      working_hours: [],
      notes: '',
      is_active: true,
      is_partner: false,
      discount_percentage: null,
      discount_count: null,
      free_consultations: null,
      allocated_amount: null
    });
    setSelectedProvider(null);
  };

  const openEditDialog = (provider) => {
    setSelectedProvider(provider);
    setFormData({
      type: provider.type,
      full_name: provider.full_name,
      main_specialty: provider.main_specialty,
      specialty_details: provider.specialty_details || '',
      landline_phone: provider.landline_phone || '',
      mobile_phone: provider.mobile_phone,
      address: provider.address,
      neighborhood_id: provider.neighborhood_id,
      image: provider.image || '',
      working_hours: provider.working_hours || [],
      notes: provider.notes || '',
      is_active: provider.is_active,
      is_partner: provider.is_partner,
      discount_percentage: provider.discount_percentage,
      discount_count: provider.discount_count,
      free_consultations: provider.free_consultations,
      allocated_amount: provider.allocated_amount
    });
    setShowEditDialog(true);
  };

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.main_specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || provider.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const getProviderIcon = (type) => {
    switch(type) {
      case 'doctor': return <Stethoscope className="w-5 h-5" />;
      case 'pharmacy': return <Package className="w-5 h-5" />;
      case 'laboratory': return <TestTube className="w-5 h-5" />;
      default: return null;
    }
  };

  const getProviderTypeText = (type) => {
    switch(type) {
      case 'doctor': return 'طبيب';
      case 'pharmacy': return 'صيدلية';
      case 'laboratory': return 'مختبر';
      default: return '';
    }
  };

  const getDefaultImage = (type) => {
    // Default images as base64 or URLs
    const defaults = {
      doctor: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjMTBiOTgxIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSI0MCIgZm9udC1mYW1pbHk9IkFyaWFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+8J+pkDwvdGV4dD48L3N2Zz4=',
      pharmacy: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjMzb4MmY2IiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSI0MCIgZm9udC1mYW1pbHk9IkFyaWFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+8J+SijwvdGV4dD48L3N2Zz4=',
      laboratory: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjZjU5ZTBiIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSI0MCIgZm9udC1mYW1pbHk9IkFyaWFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+8J+nqjwvdGV4dD48L3N2Zz4='
    };
    return defaults[type];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">العناية الصحية</h1>
              <p className="text-gray-600 mt-2">إدارة الأطباء والصيدليات والمخابر</p>
            </div>
            {(user?.role === 'admin' || user?.role === 'committee_president') && (
              <Button 
                onClick={() => {
                  resetForm();
                  setShowAddDialog(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="w-5 h-5 ml-2" />
                إضافة جديد
              </Button>
            )}
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-700">إجمالي الأطباء</p>
                    <p className="text-2xl font-bold text-emerald-900">{stats.total.doctors}</p>
                  </div>
                  <Stethoscope className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700">إجمالي الصيدليات</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.total.pharmacies}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-700">إجمالي المخابر</p>
                    <p className="text-2xl font-bold text-amber-900">{stats.total.laboratories}</p>
                  </div>
                  <TestTube className="w-8 h-8 text-amber-600" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700">المشتركون</p>
                    <p className="text-2xl font-bold text-purple-900">{stats.partners.all}</p>
                  </div>
                  <Check className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search and Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث بالاسم أو الاختصاص..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="all">الكل ({providers.length})</TabsTrigger>
              <TabsTrigger value="doctor">
                الأطباء ({providers.filter(p => p.type === 'doctor').length})
              </TabsTrigger>
              <TabsTrigger value="pharmacy">
                الصيدليات ({providers.filter(p => p.type === 'pharmacy').length})
              </TabsTrigger>
              <TabsTrigger value="laboratory">
                المخابر ({providers.filter(p => p.type === 'laboratory').length})
              </TabsTrigger>
            </TabsList>

            {/* Providers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProviders.map((provider) => (
                <div key={provider.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Card Header with Image */}
                  <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200">
                    <img
                      src={provider.image || getDefaultImage(provider.type)}
                      alt={provider.full_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 flex gap-2">
                      {provider.is_active ? (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">فعال</span>
                      ) : (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">متوقف</span>
                      )}
                      {provider.is_partner && (
                        <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">مشترك</span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{provider.full_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getProviderIcon(provider.type)}
                          <span className="text-sm text-emerald-600 font-medium">
                            {getProviderTypeText(provider.type)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>{provider.main_specialty}</span>
                      </div>
                      
                      {provider.mobile_phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span dir="ltr">{provider.mobile_phone}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{neighborhoods.find(n => n.id === provider.neighborhood_id)?.name || 'غير محدد'}</span>
                      </div>

                      {provider.is_partner && (
                        <div className="bg-purple-50 rounded-lg p-3 mt-3 border border-purple-200">
                          <p className="text-xs font-bold text-purple-700 mb-2">تفاصيل الشراكة:</p>
                          {provider.discount_percentage && (
                            <p className="text-xs text-purple-600">خصم: {provider.discount_percentage}%</p>
                          )}
                          {provider.free_consultations && (
                            <p className="text-xs text-purple-600">معاينات مجانية: {provider.free_consultations}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {(user?.role === 'admin' || user?.role === 'committee_president') && (
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(provider)}
                          className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Edit2 className="w-4 h-4 ml-1" />
                          تعديل
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(provider.id)}
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 ml-1" />
                          حذف
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredProviders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">لا توجد نتائج</p>
              </div>
            )}
          </Tabs>
        </div>
      </div>

      {/* Add/Edit Dialog - سأضيفه في الجزء التالي */}
    </div>
  );
};

export default HealthcareManagement;

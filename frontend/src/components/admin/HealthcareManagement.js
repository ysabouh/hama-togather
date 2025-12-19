import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Stethoscope,
  Building2,
  FlaskConical,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Heart,
  Loader2,
  Tag
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Custom styles for react-select (RTL Arabic)
const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    textAlign: 'right',
    minHeight: '42px',
    borderColor: state.isFocused ? '#10b981' : '#d1d5db',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none',
    '&:hover': {
      borderColor: '#10b981'
    }
  }),
  menu: (base) => ({
    ...base,
    textAlign: 'right',
    zIndex: 9999
  }),
  menuList: (base) => ({
    ...base,
    maxHeight: '200px'
  }),
  placeholder: (base) => ({
    ...base,
    textAlign: 'right',
    color: '#9ca3af'
  }),
  singleValue: (base) => ({
    ...base,
    textAlign: 'right'
  }),
  option: (base, state) => ({
    ...base,
    textAlign: 'right',
    backgroundColor: state.isSelected ? '#10b981' : state.isFocused ? '#d1fae5' : 'white',
    color: state.isSelected ? 'white' : '#374151',
    '&:active': {
      backgroundColor: '#059669'
    }
  }),
  noOptionsMessage: (base) => ({
    ...base,
    textAlign: 'right'
  }),
  input: (base) => ({
    ...base,
    textAlign: 'right'
  })
};

const HealthcareManagement = ({ activeTab = 'doctors' }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data states
  const [doctors, setDoctors] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [laboratories, setLaboratories] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  
  // UI states
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({});
  
  // Specialty dialog
  const [showSpecialtyDialog, setShowSpecialtyDialog] = useState(false);
  const [specialtyFormData, setSpecialtyFormData] = useState({ name_ar: '', name_en: '' });
  const [specialtyMode, setSpecialtyMode] = useState('create');
  const [currentSpecialty, setCurrentSpecialty] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Build params based on user role
      const params = {};
      if (user.role === 'committee_president' && user.neighborhood_id) {
        params.neighborhood_id = user.neighborhood_id;
      }

      const [doctorsRes, pharmaciesRes, laboratoriesRes, specialtiesRes, neighborhoodsRes] = await Promise.all([
        axios.get(`${API_URL}/doctors`, { headers, params }),
        axios.get(`${API_URL}/pharmacies`, { headers, params }),
        axios.get(`${API_URL}/laboratories`, { headers, params }),
        axios.get(`${API_URL}/medical-specialties`, { headers }),
        axios.get(`${API_URL}/neighborhoods`, { headers })
      ]);

      setDoctors(doctorsRes.data || []);
      setPharmacies(pharmaciesRes.data || []);
      setLaboratories(laboratoriesRes.data || []);
      setSpecialties(specialtiesRes.data || []);
      
      const neighborhoodsData = neighborhoodsRes.data?.items || neighborhoodsRes.data || [];
      setNeighborhoods(neighborhoodsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const getNeighborhoodName = (neighborhoodId) => {
    const neighborhood = neighborhoods.find(n => n.id === neighborhoodId);
    return neighborhood?.name || 'غير محدد';
  };

  const getSpecialtyName = (specialtyId) => {
    const specialty = specialties.find(s => s.id === specialtyId);
    return specialty?.name_ar || 'غير محدد';
  };

  // Dialog handlers
  const openCreateDialog = (type) => {
    setDialogMode('create');
    setCurrentItem(null);
    
    const defaultNeighborhood = user.role === 'committee_president' ? user.neighborhood_id : '';
    
    if (type === 'doctor') {
      setFormData({
        full_name: '',
        specialty_id: '',
        specialty_description: '',
        neighborhood_id: defaultNeighborhood,
        address: '',
        mobile: '',
        landline: '',
        whatsapp: '',
        working_hours: {},
        is_active: true,
        participates_in_solidarity: false
      });
    } else {
      setFormData({
        name: '',
        owner_full_name: '',
        description: '',
        neighborhood_id: defaultNeighborhood,
        address: '',
        mobile: '',
        landline: '',
        whatsapp: '',
        working_hours: {},
        is_active: true,
        participates_in_solidarity: false
      });
    }
    setShowDialog(true);
  };

  const openEditDialog = (item) => {
    setDialogMode('edit');
    setCurrentItem(item);
    setFormData({ ...item });
    setShowDialog(true);
  };

  // Validate form before saving
  const validateForm = () => {
    const errors = [];
    
    if (currentTab === 'doctors') {
      // التحقق من حقول الطبيب
      if (!formData.full_name?.trim()) errors.push('اسم الطبيب');
      if (!formData.specialty_id) errors.push('التخصص');
      if (!formData.specialty_description?.trim()) errors.push('وصف التخصص');
      if (!formData.neighborhood_id) errors.push('الحي');
      if (!formData.address?.trim()) errors.push('العنوان');
      if (!formData.mobile?.trim()) errors.push('رقم الموبايل');
      if (!formData.landline?.trim()) errors.push('رقم الهاتف الأرضي');
    } else {
      // التحقق من حقول الصيدلية والمختبر
      if (!formData.name?.trim()) errors.push('الاسم');
      if (!formData.owner_full_name?.trim()) errors.push('اسم المالك');
      if (!formData.description?.trim()) errors.push('الوصف');
      if (!formData.neighborhood_id) errors.push('الحي');
      if (!formData.address?.trim()) errors.push('العنوان');
      if (!formData.mobile?.trim()) errors.push('رقم الموبايل');
      if (!formData.landline?.trim()) errors.push('رقم الهاتف الأرضي');
    }
    
    return errors;
  };

  const handleSave = async () => {
    // التحقق من الحقول المطلوبة
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast.error(`يرجى ملء الحقول التالية: ${validationErrors.join('، ')}`);
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      let endpoint = '';
      if (currentTab === 'doctors') endpoint = '/doctors';
      else if (currentTab === 'pharmacies') endpoint = '/pharmacies';
      else if (currentTab === 'laboratories') endpoint = '/laboratories';

      if (dialogMode === 'create') {
        await axios.post(`${API_URL}${endpoint}`, formData, { headers });
        toast.success('تمت الإضافة بنجاح');
      } else {
        await axios.put(`${API_URL}${endpoint}/${currentItem.id}`, formData, { headers });
        toast.success('تم التحديث بنجاح');
      }

      setShowDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(error.response?.data?.detail || 'فشل في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;
    
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      let endpoint = '';
      if (currentTab === 'doctors') endpoint = '/doctors';
      else if (currentTab === 'pharmacies') endpoint = '/pharmacies';
      else if (currentTab === 'laboratories') endpoint = '/laboratories';

      await axios.delete(`${API_URL}${endpoint}/${id}`, { headers });
      toast.success('تم الحذف بنجاح');
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(error.response?.data?.detail || 'فشل في الحذف');
    }
  };

  const toggleStatus = async (item) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      let endpoint = '';
      if (currentTab === 'doctors') endpoint = '/doctors';
      else if (currentTab === 'pharmacies') endpoint = '/pharmacies';
      else if (currentTab === 'laboratories') endpoint = '/laboratories';

      await axios.put(`${API_URL}${endpoint}/${item.id}`, {
        ...item,
        is_active: !item.is_active
      }, { headers });
      
      toast.success(item.is_active ? 'تم إيقاف التفعيل' : 'تم التفعيل');
      fetchData();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('فشل في تغيير الحالة');
    }
  };

  // Specialty handlers
  const openSpecialtyCreate = () => {
    setSpecialtyMode('create');
    setCurrentSpecialty(null);
    setSpecialtyFormData({ name_ar: '', name_en: '' });
    setShowSpecialtyDialog(true);
  };

  const openSpecialtyEdit = (specialty) => {
    setSpecialtyMode('edit');
    setCurrentSpecialty(specialty);
    setSpecialtyFormData({ name_ar: specialty.name_ar, name_en: specialty.name_en || '' });
    setShowSpecialtyDialog(true);
  };

  const handleSpecialtySave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (specialtyMode === 'create') {
        await axios.post(`${API_URL}/medical-specialties`, specialtyFormData, { headers });
        toast.success('تمت إضافة التخصص بنجاح');
      } else {
        await axios.put(`${API_URL}/medical-specialties/${currentSpecialty.id}`, specialtyFormData, { headers });
        toast.success('تم تحديث التخصص بنجاح');
      }

      setShowSpecialtyDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error saving specialty:', error);
      toast.error(error.response?.data?.detail || 'فشل في حفظ التخصص');
    } finally {
      setSaving(false);
    }
  };

  const handleSpecialtyDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التخصص؟')) return;
    
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.delete(`${API_URL}/medical-specialties/${id}`, { headers });
      toast.success('تم حذف التخصص بنجاح');
      fetchData();
    } catch (error) {
      console.error('Error deleting specialty:', error);
      toast.error(error.response?.data?.detail || 'فشل في حذف التخصص');
    }
  };

  // Filter data based on search - enhanced to search in all fields
  const filterData = (data) => {
    if (!searchQuery) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(item => {
      // الاسم
      const name = (item.full_name || item.name || '').toLowerCase();
      // العنوان
      const address = (item.address || '').toLowerCase();
      // المالك (للصيدليات والمختبرات)
      const owner = (item.owner_full_name || '').toLowerCase();
      // رقم الموبايل
      const mobile = (item.mobile || '').toLowerCase();
      // رقم الهاتف الأرضي
      const landline = (item.landline || '').toLowerCase();
      // واتساب
      const whatsapp = (item.whatsapp || '').toLowerCase();
      // اسم الحي
      const neighborhoodName = getNeighborhoodName(item.neighborhood_id).toLowerCase();
      // اسم التخصص (للأطباء)
      const specialtyName = item.specialty_id ? getSpecialtyName(item.specialty_id).toLowerCase() : '';
      // وصف التخصص
      const specialtyDesc = (item.specialty_description || '').toLowerCase();
      
      return name.includes(query) || 
             address.includes(query) ||
             owner.includes(query) ||
             mobile.includes(query) ||
             landline.includes(query) ||
             whatsapp.includes(query) ||
             neighborhoodName.includes(query) ||
             specialtyName.includes(query) ||
             specialtyDesc.includes(query);
    });
  };

  const tabs = [
    { id: 'doctors', label: 'الأطباء', icon: Stethoscope, color: 'blue' },
    { id: 'pharmacies', label: 'الصيدليات', icon: Building2, color: 'green' },
    { id: 'laboratories', label: 'المختبرات', icon: FlaskConical, color: 'purple' },
    { id: 'specialties', label: 'التخصصات', icon: Tag, color: 'orange' }
  ];

  const getCurrentData = () => {
    switch (currentTab) {
      case 'doctors': return filterData(doctors);
      case 'pharmacies': return filterData(pharmacies);
      case 'laboratories': return filterData(laboratories);
      default: return [];
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="mr-2 text-gray-600">جاري التحميل...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              variant={currentTab === tab.id ? 'default' : 'outline'}
              className={currentTab === tab.id ? `bg-${tab.color}-600 hover:bg-${tab.color}-700` : ''}
            >
              <Icon className="w-4 h-4 ml-2" />
              {tab.label}
              <span className="mr-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {tab.id === 'doctors' ? doctors.length :
                 tab.id === 'pharmacies' ? pharmacies.length :
                 tab.id === 'laboratories' ? laboratories.length :
                 specialties.length}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Specialties Tab */}
      {currentTab === 'specialties' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">التخصصات الطبية</h3>
            <Button onClick={openSpecialtyCreate} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 ml-2" />
              إضافة تخصص
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الاسم بالعربية</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الاسم بالإنجليزية</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {specialties.map(specialty => (
                  <tr key={specialty.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{specialty.name_ar}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{specialty.name_en || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openSpecialtyEdit(specialty)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSpecialtyDelete(specialty.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Doctors/Pharmacies/Laboratories Content */}
      {currentTab !== 'specialties' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          {/* Header with search and add button */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder={currentTab === 'doctors' 
                  ? "ابحث بالاسم، الحي، التخصص، الهاتف، الجوال، الواتس..." 
                  : "ابحث بالاسم، الحي، المالك، الهاتف، الجوال، الواتس..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Button 
              onClick={() => openCreateDialog(currentTab === 'doctors' ? 'doctor' : 'other')}
              className={`${
                currentTab === 'doctors' ? 'bg-blue-600 hover:bg-blue-700' :
                currentTab === 'pharmacies' ? 'bg-green-600 hover:bg-green-700' :
                'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة {currentTab === 'doctors' ? 'طبيب' : currentTab === 'pharmacies' ? 'صيدلية' : 'مختبر'}
            </Button>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                    {currentTab === 'doctors' ? 'اسم الطبيب' : 'الاسم'}
                  </th>
                  {currentTab === 'doctors' && (
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">التخصص</th>
                  )}
                  {currentTab !== 'doctors' && (
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">المالك</th>
                  )}
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الحي</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الهاتف</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">الحالة</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">تكافل</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {getCurrentData().length === 0 ? (
                  <tr>
                    <td colSpan={currentTab === 'doctors' ? 8 : 7} className="px-4 py-8 text-center text-gray-500">
                      لا توجد بيانات {searchQuery ? 'مطابقة للبحث' : ''}
                    </td>
                  </tr>
                ) : (
                  getCurrentData().map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {item.full_name || item.name}
                      </td>
                      {currentTab === 'doctors' && (
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {getSpecialtyName(item.specialty_id)}
                        </td>
                      )}
                      {currentTab !== 'doctors' && (
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.owner_full_name || '-'}
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {getNeighborhoodName(item.neighborhood_id)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600" dir="ltr">
                        {item.mobile || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {item.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {item.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.participates_in_solidarity ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <Heart className="w-3 h-3 fill-current" />
                            مشترك
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(item)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStatus(item)}
                            className={item.is_active ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                          >
                            {item.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'إضافة' : 'تعديل'}{' '}
              {currentTab === 'doctors' ? 'طبيب' : currentTab === 'pharmacies' ? 'صيدلية' : 'مختبر'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Name */}
            <div className="md:col-span-2">
              <Label>{currentTab === 'doctors' ? 'اسم الطبيب' : 'الاسم'} *</Label>
              <Input
                value={currentTab === 'doctors' ? (formData.full_name || '') : (formData.name || '')}
                onChange={(e) => setFormData({
                  ...formData,
                  [currentTab === 'doctors' ? 'full_name' : 'name']: e.target.value
                })}
                placeholder={currentTab === 'doctors' ? 'د. أحمد محمد' : 'اسم المنشأة'}
              />
            </div>

            {/* Owner (for pharmacies and labs) */}
            {currentTab !== 'doctors' && (
              <div className="md:col-span-2">
                <Label>اسم المالك *</Label>
                <Input
                  value={formData.owner_full_name || ''}
                  onChange={(e) => setFormData({ ...formData, owner_full_name: e.target.value })}
                  placeholder="اسم صاحب المنشأة"
                />
              </div>
            )}

            {/* Specialty (for doctors) */}
            {currentTab === 'doctors' && (
              <>
                <div>
                  <Label>التخصص *</Label>
                  <Select
                    options={specialties.map(s => ({ value: s.id, label: s.name_ar }))}
                    value={formData.specialty_id ? { value: formData.specialty_id, label: getSpecialtyName(formData.specialty_id) } : null}
                    onChange={(option) => setFormData({ ...formData, specialty_id: option?.value || '' })}
                    placeholder="ابحث واختر التخصص..."
                    isClearable
                    isSearchable
                    noOptionsMessage={() => 'لا توجد نتائج'}
                    styles={customSelectStyles}
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>
                <div>
                  <Label>وصف التخصص *</Label>
                  <Input
                    value={formData.specialty_description || ''}
                    onChange={(e) => setFormData({ ...formData, specialty_description: e.target.value })}
                    placeholder="أخصائي طب عام - 15 سنة خبرة"
                  />
                </div>
              </>
            )}

            {/* Description (for pharmacies and labs) */}
            {currentTab !== 'doctors' && (
              <div className="md:col-span-2">
                <Label>الوصف *</Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف مختصر..."
                  rows={2}
                />
              </div>
            )}

            {/* Neighborhood */}
            <div>
              <Label>الحي *</Label>
              <Select
                options={neighborhoods.map(n => ({ value: n.id, label: n.name }))}
                value={formData.neighborhood_id ? { value: formData.neighborhood_id, label: getNeighborhoodName(formData.neighborhood_id) } : null}
                onChange={(option) => setFormData({ ...formData, neighborhood_id: option?.value || '' })}
                placeholder="ابحث واختر الحي..."
                isClearable
                isSearchable
                isDisabled={user.role === 'committee_president'}
                noOptionsMessage={() => 'لا توجد نتائج'}
                styles={customSelectStyles}
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>

            {/* Address */}
            <div>
              <Label>العنوان *</Label>
              <Input
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="شارع الثورة - مقابل المشفى"
              />
            </div>

            {/* Mobile */}
            <div>
              <Label>رقم الموبايل *</Label>
              <Input
                value={formData.mobile || ''}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="0933111222"
                dir="ltr"
              />
            </div>

            {/* Landline */}
            <div>
              <Label>رقم الهاتف الأرضي *</Label>
              <Input
                value={formData.landline || ''}
                onChange={(e) => setFormData({ ...formData, landline: e.target.value })}
                placeholder="033-123456"
                dir="ltr"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <Label>واتساب (اختياري)</Label>
              <Input
                value={formData.whatsapp || ''}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="0933111222"
                dir="ltr"
              />
            </div>

            {/* Status checkboxes */}
            <div className="md:col-span-2 flex flex-wrap gap-6 pt-4 border-t">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active || false}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">نشط ومتاح</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.participates_in_solidarity || false}
                  onChange={(e) => setFormData({ ...formData, participates_in_solidarity: e.target.checked })}
                  className="w-5 h-5 text-red-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  مشترك في التكافل
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              {dialogMode === 'create' ? 'إضافة' : 'حفظ التعديلات'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Specialty Dialog */}
      <Dialog open={showSpecialtyDialog} onOpenChange={setShowSpecialtyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {specialtyMode === 'create' ? 'إضافة تخصص جديد' : 'تعديل التخصص'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>الاسم بالعربية *</Label>
              <Input
                value={specialtyFormData.name_ar}
                onChange={(e) => setSpecialtyFormData({ ...specialtyFormData, name_ar: e.target.value })}
                placeholder="طب عام"
              />
            </div>
            <div>
              <Label>الاسم بالإنجليزية</Label>
              <Input
                value={specialtyFormData.name_en}
                onChange={(e) => setSpecialtyFormData({ ...specialtyFormData, name_en: e.target.value })}
                placeholder="General Medicine"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowSpecialtyDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSpecialtySave} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              {specialtyMode === 'create' ? 'إضافة' : 'حفظ'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HealthcareManagement;

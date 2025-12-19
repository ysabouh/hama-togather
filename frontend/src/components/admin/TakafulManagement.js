import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import Select from 'react-select';
import {
  Heart,
  Plus,
  Trash2,
  Calendar,
  Gift,
  Percent,
  Users,
  Search,
  Stethoscope,
  Building2,
  FlaskConical,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TakafulManagement = ({ userRole, userNeighborhoodId }) => {
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Data for dropdowns
  const [doctors, setDoctors] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [laboratories, setLaboratories] = useState([]);
  const [families, setFamilies] = useState([]);
  
  // Form data
  const [formData, setFormData] = useState({
    provider_type: 'doctor',
    provider_id: '',
    family_id: '',
    benefit_date: new Date().toISOString().split('T')[0],
    benefit_type: 'free',
    discount_percentage: '',
    notes: ''
  });
  
  // Filters
  const [filterProviderType, setFilterProviderType] = useState('all');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchBenefits();
  }, [filterProviderType, filterMonth, filterYear]);

  const fetchData = async () => {
    try {
      const [doctorsRes, pharmaciesRes, laboratoriesRes, familiesRes] = await Promise.all([
        axios.get(`${API_URL}/doctors`),
        axios.get(`${API_URL}/pharmacies`),
        axios.get(`${API_URL}/laboratories`),
        axios.get(`${API_URL}/families`)
      ]);
      
      // Filter providers that participate in solidarity
      setDoctors((doctorsRes.data || []).filter(d => d.participates_in_solidarity));
      setPharmacies((pharmaciesRes.data || []).filter(p => p.participates_in_solidarity));
      setLaboratories((laboratoriesRes.data || []).filter(l => l.participates_in_solidarity));
      setFamilies(familiesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('فشل تحميل البيانات');
    }
  };

  const fetchBenefits = async () => {
    setLoading(true);
    try {
      // Get all benefits for all provider types
      const providerTypes = filterProviderType === 'all' 
        ? ['doctor', 'pharmacy', 'laboratory'] 
        : [filterProviderType];
      
      let allBenefits = [];
      
      for (const type of providerTypes) {
        const providers = type === 'doctor' ? doctors : type === 'pharmacy' ? pharmacies : laboratories;
        for (const provider of providers) {
          try {
            const response = await axios.get(
              `${API_URL}/takaful-benefits/${type}/${provider.id}`,
              { params: { month: filterMonth, year: filterYear } }
            );
            const benefitsWithProvider = (response.data || []).map(b => ({
              ...b,
              provider_name: provider.full_name || provider.name
            }));
            allBenefits = [...allBenefits, ...benefitsWithProvider];
          } catch (error) {
            console.error(`Error fetching benefits for ${type} ${provider.id}:`, error);
          }
        }
      }
      
      // Sort by date descending
      allBenefits.sort((a, b) => new Date(b.benefit_date) - new Date(a.benefit_date));
      setBenefits(allBenefits);
    } catch (error) {
      console.error('Error fetching benefits:', error);
      toast.error('فشل تحميل سجلات الاستفادة');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.provider_id) {
      toast.error('يرجى اختيار مقدم الخدمة');
      return;
    }
    if (!formData.family_id) {
      toast.error('يرجى اختيار الأسرة');
      return;
    }
    if (formData.benefit_type === 'discount' && !formData.discount_percentage) {
      toast.error('يرجى إدخال نسبة الخصم');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/takaful-benefits`,
        {
          ...formData,
          discount_percentage: formData.benefit_type === 'discount' 
            ? parseFloat(formData.discount_percentage) 
            : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('تم إضافة سجل الاستفادة بنجاح');
      setShowAddModal(false);
      resetForm();
      fetchBenefits();
    } catch (error) {
      console.error('Error adding benefit:', error);
      toast.error(error.response?.data?.detail || 'فشل إضافة سجل الاستفادة');
    }
  };

  const handleDelete = async (benefitId) => {
    if (!window.confirm('هل أنت متأكد من حذف سجل الاستفادة؟')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/takaful-benefits/${benefitId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('تم حذف سجل الاستفادة');
      fetchBenefits();
    } catch (error) {
      console.error('Error deleting benefit:', error);
      toast.error('فشل حذف سجل الاستفادة');
    }
  };

  const resetForm = () => {
    setFormData({
      provider_type: 'doctor',
      provider_id: '',
      family_id: '',
      benefit_date: new Date().toISOString().split('T')[0],
      benefit_type: 'free',
      discount_percentage: '',
      notes: ''
    });
  };

  const getProviderOptions = () => {
    const providers = formData.provider_type === 'doctor' 
      ? doctors 
      : formData.provider_type === 'pharmacy' 
        ? pharmacies 
        : laboratories;
    
    return providers.map(p => ({
      value: p.id,
      label: p.full_name || p.name
    }));
  };

  const getFamilyOptions = () => {
    return families.map(f => ({
      value: f.id,
      label: `${f.family_number || f.family_code || f.id} - ${f.name}`
    }));
  };

  const getProviderTypeIcon = (type) => {
    switch (type) {
      case 'doctor': return <Stethoscope className="w-4 h-4" />;
      case 'pharmacy': return <Building2 className="w-4 h-4" />;
      case 'laboratory': return <FlaskConical className="w-4 h-4" />;
      default: return null;
    }
  };

  const getProviderTypeLabel = (type) => {
    switch (type) {
      case 'doctor': return 'طبيب';
      case 'pharmacy': return 'صيدلية';
      case 'laboratory': return 'مخبر';
      default: return type;
    }
  };

  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 p-3 rounded-xl">
            <Heart className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">إدارة سجلات التكافل</h2>
            <p className="text-sm text-gray-500">تسجيل استفادات الأسر من برنامج التكافل الصحي</p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          إضافة استفادة جديدة
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">نوع مقدم الخدمة:</label>
            <select
              value={filterProviderType}
              onChange={(e) => setFilterProviderType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
            >
              <option value="all">الكل</option>
              <option value="doctor">أطباء</option>
              <option value="pharmacy">صيدليات</option>
              <option value="laboratory">مخابر</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">الشهر:</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
            >
              {monthNames.map((month, idx) => (
                <option key={idx} value={idx + 1}>{month}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">السنة:</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <Button
            variant="outline"
            onClick={fetchBenefits}
            className="flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            بحث
          </Button>
        </div>
      </div>

      {/* Benefits List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">التاريخ</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">مقدم الخدمة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">النوع</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">رقم الأسرة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">نوع الاستفادة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الملاحظات</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">جاري التحميل...</p>
                  </td>
                </tr>
              ) : benefits.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>لا توجد سجلات استفادة في هذه الفترة</p>
                  </td>
                </tr>
              ) : (
                benefits.map((benefit) => (
                  <tr key={benefit.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(benefit.benefit_date).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {benefit.provider_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        {getProviderTypeIcon(benefit.provider_type)}
                        {getProviderTypeLabel(benefit.provider_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                        {benefit.family_number}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {benefit.benefit_type === 'free' ? (
                        <span className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          <Gift className="w-3 h-3" />
                          مجاني
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          <Percent className="w-3 h-3" />
                          خصم {benefit.discount_percentage}%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {benefit.notes || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(benefit.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-5 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 fill-white" />
                <h3 className="text-lg font-bold">إضافة سجل استفادة جديد</h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Provider Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع مقدم الخدمة <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'doctor', label: 'طبيب', icon: Stethoscope },
                    { value: 'pharmacy', label: 'صيدلية', icon: Building2 },
                    { value: 'laboratory', label: 'مخبر', icon: FlaskConical }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData({ ...formData, provider_type: value, provider_id: '' })}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                        formData.provider_type === value
                          ? 'bg-red-50 border-red-500 text-red-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  مقدم الخدمة <span className="text-red-500">*</span>
                </label>
                <Select
                  options={getProviderOptions()}
                  value={getProviderOptions().find(o => o.value === formData.provider_id)}
                  onChange={(option) => setFormData({ ...formData, provider_id: option?.value || '' })}
                  placeholder="اختر مقدم الخدمة..."
                  isClearable
                  isSearchable
                  noOptionsMessage={() => 'لا يوجد مقدمي خدمات مشاركين في التكافل'}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>

              {/* Family Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الأسرة المستفيدة <span className="text-red-500">*</span>
                </label>
                <Select
                  options={getFamilyOptions()}
                  value={getFamilyOptions().find(o => o.value === formData.family_id)}
                  onChange={(option) => setFormData({ ...formData, family_id: option?.value || '' })}
                  placeholder="ابحث واختر الأسرة..."
                  isClearable
                  isSearchable
                  noOptionsMessage={() => 'لا توجد أسر'}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>

              {/* Benefit Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ الاستفادة <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.benefit_date}
                  onChange={(e) => setFormData({ ...formData, benefit_date: e.target.value })}
                  required
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
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      formData.benefit_type === 'free'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Gift className="w-4 h-4" />
                    مجاني
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, benefit_type: 'discount' })}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      formData.benefit_type === 'discount'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Percent className="w-4 h-4" />
                    خصم
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
                    required
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة السجل
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
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
    </div>
  );
};

export default TakafulManagement;

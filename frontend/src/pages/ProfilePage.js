import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Save, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';
import Select from 'react-select';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

// تنسيق react-select بالعربية
const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    textAlign: 'right',
    borderColor: state.isFocused ? '#059669' : '#d1d5db',
    boxShadow: state.isFocused ? '0 0 0 1px #059669' : 'none',
    '&:hover': {
      borderColor: '#059669'
    }
  }),
  menu: (provided) => ({
    ...provided,
    textAlign: 'right',
    zIndex: 9999
  }),
  option: (provided, state) => ({
    ...provided,
    textAlign: 'right',
    backgroundColor: state.isSelected ? '#059669' : state.isFocused ? '#d1fae5' : 'white',
    color: state.isSelected ? 'white' : '#111827',
    cursor: 'pointer'
  }),
  placeholder: (provided) => ({
    ...provided,
    textAlign: 'right',
    color: '#9ca3af'
  }),
  singleValue: (provided) => ({
    ...provided,
    textAlign: 'right'
  })
};

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    neighborhood_id: '',
    phone: ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // تعبئة البيانات الحالية
    setFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      neighborhood_id: user.neighborhood_id || '',
      phone: user.phone || ''
    });

    fetchNeighborhoods();
  }, [user, navigate]);

  const fetchNeighborhoods = async () => {
    try {
      const response = await axios.get(`${API_URL}/neighborhoods?page=1&limit=1000`);
      const activeNeighborhoods = response.data.items ? 
        response.data.items.filter(n => n.is_active !== false) : 
        response.data.filter(n => n.is_active !== false);
      setNeighborhoods(activeNeighborhoods);

      // تعيين الحي الحالي
      if (user.neighborhood_id) {
        const currentNeighborhood = activeNeighborhoods.find(n => n.id === user.neighborhood_id);
        if (currentNeighborhood) {
          setSelectedNeighborhood({
            value: currentNeighborhood.id,
            label: `${currentNeighborhood.name} - حي رقم ${currentNeighborhood.number}`
          });
        }
      }
    } catch (error) {
      console.error('Error fetching neighborhoods:', error);
      toast.error('فشل تحميل قائمة الأحياء');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/users/me`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // تحديث معلومات المستخدم في الـ context
      updateUser(response.data);
      toast.success('تم تحديث معلوماتك بنجاح');
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.detail || 'فشل تحديث المعلومات');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('كلمات المرور الجديدة غير متطابقة');
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/users/change-password`,
        {
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      toast.success('تم تغيير كلمة المرور بنجاح');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setShowPasswordSection(false);
    } catch (error) {
      console.error('Password change error:', error);
      toast.error(error.response?.data?.detail || 'فشل تغيير كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowRight className="w-5 h-5 ml-2" />
              رجوع
            </Button>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-emerald-100 rounded-full p-4">
                <User className="w-8 h-8 text-emerald-700" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">الملف الشخصي</h1>
                <p className="text-gray-600">تعديل معلوماتك الشخصية</p>
              </div>
            </div>
          </div>

          {/* معلومات الحساب */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">معلومات الحساب</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="full_name">الاسم الكامل</Label>
                <Input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="text-right"
                />
              </div>

              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="text-right"
                />
              </div>

              <div>
                <Label htmlFor="phone">رقم الجوال</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="text-right"
                  placeholder="0912345678"
                  dir="ltr"
                />
              </div>

              <div>
                <Label htmlFor="neighborhood">
                  الحي <span className="text-red-600">*</span>
                </Label>
                <Select
                  id="neighborhood"
                  value={selectedNeighborhood}
                  onChange={(option) => {
                    setSelectedNeighborhood(option);
                    setFormData({ ...formData, neighborhood_id: option ? option.value : '' });
                  }}
                  options={neighborhoods.map(n => ({
                    value: n.id,
                    label: `${n.name} - حي رقم ${n.number}`
                  }))}
                  placeholder="ابحث واختر الحي..."
                  isClearable
                  isSearchable
                  styles={customSelectStyles}
                  noOptionsMessage={() => 'لا توجد نتائج'}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-800"
                disabled={loading}
              >
                <Save className="w-5 h-5 ml-2" />
                {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </form>
          </div>

          {/* تغيير كلمة المرور */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">تغيير كلمة المرور</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
              >
                <Lock className="w-4 h-4 ml-2" />
                {showPasswordSection ? 'إلغاء' : 'تغيير'}
              </Button>
            </div>

            {showPasswordSection && (
              <form onSubmit={handlePasswordChange} className="space-y-5">
                <div>
                  <Label htmlFor="current_password">كلمة المرور الحالية</Label>
                  <div className="relative">
                    <Input
                      id="current_password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      required
                      className="text-right pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="new_password">كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      required
                      className="text-right pl-10"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      tabIndex={-1}
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirm_password">تأكيد كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      required
                      className="text-right pl-10"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-700 hover:bg-emerald-800"
                  disabled={loading}
                >
                  <Lock className="w-5 h-5 ml-2" />
                  {loading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProfilePage;

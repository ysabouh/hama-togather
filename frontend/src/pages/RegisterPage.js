import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import axios from 'axios';
import Select from 'react-select';

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

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    neighborhood_id: '',
    phone: '',
    role: 'user'  // دائماً مستخدم عادي عند التسجيل
  });
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNeighborhoods();
  }, []);

  const fetchNeighborhoods = async () => {
    try {
      // جلب جميع الأحياء بدون pagination
      const response = await axios.get(`${API_URL}/neighborhoods?page=1&limit=1000`);
      const activeNeighborhoods = response.data.items ? 
        response.data.items.filter(n => n.is_active !== false) : 
        response.data.filter(n => n.is_active !== false);
      setNeighborhoods(activeNeighborhoods);
    } catch (error) {
      console.error('Error fetching neighborhoods:', error);
      toast.error('فشل تحميل قائمة الأحياء');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.neighborhood_id) {
      toast.error('يرجى اختيار الحي');
      return;
    }

    if (!formData.phone || formData.phone.trim() === '') {
      toast.error('يرجى إدخال رقم الجوال');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    setLoading(true);

    try {
      await register({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        role: formData.role,  // استخدام الدور من formData
        neighborhood_id: formData.neighborhood_id,
        phone: formData.phone  // إضافة رقم الجوال
      });
      toast.success('تم إنشاء الحساب بنجاح');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100" data-testid="register-page">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-block bg-emerald-100 rounded-full p-4 mb-4">
              <UserPlus className="w-8 h-8 text-emerald-700" />
            </div>
            <h1 className="text-3xl font-bold text-emerald-900 mb-2">إنشاء حساب جديد</h1>
            <p className="text-gray-600">انضم إلينا وساهم في بناء مجتمع متكافل</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="full_name" className="text-right block mb-2">الاسم الكامل</Label>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="أحمد محمد"
                required
                className="text-right"
                data-testid="fullname-input"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-right block mb-2">
                رقم الجوال <span className="text-red-600">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0912345678"
                required
                className="text-right"
                data-testid="phone-input"
                dir="ltr"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-right block mb-2">
                البريد الإلكتروني <span className="text-gray-400 text-sm">(اختياري)</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="example@email.com"
                className="text-right"
                data-testid="email-input"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-right block mb-2">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
                className="text-right"
                data-testid="password-input"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-right block mb-2">تأكيد كلمة المرور</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                required
                className="text-right"
                data-testid="confirm-password-input"
              />
            </div>

            <div>
              <Label htmlFor="neighborhood" className="text-right block mb-2">
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
                data-testid="neighborhood-select"
                required
              />
              {!formData.neighborhood_id && (
                <p className="text-xs text-gray-500 mt-1 text-right">
                  يمكنك البحث باسم الحي أو رقمه
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-lg py-6"
              disabled={loading}
              data-testid="register-submit-btn"
            >
              {loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              لديك حساب بالفعل؟{' '}
              <Link to="/login" className="text-emerald-700 font-semibold hover:underline" data-testid="login-link">
                سجل الدخول
              </Link>
            </p>
            <Link to="/" className="text-sm text-gray-500 hover:underline mt-4 inline-block" data-testid="home-link">
              عودة إلى الصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
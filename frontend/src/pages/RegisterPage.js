import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    neighborhood_id: ''
  });
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNeighborhoods();
  }, []);

  const fetchNeighborhoods = async () => {
    try {
      const response = await axios.get(`${API_URL}/neighborhoods`);
      setNeighborhoods(response.data.filter(n => n.is_active));
    } catch (error) {
      console.error('Error fetching neighborhoods:', error);
      toast.error('فشل تحميل قائمة الأحياء');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        role: 'donor'
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
              <Label htmlFor="email" className="text-right block mb-2">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="example@email.com"
                required
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
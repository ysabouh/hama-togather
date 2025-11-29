import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LogIn, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(phone, password);
      toast.success('تم تسجيل الدخول بنجاح');
      
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      // عرض الرسالة من Backend إذا كانت متوفرة
      const errorMessage = error.response?.data?.detail || 'فشل تسجيل الدخول. رجاء التحقق من البيانات';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100" data-testid="login-page">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-block bg-emerald-100 rounded-full p-4 mb-4">
              <LogIn className="w-8 h-8 text-emerald-700" />
            </div>
            <h1 className="text-3xl font-bold text-emerald-900 mb-2">تسجيل الدخول</h1>
            <p className="text-gray-600">مرحباً بعودتك إلى منصة معاً نَبني</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="phone" className="text-right block mb-2">رقم الجوال</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912345678"
                required
                className="text-right"
                data-testid="phone-input"
                dir="ltr"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-right block mb-2">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="text-right pl-10"
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-lg py-6"
              disabled={loading}
              data-testid="login-submit-btn"
            >
              {loading ? 'جاري التسجيل...' : 'تسجيل الدخول'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              ليس لديك حساب؟{' '}
              <Link to="/register" className="text-emerald-700 font-semibold hover:underline" data-testid="register-link">
                سجل الآن
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

export default LoginPage;
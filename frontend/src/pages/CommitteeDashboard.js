import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HealthcareManagement from '../components/admin/HealthcareManagement';
import { 
  Users, 
  Heart, 
  Home,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  Stethoscope
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CommitteeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showHealthcare, setShowHealthcare] = useState(false);
  const [stats, setStats] = useState({
    totalFamilies: 0,
    totalDonations: 0,
    pendingDonations: 0,
    completedDonations: 0,
  });
  const [families, setFamilies] = useState([]);
  const [donations, setDonations] = useState([]);
  const [neighborhood, setNeighborhood] = useState(null);

  useEffect(() => {
    // التحقق من الصلاحيات
    if (!user || (user.role !== 'committee_member' && user.role !== 'committee_president')) {
      toast.error('غير مصرح لك بالوصول لهذه الصفحة');
      navigate('/');
      return;
    }

    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // جلب البيانات بشكل متوازي
      const [familiesRes, donationsRes, neighborhoodRes] = await Promise.all([
        axios.get(`${API_URL}/families`, { headers }),
        axios.get(`${API_URL}/donations`, { headers }),
        user.neighborhood_id ? axios.get(`${API_URL}/neighborhoods/${user.neighborhood_id}`) : Promise.resolve(null)
      ]);

      setFamilies(familiesRes.data);
      setDonations(donationsRes.data);
      if (neighborhoodRes) {
        setNeighborhood(neighborhoodRes.data);
      }

      // حساب الإحصائيات
      const pending = donationsRes.data.filter(d => d.status === 'pending').length;
      const completed = donationsRes.data.filter(d => d.status === 'completed').length;

      setStats({
        totalFamilies: familiesRes.data.length,
        totalDonations: donationsRes.data.length,
        pendingDonations: pending,
        completedDonations: completed,
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowRight className="w-5 h-5 ml-2" />
            العودة للصفحة الرئيسية
          </Button>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  لوحة {user.role === 'committee_president' ? 'رئيس اللجنة' : 'موظف اللجنة'}
                </h1>
                <p className="text-gray-600">
                  {neighborhood ? `حي ${neighborhood.name} - رقم ${neighborhood.number}` : 'جاري تحميل معلومات الحي...'}
                </p>
              </div>
              <div className="bg-emerald-100 rounded-full p-4">
                <Home className="w-8 h-8 text-emerald-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-blue-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.totalFamilies}</span>
            </div>
            <h3 className="text-gray-600 font-medium">إجمالي العائلات</h3>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <Heart className="w-8 h-8 text-red-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.totalDonations}</span>
            </div>
            <h3 className="text-gray-600 font-medium">إجمالي التبرعات</h3>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.pendingDonations}</span>
            </div>
            <h3 className="text-gray-600 font-medium">تبرعات قيد الانتظار</h3>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.completedDonations}</span>
            </div>
            <h3 className="text-gray-600 font-medium">تبرعات مكتملة</h3>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              إدارة العائلات
            </h2>
            <p className="text-gray-600 mb-4">
              عرض وتعديل معلومات العائلات في حيك
            </p>
            <Button 
              onClick={() => navigate('/admin')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              عرض العائلات
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-600" />
              إدارة التبرعات
            </h2>
            <p className="text-gray-600 mb-4">
              الموافقة على التبرعات وتعديل حالتها
            </p>
            <Button 
              onClick={() => navigate('/donations-management')}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              عرض التبرعات
            </Button>
          </div>

          {/* Healthcare Management - for committee_president only */}
          {user.role === 'committee_president' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Stethoscope className="w-6 h-6 text-emerald-600" />
                إدارة الرعاية الصحية
              </h2>
              <p className="text-gray-600 mb-4">
                إضافة وتعديل الأطباء والصيدليات والمختبرات
              </p>
              <Button 
                onClick={() => setShowHealthcare(!showHealthcare)}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {showHealthcare ? 'إخفاء' : 'عرض'} الرعاية الصحية
              </Button>
            </div>
          )}
        </div>

        {/* Healthcare Management Section */}
        {user.role === 'committee_president' && showHealthcare && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Stethoscope className="w-7 h-7 text-emerald-600" />
              إدارة الرعاية الصحية - حي {neighborhood?.name || ''}
            </h2>
            <HealthcareManagement activeTab="doctors" />
          </div>
        )}

        {/* Recent Pending Donations */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            التبرعات المعلقة ({stats.pendingDonations})
          </h2>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
          ) : donations.filter(d => d.status === 'pending').length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لا توجد تبرعات معلقة 🎉
            </div>
          ) : (
            <div className="space-y-4">
              {donations
                .filter(d => d.status === 'pending')
                .slice(0, 5)
                .map(donation => (
                  <div key={donation.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">
                          {donation.family_name || 'عائلة غير محددة'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          المتبرع: {donation.donor_name || 'غير محدد'}
                        </p>
                        <p className="text-sm text-gray-600">
                          المبلغ: {donation.amount || 'غير محدد'}
                        </p>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => navigate('/donations-management')}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        معالجة
                      </Button>
                    </div>
                  </div>
                ))}
              
              {donations.filter(d => d.status === 'pending').length > 5 && (
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/donations-management')}
                >
                  عرض جميع التبرعات المعلقة ({donations.filter(d => d.status === 'pending').length})
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CommitteeDashboard;

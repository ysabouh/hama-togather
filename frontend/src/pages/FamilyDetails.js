import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  Users, Heart, MapPin, DollarSign, TrendingUp, Calendar, 
  ArrowRight, Phone, Mail, Home, User, Baby, CheckCircle,
  Clock, Package, X, Image as ImageIcon, History, Gift
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FamilyDetails = () => {
  const { familyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [family, setFamily] = useState(null);
  const [familyNeeds, setFamilyNeeds] = useState([]);
  const [category, setCategory] = useState(null);
  const [neighborhood, setNeighborhood] = useState(null);
  const [incomeLevel, setIncomeLevel] = useState(null);
  const [needAssessment, setNeedAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationForm, setDonationForm] = useState({
    donor_name: user?.name || '',
    donor_phone: '',
    donor_email: user?.email || '',
    donation_type: 'مالية',
    amount: '',
    description: '',
    notes: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/families-public');
      return;
    }
    fetchFamilyDetails();
  }, [familyId, user]);

  const fetchFamilyDetails = async () => {
    setLoading(true);
    try {
      // جلب بيانات العائلة
      const familyRes = await axios.get(`${API_URL}/families/${familyId}`);
      setFamily(familyRes.data);

      // جلب احتياجات العائلة
      try {
        const needsRes = await axios.get(`${API_URL}/families/${familyId}/needs`);
        setFamilyNeeds(needsRes.data || []);
      } catch (error) {
        console.error('Error fetching family needs:', error);
        setFamilyNeeds([]);
      }

      // جلب البيانات المساعدة
      const [categoriesRes, neighborhoodsRes, incomeLevelsRes, needAssessmentsRes] = await Promise.all([
        axios.get(`${API_URL}/family-categories`),
        axios.get(`${API_URL}/public/neighborhoods`),
        axios.get(`${API_URL}/income-levels`),
        axios.get(`${API_URL}/need-assessments`)
      ]);

      // ربط البيانات
      const familyData = familyRes.data;
      setCategory(categoriesRes.data.find(c => c.id === familyData.category_id));
      setNeighborhood(neighborhoodsRes.data.find(n => n.id === familyData.neighborhood_id));
      setIncomeLevel(incomeLevelsRes.data.find(i => i.id === familyData.income_level_id));
      setNeedAssessment(needAssessmentsRes.data.find(n => n.id === familyData.need_assessment_id));

    } catch (error) {
      console.error('Error fetching family details:', error);
      if (error.response?.status === 401) {
        navigate('/login?redirect=/families-public');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'غير محدد';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl p-8 animate-pulse">
              <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!family) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto text-center">
            <Users className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-700 mb-4">العائلة غير موجودة</h2>
            <button
              onClick={() => navigate('/families-public')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              العودة للعائلات
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const totalMembers = family.members_count || 
    ((family.male_children_count || 0) + (family.female_children_count || 0) + 2);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
        }}></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="mb-6 flex items-center gap-2 text-white hover:text-emerald-100 transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
              <span className="font-semibold">العودة للعائلات</span>
            </button>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                {/* Family Number Badge */}
                <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                  <span className="text-sm font-bold font-mono">رقم العائلة: {family.family_number}</span>
                </div>

                {/* Family Name */}
                <h1 className="text-5xl font-bold mb-4">{family.name}</h1>

                {/* Quick Info */}
                <div className="flex flex-wrap gap-4 text-emerald-100">
                  {neighborhood && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      <span>{neighborhood.name}</span>
                    </div>
                  )}
                  {category && (
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      <span>{category.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Need Assessment Badge */}
              {needAssessment && (
                <div
                  className="px-6 py-3 rounded-xl text-lg font-bold shadow-2xl"
                  style={{
                    backgroundColor: needAssessment.color,
                    color: 'white'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    <span>{needAssessment.name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 -mt-8 relative z-10">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Main Info - 2 columns */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Family Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Members */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-emerald-500">
                    <div className="flex items-center justify-between mb-3">
                      <Users className="w-8 h-8 text-emerald-600" />
                      <span className="text-3xl font-bold text-gray-900">{totalMembers}</span>
                    </div>
                    <p className="text-sm text-gray-600 font-semibold">إجمالي أفراد العائلة</p>
                  </div>

                  {/* Male Children */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
                    <div className="flex items-center justify-between mb-3">
                      <User className="w-8 h-8 text-blue-600" />
                      <span className="text-3xl font-bold text-gray-900">{family.male_children_count || 0}</span>
                    </div>
                    <p className="text-sm text-gray-600 font-semibold">الأطفال الذكور</p>
                  </div>

                  {/* Female Children */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-pink-500">
                    <div className="flex items-center justify-between mb-3">
                      <Baby className="w-8 h-8 text-pink-600" />
                      <span className="text-3xl font-bold text-gray-900">{family.female_children_count || 0}</span>
                    </div>
                    <p className="text-sm text-gray-600 font-semibold">الأطفال الإناث</p>
                  </div>
                </div>

                {/* Description */}
                {family.description && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Heart className="w-6 h-6 text-emerald-600" />
                      وصف العائلة
                    </h2>
                    <p className="text-gray-700 leading-relaxed text-lg">{family.description}</p>
                  </div>
                )}

                {/* Family Needs */}
                {familyNeeds.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Package className="w-6 h-6 text-emerald-600" />
                      احتياجات العائلة
                    </h2>
                    <div className="space-y-3">
                      {familyNeeds.map((need, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-emerald-50 transition-colors"
                        >
                          <div className="flex-shrink-0 mt-1">
                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1">{need.need_name || 'احتياج'}</h3>
                            {need.amount && (
                              <p className="text-sm text-gray-600 mb-1">الكمية: {need.amount}</p>
                            )}
                            {need.notes && (
                              <p className="text-sm text-gray-600">{need.notes}</p>
                            )}
                          </div>
                          {need.is_active !== false && (
                            <span className="flex-shrink-0 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                              نشط
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar - 1 column */}
              <div className="space-y-6">
                
                {/* Income Level */}
                {incomeLevel && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-amber-600" />
                      مستوى الدخل
                    </h3>
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                      <p className="text-center text-lg font-bold text-amber-900">{incomeLevel.name}</p>
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                {(family.contact_phone || family.contact_email) && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">معلومات التواصل</h3>
                    <div className="space-y-3">
                      {family.contact_phone && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <Phone className="w-5 h-5 text-emerald-600" />
                          <span className="text-sm" dir="ltr">{family.contact_phone}</span>
                        </div>
                      )}
                      {family.contact_email && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <Mail className="w-5 h-5 text-emerald-600" />
                          <span className="text-sm">{family.contact_email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    التواريخ
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">تاريخ التسجيل</p>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-semibold">{formatDate(family.created_at)}</span>
                      </div>
                    </div>
                    {family.updated_at && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">آخر تحديث</p>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-semibold">{formatDate(family.updated_at)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl shadow-xl p-6 text-white">
                  <h3 className="text-xl font-bold mb-3">ساعد هذه العائلة</h3>
                  <p className="text-emerald-100 text-sm mb-4">
                    كل مساهمة تحدث فرقاً كبيراً في حياة هذه العائلة
                  </p>
                  <button className="w-full bg-white text-emerald-600 py-3 rounded-lg font-bold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2">
                    <Heart className="w-5 h-5" />
                    <span>تقديم المساعدة</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FamilyDetails;

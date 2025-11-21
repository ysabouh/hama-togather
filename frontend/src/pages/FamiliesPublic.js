import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Users, Heart, MapPin, DollarSign, TrendingUp, Home, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { customSelectStyles } from '@/utils/adminHelpers';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FamiliesPublic = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('category');
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [families, setFamilies] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [incomeLevels, setIncomeLevels] = useState([]);
  const [needAssessments, setNeedAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingFamilies, setLoadingFamilies] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingCategoryId, setPendingCategoryId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (categoryId && user) {
      const category = categories.find(c => c.id === categoryId);
      setSelectedCategory(category);
      fetchFamiliesByCategory(categoryId);
      
      // جلب الأحياء إذا كان مدير
      if (user.role === 'admin') {
        fetchNeighborhoods();
      }
    } else if (categoryId && !user) {
      // إذا حاول الوصول لتصنيف بدون تسجيل دخول
      navigate('/login?redirect=/families-public?category=' + categoryId);
    } else {
      setSelectedCategory(null);
      setFamilies([]);
    }
  }, [categoryId, user, categories]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/public/families-stats`);
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFamiliesByCategory = async (catId, neighborhoodId = null) => {
    setLoadingFamilies(true);
    try {
      let url = `${API_URL}/public/families-by-category/${catId}`;
      if (neighborhoodId) {
        url += `?neighborhood_id=${neighborhoodId}`;
      }
      
      const response = await axios.get(url);
      setFamilies(response.data);
      
      // جلب البيانات المساعدة
      if (response.data.length > 0 && incomeLevels.length === 0) {
        const [incomeLevelsRes, needAssessmentsRes] = await Promise.all([
          axios.get(`${API_URL}/income-levels`),
          axios.get(`${API_URL}/need-assessments`)
        ]);
        setIncomeLevels(incomeLevelsRes.data.filter(i => i.is_active !== false));
        setNeedAssessments(needAssessmentsRes.data.filter(n => n.is_active !== false));
      }
    } catch (error) {
      console.error('Error fetching families:', error);
      if (error.response?.status === 401) {
        navigate('/login?redirect=/families-public?category=' + catId);
      }
    } finally {
      setLoadingFamilies(false);
    }
  };

  const fetchNeighborhoods = async () => {
    try {
      const response = await axios.get(`${API_URL}/public/neighborhoods`);
      setNeighborhoods(response.data);
    } catch (error) {
      console.error('Error fetching neighborhoods:', error);
    }
  };

  const getCategoryCount = (category) => {
    return category.families_count || 0;
  };

  const handleCategoryClick = (category) => {
    if (!user) {
      // عرض رسالة تسجيل الدخول
      setPendingCategoryId(category.id);
      setShowLoginPrompt(true);
    } else {
      navigate('/families-public?category=' + category.id);
    }
  };

  const handleLoginConfirm = () => {
    setShowLoginPrompt(false);
    navigate('/login?redirect=/families-public?category=' + pendingCategoryId);
  };

  const handleLoginCancel = () => {
    setShowLoginPrompt(false);
    setPendingCategoryId(null);
  };

  const handleNeighborhoodChange = (selected) => {
    setSelectedNeighborhood(selected);
    if (selectedCategory) {
      fetchFamiliesByCategory(selectedCategory.id, selected?.value);
    }
  };

  const getCategoryIcon = (index) => {
    const icons = ['👨‍👩‍👧‍👦', '👩‍👧‍👦', '🧓', '🏥', '🎓', '💼', '🏠', '👶', '🎯'];
    return icons[index % icons.length];
  };

  const getIncomeLevel = (incomeLevelId) => {
    return incomeLevels.find(i => i.id === incomeLevelId);
  };

  const getNeedAssessment = (needAssessmentId) => {
    return needAssessments.find(n => n.id === needAssessmentId);
  };

  const getNeighborhood = (neighborhoodId) => {
    return neighborhoods.find(n => n.id === neighborhoodId);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Navbar />

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleLoginCancel}>
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                تسجيل الدخول مطلوب
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                لمشاهدة تفاصيل العائلات المحتاجة والمساهمة في مساعدتهم، يجب عليك تسجيل الدخول أولاً
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleLoginConfirm}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2"
              >
                <Users className="w-5 h-5" />
                تسجيل الدخول الآن
              </button>
              
              <button
                onClick={handleLoginCancel}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
        }}></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              العائلات المستفيدة
            </h1>
            <p className="text-xl md:text-2xl mb-4 text-emerald-50">
              تعرف على العائلات المحتاجة وشارك في إحداث تغيير إيجابي في حياتهم
            </p>
            <div className="mt-8 space-y-3 text-lg text-emerald-100">
              <p>🤲 وراء كل اسمٍ هنا… قصةُ صبرٍ تستحقّ أن تُكملها بالعطاء</p>
              <p>💚 ليسوا أرقامًا… بل قلوبًا تنتظر من يسمع نبضها</p>
              <p>✨ القليل منك… يعني حياةً كاملة لغيرك</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section - يظهر فقط إذا لم يتم اختيار تصنيف */}
      {!selectedCategory && (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">تصنيفات العائلات</h2>
            <p className="text-xl text-gray-600">اختر التصنيف المناسب لمعرفة العائلات المحتاجة</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-gray-100 rounded-2xl p-8 animate-pulse h-64"></div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl">
              <Users className="w-24 h-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-700 mb-2">لا توجد تصنيفات</h3>
              <p className="text-gray-500">لم يتم إضافة أي تصنيفات بعد</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  className="group cursor-pointer bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-gray-100 hover:border-emerald-400"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* العدد */}
                    <div 
                      className="text-white text-3xl font-bold w-20 h-20 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                      style={{
                        background: category.color ? `linear-gradient(135deg, ${category.color}, ${category.color}dd)` : 'linear-gradient(135deg, #10b981, #0d9488)'
                      }}
                    >
                      {getCategoryCount(category)}
                    </div>

                    {/* الأيقونة */}
                    <div className="text-6xl group-hover:scale-110 transition-transform">
                      {getCategoryIcon(index)}
                    </div>

                    {/* الاسم */}
                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                      {category.name}
                    </h3>

                    {/* الوصف */}
                    <p className="text-gray-600 text-base leading-relaxed">
                      {category.description || 'عائلات تحتاج دعمكم ومساندتكم'}
                    </p>

                    {/* زر */}
                    <div className="pt-4">
                      <span className="inline-flex items-center gap-2 text-emerald-600 font-semibold group-hover:gap-3 transition-all">
                        عرض العائلات
                        <Heart className="w-5 h-5 group-hover:fill-current" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      )}

      {/* Families Section - يظهر عند اختيار تصنيف */}
      {selectedCategory && user && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">
                  {selectedCategory.name}
                </h2>
                <p className="text-xl text-gray-600">
                  {families.length} عائلة محتاجة
                </p>
                {user.role !== 'admin' && user.neighborhood_id && (
                  <p className="text-sm text-emerald-600 mt-1">
                    📍 يتم عرض العائلات في حيك فقط
                  </p>
                )}
              </div>
              
              <div className="flex gap-3">
                {/* فلتر الأحياء - للمدير فقط */}
                {user.role === 'admin' && neighborhoods.length > 0 && (
                  <div className="min-w-[250px]">
                    <Select
                      value={selectedNeighborhood}
                      onChange={handleNeighborhoodChange}
                      options={[
                        { value: null, label: 'جميع الأحياء' },
                        ...neighborhoods.map(n => ({ value: n.id, label: n.name }))
                      ]}
                      styles={customSelectStyles}
                      placeholder="فلترة حسب الحي..."
                      isClearable
                    />
                  </div>
                )}
                
                {/* زر العودة */}
                <button
                  onClick={() => navigate('/families-public')}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
                >
                  <Home className="w-5 h-5" />
                  جميع التصنيفات
                </button>
              </div>
            </div>

            {/* Families Grid */}
            {loadingFamilies ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                    <div className="h-40 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : families.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
                <Users className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-700 mb-2">لا توجد عائلات</h3>
                <p className="text-gray-500">
                  {user.role === 'admin' 
                    ? 'لا توجد عائلات في هذا التصنيف حالياً'
                    : 'لا توجد عائلات في هذا التصنيف في حيك'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {families.map((family) => {
                  const needAssessment = getNeedAssessment(family.need_assessment_id);
                  const incomeLevel = getIncomeLevel(family.income_level_id);
                  const neighborhood = getNeighborhood(family.neighborhood_id);

                  return (
                    <div
                      key={family.id}
                      onClick={() => navigate(`/family/${family.id}`)}
                      className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-200 hover:border-emerald-400 cursor-pointer transform hover:-translate-y-2"
                    >
                      {/* Decorative Top Border */}
                      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>

                      {/* Header with Family Name & Number */}
                      <div className="relative pt-6 px-6 pb-4">
                        <div className="flex items-start justify-between mb-4">
                          {/* Family Number Badge */}
                          <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                              <span className="text-sm font-bold font-mono">{family.family_number}</span>
                            </div>
                          </div>
                          
                          {/* Need Assessment Badge - Top Right */}
                          {needAssessment && (
                            <div
                              className="px-3 py-1 rounded-full text-xs font-bold shadow-md"
                              style={{
                                backgroundColor: `${needAssessment.color}20`,
                                color: needAssessment.color,
                                border: `2px solid ${needAssessment.color}`
                              }}
                            >
                              {needAssessment.name}
                            </div>
                          )}
                        </div>

                        {/* Family Fake Name with Number & Code */}
                        <div className="space-y-1">
                          <h3 className="text-2xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                            {family.fake_name || family.name}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <span className="font-semibold">رقم العائلة:</span>
                              <span className="font-mono">{family.family_number}</span>
                            </span>
                            {family.family_code && (
                              <>
                                <span className="text-gray-400">|</span>
                                <span className="flex items-center gap-1">
                                  <span className="font-semibold">الرمز:</span>
                                  <span className="font-mono">{family.family_code}</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="px-6">
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                      </div>

                      {/* Body - Family Details */}
                      <div className="px-6 py-5 space-y-4">
                        {/* Location & Members Info Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* Neighborhood */}
                          {neighborhood && (
                            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 group-hover:bg-emerald-50 transition-colors">
                              <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                                <MapPin className="w-5 h-5 text-emerald-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 mb-0.5">الحي</p>
                                <p className="text-sm font-bold text-gray-900 truncate">{neighborhood.name}</p>
                              </div>
                            </div>
                          )}

                          {/* Members Count */}
                          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 group-hover:bg-emerald-50 transition-colors">
                            <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                              <Users className="w-5 h-5 text-teal-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 mb-0.5">عدد الأفراد</p>
                              <p className="text-sm font-bold text-gray-900">
                                {family.members_count || ((family.male_children_count || 0) + (family.female_children_count || 0) + 2)} فرد
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Income Level - Full Width */}
                        {incomeLevel && (
                          <div className="flex items-center gap-3 bg-amber-50 rounded-lg p-3 border border-amber-200">
                            <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                              <DollarSign className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-amber-700 mb-0.5">مستوى الدخل</p>
                              <p className="text-sm font-bold text-amber-900">{incomeLevel.name}</p>
                              {incomeLevel.description && (
                                <p className="text-xs text-amber-600 mt-1 leading-relaxed">{incomeLevel.description}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Description */}
                        {family.description && (
                          <div className="bg-gray-50 rounded-lg p-4 group-hover:bg-gray-100 transition-colors">
                            <p className="text-xs text-gray-500 mb-2 font-semibold">الوصف</p>
                            <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                              {family.description}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Footer - Action Button */}
                      <div className="px-6 pb-6 pt-2">
                        <div className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-xl font-bold text-base shadow-lg group-hover:from-emerald-600 group-hover:to-teal-700 group-hover:shadow-xl transition-all">
                          <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span>عرض تفاصيل العائلة</span>
                        </div>
                      </div>

                      {/* Hover Glow Effect */}
                      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5"></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default FamiliesPublic;

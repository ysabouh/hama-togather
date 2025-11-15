import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Users, Heart } from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FamiliesPublic = () => {
  const navigate = useNavigate();

  const [families, setFamilies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/public/families-stats`);
      
      setCategories(response.data.categories || []);
      console.log('Categories with counts:', response.data.categories);
      console.log('Total families:', response.data.total_families);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryCount = (category) => {
    // العدد موجود مباشرة في الـ category من الـ API
    return category.families_count || 0;
  };

  const handleCategoryClick = (category) => {
    navigate(`/families?category=${category.id}`);
  };

  const getCategoryIcon = (index) => {
    const icons = ['👨‍👩‍👧‍👦', '👩‍👧‍👦', '🧓', '🏥', '🎓', '💼', '🏠', '👶', '🎯'];
    return icons[index % icons.length];
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Navbar />

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

      {/* Categories Section */}
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
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-3xl font-bold w-20 h-20 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
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

      <Footer />
    </div>
  );
};

export default FamiliesPublic;

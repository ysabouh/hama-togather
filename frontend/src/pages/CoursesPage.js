import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { GraduationCap, Calendar, Clock, Users } from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, awareness, education

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/courses`);
      setCourses(response.data);
    } catch (error) {
      toast.error('فشل تحميل الدورات');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = filter === 'all' 
    ? courses 
    : courses.filter(course => course.category === filter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-blue-900 mb-4" data-testid="page-title">الدورات التعليمية والتوعوية</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              انضم إلى دوراتنا التعليمية والتوعوية لتطوير مهاراتك وزيادة معرفتك
            </p>
          </div>

          {/* Filters */}
          <div className="flex justify-center gap-4 mb-8">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-blue-700' : ''}
              data-testid="filter-all"
            >
              كل الدورات
            </Button>
            <Button
              variant={filter === 'awareness' ? 'default' : 'outline'}
              onClick={() => setFilter('awareness')}
              className={filter === 'awareness' ? 'bg-blue-700' : ''}
              data-testid="filter-awareness"
            >
              التوعية الأسرية
            </Button>
            <Button
              variant={filter === 'education' ? 'default' : 'outline'}
              onClick={() => setFilter('education')}
              className={filter === 'education' ? 'bg-blue-700' : ''}
              data-testid="filter-education"
            >
              التعليم والتدريب
            </Button>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="text-center py-20">
              <GraduationCap className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600">لا توجد دورات متاحة حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <div 
                  key={course.id} 
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  data-testid={`course-card-${course.id}`}
                >
                  <div className={`h-48 flex items-center justify-center ${
                    course.category === 'awareness' 
                      ? 'bg-gradient-to-br from-purple-100 to-purple-200' 
                      : 'bg-gradient-to-br from-blue-100 to-blue-200'
                  }`}>
                    <GraduationCap className={`w-20 h-20 ${
                      course.category === 'awareness' ? 'text-purple-700' : 'text-blue-700'
                    }`} />
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        course.category === 'awareness' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {course.category === 'awareness' ? 'توعية أسرية' : 'تعليم وتدريب'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        course.status === 'upcoming' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {course.status === 'upcoming' ? 'قريباً' : course.status === 'ongoing' ? 'جاري' : 'منتهي'}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-3">{course.title}</h3>
                    <p className="text-gray-700 mb-4 line-clamp-3">{course.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{course.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Users className="w-4 h-4" />
                        <span>{course.current_participants}/{course.max_participants} مشارك</span>
                      </div>
                      {course.instructor && (
                        <div className="text-gray-600 text-sm">
                          <span className="font-semibold">المدرب:</span> {course.instructor}
                        </div>
                      )}
                    </div>

                    <Button
                      className="w-full bg-blue-700 hover:bg-blue-800"
                      disabled={course.current_participants >= course.max_participants || course.status === 'completed'}
                      data-testid={`register-btn-${course.id}`}
                    >
                      {course.current_participants >= course.max_participants ? 'مكتمل' : 'سجل الآن'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CoursesPage;
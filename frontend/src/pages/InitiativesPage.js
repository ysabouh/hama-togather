import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingLogo from '../components/LoadingLogo';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { HandHeart, Calendar, Users } from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const InitiativesPage = () => {
  const [initiatives, setInitiatives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitiatives();
  }, []);

  const fetchInitiatives = async () => {
    try {
      const response = await axios.get(`${API_URL}/initiatives`);
      setInitiatives(response.data);
    } catch (error) {
      toast.error('فشل تحميل المبادرات');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-green-900 mb-4" data-testid="page-title">المبادرات اليومية</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              انضم إلى مبادراتنا اليومية مثل توزيع الطعام، نشر أخبار العروض، وغيرها
            </p>
          </div>

          {initiatives.length === 0 ? (
            <div className="text-center py-20">
              <HandHeart className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600">لا توجد مبادرات متاحة حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {initiatives.map((initiative) => (
                <div 
                  key={initiative.id} 
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  data-testid={`initiative-card-${initiative.id}`}
                >
                  <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                    <HandHeart className="w-20 h-20 text-green-700" />
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        initiative.status === 'upcoming' ? 'bg-blue-100 text-blue-700' : 
                        initiative.status === 'ongoing' ? 'bg-green-100 text-green-700' : 
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {initiative.status === 'upcoming' ? 'قريباً' : 
                         initiative.status === 'ongoing' ? 'جاري' : 
                         'منتهي'}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{initiative.title}</h3>
                    <p className="text-gray-700 mb-4 line-clamp-3">{initiative.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{initiative.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Users className="w-4 h-4" />
                        <span>{initiative.current_volunteers}/{initiative.volunteers_needed} متطوع</span>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-green-700 hover:bg-green-800"
                      disabled={initiative.current_volunteers >= initiative.volunteers_needed || initiative.status === 'completed'}
                      data-testid={`volunteer-btn-${initiative.id}`}
                    >
                      {initiative.current_volunteers >= initiative.volunteers_needed ? 'مكتمل' : 'انضم كمتطوع'}
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

export default InitiativesPage;
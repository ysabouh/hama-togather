import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingLogo from '../components/LoadingLogo';
import { toast } from 'sonner';
import { Heart, Calendar, Clock, Phone, Gift, Eye } from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MyDonationsPage = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDonationsTab, setActiveDonationsTab] = useState('active');

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const response = await axios.get(`${API_URL}/donations`);
      setDonations(response.data);
    } catch (error) {
      toast.error('فشل تحميل التبرعات');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SY', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return { date: 'غير محدد', time: '' };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('ar-SY', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      time: date.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit', hour12: false })
    };
  };

  if (loading) {
    return <LoadingLogo />;
  }

  const getDonationTypeLabel = (type) => {
    const types = {
      family: 'كفالة عائلة',
      health: 'رعاية صحية',
      material: 'تبرع عيني',
      education: 'تعليم وتدريب',
      project: 'مشروع إنتاجي'
    };
    return types[type] || type;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-emerald-900 mb-4" data-testid="page-title">تبرعاتي</h1>
            <p className="text-lg text-gray-600">سجل تبرعاتك ومساهماتك</p>
          </div>

          {donations.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600">لم تقم بأي تبرعات بعد</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              {donations.map((donation) => (
                <div 
                  key={donation.id} 
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                  data-testid={`donation-item-${donation.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Heart className="w-6 h-6 text-emerald-700" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{getDonationTypeLabel(donation.type)}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>{(() => {
                              const date = new Date(donation.created_at);
                              const dateStr = date.toLocaleDateString('en-GB', {year: 'numeric', month: '2-digit', day: '2-digit'});
                              const timeStr = date.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit', hour12: false});
                              return `${dateStr} ${timeStr}`;
                            })()}</span>
                          </div>
                        </div>
                      </div>

                      {donation.amount && (
                        <div className="mb-2">
                          <span className="text-sm text-gray-600">المبلغ: </span>
                          <span className="text-lg font-bold text-emerald-700">{donation.amount.toLocaleString()} ل.س</span>
                        </div>
                      )}

                      {donation.items && (
                        <div className="mb-2">
                          <span className="text-sm text-gray-600">المواد: </span>
                          <span className="text-gray-900">{donation.items}</span>
                        </div>
                      )}

                      {donation.message && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">"{donation.message}"</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        donation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {donation.status === 'pending' ? 'قيد المعالجة' : 'مكتمل'}
                      </span>
                    </div>
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

export default MyDonationsPage;
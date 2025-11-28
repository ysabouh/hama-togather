import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingLogo from '../components/LoadingLogo';
import { toast } from 'sonner';
import { Heart, Calendar, Clock, Phone, Gift, Eye, AlertTriangle, Image as ImageIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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

          <div className="max-w-5xl mx-auto">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b bg-white rounded-t-xl px-6 pt-4">
              <button
                onClick={() => setActiveDonationsTab('active')}
                className={`px-6 py-3 font-bold transition-colors text-base ${
                  activeDonationsTab === 'active'
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                التبرعات النشطة ({donations.filter(d => d.is_active !== false).length})
              </button>
              <button
                onClick={() => setActiveDonationsTab('inactive')}
                className={`px-6 py-3 font-bold transition-colors text-base ${
                  activeDonationsTab === 'inactive'
                    ? 'text-gray-600 border-b-2 border-gray-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                التبرعات المعطلة ({donations.filter(d => d.is_active === false).length})
              </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-b-xl shadow-lg p-6">
              {(() => {
                const filteredDonations = donations.filter(d => 
                  activeDonationsTab === 'active' ? d.is_active !== false : d.is_active === false
                );
                
                if (filteredDonations.length === 0) {
                  return (
                    <div className="text-center py-20 bg-gray-50 rounded-lg">
                      <Gift className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                      <p className="text-xl text-gray-600 font-semibold">
                        {activeDonationsTab === 'active' ? 'لا توجد مساعدات نشطة' : 'لا توجد مساعدات معطلة'}
                      </p>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-4">
                    {filteredDonations.map((donation, idx) => (
                      <div
                        key={donation.id || idx}
                        className={`relative border-r-4 ${donation.is_active === false ? 'border-gray-400' : 'border-emerald-500'} pr-6 pb-4 last:pb-0`}
                        data-testid={`donation-item-${donation.id}`}
                      >
                        {/* Timeline Dot */}
                        <div className={`absolute right-0 top-0 w-4 h-4 ${donation.is_active === false ? 'bg-gray-400' : 'bg-emerald-500'} rounded-full transform translate-x-1/2 ring-4 ring-white`}></div>
                        
                        <div className={`rounded-lg p-4 ${donation.is_active === false ? 'bg-gray-100 opacity-75' : 'bg-gray-50 hover:bg-emerald-50'} transition-colors`}>
                          {/* شارة غير نشط */}
                          {donation.is_active === false && (
                            <div className="mb-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-gray-500 text-white">
                                ⚠️ معطل - قابل للنقل
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                            <div className="flex-1">
                              {/* رقم التبرع */}
                              <div className="mb-2">
                                <span className="text-xs text-gray-500">رقم التبرع: </span>
                                <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                  {donation.id ? donation.id.substring(0, 8) : 'N/A'}
                                </span>
                              </div>
                              
                              <h3 className="font-bold text-gray-900 text-lg">{donation.donor_name || 'متبرع'}</h3>
                              
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                  {donation.donation_type || getDonationTypeLabel(donation.type)}
                                </span>
                                
                                {/* Delivery Status Badge */}
                                {donation.delivery_status && (
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                    donation.delivery_status === 'delivered' ? 'bg-green-100 text-green-700 border-green-300' :
                                    donation.delivery_status === 'cancelled' ? 'bg-red-100 text-red-700 border-red-300' :
                                    'bg-blue-100 text-blue-700 border-blue-300'
                                  }`}>
                                    {donation.delivery_status === 'delivered' ? '✓ تم التسليم' :
                                     donation.delivery_status === 'cancelled' ? '✕ ملغية' :
                                     '⏱ مجدولة'}
                                  </span>
                                )}
                              </div>
                              
                              {/* المبلغ المالي */}
                              <div className="mt-2">
                                <span className="text-sm text-gray-600">المالية: </span>
                                <span className="text-sm font-bold text-gray-900">{donation.amount ? donation.amount.toLocaleString() : '0'} ل.س</span>
                              </div>
                              
                              {/* Transfer Type Badge */}
                              <div className="mt-1">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                  donation.transfer_type === 'fixed' 
                                    ? 'bg-blue-100 text-blue-700 border-blue-300' 
                                    : 'bg-purple-100 text-purple-700 border-purple-300'
                                }`}>
                                  {donation.transfer_type === 'fixed' ? '🔒 ثابت' : '🔄 قابل للنقل'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-xs text-left space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Status Badge */}
                                {donation.status && (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                                    donation.status === 'completed' ? 'bg-green-100 text-green-700 border-green-300' :
                                    donation.status === 'inprogress' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                    donation.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                    donation.status === 'cancelled' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                                    donation.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-300' :
                                    'bg-amber-100 text-amber-700 border-amber-300'
                                  }`}>
                                    {donation.status === 'completed' ? '✓ مكتمل' :
                                     donation.status === 'inprogress' ? '⏱ قيد التنفيذ' :
                                     donation.status === 'pending' ? '⏳ معلق' :
                                     donation.status === 'cancelled' ? '✕ ملغي' :
                                     donation.status === 'rejected' ? '✕ مرفوض' :
                                     '⏳ معلق'}
                                  </span>
                                )}
                                
                                <div className="flex items-center gap-1 whitespace-nowrap text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  <span>تسجيل:</span>
                                  <span className="font-semibold">{formatDate(donation.created_at)}</span>
                                </div>
                              </div>
                              
                              {donation.donation_date && (
                                <div className="flex items-center gap-1 whitespace-nowrap text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  <span>موعد:</span>
                                  <span className="font-semibold">{(() => {
                                    const dt = formatDateTime(donation.donation_date);
                                    return `${dt.date} ${dt.time}`;
                                  })()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Description */}
                          {donation.description && (
                            <p className="text-sm text-gray-700 leading-relaxed">{donation.description}</p>
                          )}
                          
                          {/* Notes */}
                          {donation.notes && (
                            <p className="text-xs text-gray-500 mt-2 italic">ملاحظات: {donation.notes}</p>
                          )}
                          
                          {/* Items for material donations */}
                          {donation.items && (
                            <div className="mt-2">
                              <span className="text-sm text-gray-600">المواد: </span>
                              <span className="text-sm text-gray-900">{donation.items}</span>
                            </div>
                          )}
                          
                          {/* Message */}
                          {donation.message && (
                            <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                              <p className="text-sm text-gray-700 italic">"{donation.message}"</p>
                            </div>
                          )}
                          
                          {/* Phone */}
                          {donation.donor_phone && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-xs text-gray-600">
                                <Phone className="w-3 h-3 inline ml-1" />
                                {donation.donor_phone}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MyDonationsPage;
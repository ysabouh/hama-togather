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
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImages, setCurrentImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const donationsPerPage = 10;

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

  const openImageModal = (images, index) => {
    setCurrentImages(images);
    setCurrentImageIndex(index);
    setShowImageModal(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % currentImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length);
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
                              
                              {/* معلومات العائلة */}
                              {donation.family_name && (
                                <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-xs text-gray-500">العائلة: </span>
                                      <span className="text-sm font-bold text-gray-900">{donation.family_name}</span>
                                    </div>
                                    {donation.family_number && (
                                      <div>
                                        <span className="text-xs text-gray-500">رقم العائلة: </span>
                                        <span className="text-sm font-mono font-bold text-gray-900">{donation.family_number}</span>
                                      </div>
                                    )}
                                    {donation.family_category && (
                                      <div>
                                        <span className="text-xs text-gray-500">التصنيف: </span>
                                        <span className="text-sm font-semibold text-blue-700">{donation.family_category}</span>
                                      </div>
                                    )}
                                    {donation.neighborhood_name && (
                                      <div>
                                        <span className="text-xs text-gray-500">الحي: </span>
                                        <span className="text-sm font-semibold text-emerald-700">{donation.neighborhood_name}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
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
                          
                          {/* Cancellation Reason */}
                          {donation.status === 'cancelled' && donation.cancellation_reason && (
                            <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-sm font-bold text-red-800 mb-1">سبب الإلغاء</h4>
                                  <p className="text-sm text-red-700 leading-relaxed">{donation.cancellation_reason}</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Delivery/Completion Images */}
                          {donation.status === 'completed' && (() => {
                            // استخدم completion_images أولاً، ثم delivery_images
                            const images = (donation.completion_images && donation.completion_images.length > 0) 
                              ? donation.completion_images 
                              : (donation.delivery_images && donation.delivery_images.length > 0) 
                                ? donation.delivery_images 
                                : null;
                            
                            if (!images) return null;
                            
                            return (
                              <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <ImageIcon className="w-4 h-4 text-green-600" />
                                  </div>
                                  <h4 className="text-sm font-bold text-green-800">صور الاستلام ({images.length})</h4>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                  {images.map((image, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => openImageModal(images, idx)}
                                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group border-2 border-green-200 hover:border-green-400 transition-all"
                                    >
                                      <img
                                        src={image}
                                        alt={`صورة استلام ${idx + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                                        <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
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

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl p-0 bg-black">
          <div className="relative">
            {/* Close Button */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-50 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6 text-gray-800" />
            </button>

            {/* Image Counter */}
            <div className="absolute top-4 left-4 z-50 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {currentImageIndex + 1} / {currentImages.length}
            </div>

            {/* Main Image */}
            <div className="relative w-full h-[70vh] flex items-center justify-center bg-black">
              {currentImages.length > 0 && (
                <img
                  src={currentImages[currentImageIndex]}
                  alt={`صورة ${currentImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>

            {/* Navigation Buttons */}
            {currentImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full flex items-center justify-center transition-all shadow-lg"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full flex items-center justify-center transition-all shadow-lg"
                >
                  <ChevronRight className="w-6 h-6 text-gray-800" />
                </button>
              </>
            )}

            {/* Thumbnails */}
            {currentImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black bg-opacity-70 p-2 rounded-lg">
                {currentImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                      idx === currentImageIndex ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default MyDonationsPage;
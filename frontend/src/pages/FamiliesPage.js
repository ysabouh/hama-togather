import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingLogo from '../components/LoadingLogo';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Users, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FamiliesPage = () => {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [showDonateDialog, setShowDonateDialog] = useState(false);
  const [donationData, setDonationData] = useState({ amount: '', message: '' });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFamilies();
  }, []);

  const fetchFamilies = async () => {
    try {
      const response = await axios.get(`${API_URL}/families`);
      setFamilies(response.data);
    } catch (error) {
      toast.error('فشل تحميل العائلات');
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      navigate('/login');
      return;
    }

    if (!donationData.amount || parseFloat(donationData.amount) <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }

    try {
      await axios.post(`${API_URL}/donations`, {
        type: 'family',
        target_id: selectedFamily.id,
        amount: parseFloat(donationData.amount),
        message: donationData.message
      });
      toast.success('تم تسجيل تبرعك بنجاح! شكراً لك');
      setShowDonateDialog(false);
      setDonationData({ amount: '', message: '' });
      setSelectedFamily(null);
    } catch (error) {
      toast.error('فشل تسجيل التبرع');
    }
  };

  if (loading) {
    return <LoadingLogo />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-emerald-900 mb-4" data-testid="page-title">كفالة العائلات</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              ساهم في كفالة عائلة محتاجة من خلال دعم مالي شهري يساعدهم في تلبية احتياجاتهم الأساسية
            </p>
          </div>

          {families.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600">لا توجد عائلات متاحة حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {families.map((family) => (
                <div 
                  key={family.id} 
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  data-testid={`family-card-${family.id}`}
                >
                  <div className="h-48 bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                    {family.image ? (
                      <img src={family.image} alt={family.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-20 h-20 text-emerald-700" />
                    )}
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{family.name}</h3>
                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <Users className="w-5 h-5" />
                      <span>عدد الأفراد: {family.members_count}</span>
                    </div>
                    <p className="text-gray-700 mb-4 line-clamp-3">{family.description}</p>
                    
                    <div className="bg-emerald-50 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">الحاجة الشهرية:</span>
                        <span className="text-xl font-bold text-emerald-700">{family.monthly_need.toLocaleString()} ل.س</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        family.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {family.status === 'active' ? 'نشط' : 'مكفول'}
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        setSelectedFamily(family);
                        setShowDonateDialog(true);
                      }}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 gap-2"
                      data-testid={`donate-btn-${family.id}`}
                    >
                      <Heart className="w-5 h-5" />
                      تبرع الآن
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Donate Dialog */}
      <Dialog open={showDonateDialog} onOpenChange={setShowDonateDialog}>
        <DialogContent className="sm:max-w-md" data-testid="donate-dialog">
          <DialogHeader>
            <DialogTitle className="text-right text-2xl">تبرع لعائلة {selectedFamily?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="amount" className="text-right block mb-2">المبلغ (ليرة سورية)</Label>
              <Input
                id="amount"
                type="number"
                value={donationData.amount}
                onChange={(e) => setDonationData({ ...donationData, amount: e.target.value })}
                placeholder="10000"
                className="text-right"
                data-testid="amount-input"
              />
            </div>
            <div>
              <Label htmlFor="message" className="text-right block mb-2">رسالة (اختياري)</Label>
              <Textarea
                id="message"
                value={donationData.message}
                onChange={(e) => setDonationData({ ...donationData, message: e.target.value })}
                placeholder="اترك رسالة للعائلة..."
                className="text-right"
                rows={4}
                data-testid="message-input"
              />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800 text-right">
                ملاحظة: سيتم تسجيل تبرعك وسنتواصل معك لاحقاً لإتمام عملية الدفع
              </p>
            </div>
            <Button
              onClick={handleDonate}
              className="w-full bg-emerald-700 hover:bg-emerald-800"
              data-testid="confirm-donate-btn"
            >
              تأكيد التبرع
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default FamiliesPage;
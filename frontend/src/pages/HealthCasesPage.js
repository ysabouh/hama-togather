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
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Heart, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HealthCasesPage = () => {
  const [healthCases, setHealthCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showDonateDialog, setShowDonateDialog] = useState(false);
  const [donationData, setDonationData] = useState({ amount: '', message: '' });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchHealthCases();
  }, []);

  const fetchHealthCases = async () => {
    try {
      const response = await axios.get(`${API_URL}/health-cases`);
      setHealthCases(response.data);
    } catch (error) {
      toast.error('فشل تحميل الحالات الصحية');
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
        type: 'health',
        target_id: selectedCase.id,
        amount: parseFloat(donationData.amount),
        message: donationData.message
      });
      toast.success('تم تسجيل تبرعك بنجاح! شكراً لك');
      setShowDonateDialog(false);
      setDonationData({ amount: '', message: '' });
      setSelectedCase(null);
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
            <h1 className="text-4xl font-bold text-rose-900 mb-4" data-testid="page-title">الرعاية الصحية</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              ساهم في علاج المرضى وتوفير الأدوية والرعاية الصحية للمحتاجين
            </p>
          </div>

          {healthCases.length === 0 ? (
            <div className="text-center py-20">
              <Activity className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600">لا توجد حالات صحية متاحة حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {healthCases.map((healthCase) => {
                const progress = (healthCase.collected_amount / healthCase.required_amount) * 100;
                return (
                  <div 
                    key={healthCase.id} 
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                    data-testid={`health-case-card-${healthCase.id}`}
                  >
                    <div className="h-48 bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center">
                      {healthCase.image ? (
                        <img src={healthCase.image} alt={healthCase.patient_name} className="w-full h-full object-cover" />
                      ) : (
                        <Activity className="w-20 h-20 text-rose-700" />
                      )}
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{healthCase.patient_name}</h3>
                      <p className="text-gray-600 mb-3">العمر: {healthCase.age} سنة</p>
                      <div className="bg-rose-50 rounded-lg p-3 mb-4">
                        <p className="text-sm font-semibold text-rose-800">الحالة: {healthCase.condition}</p>
                      </div>
                      <p className="text-gray-700 mb-4 line-clamp-3">{healthCase.description}</p>
                      
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">المبلغ المطلوب:</span>
                          <span className="font-bold text-gray-900">{healthCase.required_amount.toLocaleString()} ل.س</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">المبلغ المجمع:</span>
                          <span className="font-bold text-rose-700">{healthCase.collected_amount.toLocaleString()} ل.س</span>
                        </div>
                        <Progress value={progress} className="h-3" />
                        <p className="text-xs text-gray-500 mt-1 text-right">{progress.toFixed(1)}% مكتمل</p>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          healthCase.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {healthCase.status === 'active' ? 'نشط' : 'مكتمل'}
                        </div>
                      </div>

                      <Button
                        onClick={() => {
                          setSelectedCase(healthCase);
                          setShowDonateDialog(true);
                        }}
                        className="w-full bg-rose-700 hover:bg-rose-800 gap-2"
                        disabled={healthCase.status !== 'active'}
                        data-testid={`donate-btn-${healthCase.id}`}
                      >
                        <Heart className="w-5 h-5" />
                        ساعد في العلاج
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Donate Dialog */}
      <Dialog open={showDonateDialog} onOpenChange={setShowDonateDialog}>
        <DialogContent className="sm:max-w-md" data-testid="donate-dialog">
          <DialogHeader>
            <DialogTitle className="text-right text-2xl">المساهمة في علاج {selectedCase?.patient_name}</DialogTitle>
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
                placeholder="رسالة دعم للمريض..."
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
              className="w-full bg-rose-700 hover:bg-rose-800"
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

export default HealthCasesPage;
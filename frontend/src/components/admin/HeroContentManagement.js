import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  Save, 
  Loader2,
  BookOpen,
  Play
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HeroContentManagement = ({ heroContent, setHeroContent, onSave }) => {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/hero-content`, heroContent, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('تم حفظ التعديلات بنجاح');
      onSave?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/upload-image`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHeroContent({ ...heroContent, [field]: res.data.image_url });
      toast.success('تم رفع الصورة بنجاح');
    } catch (error) {
      toast.error('فشل رفع الصورة');
    }
  };

  const addQuote = () => {
    const quotes = heroContent?.quotes || [];
    quotes.push({ text: '', ref: '', author: '' });
    setHeroContent({ ...heroContent, quotes });
  };

  const removeQuote = (index) => {
    const quotes = [...(heroContent?.quotes || [])];
    quotes.splice(index, 1);
    setHeroContent({ ...heroContent, quotes });
  };

  const updateQuote = (index, field, value) => {
    const quotes = [...(heroContent?.quotes || [])];
    quotes[index] = { ...quotes[index], [field]: value };
    setHeroContent({ ...heroContent, quotes });
  };

  if (!heroContent) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
        <p className="text-gray-500 mt-2">جاري تحميل المحتوى...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-emerald-600" />
          إدارة القسم الأول (Hero Section & Video)
        </h2>
        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
          {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
          حفظ التعديلات
        </Button>
      </div>

      <div className="space-y-8">
        {/* Hero Section */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h3 className="text-xl font-bold mb-4 text-emerald-700">Hero Section - القسم الرئيسي</h3>
          
          <div className="space-y-4">
            <div>
              <Label>العنوان الرئيسي</Label>
              <Input
                value={heroContent.title || ''}
                onChange={(e) => setHeroContent({ ...heroContent, title: e.target.value })}
                className="text-lg font-bold"
              />
            </div>
            
            <div>
              <Label>الوصف</Label>
              <Textarea
                value={heroContent.subtitle || ''}
                onChange={(e) => setHeroContent({ ...heroContent, subtitle: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>نص الزر</Label>
                <Input
                  value={heroContent.cta_text || ''}
                  onChange={(e) => setHeroContent({ ...heroContent, cta_text: e.target.value })}
                />
              </div>
              <div>
                <Label>رابط الزر</Label>
                <Input
                  value={heroContent.cta_link || ''}
                  onChange={(e) => setHeroContent({ ...heroContent, cta_link: e.target.value })}
                />
              </div>
            </div>
            
            {/* Background Image */}
            <div>
              <Label>صورة الخلفية</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'background_image')}
                />
                {heroContent.background_image && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setHeroContent({ ...heroContent, background_image: null })}
                  >
                    حذف
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">الأبعاد المثالية: 1920×1080 بكسل</p>
              {heroContent.background_image && (
                <img src={heroContent.background_image} alt="background" className="mt-2 h-32 rounded" />
              )}
            </div>
          </div>
        </div>

        {/* Quotes Section */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-emerald-700">العبارات الإلهامية</h3>
            <Button size="sm" onClick={addQuote} className="bg-emerald-700">
              <Plus className="w-4 h-4 ml-1" />
              إضافة عبارة
            </Button>
          </div>
          
          <div className="space-y-4">
            {(heroContent.quotes || []).map((quote, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-medium text-gray-500">عبارة {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuote(index)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label>النص</Label>
                    <Textarea
                      value={quote.text || ''}
                      onChange={(e) => updateQuote(index, 'text', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>المرجع</Label>
                      <Input
                        value={quote.ref || ''}
                        onChange={(e) => updateQuote(index, 'ref', e.target.value)}
                        placeholder="مثال: سورة البقرة - آية 177"
                      />
                    </div>
                    <div>
                      <Label>المصدر/الكاتب</Label>
                      <Input
                        value={quote.author || ''}
                        onChange={(e) => updateQuote(index, 'author', e.target.value)}
                        placeholder="مثال: القرآن الكريم"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {(!heroContent.quotes || heroContent.quotes.length === 0) && (
              <p className="text-center text-gray-500 py-4">لا توجد عبارات. اضغط "إضافة عبارة" لإضافة عبارة جديدة.</p>
            )}
          </div>
        </div>

        {/* Video Section */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h3 className="text-xl font-bold mb-4 text-emerald-700 flex items-center gap-2">
            <Play className="w-5 h-5" />
            قسم الفيديو
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label>عنوان القسم</Label>
              <Input
                value={heroContent.video_title || ''}
                onChange={(e) => setHeroContent({ ...heroContent, video_title: e.target.value })}
              />
            </div>
            <div>
              <Label>وصف القسم</Label>
              <Textarea
                value={heroContent.video_description || ''}
                onChange={(e) => setHeroContent({ ...heroContent, video_description: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label>رابط الفيديو (YouTube)</Label>
              <Input
                value={heroContent.video_url || ''}
                onChange={(e) => setHeroContent({ ...heroContent, video_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                dir="ltr"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroContentManagement;

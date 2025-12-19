import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Heart,
  Gift,
  Percent,
  Calendar,
  Users,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TakafulCalendarModal = ({ isOpen, onClose, provider, providerType }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const daysOfWeek = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  useEffect(() => {
    if (isOpen && provider) {
      fetchBenefits();
      fetchStats();
    }
  }, [isOpen, provider, currentDate]);

  const fetchBenefits = async () => {
    if (!provider) return;
    
    setLoading(true);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      const response = await axios.get(
        `${API_URL}/takaful-benefits/${providerType}/${provider.id}`,
        { params: { month, year } }
      );
      setBenefits(response.data || []);
    } catch (error) {
      console.error('Error fetching benefits:', error);
      setBenefits([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!provider) return;
    
    try {
      const response = await axios.get(
        `${API_URL}/takaful-benefits/stats/${providerType}/${provider.id}`
      );
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getBenefitsForDay = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return benefits.filter(b => b.benefit_date === dateStr);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 bg-gray-50 rounded-lg"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayBenefits = getBenefitsForDay(day);
      const isToday = 
        day === new Date().getDate() && 
        currentDate.getMonth() === new Date().getMonth() && 
        currentDate.getFullYear() === new Date().getFullYear();

      days.push(
        <div
          key={day}
          className={`h-24 p-1 rounded-lg border transition-all ${
            isToday 
              ? 'border-red-500 bg-red-50' 
              : dayBenefits.length > 0 
                ? 'border-green-300 bg-green-50' 
                : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}
        >
          <div className={`text-sm font-bold mb-1 ${isToday ? 'text-red-600' : 'text-gray-700'}`}>
            {day}
          </div>
          <div className="space-y-0.5 overflow-y-auto max-h-16">
            {dayBenefits.map((benefit, idx) => (
              <div
                key={idx}
                className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${
                  benefit.benefit_type === 'free'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
                title={`${benefit.benefit_type === 'free' ? 'مجاني' : `خصم ${benefit.discount_percentage}%`} - أسرة رقم ${benefit.family_number}`}
              >
                {benefit.benefit_type === 'free' ? (
                  <Gift className="w-2.5 h-2.5" />
                ) : (
                  <Percent className="w-2.5 h-2.5" />
                )}
                <span className="truncate font-medium">
                  {benefit.family_number}
                  {benefit.benefit_type === 'discount' && ` (${benefit.discount_percentage}%)`}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  if (!isOpen) return null;

  const providerName = provider?.full_name || provider?.name || 'مقدم الخدمة';
  const providerTypeLabel = providerType === 'doctor' ? 'الطبيب' : 
                            providerType === 'pharmacy' ? 'الصيدلية' : 'المخبر';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Heart className="w-6 h-6 fill-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">رزنامة التكافل</h2>
                <p className="text-red-100 text-sm">{providerTypeLabel}: {providerName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="flex gap-6 mt-4">
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                <Users className="w-5 h-5" />
                <span className="font-bold">{stats.total_benefits}</span>
                <span className="text-red-100 text-sm">إجمالي الاستفادات</span>
              </div>
              <div className="flex items-center gap-2 bg-green-500/30 px-4 py-2 rounded-lg">
                <Gift className="w-5 h-5" />
                <span className="font-bold">{stats.free_benefits}</span>
                <span className="text-red-100 text-sm">مجانية</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-500/30 px-4 py-2 rounded-lg">
                <Percent className="w-5 h-5" />
                <span className="font-bold">{stats.discount_benefits}</span>
                <span className="text-red-100 text-sm">خصومات</span>
              </div>
            </div>
          )}
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between p-4 border-b">
          <Button
            variant="outline"
            size="sm"
            onClick={prevMonth}
            className="flex items-center gap-1"
          >
            <ChevronRight className="w-4 h-4" />
            السابق
          </Button>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-red-500" />
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={nextMonth}
            className="flex items-center gap-1"
          >
            التالي
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-280px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <>
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {daysOfWeek.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-bold text-gray-600 py-2 bg-gray-100 rounded-lg"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-2">
                {renderCalendar()}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-4 h-4 bg-green-100 rounded border border-green-300"></div>
                  <Gift className="w-4 h-4 text-green-600" />
                  <span>معاينة مجانية</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-4 h-4 bg-blue-100 rounded border border-blue-300"></div>
                  <Percent className="w-4 h-4 text-blue-600" />
                  <span>خصم</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-4 h-4 bg-red-50 rounded border border-red-500"></div>
                  <span>اليوم</span>
                </div>
              </div>

              {/* Info note */}
              <div className="flex items-start gap-2 mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                <Info className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <p>
                  الأرقام المعروضة هي أرقام الأسر المستفيدة من برنامج التكافل. 
                  اضغط على أي يوم لرؤية تفاصيل الاستفادات.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TakafulCalendarModal;

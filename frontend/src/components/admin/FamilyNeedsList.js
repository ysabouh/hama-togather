import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ShoppingCart, DollarSign, User, Calendar, Edit, UserX, UserCheck } from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * مكون عرض قائمة احتياجات العائلة
 * يعرض الاحتياجات في صفحة تفاصيل العائلة مع إمكانية التعديل
 */
const FamilyNeedsList = ({ familyId, onManageClick }) => {
  const [familyNeeds, setFamilyNeeds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (familyId) {
      fetchFamilyNeeds();
    }
  }, [familyId]);

  const fetchFamilyNeeds = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/families/${familyId}/needs`);
      setFamilyNeeds(response.data);
    } catch (error) {
      console.error('Error fetching family needs:', error);
      toast.error('فشل تحميل احتياجات العائلة');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (needRecord) => {
    const currentStatus = needRecord.status;
    let newStatus;
    
    // تبديل الحالة
    if (currentStatus === 'pending') {
      newStatus = 'fulfilled';
    } else if (currentStatus === 'fulfilled') {
      newStatus = 'cancelled';
    } else {
      newStatus = 'pending';
    }

    const loadingToast = toast.loading('جارٍ تحديث الحالة...');

    try {
      await axios.put(`${API_URL}/families/${familyId}/needs/${needRecord.id}`, {
        status: newStatus
      });
      toast.dismiss(loadingToast);
      toast.success('تم تحديث الحالة بنجاح');
      fetchFamilyNeeds();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.detail || 'فشل تحديث الحالة');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'معلق', className: 'bg-yellow-100 text-yellow-800' },
      fulfilled: { label: 'تم التنفيذ', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'ملغي', className: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.className}`}>{config.label}</span>;
  };

  const formatDateTimeGregorian = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // حساب المجموع الكلي
  const totalAmount = familyNeeds.reduce((sum, need) => sum + (need.estimated_amount || 0), 0);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            احتياجات العائلة
          </h3>
        </div>
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-500">جاري تحميل الاحتياجات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 w-full px-0">
      <div className="mb-6 px-6">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2 border-b-4 border-emerald-600 pb-3">
          <ShoppingCart className="w-6 h-6 text-emerald-600" />
          احتياجات العائلة
          <span className="text-lg font-normal text-gray-600">({familyNeeds.length})</span>
        </h3>
      </div>

      {familyNeeds.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">لا توجد احتياجات مسجلة لهذه العائلة</p>
          <p className="text-gray-400 text-sm">قم بإضافة احتياجات جديدة من خلال dialog الإدارة</p>
        </div>
      ) : (
        <>
          {/* ملخص المبالغ */}
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-800 font-bold text-xl">المجموع الكلي للاحتياجات:</span>
              <div className="flex items-center gap-2">
                <DollarSign className="w-7 h-7 text-green-600" />
                <span className="text-4xl font-bold text-green-700">
                  {totalAmount.toLocaleString('ar-SA')}
                </span>
                <span className="text-lg text-gray-600">ل.س</span>
              </div>
            </div>
          </div>

          {/* جدول الاحتياجات - عرض كامل */}
          <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-max border-collapse">
                <thead className="bg-gradient-to-r from-emerald-600 to-teal-600">
                  <tr>
                    <th className="px-4 py-4 text-center text-sm font-bold text-white border-r border-emerald-500">#</th>
                    <th className="px-4 py-4 text-center text-sm font-bold text-white border-r border-emerald-500">الاحتياج</th>
                    <th className="px-4 py-4 text-center text-sm font-bold text-white border-r border-emerald-500">الوصف</th>
                    <th className="px-4 py-4 text-center text-sm font-bold text-white border-r border-emerald-500">المبلغ التقديري</th>
                    <th className="px-4 py-4 text-center text-sm font-bold text-white border-r border-emerald-500">الحالة</th>
                    <th className="px-4 py-4 text-center text-sm font-bold text-white border-r border-emerald-500">ملاحظات</th>
                    <th className="px-4 py-4 text-center text-sm font-bold text-white border-r border-emerald-500">تاريخ الإضافة</th>
                    <th className="px-4 py-4 text-center text-sm font-bold text-white border-r border-emerald-500">أضيف بواسطة</th>
                    <th className="px-4 py-4 text-center text-sm font-bold text-white border-r border-emerald-500">تاريخ التعديل</th>
                    <th className="px-4 py-4 text-center text-sm font-bold text-white border-r border-emerald-500">عُدل بواسطة</th>
                    <th className="px-4 py-4 text-center text-sm font-bold text-white">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {familyNeeds.map((needRecord, index) => (
                    <tr key={needRecord.id} className="hover:bg-emerald-50 transition-colors border-b border-gray-200">
                      <td className="px-4 py-4 text-sm text-gray-700 text-center font-bold border-r border-gray-200">{index + 1}</td>
                      
                      {/* اسم الاحتياج */}
                      <td className="px-4 py-4 text-sm text-gray-900 text-center font-bold border-r border-gray-200">
                        {needRecord.need?.name || '-'}
                      </td>
                      
                      {/* الوصف */}
                      <td className="px-4 py-4 text-sm text-gray-600 text-center min-w-[200px] border-r border-gray-200">
                        <div className="line-clamp-2" title={needRecord.need?.description}>
                          {needRecord.need?.description || '-'}
                        </div>
                      </td>
                      
                      {/* المبلغ التقديري */}
                      <td className="px-4 py-4 text-sm text-center border-r border-gray-200">
                        <div className="flex items-center justify-center gap-1">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-bold text-green-700 text-base">
                            {needRecord.estimated_amount?.toLocaleString('ar-SA') || 0}
                          </span>
                        </div>
                      </td>
                      
                      {/* الحالة */}
                      <td className="px-4 py-4 text-sm text-center border-r border-gray-200">
                        {getStatusBadge(needRecord.status)}
                      </td>
                      
                      {/* الملاحظات */}
                      <td className="px-4 py-4 text-sm text-gray-600 text-center min-w-[200px] border-r border-gray-200">
                        <div className="line-clamp-2" title={needRecord.notes}>
                          {needRecord.notes || '-'}
                        </div>
                      </td>
                      
                      {/* تاريخ الإضافة - ميلادي */}
                      <td className="px-4 py-4 text-sm text-gray-600 text-center whitespace-nowrap border-r border-gray-200" dir="ltr">
                        <div className="flex items-center justify-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-xs font-medium">
                            {formatDateTimeGregorian(needRecord.created_at)}
                          </span>
                        </div>
                      </td>
                      
                      {/* أضيف بواسطة */}
                      <td className="px-4 py-4 text-sm text-emerald-700 text-center border-r border-gray-200">
                        <div className="flex items-center justify-center gap-1">
                          <User className="w-4 h-4" />
                          <span className="text-xs font-bold">
                            {needRecord.created_by_user?.full_name || '-'}
                          </span>
                        </div>
                      </td>
                      
                      {/* تاريخ التعديل - ميلادي */}
                      <td className="px-4 py-4 text-sm text-gray-600 text-center whitespace-nowrap border-r border-gray-200" dir="ltr">
                        <div className="flex items-center justify-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-xs font-medium">
                            {needRecord.updated_at ? formatDateTimeGregorian(needRecord.updated_at) : '-'}
                          </span>
                        </div>
                      </td>
                      
                      {/* عُدل بواسطة */}
                      <td className="px-4 py-4 text-sm text-blue-700 text-center border-r border-gray-200">
                        <div className="flex items-center justify-center gap-1">
                          <User className="w-4 h-4" />
                          <span className="text-xs font-bold">
                            {needRecord.updated_by_user?.full_name || '-'}
                          </span>
                        </div>
                      </td>
                      
                      {/* الإجراءات */}
                      <td className="px-4 py-4 text-sm text-center">
                        <div className="flex gap-2 justify-center">
                          {/* زر التعديل */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onManageClick(needRecord)}
                            className="text-blue-600 hover:bg-blue-50"
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          {/* زر تبديل الحالة */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(needRecord)}
                            className={
                              needRecord.status === 'pending' ? "text-green-600 hover:bg-green-50" :
                              needRecord.status === 'fulfilled' ? "text-red-600 hover:bg-red-50" :
                              "text-yellow-600 hover:bg-yellow-50"
                            }
                            title={
                              needRecord.status === 'pending' ? "تنفيذ" :
                              needRecord.status === 'fulfilled' ? "إلغاء" :
                              "إعادة للمعلق"
                            }
                          >
                            {needRecord.status === 'pending' ? <UserCheck className="w-4 h-4" /> : 
                             needRecord.status === 'fulfilled' ? <UserX className="w-4 h-4" /> :
                             <UserCheck className="w-4 h-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FamilyNeedsList;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ShoppingCart, DollarSign, User, Calendar, Plus, Edit, Trash2 } from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * مكون عرض قائمة احتياجات العائلة
 * يعرض الاحتياجات في صفحة تفاصيل العائلة
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'معلق', className: 'bg-yellow-100 text-yellow-800' },
      fulfilled: { label: 'تم التنفيذ', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'ملغي', className: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.className}`}>{config.label}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6 shadow-sm mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-emerald-900 flex items-center gap-2 border-b-2 border-emerald-300 pb-2">
          <ShoppingCart className="w-5 h-5 text-emerald-700" />
          احتياجات العائلة
          <span className="text-sm font-normal text-emerald-700">({familyNeeds.length})</span>
        </h3>
        <Button 
          onClick={onManageClick}
          className="bg-emerald-600 hover:bg-emerald-700"
          size="sm"
        >
          <Plus className="w-4 h-4 ml-1" />
          إدارة الاحتياجات
        </Button>
      </div>

      {familyNeeds.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-emerald-200">
          <ShoppingCart className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">لا توجد احتياجات مسجلة لهذه العائلة</p>
          <Button 
            onClick={onManageClick}
            variant="outline"
            size="sm"
            className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
          >
            <Plus className="w-4 h-4 ml-1" />
            إضافة احتياج
          </Button>
        </div>
      ) : (
        <>
          {/* ملخص المبالغ */}
          <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border-r-4 border-emerald-600">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-semibold">المجموع الكلي للاحتياجات:</span>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-green-700">
                  {totalAmount.toLocaleString('ar-SA')}
                </span>
                <span className="text-sm text-gray-500">ل.س</span>
              </div>
            </div>
          </div>

          {/* جدول الاحتياجات */}
          <div className="bg-white rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-emerald-100">
                  <tr>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-emerald-900">#</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-emerald-900">الاحتياج</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-emerald-900">المبلغ التقديري</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-emerald-900">الحالة</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-emerald-900">تاريخ الإضافة</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-emerald-900">أضيف بواسطة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {familyNeeds.map((needRecord, index) => (
                    <tr key={needRecord.id} className="hover:bg-emerald-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600 text-center font-medium">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center font-semibold">
                        {needRecord.need?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex items-center justify-center gap-1">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-bold text-green-700">
                            {needRecord.estimated_amount?.toLocaleString('ar-SA') || 0}
                          </span>
                          <span className="text-xs text-gray-500">ل.س</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {getStatusBadge(needRecord.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(needRecord.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <User className="w-3 h-3" />
                          <span className="text-xs">
                            {needRecord.created_by_user?.full_name || '-'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ملاحظات إضافية إذا وُجدت */}
          {familyNeeds.some(n => n.notes) && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">ملاحظات:</h4>
              <div className="space-y-2">
                {familyNeeds
                  .filter(n => n.notes)
                  .map((needRecord, index) => (
                    <div key={index} className="text-xs text-blue-800 bg-white rounded p-2">
                      <span className="font-semibold">{needRecord.need?.name}:</span> {needRecord.notes}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FamilyNeedsList;

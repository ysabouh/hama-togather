import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Edit, UserX, UserCheck, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

/**
 * مكون جدول البيانات المرجعية
 * يستخدم لعرض وإدارة الجداول البسيطة مثل أدوار المستخدمين، فئات العائلات، مستويات الدخل، إلخ
 */
const ReferenceDataTable = ({
  title,
  data = [],
  loading = false,
  showInactive,
  onToggleInactive,
  onEdit,
  onCreate,
  onToggleStatus,
  columns = [],
  createButtonText = 'إضافة'
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <Button onClick={onCreate} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 ml-2" />
          {createButtonText}
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          id="show_inactive_items"
          checked={showInactive}
          onChange={(e) => onToggleInactive(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300"
        />
        <Label htmlFor="show_inactive_items" className="text-sm cursor-pointer">
          عرض العناصر غير النشطة
        </Label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">#</th>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الحالة</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data
              .filter(item => showInactive || item.is_active !== false)
              .map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600 text-center font-medium">{index + 1}</td>
                {columns.map((col) => (
                  <td 
                    key={col.key} 
                    className={`px-4 py-3 text-sm text-center ${col.className || 'text-gray-900'}`}
                    dir={col.dir || 'rtl'}
                  >
                    {col.render ? col.render(item) : (item[col.key] || '-')}
                  </td>
                ))}
                <td className="px-4 py-3 text-sm text-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${item.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {item.is_active !== false ? 'نشط' : 'غير نشط'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(item)}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onToggleStatus(item)}
                      className={item.is_active !== false ? "text-orange-600 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}
                      title={item.is_active !== false ? "إيقاف" : "تفعيل"}
                    >
                      {item.is_active !== false ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">جاري تحميل البيانات...</p>
          </div>
        ) : data.filter(item => showInactive || item.is_active !== false).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {showInactive ? 'لا توجد بيانات مسجلة حالياً' : 'لا توجد عناصر نشطة حالياً'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferenceDataTable;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Select from 'react-select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Loader2, ShoppingCart, DollarSign, User, Calendar } from 'lucide-react';
import { customSelectStyles } from '@/utils/adminHelpers';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * مكون إدارة احتياجات العائلة
 * يسمح بإضافة وتعديل وحذف احتياجات لعائلة معينة
 */
const FamilyNeedsManager = ({ familyId, isOpen, onClose }) => {
  const [familyNeeds, setFamilyNeeds] = useState([]);
  const [availableNeeds, setAvailableNeeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'
  const [currentNeedRecord, setCurrentNeedRecord] = useState(null);
  const [formData, setFormData] = useState({
    need_id: '',
    estimated_amount: 0,
    notes: '',
    status: 'pending'
  });

  useEffect(() => {
    if (isOpen && familyId) {
      fetchFamilyNeeds();
      fetchAvailableNeeds();
    }
  }, [isOpen, familyId]);

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

  const fetchAvailableNeeds = async () => {
    try {
      const response = await axios.get(`${API_URL}/needs`);
      setAvailableNeeds(response.data.filter(n => n.is_active !== false));
    } catch (error) {
      console.error('Error fetching needs:', error);
      toast.error('فشل تحميل قائمة الاحتياجات');
    }
  };

  const handleCreate = () => {
    setDialogMode('create');
    setFormData({
      need_id: '',
      estimated_amount: 0,
      notes: '',
      status: 'pending'
    });
    setCurrentNeedRecord(null);
    setShowDialog(true);
  };

  const handleEdit = (needRecord) => {
    setDialogMode('edit');
    setFormData({
      need_id: needRecord.need_id,
      estimated_amount: needRecord.estimated_amount || 0,
      notes: needRecord.notes || '',
      status: needRecord.status || 'pending'
    });
    setCurrentNeedRecord(needRecord);
    setShowDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.need_id) {
      toast.error('الرجاء اختيار الاحتياج');
      return;
    }

    const loadingToast = toast.loading(dialogMode === 'create' ? 'جارٍ الإضافة...' : 'جارٍ التحديث...');

    try {
      if (dialogMode === 'create') {
        await axios.post(`${API_URL}/families/${familyId}/needs`, {
          need_id: formData.need_id,
          estimated_amount: parseFloat(formData.estimated_amount) || 0,
          notes: formData.notes,
          status: formData.status
        });
        toast.dismiss(loadingToast);
        toast.success('تمت إضافة الاحتياج بنجاح');
      } else {
        await axios.put(`${API_URL}/families/${familyId}/needs/${currentNeedRecord.id}`, {
          estimated_amount: parseFloat(formData.estimated_amount) || 0,
          notes: formData.notes,
          status: formData.status
        });
        toast.dismiss(loadingToast);
        toast.success('تم تحديث الاحتياج بنجاح');
      }

      setShowDialog(false);
      fetchFamilyNeeds();
    } catch (error) {
      console.error('Error saving family need:', error);
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.detail || 'فشلت العملية');
    }
  };

  const handleDelete = async (needRecordId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الاحتياج؟')) return;

    const loadingToast = toast.loading('جارٍ الحذف...');

    try {
      await axios.delete(`${API_URL}/families/${familyId}/needs/${needRecordId}`);
      toast.dismiss(loadingToast);
      toast.success('تم حذف الاحتياج بنجاح');
      fetchFamilyNeeds();
    } catch (error) {
      console.error('Error deleting family need:', error);
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.detail || 'فشل الحذف');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'معلق', className: 'bg-yellow-100 text-yellow-800' },
      fulfilled: { label: 'تم التنفيذ', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'ملغي', className: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`px-2 py-1 rounded-full text-xs ${config.className}`}>{config.label}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const timeStr = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `${dateStr} ${timeStr}`;
  };

  // تصفية الاحتياجات المتاحة (إزالة المضافة بالفعل)
  const getAvailableNeedsForSelect = () => {
    if (dialogMode === 'edit') {
      // في وضع التعديل، نعرض الاحتياج الحالي فقط
      const currentNeed = availableNeeds.find(n => n.id === formData.need_id);
      return currentNeed ? [currentNeed] : [];
    }
    
    // في وضع الإضافة، نزيل الاحتياجات المضافة بالفعل
    const addedNeedIds = familyNeeds.map(fn => fn.need_id);
    return availableNeeds.filter(n => !addedNeedIds.includes(n.id));
  };

  const needsSelectOptions = getAvailableNeedsForSelect().map(need => ({
    value: need.id,
    label: need.name
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-right flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-emerald-600" />
            إدارة احتياجات العائلة
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          {/* زر الإضافة */}
          <div className="mb-4 flex justify-between items-center">
            <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 ml-2" />
              إضافة احتياج
            </Button>
            <span className="text-sm text-gray-600">
              عدد الاحتياجات: {familyNeeds.length}
            </span>
          </div>

          {/* جدول الاحتياجات */}
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
              <p className="text-gray-500">جاري تحميل الاحتياجات...</p>
            </div>
          ) : familyNeeds.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">لا توجد احتياجات مسجلة لهذه العائلة</p>
              <p className="text-sm text-gray-400 mt-1">اضغط على "إضافة احتياج" للبدء</p>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">#</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الاحتياج</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">المبلغ التقديري</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الحالة</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">أنشأ بواسطة</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">تاريخ الإنشاء</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {familyNeeds.map((needRecord, index) => (
                    <tr key={needRecord.id} className="hover:bg-gray-50">
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
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <User className="w-3 h-3" />
                          {needRecord.created_by_user?.full_name || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(needRecord.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(needRecord)}
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(needRecord.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dialog للإضافة/التعديل */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-right">
                {dialogMode === 'create' ? 'إضافة احتياج للعائلة' : 'تعديل احتياج العائلة'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="need_id">الاحتياج *</Label>
                <Select
                  id="need_id"
                  options={needsSelectOptions}
                  value={needsSelectOptions.find(opt => opt.value === formData.need_id)}
                  onChange={(selected) => setFormData({ ...formData, need_id: selected?.value || '' })}
                  styles={customSelectStyles}
                  placeholder="اختر الاحتياج..."
                  isDisabled={dialogMode === 'edit'}
                  required
                />
              </div>

              <div>
                <Label htmlFor="estimated_amount">المبلغ التقديري (ل.س) *</Label>
                <Input
                  id="estimated_amount"
                  type="number"
                  value={formData.estimated_amount}
                  onChange={(e) => setFormData({ ...formData, estimated_amount: e.target.value })}
                  placeholder="0"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div>
                <Label htmlFor="status">الحالة</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="pending">معلق</option>
                  <option value="fulfilled">تم التنفيذ</option>
                  <option value="cancelled">ملغي</option>
                </select>
              </div>

              <div>
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="أي ملاحظات إضافية..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  {dialogMode === 'create' ? 'إضافة' : 'حفظ'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* زر الإغلاق الرئيسي */}
        <div className="flex justify-center pt-4 border-t">
          <Button onClick={onClose} variant="outline" className="px-8">
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FamilyNeedsManager;

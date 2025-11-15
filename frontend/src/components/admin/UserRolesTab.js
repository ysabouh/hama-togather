import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import ReferenceDataTable from './ReferenceDataTable';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const UserRolesTab = ({ userRoles, loading, onDataChange }) => {
  const [showInactive, setShowInactive] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    is_active: true
  });

  const handleCreate = () => {
    setDialogMode('create');
    setFormData({
      name: '',
      display_name: '',
      description: '',
      is_active: true
    });
    setShowDialog(true);
  };

  const handleEdit = (role) => {
    setDialogMode('edit');
    setFormData(role);
    setShowDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.display_name) {
      toast.error('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    const loadingToast = toast.loading(dialogMode === 'create' ? 'جارٍ الإضافة...' : 'جارٍ التحديث...');
    
    try {
      if (dialogMode === 'create') {
        await axios.post(`${API_URL}/user-roles`, formData);
        toast.dismiss(loadingToast);
        toast.success('تمت الإضافة بنجاح');
      } else {
        await axios.put(`${API_URL}/user-roles/${formData.id}`, formData);
        toast.dismiss(loadingToast);
        toast.success('تم التحديث بنجاح');
      }
      
      setShowDialog(false);
      onDataChange();
    } catch (error) {
      console.error('Error saving user role:', error);
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.detail || 'فشلت العملية');
    }
  };

  const handleToggleStatus = async (role) => {
    const action = role.is_active !== false ? 'إيقاف' : 'تفعيل';
    if (!window.confirm(`هل تريد ${action} هذا النوع؟`)) return;
    
    try {
      await axios.put(`${API_URL}/user-roles/${role.id}/toggle-status`);
      toast.success(`تم ${action} النوع بنجاح`);
      onDataChange();
    } catch (error) {
      toast.error(error.response?.data?.detail || `فشل ${action} النوع`);
    }
  };

  const columns = [
    { key: 'display_name', label: 'الاسم المعروض', className: 'text-gray-900 font-medium' },
    { key: 'name', label: 'اسم الدور (بالإنجليزية)', className: 'text-gray-600', dir: 'ltr' },
    { key: 'description', label: 'الوصف', className: 'text-gray-600' }
  ];

  return (
    <>
      <ReferenceDataTable
        title="أنواع المستخدمين"
        data={userRoles}
        loading={loading}
        showInactive={showInactive}
        onToggleInactive={setShowInactive}
        onEdit={handleEdit}
        onCreate={handleCreate}
        onToggleStatus={handleToggleStatus}
        columns={columns}
        createButtonText="إضافة نوع مستخدم"
      />

      {/* Dialog للإضافة/التعديل */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">
              {dialogMode === 'create' ? 'إضافة نوع مستخدم جديد' : 'تعديل نوع المستخدم'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">اسم الدور (بالإنجليزية) *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="admin, user, etc."
                dir="ltr"
                required
              />
            </div>
            <div>
              <Label htmlFor="display_name">الاسم المعروض *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="مدير، مستخدم عادي، إلخ"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف دور المستخدم..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active !== false}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="is_active" className="cursor-pointer">نشط</Label>
            </div>
            <div className="flex gap-2 justify-end">
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
    </>
  );
};

export default UserRolesTab;

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

/**
 * مكون عام لإدارة الجداول المرجعية
 * يستخدم لإدارة البيانات البسيطة مثل المناصب، الأعمال، المؤهلات، فئات العائلات، إلخ
 */
const GenericReferenceTab = ({ 
  title,
  endpoint,
  data = [],
  loading = false,
  onDataChange,
  fields = [], // مصفوفة الحقول لتحديد نوع وترتيب الحقول في النموذج
  columns = [],
  createButtonText = 'إضافة',
  hasDescription = false,
  extraFields = [] // حقول إضافية مخصصة
}) => {
  const [showInactive, setShowInactive] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [formData, setFormData] = useState({});

  const initializeFormData = (mode, item = null) => {
    const initialData = { is_active: true };
    
    fields.forEach(field => {
      if (mode === 'create') {
        initialData[field.name] = field.defaultValue || '';
      } else if (item) {
        initialData[field.name] = item[field.name] || '';
      }
    });

    if (mode === 'edit' && item) {
      initialData.id = item.id;
      initialData.is_active = item.is_active;
    }

    return initialData;
  };

  const handleCreate = () => {
    setDialogMode('create');
    setFormData(initializeFormData('create'));
    setShowDialog(true);
  };

  const handleEdit = (item) => {
    setDialogMode('edit');
    setFormData(initializeFormData('edit', item));
    setShowDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // التحقق من الحقول المطلوبة
    const requiredFields = fields.filter(f => f.required);
    for (const field of requiredFields) {
      if (!formData[field.name]) {
        toast.error(`الرجاء ملء حقل ${field.label}`);
        return;
      }
    }

    const loadingToast = toast.loading(dialogMode === 'create' ? 'جارٍ الإضافة...' : 'جارٍ التحديث...');
    
    try {
      if (dialogMode === 'create') {
        await axios.post(`${API_URL}/${endpoint}`, formData);
        toast.dismiss(loadingToast);
        toast.success('تمت الإضافة بنجاح');
      } else {
        await axios.put(`${API_URL}/${endpoint}/${formData.id}`, formData);
        toast.dismiss(loadingToast);
        toast.success('تم التحديث بنجاح');
      }
      
      setShowDialog(false);
      onDataChange();
    } catch (error) {
      console.error(`Error saving ${endpoint}:`, error);
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.detail || 'فشلت العملية');
    }
  };

  const handleToggleStatus = async (item) => {
    const action = item.is_active !== false ? 'إيقاف' : 'تفعيل';
    if (!window.confirm(`هل تريد ${action} هذا العنصر؟`)) return;
    
    try {
      await axios.put(`${API_URL}/${endpoint}/${item.id}/toggle-status`);
      toast.success(`تم ${action} بنجاح`);
      onDataChange();
    } catch (error) {
      toast.error(error.response?.data?.detail || `فشل ${action}`);
    }
  };

  return (
    <>
      <ReferenceDataTable
        title={title}
        data={data}
        loading={loading}
        showInactive={showInactive}
        onToggleInactive={setShowInactive}
        onEdit={handleEdit}
        onCreate={handleCreate}
        onToggleStatus={handleToggleStatus}
        columns={columns}
        createButtonText={createButtonText}
      />

      {/* Dialog للإضافة/التعديل */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">
              {dialogMode === 'create' ? `إضافة ${title} جديد` : `تعديل ${title}`}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.name}>
                <Label htmlFor={field.name}>
                  {field.label} {field.required && '*'}
                </Label>
                {field.type === 'textarea' ? (
                  <Textarea
                    id={field.name}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    placeholder={field.placeholder}
                    rows={field.rows || 3}
                    required={field.required}
                  />
                ) : field.type === 'number' ? (
                  <Input
                    id={field.name}
                    type="number"
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: parseFloat(e.target.value) || 0 })}
                    placeholder={field.placeholder}
                    step={field.step || 'any'}
                    required={field.required}
                  />
                ) : (
                  <Input
                    id={field.name}
                    type={field.type || 'text'}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    placeholder={field.placeholder}
                    dir={field.dir || 'rtl'}
                    required={field.required}
                  />
                )}
              </div>
            ))}
            
            {/* حقول إضافية مخصصة */}
            {extraFields.map((ExtraField, index) => (
              <ExtraField 
                key={index} 
                formData={formData} 
                setFormData={setFormData} 
              />
            ))}

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

export default GenericReferenceTab;

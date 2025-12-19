import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Edit,
  Key,
  UserCheck,
  UserX,
  Loader2,
  X
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const UsersManagement = ({ 
  users = [], 
  neighborhoods = [],
  loading = false,
  onRefresh 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  
  // Edit User Dialog
  const [editDialog, setEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'user',
    neighborhood_id: '',
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  // Password Reset Dialog
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: ''
  });

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'user',
      neighborhood_id: user.neighborhood_id || '',
      is_active: user.is_active !== false
    });
    setEditDialog(true);
  };

  const handleSaveUser = async () => {
    if (!userFormData.full_name?.trim()) {
      toast.error('الاسم الكامل مطلوب');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/users/${editingUser.id}`, userFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('تم تحديث المستخدم بنجاح');
      setEditDialog(false);
      onRefresh?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل تحديث المستخدم');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = (user) => {
    setResetPasswordUser(user);
    setPasswordData({ new_password: '', confirm_password: '' });
    setResetPasswordDialog(true);
  };

  const handleSavePassword = async () => {
    if (!passwordData.new_password || passwordData.new_password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/users/${resetPasswordUser.id}/reset-password`, 
        { new_password: passwordData.new_password },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success('تم تغيير كلمة المرور بنجاح');
      setResetPasswordDialog(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل تغيير كلمة المرور');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const action = user.is_active !== false ? 'إيقاف' : 'تفعيل';
    if (!window.confirm(`هل تريد ${action} هذا المستخدم؟`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/users/${user.id}/toggle-status`, 
        { is_active: !user.is_active },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success(`تم ${action} المستخدم بنجاح`);
      onRefresh?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || `فشل ${action} المستخدم`);
    }
  };

  const getNeighborhoodName = (id) => {
    const n = neighborhoods.find(n => n.id === id);
    return n?.name || '-';
  };

  const getRoleLabel = (role) => {
    const roles = {
      'admin': 'مدير نظام',
      'committee_president': 'رئيس لجنة',
      'committee_member': 'موظف لجنة',
      'user': 'متبرع كريم'
    };
    return roles[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      'admin': 'bg-red-100 text-red-800',
      'committee_president': 'bg-blue-100 text-blue-800',
      'committee_member': 'bg-green-100 text-green-800',
      'user': 'bg-yellow-100 text-yellow-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const filteredUsers = users
    .filter(u => showInactive || u.is_active !== false)
    .filter(u => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        (u.full_name || '').toLowerCase().includes(query) ||
        (u.email || '').toLowerCase().includes(query) ||
        (u.phone || '').includes(query)
      );
    });

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-7 h-7 text-blue-600" />
          إدارة المستخدمين
        </h2>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="بحث في الاسم، البريد، أو الجوال..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="show_inactive_users"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          <Label htmlFor="show_inactive_users" className="text-sm cursor-pointer">
            عرض المستخدمين غير النشطين
          </Label>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full" data-testid="users-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">#</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الاسم الكامل</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">البريد الإلكتروني</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">رقم الجوال</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">نوع المستخدم</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الحي</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الحالة</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user, index) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600 text-center">{index + 1}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-center font-medium">{user.full_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600 text-center" dir="ltr">{user.email}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-center" dir="ltr">{user.phone || '-'}</td>
                <td className="px-4 py-3 text-sm text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-center">
                  {getNeighborhoodName(user.neighborhood_id)}
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active !== false ? 'نشط' : 'غير نشط'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditUser(user)}
                      className="text-blue-600 hover:bg-blue-50"
                      title="تعديل المعلومات"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResetPassword(user)}
                      className="text-purple-600 hover:bg-purple-50"
                      title="تغيير كلمة المرور"
                    >
                      <Key className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(user)}
                      className={user.is_active !== false 
                        ? "text-orange-600 hover:bg-orange-50" 
                        : "text-green-600 hover:bg-green-50"}
                      title={user.is_active !== false ? "إيقاف" : "تفعيل"}
                    >
                      {user.is_active !== false ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
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
            <p className="text-gray-500">جاري تحميل المستخدمين...</p>
          </div>
        ) : filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? 'لا توجد نتائج مطابقة للبحث' : 'لا يوجد مستخدمين'}
          </div>
        )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>الاسم الكامل *</Label>
              <Input
                value={userFormData.full_name}
                onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                dir="ltr"
              />
            </div>
            <div>
              <Label>رقم الجوال</Label>
              <Input
                value={userFormData.phone}
                onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                dir="ltr"
              />
            </div>
            <div>
              <Label>نوع المستخدم</Label>
              <select
                value={userFormData.role}
                onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="user">متبرع كريم</option>
                <option value="committee_member">موظف لجنة</option>
                <option value="committee_president">رئيس لجنة</option>
                <option value="admin">مدير نظام</option>
              </select>
            </div>
            <div>
              <Label>الحي</Label>
              <select
                value={userFormData.neighborhood_id}
                onChange={(e) => setUserFormData({ ...userFormData, neighborhood_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">-- اختر الحي --</option>
                {neighborhoods.map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="user_is_active"
                checked={userFormData.is_active}
                onChange={(e) => setUserFormData({ ...userFormData, is_active: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <Label htmlFor="user_is_active" className="cursor-pointer">نشط</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialog(false)}>إلغاء</Button>
            <Button onClick={handleSaveUser} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              حفظ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialog} onOpenChange={setResetPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تغيير كلمة المرور - {resetPasswordUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>كلمة المرور الجديدة *</Label>
              <Input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                placeholder="6 أحرف على الأقل"
              />
            </div>
            <div>
              <Label>تأكيد كلمة المرور *</Label>
              <Input
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setResetPasswordDialog(false)}>إلغاء</Button>
            <Button onClick={handleSavePassword} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
              {saving && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              تغيير كلمة المرور
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersManagement;

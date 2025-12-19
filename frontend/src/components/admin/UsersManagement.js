import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Select from 'react-select';
import {
  Users,
  Search,
  Edit,
  Key,
  UserCheck,
  UserX,
  Loader2,
  X,
  Plus,
  UserPlus,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Custom styles for react-select
const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: '0.5rem',
    borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
    '&:hover': {
      borderColor: '#3b82f6'
    },
    minHeight: '42px',
    direction: 'rtl'
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '0.5rem',
    overflow: 'hidden',
    zIndex: 100,
    direction: 'rtl'
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
    color: state.isSelected ? 'white' : '#374151',
    cursor: 'pointer',
    textAlign: 'right'
  }),
  placeholder: (base) => ({
    ...base,
    color: '#9ca3af',
    textAlign: 'right'
  }),
  singleValue: (base) => ({
    ...base,
    textAlign: 'right'
  }),
  input: (base) => ({
    ...base,
    textAlign: 'right'
  })
};

const UsersManagement = ({ 
  users = [], 
  neighborhoods = [],
  loading = false,
  onRefresh 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  
  // User roles from database
  const [userRoles, setUserRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  
  // Add User Dialog
  const [addDialog, setAddDialog] = useState(false);
  const [newUserData, setNewUserData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    role: 'user',
    neighborhood_id: '',
    is_active: true
  });
  
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

  // Fetch user roles on mount
  useEffect(() => {
    fetchUserRoles();
  }, []);

  const fetchUserRoles = async () => {
    setRolesLoading(true);
    try {
      const response = await axios.get(`${API_URL}/user-roles`);
      const activeRoles = (response.data || []).filter(r => r.is_active !== false);
      setUserRoles(activeRoles);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      // Fallback to default roles if API fails
      setUserRoles([
        { name: 'admin', display_name: 'مدير نظام' },
        { name: 'committee_president', display_name: 'رئيس لجنة' },
        { name: 'committee_member', display_name: 'عضو لجنة' },
        { name: 'user', display_name: 'متبرع كريم' }
      ]);
    } finally {
      setRolesLoading(false);
    }
  };

  // Get neighborhood options for react-select
  const neighborhoodOptions = neighborhoods.map(n => ({
    value: n.id,
    label: n.name
  }));

  // Get role options for react-select
  const roleOptions = userRoles.map(r => ({
    value: r.name,
    label: r.display_name
  }));

  const resetNewUserForm = () => {
    setNewUserData({
      full_name: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
      role: 'user',
      neighborhood_id: '',
      is_active: true
    });
  };

  const handleAddUser = async () => {
    // Validation
    if (!newUserData.full_name?.trim()) {
      toast.error('الاسم الكامل مطلوب');
      return;
    }
    if (!newUserData.phone?.trim()) {
      toast.error('رقم الجوال مطلوب');
      return;
    }
    if (!newUserData.password || newUserData.password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (newUserData.password !== newUserData.confirm_password) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const userData = {
        full_name: newUserData.full_name,
        email: newUserData.email || null,
        phone: newUserData.phone,
        password: newUserData.password,
        role: newUserData.role,
        neighborhood_id: newUserData.neighborhood_id || null,
        is_active: newUserData.is_active
      };
      
      await axios.post(`${API_URL}/users`, userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('تم إضافة المستخدم بنجاح');
      setAddDialog(false);
      resetNewUserForm();
      onRefresh?.();
    } catch (error) {
      console.error('Error adding user:', error);
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error('فشل إضافة المستخدم');
      }
    } finally {
      setSaving(false);
    }
  };

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
    const foundRole = userRoles.find(r => r.name === role);
    if (foundRole) return foundRole.display_name;
    
    // Fallback for common roles
    const fallbackRoles = {
      'admin': 'مدير نظام',
      'committee_president': 'رئيس لجنة',
      'committee_member': 'موظف لجنة',
      'user': 'متبرع كريم',
      'doctor': 'دكتور',
      'pharmacist': 'صيدلاني',
      'laboratory': 'مخبري'
    };
    return fallbackRoles[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      'admin': 'bg-red-100 text-red-800',
      'committee_president': 'bg-blue-100 text-blue-800',
      'committee_member': 'bg-green-100 text-green-800',
      'user': 'bg-yellow-100 text-yellow-800',
      'doctor': 'bg-cyan-100 text-cyan-800',
      'pharmacist': 'bg-emerald-100 text-emerald-800',
      'laboratory': 'bg-purple-100 text-purple-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, showInactive]);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-7 h-7 text-blue-600" />
          إدارة المستخدمين
        </h2>
        <Button 
          onClick={() => {
            resetNewUserForm();
            setAddDialog(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          إضافة مستخدم جديد
        </Button>
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
            {paginatedUsers.map((user, index) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600 text-center">{startIndex + index + 1}</td>
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

      {/* Pagination */}
      {!loading && filteredUsers.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4">
          {/* Info */}
          <div className="text-sm text-gray-600">
            عرض <span className="font-semibold text-gray-900">{startIndex + 1}</span> إلى{' '}
            <span className="font-semibold text-gray-900">{Math.min(endIndex, filteredUsers.length)}</span> من{' '}
            <span className="font-semibold text-gray-900">{filteredUsers.length}</span> مستخدم
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-1">
            {/* First Page */}
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
              }`}
              title="الصفحة الأولى"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>

            {/* Previous Page */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
              }`}
              title="الصفحة السابقة"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1 mx-2">
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' && goToPage(page)}
                  disabled={page === '...'}
                  className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all ${
                    page === currentPage
                      ? 'bg-blue-600 text-white shadow-md'
                      : page === '...'
                      ? 'text-gray-400 cursor-default'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            {/* Next Page */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === totalPages
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
              }`}
              title="الصفحة التالية"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === totalPages
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
              }`}
              title="الصفحة الأخيرة"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Items per page selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">عرض</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-600">في الصفحة</span>
          </div>
        </div>
      )}

      {/* Add User Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <UserPlus className="w-6 h-6 text-blue-600" />
              إضافة مستخدم جديد
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-sm font-medium">الاسم الكامل <span className="text-red-500">*</span></Label>
                <Input
                  value={newUserData.full_name}
                  onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                  placeholder="أدخل الاسم الكامل"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">رقم الجوال <span className="text-red-500">*</span></Label>
                <Input
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                  placeholder="09xxxxxxxx"
                  dir="ltr"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="example@email.com"
                  dir="ltr"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">كلمة المرور <span className="text-red-500">*</span></Label>
                <Input
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="6 أحرف على الأقل"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">تأكيد كلمة المرور <span className="text-red-500">*</span></Label>
                <Input
                  type="password"
                  value={newUserData.confirm_password}
                  onChange={(e) => setNewUserData({ ...newUserData, confirm_password: e.target.value })}
                  placeholder="أعد كتابة كلمة المرور"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">نوع المستخدم</Label>
                <Select
                  value={roleOptions.find(o => o.value === newUserData.role) || null}
                  onChange={(option) => setNewUserData({ ...newUserData, role: option?.value || 'user' })}
                  options={roleOptions}
                  placeholder="اختر نوع المستخدم..."
                  isSearchable
                  noOptionsMessage={() => 'لا توجد نتائج'}
                  styles={selectStyles}
                  className="mt-1"
                  isLoading={rolesLoading}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">الحي</Label>
                <Select
                  value={neighborhoodOptions.find(o => o.value === newUserData.neighborhood_id) || null}
                  onChange={(option) => setNewUserData({ ...newUserData, neighborhood_id: option?.value || '' })}
                  options={neighborhoodOptions}
                  placeholder="ابحث عن حي..."
                  isClearable
                  isSearchable
                  noOptionsMessage={() => 'لا توجد نتائج'}
                  styles={selectStyles}
                  className="mt-1"
                />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="new_user_is_active"
                  checked={newUserData.is_active}
                  onChange={(e) => setNewUserData({ ...newUserData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <Label htmlFor="new_user_is_active" className="cursor-pointer">المستخدم نشط</Label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setAddDialog(false)}>إلغاء</Button>
            <Button onClick={handleAddUser} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              <Plus className="w-4 h-4 ml-1" />
              إضافة المستخدم
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              تعديل بيانات المستخدم
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-sm font-medium">الاسم الكامل <span className="text-red-500">*</span></Label>
                <Input
                  value={userFormData.full_name}
                  onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">رقم الجوال</Label>
                <Input
                  value={userFormData.phone}
                  onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                  dir="ltr"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  dir="ltr"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">نوع المستخدم</Label>
                <Select
                  value={roleOptions.find(o => o.value === userFormData.role) || null}
                  onChange={(option) => setUserFormData({ ...userFormData, role: option?.value || 'user' })}
                  options={roleOptions}
                  placeholder="اختر نوع المستخدم..."
                  isSearchable
                  noOptionsMessage={() => 'لا توجد نتائج'}
                  styles={selectStyles}
                  className="mt-1"
                  isLoading={rolesLoading}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">الحي</Label>
                <Select
                  value={neighborhoodOptions.find(o => o.value === userFormData.neighborhood_id) || null}
                  onChange={(option) => setUserFormData({ ...userFormData, neighborhood_id: option?.value || '' })}
                  options={neighborhoodOptions}
                  placeholder="ابحث عن حي..."
                  isClearable
                  isSearchable
                  noOptionsMessage={() => 'لا توجد نتائج'}
                  styles={selectStyles}
                  className="mt-1"
                />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="user_is_active"
                  checked={userFormData.is_active}
                  onChange={(e) => setUserFormData({ ...userFormData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <Label htmlFor="user_is_active" className="cursor-pointer">نشط</Label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditDialog(false)}>إلغاء</Button>
            <Button onClick={handleSaveUser} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              حفظ التغييرات
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialog} onOpenChange={setResetPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-600" />
              تغيير كلمة المرور - {resetPasswordUser?.full_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">كلمة المرور الجديدة <span className="text-red-500">*</span></Label>
              <Input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                placeholder="6 أحرف على الأقل"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">تأكيد كلمة المرور <span className="text-red-500">*</span></Label>
              <Input
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
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

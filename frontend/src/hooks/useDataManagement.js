import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Custom Hook لإدارة عمليات CRUD المشتركة
 * يوفر منطق موحد لجلب البيانات، الإضافة، التعديل، الحذف، والبحث
 */
export const useDataManagement = (endpoint, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [showInactive, setShowInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const {
    enablePagination = false,
    itemsPerPage = 20,
    initialFetch = true
  } = options;

  // جلب البيانات من الـ API
  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/${endpoint}`;
      if (enablePagination) {
        url += `?page=${page}&limit=${itemsPerPage}`;
      }
      
      const response = await axios.get(url);
      
      if (enablePagination && response.data.items) {
        setData(response.data.items);
        setTotal(response.data.total);
        setTotalPages(response.data.pages);
      } else {
        setData(response.data);
      }
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  // إضافة عنصر جديد
  const createItem = async (itemData) => {
    setLoading(true);
    const loadingToast = toast.loading('جارٍ الإضافة...');
    
    try {
      await axios.post(`${API_URL}/${endpoint}`, itemData);
      toast.dismiss(loadingToast);
      toast.success('تمت الإضافة بنجاح');
      await fetchData();
      return true;
    } catch (error) {
      console.error(`Error creating item in ${endpoint}:`, error);
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.detail || 'فشلت عملية الإضافة');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // تحديث عنصر موجود
  const updateItem = async (itemId, itemData) => {
    setLoading(true);
    const loadingToast = toast.loading('جارٍ التحديث...');
    
    try {
      await axios.put(`${API_URL}/${endpoint}/${itemId}`, itemData);
      toast.dismiss(loadingToast);
      toast.success('تم التحديث بنجاح');
      await fetchData();
      return true;
    } catch (error) {
      console.error(`Error updating item in ${endpoint}:`, error);
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.detail || 'فشلت عملية التحديث');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // حذف عنصر
  const deleteItem = async (itemId) => {
    setLoading(true);
    const loadingToast = toast.loading('جارٍ الحذف...');
    
    try {
      await axios.delete(`${API_URL}/${endpoint}/${itemId}`);
      toast.dismiss(loadingToast);
      toast.success('تم الحذف بنجاح');
      await fetchData();
      return true;
    } catch (error) {
      console.error(`Error deleting item in ${endpoint}:`, error);
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.detail || 'فشلت عملية الحذف');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // تبديل حالة التفعيل/الإيقاف
  const toggleStatus = async (itemId, currentStatus) => {
    const action = currentStatus ? 'إيقاف' : 'تفعيل';
    const loadingToast = toast.loading(`جارٍ ${action}...`);
    
    try {
      await axios.put(`${API_URL}/${endpoint}/${itemId}/toggle-status`);
      toast.dismiss(loadingToast);
      toast.success(`تم ${action} بنجاح`);
      await fetchData();
      return true;
    } catch (error) {
      console.error(`Error toggling status in ${endpoint}:`, error);
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.detail || `فشل ${action}`);
      return false;
    }
  };

  // دالة الترتيب
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // جلب البيانات عند التحميل أو تغيير الصفحة
  useEffect(() => {
    if (initialFetch) {
      fetchData();
    }
  }, [page]);

  return {
    data,
    loading,
    searchQuery,
    setSearchQuery,
    sortColumn,
    sortDirection,
    handleSort,
    showInactive,
    setShowInactive,
    page,
    setPage,
    totalPages,
    total,
    fetchData,
    createItem,
    updateItem,
    deleteItem,
    toggleStatus
  };
};

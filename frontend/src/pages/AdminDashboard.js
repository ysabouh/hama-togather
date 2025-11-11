import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Users, Heart, Activity, GraduationCap, Building2, HandHeart, BookOpen, MapPin, Eye } from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

// قائمة المهن/الأعمال
const occupationOptions = [
  { value: 'مهندس', label: 'مهندس' },
  { value: 'طبيب', label: 'طبيب' },
  { value: 'معلم', label: 'معلم' },
  { value: 'محامي', label: 'محامي' },
  { value: 'محاسب', label: 'محاسب' },
  { value: 'صيدلي', label: 'صيدلي' },
  { value: 'فني', label: 'فني' },
  { value: 'موظف حكومي', label: 'موظف حكومي' },
  { value: 'موظف قطاع خاص', label: 'موظف قطاع خاص' },
  { value: 'تاجر', label: 'تاجر' },
  { value: 'صاحب عمل حر', label: 'صاحب عمل حر' },
  { value: 'عامل', label: 'عامل' },
  { value: 'متقاعد', label: 'متقاعد' },
  { value: 'طالب', label: 'طالب' },
  { value: 'ربة منزل', label: 'ربة منزل' },
  { value: 'أخرى', label: 'أخرى' }
];

// قائمة المؤهلات الدراسية
const educationOptions = [
  { value: 'دكتوراه', label: 'دكتوراه' },
  { value: 'ماجستير', label: 'ماجستير' },
  { value: 'بكالوريوس', label: 'بكالوريوس' },
  { value: 'دبلوم', label: 'دبلوم' },
  { value: 'ثانوية عامة', label: 'ثانوية عامة' },
  { value: 'إعدادية', label: 'إعدادية' },
  { value: 'ابتدائية', label: 'ابتدائية' },
  { value: 'يقرأ ويكتب', label: 'يقرأ ويكتب' },
  { value: 'أمي', label: 'أمي' }
];

// تنسيق react-select بالعربية
const customSelectStyles = {
  control: (base) => ({
    ...base,
    textAlign: 'right',
    minHeight: '42px',
  }),
  menu: (base) => ({
    ...base,
    textAlign: 'right',
  }),
  placeholder: (base) => ({
    ...base,
    textAlign: 'right',
  }),
  singleValue: (base) => ({
    ...base,
    textAlign: 'right',
  }),
};

// دالة لحساب العمر من تاريخ الميلاد
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // إذا لم يحن موعد عيد الميلاد هذا العام بعد، نطرح سنة
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [families, setFamilies] = useState([]);
  const [healthCases, setHealthCases] = useState([]);
  const [courses, setCourses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [initiatives, setInitiatives] = useState([]);
  const [stories, setStories] = useState([]);
  const [donations, setDonations] = useState([]);
  const [missionContent, setMissionContent] = useState(null);
  const [heroContent, setHeroContent] = useState(null);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [positions, setPositions] = useState([]);
  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [neighborhoodsPage, setNeighborhoodsPage] = useState(1);
  const [neighborhoodsTotal, setNeighborhoodsTotal] = useState(0);
  const [neighborhoodsTotalPages, setNeighborhoodsTotalPages] = useState(0);
  const [viewMemberDialog, setViewMemberDialog] = useState(false);
  const [viewingMember, setViewingMember] = useState(null);

  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [dialogMode, setDialogMode] = useState('create'); // create or edit
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({});

  // Setup axios with token from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [neighborhoodsPage]);

  const fetchAllData = async () => {
    try {
      const [statsRes, familiesRes, healthRes, coursesRes, projectsRes, initiativesRes, storiesRes, donationsRes, missionRes, heroRes, neighborhoodsRes, positionsRes, committeeMembersRes] = await Promise.all([
        axios.get(`${API_URL}/stats`),
        axios.get(`${API_URL}/families`),
        axios.get(`${API_URL}/health-cases`),
        axios.get(`${API_URL}/courses`),
        axios.get(`${API_URL}/projects`),
        axios.get(`${API_URL}/initiatives`),
        axios.get(`${API_URL}/stories`),
        axios.get(`${API_URL}/donations`),
        axios.get(`${API_URL}/mission-content`),
        axios.get(`${API_URL}/hero-content`),
        axios.get(`${API_URL}/neighborhoods?page=${neighborhoodsPage}&limit=20`),
        axios.get(`${API_URL}/positions`),
        axios.get(`${API_URL}/committee-members`)
      ]);

      setStats(statsRes.data);
      setFamilies(familiesRes.data);
      setHealthCases(healthRes.data);
      setCourses(coursesRes.data);
      setProjects(projectsRes.data);
      setInitiatives(initiativesRes.data);
      setStories(storiesRes.data);
      setDonations(donationsRes.data);
      setMissionContent(missionRes.data);
      setHeroContent(heroRes.data);
      setNeighborhoods(neighborhoodsRes.data.items);
      setNeighborhoodsTotal(neighborhoodsRes.data.total);
      setNeighborhoodsTotalPages(neighborhoodsRes.data.pages);
      setPositions(positionsRes.data);
      setCommitteeMembers(committeeMembersRes.data);
    } catch (error) {
      toast.error('فشل تحميل البيانات');
    }
  };

  const openCreateDialog = (type) => {
    setDialogType(type);
    setDialogMode('create');
    // Set default values for neighborhood
    if (type === 'neighborhood') {
      setFormData({
        is_active: true,
        families_count: 0,
        population_count: 0
      });
    } else {
      setFormData({});
    }
    setCurrentItem(null);
    setShowDialog(true);
  };

  const openEditDialog = (type, item) => {
    setDialogType(type);
    setDialogMode('edit');
    setFormData(item);
    setCurrentItem(item);
    setShowDialog(true);
  };

  const openViewDialog = (member) => {
    setViewingMember(member);
    setViewMemberDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Handle mission content updates
      if (['vision_text', 'vision_image', 'principle', 'testimonial', 'models'].includes(dialogType)) {
        let updateData = {};
        
        if (dialogType === 'vision_text') {
          updateData = {
            vision_text: formData.vision_text,
            vision_highlight: formData.vision_highlight
          };
        } else if (dialogType === 'vision_image') {
          updateData = {
            vision_image: formData.vision_image
          };
        } else if (dialogType === 'principle') {
          const principles = [...(missionContent.principles || [])];
          if (dialogMode === 'create') {
            principles.push({
              icon: formData.icon,
              title: formData.title,
              description: formData.description
            });
          } else {
            principles[formData.index] = {
              icon: formData.icon,
              title: formData.title,
              description: formData.description
            };
          }
          updateData = { principles };
        } else if (dialogType === 'testimonial') {
          const testimonials = [...(missionContent.testimonials || [])];
          if (dialogMode === 'create') {
            testimonials.push({
              name: formData.name,
              role: formData.role,
              text: formData.text,
              avatar: formData.avatar
            });
          } else {
            testimonials[formData.index] = {
              name: formData.name,
              role: formData.role,
              text: formData.text,
              avatar: formData.avatar
            };
          }
          updateData = { testimonials };
        } else if (dialogType === 'models') {
          updateData = {
            old_model: formData.old_model,
            new_model: formData.new_model
          };
        }
        
        await axios.put(`${API_URL}/mission-content`, updateData);
        toast.success(dialogMode === 'create' ? 'تم الإضافة بنجاح' : 'تم التحديث بنجاح');
      } else {
        // Handle regular CRUD operations
        let endpoint = dialogType;
        if (dialogType === 'neighborhood') endpoint = 'neighborhoods';
        else if (dialogType === 'committee') endpoint = 'committee-members';
        
        if (dialogMode === 'create') {
          await axios.post(`${API_URL}/${endpoint}`, formData);
          toast.success('تم الإضافة بنجاح');
        } else {
          await axios.put(`${API_URL}/${endpoint}/${currentItem.id}`, formData);
          toast.success('تم التحديث بنجاح');
        }
      }
      
      setShowDialog(false);
      fetchAllData();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.detail || 'فشل العملية');
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;
    
    try {
      let endpoint = type;
      if (type === 'neighborhood') endpoint = 'neighborhoods';
      else if (type === 'committee') endpoint = 'committee-members';
      
      await axios.delete(`${API_URL}/${endpoint}/${id}`);
      toast.success('تم الحذف بنجاح');
      fetchAllData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.detail || 'فشل الحذف');
    }
  };

  const renderFormFields = () => {
    switch (dialogType) {
      case 'neighborhood':
        return (
          <>
            <div>
              <Label>اسم الحي</Label>
              <Input value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div>
              <Label>رقم الحي</Label>
              <Input value={formData.number || ''} onChange={(e) => setFormData({...formData, number: e.target.value})} required />
            </div>
            <div>
              <Label>عدد العوائل</Label>
              <Input type="number" value={formData.families_count || 0} onChange={(e) => setFormData({...formData, families_count: parseInt(e.target.value)})} />
            </div>
            <div>
              <Label>عدد السكان</Label>
              <Input type="number" value={formData.population_count || 0} onChange={(e) => setFormData({...formData, population_count: parseInt(e.target.value)})} />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active ?? true}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="w-4 h-4"
              />
              <Label htmlFor="is_active">نشط</Label>
            </div>
          </>
        );

      case 'committee':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الاسم الأول *</Label>
                <Input value={formData.first_name || ''} onChange={(e) => setFormData({...formData, first_name: e.target.value})} required />
              </div>
              <div>
                <Label>اسم الأب *</Label>
                <Input value={formData.father_name || ''} onChange={(e) => setFormData({...formData, father_name: e.target.value})} required />
              </div>
            </div>
            <div>
              <Label>الكنية *</Label>
              <Input value={formData.last_name || ''} onChange={(e) => setFormData({...formData, last_name: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الحي *</Label>
                <Select
                  value={neighborhoods.find(n => n.id === formData.neighborhood_id) ? 
                    { value: formData.neighborhood_id, label: neighborhoods.find(n => n.id === formData.neighborhood_id)?.name } : null}
                  onChange={(option) => setFormData({...formData, neighborhood_id: option?.value || ''})}
                  options={neighborhoods.map(n => ({ value: n.id, label: n.name }))}
                  placeholder="ابحث واختر الحي..."
                  isClearable
                  isSearchable
                  styles={customSelectStyles}
                  required
                />
              </div>
              <div>
                <Label>المنصب *</Label>
                <Select
                  value={positions.find(p => p.id === formData.position_id) ? 
                    { value: formData.position_id, label: positions.find(p => p.id === formData.position_id)?.title } : null}
                  onChange={(option) => setFormData({...formData, position_id: option?.value || ''})}
                  options={positions.map(p => ({ value: p.id, label: p.title }))}
                  placeholder="ابحث واختر المنصب..."
                  isClearable
                  isSearchable
                  styles={customSelectStyles}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>المواليد</Label>
                <Input type="date" value={formData.date_of_birth || ''} onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})} />
              </div>
              <div>
                <Label>رقم الهاتف *</Label>
                <Input value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>العمل</Label>
                <Select
                  value={formData.occupation ? { value: formData.occupation, label: formData.occupation } : null}
                  onChange={(option) => setFormData({...formData, occupation: option?.value || ''})}
                  options={occupationOptions}
                  placeholder="ابحث واختر العمل..."
                  isClearable
                  isSearchable
                  styles={customSelectStyles}
                />
              </div>
              <div>
                <Label>المؤهل الدراسي</Label>
                <Select
                  value={formData.education ? { value: formData.education, label: formData.education } : null}
                  onChange={(option) => setFormData({...formData, education: option?.value || ''})}
                  options={educationOptions}
                  placeholder="ابحث واختر المؤهل..."
                  isClearable
                  isSearchable
                  styles={customSelectStyles}
                />
              </div>
            </div>
            <div>
              <Label>الصورة (Base64 أو URL)</Label>
              <Input value={formData.image || ''} onChange={(e) => setFormData({...formData, image: e.target.value})} placeholder="أو استخدم زر رفع الصورة" />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData({...formData, image: reader.result});
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="mt-2"
              />
            </div>
          </>
        );

      case 'families':
        return (
          <>
            <div>
              <Label>اسم العائلة</Label>
              <Input value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div>
              <Label>عدد الأفراد</Label>
              <Input type="number" value={formData.members_count || ''} onChange={(e) => setFormData({...formData, members_count: parseInt(e.target.value)})} required />
            </div>
            <div>
              <Label>الحاجة الشهرية (ل.س)</Label>
              <Input type="number" value={formData.monthly_need || ''} onChange={(e) => setFormData({...formData, monthly_need: parseFloat(e.target.value)})} required />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
            </div>
          </>
        );

      case 'health-cases':
        return (
          <>
            <div>
              <Label>اسم المريض</Label>
              <Input value={formData.patient_name || ''} onChange={(e) => setFormData({...formData, patient_name: e.target.value})} required />
            </div>
            <div>
              <Label>العمر</Label>
              <Input type="number" value={formData.age || ''} onChange={(e) => setFormData({...formData, age: parseInt(e.target.value)})} required />
            </div>
            <div>
              <Label>الحالة</Label>
              <Input value={formData.condition || ''} onChange={(e) => setFormData({...formData, condition: e.target.value})} required />
            </div>
            <div>
              <Label>المبلغ المطلوب (ل.س)</Label>
              <Input type="number" value={formData.required_amount || ''} onChange={(e) => setFormData({...formData, required_amount: parseFloat(e.target.value)})} required />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
            </div>
          </>
        );

      case 'courses':
        return (
          <>
            <div>
              <Label>عنوان الدورة</Label>
              <Input value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
            </div>
            <div>
              <Label>الفئة</Label>
              <select 
                className="w-full p-2 border rounded"
                value={formData.category || 'education'}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="education">تعليم وتدريب</option>
                <option value="awareness">توعية أسرية</option>
              </select>
            </div>
            <div>
              <Label>التاريخ</Label>
              <Input value={formData.date || ''} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
            </div>
            <div>
              <Label>المدة</Label>
              <Input value={formData.duration || ''} onChange={(e) => setFormData({...formData, duration: e.target.value})} required />
            </div>
            <div>
              <Label>الحد الأقصى للمشاركين</Label>
              <Input type="number" value={formData.max_participants || ''} onChange={(e) => setFormData({...formData, max_participants: parseInt(e.target.value)})} required />
            </div>
            <div>
              <Label>المدرب (اختياري)</Label>
              <Input value={formData.instructor || ''} onChange={(e) => setFormData({...formData, instructor: e.target.value})} />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
            </div>
          </>
        );

      case 'projects':
        return (
          <>
            <div>
              <Label>عنوان المشروع</Label>
              <Input value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
            </div>
            <div>
              <Label>التمويل المطلوب (ل.س)</Label>
              <Input type="number" value={formData.required_funding || ''} onChange={(e) => setFormData({...formData, required_funding: parseFloat(e.target.value)})} required />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
            </div>
          </>
        );

      case 'initiatives':
        return (
          <>
            <div>
              <Label>عنوان المبادرة</Label>
              <Input value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
            </div>
            <div>
              <Label>التاريخ</Label>
              <Input value={formData.date || ''} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
            </div>
            <div>
              <Label>عدد المتطوعين المطلوب</Label>
              <Input type="number" value={formData.volunteers_needed || ''} onChange={(e) => setFormData({...formData, volunteers_needed: parseInt(e.target.value)})} required />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
            </div>
          </>
        );

      case 'stories':
        return (
          <>
            <div>
              <Label>العنوان</Label>
              <Input value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} required rows={6} />
            </div>
          </>
        );

      case 'vision_text':
        return (
          <>
            <div>
              <Label>نص الرؤية</Label>
              <Textarea 
                value={formData.vision_text || ''} 
                onChange={(e) => setFormData({...formData, vision_text: e.target.value})} 
                required 
                rows={8}
                className="text-right"
              />
            </div>
            <div>
              <Label>النص المميز</Label>
              <Textarea 
                value={formData.vision_highlight || ''} 
                onChange={(e) => setFormData({...formData, vision_highlight: e.target.value})} 
                required 
                rows={3}
                className="text-right"
              />
            </div>
          </>
        );

      case 'vision_image':
        return (
          <>
            <div>
              <Label>رابط الصورة (URL)</Label>
              <Input 
                value={formData.vision_image || ''} 
                onChange={(e) => setFormData({...formData, vision_image: e.target.value})} 
                placeholder="https://example.com/image.jpg"
                className="text-right mb-4"
              />
            </div>
            
            <div className="my-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="text-sm text-gray-500">أو</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>
            </div>
            
            <div>
              <Label className="block mb-2">رفع صورة من جهازك</Label>
              <input
                type="file"
                accept="image/*"
                id="image-upload-input"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  // Validate file size (max 5MB)
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error('حجم الصورة كبير جداً (الحد الأقصى 5MB)');
                    e.target.value = '';
                    return;
                  }
                  
                  const toastId = toast.loading('جاري رفع الصورة...');
                  
                  try {
                    // Create FormData
                    const formDataUpload = new FormData();
                    formDataUpload.append('file', file);
                    
                    console.log('Uploading file:', file.name, file.size, file.type);
                    
                    // Upload via API
                    const response = await axios.post(`${API_URL}/upload-image`, formDataUpload, {
                      headers: { 
                        'Content-Type': 'multipart/form-data'
                      },
                      timeout: 30000 // 30 seconds timeout
                    });
                    
                    console.log('Upload response:', response.data);
                    
                    if (response.data?.image_url) {
                      setFormData(prev => ({...prev, vision_image: response.data.image_url}));
                      toast.success('تم رفع الصورة بنجاح', { id: toastId });
                    } else {
                      throw new Error('لم يتم استلام رابط الصورة');
                    }
                  } catch (error) {
                    console.error('Upload error:', error);
                    const errorMsg = error.response?.data?.detail || error.message || 'حدث خطأ غير متوقع';
                    toast.error(`فشل رفع الصورة: ${errorMsg}`, { id: toastId });
                    e.target.value = '';
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                data-testid="image-upload-input"
              />
              <p className="text-xs text-gray-500 mt-2">✓ صيغ مدعومة: JPG, PNG, GIF, WebP<br/>✓ الحد الأقصى: 5MB</p>
            </div>
            
            {formData.vision_image && (
              <div className="mt-4">
                <Label>معاينة الصورة:</Label>
                <div className="relative mt-2">
                  <img 
                    src={formData.vision_image} 
                    alt="معاينة" 
                    className="w-full h-64 object-cover rounded-lg border"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/800x400?text=فشل+تحميل+الصورة';
                      toast.error('رابط الصورة غير صالح');
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setFormData({...formData, vision_image: ''})}
                    className="absolute top-2 left-2"
                  >
                    <Trash2 className="w-4 h-4 ml-1" />
                    إزالة
                  </Button>
                </div>
              </div>
            )}
          </>
        );

      case 'principle':
        return (
          <>
            <div>
              <Label>الأيقونة (إيموجي)</Label>
              <Input 
                value={formData.icon || ''} 
                onChange={(e) => setFormData({...formData, icon: e.target.value})} 
                placeholder="🌱"
                required 
                className="text-3xl text-center"
                maxLength={2}
              />
              <p className="text-xs text-gray-500 mt-1">اكتب إيموجي مباشرة أو انسخه والصقه</p>
            </div>
            <div>
              <Label>العنوان</Label>
              <Input 
                value={formData.title || ''} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                required 
                className="text-right"
              />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea 
                value={formData.description || ''} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                required 
                rows={4}
                className="text-right"
              />
            </div>
          </>
        );

      case 'testimonial':
        return (
          <>
            <div>
              <Label>الاسم</Label>
              <Input 
                value={formData.name || ''} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                required 
                className="text-right"
              />
            </div>
            <div>
              <Label>الدور/المنصب</Label>
              <Input 
                value={formData.role || ''} 
                onChange={(e) => setFormData({...formData, role: e.target.value})} 
                required 
                className="text-right"
              />
            </div>
            <div>
              <Label>الحرف الأول (Avatar)</Label>
              <Input 
                value={formData.avatar || ''} 
                onChange={(e) => setFormData({...formData, avatar: e.target.value})} 
                placeholder="م"
                required 
                className="text-2xl text-center"
                maxLength={1}
              />
            </div>
            <div>
              <Label>نص الشهادة</Label>
              <Textarea 
                value={formData.text || ''} 
                onChange={(e) => setFormData({...formData, text: e.target.value})} 
                required 
                rows={5}
                className="text-right"
              />
            </div>
          </>
        );

      case 'models':
        return (
          <>
            <div>
              <Label className="block mb-2">نقاط النموذج التقليدي</Label>
              {(formData.old_model || []).map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <Input 
                    value={item} 
                    onChange={(e) => {
                      const newArray = [...(formData.old_model || [])];
                      newArray[idx] = e.target.value;
                      setFormData({...formData, old_model: newArray});
                    }} 
                    className="text-right flex-1"
                  />
                  <Button 
                    type="button"
                    variant="destructive" 
                    size="sm"
                    onClick={() => {
                      const newArray = (formData.old_model || []).filter((_, i) => i !== idx);
                      setFormData({...formData, old_model: newArray});
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button 
                type="button"
                variant="outline" 
                size="sm"
                onClick={() => {
                  setFormData({...formData, old_model: [...(formData.old_model || []), '']});
                }}
                className="mt-2"
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة نقطة
              </Button>
            </div>
            
            <div className="mt-4">
              <Label className="block mb-2">نقاط النموذج التحويلي</Label>
              {(formData.new_model || []).map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <Input 
                    value={item} 
                    onChange={(e) => {
                      const newArray = [...(formData.new_model || [])];
                      newArray[idx] = e.target.value;
                      setFormData({...formData, new_model: newArray});
                    }} 
                    className="text-right flex-1"
                  />
                  <Button 
                    type="button"
                    variant="destructive" 
                    size="sm"
                    onClick={() => {
                      const newArray = (formData.new_model || []).filter((_, i) => i !== idx);
                      setFormData({...formData, new_model: newArray});
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button 
                type="button"
                variant="outline" 
                size="sm"
                onClick={() => {
                  setFormData({...formData, new_model: [...(formData.new_model || []), '']});
                }}
                className="mt-2"
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة نقطة
              </Button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-emerald-900 mb-8" data-testid="admin-title">لوحة التحكم الإدارية</h1>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-emerald-600">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">العائلات</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.families || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-rose-600">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-rose-700" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">حالات صحية</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.health_cases || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-amber-600">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">مشاريع</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.projects || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-600">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">تبرعات</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.donations || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="families" className="w-full">
            <TabsList className="mb-6 bg-white p-2 rounded-lg shadow">
              <TabsTrigger value="hero" data-testid="tab-hero">القسم الأول</TabsTrigger>
              <TabsTrigger value="neighborhoods" data-testid="tab-neighborhoods">الأحياء</TabsTrigger>
              <TabsTrigger value="committees" data-testid="tab-committees">لجان الأحياء</TabsTrigger>
              <TabsTrigger value="families" data-testid="tab-families">العائلات</TabsTrigger>
              <TabsTrigger value="health" data-testid="tab-health">الحالات الصحية</TabsTrigger>
              <TabsTrigger value="courses" data-testid="tab-courses">الدورات</TabsTrigger>
              <TabsTrigger value="projects" data-testid="tab-projects">المشاريع</TabsTrigger>
              <TabsTrigger value="initiatives" data-testid="tab-initiatives">المبادرات</TabsTrigger>
              <TabsTrigger value="stories" data-testid="tab-stories">قصص النجاح</TabsTrigger>
              <TabsTrigger value="mission" data-testid="tab-mission">رؤيتنا ورسالتنا</TabsTrigger>
              <TabsTrigger value="donations" data-testid="tab-donations">التبرعات</TabsTrigger>
            </TabsList>

            {/* Hero Section Tab */}
            <TabsContent value="hero">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">إدارة القسم الأول (Hero Section & Video)</h2>
                
                {heroContent && (
                  <div className="space-y-8">
                    {/* Hero Section Management */}
                    <div className="border rounded-lg p-6 bg-gray-50">
                      <h3 className="text-xl font-bold mb-4 text-emerald-700">Hero Section - القسم الرئيسي</h3>
                      
                      <div className="space-y-4">
                        {/* Title & Subtitle */}
                        <div>
                          <Label>العنوان الرئيسي</Label>
                          <Input
                            value={heroContent.title || ''}
                            onChange={(e) => setHeroContent({...heroContent, title: e.target.value})}
                            className="text-lg font-bold"
                          />
                        </div>
                        
                        <div>
                          <Label>الوصف</Label>
                          <Textarea
                            value={heroContent.subtitle || ''}
                            onChange={(e) => setHeroContent({...heroContent, subtitle: e.target.value})}
                            rows={3}
                          />
                        </div>
                        
                        {/* CTA Button */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>نص الزر</Label>
                            <Input
                              value={heroContent.cta_text || ''}
                              onChange={(e) => setHeroContent({...heroContent, cta_text: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>رابط الزر</Label>
                            <Input
                              value={heroContent.cta_link || ''}
                              onChange={(e) => setHeroContent({...heroContent, cta_link: e.target.value})}
                            />
                          </div>
                        </div>
                        
                        {/* Background Image */}
                        <div>
                          <Label>صورة الخلفية</Label>
                          <div className="flex gap-2 items-center">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  try {
                                    const token = localStorage.getItem('token');
                                    const res = await axios.post(`${API_URL}/upload-image`, formData, {
                                      headers: { Authorization: `Bearer ${token}` }
                                    });
                                    setHeroContent({...heroContent, background_image: res.data.image_url});
                                    toast.success('تم رفع الصورة بنجاح');
                                  } catch (error) {
                                    toast.error('فشل رفع الصورة');
                                  }
                                }
                              }}
                            />
                            {heroContent.background_image && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setHeroContent({...heroContent, background_image: null})}
                              >
                                حذف
                              </Button>
                            )}
                          </div>
                          
                          {/* معلومات إرشادية للصورة */}
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
                            <p className="font-semibold text-blue-900 mb-1">📌 معلومات مهمة عن الصورة:</p>
                            <ul className="text-blue-800 space-y-1 mr-4">
                              <li>• <strong>نوع الصورة:</strong> JPG, PNG, WebP</li>
                              <li>• <strong>الأبعاد المثالية:</strong> 1920×1080 بكسل أو أكبر</li>
                              <li>• <strong>الحجم الأقصى:</strong> 5 ميجابايت</li>
                              <li>• <strong>نصيحة:</strong> استخدم صور ذات جودة عالية وألوان متناسقة مع التصميم</li>
                              <li>• <strong>ملاحظة:</strong> إذا لم تقم برفع صورة، سيتم استخدام الصورة الافتراضية</li>
                            </ul>
                          </div>
                          
                          {heroContent.background_image && (
                            <img src={heroContent.background_image} alt="background" className="mt-2 h-32 rounded" />
                          )}
                        </div>
                        
                        {/* Quotes Management */}
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center mb-3">
                            <Label className="text-lg font-semibold">العبارات الإلهامية</Label>
                            <Button
                              size="sm"
                              onClick={() => {
                                const quotes = heroContent.quotes || [];
                                quotes.push({ text: '', ref: '', author: '' });
                                setHeroContent({...heroContent, quotes});
                              }}
                              className="bg-emerald-700"
                            >
                              <Plus className="w-4 h-4 ml-1" />
                              إضافة عبارة
                            </Button>
                          </div>
                          
                          <div className="space-y-3">
                            {(heroContent.quotes || []).map((quote, index) => (
                              <div key={index} className="border rounded p-3 bg-white">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-sm font-semibold">عبارة {index + 1}</span>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      const quotes = [...heroContent.quotes];
                                      quotes.splice(index, 1);
                                      setHeroContent({...heroContent, quotes});
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  <Input
                                    placeholder="النص"
                                    value={quote.text || ''}
                                    onChange={(e) => {
                                      const quotes = [...heroContent.quotes];
                                      quotes[index].text = e.target.value;
                                      setHeroContent({...heroContent, quotes});
                                    }}
                                  />
                                  <Input
                                    placeholder="المرجع (اختياري)"
                                    value={quote.ref || ''}
                                    onChange={(e) => {
                                      const quotes = [...heroContent.quotes];
                                      quotes[index].ref = e.target.value;
                                      setHeroContent({...heroContent, quotes});
                                    }}
                                  />
                                  <Input
                                    placeholder="المؤلف أو التعليق"
                                    value={quote.author || ''}
                                    onChange={(e) => {
                                      const quotes = [...heroContent.quotes];
                                      quotes[index].author = e.target.value;
                                      setHeroContent({...heroContent, quotes});
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Video Section Management */}
                    <div className="border rounded-lg p-6 bg-gray-50">
                      <h3 className="text-xl font-bold mb-4 text-blue-700">Video Section - قسم الفيديو</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label>رابط الفيديو (YouTube Embed URL)</Label>
                          <Input
                            value={heroContent.video_url || ''}
                            onChange={(e) => setHeroContent({...heroContent, video_url: e.target.value})}
                            placeholder="https://www.youtube.com/embed/VIDEO_ID"
                          />
                          
                          {/* معلومات إرشادية للفيديو */}
                          <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-md text-sm">
                            <p className="font-semibold text-purple-900 mb-1">🎥 كيفية الحصول على رابط الفيديو الصحيح:</p>
                            <ul className="text-purple-800 space-y-1 mr-4">
                              <li>1. اذهب إلى فيديو YouTube المطلوب</li>
                              <li>2. انقر على زر "مشاركة" أسفل الفيديو</li>
                              <li>3. انقر على "تضمين" (Embed)</li>
                              <li>4. انسخ الرابط من داخل <code className="bg-purple-100 px-1 rounded">src="..."</code></li>
                              <li>• <strong>مثال:</strong> https://www.youtube.com/embed/XmYV-ZVZj04</li>
                            </ul>
                          </div>
                        </div>
                        
                        <div>
                          <Label>عنوان الفيديو</Label>
                          <Input
                            value={heroContent.video_title || ''}
                            onChange={(e) => setHeroContent({...heroContent, video_title: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <Label>وصف الفيديو (نص قصير)</Label>
                          <Textarea
                            value={heroContent.video_description || ''}
                            onChange={(e) => setHeroContent({...heroContent, video_description: e.target.value})}
                            rows={2}
                          />
                        </div>
                        
                        <div>
                          <Label>النص التفصيلي أسفل الفيديو</Label>
                          <Textarea
                            value={heroContent.video_subtitle || ''}
                            onChange={(e) => setHeroContent({...heroContent, video_subtitle: e.target.value})}
                            rows={4}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Save Button */}
                    <div className="flex justify-end">
                      <Button
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('token');
                            await axios.put(`${API_URL}/hero-content`, heroContent, {
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            toast.success('تم حفظ التغييرات بنجاح');
                            fetchAllData();
                          } catch (error) {
                            toast.error('فشل حفظ التغييرات');
                          }
                        }}
                        className="bg-emerald-700 px-8"
                      >
                        حفظ التغييرات
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Neighborhoods Tab */}
            <TabsContent value="neighborhoods">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">إدارة الأحياء</h2>
                  <Button onClick={() => openCreateDialog('neighborhood')} className="bg-emerald-700" data-testid="add-neighborhood-btn">
                    <Plus className="w-5 h-5 ml-2" />
                    إضافة حي جديد
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="neighborhoods-table">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">#</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الاسم</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الرقم</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">عدد العوائل</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">عدد السكان</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الحالة</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">تاريخ الإنشاء</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">تاريخ التعديل</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {neighborhoods.map((neighborhood, index) => (
                        <tr key={neighborhood.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600 text-center font-medium">
                            {(neighborhoodsPage - 1) * 20 + index + 1}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">{neighborhood.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">{neighborhood.number}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">{neighborhood.families_count || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">{neighborhood.population_count || 0}</td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${neighborhood.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {neighborhood.is_active ? 'نشط' : 'غير نشط'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center whitespace-nowrap">
                            {neighborhood.created_at ? new Date(neighborhood.created_at).toLocaleString('ar-SY', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: false
                            }) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center whitespace-nowrap">
                            {neighborhood.updated_at ? new Date(neighborhood.updated_at).toLocaleString('ar-SY', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: false
                            }) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog('neighborhood', neighborhood)}
                                className="text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete('neighborhood', neighborhood.id)}
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
                  {neighborhoods.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      لا توجد أحياء مسجلة حالياً
                    </div>
                  )}
                </div>
                
                {/* Pagination */}
                {neighborhoodsTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 px-4">
                    <div className="text-sm text-gray-600">
                      عرض {neighborhoods.length} من {neighborhoodsTotal} حي
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNeighborhoodsPage(prev => Math.max(1, prev - 1))}
                        disabled={neighborhoodsPage === 1}
                      >
                        السابق
                      </Button>
                      <div className="flex items-center gap-2 px-3">
                        <span className="text-sm">
                          صفحة {neighborhoodsPage} من {neighborhoodsTotalPages}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNeighborhoodsPage(prev => Math.min(neighborhoodsTotalPages, prev + 1))}
                        disabled={neighborhoodsPage === neighborhoodsTotalPages}
                      >
                        التالي
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Committee Members Tab */}
            <TabsContent value="committees">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">إدارة لجان الأحياء</h2>
                  <Button onClick={() => openCreateDialog('committee')} className="bg-emerald-700" data-testid="add-committee-btn">
                    <Plus className="w-5 h-5 ml-2" />
                    إضافة عضو لجنة
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="committee-table">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">#</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الاسم الكامل</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الحي</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">المنصب</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">العمر</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">العمل</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">المؤهل</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">تاريخ الإضافة</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">تاريخ التعديل</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {committeeMembers.map((member, index) => {
                        const neighborhood = neighborhoods.find(n => n.id === member.neighborhood_id);
                        const position = positions.find(p => p.id === member.position_id);
                        return (
                          <tr key={member.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-600 text-center font-medium">{index + 1}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-center">
                              <div className="flex items-center gap-2 justify-center">
                                {member.image && (
                                  <img src={member.image} alt={member.first_name} className="w-8 h-8 rounded-full object-cover" />
                                )}
                                <span>{member.first_name} {member.father_name} {member.last_name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-center">{neighborhood?.name || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-center">{position?.title || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-center">
                              {member.date_of_birth ? (
                                <span className="font-medium">{calculateAge(member.date_of_birth)} سنة</span>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-center">{member.occupation || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-center">{member.education || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-center whitespace-nowrap">
                              {member.created_at ? new Date(member.created_at).toLocaleString('ar-SY', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              }) : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-center whitespace-nowrap">
                              {member.updated_at ? new Date(member.updated_at).toLocaleString('ar-SY', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              }) : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <div className="flex gap-2 justify-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openViewDialog(member)}
                                  className="text-green-600 hover:bg-green-50"
                                  title="عرض التفاصيل"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditDialog('committee', member)}
                                  className="text-blue-600 hover:bg-blue-50"
                                  title="تعديل"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete('committee', member.id)}
                                  className="text-red-600 hover:bg-red-50"
                                  title="حذف"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {committeeMembers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      لا توجد أعضاء لجان مسجلين حالياً
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Families Tab */}
            <TabsContent value="families">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">إدارة العائلات</h2>
                  <Button onClick={() => openCreateDialog('families')} className="bg-emerald-700" data-testid="add-family-btn">
                    <Plus className="w-5 h-5 ml-2" />
                    إضافة عائلة
                  </Button>
                </div>
                <div className="space-y-4">
                  {families.map((family) => (
                    <div key={family.id} className="border rounded-lg p-4 flex justify-between items-start" data-testid={`family-item-${family.id}`}>
                      <div>
                        <h3 className="font-bold text-lg">{family.name}</h3>
                        <p className="text-sm text-gray-600">عدد الأفراد: {family.members_count}</p>
                        <p className="text-sm text-gray-600">الحاجة الشهرية: {family.monthly_need.toLocaleString()} ل.س</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog('families', family)} data-testid={`edit-family-${family.id}`}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete('families', family.id)} data-testid={`delete-family-${family.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Health Cases Tab */}
            <TabsContent value="health">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">إدارة الحالات الصحية</h2>
                  <Button onClick={() => openCreateDialog('health-cases')} className="bg-rose-700" data-testid="add-health-btn">
                    <Plus className="w-5 h-5 ml-2" />
                    إضافة حالة صحية
                  </Button>
                </div>
                <div className="space-y-4">
                  {healthCases.map((healthCase) => (
                    <div key={healthCase.id} className="border rounded-lg p-4 flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{healthCase.patient_name}</h3>
                        <p className="text-sm text-gray-600">الحالة: {healthCase.condition}</p>
                        <p className="text-sm text-gray-600">المبلغ المطلوب: {healthCase.required_amount.toLocaleString()} ل.س</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog('health-cases', healthCase)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete('health-cases', healthCase.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Courses Tab */}
            <TabsContent value="courses">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">إدارة الدورات</h2>
                  <Button onClick={() => openCreateDialog('courses')} className="bg-blue-700" data-testid="add-course-btn">
                    <Plus className="w-5 h-5 ml-2" />
                    إضافة دورة
                  </Button>
                </div>
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div key={course.id} className="border rounded-lg p-4 flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{course.title}</h3>
                        <p className="text-sm text-gray-600">التاريخ: {course.date}</p>
                        <p className="text-sm text-gray-600">المشاركين: {course.current_participants}/{course.max_participants}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog('courses', course)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete('courses', course.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">إدارة المشاريع</h2>
                  <Button onClick={() => openCreateDialog('projects')} className="bg-amber-700" data-testid="add-project-btn">
                    <Plus className="w-5 h-5 ml-2" />
                    إضافة مشروع
                  </Button>
                </div>
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} className="border rounded-lg p-4 flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{project.title}</h3>
                        <p className="text-sm text-gray-600">التمويل المطلوب: {project.required_funding.toLocaleString()} ل.س</p>
                        <p className="text-sm text-gray-600">المجمع: {project.collected_funding.toLocaleString()} ل.س</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog('projects', project)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete('projects', project.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Initiatives Tab */}
            <TabsContent value="initiatives">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">إدارة المبادرات</h2>
                  <Button onClick={() => openCreateDialog('initiatives')} className="bg-green-700" data-testid="add-initiative-btn">
                    <Plus className="w-5 h-5 ml-2" />
                    إضافة مبادرة
                  </Button>
                </div>
                <div className="space-y-4">
                  {initiatives.map((initiative) => (
                    <div key={initiative.id} className="border rounded-lg p-4 flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{initiative.title}</h3>
                        <p className="text-sm text-gray-600">التاريخ: {initiative.date}</p>
                        <p className="text-sm text-gray-600">المتطوعين: {initiative.current_volunteers}/{initiative.volunteers_needed}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog('initiatives', initiative)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete('initiatives', initiative.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Stories Tab */}
            <TabsContent value="stories">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">قصص النجاح</h2>
                  <Button onClick={() => openCreateDialog('stories')} className="bg-purple-700" data-testid="add-story-btn">
                    <Plus className="w-5 h-5 ml-2" />
                    إضافة قصة
                  </Button>
                </div>
                <div className="space-y-4">
                  {stories.map((story) => (
                    <div key={story.id} className="border rounded-lg p-4 flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{story.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{story.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="destructive" size="sm" onClick={() => handleDelete('stories', story.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Mission Content Tab */}
            <TabsContent value="mission">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">إدارة محتوى صفحة رؤيتنا ورسالتنا</h2>
                <div className="space-y-8">
                  {missionContent && (
                    <>
                      {/* قسم Hero Section */}
                      <div className="border rounded-lg p-6 bg-gradient-to-r from-emerald-50 to-blue-50">
                        <h3 className="font-bold text-xl mb-4 text-emerald-800">قسم البطل (Hero Section)</h3>
                        <div className="space-y-4">
                          <div>
                            <Label>العنوان الرئيسي</Label>
                            <Input
                              value={missionContent.hero_title || ''}
                              onChange={(e) => setMissionContent({...missionContent, hero_title: e.target.value})}
                              className="text-lg font-bold"
                            />
                          </div>
                          
                          <div>
                            <Label>النص الفرعي</Label>
                            <Textarea
                              value={missionContent.hero_subtitle || ''}
                              onChange={(e) => setMissionContent({...missionContent, hero_subtitle: e.target.value})}
                              rows={3}
                            />
                          </div>
                          
                          <div>
                            <Label>صورة الخلفية</Label>
                            <div className="flex gap-2 items-center">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    try {
                                      const token = localStorage.getItem('token');
                                      const res = await axios.post(`${API_URL}/upload-image`, formData, {
                                        headers: { Authorization: `Bearer ${token}` }
                                      });
                                      setMissionContent({...missionContent, hero_background_image: res.data.image_url});
                                      toast.success('تم رفع الصورة بنجاح');
                                    } catch (error) {
                                      toast.error('فشل رفع الصورة');
                                    }
                                  }
                                }}
                              />
                              {missionContent.hero_background_image && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setMissionContent({...missionContent, hero_background_image: null})}
                                >
                                  حذف
                                </Button>
                              )}
                            </div>
                            
                            {/* معلومات إرشادية */}
                            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
                              <p className="font-semibold text-blue-900 mb-1">📌 معلومات مهمة:</p>
                              <ul className="text-blue-800 space-y-1 mr-4">
                                <li>• <strong>الأبعاد المثالية:</strong> 1920×1080 بكسل</li>
                                <li>• <strong>الحجم الأقصى:</strong> 5 ميجابايت</li>
                                <li>• <strong>ملاحظة:</strong> إذا لم تقم برفع صورة، سيتم استخدام الصورة الافتراضية</li>
                              </ul>
                            </div>
                            
                            {missionContent.hero_background_image && (
                              <img src={missionContent.hero_background_image} alt="hero background" className="mt-2 h-32 rounded" />
                            )}
                          </div>
                          
                          <div className="flex justify-end pt-4">
                            <Button
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem('token');
                                  await axios.put(`${API_URL}/mission-content`, {
                                    hero_title: missionContent.hero_title,
                                    hero_subtitle: missionContent.hero_subtitle,
                                    hero_background_image: missionContent.hero_background_image
                                  }, {
                                    headers: { Authorization: `Bearer ${token}` }
                                  });
                                  toast.success('تم حفظ تغييرات Hero Section بنجاح');
                                  fetchAllData();
                                } catch (error) {
                                  toast.error('فشل حفظ التغييرات');
                                }
                              }}
                              className="bg-emerald-700"
                            >
                              حفظ تغييرات Hero Section
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* قسم نصوص وصورة الرؤية */}
                      <div className="border rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-xl">نصوص وصورة الرؤية</h3>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => {
                                setDialogType('vision_image');
                                setDialogMode('edit');
                                setFormData({ vision_image: missionContent.vision_image || '' });
                                setShowDialog(true);
                              }}
                              size="sm"
                              className="bg-purple-700"
                              data-testid="edit-image-btn"
                            >
                              <Edit className="w-4 h-4 ml-2" />
                              تعديل الصورة
                            </Button>
                            <Button 
                              onClick={() => {
                                setDialogType('vision_text');
                                setDialogMode('edit');
                                setFormData({
                                  vision_text: missionContent.vision_text,
                                  vision_highlight: missionContent.vision_highlight
                                });
                                setShowDialog(true);
                              }}
                              size="sm"
                              className="bg-blue-700"
                              data-testid="edit-vision-btn"
                            >
                              <Edit className="w-4 h-4 ml-2" />
                              تعديل النصوص
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2 text-gray-700">نص الرؤية:</h4>
                              <p className="text-gray-600 whitespace-pre-line bg-gray-50 p-4 rounded text-sm">{missionContent.vision_text}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2 text-gray-700">النص المميز:</h4>
                              <p className="text-emerald-900 font-semibold bg-emerald-50 p-4 rounded">{missionContent.vision_highlight}</p>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2 text-gray-700">صورة الرؤية:</h4>
                            {missionContent.vision_image ? (
                              <div className="relative group">
                                <img 
                                  src={missionContent.vision_image} 
                                  alt="صورة الرؤية" 
                                  className="w-full h-64 object-cover rounded-lg border-2 border-gray-300"
                                />
                                <div className="absolute top-2 left-2">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={async () => {
                                      if (window.confirm('هل أنت متأكد من حذف الصورة؟')) {
                                        try {
                                          await axios.put(`${API_URL}/mission-content`, { vision_image: '' });
                                          toast.success('تم حذف الصورة');
                                          fetchAllData();
                                        } catch (error) {
                                          toast.error('فشل حذف الصورة');
                                        }
                                      }
                                    }}
                                    data-testid="delete-image-btn"
                                  >
                                    <Trash2 className="w-4 h-4 ml-1" />
                                    حذف
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <p className="text-gray-500">لا توجد صورة</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* قسم المبادئ */}
                      <div className="border rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-xl">المبادئ الأساسية ({missionContent.principles?.length || 0})</h3>
                          <Button 
                            onClick={() => {
                              setDialogType('principle');
                              setDialogMode('create');
                              setFormData({icon: '🌱', title: '', description: ''});
                              setShowDialog(true);
                            }}
                            size="sm"
                            className="bg-emerald-700"
                            data-testid="add-principle-btn"
                          >
                            <Plus className="w-4 h-4 ml-2" />
                            إضافة مبدأ
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {missionContent.principles?.map((principle, idx) => (
                            <div key={idx} className="bg-gray-50 p-4 rounded border hover:shadow-md transition-shadow">
                              <div className="text-4xl mb-3">{principle.icon}</div>
                              <h4 className="font-bold mb-2 text-lg">{principle.title}</h4>
                              <p className="text-sm text-gray-600 mb-4">{principle.description}</p>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setDialogType('principle');
                                    setDialogMode('edit');
                                    setFormData({...principle, index: idx});
                                    setShowDialog(true);
                                  }}
                                  data-testid={`edit-principle-${idx}`}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={async () => {
                                    if (window.confirm('هل أنت متأكد من الحذف؟')) {
                                      try {
                                        const newPrinciples = missionContent.principles.filter((_, i) => i !== idx);
                                        await axios.put(`${API_URL}/mission-content`, { principles: newPrinciples });
                                        toast.success('تم الحذف بنجاح');
                                        fetchAllData();
                                      } catch (error) {
                                        toast.error('فشل الحذف');
                                      }
                                    }
                                  }}
                                  data-testid={`delete-principle-${idx}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* قسم النماذج */}
                      <div className="border rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-xl">نماذج التحول</h3>
                          <Button 
                            onClick={() => {
                              setDialogType('models');
                              setDialogMode('edit');
                              setFormData({
                                old_model: missionContent.old_model || [],
                                new_model: missionContent.new_model || []
                              });
                              setShowDialog(true);
                            }}
                            size="sm"
                            className="bg-purple-700"
                            data-testid="edit-models-btn"
                          >
                            <Edit className="w-4 h-4 ml-2" />
                            تعديل النماذج
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-red-50 p-4 rounded border-t-4 border-red-600">
                            <h4 className="font-bold mb-3 text-red-900">النموذج التقليدي</h4>
                            <ul className="space-y-2">
                              {missionContent.old_model?.map((item, idx) => (
                                <li key={idx} className="text-sm flex items-start gap-2">
                                  <span className="text-red-600 font-bold">✗</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-green-50 p-4 rounded border-t-4 border-emerald-600">
                            <h4 className="font-bold mb-3 text-emerald-900">نموذجنا التحويلي</h4>
                            <ul className="space-y-2">
                              {missionContent.new_model?.map((item, idx) => (
                                <li key={idx} className="text-sm flex items-start gap-2">
                                  <span className="text-emerald-600 font-bold">✓</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* قسم الشهادات */}
                      <div className="border rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-xl">الشهادات ({missionContent.testimonials?.length || 0})</h3>
                          <Button 
                            onClick={() => {
                              setDialogType('testimonial');
                              setDialogMode('create');
                              setFormData({name: '', role: '', text: '', avatar: ''});
                              setShowDialog(true);
                            }}
                            size="sm"
                            className="bg-amber-700"
                            data-testid="add-testimonial-btn"
                          >
                            <Plus className="w-4 h-4 ml-2" />
                            إضافة شهادة
                          </Button>
                        </div>
                        <div className="space-y-4">
                          {missionContent.testimonials?.map((testimonial, idx) => (
                            <div key={idx} className="bg-gray-50 p-4 rounded border flex items-start gap-4 hover:shadow-md transition-shadow">
                              <div className="w-14 h-14 bg-emerald-700 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                                {testimonial.avatar}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-lg">{testimonial.name}</h4>
                                <p className="text-sm text-gray-500 mb-2">{testimonial.role}</p>
                                <p className="text-sm text-gray-700 italic">"{testimonial.text}"</p>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setDialogType('testimonial');
                                    setDialogMode('edit');
                                    setFormData({...testimonial, index: idx});
                                    setShowDialog(true);
                                  }}
                                  data-testid={`edit-testimonial-${idx}`}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={async () => {
                                    if (window.confirm('هل أنت متأكد من الحذف؟')) {
                                      try {
                                        const newTestimonials = missionContent.testimonials.filter((_, i) => i !== idx);
                                        await axios.put(`${API_URL}/mission-content`, { testimonials: newTestimonials });
                                        toast.success('تم الحذف بنجاح');
                                        fetchAllData();
                                      } catch (error) {
                                        toast.error('فشل الحذف');
                                      }
                                    }
                                  }}
                                  data-testid={`delete-testimonial-${idx}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Donations Tab */}
            <TabsContent value="donations">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">سجل التبرعات</h2>
                <div className="space-y-4">
                  {donations.map((donation) => (
                    <div key={donation.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold">{donation.donor_name}</h3>
                          <p className="text-sm text-gray-600">النوع: {donation.type}</p>
                          {donation.amount && <p className="text-sm text-gray-600">المبلغ: {donation.amount.toLocaleString()} ل.س</p>}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          donation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {donation.status === 'pending' ? 'قيد المعالجة' : 'مكتمل'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* View Member Details Dialog */}
      <Dialog open={viewMemberDialog} onOpenChange={setViewMemberDialog}>
        <DialogContent className="sm:max-w-3xl" data-testid="view-member-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-right">تفاصيل عضو اللجنة</DialogTitle>
          </DialogHeader>
          {viewingMember && (
            <div className="space-y-6">
              {/* الصورة الشخصية */}
              {viewingMember.image && (
                <div className="flex justify-center">
                  <img 
                    src={viewingMember.image} 
                    alt={viewingMember.first_name} 
                    className="w-32 h-32 rounded-full object-cover border-4 border-emerald-100"
                  />
                </div>
              )}
              
              {/* المعلومات الأساسية */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div className="text-right">
                  <span className="text-sm text-gray-600 font-semibold">الاسم الكامل:</span>
                  <p className="text-lg text-gray-900 mt-1">
                    {viewingMember.first_name} {viewingMember.father_name} {viewingMember.last_name}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-600 font-semibold">الحي:</span>
                  <p className="text-lg text-gray-900 mt-1">
                    {neighborhoods.find(n => n.id === viewingMember.neighborhood_id)?.name || '-'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-600 font-semibold">المنصب:</span>
                  <p className="text-lg text-gray-900 mt-1">
                    {positions.find(p => p.id === viewingMember.position_id)?.title || '-'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-600 font-semibold">رقم الهاتف:</span>
                  <p className="text-lg text-gray-900 mt-1 font-semibold text-emerald-700">
                    {viewingMember.phone}
                  </p>
                </div>
              </div>

              {/* المعلومات الشخصية */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-right bg-white p-3 rounded-lg border">
                  <span className="text-sm text-gray-600 font-semibold">المواليد:</span>
                  <p className="text-base text-gray-900 mt-1">{viewingMember.date_of_birth || '-'}</p>
                </div>
                <div className="text-right bg-white p-3 rounded-lg border">
                  <span className="text-sm text-gray-600 font-semibold">العمل:</span>
                  <p className="text-base text-gray-900 mt-1">{viewingMember.occupation || '-'}</p>
                </div>
                <div className="text-right bg-white p-3 rounded-lg border">
                  <span className="text-sm text-gray-600 font-semibold">المؤهل الدراسي:</span>
                  <p className="text-base text-gray-900 mt-1">{viewingMember.education || '-'}</p>
                </div>
              </div>

              {/* العنوان والبريد */}
              {(viewingMember.address || viewingMember.email) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viewingMember.address && (
                    <div className="text-right bg-white p-3 rounded-lg border">
                      <span className="text-sm text-gray-600 font-semibold">العنوان:</span>
                      <p className="text-base text-gray-900 mt-1">{viewingMember.address}</p>
                    </div>
                  )}
                  {viewingMember.email && (
                    <div className="text-right bg-white p-3 rounded-lg border">
                      <span className="text-sm text-gray-600 font-semibold">البريد الإلكتروني:</span>
                      <p className="text-base text-gray-900 mt-1">{viewingMember.email}</p>
                    </div>
                  )}
                </div>
              )}

              {/* التواريخ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-right">
                  <span className="text-xs text-gray-500">تاريخ الإضافة:</span>
                  <p className="text-sm text-gray-700 mt-1">
                    {viewingMember.created_at ? new Date(viewingMember.created_at).toLocaleString('ar-SY', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">آخر تعديل:</span>
                  <p className="text-sm text-gray-700 mt-1">
                    {viewingMember.updated_at ? new Date(viewingMember.updated_at).toLocaleString('ar-SY', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </p>
                </div>
              </div>

              {/* زر الإغلاق */}
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={() => setViewMemberDialog(false)}
                  className="bg-emerald-700 hover:bg-emerald-800 px-8"
                >
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-2xl" data-testid="admin-dialog">
          <DialogHeader>
            <DialogTitle className="text-right text-2xl">
              {dialogMode === 'create' ? 'إضافة' : 'تعديل'} {
                dialogType === 'vision_text' ? 'نصوص الرؤية' :
                dialogType === 'vision_image' ? 'صورة الرؤية' :
                dialogType === 'principle' ? 'مبدأ' :
                dialogType === 'testimonial' ? 'شهادة' :
                dialogType === 'models' ? 'النماذج' :
                dialogType
              }
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {renderFormFields()}
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                إلغاء
              </Button>
              <Button type="submit" className="bg-emerald-700" data-testid="submit-form-btn">
                {dialogMode === 'create' ? 'إضافة' : 'تحديث'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Users, Heart, Activity, GraduationCap, Building2, HandHeart, BookOpen } from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

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

  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [dialogMode, setDialogMode] = useState('create'); // create or edit
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [statsRes, familiesRes, healthRes, coursesRes, projectsRes, initiativesRes, storiesRes, donationsRes, missionRes] = await Promise.all([
        axios.get(`${API_URL}/stats`),
        axios.get(`${API_URL}/families`),
        axios.get(`${API_URL}/health-cases`),
        axios.get(`${API_URL}/courses`),
        axios.get(`${API_URL}/projects`),
        axios.get(`${API_URL}/initiatives`),
        axios.get(`${API_URL}/stories`),
        axios.get(`${API_URL}/donations`),
        axios.get(`${API_URL}/mission-content`)
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
    } catch (error) {
      toast.error('فشل تحميل البيانات');
    }
  };

  const openCreateDialog = (type) => {
    setDialogType(type);
    setDialogMode('create');
    setFormData({});
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (dialogMode === 'create') {
        await axios.post(`${API_URL}/${dialogType}`, formData);
        toast.success('تم الإضافة بنجاح');
      } else {
        await axios.put(`${API_URL}/${dialogType}/${currentItem.id}`, formData);
        toast.success('تم التحديث بنجاح');
      }
      setShowDialog(false);
      fetchAllData();
    } catch (error) {
      toast.error('فشل العملية');
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;
    
    try {
      await axios.delete(`${API_URL}/${type}/${id}`);
      toast.success('تم الحذف بنجاح');
      fetchAllData();
    } catch (error) {
      toast.error('فشل الحذف');
    }
  };

  const renderFormFields = () => {
    switch (dialogType) {
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
              <TabsTrigger value="families" data-testid="tab-families">العائلات</TabsTrigger>
              <TabsTrigger value="health" data-testid="tab-health">الحالات الصحية</TabsTrigger>
              <TabsTrigger value="courses" data-testid="tab-courses">الدورات</TabsTrigger>
              <TabsTrigger value="projects" data-testid="tab-projects">المشاريع</TabsTrigger>
              <TabsTrigger value="initiatives" data-testid="tab-initiatives">المبادرات</TabsTrigger>
              <TabsTrigger value="stories" data-testid="tab-stories">قصص النجاح</TabsTrigger>
              <TabsTrigger value="mission" data-testid="tab-mission">رؤيتنا ورسالتنا</TabsTrigger>
              <TabsTrigger value="donations" data-testid="tab-donations">التبرعات</TabsTrigger>
            </TabsList>

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
                <div className="space-y-6">
                  {missionContent && (
                    <>
                      <div className="border rounded-lg p-4">
                        <h3 className="font-bold text-lg mb-2">نص الرؤية</h3>
                        <p className="text-gray-700 whitespace-pre-line">{missionContent.vision_text}</p>
                      </div>
                      
                      <div className="border rounded-lg p-4 bg-emerald-50">
                        <h3 className="font-bold text-lg mb-2">النص المميز</h3>
                        <p className="text-emerald-900 font-semibold">{missionContent.vision_highlight}</p>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h3 className="font-bold text-lg mb-4">المبادئ ({missionContent.principles?.length || 0})</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {missionContent.principles?.map((principle, idx) => (
                            <div key={idx} className="bg-gray-50 p-4 rounded">
                              <div className="text-3xl mb-2">{principle.icon}</div>
                              <h4 className="font-bold mb-1">{principle.title}</h4>
                              <p className="text-sm text-gray-600">{principle.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h3 className="font-bold text-lg mb-4">الشهادات ({missionContent.testimonials?.length || 0})</h3>
                        <div className="space-y-3">
                          {missionContent.testimonials?.map((testimonial, idx) => (
                            <div key={idx} className="bg-gray-50 p-4 rounded flex items-start gap-3">
                              <div className="w-12 h-12 bg-emerald-700 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                {testimonial.avatar}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold">{testimonial.name}</h4>
                                <p className="text-sm text-gray-500">{testimonial.role}</p>
                                <p className="text-sm text-gray-700 mt-2 italic">"{testimonial.text}"</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800">
                          ℹ️ لتعديل محتوى هذه الصفحة، يمكنك إضافة نموذج تعديل أو استخدام API مباشرة.
                        </p>
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

      {/* Form Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-2xl" data-testid="admin-dialog">
          <DialogHeader>
            <DialogTitle className="text-right text-2xl">
              {dialogMode === 'create' ? 'إضافة' : 'تعديل'} {dialogType}
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

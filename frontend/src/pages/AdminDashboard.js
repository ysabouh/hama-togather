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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Users, Heart, Activity, GraduationCap, Building2, HandHeart, BookOpen, MapPin, Eye, Loader2, UserCheck, UserX, CheckCircle, XCircle, ArrowUpDown, ArrowUp, ArrowDown, ArrowRight, Search, X, Menu, ChevronDown, Tag, AlertCircle } from 'lucide-react';
import ReferenceDataManagement from '../components/admin/ReferenceDataManagement';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

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
  const [jobs, setJobs] = useState([]);
  const [educationLevels, setEducationLevels] = useState([]);
  const [users, setUsers] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [familyCategories, setFamilyCategories] = useState([]);
  const [incomeLevels, setIncomeLevels] = useState([]);
  const [showInactiveMembers, setShowInactiveMembers] = useState(false);
  const [showInactiveRoles, setShowInactiveRoles] = useState(false);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [neighborhoodsPage, setNeighborhoodsPage] = useState(1);
  const [neighborhoodsTotal, setNeighborhoodsTotal] = useState(0);
  const [neighborhoodsTotalPages, setNeighborhoodsTotalPages] = useState(0);
  const [showInactiveNeighborhoods, setShowInactiveNeighborhoods] = useState(false);
  const [neighborhoodsSortColumn, setNeighborhoodsSortColumn] = useState(null);
  const [neighborhoodsSortDirection, setNeighborhoodsSortDirection] = useState('asc');
  const [neighborhoodsSearchQuery, setNeighborhoodsSearchQuery] = useState('');
  const [usersSearchQuery, setUsersSearchQuery] = useState('');
  const [usersSortColumn, setUsersSortColumn] = useState(null);
  const [usersSortDirection, setUsersSortDirection] = useState('asc');
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);
  const [viewMemberDialog, setViewMemberDialog] = useState(false);
  const [viewingMember, setViewingMember] = useState(null);
  const [showNeighborhoodDetails, setShowNeighborhoodDetails] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // حالات التحميل لكل قائمة
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [loadingCommittees, setLoadingCommittees] = useState(false);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingEducations, setLoadingEducations] = useState(false);
  const [loadingUserRoles, setLoadingUserRoles] = useState(false);
  const [loadingFamilyCategories, setLoadingFamilyCategories] = useState(false);
  const [showInactiveFamilyCategories, setShowInactiveFamilyCategories] = useState(false);
  const [loadingIncomeLevels, setLoadingIncomeLevels] = useState(false);
  const [showInactiveIncomeLevels, setShowInactiveIncomeLevels] = useState(false);
  const [needAssessments, setNeedAssessments] = useState([]);
  const [loadingNeedAssessments, setLoadingNeedAssessments] = useState(false);
  const [showInactiveNeedAssessments, setShowInactiveNeedAssessments] = useState(false);
  const [needs, setNeeds] = useState([]);
  const [loadingNeeds, setLoadingNeeds] = useState(false);
  const [showInactiveNeeds, setShowInactiveNeeds] = useState(false);
  const [showInactiveFamilies, setShowInactiveFamilies] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [showFamilyDetails, setShowFamilyDetails] = useState(false);
  const [familiesSearchQuery, setFamiliesSearchQuery] = useState('');
  const [familiesPage, setFamiliesPage] = useState(1);
  const familiesPerPage = 10;

  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [dialogMode, setDialogMode] = useState('create'); // create or edit
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [activeNeighborhoodTab, setActiveNeighborhoodTab] = useState('neighborhoods');
  const [activeUsersTab, setActiveUsersTab] = useState('users');
  const [activeSiteTab, setActiveSiteTab] = useState('hero');
  const [activeFamiliesTab, setActiveFamiliesTab] = useState('families');

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
    // تعيين جميع حالات التحميل إلى true
    setLoadingUsers(true);
    setLoadingNeighborhoods(true);
    setLoadingCommittees(true);
    setLoadingPositions(true);
    setLoadingJobs(true);
    setLoadingEducations(true);
    setLoadingUserRoles(true);
    setLoadingFamilyCategories(true);
    setLoadingIncomeLevels(true);
    setLoadingNeedAssessments(true);
    setLoadingNeeds(true);
    
    try {
      const [statsRes, familiesRes, healthRes, coursesRes, projectsRes, initiativesRes, storiesRes, donationsRes, missionRes, heroRes, neighborhoodsRes, positionsRes, committeeMembersRes, jobsRes, educationLevelsRes, usersRes, userRolesRes, familyCategoriesRes, incomeLevelsRes, needAssessmentsRes, needsRes] = await Promise.all([
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
        axios.get(`${API_URL}/committee-members`),
        axios.get(`${API_URL}/jobs`),
        axios.get(`${API_URL}/education-levels`),
        axios.get(`${API_URL}/users`),
        axios.get(`${API_URL}/user-roles`),
        axios.get(`${API_URL}/family-categories`),
        axios.get(`${API_URL}/income-levels`),
        axios.get(`${API_URL}/need-assessments`),
        axios.get(`${API_URL}/needs`)
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
      setJobs(jobsRes.data);
      setEducationLevels(educationLevelsRes.data);
      setUsers(usersRes.data);
      setUserRoles(userRolesRes.data);
      setFamilyCategories(familyCategoriesRes.data);
      setIncomeLevels(incomeLevelsRes.data);
      setNeedAssessments(needAssessmentsRes.data);
      setNeeds(needsRes.data);
    } catch (error) {
      toast.error('فشل تحميل البيانات');
    } finally {
      // إيقاف جميع حالات التحميل
      setLoadingUsers(false);
      setLoadingNeighborhoods(false);
      setLoadingCommittees(false);
      setLoadingPositions(false);
      setLoadingJobs(false);
      setLoadingEducations(false);
      setLoadingUserRoles(false);
      setLoadingFamilyCategories(false);
      setLoadingIncomeLevels(false);
      setLoadingNeedAssessments(false);
      setLoadingNeeds(false);
    }
  };

  const openCreateDialog = (type) => {
    setDialogType(type);
    setDialogMode('create');
    // Set default values
    if (type === 'neighborhood') {
      setFormData({
        is_active: true,
        families_count: 0,
        population_count: 0
      });
    } else if (type === 'position' || type === 'job' || type === 'education' || type === 'user-role' || type === 'family-category' || type === 'income-level') {
      setFormData({
        is_active: true
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

  const openNeighborhoodDetails = (neighborhood) => {
    setSelectedNeighborhood(neighborhood);
    setShowNeighborhoodDetails(true);
  };

  const closeNeighborhoodDetails = () => {
    setShowNeighborhoodDetails(false);
    setSelectedNeighborhood(null);
  };

  const toggleMemberStatus = async (member) => {
    const action = member.is_active ? 'إيقاف' : 'تفعيل';
    if (!window.confirm(`هل أنت متأكد من ${action} هذا العضو؟`)) return;
    
    setLoading(true);
    const loadingToast = toast.loading(`جارٍ ${action} العضو...`);
    
    try {
      await axios.put(`${API_URL}/committee-members/${member.id}`, {
        is_active: !member.is_active
      });
      toast.dismiss(loadingToast);
      toast.success(`تم ${action} العضو بنجاح`);
      fetchAllData();
    } catch (error) {
      console.error('Toggle status error:', error);
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.detail || `فشل ${action} العضو`);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction if clicking same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortedMembers = () => {
    // Filter by active status
    let filtered = committeeMembers.filter(m => showInactiveMembers || m.is_active !== false);
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(member => {
        const fullName = `${member.first_name} ${member.father_name} ${member.last_name}`.toLowerCase();
        const neighborhood = neighborhoods.find(n => n.id === member.neighborhood_id)?.name.toLowerCase() || '';
        const position = positions.find(p => p.id === member.position_id)?.title.toLowerCase() || '';
        const occupation = (member.occupation || '').toLowerCase();
        const education = (member.education || '').toLowerCase();
        const phone = (member.phone || '').toLowerCase();
        
        return fullName.includes(query) ||
               neighborhood.includes(query) ||
               position.includes(query) ||
               occupation.includes(query) ||
               education.includes(query) ||
               phone.includes(query);
      });
    }
    
    if (!sortColumn) return filtered;

    return [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (sortColumn) {
        case 'name':
          aValue = `${a.first_name} ${a.father_name} ${a.last_name}`;
          bValue = `${b.first_name} ${b.father_name} ${b.last_name}`;
          break;
        case 'neighborhood':
          aValue = neighborhoods.find(n => n.id === a.neighborhood_id)?.name || '';
          bValue = neighborhoods.find(n => n.id === b.neighborhood_id)?.name || '';
          break;
        case 'position':
          aValue = positions.find(p => p.id === a.position_id)?.title || '';
          bValue = positions.find(p => p.id === b.position_id)?.title || '';
          break;
        case 'age':
          aValue = a.date_of_birth ? calculateAge(a.date_of_birth) : -1;
          bValue = b.date_of_birth ? calculateAge(b.date_of_birth) : -1;
          break;
        case 'occupation':
          aValue = a.occupation || '';
          bValue = b.occupation || '';
          break;
        case 'education':
          aValue = a.education || '';
          bValue = b.education || '';
          break;
        case 'created_at':
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at || 0);
          bValue = new Date(b.updated_at || 0);
          break;
        case 'status':
          aValue = a.is_active !== false ? 1 : 0;
          bValue = b.is_active !== false ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const SortIcon = ({ column }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-emerald-600" /> : 
      <ArrowDown className="w-4 h-4 text-emerald-600" />;
  };

  // Neighborhoods sorting and filtering
  const handleNeighborhoodSort = (column) => {
    if (neighborhoodsSortColumn === column) {
      setNeighborhoodsSortDirection(neighborhoodsSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setNeighborhoodsSortColumn(column);
      setNeighborhoodsSortDirection('asc');
    }
  };

  const getSortedNeighborhoods = () => {
    let filtered = neighborhoods.filter(n => showInactiveNeighborhoods || n.is_active !== false);
    
    if (neighborhoodsSearchQuery.trim()) {
      const query = neighborhoodsSearchQuery.toLowerCase();
      filtered = filtered.filter(neighborhood => {
        const name = (neighborhood.name || '').toLowerCase();
        const number = (neighborhood.number || '').toLowerCase();
        
        return name.includes(query) || number.includes(query);
      });
    }
    
    if (!neighborhoodsSortColumn) return filtered;

    return [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (neighborhoodsSortColumn) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'number':
          aValue = a.number || '';
          bValue = b.number || '';
          break;
        case 'families_count':
          aValue = a.families_count || 0;
          bValue = b.families_count || 0;
          break;
        case 'population_count':
          aValue = a.population_count || 0;
          bValue = b.population_count || 0;
          break;
        case 'created_at':
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at || 0);
          bValue = new Date(b.updated_at || 0);
          break;
        case 'status':
          aValue = a.is_active !== false ? 1 : 0;
          bValue = b.is_active !== false ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return neighborhoodsSortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return neighborhoodsSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const NeighborhoodSortIcon = ({ column }) => {
    if (neighborhoodsSortColumn !== column) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return neighborhoodsSortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-emerald-600" /> : 
      <ArrowDown className="w-4 h-4 text-emerald-600" />;
  };

  const toggleNeighborhoodStatus = async (neighborhood) => {
    const action = neighborhood.is_active ? 'إيقاف' : 'تفعيل';
    if (!window.confirm(`هل أنت متأكد من ${action} هذا الحي؟`)) return;
    
    setLoading(true);
    const loadingToast = toast.loading(`جارٍ ${action} الحي...`);
    
    try {
      await axios.put(`${API_URL}/neighborhoods/${neighborhood.id}`, {
        is_active: !neighborhood.is_active
      });
      toast.dismiss(loadingToast);
      toast.success(`تم ${action} الحي بنجاح`);
      fetchAllData();
    } catch (error) {
      console.error('Toggle status error:', error);
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.detail || `فشل ${action} الحي`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const loadingToast = toast.loading(dialogMode === 'create' ? 'جارٍ الإضافة...' : 'جارٍ التحديث...');
    
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
      } else {
        // Handle regular CRUD operations
        let endpoint = dialogType;
        if (dialogType === 'neighborhood') endpoint = 'neighborhoods';
        else if (dialogType === 'committee') endpoint = 'committee-members';
        else if (dialogType === 'position') endpoint = 'positions';
        else if (dialogType === 'job') endpoint = 'jobs';
        else if (dialogType === 'education') endpoint = 'education-levels';
        else if (dialogType === 'user-role') endpoint = 'user-roles';
        else if (dialogType === 'family-category') endpoint = 'family-categories';
        else if (dialogType === 'income-level') endpoint = 'income-levels';
        else if (dialogType === 'need-assessment') endpoint = 'need-assessments';
        else if (dialogType === 'need') endpoint = 'needs';
        
        if (dialogMode === 'create') {
          await axios.post(`${API_URL}/${endpoint}`, formData);
        } else {
          await axios.put(`${API_URL}/${endpoint}/${currentItem.id}`, formData);
        }
      }
      
      toast.dismiss(loadingToast);
      toast.success(dialogMode === 'create' ? 'تم الإضافة بنجاح' : 'تم التحديث بنجاح');
      setShowDialog(false);
      fetchAllData();
    } catch (error) {
      console.error('Error:', error);
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.detail || 'فشل العملية');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;
    
    setLoading(true);
    const loadingToast = toast.loading('جارٍ الحذف...');
    
    try {
      let endpoint = type;
      if (type === 'neighborhood') endpoint = 'neighborhoods';
      else if (type === 'committee') endpoint = 'committee-members';
      else if (type === 'position') endpoint = 'positions';
      else if (type === 'job') endpoint = 'jobs';
      else if (type === 'education') endpoint = 'education-levels';
      else if (type === 'user-role') endpoint = 'user-roles';
      
      await axios.delete(`${API_URL}/${endpoint}/${id}`);
      toast.dismiss(loadingToast);
      toast.success('تم الحذف بنجاح');
      fetchAllData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.detail || 'فشل الحذف');
    } finally {
      setLoading(false);
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
                  options={jobs.filter(j => j.is_active).map(j => ({ value: j.title, label: j.title }))}
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
                  options={educationLevels.filter(e => e.is_active).map(e => ({ value: e.title, label: e.title }))}
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
            {dialogMode === 'edit' && formData.family_number && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <Label className="text-blue-900 font-semibold">رقم العائلة (تلقائي)</Label>
                <p className="text-xl font-bold text-blue-700 mt-1">{formData.family_number}</p>
                <p className="text-xs text-blue-600 mt-1">* هذا الرقم تم توليده تلقائياً وغير قابل للتعديل</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>رمز العائلة</Label>
                <Input 
                  value={formData.family_code || ''} 
                  onChange={(e) => setFormData({...formData, family_code: e.target.value})} 
                  placeholder="مثال: FAM-A1"
                />
              </div>
              <div>
                <Label>اسم الفاك (اسم مستعار)</Label>
                <Input 
                  value={formData.fac_name || ''} 
                  onChange={(e) => setFormData({...formData, fac_name: e.target.value})} 
                  placeholder="اسم مستعار للعائلة"
                />
              </div>
            </div>
            <div>
              <Label>اسم العائلة الحقيقي</Label>
              <Input value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>رقم الهاتف</Label>
                <Input 
                  type="tel" 
                  value={formData.phone || ''} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  placeholder="09xxxxxxxx"
                  dir="ltr"
                />
              </div>
              <div>
                <Label>عدد الأفراد</Label>
                <Input type="number" value={formData.members_count || ''} onChange={(e) => setFormData({...formData, members_count: parseInt(e.target.value)})} required />
              </div>
            </div>
            <div className="border-t pt-4 mt-4">
              <h4 className="text-md font-semibold text-gray-700 mb-3">معلومات المعيل (رب العائلة)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>الاسم الأول</Label>
                  <Input 
                    value={formData.provider_first_name || ''} 
                    onChange={(e) => setFormData({...formData, provider_first_name: e.target.value})} 
                    placeholder="مثال: محمد"
                  />
                </div>
                <div>
                  <Label>اسم الأب</Label>
                  <Input 
                    value={formData.provider_father_name || ''} 
                    onChange={(e) => setFormData({...formData, provider_father_name: e.target.value})} 
                    placeholder="مثال: أحمد"
                  />
                </div>
                <div>
                  <Label>الكنية</Label>
                  <Input 
                    value={formData.provider_surname || ''} 
                    onChange={(e) => setFormData({...formData, provider_surname: e.target.value})} 
                    placeholder="مثال: أبو خالد"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label>تصنيف العائلة</Label>
              <select 
                value={formData.category_id || ''} 
                onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">اختر التصنيف</option>
                {familyCategories.filter(c => c.is_active !== false).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>مستوى الدخل الشهري</Label>
              <select 
                value={formData.income_level_id || ''} 
                onChange={(e) => setFormData({...formData, income_level_id: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">اختر مستوى الدخل</option>
                {incomeLevels.filter(l => l.is_active !== false).map(level => (
                  <option key={level.id} value={level.id}>
                    {level.name} ({level.min_amount || 0} - {level.max_amount ? level.max_amount + ' ل.س' : 'أكثر'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>الحي</Label>
              <select 
                value={formData.neighborhood_id || ''} 
                onChange={(e) => setFormData({...formData, neighborhood_id: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">اختر الحي</option>
                {neighborhoods.filter(n => n.is_deleted !== true).map(neighborhood => (
                  <option key={neighborhood.id} value={neighborhood.id}>{neighborhood.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>تقييم الاحتياج من قبل اللجنة</Label>
              <select 
                value={formData.need_assessment || ''} 
                onChange={(e) => setFormData({...formData, need_assessment: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">اختر التقييم</option>
                <option value="منخفض">منخفض</option>
                <option value="متوسط">متوسط</option>
                <option value="مرتفع">مرتفع</option>
                <option value="حرج/عاجل">حرج/عاجل</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="father_present"
                  checked={formData.father_present ?? false}
                  onChange={(e) => setFormData({...formData, father_present: e.target.checked})}
                  className="w-4 h-4"
                />
                <Label htmlFor="father_present">الأب موجود</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="mother_present"
                  checked={formData.mother_present ?? false}
                  onChange={(e) => setFormData({...formData, mother_present: e.target.checked})}
                  className="w-4 h-4"
                />
                <Label htmlFor="mother_present">الأم موجودة</Label>
              </div>
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

      case 'position':
        return (
          <>
            <div>
              <Label>المنصب</Label>
              <Input value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active_position"
                checked={formData.is_active ?? true}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="w-4 h-4"
              />
              <Label htmlFor="is_active_position">نشط</Label>
            </div>
          </>
        );

      case 'job':
        return (
          <>
            <div>
              <Label>اسم العمل</Label>
              <Input value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active_job"
                checked={formData.is_active ?? true}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="w-4 h-4"
              />
              <Label htmlFor="is_active_job">نشط</Label>
            </div>
          </>
        );

      case 'education':
        return (
          <>
            <div>
              <Label>المؤهل الدراسي</Label>
              <Input value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active_edu"
                checked={formData.is_active ?? true}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="w-4 h-4"
              />
              <Label htmlFor="is_active_edu">نشط</Label>
            </div>
          </>
        );

      case 'user-role':
        return (
          <>
            <div>
              <Label>الاسم المعروض (بالعربية)</Label>
              <Input 
                value={formData.display_name || ''} 
                onChange={(e) => setFormData({...formData, display_name: e.target.value})} 
                placeholder="مثال: مدير نظام"
                required 
              />
            </div>
            <div>
              <Label>اسم الدور (بالإنجليزية)</Label>
              <Input 
                value={formData.name || ''} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="example: admin"
                required 
                dir="ltr"
              />
              <p className="text-xs text-gray-500 mt-1">يُستخدم في النظام (بدون مسافات، أحرف صغيرة)</p>
            </div>
            <div>
              <Label>الوصف (اختياري)</Label>
              <Textarea 
                value={formData.description || ''} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                placeholder="وصف صلاحيات هذا الدور"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active_role"
                checked={formData.is_active ?? true}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="w-4 h-4"
              />
              <Label htmlFor="is_active_role">نشط</Label>
            </div>
          </>
        );

      case 'family-category':
        return (
          <>
            <div>
              <Label>اسم التصنيف</Label>
              <Input 
                value={formData.name || ''} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="مثال: أسر محتاجة"
                required 
              />
            </div>
            <div>
              <Label>الوصف (اختياري)</Label>
              <Textarea 
                value={formData.description || ''} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                placeholder="وصف التصنيف"
                rows={3}
              />
            </div>
            <div>
              <Label>اللون (اختياري)</Label>
              <Input 
                type="color"
                value={formData.color || '#3B82F6'} 
                onChange={(e) => setFormData({...formData, color: e.target.value})} 
                className="h-12 cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">اختر لوناً مميزاً لهذا التصنيف</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active_category"
                checked={formData.is_active ?? true}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="w-4 h-4"
              />
              <Label htmlFor="is_active_category">نشط</Label>
            </div>
          </>
        );

      case 'income-level':
        return (
          <>
            <div>
              <Label>اسم المستوى</Label>
              <Input 
                value={formData.name || ''} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="مثال: منخفض"
                required 
              />
            </div>
            <div>
              <Label>الوصف (اختياري)</Label>
              <Textarea 
                value={formData.description || ''} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                placeholder="وصف مستوى الدخل"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الحد الأدنى (ل.س)</Label>
                <Input 
                  type="number"
                  min="0"
                  value={formData.min_amount || 0} 
                  onChange={(e) => setFormData({...formData, min_amount: parseInt(e.target.value) || 0})} 
                />
              </div>
              <div>
                <Label>الحد الأقصى (ل.س)</Label>
                <Input 
                  type="number"
                  min="0"
                  value={formData.max_amount || ''} 
                  onChange={(e) => setFormData({...formData, max_amount: e.target.value ? parseInt(e.target.value) : null})} 
                  placeholder="اتركه فارغاً لـ (أكثر من)"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active_income"
                checked={formData.is_active ?? true}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="w-4 h-4"
              />
              <Label htmlFor="is_active_income">نشط</Label>
            </div>
          </>
        );

      case 'need-assessment':
        return (
          <>
            <div>
              <Label>اسم التقييم</Label>
              <Input 
                value={formData.name || ''} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="مثال: منخفض، متوسط، مرتفع"
                required 
              />
            </div>
            <div>
              <Label>الوصف (اختياري)</Label>
              <Textarea 
                value={formData.description || ''} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                placeholder="وصف مستوى الاحتياج"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الأولوية (0-10)</Label>
                <Input 
                  type="number"
                  min="0"
                  max="10"
                  value={formData.priority || 0} 
                  onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 0})} 
                  placeholder="رقم الأولوية"
                />
                <p className="text-xs text-gray-500 mt-1">الرقم الأقل = أولوية أعلى</p>
              </div>
              <div>
                <Label>اللون (Hex)</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color"
                    value={formData.color || '#3b82f6'} 
                    onChange={(e) => setFormData({...formData, color: e.target.value})} 
                    className="w-16 h-10 p-1"
                  />
                  <Input 
                    type="text"
                    value={formData.color || '#3b82f6'} 
                    onChange={(e) => setFormData({...formData, color: e.target.value})} 
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active_need"
                checked={formData.is_active ?? true}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="w-4 h-4"
              />
              <Label htmlFor="is_active_need">نشط</Label>
            </div>
          </>
        );

      case 'need':
        return (
          <>
            <div>
              <Label>اسم الاحتياج</Label>
              <Input 
                value={formData.name || ''} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="مثال: مواد غذائية، دعم تعليمي"
                required 
              />
            </div>
            <div>
              <Label>التوصيف (اختياري)</Label>
              <Textarea 
                value={formData.description || ''} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                placeholder="وصف تفصيلي للاحتياج"
                rows={3}
              />
            </div>
            <div>
              <Label>المبلغ الافتراضي المطلوب (ل.س)</Label>
              <Input 
                type="number"
                min="0"
                step="1000"
                value={formData.default_amount || ''} 
                onChange={(e) => setFormData({...formData, default_amount: parseFloat(e.target.value) || 0})} 
                placeholder="مثال: 500000"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active_need"
                checked={formData.is_active ?? true}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="w-4 h-4"
              />
              <Label htmlFor="is_active_need">نشط</Label>
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
              {/* القائمة المنسدلة للموقع */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <TabsTrigger value={activeSiteTab} data-testid="site-dropdown" className="relative">
                    الموقع
                    <ChevronDown className="w-4 h-4 mr-2" />
                  </TabsTrigger>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setActiveSiteTab('hero')} className="cursor-pointer">
                    <BookOpen className="w-4 h-4 ml-2" />
                    القسم الأول
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveSiteTab('health')} className="cursor-pointer">
                    <Activity className="w-4 h-4 ml-2" />
                    الحالات الصحية
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveSiteTab('courses')} className="cursor-pointer">
                    <GraduationCap className="w-4 h-4 ml-2" />
                    الدورات
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveSiteTab('projects')} className="cursor-pointer">
                    <Building2 className="w-4 h-4 ml-2" />
                    المشاريع
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveSiteTab('initiatives')} className="cursor-pointer">
                    <HandHeart className="w-4 h-4 ml-2" />
                    المبادرات
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveSiteTab('stories')} className="cursor-pointer">
                    <Heart className="w-4 h-4 ml-2" />
                    قصص النجاح
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveSiteTab('mission')} className="cursor-pointer">
                    <BookOpen className="w-4 h-4 ml-2" />
                    رؤيتنا ورسالتنا
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* القائمة المنسدلة للأحياء */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <TabsTrigger value={activeNeighborhoodTab} data-testid="neighborhoods-dropdown" className="relative">
                    الأحياء
                    <ChevronDown className="w-4 h-4 mr-2" />
                  </TabsTrigger>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setActiveNeighborhoodTab('neighborhoods')} className="cursor-pointer">
                    <MapPin className="w-4 h-4 ml-2" />
                    الأحياء
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveNeighborhoodTab('committees')} className="cursor-pointer">
                    <Users className="w-4 h-4 ml-2" />
                    لجان الأحياء
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveNeighborhoodTab('positions')} className="cursor-pointer">
                    <Building2 className="w-4 h-4 ml-2" />
                    المناصب
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveNeighborhoodTab('jobs')} className="cursor-pointer">
                    <BookOpen className="w-4 h-4 ml-2" />
                    قائمة الأعمال
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveNeighborhoodTab('education')} className="cursor-pointer">
                    <GraduationCap className="w-4 h-4 ml-2" />
                    المؤهلات الدراسية
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* القائمة المنسدلة للعائلات */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <TabsTrigger value={activeFamiliesTab} data-testid="families-dropdown" className="relative">
                    العائلات
                    <ChevronDown className="w-4 h-4 mr-2" />
                  </TabsTrigger>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setActiveFamiliesTab('families')} className="cursor-pointer">
                    <Users className="w-4 h-4 ml-2" />
                    قائمة العائلات
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFamiliesTab('family-categories')} className="cursor-pointer">
                    <Tag className="w-4 h-4 ml-2" />
                    تصنيف العائلات
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFamiliesTab('income-levels')} className="cursor-pointer">
                    <Building2 className="w-4 h-4 ml-2" />
                    مستويات الدخل
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFamiliesTab('need-assessments')} className="cursor-pointer">
                    <AlertCircle className="w-4 h-4 ml-2" />
                    تقييم الاحتياج
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFamiliesTab('needs')} className="cursor-pointer">
                    <Tag className="w-4 h-4 ml-2" />
                    الاحتياجات
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <TabsTrigger value="donations" data-testid="tab-donations">التبرعات</TabsTrigger>
              
              {/* القائمة المنسدلة للمستخدمين */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <TabsTrigger value={activeUsersTab} data-testid="users-dropdown" className="relative">
                    المستخدمين
                    <ChevronDown className="w-4 h-4 mr-2" />
                  </TabsTrigger>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setActiveUsersTab('users')} className="cursor-pointer">
                    <Users className="w-4 h-4 ml-2" />
                    قائمة المستخدمين
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveUsersTab('user-roles')} className="cursor-pointer">
                    <Building2 className="w-4 h-4 ml-2" />
                    أنواع المستخدمين
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
              {!showNeighborhoodDetails ? (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">إدارة الأحياء</h2>
                  <div className="flex gap-3 items-center">
                    {neighborhoodsSortColumn && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setNeighborhoodsSortColumn(null);
                          setNeighborhoodsSortDirection('asc');
                        }}
                        className="text-sm"
                      >
                        <X className="w-4 h-4 ml-2" />
                        إلغاء الفرز
                      </Button>
                    )}
                    <Button onClick={() => openCreateDialog('neighborhood')} className="bg-emerald-700" data-testid="add-neighborhood-btn">
                      <Plus className="w-5 h-5 ml-2" />
                      إضافة حي جديد
                    </Button>
                  </div>
                </div>

                {/* Search and Filter Controls */}
                <div className="mb-6 flex gap-4 items-center">
                  <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="بحث في الاسم، الرقم..."
                      value={neighborhoodsSearchQuery}
                      onChange={(e) => setNeighborhoodsSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                    {neighborhoodsSearchQuery && (
                      <button
                        onClick={() => setNeighborhoodsSearchQuery('')}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="show_inactive_neighborhoods"
                      checked={showInactiveNeighborhoods}
                      onChange={(e) => setShowInactiveNeighborhoods(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <Label htmlFor="show_inactive_neighborhoods" className="text-sm cursor-pointer">
                      عرض الأحياء غير النشطة
                    </Label>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="neighborhoods-table">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">#</th>
                        <th 
                          className="px-4 py-3 text-center text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleNeighborhoodSort('name')}
                        >
                          <div className="flex items-center justify-center gap-2">
                            الاسم
                            <NeighborhoodSortIcon column="name" />
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-center text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleNeighborhoodSort('number')}
                        >
                          <div className="flex items-center justify-center gap-2">
                            الرقم
                            <NeighborhoodSortIcon column="number" />
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-center text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleNeighborhoodSort('families_count')}
                        >
                          <div className="flex items-center justify-center gap-2">
                            عدد العوائل
                            <NeighborhoodSortIcon column="families_count" />
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-center text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleNeighborhoodSort('population_count')}
                        >
                          <div className="flex items-center justify-center gap-2">
                            عدد السكان
                            <NeighborhoodSortIcon column="population_count" />
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-center text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleNeighborhoodSort('status')}
                        >
                          <div className="flex items-center justify-center gap-2">
                            الحالة
                            <NeighborhoodSortIcon column="status" />
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-center text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleNeighborhoodSort('created_at')}
                        >
                          <div className="flex items-center justify-center gap-2">
                            تاريخ الإنشاء
                            <NeighborhoodSortIcon column="created_at" />
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-center text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleNeighborhoodSort('updated_at')}
                        >
                          <div className="flex items-center justify-center gap-2">
                            تاريخ التعديل
                            <NeighborhoodSortIcon column="updated_at" />
                          </div>
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {getSortedNeighborhoods().map((neighborhood, index) => (
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
                                onClick={() => openNeighborhoodDetails(neighborhood)}
                                className="text-emerald-600 hover:bg-emerald-50"
                                title="عرض التفاصيل واللجنة"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleNeighborhoodStatus(neighborhood)}
                                className={neighborhood.is_active ? "text-orange-600 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}
                                title={neighborhood.is_active ? "إيقاف الحي" : "تفعيل الحي"}
                              >
                                {neighborhood.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog('neighborhood', neighborhood)}
                                className="text-blue-600 hover:bg-blue-50"
                                title="تعديل"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {loadingNeighborhoods ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                      <p className="text-gray-500">جاري تحميل الأحياء...</p>
                    </div>
                  ) : getSortedNeighborhoods().length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {neighborhoodsSearchQuery ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد أحياء مسجلة حالياً'}
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
              ) : (
                /* صفحة تفاصيل الحي الداخلية */
                <div className="space-y-6">
                  {/* زر الرجوع */}
                  <div className="flex items-center gap-4 mb-6">
                    <Button 
                      onClick={closeNeighborhoodDetails}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <ArrowRight className="w-5 h-5" />
                      رجوع إلى قائمة الأحياء
                    </Button>
                  </div>

                  {selectedNeighborhood && (
                    <div className="space-y-6">
                      {/* معلومات الحي (Master) */}
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-8 border-r-4 border-emerald-600 shadow-lg">
                        <h2 className="text-3xl font-bold text-emerald-900 mb-6 flex items-center gap-3">
                          <MapPin className="w-8 h-8" />
                          معلومات الحي
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                            <p className="text-sm text-gray-600 mb-2 font-medium">اسم الحي</p>
                            <p className="text-2xl font-bold text-gray-900">{selectedNeighborhood.name}</p>
                          </div>
                          
                          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                            <p className="text-sm text-gray-600 mb-2 font-medium">رقم الحي</p>
                            <p className="text-2xl font-bold text-gray-900">{selectedNeighborhood.number}</p>
                          </div>
                          
                          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                            <p className="text-sm text-gray-600 mb-2 font-medium">الحالة</p>
                            <span className={`inline-flex px-4 py-2 rounded-full text-base font-semibold ${selectedNeighborhood.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {selectedNeighborhood.is_active ? 'نشط' : 'غير نشط'}
                            </span>
                          </div>
                          
                          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                            <p className="text-sm text-gray-600 mb-2 font-medium">عدد العوائل</p>
                            <p className="text-2xl font-bold text-emerald-700">{selectedNeighborhood.families_count || 0}</p>
                          </div>
                          
                          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                            <p className="text-sm text-gray-600 mb-2 font-medium">عدد السكان</p>
                            <p className="text-2xl font-bold text-emerald-700">{selectedNeighborhood.population_count || 0}</p>
                          </div>
                          
                          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                            <p className="text-sm text-gray-600 mb-2 font-medium">تاريخ الإنشاء</p>
                            <p className="text-lg font-medium text-gray-900">
                              {selectedNeighborhood.created_at ? new Date(selectedNeighborhood.created_at).toLocaleDateString('ar-SY') : '-'}
                            </p>
                          </div>
                          
                          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                            <p className="text-sm text-gray-600 mb-2 font-medium">تاريخ التحديث</p>
                            <p className="text-lg font-medium text-gray-900">
                              {selectedNeighborhood.updated_at ? new Date(selectedNeighborhood.updated_at).toLocaleDateString('ar-SY') : '-'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* أعضاء لجنة الحي (Details) */}
                      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-8 py-6 relative">
                          <div className="absolute inset-0 bg-black opacity-5"></div>
                          <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                                <Users className="w-8 h-8 text-white" />
                              </div>
                              <div>
                                <h2 className="text-3xl font-bold text-white mb-1">
                                  أعضاء لجنة الحي
                                </h2>
                                <p className="text-emerald-50 text-sm">
                                  {committeeMembers.filter(m => m.neighborhood_id === selectedNeighborhood.id && m.is_active !== false).length} عضو مسجل
                                </p>
                              </div>
                            </div>
                            <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                              <span className="text-white text-sm font-medium">نشط</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-8">
                          {committeeMembers.filter(m => m.neighborhood_id === selectedNeighborhood.id && m.is_active !== false).length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 border-b">#</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 border-b">الصورة</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 border-b">الاسم الكامل</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 border-b">المنصب</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 border-b">رقم الهاتف</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 border-b">العمر</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 border-b">العمل</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 border-b">المؤهل</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {committeeMembers
                                    .filter(m => m.neighborhood_id === selectedNeighborhood.id && m.is_active !== false)
                                    .map((member, index) => (
                                      <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-600 text-center font-medium">{index + 1}</td>
                                        <td className="px-6 py-4 text-center">
                                          {member.image ? (
                                            <img 
                                              src={member.image} 
                                              alt={member.first_name}
                                              className="w-12 h-12 rounded-full object-cover mx-auto border-2 border-gray-200"
                                            />
                                          ) : (
                                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mx-auto">
                                              <Users className="w-6 h-6 text-gray-400" />
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-6 py-4 text-base text-center">
                                          <span className="font-semibold text-gray-900">
                                            {member.first_name} {member.father_name} {member.last_name}
                                          </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                          <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                            {positions.find(p => p.id === member.position_id)?.title || '-'}
                                          </span>
                                        </td>
                                        <td className="px-6 py-4 text-base text-gray-900 text-center font-medium" dir="ltr">{member.phone || '-'}</td>
                                        <td className="px-6 py-4 text-base text-gray-900 text-center">
                                          {member.date_of_birth ? `${calculateAge(member.date_of_birth)} سنة` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-base text-gray-900 text-center">{member.occupation || '-'}</td>
                                        <td className="px-6 py-4 text-base text-gray-900 text-center">{member.education || '-'}</td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-center py-16">
                              <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                              <p className="text-gray-500 text-xl font-medium mb-2">لا يوجد أعضاء في لجنة هذا الحي</p>
                              <p className="text-gray-400 text-base">يمكنك إضافة أعضاء من قسم "لجان الأحياء"</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* زر الرجوع في الأسفل */}
                      <div className="flex justify-center pt-6">
                        <Button 
                          onClick={closeNeighborhoodDetails}
                          className="bg-emerald-700 hover:bg-emerald-800 px-8 py-3 text-lg"
                        >
                          <ArrowRight className="w-5 h-5 ml-2" />
                          رجوع إلى قائمة الأحياء
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Committee Members Tab */}
            <TabsContent value="committees">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">إدارة لجان الأحياء</h2>
                  <div className="flex gap-3 items-center">
                    {sortColumn && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => { setSortColumn(null); setSortDirection('asc'); }}
                        className="text-gray-600"
                      >
                        إعادة تعيين الفرز
                      </Button>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showInactiveMembers}
                        onChange={(e) => setShowInactiveMembers(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span className="text-sm text-gray-700">عرض الأعضاء غير النشطين</span>
                    </label>
                    <Button onClick={() => openCreateDialog('committee')} className="bg-emerald-700" data-testid="add-committee-btn">
                      <Plus className="w-5 h-5 ml-2" />
                      إضافة عضو لجنة
                    </Button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative max-w-md">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="بحث في الأعضاء (الاسم، الحي، المنصب، العمل، المؤهل، الهاتف...)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10 pl-10 text-right"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {searchQuery && (
                    <p className="text-sm text-gray-600 mt-2 text-right">
                      النتائج: {getSortedMembers().length} من {committeeMembers.filter(m => showInactiveMembers || m.is_active !== false).length}
                    </p>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="committee-table">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">#</th>
                        <th 
                          className="px-4 py-3 text-center text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>الحالة</span>
                            <SortIcon column="status" />
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-center text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>الاسم الكامل</span>
                            <SortIcon column="name" />
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-center text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('neighborhood')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>الحي</span>
                            <SortIcon column="neighborhood" />
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-center text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('position')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>المنصب</span>
                            <SortIcon column="position" />
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-center text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('age')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>العمر</span>
                            <SortIcon column="age" />
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-center text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('occupation')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>العمل</span>
                            <SortIcon column="occupation" />
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-center text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('education')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>المؤهل</span>
                            <SortIcon column="education" />
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-center text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('created_at')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>تاريخ الإضافة</span>
                            <SortIcon column="created_at" />
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-center text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('updated_at')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>تاريخ التعديل</span>
                            <SortIcon column="updated_at" />
                          </div>
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {getSortedMembers().map((member, index) => {
                        const neighborhood = neighborhoods.find(n => n.id === member.neighborhood_id);
                        const position = positions.find(p => p.id === member.position_id);
                        return (
                          <tr key={member.id} className={`hover:bg-gray-50 ${member.is_active === false ? 'bg-gray-100 opacity-60' : ''}`}>
                            <td className="px-4 py-3 text-sm text-gray-600 text-center font-medium">{index + 1}</td>
                            <td className="px-4 py-3 text-sm text-center">
                              {member.is_active !== false ? (
                                <div className="flex items-center justify-center gap-1 text-green-600">
                                  <CheckCircle className="w-5 h-5" />
                                  <span className="text-xs font-semibold">نشط</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1 text-red-600">
                                  <XCircle className="w-5 h-5" />
                                  <span className="text-xs font-semibold">موقوف</span>
                                </div>
                              )}
                            </td>
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
                                  onClick={() => toggleMemberStatus(member)}
                                  className={member.is_active !== false ? "text-orange-600 hover:bg-orange-50" : "text-emerald-600 hover:bg-emerald-50"}
                                  title={member.is_active !== false ? "إيقاف العضو" : "تفعيل العضو"}
                                >
                                  {member.is_active !== false ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {loadingCommittees ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                      <p className="text-gray-500">جاري تحميل أعضاء اللجان...</p>
                    </div>
                  ) : getSortedMembers().length === 0 && (
                    <div className="text-center py-12">
                      {searchQuery ? (
                        <div className="flex flex-col items-center gap-3">
                          <Search className="w-12 h-12 text-gray-300" />
                          <p className="text-gray-500 font-medium">لا توجد نتائج للبحث عن "{searchQuery}"</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSearchQuery('')}
                            className="mt-2"
                          >
                            مسح البحث
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <Users className="w-12 h-12 text-gray-300" />
                          <p className="text-gray-500 font-medium">
                            {showInactiveMembers ? 'لا توجد أعضاء لجان مسجلين حالياً' : 'لا توجد أعضاء نشطين حالياً'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Positions Tab */}
            <TabsContent value="positions">
              <ReferenceDataManagement 
                type="positions"
                data={positions}
                loading={loadingPositions}
                onDataChange={fetchAllData}
              />
            </TabsContent>

            {/* Jobs Tab */}
            <TabsContent value="jobs">
              <ReferenceDataManagement 
                type="jobs"
                data={jobs}
                loading={loadingJobs}
                onDataChange={fetchAllData}
              />
            </TabsContent>

            {/* Education Levels Tab */}
            <TabsContent value="education">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">إدارة المؤهلات الدراسية</h2>
                  <Button onClick={() => openCreateDialog('education')} className="bg-emerald-700" data-testid="add-education-btn">
                    <Plus className="w-5 h-5 ml-2" />
                    إضافة مؤهل جديد
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="education-table">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">#</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">المؤهل الدراسي</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الحالة</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">تاريخ الإنشاء</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {educationLevels.map((level, index) => (
                        <tr key={level.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600 text-center font-medium">{index + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">{level.title}</td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${level.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {level.is_active ? 'نشط' : 'غير نشط'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center whitespace-nowrap">
                            {level.created_at ? new Date(level.created_at).toLocaleString('ar-SY', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            }) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog('education', level)}
                                className="text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete('education', level.id)}
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
                  {loadingEducations ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                      <p className="text-gray-500">جاري تحميل المؤهلات الدراسية...</p>
                    </div>
                  ) : educationLevels.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      لا توجد مؤهلات مسجلة حالياً
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Families Tab */}
            <TabsContent value="families">
              {!showFamilyDetails ? (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">إدارة العائلات</h2>
                    <Button onClick={() => openCreateDialog('families')} className="bg-emerald-700" data-testid="add-family-btn">
                      <Plus className="w-5 h-5 ml-2" />
                      إضافة عائلة
                    </Button>
                  </div>

                  <div className="mb-4 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        type="text"
                        placeholder="البحث عن عائلة (الاسم، رقم العائلة، رمز العائلة، اسم الفاك، الهاتف، المعيل...)..."
                        value={familiesSearchQuery}
                        onChange={(e) => {
                          setFamiliesSearchQuery(e.target.value);
                          setFamiliesPage(1);
                        }}
                        className="pr-10"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="show_inactive_families"
                        checked={showInactiveFamilies}
                        onChange={(e) => setShowInactiveFamilies(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <Label htmlFor="show_inactive_families" className="text-sm cursor-pointer whitespace-nowrap">
                        عرض غير النشطة
                      </Label>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">#</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">رقم العائلة</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">رمز العائلة</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">اسم الفاك</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">رقم الهاتف</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الحي</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">التصنيف</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">تقييم الاحتياج</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الحالة</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(() => {
                          const filteredFamilies = families
                            .filter(f => showInactiveFamilies || f.is_active !== false)
                            .filter(f => {
                              if (!familiesSearchQuery) return true;
                              const query = familiesSearchQuery.toLowerCase();
                              const neighborhood = neighborhoods.find(n => n.id === f.neighborhood_id)?.name || '';
                              const category = familyCategories.find(c => c.id === f.category_id)?.name || '';
                              
                              return (f.name || '').toLowerCase().includes(query) ||
                                     (f.family_number || '').toLowerCase().includes(query) ||
                                     (f.family_code || '').toLowerCase().includes(query) ||
                                     (f.fac_name || '').toLowerCase().includes(query) ||
                                     (f.phone || '').toLowerCase().includes(query) ||
                                     (f.provider_first_name || '').toLowerCase().includes(query) ||
                                     (f.provider_father_name || '').toLowerCase().includes(query) ||
                                     (f.provider_surname || '').toLowerCase().includes(query) ||
                                     (f.need_assessment || '').toLowerCase().includes(query) ||
                                     neighborhood.toLowerCase().includes(query) ||
                                     category.toLowerCase().includes(query);
                            });
                          
                          const totalPages = Math.ceil(filteredFamilies.length / familiesPerPage);
                          const startIndex = (familiesPage - 1) * familiesPerPage;
                          const paginatedFamilies = filteredFamilies.slice(startIndex, startIndex + familiesPerPage);

                          return (
                            <>
                              {paginatedFamilies.map((family, index) => (
                                <tr key={family.id} className="hover:bg-gray-50" data-testid={`family-item-${family.id}`}>
                                  <td className="px-4 py-3 text-sm text-gray-600 text-center">{startIndex + index + 1}</td>
                                  <td className="px-4 py-3 text-sm text-center">
                                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                      {family.family_number || '-'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 text-center">{family.family_code || '-'}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900 text-center font-medium">{family.fac_name || '-'}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600 text-center" dir="ltr">{family.phone || '-'}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600 text-center">
                                    {neighborhoods.find(n => n.id === family.neighborhood_id)?.name || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600 text-center">
                                    {familyCategories.find(c => c.id === family.category_id)?.name || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-center">
                                    {family.need_assessment ? (
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        family.need_assessment === 'منخفض' ? 'bg-green-100 text-green-800' :
                                        family.need_assessment === 'متوسط' ? 'bg-yellow-100 text-yellow-800' :
                                        family.need_assessment === 'مرتفع' ? 'bg-orange-100 text-orange-800' :
                                        family.need_assessment === 'حرج/عاجل' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {family.need_assessment}
                                      </span>
                                    ) : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs ${family.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                      {family.is_active !== false ? 'نشط' : 'غير نشط'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-center">
                                    <div className="flex gap-2 justify-center">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => {
                                          setSelectedFamily(family);
                                          setShowFamilyDetails(true);
                                        }}
                                        className="text-blue-600 hover:bg-blue-50"
                                        title="عرض التفاصيل"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => openEditDialog('families', family)} 
                                        data-testid={`edit-family-${family.id}`}
                                        className="text-green-600 hover:bg-green-50"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={async () => {
                                          const action = family.is_active !== false ? 'إيقاف' : 'تفعيل';
                                          if (!window.confirm(`هل تريد ${action} هذه العائلة؟`)) return;
                                          try {
                                            await axios.put(`${API_URL}/families/${family.id}/toggle-status`, { is_active: !family.is_active });
                                            toast.success(`تم ${action} العائلة بنجاح`);
                                            fetchAllData();
                                          } catch (error) {
                                            toast.error(error.response?.data?.detail || `فشل ${action} العائلة`);
                                          }
                                        }}
                                        className={family.is_active !== false ? "text-orange-600 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}
                                        title={family.is_active !== false ? "إيقاف" : "تفعيل"}
                                      >
                                        {family.is_active !== false ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                    {families.filter(f => showInactiveFamilies || f.is_active !== false).filter(f => {
                      if (!familiesSearchQuery) return true;
                      const query = familiesSearchQuery.toLowerCase();
                      const neighborhood = neighborhoods.find(n => n.id === f.neighborhood_id)?.name || '';
                      const category = familyCategories.find(c => c.id === f.category_id)?.name || '';
                      
                      return (f.name || '').toLowerCase().includes(query) ||
                             (f.family_number || '').toLowerCase().includes(query) ||
                             (f.family_code || '').toLowerCase().includes(query) ||
                             (f.fac_name || '').toLowerCase().includes(query) ||
                             (f.phone || '').toLowerCase().includes(query) ||
                             (f.provider_first_name || '').toLowerCase().includes(query) ||
                             (f.provider_father_name || '').toLowerCase().includes(query) ||
                             (f.provider_surname || '').toLowerCase().includes(query) ||
                             (f.need_assessment || '').toLowerCase().includes(query) ||
                             neighborhood.toLowerCase().includes(query) ||
                             category.toLowerCase().includes(query);
                    }).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        {familiesSearchQuery ? 'لا توجد نتائج للبحث' : (showInactiveFamilies ? 'لا توجد عائلات مسجلة' : 'لا توجد عائلات نشطة')}
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {(() => {
                    const filteredFamilies = families
                      .filter(f => showInactiveFamilies || f.is_active !== false)
                      .filter(f => {
                        if (!familiesSearchQuery) return true;
                        const query = familiesSearchQuery.toLowerCase();
                        const neighborhood = neighborhoods.find(n => n.id === f.neighborhood_id)?.name || '';
                        const category = familyCategories.find(c => c.id === f.category_id)?.name || '';
                        
                        return (f.name || '').toLowerCase().includes(query) ||
                               (f.family_number || '').toLowerCase().includes(query) ||
                               (f.family_code || '').toLowerCase().includes(query) ||
                               (f.fac_name || '').toLowerCase().includes(query) ||
                               (f.phone || '').toLowerCase().includes(query) ||
                               (f.provider_first_name || '').toLowerCase().includes(query) ||
                               (f.provider_father_name || '').toLowerCase().includes(query) ||
                               (f.provider_surname || '').toLowerCase().includes(query) ||
                               (f.need_assessment || '').toLowerCase().includes(query) ||
                               neighborhood.toLowerCase().includes(query) ||
                               category.toLowerCase().includes(query);
                      });
                    const totalPages = Math.ceil(filteredFamilies.length / familiesPerPage);
                    
                    if (totalPages > 1) {
                      return (
                        <div className="mt-6 flex items-center justify-between border-t pt-4">
                          <div className="text-sm text-gray-600">
                            عرض {((familiesPage - 1) * familiesPerPage) + 1} - {Math.min(familiesPage * familiesPerPage, filteredFamilies.length)} من {filteredFamilies.length}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFamiliesPage(p => Math.max(1, p - 1))}
                              disabled={familiesPage === 1}
                            >
                              السابق
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                              .filter(page => {
                                return page === 1 || 
                                       page === totalPages || 
                                       Math.abs(page - familiesPage) <= 1;
                              })
                              .map((page, idx, arr) => (
                                <React.Fragment key={page}>
                                  {idx > 0 && arr[idx - 1] !== page - 1 && (
                                    <span className="px-2 py-1 text-gray-400">...</span>
                                  )}
                                  <Button
                                    variant={familiesPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFamiliesPage(page)}
                                    className={familiesPage === page ? "bg-emerald-600" : ""}
                                  >
                                    {page}
                                  </Button>
                                </React.Fragment>
                              ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFamiliesPage(p => Math.min(totalPages, p + 1))}
                              disabled={familiesPage === totalPages}
                            >
                              التالي
                            </Button>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="mb-6">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowFamilyDetails(false);
                        setSelectedFamily(null);
                      }}
                      className="mb-4"
                    >
                      <ArrowRight className="w-4 h-4 ml-2" />
                      رجوع إلى القائمة
                    </Button>
                    <div className="border-b-4 border-emerald-600 pb-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-bold text-gray-900">{selectedFamily?.name}</h2>
                        <span className={`px-3 py-1 rounded-full text-sm ${selectedFamily?.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {selectedFamily?.is_active !== false ? 'نشط' : 'غير نشط'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* رقم العائلة والمعلومات التعريفية */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm mb-6">
                    <h3 className="text-xl font-bold text-blue-900 border-b-2 border-blue-300 pb-3 mb-4">المعلومات التعريفية</h3>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-gray-600 mb-2">رقم العائلة</p>
                        <p className="text-2xl font-mono font-bold text-blue-700">{selectedFamily?.family_number || '-'}</p>
                        <p className="text-xs text-gray-500 mt-1">رقم تلقائي</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-gray-600 mb-2">رمز العائلة</p>
                        <p className="text-xl font-semibold text-gray-900">{selectedFamily?.family_code || '-'}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-gray-600 mb-2">اسم الفاك (اسم مستعار)</p>
                        <p className="text-xl font-semibold text-emerald-700">{selectedFamily?.fac_name || '-'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 mt-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-gray-600 mb-2">الاسم الحقيقي</p>
                        <p className="text-xl font-bold text-gray-900">{selectedFamily?.name}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-gray-600 mb-2">رقم الهاتف</p>
                        <p className="text-xl font-semibold text-gray-900" dir="ltr">{selectedFamily?.phone || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">المعلومات الأساسية</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">عدد الأفراد</p>
                          <p className="text-lg font-semibold text-gray-900">{selectedFamily?.members_count}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">الحاجة الشهرية</p>
                          <p className="text-lg font-semibold text-emerald-700">{selectedFamily?.monthly_need.toLocaleString()} ل.س</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">الحي</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {neighborhoods.find(n => n.id === selectedFamily?.neighborhood_id)?.name || 'غير محدد'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">التصنيف</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {familyCategories.find(c => c.id === selectedFamily?.category_id)?.name || 'غير محدد'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">مستوى الدخل</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {incomeLevels.find(l => l.id === selectedFamily?.income_level_id)?.name || 'غير محدد'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">تقييم الاحتياج</p>
                          {selectedFamily?.need_assessment ? (
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                              selectedFamily.need_assessment === 'منخفض' ? 'bg-green-100 text-green-800' :
                              selectedFamily.need_assessment === 'متوسط' ? 'bg-yellow-100 text-yellow-800' :
                              selectedFamily.need_assessment === 'مرتفع' ? 'bg-orange-100 text-orange-800' :
                              selectedFamily.need_assessment === 'حرج/عاجل' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {selectedFamily.need_assessment}
                            </span>
                          ) : <p className="text-lg text-gray-400">-</p>}
                        </div>
                      </div>
                    </div>

                    {/* معلومات العائلة ومعلومات المعيل */}
                    <div className="col-span-2 grid grid-cols-2 gap-6">
                      {/* معلومات العائلة */}
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">معلومات العائلة</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">الأب</p>
                            <p className="text-lg font-semibold">{selectedFamily?.father_present ? '✅ موجود' : '❌ غير موجود'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">الأم</p>
                            <p className="text-lg font-semibold">{selectedFamily?.mother_present ? '✅ موجودة' : '❌ غير موجودة'}</p>
                          </div>
                        </div>
                      </div>

                      {/* معلومات المعيل */}
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-purple-800 border-b border-purple-300 pb-2">معلومات المعيل (رب العائلة)</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 min-w-[80px]">الاسم الأول:</span>
                            <span className="text-lg font-semibold text-purple-800">{selectedFamily?.provider_first_name || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 min-w-[80px]">اسم الأب:</span>
                            <span className="text-lg font-semibold text-purple-800">{selectedFamily?.provider_father_name || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 min-w-[80px]">الكنية:</span>
                            <span className="text-lg font-semibold text-purple-800">{selectedFamily?.provider_surname || '-'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 space-y-4">
                      <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">الوصف</h3>
                      <p className="text-gray-700 leading-relaxed">{selectedFamily?.description}</p>
                    </div>

                    <div className="col-span-2 border-t pt-4 mt-4">
                      <div className="grid grid-cols-2 gap-6">
                        {/* معلومات الإنشاء */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                          <h4 className="text-md font-bold text-green-900 mb-3 flex items-center gap-2">
                            <span>📝</span> معلومات الإنشاء
                          </h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-gray-600">تاريخ الإنشاء</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {selectedFamily?.created_at ? new Date(selectedFamily.created_at).toLocaleString('ar-SY', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false
                                }) : '-'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">أُضيفت بواسطة</p>
                              <p className="text-sm font-bold text-emerald-700">
                                {selectedFamily?.created_by_user_id ? (
                                  users.find(u => u.id === selectedFamily.created_by_user_id)?.full_name || 
                                  users.find(u => u.id === selectedFamily.created_by_user_id)?.email || 
                                  'مستخدم غير معروف'
                                ) : '-'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* معلومات التحديث */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="text-md font-bold text-blue-900 mb-3 flex items-center gap-2">
                            <span>✏️</span> معلومات آخر تحديث
                          </h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-gray-600">تاريخ آخر تحديث</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {selectedFamily?.updated_at ? new Date(selectedFamily.updated_at).toLocaleString('ar-SY', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false
                                }) : 'لم يتم التحديث'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">عُدلت بواسطة</p>
                              <p className="text-sm font-bold text-blue-700">
                                {selectedFamily?.updated_by_user_id ? (
                                  users.find(u => u.id === selectedFamily.updated_by_user_id)?.full_name || 
                                  users.find(u => u.id === selectedFamily.updated_by_user_id)?.email || 
                                  'مستخدم غير معروف'
                                ) : (selectedFamily?.updated_at ? 'غير محدد' : '-')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Family Categories Tab */}
            <TabsContent value="family-categories">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">تصنيف العائلات</h2>
                  <Button onClick={() => openCreateDialog('family-category')} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة تصنيف
                  </Button>
                </div>

                <div className="mb-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show_inactive_family_categories"
                    checked={showInactiveFamilyCategories}
                    onChange={(e) => setShowInactiveFamilyCategories(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <Label htmlFor="show_inactive_family_categories" className="text-sm cursor-pointer">
                    عرض التصنيفات غير النشطة
                  </Label>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">#</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">اسم التصنيف</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الوصف</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">اللون</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الحالة</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {familyCategories
                        .filter(cat => showInactiveFamilyCategories || cat.is_active !== false)
                        .map((category, index) => (
                        <tr key={category.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600 text-center font-medium">{index + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center font-medium">{category.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">{category.description || '-'}</td>
                          <td className="px-4 py-3 text-sm text-center">
                            {category.color ? (
                              <div className="flex items-center justify-center gap-2">
                                <div 
                                  className="w-6 h-6 rounded border border-gray-300" 
                                  style={{backgroundColor: category.color}}
                                />
                                <span className="text-xs text-gray-500">{category.color}</span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${category.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {category.is_active !== false ? 'نشط' : 'غير نشط'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog('family-category', category)}
                                className="text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  const action = category.is_active !== false ? 'إيقاف' : 'تفعيل';
                                  if (!window.confirm(`هل تريد ${action} هذا التصنيف؟`)) return;
                                  try {
                                    await axios.put(`${API_URL}/family-categories/${category.id}/toggle-status`, { is_active: !category.is_active });
                                    toast.success(`تم ${action} التصنيف بنجاح`);
                                    fetchAllData();
                                  } catch (error) {
                                    toast.error(error.response?.data?.detail || `فشل ${action} التصنيف`);
                                  }
                                }}
                                className={category.is_active !== false ? "text-orange-600 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}
                                title={category.is_active !== false ? "إيقاف" : "تفعيل"}
                              >
                                {category.is_active !== false ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {loadingFamilyCategories ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                      <p className="text-gray-500">جاري تحميل تصنيفات العائلات...</p>
                    </div>
                  ) : familyCategories.filter(cat => showInactiveFamilyCategories || cat.is_active !== false).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {showInactiveFamilyCategories ? 'لا توجد تصنيفات مسجلة حالياً' : 'لا توجد تصنيفات نشطة حالياً'}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Income Levels Tab */}
            <TabsContent value="income-levels">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">مستويات الدخل الشهري</h2>
                  <Button onClick={() => openCreateDialog('income-level')} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة مستوى دخل
                  </Button>
                </div>

                <div className="mb-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show_inactive_income_levels"
                    checked={showInactiveIncomeLevels}
                    onChange={(e) => setShowInactiveIncomeLevels(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <Label htmlFor="show_inactive_income_levels" className="text-sm cursor-pointer">
                    عرض المستويات غير النشطة
                  </Label>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">#</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">اسم المستوى</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الوصف</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">المدى (ل.س)</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الحالة</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {incomeLevels
                        .filter(level => showInactiveIncomeLevels || level.is_active !== false)
                        .map((level, index) => (
                        <tr key={level.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600 text-center font-medium">{index + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center font-bold">{level.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">{level.description || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center" dir="ltr">
                            {level.min_amount?.toLocaleString() || '0'} - {level.max_amount ? level.max_amount.toLocaleString() : 'أكثر'}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${level.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {level.is_active !== false ? 'نشط' : 'غير نشط'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog('income-level', level)}
                                className="text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  const action = level.is_active !== false ? 'إيقاف' : 'تفعيل';
                                  if (!window.confirm(`هل تريد ${action} هذا المستوى؟`)) return;
                                  try {
                                    await axios.put(`${API_URL}/income-levels/${level.id}/toggle-status`, { is_active: !level.is_active });
                                    toast.success(`تم ${action} المستوى بنجاح`);
                                    fetchAllData();
                                  } catch (error) {
                                    toast.error(error.response?.data?.detail || `فشل ${action} المستوى`);
                                  }
                                }}
                                className={level.is_active !== false ? "text-orange-600 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}
                                title={level.is_active !== false ? "إيقاف" : "تفعيل"}
                              >
                                {level.is_active !== false ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {loadingIncomeLevels ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                      <p className="text-gray-500">جاري تحميل مستويات الدخل...</p>
                    </div>
                  ) : incomeLevels.filter(level => showInactiveIncomeLevels || level.is_active !== false).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {showInactiveIncomeLevels ? 'لا توجد مستويات دخل مسجلة حالياً' : 'لا توجد مستويات دخل نشطة حالياً'}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Need Assessments Tab */}
            <TabsContent value="need-assessments">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">تقييم الاحتياج</h2>
                  <Button onClick={() => openCreateDialog('need-assessment')} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة تقييم
                  </Button>
                </div>

                <div className="mb-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show_inactive_need_assessments"
                    checked={showInactiveNeedAssessments}
                    onChange={(e) => setShowInactiveNeedAssessments(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <Label htmlFor="show_inactive_need_assessments" className="text-sm cursor-pointer">
                    عرض التقييمات غير النشطة
                  </Label>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">#</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">اسم التقييم</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الوصف</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الأولوية</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">اللون</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الحالة</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {needAssessments
                        .filter(assessment => showInactiveNeedAssessments || assessment.is_active !== false)
                        .sort((a, b) => (a.priority || 0) - (b.priority || 0))
                        .map((assessment, index) => (
                        <tr key={assessment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600 text-center font-medium">{index + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center font-bold">{assessment.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">{assessment.description || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            <span className="px-2 py-1 bg-gray-100 rounded text-gray-700 font-semibold">{assessment.priority || 0}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            {assessment.color ? (
                              <div className="flex items-center justify-center gap-2">
                                <div 
                                  className="w-6 h-6 rounded border border-gray-300" 
                                  style={{backgroundColor: assessment.color}}
                                />
                                <span className="text-xs text-gray-500">{assessment.color}</span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${assessment.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {assessment.is_active !== false ? 'نشط' : 'غير نشط'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog('need-assessment', assessment)}
                                className="text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  const action = assessment.is_active !== false ? 'إيقاف' : 'تفعيل';
                                  if (!window.confirm(`هل تريد ${action} هذا التقييم؟`)) return;
                                  try {
                                    await axios.put(`${API_URL}/need-assessments/${assessment.id}/toggle-status`, { is_active: !assessment.is_active });
                                    toast.success(`تم ${action} التقييم بنجاح`);
                                    fetchAllData();
                                  } catch (error) {
                                    toast.error(error.response?.data?.detail || `فشل ${action} التقييم`);
                                  }
                                }}
                                className={assessment.is_active !== false ? "text-orange-600 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}
                                title={assessment.is_active !== false ? "إيقاف" : "تفعيل"}
                              >
                                {assessment.is_active !== false ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {loadingNeedAssessments ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                      <p className="text-gray-500">جاري تحميل تقييمات الاحتياج...</p>
                    </div>
                  ) : needAssessments.filter(assessment => showInactiveNeedAssessments || assessment.is_active !== false).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {showInactiveNeedAssessments ? 'لا توجد تقييمات مسجلة حالياً' : 'لا توجد تقييمات نشطة حالياً'}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Needs Tab */}
            <TabsContent value="needs">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">الاحتياجات</h2>
                  <Button onClick={() => openCreateDialog('need')} className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة احتياج
                  </Button>
                </div>

                <div className="mb-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show_inactive_needs"
                    checked={showInactiveNeeds}
                    onChange={(e) => setShowInactiveNeeds(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <Label htmlFor="show_inactive_needs" className="text-sm cursor-pointer">
                    عرض الاحتياجات غير النشطة
                  </Label>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">#</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">اسم الاحتياج</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">التوصيف</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">المبلغ الافتراضي</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">أضيف بواسطة</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">عُدل بواسطة</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الحالة</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {needs
                        .filter(need => showInactiveNeeds || need.is_active !== false)
                        .map((need, index) => (
                        <tr key={need.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600 text-center font-medium">{index + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center font-bold">{need.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center max-w-xs truncate">{need.description || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center" dir="ltr">
                            {need.default_amount ? `${need.default_amount.toLocaleString()} ل.س` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-emerald-700 text-center font-semibold">
                            {need.created_by_user_id ? (
                              users.find(u => u.id === need.created_by_user_id)?.full_name || 
                              users.find(u => u.id === need.created_by_user_id)?.email || 
                              'مستخدم غير معروف'
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-blue-700 text-center font-semibold">
                            {need.updated_by_user_id ? (
                              users.find(u => u.id === need.updated_by_user_id)?.full_name || 
                              users.find(u => u.id === need.updated_by_user_id)?.email || 
                              'مستخدم غير معروف'
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${need.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {need.is_active !== false ? 'نشط' : 'غير نشط'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog('need', need)}
                                className="text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  const action = need.is_active !== false ? 'إيقاف' : 'تفعيل';
                                  if (!window.confirm(`هل تريد ${action} هذا الاحتياج؟`)) return;
                                  try {
                                    await axios.put(`${API_URL}/needs/${need.id}/toggle-status`, { is_active: !need.is_active });
                                    toast.success(`تم ${action} الاحتياج بنجاح`);
                                    fetchAllData();
                                  } catch (error) {
                                    toast.error(error.response?.data?.detail || `فشل ${action} الاحتياج`);
                                  }
                                }}
                                className={need.is_active !== false ? "text-orange-600 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}
                                title={need.is_active !== false ? "إيقاف" : "تفعيل"}
                              >
                                {need.is_active !== false ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {loadingNeeds ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                      <p className="text-gray-500">جاري تحميل الاحتياجات...</p>
                    </div>
                  ) : needs.filter(need => showInactiveNeeds || need.is_active !== false).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {showInactiveNeeds ? 'لا توجد احتياجات مسجلة حالياً' : 'لا توجد احتياجات نشطة حالياً'}
                    </div>
                  )}
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

            {/* Users Tab */}
            <TabsContent value="users">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h2>
                </div>

                {/* Search and Filter */}
                <div className="mb-6 flex gap-4 items-center">
                  <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="بحث في الاسم، البريد، أو الجوال..."
                      value={usersSearchQuery}
                      onChange={(e) => setUsersSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                    {usersSearchQuery && (
                      <button
                        onClick={() => setUsersSearchQuery('')}
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
                      checked={showInactiveUsers}
                      onChange={(e) => setShowInactiveUsers(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <Label htmlFor="show_inactive_users" className="text-sm cursor-pointer">
                      عرض المستخدمين غير النشطين
                    </Label>
                  </div>
                </div>

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
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">تاريخ الإنشاء</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">آخر تحديث</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الحالة</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users
                        .filter(u => showInactiveUsers || u.is_active !== false)
                        .filter(u => {
                          if (!usersSearchQuery.trim()) return true;
                          const query = usersSearchQuery.toLowerCase();
                          return (
                            (u.full_name || '').toLowerCase().includes(query) ||
                            (u.email || '').toLowerCase().includes(query) ||
                            (u.phone || '').includes(query)
                          );
                        })
                        .map((user, index) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600 text-center font-medium">{index + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center font-medium">{user.full_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center" dir="ltr">{user.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center" dir="ltr">{user.phone || '-'}</td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin' ? 'bg-red-100 text-red-800' :
                              user.role === 'committee_president' ? 'bg-blue-100 text-blue-800' :
                              user.role === 'committee_member' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role === 'admin' ? 'مدير نظام' :
                               user.role === 'committee_president' ? 'رئيس لجنة' :
                               user.role === 'committee_member' ? 'عضو لجنة' :
                               'مستخدم عادي'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">
                            {neighborhoods.find(n => n.id === user.neighborhood_id)?.name || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center" dir="ltr">
                            {user.created_at ? new Date(user.created_at).toLocaleString('ar-SY', { 
                              year: 'numeric', 
                              month: '2-digit', 
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: false
                            }) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center" dir="ltr">
                            {user.updated_at ? new Date(user.updated_at).toLocaleString('ar-SY', { 
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
                            <span className={`px-2 py-1 rounded-full text-xs ${user.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {user.is_active !== false ? 'نشط' : 'غير نشط'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  const action = user.is_active !== false ? 'إيقاف' : 'تفعيل';
                                  if (!window.confirm(`هل تريد ${action} هذا المستخدم؟`)) return;
                                  try {
                                    await axios.put(`${API_URL}/users/${user.id}/toggle-status`, { is_active: !user.is_active });
                                    toast.success(`تم ${action} المستخدم بنجاح`);
                                    fetchAllData();
                                  } catch (error) {
                                    toast.error(error.response?.data?.detail || `فشل ${action} المستخدم`);
                                  }
                                }}
                                className={user.is_active !== false ? "text-orange-600 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}
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
                  {loadingUsers ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                      <p className="text-gray-500">جاري تحميل المستخدمين...</p>
                    </div>
                  ) : users.filter(u => showInactiveUsers || u.is_active !== false).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {usersSearchQuery ? 'لا توجد نتائج مطابقة للبحث' : 'لا يوجد مستخدمين'}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* User Roles Tab */}
            <TabsContent value="user-roles">
              <ReferenceDataManagement 
                type="user-roles"
                data={userRoles}
                loading={loadingUserRoles}
                onDataChange={fetchAllData}
              />
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
              
              {/* حالة العضو */}
              <div className="flex justify-center">
                {viewingMember.is_active !== false ? (
                  <div className="flex items-center gap-2 px-6 py-3 bg-green-50 border-2 border-green-200 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <span className="text-lg font-bold text-green-700">عضو نشط</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-6 py-3 bg-red-50 border-2 border-red-200 rounded-full">
                    <XCircle className="w-6 h-6 text-red-600" />
                    <span className="text-lg font-bold text-red-700">عضو موقوف</span>
                  </div>
                )}
              </div>

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
                  <span className="text-sm text-gray-600 font-semibold">المواليد / العمر:</span>
                  {viewingMember.date_of_birth ? (
                    <>
                      <p className="text-base text-gray-900 mt-1">{viewingMember.date_of_birth}</p>
                      <p className="text-lg font-bold text-emerald-700 mt-1">
                        {calculateAge(viewingMember.date_of_birth)} سنة
                      </p>
                    </>
                  ) : (
                    <p className="text-base text-gray-900 mt-1">-</p>
                  )}
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" data-testid="admin-dialog">
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
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="space-y-4 mt-4 overflow-y-auto px-1">
              {renderFormFields()}
            </div>
            <div className="flex gap-3 justify-end pt-4 mt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>
                إلغاء
              </Button>
              <Button type="submit" className="bg-emerald-700" data-testid="submit-form-btn" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جارٍ الحفظ...
                  </>
                ) : (
                  dialogMode === 'create' ? 'إضافة' : 'تحديث'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 shadow-2xl">
            <Loader2 className="w-12 h-12 text-emerald-700 animate-spin" />
            <p className="text-lg font-semibold text-gray-900">جارٍ المعالجة...</p>
            <p className="text-sm text-gray-600">الرجاء الانتظار</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

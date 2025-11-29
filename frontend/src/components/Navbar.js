import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LogOut, User, LayoutDashboard, Heart, Settings, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header 
      data-testid="main-navbar"
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-sm shadow-md' : 'bg-white'
      }`}
    >
      <div className="container mx-auto px-4">
        <nav className="flex justify-between items-center py-3">
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <img 
              src="/logo.png" 
              alt="معاً نَبني" 
              className="h-12 w-auto"
              style={{objectFit: 'contain'}}
            />
            <span className="text-xl font-bold text-emerald-900 hidden lg:inline">معاً نَبني</span>
          </Link>

          <ul className="hidden lg:flex items-center gap-4 nav-links text-sm">
            <li><Link to="/" className="text-gray-700 hover:text-emerald-700 font-medium transition-colors" data-testid="nav-home">الرئيسية</Link></li>
            <li><Link to="/our-mission" className="text-gray-700 hover:text-emerald-700 font-medium transition-colors" data-testid="nav-mission">رؤيتنا</Link></li>
            <li><a href="/#services" className="text-gray-700 hover:text-emerald-700 font-medium transition-colors" data-testid="nav-services">خدماتنا</a></li>
            <li><a href="/#family" className="text-gray-700 hover:text-emerald-700 font-medium transition-colors" data-testid="nav-family">التوعية</a></li>
            <li><a href="/#education" className="text-gray-700 hover:text-emerald-700 font-medium transition-colors" data-testid="nav-education">التعليم</a></li>
            <li><a href="/#community" className="text-gray-700 hover:text-emerald-700 font-medium transition-colors" data-testid="nav-community">التكافل</a></li>
            <li><a href="/#stories" className="text-gray-700 hover:text-emerald-700 font-medium transition-colors" data-testid="nav-stories">قصص النجاح</a></li>
          </ul>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2" data-testid="user-menu">
                      <User className="w-4 h-4" />
                      <span className="hidden md:inline">{user.full_name}</span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-sm font-semibold text-gray-900">
                      {user.full_name}
                    </div>
                    <div className="px-2 py-1.5 text-xs text-gray-500">
                      {user.email}
                    </div>
                    <div className="px-2 py-1.5">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'committee_president' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'committee_member' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? 'مدير النظام' :
                         user.role === 'committee_president' ? 'رئيس لجنة' :
                         user.role === 'committee_member' ? 'موظف لجنة' :
                         'متبرع كريم'}
                      </span>
                    </div>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                      <Settings className="w-4 h-4 ml-2" />
                      تعديل الملف الشخصي
                    </DropdownMenuItem>
                    
                    {/* المتبرع الكريم يرى تبرعاته */}
                    {user.role === 'user' && (
                      <DropdownMenuItem onClick={() => navigate('/my-donations')} className="cursor-pointer">
                        <Heart className="w-4 h-4 ml-2" />
                        تبرعاتي
                      </DropdownMenuItem>
                    )}
                    
                    {/* الأدمن فقط يرى لوحة التحكم الكاملة */}
                    {user.role === 'admin' && (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer">
                          <LayoutDashboard className="w-4 h-4 ml-2" />
                          لوحة التحكم
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/donations-management')} className="cursor-pointer">
                          <Heart className="w-4 h-4 ml-2" />
                          إدارة التبرعات
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {/* موظفو اللجنة ورؤساء اللجان - لوحة محدودة فقط */}
                    {(user.role === 'committee_member' || user.role === 'committee_president') && (
                      <DropdownMenuItem onClick={() => navigate('/committee-dashboard')} className="cursor-pointer">
                        <Home className="w-4 h-4 ml-2" />
                        لوحة حيي
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                      <LogOut className="w-4 h-4 ml-2" />
                      تسجيل الخروج
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => navigate('/login')} 
                  variant="outline"
                  size="sm"
                  data-testid="login-btn"
                >
                  تسجيل الدخول
                </Button>
                <Button 
                  onClick={() => navigate('/register')}
                  className="bg-emerald-700 hover:bg-emerald-800"
                  size="sm"
                  data-testid="register-btn"
                >
                  انضم إلينا
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
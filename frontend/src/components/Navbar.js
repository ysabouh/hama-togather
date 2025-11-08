import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, LayoutDashboard, Heart } from 'lucide-react';

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
        <nav className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
            <img 
              src="/logo.png" 
              alt="معاً نَبني" 
              className="h-16 w-auto"
              style={{objectFit: 'contain'}}
            />
            <span className="text-2xl font-bold text-emerald-900">معاً نَبني</span>
          </Link>

          <ul className="hidden md:flex items-center gap-6 nav-links">
            <li><Link to="/" className="text-gray-700 hover:text-emerald-700 font-medium transition-colors" data-testid="nav-home">الرئيسية</Link></li>
            <li><Link to="/our-mission" className="text-gray-700 hover:text-emerald-700 font-medium transition-colors" data-testid="nav-mission">رؤيتنا ورسالتنا</Link></li>
            <li><a href="/#services" className="text-gray-700 hover:text-emerald-700 font-medium transition-colors" data-testid="nav-services">خدماتنا</a></li>
            <li><a href="/#family" className="text-gray-700 hover:text-emerald-700 font-medium transition-colors" data-testid="nav-family">التوعية الأسرية</a></li>
            <li><a href="/#education" className="text-gray-700 hover:text-emerald-700 font-medium transition-colors" data-testid="nav-education">التعليم والتدريب</a></li>
            <li><a href="/#community" className="text-gray-700 hover:text-emerald-700 font-medium transition-colors" data-testid="nav-community">التكافل المجتمعي</a></li>
            <li><a href="/#stories" className="text-gray-700 hover:text-emerald-700 font-medium transition-colors" data-testid="nav-stories">قصص النجاح</a></li>
          </ul>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden md:inline text-sm text-gray-600" data-testid="user-name">مرحباً، {user.full_name}</span>
                {user.role === 'admin' && (
                  <Button 
                    onClick={() => navigate('/admin')} 
                    variant="outline" 
                    size="sm"
                    className="gap-2"
                    data-testid="admin-dashboard-btn"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    لوحة التحكم
                  </Button>
                )}
                {user.role === 'donor' && (
                  <Button 
                    onClick={() => navigate('/my-donations')} 
                    variant="outline" 
                    size="sm"
                    className="gap-2"
                    data-testid="my-donations-btn"
                  >
                    <Heart className="w-4 h-4" />
                    تبرعاتي
                  </Button>
                )}
                <Button 
                  onClick={handleLogout} 
                  variant="destructive" 
                  size="sm"
                  className="gap-2"
                  data-testid="logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                  خروج
                </Button>
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
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-emerald-900 text-white py-16" data-testid="main-footer">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4 border-b-2 border-amber-600 pb-2 inline-block">عن المنصة</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link to="/" className="hover:text-white transition-colors">رؤيتنا ورسالتنا</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">فريق العمل</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">الشروط والأحكام</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 border-b-2 border-amber-600 pb-2 inline-block">خدماتنا</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link to="/families" className="hover:text-white transition-colors">كفالة العائلات</Link></li>
              <li><Link to="/health-cases" className="hover:text-white transition-colors">الرعاية الصحية</Link></li>
              <li><Link to="/courses" className="hover:text-white transition-colors">الدورات التعليمية</Link></li>
              <li><Link to="/projects" className="hover:text-white transition-colors">المشاريع الإنتاجية</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 border-b-2 border-amber-600 pb-2 inline-block">اتصل بنا</h3>
            <ul className="space-y-2 text-gray-300">
              <li>هاتف: 0123456789</li>
              <li>بريد: info@m3anabni.com</li>
              <li>حماة، سوريا</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 border-b-2 border-amber-600 pb-2 inline-block">تابعنا</h3>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors">فيسبوك</a></li>
              <li><a href="#" className="hover:text-white transition-colors">تويتر</a></li>
              <li><a href="#" className="hover:text-white transition-colors">إنستغرام</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-emerald-700 pt-6 text-center text-gray-300">
          <p>&copy; 2025 منصة معاً نَبني - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
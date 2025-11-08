import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Heart, GraduationCap, Building2 } from 'lucide-react';

const HomePage = () => {
  const [currentQuote, setCurrentQuote] = useState(0);

  const quotes = [
    {
      text: '" وَيُؤْثِرُونَ عَلَى أَنفُسِهِمْ وَلَوْ كَانَ بِهِمْ خَصَاصَةٌ "',
      author: 'الحشر 9',
      sub: 'العطاء الحقيقي هو أن تُقدِّم وأنت محتاج، لا وأنت مستغنٍ.'
    },
    {
      text: 'قال ﷺ: «أفضل الناس أنفعهم للناس»',
      author: 'حديث نبوي',
      sub: 'كن نافعًا، فالعطاء هو المعنى الحقيقي للإنسانية.'
    },
    {
      text: 'قال ﷺ: «لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه»',
      author: 'حديث نبوي',
      sub: 'الإيمان ليس صلاة وصيامًا فقط… بل حبٌّ للآخرين وعطاء.'
    },
    {
      text: '"التكافل ليس عطاءً من الغني للفقير، بل هو استثمار في بناء مجتمع قوي"',
      author: 'مثل اجتماعي'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section 
        className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 text-white py-24 overflow-hidden"
        data-testid="hero-section"
      >
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1582213782119-d0417e658ee0?w=1200&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              معاً نَبني مجتمعاً متكافلاً في مدينة حماة
            </h1>
            <p className="text-lg md:text-xl mb-8 text-emerald-50">
              منصة إلكترونية تمكن لجان الأحياء من تنظيم العمل التطوعي والتكافلي بين أفراد المجتمع
            </p>

            {/* Inspirational Quotes */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-8 border border-white/20">
              <div className="relative h-40">
                {quotes.map((quote, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-500 ${
                      index === currentQuote ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <p className="text-xl md:text-2xl font-bold mb-3 leading-relaxed">{quote.text}</p>
                    <p className="text-emerald-200 text-lg">{quote.author}</p>
                    {quote.sub && <p className="text-emerald-100 text-sm mt-2 italic">{quote.sub}</p>}
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-2 mt-4">
                {quotes.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuote(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentQuote ? 'bg-amber-500 scale-110' : 'bg-white/30'
                    }`}
                    data-testid={`quote-nav-${index}`}
                  />
                ))}
              </div>
            </div>

            <Link to="/families">
              <Button 
                size="lg" 
                className="bg-amber-600 hover:bg-amber-700 text-white text-lg px-8 py-6 rounded-full shadow-xl"
                data-testid="start-journey-btn"
              >
                ابدأ رحلتك التطوعية
                <ArrowLeft className="mr-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50" data-testid="services-section">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-emerald-900 mb-12">
            خدمات المنصة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Users, title: 'كفالة العائلات', desc: 'ساهم في كفالة عائلة محتاجة', link: '/families', color: 'emerald' },
              { icon: Heart, title: 'الرعاية الصحية', desc: 'ساعد في علاج المرضى', link: '/health-cases', color: 'rose' },
              { icon: GraduationCap, title: 'الدورات التعليمية', desc: 'انضم لدورات مجانية', link: '/courses', color: 'blue' },
              { icon: Building2, title: 'المشاريع الإنتاجية', desc: 'ادعم مشروعًا صغيرًا', link: '/projects', color: 'amber' }
            ].map((service, idx) => (
              <Link key={idx} to={service.link}>
                <div 
                  className={`bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-t-4 border-${service.color}-600 group`}
                  data-testid={`service-card-${idx}`}
                >
                  <div className={`w-16 h-16 bg-${service.color}-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-${service.color}-600 transition-colors`}>
                    <service.icon className={`w-8 h-8 text-${service.color}-600 group-hover:text-white transition-colors`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-gray-600">{service.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-20 bg-white" data-testid="video-section">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-gray-50 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-emerald-900 text-white p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">شاهد كيف يمكنك إحداث فرق حقيقي</h2>
              <p className="text-emerald-100">فيديو توجيهي يشرح أهمية العمل التكافلي</p>
            </div>
            <div className="relative pb-[56.25%] h-0">
              <iframe
                src="https://www.youtube.com/embed/XmYV-ZVZj04"
                title="فيديو توجيهي"
                className="absolute top-0 right-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                data-testid="intro-video"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
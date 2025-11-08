import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const HomePage = () => {
  const [currentQuote, setCurrentQuote] = useState(0);

  const quotes = [
    {
      text: '" وَيُؤْثِرُونَ عَلَى أَنفُسِهِمْ وَلَوْ كَانَ بِهِمْ خَصَاصَةٌ "',
      ref: '- الحشر 9',
      author: 'العطاء الحقيقي هو أن تُقدّم وأنت محتاج، لا وأنت مستغنٍ.'
    },
    {
      text: 'قال ﷺ: «أفضل الناس أنفعهم للناس»',
      author: 'كن نافعًا، فالعطاء هو المعنى الحقيقي للإنسانية.'
    },
    {
      text: 'قال ﷺ: «لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه»',
      author: 'الإيمان ليس صلاة وصيامًا فقط… بل حبٌّ للآخرين وعطاء.'
    },
    {
      text: '"التكافل ليس عطاءً من الغني للفقير، بل هو استثمار في بناء مجتمع قوي"',
      author: '- مثل اجتماعي'
    },
    {
      text: '"لن يكتمل أمننا حتى يأمن جائع بيننا."',
      author: '- حكمة عربية'
    },
    {
      text: '"في كل بيت محتاج، فرصة لرحمة جديدة"',
      author: '-رحمة'
    },
    {
      text: '"لَنْ تَنَالُوا الْبِرَّ حَتَّى تُنْفِقُوا مِمَّا تُحِبُّونَ "',
      ref: '-(آل عمران: 92)',
      author: 'قدّم مما تحب، فذلك هو البرّ الحقيقي.'
    },
    {
      text: '"قال ﷺ: «ارحموا من في الأرض يرحمكم من في السماء»"',
      author: 'الرحمة لغة السماء، فلننشرها على الأرض.'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [quotes.length]);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* قسم البطل */}
      <section className="hero">
        <div className="container">
          <h1>معاً نَبني مجتمعاً متكافلاً في مدينة حماة</h1>
          <p>منصة إلكترونية تمكن لجان الأحياء من تنظيم العمل التطوعي والتكافلي بين أفراد المجتمع والمغتربين ورواد المجتمع لمساعدة المحتاجين</p>
          
          {/* قسم العبارات الإلهامية */}
          <div className="inspirational-quotes">
            <div className="quote-slider">
              {quotes.map((quote, index) => (
                <div
                  key={index}
                  className={`quote-slide ${index === currentQuote ? 'active' : ''}`}
                >
                  <div className="quote-text">{quote.text}</div>
                  {quote.ref && <div className="quote-text">{quote.ref}</div>}
                  <div className="quote-author">{quote.author}</div>
                </div>
              ))}
            </div>
            
            <div className="quote-nav">
              {quotes.map((_, index) => (
                <button
                  key={index}
                  className={`nav-dot ${index === currentQuote ? 'active' : ''}`}
                  onClick={() => setCurrentQuote(index)}
                  data-index={index}
                />
              ))}
            </div>
          </div>
          
          <Link to="/families" className="cta-button">ابدأ رحلتك التطوعية</Link>
        </div>
      </section>

      {/* قسم الفيديو التوجيهي */}
      <section className="video-section">
        <div className="container">
          <div className="video-container">
            <div className="video-header">
              <h2>شاهد كيف يمكنك إحداث فرق حقيقي</h2>
              <p>فيديو توجيهي يشرح أهمية العمل التكافلي وكيفية المشاركة في مبادراتنا</p>
            </div>
            
            <div className="video-wrapper">
              <iframe
                src="https://www.youtube.com/embed/XmYV-ZVZj04"
                title="فيديو توجيهي عن التكافل المجتمعي"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            
            <div className="video-description">
              <h3>كيف يمكنك المشاركة في بناء مجتمع أفضل؟</h3>
              <p>يشرح هذا الفيديو كيف يمكن لأي شخص، بغض النظر عن موقعه أو إمكانياته، أن يساهم في دعم المجتمع المحلي في مدينة حماة. سواء كنت مقيمًا في المحافظة أو مغتربًا في الخارج، هناك دائمًا طريقة للمساهمة.</p>
              <p>من خلال منصتنا، يمكنك اختيار الطريقة التي تناسبك للمساعدة، سواء كانت كفالة عائلة، تقديم تبرعات عينية، المشاركة في المبادرات اليومية، أو دعم البرامج التعليمية والصحية.</p>
              <a href="#services" className="cta-button">اكتشف طرق المساعدة</a>
            </div>
          </div>
        </div>
      </section>

      {/* قسم الخدمات */}
      <section className="services" id="services">
        <div className="container">
          <h2 className="section-title">خدمات المنصة</h2>
          <div className="services-grid">
            {/* خدمة اكفل عائلة */}
            <div className="service-card">
              <div className="service-icon">👨‍👩‍👧‍👦</div>
              <div className="service-content">
                <h3>اكفل عائلة</h3>
                <p>ساهم في كفالة عائلة محتاجة من خلال دعم مالي شهري يساعدهم في تلبية احتياجاتهم الأساسية</p>
                <Link to="/families" className="service-button">اطلع على العائلات</Link>
              </div>
            </div>
            
            {/* خدمة التبرعات العينية */}
            <div className="service-card">
              <div className="service-icon">🎁</div>
              <div className="service-content">
                <h3>تبرعات عينية</h3>
                <p>تبرع بما يزيد عن حاجتك من ملابس، أجهزة كهربائية، أثاث وغيرها لمن يحتاجها</p>
                <a href="#" className="service-button">تبرع الآن</a>
              </div>
            </div>
            
            {/* خدمة الرعاية الصحية */}
            <div className="service-card">
              <div className="service-icon">🏥</div>
              <div className="service-content">
                <h3>الرعاية الصحية</h3>
                <p>ساهم في علاج المرضى وتوفير الأدوية والرعاية الصحية للمحتاجين</p>
                <Link to="/health-cases" className="service-button">ادعم المريض</Link>
              </div>
            </div>
            
            {/* خدمة المبادرات اليومية */}
            <div className="service-card">
              <div className="service-icon">📋</div>
              <div className="service-content">
                <h3>مبادرات يومية</h3>
                <p>انضم إلى مبادراتنا اليومية مثل توزيع الطعام، نشر أخبار العروض للفقراء وغيرها</p>
                <Link to="/initiatives" className="service-button">شارك في مبادرة</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
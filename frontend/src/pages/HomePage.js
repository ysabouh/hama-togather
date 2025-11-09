import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingLogo from '../components/LoadingLogo';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HomePage = () => {
  const [currentQuote, setCurrentQuote] = useState(0);
  const [heroContent, setHeroContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeroContent = async () => {
      try {
        const response = await axios.get(`${API_URL}/hero-content`);
        setHeroContent(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch hero content:', error);
        setLoading(false);
      }
    };
    
    fetchHeroContent();
  }, []);

  useEffect(() => {
    if (heroContent && heroContent.quotes && heroContent.quotes.length > 0) {
      const timer = setInterval(() => {
        setCurrentQuote((prev) => (prev + 1) % heroContent.quotes.length);
      }, 7000);
      return () => clearInterval(timer);
    }
  }, [heroContent]);

  if (loading) {
    return <LoadingLogo />;
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* قسم البطل */}
      <section 
        className="hero"
        style={heroContent?.background_image ? {
          background: `linear-gradient(rgba(4, 51, 43, 0.9), rgba(4, 51, 43, 0.8)), url(${heroContent.background_image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {}}
      >
        <div className="container">
          <h1>{heroContent?.title || 'معاً نَبني مجتمعاً متكافلاً في مدينة حماة'}</h1>
          <p>{heroContent?.subtitle || 'منصة إلكترونية تمكن لجان الأحياء من تنظيم العمل التطوعي والتكافلي بين أفراد المجتمع والمغتربين ورواد المجتمع لمساعدة المحتاجين'}</p>
          
          {/* قسم العبارات الإلهامية */}
          {heroContent?.quotes && heroContent.quotes.length > 0 && (
            <div className="inspirational-quotes">
              <div className="quote-slider">
                {heroContent.quotes.map((quote, index) => (
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
                {heroContent.quotes.map((_, index) => (
                  <button
                    key={index}
                    className={`nav-dot ${index === currentQuote ? 'active' : ''}`}
                    onClick={() => setCurrentQuote(index)}
                    data-index={index}
                  />
                ))}
              </div>
            </div>
          )}
          
          <Link to={heroContent?.cta_link || '/families'} className="cta-button">
            {heroContent?.cta_text || 'ابدأ رحلتك التطوعية'}
          </Link>
        </div>
      </section>

      {/* قسم الفيديو التوجيهي */}
      {heroContent?.video_url && (
        <section className="video-section">
          <div className="container">
            <div className="video-container">
              <div className="video-header">
                <h2>{heroContent.video_title || 'شاهد كيف يمكنك إحداث فرق حقيقي'}</h2>
                <p>{heroContent.video_description || 'فيديو توجيهي يشرح أهمية العمل التكافلي وكيفية المشاركة في مبادراتنا'}</p>
              </div>
              
              <div className="video-wrapper">
                <iframe
                  src={heroContent.video_url}
                  title="فيديو توجيهي عن التكافل المجتمعي"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              
              {heroContent.video_subtitle && (
                <div className="video-description">
                  <h3>كيف يمكنك المشاركة في بناء مجتمع أفضل؟</h3>
                  <p>{heroContent.video_subtitle}</p>
                  <a href="#services" className="cta-button">اكتشف طرق المساعدة</a>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

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

      {/* قسم التوعية الأسرية */}
      <section className="family-awareness" id="family" style={{padding: '100px 0', background: '#f8f5f0'}}>
        <div className="container">
          <h2 className="section-title">التوعية الأسرية</h2>
          <p style={{textAlign: 'center', maxWidth: '800px', margin: '0 auto 50px', fontSize: '1.2rem', color: '#555'}}>
            نؤمن بأن الأسرة السليمة هي أساس المجتمع القوي. نقدم برامج توعوية شاملة لتعزيز الصحة الأسرية 
            وبناء علاقات زوجية سليمة وتربية الأبناء تربية صحيحة تساعدهم على مواجهة تحديات العصر الحديث.
          </p>
          
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px'}}>
            {/* التوعية من الأمراض السارية */}
            <div style={{background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>
              <div style={{height: '150px', background: '#f0f5f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', color: '#04332b'}}>
                🦠
              </div>
              <div style={{padding: '25px'}}>
                <h3 style={{color: '#04332b', marginBottom: '15px', fontSize: '1.3rem'}}>التوعية من الأمراض السارية</h3>
                <p style={{color: '#666', marginBottom: '15px'}}>برامج توعوية للوقاية من الأمراض المعدية ونشر الثقافة الصحية بين أفراد الأسرة</p>
                <Link to="/courses" className="service-button">تعرف أكثر</Link>
              </div>
            </div>

            {/* دورات للمخطوبين والمتزوجين */}
            <div style={{background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>
              <div style={{height: '150px', background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', color: '#7a6a56'}}>
                💑
              </div>
              <div style={{padding: '25px'}}>
                <h3 style={{color: '#7a6a56', marginBottom: '15px', fontSize: '1.3rem'}}>دورات للمخطوبين والمتزوجين</h3>
                <p style={{color: '#666', marginBottom: '15px'}}>برامج تأهيلية للمقبلين على الزواج والمتزوجين لبناء حياة أسرية مستقرة</p>
                <Link to="/courses" className="service-button">سجل في الدورة</Link>
              </div>
            </div>

            {/* تربية الأطفال */}
            <div style={{background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>
              <div style={{height: '150px', background: '#f0f2e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', color: '#8a7863'}}>
                👶
              </div>
              <div style={{padding: '25px'}}>
                <h3 style={{color: '#8a7863', marginBottom: '15px', fontSize: '1.3rem'}}>تربية الأطفال وأسس التربية السليمة</h3>
                <p style={{color: '#666', marginBottom: '15px'}}>دورات تدريبية للآباء والأمهات حول أفضل طرق التربية</p>
                <Link to="/courses" className="service-button">تعلم المزيد</Link>
              </div>
            </div>

            {/* دعم المراهقين */}
            <div style={{background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>
              <div style={{height: '150px', background: '#f8f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', color: '#b8a57b'}}>
                🧑‍🎓
              </div>
              <div style={{padding: '25px'}}>
                <h3 style={{color: '#b8a57b', marginBottom: '15px', fontSize: '1.3rem'}}>دعم المراهقين والمراهقات</h3>
                <p style={{color: '#666', marginBottom: '15px'}}>برامج توعوية وتثقيفية خصيصاً لمساعدة المراهقين على تجاوز تحديات هذه المرحلة</p>
                <Link to="/courses" className="service-button">انضم إلينا</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* قسم التكافل في التعليم والتدريب */}
      <section className="education" id="education" style={{padding: '100px 0', background: '#f0f5f4'}}>
        <div className="container">
          <h2 className="section-title">التكافل في التعليم والتدريب</h2>
          <p style={{textAlign: 'center', maxWidth: '800px', margin: '0 auto 50px', fontSize: '1.2rem', color: '#555'}}>
            نؤمن بأن التعليم هو أساس تقدم المجتمعات. من خلال هذا القسم، نهدف إلى تمكين الأطفال والشباب في الأحياء 
            من خلال تقديم دورات تدريبية وتأهيلية تلبي احتياجات سوق العمل وتعزز مهاراتهم الشخصية.
          </p>
          
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px'}}>
            <div style={{background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>
              <div style={{height: '150px', background: '#f0f2e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', color: '#8a7863'}}>
                💻
              </div>
              <div style={{padding: '25px'}}>
                <h3 style={{color: '#8a7863', marginBottom: '15px'}}>دورات الحاسب الآلي</h3>
                <p style={{color: '#666', marginBottom: '15px'}}>تعلم أساسيات الحاسب، برامج الأوفيس، والإنترنت</p>
                <Link to="/courses" className="service-button">سجل الآن</Link>
              </div>
            </div>

            <div style={{background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>
              <div style={{height: '150px', background: '#f0f2e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', color: '#8a7863'}}>
                🗣️
              </div>
              <div style={{padding: '25px'}}>
                <h3 style={{color: '#8a7863', marginBottom: '15px'}}>دورات اللغة الإنجليزية</h3>
                <p style={{color: '#666', marginBottom: '15px'}}>تعلم اللغة الإنجليزية من خلال منهج متكامل</p>
                <Link to="/courses" className="service-button">سجل الآن</Link>
              </div>
            </div>

            <div style={{background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>
              <div style={{height: '150px', background: '#f0f2e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', color: '#8a7863'}}>
                🔧
              </div>
              <div style={{padding: '25px'}}>
                <h3 style={{color: '#8a7863', marginBottom: '15px'}}>برامج المهارات الحرفية</h3>
                <p style={{color: '#666', marginBottom: '15px'}}>تطوير المهارات اليدوية والحرفية</p>
                <Link to="/courses" className="service-button">سجل الآن</Link>
              </div>
            </div>

            <div style={{background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>
              <div style={{height: '150px', background: '#f0f2e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', color: '#8a7863'}}>
                🧠
              </div>
              <div style={{padding: '25px'}}>
                <h3 style={{color: '#8a7863', marginBottom: '15px'}}>برامج الدعم الدراسي</h3>
                <p style={{color: '#666', marginBottom: '15px'}}>دروس تقوية وبرامج دعم تعليمي للطلاب</p>
                <Link to="/courses" className="service-button">سجل الآن</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* قسم التكافل المجتمعي */}
      <section className="community" id="community" style={{padding: '100px 0', background: '#f8f9fa'}}>
        <div className="container">
          <h2 className="section-title">التكافل الاجتماعي/المجتمعي</h2>
          <p style={{textAlign: 'center', maxWidth: '800px', margin: '0 auto 50px', fontSize: '1.2rem', color: '#555'}}>
            نعمل على تمكين الأسر والأفراد من خلال مشاريع إنتاجية مستدامة وبرامج صحية شاملة، 
            لبناء مجتمع قادر على مواجهة التحديات وتحقيق الاكتفاء الذاتي.
          </p>
          
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '50px'}}>
            {/* المشاريع الإنتاجية الصغيرة */}
            <div style={{background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>
              <div style={{height: '150px', background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', color: '#7a6a56'}}>
                🚀
              </div>
              <div style={{padding: '25px'}}>
                <h3 style={{color: '#7a6a56', marginBottom: '15px', fontSize: '1.3rem'}}>مشاريع إنتاجية صغيرة</h3>
                <p style={{color: '#666', marginBottom: '15px'}}>تمويل وتدريب الأسر الفقيرة على إدارة مشاريع صغيرة ومربحة توفر مصدر دخل مستدام</p>
                <Link to="/projects" className="service-button">ادعم مشروعاً</Link>
              </div>
            </div>
            
            {/* برامج الصحة والمساعدات الجماعية */}
            <div style={{background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>
              <div style={{height: '150px', background: '#f8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', color: '#a04545'}}>
                ❤️
              </div>
              <div style={{padding: '25px'}}>
                <h3 style={{color: '#a04545', marginBottom: '15px', fontSize: '1.3rem'}}>برامج الصحة والمساعدات الجماعية</h3>
                <p style={{color: '#666', marginBottom: '15px'}}>تنظيم حملات صحية وتوعوية شاملة لتقديم الرعاية الصحية الأساسية للمجتمع</p>
                <Link to="/health-cases" className="service-button">شارك في حملة</Link>
              </div>
            </div>
          </div>

          {/* إحصائيات الأثر */}
          <div style={{display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', background: 'white', padding: '50px 30px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>
            <div style={{textAlign: 'center', padding: '20px', flex: 1, minWidth: '200px'}}>
              <span style={{fontSize: '3rem', fontWeight: 'bold', color: '#04332b', display: 'block'}}>47</span>
              <span style={{color: '#000', marginTop: '10px', fontSize: '1.1rem'}}>مشروعاً منتجاً</span>
            </div>
            <div style={{textAlign: 'center', padding: '20px', flex: 1, minWidth: '200px'}}>
              <span style={{fontSize: '3rem', fontWeight: 'bold', color: '#04332b', display: 'block'}}>120</span>
              <span style={{color: '#000', marginTop: '10px', fontSize: '1.1rem'}}>أسرة مستفيدة</span>
            </div>
            <div style={{textAlign: 'center', padding: '20px', flex: 1, minWidth: '200px'}}>
              <span style={{fontSize: '3rem', fontWeight: 'bold', color: '#04332b', display: 'block'}}>15</span>
              <span style={{color: '#000', marginTop: '10px', fontSize: '1.1rem'}}>حملة صحية</span>
            </div>
            <div style={{textAlign: 'center', padding: '20px', flex: 1, minWidth: '200px'}}>
              <span style={{fontSize: '3rem', fontWeight: 'bold', color: '#04332b', display: 'block'}}>2,350</span>
              <span style={{color: '#000', marginTop: '10px', fontSize: '1.1rem'}}>مستفيد من الخدمات الصحية</span>
            </div>
          </div>
        </div>
      </section>

      {/* قسم قصص النجاح */}
      <section className="success-stories" id="stories" style={{padding: '100px 0', background: '#f0f5f4'}}>
        <div className="container">
          <h2 className="section-title">قصص النجاح</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px'}}>
            <div style={{background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>
              <div style={{height: '200px', backgroundImage: 'url(https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=500)', backgroundSize: 'cover', backgroundPosition: 'center'}} />
              <div style={{padding: '25px'}}>
                <h3 style={{marginBottom: '15px', color: '#04332b', fontSize: '1.3rem'}}>كفالة عائلة أبو محمد</h3>
                <p style={{color: '#666', lineHeight: '1.7'}}>بفضل كفالة مغترب من أبناء الحي، استطاعت عائلة أبو محمد تخطي ظروفهم الصعبة وضمان تعليم أبنائهم. اليوم، اثنان من أبنائهم في الجامعة وآخر في المدرسة الثانوية بمستوى متميز.</p>
              </div>
            </div>
            
            <div style={{background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>
              <div style={{height: '200px', backgroundImage: 'url(https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500)', backgroundSize: 'cover', backgroundPosition: 'center'}} />
              <div style={{padding: '25px'}}>
                <h3 style={{marginBottom: '15px', color: '#04332b', fontSize: '1.3rem'}}>مشروع أمل - مخبز منزلي</h3>
                <p style={{color: '#666', lineHeight: '1.7'}}>أسرة أبو أحمد حولت شقتهم الصغيرة إلى مخبز منزلي ناجح يوفر لهم دخلاً مستقراً بفضل تمويل المنصة. اليوم ينتجون أكثر من 200 رغيف يومياً ويوزعونه على الجيران والمحلات المحلية.</p>
              </div>
            </div>
            
            <div style={{background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>
              <div style={{height: '200px', backgroundImage: 'url(https://images.unsplash.com/photo-1577896851231-70ef18881754?w=500)', backgroundSize: 'cover', backgroundPosition: 'center'}} />
              <div style={{padding: '25px'}}>
                <h3 style={{marginBottom: '15px', color: '#04332b', fontSize: '1.3rem'}}>نجاح دورة التربية الإيجابية</h3>
                <p style={{color: '#666', lineHeight: '1.7'}}>أكثر من 50 ولي أمر استفادوا من دورة التربية الإيجابية وأظهروا تحسناً ملحوظاً في علاقاتهم بأبنائهم. الأمهات والآباء المشاركون أصبحوا أكثر وعياً بأساليب التربية الحديثة والفعالة.</p>
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
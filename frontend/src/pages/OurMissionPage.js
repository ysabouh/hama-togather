import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OurMissionPage = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await axios.get(`${API_URL}/mission-content`);
      setContent(response.data);
    } catch (error) {
      toast.error('فشل تحميل المحتوى');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* قسم البطل */}
      <section 
        className="hero" 
        style={{
          background: 'linear-gradient(rgba(4, 51, 43, 0.9), rgba(4, 51, 43, 0.8)), url(https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '120px 0',
          textAlign: 'center',
          borderBottom: '5px solid #b8a57b'
        }}
      >
        <div className="container">
          <h1 style={{fontSize: '3.5rem', marginBottom: '30px', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', color: 'white'}}>
            رؤيتنا ورسالتنا
          </h1>
          <p style={{fontSize: '1.5rem', maxWidth: '800px', margin: '0 auto', textShadow: '1px 1px 2px rgba(0,0,0,0.5)', color: '#f0f5f4'}}>
            من حماة... نُعيد للإنسان قيمته، وللمجتمع وحدته.. نحو تنمية مستدامة وكرامة إنسانية
          </p>
        </div>
      </section>

      {/* قسم الرؤية */}
      <section style={{padding: '100px 0', background: 'white'}}>
        <div className="container">
          <div style={{display: 'flex', alignItems: 'center', gap: '60px', flexWrap: 'wrap'}}>
            <div style={{flex: 1, minWidth: '300px'}}>
              <h2 className="section-title">رؤيتنا</h2>
              <div style={{fontSize: '1.2rem', marginBottom: '25px', color: '#555', whiteSpace: 'pre-line'}}>
                {content?.vision_text}
              </div>
              
              <div style={{
                background: '#f0f5f4',
                padding: '30px',
                borderRadius: '10px',
                borderRight: '5px solid #b8a57b',
                margin: '40px 0'
              }}>
                <p style={{fontSize: '1.3rem', fontWeight: 600, color: '#04332b', margin: 0}}>
                  "{content?.vision_highlight}"
                </p>
              </div>
            </div>
            <div style={{flex: 1, minWidth: '300px', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 15px 40px rgba(0,0,0,0.1)', border: '3px solid #b8a57b'}}>
              <img 
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800" 
                alt="قيادة وتنمية مجتمعية"
                style={{width: '100%', height: 'auto', display: 'block'}}
              />
            </div>
          </div>
        </div>
      </section>

      {/* قسم المبادئ */}
      <section style={{padding: '100px 0', background: '#f0f5f4'}}>
        <div className="container">
          <h2 className="section-title" style={{textAlign: 'center'}}>مبادئنا الأساسية</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', marginTop: '50px'}}>
            {content?.principles?.map((principle, idx) => (
              <div 
                key={idx}
                style={{
                  background: 'white',
                  padding: '40px 30px',
                  borderRadius: '15px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                  textAlign: 'center',
                  transition: 'transform 0.3s',
                  borderTop: '4px solid #b8a57b'
                }}
                className="principle-card-hover"
              >
                <div style={{fontSize: '4rem', marginBottom: '25px'}}>{principle.icon}</div>
                <h3 style={{fontSize: '1.5rem', marginBottom: '20px', color: '#04332b'}}>{principle.title}</h3>
                <p style={{color: '#666', lineHeight: 1.7}}>{principle.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* قسم التحول */}
      <section style={{padding: '100px 0', background: 'white'}}>
        <div className="container">
          <h2 className="section-title" style={{textAlign: 'center'}}>التحول من الإعانة إلى التمكين</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', marginTop: '50px'}}>
            {/* النموذج القديم */}
            <div style={{
              background: '#f0f5f4',
              padding: '40px',
              borderRadius: '15px',
              borderTop: '5px solid #8B0000'
            }}>
              <h3 style={{fontSize: '1.8rem', marginBottom: '25px', textAlign: 'center', color: '#8B0000'}}>النموذج التقليدي</h3>
              <ul style={{listStyle: 'none', padding: 0}}>
                {content?.old_model?.map((item, idx) => (
                  <li key={idx} style={{
                    padding: '12px 0',
                    position: 'relative',
                    paddingRight: '35px',
                    fontSize: '1.1rem'
                  }}>
                    <span style={{position: 'absolute', right: 0, color: '#8B0000', fontWeight: 'bold', fontSize: '1.3rem'}}>✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* النموذج الجديد */}
            <div style={{
              background: '#f0f5f4',
              padding: '40px',
              borderRadius: '15px',
              borderTop: '5px solid #04332b'
            }}>
              <h3 style={{fontSize: '1.8rem', marginBottom: '25px', textAlign: 'center', color: '#04332b'}}>نموذجنا التحويلي</h3>
              <ul style={{listStyle: 'none', padding: 0}}>
                {content?.new_model?.map((item, idx) => (
                  <li key={idx} style={{
                    padding: '12px 0',
                    position: 'relative',
                    paddingRight: '35px',
                    fontSize: '1.1rem'
                  }}>
                    <span style={{position: 'absolute', right: 0, color: '#04332b', fontWeight: 'bold', fontSize: '1.3rem'}}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* قسم الشهادات */}
      <section style={{padding: '100px 0', background: '#f0f5f4'}}>
        <div className="container">
          <h2 className="section-title" style={{textAlign: 'center'}}>كيف غيرنا حياة الناس</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px', marginTop: '50px'}}>
            {content?.testimonials?.map((testimonial, idx) => (
              <div 
                key={idx}
                style={{
                  background: 'white',
                  padding: '30px',
                  borderRadius: '15px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                  borderRight: '4px solid #b8a57b'
                }}
              >
                <p style={{fontStyle: 'italic', marginBottom: '20px', color: '#555', lineHeight: 1.7}}>
                  "{testimonial.text}"
                </p>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: '#04332b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.5rem',
                    marginLeft: '15px',
                    border: '2px solid #b8a57b'
                  }}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 style={{color: '#04332b', marginBottom: '5px'}}>{testimonial.name}</h4>
                    <p style={{color: '#777', fontSize: '0.9rem'}}>{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* قسم الدعوة للعمل */}
      <section style={{
        padding: '100px 0',
        background: 'linear-gradient(rgba(4, 51, 43, 0.9), rgba(4, 51, 43, 0.8))',
        color: 'white',
        textAlign: 'center',
        borderTop: '5px solid #b8a57b'
      }}>
        <div className="container">
          <h2 style={{fontSize: '2.5rem', marginBottom: '30px'}}>انضم إلى رحلتنا التحويلية</h2>
          <p style={{fontSize: '1.3rem', maxWidth: '700px', margin: '0 auto 40px', color: '#f0f5f4'}}>
            ساعدنا في بناء جيل جديد من القادة والمبادرين، وكن جزءاً من التحول من ثقافة الإعانة إلى ثقافة التمكين.
          </p>
          <div style={{display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap'}}>
            <Link 
              to="/families" 
              style={{
                display: 'inline-block',
                padding: '15px 35px',
                borderRadius: '30px',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                background: '#b8a57b',
                color: '#04332b'
              }}
              className="cta-button"
            >
              كن شريكاً في التمكين
            </Link>
            <Link 
              to="/initiatives" 
              style={{
                display: 'inline-block',
                padding: '15px 35px',
                borderRadius: '30px',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                background: 'transparent',
                color: 'white',
                border: '2px solid #b8a57b'
              }}
              className="cta-button-secondary"
            >
              تطوع معنا
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      <style jsx>{`
        .principle-card-hover:hover {
          transform: translateY(-10px);
        }
        .cta-button:hover {
          background: #a89470;
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(184, 165, 123, 0.4);
        }
        .cta-button-secondary:hover {
          background: #b8a57b;
          color: #04332b;
          transform: translateY(-3px);
        }
      `}</style>
    </div>
  );
};

export default OurMissionPage;

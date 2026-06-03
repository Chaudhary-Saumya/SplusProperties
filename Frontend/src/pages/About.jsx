import React, { useEffect } from 'react';
import { Mail, Shield, Target, Award, Users, Globe, Lightbulb, Briefcase, ExternalLink, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { language, t } = useLanguage();

  const brands = [
    { 
      name: 'Kharsan.com', 
      tag: language === 'en' ? 'Flagship' : 'ફ્લેગશિપ',
      desc: language === 'en' 
        ? 'Our central digital identity offering premium IT solutions and educational courses.' 
        : 'પ્રીમિયમ આઇટી સોલ્યુશન્સ અને શૈક્ષણિક અભ્યાસક્રમો પ્રદાન કરતી અમારી મુખ્ય ડિજિટલ ઓળખ.',
      url: 'https://kharsan.com',
      status: 'active',
      buttonType: 'visit',
      icon: Globe
    },
    { 
      name: 'properties.kharsan.com', 
      tag: language === 'en' ? 'Real Estate' : 'રિયલ એસ્ટેટ',
      desc: language === 'en'
        ? 'The premium platform for verified land and property investments.'
        : 'વેરિફાઇડ જમીન અને મિલકત રોકાણ માટેનું પ્રીમિયમ પ્લેટફોર્મ.', 
      url: 'https://properties.kharsan.com',
      status: 'active',
      buttonType: 'here',
      icon: Shield
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="min-h-screen bg-[#f8f5ee] font-['Nunito_Sans',sans-serif]">
      <SEO 
        title={language === 'en' ? 'About Us | The Kharsan Ecosystem' : 'અમારા વિશે | ખારસણ ઇકોસિસ્ટમ'}
        description="Discover the vision behind Kharsan Properties and the Kharsan IT Solution ecosystem. Built on trust, innovation, and a legacy of excellence."
      />

      {/* ── Hero Section ── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-[#1a2340]">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[#c9a84c]/5 skew-x-12 transform translate-x-1/4" />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <span className="inline-block text-[#c9a84c] font-extrabold text-xs tracking-[4px] uppercase mb-6 bg-[#c9a84c]/10 px-4 py-2 rounded-lg border border-[#c9a84c]/20">
              {language === 'en' ? 'Our Legacy' : 'આપણો વારસો'}
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-[1.1]">
              {language === 'en' ? (
                <>Elevating the <span className="text-[#c9a84c]">Standard</span> of Real Estate</>
              ) : (
                <>રિયલ એસ્ટેટના <span className="text-[#c9a84c]">ધોરણોને</span> ઉંચા લાવવા</>
              )}
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed max-w-2xl font-medium">
              {language === 'en'
                ? "Building trust through technology. Kharsan is more than a name; it's a commitment to transparency, quality, and future-forward property management."
                : "ટેકનોલોજી દ્વારા વિશ્વાસનું નિર્માણ. ખારસણ એ માત્ર એક નામ નથી; તે પારદર્શિતા, ગુણવત્તા અને ભવિષ્યલક્ષી પ્રોપર્ટી મેનેજમેન્ટની પ્રતિબદ્ધતા છે."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Our Brands Ecosystem ── */}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-[#1a2340] mb-4">
                {language === 'en' ? 'The Kharsan Ecosystem' : 'ખારસણ ઇકોસિસ્ટમ'}
              </h2>
              <p className="text-slate-500 font-semibold text-lg max-w-xl">
                {language === 'en'
                  ? 'A vertically integrated network of brands dedicated to excellence across multiple digital and physical frontiers.'
                  : 'ડિજિટલ અને ભૌતિક ક્ષેત્રોમાં ઉત્કૃષ્ટતા માટે સમર્પિત બ્રાન્ડ્સનું એક સંકલિત નેટવર્ક.'}
              </p>
            </div>
            <div className="hidden md:block h-0.5 flex-1 bg-[#e2d9c5] mx-12 mb-6 opacity-50" />
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto"
          >
            {brands.map((brand, idx) => (
              <motion.div 
                key={idx}
                variants={itemVariants}
                className={`group relative bg-white rounded-[2.5rem] p-10 border border-[#e2d9c5] transition-all duration-500 hover:shadow-2xl hover:border-[#c9a84c] flex flex-col h-full ${brand.status === 'coming-soon' ? 'opacity-90' : ''}`}
              >
                <div className="mb-8 relative">
                  <div className="w-16 h-16 bg-[#f8f5ee] text-[#c9a84c] rounded-2xl flex items-center justify-center group-hover:bg-[#1a2340] group-hover:text-white transition-colors duration-500">
                    <brand.icon size={32} />
                  </div>
                  <span className="absolute top-0 right-0 text-[10px] font-black uppercase tracking-widest text-[#c9a84c] bg-[#c9a84c]/10 px-3 py-1.5 rounded-full border border-[#c9a84c]/20">
                    {brand.tag}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-[#1a2340] mb-4">{brand.name}</h3>
                <p className="text-slate-500 font-medium leading-relaxed mb-10 flex-1">
                  {brand.desc}
                </p>

                {brand.status === 'active' ? (
                  brand.buttonType === 'here' ? (
                    <div className="flex items-center justify-center w-full py-4 px-6 bg-[#c9a84c] text-[#1a2340] rounded-2xl font-black text-sm uppercase tracking-widest border-2 border-[#c9a84c]">
                      {language === 'en' ? 'You Are Here' : 'તમે અહીં છો'}
                    </div>
                  ) : (
                    <a 
                      href={brand.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between w-full py-4 px-6 bg-[#1a2340] text-white rounded-2xl font-bold hover:bg-[#c9a84c] hover:text-[#1a2340] transition-all duration-300 group/btn"
                    >
                      <span>{language === 'en' ? 'Visit Brand' : 'બ્રાન્ડની મુલાકાત લો'}</span>
                      <ExternalLink size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                  )
                ) : (
                  <div className="flex items-center justify-center w-full py-4 px-6 bg-[#f3f4f6] text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-200">
                    {language === 'en' ? 'Coming Soon' : 'ટૂંક સમયમાં આવી રહ્યું છે'}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Leadership & Vision ── */}
      <section className="bg-white py-24 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-12"
            >
              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold text-[#1a2340]">
                  {language === 'en' ? 'Brains Behind Kharsan' : 'ખારસણ પાછળના મગજ'}
                </h2>
                <div className="w-20 h-2 bg-[#c9a84c] rounded-full" />
              </div>

              {/* Leader 1 */}
              <div className="relative p-10 bg-[#f8f5ee] rounded-[3rem] border border-[#e2d9c5]">
                <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start text-center sm:text-left">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-black text-[#1a2340]">Mr. Saumya</h3>
                    <p className="text-[#c9a84c] font-black text-xs tracking-widest uppercase">
                      {language === 'en' ? 'Founder & Lead Creator' : 'સ્થાપક અને મુખ્ય નિર્માતા'}
                    </p>
                    <p className="text-slate-600 font-medium italic text-lg leading-relaxed">
                      {language === 'en'
                        ? '"We are building a digital legacy where technological precision meets the timeless value of land."'
                        : '"અમે એક એવો ડિજિટલ વારસો બનાવી રહ્યા છીએ જ્યાં ટેકનોલોજીકલ ચોકસાઈ જમીનના કાલાતીત મૂલ્યને મળે છે."'}
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center sm:justify-start pt-4">
                      <a href="mailto:saumya@kharsan.com" className="flex items-center gap-2 text-[#1a2340] font-bold text-sm hover:text-[#c9a84c] transition-colors">
                        <Mail size={16} /> saumya@kharsan.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leader 2 */}
              <div className="relative p-10 bg-[#1a2340] rounded-[3rem] text-white">
                <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start text-center sm:text-left">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-black">Mr. Ashvin</h3>
                    <p className="text-[#c9a84c] font-black text-xs tracking-widest uppercase">
                      {language === 'en' ? 'Visionary Architect' : 'દૂરદર્શી આર્કિટેક્ટ'}
                    </p>
                    <p className="text-slate-300 font-medium text-lg leading-relaxed">
                      {language === 'en'
                        ? 'The core architect of the Kharsan vision, ensuring strategic direction and operational integrity.'
                        : 'ખારસણ વિઝનના મુખ્ય આર્કિટેક્ટ, જે વ્યૂહાત્મક દિશા અને ઓપરેશનલ અખંડિતતા સુનિશ્ચિત કરે છે.'}
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center sm:justify-start pt-4">
                      <a href="mailto:ashvin@kharsan.com" className="flex items-center gap-2 text-[#c9a84c] font-bold text-sm hover:text-white transition-colors">
                        <Mail size={16} /> ashvin@kharsan.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-10 bg-[#c9a84c]/5 rounded-[4rem] transform rotate-3" />
              <img 
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200" 
                alt="Modern Corporate Building" 
                loading="lazy"
                className="relative z-10 w-full aspect-[4/5] object-cover rounded-[3rem] shadow-2xl"
              />
              <div className="absolute bottom-10 -left-10 z-20 bg-white p-8 rounded-3xl shadow-xl max-w-xs border border-[#e2d9c5] hidden md:block">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#c9a84c] text-white rounded-xl flex items-center justify-center">
                    <Target size={24} />
                  </div>
                  <h4 className="font-bold text-[#1a2340]">{language === 'en' ? 'Our Mission' : 'અમારું લક્ષ્ય'}</h4>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {language === 'en'
                    ? 'Digitizing the land industry to make ownership accessible, verified, and secure for everyone.'
                    : 'માલિકી દરેક માટે સુલભ, વેરિફાઇડ અને સુરક્ષિત બનાવવા માટે જમીન ઉદ્યોગનું ડિજિટલાઇઝેશન કરવું.'}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Vision Stats ── */}
      <section className="py-24 px-6 bg-[#f8f5ee]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                icon: Shield, 
                title: language === 'en' ? "Verified" : "વેરિફાઇડ", 
                text: language === 'en' ? "100% physically and legally verified land parcels." : "૧૦૦% શારીરિક અને કાયદાકીય રીતે વેરિફાઇડ જમીન પ્લોટ્સ." 
              },
              { 
                icon: Target, 
                title: language === 'en' ? "Precision" : "ચોકસાઈ", 
                text: language === 'en' ? "Smart boundary mapping with sub-meter accuracy." : "સબ-મીટર ચોકસાઈ સાથે સ્માર્ટ સીમા નકશો." 
              },
              { 
                icon: Award, 
                title: language === 'en' ? "Premium" : "પ્રીમિયમ", 
                text: language === 'en' ? "The highest standard of luxury agricultural land." : "લક્ઝરી ખેતીની જમીનનું ઉચ્ચતમ ધોરણ." 
              }
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className="w-20 h-20 mx-auto bg-white rounded-[2rem] flex items-center justify-center mb-8 border border-[#e2d9c5] group-hover:bg-[#1a2340] group-hover:text-[#c9a84c] transition-all duration-500 shadow-sm group-hover:shadow-xl">
                  <item.icon size={32} />
                </div>
                <h3 className="text-xl font-bold text-[#1a2340] mb-4">{item.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer Branding ── */}
      <section className="py-12 border-t border-[#e2d9c5] text-center px-6">
        <p className="text-[#1a2340]/40 text-[10px] font-black tracking-[4px] uppercase">
          {language === 'en' ? (
            <>A Legacy Vertical of <span className="text-[#c9a84c]">Kharsan IT Solution</span></>
          ) : (
            <>ખારસણ આઈટી સોલ્યુશનનું એક <span className="text-[#c9a84c]">વારસા એકમ</span></>
          )}
        </p>
      </section>
    </div>
  );
};

export default About;

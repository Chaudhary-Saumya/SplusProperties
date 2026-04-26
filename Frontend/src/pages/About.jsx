import React, { useEffect } from 'react';
import { Mail, Shield, Target, Award, Users, Globe, Lightbulb, Briefcase } from 'lucide-react';
import SEO from '../components/SEO';
import Me from '../assets/Me.jpeg';

const About = () => {
  useEffect(() => {
    document.title = "About Us | Splus Properties";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f5ee]">
      <SEO 
        title="About Us | Our Vision & Leadership"
        description="Learn about Splus Properties and its parent SplusTechnologies. Our vision is to build a legacy through technological innovation and trust in the real estate sector."
      />
      {/* Hero Section */}
      <section className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a2340]/80 to-[#f8f5ee] z-10" />
          <img 
            src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2000" 
            alt="Luxury Real Estate" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-20 text-center px-6 max-w-4xl mx-auto animate-fade-in translate-y-4">
          <h1 className="font-playfair text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Elevating the <span className="text-[#c9a84c]">Standard</span> of Real Estate
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-200 font-medium max-w-2xl mx-auto">
            Building legacies, one property at a time. Splus Properties is the cornerstone of excellence in modern land and property management.
          </p>
        </div>
      </section>

      {/* Brand Identity / Hierarchy */}
      <section className="py-12 md:py-20 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="space-y-6 order-2 lg:order-1">
            <div className="inline-block px-4 py-1.5 bg-[#c9a84c]/10 rounded-full border border-[#c9a84c]/20">
              <span className="text-[#c9a84c] font-bold text-xs md:text-sm tracking-widest uppercase">Our Pedigree</span>
            </div>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-[#1a2340]">The Splus Ecosystem</h2>
            <p className="text-slate-600 leading-relaxed text-base md:text-lg">
              Splus Properties is a flagship vertical under the esteemed <span className="font-bold text-[#1a2340]">SplusTechnologies</span> banner. Our brand represents a fusion of technological innovation and traditional real estate values.
            </p>
            <div className="flex flex-col space-y-4 pt-4">
              <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 transition-transform hover:scale-[1.02]">
                <div className="w-12 h-12 flex items-center justify-center bg-[#1a2340] text-white rounded-xl shrink-0">
                  <Globe size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-[#1a2340] text-sm md:text-base">SplusTechnologies</h4>
                  <p className="text-xs md:text-sm text-slate-500">The Global Innovation Hub & Parent Brand</p>
                </div>
              </div>
              <div className="w-0.5 h-6 bg-slate-200 ml-10" />
              <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-md border-l-4 border-l-[#c9a84c] transition-transform hover:scale-[1.02]">
                <div className="w-12 h-12 flex items-center justify-center bg-[#c9a84c] text-white rounded-xl shrink-0">
                  <Shield size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-[#1a2340] text-sm md:text-base">Splus Properties</h4>
                  <p className="text-xs md:text-sm text-slate-500">Premium Real Estate & Land Management</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative group order-1 lg:order-2">
            <div className="absolute -inset-4 bg-[#c9a84c]/10 rounded-[2.5rem] transform -rotate-3 lg:group-hover:rotate-1 transition-transform duration-500 hidden sm:block" />
            <img 
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1000" 
              alt="Architecture" 
              className="relative z-10 w-full h-[300px] md:h-[400px] lg:h-[500px] object-cover rounded-3xl shadow-xl lg:shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="py-16 md:py-24 px-6 max-w-6xl mx-auto overflow-hidden">
        <div className="text-center mb-16">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-[#1a2340] mb-4">Brains Behind Splus</h2>
          <div className="w-24 h-1.5 bg-[#c9a84c] mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 gap-12">
          {/* Saumya Chaudhary */}
          <div className="flex flex-col lg:flex-row items-center gap-10 bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100 animate-fade-in">
            {/* <div className="w-48 h-48 md:w-64 md:h-64 rounded-3xl overflow-hidden border-4 border-[#c9a84c]/20 shadow-lg shrink-0 relative group">
               <img 
                 src={Me} 
                 alt="Saumya Chaudhary" 
                 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-[#1a2340]/60 to-transparent" />
            </div> */}
            <div className="space-y-6 text-center lg:text-left flex-1">
              <div>
                <h3 className="text-3xl font-bold text-[#1a2340]">Saumya Chaudhary</h3>
                <p className="text-[#c9a84c] font-bold tracking-widest text-sm uppercase mt-1">Owner, Founder & Lead Creator</p>
              </div>
              <p className="text-slate-600 text-lg leading-relaxed italic border-l-4 border-[#c9a84c] pl-6 py-2">
                "As the creator of the Splus Properties ecosystem, my focus is on merging technological precision with the timeless value of land. We are building more than a platform; we are building a digital legacy."
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a 
                  href="mailto:saumyachaudhary9409@gmail.com" 
                  className="flex items-center gap-3 bg-[#1a2340] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#2a3a6a] transition-all shadow-md active:scale-95"
                >
                  <Mail size={20} />
                  Contact Directly
                </a>
                <span className="text-slate-500 font-medium hidden sm:block">|</span>
                <span className="text-slate-500 font-medium">saumyachaudhary9409@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Ashvin Chaudhary */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-10 bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {/* <div className="w-48 h-48 md:w-64 md:h-64 rounded-3xl overflow-hidden border-4 border-[#1a2340]/10 shadow-lg shrink-0 flex items-center justify-center bg-slate-50 relative group">
               <div className="w-full h-full bg-[#1a2340]/5 flex items-center justify-center">
                  <Lightbulb size={64} className="text-[#c9a84c] opacity-50 group-hover:scale-125 transition-transform duration-500" />
               </div>
               <div className="absolute inset-0 bg-gradient-to-b from-[#1a2340]/10 to-transparent" />
            </div> */}
            <div className="space-y-6 text-center lg:text-left flex-1">
              <div>
                <h3 className="text-3xl font-bold text-[#1a2340]">Ashvin Chaudhary</h3>
                <p className="text-[#1a2340] font-bold tracking-widest text-sm uppercase mt-1 opacity-70">The Visionary Architect & Management</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-[#f8f5ee] rounded-2xl">
                  <Lightbulb className="text-[#c9a84c] shrink-0 mt-1" size={24} />
                  <p className="text-slate-700 text-lg leading-relaxed">
                    The core idea behind the Splus platform was conceived and nurtured by Ashvin Chaudhary. His visionary approach laid the foundation for what Splus is today.
                  </p>
                </div>
                <div className="flex items-start gap-4 p-4 bg-[#f8f5ee] rounded-2xl">
                  <Briefcase className="text-[#1a2340] shrink-0 mt-1" size={24} />
                  <p className="text-slate-700 text-lg leading-relaxed">
                    Beyond the idea, he manages the strategic direction and operational integrity of the Splus ecosystem, ensuring we stay true to our goal of creating a legacy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="bg-[#1a2340] py-16 md:py-24 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-[#c9a84c]/5 rounded-full blur-3xl -mr-32 -mt-32 md:-mr-48 md:-mt-48" />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="font-playfair text-3xl md:text-5xl font-bold mb-6">Our Vision & Legacy</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              We don't just sell land; we facilitate the creation of legacies. Our vision is to build a vertically integrated ecosystem where quality, transparency, and innovation come together.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              { icon: Target, title: "Precision", text: "Curating only the most premium land opportunities with meticulous verification." },
              { icon: Award, title: "Excellence", text: "Setting a new benchmark for luxury and reliability in the real estate industry." },
              { icon: Users, title: "Community", text: "Building lasting relationships with our clients based on trust and mutual growth." }
            ].map((item, i) => (
              <div key={i} className="p-6 md:p-8 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl hover:bg-white/10 transition-colors group">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-[#c9a84c]/20 rounded-xl md:rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shrink-0">
                  <item.icon className="text-[#c9a84c]" size={28} />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-4">{item.title}</h3>
                <p className="text-sm md:text-base text-slate-400 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Footer Branding */}
      <section className="py-10 md:py-12 border-t border-slate-200 text-center px-6">
        <p className="text-slate-400 text-xs md:text-sm font-medium tracking-widest uppercase">
          A Legacy Brand of <span className="text-[#1a2340]">SplusTechnologies</span>
        </p>
      </section>

      <style>{`
        .font-playfair { font-family: 'Playfair Display', serif; }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default About;


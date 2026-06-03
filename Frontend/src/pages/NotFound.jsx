import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-[85vh] bg-[#1a2340] flex items-center justify-center px-6 relative overflow-hidden font-['Nunito_Sans',sans-serif]">
      <SEO 
        title="404 — Plot Not Found" 
        description="The page you are looking for does not exist on Kharsan Properties. Return to home or browse available listings." 
      />

      {/* Decorative Gold & Indigo Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#c9a84c]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      {/* Luxury gold top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c]" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-xl w-full text-center z-10"
      >
        {/* Animated Compass Icon */}
        <div className="flex justify-center mb-8">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="w-24 h-24 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xs relative"
          >
            <Compass size={48} className="text-[#c9a84c]" strokeWidth={1.5} />
            <div className="absolute -inset-2 rounded-full border border-[#c9a84c]/10 pointer-events-none" />
          </motion.div>
        </div>

        {/* 404 Status */}
        <span className="inline-block text-[#c9a84c] font-black text-xs tracking-[4px] uppercase mb-4 bg-[#c9a84c]/10 px-4.5 py-2 rounded-lg border border-[#c9a84c]/20">
          Error 404
        </span>

        {/* Headings */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
          Lost in the <span className="text-[#c9a84c]">Horizon</span>
        </h1>
        
        <p className="text-slate-300 font-medium text-base sm:text-lg leading-relaxed mb-10 max-w-md mx-auto">
          {t('not_found.desc')}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-[#c9a84c] hover:bg-[#b8933a] text-[#1a2340] font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#c9a84c]/15 hover:-translate-y-0.5"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span>{t('not_found.back_home')}</span>
          </button>
          
          <button
            onClick={() => navigate('/search')}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-transparent hover:bg-white/[0.04] text-white font-black text-sm uppercase tracking-widest rounded-xl border-2 border-white/25 hover:border-white transition-all hover:-translate-y-0.5"
          >
            <Search size={16} strokeWidth={2.5} />
            <span>{t('not_found.search_plots')}</span>
          </button>
        </div>

        {/* Brand tag line */}
        <div className="mt-16 pt-8 border-t border-white/5">
          <p className="text-white/30 text-[9px] font-black tracking-[4px] uppercase">
            Kharsan Properties &bull; Land Management System
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;

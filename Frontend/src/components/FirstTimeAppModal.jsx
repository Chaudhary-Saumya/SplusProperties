import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ArrowRight, X, CheckCircle2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useLanguage } from '../context/LanguageContext';
import k4Logo from '../assets/K4.png';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.kharsan.properties';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // 7 days frequency capping

/**
 * FirstTimeAppModal Component
 * Prompts web visitors to download the official Google Play Android App.
 * Strict rules:
 * 1. NEVER shows inside the native Android Capacitor App.
 * 2. Frequency capped to appear once every 7 days for returning web visitors.
 */
export default function FirstTimeAppModal() {
  const { language } = useLanguage();
  const isGu = language === 'gu';
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. Strictly exclude native Android / Capacitor app environment
    if (
      Capacitor.isNativePlatform() ||
      typeof window === 'undefined' ||
      window.Capacitor?.isNative ||
      window.location.protocol === 'capacitor:' ||
      window.location.href.includes('capacitor://')
    ) {
      return;
    }

    // 2. Check 7-day frequency capping in localStorage
    const lastPromptTime = localStorage.getItem('lastAppInstallPromptTime');
    const now = Date.now();

    if (!lastPromptTime || (now - parseInt(lastPromptTime, 10)) > SEVEN_DAYS_MS) {
      // Small 1.8-second delay after page load for smooth user experience
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    // Save current timestamp to silence prompt for 7 days
    localStorage.setItem('lastAppInstallPromptTime', Date.now().toString());
    setIsOpen(false);
  };

  const handleDownloadApp = () => {
    localStorage.setItem('lastAppInstallPromptTime', Date.now().toString());
    setIsOpen(false);
    window.open(PLAY_STORE_URL, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-slate-200/90 z-10 font-['Nunito_Sans',sans-serif] overflow-hidden"
          >
            {/* Background Aesthetic Glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-200/40 rounded-full blur-2xl pointer-events-none" />

            {/* Close Button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer z-20"
              title="Close and continue with browser"
            >
              <X size={18} />
            </button>

            {/* Brand Badge */}
            <div className="flex items-center gap-3 mb-4">
              <img src={k4Logo} alt="Kharsan Properties" className="h-9 w-auto object-contain" />
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-amber-200">
                OFFICIAL APP
              </span>
            </div>

            {/* Title & Subtitle */}
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug tracking-tight">
              {isGu 
                ? 'શું તમે આપણી મોબાઇલ એપ ડાઉનલોડ કરવા માંગો છો?' 
                : 'Explore Kharsan Properties on Mobile App'}
            </h3>

            <p className="text-slate-500 text-xs sm:text-sm font-semibold mt-1.5 leading-relaxed">
              {isGu 
                ? 'ઝડપી અનુભવ, સ્માર્ટ જમીન સીમા નકશા સાધનો અને નવી પ્રોપર્ટીઝના ઇન્સ્ટન્ટ અપડેટ્સ મેળવો.' 
                : 'Get faster plot searching, interactive GPS boundary mapping, and instant update alerts on Android.'}
            </p>

            {/* Feature Highlights */}
            <div className="my-5 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2 text-xs font-bold text-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{isGu ? 'ઇન્ટરેક્ટિવ GPS સીમા નકશો અને એરિયા ગણતરી' : 'Live GPS Boundary Mapping & Area Calculation'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{isGu ? 'જમીન માલિકો સાથે સીધો સંપર્ક (ઝીરો ફી)' : 'Direct Owner & Broker Connections (Zero Fees)'}</span>
              </div>
            </div>

            {/* Action Choice Buttons */}
            <div className="space-y-2.5 pt-1">
              
              {/* Option 1: Download Mobile App */}
              <button
                type="button"
                onClick={handleDownloadApp}
                className="w-full flex items-center justify-center gap-2.5 bg-[#2563eb] hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-4 rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-[1.01]"
              >
                <Download size={18} />
                <span>{isGu ? 'એપ ડાઉનલોડ કરો (Google Play)' : 'Download Mobile App (Google Play)'}</span>
              </button>

              {/* Option 2: Continue with Web Browser */}
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-3 px-4 rounded-2xl transition-all cursor-pointer"
              >
                <span>{isGu ? 'બ્રાઉઝરમાં આગળ વધો' : 'Continue with Web Browser'}</span>
                <ArrowRight size={14} className="text-slate-400" />
              </button>

            </div>

            {/* Footnote */}
            <div className="mt-3.5 text-center text-[10px] font-bold text-slate-400">
              {isGu ? 'આ મેસેજ દર ૭ દિવસે જ પુનરાવર્તિત થશે' : 'This prompt will only reappear once every 7 days'}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

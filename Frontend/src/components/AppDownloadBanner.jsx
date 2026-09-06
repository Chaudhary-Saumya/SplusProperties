import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ExternalLink, QrCode, Smartphone, X, Maximize2, ShieldCheck, Zap, Layers, Bell } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import appBannerImg from '../assets/appBanner.png';
import qrImg from '../assets/QR.jpeg';
import k4Logo from '../assets/K4.png';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.kharsan.properties';

/**
 * Checks if the current user is accessing from within the mobile app (Capacitor / WebView / Native wrapper).
 */
const checkIsInsideMobileApp = () => {
  if (typeof window === 'undefined') return false;

  // 1. Capacitor Native Platform check
  if (window.Capacitor?.isNativePlatform?.() || window.Capacitor?.isNative) return true;
  if (window.location.protocol === 'capacitor:' || window.location.href.includes('capacitor://')) return true;

  // 2. React Native / Flutter / Android Bridge check
  if (window.ReactNativeWebView || window.flutter_inappwebview || window.AndroidBridge) return true;

  // 3. User Agent check for app webviews
  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  if (/KharsanApp|MobileApp/i.test(ua)) return true;
  if (/; wv\)/i.test(ua) && /Android/i.test(ua)) return true;

  // 4. Query param / localStorage flag (e.g. ?app=true)
  if (window.location.search.includes('isApp=true') || window.location.search.includes('app=true') || window.location.search.includes('mode=app')) return true;
  if (localStorage.getItem('isMobileApp') === 'true') return true;

  return false;
};

export default function AppDownloadBanner() {
  const { language } = useLanguage();
  const isGu = language === 'gu';
  const [showQrModal, setShowQrModal] = useState(false);
  const [isInsideApp, setIsInsideApp] = useState(false);

  useEffect(() => {
    setIsInsideApp(checkIsInsideMobileApp());
  }, []);

  // If already running inside the native mobile app, do not show download banner
  if (isInsideApp) {
    return null;
  }

  return (
    <section className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-['Nunito_Sans',sans-serif]">
      
      {/* ─── MOBILE WEB VIEW CARD (Shown only on small screens) ─── */}
      <div className="block sm:hidden">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#111827] to-[#1e293b] rounded-[2rem] p-6 text-white border border-slate-800 shadow-2xl">
          
          {/* Subtle Accent Glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header Row: Logo & Official Badge */}
          <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
            <div className="flex items-center gap-2.5">
              <img src={k4Logo} alt="Kharsan Properties" className="h-8 w-auto object-contain bg-white/10 rounded-xl p-1" />
              <div>
                <span className="text-xs font-black text-white tracking-tight block">Kharsan Properties</span>
                <span className="text-[10px] text-slate-400 font-semibold block">Official Android App</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
              <ShieldCheck size={12} /> Google Play
            </span>
          </div>

          {/* Title & Tagline */}
          <div className="space-y-1.5 mb-5 relative z-10">
            <h3 className="text-lg font-black text-white leading-tight tracking-tight">
              {isGu ? 'જમીન ખરીદ-વેચાણ હવે મોબાઇલમાં' : 'Search & Buy Plots on Mobile'}
            </h3>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              {isGu
                ? 'નવી જમીન લિસ્ટિંગ્સ, GPS સીમા નકશો અને સીધા માલિક સંપર્ક માટે એપ ડાઉનલોડ કરો.'
                : 'Get live plot alerts, interactive GPS boundary maps, and direct verified owner contacts.'}
            </p>
          </div>

          {/* Feature Highlight Pills */}
          <div className="grid grid-cols-1 gap-2 mb-5 relative z-10 text-xs font-bold text-slate-200">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <Zap size={14} className="text-amber-400 shrink-0" />
              <span>{isGu ? 'ઇન્સ્ટન્ટ પ્રોપર્ટી નોટિફિકેશન્સ' : 'Instant New Plot Alerts'}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <Layers size={14} className="text-blue-400 shrink-0" />
              <span>{isGu ? 'લાઇવ GPS જમીન સીમા ટૂલ' : 'Live GPS Boundary Map'}</span>
            </div>
          </div>

          {/* Action CTA Button */}
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-2xl shadow-xl transition-all relative z-10"
          >
            <Download size={16} />
            <span>{isGu ? 'ગૂગલ પ્લે પર મેળવો' : 'Get it on Google Play'}</span>
            <ExternalLink size={13} className="text-blue-200" />
          </a>

        </div>
      </div>

      {/* ─── DESKTOP / TABLET WEB VIEW (Shown on screens >= 640px) ─── */}
      <div className="hidden sm:block">
        <div className="relative overflow-hidden rounded-[2.5rem] p-4 sm:p-6 lg:p-8">
          
          {/* Main Banner Image Container */}
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block relative overflow-hidden rounded-[2rem] sm:rounded-[2.4rem] shadow-lg group cursor-pointer border border-amber-200/60"
          >
            <img
              src={appBannerImg}
              alt="Download Kharsan Properties Mobile App"
              className="w-full h-auto object-cover object-center transform group-hover:scale-[1.012] transition-transform duration-500 rounded-[2rem] sm:rounded-[2.4rem]"
            />

            {/* Subtle Hover Gradient & Glow Effect */}
            <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/10 transition-colors duration-300 pointer-events-none rounded-[2rem] sm:rounded-[2.4rem]" />
          </a>

          {/* Interactive App Download & Custom QR Code Bar */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Info Badge */}
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Smartphone size={20} />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">
                  {isGu ? 'ખરસાણ પ્રોપર્ટીઝ એન્ડ્રોઇડ એપ' : 'Kharsan Properties Android App'}
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  {isGu ? 'ગૂગલ પ્લે સ્ટોર પર ઉપલબ્ધ છે' : 'Available on Official Google Play Store'}
                </div>
              </div>
            </div>

            {/* Play Store & QR Code Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              
              {/* Scannable & Expandable Custom QR Code Card */}
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="flex items-center gap-3 bg-slate-50 hover:bg-amber-50/80 px-3.5 py-2 rounded-2xl border border-slate-200 hover:border-amber-300 shadow-xs transition-all cursor-pointer group"
                title="Click to expand QR Code"
              >
                <div className="relative shrink-0">
                  <img
                    src={qrImg}
                    alt="Scan QR Code to Download App"
                    className="w-11 h-11 rounded-xl object-cover bg-white ring-1 ring-slate-200 group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent rounded-xl transition-colors flex items-center justify-center">
                    <Maximize2 size={12} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div className="text-left pr-1">
                  <div className="flex items-center gap-1 text-[11px] font-black text-slate-900 uppercase tracking-wider group-hover:text-amber-700 transition-colors">
                    <QrCode size={13} className="text-blue-600 group-hover:text-amber-600" />
                    <span>{isGu ? 'QR કોડ સ્કેન કરો' : 'Scan QR Code'}</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-500">
                    {isGu ? 'મોટો કરવા માટે ટેપ કરો' : 'Tap to Enlarge & Scan'}
                  </div>
                </div>
              </button>

              {/* Direct Play Store Link Button */}
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-3 rounded-2xl shadow-md hover:shadow-xl transition-all hover:scale-[1.03] cursor-pointer"
              >
                <Download size={15} />
                <span>{isGu ? 'ગૂગલ પ્લે પર મેળવો' : 'Get it on Google Play'}</span>
                <ExternalLink size={13} className="ml-0.5 text-blue-200" />
              </a>

            </div>

          </div>

        </div>
      </div>

      {/* Enlarged QR Code Modal Dialog */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showQrModal && (
            <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
              
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowQrModal(false)}
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-md cursor-pointer"
              />

              {/* Modal Body */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200 z-10 font-['Nunito_Sans',sans-serif] text-center"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>

                {/* Header Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-black uppercase tracking-wider mb-4">
                  <QrCode size={14} />
                  <span>{isGu ? 'ખરસાણ એપ QR કોડ' : 'Kharsan App QR Code'}</span>
                </div>

                <h3 className="text-xl font-black text-slate-900 mb-1">
                  {isGu ? 'એપ ડાઉનલોડ કરવા સ્કેન કરો' : 'Scan to Download App'}
                </h3>
                <p className="text-xs font-semibold text-slate-500 mb-6">
                  {isGu 
                    ? 'તમારા મોબાઇલ કેમેરા વડે સ્કેન કરીને પ્લે સ્ટોર પરથી એપ ડાઉનલોડ કરો.' 
                    : 'Scan this QR code using your phone camera to open on Google Play Store.'
                  }
                </p>

                {/* Enlarged QR Code Image Container */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-3xl border-2 border-amber-200/80 shadow-inner mb-6 inline-block">
                  <img
                    src={qrImg}
                    alt="Kharsan Properties Google Play QR Code"
                    className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-2xl shadow-md bg-white p-2"
                  />
                </div>

                {/* Direct Play Store Link */}
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <Download size={16} />
                  <span>{isGu ? 'પ્લે સ્ટોર પર સીધા જાઓ' : 'Open in Google Play Store'}</span>
                  <ExternalLink size={14} />
                </a>

              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </section>
  );
}


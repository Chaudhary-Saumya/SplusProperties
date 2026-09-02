import React, { useContext, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { ChevronDown, Menu, X, Home, LogIn, LogOut, LayoutDashboard, List, Settings, Plus, MapPin, Layers, Calculator, ShieldCheck, Globe, User, Heart, Building2, Calendar, FileText, Search, Users, Phone, Mail, ExternalLink, ArrowRight, Sparkles, Camera, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getImageUrl } from '../utils/imageUrl';
import k4Logo from '../assets/K4.png';

/* ─── Ultra-Modern Right Slide Drawer Component with React Portal & Framer Motion ─── */
const RightSlideDrawer = ({ isOpen, onClose, user, isAuthenticated, handleLogout }) => {
  const { updateProfileDetails } = useContext(AuthContext);
  const { language, setLanguage, t } = useLanguage();
  const drawerFileInputRef = useRef(null);
  const [uploadingDrawerAvatar, setUploadingDrawerAvatar] = useState(false);

  if (typeof document === 'undefined') return null;

  const handleDrawerAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WEBP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingDrawerAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post('/api/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.data) {
        await updateProfileDetails({ profileImage: res.data.data });
        toast.success('Profile picture updated!');
      }
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploadingDrawerAvatar(false);
      if (drawerFileInputRef.current) drawerFileInputRef.current.value = '';
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex justify-end">
          {/* Backdrop Blur & Fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
          />

          {/* Drawer Body with Rounded Left Edge & Spring Motion */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="relative w-full max-w-sm bg-white h-screen shadow-[0_0_60px_rgba(0,0,0,0.2)] flex flex-col justify-between z-[100000] overflow-hidden rounded-l-[2rem] border-l border-slate-200/80 font-['Nunito_Sans',sans-serif]"
          >
            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto">
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 sticky top-0 z-20 backdrop-blur-md">
                <img src={k4Logo} alt="Kharsan Properties" className="h-9 sm:h-10 w-auto object-contain" />
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* User Account Banner */}
              {isAuthenticated ? (
                <div className="p-4 sm:p-5 bg-gradient-to-br from-[#1a2340] via-slate-900 to-[#1a2340] text-white flex items-center justify-between shadow-inner">
                  <input
                    type="file"
                    ref={drawerFileInputRef}
                    onChange={handleDrawerAvatarUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      onClick={() => !uploadingDrawerAvatar && drawerFileInputRef.current?.click()}
                      className="relative w-12 h-12 rounded-full bg-[#c9a84c] text-slate-900 font-black text-lg flex items-center justify-center uppercase shadow-md ring-2 ring-amber-400/30 overflow-hidden shrink-0 group cursor-pointer"
                      title="Click to change profile picture"
                    >
                      {user?.profileImage ? (
                        <img src={getImageUrl(user.profileImage)} alt={user?.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        user?.name?.[0] || 'U'
                      )}
                      <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        {uploadingDrawerAvatar ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold truncate">{user?.name}</div>
                      <div className="text-[10px] font-black text-[#c9a84c] uppercase tracking-wider flex items-center gap-1 mt-0.5">
                        <ShieldCheck size={12} />
                        <span>{user?.role || 'Verified User'}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/settings"
                    onClick={onClose}
                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-amber-300 transition-colors shrink-0"
                    title="Account Settings"
                  >
                    <Settings size={16} />
                  </Link>
                </div>
              ) : (
                <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white space-y-3">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-400" />
                    <span>Welcome to Kharsan</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      onClick={onClose}
                      className="block text-center py-2.5 text-xs font-extrabold text-slate-900 bg-white rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={onClose}
                      className="block text-center py-2.5 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              )}

              {/* Language Selector Bar */}
              <div className="p-3 bg-slate-100/90 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider">
                  <Globe size={15} className="text-blue-600" />
                  <span>{language === 'gu' ? 'ભાષા (Language)' : 'Select Language'}</span>
                </div>
                <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-inner">
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${language === 'en'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setLanguage('gu')}
                    className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${language === 'gu'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    ગુજરાતી
                  </button>
                </div>
              </div>

              {/* Navigation Options List */}
              <div className="p-4 space-y-1.5">
                <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {language === 'gu' ? 'મુખ્ય મેનૂ' : 'Main Menu'}
                </div>

                <Link
                  to="/"
                  onClick={onClose}
                  className="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-blue-50/80 text-slate-800 hover:text-blue-600 transition-all font-black text-xs group"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Home size={16} />
                  </div>
                  <span>{t('navbar.home')}</span>
                </Link>

                <Link
                  to="/search"
                  onClick={onClose}
                  className="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-blue-50/80 text-slate-800 hover:text-blue-600 transition-all font-black text-xs group"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Search size={16} />
                  </div>
                  <span>{t('navbar.buy')}</span>
                </Link>

                <Link
                  to="/favorites"
                  onClick={onClose}
                  className="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-rose-50/80 text-slate-800 hover:text-rose-600 transition-all font-black text-xs group"
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-100/70 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform relative">
                    <Heart size={16} className="fill-rose-500 text-rose-500" />
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span>{t('navbar.my_favourites')}</span>
                    {user?.favorites?.length > 0 && (
                      <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                        {user.favorites.length}
                      </span>
                    )}
                  </div>
                </Link>

                <Link
                  to="/brokers"
                  onClick={onClose}
                  className="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-blue-50/80 text-slate-800 hover:text-blue-600 transition-all font-black text-xs group"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Users size={16} />
                  </div>
                  <span>{t('navbar.brokers')}</span>
                </Link>

                {isAuthenticated && (
                  <>
                    <div className="pt-3 px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {t('navbar.my_account')}
                    </div>

                    <Link
                      to="/my-listings"
                      onClick={onClose}
                      className="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-blue-50/80 text-slate-800 hover:text-blue-600 transition-all font-black text-xs group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <List size={16} />
                      </div>
                      <span>{t('navbar.my_listings')}</span>
                    </Link>

                    <Link
                      to="/buyer-leads"
                      onClick={onClose}
                      className="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-emerald-50/80 text-slate-800 hover:text-emerald-600 transition-all font-black text-xs group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Users size={16} />
                      </div>
                      <span>{t('navbar.buyer_leads')}</span>
                    </Link>
                  </>
                )}

                <div className="pt-3 px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {t('navbar.tools')}
                </div>

                <Link
                  to="/saved-maps"
                  onClick={onClose}
                  className="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-blue-50/80 text-slate-800 hover:text-blue-600 transition-all font-black text-xs group"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <MapPin size={16} />
                  </div>
                  <span>{t('navbar.saved_boundaries')}</span>
                </Link>

                <Link
                  to="/boundary-map"
                  onClick={onClose}
                  className="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-blue-50/80 text-slate-800 hover:text-blue-600 transition-all font-black text-xs group"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Layers size={16} />
                  </div>
                  <span>{t('navbar.boundary_map')}</span>
                </Link>

                <Link
                  to="/area-converter"
                  onClick={onClose}
                  className="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-amber-50/80 text-slate-800 hover:text-amber-600 transition-all font-black text-xs group"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-100/70 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Calculator size={16} />
                  </div>
                  <span>{t('navbar.area_converter')}</span>
                </Link>

                <Link
                  to="/calculator"
                  onClick={onClose}
                  className="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-emerald-50/80 text-slate-800 hover:text-emerald-600 transition-all font-black text-xs group"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <FileText size={16} />
                  </div>
                  <span>{t('navbar.calculator')}</span>
                </Link>

                <Link
                  to="/about"
                  onClick={onClose}
                  className="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-slate-100 text-slate-800 transition-all font-black text-xs group"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Building2 size={16} />
                  </div>
                  <span>{t('navbar.about')}</span>
                </Link>
              </div>
            </div>


            {/* Production Sticky Bottom Footer */}
            <div className="p-4 border-t border-slate-200/80 space-y-2 bg-slate-50/90 shrink-0">
              <Link
                to={isAuthenticated ? '/create-listing' : '/login'}
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs py-3 rounded-2xl shadow-md hover:shadow-lg transition-all"
              >
                <Plus size={16} />
                <span>{t('navbar.post_property_free')}</span>
              </Link>

              {isAuthenticated && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    to="/settings"
                    onClick={onClose}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-extrabold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all shadow-xs"
                  >
                    <Settings size={15} className="text-slate-500" />
                    <span>{t('navbar.settings')}</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-extrabold text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
                  >
                    <LogOut size={15} />
                    <span>{t('navbar.logout')}</span>
                  </button>
                </div>
              )}


              <div className="pt-2 text-center text-[10px] font-bold text-slate-400">
                © {new Date().getFullYear()} Kharsan Properties Platform
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const { language, toggleLanguage, t } = useLanguage();
  const [showRightDrawer, setShowRightDrawer] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [navSearch, setNavSearch] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const isSearchPage = location.pathname === '/search';

  // Sync navSearch with URL parameter on mount/URL change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('query') || '';
    setNavSearch(q);
  }, [location.search]);

  // Live real-time search: Update URL directly as user types without popup dropdowns
  const handleNavInputChange = (e) => {
    const val = e.target.value;
    setNavSearch(val);

    if (isSearchPage) {
      const params = new URLSearchParams(location.search);
      if (val.trim()) {
        params.set('query', val.trim());
      } else {
        params.delete('query');
      }
      navigate(`/search?${params.toString()}`, { replace: true });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowRightDrawer(false);
    setShowUserDropdown(false);
  };

  const handleNavSearchSubmit = (e) => {
    e.preventDefault();
    if (!isSearchPage) {
      if (navSearch.trim()) {
        navigate(`/search?query=${encodeURIComponent(navSearch.trim())}`);
      } else {
        navigate('/search');
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm font-['Nunito_Sans',sans-serif]">
        {/* Main Navbar Container */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">

          {/* Brand Logo Image (K4.png) */}
          <Link to="/" className="flex items-center text-decoration-none group shrink-0 mr-1 sm:mr-4">
            <img
              src={k4Logo}
              alt="Kharsan Properties"
              className="h-10 sm:h-12 lg:h-14 w-auto object-contain hover:scale-105 transition-transform"
            />
          </Link>

          {/* Direct Live Search Input in Navbar (SHOWN ON SEARCH PAGE) */}
          {isSearchPage ? (
            <div className="flex-1 max-w-xl">
              <form onSubmit={handleNavSearchSubmit} className="w-full flex items-center bg-slate-100/90 hover:bg-slate-100 border border-slate-200/90 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all flex shadow-inner">
                <Search size={16} className="text-slate-400 shrink-0 mr-2" />
                <input
                  type="text"
                  placeholder={language === 'gu' ? "ગુજરાતમાં પ્લોટ, સરનામું અથવા શહેર શોધો..." : "Search city, locality, plot number in Gujarat..."}
                  value={navSearch}
                  onChange={handleNavInputChange}
                  className="w-full bg-transparent text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none"
                />

                {/* Clear 'X' Icon Button when typing */}
                {navSearch ? (
                  <button
                    type="button"
                    onClick={() => {
                      setNavSearch('');
                      const params = new URLSearchParams(location.search);
                      params.delete('query');
                      navigate(`/search?${params.toString()}`, { replace: true });
                    }}
                    className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 hover:bg-slate-300 transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X size={13} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="w-6 h-6 rounded-full bg-[#2563eb] text-white flex items-center justify-center shrink-0 hover:bg-blue-700 transition-colors cursor-pointer"
                    title="Search"
                  >
                    <Search size={12} />
                  </button>
                )}
              </form>
            </div>
          ) : (
            /* Desktop Navigation Links (SHOWN ON ALL OTHER PAGES) */
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              <Link
                to="/search"
                className="text-xs font-black uppercase tracking-wider text-slate-800 hover:text-[#2563eb] hover:bg-slate-50 px-3.5 py-2.5 rounded-xl transition-all"
              >
                {t('navbar.buy')}
              </Link>

              <Link
                to="/brokers"
                className="text-xs font-black uppercase tracking-wider text-slate-800 hover:text-[#2563eb] hover:bg-slate-50 px-3.5 py-2.5 rounded-xl transition-all"
              >
                {t('navbar.brokers')}
              </Link>

              {/* Tools Hover Dropdown Menu */}
              <div
                className="relative"
                onMouseEnter={() => setShowToolsDropdown(true)}
                onMouseLeave={() => setShowToolsDropdown(false)}
              >
                <button
                  onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                  className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-800 hover:text-[#2563eb] hover:bg-slate-50 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <span>{t('navbar.tools')}</span>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${showToolsDropdown ? 'rotate-180 text-blue-600' : ''}`} />
                </button>

                {showToolsDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-fade-in space-y-1">
                    <Link
                      to="/boundary-map"
                      onClick={() => setShowToolsDropdown(false)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50/80 transition-colors text-slate-800 hover:text-blue-600 group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Layers size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-black">{t('navbar.boundary_map')}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{language === 'gu' ? 'જમીન સીમા દોરો અને ચકાસો' : 'Draw & verify land coordinates'}</div>
                      </div>
                    </Link>

                    <Link
                      to="/area-converter"
                      onClick={() => setShowToolsDropdown(false)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50/80 transition-colors text-slate-800 hover:text-amber-600 group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-amber-100/70 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Calculator size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-black">{t('navbar.area_converter')}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{language === 'gu' ? 'વીઘા, એકર અને ચોરસ ફૂટ બદલો' : 'Convert Bigha, Acre & Sq Ft'}</div>
                      </div>
                    </Link>

                    <Link
                      to="/calculator"
                      onClick={() => setShowToolsDropdown(false)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50/80 transition-colors text-slate-800 hover:text-emerald-600 group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <FileText size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-black">{t('navbar.calculator')}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{language === 'gu' ? 'જમીન કિંમત અને ચુકવણી કેલ્ક્યુલેટર' : 'Estimate costs & payments'}</div>
                      </div>
                    </Link>

                    <Link
                      to="/about"
                      onClick={() => setShowToolsDropdown(false)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 transition-colors text-slate-800 hover:text-slate-900 group border-t border-slate-100 mt-1"
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Building2 size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-black">{t('navbar.about')}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{language === 'gu' ? 'ખરસાણ પ્રોપર્ટીઝ વિશે જાણો' : 'Learn about Kharsan Properties'}</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Post Property FREE Button */}
            <Link
              to={isAuthenticated ? '/create-listing' : '/login'}
              className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs uppercase tracking-wider px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
            >
              <span>{t('navbar.post_property_free')}</span>
            </Link>

            {/* Language Switcher Button */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition-all border border-slate-200/90 cursor-pointer shadow-xs"
              title="Toggle Language (English / ગુજરાતી)"
            >
              <Globe size={15} className="text-blue-600" />
              <span className="font-black">{language === 'en' ? 'ગુજરાતી' : 'English'}</span>
            </button>

            {/* Direct Shortlist / Favorites Button */}
            {(() => {
              const favCount = Array.isArray(user?.favorites) ? user.favorites.filter(f => f !== null && f !== undefined).length : 0;
              return (
                <Link
                  to="/favorites"
                  className="relative p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-rose-50 border border-slate-200 rounded-xl text-slate-700 hover:text-rose-600 font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Shortlisted Properties"
                >
                  <Heart size={16} className={favCount > 0 ? "fill-rose-600 text-rose-600" : "text-slate-600"} />
                  <span className="hidden md:inline">{t('navbar.my_favourites')}</span>
                  {favCount > 0 && (
                    <span className="bg-rose-600 text-white text-[10px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                      {favCount}
                    </span>
                  )}
                </Link>
              );
            })()}

            {/* User Profile / Auth Action */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 bg-[#1a2340] text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-[#c9a84c] text-slate-900 font-black text-xs flex items-center justify-center uppercase overflow-hidden shrink-0">
                    {user?.profileImage ? (
                      <img src={getImageUrl(user.profileImage)} alt={user?.name} className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.[0] || 'U'
                    )}
                  </div>
                  <span className="text-xs font-bold max-w-[90px] truncate hidden md:inline-block">
                    {user?.name?.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
                </button>

                {showUserDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-fade-in">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <div className="text-xs font-extrabold text-slate-900 truncate">{user?.name}</div>
                      <div className="text-[10px] font-bold text-[#c9a84c] uppercase tracking-wider">{user?.role || 'User'}</div>
                    </div>
                    <Link
                      to="/my-listings"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <List size={16} className="text-blue-500" />
                      <span>{t('navbar.my_listings')}</span>
                    </Link>
                    <Link
                      to="/buyer-leads"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <Users size={16} className="text-emerald-500" />
                      <span>{t('navbar.buyer_leads')}</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <Settings size={16} className="text-amber-500" />
                      <span>{t('navbar.settings')}</span>
                    </Link>
                    <Link
                      to="/favorites"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors border-t border-slate-100 pt-2"
                    >
                      <Heart size={16} className="text-rose-500" />
                      <span>{t('navbar.my_favourites')}</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors mt-1 cursor-pointer"
                    >
                      <LogOut size={16} />
                      <span>{t('navbar.logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-extrabold text-slate-800 hover:text-[#2563eb] px-3 py-2 rounded-xl transition-colors"
                >
                  {t('navbar.login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-[#1a2340] hover:bg-slate-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                  {t('navbar.signup')}
                </Link>
              </div>
            )}


            {/* Right-Side Hamburger Drawer Trigger (☰) */}
            <button
              onClick={() => setShowRightDrawer(true)}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Open Menu Drawer"
              title="Open Options Menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Render Drawer Portal Outside Header */}
      <RightSlideDrawer
        isOpen={showRightDrawer}
        onClose={() => setShowRightDrawer(false)}
        user={user}
        isAuthenticated={isAuthenticated}
        handleLogout={handleLogout}
      />
    </>
  );
};

export default Navbar;
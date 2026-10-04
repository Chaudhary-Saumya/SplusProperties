import React, { useEffect, useState, useCallback, useContext, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import {
  MapPin, Search, Phone, Eye, Users, User, ChevronLeft, ChevronRight, ChevronDown,
  Heart, MessageCircle, Mail, Globe, Shield, ShieldCheck, Award, Target, Calculator, Layers,
  Building2, Navigation, Mic, SlidersHorizontal, CheckCircle2, ArrowUpRight, ArrowRight, Plus, FileText, Calendar,
  TrendingUp, Compass, Sparkles, CheckCircle, ExternalLink
} from 'lucide-react';

import SEO from '../components/SEO';
import ListingSkeleton from '../components/ListingSkeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ErrorBox from '../components/ErrorBox';
import { getImageUrl } from '../utils/imageUrl';
import { useLanguage } from '../context/LanguageContext';
import AppDownloadBanner from '../components/AppDownloadBanner';
import k4Logo from '../assets/K4.png';
import { formatDisplayArea } from '../utils/formatters';


/* ─── Kharsan Properties Brand Logo ───────────────────────────────────────── */
const KharsanLogo = () => (
  <Link to="/" className="flex items-center text-decoration-none group">
    <img
      src={k4Logo}
      alt="Kharsan Properties"
      className="h-12 sm:h-16 w-auto object-contain hover:scale-105 transition-transform"
    />
  </Link>
);

/* ─── Hero Carousel Component ─────────────────────────────────────────────── */
const HeroCarousel = () => {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const localSlides = [
    {
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80',
      tag: t('home.slide0_tag'),
      heading: t('home.slide0_heading'),
      sub: t('home.slide0_sub'),
      cta: t('home.slide0_cta'),
      ctaLink: '/search',
      badge: 'VERIFIED LANDS'
    },
    {
      image: 'https://images.unsplash.com/photo-1659572863867-70ae4445ad4e?q=80&w=1600&auto=format&fit=crop',
      tag: t('home.slide1_badge'),
      heading: t('home.slide1_title'),
      sub: t('home.slide1_desc'),
      cta: t('home.slide1_btn'),
      ctaLink: '/boundary-map',
      badge: '100% ACCURATE'
    },
    {
      image: 'https://images.unsplash.com/photo-1648347807172-548b97276ce7?q=80&w=1600&auto=format&fit=crop',
      tag: t('home.slide3_badge'),
      heading: t('home.slide3_title'),
      sub: t('home.slide3_desc'),
      cta: t('home.slide3_btn'),
      ctaLink: '/create-listing',
      badge: 'DIRECT CONNECT'
    }
  ];

  const go = useCallback((idx) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent((idx + localSlides.length) % localSlides.length);
      setAnimating(false);
    }, 400);
  }, [animating, localSlides.length]);

  useEffect(() => {
    const timer = setInterval(() => go(current + 1), 6000);
    return () => clearInterval(timer);
  }, [current, go]);

  const slide = localSlides[current];

  return (
    <div className="relative w-full h-[420px] sm:h-[480px] lg:h-[510px] overflow-hidden bg-slate-950 font-['Nunito_Sans',sans-serif]">
      {/* Background Image */}
      <img
        key={current}
        src={slide.image}
        alt={slide.heading}
        fetchPriority="high"
        className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ${animating ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-transparent" />

      {/* Content Overlay */}
      <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center z-10">
        <div className={`max-w-2xl text-white transition-all duration-500 ${animating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/30 border border-blue-400/40 text-blue-300 text-[10px] sm:text-xs font-black uppercase tracking-wider mb-3 sm:mb-4">
            <Award size={14} className="text-amber-400" />
            <span>{slide.tag}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight mb-3 sm:mb-4">
            {slide.heading}
          </h1>

          <p className="text-slate-300 text-xs sm:text-base font-semibold mb-5 sm:mb-6 max-w-lg leading-relaxed line-clamp-2 sm:line-clamp-none">
            {slide.sub}
          </p>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <Link
              to={slide.ctaLink}
              className="bg-[#2563eb] hover:bg-blue-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl shadow-lg transition-all hover:scale-105"
            >
              {slide.cta}
            </Link>
            <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20">
              <ShieldCheck size={18} className="text-emerald-400" />
              <span className="text-xs font-extrabold text-white">{slide.badge}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Arrow Controls */}
      <button
        onClick={() => go(current - 1)}
        className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/30 items-center justify-center text-white transition-all hover:scale-110 cursor-pointer"
        aria-label="Previous Slide"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={() => go(current + 1)}
        className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/30 items-center justify-center text-white transition-all hover:scale-110 cursor-pointer"
        aria-label="Next Slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-10 sm:bottom-12 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {localSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${i === current ? 'w-7 bg-[#2563eb]' : 'w-2 bg-white/40'}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

/* ─── Mobile Quick 4-Action Hub (Clean 2x2 Style) ────────────────────────── */
const MobileQuickActions = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const actions = [
    {
      id: 'boundary_map',
      title: language === 'gu' ? 'જમીન માપણી (Map)' : 'Land Measure (Map)',
      sub: language === 'gu' ? 'GPS લાઈવ જમીન માપો' : 'Draw & verify GPS map',
      icon: Layers,
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
      hoverBorder: 'hover:border-blue-300',
      arrowHover: 'group-hover:text-blue-600',
      link: '/boundary-map'
    },
    {
      id: 'area_converter',
      title: language === 'gu' ? 'એરિયા કન્વર્ટર' : 'Area Converter',
      sub: language === 'gu' ? 'વીઘા, એકર અને વાર' : 'Convert Bigha, Acre & Sq Ft',
      icon: Calculator,
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
      hoverBorder: 'hover:border-amber-300',
      arrowHover: 'group-hover:text-amber-600',
      link: '/area-converter'
    },
    {
      id: 'sell',
      title: language === 'gu' ? 'જમીન વેચો' : 'Sell Property',
      sub: language === 'gu' ? 'મફત જાહેરાત • 0% કમિશન' : 'Post Free • 0% Commission',
      icon: TrendingUp,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      hoverBorder: 'hover:border-emerald-300',
      arrowHover: 'group-hover:text-emerald-600',
      link: '/create-listing'
    },
    {
      id: 'purchase',
      title: language === 'gu' ? 'જમીન ખરીદો' : 'Buy / Purchase',
      sub: language === 'gu' ? 'ચકાસાયેલ પ્લોટ્સ જુઓ' : 'Explore Verified Lands',
      icon: Search,
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      hoverBorder: 'hover:border-indigo-300',
      arrowHover: 'group-hover:text-indigo-600',
      link: '/search'
    }
  ];

  return (
    <div className="md:hidden relative px-4 -mt-14 z-30 font-['Nunito_Sans',sans-serif]">
      <div className="bg-white rounded-3xl p-4 shadow-xl border border-slate-100">
        <div className="grid grid-cols-2 gap-2.5">
          {actions.map((act) => {
            const IconComp = act.icon;
            return (
              <motion.div
                key={act.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(act.link)}
                className={`bg-[#f8fafc] hover:bg-white border border-slate-200/70 ${act.hoverBorder} rounded-2xl p-3.5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group active:scale-95`}
              >
                {/* Top Row: Soft Icon Box + Arrow */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className={`w-10 h-10 rounded-xl ${act.iconBg} flex items-center justify-center`}>
                    <IconComp size={20} className="stroke-[2.2]" />
                  </div>
                  <ArrowRight size={16} className={`text-slate-400 ${act.arrowHover} group-hover:translate-x-1 transition-all duration-200`} />
                </div>

                {/* Content Details */}
                <div>
                  <h4 className="text-[13.5px] font-black text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                    {act.title}
                  </h4>
                  <p className="text-[10.5px] font-medium text-slate-500 mt-0.5 leading-tight line-clamp-1">
                    {act.sub}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ─── Floating Search Bar (Desktop Only) ─────────────────────────────────── */
const FloatingSearchBox = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('All Land & Plots');
  const [searchCategory, setSearchCategory] = useState('All Land & Plots');
  const [searchInput, setSearchInput] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);

  const landTabs = [
    { key: 'All Land & Plots', label: t('home.search_all') },
    { key: 'Plots', label: t('search_page.plots') },
    { key: 'Agricultural Land', label: t('search_page.agricultural') },
    { key: 'Commercial Land', label: t('search_page.commercial') }
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    let queryStr = '/search?';
    if (activeTab === 'Plots') queryStr += 'propertyType=Plot';
    else if (activeTab === 'Agricultural Land') queryStr += 'propertyType=Land&landType=Agricultural';
    else if (activeTab === 'Commercial Land') queryStr += 'propertyType=Land&landType=Commercial';

    if (searchInput.trim()) {
      queryStr += `&query=${encodeURIComponent(searchInput.trim())}`;
    }
    navigate(queryStr);
  };

  const handleGeoDetect = () => {
    if (navigator.geolocation) {
      setGeoLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoLoading(false);
          navigate(`/search?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&radius=50`);
        },
        () => {
          setGeoLoading(false);
          toast.info(language === 'gu' ? 'નજીકની જમીન શોધવા માટે લોકેશન પરવાનગી આપો.' : 'Location permission required for nearby plots.');
        }
      );
    }
  };

  return (
    <div className="hidden md:block relative max-w-5xl mx-auto px-4 -mt-16 sm:-mt-16 z-30 font-['Nunito_Sans',sans-serif]">
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200/80">

        {/* Land Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-slate-100 scrollbar-none">
          {landTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSearchCategory(tab.key);
              }}
              className={`px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-extrabold rounded-full transition-all whitespace-nowrap cursor-pointer shrink-0 ${activeTab === tab.key
                  ? 'bg-[#1a2340] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              {tab.label}
            </button>
          ))}
          <Link
            to="/create-listing"
            className="ml-auto px-3.5 py-1.5 text-xs font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full transition-colors whitespace-nowrap hidden sm:inline-block"
          >
            {t('navbar.post_property_free')}
          </Link>
        </div>

        {/* Main Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-3 sm:mt-4 flex flex-col md:flex-row items-center gap-2.5 sm:gap-3">

          {/* Land Subtype Dropdown */}
          <div className="w-full md:w-56 relative bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:py-3 flex items-center justify-between">
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="w-full bg-transparent text-xs font-extrabold text-slate-800 outline-none cursor-pointer appearance-none pr-4"
            >
              <option value="All Land & Plots">All Land & Plots</option>
              <option value="Plots">Residential Plots</option>
              <option value="Agricultural Land">Agricultural Land</option>
              <option value="Commercial Land">Commercial Land</option>
            </select>
            <ChevronDown size={14} className="text-slate-400 pointer-events-none absolute right-3" />
          </div>

          {/* Search Input */}
          <div className="flex-1 w-full relative bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center gap-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <Search size={18} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder={language === 'en' ? 'Search city, locality, village or plot number...' : 'ગામ, પ્લોટ અથવા શહેરનું નામ શોધો...'}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none"
            />

            {/* GPS Location Button */}
            <button
              type="button"
              onClick={handleGeoDetect}
              className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
              title="Detect my location"
            >
              <Navigation size={16} className={geoLoading ? 'animate-spin text-blue-600' : ''} />
            </button>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="w-full md:w-auto px-8 py-3 sm:py-3.5 bg-[#2563eb] hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            <Search size={16} />
            <span>Search</span>
          </button>
        </form>
      </div>
    </div>
  );
};

/* ─── Dynamic Land Categories Component (Matching Backend landType options) ──── */
const LandCategoriesSection = () => {
  const navigate = useNavigate();

  const { data: allListingsData } = useQuery({
    queryKey: ['allListings'],
    queryFn: async () => {
      try {
        const res = await axios.get('/api/listings');
        return res.data.data || [];
      } catch {
        return [];
      }
    }
  });

  const listings = allListingsData || [];

  const getCount = (type) => listings.filter(l => {
    if (type === 'Residential') {
      return l.landType === 'Residential' || l.plotType === 'Residential' || (l.propertyType === 'Plot' && l.landType !== 'Commercial' && l.landType !== 'Industrial' && l.landType !== 'Agricultural');
    }
    if (type === 'Commercial') {
      return l.landType === 'Commercial' || l.plotType === 'Commercial' || /commercial|shop|office|retail|highway/i.test(l.title || '');
    }
    if (type === 'Industrial') {
      return l.landType === 'Industrial' || l.plotType === 'Industrial' || /industrial|gidc|factory|warehouse/i.test(l.title || '');
    }
    if (type === 'Agricultural') {
      return l.landType === 'Agricultural' || l.plotType === 'Agricultural' || l.isAgricultural;
    }
    if (type === 'Other') {
      return l.landType === 'Other' || l.plotType === 'Other' || l.plotType === 'None' || l.landType === 'None' || (!['Residential', 'Commercial', 'Industrial', 'Agricultural'].includes(l.landType) && !['Residential', 'Commercial', 'Industrial', 'Agricultural'].includes(l.plotType));
    }
    return l.landType === type;
  }).length;

  const categories = [
    {
      type: 'Residential',
      title: 'Residential Land & Plots',
      count: getCount('Residential'),
      desc: 'NA residential plots, gated villa land & township parcels across Gujarat',
      icon: MapPin,
      link: '/search?landType=Residential'
    },
    {
      type: 'Commercial',
      title: 'Commercial Land',
      count: getCount('Commercial'),
      desc: 'Prime highway fronts, retail plot corridors & enterprise business land',
      icon: Building2,
      link: '/search?landType=Commercial'
    },
    {
      type: 'Industrial',
      title: 'Industrial Land',
      count: getCount('Industrial'),
      desc: 'GIDC industrial plots, heavy factory sites & logistics warehouse parcels',
      icon: Layers,
      link: '/search?landType=Industrial'
    },
    {
      type: 'Agricultural',
      title: 'Agricultural Farmland',
      count: getCount('Agricultural'),
      desc: 'Fertile agricultural land, canal water access & verified clean titles',
      icon: Sparkles,
      link: '/search?landType=Agricultural'
    },
    {
      type: 'Other',
      title: 'Other & Mixed Use Land',
      count: getCount('Other'),
      desc: 'Farmhouse plots, institutional land & special investment opportunities',
      icon: Compass,
      link: '/search?landType=Other'
    }
  ];

  return (
    <section className="py-12 sm:py-14 bg-slate-50/70 border-y border-slate-200/80 font-['Nunito_Sans',sans-serif]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block mb-1">
              Gujarat Land Portfolio
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Land & Plot Categories in Gujarat
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">
              Browse verified direct-from-owner and broker land parcels by property category
            </p>
          </div>
          <Link
            to="/search"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all self-start sm:self-auto group"
          >
            <span>View All ({listings.length} Listings)</span>
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
          {categories.map((cat, idx) => {
            const IconComp = cat.icon;
            return (
              <motion.div
                key={cat.type}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
                onClick={() => navigate(cat.link)}
                className="bg-white border border-slate-200/90 hover:border-slate-700 rounded-xl p-5 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors duration-200">
                      <IconComp size={20} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {cat.count > 0 ? `${cat.count} Active` : 'Available'}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-black transition-colors leading-snug">
                    {cat.title}
                  </h3>

                  <p className="text-xs font-normal text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                    {cat.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-black transition-colors">
                  <span>Explore {cat.type}</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ─── Dynamic Top Land Corridors (Connected to Backend) ───────────────── */
const TopCorridorsSection = () => {
  const navigate = useNavigate();

  const { data: allListingsData } = useQuery({
    queryKey: ['allListings'],
    queryFn: async () => {
      try {
        const res = await axios.get('/api/listings');
        return res.data.data || [];
      } catch {
        return [];
      }
    }
  });

  const listings = allListingsData || [];

  // Group listings by city / location keyword
  const locationMap = {};
  listings.forEach(l => {
    if (!l.location) return;
    const locName = l.location.split(',')[0].trim();
    if (!locationMap[locName]) locationMap[locName] = 0;
    locationMap[locName] += 1;
  });

  // Top locations from backend
  const topBackendLocations = Object.entries(locationMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Default regional hubs if DB has few locations
  const defaultHubs = [
    { name: 'Sanand, Ahmedabad', tag: 'Industrial Corridor' },
    { name: 'Dholera SIR Smart City', tag: 'Special Investment Region' },
    { name: 'SP Ring Road West', tag: 'Prime Residential' },
    { name: 'South Bopal & Shela', tag: 'Weekend Villas' }
  ];

  const displayCorridors = defaultHubs.map((hub, idx) => {
    const backendLoc = topBackendLocations[idx];
    const locName = backendLoc ? backendLoc[0] : hub.name;
    const count = backendLoc ? backendLoc[1] : (listings.length > 0 ? Math.ceil(listings.length / 4) : 0);

    return {
      name: locName,
      plots: count > 0 ? `${count} Active Listings` : 'Verified Parcels Available',
      tag: hub.tag,
      query: locName.split(',')[0]
    };
  });

  return (
    <section className="py-12 sm:py-14 bg-white font-['Nunito_Sans',sans-serif]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block mb-1">
              Market Demand & Growth
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Top Land Investment Corridors in Gujarat
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">
              Explore high-demand commercial, industrial and residential zones with rapid development
            </p>
          </div>
          <Link
            to="/search"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all self-start sm:self-auto group border border-slate-200"
          >
            <span>Explore Map & Search</span>
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {displayCorridors.map((c) => (
            <div
              key={c.name}
              onClick={() => navigate(`/search?query=${encodeURIComponent(c.query)}`)}
              className="bg-white border border-slate-200/90 hover:border-slate-700 rounded-xl p-5 cursor-pointer hover:shadow-md transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-2.5">
                  {c.tag}
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-black transition-colors">
                  {c.name}
                </h3>
                <p className="text-xs font-semibold text-slate-600 mt-1">{c.plots}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <TrendingUp size={13} className="text-emerald-600" />
                  <span>High Demand</span>
                </span>
                <span className="text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-all">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── Popular Brokers Section ─────────────────────────────────────────────── */
const PopularBrokersSection = () => {
  const navigate = useNavigate();

  const { data: brokersData, isLoading, isError } = useQuery({
    queryKey: ['brokers'],
    queryFn: async () => {
      const res = await axios.get('/api/users/brokers');
      return res.data.data;
    }
  });

  const allBrokers = brokersData || [];
  // Sort by active listings and select top 5 leading brokers
  const leadingBrokers = [...allBrokers]
    .sort((a, b) => (b.listingsCount || 0) - (a.listingsCount || 0))
    .slice(0, 5);

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-white via-slate-50/50 to-white border-t border-slate-200/60 font-['Nunito_Sans',sans-serif]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block mb-1">
              Regional Property Advisors
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Top Leading Brokers in Gujarat
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">
              Connect with regional land consultants and authorized property advisors
            </p>
          </div>

          <Link
            to="/brokers"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all self-start sm:self-auto group"
          >
            <span>View All ({allBrokers.length || 0} Brokers)</span>
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-56 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : isError || leadingBrokers.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
            <p className="text-sm font-medium text-slate-600">Land brokers are available in our Brokers Directory.</p>
            <Link to="/brokers" className="text-xs font-bold text-slate-900 hover:underline mt-2 inline-block">
              Explore Brokers Directory →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            {leadingBrokers.map((b, idx) => (
              <motion.div
                key={b._id || idx}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
                onClick={() => navigate(`/brokers?search=${encodeURIComponent(b.name || '')}`)}
                className="bg-white border border-slate-200/90 hover:border-slate-700 rounded-xl p-4 sm:p-5 flex flex-col items-center text-center group cursor-pointer hover:shadow-md transition-all duration-200 justify-between"
              >
                <div className="flex flex-col items-center w-full">
                  {/* Avatar */}
                  <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-xs mb-3 ring-2 ring-slate-100 overflow-hidden shrink-0">
                    {b.profileImage ? (
                      <img src={getImageUrl(b.profileImage)} alt={b.name} className="w-full h-full object-cover" />
                    ) : (
                      b.name?.charAt(0)?.toUpperCase() || 'B'
                    )}
                  </div>

                  {/* Broker Name & City */}
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-black transition-colors line-clamp-1 w-full">
                    {b.name}
                  </h3>
                  {b.city ? (
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5 line-clamp-1">
                      {b.city}
                    </p>
                  ) : null}

                  {/* Active Listings Pill */}
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                    <span>{b.listingsCount || 0} {b.listingsCount === 1 ? 'Listing' : 'Listings'}</span>
                  </div>
                </div>

                {/* Connect Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/brokers?search=${encodeURIComponent(b.name || '')}`);
                  }}
                  className="w-full mt-4 py-2 px-3 rounded-lg bg-slate-100 group-hover:bg-slate-900 text-slate-800 group-hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Phone size={12} />
                  <span>Contact Broker</span>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

/* ─── Main Home Component ─────────────────────────────────────────────────── */
const Home = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);

  const scrollPropLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };
  const scrollPropRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

  const { data: trendingData, isLoading: isTrendingLoading, isError: isTrendingError, error: trendingError, refetch: refetchTrending } = useQuery({
    queryKey: ['trending'],
    queryFn: async () => {
      const res = await axios.get('/api/recommendations/trending');
      return res.data.data;
    }
  });

  const { data: profileData } = useQuery({
    queryKey: ['profile', user?._id],
    enabled: !!user,
    queryFn: async () => {
      const res = await axios.get('/api/auth/me');
      return res.data.data;
    }
  });

  const { data: inquiriesData } = useQuery({
    queryKey: ['userInquiries', user?._id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const res = await axios.get('/api/inquiries/mine');
        return res.data.data;
      } catch {
        return [];
      }
    }
  });

  const trending = (trendingData || []).slice(0, 8);
  const myFavorites = profileData?.favorites || [];
  const wishlistIds = new Set(myFavorites.map(f => f._id));
  const userInquiries = inquiriesData || [];

  const toggleWishlist = async (e, listingId) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info('Please login to save favorites');
      navigate('/login');
      return;
    }

    const wasInWishlist = wishlistIds.has(listingId);
    toast.success(wasInWishlist ? 'Removed from favorites' : 'Added to favorites!');

    try {
      await axios.post(`/api/auth/favorites/${listingId}`);
      await queryClient.invalidateQueries(['profile', user._id]);
    } catch (err) {
      toast.error('Failed to update favorites');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-['Nunito_Sans',sans-serif]">
      <SEO
        title="Kharsan Properties - Verified Land Plots & Farmhouse Land"
        description="Find verified land parcels, agricultural plots, and commercial land directly from sellers and authorized brokers."
      />

      {/* Hero Banner Slider */}
      <HeroCarousel />

      {/* Mobile 4 Quick Actions (Area Converter, Boundary Map, Sell, Purchase) */}
      <MobileQuickActions />

      {/* Floating Land Search Box (Desktop Only) */}
      <FloatingSearchBox />

      {/* Main Content Area */}
      <section className="py-10 sm:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">

          {/* Left Column: Recommended Properties Horizontal Scroll Carousel */}
          <div className="lg:col-span-3 space-y-5 sm:space-y-6 min-w-0">

            <div className="flex items-end justify-between border-b border-slate-200 pb-3 sm:pb-4">
              <div>
                <span className="text-[10px] font-extrabold text-[#2563eb] uppercase tracking-widest">
                  Curated especially for you
                </span>
                <h2 className="text-xl sm:text-3xl font-black text-[#1a2340] tracking-tight">
                  Recommended Properties
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={scrollPropLeft}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-all cursor-pointer"
                  aria-label="Scroll Left"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={scrollPropRight}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-all cursor-pointer"
                  aria-label="Scroll Right"
                >
                  <ChevronRight size={18} />
                </button>
                <Link
                  to="/search"
                  className="text-xs font-extrabold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline ml-1 sm:ml-2 hidden sm:flex"
                >
                  <span>Explore All</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>

            {/* Horizontal Touch Scroll Container */}
            {isTrendingError ? (
              <ErrorBox message={trendingError?.message} retry={() => refetchTrending()} />
            ) : isTrendingLoading ? (
              <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3].map(i => <div key={i} className="w-[240px] sm:w-[260px] shrink-0 h-64 bg-slate-200/60 rounded-2xl animate-pulse" />)}
              </div>
            ) : trending.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                <p className="text-slate-500 font-bold text-sm">No properties available at the moment.</p>
              </div>
            ) : (
              <div
                ref={scrollRef}
                className="flex gap-3.5 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 pt-1 px-1 scrollbar-none"
              >
                {trending.map((listing, idx) => {
                  const isInWishlist = wishlistIds.has(listing._id);

                  return (
                    <motion.div
                      key={listing._id}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      onClick={() => navigate(`/listings/${listing._id}`)}
                      className="shrink-0 w-[230px] sm:w-[260px] md:w-[280px] snap-start bg-white border border-slate-200 hover:border-blue-400 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer group"
                    >
                      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                        {listing.images?.length > 0 ? (
                          <img
                            src={getImageUrl(listing.images[0])}
                            alt={listing.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-xs">
                            NO IMAGE
                          </div>
                        )}


                        {/* Wishlist Heart Button */}
                        <button
                          onClick={(e) => toggleWishlist(e, listing._id)}
                          className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-md text-slate-600 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Heart
                            size={15}
                            className={isInWishlist ? 'fill-red-500 text-red-500' : ''}
                          />
                        </button>

                        {/* Price Badge Overlay */}
                        <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl shadow-md border border-slate-200/60">
                          <span className="text-xs sm:text-sm font-black text-slate-900">
                            ₹{listing.price >= 10000000
                              ? `${(listing.price / 10000000).toFixed(1)} Cr`
                              : (listing.price >= 100000 ? `${(listing.price / 100000).toFixed(0)} L` : listing.price?.toLocaleString('en-IN'))}
                          </span>
                        </div>
                      </div>

                      {/* Card Content Below Image */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <h3 className="text-xs font-black text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {listing.title}
                          </h3>
                          <p className="text-[11px] font-semibold text-slate-500 line-clamp-1 mt-0.5">
                            In {listing.location || 'Gujarat'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-2 border-t border-slate-100">
                          <span>Posted by {listing.user?.role || 'Owner'}</span>
                          <span className="text-slate-700 font-extrabold">{formatDisplayArea(listing.area, language)}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: User Activity Card OR Smart Tools Card */}
          <div className="lg:col-span-1">
            {isAuthenticated ? (
              /* Real Logged In User Activity Widget */
              <div className="sticky top-28 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#1a2340] text-[#c9a84c] flex items-center justify-center font-black text-base sm:text-lg shadow-sm overflow-hidden shrink-0">
                    {user?.profileImage ? (
                      <img src={getImageUrl(user.profileImage)} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.[0] || 'U'
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">{user?.name}</h3>
                    <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400">Your Recent Activity</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-2.5 sm:p-3 text-center">
                    <div className="text-lg sm:text-xl font-black text-blue-700 flex items-center justify-center gap-1">
                      <span>{myFavorites.length || 0}</span>
                      <ArrowUpRight size={14} className="text-blue-500" />
                    </div>
                    <div className="text-[9px] sm:text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-0.5">Shortlisted</div>
                  </div>

                  <div className="bg-amber-50/80 border border-amber-100 rounded-xl p-2.5 sm:p-3 text-center">
                    <div className="text-lg sm:text-xl font-black text-amber-700 flex items-center justify-center gap-1">
                      <span>{userInquiries.length || 0}</span>
                      <ArrowUpRight size={14} className="text-amber-500" />
                    </div>
                    <div className="text-[9px] sm:text-[10px] font-bold text-amber-600 uppercase tracking-wider mt-0.5">Inquiries</div>
                  </div>
                </div>

                <Link
                  to="/dashboard"
                  className="w-full block text-center bg-[#1a2340] hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 sm:py-3 rounded-xl shadow-md transition-all"
                >
                  Manage My Account
                </Link>

                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Smart Tools</div>
                  <Link
                    to="/boundary-map"
                    className="flex items-center justify-between text-xs font-bold text-slate-700 hover:text-blue-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Layers size={14} className="text-blue-600" />
                      Boundary Mapping
                    </span>
                    <span>→</span>
                  </Link>
                  <Link
                    to="/area-converter"
                    className="flex items-center justify-between text-xs font-bold text-slate-700 hover:text-amber-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Calculator size={14} className="text-amber-600" />
                      Area Converter
                    </span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* Visitor Smart Tools Card */
              <div className="sticky top-28 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                    <Layers size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">Land Utilities</h3>
                    <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400">Interactive Mapping & Calculators</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Link
                    to="/boundary-map"
                    className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Layers size={15} className="text-blue-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600">Boundary Map</div>
                        <div className="text-[10px] text-slate-400 font-medium">Draw & verify coordinates</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-400 group-hover:text-blue-600">→</span>
                  </Link>

                  <Link
                    to="/area-converter"
                    className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200/80 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Calculator size={15} className="text-amber-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-amber-600">Area Converter</div>
                        <div className="text-[10px] text-slate-400 font-medium">Convert Bigha, Acre & Sq Ft</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-400 group-hover:text-amber-600">→</span>
                  </Link>
                </div>

                <Link
                  to="/create-listing"
                  className="w-full block text-center bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 sm:py-3 rounded-xl shadow-md transition-all"
                >
                  Post Your Property FREE
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Dynamic Land Categories Section (Matching Backend landType schema) */}
      <LandCategoriesSection />

      {/* Dynamic Top Land Corridors Section (Connected to Backend) */}
      <TopCorridorsSection />

      {/* Real Popular Brokers Section */}
      <PopularBrokersSection />

      {/* Sell Your Land Free Banner */}
      <section className="py-12 px-4 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-[#1a2340] to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <span className="bg-[#c9a84c] text-slate-900 text-[10px] font-black uppercase px-3 py-1 rounded-full">
              Zero Platform Commission
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
              Want to Sell or Lease Your Land Faster?
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm font-semibold">
              List your agricultural parcel, residential plot, or commercial site FREE. Direct buyer inquiries sent to your phone!
            </p>
          </div>
          <Link
            to="/create-listing"
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider px-8 py-4 rounded-2xl shadow-lg transition-all hover:scale-105 shrink-0"
          >
            Post Property FREE
          </Link>
        </div>
      </section>

      {/* Soft Sky-Blue Modern Stats Strip */}
      {/* <section className="bg-gradient-to-r from-sky-50/80 via-blue-50/60 to-indigo-50/80 border-y border-sky-100/70 py-10 sm:py-12 px-4 font-['Nunito_Sans',sans-serif]">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-2.5 sm:mb-3">
              <ShieldCheck size={22} className="sm:w-6 sm:h-6" />
            </div>
            <div className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">100%</div>
            <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Verified Land Listings</div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2.5 sm:mb-3">
              <Navigation size={22} className="sm:w-6 sm:h-6" />
            </div>
            <div className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">5,000+</div>
            <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">GPS Mapped Parcels</div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2.5 sm:mb-3">
              <Users size={22} className="sm:w-6 sm:h-6" />
            </div>
            <div className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">Direct</div>
            <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Owner & Broker Connect</div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2.5 sm:mb-3">
              <Award size={22} className="sm:w-6 sm:h-6" />
            </div>
            <div className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">₹0</div>
            <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Zero Platform Fees</div>
          </div>
        </div>
      </section> */}

      {/* Download App Banner Section */}
      <AppDownloadBanner />

      {/* Production-Ready Responsive Footer */}
      <footer className="bg-white text-slate-800 pt-10 sm:pt-14 pb-28 sm:pb-8 px-4 sm:px-6 border-t-4 border-[#c9a84c] font-['Nunito_Sans',sans-serif]">

        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6 mb-10">

          {/* Col 1: Brand Info */}
          <div className="space-y-3">
            <KharsanLogo />
            <p className="text-slate-500 text-xs font-semibold leading-relaxed max-w-xs">
              India's premier smart land & plot marketplace. Verified agricultural parcels, NA plots, and commercial land zones.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[#1a2340] border-b border-slate-100 pb-2 mb-3">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs font-bold text-slate-600">
              <li>
                <Link to="/search" className="hover:text-[#2563eb] transition-colors inline-block py-0.5">
                  Buy Land & Plots
                </Link>
              </li>
              <li>
                <Link to="/create-listing" className="hover:text-[#2563eb] transition-colors inline-block py-0.5">
                  Post Property FREE
                </Link>
              </li>
              <li>
                <Link to="/brokers" className="hover:text-[#2563eb] transition-colors inline-block py-0.5">
                  Brokers Directory
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#2563eb] transition-colors inline-block py-0.5">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Smart Tools */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[#1a2340] border-b border-slate-100 pb-2 mb-3">
              Smart Tools
            </h4>
            <ul className="space-y-2 text-xs font-bold text-slate-600">
              <li>
                <Link to="/boundary-map" className="hover:text-[#2563eb] transition-colors inline-block py-0.5">
                  Boundary Map Tool
                </Link>
              </li>
              <li>
                <Link to="/area-converter" className="hover:text-[#2563eb] transition-colors inline-block py-0.5">
                  Land Area Converter
                </Link>
              </li>
              <li>
                <Link to="/calculator" className="hover:text-[#2563eb] transition-colors inline-block py-0.5">
                  EMI & Land Calculator
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Support */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[#1a2340] border-b border-slate-100 pb-2 mb-3">
              Contact Support
            </h4>
            <div className="space-y-2 text-xs font-bold text-slate-600">
              <a href="mailto:support@kharsan.com" className="flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors py-0.5">
                <Mail size={14} className="text-blue-600 shrink-0" />
                <span>support@kharsan.com</span>
              </a>
              <a href="tel:+919409553232" className="flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors py-0.5">
                <Phone size={14} className="text-blue-600 shrink-0" />
                <span>+91 94095 53232</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto border-t border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 font-bold gap-3 text-center sm:text-left">
          <div>© {new Date().getFullYear()} Kharsan Properties. All Rights Reserved.</div>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-slate-700 transition-colors">Privacy Policy</Link>
            <Link to="/about" className="hover:text-slate-700 transition-colors">About Us</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
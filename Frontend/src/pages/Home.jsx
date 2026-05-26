import React, { useEffect, useState, useCallback, useContext } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { MapPin, Search, Phone, Eye, Users, ChevronLeft, ChevronRight, ChevronDown, Heart, MessageCircle, Mail, Globe, Shield, Award, Target, Calculator } from 'lucide-react';

import SEO from '../components/SEO';
import ListingSkeleton from '../components/ListingSkeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ErrorBox from '../components/ErrorBox';
import { getImageUrl } from '../utils/imageUrl';


const slides = [
  {
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80',
    tag: 'Premium Agricultural Land',
    heading: 'Find Your Perfect\nPlot of Land',
    sub: 'Verified plots, farmland & commercial sites across India — invest with confidence.',
    cta: 'Search Properties',
    ctaLink: '/search',
  },
  {
    image: 'https://images.unsplash.com/photo-1659572863867-70ae4445ad4e?q=80&w=3056&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=1600&q=80',
    tag: 'Digital Mapping Tech',
    heading: 'Interactive Smart\nLand Visualization',
    sub: 'Visualize property boundaries and verify land parcels with our advanced mapping tools.',
    cta: 'See Land Map',
    ctaLink: '/boundary-map',
  },
  {
    image: 'https://images.unsplash.com/photo-1648347807172-548b97276ce7?q=80&w=1906&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=1600&q=80',
    tag: 'Convert Area',
    heading: 'Convert Area of Your Land',
    sub: 'Convert your land area to different units and calculate the area of your land in different units.',
    cta: 'Convert Area',
    ctaLink: '/area-converter',
  },
  {
    image: 'https://images.unsplash.com/photo-1648347807172-548b97276ce7?q=80&w=1906&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=1600&q=80',
    tag: 'Commercial & Industrial',
    heading: 'Secure Your\nInvestment Today',
    sub: 'Residential plots, NA land & commercial zones — directly from verified sellers.',
    cta: 'Post Your Inquiry',
    ctaLink: '/register',
  }
];

/* ─── Hero Carousel ───────────────────────────────────────────────────────── */
const HeroCarousel = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const go = useCallback((idx) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent((idx + slides.length) % slides.length);
      setAnimating(false);
    }, 400);
  }, [animating]);

  useEffect(() => {
    const t = setInterval(() => go(current + 1), 5500);
    return () => clearInterval(t);
  }, [current, go]);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) go(current + 1);
    if (isRightSwipe) go(current - 1);
  };

  const baseSlide = slides[current];
  const slide = { ...baseSlide };
  
  if (current === 0 && isAuthenticated && user) {
    slide.tag = `Welcome, ${user.name}`;
    slide.heading = `Hello ${user.name.split(' ')[0]},\nFind Your Perfect Plot`;
  }

  return (
    <div 
      style={{ position: 'relative', width: '100%', height: '92vh', minHeight: 520, overflow: 'hidden', background: '#0a0f1e' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        .carousel-arrow { 
          display: flex !important; 
        }
        .area-converter-btn {
          position: absolute;
          top: 32px;
          right: 32px;
          z-index: 10;
          background: #c9a84c;
          color: #1a1200;
          font-family: 'Nunito Sans', sans-serif;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 1px;
          text-transform: uppercase;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(201,168,76,0.4);
          display: flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .area-converter-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(201,168,76,0.5);
        }
        @media (max-width: 768px) {
          .carousel-arrow { 
            display: none !important; 
          }
          .area-converter-btn {
            top: 20px;
            right: 20px;
            padding: 10px 16px;
            font-size: 12px;
          }
        }
        @media (max-width: 480px) {
          .area-converter-btn {
            top: 16px;
            right: 16px;
            padding: 8px 12px;
            font-size: 11px;
          }
          .btn-text {
             display: none;
          }
        }
      `}</style>
      {/* BG Image */}
      <img
        key={current}
        src={slide.image}
        alt=""
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center',
          transition: 'opacity 0.7s ease',
          opacity: animating ? 0 : 1,
        }}
      />
      {/* Gradient Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(10,15,30,0.35) 0%, rgba(10,15,30,0.62) 50%, rgba(10,15,30,0.85) 100%)',
      }} />

      {/* Gold top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg,#c9a84c,#f0d080,#c9a84c)', zIndex: 5 }} />

      {/* Content */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '0 24px',
        textAlign: 'center', zIndex: 4,
        opacity: animating ? 0 : 1, transform: animating ? 'translateY(16px)' : 'translateY(0)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>
        {/* Tag */}
        <span style={{
          display: 'inline-block', background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.6)',
          color: '#f0d080', fontSize: 12, fontWeight: 700, letterSpacing: '2px',
          textTransform: 'uppercase', padding: '6px 18px', borderRadius: 100, marginBottom: 20,
          fontFamily: "'Nunito Sans', sans-serif",
        }}>
          {slide.tag}
        </span>

        {/* Heading */}
        <h1 style={{
          fontSize: 'clamp(2.2rem, 6vw, 5rem)',
          fontWeight: 700, color: '#fff', lineHeight: 1.15,
          marginBottom: 20, maxWidth: 820,
          whiteSpace: 'pre-line',
          textShadow: '0 4px 24px rgba(0,0,0,0.4)',
          fontFamily: "'Nunito Sans', sans-serif",
        }}>
          {slide.heading}
        </h1>

        {/* Sub */}
        <p style={{
          fontFamily: "'Nunito Sans', sans-serif",
          fontSize: 'clamp(1rem, 2vw, 1.3rem)',
          color: 'rgba(255,255,255,0.82)', maxWidth: 600,
          fontWeight: 500, marginBottom: 36, lineHeight: 1.7,
        }}>
          {slide.sub}
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to={slide.ctaLink} style={{
            background: '#c9a84c', color: '#1a1200',
            fontFamily: "'Nunito Sans', sans-serif",
            fontWeight: 800, fontSize: 14, letterSpacing: '1.5px',
            textTransform: 'uppercase', textDecoration: 'none',
            padding: '14px 32px', borderRadius: 8,
            boxShadow: '0 8px 24px rgba(201,168,76,0.4)',
            transition: 'all 0.2s',
          }}>
            {slide.cta}
          </Link>
        </div>
      </div>

      {/* Prev / Next Arrows */}
      {[
        { dir: -1, icon: <ChevronLeft size={26} />, side: { left: 20 } },
        { dir: 1, icon: <ChevronRight size={26} />, side: { right: 20 } },
      ].map(({ dir, icon, side }) => (
        <button key={dir} onClick={() => go(current + dir)} className="carousel-arrow" style={{
          position: 'absolute', top: '50%', transform: 'translateY(-50%)',
          ...side, zIndex: 6,
          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.3)',
          color: '#fff', width: 48, height: 48, borderRadius: '50%',
          alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', backdropFilter: 'blur(8px)',
          transition: 'background 0.2s',
        }}>
          {icon}
        </button>
      ))}

      {/* Dot Indicators */}
      <div style={{
        position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 8, zIndex: 6,
      }}>
        {slides.map((_, i) => (
          <button key={i} onClick={() => go(i)} style={{
            width: i === current ? 28 : 8, height: 8, borderRadius: 4,
            background: i === current ? '#c9a84c' : 'rgba(255,255,255,0.4)',
            border: 'none', cursor: 'pointer', padding: 0,
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      {/* Area Converter Button */}
      <Link to="/area-converter" className="area-converter-btn">
        <Calculator size={18} />
       
      </Link>

    </div>
  );
};



/* ─── Footer ─────────────────────────────────────────────────────────────── */
const Footer = () => {
  const navigate = useNavigate();
  return (
    <footer className="bg-[#1a2340] text-white pt-16 pb-10 px-6 border-t-[5px] border-[#c9a84c] font-['Nunito_Sans',sans-serif]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 mb-16">
          
          {/* Left Side: Logo */}
          <div className="lg:w-1/3 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div 
              onClick={() => { window.scrollTo(0,0); navigate('/'); }}
              className="cursor-pointer mb-6 transform scale-90 md:scale-100 lg:origin-left"
            >
              <svg viewBox="0 0 500 500" className="h-[70px] md:h-[90px] w-auto mx-auto lg:mx-0" xmlns="http://www.w3.org/2000/svg">
                <rect x="165" y="105" width="85" height="215" fill="#d1d9e6" />
                <g stroke="#fff" strokeWidth="10" fill="none" strokeLinecap="square" strokeLinejoin="miter">
                  <path d="M25 320 H90 V225 L190 150" />
                  <path d="M190 320 V75 H295 V320" />
                  <path d="M295 185 L395 245 V320 H495" />
                  <path d="M190 320 H295" strokeWidth="12" />
                </g>
                <text x="250" y="415" textAnchor="middle" fill="#c9a84c" style={{ fontSize: '82px', fontWeight: '900' }}>KHARSAN</text>
                <text x="250" y="470" textAnchor="middle" fill="#fff" style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '24px' }}>PROPERTIES</text>
              </svg>
            </div>
            <p className="text-white/50 text-sm leading-relaxed mb-8 max-w-xs md:max-w-sm mx-auto lg:mx-0">
              Leading the digital transformation of real estate. We specialize in verified agricultural, residential, and commercial land management with intelligent mapping technology.
            </p>
            <div className="flex gap-4 justify-center lg:justify-start">
              <a href="https://properties.kharsan.com" target="_blank" rel="noopener noreferrer" title="Website" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white transition-all hover:bg-[#c9a84c] border border-white/10 hover:border-[#c9a84c]">
                <Globe size={18} />
              </a>
              <a href="mailto:support@kharsan.com" title="Email" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white transition-all hover:bg-[#c9a84c] border border-white/10 hover:border-[#c9a84c]">
                <Mail size={18} />
              </a>
              <a href="https://wa.me/9409553232" target="_blank" rel="noopener noreferrer" title="Contact" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white transition-all hover:bg-[#c9a84c] border border-white/10 hover:border-[#c9a84c]">
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {/* Right Side: Links */}
          <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-6 text-center md:text-left mt-4 lg:mt-0">
            {/* Quick Links */}
            <div>
              <h4 className="text-[#c9a84c] text-sm font-extrabold uppercase tracking-[1.5px] mb-5">Explore</h4>
              <div className="flex flex-col gap-3">
                <Link to="/" className="text-white/70 hover:text-[#c9a84c] transition-colors text-sm font-semibold">Home</Link>
                <Link to="/about" className="text-white/70 hover:text-[#c9a84c] transition-colors text-sm font-semibold">About Us</Link>
                <Link to="/search" className="text-white/70 hover:text-[#c9a84c] transition-colors text-sm font-semibold">Trending Plots</Link>
                <Link to="/search" className="text-white/70 hover:text-[#c9a84c] transition-colors text-sm font-semibold">Verified Sellers</Link>
                <Link to="/" className="text-white/70 hover:text-[#c9a84c] transition-colors text-sm font-semibold">Market Blogs</Link>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-[#c9a84c] text-sm font-extrabold uppercase tracking-[1.5px] mb-5">Services</h4>
              <div className="flex flex-col gap-3">
                <Link to="/search?type=buy" className="text-white/70 hover:text-[#c9a84c] transition-colors text-sm font-semibold">Buy Property</Link>
                <Link to="/create-listing" className="text-white/70 hover:text-[#c9a84c] transition-colors text-sm font-semibold">Sell Property</Link>
                <Link to="/boundary-map" className="text-white/70 hover:text-[#c9a84c] transition-colors text-sm font-semibold">Land Mapping</Link>
                <Link to="/brokers" className="text-white/70 hover:text-[#c9a84c] transition-colors text-sm font-semibold">Broker Connect</Link>
                <Link to="/search" className="text-white/70 hover:text-[#c9a84c] transition-colors text-sm font-semibold">Legal Verification</Link>
              </div>
            </div>

            {/* Tools */}
            <div>
              <h4 className="text-[#c9a84c] text-sm font-extrabold uppercase tracking-[1.5px] mb-5">Smart Tools</h4>
              <div className="flex flex-col gap-3">
                <Link to="/boundary-map" className="text-white/70 hover:text-[#c9a84c] transition-colors text-sm font-semibold">Boundary Map</Link>
                <Link to="/area-converter" className="text-white/70 hover:text-[#c9a84c] transition-colors text-sm font-semibold">Area Converter</Link>
                <Link to="/saved-maps" className="text-white/70 hover:text-[#c9a84c] transition-colors text-sm font-semibold">Saved Boundaries</Link>
                <Link to="/boundary-map" className="text-white/70 hover:text-[#c9a84c] transition-colors text-sm font-semibold">KML Exporter</Link>
                <Link to="/boundary-map" className="text-white/70 hover:text-[#c9a84c] transition-colors text-sm font-semibold">PDF Reports</Link>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-[#c9a84c] text-sm font-extrabold uppercase tracking-[1.5px] mb-5">Contact</h4>
              <div className="flex flex-col gap-4 items-center md:items-start">
                <a href="mailto:support@kharsan.com" className="flex gap-3 items-center group">
                  <Mail size={16} className="text-[#c9a84c] group-hover:scale-110 transition-transform" />
                  <span className="text-white/70 group-hover:text-[#c9a84c] transition-colors text-sm font-semibold">support@kharsan.com</span>
                </a>
                <a href="https://properties.kharsan.com" target="_blank" rel="noopener noreferrer" className="flex gap-3 items-center group">
                  <Globe size={16} className="text-[#c9a84c] group-hover:scale-110 transition-transform" />
                  <span className="text-white/70 group-hover:text-[#c9a84c] transition-colors text-sm font-semibold">properties.kharsan.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <p className="text-white/40 text-sm font-semibold">
            © {new Date().getFullYear()} Kharsan Properties. A Unit of Kharsan Technologies. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(item => (
              <a key={item} href="#" className="text-white/40 hover:text-[#c9a84c] transition-colors text-xs font-bold">{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};


const Home = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Fetch trending properties
  const { data: trendingData, isLoading: isTrendingLoading, isError: isTrendingError, error: trendingError, refetch: refetchTrending } = useQuery({
    queryKey: ['trending'],
    queryFn: async () => {
      const res = await axios.get('/api/recommendations/trending');
      return res.data.data;
    }
  });

  // Fetch my listings for Seller/Broker
  const { data: myListingsData, isLoading: isMyListingsLoading } = useQuery({
    queryKey: ['myListings', user?._id],
    enabled: !!user && (user.role === 'Seller' || user.role === 'Broker'),
    queryFn: async () => {
      const res = await axios.get(`/api/listings?createdBy=${user._id || user.id}`);
      return res.data.data;
    }
  });

  // Fetch profile data for Buyer (includes favorites)
  const { data: profileData, isLoading: isProfileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['profile', user?._id],
    enabled: !!user && user.role === 'Buyer',
    queryFn: async () => {
      const res = await axios.get('/api/auth/me');
      return res.data.data;
    },
    staleTime: 0, // Always fetch fresh data for profile/favorites
    refetchOnWindowFocus: true,
  });

  const trending = (trendingData || []).slice(0, 8);
  const myListings = myListingsData || [];
  const myFavorites = profileData?.favorites || [];

  // Force refetch on mount or auth change
  useEffect(() => {
    if (isAuthenticated && user?.role === 'Buyer') {
      refetchProfile();
    }
  }, [isAuthenticated, user?.role, refetchProfile]);

  // Create a Set of favorite IDs for quick lookup
  const wishlistIds = new Set(myFavorites.map(f => f._id));

  // Toggle wishlist with optimistic updates and proper cache management
  const toggleWishlist = async (e, listingId) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.info('Please login to save favorites');
      navigate('/login');
      return;
    }

    if (!user || user.role !== 'Buyer') {
      toast.warning('Only buyers can save favorites');
      return;
    }

    const wasInWishlist = wishlistIds.has(listingId);
    
    // Find the full listing object for optimistic update
    let listingToToggle = null;
    
    // Search in trending data
    if (trendingData) {
      listingToToggle = trendingData.find(item => item._id === listingId);
    }
    
    // If not found in trending, search in current favorites
    if (!listingToToggle && myFavorites) {
      listingToToggle = myFavorites.find(item => item._id === listingId);
    }

    if (!listingToToggle) {
      console.error('Listing not found for toggle');
      toast.error('Unable to update favorites');
      return;
    }

    // Optimistically update the cache BEFORE making the API call
    queryClient.setQueryData(['profile', user._id], (oldData) => {
      if (!oldData) return oldData;

      let newFavorites;
      if (wasInWishlist) {
        // Remove from favorites
        newFavorites = oldData.favorites.filter(fav => fav._id !== listingId);
      } else {
        // Add to favorites
        newFavorites = [...oldData.favorites, listingToToggle];
      }

      return {
        ...oldData,
        favorites: newFavorites
      };
    });

    // Show immediate feedback
    toast.success(wasInWishlist ? 'Removed from favorites' : 'Added to favorites!', {
      autoClose: 2000,
    });

    try {
      // Make the API call
      await axios.post(`/api/auth/favorites/${listingId}`);
      
      // Refetch to ensure data consistency with backend
      await queryClient.invalidateQueries(['profile', user._id]);
      
    } catch (err) {
      console.error('Error toggling favorite:', err);
      
      // Revert the optimistic update on error
      queryClient.setQueryData(['profile', user._id], (oldData) => {
        if (!oldData) return oldData;

        let revertedFavorites;
        if (wasInWishlist) {
          // Add it back
          revertedFavorites = [...oldData.favorites, listingToToggle];
        } else {
          // Remove it
          revertedFavorites = oldData.favorites.filter(fav => fav._id !== listingId);
        }

        return {
          ...oldData,
          favorites: revertedFavorites
        };
      });

      toast.error('Failed to update favorites. Please try again.', {
        autoClose: 3000,
      });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/search?query=${search}`);
  };

  const getSectionData = () => {
    if (!isAuthenticated) return { 
      title: 'Trending Properties', 
      sub: 'The most demanded plots with highest interaction volumes.', 
      data: trending,
      isLoading: isTrendingLoading,
      isError: isTrendingError,
      error: trendingError,
      refetch: refetchTrending
    };

    if (user.role === 'Buyer') return {
      title: 'My Favourite Properties',
      sub: 'Quick access to the lands you saved for later.',
      data: myFavorites,
      isLoading: isProfileLoading,
      isError: false,
      refetch: refetchProfile,
      emptyTitle: 'No Favourites Yet',
      emptySub: 'Start exploring and heart the properties you love to see them here.',
      cta: 'Explore Listings',
      ctaLink: '/search'
    };

    return {
      title: 'My Listed Properties',
      sub: 'Track and manage the properties you have listed.',
      data: myListings,
      isLoading: isMyListingsLoading,
      isError: false,
      refetch: () => {}, // Handled by myListings query
      emptyTitle: 'No Listings Yet',
      emptySub: 'Start your journey as a seller by listing your first property today.',
      cta: 'List My First Property',
      ctaLink: '/create-listing'
    };
  };

  const { title, sub, data, isLoading, isError, error, refetch, emptyTitle, emptySub, cta, ctaLink } = getSectionData();

  return (
    <div style={{ fontFamily: "'Nunito Sans', sans-serif" }}>
      <SEO 
        title="Verified Land Plots & Farmhouse Land in India"
        description="Find verified land parcels, agricultural plots, and commercial land directly from sellers. Intelligent mapping and secure booking for your next land investment."
      />


      {/* ── Hero Carousel ── */}
      <HeroCarousel />

      {/* ── Floating Search Bar ── */}
      {/* <div style={{ background: '#f8f5ee', padding: '0 24px' }}>
        <form onSubmit={handleSearch} className="home-search-bar" style={{
          maxWidth: 780, margin: '0 auto', display: 'flex',
          background: '#fff', borderRadius: 12, padding: 8,
          border: '2px solid #1a2340',
          boxShadow: '0 12px 40px rgba(26,35,64,0.12)',
          transform: 'translateY(-32px)',
          gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, paddingLeft: 12 }}>
            <Search size={20} color="#c9a84c" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by Region, City, or Property Name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, border: 'none', outline: 'none', padding: '12px 14px',
                fontSize: 15, fontWeight: 600, color: '#1a2340',
                fontFamily: "'Nunito Sans', sans-serif",
                background: 'transparent',
              }}
            />
          </div>
          <button type="submit" style={{
            background: '#1a2340', color: '#fff', border: 'none', cursor: 'pointer',
            padding: '10px 12px', borderRadius: 8,
            fontSize: 14, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase',
            fontFamily: "'Nunito Sans', sans-serif",
            flexShrink: 0,
          }}>
            Search
          </button>
        </form>
      </div> */}

      {/* ── Stats Strip ── */}
      <div style={{ background: '#1a2340', padding: '28px 24px' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'flex', justifyContent: 'space-around',
          flexWrap: 'wrap', gap: 24,
        }}>
          {[
            { num: '100%', label: 'Verified Listings' },
            { num: 'Smart', label: 'Digitized Mapping' },
            { num: 'Direct', label: 'Seller Connection' },
            { num: 'Zero', label: 'Hidden Charges' },
          ].map(({ num, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, color: '#c9a84c', fontWeight: 700 }}>{num}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 600, letterSpacing: '0.5px', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 40px;
          border-bottom: 2px solid #e2d9c5;
          padding-bottom: 20px;
        }
        @media (max-width: 768px) {
          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }
        .carousel-container {
          display: flex;
          gap: 24px;
          overflow-x: auto;
          padding: 10px 4px 40px;
          scroll-snap-type: x mandatory;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none;  /* IE and Edge */
        }
        .carousel-container::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }
        .square-card {
          flex: 0 0 300px;
          scroll-snap-align: start;
          background: #fff;
          border-radius: 20px;
          border: 1px solid #e2d9c5;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
          position: relative;
        }
        .square-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(26,35,64,0.12);
          border-color: #c9a84c;
        }
        .square-card-img-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 1/1;
          overflow: hidden;
          background: #f3f4f6;
        }
        .square-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }
        .square-card:hover .square-card-img {
          transform: scale(1.1);
        }
        .square-card-content {
          padding: 20px;
        }
        .square-card-price {
          font-size: 20px;
          font-weight: 900;
          color: #1a2340;
          margin-bottom: 4px;
        }
        .square-card-title {
          font-size: 15px;
          font-weight: 700;
          color: #1a2340;
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .square-card-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 11px;
          color: #6b7280;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .square-card-badge {
          position: absolute;
          top: 15px;
          left: 15px;
          background: #1a2340;
          color: #c9a84c;
          padding: 4px 12px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 800;
          z-index: 10;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .empty-state-card {
          background: #fff;
          border: 2px dashed #e2d9c5;
          border-radius: 20px;
          padding: 60px 40px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .heart-btn {
          transition: all 0.2s ease;
        }
        .heart-btn:active {
          transform: scale(0.9);
        }
      `}</style>

    <div style={{ background: '#f8f5ee', padding: '64px 24px 80px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Section Header */}
        <div className="section-header">
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: '#c9a84c', marginBottom: 6 }}>
              {isAuthenticated ? 'Personalized for You' : 'Most Viewed'}
            </div>
            <h2 style={{ fontFamily: "'Nunito Sans', serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#1a2340', fontWeight: 700, margin: 0 }}>
              {title} 
            </h2>
            <p style={{ color: '#6b7280', fontWeight: 600, marginTop: 8, fontSize: 15 }}>
              {sub}
            </p>
          </div>
          <Link to={ctaLink || "/search"} style={{
            background: '#1a2340', color: '#c9a84c', textDecoration: 'none',
            padding: '12px 28px', borderRadius: 12, fontWeight: 800,
            fontSize: 13, letterSpacing: '1px', textTransform: 'uppercase',
            border: '2px solid #1a2340', whiteSpace: 'nowrap',
            transition: 'all 0.2s',
          }}>
            {cta || 'Explore All'}
          </Link>
        </div>

        {/* Content */}
        {isError ? (
          <ErrorBox message={error?.response?.data?.message || error?.message} retry={() => refetch()} />
        ) : isLoading ? (
          <div className="carousel-container">
            {[1, 2, 3, 4].map(i => <ListingSkeleton key={i} variant="square" />)}
          </div>
        ) : data.length === 0 ? (
          <div className="empty-state-card">
            <div style={{ width: 80, height: 80, borderRadius: 20, background: '#f8f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user?.role === 'Buyer' ? <Heart size={32} color="#c9a84c" /> : <Target size={32} color="#c9a84c" />}
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 800, color: '#1a2340', margin: 0 }}>{emptyTitle}</h3>
            <p style={{ color: '#6b7280', fontWeight: 600, margin: 0, maxWidth: 400 }}>{emptySub}</p>
            <Link to={ctaLink} style={{
              background: '#c9a84c', color: '#1a1200', textDecoration: 'none',
              padding: '14px 32px', borderRadius: 12, fontWeight: 800,
              fontSize: 14, letterSpacing: '1px', textTransform: 'uppercase',
              boxShadow: '0 8px 24px rgba(201,168,76,0.3)',
            }}>
              {cta}
            </Link>
          </div>
        ) : (
          <div className="carousel-container">
            {data.map((listing, idx) => {
              const isInWishlist = wishlistIds.has(listing._id);
              
              return (
                <motion.div
                  key={listing._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="square-card"
                  onClick={() => navigate(`/listings/${listing._id}`)}
                >
                  <div className="square-card-badge">
                    {listing.propertyType || 'Land'}
                  </div>
                  
                  {isAuthenticated && user?.role === 'Buyer' && (
                    <button 
                      className="heart-btn"
                      style={{
                        position: 'absolute', top: 15, right: 15, zIndex: 11,
                        background: 'rgba(255,255,255,0.95)', padding: 8, borderRadius: 10,
                        border: 'none', cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                      onClick={e => toggleWishlist(e, listing._id)}
                      aria-label={isInWishlist ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart 
                        size={18} 
                        fill={isInWishlist ? "#dc2626" : "none"} 
                        color={isInWishlist ? "#dc2626" : "#6b7280"} 
                        strokeWidth={2.5}
                      />
                    </button>
                  )}

                  <div className="square-card-img-wrap">
                    {listing.images?.length > 0 ? (
                      <img src={getImageUrl(listing.images[0])} alt={listing.title} className="square-card-img" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontWeight: 800, fontSize: 12 }}>NO IMAGE</div>
                    )}
                  </div>

                  <div className="square-card-content">
                    <div className="square-card-price">
                      ₹{listing.price?.toLocaleString('en-IN')}
                    </div>
                    <h3 className="square-card-title">{listing.title}</h3>
                    <div className="square-card-meta">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} color="#c9a84c" />
                        {listing.location?.split(',')[0]}
                      </div>
                      <div style={{ color: '#c9a84c' }}>•</div>
                      <div>{listing.area || 'N/A'}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    {/* ── Footer ── */}
      <Footer />
    </div>
  );
};

export default Home;
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Search, Phone, Eye, Users, ChevronLeft, ChevronRight, ChevronDown, Heart } from 'lucide-react';
import SEO from '../components/SEO';
import ListingSkeleton from '../components/ListingSkeleton';
import { useQuery } from '@tanstack/react-query';
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
    tag: 'Commercial & Industrial',
    heading: 'Secure Your\nInvestment Today',
    sub: 'Residential plots, NA land & commercial zones — directly from verified sellers.',
    cta: 'Post Your Inquiry',
    ctaLink: '/register',
  }
];

/* ─── Hero Carousel ───────────────────────────────────────────────────────── */
const HeroCarousel = () => {
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

  const slide = slides[current];

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
        @media (max-width: 768px) {
          .carousel-arrow { 
            display: none !important; 
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

      {/* Scroll Down Arrow */}
     


    </div>
  );
};


const Home = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: trendingData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['trending'],
    queryFn: async () => {
      const res = await axios.get('/api/recommendations/trending');
      return res.data.data;
    }
  });

  const trending = (trendingData || []).slice(0, 4);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/search?query=${search}`);
  };

  return (
    <div style={{ fontFamily: "'Nunito Sans', sans-serif" }}>
      <SEO 
        title="Verified Land Plots & Farmhouse Land in India"
        description="Find verified land parcels, agricultural plots, and commercial land directly from sellers. Intelligent mapping and secure booking for your next land investment."
      />


      {/* ── Hero Carousel ── */}
      <HeroCarousel />

      {/* ── Floating Search Bar ── */}
      <div style={{ background: '#f8f5ee', padding: '0 24px' }}>
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
      </div>

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
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#c9a84c', fontWeight: 700 }}>{num}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 600, letterSpacing: '0.5px', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Trending Properties ── */}
      <div style={{ background: '#f8f5ee', padding: '64px 24px 80px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, borderBottom: '2px solid #e2d9c5', paddingBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: '#c9a84c', marginBottom: 6 }}>Most Viewed</div>
              <h2 style={{ fontFamily: "'Nunito Sans', serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#1a2340', fontWeight: 700, margin: 0 }}>
                Trending Properties 🔥
              </h2>
              <p style={{ color: '#6b7280', fontWeight: 600, marginTop: 8, fontSize: 15 }}>
                The most demanded plots with highest interaction volumes.
              </p>
            </div>
            <Link to="/search" style={{
              background: '#1a2340', color: '#c9a84c', textDecoration: 'none',
              padding: '10px 24px', borderRadius: 8, fontWeight: 800,
              fontSize: 13, letterSpacing: '1px', textTransform: 'uppercase',
              border: '2px solid #1a2340', whiteSpace: 'nowrap',
            }}>
              Explore All
            </Link>
          </div>

          {/* Cards */}


<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Nunito+Sans:wght@400;500;600;700;800&display=swap');

    .prop-card {
      display: flex;
      flex-direction: row;
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e0e0e0;
      overflow: hidden;
      cursor: pointer;
      transition: box-shadow 0.25s, border-color 0.25s;
      min-height: 220px;
      font-family: 'Nunito Sans', sans-serif;
    }
    .prop-card:hover {
      box-shadow: 0 8px 32px rgba(0,0,0,0.13);
      border-color: #2563eb;
    }

    /* ── Image Side ── */
    .prop-img-wrap {
      position: relative;
      width: 290px;
      min-width: 240px;
      flex-shrink: 0;
      background: #e5e7eb;
      overflow: hidden;
    }
    .prop-img-wrap img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.5s;
    }
    .prop-card:hover .prop-img-wrap img {
      transform: scale(1.04);
    }
    .prop-img-bottom {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%);
      padding: 28px 12px 10px;
      font-size: 12px;
      color: #fff;
      font-weight: 600;
    }
    .prop-img-bottom strong { font-weight: 800; }

    .prop-top-badges {
      position: absolute;
      top: 10px; left: 10px;
      display: flex; gap: 6px; flex-wrap: wrap;
    }
    .badge {
      display: flex; align-items: center; gap: 4px;
      font-size: 10px; font-weight: 800;
      padding: 4px 9px; border-radius: 5px;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .badge-verified  { background: #0f4c35; color: #fff; }
    .badge-zero      { background: #1a2340; color: #fff; }
    .badge-reserved  { background: #dc2626; color: #fff; }

    .prop-wishlist {
      position: absolute;
      top: 10px; right: 10px;
      width: 32px; height: 32px;
      background: rgba(255,255,255,0.92);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: none; cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    /* ── Content Side ── */
    .prop-content {
      flex: 1;
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }

    .prop-new-tag {
      position: absolute;
      top: 0; right: 0;
      background: #2563eb;
      color: #fff;
      font-size: 10px; font-weight: 800;
      padding: 5px 14px;
      text-transform: uppercase; letter-spacing: 1px;
      clip-path: polygon(12px 0%, 100% 0%, 100% 100%, 0% 100%);
    }

    .prop-title {
      font-family: 'Playfair Display', serif;
      font-size: 20px;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 4px;
      line-height: 1.3;
    }
    .prop-subtitle {
      font-size: 13px;
      color: #555;
      font-weight: 600;
      margin-bottom: 14px;
    }
    .prop-subtitle strong { color: #1a1a2e; }

    .prop-price-row {
      display: flex;
      gap: 0;
      margin-bottom: 12px;
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      overflow: hidden;
      width: fit-content;
    }
    .prop-price-cell {
      padding: 10px 20px;
      border-right: 1px solid #e8e8e8;
    }
    .prop-price-cell:last-child { border-right: none; }
    .prop-price-label {
      font-size: 11px; color: #888; font-weight: 600; margin-bottom: 2px;
    }
    .prop-price-value {
      font-size: 18px; font-weight: 800; color: #1a1a2e;
      font-family: 'Nunito Sans', sans-serif;
    }

    .prop-desc {
      font-size: 13px; color: #777; font-weight: 500;
      line-height: 1.6;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 4px;
    }

    .prop-stats {
      display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px;
    }
    .prop-stat {
      display: flex; align-items: center; gap: 4px;
      font-size: 11px; font-weight: 700;
      padding: 3px 10px; border-radius: 5px;
    }
    .prop-stat-red   { background: #fff0f0; color: #c0392b; border: 1px solid #fdd; }
    .prop-stat-blue  { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .prop-stat-green { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }

    .prop-location {
      display: flex; align-items: center; gap: 5px;
      font-size: 12px; color: #666; font-weight: 600;
      margin-bottom: 14px;
    }

    /* ── Card Footer ── */
    .prop-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 14px;
      border-top: 1px solid #f0f0f0;
      flex-wrap: wrap;
      gap: 10px;
    }
    .prop-seller {
      display: flex; align-items: center; gap: 10px;
      cursor: pointer;
    }
    .prop-seller-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: #1a2340; color: #c9a84c;
      display: flex; align-items: center; justify-content: center;
      font-weight: 900; font-size: 14px; flex-shrink: 0;
    }
    .prop-seller-name  { font-size: 13px; font-weight: 800; color: #1a1a2e; }
    .prop-seller-meta  { font-size: 10px; color: #aaa; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

    .prop-actions { display: flex; gap: 10px; align-items: center; }

    .btn-contact {
      display: flex; align-items: center; gap: 6px;
      padding: 9px 18px; border-radius: 8px;
      font-size: 13px; font-weight: 700;
      background: #fff; border: 1.5px solid #d1d5db; color: #1a1a2e;
      cursor: pointer; font-family: 'Nunito Sans', sans-serif;
      transition: background 0.15s, border-color 0.15s;
      white-space: nowrap;
    }
    .btn-contact:hover { background: #f0f4ff; border-color: #2563eb; color: #2563eb; }

    .btn-view {
      display: flex; align-items: center; gap: 6px;
      padding: 9px 22px; border-radius: 8px;
      font-size: 13px; font-weight: 800;
      background: #2563eb; color: #fff;
      text-decoration: none; border: none; cursor: pointer;
      font-family: 'Nunito Sans', sans-serif;
      transition: background 0.15s;
      white-space: nowrap;
    }
    .btn-view:hover { background: #1d4ed8; }

    /* Mobile stacking */
    @media (max-width: 640px) {
      .prop-card { flex-direction: column; }
      .prop-img-wrap { width: 100%; min-height: 200px; }
      .prop-price-row { width: 100%; }
      .prop-price-cell { flex: 1; }
    }
  `}</style>

  {isError ? (
    <ErrorBox message={error?.response?.data?.message || error?.message} retry={() => refetch()} />
  ) : isLoading ? (
    [1, 2, 3].map(i => <ListingSkeleton key={i} variant="list" />)
  ) : trending.length > 0 ? (
    trending.map(listing => (
      <div
        key={listing._id}
        className="prop-card"
        onClick={() => navigate(`/listings/${listing._id}`)}
      >
        {/* ── Left: Image ── */}
        <div className="prop-img-wrap">
          {listing.images?.length > 0 ? (
            <img src={getImageUrl(listing.images[0])} alt={listing.title} />
          ) : (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', background: '#f3f4f6' }}>No Image</div>
          )}

          {/* Top Badges */}
          <div className="prop-top-badges">
            {listing.status === 'Reserved' && (
              <span className="badge badge-reserved">Reserved</span>
            )}
          </div>

          {/* Wishlist */}
          <button className="prop-wishlist" onClick={e => e.stopPropagation()} title="Save to Favourites">
            <Heart size={16} color="#555" />
          </button>

          {/* Bottom overlay: completion / date */}
          <div className="prop-img-bottom">
            Listed · <strong>{new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
          </div>
        </div>

        {/* ── Right: Content ── */}
        <div className="prop-content">
          {/* NEW BOOKING tag */}
          {listing.status !== 'Reserved' && (
            <div className="prop-new-tag">New Listing</div>
          )}

          <div>
            {/* Title */}
            <h3 className="prop-title">{listing.title}</h3>

            {/* Subtitle: type + location */}
            <p className="prop-subtitle">
              <strong>{listing.propertyType || 'Plot / Land'}</strong>{' '}
              in {listing.location}
            </p>

            {/* Price Boxes */}
            <div className="prop-price-row">
              <div className="prop-price-cell">
                <div className="prop-price-label">Area</div>
                <div className="prop-price-value" style={{ fontSize: 15 }}>{listing.area || '—'}</div>
              </div>
              <div className="prop-price-cell">
                <div className="prop-price-label">Total Price</div>
                <div className="prop-price-value">₹{listing.price?.toLocaleString('en-IN')}</div>
              </div>
            </div>

            {/* Location */}
            <div className="prop-location">
              <MapPin size={13} color="#c9a84c" />
              {listing.location}
            </div>

            {/* Stats */}
            <div className="prop-stats">
              <span className="prop-stat prop-stat-red">
                <Users size={10} /> {listing.contacts || 0}+ Showings Requested
              </span>
              <span className="prop-stat prop-stat-blue">
                <Eye size={10} /> {listing.views || 0} Interest Hits
              </span>
            </div>

            {/* Description */}
            <p className="prop-desc">{listing.description || 'No description provided.'}</p>
          </div>

          {/* Footer */}
          <div className="prop-footer">
            <div
              className="prop-seller"
              onClick={e => { e.stopPropagation(); navigate(`/seller/${listing.createdBy?._id || listing.createdBy}`); }}
            >
              <div className="prop-seller-avatar">{listing.createdBy?.name?.charAt(0) || 'U'}</div>
              <div>
                <div className="prop-seller-name">{listing.createdBy?.role === 'Broker' ? 'Builder' : listing.createdBy?.role || 'Seller'}</div>
                <div className="prop-seller-meta">{listing.createdBy?.name || 'Authorized Seller'}</div>
              </div>
            </div>

            <div className="prop-actions">
              <button className="btn-contact" onClick={e => e.stopPropagation()}>
                <Phone size={14} /> Contact Seller
              </button>
              <Link
                to={`/listings/${listing._id}`}
                className="btn-view"
                onClick={e => e.stopPropagation()}
              >
                View Number
              </Link>
            </div>
          </div>
        </div>
      </div>
    ))
  ) : (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#aaa', fontWeight: 700, fontSize: 18, border: '2px dashed #e0e0e0', borderRadius: 16, background: '#fafafa' }}>
      No trending properties at the moment. Check back soon!
    </div>
  )}
</div>
          {/* Mobile Explore All */}
          <div style={{ marginTop: 40, textAlign: 'center' }}>
            <Link to="/search" style={{ display: 'inline-block', background: '#1a2340', color: '#c9a84c', textDecoration: 'none', padding: '14px 36px', borderRadius: 8, fontWeight: 800, fontSize: 14, letterSpacing: '1px', textTransform: 'uppercase' }}>
              Explore All Properties
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;    
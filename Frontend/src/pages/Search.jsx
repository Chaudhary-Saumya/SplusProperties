import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Search as SearchIcon, Filter, Navigation, Phone, X, Users, Eye, Heart, ChevronDown, SlidersHorizontal, Download } from 'lucide-react';
import ListingSkeleton from '../components/ListingSkeleton';
import ErrorBox from '../components/ErrorBox';
import EmptyState from '../components/EmptyState';
import { getImageUrl } from '../utils/imageUrl';
import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash/debounce';

/* ─── Collapsible Filter Section ─────────────────────────────────────────── */
const FilterSection = ({ title, children, defaultOpen = true }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-[#f0ebe0] py-4">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between text-left"
            >
                <span className="text-sm font-bold text-[#1a2340] uppercase tracking-wider">{title}</span>
                <ChevronDown
                    size={16}
                    className={`text-[#9ca3af] transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>
            {open && <div className="mt-3">{children}</div>}
        </div>
    );
};

/* ─── Toggle Switch ───────────────────────────────────────────────────────── */
const Toggle = ({ checked, onChange }) => (
    <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex w-10 h-5 rounded-full transition-colors ${checked ? 'bg-[#c9a84c]' : 'bg-[#d1d5db]'}`}
    >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
);

const Search = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [isVerifiedOnly, setIsVerifiedOnly] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [filters, setFilters] = useState({ minPrice: '', maxPrice: '' });
    const [isGeoMode, setIsGeoMode] = useState(false);
    const [userCoords, setUserCoords] = useState(null);
    const [geoLoading, setGeoLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState('-createdAt');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [wishlist, setWishlist] = useState(new Set());

    const { data: resultData, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['listings', searchTerm, isVerifiedOnly, filters.minPrice, filters.maxPrice, sortBy, isGeoMode, userCoords, page],
        queryFn: async () => {
            let url = `/api/listings?page=${page}&limit=12&sort=${sortBy}`;
            if (searchTerm) url += `&search=${searchTerm}`;
            if (isVerifiedOnly) url += `&isVerified=true`;
            if (filters.minPrice) url += `&minPrice=${filters.minPrice}`;
            if (filters.maxPrice) url += `&maxPrice=${filters.maxPrice}`;
            if (isGeoMode && userCoords) url += `&lat=${userCoords.lat}&lng=${userCoords.lng}&radius=50`;
            const res = await axios.get(url);
            return res.data;
        },
        keepPreviousData: true,
    });

    const listings = resultData?.data || [];
    const totalResults = resultData?.total || 0;
    const hasMore = listings.length < totalResults;

    const debouncedSetSearch = useMemo(() => debounce((val) => setSearchTerm(val), 500), []);
    useEffect(() => { debouncedSetSearch(searchInput); }, [searchInput, debouncedSetSearch]);

    const observer = useRef();
    const lastElementRef = (node) => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) setPage(prev => prev + 1);
        });
        if (node) observer.current.observe(node);
    };

    useEffect(() => {
        const q = new URLSearchParams(location.search).get('query');
        if (q) { setSearchTerm(q); setSearchInput(q); }
    }, [location.search]);

    useEffect(() => {
        const t = setTimeout(async () => {
            if (searchInput.trim().length > 1) {
                try {
                    const res = await axios.get(`/api/listings/search/suggestions?q=${encodeURIComponent(searchInput)}`);
                    setSuggestions(res.data.data);
                    setShowSuggestions(true);
                } catch { setSuggestions([]); }
            } else { setSuggestions([]); setShowSuggestions(false); }
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    useEffect(() => { setPage(1); }, [isVerifiedOnly, filters, isGeoMode, userCoords, searchTerm]);

    const triggerGeoSearch = () => {
        if (isGeoMode) { setIsGeoMode(false); setUserCoords(null); return; }
        if (navigator.geolocation) {
            setGeoLoading(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => { setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setIsGeoMode(true); setSearchInput(''); setShowSuggestions(false); setGeoLoading(false); },
                () => { toast.warning('Location access denied.'); setGeoLoading(false); }
            );
        } else { toast.error('Geolocation not supported.'); }
    };

    const toggleWishlist = (e, id) => {
        e.stopPropagation();
        setWishlist(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    };

    const resetFilters = () => { setFilters({ minPrice: '', maxPrice: '' }); setIsVerifiedOnly(false); };

    const inputClass = "w-full px-3 py-2.5 bg-[#fdfaf5] border border-[#e2d9c5] rounded-lg text-sm font-bold text-[#1a2340] placeholder-[#b0a898] focus:outline-none focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/20 transition-all";

    /* ── Sidebar Filters ── */
    const SidebarFilters = () => (
        <div className="bg-white border border-[#e2d9c5] rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0ebe0]">
                <h3 className="text-sm font-bold text-[#1a2340] uppercase tracking-widest flex items-center gap-2">
                    <SlidersHorizontal size={15} className="text-[#c9a84c]" /> Filters
                </h3>
                <button onClick={resetFilters} className="text-xs font-bold text-[#c9a84c] hover:underline">Reset All</button>
            </div>

            <div className="px-5">
                <FilterSection title="Budget (₹)">
                    <div className="space-y-2">
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-[#9ca3af] font-bold text-xs">₹</span>
                            <input type="number" placeholder="Min Price" value={filters.minPrice} onChange={e => setFilters(p => ({ ...p, minPrice: e.target.value }))} className={`${inputClass} pl-7`} />
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-[#9ca3af] font-bold text-xs">₹</span>
                            <input type="number" placeholder="Max Price" value={filters.maxPrice} onChange={e => setFilters(p => ({ ...p, maxPrice: e.target.value }))} className={`${inputClass} pl-7`} />
                        </div>
                    </div>
                </FilterSection>

                <FilterSection title="Listing Type">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-600 text-[#374151]">Verified Only</span>
                        <Toggle checked={isVerifiedOnly} onChange={setIsVerifiedOnly} />
                    </div>
                </FilterSection>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8f5ee]" style={{ fontFamily: "'Nunito Sans', sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Nunito+Sans:wght@400;500;600;700;800&display=swap');`}</style>

            {/* ── Gold top bar ── */}
            <div className="h-1 w-full bg-gradient-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c]" />

            {/* ── Sticky Search Bar ── */}
            <div className="sticky top-[68px] z-30 bg-white border-b border-[#e2d9c5] shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
                    <div className="flex items-center gap-2">
                        {/* Search Input */}
                        <div className="flex flex-1 items-center bg-[#fdfaf5] border-2 border-[#e2d9c5] focus-within:border-[#c9a84c] focus-within:ring-2 focus-within:ring-[#c9a84c]/20 rounded-lg px-3 py-2 transition-all gap-2 relative">
                            <SearchIcon size={18} className="text-[#c9a84c] flex-shrink-0" />
                            <input
                                type="text"
                                placeholder={isGeoMode ? '📍 Searching Near You...' : 'Search by Location, City or Property Name...'}
                                className="flex-1 bg-transparent border-none outline-none text-[#1a2340] font-bold text-sm placeholder-[#b0a898]"
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                disabled={isGeoMode}
                            />
                            {searchInput && (
                                <button onClick={() => { setSearchInput(''); setSearchTerm(''); }} className="text-[#9ca3af] hover:text-[#1a2340]">
                                    <X size={15} />
                                </button>
                            )}

                            {/* Suggestions Dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e2d9c5] rounded-xl shadow-xl z-50 overflow-hidden">
                                    {suggestions.map(s => (
                                        <div
                                            key={s._id}
                                            onClick={() => { setSearchInput(s.title); setShowSuggestions(false); }}
                                            className="flex items-center justify-between px-4 py-3 hover:bg-[#fdfaf5] cursor-pointer border-b border-[#f8f5ee] last:border-0"
                                        >
                                            <div>
                                                <div className="text-sm font-bold text-[#1a2340]">{s.title}</div>
                                                <div className="text-xs text-[#9ca3af] flex items-center gap-1 mt-0.5">
                                                    <MapPin size={10} /> {s.location}
                                                </div>
                                            </div>
                                            <div className="text-sm font-black text-[#c9a84c]">₹{s.price?.toLocaleString('en-IN')}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Near Me */}
                        <button
                            onClick={triggerGeoSearch}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm border transition-all whitespace-nowrap ${isGeoMode ? 'bg-[#c9a84c] text-[#1a1200] border-[#c9a84c]' : 'bg-white text-[#1a2340] border-[#e2d9c5] hover:border-[#1a2340]'}`}
                        >
                            <Navigation size={15} className={geoLoading ? 'animate-spin' : ''} />
                            <span className="hidden sm:inline">{isGeoMode ? 'Near Me ✓' : 'Near Me'}</span>
                        </button>

                        {/* Search Button */}
                        <button
                            onClick={() => setSearchTerm(searchInput)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#1a2340] hover:bg-[#c9a84c] hover:text-[#1a1200] text-white rounded-lg font-bold text-sm transition-all whitespace-nowrap"
                        >
                            <SearchIcon size={15} /> Search
                        </button>

                        {/* Mobile Filter Toggle */}
                        <button
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                            className="lg:hidden flex items-center gap-1.5 px-3 py-2.5 bg-white border border-[#e2d9c5] rounded-lg font-bold text-sm text-[#1a2340]"
                        >
                            <Filter size={15} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Mobile Filter Drawer ── */}
            {showMobileFilters && (
                <div className="lg:hidden bg-white border-b border-[#e2d9c5] px-4 py-4 shadow-md">
                    <SidebarFilters />
                </div>
            )}

            {/* ── Main Layout ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="flex gap-6">

                    {/* ── Left Sidebar ── */}
                    <div className="hidden lg:block w-64 flex-shrink-0">
                        <div className="sticky top-32">
                            <SidebarFilters />
                        </div>
                    </div>

                    {/* ── Results ── */}
                    <div className="flex-1 min-w-0">

                        {/* Results Header */}
                        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-[#1a2340]" style={{ fontFamily: "'Playfair Display', serif" }}>
                                    {isLoading && page === 1 ? 'Searching...' : `${totalResults.toLocaleString('en-IN')} Properties Found`}
                                </h2>
                                {isGeoMode && (
                                    <p className="text-xs text-[#c9a84c] font-bold mt-0.5">📍 Showing results near your location</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider">Sort:</span>
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value)}
                                    className="text-sm font-bold text-[#1a2340] bg-white border border-[#e2d9c5] rounded-lg px-3 py-2 focus:outline-none focus:border-[#c9a84c] cursor-pointer"
                                >
                                    <option value="trending">Trending 🔥</option>
                                    <option value="-createdAt">Newest First</option>
                                    <option value="price">Price: Low → High</option>
                                    <option value="-price">Price: High → Low</option>
                                </select>
                            </div>
                        </div>

                        {/* Cards */}
                        {isError ? (
                            <ErrorBox message={error?.response?.data?.message || error?.message} retry={() => refetch()} />
                        ) : isLoading && page === 1 ? (
                            <div className="space-y-4">{[1, 2, 3].map(i => <ListingSkeleton key={i} variant="list" />)}</div>
                        ) : listings.length === 0 ? (
                            <EmptyState actionText="Clear All Filters" actionLink="/search" title="No Properties Found" message="Try adjusting your search criteria or clearing the filters." />
                        ) : (
                            <div className="space-y-4">
                                {listings.map((listing, idx) => (
                                    <div
                                        key={listing._id}
                                        ref={idx === listings.length - 1 ? lastElementRef : null}
                                        onClick={() => navigate(`/listings/${listing._id}`)}
                                        className="bg-white border border-[#e2d9c5] hover:border-[#c9a84c] rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg group"
                                        style={{ display: 'flex', minHeight: 200 }}
                                    >
                                        {/* Image */}
                                        <div className="relative flex-shrink-0 overflow-hidden bg-[#e5e7eb]" style={{ width: 260 }}>
                                            {listing.images?.length > 0 ? (
                                                <img
                                                    src={getImageUrl(listing.images[0])}
                                                    alt={listing.title}
                                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 w-full h-full flex items-center justify-center text-[#9ca3af] text-xs font-bold uppercase tracking-widest">No Image</div>
                                            )}

                                            {/* Badges */}
                                            <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                                               
                                                {listing.status === 'Reserved' && (
                                                    <span className="bg-[#dc2626] text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider">Reserved</span>
                                                )}
                                            </div>

                                            {/* Wishlist */}
                                            <button
                                                onClick={e => toggleWishlist(e, listing._id)}
                                                className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                                            >
                                                <Heart size={14} className={wishlist.has(listing._id) ? 'fill-red-500 text-red-500' : 'text-[#6b7280]'} />
                                            </button>

                                            {/* Bottom overlay */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
                                                <p className="text-white text-[10px] font-600">
                                                    Listed · <strong>{new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 flex flex-col justify-between p-5 relative">
                                            {/* NEW LISTING ribbon */}
                                            {listing.status !== 'Reserved' && (
                                                <div className="absolute top-0 right-0 bg-[#2563eb] text-white text-[9px] font-bold px-3 py-1 uppercase tracking-widest"
                                                    style={{ clipPath: 'polygon(10px 0%, 100% 0%, 100% 100%, 0% 100%)' }}>
                                                    New Listing
                                                </div>
                                            )}

                                            <div>
                                                {/* Title */}
                                                <h3 className="text-lg font-bold text-[#1a2340] group-hover:text-[#c9a84c] transition-colors leading-tight mb-1 pr-20" style={{ fontFamily: "'Playfair Display', serif" }}>
                                                    {listing.title}
                                                </h3>

                                                {/* Subtitle */}
                                                <p className="text-sm text-[#6b7280] font-600 mb-3">
                                                    <strong className="text-[#1a2340]">{listing.propertyType || 'Plot / Land'}</strong> in {listing.location}
                                                </p>

                                                {/* Price + Area boxes */}
                                                <div className="flex mb-3" style={{ border: '1px solid #e2d9c5', borderRadius: 8, width: 'fit-content', overflow: 'hidden' }}>
                                                    <div className="px-4 py-2" style={{ borderRight: '1px solid #e2d9c5' }}>
                                                        <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-0.5">Area</div>
                                                        <div className="text-sm font-black text-[#1a2340]">{listing.area || '—'}</div>
                                                    </div>
                                                    <div className="px-4 py-2">
                                                        <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-0.5">Total Price</div>
                                                        <div className="text-lg font-black text-[#1a2340]">₹{listing.price?.toLocaleString('en-IN')}</div>
                                                    </div>
                                                </div>

                                                {/* Location */}
                                                <p className="flex items-center gap-1.5 text-xs text-[#6b7280] font-600 mb-3">
                                                    <MapPin size={12} className="text-[#c9a84c]" /> {listing.location}
                                                </p>

                                                {/* Stats */}
                                                <div className="flex gap-2 flex-wrap mb-3">
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#dc2626] bg-[#fff0f0] border border-[#fecaca] px-2 py-1 rounded">
                                                        <Users size={9} /> {listing.contacts || 0}+ Showings
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#1d4ed8] bg-[#eff6ff] border border-[#bfdbfe] px-2 py-1 rounded">
                                                        <Eye size={9} /> {listing.views || 0} Views
                                                    </span>
                                                   
                                                </div>

                                                {/* Description */}
                                                <p className="text-xs text-[#9ca3af] font-500 leading-relaxed line-clamp-2">
                                                    {listing.description || 'No description provided.'}
                                                </p>
                                            </div>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between pt-3 border-t border-[#f0ebe0] mt-3 flex-wrap gap-2">
                                                <div
                                                    onClick={e => { e.stopPropagation(); navigate(`/seller/${listing.createdBy?._id || listing.createdBy}`); }}
                                                    className="flex items-center gap-2 cursor-pointer"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-[#1a2340] flex items-center justify-center text-[#c9a84c] font-black text-xs flex-shrink-0">
                                                        {listing.createdBy?.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-[#6b7280] uppercase tracking-wider leading-none">
                                                            {listing.createdBy?.role === 'Broker' ? 'Builder' : listing.createdBy?.role || 'Seller'}
                                                        </div>
                                                        <div className="text-sm font-black text-[#1a2340]">
                                                            {listing.createdBy?.name || 'Authorized Seller'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={e => e.stopPropagation()}
                                                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#e2d9c5] hover:border-[#1a2340] text-[#1a2340] rounded-lg text-xs font-bold transition-all"
                                                    >
                                                        <Phone size={12} /> Contact
                                                    </button>
                                                    <Link
                                                        to={`/listings/${listing._id}`}
                                                        onClick={e => e.stopPropagation()}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg text-xs font-bold transition-all"
                                                    >
                                                        View Number
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Infinite scroll loader */}
                                {hasMore && (
                                    <div className="py-8 flex justify-center">
                                        <div className="flex items-center gap-3 px-6 py-3 bg-white border border-[#e2d9c5] rounded-xl text-sm font-bold text-[#9ca3af]">
                                            <div className="w-4 h-4 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
                                            Loading more properties...
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Search;
import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MapPin, Search as SearchIcon, Filter, Navigation, Phone, X, Users, Eye, Heart, ChevronDown, SlidersHorizontal, Download, MessageCircle, Share2, ShieldCheck, CheckCircle2, ArrowUpRight, Plus, Sparkles, Building2, Layers } from 'lucide-react';
import ListingSkeleton from '../components/ListingSkeleton';
import ErrorBox from '../components/ErrorBox';
import EmptyState from '../components/EmptyState';
import { getImageUrl } from '../utils/imageUrl';
import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';
import { getWebsiteBaseUrl } from '../utils/url';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet + Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

/* ─── Collapsible Filter Section ─────────────────────────────────────────── */
const FilterSection = ({ title, children, defaultOpen = true }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-slate-100 py-3.5">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between text-left cursor-pointer"
            >
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">{title}</span>
                <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform ${open ? 'rotate-180 text-blue-600' : ''}`}
                />
            </button>
            {open && <div className="mt-2.5">{children}</div>}
        </div>
    );
};

/* ─── Toggle Switch ───────────────────────────────────────────────────────── */
const Toggle = ({ checked, onChange }) => (
    <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex w-10 h-5 rounded-full transition-colors cursor-pointer ${checked ? 'bg-[#2563eb]' : 'bg-slate-300'}`}
    >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
);

/* ─── Dual Range Slider Component ────────────────────────────────────────── */
const DualRangeSlider = ({ min, max, step, minVal, maxVal, onChangeMin, onChangeMax, formatLabel, minBoundLabel, maxBoundLabel }) => {
    const currentMin = minVal !== '' && minVal !== null && minVal !== undefined ? Number(minVal) : min;
    const currentMax = maxVal !== '' && maxVal !== null && maxVal !== undefined ? Number(maxVal) : max;

    const [activeThumb, setActiveThumb] = useState(null);

    const minPercent = Math.max(0, Math.min(100, ((currentMin - min) / (max - min)) * 100));
    const maxPercent = Math.max(0, Math.min(100, ((currentMax - min) / (max - min)) * 100));

    let minZIndex = 40;
    let maxZIndex = 40;

    if (activeThumb === 'min') {
        minZIndex = 60;
        maxZIndex = 40;
    } else if (activeThumb === 'max') {
        minZIndex = 40;
        maxZIndex = 60;
    } else if (currentMin > max * 0.9) {
        minZIndex = 60;
        maxZIndex = 40;
    }

    return (
        <div className="space-y-3 font-['Nunito_Sans',sans-serif]">
            <div className="text-xs font-black text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-xl border border-blue-100 text-center">
                {formatLabel(currentMin, currentMax)}
            </div>

            <div className="relative w-full h-7 flex items-center select-none py-1">
                <div className="absolute w-full h-1.5 bg-slate-200 rounded-full" />
                <div
                    className="absolute h-1.5 bg-[#2563eb] rounded-full"
                    style={{
                        left: `${minPercent}%`,
                        width: `${Math.max(0, maxPercent - minPercent)}%`
                    }}
                />

                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={currentMin}
                    onMouseDown={() => setActiveThumb('min')}
                    onTouchStart={() => setActiveThumb('min')}
                    onChange={(e) => {
                        const value = Math.min(Number(e.target.value), currentMax);
                        onChangeMin(value === min ? '' : value);
                    }}
                    className="range-thumb absolute w-full h-1.5 opacity-0 cursor-pointer pointer-events-auto"
                    style={{ zIndex: minZIndex }}
                />

                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={currentMax}
                    onMouseDown={() => setActiveThumb('max')}
                    onTouchStart={() => setActiveThumb('max')}
                    onChange={(e) => {
                        const value = Math.max(Number(e.target.value), currentMin);
                        onChangeMax(value === max ? '' : value);
                    }}
                    className="range-thumb absolute w-full h-1.5 opacity-0 cursor-pointer pointer-events-auto"
                    style={{ zIndex: maxZIndex }}
                />

                <div
                    className="absolute w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow-md pointer-events-none transition-transform"
                    style={{ left: `calc(${minPercent}% - 8px)` }}
                />

                <div
                    className="absolute w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow-md pointer-events-none transition-transform"
                    style={{ left: `calc(${maxPercent}% - 8px)` }}
                />
            </div>

            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>{minBoundLabel}</span>
                <span>{maxBoundLabel}</span>
            </div>
        </div>
    );
};

const formatBudgetVal = (val, isMax = false) => {
    if (val === 0) return '0';
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)} Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(0)} Lakh`;
    return val.toLocaleString('en-IN');
};

/* ─── Main Search Component ────────────────────────────────────────────────── */
const Search = () => {
    const { user, isAuthenticated } = useContext(AuthContext);
    const { t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [isVerifiedOnly, setIsVerifiedOnly] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [filters, setFilters] = useState({
        minPrice: '',
        maxPrice: '',
        minArea: '',
        maxArea: '',
        city: '',
        locality: '',
        propertyType: '',
        plotType: 'None',
        landType: 'None',
        ownerType: '',
        roadTouch: false,
        cornerPlot: false,
        isAgricultural: '',
        isFeatured: false,
        gatedCommunity: false,
        boundaryWall: false,
        napiPermission: false,
        minPricePerSqYd: '',
        maxPricePerSqYd: '',
        daysOnMarket: ''
    });
    const [debouncedFilters, setDebouncedFilters] = useState(filters);
    const [isGeoMode, setIsGeoMode] = useState(false);
    const [userCoords, setUserCoords] = useState(null);
    const [geoLoading, setGeoLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState('recommended');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [wishlist, setWishlist] = useState(new Set());
    const [accumulatedListings, setAccumulatedListings] = useState([]);
    const searchInputRef = useRef(null);

    // Hydrate wishlist from auth user
    useEffect(() => {
        if (isAuthenticated && user?.favorites) {
            const ids = user.favorites.map(fav =>
                typeof fav === 'string' ? fav : (fav?._id || fav?.id)
            ).filter(Boolean);
            setWishlist(new Set(ids));
        } else {
            setWishlist(new Set());
        }
    }, [isAuthenticated, user?.favorites]);

    const isFirstRender = useRef(true);

    const { data: resultData, isLoading, isError, error, refetch, isFetching } = useQuery({
        queryKey: ['listings', searchTerm, isVerifiedOnly, debouncedFilters, sortBy, isGeoMode, userCoords, page],
        queryFn: async () => {
            let url = `/api/listings?page=${page}&limit=12&sort=${sortBy}`;
            if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
            if (isVerifiedOnly) url += `&listingType=Verified`;

            Object.entries(debouncedFilters).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined && value !== false) {
                    url += `&${key}=${encodeURIComponent(value)}`;
                }
            });

            if (isGeoMode && userCoords) {
                url += `&lat=${userCoords.lat}&lng=${userCoords.lng}&radius=50`;
            }

            const res = await axios.get(url);
            return res.data;
        }
    });

    useEffect(() => {
        if (resultData?.data) {
            if (page === 1) {
                setAccumulatedListings(resultData.data);
            } else {
                setAccumulatedListings(prev => {
                    const existingIds = new Set(prev.map(item => item._id));
                    const newItems = resultData.data.filter(item => !existingIds.has(item._id));
                    return [...prev, ...newItems];
                });
            }
        }
    }, [resultData, page]);

    const listings = page === 1 ? (resultData?.data || []) : accumulatedListings;
    const totalResults = resultData?.total || 0;
    const hasMore = listings.length < totalResults;

    const debouncedSetSearch = useMemo(() => debounce((val) => setSearchTerm(val), 500), []);
    useEffect(() => { debouncedSetSearch(searchInput); }, [searchInput, debouncedSetSearch]);

    const debouncedSetFilters = useMemo(() => debounce((val) => setDebouncedFilters(val), 600), []);
    useEffect(() => { debouncedSetFilters(filters); }, [filters, debouncedSetFilters]);

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
        const params = new URLSearchParams(location.search);
        const q = params.get('query') || '';
        setSearchTerm(q);
        setSearchInput(q);

        const propType = params.get('propertyType') || '';
        const plotT = params.get('plotType') || 'None';
        const landT = params.get('landType') || 'None';
        const minPrice = params.get('minPrice') || '';
        const maxPrice = params.get('maxPrice') || '';
        const minArea = params.get('minArea') || '';
        const maxArea = params.get('maxArea') || '';
        const city = params.get('city') || '';
        const locality = params.get('locality') || '';
        const ownerType = params.get('ownerType') || '';
        const roadTouch = params.get('roadTouch') === 'true';
        const cornerPlot = params.get('cornerPlot') === 'true';
        const isAgricultural = params.get('isAgricultural') || '';
        const isFeatured = params.get('isFeatured') === 'true';
        const listingType = params.get('listingType') || '';

        setFilters(prev => ({
            minPrice,
            maxPrice,
            minArea,
            maxArea,
            city,
            locality,
            propertyType: propType,
            plotType: plotT,
            landType: landT,
            ownerType,
            roadTouch,
            cornerPlot,
            isAgricultural,
            isFeatured
        }));

        const isVerifiedVal = listingType === 'Verified';
        setIsVerifiedOnly(prev => prev === isVerifiedVal ? prev : isVerifiedVal);
    }, [location.search]);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        setPage(1);
        setAccumulatedListings([]);
    }, [isVerifiedOnly, debouncedFilters, isGeoMode, userCoords, searchTerm, sortBy]);

    const triggerGeoSearch = () => {
        if (isGeoMode) { setIsGeoMode(false); setUserCoords(null); return; }
        if (navigator.geolocation) {
            setGeoLoading(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => { setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setIsGeoMode(true); setSearchInput(''); setShowSuggestions(false); setGeoLoading(false); },
                () => { toast.warning('Location permission required.'); setGeoLoading(false); }
            );
        } else { toast.error('Geolocation not supported.'); }
    };

    const toggleWishlist = async (e, id) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            toast.info('Please login to save favorites');
            navigate('/login');
            return;
        }
        const wasAdded = !wishlist.has(id);
        setWishlist(prev => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });
        try {
            const res = await axios.post(`/api/auth/favorites/${id}`);
            if (user && res.data?.data) {
                user.favorites = res.data.data;
                const ids = res.data.data.map(fav => typeof fav === 'string' ? fav : (fav?._id || fav?.id)).filter(Boolean);
                setWishlist(new Set(ids));
            }
            toast.success(wasAdded ? 'Added to favorites!' : 'Removed from favorites');
        } catch {
            setWishlist(prev => {
                const s = new Set(prev);
                wasAdded ? s.delete(id) : s.add(id);
                return s;
            });
            toast.error('Failed to update favorites');
        }
    };

    const resetFilters = () => {
        setFilters({
            minPrice: '',
            maxPrice: '',
            minArea: '',
            maxArea: '',
            city: '',
            locality: '',
            propertyType: '',
            plotType: 'None',
            landType: 'None',
            ownerType: '',
            roadTouch: false,
            cornerPlot: false,
            isAgricultural: '',
            isFeatured: false,
            gatedCommunity: false,
            boundaryWall: false,
            napiPermission: false,
            minPricePerSqYd: '',
            maxPricePerSqYd: '',
            daysOnMarket: ''
        });
        setIsVerifiedOnly(false);
        setSearchInput('');
        setSearchTerm('');
        navigate('/search');
    };

    const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-extrabold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all";

    /* ── Render Filter Sections ── */
    const renderFilterSections = () => (
        <>
            <FilterSection title="Applied Filters" defaultOpen={true}>
                <div className="flex flex-wrap gap-1.5">
                    {filters.landType !== 'None' && (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg flex items-center gap-1 border border-blue-200">
                            {filters.landType} <X size={12} className="cursor-pointer" onClick={() => setFilters(p => ({ ...p, landType: 'None' }))} />
                        </span>
                    )}
                    {isVerifiedOnly && (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg flex items-center gap-1 border border-emerald-200">
                            Verified <X size={12} className="cursor-pointer" onClick={() => setIsVerifiedOnly(false)} />
                        </span>
                    )}
                    {filters.ownerType && (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1 border border-slate-200">
                            {filters.ownerType} <X size={12} className="cursor-pointer" onClick={() => setFilters(p => ({ ...p, ownerType: '' }))} />
                        </span>
                    )}
                </div>
            </FilterSection>

            <FilterSection title="Type of Property" defaultOpen={true}>
                <div className="grid grid-cols-2 gap-2">
                    {['Residential', 'Commercial', 'Industrial', 'Agricultural', 'Other'].map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setFilters(prev => ({ ...prev, landType: prev.landType === type ? 'None' : type }))}
                            className={`py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${filters.landType === type
                                ? 'bg-[#0078d4] text-white border-[#0078d4] shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </FilterSection>

            <FilterSection title="Budget (₹)" defaultOpen={true}>
                <DualRangeSlider
                    min={0}
                    max={50000000}
                    step={100000}
                    minVal={filters.minPrice}
                    maxVal={filters.maxPrice}
                    onChangeMin={val => setFilters(p => ({ ...p, minPrice: val }))}
                    onChangeMax={val => setFilters(p => ({ ...p, maxPrice: val }))}
                    formatLabel={(minV, maxV) => {
                        if (minV === 0 && maxV === 50000000) return 'Any Budget';
                        return `₹${formatBudgetVal(minV, false)} – ₹${formatBudgetVal(maxV, true)}`;
                    }}
                    minBoundLabel="₹0"
                    maxBoundLabel="₹5 Cr+"
                />
            </FilterSection>

            <FilterSection title="Plot Area (Sq Ft)" defaultOpen={false}>
                <DualRangeSlider
                    min={0}
                    max={50000}
                    step={500}
                    minVal={filters.minArea}
                    maxVal={filters.maxArea}
                    onChangeMin={val => setFilters(p => ({ ...p, minArea: val }))}
                    onChangeMax={val => setFilters(p => ({ ...p, maxArea: val }))}
                    formatLabel={(minV, maxV) => {
                        if (minV === 0 && maxV === 50000) return 'Any Size';
                        return `${minV.toLocaleString()} – ${maxV >= 50000 ? '50,000+' : maxV.toLocaleString()} Sq Ft`;
                    }}
                    minBoundLabel="0 Sq Ft"
                    maxBoundLabel="50,000+ Sq Ft"
                />
            </FilterSection>

            <FilterSection title="Location" defaultOpen={false}>
                <div className="space-y-2">
                    <input
                        type="text"
                        placeholder="City (e.g. Ahmedabad)"
                        value={filters.city}
                        onChange={e => setFilters(prev => ({ ...prev, city: e.target.value }))}
                        className={inputClass}
                    />
                    <input
                        type="text"
                        placeholder="Locality (e.g. Sanand)"
                        value={filters.locality}
                        onChange={e => setFilters(prev => ({ ...prev, locality: e.target.value }))}
                        className={inputClass}
                    />
                </div>
            </FilterSection>

            <FilterSection title="Verified Properties" defaultOpen={true}>
                <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-700">Verified Listing</span>
                        <Toggle checked={isVerifiedOnly} onChange={val => setIsVerifiedOnly(val)} />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-700">Road Touch Frontage</span>
                        <Toggle checked={filters.roadTouch} onChange={val => setFilters(prev => ({ ...prev, roadTouch: val }))} />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-700">Corner Plot</span>
                        <Toggle checked={filters.cornerPlot} onChange={val => setFilters(prev => ({ ...prev, cornerPlot: val }))} />
                    </div>
                </div>
            </FilterSection>
        </>
    );

    const filtersContent = (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4 space-y-2">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-[#0078d4]" />
                    <span>Applied Filters</span>
                </h3>
                <button onClick={resetFilters} className="text-xs font-bold text-[#0078d4] hover:underline cursor-pointer">
                    Clear All
                </button>
            </div>
            {renderFilterSections()}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-['Nunito_Sans',sans-serif]">
            <SEO
                title="Search Land & Plots in Gujarat | Kharsan Properties"
                description="Browse verified residential plots, agricultural farmlands, and commercial land across Gujarat."
            />

            {/* Main Layout Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

                {/* 99acres Header Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            {isLoading ? 'Searching...' : `${totalResults.toLocaleString('en-IN')} results | Land & Plots in Gujarat`}
                        </h1>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2 self-start md:self-auto">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Sort By:</span>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-800 outline-none cursor-pointer focus:border-[#0078d4] shadow-xs"
                        >
                            <option value="recommended">Recommended</option>
                            <option value="newest">Newest First</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                            <option value="views">Most Viewed</option>
                        </select>
                    </div>
                </div>

                {/* 99acres Quick Filter Pills Row */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
                    <button
                        onClick={() => setIsVerifiedOnly(!isVerifiedOnly)}
                        className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all border whitespace-nowrap cursor-pointer shrink-0 ${isVerifiedOnly
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                            }`}
                    >
                        ✓ Verified
                    </button>

                    <button
                        onClick={() => setFilters(prev => ({ ...prev, ownerType: prev.ownerType === 'Owner' ? '' : 'Owner' }))}
                        className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all border whitespace-nowrap cursor-pointer shrink-0 ${filters.ownerType === 'Owner'
                            ? 'bg-[#1a2340] text-[#c9a84c] border-[#1a2340] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                            }`}
                    >
                        Owner
                    </button>

                    <button
                        onClick={() => setFilters(prev => ({ ...prev, roadTouch: !prev.roadTouch }))}
                        className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all border whitespace-nowrap cursor-pointer shrink-0 ${filters.roadTouch
                            ? 'bg-[#0078d4] text-white border-[#0078d4] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                            }`}
                    >
                        Road Touch
                    </button>

                    <button
                        onClick={() => setFilters(prev => ({ ...prev, cornerPlot: !prev.cornerPlot }))}
                        className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all border whitespace-nowrap cursor-pointer shrink-0 ${filters.cornerPlot
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                            }`}
                    >
                        Corner Plot
                    </button>

                    {filters.landType !== 'None' && (
                        <button
                            onClick={() => setFilters(prev => ({ ...prev, landType: 'None' }))}
                            className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-blue-50 text-[#0078d4] border border-blue-200 flex items-center gap-1 shrink-0"
                        >
                            <span>Category: {filters.landType}</span>
                            <X size={12} />
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* Left Sidebar Filter Column */}
                    <div className="hidden lg:block lg:col-span-1">
                        <div className="sticky top-24">
                            {filtersContent}
                        </div>
                    </div>

                    {/* Right Property Cards Column */}
                    <div className="lg:col-span-3 min-w-0 space-y-4">

                        {isError ? (
                            <ErrorBox message={error?.response?.data?.message || error?.message} retry={() => refetch()} />
                        ) : ((isLoading || isFetching) && page === 1 && listings.length === 0) ? (
                            <div className="space-y-4">{[1, 2, 3].map(i => <ListingSkeleton key={i} variant="list" />)}</div>
                        ) : listings.length === 0 ? (
                            <EmptyState onAction={resetFilters} actionText="Clear All Filters" title="No Exact Land Match Found" message="Try broadening your location or budget filters to explore verified parcels." />
                        ) : (
                            <div className="space-y-4">
                                {listings.map((listing, idx) => (
                                    <motion.div
                                        key={listing._id}
                                        initial={{ opacity: 0, y: 8 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.25, delay: idx * 0.04 }}
                                        ref={idx === listings.length - 1 ? lastElementRef : null}
                                        onClick={() => navigate(`/listings/${listing._id}`)}
                                        className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer group flex flex-col md:flex-row gap-5"
                                    >
                                        {/* Image Box (310px width & 210px height exact 99acres aspect ratio) */}
                                        <div className="relative w-full md:w-[310px] h-52 md:h-[210px] rounded-xl overflow-hidden shrink-0 bg-slate-100">
                                            {listing.images?.length > 0 ? (
                                                <img
                                                    src={getImageUrl(listing.images[0])}
                                                    alt={listing.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 font-extrabold text-xs uppercase tracking-wider">
                                                    NO IMAGE AVAILABLE
                                                </div>
                                            )}

                                            {/* Featured Dark Badge */}
                                            {listing.isFeatured && (
                                                <div className="absolute top-3 left-3 bg-[#1a2340] text-[#c9a84c] text-[9px] font-black uppercase px-2.5 py-1 rounded-md shadow-md tracking-wider">
                                                    FEATURED
                                                </div>
                                            )}

                                            {/* Wishlist Heart Icon */}
                                            <button
                                                onClick={e => toggleWishlist(e, listing._id)}
                                                className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-md text-slate-600 hover:text-rose-500 hover:scale-110 active:scale-95 transition-all z-10 cursor-pointer"
                                            >
                                                <Heart size={16} className={wishlist.has(listing._id) ? 'fill-rose-500 text-rose-500' : ''} />
                                            </button>

                                            {/* Bottom Image Overlay Strip */}
                                            {listing.contacts > 0 && (
                                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent px-3 py-2">
                                                    <span className="text-white text-[10px] font-bold flex items-center gap-1">
                                                        <span>🔥 {listing.contacts}+ buyers inquired</span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Info Column */}
                                        <div className="flex-1 flex flex-col justify-between min-w-0 space-y-3">
                                            <div>
                                                {/* Title & Subtitle */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className="text-lg font-black text-slate-900 group-hover:text-[#0078d4] transition-colors line-clamp-1">
                                                            {listing.title}
                                                        </h3>
                                                        <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                                                            <span>{listing.landType || listing.propertyType || 'Plot'}{listing.location ? ` in ${listing.location}` : ''}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Main Specs & Price Row */}
                                                <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2 mt-3.5 pb-3 border-b border-slate-100">
                                                    <div>
                                                        <div className="text-xl sm:text-2xl font-black text-slate-900">
                                                            ₹{listing.price >= 10000000
                                                                ? `${(listing.price / 10000000).toFixed(2)} Cr`
                                                                : (listing.price >= 100000 ? `${(listing.price / 100000).toFixed(1)} Lakh` : listing.price?.toLocaleString('en-IN'))}
                                                        </div>
                                                        <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                                                            {listing.pricePerSqYd ? `₹${listing.pricePerSqYd.toLocaleString()} /sqyd` : (listing.numericArea ? `₹${Math.round(listing.price / listing.numericArea).toLocaleString()} /sqyd` : 'Total Price')}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="text-sm font-bold text-slate-800">{listing.area || 'N/A'}</div>
                                                        <div className="text-[11px] font-semibold text-slate-400 mt-0.5">Total Area</div>
                                                    </div>

                                                    <div>
                                                        <div className="text-sm font-bold text-slate-800">{listing.landType || listing.propertyType || 'Plot'}</div>
                                                        <div className="text-[11px] font-semibold text-slate-400 mt-0.5">Property Type</div>
                                                    </div>
                                                </div>

                                                {/* Highlight Badges */}
                                                {(listing.roadTouch || listing.cornerPlot || listing.isAgricultural) && (
                                                    <div className="mt-3 flex items-center gap-2">
                                                        {listing.roadTouch && (
                                                            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-md">
                                                                ✓ Road Touch
                                                            </span>
                                                        )}
                                                        {listing.cornerPlot && (
                                                            <span className="bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1 rounded-md">
                                                                ★ Corner Plot
                                                            </span>
                                                        )}
                                                        {listing.isAgricultural && (
                                                            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-md">
                                                                🌾 Agricultural
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Description Snippet */}
                                                <p className="text-xs text-slate-500 font-medium mt-2 line-clamp-1">
                                                    {listing.description || `${listing.landType || listing.propertyType || 'Land'} parcel located in ${listing.location || 'prime area'}.`}
                                                </p>
                                            </div>

                                            {/* Seller Info & Action Buttons */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-100 gap-3">
                                                <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-extrabold text-[10px] flex items-center justify-center uppercase">
                                                        {listing.createdBy?.name?.[0] || 'O'}
                                                    </span>
                                                    <span>{listing.ownerType || listing.createdBy?.role || 'Seller'} · {listing.createdBy?.name || 'Owner'}</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            const phone = listing.createdBy?.phone || '';
                                                            if (phone) window.open(`tel:${phone}`);
                                                            else toast.info('Seller number available on property detail page');
                                                        }}
                                                        className="px-4 py-2 border border-[#0078d4] text-[#0078d4] hover:bg-blue-50 font-extrabold text-xs rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        View Number
                                                    </button>

                                                    <button
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            navigate(`/listings/${listing._id}`);
                                                        }}
                                                        className="px-5 py-2 bg-[#0078d4] hover:bg-blue-700 text-white font-extrabold text-xs rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        <Phone size={13} />
                                                        <span>Contact</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}

                                {hasMore && (
                                    <div className="py-6 flex justify-center">
                                        <div className="flex items-center gap-2.5 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-extrabold text-slate-600 shadow-xs">
                                            <div className="w-4 h-4 border-2 border-[#0078d4] border-t-transparent rounded-full animate-spin" />
                                            <span>Loading more verified parcels...</span>
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
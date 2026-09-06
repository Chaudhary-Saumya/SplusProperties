import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MapPin, Search as SearchIcon, Filter, Navigation, Phone, X, Users, Eye, Heart, ChevronDown, SlidersHorizontal, Download, MessageCircle, Share2, ShieldCheck, CheckCircle2, ArrowUpRight, Plus, Sparkles, Building2, Layers, Check, TrendingUp, LandPlot } from 'lucide-react';
import ListingSkeleton from '../components/ListingSkeleton';
import ErrorBox from '../components/ErrorBox';
import EmptyState from '../components/EmptyState';
import { getImageUrl } from '../utils/imageUrl';
import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';
import { getWebsiteBaseUrl } from '../utils/url';
import { formatDisplayArea, getPriceSubtext } from '../utils/formatters';
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

    // Dynamic z-index so dragging one thumb never gets blocked by the other
    let minZIndex = 25;
    let maxZIndex = 26;

    if (activeThumb === 'min') {
        minZIndex = 40;
        maxZIndex = 20;
    } else if (activeThumb === 'max') {
        minZIndex = 20;
        maxZIndex = 40;
    } else if (currentMin > max * 0.7) {
        minZIndex = 30;
        maxZIndex = 20;
    } else if (currentMin === min && currentMax === min) {
        minZIndex = 20;
        maxZIndex = 30;
    }

    return (
        <div className="space-y-3 font-['Nunito_Sans',sans-serif]">
            {/* Sleek Dual Display Header */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex-1 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1.5 shadow-2xs">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Min</span>
                    <span className="text-xs font-black text-slate-900 block truncate">
                        {currentMin === min ? 'Min (Any)' : (formatLabel ? formatLabel(currentMin, currentMin).split('–')[0]?.trim() || `₹${currentMin.toLocaleString('en-IN')}` : `₹${currentMin.toLocaleString('en-IN')}`)}
                    </span>
                </div>
                <span className="text-slate-300 font-bold text-xs shrink-0">to</span>
                <div className="flex-1 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1.5 shadow-2xs">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Max</span>
                    <span className="text-xs font-black text-slate-900 block truncate">
                        {currentMax === max ? 'Max (Any)' : (formatLabel ? formatLabel(currentMax, currentMax).split('–').pop()?.trim() || `₹${currentMax.toLocaleString('en-IN')}` : `₹${currentMax.toLocaleString('en-IN')}`)}
                    </span>
                </div>
                {(currentMin !== min || currentMax !== max) && (
                    <button
                        type="button"
                        onClick={() => {
                            onChangeMin('');
                            onChangeMax('');
                        }}
                        className="px-2 py-1.5 text-[10px] text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 border border-rose-100"
                        title="Reset Range"
                    >
                        Reset
                    </button>
                )}
            </div>

            {/* Precision Range Slider Track */}
            <div className="relative w-full h-8 flex items-center select-none">
                {/* Background Subtle Gray Track */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 bg-slate-200/90 rounded-full pointer-events-none" />

                {/* Active Highlight Gradient Track */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full pointer-events-none shadow-xs transition-all duration-75"
                    style={{
                        left: `${minPercent}%`,
                        width: `${Math.max(0, maxPercent - minPercent)}%`
                    }}
                />

                {/* Min Slider Input */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={currentMin}
                    onMouseDown={() => setActiveThumb('min')}
                    onTouchStart={() => setActiveThumb('min')}
                    onMouseUp={() => setActiveThumb(null)}
                    onTouchEnd={() => setActiveThumb(null)}
                    onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val <= currentMax) {
                            onChangeMin(val === min ? '' : val);
                        }
                    }}
                    className="range-slider-input cursor-pointer"
                    style={{ zIndex: minZIndex }}
                />

                {/* Max Slider Input */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={currentMax}
                    onMouseDown={() => setActiveThumb('max')}
                    onTouchStart={() => setActiveThumb('max')}
                    onMouseUp={() => setActiveThumb(null)}
                    onTouchEnd={() => setActiveThumb(null)}
                    onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val >= currentMin) {
                            onChangeMax(val === max ? '' : val);
                        }
                    }}
                    className="range-slider-input max-thumb cursor-pointer"
                    style={{ zIndex: maxZIndex }}
                />
            </div>

            {/* Bottom Scale Bounds */}
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 px-1 -mt-1">
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
    const { t, language } = useLanguage();
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
                <div className="space-y-3">
                    <DualRangeSlider
                        min={0}
                        max={50000000}
                        step={500000}
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

                    {/* Min & Max Quick Select Dropdowns */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Min Budget</label>
                            <select
                                value={filters.minPrice || ''}
                                onChange={e => {
                                    const val = e.target.value ? Number(e.target.value) : '';
                                    setFilters(prev => {
                                        let nextMax = prev.maxPrice;
                                        if (val !== '' && nextMax !== '' && Number(nextMax) < val) {
                                            nextMax = val;
                                        }
                                        return { ...prev, minPrice: val, maxPrice: nextMax };
                                    });
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-slate-800 outline-none cursor-pointer focus:border-blue-600 focus:bg-white transition-all shadow-2xs"
                            >
                                <option value="">Min Price</option>
                                <option value="500000">₹5 Lakh</option>
                                <option value="1000000">₹10 Lakh</option>
                                <option value="2000000">₹20 Lakh</option>
                                <option value="3000000">₹30 Lakh</option>
                                <option value="5000000">₹50 Lakh</option>
                                <option value="7500000">₹75 Lakh</option>
                                <option value="10000000">₹1 Crore</option>
                                <option value="20000000">₹2 Crore</option>
                                <option value="30000000">₹3 Crore</option>
                                <option value="50000000">₹5 Crore</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Max Budget</label>
                            <select
                                value={filters.maxPrice || ''}
                                onChange={e => {
                                    const val = e.target.value ? Number(e.target.value) : '';
                                    setFilters(prev => {
                                        let nextMin = prev.minPrice;
                                        if (val !== '' && nextMin !== '' && Number(nextMin) > val) {
                                            nextMin = val;
                                        }
                                        return { ...prev, maxPrice: val, minPrice: nextMin };
                                    });
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-slate-800 outline-none cursor-pointer focus:border-blue-600 focus:bg-white transition-all shadow-2xs"
                            >
                                <option value="">Max Price</option>
                                <option value="1000000">₹10 Lakh</option>
                                <option value="2000000">₹20 Lakh</option>
                                <option value="3000000">₹30 Lakh</option>
                                <option value="5000000">₹50 Lakh</option>
                                <option value="7500000">₹75 Lakh</option>
                                <option value="10000000">₹1 Crore</option>
                                <option value="20000000">₹2 Crore</option>
                                <option value="30000000">₹3 Crore</option>
                                <option value="50000000">₹5 Crore</option>
                            </select>
                        </div>
                    </div>

                    {/* Quick Budget Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {[
                            { label: 'Under 25L', min: '', max: 2500000 },
                            { label: '25L - 50L', min: 2500000, max: 5000000 },
                            { label: '50L - 1 Cr', min: 5000000, max: 10000000 },
                            { label: '1 Cr - 3 Cr', min: 10000000, max: 30000000 },
                            { label: '3 Cr+', min: 30000000, max: '' },
                        ].map((chip, i) => {
                            const isSelected = String(filters.minPrice) === String(chip.min) && String(filters.maxPrice) === String(chip.max);
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                        if (isSelected) {
                                            setFilters(p => ({ ...p, minPrice: '', maxPrice: '' }));
                                        } else {
                                            setFilters(p => ({ ...p, minPrice: chip.min, maxPrice: chip.max }));
                                        }
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all border cursor-pointer ${isSelected
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                >
                                    {chip.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </FilterSection>

            <FilterSection title="Plot Area (Sq Ft)" defaultOpen={false}>
                <div className="space-y-3">
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

                    {/* Min & Max Area Select Dropdowns */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Min Area</label>
                            <select
                                value={filters.minArea || ''}
                                onChange={e => {
                                    const val = e.target.value ? Number(e.target.value) : '';
                                    setFilters(prev => {
                                        let nextMax = prev.maxArea;
                                        if (val !== '' && nextMax !== '' && Number(nextMax) < val) {
                                            nextMax = val;
                                        }
                                        return { ...prev, minArea: val, maxArea: nextMax };
                                    });
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-slate-800 outline-none cursor-pointer focus:border-blue-600 focus:bg-white transition-all shadow-2xs"
                            >
                                <option value="">Min Area</option>
                                <option value="500">500 sq ft</option>
                                <option value="1000">1,000 sq ft</option>
                                <option value="2000">2,000 sq ft</option>
                                <option value="5000">5,000 sq ft</option>
                                <option value="10000">10,000 sq ft</option>
                                <option value="20000">20,000 sq ft</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Max Area</label>
                            <select
                                value={filters.maxArea || ''}
                                onChange={e => {
                                    const val = e.target.value ? Number(e.target.value) : '';
                                    setFilters(prev => {
                                        let nextMin = prev.minArea;
                                        if (val !== '' && nextMin !== '' && Number(nextMin) > val) {
                                            nextMin = val;
                                        }
                                        return { ...prev, maxArea: val, minArea: nextMin };
                                    });
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-slate-800 outline-none cursor-pointer focus:border-blue-600 focus:bg-white transition-all shadow-2xs"
                            >
                                <option value="">Max Area</option>
                                <option value="1000">1,000 sq ft</option>
                                <option value="2000">2,000 sq ft</option>
                                <option value="5000">5,000 sq ft</option>
                                <option value="10000">10,000 sq ft</option>
                                <option value="20000">20,000 sq ft</option>
                                <option value="50000">50,000+ sq ft</option>
                            </select>
                        </div>
                    </div>
                </div>
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
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-7 pb-28 sm:pb-16">

                {/* ── Ultra-Clean Tier-1 Search & Filter Header ── */}
                <div className="space-y-3 mb-4 sm:mb-6 font-['Nunito_Sans',sans-serif]">

                    {/* 1. Unified Search Bar + Mobile Filter Trigger */}
                    <div className="flex items-center gap-2">
                        <form
                            onSubmit={e => {
                                e.preventDefault();
                                setSearchTerm(searchInput);
                                setPage(1);
                            }}
                            className="flex-1 flex items-center bg-white border border-slate-200/90 rounded-2xl p-1.5 pl-3.5 shadow-xs focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/15 transition-all"
                        >
                            <SearchIcon size={16} className="text-slate-400 shrink-0 mr-2.5" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                placeholder="Search city, taluka, village (e.g. Sanand, Dholera, Mehsana)..."
                                className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none"
                            />
                            {searchInput && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchInput('');
                                        setSearchTerm('');
                                        setPage(1);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X size={14} />
                                </button>
                            )}

                            {/* GPS Locate Button (Compact) */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (navigator.geolocation) {
                                        setGeoLoading(true);
                                        navigator.geolocation.getCurrentPosition(
                                            pos => {
                                                setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                                                setIsGeoMode(true);
                                                setGeoLoading(false);
                                                toast.success('Showing verified lands near your live GPS location');
                                            },
                                            () => {
                                                setGeoLoading(false);
                                                toast.error('Location permission denied');
                                            }
                                        );
                                    }
                                }}
                                className={`p-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 mr-1 ${isGeoMode
                                        ? 'bg-blue-600 text-white shadow-2xs'
                                        : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'
                                    }`}
                                title="Locate nearby land parcels"
                            >
                                <Navigation size={15} className={geoLoading ? 'animate-spin' : isGeoMode ? 'fill-white' : ''} />
                            </button>

                            <button
                                type="submit"
                                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all shadow-2xs active:scale-95 flex items-center gap-1 cursor-pointer"
                            >
                                <span>Search</span>
                            </button>
                        </form>

                        {/* Mobile Filters Trigger (Drawer Sheet) */}
                        <button
                            type="button"
                            onClick={() => setShowMobileFilters(true)}
                            className="lg:hidden h-11 p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl flex items-center gap-1.5 text-xs font-black uppercase tracking-wider shrink-0 shadow-xs active:scale-95 transition-all cursor-pointer"
                        >
                            <SlidersHorizontal size={18} />
                            {/* <span>Filters</span> */}
                        </button>
                    </div>

                    {/* 2. Single Clean Horizontal Quick Filter & Sort Strip */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden py-0.5">
                        {/* Quick City Dropdown Pill */}
                        {/* <select
                            value={filters.city || ''}
                            onChange={e => {
                                setFilters(prev => ({ ...prev, city: e.target.value }));
                                setPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-black transition-all border outline-none cursor-pointer shrink-0 ${
                                filters.city
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                            }`}
                        >
                            <option value="">📍 All Gujarat</option>
                            <option value="Ahmedabad">📍 Ahmedabad</option>
                            <option value="Dholera">📍 Dholera SIR</option>
                            <option value="Sanand">📍 Sanand</option>
                            <option value="Gandhinagar">📍 Gandhinagar</option>
                            <option value="Mehsana">📍 Mehsana</option>
                            <option value="Palanpur">📍 Palanpur</option>
                            <option value="Surat">📍 Surat</option>
                            <option value="Vadodara">📍 Vadodara</option>
                        </select> */}

                        {/* Verified Pill */}
                        {/* <button
                            type="button"
                            onClick={() => setIsVerifiedOnly(!isVerifiedOnly)}
                            className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all border whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5 ${
                                isVerifiedOnly
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                            }`}
                        >
                            <ShieldCheck size={13} />
                            <span>Verified</span>
                        </button> */}

                        {/* Direct Owner */}
                        {/* <button
                            type="button"
                            onClick={() => setFilters(prev => ({ ...prev, ownerType: prev.ownerType === 'Owner' ? '' : 'Owner' }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all border whitespace-nowrap cursor-pointer shrink-0 ${
                                filters.ownerType === 'Owner'
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                            }`}
                        >
                            Direct Owner
                        </button> */}

                        {/* Agricultural */}
                        <button
                            type="button"
                            onClick={() => setFilters(prev => ({ ...prev, landType: prev.landType === 'Agricultural' ? 'None' : 'Agricultural' }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all border whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5 ${filters.landType === 'Agricultural'
                                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                                }`}
                        >
                            <LandPlot size={13} />
                            <span>Agricultural</span>
                        </button>

                        {/* Residential */}
                        <button
                            type="button"
                            onClick={() => setFilters(prev => ({ ...prev, landType: prev.landType === 'Residential' ? 'None' : 'Residential' }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all border whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5 ${filters.landType === 'Residential'
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                                }`}
                        >
                            <Building2 size={13} />
                            <span>Residential</span>
                        </button>

                        {/* Commercial */}
                        <button
                            type="button"
                            onClick={() => setFilters(prev => ({ ...prev, landType: prev.landType === 'Commercial' ? 'None' : 'Commercial' }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all border whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5 ${filters.landType === 'Commercial'
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                                }`}
                        >
                            <Sparkles size={13} />
                            <span>Commercial</span>
                        </button>

                        {/* Road Touch */}
                        <button
                            type="button"
                            onClick={() => setFilters(prev => ({ ...prev, roadTouch: !prev.roadTouch }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all border whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5 ${filters.roadTouch
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                                }`}
                        >
                            <Check size={13} />
                            <span>Road Touch</span>
                        </button>

                        {/* Sort Dropdown Pill */}
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            className="px-3 py-1.5 rounded-full text-xs font-black bg-white border border-slate-200 text-slate-700 outline-none cursor-pointer shrink-0 hover:border-slate-400 shadow-2xs"
                        >
                            <option value="recommended">⇅ Recommended</option>
                            <option value="newest">⇅ Newest First</option>
                            <option value="price_asc">⇅ Price: Low to High</option>
                            <option value="price_desc">⇅ Price: High to Low</option>
                            <option value="views">⇅ Most Viewed</option>
                        </select>
                    </div>

                    {/* 3. Results Count Summary */}
                    <div className="flex items-center justify-between pt-1">
                        <div className="text-xs sm:text-sm font-extrabold text-slate-600">
                            {isLoading ? 'Searching verified properties...' : (
                                <span>
                                    <strong className="text-slate-900 font-black">{totalResults.toLocaleString('en-IN')} Properties</strong> in {filters.city ? filters.city : 'Gujarat'}
                                </span>
                            )}
                        </div>
                        {(isVerifiedOnly || filters.city || filters.ownerType || filters.landType !== 'None' || filters.roadTouch || filters.cornerPlot) && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="text-[11px] font-black text-blue-600 hover:underline cursor-pointer"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
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
                                {listings.map((listing, idx) => {
                                    const isSold = listing.status === 'Sold';
                                    return (
                                        <motion.div
                                            key={listing._id}
                                            initial={{ opacity: 0, y: 8 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.25, delay: idx * 0.04 }}
                                            ref={idx === listings.length - 1 ? lastElementRef : null}
                                            onClick={() => navigate(`/listings/${listing._id}`)}
                                            className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer group flex flex-col md:flex-row gap-5 overflow-hidden min-w-0"
                                        >
                                            {/* Image Box */}
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

                                                {/* Top Status & Feature Badges */}
                                                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                                                    {isSold ? (
                                                        <div className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-1 rounded-md shadow-md tracking-wider flex items-center gap-1">
                                                            <CheckCircle2 size={12} className="text-slate-950" /> SOLD
                                                        </div>
                                                    ) : listing.isFeatured ? (
                                                        <div className="bg-slate-900 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-md shadow-md tracking-wider">
                                                            FEATURED
                                                        </div>
                                                    ) : null}

                                                    {listing.listingType === 'Verified' && (
                                                        <div className="bg-blue-600 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-md shadow-md tracking-wider flex items-center gap-1">
                                                            <ShieldCheck size={11} /> Verified
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Wishlist Heart Icon */}
                                                <button
                                                    onClick={e => toggleWishlist(e, listing._id)}
                                                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-md text-slate-600 hover:text-rose-500 hover:scale-110 active:scale-95 transition-all z-10 cursor-pointer"
                                                >
                                                    <Heart size={16} className={wishlist.has(listing._id) ? 'fill-rose-500 text-rose-500' : ''} />
                                                </button>

                                                {/* Bottom Image Overlay Strip */}
                                                {!isSold && listing.contacts > 0 && (
                                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent px-3 py-2">
                                                        <span className="text-white text-[10px] font-bold flex items-center gap-1.5">
                                                            <TrendingUp size={12} className="text-amber-400" />
                                                            <span>{listing.contacts}+ buyers inquired</span>
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right Info Column */}
                                            <div className="flex-1 flex flex-col justify-between min-w-0 space-y-3 overflow-hidden">
                                                <div className="min-w-0 w-full">
                                                    {/* Title & Subtitle */}
                                                    <div className="flex items-start justify-between gap-2 min-w-0 w-full">
                                                        <div className="min-w-0 w-full">
                                                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                                                                <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                                                    {listing.title}
                                                                </h3>
                                                                {isSold && (
                                                                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-black uppercase border border-amber-300 shrink-0">
                                                                        Sold
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-1 min-w-0 w-full">
                                                                <MapPin size={13} className="text-blue-600 shrink-0" />
                                                                <span className="truncate block min-w-0 flex-1" title={listing.location ? `${listing.landType || listing.propertyType || 'Plot'} in ${listing.location}` : ''}>
                                                                    {listing.landType || listing.propertyType || 'Plot'}{listing.location ? ` in ${listing.location}` : ''}
                                                                </span>
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
                                                                {getPriceSubtext(listing, language)}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div className="text-sm font-bold text-slate-800">{formatDisplayArea(listing.area, language)}</div>
                                                            <div className="text-[11px] font-semibold text-slate-400 mt-0.5">Total Area</div>
                                                        </div>

                                                        <div>
                                                            <div className="text-sm font-bold text-slate-800">{listing.landType || listing.propertyType || 'Plot'}</div>
                                                            <div className="text-[11px] font-semibold text-slate-400 mt-0.5">Property Type</div>
                                                        </div>
                                                    </div>

                                                    {/* Highlight Badges */}
                                                    {(listing.roadTouch || listing.cornerPlot || listing.isAgricultural) && (
                                                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                                                            {listing.roadTouch && (
                                                                <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 border border-slate-200">
                                                                    <Check size={12} className="text-emerald-600" /> Road Touch
                                                                </span>
                                                            )}
                                                            {listing.cornerPlot && (
                                                                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 border border-blue-200">
                                                                    <Sparkles size={12} className="text-blue-600" /> Corner Plot
                                                                </span>
                                                            )}
                                                            {listing.isAgricultural && (
                                                                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 border border-emerald-200">
                                                                    <LandPlot size={12} className="text-emerald-600" /> Agricultural
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
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-100 gap-3 min-w-0">
                                                    <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 min-w-0 overflow-hidden">
                                                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-extrabold text-[10px] flex items-center justify-center uppercase shrink-0 overflow-hidden border border-slate-200">
                                                            {(listing.createdBy?.profileImage || listing.user?.profileImage) ? (
                                                                <img
                                                                    src={getImageUrl(listing.createdBy?.profileImage || listing.user?.profileImage)}
                                                                    alt={listing.createdBy?.name || listing.user?.name || 'Seller'}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                listing.createdBy?.name?.[0] || listing.user?.name?.[0] || 'O'
                                                            )}
                                                        </span>
                                                        <span className="truncate">{listing.ownerType || listing.createdBy?.role || 'Seller'} · {listing.createdBy?.name || listing.user?.name || 'Owner'}</span>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-2 w-full sm:flex sm:w-auto items-center shrink-0 mt-1 sm:mt-0">
                                                        {isSold ? (
                                                            <>
                                                                <span className="h-9 px-3.5 bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-2xs flex items-center justify-center gap-1 col-span-1 sm:col-auto">
                                                                    <CheckCircle2 size={13} /> Sold
                                                                </span>
                                                                <button
                                                                    onClick={e => {
                                                                        e.stopPropagation();
                                                                        navigate(`/listings/${listing._id}`);
                                                                    }}
                                                                    className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center col-span-2 sm:col-auto"
                                                                >
                                                                    View Details
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={e => {
                                                                        e.stopPropagation();
                                                                        const phone = listing.createdBy?.phone || '';
                                                                        const cleanPhone = phone.replace(/[^0-9]/g, '');
                                                                        const msg = encodeURIComponent(`Hello, I saw your land "${listing.title}" on Kharsan Properties and am interested in exploring it.`);
                                                                        if (cleanPhone) {
                                                                            window.open(`https://wa.me/91${cleanPhone.slice(-10)}?text=${msg}`, '_blank');
                                                                        } else {
                                                                            navigate(`/listings/${listing._id}`);
                                                                        }
                                                                    }}
                                                                    className="h-9 px-2 sm:px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-2xs"
                                                                    title="Chat directly on WhatsApp"
                                                                >
                                                                    <MessageCircle size={14} className="text-emerald-600 shrink-0" />
                                                                    <span>WhatsApp</span>
                                                                </button>

                                                                <button
                                                                    onClick={e => {
                                                                        e.stopPropagation();
                                                                        const phone = listing.createdBy?.phone || '';
                                                                        if (phone) window.open(`tel:${phone}`);
                                                                        else toast.info('Seller number available on property detail page');
                                                                    }}
                                                                    className="h-9 px-2 sm:px-3.5 border border-slate-300 text-slate-700 hover:bg-slate-100 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                                                                >
                                                                    <Phone size={13} className="text-blue-600 shrink-0" />
                                                                    <span>Call</span>
                                                                </button>

                                                                <button
                                                                    onClick={e => {
                                                                        e.stopPropagation();
                                                                        navigate(`/listings/${listing._id}`);
                                                                    }}
                                                                    className="h-9 px-3 sm:px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm active:scale-95"
                                                                >
                                                                    <span>Details</span>
                                                                    <ArrowUpRight size={13} className="shrink-0" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}

                        {hasMore && (
                            <div className="py-6 flex justify-center">
                                <div className="flex items-center gap-2.5 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-extrabold text-slate-600 shadow-xs">
                                    <div className="w-4 h-4 border-2 border-[#0078d4] border-t-transparent rounded-full animate-spin" />
                                    <span>Loading more verified parcels...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Mobile Filters Bottom Sheet Drawer ── */}
            <AnimatePresence>
                {showMobileFilters && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
                        {/* Backdrop Blur */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMobileFilters(false)}
                            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
                        />

                        {/* Bottom Sheet Modal Body */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="relative w-full max-h-[85vh] bg-white rounded-t-[2rem] shadow-2xl flex flex-col z-10 overflow-hidden font-['Nunito_Sans',sans-serif]"
                        >
                            {/* Drawer Header */}
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 sticky top-0 z-10 backdrop-blur-md">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <SlidersHorizontal size={16} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 leading-tight">Filter Properties</h3>
                                        <p className="text-[10px] font-bold text-slate-400">Refine search criteria</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={resetFilters}
                                        className="text-xs font-bold text-blue-600 hover:underline px-2 py-1"
                                    >
                                        Reset All
                                    </button>
                                    <button
                                        onClick={() => setShowMobileFilters(false)}
                                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Filters Content */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {renderFilterSections()}
                            </div>

                            {/* Sticky Footer CTA */}
                            <div className="p-3 border-t border-slate-100 bg-white sticky bottom-0 z-10 shadow-lg pb-[env(safe-area-inset-bottom,12px)]">
                                <button
                                    onClick={() => setShowMobileFilters(false)}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
                                >
                                    <Check size={16} />
                                    <span>Show {totalResults} Properties</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Search;
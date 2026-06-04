import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MapPin, Search as SearchIcon, Filter, Navigation, Phone, X, Users, Eye, Heart, ChevronDown, SlidersHorizontal, Download, MessageCircle } from 'lucide-react';
import ListingSkeleton from '../components/ListingSkeleton';
import ErrorBox from '../components/ErrorBox';
import EmptyState from '../components/EmptyState';
import { getImageUrl } from '../utils/imageUrl';
import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';

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
    const { t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useContext(AuthContext);
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
        isAgricultural: '', // '', 'true', 'false'
        isFeatured: false
    });
    const [debouncedFilters, setDebouncedFilters] = useState(filters);
    const [isGeoMode, setIsGeoMode] = useState(false);
    const [userCoords, setUserCoords] = useState(null);
    const [geoLoading, setGeoLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState('-createdAt');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [wishlist, setWishlist] = useState(new Set());
    const [accumulatedListings, setAccumulatedListings] = useState([]);
    const searchInputRef = useRef(null);

    // ── Hydrate wishlist from authenticated user's saved favorites ──────────
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

    // ── Auto-focus search input when navigated from Home mobile search bar ──
    useEffect(() => {
        if (location.state?.autoFocus && searchInputRef.current) {
            // Small delay to let the page finish rendering before focusing
            const timer = setTimeout(() => {
                searchInputRef.current?.focus();
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [location.state?.autoFocus]);

    const isFirstRender = useRef(true);

    const { data: resultData, isLoading, isError, error, refetch, isFetching } = useQuery({
        queryKey: ['listings', searchTerm, isVerifiedOnly, debouncedFilters, sortBy, isGeoMode, userCoords, page],
        queryFn: async () => {
            let url = `/api/listings?page=${page}&limit=12&sort=${sortBy}`;
            if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
            if (isVerifiedOnly) url += `&listingType=Verified`;

            // Map active filters dynamically
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

    // Accumulate listings for infinite scroll
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

        // Synchronize search term
        const q = params.get('query') || '';
        setSearchTerm(q);
        setSearchInput(q);

        // Synchronize filters from URL parameters or defaults
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

        setFilters(prev => {
            const hasChanged =
                prev.minPrice !== minPrice ||
                prev.maxPrice !== maxPrice ||
                prev.minArea !== minArea ||
                prev.maxArea !== maxArea ||
                prev.city !== city ||
                prev.locality !== locality ||
                prev.propertyType !== propType ||
                prev.plotType !== plotT ||
                prev.landType !== landT ||
                prev.ownerType !== ownerType ||
                prev.roadTouch !== roadTouch ||
                prev.cornerPlot !== cornerPlot ||
                prev.isAgricultural !== isAgricultural ||
                prev.isFeatured !== isFeatured;

            if (!hasChanged) return prev;
            return {
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
            };
        });

        const isVerifiedVal = listingType === 'Verified';
        setIsVerifiedOnly(prev => prev === isVerifiedVal ? prev : isVerifiedVal);
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
                () => { toast.warning(t('search_page.location_denied')); setGeoLoading(false); }
            );
        } else { toast.error(t('search_page.geo_not_supported')); }
    };

    const toggleWishlist = async (e, id) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            toast.info(t('search_page.login_to_save'));
            navigate('/login');
            return;
        }
        const wasAdded = !wishlist.has(id);
        // Optimistic update
        setWishlist(prev => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });
        try {
            const res = await axios.post(`/api/auth/favorites/${id}`);
            // Sync user.favorites in context so page reloads stay consistent
            if (user && res.data?.data) {
                user.favorites = res.data.data;
                // Re-hydrate the wishlist set from authoritative server state
                const ids = res.data.data.map(fav =>
                    typeof fav === 'string' ? fav : (fav?._id || fav?.id)
                ).filter(Boolean);
                setWishlist(new Set(ids));
            }
            toast.success(wasAdded ? t('search_page.added_to_favorites') : t('search_page.removed_from_favorites'));
        } catch (err) {
            // Revert optimistic update on error
            setWishlist(prev => {
                const s = new Set(prev);
                wasAdded ? s.delete(id) : s.add(id);
                return s;
            });
            toast.error(t('search_page.failed_favorites'));
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
            isFeatured: false
        });
        setIsVerifiedOnly(false);
    };

    const inputClass = "w-full px-3 py-2.5 bg-[#fdfaf5] border border-[#e2d9c5] rounded-lg text-sm font-bold text-[#1a2340] placeholder-[#b0a898] focus:outline-none focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/20 transition-all";

    /* ── Render Filter Sections ── */
    const renderFilterSections = () => (
        <>
            <FilterSection title={t('search_page.property_category')} defaultOpen={false}>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setFilters(prev => ({ ...prev, propertyType: prev.propertyType === 'Plot' ? '' : 'Plot', plotType: 'None', landType: 'None' }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${filters.propertyType === 'Plot'
                                ? 'bg-[#1a2340] text-[#c9a84c] border-[#1a2340]'
                                : 'bg-white text-[#1a2340]/75 border-[#e2d9c5] hover:border-[#1a2340]'
                            }`}
                    >
                        {t('search_page.plots')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilters(prev => ({ ...prev, propertyType: prev.propertyType === 'Land' ? '' : 'Land', plotType: 'None', landType: 'None' }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${filters.propertyType === 'Land'
                                ? 'bg-[#1a2340] text-[#c9a84c] border-[#1a2340]'
                                : 'bg-white text-[#1a2340]/75 border-[#e2d9c5] hover:border-[#1a2340]'
                            }`}
                    >
                        {t('search_page.lands')}
                    </button>
                </div>
            </FilterSection>

            {filters.propertyType === 'Plot' && (
                <FilterSection title={t('search_page.plot_subtype')} defaultOpen={false}>
                    <select
                        value={filters.plotType}
                        onChange={e => setFilters(prev => ({ ...prev, plotType: e.target.value }))}
                        className={inputClass}
                    >
                        <option value="None">{t('search_page.all_plot_types')}</option>
                        <option value="Residential">{t('search_page.residential')}</option>
                        <option value="Commercial">{t('search_page.commercial')}</option>
                        <option value="Industrial">{t('search_page.industrial')}</option>
                        <option value="Agricultural">{t('search_page.agricultural')}</option>
                        <option value="Other">{t('search_page.other')}</option>
                    </select>
                </FilterSection>
            )}

            {filters.propertyType === 'Land' && (
                <FilterSection title={t('search_page.land_subtype')} defaultOpen={false}>
                    <select
                        value={filters.landType}
                        onChange={e => setFilters(prev => ({ ...prev, landType: e.target.value }))}
                        className={inputClass}
                    >
                        <option value="None">{t('search_page.all_land_types')}</option>
                        <option value="Agricultural">{t('search_page.agricultural')}</option>
                        <option value="Non-Agricultural">{t('search_page.non_agricultural')}</option>
                        <option value="Industrial">{t('search_page.industrial')}</option>
                        <option value="Commercial">{t('search_page.commercial')}</option>
                        <option value="Other">{t('search_page.other')}</option>
                    </select>
                </FilterSection>
            )}

            <FilterSection title={t('search_page.location_tiers')} defaultOpen={false}>
                <div className="space-y-2">
                    <input
                        type="text"
                        placeholder={t('search_page.city_placeholder')}
                        value={filters.city}
                        onChange={e => setFilters(prev => ({ ...prev, city: e.target.value }))}
                        className={inputClass}
                    />
                    <input
                        type="text"
                        placeholder={t('search_page.locality_placeholder')}
                        value={filters.locality}
                        onChange={e => setFilters(prev => ({ ...prev, locality: e.target.value }))}
                        className={inputClass}
                    />
                </div>
            </FilterSection>

            <FilterSection title={t('search_page.budget')} defaultOpen={false}>
                <div className="space-y-2">
                    <div className="relative">
                       <span className="absolute left-3 top-2.5 text-[#9ca3af] font-bold text-xs">₹</span>
                       <input type="number" placeholder={t('search_page.min_price')} value={filters.minPrice} onChange={e => setFilters(p => ({ ...p, minPrice: e.target.value }))} className={`${inputClass} pl-7`} />
                    </div>
                    <div className="relative">
                       <span className="absolute left-3 top-2.5 text-[#9ca3af] font-bold text-xs">₹</span>
                       <input type="number" placeholder={t('search_page.max_price')} value={filters.maxPrice} onChange={e => setFilters(p => ({ ...p, maxPrice: e.target.value }))} className={`${inputClass} pl-7`} />
                    </div>
                </div>
            </FilterSection>

            <FilterSection title={t('search_page.area_sqft_acres')} defaultOpen={false}>
                <div className="space-y-2">
                    <input type="number" placeholder={t('search_page.min_area')} value={filters.minArea} onChange={e => setFilters(p => ({ ...p, minArea: e.target.value }))} className={inputClass} />
                    <input type="number" placeholder={t('search_page.max_area')} value={filters.maxArea} onChange={e => setFilters(p => ({ ...p, maxArea: e.target.value }))} className={inputClass} />
                </div>
            </FilterSection>

            <FilterSection title={t('search_page.attributes')} defaultOpen={true}>
                <div className="space-y-3">
                    {filters.propertyType === 'Plot' && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#1a2340]/75">{t('search_page.corner_plot')}</span>
                            <Toggle checked={filters.cornerPlot} onChange={val => setFilters(prev => ({ ...prev, cornerPlot: val }))} />
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1a2340]/75">{t('search_page.road_touch')}</span>
                        <Toggle checked={filters.roadTouch} onChange={val => setFilters(prev => ({ ...prev, roadTouch: val }))} />
                    </div>
                    {filters.propertyType === 'Plot' && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#1a2340]/75">{t('search_page.agricultural_plot')}</span>
                            <Toggle
                                checked={filters.isAgricultural === 'true' || filters.isAgricultural === true}
                                onChange={val => setFilters(prev => ({ ...prev, isAgricultural: val ? 'true' : '' }))}
                            />
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1a2340]/75">{t('search_page.verified_only')}</span>
                        <Toggle checked={isVerifiedOnly} onChange={setIsVerifiedOnly} />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1a2340]/75">{t('search_page.featured_only')}</span>
                        <Toggle checked={filters.isFeatured} onChange={val => setFilters(prev => ({ ...prev, isFeatured: val }))} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#1a2340]/50 uppercase tracking-widest">{t('search_page.creator_type')}</label>
                        <select
                            value={filters.ownerType}
                            onChange={e => setFilters(prev => ({ ...prev, ownerType: e.target.value }))}
                            className={inputClass}
                        >
                            <option value="">{t('search_page.any_creator')}</option>
                            <option value="Owner">{t('search_page.owner')}</option>
                            <option value="Broker">{t('search_page.builder_broker')}</option>
                        </select>
                    </div>
                </div>
            </FilterSection>
        </>
    );

    /* ── Sidebar Filters ── */
    const filtersContent = (
        <div className="bg-white border border-[#e2d9c5] rounded-xl shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 150px)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0ebe0] flex-shrink-0">
                <h3 className="text-sm font-bold text-[#1a2340] uppercase tracking-widest flex items-center gap-2">
                    <SlidersHorizontal size={15} className="text-[#c9a84c]" /> {t('search_page.filters')}
                </h3>
                <button onClick={resetFilters} className="text-xs font-bold text-[#c9a84c] hover:underline">{t('search_page.reset_all')}</button>
            </div>

            <div className="px-5 divide-y divide-[#f0ebe0] overflow-y-auto scrollbar-thin scrollbar-thumb-[#c9a84c]/20 scrollbar-track-transparent" style={{ flex: 1 }}>
                {renderFilterSections()}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8f5ee]" style={{ fontFamily: "'Nunito Sans', sans-serif" }}>
            <SEO 
                title={t('search_page.title')} 
                description={t('search_page.description')} 
            />
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Nunito+Sans:wght@400;500;600;700;800&display=swap');`}</style>

            {/* ── Gold top bar ── */}
            <div className="h-1 w-full bg-gradient-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c]" />

            {/* ── Sticky Search Bar ── */}
            <div className="sticky z-30 bg-white/80 backdrop-blur-md border-b border-[#e2d9c5]/50 shadow-sm transition-all duration-300" style={{ top: 'var(--navbar-height)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                        {/* Search Input Group */}
                        <div className="flex flex-1 items-center bg-[#fdfaf5] border-2 border-[#e2d9c5] focus-within:border-[#c9a84c] focus-within:ring-2 focus-within:ring-[#c9a84c]/20 rounded-lg px-3 py-2 transition-all gap-2 relative">
                            {isFetching ? (
                                <div className="w-4 h-4 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                            ) : (
                                <SearchIcon size={18} className="text-[#c9a84c] flex-shrink-0" />
                            )}
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder={isGeoMode ? t('search_page.searching_near_you') : t('search_page.search_placeholder')}
                                className="flex-1 bg-transparent border-none outline-none text-[#1a2340] font-bold text-sm placeholder-[#b0a898] w-full"
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
                                                    <MapPin size={10} /> {s.plotNumber ? `Plot: ${s.plotNumber}, ` : ''}{s.areaName ? `Area: ${s.areaName}, ` : ''}{s.location}
                                                </div>
                                            </div>
                                            <div className="text-sm font-black text-[#c9a84c]">₹{s.price?.toLocaleString('en-IN')}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions Group */}
                        <div className="flex items-center gap-2">
                            {/* Near Me */}
                            <button
                                onClick={triggerGeoSearch}
                                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm border transition-all whitespace-nowrap ${isGeoMode ? 'bg-[#c9a84c] text-[#1a1200] border-[#c9a84c]' : 'bg-white text-[#1a2340] border-[#e2d9c5] hover:border-[#1a2340]'}`}
                            >
                                <Navigation size={15} className={geoLoading ? 'animate-spin' : ''} />
                                <span>{isGeoMode ? t('search_page.near_me_active') : t('search_page.near_me')}</span>
                            </button>

                            {/* Search Button */}
                            <button
                                onClick={() => setSearchTerm(searchInput)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1a2340] hover:bg-[#c9a84c] hover:text-[#1a1200] text-white rounded-lg font-bold text-sm transition-all whitespace-nowrap"
                            >
                                <SearchIcon size={15} /> {t('search_page.search_btn')}
                            </button>

                            {/* Mobile Filter Toggle */}
                            <button
                                onClick={() => setShowMobileFilters(!showMobileFilters)}
                                className="lg:hidden flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white border border-[#e2d9c5] rounded-lg font-bold text-sm text-[#1a2340] hover:border-[#1a2340]"
                            >
                                <Filter size={15} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Mobile Filter Drawer ── */}
            {showMobileFilters && (
                <div className="fixed inset-0 z-50 bg-[#1a2340]/60 backdrop-blur-xs flex items-end justify-center transition-opacity" onClick={() => setShowMobileFilters(false)}>
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 220 }}
                        className="bg-white rounded-t-[2rem] w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Drag Handle Indicator */}
                        <div className="w-12 h-1 bg-[#e2d9c5] rounded-full mx-auto my-3 flex-shrink-0" />

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-3 border-b border-[#f0ebe0] flex-shrink-0">
                            <h3 className="text-sm font-black text-[#1a2340] uppercase tracking-widest flex items-center gap-2">
                                <SlidersHorizontal size={15} className="text-[#c9a84c]" /> {t('search_page.filters')}
                            </h3>
                            <div className="flex items-center gap-4">
                                <button onClick={resetFilters} className="text-xs font-bold text-[#c9a84c] hover:underline">{t('search_page.reset_all')}</button>
                                <button onClick={() => setShowMobileFilters(false)} className="text-[#9ca3af] hover:text-[#1a2340] p-1">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="px-6 pb-8 divide-y divide-[#f0ebe0] overflow-y-auto flex-1 scrollbar-thin">
                            {renderFilterSections()}
                        </div>
                    </motion.div>
                </div>
            )}

            {/* ── Main Layout ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="flex gap-6">

                    {/* ── Left Sidebar ── */}
                    <div className="hidden lg:block w-64 flex-shrink-0">
                        <div className="sticky top-32">
                            {filtersContent}
                        </div>
                    </div>

                    {/* ── Results ── */}
                    <div className="flex-1 min-w-0">

                        {/* Results Header */}
                        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-[#1a2340]">
                                    {isLoading ? t('search_page.searching') : `${totalResults.toLocaleString('en-IN')} ${t('search_page.properties_found')}`}
                                </h2>
                                {isGeoMode && (
                                    <p className="text-xs text-[#c9a84c] font-bold mt-0.5">{t('search_page.showing_near_location')}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider">{t('search_page.sort_by')}</span>
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value)}
                                    className="text-sm font-bold text-[#1a2340] bg-white border border-[#e2d9c5] rounded-lg px-3 py-2 focus:outline-none focus:border-[#c9a84c] cursor-pointer"
                                >
                                    <option value="trending">{t('search_page.sort_trending')}</option>
                                    <option value="-createdAt">{t('search_page.sort_newest')}</option>
                                    <option value="price">{t('search_page.sort_price_low')}</option>
                                    <option value="-price">{t('search_page.sort_price_high')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Cards */}
                        {isError ? (
                            <ErrorBox message={error?.response?.data?.message || error?.message} retry={() => refetch()} />
                        ) : ((isLoading || isFetching) && page === 1 && listings.length === 0) ? (
                            <div className="space-y-4">{[1, 2, 3].map(i => <ListingSkeleton key={i} variant="list" />)}</div>
                        ) : (listings.length === 0 && (!resultData || (resultData.data && resultData.data.length === 0))) ? (
                            <EmptyState onAction={resetFilters} actionText={t('search_page.clear_all_filters')} title={t('search_page.no_properties_found')} message={t('search_page.try_adjusting')} />
                        ) : (
                            <div className="space-y-4">
                                {listings.map((listing, idx) => (
                                    <motion.div
                                        key={listing._id}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                                        ref={idx === listings.length - 1 ? lastElementRef : null}
                                        onClick={() => navigate(`/listings/${listing._id}`)}
                                        className="bg-white border border-[#e2d9c5] hover:border-[#c9a84c] rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg group flex flex-row h-[145px] sm:h-auto sm:min-h-[180px]"
                                    >
                                        {/* Image */}
                                        <div className="relative flex-shrink-0 overflow-hidden bg-[#e5e7eb] w-[125px] sm:w-[260px] h-full sm:h-auto">
                                            {listing.images?.length > 0 ? (
                                                <img
                                                    src={getImageUrl(listing.images[0])}
                                                    alt={listing.title}
                                                    loading="lazy"
                                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 w-full h-full flex items-center justify-center text-[#9ca3af] text-[10px] sm:text-xs font-bold uppercase tracking-widest">{t('search_page.no_image')}</div>
                                            )}

                                            {/* Badges */}
                                            <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                                                {listing.status === 'Reserved' && (
                                                    <span className="bg-[#dc2626] text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded uppercase tracking-wider">{t('search_page.reserved')}</span>
                                                )}
                                            </div>

                                            {/* Wishlist & WhatsApp */}
                                            <div className="absolute top-2 right-2 flex flex-col gap-1.5 sm:gap-2">
                                                <button
                                                    onClick={e => toggleWishlist(e, listing._id)}
                                                    className="w-7 h-7 sm:w-8 sm:h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all"
                                                >
                                                    <Heart size={12} className={wishlist.has(listing._id) ? 'fill-red-500 text-red-500' : 'text-[#6b7280]'} />
                                                </button>
                                                <button
                                                    className="w-7 h-7 sm:w-8 sm:h-8 bg-[#25d366] rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        const phone = listing.createdBy?.phone || '';
                                                        window.open(`https://wa.me/${phone}`, '_blank');
                                                    }}
                                                    title={t('search_page.whatsapp_seller')}
                                                >
                                                    <MessageCircle size={12} className="fill-current" />
                                                </button>
                                                <button
                                                    className="sm:hidden w-7 h-7 bg-[#1a2340] rounded-full flex items-center justify-center text-[#c9a84c] shadow-lg active:scale-95 transition-all"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        const phone = listing.createdBy?.phone || '';
                                                        window.open(`tel:${phone}`);
                                                    }}
                                                    title={t('search_page.contact')}
                                                >
                                                    <Phone size={11} />
                                                </button>
                                            </div>

                                            {/* Bottom overlay */}
                                            <div className="hidden sm:block absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
                                                <p className="text-white text-[10px] font-600">
                                                    {t('search_page.listed_on')} <strong>{new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 flex flex-col justify-between p-3 sm:p-5 min-w-0 relative">
                                            {/* NEW LISTING ribbon */}
                                            {listing.status !== 'Reserved' && (
                                                <div className="hidden sm:block absolute top-0 right-0 bg-[#2563eb] text-white text-[8px] sm:text-[9px] font-bold px-2 py-0.5 sm:px-3 sm:py-1 uppercase tracking-widest"
                                                    style={{ clipPath: 'polygon(10px 0%, 100% 0%, 100% 100%, 0% 100%)' }}>
                                                    {t('search_page.new_listing')}
                                                </div>
                                            )}

                                            <div>
                                                {/* Title */}
                                                <h3 className="text-sm sm:text-lg font-bold text-[#1a2340] group-hover:text-[#c9a84c] transition-colors leading-tight mb-0.5 sm:mb-1 pr-14 sm:pr-20 line-clamp-1">
                                                    {listing.title}
                                                </h3>

                                                {/* Subtitle */}
                                                <p className="text-[11px] sm:text-sm text-[#6b7280] font-600 mb-1 sm:mb-2 line-clamp-1">
                                                    <strong className="text-[#1a2340]">{listing.propertyType ? (listing.propertyType === 'Plot' ? t('search_page.plots') : t('search_page.lands')) : t('search_page.plot_or_land')}</strong> in {listing.plotNumber ? `${listing.plotNumber}, ` : ''}{listing.areaName ? `${listing.areaName}, ` : ''}{listing.location}
                                                </p>

                                                {/* Price + Area boxes */}
                                                <div className="flex items-baseline gap-2 sm:gap-4 mb-1 sm:mb-3">
                                                    <div className="text-sm sm:text-lg font-black text-[#1a2340]">
                                                        ₹{listing.price?.toLocaleString('en-IN')}
                                                    </div>
                                                    <div className="text-[10px] sm:text-xs font-bold text-[#c9a84c] bg-[#c9a84c]/10 px-1.5 py-0.5 rounded">
                                                        {listing.area || '—'}
                                                    </div>
                                                </div>

                                                {/* Location */}
                                                <p className="flex items-center gap-1 text-[10px] sm:text-xs text-[#6b7280] font-600 mb-1 sm:mb-3 line-clamp-1">
                                                    <MapPin size={10} className="text-[#c9a84c] sm:w-3 sm:h-3" /> {listing.plotNumber ? `${listing.plotNumber}, ` : ''}{listing.areaName ? `${listing.areaName}, ` : ''}{listing.location}
                                                </p>

                                                {/* Stats */}
                                                <div className="hidden sm:flex gap-2 flex-wrap mb-3">
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#dc2626] bg-[#fff0f0] border border-[#fecaca] px-2 py-1 rounded">
                                                        <Users size={9} /> {listing.contacts || 0}+ {t('search_page.showings')}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#1d4ed8] bg-[#eff6ff] border border-[#bfdbfe] px-2 py-1 rounded">
                                                        <Eye size={9} /> {listing.views || 0} {t('search_page.views')}
                                                    </span>
                                                </div>

                                                {/* Description */}
                                                <p className="hidden sm:block text-xs text-[#9ca3af] font-500 leading-relaxed line-clamp-2">
                                                    {listing.description || t('search_page.no_desc')}
                                                </p>
                                            </div>

                                            {/* Footer */}
                                            <div className="hidden sm:flex items-center justify-between pt-3 border-t border-[#f0ebe0] mt-3">
                                                <div
                                                    onClick={e => { e.stopPropagation(); navigate(`/seller/${listing.createdBy?._id || listing.createdBy}`); }}
                                                    className="flex items-center gap-2 cursor-pointer min-w-0"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-[#1a2340] flex items-center justify-center text-[#c9a84c] font-black text-xs flex-shrink-0">
                                                        {listing.createdBy?.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-bold text-[#6b7280] uppercase tracking-wider leading-none">
                                                            {listing.createdBy?.role === 'Broker' ? 'Builder' : listing.createdBy?.role || 'Seller'}
                                                        </div>
                                                        <div className="text-sm font-black text-[#1a2340] truncate">
                                                            {listing.createdBy?.name || 'Authorized Seller'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 flex-shrink-0">
                                                    <button
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            const phone = listing.createdBy?.phone || '';
                                                            window.open(`tel:${phone}`);
                                                        }}
                                                        className="flex items-center gap-1 px-3 py-2 bg-white border border-[#e2d9c5] hover:border-[#1a2340] text-[#1a2340] rounded-lg text-xs font-bold transition-all"
                                                    >
                                                        <Phone size={12} strokeWidth={2.5} /> <span>{t('search_page.contact')}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}

                                {/* Infinite scroll loader */}
                                {hasMore && (
                                    <div className="py-8 flex justify-center">
                                        <div className="flex items-center gap-3 px-6 py-3 bg-white border border-[#e2d9c5] rounded-xl text-sm font-bold text-[#9ca3af]">
                                            <div className="w-4 h-4 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
                                            {t('search_page.loading_more')}
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
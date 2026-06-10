import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import {
    UploadCloud, MapPin, Tag, Navigation, Target, Maximize, X, Building2,
    IndianRupee, Layers, FileText, CreditCard, ChevronRight, ZapOff,
    LayoutDashboard, Eye, Edit3, PanelRightClose, PanelRightOpen, ExternalLink,
    PlusCircle, Sparkles, Search as SearchIcon
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLanguage } from '../context/LanguageContext';

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

function MapSearch({ onSelect }) {
    const { t } = useLanguage();
    const [query, setQuery] = useState('');
    const [mapSuggestions, setMapSuggestions] = useState([]);
    const [showMapSuggestions, setShowMapSuggestions] = useState(false);

    useEffect(() => {
        const t = setTimeout(async () => {
            if (query.length > 2) {
                try {
                    const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
                    setMapSuggestions(res.data);
                    setShowMapSuggestions(true);
                } catch (e) { console.error(e); }
            } else {
                setMapSuggestions([]);
                setShowMapSuggestions(false);
            }
        }, 600);
        return () => clearTimeout(t);
    }, [query]);

    return (
        <div className="absolute top-4 left-4 z-[1000] w-64 md:w-80">
            <div className="relative">
                <div className="flex items-center bg-white rounded-xl shadow-xl border border-[#1a2340]/10 overflow-hidden">
                    <div className="pl-4 text-[#1a2340]/40"><SearchIcon size={14} /></div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('create_listing.search_map_placeholder')}
                        className="w-full px-3 py-3 text-xs font-bold text-[#1a2340] outline-none placeholder:text-[#1a2340]/30"
                    />
                </div>
                {showMapSuggestions && mapSuggestions.length > 0 && (
                    <ul className="absolute top-full left-0 w-full bg-white mt-1 rounded-xl shadow-2xl border border-[#1a2340]/10 overflow-hidden max-h-60 overflow-y-auto">
                        {mapSuggestions.map((s, idx) => (
                            <li
                                key={idx}
                                onClick={() => {
                                    const coords = { lat: parseFloat(s.lat), lng: parseFloat(s.lon) };
                                    onSelect(coords, s.display_name);
                                    setQuery(s.display_name.split(',')[0]);
                                    setShowMapSuggestions(false);
                                }}
                                className="px-4 py-3 hover:bg-[#f8f5ee] cursor-pointer border-b border-[#f8f5ee] last:border-0"
                            >
                                <p className="text-xs font-black text-[#1a2340]">{s.display_name.split(',')[0]}</p>
                                <p className="text-[10px] text-[#1a2340]/40 font-medium truncate">{s.display_name}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

async function reverseGeocode(lat, lng) {
    try {
        const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        return res.data.display_name;
    } catch (e) {
        console.error("Reverse geocoding error", e);
        return null;
    }
}

function LocationMarker({ position, setPosition, setLocation }) {
    useMapEvents({
        async click(e) {
            setPosition(e.latlng);
            const address = await reverseGeocode(e.latlng.lat, e.latlng.lng);
            if (address) setLocation(address);
        },
    });
    return position === null ? null : <Marker position={position}></Marker>;
}

function MapRecenter({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position?.lat) {
            map.setView([position.lat, position.lng], 14);
        }
    }, [position, map]);
    return null;
}

// Step indicator pill
const StepPill = ({ number, label, active, done }) => (
    <div className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all border ${done ? 'bg-[#c9a84c] text-[#1a2340] border-[#c9a84c]'
            : active ? 'bg-[#1a2340] text-[#c9a84c] border-[#1a2340]'
                : 'bg-transparent text-[#1a2340]/40 border-[#1a2340]/20'
        }`}>
        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${done ? 'bg-[#1a2340] text-[#c9a84c]'
                : active ? 'bg-[#c9a84c] text-[#1a2340]'
                    : 'bg-[#1a2340]/10 text-[#1a2340]/40'
            }`}>{done ? '✓' : number}</span>
        {label}
    </div>
);

// Section card wrapper
const SectionCard = ({ icon, title, subtitle, children, accent, className = "" }) => (
    <div className={`relative bg-white rounded-3xl border border-[#1a2340]/10 shadow-sm transition-all hover:shadow-md ${className}`}>
        <div className="flex items-start gap-3 sm:gap-4 px-4 sm:px-7 pt-5 sm:pt-6 pb-4 sm:pb-5 border-b border-[#f8f5ee]">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${accent ? 'bg-[#c9a84c]' : 'bg-[#1a2340]'}`}>
                {React.cloneElement(icon, { size: 16, className: accent ? 'text-[#1a2340]' : 'text-[#c9a84c]' })}
            </div>
            <div>
                <h3 className="font-extrabold text-[#1a2340] text-sm sm:text-base uppercase tracking-widest leading-tight">{title}</h3>
                {subtitle && <p className="text-[#1a2340]/50 text-[10px] sm:text-xs font-medium mt-0.5">{subtitle}</p>}
            </div>
        </div>
        <div className="px-4 sm:px-7 py-5 sm:py-6">{children}</div>
    </div>
);

const inputCls = "w-full px-5 py-3.5 rounded-xl border border-[#1a2340]/15 bg-[#f8f5ee]/60 focus:ring-2 focus:ring-[#c9a84c]/40 focus:border-[#c9a84c] outline-none transition-all font-semibold text-[#1a2340] text-base placeholder:text-[#1a2340]/30";
const labelCls = "block text-[10px] font-black text-[#1a2340]/50 mb-2 uppercase tracking-[0.15em]";

const unitLabels = {
    en: {
        guntha: 'Guntha (Gutha)',
        hectare: 'Hectare (Hector)',
        aare: 'Aare',
        vigha_bada: 'Bigha (23.78 Gutha)',
        vigha_chhota: 'Bigha (16.19 Gutha)',
        acre: 'Acre',
        sqm: 'Square Meter (Sq.Mt)',
        sqft: 'Square Feet (Sqft)',
        gaj: 'Gaj / Yard / Vaar',
    },
    gu: {
        guntha: 'ગુન્ટા',
        hectare: 'હેક્ટર',
        aare: 'આરે',
        vigha_bada: 'વીઘું (મોટું - ૨૩.૭૮ ગુન્ટા)',
        vigha_chhota: 'વીઘું (નાનું - ૧૬.૧૯ ગુન્ટા)',
        acre: 'એકર',
        sqm: 'ચોરસ મીટર',
        sqft: 'ચોરસ ફૂટ',
        gaj: 'ગજ / વાર',
    }
};

const toBase = {
    guntha: 1,
    hectare: 98.84,
    aare: 0.98,
    vigha_bada: 23.78,
    vigha_chhota: 16.19,
    acre: 40,
    sqm: 0.0098,
    sqft: 1/1089,
    gaj: 9/1089,
};

const CreateListing = () => {
    const { user } = useContext(AuthContext);
    const { language, t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showSidebar, setShowSidebar] = useState(true);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        location: '',
        plotNumber: '',
        areaName: '',
        listingType: 'Verified',
        isBookingEnabled: false,
        tokenAmount: '',
        payoutAccountId: '',
        locationMode: 'address',
        mapCoordinates: { lat: null, lng: null },
        mapBounds: null,
        propertyType: 'Plot',
        plotType: 'None',
        landType: 'None',
        isAgricultural: false,
        roadTouch: false,
        cornerPlot: false,
        isFeatured: false,
        city: '',
        locality: ''
    });
    const [payoutAccounts, setPayoutAccounts] = useState([]);
    const [locationMethod, setLocationMethod] = useState('address');
    const [areaValue, setAreaValue] = useState('');
    const [areaUnit, setAreaUnit] = useState('sqft');
    const [images, setImages] = useState(null);

    const { data: systemSettings } = useQuery({
        queryKey: ['systemSettings'],
        queryFn: async () => {
            const res = await axios.get('/api/settings');
            return res.data.data;
        }
    });

    const { data: myListingsData } = useQuery({
        queryKey: ['myListings', user?._id],
        enabled: !!user,
        queryFn: async () => {
            const res = await axios.get('/api/listings/mine');
            return res.data.data;
        }
    });

    const getImageUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${axios.defaults.baseURL}${path}`;
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const detectMyLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                setLocationMethod('map');
                setFormData(prev => ({
                    ...prev,
                    mapCoordinates: { lat: latitude, lng: longitude },
                    locationMode: 'map',
                    mapBounds: null
                }));
                toast.success('GPS location detected! Pin placed on map.');
            }, () => {
                toast.warning('Location access denied or failed.');
            });
        } else {
            toast.error('Geolocation is not supported by your browser.');
        }
    };


    useEffect(() => {
        axios.get('/api/auth/me')
            .then(res => {
                const accounts = res.data.data.paymentAccounts || [];
                setPayoutAccounts(accounts);
                if (accounts.length > 0 && !formData.payoutAccountId) {
                    setFormData(prev => ({ ...prev, payoutAccountId: accounts[0]._id }));
                }
            })
            .catch(err => console.error('Failed to fetch payout accounts:', err));
    }, [formData.payoutAccountId]);

    const getCalculatedRates = () => {
        const p = parseFloat(formData.price);
        const a = parseFloat(areaValue);
        if (isNaN(p) || isNaN(a) || p <= 0 || a <= 0) return null;

        const currentLang = language === 'gu' ? 'gu' : 'en';
        const rateForSelected = p / a;
        const selectedLabel = unitLabels[currentLang][areaUnit] || areaUnit;

        return {
            selected: {
                label: selectedLabel,
                rate: rateForSelected
            }
        };
    };

    const rateResults = getCalculatedRates();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            let uploadedImagePaths = [];
            if (images && images.length > 0) {
                for (let i = 0; i < images.length; i++) {
                    const imgData = new FormData();
                    imgData.append('file', images[i]);
                    const uploadRes = await axios.post('/api/uploads', imgData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    if (uploadRes.data.success) {
                        uploadedImagePaths.push(uploadRes.data.data);
                    }
                }
            }
            let finalLocation = formData.location;
            // Only use explicit map pin coords — never auto-geocode from address
            let coords = locationMethod === 'map' ? { ...formData.mapCoordinates } : { lat: null, lng: null };
            
            if (locationMethod === 'address') {
                const addrParts = [
                    formData.plotNumber ? `Plot/Survey ${formData.plotNumber}` : '',
                    formData.areaName,
                    formData.locality,  // taluka
                    formData.city,
                    "Gujarat, India"
                ].filter(Boolean);
                finalLocation = addrParts.join(', ');
            }

            const isAgri = formData.propertyType === 'Land' 
                ? (formData.landType === 'Agricultural')
                : (formData.plotType === 'Agricultural' || formData.isAgricultural);

            const listingPayload = {
                ...formData,
                location: finalLocation,
                mapCoordinates: coords,
                area: `${areaValue} ${areaUnit}`,
                price: Number(formData.price),
                images: uploadedImagePaths,
                plotNumber: formData.plotNumber,
                areaName: formData.areaName,
                isAgricultural: isAgri,
                cornerPlot: formData.propertyType === 'Plot' ? formData.cornerPlot : false
            };
            await axios.post('/api/listings', listingPayload);
            toast.success('Listing successfully created!');
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to create listing.');
        } finally {
            setLoading(false);
        }
    };

    if (!user || (user.role !== 'Seller' && user.role !== 'Broker')) {
        return (
            <div className="min-h-screen bg-[#f8f5ee] flex items-center justify-center">
                <div className="bg-white rounded-3xl border border-red-100 shadow p-10 text-center max-w-md">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X size={28} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-black text-[#1a2340] mb-2">Access Denied</h2>
                    <p className="text-[#1a2340]/60 font-medium">Only Sellers and Brokers can create listings.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f5ee]">
            <div className="bg-[#1a2340] text-white px-6 py-10 md:px-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9a84c]/5 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-[#c9a84c] text-[10px] font-black uppercase tracking-[0.3em] mb-3">
                            <Building2 size={12} />
                            <span>Kharsan Admin</span>
                            <ChevronRight size={10} />
                            <span>{t('create_listing.breadcrumb')}</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
                            {t('create_listing.legacy_title')}
                        </h1>
                        <p className="text-white/50 font-semibold mt-2 text-sm max-w-md">{t('create_listing.legacy_subtitle')}</p>
                    </div>

                    <div className="hidden lg:flex items-center gap-4">
                        <button
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-3 rounded-2xl transition-all border border-white/10 group"
                        >
                            {showSidebar ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                            <span className="font-black text-xs uppercase tracking-widest">
                                {showSidebar ? t('create_listing.hide_portfolio') : t('create_listing.view_portfolio')}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="flex flex-col lg:flex-row gap-10 items-start">

                    <motion.div
                        layout
                        className={`transition-all duration-500 w-full ${showSidebar ? 'lg:w-[65%]' : 'lg:w-full'}`}
                    >
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-8 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-3xl font-bold flex items-center gap-3"
                            >
                                <X size={18} className="shrink-0" /> {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar mb-4">
                                <StepPill number="1" label={t('create_listing.step1')} done active />
                                <StepPill number="2" label={t('create_listing.step2')} active />
                                <StepPill number="3" label={t('create_listing.step3')} active={false} />
                            </div>

                            <SectionCard icon={<Building2 />} title={t('create_listing.prop_details_title')} subtitle={t('create_listing.prop_details_subtitle')}>
                                <div className="space-y-8">
                                    <div>
                                        <label className={labelCls}>{t('create_listing.prop_title_lbl')}<span className="text-red-500 font-bold ml-1">*</span></label>
                                        <input
                                            type="text" name="title" required
                                            value={formData.title} onChange={handleChange}
                                            className={inputCls}
                                            placeholder={t('create_listing.prop_title_ph')}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className={labelCls}>{t('create_listing.prop_category_lbl')}<span className="text-red-500 font-bold ml-1">*</span></label>
                                            <select
                                                name="propertyType"
                                                value={formData.propertyType}
                                                onChange={e => setFormData({ ...formData, propertyType: e.target.value, plotType: 'None', landType: 'None' })}
                                                className={inputCls + ' cursor-pointer'}
                                            >
                                                <option value="Plot">Plot</option>
                                                <option value="Land">Land</option>
                                            </select>
                                        </div>
                                        {formData.propertyType === 'Plot' && (
                                            <div>
                                                <label className={labelCls}>{t('create_listing.plot_subtype_lbl')}</label>
                                                <select
                                                    name="plotType"
                                                    value={formData.plotType}
                                                    onChange={e => setFormData({ ...formData, plotType: e.target.value })}
                                                    className={inputCls + ' cursor-pointer'}
                                                >
                                                    <option value="None">{t('create_listing.plot_subtype_select')}</option>
                                                    <option value="Residential">{t('create_listing.plot_opt_res')}</option>
                                                    <option value="Commercial">{t('create_listing.plot_opt_comm')}</option>
                                                    <option value="Industrial">{t('create_listing.plot_opt_ind')}</option>
                                                    <option value="Agricultural">{t('create_listing.plot_opt_agri')}</option>
                                                    <option value="Other">{t('create_listing.plot_opt_oth')}</option>
                                                </select>
                                            </div>
                                        )}
                                        {formData.propertyType === 'Land' && (
                                            <div>
                                                <label className={labelCls}>{t('create_listing.land_subtype_lbl')}</label>
                                                <select
                                                    name="landType"
                                                    value={formData.landType}
                                                    onChange={e => setFormData({ ...formData, landType: e.target.value })}
                                                    className={inputCls + ' cursor-pointer'}
                                                >
                                                    <option value="None">{t('create_listing.land_subtype_select')}</option>
                                                    <option value="Agricultural">{t('create_listing.plot_opt_agri')}</option>
                                                    <option value="Non-Agricultural">{t('create_listing.land_opt_na')}</option>
                                                    <option value="Industrial">{t('create_listing.plot_opt_ind')}</option>
                                                    <option value="Commercial">{t('create_listing.plot_opt_comm')}</option>
                                                    <option value="Other">{t('create_listing.plot_opt_oth')}</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className={labelCls}>{t('create_listing.price_lbl')}<span className="text-red-500 font-bold ml-1">*</span></label>
                                            <div className="relative">
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-[#c9a84c] text-xl">₹</span>
                                                <input
                                                    type="number" name="price" required min="1000"
                                                    value={formData.price} onChange={handleChange}
                                                    className={inputCls + ' pl-12'}
                                                    placeholder={t('create_listing.price_ph')}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelCls}>{t('create_listing.area_lbl')}<span className="text-red-500 font-bold ml-1">*</span></label>
                                            <div className="flex gap-3">
                                                <input
                                                    type="number" required min="0.001" step="any"
                                                    value={areaValue} onChange={(e) => setAreaValue(e.target.value)}
                                                    className={inputCls + ' w-2/3'}
                                                    placeholder={t('create_listing.area_ph')}
                                                />
                                                <select
                                                    value={areaUnit} onChange={(e) => setAreaUnit(e.target.value)}
                                                    className={inputCls + ' w-1/3 cursor-pointer'}
                                                >
                                                    {Object.keys(unitLabels[language === 'gu' ? 'gu' : 'en']).map((key) => (
                                                        <option key={key} value={key}>
                                                            {unitLabels[language === 'gu' ? 'gu' : 'en'][key]}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Price per unit rate display — temporarily disabled */}
                                    {/* {rateResults && (
                                        <div className="flex justify-end mt-2">
                                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#c9a84c]/10 border border-[#c9a84c]/30 rounded-xl text-xs sm:text-sm font-black text-[#1a2340]">
                                                <span>1 {rateResults.selected.label} =</span>
                                                <span className="text-[#b8933a] text-sm sm:text-base font-black">
                                                    ₹{rateResults.selected.rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    )} */}


                                    <div>
                                        <label className={labelCls}>{t('create_listing.description_lbl')}<span className="text-red-500 font-bold ml-1">*</span></label>
                                        <textarea
                                            name="description" required rows="6"
                                            value={formData.description} onChange={handleChange}
                                            className={inputCls + ' resize-none'}
                                            placeholder={t('create_listing.description_ph')}
                                        />
                                    </div>

                                    <div>
                                        <label className={labelCls}>{t('create_listing.attributes_lbl')}</label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-6 bg-[#f8f5ee]/40 border border-[#1a2340]/10 rounded-2xl">
                                            {formData.propertyType === 'Plot' && (
                                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.cornerPlot}
                                                        onChange={e => setFormData({ ...formData, cornerPlot: e.target.checked })}
                                                        className="w-4 h-4 rounded border-[#1a2340]/15 text-[#c9a84c] focus:ring-[#c9a84c]"
                                                    />
                                                    <span className="text-xs font-bold text-[#1a2340]/70">{t('create_listing.attr_corner')}</span>
                                                </label>
                                            )}
                                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.roadTouch}
                                                    onChange={e => setFormData({ ...formData, roadTouch: e.target.checked })}
                                                    className="w-4 h-4 rounded border-[#1a2340]/15 text-[#c9a84c] focus:ring-[#c9a84c]"
                                                />
                                                <span className="text-xs font-bold text-[#1a2340]/70">{t('create_listing.attr_road')}</span>
                                            </label>
                                            {formData.propertyType === 'Plot' && (
                                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.isAgricultural}
                                                        onChange={e => setFormData({ ...formData, isAgricultural: e.target.checked })}
                                                        className="w-4 h-4 rounded border-[#1a2340]/15 text-[#c9a84c] focus:ring-[#c9a84c]"
                                                    />
                                                    <span className="text-xs font-bold text-[#1a2340]/70">{t('create_listing.attr_agri')}</span>
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>

                            <SectionCard
                                icon={<MapPin />}
                                title={t('create_listing.location_title')}
                                subtitle={t('create_listing.location_subtitle')}
                            >
                                <div className="space-y-6">
                                    <div className="flex flex-wrap bg-[#f8f5ee] p-2 rounded-2xl border border-[#1a2340]/10 gap-2">
                                        {[
                                            { id: 'address', label: t('create_listing.loc_mode_address'), icon: <MapPin size={14} /> },
                                            { id: 'map', label: t('create_listing.loc_mode_map'), icon: <Target size={14} /> }
                                        ].map((method) => (
                                            <button
                                                key={method.id}
                                                type="button"
                                                onClick={() => {
                                                    setLocationMethod(method.id);
                                                    setFormData({ ...formData, locationMode: method.id });
                                                }}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${locationMethod === method.id
                                                        ? 'bg-[#1a2340] text-[#c9a84c] shadow-lg'
                                                        : 'text-[#1a2340]/50 hover:text-[#1a2340] hover:bg-white'
                                                    }`}
                                            >
                                                {method.icon} {method.label}
                                            </button>
                                        ))}
                                    </div>

                                    {locationMethod === 'address' && (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                     <label className={labelCls}>Plot / Survey Number</label>
                                                    <input
                                                        type="text" name="plotNumber"
                                                        value={formData.plotNumber}
                                                        onChange={handleChange}
                                                        className={inputCls}
                                                        placeholder="e.g. 102/B or Survey No. 55"
                                                    />
                                                </div>
                                                <div>
                                                    <label className={labelCls}>Nearby Landmark / Area Name</label>
                                                    <input
                                                        type="text" name="areaName"
                                                        value={formData.areaName}
                                                        onChange={handleChange}
                                                        className={inputCls}
                                                        placeholder="e.g. Near Shiv Temple, Badarpura Road"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className={labelCls}>Village / City <span className="text-red-500 font-bold ml-1">*</span></label>
                                                    <input
                                                        type="text" name="city"
                                                        required
                                                        value={formData.city}
                                                        onChange={handleChange}
                                                        className={inputCls}
                                                        placeholder="e.g. Palanpur, Vadgam, Deesa"
                                                    />
                                                </div>
                                                <div>
                                                    <label className={labelCls}>Taluka</label>
                                                    <input
                                                        type="text" name="locality"
                                                        value={formData.locality}
                                                        onChange={handleChange}
                                                        className={inputCls}
                                                        placeholder="e.g. Vadgam, Danta, Palanpur"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl mt-2">
                                                <span className="text-blue-500 mt-0.5">ℹ️</span>
                                                <p className="text-[11px] font-semibold text-blue-700 leading-snug">
                                                    Map location will <strong>not</strong> be shown on this listing. To show a precise pin on the map for buyers, switch to <strong>Precise Pin</strong> mode above.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {locationMethod === 'map' && (
                                        <div className="space-y-4">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                <p className="text-xs text-[#1a2340]/40 font-bold uppercase tracking-widest">
                                                    {t('create_listing.map_pin_instruction')}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={detectMyLocation}
                                                    className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 bg-[#1a2340] text-[#c9a84c] px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-[#c9a84c] hover:text-[#1a2340] transition-all"
                                                >
                                                    <Navigation size={12} /> {t('create_listing.use_gps_btn')}
                                                </button>
                                            </div>
                                            <div className="w-full h-96 rounded-3xl overflow-hidden border-2 border-[#1a2340]/10 shadow-inner relative">
                                                <MapContainer center={[formData.mapCoordinates.lat || 24.10, formData.mapCoordinates.lng || 72.38]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                                    <TileLayer url="https://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}" maxZoom={20} />
                                                    <MapSearch onSelect={(pos, addr) => setFormData({ ...formData, mapCoordinates: pos, location: addr || formData.location })} />
                                                    <LocationMarker
                                                        position={formData.mapCoordinates.lat ? formData.mapCoordinates : null}
                                                        setPosition={(pos) => setFormData({ ...formData, mapCoordinates: pos })}
                                                        setLocation={(addr) => setFormData(prev => ({ ...prev, location: addr }))}
                                                    />
                                                    <MapRecenter position={formData.mapCoordinates} />
                                                </MapContainer>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </SectionCard>

                            <SectionCard icon={<UploadCloud />} title={t('create_listing.visual_portfolio_title')} subtitle={t('create_listing.visual_portfolio_subtitle')} accent>
                                <div className="border-2 border-dashed border-[#c9a84c]/40 rounded-3xl p-12 text-center bg-[#c9a84c]/5 hover:bg-[#c9a84c]/10 transition-all cursor-pointer relative group">
                                    <input type="file" multiple accept="image/*" onChange={(e) => setImages(e.target.files)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    <UploadCloud className="mx-auto text-[#c9a84c] mb-4 group-hover:scale-110 transition-transform" size={48} />
                                    <p className="text-[#1a2340] font-black text-lg mb-1">
                                        {images?.length > 0 ? t('create_listing.images_selected_count').replace('{count}', images.length) : t('create_listing.drop_images_msg')}
                                    </p>
                                    <p className="text-[#1a2340]/40 font-bold text-xs uppercase tracking-widest">{t('create_listing.image_requirements')}</p>
                                </div>
                            </SectionCard>

                            {systemSettings?.isInstantBookingEnabled !== false && (
                                <SectionCard icon={<CreditCard />} title={t('create_listing.instant_booking_title')} subtitle={t('create_listing.instant_booking_subtitle')}>
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <p className="font-black text-[#1a2340]">{t('create_listing.enable_reservation')}</p>
                                            <p className="text-xs text-[#1a2340]/40 font-semibold mt-1">{t('create_listing.enable_reservation_sub')}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, isBookingEnabled: !formData.isBookingEnabled })}
                                            className={`relative inline-flex h-8 items-center rounded-full transition-all w-14 ${formData.isBookingEnabled ? 'bg-[#c9a84c]' : 'bg-[#1a2340]/20'}`}
                                        >
                                            <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-all ${formData.isBookingEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    {formData.isBookingEnabled && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6 pt-6 border-t border-[#f8f5ee]">
                                            <div>
                                                <label className={labelCls}>{t('create_listing.token_amt_lbl')}</label>
                                                <div className="relative">
                                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-[#c9a84c] text-xl">₹</span>
                                                    <input
                                                        type="number" value={formData.tokenAmount}
                                                        onChange={(e) => {
                                                            const max = (formData.price || 0) * 0.02;
                                                            setFormData({ ...formData, tokenAmount: Math.min(e.target.value, max) });
                                                        }}
                                                        className={inputCls + ' pl-12'}
                                                        placeholder={t('create_listing.token_amt_ph')}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelCls}>{t('create_listing.payout_acc_lbl')}</label>
                                                <select
                                                    value={formData.payoutAccountId}
                                                    onChange={(e) => setFormData({ ...formData, payoutAccountId: e.target.value })}
                                                    className={inputCls + ' cursor-pointer'}
                                                >
                                                    {payoutAccounts.map(acc => (
                                                        <option key={acc._id} value={acc._id}>{acc.accountType} — {acc.bankName || acc.upiId}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </motion.div>
                                    )}
                                </SectionCard>
                            )}

                            <div className="bg-[#1a2340] rounded-[2.5rem] p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-center gap-6 shadow-2xl">
                                <div className="text-center lg:text-left">
                                    <p className="text-white font-black text-lg">{t('create_listing.ready_to_launch')}</p>
                                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">{t('create_listing.publication_hint')}</p>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full lg:w-auto">
                                    <button 
                                        type="button" 
                                        onClick={() => navigate(-1)} 
                                        className="flex-1 lg:flex-none flex items-center justify-center px-6 sm:px-4 py-3.5 sm:py-4 font-black text-white/60 hover:text-white transition-all bg-white/5 rounded-2xl text-xs uppercase tracking-[0.2em]"
                                    >
                                        {t('create_listing.cancel_btn')}
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={loading} 
                                        className="flex-1 lg:flex-none bg-[#c9a84c] hover:bg-[#d9b85c] text-[#1a2340] px-8 sm:px-5 py-3.5 sm:py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-[#c9a84c]/20 hover:shadow-xl hover:shadow-[#c9a84c]/30 flex items-center justify-center gap-3 active:scale-95"
                                    >
                                        {loading ? <span className="w-4 h-4 border-2 border-[#1a2340]/30 border-t-[#1a2340] rounded-full animate-spin"></span> : <><Tag size={16} /> {t('create_listing.publish_btn')}</>}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>

                    {/* RIGHT COLUMN: My Portfolio Sidebar (30%) - PC Only */}
                    <AnimatePresence>
                        {showSidebar && (
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 50 }}
                                className="hidden lg:block lg:w-[30%] sticky top-8 self-start space-y-8"
                            >
                                <div className="bg-white rounded-[2.5rem] border border-[#1a2340]/10 p-8 shadow-sm">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h4 className="text-[10px] font-black text-[#c9a84c] uppercase tracking-[0.3em] mb-1">{t('create_listing.sidebar_growth')}</h4>
                                            <h3 className="text-xl font-black text-[#1a2340]">{t('create_listing.sidebar_portfolio')}</h3>
                                        </div>
                                        <div className="w-10 h-10 bg-[#f8f5ee] rounded-xl flex items-center justify-center text-[#1a2340]">
                                            <LayoutDashboard size={20} />
                                        </div>
                                    </div>

                                    {/* Small Square Cards */}
                                    <div className="space-y-4">
                                        {!myListingsData || myListingsData.length === 0 ? (
                                            <div className="py-12 text-center">
                                                <div className="w-12 h-12 bg-[#f8f5ee] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#c9a84c]">
                                                    <Sparkles size={24} />
                                                </div>
                                                <p className="text-[#1a2340]/40 font-bold text-[10px] uppercase tracking-widest leading-loose px-4">
                                                    {t('create_listing.sidebar_empty')}
                                                </p>
                                            </div>
                                        ) : (
                                            myListingsData.slice(0, 5).map((item) => (
                                                <div key={item._id} className="group flex items-center gap-4 p-3 bg-[#f8f5ee]/50 border border-transparent hover:border-[#c9a84c]/30 hover:bg-white rounded-2xl transition-all">
                                                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#1a2340]/5">
                                                        {item.images?.length > 0 ? (
                                                            <img src={getImageUrl(item.images[0])} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                                                        ) : (
                                                            <div className="w-full h-full bg-[#1a2340]/5 flex items-center justify-center text-[10px] font-black text-[#1a2340]/20">NO IMG</div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h5 className="font-bold text-[#1a2340] text-xs truncate mb-0.5 group-hover:text-[#c9a84c] transition-colors">{item.title}</h5>
                                                        <p className="text-[9px] font-black text-[#c9a84c] uppercase tracking-widest">₹{item.price?.toLocaleString('en-IN')}</p>
                                                    </div>
                                                    <Link to={`/listings/${item._id}`} target="_blank" className="w-8 h-8 rounded-lg bg-white border border-[#1a2340]/5 flex items-center justify-center text-[#1a2340]/40 hover:text-[#1a2340] hover:shadow-sm transition-all">
                                                        <ExternalLink size={14} />
                                                    </Link>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {myListingsData?.length > 5 && (
                                        <button onClick={() => navigate('/dashboard')} className="w-full mt-6 py-4 rounded-2xl bg-[#1a2340]/5 text-[#1a2340] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#1a2340] hover:text-white transition-all">
                                            {t('create_listing.sidebar_view_full')}
                                        </button>
                                    )}

                                    <div className="mt-8 pt-8 border-t border-[#f8f5ee] flex items-center gap-4">
                                        <div className="flex -space-x-3">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-[#c9a84c]/20 flex items-center justify-center text-[10px] font-black text-[#c9a84c]">
                                                    {i}
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] font-bold text-[#1a2340]/40 leading-tight">
                                            {t('create_listing.sidebar_active_listings').replace('{count}', myListingsData?.length || 0)}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-3xl p-8 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                                        <Sparkles size={48} className="text-[#c9a84c]" />
                                    </div>
                                    <h4 className="text-[10px] font-black text-[#c9a84c] uppercase tracking-[0.3em] mb-4">{t('create_listing.sidebar_pro_tip')}</h4>
                                    <p className="text-[#1a2340] font-bold text-xs leading-relaxed">
                                        {t('create_listing.sidebar_pro_tip_desc')}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </div>
        </div>
    );
};

export default CreateListing;
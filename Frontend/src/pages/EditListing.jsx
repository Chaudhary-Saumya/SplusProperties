import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import {
    UploadCloud, MapPin, Save, ArrowLeft, Building2, ChevronRight,
    X, CreditCard, ImageIcon, Target, Navigation, Search as SearchIcon
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getImageUrl } from '../utils/imageUrl';

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

// ── Area unit definitions (same as CreateListing) ────────────────────────────
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

// Map raw stored unit strings back to unitLabels keys
function mapUnitKey(rawUnit) {
    const r = (rawUnit || '').trim().toLowerCase();
    if (r === 'sqft' || r.includes('square feet') || r.includes('sq ft') || r.includes('sqft')) return 'sqft';
    if (r === 'gaj' || r.includes('yard') || r.includes('gaj') || r.includes('vaar') || r.includes('sq yd')) return 'gaj';
    if (r === 'sqm' || r.includes('sq.mt') || r.includes('square meter') || r.includes('sq meter') || r.includes('sqm')) return 'sqm';
    if (r === 'acre' || r.includes('acre')) return 'acre';
    if (r === 'hectare' || r.includes('hectare') || r.includes('hector')) return 'hectare';
    if (r === 'guntha' || r.includes('guntha') || r.includes('gutha')) return 'guntha';
    if (r === 'aare' || r.includes('aare')) return 'aare';
    if (r === 'vigha_bada' || r.includes('23.78') || r.includes('bada') || r.includes('vigha_bada')) return 'vigha_bada';
    if (r === 'vigha_chhota' || r.includes('16.19') || r.includes('chhota') || r.includes('vigha_chhota')) return 'vigha_chhota';
    return 'sqft'; // default
}

// ── Helper components ────────────────────────────────────────────────────────
async function reverseGeocode(lat, lng) {
    try {
        const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        return res.data.display_name;
    } catch (e) {
        console.error('Reverse geocoding error', e);
        return null;
    }
}

function MapRecenter({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position?.lat) map.setView([position.lat, position.lng], 15);
    }, [position, map]);
    return null;
}

function LocationMarker({ position, setPosition, setLocation }) {
    useMapEvents({
        async click(e) {
            setPosition(e.latlng);
            const address = await reverseGeocode(e.latlng.lat, e.latlng.lng);
            if (address) setLocation(address);
        },
    });
    return position === null ? null : (
        <Marker position={position}>
            <Popup>Precise Location</Popup>
        </Marker>
    );
}

function MapSearch({ onSelect }) {
    const [query, setQuery] = useState('');
    const [mapSuggestions, setMapSuggestions] = useState([]);
    const [showMapSuggestions, setShowMapSuggestions] = useState(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
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
        return () => clearTimeout(timer);
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
                        placeholder="Search for a location..."
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
                                <p className="text-[10px] text-[#1a2340]/40 font-bold truncate">{s.display_name}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

// ── Shared style tokens ──────────────────────────────────────────────────────
const inputCls = "w-full px-5 py-3.5 rounded-xl border border-[#1a2340]/15 bg-[#f8f5ee]/60 focus:ring-2 focus:ring-[#c9a84c]/40 focus:border-[#c9a84c] outline-none transition-all font-semibold text-[#1a2340] text-base placeholder:text-[#1a2340]/30";
const labelCls = "block text-[10px] font-black text-[#1a2340]/50 mb-2 uppercase tracking-[0.15em]";

// ── Section card wrapper ─────────────────────────────────────────────────────
const SectionCard = ({ icon, title, subtitle, children, accent, className = "" }) => (
    <div className={`relative bg-white rounded-2xl border border-[#1a2340]/10 shadow-sm ${className}`}>
        <div className="flex items-start gap-4 px-7 pt-6 pb-5 border-b border-[#f8f5ee]">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent ? 'bg-[#c9a84c]' : 'bg-[#1a2340]'}`}>
                {React.cloneElement(icon, { size: 18, className: accent ? 'text-[#1a2340]' : 'text-[#c9a84c]' })}
            </div>
            <div>
                <h3 className="font-extrabold text-[#1a2340] text-base uppercase tracking-widest">{title}</h3>
                {subtitle && <p className="text-[#1a2340]/50 text-xs font-medium mt-0.5">{subtitle}</p>}
            </div>
        </div>
        <div className="px-7 py-6">{children}</div>
    </div>
);

// ── Main component ───────────────────────────────────────────────────────────
const EditListing = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const { language } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        location: '',
        plotNumber: '',
        areaName: '',
        listingType: 'Verified',
        tokenAmount: '',
        payoutAccountId: '',
        locationMode: 'address',
        mapCoordinates: { lat: null, lng: null },
        mapBounds: null,
        isBookingEnabled: false,
        propertyType: 'Plot',
        plotType: 'None',
        landType: 'None',
        isAgricultural: false,
        roadTouch: false,
        cornerPlot: false,
        isFeatured: false,
        city: '',
        locality: ''     // used as Taluka
    });

    const [locationMethod, setLocationMethod] = useState('address');

    const [areaValue, setAreaValue] = useState('');
    const [areaUnit, setAreaUnit] = useState('sqft');
    const [existingImages, setExistingImages] = useState([]);
    const [images, setImages] = useState(null);
    const [payoutAccounts, setPayoutAccounts] = useState([]);

    // Fetch system settings to check if token booking is enabled by admin
    const { data: systemSettings } = useQuery({
        queryKey: ['systemSettings'],
        queryFn: async () => {
            const res = await axios.get('/api/settings');
            return res.data.data;
        }
    });

    // ── Fetch existing listing ───────────────────────────────────────────────
    useEffect(() => {
        const fetchListing = async () => {
            try {
                const res = await axios.get(`/api/listings/${id}`);
                const data = res.data.data;
                if (data.createdBy._id !== user?.id && data.createdBy._id !== user?._id && user?.role !== 'Admin') {
                    navigate('/dashboard');
                    return;
                }
                setFormData({
                    title: data.title,
                    description: data.description || '',
                    price: data.price.toString(),
                    location: data.location,
                    plotNumber: data.plotNumber || '',
                    areaName: data.areaName || '',
                    tokenAmount: data.tokenAmount || '',
                    payoutAccountId: data.payoutAccountId?._id || data.payoutAccountId || '',
                    locationMode: data.locationMode || 'address',
                    mapCoordinates: data.mapCoordinates || { lat: null, lng: null },
                    mapBounds: null,
                    isBookingEnabled: data.isBookingEnabled || false,
                    propertyType: data.propertyType || 'Plot',
                    plotType: data.plotType || 'None',
                    landType: data.landType || 'None',
                    isAgricultural: data.isAgricultural || false,
                    roadTouch: data.roadTouch || false,
                    cornerPlot: data.cornerPlot || false,
                    isFeatured: data.isFeatured || false,
                    city: data.city || '',
                    locality: data.locality || ''
                });
                setLocationMethod(data.locationMode || 'address');

                // Parse stored area string → value + unit key
                const areaParts = data.area ? data.area.split(' ') : [];
                if (areaParts.length >= 2) {
                    setAreaValue(areaParts[0]);
                    const rawUnit = areaParts.slice(1).join(' ');
                    setAreaUnit(mapUnitKey(rawUnit));
                } else {
                    setAreaValue(data.area || '');
                }
                setExistingImages(data.images || []);
            } catch (err) {
                console.error(err);
                setError('Failed to load property data');
            } finally {
                setFetchLoading(false);
            }
        };
        if (user) fetchListing();
    }, [id, user, navigate]);

    // ── Fetch payout accounts ────────────────────────────────────────────────
    useEffect(() => {
        axios.get('/api/auth/me')
            .then(res => {
                const accounts = res.data.data.paymentAccounts || [];
                setPayoutAccounts(accounts);
            })
            .catch(err => console.error('Failed to fetch payout accounts:', err));
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // ── GPS detection ────────────────────────────────────────────────────────
    const detectMyLocation = () => {
        if (!navigator.geolocation) return toast.error('Geolocation not supported');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setLocationMethod('map');
                setFormData(prev => ({
                    ...prev,
                    mapCoordinates: { lat: latitude, lng: longitude },
                    locationMode: 'map'
                }));
                toast.success('GPS location detected! Pin placed on map.');
            },
            () => toast.error('Unable to retrieve location')
        );
    };

    // ── Price-per-unit calculation ───────────────────────────────────────────
    const getCalculatedRate = () => {
        const p = parseFloat(formData.price);
        const a = parseFloat(areaValue);
        if (isNaN(p) || isNaN(a) || p <= 0 || a <= 0) return null;
        const lang = language === 'gu' ? 'gu' : 'en';
        const label = unitLabels[lang][areaUnit] || areaUnit;
        return { label, rate: p / a };
    };

    const rateResult = getCalculatedRate();

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // Upload new images
            let uploadedImagePaths = [...existingImages];
            if (images && images.length > 0) {
                for (let i = 0; i < images.length; i++) {
                    const imgData = new FormData();
                    imgData.append('file', images[i]);
                    const uploadRes = await axios.post('/api/uploads', imgData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    if (uploadRes.data.success) uploadedImagePaths.push(uploadRes.data.data);
                }
            }

            // Only use explicit map-pin coordinates — NEVER auto-geocode from address
            const coords = locationMethod === 'map'
                ? { ...formData.mapCoordinates }
                : { lat: null, lng: null };

            // Build readable location string for address mode
            let finalLocation = formData.location;
            if (locationMethod === 'address') {
                const addrParts = [
                    formData.plotNumber ? `Plot/Survey ${formData.plotNumber}` : '',
                    formData.areaName,
                    formData.locality,   // Taluka
                    formData.city,
                    'Gujarat, India'
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
                isAgricultural: isAgri,
                cornerPlot: formData.propertyType === 'Plot' ? formData.cornerPlot : false
            };

            await axios.put(`/api/listings/${id}`, listingPayload);
            toast.success('Listing successfully updated!');
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to update listing.');
        } finally {
            setLoading(false);
        }
    };

    const removeExistingImage = (idx) => {
        setExistingImages(existingImages.filter((_, i) => i !== idx));
    };

    // ── Loading skeleton ─────────────────────────────────────────────────────
    if (fetchLoading) return (
        <div className="min-h-screen bg-[#f8f5ee]">
            <div className="bg-[#1a2340] px-6 py-10 md:px-16">
                <div className="max-w-4xl mx-auto animate-pulse">
                    <div className="h-3 w-36 bg-white/10 rounded-full mb-4"></div>
                    <div className="h-9 w-56 bg-white/10 rounded-xl mb-2"></div>
                    <div className="h-3 w-44 bg-white/10 rounded-full"></div>
                </div>
            </div>
            <div className="max-w-4xl mx-auto px-4 py-10 flex justify-center items-center">
                <div className="w-12 h-12 border-4 border-[#c9a84c] border-t-transparent rounded-full animate-spin"></div>
            </div>
        </div>
    );

    if (!user || (user.role !== 'Seller' && user.role !== 'Broker' && user.role !== 'Admin')) {
        return (
            <div className="min-h-screen bg-[#f8f5ee] flex items-center justify-center">
                <div className="bg-white rounded-2xl border border-red-100 shadow p-10 text-center max-w-md">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X size={28} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-black text-[#1a2340] mb-2">Access Denied</h2>
                    <p className="text-[#1a2340]/60 font-medium">You don't have permission to edit this listing.</p>
                </div>
            </div>
        );
    }

    const lang = language === 'gu' ? 'gu' : 'en';

    return (
        <div className="min-h-screen bg-[#f8f5ee]">
            {/* ── Header ── */}
            <div className="bg-[#1a2340] text-white px-6 py-10 md:px-16">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-2 text-[#c9a84c] text-xs font-bold uppercase tracking-[0.2em] mb-3">
                        <Building2 size={14} />
                        <span>Kharsan Properties</span>
                        <ChevronRight size={12} />
                        <span>Edit Listing</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all shrink-0"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
                                Edit <span className="text-[#c9a84c]">Property Listing</span>
                            </h1>
                            <p className="text-white/50 font-medium mt-1 text-sm">Update your property details — changes go live instantly.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl font-bold flex items-center gap-3">
                        <X size={18} className="shrink-0" /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ── SECTION 1: Property Details ── */}
                    <SectionCard icon={<Building2 />} title="Property Details" subtitle="Update the core information about this listing">
                        <div className="space-y-6">
                            {/* Title */}
                            <div>
                                <label className={labelCls}>Property Title <span className="text-red-500 font-bold ml-1">*</span></label>
                                <input
                                    type="text" name="title" required
                                    value={formData.title} onChange={handleChange}
                                    className={inputCls}
                                    placeholder="e.g. 500 Sq Yd Corner Plot in Sector 14"
                                />
                            </div>

                            {/* Category + Sub-type */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label className={labelCls}>Property Category <span className="text-red-500 font-bold ml-1">*</span></label>
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
                                        <label className={labelCls}>Plot Sub-Type</label>
                                        <select
                                            name="plotType"
                                            value={formData.plotType}
                                            onChange={e => setFormData({ ...formData, plotType: e.target.value })}
                                            className={inputCls + ' cursor-pointer'}
                                        >
                                            <option value="None">Select Plot Type...</option>
                                            <option value="Residential">Residential</option>
                                            <option value="Commercial">Commercial</option>
                                            <option value="Industrial">Industrial</option>
                                            <option value="Agricultural">Agricultural</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                )}
                                {formData.propertyType === 'Land' && (
                                    <div>
                                        <label className={labelCls}>Land Sub-Type</label>
                                        <select
                                            name="landType"
                                            value={formData.landType}
                                            onChange={e => setFormData({ ...formData, landType: e.target.value })}
                                            className={inputCls + ' cursor-pointer'}
                                        >
                                            <option value="None">Select Land Type...</option>
                                            <option value="Agricultural">Agricultural</option>
                                            <option value="Non-Agricultural">Non-Agricultural (NA)</option>
                                            <option value="Industrial">Industrial</option>
                                            <option value="Commercial">Commercial</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Price + Area */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelCls}>Price (₹) <span className="text-red-500 font-bold ml-1">*</span></label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-[#c9a84c] text-xl">₹</span>
                                        <input
                                            type="number" name="price" required min="1000"
                                            value={formData.price} onChange={handleChange}
                                            className={inputCls + ' pl-12'}
                                            placeholder="e.g. 1500000"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Total Area <span className="text-red-500 font-bold ml-1">*</span></label>
                                    <div className="flex gap-3">
                                        <input
                                            type="number" required min="0.001" step="any"
                                            value={areaValue}
                                            onChange={(e) => setAreaValue(e.target.value)}
                                            className={inputCls + ' w-2/3'}
                                            placeholder="e.g. 450"
                                        />
                                        <select
                                            value={areaUnit}
                                            onChange={(e) => setAreaUnit(e.target.value)}
                                            className={inputCls + ' w-1/3 cursor-pointer'}
                                        >
                                            {Object.keys(unitLabels[lang]).map((key) => (
                                                <option key={key} value={key}>
                                                    {unitLabels[lang][key]}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Price per unit rate display — temporarily disabled */}
                            {/* {rateResult && (
                                <div className="flex justify-end">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#c9a84c]/10 border border-[#c9a84c]/30 rounded-xl text-xs sm:text-sm font-black text-[#1a2340]">
                                        <span>1 {rateResult.label} =</span>
                                        <span className="text-[#b8933a] text-sm sm:text-base font-black">
                                            ₹{rateResult.rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            )} */}

                            {/* Description */}
                            <div>
                                <label className={labelCls}>Description <span className="text-red-500 font-bold ml-1">*</span></label>
                                <textarea
                                    name="description" required rows="5"
                                    value={formData.description} onChange={handleChange}
                                    className={inputCls + ' resize-none'}
                                    placeholder="What makes this property special?..."
                                />
                            </div>

                            {/* Property Attributes */}
                            <div>
                                <label className={labelCls}>Property Attributes</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 p-5 bg-[#f8f5ee]/40 border border-[#1a2340]/10 rounded-2xl">
                                    {formData.propertyType === 'Plot' && (
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={formData.cornerPlot}
                                                onChange={e => setFormData({ ...formData, cornerPlot: e.target.checked })}
                                                className="w-4 h-4 rounded border-[#1a2340]/15 text-[#c9a84c] focus:ring-[#c9a84c]"
                                            />
                                            <span className="text-xs font-bold text-[#1a2340]/70">Corner Plot</span>
                                        </label>
                                    )}
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={formData.roadTouch}
                                            onChange={e => setFormData({ ...formData, roadTouch: e.target.checked })}
                                            className="w-4 h-4 rounded border-[#1a2340]/15 text-[#c9a84c] focus:ring-[#c9a84c]"
                                        />
                                        <span className="text-xs font-bold text-[#1a2340]/70">Road Touch</span>
                                    </label>
                                    {formData.propertyType === 'Plot' && (
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={formData.isAgricultural}
                                                onChange={e => setFormData({ ...formData, isAgricultural: e.target.checked })}
                                                className="w-4 h-4 rounded border-[#1a2340]/15 text-[#c9a84c] focus:ring-[#c9a84c]"
                                            />
                                            <span className="text-xs font-bold text-[#1a2340]/70">Agricultural Plot</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    {/* ── SECTION 2: Location ── */}
                    <SectionCard
                        icon={<MapPin />}
                        title="Geographic Position"
                        subtitle="Set the address or pin an exact location on the map"
                    >
                        {/* Mode switcher */}
                        <div className="bg-[#f8f5ee] p-2 rounded-2xl border border-[#1a2340]/10 flex gap-2 mb-6">
                            {[
                                { id: 'address', label: 'Enter Address', icon: <MapPin size={14} /> },
                                { id: 'map', label: 'Precise Pin', icon: <Target size={14} /> }
                            ].map((method) => (
                                <button
                                    key={method.id}
                                    type="button"
                                    onClick={() => {
                                        setLocationMethod(method.id);
                                        setFormData(prev => ({ ...prev, locationMode: method.id }));
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${locationMethod === method.id
                                        ? 'bg-[#1a2340] text-[#c9a84c] shadow-lg'
                                        : 'text-[#1a2340]/40 hover:bg-[#1a2340]/5'
                                        }`}
                                >
                                    {method.icon} {method.label}
                                </button>
                            ))}
                        </div>

                        {/* Address mode */}
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
                                            type="text" name="city" required
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

                                {/* Info banner */}
                                <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                                    <span className="text-blue-500 mt-0.5">ℹ️</span>
                                    <p className="text-[11px] font-semibold text-blue-700 leading-snug">
                                        Map location will <strong>not</strong> be shown on this listing. To show a precise pin on the map for buyers, switch to <strong>Precise Pin</strong> mode above.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Map (Precise Pin) mode */}
                        {locationMethod === 'map' && (
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <p className="text-xs text-[#1a2340]/40 font-bold uppercase tracking-widest">
                                        Click anywhere on the map to drop a precise pin
                                    </p>
                                    <button
                                        type="button"
                                        onClick={detectMyLocation}
                                        className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 bg-[#1a2340] text-[#c9a84c] px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-[#c9a84c] hover:text-[#1a2340] transition-all"
                                    >
                                        <Navigation size={12} /> Use My GPS Location
                                    </button>
                                </div>
                                <div className="w-full h-96 rounded-3xl overflow-hidden border-2 border-[#1a2340]/10 shadow-inner relative z-0">
                                    <MapContainer
                                        center={[formData.mapCoordinates.lat || 24.10, formData.mapCoordinates.lng || 72.38]}
                                        zoom={15}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer url="http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}" maxZoom={20} />
                                        <MapSearch
                                            onSelect={(pos, addr) => setFormData(prev => ({ ...prev, mapCoordinates: pos, location: addr || prev.location }))}
                                        />
                                        <LocationMarker
                                            position={formData.mapCoordinates.lat ? formData.mapCoordinates : null}
                                            setPosition={(pos) => setFormData(prev => ({ ...prev, mapCoordinates: pos }))}
                                            setLocation={(addr) => setFormData(prev => ({ ...prev, location: addr }))}
                                        />
                                        <MapRecenter position={formData.mapCoordinates} />
                                    </MapContainer>
                                </div>
                                {formData.mapCoordinates.lat && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
                                        <span className="text-green-600 text-sm">📍</span>
                                        <p className="text-[11px] font-semibold text-green-700">
                                            Pin set at {parseFloat(formData.mapCoordinates.lat).toFixed(5)}, {parseFloat(formData.mapCoordinates.lng).toFixed(5)} — this will show on the listing map.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </SectionCard>

                    {/* ── SECTION 3: Property Photos ── */}
                    <SectionCard icon={<ImageIcon />} title="Property Photos" subtitle="Manage existing images or add new ones" accent>
                        {existingImages.length > 0 && (
                            <div className="flex flex-wrap gap-3 mb-5 p-4 bg-[#f8f5ee] rounded-xl border border-[#1a2340]/10">
                                {existingImages.map((img, idx) => (
                                    <div key={idx} className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-[#1a2340]/10 shadow-sm group">
                                        <img
                                            src={getImageUrl(img)}
                                            alt="Preview"
                                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeExistingImage(idx)}
                                            className="absolute top-1.5 right-1.5 bg-[#1a2340] text-[#c9a84c] rounded-full w-6 h-6 flex items-center justify-center text-xs font-black shadow hover:bg-red-600 hover:text-white transition-colors"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="border-2 border-dashed border-[#c9a84c]/40 rounded-2xl p-8 text-center bg-[#c9a84c]/5 hover:bg-[#c9a84c]/10 transition-colors cursor-pointer relative overflow-hidden group">
                            <input
                                type="file" multiple accept="image/*"
                                onChange={(e) => setImages(e.target.files)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <UploadCloud className="mx-auto text-[#c9a84c] mb-3 group-hover:scale-110 transition-transform" size={36} />
                            <p className="text-[#1a2340] font-black text-sm">
                                {images && images.length > 0
                                    ? `${images.length} new photo${images.length > 1 ? 's' : ''} queued`
                                    : 'Click or drag to add more photos'}
                            </p>
                            <p className="text-[#1a2340]/40 text-xs font-medium mt-1">High quality .jpg or .png</p>
                        </div>
                    </SectionCard>

                    {/* Token Booking — only shown if admin has enabled it */}
                    {systemSettings?.isInstantBookingEnabled !== false && (
                    <SectionCard icon={<CreditCard />} title="Token Booking System" subtitle="Enable or update online reservations for this property">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-[#1a2340]">Accept Token Bookings</p>
                                <p className="text-xs text-[#1a2340]/40 font-medium mt-0.5">Allow buyers to reserve this listing with a token amount</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, isBookingEnabled: !formData.isBookingEnabled })}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${formData.isBookingEnabled ? 'bg-[#c9a84c]' : 'bg-[#1a2340]/20'}`}
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${formData.isBookingEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {formData.isBookingEnabled && (
                            <div className="mt-6 pt-6 border-t border-[#f8f5ee] space-y-5">
                                <div>
                                    <label className={labelCls}>
                                        Token Amount — Capped at 2%
                                        {formData.price && (
                                            <span className="ml-1 normal-case font-semibold text-[#c9a84c]">
                                                (max ₹{((formData.price || 0) * 0.02).toLocaleString('en-IN')})
                                            </span>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-[#c9a84c] text-xl">₹</span>
                                        <input
                                            type="number"
                                            value={formData.tokenAmount}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const max = (formData.price || 0) * 0.02;
                                                setFormData({ ...formData, tokenAmount: val <= max ? val : max });
                                            }}
                                            className={inputCls + ' pl-12'}
                                            placeholder="Enter token amount..."
                                        />
                                        {formData.tokenAmount > 0 && formData.price > 0 && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-[#1a2340] bg-[#c9a84c]/20 px-3 py-1 rounded-lg">
                                                {((formData.tokenAmount / formData.price) * 100).toFixed(1)}% of price
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className={labelCls}>Select Payout Account</label>
                                    {payoutAccounts.length > 0 ? (
                                        <select
                                            name="payoutAccountId"
                                            value={formData.payoutAccountId}
                                            onChange={handleChange}
                                            className={inputCls + ' cursor-pointer'}
                                            required
                                        >
                                            {payoutAccounts.map(acc => (
                                                <option key={acc._id} value={acc._id}>
                                                    {acc.accountType?.toUpperCase()} — {acc.holderName || acc.bankName || acc.upiId}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-700 text-sm font-medium">
                                            No payout accounts found. Please add one in your{' '}
                                            <button type="button" onClick={() => navigate('/dashboard')} className="underline font-black">Dashboard</button> first.
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-[#1a2340]/5 rounded-xl border border-[#1a2340]/10 flex gap-3 items-start">
                                    <span className="text-base mt-0.5">💡</span>
                                    <p className="text-xs text-[#1a2340]/60 leading-relaxed font-medium">
                                        <span className="font-black text-[#1a2340]">Facilitated Transfers:</span>{' '}
                                        Token money from buyers will be sent directly to your chosen account. We don't hold any funds.
                                    </p>
                                </div>
                            </div>
                        )}
                    </SectionCard>
                    )} {/* end systemSettings.isInstantBookingEnabled */}

                    {/* ── Submit bar ── */}
                    <div className="bg-[#1a2340] rounded-2xl px-7 py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <p className="text-white font-black text-sm">Ready to save changes?</p>
                            <p className="text-white/40 text-xs font-medium mt-0.5">Your updates will go live immediately.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-6 py-3 font-bold text-white/60 hover:text-white transition-colors bg-white/10 hover:bg-white/15 rounded-xl text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-[#c9a84c] hover:bg-[#b8943e] text-[#1a2340] px-8 py-3 rounded-xl font-black text-sm transition-all shadow-lg shadow-[#c9a84c]/20 hover:-translate-y-0.5 disabled:opacity-70 flex items-center gap-2 uppercase tracking-wider"
                            >
                                {loading
                                    ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-[#1a2340]/30 border-t-[#1a2340] rounded-full animate-spin"></span> Saving...</span>
                                    : <><Save size={16} /> Save Changes</>
                                }
                            </button>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default EditListing;
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import {
    UploadCloud, MapPin, Tag, Navigation, Target, Maximize, X, Building2,
    IndianRupee, Layers, FileText, CreditCard, ChevronRight, ZapOff,
    LayoutDashboard, Eye, Edit3, PanelRightClose, PanelRightOpen, ExternalLink,
    PlusCircle, Sparkles, Search as SearchIcon, CheckCircle2, Zap, Check,
    Trash2, Image as ImageIcon, Info, ShieldCheck, Compass, LandPlot, ArrowLeft,
    Save, RefreshCw, AlertCircle, AlertTriangle, Satellite, Map, Lightbulb, Coins
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Popup } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
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

function getDistanceKm(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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
            if (address && setLocation) setLocation(address);
        },
    });
    return position === null ? null : (
        <Marker position={position}>
            <Popup>Selected Pin Coordinate</Popup>
        </Marker>
    );
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

// Section card wrapper
const SectionCard = ({ icon, title, subtitle, children, badge }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all hover:shadow-xs">
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    {icon}
                </div>
                <div>
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">{title}</h3>
                    {subtitle && <p className="text-slate-500 text-xs font-normal">{subtitle}</p>}
                </div>
            </div>
            {badge && (
                <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 uppercase tracking-wider">
                    {badge}
                </span>
            )}
        </div>
        <div className="p-5 sm:p-7">{children}</div>
    </div>
);

const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50/40 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-semibold text-slate-800 text-xs sm:text-sm placeholder:text-slate-400";
const labelCls = "block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider";

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

const shortUnitLabels = {
    en: {
        guntha: 'Guntha',
        hectare: 'Hectare',
        aare: 'Aare',
        vigha_bada: 'Bigha (Big)',
        vigha_chhota: 'Bigha (Small)',
        acre: 'Acre',
        sqm: 'Sq.Mt',
        sqft: 'Sq.Ft',
        gaj: 'Gaj/Yard',
    },
    gu: {
        guntha: 'ગુન્ટા',
        hectare: 'હેક્ટર',
        aare: 'આરે',
        vigha_bada: 'મોટું વીઘું',
        vigha_chhota: 'નાનું વીઘું',
        acre: 'એકર',
        sqm: 'ચોરસ મીટર',
        sqft: 'ચોરસ ફૂટ',
        gaj: 'ગજ/વાર',
    }
};

const TO_GUNTHA = {
    guntha: 1,
    hectare: 98.84,
    aare: 0.9884,
    vigha_bada: 23.78,
    vigha_chhota: 16.19,
    acre: 40,
    sqm: 0.009884,
    sqft: 1 / 1089,
    gaj: 9 / 1089,
};

const getSqFtFromArea = (val, unit) => {
    const num = parseFloat(val);
    if (!num || isNaN(num) || num <= 0) return 0;
    const factor = TO_GUNTHA[unit] || 1;
    return num * factor * 1089;
};

const getAreaEquivalents = (val, unit, lang = 'en') => {
    const num = parseFloat(val);
    if (!num || isNaN(num) || num <= 0) return null;
    const totalSqft = getSqFtFromArea(num, unit);
    const totalGuntha = num * (TO_GUNTHA[unit] || 1);
    const totalAcre = totalGuntha / 40;

    const parts = [];
    if (unit !== 'sqft') {
        parts.push(`≈ ${Math.round(totalSqft).toLocaleString('en-IN')} ${lang === 'gu' ? 'ચો.ફૂટ' : 'Sq.Ft'}`);
    }
    if (unit !== 'guntha' && totalGuntha >= 0.1) {
        parts.push(`≈ ${totalGuntha.toFixed(2).replace(/\.00$/, '')} ${lang === 'gu' ? 'ગુન્ટા' : 'Guntha'}`);
    }
    if (unit !== 'acre' && totalAcre >= 0.05) {
        parts.push(`≈ ${totalAcre.toFixed(2).replace(/\.00$/, '')} ${lang === 'gu' ? 'એકર' : 'Acre'}`);
    }
    return parts.length > 0 ? parts.join(' • ') : null;
};

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
    return 'sqft';
}

const EditListing = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const { language, t } = useLanguage();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSidebar, setShowSidebar] = useState(true);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        location: '',
        plotNumber: '',
        areaName: '',
        status: 'Active',
        listingType: 'Basic',
        tokenAmount: '',
        payoutAccountId: '',
        locationMode: 'address',
        mapCoordinates: { lat: 23.0225, lng: 72.5714 },
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
        locality: '',
        pincode: ''
    });

    const [locationMethod, setLocationMethod] = useState('address');
    const [mapLayer, setMapLayer] = useState('satellite');
    const [areaValue, setAreaValue] = useState('');
    const [areaUnit, setAreaUnit] = useState('sqft');
    const [priceMode, setPriceMode] = useState('total'); // 'total' | 'rate'
    const [unitRateInput, setUnitRateInput] = useState('');
    const [existingImages, setExistingImages] = useState([]);
    const [images, setImages] = useState(null);
    const [payoutAccounts, setPayoutAccounts] = useState([]);
    const [geocodedAddressCoords, setGeocodedAddressCoords] = useState(null);

    // Fetch system settings
    const { data: systemSettings } = useQuery({
        queryKey: ['systemSettings'],
        queryFn: async () => {
            const res = await axios.get('/api/settings');
            return res.data.data;
        }
    });

    // Fetch listing details
    useEffect(() => {
        const fetchListing = async () => {
            try {
                const res = await axios.get(`/api/listings/${id}`);
                const data = res.data.data;
                const ownerId = typeof data.createdBy === 'object' ? (data.createdBy?._id || data.createdBy?.id) : data.createdBy;
                const currentUserId = user?.id || user?._id;

                if (ownerId && currentUserId && ownerId.toString() !== currentUserId.toString() && user?.role !== 'Admin') {
                    toast.error("You don't have permission to edit this listing.");
                    navigate('/dashboard');
                    return;
                }

                // Parse area
                let parsedAreaVal = '';
                const areaParts = data.area ? data.area.split(' ') : [];
                if (areaParts.length >= 2) {
                    parsedAreaVal = areaParts[0];
                    setAreaValue(areaParts[0]);
                    setAreaUnit(mapUnitKey(areaParts.slice(1).join(' ')));
                } else {
                    parsedAreaVal = data.area || '';
                    setAreaValue(data.area || '');
                }

                const priceNum = data.price ? Number(data.price) : 0;
                const areaNum = parseFloat(parsedAreaVal);
                if (priceNum > 0 && areaNum > 0) {
                    setUnitRateInput(String(Math.round(priceNum / areaNum)));
                }

                setFormData({
                    title: data.title || '',
                    description: data.description || '',
                    price: data.price ? data.price.toString() : '',
                    location: data.location || '',
                    plotNumber: data.plotNumber || '',
                    areaName: data.areaName || '',
                    status: data.status || 'Active',
                    listingType: data.listingType || 'Basic',
                    tokenAmount: data.tokenAmount || '',
                    payoutAccountId: data.payoutAccountId?._id || data.payoutAccountId || '',
                    locationMode: data.locationMode || 'address',
                    mapCoordinates: data.mapCoordinates?.lat ? data.mapCoordinates : { lat: 23.0225, lng: 72.5714 },
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
                    locality: data.locality || '',
                    pincode: data.pincode || ''
                });

                if (data.images && data.images.length > 0) {
                    setExistingImages(data.images);
                }

                if (data.locationMode === 'map' && data.mapCoordinates?.lat) {
                    setLocationMethod('map');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load listing details.');
            } finally {
                setFetchLoading(false);
            }
        };

        if (user) fetchListing();
    }, [id, user, navigate]);

    // Fetch user payout accounts
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

    // Geocode address when city/locality changes
    useEffect(() => {
        const addressQuery = [formData.areaName, formData.city, "Gujarat, India"].filter(Boolean).join(', ');
        if (!addressQuery || addressQuery.length < 5) return;

        const timer = setTimeout(async () => {
            try {
                const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=1`);
                if (res.data && res.data.length > 0) {
                    const coords = { lat: parseFloat(res.data[0].lat), lng: parseFloat(res.data[0].lon) };
                    setGeocodedAddressCoords(coords);
                }
            } catch (e) {
                // Ignore background geocode errors
            }
        }, 1200);

        return () => clearTimeout(timer);
    }, [formData.areaName, formData.city]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleAreaValueChange = (newVal) => {
        setAreaValue(newVal);
        const numArea = parseFloat(newVal);
        if (!numArea || isNaN(numArea) || numArea <= 0) {
            if (priceMode === 'rate') {
                setFormData(prev => ({ ...prev, price: '' }));
            }
            return;
        }

        if (priceMode === 'rate') {
            const rate = parseFloat(unitRateInput);
            if (rate && !isNaN(rate) && rate > 0) {
                const calculatedTotal = Math.round(rate * numArea);
                setFormData(prev => ({ ...prev, price: String(calculatedTotal) }));
            }
        } else {
            const p = parseFloat(formData.price);
            if (p && !isNaN(p) && p > 0) {
                setUnitRateInput(String(Math.round(p / numArea)));
            }
        }
    };

    const handleAreaUnitChange = (newUnit) => {
        setAreaUnit(newUnit);
        const numArea = parseFloat(areaValue);
        if (!numArea || isNaN(numArea) || numArea <= 0) return;

        if (priceMode === 'rate') {
            const rate = parseFloat(unitRateInput);
            if (rate && !isNaN(rate) && rate > 0) {
                const calculatedTotal = Math.round(rate * numArea);
                setFormData(prev => ({ ...prev, price: String(calculatedTotal) }));
            }
        } else {
            const p = parseFloat(formData.price);
            if (p && !isNaN(p) && p > 0) {
                setUnitRateInput(String(Math.round(p / numArea)));
            }
        }
    };

    const handleTotalPriceChange = (e) => {
        const val = e.target.value;
        setFormData(prev => ({ ...prev, price: val }));
        const numPrice = parseFloat(val);
        const numArea = parseFloat(areaValue);
        if (numPrice && !isNaN(numPrice) && numArea && !isNaN(numArea) && numArea > 0) {
            setUnitRateInput(String(Math.round(numPrice / numArea)));
        } else {
            setUnitRateInput('');
        }
    };

    const handleUnitRateChange = (e) => {
        const val = e.target.value;
        setUnitRateInput(val);
        const numRate = parseFloat(val);
        const numArea = parseFloat(areaValue);
        if (numRate && !isNaN(numRate) && numArea && !isNaN(numArea) && numArea > 0) {
            const calculatedTotal = Math.round(numRate * numArea);
            setFormData(prev => ({ ...prev, price: String(calculatedTotal) }));
        } else {
            setFormData(prev => ({ ...prev, price: '' }));
        }
    };

    const handlePriceModeSwitch = (mode) => {
        setPriceMode(mode);
        const numArea = parseFloat(areaValue);
        if (mode === 'rate') {
            const numPrice = parseFloat(formData.price);
            if (numPrice && !isNaN(numPrice) && numArea && !isNaN(numArea) && numArea > 0) {
                setUnitRateInput(String(Math.round(numPrice / numArea)));
            }
        } else {
            const numRate = parseFloat(unitRateInput);
            if (numRate && !isNaN(numRate) && numArea && !isNaN(numArea) && numArea > 0) {
                const calculatedTotal = Math.round(numRate * numArea);
                setFormData(prev => ({ ...prev, price: String(calculatedTotal) }));
            }
        }
    };

    const getPricingAnalytics = () => {
        const p = parseFloat(formData.price);
        const a = parseFloat(areaValue);
        const r = parseFloat(unitRateInput);
        const unitShort = shortUnitLabels[language === 'gu' ? 'gu' : 'en'][areaUnit] || areaUnit;
        const unitFull = unitLabels[language === 'gu' ? 'gu' : 'en'][areaUnit] || areaUnit;

        const hasValidPriceAndArea = p && !isNaN(p) && p > 0 && a && !isNaN(a) && a > 0;
        const totalSqft = a > 0 ? getSqFtFromArea(a, areaUnit) : 0;
        const ratePerSqft = (hasValidPriceAndArea && totalSqft > 0) ? (p / totalSqft) : null;
        const ratePerSelectedUnit = hasValidPriceAndArea ? Math.round(p / a) : (r && !isNaN(r) ? r : null);

        return {
            hasValidPriceAndArea,
            totalPrice: p,
            areaValue: a,
            unitShort,
            unitFull,
            totalSqft: Math.round(totalSqft),
            ratePerSelectedUnit,
            ratePerSqft: ratePerSqft ? (ratePerSqft >= 10 ? Math.round(ratePerSqft) : ratePerSqft.toFixed(1)) : null,
            isSqft: areaUnit === 'sqft'
        };
    };

    // Price formatting helpers
    const formatIndianPricePreview = (price) => {
        const num = Number(price);
        if (!num || isNaN(num) || num <= 0) return null;
        if (num >= 10000000) {
            return `₹ ${(num / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
        }
        if (num >= 100000) {
            return `₹ ${(num / 100000).toFixed(2).replace(/\.00$/, '')} Lac`;
        }
        return `₹ ${num.toLocaleString('en-IN')}`;
    };

    const detectMyLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const { latitude, longitude } = pos.coords;
                setLocationMethod('map');
                setFormData(prev => ({
                    ...prev,
                    mapCoordinates: { lat: latitude, lng: longitude },
                    locationMode: 'map'
                }));
                toast.success('GPS location detected! Pin placed on map.');
            }, () => {
                toast.warning('Location access denied or failed.');
            });
        } else {
            toast.error('Geolocation is not supported by your browser.');
        }
    };

    const removeExistingImage = (idx) => {
        setExistingImages(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Mandatory at least 1 photo validation
        const totalPhotosCount = existingImages.length + (images ? images.length : 0);
        if (totalPhotosCount === 0) {
            const msg = 'At least 1 property photo is mandatory. Please upload a replacement photo before saving.';
            setError(msg);
            toast.error(msg);
            const el = document.getElementById('edit-photos-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setLoading(true);

        try {
            let uploadedImagePaths = [...existingImages];
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

            const coords = formData.mapCoordinates?.lat ? { ...formData.mapCoordinates } : { lat: null, lng: null };

            const addrParts = [
                formData.plotNumber ? `Plot/Survey ${formData.plotNumber}` : '',
                formData.areaName,
                formData.locality ? `Taluka: ${formData.locality}` : '',
                formData.city,
                formData.pincode ? `PIN: ${formData.pincode}` : '',
                "Gujarat, India"
            ].filter(Boolean);

            const finalLocation = addrParts.length > 0 ? addrParts.join(', ') : (formData.location || 'Gujarat, India');
            const locMode = coords.lat ? 'map' : 'address';

            const isAgri = formData.propertyType === 'Land'
                ? (formData.landType === 'Agricultural')
                : (formData.plotType === 'Agricultural' || formData.isAgricultural);

            const listingPayload = {
                ...formData,
                location: finalLocation,
                locationMode: locMode,
                mapCoordinates: coords,
                area: `${areaValue} ${areaUnit}`,
                price: Number(formData.price),
                images: uploadedImagePaths,
                isAgricultural: isAgri,
                cornerPlot: formData.propertyType === 'Plot' ? formData.cornerPlot : false
            };

            await axios.put(`/api/listings/${id}`, listingPayload);
            toast.success('Property listing updated successfully!');
            navigate('/my-listings');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to update property listing.');
        } finally {
            setLoading(false);
        }
    };

    // Location misalignment check
    const distanceKm = (formData.mapCoordinates?.lat && geocodedAddressCoords?.lat)
        ? getDistanceKm(formData.mapCoordinates.lat, formData.mapCoordinates.lng, geocodedAddressCoords.lat, geocodedAddressCoords.lng)
        : 0;
    const isLocationMisaligned = distanceKm > 35;

    const isTokenBookingEnabled = systemSettings?.enableTokenBooking === true;
    const totalSteps = isTokenBookingEnabled ? 4 : 3;

    if (fetchLoading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Property Details...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center max-w-md space-y-4">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                        <Building2 size={28} />
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900">Please Login to Continue</h2>
                    <p className="text-slate-500 font-medium text-xs">You must be logged in to edit this property listing.</p>
                    <button onClick={() => navigate('/login')} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md">
                        Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: "'Inter', 'Nunito Sans', sans-serif" }} className="bg-[#f8fafc] min-h-screen pb-28 text-slate-800 antialiased">

            {/* ── Top Header Banner ── */}
            <div className="bg-slate-900 text-white border-b border-slate-800 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-start gap-3.5">
                        <button
                            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/dashboard')}
                            className="mt-1 w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer shrink-0"
                            title="Go Back"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 text-blue-400 text-[10px] font-extrabold uppercase tracking-widest mb-1.5">
                                <Building2 size={13} />
                                <span>Seller Portal</span>
                                <ChevronRight size={10} className="text-slate-600" />
                                <span>Edit Listing</span>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                                    Edit Property Listing
                                </h1>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                    formData.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                    formData.status === 'Sold' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                                    'bg-slate-700 text-slate-300 border-slate-600'
                                }`}>
                                    {formData.status}
                                </span>
                            </div>
                            <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">Refine measurements, valuation rates, location pins, and media</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                        <a
                            href={`/listings/${id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl transition-all border border-slate-700 text-xs font-bold uppercase tracking-wider"
                        >
                            <ExternalLink size={14} />
                            <span>Public Page</span>
                        </a>
                        <button
                            type="button"
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="hidden lg:flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl transition-all border border-slate-700 text-xs font-bold uppercase tracking-wider"
                        >
                            {showSidebar ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
                            <span>{showSidebar ? 'Hide Preview' : 'Show Preview'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main Container ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 sm:pb-16">
                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* Left Form Column */}
                    <div className={`transition-all duration-300 w-full ${showSidebar ? 'lg:w-[68%]' : 'lg:w-full'}`}>
                        {error && (
                            <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-5 py-3.5 rounded-xl text-xs font-bold flex items-center justify-between">
                                <span className="flex items-center gap-1.5"><AlertCircle size={15} /> {error}</span>
                                <button onClick={() => setError(null)}><X size={16} /></button>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Section 1: Property Details & Pricing */}
                            <SectionCard
                                icon={<Building2 size={18} />}
                                title="Property Overview & Pricing"
                                subtitle="Define property title, category, asking price, area, and status"
                                badge={`Step 1 of ${totalSteps}`}
                            >
                                <div className="space-y-6">

                                    {/* Title & Status */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="sm:col-span-2">
                                            <label className={labelCls}>
                                                Property Title <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="title"
                                                required
                                                value={formData.title}
                                                onChange={handleChange}
                                                className={inputCls}
                                                placeholder="e.g. 4500 Sq.Ft Commercial Plot on Main Highway"
                                            />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Listing Status</label>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleChange}
                                                className={inputCls}
                                            >
                                                <option value="Active">Active (Visible)</option>
                                                <option value="Inactive">Inactive (Hidden)</option>
                                                <option value="Sold">Sold</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Category Switcher & Subtype */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelCls}>
                                                Property Category <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, propertyType: 'Plot', plotType: 'None', landType: 'None' })}
                                                    className={`py-2.5 text-xs font-extrabold rounded-lg transition-all ${formData.propertyType === 'Plot'
                                                        ? 'bg-blue-600 text-white shadow-xs'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                        }`}
                                                >
                                                    Plot
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, propertyType: 'Land', plotType: 'None', landType: 'None' })}
                                                    className={`py-2.5 text-xs font-extrabold rounded-lg transition-all ${formData.propertyType === 'Land'
                                                        ? 'bg-blue-600 text-white shadow-xs'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                        }`}
                                                >
                                                    Land
                                                </button>
                                            </div>
                                        </div>

                                        {formData.propertyType === 'Plot' && (
                                            <div>
                                                <label className={labelCls}>Plot Subtype</label>
                                                <select
                                                    name="plotType"
                                                    value={formData.plotType}
                                                    onChange={e => setFormData({ ...formData, plotType: e.target.value })}
                                                    className={inputCls}
                                                >
                                                    <option value="None">Select Plot Classification...</option>
                                                    <option value="Residential">Residential Plot</option>
                                                    <option value="Commercial">Commercial Plot</option>
                                                    <option value="Industrial">Industrial Plot</option>
                                                    <option value="Agricultural">Agricultural Plot</option>
                                                    <option value="Other">Other Category</option>
                                                </select>
                                            </div>
                                        )}

                                        {formData.propertyType === 'Land' && (
                                            <div>
                                                <label className={labelCls}>Land Subtype</label>
                                                <select
                                                    name="landType"
                                                    value={formData.landType}
                                                    onChange={e => setFormData({ ...formData, landType: e.target.value })}
                                                    className={inputCls}
                                                >
                                                    <option value="None">Select Land Classification...</option>
                                                    <option value="Agricultural">Agricultural Soil Land</option>
                                                    <option value="Non-Agricultural">Non-Agricultural (NA) Land</option>
                                                    <option value="Industrial">Industrial Land</option>
                                                    <option value="Commercial">Commercial Land</option>
                                                    <option value="Other">Other Land</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {/* 1. Area & Unit Selection (FIRST) */}
                                    <div className="p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                                <span>1. Plot / Land Area & Unit</span>
                                                <span className="text-rose-500">*</span>
                                            </label>
                                            <span className="text-[11px] font-bold text-slate-500">
                                                {language === 'gu' ? 'જમીનનું ક્ષેત્રફળ' : 'Enter Land Size'}
                                            </span>
                                        </div>

                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                required
                                                min="0.001"
                                                step="any"
                                                value={areaValue}
                                                onChange={(e) => handleAreaValueChange(e.target.value)}
                                                className={inputCls + ' w-1/2 sm:w-3/5 bg-white font-black text-slate-900'}
                                                placeholder={language === 'gu' ? 'દા.ત. 5' : 'e.g. 5 or 4500'}
                                            />
                                            <select
                                                value={areaUnit}
                                                onChange={(e) => handleAreaUnitChange(e.target.value)}
                                                className={inputCls + ' w-1/2 sm:w-2/5 text-xs sm:text-sm bg-white font-extrabold text-blue-900 border-blue-200'}
                                            >
                                                {Object.keys(unitLabels[language === 'gu' ? 'gu' : 'en']).map((key) => (
                                                    <option key={key} value={key}>
                                                        {unitLabels[language === 'gu' ? 'gu' : 'en'][key]}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* 2. Property Pricing & Valuation (SECOND) */}
                                    <div className="p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div>
                                                <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                                    <span>2. Pricing & Valuation</span>
                                                    <span className="text-rose-500">*</span>
                                                </label>
                                                <p className="text-[11px] font-semibold text-slate-500">
                                                    {language === 'gu' ? 'કુલ કિંમત અથવા પ્રતિ એકમ ભાવ પસંદ કરો' : 'Choose Total Asking Price or Rate per Unit'}
                                                </p>
                                            </div>

                                            {/* Segmented Pricing Mode Toggle */}
                                            <div className="flex items-center p-1 bg-slate-200/80 rounded-xl border border-slate-300/80 self-start sm:self-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => handlePriceModeSwitch('total')}
                                                    className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 ${priceMode === 'total'
                                                        ? 'bg-blue-600 text-white shadow-xs'
                                                        : 'text-slate-700 hover:text-slate-900'
                                                        }`}
                                                >
                                                    <IndianRupee size={12} className={priceMode === 'total' ? 'text-white' : 'text-slate-600'} />
                                                    <span>{language === 'gu' ? 'કુલ કિંમત' : 'Total Price'}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handlePriceModeSwitch('rate')}
                                                    className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 ${priceMode === 'rate'
                                                        ? 'bg-blue-600 text-white shadow-xs'
                                                        : 'text-slate-700 hover:text-slate-900'
                                                        }`}
                                                >
                                                    <Tag size={12} className={priceMode === 'rate' ? 'text-white' : 'text-slate-600'} />
                                                    <span>
                                                        {language === 'gu'
                                                            ? `ભાવ / ${shortUnitLabels.gu[areaUnit] || 'એકમ'}`
                                                            : `Rate / ${shortUnitLabels.en[areaUnit] || 'Unit'}`
                                                        }
                                                    </span>
                                                </button>
                                            </div>
                                        </div>

                                        {priceMode === 'total' ? (
                                            /* Mode A: Total Asking Price */
                                            <div className="space-y-2">
                                                <div className="relative">
                                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-500 text-sm">₹</span>
                                                    <input
                                                        type="number"
                                                        name="price"
                                                        required
                                                        min="1000"
                                                        value={formData.price}
                                                        onChange={handleTotalPriceChange}
                                                        className={inputCls + ' pl-9 bg-white font-black text-slate-900'}
                                                        placeholder="e.g. 2500000"
                                                    />
                                                </div>

                                                {/* Price Badges & Unit Breakdown */}
                                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                                    {formatIndianPricePreview(formData.price) && (
                                                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                                            {formatIndianPricePreview(formData.price)}
                                                        </span>
                                                    )}

                                                    {getPricingAnalytics().ratePerSelectedUnit && (
                                                        <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                                                            @ ₹{getPricingAnalytics().ratePerSelectedUnit.toLocaleString('en-IN')} / {getPricingAnalytics().unitShort}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            /* Mode B: Rate per Unit */
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <div className="relative">
                                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-500 text-sm">₹</span>
                                                        <input
                                                            type="number"
                                                            required
                                                            min="1"
                                                            value={unitRateInput}
                                                            onChange={handleUnitRateChange}
                                                            className={inputCls + ' pl-9 bg-white font-black text-slate-900'}
                                                            placeholder={`e.g. 500000 per ${getPricingAnalytics().unitShort}`}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Total Price Auto-calculation Card */}
                                                {getPricingAnalytics().hasValidPriceAndArea ? (
                                                    <div className="p-3 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-transparent rounded-xl border border-emerald-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                        <div>
                                                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                                                <Sparkles size={12} className="text-emerald-600" />
                                                                <span>{language === 'gu' ? 'ગણતરી કરેલ કુલ કિંમત' : 'Calculated Total Asking Price'}</span>
                                                            </div>
                                                            <div className="text-base sm:text-lg font-black text-emerald-800">
                                                                ₹ {getPricingAnalytics().totalPrice.toLocaleString('en-IN')}{' '}
                                                                <span className="text-xs font-extrabold text-emerald-600">
                                                                    ({formatIndianPricePreview(getPricingAnalytics().totalPrice)})
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="text-xs font-extrabold text-blue-700 bg-white/90 px-3 py-1.5 rounded-lg border border-blue-200 shrink-0">
                                                            {areaValue} {getPricingAnalytics().unitShort} × ₹{Number(unitRateInput).toLocaleString('en-IN')}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200 flex items-center gap-1.5">
                                                        <Lightbulb size={14} className="shrink-0 text-amber-600" />
                                                        <span>{language === 'gu' ? 'ઉપર એરિયા અને અહીં પ્રતિ એકમ ભાવ દાખલ કરો જેથી કુલ કિંમત આપમેળે ગણાશે.' : 'Enter both Area and Rate per Unit to automatically calculate the Total Price.'}</span>
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className={labelCls}>
                                            Detailed Property Description <span className="text-rose-500">*</span>
                                        </label>
                                        <textarea
                                            name="description"
                                            required
                                            rows="4"
                                            value={formData.description}
                                            onChange={handleChange}
                                            className={inputCls + ' resize-none'}
                                            placeholder="Write a clear description including road connectivity, nearby landmarks, soil quality, or development potential..."
                                        />
                                    </div>

                                    {/* Property Feature Checkboxes */}
                                    <div>
                                        <label className={labelCls}>Key Attribute Badges</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                            {formData.propertyType === 'Plot' && (
                                                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.cornerPlot}
                                                        onChange={e => setFormData({ ...formData, cornerPlot: e.target.checked })}
                                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-xs font-bold text-slate-700">Corner Plot (2-side)</span>
                                                </label>
                                            )}
                                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.roadTouch}
                                                    onChange={e => setFormData({ ...formData, roadTouch: e.target.checked })}
                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-xs font-bold text-slate-700">Direct Road Touch</span>
                                            </label>
                                            {formData.propertyType === 'Plot' && (
                                                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.isAgricultural}
                                                        onChange={e => setFormData({ ...formData, isAgricultural: e.target.checked })}
                                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-xs font-bold text-slate-700">Agricultural Soil</span>
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>

                            {/* Section 2: Location & GPS Mapping */}
                            <SectionCard
                                icon={<MapPin size={18} />}
                                title="Location & GPS Pin Mapping"
                                subtitle="Specify geographic address, survey number, and exact map coordinate"
                                badge="Step 2 of 4"
                            >
                                <div className="space-y-6">

                                    {/* City & Locality */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelCls}>
                                                City / District <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="city"
                                                required
                                                value={formData.city}
                                                onChange={handleChange}
                                                className={inputCls}
                                                placeholder="e.g. Ahmedabad, Surat, Vadodara, Palanpur"
                                            />
                                        </div>
                                        <div>
                                            <label className={labelCls}>
                                                Locality / Area / Society <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="areaName"
                                                required
                                                value={formData.areaName}
                                                onChange={handleChange}
                                                className={inputCls}
                                                placeholder="e.g. South Bopal, S.G. Highway, Vesu"
                                            />
                                        </div>
                                    </div>

                                    {/* Taluka, Plot No & Pincode */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className={labelCls}>Taluka / Sub-Region / Village</label>
                                            <input
                                                type="text"
                                                name="locality"
                                                value={formData.locality}
                                                onChange={handleChange}
                                                className={inputCls}
                                                placeholder="e.g. Daskroi, Vadgam, Sanand"
                                            />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Plot / Survey / Block No.</label>
                                            <input
                                                type="text"
                                                name="plotNumber"
                                                value={formData.plotNumber}
                                                onChange={handleChange}
                                                className={inputCls}
                                                placeholder="e.g. Plot 42 / Survey No. 108"
                                            />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Pincode / Landmark</label>
                                            <input
                                                type="text"
                                                name="pincode"
                                                value={formData.pincode}
                                                onChange={handleChange}
                                                className={inputCls}
                                                placeholder="e.g. 380058"
                                            />
                                        </div>
                                    </div>

                                    {/* Formatted Address Preview Box */}
                                    {(formData.city || formData.areaName || formData.plotNumber) && (
                                        <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2.5">
                                            <MapPin size={16} className="text-blue-600 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-widest block">Formatted Address Preview</span>
                                                <p className="text-xs font-bold text-slate-800 mt-0.5">
                                                    {[
                                                        formData.plotNumber ? `Plot/Survey ${formData.plotNumber}` : '',
                                                        formData.areaName,
                                                        formData.locality ? `Taluka: ${formData.locality}` : '',
                                                        formData.city,
                                                        formData.pincode ? `PIN: ${formData.pincode}` : '',
                                                        "Gujarat, India"
                                                    ].filter(Boolean).join(', ')}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Satellite Map & GPS Marker */}
                                    <div className="pt-4 border-t border-slate-100 space-y-3">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                            <div>
                                                <span className="text-xs font-extrabold text-slate-900 block">Pin Exact Satellite GPS Location</span>
                                                <p className="text-[11px] text-slate-500 font-normal">Click anywhere on the map or use sync/detect buttons to position the pin.</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {geocodedAddressCoords && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, mapCoordinates: geocodedAddressCoords }));
                                                            toast.success(`Map pin centered to ${formData.areaName || formData.city || 'address'}!`);
                                                        }}
                                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 border border-slate-300"
                                                    >
                                                        <Target size={12} /> Sync Pin to Address
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={detectMyLocation}
                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs"
                                                >
                                                    <Navigation size={12} /> Detect GPS
                                                </button>
                                            </div>
                                        </div>

                                        {isLocationMisaligned && (
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start justify-between gap-3 text-xs font-bold text-amber-900">
                                                <div className="flex items-start gap-2">
                                                    <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                                                    <div>
                                                        <span className="block font-extrabold text-amber-900">Map Marker Misalignment Warning</span>
                                                        <span className="font-normal text-amber-800 text-[11px] block mt-0.5">
                                                            Your map pin is placed <strong>~{Math.round(distanceKm)} km away</strong> from <strong>{formData.city || formData.areaName}</strong>.
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (geocodedAddressCoords) {
                                                            setFormData(prev => ({ ...prev, mapCoordinates: geocodedAddressCoords }));
                                                            toast.success(`Map pin fixed to ${formData.city || formData.areaName}!`);
                                                        }
                                                    }}
                                                    className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg text-[10px] uppercase font-extrabold tracking-wider transition-all"
                                                >
                                                    Fix & Sync Pin
                                                </button>
                                            </div>
                                        )}

                                        <div className="h-64 sm:h-80 w-full rounded-xl overflow-hidden border border-slate-300 shadow-inner relative z-0">
                                            <div className="absolute top-3 right-3 z-[1000] flex items-center bg-white/95 backdrop-blur-sm p-1 rounded-xl shadow-md border border-slate-200 text-xs font-bold">
                                                <button
                                                    type="button"
                                                    onClick={() => setMapLayer('satellite')}
                                                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${mapLayer === 'satellite' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                                                >
                                                    <Satellite size={13} />
                                                    <span>Satellite</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMapLayer('streets')}
                                                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${mapLayer === 'streets' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                                                >
                                                    <Map size={13} />
                                                    <span>Street Map</span>
                                                </button>
                                            </div>

                                            <MapContainer
                                                center={formData.mapCoordinates?.lat ? [formData.mapCoordinates.lat, formData.mapCoordinates.lng] : [23.0225, 72.5714]}
                                                zoom={formData.mapCoordinates?.lat ? 16 : 11}
                                                scrollWheelZoom={true}
                                                className="w-full h-full"
                                            >
                                                {mapLayer === 'satellite' ? (
                                                    <TileLayer
                                                        attribution='&copy; Google Satellite'
                                                        url="https://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}"
                                                        maxZoom={20}
                                                    />
                                                ) : (
                                                    <TileLayer
                                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                    />
                                                )}
                                                <LocationMarker
                                                    position={formData.mapCoordinates?.lat ? [formData.mapCoordinates.lat, formData.mapCoordinates.lng] : null}
                                                    setPosition={(pos) => setFormData(p => ({ ...p, mapCoordinates: { lat: pos.lat, lng: pos.lng } }))}
                                                />
                                                <MapRecenter position={formData.mapCoordinates} />
                                            </MapContainer>
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>

                            {/* Section 3: Photos & Visual Assets */}
                            <div id="edit-photos-section">
                                <SectionCard
                                    icon={<UploadCloud size={18} />}
                                    title="Photo Gallery & Visual Assets"
                                    subtitle="Manage existing property pictures or upload new high-resolution images"
                                    badge={`Step 3 of ${totalSteps}`}
                                >
                                    <div className="space-y-5">
                                        {existingImages.length === 0 && (!images || images.length === 0) && (
                                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-800">
                                                <AlertCircle size={15} className="text-rose-600 shrink-0" />
                                                <span>Photo Required: All photos were removed. Please upload at least 1 replacement photo before saving.</span>
                                            </div>
                                        )}

                                        {/* Existing Uploaded Images */}
                                        {existingImages.length > 0 && (
                                        <div>
                                            <span className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                                                Existing Photos ({existingImages.length})
                                            </span>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {existingImages.map((img, idx) => (
                                                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 shadow-2xs">
                                                        <img
                                                            src={getImageUrl(img)}
                                                            alt={`Property ${idx + 1}`}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                        />
                                                        {idx === 0 && (
                                                            <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
                                                                Cover Photo
                                                            </span>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeExistingImage(idx)}
                                                            className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-lg shadow-sm transition-all cursor-pointer opacity-90 hover:opacity-100"
                                                            title="Remove photo"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Upload New Photos */}
                                    <div>
                                        <span className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                                            Upload New Photos (Optional)
                                        </span>
                                        <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer transition-all">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                                                <UploadCloud size={24} />
                                            </div>
                                            <p className="text-xs sm:text-sm font-bold text-slate-800 text-center">
                                                Click to upload new images <span className="text-slate-400 font-normal">or drag & drop</span>
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, JPEG up to 10MB each</p>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={e => setImages(e.target.files)}
                                                className="hidden"
                                            />
                                        </label>

                                        {images && images.length > 0 && (
                                            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                                                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                                                    <CheckCircle2 size={14} className="text-emerald-600" />
                                                    <span>{images.length} new photo(s) selected for upload</span>
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setImages(null)}
                                                    className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </SectionCard>
                        </div>

                            {/* Section 4: Token Booking & Escrow (Conditional) */}
                            {isTokenBookingEnabled && (
                                <SectionCard
                                    icon={<CreditCard size={18} />}
                                    title="Token Booking & Direct Escrow"
                                    subtitle="Allow verified buyers to reserve this property online"
                                    badge={`Step 4 of ${totalSteps}`}
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                            <div>
                                                <span className="text-xs font-bold text-slate-900 block">Enable Online Token Booking</span>
                                                <span className="text-[11px] text-slate-500">Allow serious buyers to pay a 2% refundable reservation token directly.</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, isBookingEnabled: !formData.isBookingEnabled })}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${formData.isBookingEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isBookingEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>

                                        {formData.isBookingEnabled && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                                <div>
                                                    <label className={labelCls}>Token Reservation Amount (₹)</label>
                                                    <input
                                                        type="number"
                                                        name="tokenAmount"
                                                        value={formData.tokenAmount}
                                                        onChange={handleChange}
                                                        className={inputCls}
                                                        placeholder="e.g. 50000"
                                                    />
                                                </div>
                                                <div>
                                                    <label className={labelCls}>Payout Bank Account</label>
                                                    <select
                                                        name="payoutAccountId"
                                                        value={formData.payoutAccountId}
                                                        onChange={handleChange}
                                                        className={inputCls}
                                                    >
                                                        <option value="">Select receiving bank account...</option>
                                                        {payoutAccounts.map(acc => (
                                                            <option key={acc._id} value={acc._id}>
                                                                {acc.bankName} - •••• {acc.accountNumber?.slice(-4)} ({acc.accountHolderName})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </SectionCard>
                            )}

                            {/* Form Action Buttons (Mobile & Bottom of Form) */}
                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => navigate('/my-listings')}
                                    className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <RefreshCw size={15} className="animate-spin" />
                                            <span>Saving Changes...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={15} />
                                            <span>Save & Update Property</span>
                                        </>
                                    )}
                                </button>
                            </div>

                        </form>
                    </div>

                    {/* Right Sticky Preview Sidebar Column */}
                    {showSidebar && (
                        <div className="hidden lg:block w-[32%] sticky top-24 space-y-5">
                            
                            {/* Live Card Preview */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Eye size={15} className="text-blue-600" />
                                        <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Live Card Preview</span>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                        formData.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                                        formData.status === 'Sold' ? 'bg-amber-100 text-amber-800' :
                                        'bg-slate-200 text-slate-700'
                                    }`}>
                                        {formData.status}
                                    </span>
                                </div>

                                <div className="p-4 space-y-4">
                                    <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden relative border border-slate-100">
                                        {existingImages[0] ? (
                                            <img
                                                src={getImageUrl(existingImages[0])}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                                                <ImageIcon size={28} />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">No Photo Available</span>
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2 flex items-center gap-1">
                                            <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md">
                                                {formData.propertyType}
                                            </span>
                                            {formData.listingType === 'Verified' && (
                                                <span className="bg-blue-600 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                                    <ShieldCheck size={10} /> Verified
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-extrabold text-slate-900 text-sm line-clamp-1">
                                            {formData.title || 'Untitled Property Listing'}
                                        </h4>
                                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1 truncate">
                                            <MapPin size={12} className="text-blue-600 shrink-0" />
                                            <span>
                                                {[formData.areaName, formData.city].filter(Boolean).join(', ') || 'Location not specified'}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Price</span>
                                            <span className="font-black text-slate-900 text-sm">
                                                {formatIndianPricePreview(formData.price) || `₹ ${Number(formData.price || 0).toLocaleString('en-IN')}`}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Area</span>
                                            <span className="font-bold text-slate-800 text-xs">
                                                {areaValue ? `${areaValue} ${areaUnit}` : '—'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {formData.roadTouch && (
                                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                                                Road Touch
                                            </span>
                                        )}
                                        {formData.cornerPlot && (
                                            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                                                Corner Plot
                                            </span>
                                        )}
                                        {formData.isAgricultural && (
                                            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                                                Agricultural
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Help Card */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-100 p-5 space-y-2.5">
                                <div className="flex items-center gap-2 text-blue-800 font-extrabold text-xs">
                                    <Sparkles size={15} />
                                    <span>Tips for Faster Inquiries</span>
                                </div>
                                <ul className="text-[11px] text-slate-600 font-medium space-y-1.5 list-disc list-inside">
                                    <li>Accurate GPS coordinates get 3x more buyer map views.</li>
                                    <li>Add high quality photos with direct road access visible.</li>
                                    <li>Mention legal status and zone permissions in description.</li>
                                </ul>
                            </div>

                        </div>
                    )}

                </div>
            </div>

            {/* ── Sticky Bottom Floating Bar ── */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-4 sm:px-8 shadow-lg">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/my-listings')}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                            Back to Listings
                        </button>
                        <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                            Editing: <strong className="text-slate-800">{formData.title || 'Property'}</strong>
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <a
                            href={`/listings/${id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                        >
                            <ExternalLink size={13} />
                            <span className="hidden sm:inline">View Public Page</span>
                        </a>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                        >
                            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                            <span>Save Changes</span>
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default EditListing;
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import {
    UploadCloud, MapPin, Tag, Navigation, Target, Maximize, X, Building2,
    IndianRupee, Layers, FileText, CreditCard, ChevronRight, ZapOff,
    LayoutDashboard, Eye, Edit3, PanelRightClose, PanelRightOpen, ExternalLink,
    PlusCircle, Sparkles, Search as SearchIcon, CheckCircle2, Zap, Check,
    Trash2, Image as ImageIcon, Info, ShieldCheck, Compass, LandPlot, Sparkle,
    AlertCircle, AlertTriangle, ArrowLeft, Lightbulb, Coins
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
        listingType: 'Basic',
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
    const [priceMode, setPriceMode] = useState('total'); // 'total' | 'rate'
    const [unitRateInput, setUnitRateInput] = useState('');
    const [images, setImages] = useState(null);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [videos, setVideos] = useState(null);
    const [videoPreviews, setVideoPreviews] = useState([]);
    const [geocodedAddressCoords, setGeocodedAddressCoords] = useState(null);

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


    // Auto-recenter map when City or Locality changes
    useEffect(() => {
        const searchLoc = [formData.areaName, formData.city, "Gujarat, India"].filter(Boolean).join(', ');
        if (!formData.city && !formData.areaName) return;

        const timer = setTimeout(async () => {
            try {
                const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLoc)}&limit=1`);
                if (res.data && res.data.length > 0) {
                    const { lat, lon } = res.data[0];
                    const pos = { lat: parseFloat(lat), lng: parseFloat(lon) };
                    setGeocodedAddressCoords(pos);

                    // Auto-sync map coordinates to typed address if user hasn't set map coordinates yet
                    if (!formData.mapCoordinates.lat) {
                        setFormData(prev => ({
                            ...prev,
                            mapCoordinates: pos
                        }));
                    }
                }
            } catch (e) {
                console.error("Address auto-geocode error", e);
            }
        }, 700);

        return () => clearTimeout(timer);
    }, [formData.city, formData.areaName]);

    // Prefill from Property Wallet
    useEffect(() => {
        try {
            const rawPrefill = sessionStorage.getItem('walletPrefill');
            if (rawPrefill) {
                const data = JSON.parse(rawPrefill);
                sessionStorage.removeItem('walletPrefill');
                
                setFormData(prev => ({
                    ...prev,
                    title: data.title || prev.title,
                    description: data.description || prev.description,
                    price: data.price ? String(data.price) : prev.price,
                    location: data.location || prev.location,
                    city: data.city || prev.city,
                    locality: data.locality || prev.locality,
                    propertyType: data.propertyType || prev.propertyType,
                    landType: data.landType || prev.landType
                }));

                const areaVal = data.areaValue || data.area;
                if (areaVal) {
                    const match = String(areaVal).match(/^([\d.]+)/);
                    setAreaValue(match ? match[1] : String(areaVal));
                }

                if (data.areaUnit) {
                    setAreaUnit(data.areaUnit);
                }

                if (data.images && data.images.length > 0) {
                    setImagePreviews(data.images);
                }

                toast.info('✨ Loaded property details from your Wallet. Complete any missing fields and submit!');
            }
        } catch (e) {
            console.error('Failed to parse wallet prefill', e);
        }
    }, []);

    const distanceKm = (formData.mapCoordinates.lat && geocodedAddressCoords?.lat)
        ? getDistanceKm(formData.mapCoordinates.lat, formData.mapCoordinates.lng, geocodedAddressCoords.lat, geocodedAddressCoords.lng)
        : 0;

    const isLocationMisaligned = distanceKm > 25;

    const { data: systemSettings } = useQuery({
        queryKey: ['systemSettings'],
        queryFn: async () => {
            const res = await axios.get('/api/settings');
            return res.data.data;
        }
    });

    const isTokenBookingEnabled = systemSettings?.enableTokenBooking === true;
    const totalSteps = isTokenBookingEnabled ? 4 : 3;

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

    const handleMediaChange = (e) => {
        const files = Array.from(e.target.files || []);

        const imgFiles = [];
        const vidFiles = [];
        const imgPrevs = [...imagePreviews];
        const vidPrevs = [...videoPreviews];

        files.forEach(file => {
            if (file.type.startsWith('video/')) {
                vidFiles.push(file);
                vidPrevs.push(URL.createObjectURL(file));
            } else {
                imgFiles.push(file);
                imgPrevs.push(URL.createObjectURL(file));
            }
        });

        if (imgFiles.length > 0) {
            setImages(prev => {
                const dt = new DataTransfer();
                if (prev) Array.from(prev).forEach(f => dt.items.add(f));
                imgFiles.forEach(f => dt.items.add(f));
                return dt.files;
            });
            setImagePreviews(imgPrevs);
        }

        if (vidFiles.length > 0) {
            setVideos(prev => {
                const dt = new DataTransfer();
                if (prev) Array.from(prev).forEach(f => dt.items.add(f));
                vidFiles.forEach(f => dt.items.add(f));
                return dt.files;
            });
            setVideoPreviews(vidPrevs);
        }
    };

    const removeImagePreview = (index) => {
        if (!images) return;
        const dt = new DataTransfer();
        const files = Array.from(images);
        files.forEach((file, i) => {
            if (i !== index) dt.items.add(file);
        });
        setImages(dt.files);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        setImagePreviews(newPreviews);
    };

    const removeVideoPreview = (index) => {
        if (!videos) return;
        const dt = new DataTransfer();
        const files = Array.from(videos);
        files.forEach((file, i) => {
            if (i !== index) dt.items.add(file);
        });
        setVideos(dt.files);
        const newPreviews = videoPreviews.filter((_, i) => i !== index);
        setVideoPreviews(newPreviews);
    };



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

    const calculatedRatePerSqft = () => {
        const p = parseFloat(formData.price);
        const a = parseFloat(areaValue);
        if (isNaN(p) || isNaN(a) || p <= 0 || a <= 0) return null;
        return Math.round(p / a);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Mandatory at least 1 photo validation
        if (!images || images.length === 0) {
            const msg = 'At least 1 property photo is mandatory to publish a listing.';
            setError(msg);
            toast.error(msg);
            const el = document.getElementById('media-upload-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setLoading(true);
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

            let uploadedVideoPaths = [];
            if (videos && videos.length > 0) {
                for (let i = 0; i < videos.length; i++) {
                    const vidData = new FormData();
                    vidData.append('file', videos[i]);
                    const uploadRes = await axios.post('/api/uploads', vidData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    if (uploadRes.data.success) {
                        uploadedVideoPaths.push(uploadRes.data.data);
                    }
                }
            }

            let coords = formData.mapCoordinates?.lat ? { ...formData.mapCoordinates } : { lat: null, lng: null };

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
                videos: uploadedVideoPaths,
                plotNumber: formData.plotNumber,
                areaName: formData.areaName,
                isAgricultural: isAgri,
                cornerPlot: formData.propertyType === 'Plot' ? formData.cornerPlot : false
            };
            await axios.post('/api/listings', listingPayload);

            toast.success('Property listing successfully published!');
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to create listing.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center max-w-md space-y-4">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                        <Building2 size={28} />
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900">Please Login to Continue</h2>
                    <p className="text-slate-500 font-medium text-xs">You must be logged in to post your land or plot listing.</p>
                    <button onClick={() => navigate('/login')} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md">
                        Login to Post Property
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: "'Inter', 'Nunito Sans', sans-serif" }} className="bg-[#f8fafc] min-h-screen pb-20 text-slate-800 antialiased">

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
                                <ChevronRight size={10} />
                                <span>Create New Property Listing</span>
                            </div>
                            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                                {t('create_listing.title')}
                            </h1>
                            <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">{t('create_listing.subtitle')}</p>
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-3">
                        <button
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl transition-all border border-slate-700 text-xs font-bold uppercase tracking-wider"
                        >
                            {showSidebar ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                            <span>{showSidebar ? t('create_listing.hide_portfolio') : t('create_listing.view_portfolio')}</span>
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

                            {/* Section 1: Property Details */}
                            <SectionCard
                                icon={<Building2 size={18} />}
                                title={t('create_listing.prop_details_title')}
                                subtitle={t('create_listing.prop_details_subtitle')}
                                badge={`Step 1 of ${totalSteps}`}
                            >
                                <div className="space-y-6">

                                    {/* Property Title */}
                                    <div>
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
                                title={t('create_listing.location_title')}
                                subtitle={t('create_listing.location_subtitle')}
                                badge={`Step 2 of ${totalSteps}`}
                            >
                                <div className="space-y-6">

                                    {/* Row 1: City & Locality */}
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

                                    {/* Row 2: Taluka, Plot No & Pincode */}
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
                                                value={formData.pincode || ''}
                                                onChange={handleChange}
                                                className={inputCls}
                                                placeholder="e.g. Near Temple, 380058"
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
                                                <span className="text-xs font-extrabold text-slate-900 block">Pin Exact Satellite GPS Location (Recommended)</span>
                                                <p className="text-[11px] text-slate-500 font-normal">Click anywhere on the map or use sync/detect buttons to set the exact marker for buyers.</p>
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

                                        {/* Warning Alert if Map Marker is placed far away from Address City/Locality */}
                                        {isLocationMisaligned && (
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start justify-between gap-3 text-xs font-bold text-amber-900">
                                                <div className="flex items-start gap-2">
                                                    <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                                                    <div>
                                                        <span className="block font-extrabold text-amber-900">Map Marker Misalignment Warning</span>
                                                        <span className="font-normal text-amber-800 text-[11px] block mt-0.5">
                                                            Your map pin is placed <strong>~{Math.round(distanceKm)} km away</strong> from <strong>{formData.city || formData.areaName}</strong>. If this is accidental, click Sync Pin to fix it.
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

                                        <div className="w-full h-80 rounded-xl overflow-hidden border border-slate-300 relative z-0">
                                            <MapContainer center={[formData.mapCoordinates.lat || 23.0225, formData.mapCoordinates.lng || 72.5714]} zoom={14} style={{ height: '100%', width: '100%' }}>
                                                <TileLayer url="https://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}" maxZoom={20} />
                                                <LocationMarker
                                                    position={formData.mapCoordinates.lat ? formData.mapCoordinates : null}
                                                    setPosition={(pos) => setFormData({ ...formData, mapCoordinates: pos })}
                                                    setLocation={(addr) => setFormData(prev => ({ ...prev, location: addr }))}
                                                />
                                                <MapRecenter position={formData.mapCoordinates} />
                                            </MapContainer>
                                        </div>

                                        {formData.mapCoordinates.lat && (
                                            <div className="flex items-center justify-between text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold">
                                                <div className="flex items-center gap-1.5">
                                                    <CheckCircle2 size={14} />
                                                    <span>GPS Location Mapped ({parseFloat(formData.mapCoordinates.lat).toFixed(4)}° N, {parseFloat(formData.mapCoordinates.lng).toFixed(4)}° E)</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, mapCoordinates: { lat: null, lng: null } }))}
                                                    className="text-slate-400 hover:text-rose-600 text-[10px] font-bold uppercase tracking-wider underline"
                                                >
                                                    Clear Map Marker
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </SectionCard>

                            {/* Section 3: Property Media (Unified Photos & Video Dropzone) */}
                            <div id="media-upload-section">
                                <SectionCard
                                    icon={<UploadCloud size={18} />}
                                    title={t('create_listing.visual_portfolio_title')}
                                    subtitle={t('create_listing.visual_portfolio_subtitle')}
                                    badge={`Step 3 of ${totalSteps}`}
                                >
                                    <div className="space-y-5 font-['Nunito_Sans',sans-serif]">
                                        {imagePreviews.length === 0 && (
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-900">
                                                <AlertCircle size={15} className="text-amber-600 shrink-0" />
                                                <span>At least 1 property photo is mandatory to publish this listing.</span>
                                            </div>
                                        )}

                                    {/* Single Unified Drag & Drop Dropzone */}
                                    <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center bg-slate-50/80 hover:bg-blue-50/40 transition-all cursor-pointer relative group">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*,video/*"
                                            onChange={handleMediaChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-100/80 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <UploadCloud size={24} />
                                        </div>
                                        <p className="text-slate-900 font-black text-sm sm:text-base mb-1">
                                            {(imagePreviews.length > 0 || videoPreviews.length > 0)
                                                ? `${imagePreviews.length} photo(s) & ${videoPreviews.length} video(s) selected`
                                                : 'Click or Drag Property Photos & Videos Here'
                                            }
                                        </p>
                                        <p className="text-slate-500 text-xs font-semibold">
                                            Upload JPG, PNG, WEBP photos or MP4, WEBM, MOV videos together
                                        </p>
                                    </div>

                                    {/* Categorized Media Previews */}
                                    {(imagePreviews.length > 0 || videoPreviews.length > 0) && (
                                        <div className="space-y-4 pt-2">

                                            {/* Photo Previews Strip */}
                                            {imagePreviews.length > 0 && (
                                                <div className="space-y-2">
                                                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                                        <ImageIcon size={14} className="text-blue-600" />
                                                        <span>Property Photos ({imagePreviews.length})</span>
                                                    </h5>
                                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                                        {imagePreviews.map((preview, idx) => (
                                                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group shadow-2xs">
                                                                <img src={preview} alt={`Photo ${idx}`} className="w-full h-full object-cover" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeImagePreview(idx)}
                                                                    className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full opacity-90 hover:opacity-100 transition-opacity shadow-md cursor-pointer"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Video Previews Strip */}
                                            {videoPreviews.length > 0 && (
                                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                                        <Sparkles size={14} className="text-amber-500" />
                                                        <span>Video Walkthrough ({videoPreviews.length})</span>
                                                    </h5>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {videoPreviews.map((vPreview, idx) => (
                                                            <div key={idx} className="relative rounded-xl overflow-hidden border border-amber-200 bg-slate-900 aspect-video group">
                                                                <video src={vPreview} controls className="w-full h-full object-cover" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeVideoPreview(idx)}
                                                                    className="absolute top-2 right-2 bg-rose-600 text-white p-1 rounded-full opacity-90 hover:opacity-100 transition-opacity shadow-md z-20 cursor-pointer"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    )}

                                </div>
                            </SectionCard>
                        </div>



                            {/* Section 4: Instant Token Reservation */}
                            {isTokenBookingEnabled && (
                                <SectionCard
                                    icon={<CreditCard size={18} />}
                                    title={t('create_listing.instant_booking_title')}
                                    subtitle={t('create_listing.instant_booking_subtitle')}
                                    badge={`Step 4 of ${totalSteps}`}
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                            <div>
                                                <p className="font-extrabold text-slate-900 text-sm">Allow Instant Token Reservation</p>
                                                <p className="text-xs text-slate-500 font-medium">Buyers can reserve your property online by paying a token fee</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, isBookingEnabled: !formData.isBookingEnabled })}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all cursor-pointer ${formData.isBookingEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all ${formData.isBookingEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>

                                        {formData.isBookingEnabled && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                                <div>
                                                    <label className={labelCls}>Reservation Token Amount (₹)</label>
                                                    <input
                                                        type="number"
                                                        value={formData.tokenAmount}
                                                        onChange={(e) => setFormData({ ...formData, tokenAmount: e.target.value })}
                                                        className={inputCls}
                                                        placeholder="e.g. 25000"
                                                    />
                                                </div>

                                                {payoutAccounts.length > 0 && (
                                                    <div>
                                                        <label className={labelCls}>Payout Bank / UPI Account</label>
                                                        <select
                                                            value={formData.payoutAccountId}
                                                            onChange={(e) => setFormData({ ...formData, payoutAccountId: e.target.value })}
                                                            className={inputCls}
                                                        >
                                                            {payoutAccounts.map(acc => (
                                                                <option key={acc._id} value={acc._id}>{acc.accountType} — {acc.bankName || acc.upiId}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </SectionCard>
                            )}

                            {/* Final Submit Banner */}
                            <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg text-white">
                                <div>
                                    <h4 className="font-extrabold text-base sm:text-lg">{t('create_listing.title')}</h4>
                                    <p className="text-slate-400 text-xs font-medium">{t('create_listing.subtitle')}</p>
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => navigate(-1)}
                                        className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                                    >
                                        {loading ? (
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                        ) : (
                                            <>
                                                <Tag size={15} />
                                                <span>{t('create_listing.submit_btn')}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                        </form>
                    </div>

                    {/* Right Portfolio Sidebar */}
                    <AnimatePresence>
                        {showSidebar && (
                            <div className="hidden lg:block lg:w-[32%] sticky top-24 self-start space-y-6">
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                        <div>
                                            <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block">Portfolio</span>
                                            <h3 className="text-base font-extrabold text-slate-900">My Listings</h3>
                                        </div>
                                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                                            <LayoutDashboard size={16} />
                                        </div>
                                    </div>

                                    {/* Listings list */}
                                    <div className="space-y-3">
                                        {!myListingsData || myListingsData.length === 0 ? (
                                            <div className="py-8 text-center text-slate-400 text-xs font-medium">
                                                No listings published yet.
                                            </div>
                                        ) : (
                                            myListingsData.slice(0, 4).map((item) => (
                                                <div key={item._id} className="flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 transition-all group">
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-200">
                                                        {item.images?.length > 0 ? (
                                                            <img src={getImageUrl(item.images[0])} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400 font-bold">NO IMG</div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h5 className="font-bold text-slate-900 text-xs truncate group-hover:text-blue-600 transition-colors">{item.title}</h5>
                                                        <p className="text-[10px] font-extrabold text-slate-500">₹{item.price?.toLocaleString('en-IN')}</p>
                                                    </div>
                                                    <Link to={`/listings/${item._id}`} target="_blank" className="p-1.5 text-slate-400 hover:text-blue-600">
                                                        <ExternalLink size={14} />
                                                    </Link>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all uppercase tracking-wider text-center"
                                    >
                                        View All Listings in Dashboard
                                    </button>
                                </div>

                                {/* Pro Tip Card */}
                                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 space-y-2">
                                    <div className="flex items-center gap-2 text-blue-700 font-extrabold text-xs uppercase tracking-wider">
                                        <Sparkles size={16} />
                                        <span>Pro Seller Tip</span>
                                    </div>
                                    <p className="text-slate-600 text-xs leading-relaxed font-medium">
                                        Listings with at least 3 high-resolution photos and precise satellite map locations receive **up to 4x more buyer enquiries**!
                                    </p>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>

                </div>
            </div>
        </div>
    );
};

export default CreateListing;
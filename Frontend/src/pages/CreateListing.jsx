import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { UploadCloud, MapPin, Tag, Navigation, Target, Maximize, X, Building2, IndianRupee, Layers, FileText, CreditCard, ChevronRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
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
    return position.lat === null ? null : <Marker position={position}></Marker>;
}

function MapRecenter({ position, bounds }) {
    const map = useMap();
    React.useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds);
        } else if (position.lat) {
            map.setView([position.lat, position.lng], map.getZoom() < 12 ? 14 : map.getZoom());
        }
    }, [position, bounds, map]);
    return null;
}

// Step indicator pill
const StepPill = ({ number, label, active, done }) => (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${
        done ? 'bg-[#c9a84c] text-[#1a2340] border-[#c9a84c]'
        : active ? 'bg-[#1a2340] text-[#c9a84c] border-[#1a2340]'
        : 'bg-transparent text-[#1a2340]/40 border-[#1a2340]/20'
    }`}>
        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
            done ? 'bg-[#1a2340] text-[#c9a84c]'
            : active ? 'bg-[#c9a84c] text-[#1a2340]'
            : 'bg-[#1a2340]/10 text-[#1a2340]/40'
        }`}>{done ? '✓' : number}</span>
        {label}
    </div>
);

// Section card wrapper
const SectionCard = ({ icon, title, subtitle, children, accent }) => (
    <div className="relative bg-white rounded-2xl border border-[#1a2340]/10 shadow-sm overflow-hidden">
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

const inputCls = "w-full px-5 py-3.5 rounded-xl border border-[#1a2340]/15 bg-[#f8f5ee]/60 focus:ring-2 focus:ring-[#c9a84c]/40 focus:border-[#c9a84c] outline-none transition-all font-semibold text-[#1a2340] text-base placeholder:text-[#1a2340]/30";
const labelCls = "block text-[10px] font-black text-[#1a2340]/50 mb-2 uppercase tracking-[0.15em]";

const CreateListing = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        location: '',
        listingType: 'Verified',
        isBookingEnabled: false,
        tokenAmount: '',
        payoutAccountId: '',
        mapCoordinates: { lat: null, lng: null },
        mapBounds: null
    });
    const [payoutAccounts, setPayoutAccounts] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [locationMethod, setLocationMethod] = useState('address');
    const [areaValue, setAreaValue] = useState('');
    const [areaUnit, setAreaUnit] = useState('Sq Ft');
    const [images, setImages] = useState(null);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // Live Geographic Autocomplete Engine (Nominatim)
    React.useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (formData.location && formData.location.trim().length > 2 && !formData.mapCoordinates.lat) {
                try {
                    const res = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formData.location)}&format=json&limit=5&addressdetails=1`);
                    setSuggestions(res.data);
                    setShowSuggestions(true);
                } catch (e) {
                    console.error("Nominatim error", e);
                }
            } else if (!formData.location || formData.location.length <= 2) {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 600);
        return () => clearTimeout(timeoutId);
    }, [formData.location, formData.mapCoordinates.lat]);

    const detectMyLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                const address = await reverseGeocode(latitude, longitude);
                setFormData({
                    ...formData,
                    location: address || formData.location,
                    mapCoordinates: { lat: latitude, lng: longitude },
                    mapBounds: null
                });
            }, () => {
                toast.warning('Location access denied or failed.');
            });
        } else {
            toast.error('Geolocation is not supported by your browser.');
        }
    };

    // Fetch payout accounts on mount
    React.useEffect(() => {
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
            const listingPayload = {
                ...formData,
                area: `${areaValue} ${areaUnit}`,
                price: Number(formData.price),
                images: uploadedImagePaths
            };
            await axios.post('/api/listings', listingPayload);
            toast.success('Listing successfully created! Taking you back to your Dashboard.');
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to create listing. Make sure fields are valid.');
        } finally {
            setLoading(false);
        }
    };

    if (!user || (user.role !== 'Seller' && user.role !== 'Broker')) {
        return (
            <div className="min-h-screen bg-[#f8f5ee] flex items-center justify-center">
                <div className="bg-white rounded-2xl border border-red-100 shadow p-10 text-center max-w-md">
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
            {/* Top hero bar */}
            <div className="bg-[#1a2340] text-white px-6 py-10 md:px-16">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-2 text-[#c9a84c] text-xs font-bold uppercase tracking-[0.2em] mb-3">
                        <Building2 size={14} />
                        <span>SplusPropertys</span>
                        <ChevronRight size={12} />
                        <span>New Listing</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
                        Launch Your <span className="text-[#c9a84c]">Property Listing</span>
                    </h1>
                    <p className="text-white/50 font-medium mt-2 text-sm">Fill in the details below — your property will be live across all tiers.</p>

                    {/* Tier city badge strip
                    <div className="mt-5 flex flex-wrap gap-2">
                        {[
                            { tier: 'Tier 1', cities: 'Ahmedabad · Surat · Vadodara' },
                            { tier: 'Tier 2', cities: 'Rajkot · Bhavnagar · Jamnagar' },
                            { tier: 'Tier 3', cities: 'Kanodar · Diodar · Palanpur · Unjha' },
                        ].map(({ tier, cities }) => (
                            <div key={tier} className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-lg px-3 py-1.5">
                                <span className="text-[#c9a84c] font-black text-[10px] uppercase tracking-widest">{tier}</span>
                                <span className="w-px h-3 bg-white/20"></span>
                                <span className="text-white/60 text-[10px] font-medium">{cities}</span>
                            </div>
                        ))}
                    </div> */}

                    {/* Steps */}
                    <div className="mt-6 flex flex-wrap gap-2">
                        <StepPill number="1" label="Property Details" done active />
                        <StepPill number="2" label="Location" active />
                        <StepPill number="3" label="Media & Booking" active={false} />
                    </div>
                </div>
            </div>

            {/* Form body */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl font-bold flex items-center gap-3">
                        <X size={18} className="shrink-0" /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ── SECTION 1: Property Info ── */}
                    <SectionCard icon={<Building2 />} title="Property Details" subtitle="Core information about the listing">
                        <div className="space-y-6">
                            <div>
                                <label className={labelCls}>Property Title</label>
                                <input
                                    type="text" name="title" required
                                    value={formData.title} onChange={handleChange}
                                    className={inputCls}
                                    placeholder="e.g. 500 Sq Yd Corner Plot in Sector 14"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelCls}>Price (INR)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#c9a84c] text-lg">₹</span>
                                        <input
                                            type="number" name="price" required min="1000"
                                            value={formData.price} onChange={handleChange}
                                            className={inputCls + ' pl-10'}
                                            placeholder="45,00,000"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Total Area</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="number" required min="1"
                                            value={areaValue} onChange={(e) => setAreaValue(e.target.value)}
                                            className={inputCls + ' w-2/3'}
                                            placeholder="e.g. 500"
                                        />
                                        <select
                                            value={areaUnit} onChange={(e) => setAreaUnit(e.target.value)}
                                            className={inputCls + ' w-1/3 cursor-pointer'}
                                        >
                                            <option value="Sq Ft">Sq Ft</option>
                                            <option value="Sq Yd">Sq Yd</option>
                                            <option value="Sq Meter">Sq Meter</option>
                                            <option value="Acres">Acres</option>
                                            <option value="Hectares">Hectares</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>Detailed Description</label>
                                <textarea
                                    name="description" required rows="5"
                                    value={formData.description} onChange={handleChange}
                                    className={inputCls + ' resize-none'}
                                    placeholder="Describe the property, nearby amenities, proximity to landmarks, potential usages..."
                                />
                            </div>
                        </div>
                    </SectionCard>

                    {/* ── SECTION 2: Location ── */}
                    <SectionCard icon={<MapPin />} title="Property Location" subtitle="Set location via search, map pin, or GPS">

                        {/* Mode switcher */}
                        <div className="flex bg-[#f8f5ee] p-1.5 rounded-xl border border-[#1a2340]/10 w-fit mb-6 gap-1">
                            {[
                                { id: 'address', label: 'Search Address', icon: <MapPin size={14} /> },
                                { id: 'map', label: 'Pin on Map', icon: <Target size={14} /> },
                                { id: 'gps', label: 'Use My GPS', icon: <Navigation size={14} /> }
                            ].map((method) => (
                                <button
                                    key={method.id}
                                    type="button"
                                    onClick={() => setLocationMethod(method.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                        locationMethod === method.id
                                        ? 'bg-[#1a2340] text-[#c9a84c] shadow'
                                        : 'text-[#1a2340]/50 hover:text-[#1a2340] hover:bg-white'
                                    }`}
                                >
                                    {method.icon} {method.label}
                                </button>
                            ))}
                        </div>

                        {/* City tier guide
                        <div className="mb-5 bg-[#1a2340]/4 border border-[#1a2340]/10 rounded-xl p-4">
                            <p className="text-[10px] font-black text-[#1a2340]/40 uppercase tracking-widest mb-2">Available City Tiers</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {[
                                    { tier: 'Tier 1 — Metro', cities: ['Ahmedabad', 'Surat', 'Vadodara'], color: 'bg-[#1a2340] text-white' },
                                    { tier: 'Tier 2 — Urban', cities: ['Rajkot', 'Bhavnagar', 'Jamnagar'], color: 'bg-[#c9a84c]/20 text-[#1a2340]' },
                                    { tier: 'Tier 3 — Rural', cities: ['Kanodar', 'Diodar', 'Palanpur', 'Unjha'], color: 'bg-[#f8f5ee] text-[#1a2340] border border-[#1a2340]/10' },
                                ].map(({ tier, cities, color }) => (
                                    <div key={tier} className={`rounded-lg px-3 py-2 ${color}`}>
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">{tier}</p>
                                        <div className="flex flex-wrap gap-1">
                                            {cities.map(c => (
                                                <span key={c} className="text-[10px] font-bold">{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div> */}

                        {/* Address search mode */}
                        {locationMethod === 'address' && (
                            <div className="relative">
                                <label className={labelCls + ' flex items-center gap-2'}>
                                    <MapPin size={12} className="text-[#c9a84c]" />
                                    Location / Address
                                    {formData.mapCoordinates.lat && (
                                        <span className="ml-auto text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                                            ✓ Geocoded
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="text" name="location" required
                                    value={formData.location}
                                    onChange={(e) => {
                                        setFormData({ ...formData, location: e.target.value, mapCoordinates: { lat: null, lng: null } });
                                    }}
                                    autoComplete="off"
                                    className={inputCls}
                                    placeholder="Type city or village e.g. Kanodar, Diodar, Palanpur..."
                                />
                                {showSuggestions && suggestions.length > 0 && (
                                    <ul className="absolute top-[105%] left-0 w-full bg-white border border-[#1a2340]/15 shadow-2xl rounded-2xl z-50 max-h-64 overflow-y-auto divide-y divide-[#f8f5ee] p-2">
                                        {suggestions.map((s, idx) => (
                                            <li
                                                key={idx}
                                                onClick={() => {
                                                    const b = s.boundingbox;
                                                    setFormData({
                                                        ...formData,
                                                        location: s.display_name,
                                                        mapCoordinates: { lat: parseFloat(s.lat), lng: parseFloat(s.lon) },
                                                        mapBounds: [[parseFloat(b[0]), parseFloat(b[2])], [parseFloat(b[1]), parseFloat(b[3])]]
                                                    });
                                                    setShowSuggestions(false);
                                                    setLocationMethod('map');
                                                }}
                                                className="p-3.5 hover:bg-[#f8f5ee] cursor-pointer rounded-xl transition-colors group"
                                            >
                                                <span className="block text-[#1a2340] font-bold group-hover:text-[#c9a84c] transition-colors text-sm">{s.display_name.split(',')[0]}</span>
                                                <span className="text-xs text-[#1a2340]/40 truncate block mt-0.5">{s.display_name}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {/* Map & GPS mode */}
                        {(locationMethod === 'map' || locationMethod === 'gps') && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <label className={labelCls + ' flex items-center gap-2'}>
                                            {locationMethod === 'gps'
                                                ? <Navigation size={12} className="text-[#c9a84c]" />
                                                : <Target size={12} className="text-[#c9a84c]" />}
                                            {locationMethod === 'gps' ? 'GPS Detection' : 'Precise Map Pin'}
                                        </label>
                                        <p className="text-xs text-[#1a2340]/40 font-medium">
                                            {locationMethod === 'gps'
                                                ? 'Detecting your exact site location via browser GPS...'
                                                : 'Click on the map to pin exact site location'}
                                        </p>
                                    </div>
                                    {locationMethod === 'gps' && (
                                        <button
                                            type="button"
                                            onClick={detectMyLocation}
                                            className="bg-[#1a2340] hover:bg-[#243060] text-[#c9a84c] px-5 py-2.5 rounded-xl text-xs font-black shadow transition-all flex items-center gap-2 uppercase tracking-wider"
                                        >
                                            <Navigation size={14} /> Detect Location Now
                                        </button>
                                    )}
                                </div>

                                <div className={`${isFullscreen ? 'fixed inset-0 z-1000 bg-white p-4' : 'w-full h-96 rounded-2xl overflow-hidden border-2 border-[#1a2340]/15 shadow-lg relative z-0'}`}>
                                    {isFullscreen && (
                                        <button
                                            onClick={() => setIsFullscreen(false)}
                                            className="absolute top-8 right-8 z-1001 bg-white/90 backdrop-blur-md shadow-xl p-3 rounded-2xl text-[#1a2340] border border-[#1a2340]/10 hover:bg-white transition-all"
                                        >
                                            <X size={22} />
                                        </button>
                                    )}
                                    <MapContainer
                                        center={[formData.mapCoordinates.lat || 24.10, formData.mapCoordinates.lng || 72.38]}
                                        zoom={formData.mapCoordinates.lat ? 15 : 7}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer url="http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}" maxZoom={20} />
                                        <LocationMarker
                                            position={formData.mapCoordinates}
                                            setPosition={(pos) => setFormData({ ...formData, mapCoordinates: pos, mapBounds: null })}
                                            setLocation={(address) => setFormData(prev => ({ ...prev, location: address }))}
                                        />
                                        <MapRecenter position={formData.mapCoordinates} bounds={formData.mapBounds} />
                                        {!isFullscreen && (
                                            <button
                                                type="button"
                                                onClick={() => setIsFullscreen(true)}
                                                className="absolute bottom-4 right-4 z-999 bg-white text-[#1a2340] px-3 py-2 rounded-xl shadow border border-[#1a2340]/10 hover:bg-[#f8f5ee] transition-all flex items-center gap-2 font-bold text-xs"
                                            >
                                                <Maximize size={14} /> Fullscreen
                                            </button>
                                        )}
                                    </MapContainer>
                                </div>

                                {formData.location && (
                                    <div className="bg-[#1a2340]/5 p-4 rounded-xl border border-[#1a2340]/10">
                                        <p className="text-[9px] font-black text-[#1a2340]/40 uppercase tracking-widest mb-1">Synced Address</p>
                                        <p className="text-sm text-[#1a2340] font-semibold line-clamp-1">{formData.location}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </SectionCard>

                    {/* ── SECTION 3: Media Upload ── */}
                    <SectionCard icon={<UploadCloud />} title="Property Photos" subtitle="Upload high-quality images to attract buyers" accent>
                        <div className="border-2 border-dashed border-[#c9a84c]/40 rounded-2xl p-10 text-center bg-[#c9a84c]/5 hover:bg-[#c9a84c]/10 transition-colors cursor-pointer relative overflow-hidden group">
                            <input
                                type="file" multiple accept="image/*"
                                onChange={(e) => setImages(e.target.files)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <UploadCloud className="mx-auto text-[#c9a84c] mb-3 group-hover:scale-110 transition-transform" size={44} />
                            <p className="text-[#1a2340] font-black text-base mb-1">
                                {images && images.length > 0
                                    ? `${images.length} photo${images.length > 1 ? 's' : ''} queued for upload`
                                    : 'Click or drag photos here'}
                            </p>
                            <p className="text-[#1a2340]/40 font-medium text-sm">High quality .jpg or .png · Multiple files supported</p>
                        </div>
                    </SectionCard>

                    {/* ── SECTION 4: Token Booking ── */}
                    <SectionCard icon={<CreditCard />} title="Token Booking System" subtitle="Enable online reservations for this property">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-[#1a2340]">Accept Token Bookings</p>
                                <p className="text-xs text-[#1a2340]/40 font-medium mt-0.5">Allow buyers to reserve this listing with a token amount</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, isBookingEnabled: !formData.isBookingEnabled })}
                                className={`relative inline-flex h-7 items-center rounded-full transition-colors focus:outline-none w-12 ${formData.isBookingEnabled ? 'bg-[#c9a84c]' : 'bg-[#1a2340]/20'}`}
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
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#c9a84c] text-lg">₹</span>
                                        <input
                                            type="number"
                                            value={formData.tokenAmount}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const max = (formData.price || 0) * 0.02;
                                                setFormData({ ...formData, tokenAmount: val <= max ? val : max });
                                            }}
                                            className={inputCls + ' pl-10'}
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
                                            value={formData.payoutAccountId}
                                            onChange={(e) => setFormData({ ...formData, payoutAccountId: e.target.value })}
                                            className={inputCls + ' cursor-pointer'}
                                        >
                                            {payoutAccounts.map(acc => (
                                                <option key={acc._id} value={acc._id}>
                                                    {acc.accountType} — {acc.bankName || acc.upiId} ({acc.holderName})
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-700 text-sm font-medium">
                                            No payout accounts found. Please add one in your{' '}
                                            <button
                                                type="button"
                                                onClick={() => navigate('/dashboard')}
                                                className="underline font-black"
                                            >
                                                Dashboard
                                            </button>{' '}
                                            first.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </SectionCard>

                    {/* ── Submit bar ── */}
                    <div className="bg-[#1a2340] rounded-2xl px-7 py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <p className="text-white font-black text-sm">Ready to publish?</p>
                            <p className="text-white/40 text-xs font-medium mt-0.5">Your listing will go live across all city tiers instantly.</p>
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
                                    ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-[#1a2340]/30 border-t-[#1a2340] rounded-full animate-spin"></span> Publishing...</span>
                                    : <><Tag size={16} /> Publish Property</>
                                }
                            </button>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default CreateListing;
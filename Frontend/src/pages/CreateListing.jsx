import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { 
  UploadCloud, MapPin, Tag, Navigation, Target, Maximize, X, Building2, 
  IndianRupee, Layers, FileText, CreditCard, ChevronRight, ZapOff, 
  LayoutDashboard, Eye, Edit3, PanelRightClose, PanelRightOpen, ExternalLink,
  PlusCircle, Sparkles
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
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
    useEffect(() => {
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
    <div className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all border ${
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
    <div className="relative bg-white rounded-3xl border border-[#1a2340]/10 shadow-sm overflow-hidden transition-all hover:shadow-md">
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

const CreateListing = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showSidebar, setShowSidebar] = useState(true);
    
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
            const res = await axios.get(`/api/listings?createdBy=${user._id || user.id}`);
            return res.data.data;
        }
    });

    const getImageUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${axios.defaults.baseURL}${path}`;
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    useEffect(() => {
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
            {/* ── Top Hero Bar ── */}
            <div className="bg-[#1a2340] text-white px-6 py-10 md:px-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9a84c]/5 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-[#c9a84c] text-[10px] font-black uppercase tracking-[0.3em] mb-3">
                            <Building2 size={12} />
                            <span>Kharsan Admin</span>
                            <ChevronRight size={10} />
                            <span>New Listing</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
                            Create Your <span className="text-[#c9a84c]">Property Legacy</span>
                        </h1>
                        <p className="text-white/50 font-semibold mt-2 text-sm max-w-md">Launch your next landmark property across the Kharsan network.</p>
                    </div>

                    <div className="hidden lg:flex items-center gap-4">
                        <button 
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-3 rounded-2xl transition-all border border-white/10 group"
                        >
                            {showSidebar ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                            <span className="font-black text-xs uppercase tracking-widest">{showSidebar ? 'Hide Portfolio' : 'View Portfolio'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main Layout ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="flex flex-col lg:flex-row gap-10 items-start">
                    
                    {/* LEFT COLUMN: The Form (65%) */}
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
                            {/* Steps Indicator */}
                            <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar mb-4">
                                <StepPill number="1" label="Details" done active />
                                <StepPill number="2" label="Location" active />
                                <StepPill number="3" label="Media" active={false} />
                            </div>

                            <SectionCard icon={<Building2 />} title="Property Details" subtitle="The core narrative of your listing">
                                <div className="space-y-8">
                                    <div>
                                        <label className={labelCls}>Property Title</label>
                                        <input
                                            type="text" name="title" required
                                            value={formData.title} onChange={handleChange}
                                            className={inputCls}
                                            placeholder="e.g. 500 Sq Yd Corner Plot in Sector 14"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className={labelCls}>Listing Price</label>
                                            <div className="relative">
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-[#c9a84c] text-xl">₹</span>
                                                <input
                                                    type="number" name="price" required min="1000"
                                                    value={formData.price} onChange={handleChange}
                                                    className={inputCls + ' pl-12'}
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
                                                    placeholder="500"
                                                />
                                                <select
                                                    value={areaUnit} onChange={(e) => setAreaUnit(e.target.value)}
                                                    className={inputCls + ' w-1/3 cursor-pointer'}
                                                >
                                                    <option value="Sq Ft">Sq Ft</option>
                                                    <option value="Sq Yd">Sq Yd</option>
                                                    <option value="Acres">Acres</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelCls}>Story & Description</label>
                                        <textarea
                                            name="description" required rows="6"
                                            value={formData.description} onChange={handleChange}
                                            className={inputCls + ' resize-none'}
                                            placeholder="What makes this property special? Mention proximity to landmarks, soil quality, or future potential..."
                                        />
                                    </div>
                                </div>
                            </SectionCard>

                            <SectionCard icon={<MapPin />} title="Geographic Position" subtitle="Define exactly where your legacy stands">
                                <div className="space-y-6">
                                    <div className="flex flex-wrap bg-[#f8f5ee] p-2 rounded-2xl border border-[#1a2340]/10 gap-2">
                                        {[
                                            { id: 'address', label: 'Search Address', icon: <MapPin size={14} /> },
                                            { id: 'map', label: 'Precise Pin', icon: <Target size={14} /> },
                                            { id: 'gps', label: 'Current GPS', icon: <Navigation size={14} /> }
                                        ].map((method) => (
                                            <button
                                                key={method.id}
                                                type="button"
                                                onClick={() => setLocationMethod(method.id)}
                                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    locationMethod === method.id
                                                    ? 'bg-[#1a2340] text-[#c9a84c] shadow-lg'
                                                    : 'text-[#1a2340]/50 hover:text-[#1a2340] hover:bg-white'
                                                }`}
                                            >
                                                {method.icon} {method.label}
                                            </button>
                                        ))}
                                    </div>

                                    {locationMethod === 'address' && (
                                        <div className="relative">
                                            <label className={labelCls}>Search Location</label>
                                            <input
                                                type="text" name="location" required
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value, mapCoordinates: { lat: null, lng: null } })}
                                                autoComplete="off"
                                                className={inputCls}
                                                placeholder="Type city or village..."
                                            />
                                            {showSuggestions && suggestions.length > 0 && (
                                                <ul className="absolute top-[105%] left-0 w-full bg-white border border-[#1a2340]/15 shadow-2xl rounded-2xl z-50 p-2 overflow-hidden">
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
                                                            className="p-4 hover:bg-[#f8f5ee] cursor-pointer rounded-xl transition-all group"
                                                        >
                                                            <span className="block text-[#1a2340] font-black text-sm group-hover:text-[#c9a84c]">{s.display_name.split(',')[0]}</span>
                                                            <span className="text-[10px] text-[#1a2340]/40 font-bold truncate mt-1">{s.display_name}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}

                                    {(locationMethod === 'map' || locationMethod === 'gps') && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs text-[#1a2340]/40 font-bold uppercase tracking-widest">
                                                    {locationMethod === 'gps' ? 'Detecting Site GPS...' : 'Drop Pin on Precise Location'}
                                                </p>
                                                {locationMethod === 'gps' && (
                                                    <button type="button" onClick={detectMyLocation} className="bg-[#1a2340] text-[#c9a84c] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md">
                                                        Refresh GPS
                                                    </button>
                                                )}
                                            </div>
                                            <div className="w-full h-96 rounded-3xl overflow-hidden border-2 border-[#1a2340]/10 shadow-inner relative z-0">
                                                <MapContainer center={[formData.mapCoordinates.lat || 24.10, formData.mapCoordinates.lng || 72.38]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                                    <TileLayer url="http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}" maxZoom={20} />
                                                    <LocationMarker position={formData.mapCoordinates} setPosition={(pos) => setFormData({ ...formData, mapCoordinates: pos, mapBounds: null })} setLocation={(addr) => setFormData(p => ({ ...p, location: addr }))} />
                                                    <MapRecenter position={formData.mapCoordinates} bounds={formData.mapBounds} />
                                                </MapContainer>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </SectionCard>

                            <SectionCard icon={<UploadCloud />} title="Visual Portfolio" subtitle="Showcase the beauty of your land" accent>
                                <div className="border-2 border-dashed border-[#c9a84c]/40 rounded-3xl p-12 text-center bg-[#c9a84c]/5 hover:bg-[#c9a84c]/10 transition-all cursor-pointer relative group">
                                    <input type="file" multiple accept="image/*" onChange={(e) => setImages(e.target.files)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    <UploadCloud className="mx-auto text-[#c9a84c] mb-4 group-hover:scale-110 transition-transform" size={48} />
                                    <p className="text-[#1a2340] font-black text-lg mb-1">
                                        {images?.length > 0 ? `${images.length} Images Selected` : 'Drop Property Photos Here'}
                                    </p>
                                    <p className="text-[#1a2340]/40 font-bold text-xs uppercase tracking-widest">High resolution .jpg or .png</p>
                                </div>
                            </SectionCard>

                            {systemSettings?.isInstantBookingEnabled !== false && (
                                <SectionCard icon={<CreditCard />} title="Instant Booking" subtitle="Secure your leads with digital tokens">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <p className="font-black text-[#1a2340]">Enable Reservation System</p>
                                            <p className="text-xs text-[#1a2340]/40 font-semibold mt-1">Allow buyers to reserve with a small token amount</p>
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
                                                <label className={labelCls}>Token Amount (Capped at 2%)</label>
                                                <div className="relative">
                                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-[#c9a84c] text-xl">₹</span>
                                                    <input
                                                        type="number" value={formData.tokenAmount}
                                                        onChange={(e) => {
                                                            const max = (formData.price || 0) * 0.02;
                                                            setFormData({ ...formData, tokenAmount: Math.min(e.target.value, max) });
                                                        }}
                                                        className={inputCls + ' pl-12'}
                                                        placeholder="Enter amount..."
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Payout Account</label>
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

                            <div className="bg-[#1a2340] rounded-[2.5rem] p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
                                <div>
                                    <p className="text-white font-black text-lg">Ready to launch?</p>
                                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Instant publication across Kharsan nodes</p>
                                </div>
                                <div className="flex gap-4 w-full md:w-auto">
                                    <button type="button" onClick={() => navigate(-1)} className="flex-1 md:flex-none px-8 py-4 font-black text-white/60 hover:text-white transition-all bg-white/5 rounded-2xl text-xs uppercase tracking-[0.2em]">Cancel</button>
                                    <button type="submit" disabled={loading} className="flex-1 md:flex-none bg-[#c9a84c] hover:bg-[#d9b85c] text-[#1a2340] px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#c9a84c]/20 flex items-center justify-center gap-3 active:scale-95">
                                        {loading ? <span className="w-4 h-4 border-2 border-[#1a2340]/30 border-t-[#1a2340] rounded-full animate-spin"></span> : <><Tag size={16} /> Publish Now</>}
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
                                            <h4 className="text-[10px] font-black text-[#c9a84c] uppercase tracking-[0.3em] mb-1">Your Growth</h4>
                                            <h3 className="text-xl font-black text-[#1a2340]">Recent Portfolio</h3>
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
                                                    Your portfolio is empty. Launch your first legacy property.
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
                                            View Full Portfolio
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
                                            {myListingsData?.length || 0} active listings across <br/> 3 regional tiers.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-3xl p-8 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                                        <Sparkles size={48} className="text-[#c9a84c]" />
                                    </div>
                                    <h4 className="text-[10px] font-black text-[#c9a84c] uppercase tracking-[0.3em] mb-4">Pro Tip</h4>
                                    <p className="text-[#1a2340] font-bold text-xs leading-relaxed">
                                        Verified listings receive 3.4x more engagement from high-intent buyers in metro tiers.
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
import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { MapPin, Phone, Mail, Calendar, CheckCircle2, ArrowLeft, Users, Eye, Image, Building2, Award, Heart, Share2, Copy, Layers, LandPlot, UserCheck, ExternalLink, MessageCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import ListingSkeleton from '../components/ListingSkeleton';
import ErrorBox from '../components/ErrorBox';
import EmptyState from '../components/EmptyState';
import { useQuery } from '@tanstack/react-query';
import { getImageUrl } from '../utils/imageUrl';
import { useLanguage } from '../context/LanguageContext';
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

// Define axios inside the component context or import
const axiosObj = axios;

/* ─── Listing Card ────────────────────────────────────────────────────────── */
const ListingCard = ({ listing, sellerPhone, wishlist, toggleWishlist, seller }) => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const hasImages = listing.images?.length > 0;
    const hasCoords = listing.mapCoordinates && !isNaN(parseFloat(listing.mapCoordinates.lat)) && !isNaN(parseFloat(listing.mapCoordinates.lng));
    const creator = (listing.createdBy && typeof listing.createdBy === 'object') ? listing.createdBy : seller;
    const phone = creator?.phone || sellerPhone || '';

    return (
        <div
            onClick={() => navigate(`/listings/${listing._id}`)}
            className="bg-white border border-[#e2d9c5] hover:border-[#c9a84c] rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg group flex flex-row h-[145px] sm:h-auto sm:min-h-[180px]"
        >
            {/* Image / Map Fallback */}
            <div className="relative flex-shrink-0 overflow-hidden bg-[#e5e7eb] w-[125px] sm:w-[260px] h-full sm:h-auto">
                {hasImages ? (
                    <img
                        src={getImageUrl(listing.images[0])}
                        alt={listing.title}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : hasCoords ? (
                    <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        <MapContainer 
                            center={[parseFloat(listing.mapCoordinates.lat), parseFloat(listing.mapCoordinates.lng)]} 
                            zoom={14} 
                            zoomControl={false}
                            dragging={false}
                            doubleClickZoom={false}
                            scrollWheelZoom={false}
                            attributionControl={false}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer url="http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}" maxZoom={20} />
                            <Marker position={[parseFloat(listing.mapCoordinates.lat), parseFloat(listing.mapCoordinates.lng)]} />
                        </MapContainer>
                    </div>
                ) : (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center text-[#9ca3af] text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                        {t('search_page.no_image')}
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    {(listing.status === 'Reserved' || listing.isTokened) && (
                        <span className="bg-[#dc2626] text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded uppercase tracking-wider">
                            {t('search_page.reserved')}
                        </span>
                    )}
                </div>

                {/* Wishlist, Share & Mobile Contacts */}
                <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
                    <button
                        onClick={e => toggleWishlist(e, listing._id)}
                        className="w-7 h-7 sm:w-8 sm:h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all"
                    >
                        <Heart size={12} className={wishlist.has(listing._id) ? 'fill-red-500 text-red-500' : 'text-[#6b7280]'} />
                    </button>
                    <button
                        className="w-7 h-7 sm:w-8 sm:h-8 bg-white/90 rounded-full flex items-center justify-center text-[#6b7280] shadow-md hover:scale-110 active:scale-95 transition-all"
                        onClick={e => {
                            e.stopPropagation();
                            const listingUrl = `${window.location.origin}/listings/${listing._id}`;
                            const shareData = {
                                title: listing.title,
                                text: `${listing.title} - ${listing.propertyType || 'Plot/Land'} in ${listing.location}`,
                                url: listingUrl
                            };
                            if (navigator.share) {
                                navigator.share(shareData).catch(err => console.log(err));
                            } else {
                                navigator.clipboard.writeText(listingUrl);
                                toast.success(t('search_page.link_copied') || 'Listing link copied to clipboard');
                            }
                        }}
                        title="Share Property"
                    >
                        <Share2 size={12} />
                    </button>
                    {phone && (
                        <>
                            <button
                                className="sm:hidden w-7 h-7 bg-[#25d366] rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
                                onClick={e => {
                                    e.stopPropagation();
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
                                    window.open(`tel:${phone}`);
                                }}
                                title={t('search_page.contact')}
                            >
                                <Phone size={11} />
                            </button>
                        </>
                    )}
                </div>

                {/* Bottom overlay */}
                <div className="hidden sm:block absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 z-10">
                    <p className="text-white text-[10px] font-600">
                        {t('search_page.listed_on')} <strong>{new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between p-3 sm:p-5 min-w-0 relative">
                {/* NEW LISTING ribbon (only for first 24 hours) */}
                {listing.status !== 'Reserved' && !listing.isTokened && (new Date() - new Date(listing.createdAt)) < 24 * 60 * 60 * 1000 && (
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
                        onClick={e => { e.stopPropagation(); }}
                        className="flex items-center gap-2 min-w-0"
                    >
                        <div className="w-8 h-8 rounded-full bg-[#1a2340] flex items-center justify-center text-[#c9a84c] font-black text-xs flex-shrink-0">
                            {creator?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs font-bold text-[#6b7280] uppercase tracking-wider leading-none">
                                {creator?.role === 'Broker' ? 'Builder' : creator?.role || 'Seller'}
                            </div>
                            <div className="text-sm font-black text-[#1a2340] truncate">
                                {creator?.name || 'Authorized Seller'}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                        {phone && (
                            <button
                                onClick={e => {
                                    e.stopPropagation();
                                    window.open(`https://wa.me/${phone}`, '_blank');
                                }}
                                className="flex items-center gap-1 px-3 py-2 bg-[#25d366] hover:bg-[#20ba5a] text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                            >
                                <MessageCircle size={12} className="fill-current" /> <span>WhatsApp</span>
                            </button>
                        )}
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                window.open(`tel:${phone}`);
                            }}
                            className="flex items-center gap-1 px-3 py-2 bg-white border border-[#e2d9c5] hover:border-[#1a2340] text-[#1a2340] rounded-lg text-xs font-bold transition-all"
                        >
                            <Phone size={12} strokeWidth={2.5} /> <span>{t('search_page.contact')}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
const SellerProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { isAuthenticated, user: currentUser } = useContext(AuthContext);
    const [wishlist, setWishlist] = useState(new Set());

    useEffect(() => {
        if (isAuthenticated && currentUser?.favorites) {
            const ids = currentUser.favorites.map(fav => 
                typeof fav === 'string' ? fav : (fav?._id || fav?.id)
            ).filter(Boolean);
            setWishlist(new Set(ids));
        }
    }, [isAuthenticated, currentUser?.favorites]);

    const toggleWishlist = async (e, id) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            toast.info(t('search_page.login_to_save'));
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
            const res = await axiosObj.post(`/api/auth/favorites/${id}`);
            if (currentUser && res.data?.data) {
                currentUser.favorites = res.data.data;
                const ids = res.data.data.map(fav =>
                    typeof fav === 'string' ? fav : (fav?._id || fav?.id)
                ).filter(Boolean);
                setWishlist(new Set(ids));
            }
            toast.success(wasAdded ? t('search_page.added_to_favorites') : t('search_page.removed_from_favorites'));
        } catch (err) {
            setWishlist(prev => {
                const s = new Set(prev);
                wasAdded ? s.delete(id) : s.add(id);
                return s;
            });
            toast.error(t('search_page.failed_favorites'));
        }
    };

    const {
        data: profile,
        isLoading,
        isError,
        error,
        refetch
    } = useQuery({
        queryKey: ['sellerProfile', id],
        queryFn: async () => {
            // Clean ID in case text was appended to the URL (e.g. from shared links)
            const cleanId = id.split(/[\s%]/)[0];
            const res = await axiosObj.get(`/api/listings/seller/${cleanId}`);
            return res.data.data;
        }
    });

    /* ── Loading State ── */
    if (isLoading) return (
        <div className="min-h-screen bg-[#FAF9F6]">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c] shadow-xs" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="bg-white border border-slate-100 rounded-3xl p-8 mb-8 animate-pulse shadow-xs">
                    <div className="flex items-center gap-5 mb-6">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex-shrink-0" />
                        <div className="space-y-3 flex-1">
                            <div className="h-6 bg-slate-100 rounded w-1/2" />
                            <div className="h-4 bg-slate-100 rounded w-1/3" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
                    </div>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="bg-white border border-slate-100 h-48 rounded-3xl animate-pulse" />)}
                </div>
            </div>
        </div>
    );

    if (isError) return <ErrorBox message={error?.response?.data?.message || error?.message} retry={() => refetch()} />;

    if (!profile) return (
        <div className="py-20 bg-[#FAF9F6] min-h-screen flex items-center justify-center">
            <EmptyState
                actionText="Back to Listings"
                actionLink="/search"
                title="Profile Unrecognized"
                message="This partner account or broker profile could not be retrieved. It may have been relocated or deactivated."
            />
        </div>
    );

    const { user, activeListings, reservedListings } = profile;

    const handleShare = async () => {
        const profileUrl = `${window.location.origin}/seller/${user._id || user.id}`;
        const shareData = {
            title: `${user.name} - Chaudhary Saumya Properties Partner`,
            url: profileUrl
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(profileUrl);
                toast.success('Partner Profile URL copied to clipboard');
            }
        } catch (err) {
            console.error('Error sharing profile:', err);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAF9F6] text-slate-800" style={{ fontFamily: "'Nunito Sans', sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Nunito+Sans:wght@300;400;500;600;700;800;900&display=swap');`}</style>

            {/* Elegant Luxury Top Accent Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c] shadow-xs" />

            {/* Back Nav */}
            <div className="bg-white border-b border-slate-100 sticky z-20 shadow-xs" style={{ top: 'var(--navbar-height)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-[#c9a84c] transition-all py-1 px-2.5 rounded-lg hover:bg-slate-50"
                    >
                        <ArrowLeft size={16} /> {t('seller_profile.all_listings')}
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">

                {/* ── Profile Header Card ── */}
                <div className="bg-white border border-[#e2d9c5] rounded-3xl shadow-md mb-8 overflow-hidden transition-all hover:shadow-lg p-6 sm:p-8">
                    <div>
                        {/* Avatar & Info Container */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6 text-center md:text-left">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                {/* Avatar (simple, flat, clean styling) */}
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#1a2340] flex items-center justify-center text-[#c9a84c] font-black text-3xl sm:text-4xl shrink-0 shadow-md">
                                    {user.name?.charAt(0)}
                                </div>

                                {/* Name + badges (safely sits fully in the white area) */}
                                <div className="space-y-2 pt-2 md:pt-0">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3">
                                        <h1 className="text-xl sm:text-3xl font-extrabold text-[#1a2340] leading-tight">
                                            {user.name}
                                        </h1>
                                        <span className="bg-[#1a2340] text-[#c9a84c] text-[9px] sm:text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest shadow-sm">
                                            {user.role || 'Partner'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 sm:gap-3">
                                        <button
                                            onClick={handleShare}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f8f5ee]/80 hover:bg-[#f8f5ee] text-slate-700 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all border border-[#e2d9c5]"
                                        >
                                            <Share2 size={11} className="text-[#c9a84c]" /> Share Profile
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Inventory Metrics display */}
                            <div className="flex gap-3 sm:gap-4 mt-4 md:mt-0">
                                <div className="text-center bg-[#f8f5ee]/60 border border-[#e2d9c5]/50 rounded-2xl px-5 py-3 shadow-sm min-w-[90px]">
                                    <div className="text-2xl sm:text-3xl font-black text-[#1a2340]">
                                        {activeListings.length}
                                    </div>
                                    <div className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{t('brokers.active_plots')}</div>
                                </div>
                                <div className="text-center bg-[#f8f5ee]/60 border border-[#e2d9c5]/50 rounded-2xl px-5 py-3 shadow-sm min-w-[90px]">
                                    <div className="text-2xl sm:text-3xl font-black text-rose-600">
                                        {reservedListings.length}
                                    </div>
                                    <div className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{t('search_page.reserved')}</div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info row (Clickable tel / mail actions) */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 border-t border-[#e2d9c5]/30 pt-6">
                            {[
                                { icon: Mail, label: 'Email', value: user.email, sub: 'Direct Inbox', link: `mailto:${user.email}`, color: 'text-blue-600 hover:underline' },
                                { icon: Phone, label: 'Phone Call', value: user.phone || 'Contact Private', sub: 'Mobile Terminal', link: user.phone ? `tel:${user.phone}` : null, color: 'text-emerald-750 hover:underline' },
                                { icon: Calendar, label: 'Partnership Since', value: new Date(user.createdAt).getFullYear(), sub: 'Verified Partner Log', link: null, color: 'text-[#c9a84c]' },
                                { icon: Award, label: 'Trust Status', value: 'Highly Rated', sub: 'Verified Partner Profile', link: null, color: 'text-emerald-800' },
                            ].map(({ icon: Icon, label, value, sub, link, color }) => {
                                const CardContent = () => (
                                    <>
                                        <div className="w-10 h-10 bg-[#1a2340] rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                                            <Icon size={14} className="text-[#c9a84c]" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                                            <span className={`block text-[11px] sm:text-xs font-black ${color} truncate mt-0.5`}>{value}</span>
                                            <span className="block text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{sub}</span>
                                        </div>
                                    </>
                                );

                                return link ? (
                                    <a key={label} href={link} className="flex items-center gap-3 bg-[#f8f5ee]/40 hover:bg-[#f8f5ee]/80 border border-[#e2d9c5]/35 rounded-2xl p-4 transition-all duration-300 shadow-sm hover:shadow-md">
                                        <CardContent />
                                    </a>
                                ) : (
                                    <div key={label} className="flex items-center gap-3 bg-[#f8f5ee]/40 border border-[#e2d9c5]/35 rounded-2xl p-4 shadow-sm">
                                        <CardContent />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Active Listings ── */}
                <section className="mb-12">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block shadow-sm" />
                                <h2 className="text-xl font-bold text-slate-950">
                                    Available Land Inventory
                                </h2>
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current active plots cataloged by this partner.</p>
                        </div>
                        <div className="text-right bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 shrink-0 self-start sm:self-center shadow-2xs">
                            <span className="text-2xl font-black text-slate-950 block leading-tight">
                                {activeListings.length}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">Plots Available</span>
                        </div>
                    </div>

                    <div className="space-y-5">
                        {activeListings.length > 0 ? (
                            activeListings.map(listing => <ListingCard key={listing._id} listing={listing} sellerPhone={user.phone} wishlist={wishlist} toggleWishlist={toggleWishlist} seller={user} />)
                        ) : (
                            <div className="py-14 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold uppercase tracking-widest text-xs bg-white shadow-2xs">
                                No active listings currently matching available inventories.
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Reserved Listings ── */}
                <section>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block shadow-sm" />
                                <h2 className="text-xl font-bold text-slate-950">
                                    Successful Sales & Reservations
                                </h2>
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plots booked or reserved via token reservation gateways.</p>
                        </div>
                        <div className="text-right bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 shrink-0 self-start sm:self-center shadow-2xs">
                            <span className="text-2xl font-black text-rose-600 block leading-tight">
                                {reservedListings.length}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">Plots Tokened</span>
                        </div>
                    </div>

                    <div className="space-y-5">
                        {reservedListings.length > 0 ? (
                            reservedListings.map(listing => <ListingCard key={listing._id} listing={listing} sellerPhone={user.phone} wishlist={wishlist} toggleWishlist={toggleWishlist} seller={user} />)
                        ) : (
                            <div className="py-14 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold uppercase tracking-widest text-xs bg-white shadow-2xs">
                                No reserved properties currently archived.
                            </div>
                        )}
                    </div>
                </section>

            </div>
        </div>
    );
};

export default SellerProfile;
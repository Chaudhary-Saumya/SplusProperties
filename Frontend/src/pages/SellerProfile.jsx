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
import { getWebsiteBaseUrl } from '../utils/url';

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

const axiosObj = axios;

/* ─── Listing Card (Housing.com / 99acres Clean Style) ──────────────────── */
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
            className="bg-white border border-slate-200/90 hover:border-blue-400/80 rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-xl group flex flex-row h-[145px] sm:h-auto sm:min-h-[180px]"
        >
            {/* Image / Map Fallback */}
            <div className="relative flex-shrink-0 overflow-hidden bg-slate-100 w-[125px] sm:w-[260px] h-full sm:h-auto">
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
                            <TileLayer url="https://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}" maxZoom={20} />
                            <Marker position={[parseFloat(listing.mapCoordinates.lat), parseFloat(listing.mapCoordinates.lng)]} />
                        </MapContainer>
                    </div>
                ) : (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                        {t('search_page.no_image')}
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    {(listing.status === 'Reserved' || listing.isTokened) && (
                        <span className="bg-rose-600 text-white text-[8px] sm:text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider shadow-xs">
                            {t('search_page.reserved')}
                        </span>
                    )}
                </div>

                {/* Wishlist & Share Buttons */}
                <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
                    <button
                        onClick={e => toggleWishlist(e, listing._id)}
                        className="w-7 h-7 sm:w-8 sm:h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all"
                    >
                        <Heart size={13} className={wishlist.has(listing._id) ? 'fill-rose-500 text-rose-500' : 'text-slate-600'} />
                    </button>
                    <button
                        className="w-7 h-7 sm:w-8 sm:h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-600 shadow-md hover:scale-110 active:scale-95 transition-all"
                        onClick={e => {
                            e.stopPropagation();
                            const listingUrl = `${getWebsiteBaseUrl()}/listings/${listing._id}`;
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
                        <Share2 size={13} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between p-3 sm:p-5 min-w-0 relative">
                <div>
                    <h3 className="text-sm sm:text-lg font-extrabold text-slate-900 group-hover:text-[#0078d4] transition-colors leading-tight mb-0.5 sm:mb-1 pr-14 sm:pr-20 line-clamp-1">
                        {listing.title}
                    </h3>

                    <p className="text-[11px] sm:text-sm text-slate-500 font-semibold mb-1 sm:mb-2 line-clamp-1">
                        <strong className="text-slate-900">{listing.propertyType ? (listing.propertyType === 'Plot' ? t('search_page.plots') : t('search_page.lands')) : t('search_page.plot_or_land')}</strong> in {listing.plotNumber ? `${listing.plotNumber}, ` : ''}{listing.areaName ? `${listing.areaName}, ` : ''}{listing.location}
                    </p>

                    {/* Price + Area */}
                    <div className="flex items-baseline gap-2 sm:gap-4 mb-1 sm:mb-3">
                        <div className="text-sm sm:text-xl font-black text-slate-900">
                            ₹{listing.price?.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] sm:text-xs font-bold text-[#0078d4] bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md">
                            {listing.area || '—'}
                        </div>
                    </div>

                    <p className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 font-medium mb-1 sm:mb-3 line-clamp-1">
                        <MapPin size={11} className="text-[#0078d4] shrink-0" /> {listing.plotNumber ? `${listing.plotNumber}, ` : ''}{listing.areaName ? `${listing.areaName}, ` : ''}{listing.location}
                    </p>
                </div>

                {/* Footer Strip */}
                <div className="hidden sm:flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[#0078d4] flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                            {creator?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs font-extrabold text-slate-900 truncate">
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
                                className="flex items-center gap-1 px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg text-xs font-bold transition-all shadow-2xs"
                            >
                                <MessageCircle size={13} className="fill-white" /> <span>WhatsApp</span>
                            </button>
                        )}
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                window.open(`tel:${phone}`);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all border border-slate-200"
                        >
                            <Phone size={13} /> <span>{t('search_page.contact')}</span>
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
            if (res.data?.data) {
                const ids = res.data.data.map(fav =>
                    typeof fav === 'string' ? fav : (fav?._id || fav?.id)
                ).filter(Boolean);
                setWishlist(new Set(ids));
            }
            toast.success(wasAdded ? t('search_page.added_to_favorites') : t('search_page.removed_from_favorites'));
        } catch {
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
            const cleanId = id.split(/[\s%]/)[0];
            const res = await axiosObj.get(`/api/listings/seller/${cleanId}`);
            return res.data.data;
        }
    });

    if (isLoading) return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="bg-white border border-slate-200 rounded-3xl p-8 mb-8 animate-pulse shadow-xs">
                    <div className="flex items-center gap-5 mb-6">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex-shrink-0" />
                        <div className="space-y-3 flex-1">
                            <div className="h-6 bg-slate-100 rounded w-1/2" />
                            <div className="h-4 bg-slate-100 rounded w-1/3" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (isError) return <ErrorBox message={error?.response?.data?.message || error?.message} retry={() => refetch()} />;

    if (!profile) return (
        <div className="py-20 bg-slate-50 min-h-screen flex items-center justify-center">
            <EmptyState
                actionText="Back to Listings"
                actionLink="/search"
                title="Profile Unrecognized"
                message="This partner account or broker profile could not be retrieved."
            />
        </div>
    );

    const { user, activeListings } = profile;

    const handleShare = async () => {
        const profileUrl = `${getWebsiteBaseUrl()}/seller/${user._id || user.id}`;
        const shareData = {
            title: `${user.name} - Property Partner`,
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
        <div className="min-h-screen bg-slate-50/80 font-['Nunito_Sans',sans-serif] text-slate-800 pb-16">

            {/* Back Nav */}
            <div className="bg-white border-b border-slate-200 sticky z-20 shadow-2xs" style={{ top: 'var(--navbar-height)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#0078d4] transition-all py-1 px-2.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                    >
                        <ArrowLeft size={16} /> {t('seller_profile.all_listings')}
                    </button>

                    <button
                        onClick={handleShare}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#0078d4] transition-all py-1 px-3 rounded-lg border border-slate-200 hover:border-[#0078d4] bg-white cursor-pointer"
                    >
                        <Share2 size={14} /> <span>Share Profile</span>
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

                {/* Header Card */}
                <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm mb-8 overflow-hidden p-6 sm:p-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#0078d4] text-white flex items-center justify-center font-black text-3xl uppercase overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                                {user.profileImage ? (
                                    <img src={getImageUrl(user.profileImage)} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    user.name?.charAt(0) || 'B'
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap mb-1">
                                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                        {user.name}
                                    </h1>
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                        <CheckCircle2 size={13} className="text-emerald-600" /> Verified Partner
                                    </span>
                                </div>

                                <p className="text-xs sm:text-sm font-semibold text-slate-500 flex items-center justify-center md:justify-start gap-4 flex-wrap">
                                    <span className="flex items-center gap-1.5 text-slate-700 font-bold">
                                        <Building2 size={15} className="text-[#0078d4]" />
                                        {user.role === 'Broker' ? 'Authorized Broker' : user.role || 'Real Estate Agent'}
                                    </span>
                                    {user.city && (
                                        <span className="flex items-center gap-1 text-slate-500 font-medium">
                                            <MapPin size={14} className="text-slate-400" />
                                            {user.city}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Contact CTA */}
                        {user.phone && (
                            <div className="flex items-center gap-2 flex-wrap justify-center">
                                <button
                                    onClick={() => window.open(`tel:${user.phone}`)}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all border border-slate-200 cursor-pointer flex items-center gap-2"
                                >
                                    <Phone size={14} className="text-slate-700" />
                                    <span>Call Partner</span>
                                </button>
                                <button
                                    onClick={() => window.open(`https://wa.me/${user.phone.replace(/[^0-9]/g, '')}`, '_blank')}
                                    className="px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-2"
                                >
                                    <MessageCircle size={14} className="fill-white" />
                                    <span>WhatsApp</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Listings Section */}
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <LandPlot size={18} className="text-[#0078d4]" />
                        <span>Active Land Listings ({activeListings?.length || 0})</span>
                    </h2>
                </div>

                {activeListings?.length > 0 ? (
                    <div className="space-y-4">
                        {activeListings.map(listing => (
                            <ListingCard
                                key={listing._id}
                                listing={listing}
                                sellerPhone={user.phone}
                                wishlist={wishlist}
                                toggleWishlist={toggleWishlist}
                                seller={user}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="No Active Listings"
                        message="This partner currently has no active property listings published."
                    />
                )}
            </div>
        </div>
    );
};

export default SellerProfile;